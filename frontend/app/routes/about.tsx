/**
 * About page template.
 *
 * This route mirrors the Home route pattern and fetches its text in the browser.
 */
import { Card, Heading, Section, Text } from "@radix-ui/themes";
import type { MetaFunction } from "react-router";
import { useLoaderData } from "react-router";

import { fetchAbout } from "~/api/example-api";
import type { AboutLoaderData } from "~/types/route-loaders";

export const meta: MetaFunction = () => [
  { title: "About | FastAPI + React Template" },
  {
    name: "description",
    content:
      "Starter about page that demonstrates SEO-friendly semantic sections and backend-connected text.",
  },
];

export const clientLoader = Object.assign(
  async (): Promise<AboutLoaderData> => {
    try {
      const { message } = await fetchAbout();
      return { aboutError: null, aboutMessage: message };
    } catch (error) {
      return {
        aboutError:
          error instanceof Error
            ? error.message
            : "Could not load data from backend.",
        aboutMessage: "Backend is currently unavailable.",
      };
    }
  },
  { hydrate: true as const },
);

/**
 * Fallback UI rendered in prerendered HTML while client data is loading.
 */
export const HydrateFallback = () => {
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
        <Text as="p" color="gray" size="3">
          Backend message: Loading client content...
        </Text>
      </Card>
    </Section>
  );
};

const AboutRoute = () => {
  const { aboutError, aboutMessage } = useLoaderData<typeof clientLoader>();

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
        <Text as="p" color={aboutError ? "red" : undefined} size="3">
          Backend message: {aboutMessage}
        </Text>
        {aboutError ? (
          <Text as="p" color="gray" mt="2" size="2">
            Start the backend server to load live content.
          </Text>
        ) : null}
      </Card>
    </Section>
  );
};

export default AboutRoute;
