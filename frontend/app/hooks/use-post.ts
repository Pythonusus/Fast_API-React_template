/**
 * Single post state for the detail page.
 *
 * Fetches ``GET /api/posts/{id}`` after hydration and aborts the request when
 * the id changes or the page unmounts. Loading is derived from the id the
 * last result belongs to, so the effect only writes state after a response.
 *
 * ``postId`` is ``null`` when the URL segment is not a valid post id; the hook
 * then reports ``notFound`` without calling the backend.
 */
import { useEffect, useState } from "react";

import { isAbortError } from "~/api/abort";
import { PostNotFoundError, fetchPost } from "~/api/posts";
import { BACKEND_UNAVAILABLE } from "~/common-texts/errors";
import type { Post } from "~/types/posts";

type PostResult = {
  /** Id this result belongs to. */
  postId: number;
  post: Post | null;
  notFound: boolean;
  error: string | null;
};

export const usePost = (postId: number | null) => {
  const [result, setResult] = useState<PostResult | null>(null);

  useEffect(() => {
    if (postId === null) {
      return;
    }

    const controller = new AbortController();

    const load = async () => {
      try {
        const post = await fetchPost(postId, controller.signal);
        setResult({ postId, post, notFound: false, error: null });
      } catch (error_) {
        if (isAbortError(error_)) {
          return;
        }

        setResult({
          postId,
          post: null,
          notFound: error_ instanceof PostNotFoundError,
          error:
            error_ instanceof PostNotFoundError ? null : BACKEND_UNAVAILABLE,
        });
      }
    };

    void load();

    return () => {
      controller.abort();
    };
  }, [postId]);

  if (postId === null) {
    return { post: null, isLoading: false, notFound: true, error: null };
  }

  const current = result?.postId === postId ? result : null;

  return {
    post: current?.post ?? null,
    isLoading: current === null,
    notFound: current?.notFound ?? false,
    error: current?.error ?? null,
  };
};
