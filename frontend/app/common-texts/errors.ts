/**
 * Error messages reused across API calls and UI components.
 * Add strings here only when they appear in more than one place.
 */

export const BACKEND_UNAVAILABLE = "Backend is currently unavailable.";
export const BACKEND_UNAVAILABLE_HINT =
  "We know about the problem and are working on it.";
export const UNEXPECTED_RENDER_ERROR =
  "Something went wrong while rendering this page.";

/**
 * Non-OK response from any `/api/...` call.
 * The status is the HTTP status code from the failed response.
 */
export const fetchDataError = (status: number): string =>
  `Failed to fetch data: ${status}`;

/** HTTP 200 (or other OK) whose body is not valid JSON or fails the schema. */
export const INVALID_RESPONSE_BODY =
  "Backend returned data in an unexpected format.";
