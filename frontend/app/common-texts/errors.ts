/**
 * Error messages reused across API calls and UI components.
 * Add strings here only when they appear in more than one place.
 */

export const BACKEND_LOAD_FAILED = "Could not load data from backend.";
export const BACKEND_UNAVAILABLE = "Backend is currently unavailable.";
export const START_BACKEND_SERVER_HINT =
  "Start the backend server to load live content.";
export const MIRROR_REQUEST_FAILED = "Mirror request failed.";

export const fetchMessageError = (status: number): string =>
  `Failed to fetch message: ${status}`;
