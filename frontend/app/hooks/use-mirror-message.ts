/**
 * Encapsulates UI state and request flow for the mirror example form.
 */
import { useState } from "react";

import { fetchMirror } from "~/api/example-api";

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
        error instanceof Error ? error.message : "Mirror request failed.",
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
