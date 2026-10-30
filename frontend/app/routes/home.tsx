/**
 * Home page template.
 *
 * The full page is prerendered into static HTML at build time. The backend
 * message card shows `LOADING` until `fetchHello()` completes after hydration
 * (see ``useBackendMessage``). The mirror form is fully interactive immediately
 * — it only fetches when the user clicks "Mirror text".
 *
 * Flow:
 *   Build      → Static HTML with shell and loading state
 *   Page load  → User sees that prerendered content immediately
 *   Hydration  → Hook fetches data from the backend
 *   On error   → Shows error message. The app does not crash entirely.
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

import { fetchHello } from "~/api/example-api";
import { HomePageCards } from "~/components/home-page-cards";
import { useBackendMessage } from "~/hooks/use-backend-message";
import { useMirrorMessage } from "~/hooks/use-mirror-message";

/**
 * Function to set the meta tags for the home page.
 * "meta" is a required name by React Router.
 * You can't name this function anything else.
 */
export const meta: MetaFunction = () => [
  { title: "Home | FastAPI + React Template" },
  {
    name: "description",
    content:
      "Starter home page that demonstrates SEO-friendly structure, client-side data fetching, and a mirror API call.",
  },
];

/**
 * Home route component.
 *
 * Backend message state lives in ``useBackendMessage``.
 * Mirror form state lives in ``useMirrorMessage`` and fetches only on click.
 */
const HomeRoute = () => {
  const {
    message: helloMessage,
    error: helloError,
    messageColor: helloMessageColor,
  } = useBackendMessage(fetchHello);
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
      <Heading as="h1" mb="2" size="8">
        Home
      </Heading>
      <Text as="p" color="gray" mb="6" size="3">
        Use this page as a starting point for landing sections, feature
        highlights, and API-connected UI.
      </Text>

      <HomePageCards />

      <Flex direction="column" gap="4">
        <Card>
          <Text as="p" color={helloMessageColor} size="3">
            Backend message: {helloMessage}
          </Text>
          {helloError ? (
            <Text as="p" color="gray" mt="2" size="2">
              {helloError}
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
