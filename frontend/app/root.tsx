/**
 * Root route that wires global layout, theming, and page rendering.
 *
 * Think of the root route as the app's outer frame:
 * - It defines the document HTML wrapper (`<html>`, `<head>`, `<body>`).
 * - It provides global providers (the Radix Theme in this case).
 * - It renders shared UI that should appear on every page (header/footer).
 * - It reserves a slot where nested route content will be rendered (`<Outlet />`).
 *
 * Rendering model in this app - SSG for static shell, CSR for dynamic content.
 * SSR is disabled in react-router.config.ts.
 * - The static shell (header/footer/main structure) is prerendered into static HTML files.
 * - `<Outlet />` is a placeholder where nested route modules render inside the shell.
 * - Routes fetch backend data in the browser after hydration (see `routes/home.tsx`
 *   and `routes/about.tsx`) using `useEffect` inside the route component.
 * - User-triggered requests (forms, buttons) fetch on action without a route loader.
 *
 * Error handling:
 * - `ErrorBoundary` is React Router's route-level error boundary export.
 *   `Layout` wraps both `App` and `ErrorBoundary`, so header/footer stay visible
 *   without duplicating shell markup.
 */
import "@radix-ui/themes/styles.css";
import "~/styles/app.css";
import "~/styles/themes.css";

import { Box, Container, Flex, Section, Theme } from "@radix-ui/themes";
import { ThemeProvider } from "next-themes";
import { type ReactNode } from "react";
import { Links, Meta, Outlet, Scripts, ScrollRestoration } from "react-router";

import { Footer } from "~/components/footer";
import { Header } from "~/components/header";
import { HTML_LANG } from "~/config";

/*
  React Router looks for a named `ErrorBoundary` export on the root route module.
  Re-export it here so the implementation can live in `components/error-boundary`.
*/
export { ErrorBoundary } from "~/components/error-boundary";

/**
 * `Layout` defines the full HTML document structure and shared app chrome.
 *
 * In React Router framework mode, this component wraps your route tree and is
 * responsible for document-level elements.
 *
 * `children` is either the normal route app (`App`) or the route error boundary
 * when something throws. Because the header/footer shell lives here, both paths
 * share the same outer frame.
 */
export const Layout = ({ children }: { children: ReactNode }) => {
  /*
    `suppressHydrationWarning` below is required by next-themes: its inline
    script adds the `light`/`dark` class to `<html>` before React hydrates, so
    this element intentionally differs from the prerendered HTML.
  */
  return (
    <html lang={HTML_LANG} suppressHydrationWarning>
      <head>
        <meta charSet="utf-8" />
        <meta content="width=device-width, initial-scale=1" name="viewport" />
        {/* Injects route `meta` exports (title, description, etc.). */}
        <Meta />
        {/* Injects route `links` exports as `<link>` tags. */}
        <Links />
      </head>
      <body>
        {/*
          Radix UI theme provider: all Radix components and custom components with
          necessary css vars inside inherit these design tokens.

          Theme props:
          - appearance: selects light/dark token set.
          - accentColor: sets the main accent color for the app.
          - radius: sets default component corner roundness.
          - scaling: scales spacing/typography/sizing globally.
          - For more information see https://www.radix-ui.com/themes/docs/components/theme
        */}
        <ThemeProvider attribute="class">
          <Theme radius="medium" scaling="100%">
            {/*
              Outer shell element for app-wide styling.
              - `minHeight="100vh"` ensures full viewport height.
            */}
            <Box className="app-shell" minHeight="100vh">
              {/* Shared top navigation/header visible on every route. */}
              <Header />
              {/* Vertical layout: main content grows, footer stays at bottom. */}
              <Flex direction="column" minHeight="100vh">
                {/*
                  `asChild` makes Box pass its props/styles onto the `<main>`
                  element directly.
                */}
                <Box asChild flexGrow="1" pt="9">
                  <main>
                    {/* Page content spacing wrapper. */}
                    <Section py="6">
                      {/* Constrains content width and adds horizontal padding. */}
                      <Container px="4" size="4">
                        {children}
                      </Container>
                    </Section>
                  </main>
                </Box>
                {/* Shared footer visible on every route. */}
                <Footer />
              </Flex>
            </Box>
          </Theme>
        </ThemeProvider>
        {/* Restores scroll position on back/forward navigation automatically. */}
        <ScrollRestoration />
        {/* Injects React Router/client runtime scripts at the end of body. */}
        <Scripts />
      </body>
    </html>
  );
};

/**
 * `App` is the visual root of your route tree.
 *
 * Most shared layout lives in `Layout`. This component only renders the nested
 * route slot for the currently matched URL.
 */
const App = () => {
  return (
    /*
      Most important React Router concept here:
      `<Outlet />` is a placeholder where the currently matched
      child route component renders.

      Example:
      - URL `/` will render `routes/home.tsx` here.
      - URL `/about` will render `routes/about.tsx` here.
      The root shell remains mounted, only outlet content changes.
    */
    <Outlet />
  );
};

export default App;
