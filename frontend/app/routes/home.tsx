/**
 * Home page template.
 *
 * The full page is prerendered into static HTML at build time. The backend
 * message card shows "Loading..." until `fetchHello()` completes after hydration.
 * The mirror form is fully interactive immediately — it only fetches when the
 * user clicks "Mirror text".
 *
 * Flow:
 *   Build      → Static HTML with header, form, and "Backend message: Loading..."
 *   Page load  → User sees that prerendered content immediately
 *   Hydration  → `useEffect` calls `fetchHello()`; the card text updates in place
 *   On error   → Message turns red and shows a hint to start the backend server
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
import { useEffect, useState } from "react";
import type { MetaFunction } from "react-router";

import { fetchHello } from "~/api/example-api";
import {
  BACKEND_LOAD_FAILED,
  BACKEND_UNAVAILABLE,
  START_BACKEND_SERVER_HINT,
} from "~/common-texts/errors";
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
 * `helloMessage` starts as "Loading..." and is replaced once `fetchHello()` resolves.
 * Mirror form state lives in `useMirrorMessage` and fetches only on button click.
 */
const HomeRoute = () => {
  const [helloMessage, setHelloMessage] = useState("Loading...");
  const [helloError, setHelloError] = useState<string | null>(null);
  const [isHelloLoading, setIsHelloLoading] = useState(true);
  const {
    inputMessage,
    isMirroring,
    mirror,
    mirrorError,
    mirrorMessage,
    setInputMessage,
  } = useMirrorMessage();

  /*
   * `useEffect` runs a side effect after React renders the component.
   * Here the effect fetches backend data once the page is on screen.
   *
   * - `[]` — run only once after mount (not on every re-render).
   * - Render first with "Loading...", then `fetchHello()` updates state when it resolves.
   * - `void` — async call is fire-and-forget; errors are handled in try/catch below.
   */
  useEffect(() => {
    const loadHelloMessage = async () => {
      try {
        const { message } = await fetchHello();
        setHelloMessage(message);
        setHelloError(null);
      } catch (error) {
        setHelloError(
          error instanceof Error ? error.message : BACKEND_LOAD_FAILED,
        );
        setHelloMessage(BACKEND_UNAVAILABLE);
      } finally {
        setIsHelloLoading(false);
      }
    };

    void loadHelloMessage();
  }, []);

  /**
   * Determine the color of the hello message based on the state.
   *
   * - `gray` — loading
   * - `red` — error
   * - `undefined` — use default color
   */
  let helloMessageColor: "gray" | "red" | undefined;
  if (isHelloLoading) {
    helloMessageColor = "gray";
  } else if (helloError) {
    helloMessageColor = "red";
  }

  /* Resulting HTML output: */
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
          <Text as="p" color={helloMessageColor} size="3">
            Backend message: {helloMessage}
          </Text>
          {helloError ? (
            <Text as="p" color="gray" mt="2" size="2">
              {START_BACKEND_SERVER_HINT}
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
