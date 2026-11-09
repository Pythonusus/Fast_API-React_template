"""
S3-compatible object storage helpers.

Uses boto3 (S3 API), so the same code works with MinIO, Yandex Object
Storage and AWS S3. Switching providers only needs new ``S3_*`` settings.
"""

import json
from collections.abc import Iterable
from functools import lru_cache
from typing import BinaryIO
from urllib.parse import quote, urlsplit, urlunsplit

import boto3
from botocore.client import BaseClient
from botocore.config import Config
from botocore.exceptions import ClientError

from app.settings import settings

# Error codes returned by S3 providers when a bucket does not exist.
_MISSING_BUCKET_CODES = {"404", "NoSuchBucket", "NotFound"}

# Browser lifetime of a presigned download URL, in seconds.
PRESIGN_EXPIRES_IN = 3600


def public_origin_and_prefix(public_url: str) -> tuple[str, str]:
    """Split a public S3 URL into origin and path prefix.

    ``https://your-domain.com/s3/`` becomes
    ``https://your-domain.com`` and ``/s3``.
    The prefix is empty when the URL has no path.

    boto3 signs ``/bucket/key`` on that origin. Nginx strips the prefix
    before MinIO sees the request, so the signed path still matches.
    Passing the prefix itself as ``endpoint_url`` puts ``/s3`` inside
    the signature, and the check fails after Nginx removes it.
    """
    parts = urlsplit(public_url.strip())
    origin = urlunsplit((parts.scheme, parts.netloc, "", "", ""))
    path = parts.path.strip("/")
    prefix = f"/{path}" if path else ""
    return origin, prefix


def apply_public_prefix(signed_url: str, public_url: str) -> str:
    """Insert the public path prefix into a presigned URL."""
    _, prefix = public_origin_and_prefix(public_url)
    if not prefix:
        return signed_url
    parts = urlsplit(signed_url)
    if parts.path == prefix or parts.path.startswith(f"{prefix}/"):
        return signed_url
    return urlunsplit(
        (
            parts.scheme,
            parts.netloc,
            f"{prefix}{parts.path}",
            parts.query,
            "",
        )
    )


def _make_client(endpoint_url: str) -> BaseClient:
    """Build an S3 client. Callers differ only by ``endpoint_url``."""
    return boto3.client(
        "s3",
        endpoint_url=endpoint_url.rstrip("/"),
        aws_access_key_id=settings.s3_access_key,
        aws_secret_access_key=settings.s3_secret_key,
        region_name=settings.s3_region,
        # Path-style: https://host/bucket/key. MinIO requires it.
        # Yandex and AWS accept it too.
        config=Config(
            signature_version="s3v4",
            s3={"addressing_style": "path"},
        ),
    )


@lru_cache
def get_internal_s3_client() -> BaseClient:
    """Client for backend calls on the private endpoint (uploads, bucket)."""
    return _make_client(settings.s3_endpoint_url)


@lru_cache
def get_external_s3_client() -> BaseClient:
    """Client that signs URLs for the browser-facing host.

    Uses the origin of ``S3_PUBLIC_URL`` only. :func:`presign_get_url`
    adds the path prefix afterwards.
    """
    origin, _ = public_origin_and_prefix(settings.s3_public_url)
    return _make_client(origin)


def public_read_policy(bucket: str) -> str:
    """Anonymous GetObject on object keys. Listing the bucket stays private."""
    return json.dumps(
        {
            "Version": "2012-10-17",
            "Statement": [
                {
                    "Effect": "Allow",
                    "Principal": {"AWS": ["*"]},
                    "Action": ["s3:GetObject"],
                    "Resource": [f"arn:aws:s3:::{bucket}/*"],
                }
            ],
        }
    )


def public_object_url(key: str) -> str:
    """Stable browser URL for an object: public prefix + bucket + key.

    Unlike a presigned URL, this does not expire. The bucket policy from
    :func:`public_read_policy` is what makes the GET succeed.
    """
    origin, prefix = public_origin_and_prefix(settings.s3_public_url)
    path = "/".join(
        part.strip("/")
        for part in (prefix, settings.s3_bucket, quote(key, safe="/"))
        if part.strip("/")
    )
    return f"{origin}/{path}"


def ensure_bucket() -> None:
    """Create ``settings.s3_bucket`` if it does not exist yet.

    Then allow anonymous GetObject so post HTML can keep a permanent
    image or media URL. Connection failures, bad credentials, and
    permission errors propagate, so startup fails instead of uploads
    failing later with a 500.

    Blocking boto3 calls: run via ``asyncio.to_thread`` from async code.
    """
    client = get_internal_s3_client()
    try:
        client.head_bucket(Bucket=settings.s3_bucket)
    except ClientError as exc:
        code = str(exc.response.get("Error", {}).get("Code", ""))
        if code not in _MISSING_BUCKET_CODES:
            raise
        _create_bucket(client)
    client.put_bucket_policy(
        Bucket=settings.s3_bucket,
        Policy=public_read_policy(settings.s3_bucket),
    )


def _create_bucket(client: BaseClient) -> None:
    # us-east-1 rejects a LocationConstraint. Every other region,
    # including Yandex ru-central1, requires one.
    if settings.s3_region == "us-east-1":
        client.create_bucket(Bucket=settings.s3_bucket)
        return
    client.create_bucket(
        Bucket=settings.s3_bucket,
        CreateBucketConfiguration={
            "LocationConstraint": settings.s3_region,
        },
    )


def upload_fileobj(key: str, fileobj: BinaryIO, content_type: str) -> None:
    """Stream ``fileobj`` to ``key`` without reading it into memory."""
    get_internal_s3_client().upload_fileobj(
        fileobj,
        settings.s3_bucket,
        key,
        ExtraArgs={"ContentType": content_type},
    )


def delete_objects(keys: Iterable[str]) -> None:
    """Delete objects one by one.

    The batch DeleteObjects call needs a request checksum, and recent
    botocore sends a CRC32 one that some S3-compatible providers reject.
    Posts have a handful of files, so single deletes are cheap.
    """
    client = get_internal_s3_client()
    for key in keys:
        client.delete_object(Bucket=settings.s3_bucket, Key=key)


def presign_get_url(key: str, expires_in: int = PRESIGN_EXPIRES_IN) -> str:
    """Return a browser-ready presigned GET URL for ``key``.

    Does not check that the object exists. A missing object returns 404
    when the browser opens the URL.
    """
    signed = get_external_s3_client().generate_presigned_url(
        "get_object",
        Params={"Bucket": settings.s3_bucket, "Key": key},
        ExpiresIn=expires_in,
    )
    return apply_public_prefix(signed, settings.s3_public_url)
