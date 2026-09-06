/**
 * Interactive mirror form example.
 *
 * Sends user input to `/api/mirror` on button click. This is user-triggered
 * fetching, not page-load fetching — it works the same in both Home patterns
 * and does not require `clientLoader`.
 */
import { Button, Card, Flex, Heading, Text, TextArea } from "@radix-ui/themes";

import { useMirrorMessage } from "~/hooks/use-mirror-message";

type MirrorExampleCardProps = {
  isLoading?: boolean;
};

export const MirrorExampleCard = ({
  isLoading = false,
}: MirrorExampleCardProps) => {
  const {
    inputMessage,
    isMirroring,
    mirror,
    mirrorError,
    mirrorMessage,
    setInputMessage,
  } = useMirrorMessage();

  return (
    <Card>
      <Flex direction="column" gap="3">
        <Heading as="h2" size="4">
          Mirror example
        </Heading>
        <Text as="p" color="gray" size="2">
          Enter text and send it to `/api/mirror` to see the response.
        </Text>
        {isLoading ? (
          <Text as="p" color="gray" size="2">
            This interactive section becomes available after hydration.
          </Text>
        ) : (
          <>
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
          </>
        )}
      </Flex>
    </Card>
  );
};
