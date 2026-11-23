"""
S3-compatible object storage helpers.

Uses boto3 (S3 API), so the same code works with MinIO, Yandex Object
Storage and AWS S3. Switching providers only needs new ``S3_*`` settings.
"""

import json
from collections.abc import Iterable
from functools import lru_cache
from typing import BinaryIO
from urllib.parse import quote, unquote, urlsplit, urlunsplit

import boto3
from botocore.client import BaseClient
from botocore.config import Config
from botocore.exceptions import ClientError

from app.settings import settings


def public_origin_and_prefix(public_url: str) -> tuple[str, str]:
    """Split a public S3 URL into origin and path prefix.

    ``https://your-domain.com/s3/`` becomes
    ``https://your-domain.com`` and ``/s3``.
    The prefix is empty when the URL has no path.

    ``public_object_url`` joins the origin, this prefix, the bucket, and
    the object key. Nginx strips the prefix before MinIO sees the request.
    """
    parts = urlsplit(public_url.strip())
    origin = urlunsplit((parts.scheme, parts.netloc, "", "", ""))
    path = parts.path.strip("/")
    prefix = f"/{path}" if path else ""
    return origin, prefix


def _make_client(endpoint_url: str) -> BaseClient:
    """Build an S3 client for the private endpoint."""
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

    The bucket policy from :func:`public_read_policy` is what makes the
    GET succeed. The address does not expire.
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
        if code not in settings.missing_bucket_codes:
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


def object_key_from_public_url(url: str) -> str | None:
    """Object key for a URL this site publishes, or ``None`` if it is not.

    Import accepts only these links, so a file from another host cannot
    be attached by pasting its address.
    """
    origin, prefix = public_origin_and_prefix(settings.s3_public_url)
    marker = f"{origin}{prefix}/{settings.s3_bucket}/"
    if not url.startswith(marker):
        return None
    key = unquote(url[len(marker) :].split("?", 1)[0])
    return key or None


def copy_object(source_key: str, dest_key: str) -> None:
    """Copy one object to a new key in the same bucket.

    Blocking boto3. Callers in async code use ``asyncio.to_thread``.
    """
    try:
        get_internal_s3_client().copy_object(
            Bucket=settings.s3_bucket,
            Key=dest_key,
            CopySource={"Bucket": settings.s3_bucket, "Key": source_key},
        )
    except ClientError as exc:
        raise ValueError(f"Could not copy media {source_key}") from exc
