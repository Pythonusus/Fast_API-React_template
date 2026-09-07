/**
 * Root route error boundary for React Router.
 *
 * Exported from `root.tsx` as `ErrorBoundary`. React Router renders this instead
 * of `App` when a nested route throws during render, or when a loader/action fails.
 *
 * Header, footer, and theme providers live in `Layout`, so this component only
 * renders the in-page error card.
 */
import { Button, Card, Flex, Heading, Text } from "@radix-ui/themes";
import { isRouteErrorResponse, useRouteError } from "react-router";

import {
  UNEXPECTED_RENDER_ERROR,
  UNEXPECTED_RENDER_ERROR_HINT,
} from "~/common-texts/errors";

/**
 * Picks a developer-facing message from the caught value.
 *
 * - In production (`import.meta.env.DEV === false`): returns `undefined` so
 *   users only see the generic copy from `common-texts/errors.ts`.
 * - In development: returns a short message to speed up debugging.
 */
const getErrorMessage = (error: unknown): string | undefined => {
  if (!import.meta.env.DEV) {
    return undefined;
  }

  if (isRouteErrorResponse(error)) {
    return `${error.status} ${error.statusText}`;
  }

  if (error instanceof Error) {
    return error.message;
  }

  return String(error);
};

export const ErrorBoundary = () => {
  const error = useRouteError();
  const details = getErrorMessage(error);

  if (import.meta.env.DEV) {
    console.error("Route error caught by ErrorBoundary:", error);
  }

  return (
    <Card>
      <Flex direction="column" gap="3">
        <Heading as="h1" size="5">
          {UNEXPECTED_RENDER_ERROR}
        </Heading>
        <Text as="p" color="gray" size="3">
          {UNEXPECTED_RENDER_ERROR_HINT}
        </Text>
        {details ? (
          <Text as="p" color="red" size="2">
            {details}
          </Text>
        ) : null}
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
