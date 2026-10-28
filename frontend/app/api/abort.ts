/**
 * Detect a fetch rejected because its ``AbortSignal`` fired.
 *
 * Callers use this to skip error UI when a newer request, or an unmount,
 * cancelled the one that just settled.
 */
export const isAbortError = (error: unknown): boolean =>
  error instanceof Error && error.name === "AbortError";
