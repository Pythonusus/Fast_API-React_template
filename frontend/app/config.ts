/**
 * Frontend application configuration.
 *
 * Check the .env.example file in the root directory for more information.
 */

import type { ThemeAppearance } from "~/types/theme";

// Mode in which frontend application is running.
export const DEVELOPMENT =
  (import.meta.env.DEVELOPMENT ?? "").toLowerCase() === "true";

// Key used to store the theme in the browser's localStorage.
export const THEME_STORAGE_KEY = "app-theme";

// Default theme to use if no theme is stored in the browser's localStorage.
export const DEFAULT_THEME: ThemeAppearance = "light";

// HTML lang attribute to use for the document.
export const HTML_LANG = import.meta.env.HTML_LANG ?? "ru-RU";
