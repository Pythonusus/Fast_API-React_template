/**
 * Root route error boundary for React Router.
 *
 * Exported from `root.tsx` as `ErrorBoundary`. React Router renders this instead
 * of `App` when a nested route throws during render, or when a loader/action fails.
 *
 * Header, footer, and theme providers live in `Layout`, so this component only
 * renders the in-page error card. Visitors see the problem notice.
 * The caught value is not rendered and is not written to the browser console.
 */
import { Button, Card, Flex, Heading, Text } from "@radix-ui/themes";
import { useRouteError } from "react-router";

export const ErrorBoundary = () => {
  // Read the error so React Router treats this boundary as handling it.
  useRouteError();

  return (
    <Card>
      <Flex direction="column" gap="3">
        <Heading as="h1" size="5">
          Something went wrong while rendering this page.
        </Heading>
        <Text as="p" color="gray" size="3">
          We know about the problem and are working on it.
        </Text>
        <Button
          onClick={() => {
            globalThis.location.reload();
          }}
          type="button"
          variant="soft"
        >
          Try again
        </Button>
      </Flex>
    </Card>
  );
};
