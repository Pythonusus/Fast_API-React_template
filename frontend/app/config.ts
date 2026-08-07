/*
Frontend application configuration.
Check the .env.example file in the root directory for more information.
*/

import type { ThemeAppearance } from "~/types/theme";

export const DEVELOPMENT =
  (import.meta.env.DEVELOPMENT ?? "").toLowerCase() === "true";

export const THEME_STORAGE_KEY = "app-theme";
export const DEFAULT_THEME: ThemeAppearance = "light";
export const HTML_LANG = import.meta.env.HTML_LANG ?? "ru-RU";
