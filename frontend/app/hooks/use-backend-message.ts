/**
 * Mount-time fetch of a ``{ message }`` backend payload.
 *
 * Used by Home and About: render with ``LOADING``, then replace from the API
 * after hydration. Leaving the page aborts the request so a late response
 * cannot update unmounted state or flash a false error.
 *
 * Pass any ``(signal) => Promise<{ message }>`` helper (see ``fetchHello`` /
 * ``fetchAbout``). Errors map to the shared unavailable copy.
 */
import { useEffect, useState } from "react";

import { isAbortError } from "~/api/abort";
import {
  BACKEND_UNAVAILABLE,
  BACKEND_UNAVAILABLE_HINT,
} from "~/common-texts/errors";
import { LOADING } from "~/common-texts/ui";

export type BackendMessageFetcher = (
  signal: AbortSignal,
) => Promise<{ message: string }>;

export type BackendMessageColor = "gray" | "red" | undefined;

export const useBackendMessage = (fetchMessage: BackendMessageFetcher) => {
  const [message, setMessage] = useState(LOADING);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const controller = new AbortController();

    const load = async () => {
      try {
        const { message: next } = await fetchMessage(controller.signal);
        setMessage(next);
        setError(null);
      } catch (error_) {
        if (isAbortError(error_)) {
          return;
        }

        setError(BACKEND_UNAVAILABLE_HINT);
        setMessage(BACKEND_UNAVAILABLE);
      } finally {
        if (!controller.signal.aborted) {
          setIsLoading(false);
        }
      }
    };

    void load();

    return () => {
      controller.abort();
    };
  }, [fetchMessage]);

  let messageColor: BackendMessageColor;
  if (isLoading) {
    messageColor = "gray";
  } else if (error) {
    messageColor = "red";
  }

  return {
    message,
    error,
    isLoading,
    messageColor,
  };
};
