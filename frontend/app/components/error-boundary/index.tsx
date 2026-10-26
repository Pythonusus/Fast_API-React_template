/**
 * Root route error boundary for React Router.
 *
 * Exported from `root.tsx` as `ErrorBoundary`. React Router renders this instead
 * of `App` when a nested route throws during render, or when a loader/action fails.
 *
 * Header, footer, and theme providers live in `Layout`, so this component only
 * renders the in-page error card. Visitors see the shared problem notice.
 * The caught value is not rendered and is not written to the browser console.
 */
import { Button, Card, Flex, Heading, Text } from "@radix-ui/themes";
import { useRouteError } from "react-router";

import {
  BACKEND_UNAVAILABLE_HINT,
  UNEXPECTED_RENDER_ERROR,
} from "~/common-texts/errors";

export const ErrorBoundary = () => {
  // Read the error so React Router treats this boundary as handling it.
  useRouteError();

  return (
    <Card>
      <Flex direction="column" gap="3">
        <Heading as="h1" size="5">
          {UNEXPECTED_RENDER_ERROR}
        </Heading>
        <Text as="p" color="gray" size="3">
          {BACKEND_UNAVAILABLE_HINT}
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
