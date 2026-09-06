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
 */
import { useState } from "react";

import { fetchMirror } from "~/api/example-api";
import { MIRROR_REQUEST_FAILED } from "~/common-texts/errors";

export const useMirrorMessage = () => {
  const [inputMessage, setInputMessage] = useState("");
  const [mirrorMessage, setMirrorMessage] = useState("");
  const [isMirroring, setIsMirroring] = useState(false);
  const [mirrorError, setMirrorError] = useState("");

  const mirror = async () => {
    try {
      setIsMirroring(true);
      setMirrorError("");
      const { message } = await fetchMirror(inputMessage);
      setMirrorMessage(message);
    } catch (error) {
      setMirrorError(
        error instanceof Error ? error.message : MIRROR_REQUEST_FAILED,
      );
    } finally {
      setIsMirroring(false);
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
