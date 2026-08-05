/**
 * Root route that wires global layout, theming, and page rendering.
 *
 * - Static shell (header/footer/main structure) is server-rendered/prerendered.
 * - Dynamic page text is fetched in route `clientLoader` functions in the browser.
 */
import "@radix-ui/themes/styles.css";
import "~/styles/app.css";
import "~/styles/themes.css";

import {
  Box,
  Container,
  Flex,
  Heading,
  Section,
  Text,
  Theme,
} from "@radix-ui/themes";
import { type ReactNode } from "react";
import type { LinksFunction } from "react-router";
import {
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
  isRouteErrorResponse,
  useRouteError,
} from "react-router";

import { Footer } from "~/components/footer";
import { Header } from "~/components/header";
import { useTheme } from "~/hooks/use-theme";

export const links: LinksFunction = () => [];

export const Layout = ({ children }: { children: ReactNode }) => {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta content="width=device-width, initial-scale=1" name="viewport" />
        <Meta />
        <Links />
      </head>
      <body>
        {children}
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
};

const App = () => {
  const { appearance, toggleTheme } = useTheme();

  return (
    <Theme
      accentColor="indigo"
      appearance={appearance}
      grayColor="slate"
      radius="medium"
      scaling="100%"
    >
      <Box className="app-shell" data-theme={appearance} minHeight="100vh">
        <Header appearance={appearance} onToggleTheme={toggleTheme} />
        <Flex direction="column" minHeight="100vh">
          <Box asChild flexGrow="1" pt="9">
            <main>
              <Section py="6">
                <Container px="4" size="4">
                  <Outlet />
                </Container>
              </Section>
            </main>
          </Box>
          <Footer />
        </Flex>
      </Box>
    </Theme>
  );
};
export default App;

export const ErrorBoundary = () => {
  let title = "Unexpected error";
  let message = "Something went wrong.";

  const error = useRouteError();

  if (isRouteErrorResponse(error)) {
    title = `${error.status} ${error.statusText}`;
    message = error.data?.message ?? message;
  } else if (error instanceof Error) {
    message = error.message;
  }

  return (
    <Theme
      accentColor="indigo"
      appearance="light"
      grayColor="slate"
      radius="medium"
    >
      <Section py="9">
        <Container px="4" size="3">
          <Heading as="h1" mb="3" size="6">
            {title}
          </Heading>
          <Text as="p">{message}</Text>
        </Container>
      </Section>
    </Theme>
  );
};
