/**
 * App header with navigation and theme switch.
 *
 * This component is intentionally simple so it can be reused as a starter
 * in new projects.
 */
import { MoonIcon, SunIcon } from "@radix-ui/react-icons";
import { Box, Flex, IconButton, Link, Text } from "@radix-ui/themes";
import { NavLink } from "react-router";

import reactLogo from "~/assets/react.svg";
import type { HeaderProps } from "~/types/components";
import "./header.css";

export const Header = ({ appearance, onToggleTheme }: HeaderProps) => {
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
            onClick={onToggleTheme}
            radius="full"
            variant="soft"
          >
            {appearance === "light" ? <MoonIcon /> : <SunIcon />}
          </IconButton>
        </Flex>
      </header>
    </Box>
  );
};
