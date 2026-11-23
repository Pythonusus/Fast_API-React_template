/**
 * Mount-time fetch of a ``{ message }`` backend payload.
 *
 * Used by Home and About: render with "Loading…", then replace from the API
 * after hydration. Leaving the page aborts the request so a late response
 * cannot update unmounted state or flash a false error.
 *
 * Pass any ``(signal) => Promise<{ message }>`` helper (see ``fetchHello`` /
 * ``fetchAbout``). Errors map to the unavailable copy below.
 */
import { useEffect, useState } from "react";

import { isAbortError } from "~/api/abort";

export type BackendMessageFetcher = (
  signal: AbortSignal,
) => Promise<{ message: string }>;

export type BackendMessageColor = "gray" | "red" | undefined;

export const useBackendMessage = (fetchMessage: BackendMessageFetcher) => {
  const [message, setMessage] = useState("Loading…");
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

        setError("We know about the problem and are working on it.");
        setMessage("Backend is currently unavailable.");
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
