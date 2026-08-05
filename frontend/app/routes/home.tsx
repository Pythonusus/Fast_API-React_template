/**
 * Home page template.
 *
 * `clientLoader` runs in the browser and fetches dynamic content from backend.
 * This keeps static markup friendly for SSG while data remains CSR-driven.
 */
import {
  Button,
  Card,
  Flex,
  Heading,
  Section,
  Text,
  TextArea,
} from "@radix-ui/themes";
import type { MetaFunction } from "react-router";
import { useLoaderData } from "react-router";

import { fetchHello } from "~/api/example-api";
import { useMirrorMessage } from "~/hooks/use-mirror-message";
import type { HomeLoaderData } from "~/types/route-loaders";

export const meta: MetaFunction = () => [
  { title: "Home | FastAPI + React Template" },
  {
    name: "description",
    content:
      "Starter home page that demonstrates SEO-friendly structure, client-side data fetching, and a mirror API call.",
  },
];

export const clientLoader = Object.assign(
  async (): Promise<HomeLoaderData> => {
    try {
      const { message } = await fetchHello();
      return { helloError: null, helloMessage: message };
    } catch (error) {
      return {
        helloError:
          error instanceof Error
            ? error.message
            : "Could not load data from backend.",
        helloMessage: "Backend is currently unavailable.",
      };
    }
  },
  { hydrate: true as const },
);

/**
 * Fallback UI rendered in prerendered HTML while client data is loading.
 * This keeps static page structure visible even before backend calls finish.
 */
export const HydrateFallback = () => {
  return (
    <Section p="0">
      <header>
        <Heading as="h1" mb="2" size="8">
          Home
        </Heading>
        <Text as="p" color="gray" mb="6" size="3">
          Use this page as a starting point for landing sections, feature
          highlights, and API-connected UI.
        </Text>
      </header>

      <Flex direction="column" gap="4">
        <Card>
          <Text as="p" color="gray" size="3">
            Backend message: Loading client content...
          </Text>
        </Card>

        <Card>
          <Flex direction="column" gap="3">
            <Heading as="h2" size="4">
              Mirror example
            </Heading>
            <Text as="p" color="gray" size="2">
              Enter text and send it to `/api/mirror` to see the response.
            </Text>
            <Text as="p" color="gray" size="2">
              This interactive section becomes available after hydration.
            </Text>
          </Flex>
        </Card>
      </Flex>
    </Section>
  );
};

const HomeRoute = () => {
  const { helloError, helloMessage } = useLoaderData<typeof clientLoader>();
  const {
    inputMessage,
    isMirroring,
    mirror,
    mirrorError,
    mirrorMessage,
    setInputMessage,
  } = useMirrorMessage();

  return (
    <Section p="0">
      <header>
        <Heading as="h1" mb="2" size="8">
          Home
        </Heading>
        <Text as="p" color="gray" mb="6" size="3">
          Use this page as a starting point for landing sections, feature
          highlights, and API-connected UI.
        </Text>
      </header>

      <Flex direction="column" gap="4">
        <Card>
          <Text as="p" color={helloError ? "red" : undefined} size="3">
            Backend message: {helloMessage}
          </Text>
          {helloError ? (
            <Text as="p" color="gray" mt="2" size="2">
              Start the backend server to load live content.
            </Text>
          ) : null}
        </Card>

        <Card>
          <Flex direction="column" gap="3">
            <Heading as="h2" size="4">
              Mirror example
            </Heading>
            <Text as="p" color="gray" size="2">
              Enter text and send it to `/api/mirror` to see the response.
            </Text>
            <TextArea
              onChange={(event) => {
                setInputMessage(event.target.value);
              }}
              placeholder="Write something to mirror..."
              value={inputMessage}
            />
            <Flex align="center" gap="3">
              <Button loading={isMirroring} onClick={mirror}>
                Mirror text
              </Button>
              {mirrorMessage ? (
                <Text as="p" size="2">
                  Result: {mirrorMessage}
                </Text>
              ) : null}
            </Flex>
            {mirrorError ? (
              <Text as="p" color="red" size="2">
                {mirrorError}
              </Text>
            ) : null}
          </Flex>
        </Card>
      </Flex>
    </Section>
  );
};

export default HomeRoute;
