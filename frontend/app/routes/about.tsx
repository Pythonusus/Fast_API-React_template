/**
 * About page template.
 *
 * The full page is prerendered into static HTML at build time. The backend
 * message card shows "Loading..." until `fetchAbout()` completes after hydration.
 *
 * Flow:
 *   Build      → Static HTML with header and "Backend message: Loading..."
 *   Page load  → User sees that prerendered content immediately
 *   Hydration  → `useEffect` calls `fetchAbout()`; the card text updates in place
 *   On error   → Message turns red and shows a hint to start the backend server
 */
import { Card, Heading, Section, Text } from "@radix-ui/themes";
/**
 * React hooks used on this page:
 *
 * `useState` — gives the component memory. Each call creates a value that persists
 * between re-renders (e.g. `aboutMessage`). When you call the setter
 * (`setAboutMessage`), React re-renders the component with the new value and
 * updates the UI.
 *
 * `useEffect` — runs code *after* React paints the UI. Use it for side effects
 * like fetching data, not for rendering itself. The `[]` at the end means
 * "run once when the component first appears on screen".
 */
import { useEffect, useState } from "react";
import type { MetaFunction } from "react-router";

import { fetchAbout } from "~/api/example-api";
import {
  BACKEND_LOAD_FAILED,
  BACKEND_UNAVAILABLE,
  START_BACKEND_SERVER_HINT,
} from "~/common-texts/errors";

/**
 * Function to set the meta tags for the about page.
 * "meta" is a required name by React Router.
 * You can't name this function anything else.
 */
export const meta: MetaFunction = () => [
  { title: "About | FastAPI + React Template" },
  {
    name: "description",
    content:
      "Starter about page that demonstrates SEO-friendly semantic sections and backend-connected text.",
  },
];

/**
 * About route component.
 *
 * `aboutMessage` starts as "Loading..." and is replaced once `fetchAbout()` resolves.
 */
const AboutRoute = () => {
  const [aboutMessage, setAboutMessage] = useState("Loading...");
  const [aboutError, setAboutError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  /*
   * `useEffect` runs a side effect after React renders the component.
   * Here the effect fetches backend data once the page is on screen.
   *
   * - `[]` — run only once after mount (not on every re-render).
   * - Render first with "Loading...", then `fetchAbout()` updates state when it resolves.
   * - `void` — async call is fire-and-forget; errors are handled in try/catch below.
   */
  useEffect(() => {
    const loadAboutMessage = async () => {
      try {
        const { message } = await fetchAbout();
        setAboutMessage(message);
        setAboutError(null);
      } catch (error) {
        setAboutError(
          error instanceof Error ? error.message : BACKEND_LOAD_FAILED,
        );
        setAboutMessage(BACKEND_UNAVAILABLE);
      } finally {
        setIsLoading(false);
      }
    };

    void loadAboutMessage();
  }, []);

  /**
   * Determine the color of the backend message based on the state.
   *
   * - `gray` — loading
   * - `red` — error
   * - `undefined` — use default color
   */
  let messageColor: "gray" | "red" | undefined;
  if (isLoading) {
    messageColor = "gray";
  } else if (aboutError) {
    messageColor = "red";
  }

  /* Resulting HTML output: */
  return (
    <Section p="0">
      <header>
        <Heading as="h1" mb="2" size="8">
          About
        </Heading>
        <Text as="p" color="gray" mb="6" size="3">
          This template keeps structure simple and explains where static content
          and dynamic content belong.
        </Text>
      </header>

      <Card>
        <Text as="p" color={messageColor} size="3">
          Backend message: {aboutMessage}
        </Text>
        {aboutError ? (
          <Text as="p" color="gray" mt="2" size="2">
            {START_BACKEND_SERVER_HINT}
          </Text>
        ) : null}
      </Card>
    </Section>
  );
};

export default AboutRoute;
