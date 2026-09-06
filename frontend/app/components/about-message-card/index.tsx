/**
 * Backend message card that fetches its own data on mount.
 *
 * Demonstrates the component-level fetch pattern: the parent route is fully
 * static HTML at build time, and this component fills in dynamic content after
 * hydration without `clientLoader` or `HydrateFallback`.
 *
 * `fetchAbout()` handles the HTTP call; `useEffect` triggers it once after mount
 * and stores the result in local state.
 */
import { Card, Text } from "@radix-ui/themes";
import { useEffect, useState } from "react";

import { fetchAbout } from "~/api/example-api";
import {
  BACKEND_LOAD_FAILED,
  BACKEND_UNAVAILABLE,
  START_BACKEND_SERVER_HINT,
} from "~/common-texts/errors";

export const AboutBackendMessageCard = () => {
  const [aboutMessage, setAboutMessage] = useState("Loading...");
  const [aboutError, setAboutError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

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

  let messageColor: "gray" | "red" | undefined;
  if (isLoading) {
    messageColor = "gray";
  } else if (aboutError) {
    messageColor = "red";
  }

  return (
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
  );
};
