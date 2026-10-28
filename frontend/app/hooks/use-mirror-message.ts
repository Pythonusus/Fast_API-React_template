/**
 * Encapsulates UI state and request flow for the mirror example form.
 *
 * ## When to extract a hook vs keep logic inline
 *
 * Keep state and effects **inline in the component** when:
 * - The logic is used in one place only (see mount-time fetch in `routes/about.tsx`).
 * - The fetch is a simple mount-time request with a few state variables.
 * - Splitting it out would add a file without improving readability.
 *
 * Extract a **custom hook** when:
 * - The same state + handlers are reused across components.
 * - The component JSX is getting crowded with state declarations and async logic.
 * - You want to test or reason about the behavior separately from rendering.
 * - Several pieces of state and handlers belong together (input, loading, error, submit).
 *
 * This hook is extracted because the mirror form owns multiple related states
 * (`inputMessage`, `isMirroring`, `mirrorError`, `mirrorMessage`) and an async
 * submit handler — keeping that inside `HomeRoute` would bury the UI.
 *
 * A new click aborts any in-flight mirror request so an older response cannot
 * overwrite a newer one. Leaving the page aborts the request on unmount.
 */
import { useEffect, useRef, useState } from "react";

import { isAbortError } from "~/api/abort";
import { fetchMirror } from "~/api/example-api";
import { BACKEND_UNAVAILABLE_HINT } from "~/common-texts/errors";

export const useMirrorMessage = () => {
  const [inputMessage, setInputMessage] = useState("");
  const [mirrorMessage, setMirrorMessage] = useState("");
  const [isMirroring, setIsMirroring] = useState(false);
  const [mirrorError, setMirrorError] = useState("");
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    return () => {
      abortRef.current?.abort();
    };
  }, []);

  const mirror = async () => {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setIsMirroring(true);
    setMirrorError("");
    try {
      const { message } = await fetchMirror(inputMessage, controller.signal);
      setMirrorMessage(message);
    } catch (error) {
      if (isAbortError(error)) {
        return;
      }

      setMirrorError(BACKEND_UNAVAILABLE_HINT);
    } finally {
      if (!controller.signal.aborted) {
        setIsMirroring(false);
      }
    }
  };

  return {
    inputMessage,
    isMirroring,
    mirror,
    mirrorError,
    mirrorMessage,
    setInputMessage,
  };
};
