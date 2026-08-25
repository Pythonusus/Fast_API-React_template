/**
 * Frontend application configuration.
 *
 * Check the .env.example file in the root directory for more information.
 */

// Mode in which frontend application is running.
export const DEVELOPMENT =
  (import.meta.env.DEVELOPMENT ?? "").toLowerCase() === "true";

// HTML lang attribute to use for the document.
export const HTML_LANG = import.meta.env.HTML_LANG ?? "ru-RU";
