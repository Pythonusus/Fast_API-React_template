import { useState } from "react";

import { DEFAULT_THEME, THEME_STORAGE_KEY } from "~/config";
import type { ThemeAppearance } from "~/types/theme";

const isThemeAppearance = (value: string | null): value is ThemeAppearance =>
  value === "dark" || value === "light";

const getInitialTheme = (): ThemeAppearance => {
  const canReadLocalStorage =
    globalThis.localStorage !== undefined &&
    typeof globalThis.localStorage.getItem === "function";
  const storedTheme = canReadLocalStorage
    ? globalThis.localStorage.getItem(THEME_STORAGE_KEY)
    : null;
  return isThemeAppearance(storedTheme) ? storedTheme : DEFAULT_THEME;
};

const getToggledThemeAndPersist = (
  currentTheme: ThemeAppearance,
): ThemeAppearance => {
  const nextTheme: ThemeAppearance =
    currentTheme === "light" ? "dark" : "light";
  if (
    globalThis.localStorage !== undefined &&
    typeof globalThis.localStorage.setItem === "function"
  ) {
    globalThis.localStorage.setItem(THEME_STORAGE_KEY, nextTheme);
  }

  return nextTheme;
};

export const useTheme = () => {
  const [appearance, setAppearance] =
    useState<ThemeAppearance>(getInitialTheme);

  const toggleTheme = () => {
    setAppearance(getToggledThemeAndPersist);
  };

  return { appearance, toggleTheme };
};
