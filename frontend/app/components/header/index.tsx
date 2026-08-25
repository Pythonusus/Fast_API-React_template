/**
 * App header with navigation and theme switch.
 *
 * This component is intentionally simple so it can be reused as a starter
 * in new projects.
 */
import { MoonIcon, SunIcon } from "@radix-ui/react-icons";
import { Box, Flex, IconButton, Link, Text } from "@radix-ui/themes";
import { useTheme } from "next-themes";
import { NavLink } from "react-router";

import reactLogo from "~/assets/react.svg";
import "./header.css";

export const Header = () => {
  /**
   * `useTheme` exposes the state of the `ThemeProvider` configured in `root.tsx`.
   *
   * Two different values describe the theme, and mixing them up breaks the toggle:
   * - `theme` is the stored *preference*: "light", "dark" or "system".
   * - `resolvedTheme` is the *effective* mode and is always "light" or "dark",
   *   because "system" is resolved through the `prefers-color-scheme` media query.
   *
   * The button must work with `resolvedTheme`. While the preference is still
   * "system" (every first visit), `theme` is neither "light" nor "dark", so any
   * comparison against it picks the wrong branch.
   */
  const { resolvedTheme, setTheme } = useTheme();

  /**
   * Switches to the opposite of what is currently on screen.
   *
   * `setTheme` persists the choice in localStorage and swaps the `class` on
   * `<html>`, which is the single source of truth every theme style reacts to.
   */
  const toggleTheme = () => {
    setTheme(resolvedTheme === "dark" ? "light" : "dark");
  };

  return (
    <Box asChild className="app-header" p="4">
      <header>
        <Flex align="center" gap="4" justify="between">
          <Flex align="center" gap="4">
            <Flex align="center" gap="2">
              <img
                alt="React logo"
                height="24"
                loading="lazy"
                src={reactLogo}
                width="24"
              />
              <Text as="p" size="4" weight="bold">
                FastAPI + React Template
              </Text>
            </Flex>
            <Flex asChild align="center" gap="3">
              <nav aria-label="Main">
                <Link asChild color="gray" highContrast>
                  <NavLink to="/">Home</NavLink>
                </Link>
                <Link asChild color="gray" highContrast>
                  <NavLink to="/about">About</NavLink>
                </Link>
              </nav>
            </Flex>
          </Flex>
          <IconButton
            aria-label="Toggle light and dark theme"
            onClick={toggleTheme}
            radius="full"
            variant="soft"
          >
            {/*
              Both icons are always rendered and `header.css` hides the one that
              does not match the active theme.

              Picking the icon in JavaScript is not an option here: pages are
              prerendered to static HTML at build time, when the visitor's theme
              is unknown. The prerendered icon would then differ from the first
              client render, which causes a hydration mismatch and a visible
              flash of the wrong icon. CSS applies before the first paint.
            */}
            <MoonIcon className="theme-icon-when-light" />
            <SunIcon className="theme-icon-when-dark" />
          </IconButton>
        </Flex>
      </header>
    </Box>
  );
};
