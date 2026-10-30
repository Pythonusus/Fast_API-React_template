/**
 * About page template.
 *
 * The full page is prerendered into static HTML at build time. The backend
 * message card shows `LOADING` until `fetchAbout()` completes after hydration
 * (see ``useBackendMessage``).
 *
 * Flow:
 *   Build      → Static HTML with shell and loading state
 *   Page load  → User sees that prerendered content immediately
 *   Hydration  → Hook fetches data from the backend
 *   On error   → Shows error message. The app does not crash entirely.
 */
import { Card, Heading, Section, Text } from "@radix-ui/themes";
import type { MetaFunction } from "react-router";

import { fetchAbout } from "~/api/example-api";
import { useBackendMessage } from "~/hooks/use-backend-message";

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
 * Backend message state lives in ``useBackendMessage`` (shared with Home).
 */
const AboutRoute = () => {
  const { message, error, messageColor } = useBackendMessage(fetchAbout);

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
          Backend message: {message}
        </Text>
        {error ? (
          <Text as="p" color="gray" mt="2" size="2">
            {error}
          </Text>
        ) : null}
      </Card>
    </Section>
  );
};

export default AboutRoute;
