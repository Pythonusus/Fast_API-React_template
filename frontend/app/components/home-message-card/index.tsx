/**
 * Presentational card for displaying a backend API message.
 *
 * Accepts data via props so it can be driven by either fetch pattern:
 * - Route-level: `clientLoader` + `useLoaderData` (see Home page)
 * - Component-level: a hook that fetches on mount (see About page)
 */
import { Card, Text } from "@radix-ui/themes";

import { START_BACKEND_SERVER_HINT } from "~/common-texts/errors";

type BackendMessageCardProps = {
  message: string;
  error: string | null;
  isLoading?: boolean;
};

export const BackendMessageCard = ({
  message,
  error,
  isLoading = false,
}: BackendMessageCardProps) => {
  let messageColor: "gray" | "red" | undefined;
  if (isLoading) {
    messageColor = "gray";
  } else if (error) {
    messageColor = "red";
  }

  return (
    <Card>
      <Text as="p" color={messageColor} size="3">
        Backend message: {message}
      </Text>
      {error ? (
        <Text as="p" color="gray" mt="2" size="2">
          {START_BACKEND_SERVER_HINT}
        </Text>
      ) : null}
    </Card>
  );
};
