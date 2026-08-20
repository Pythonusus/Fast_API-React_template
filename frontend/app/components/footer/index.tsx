/**
 * Shared footer used by every page.
 */
import { Box, Container, Text } from "@radix-ui/themes";

export const Footer = () => {
  return (
    <Box asChild>
      <footer className="app-footer">
        <Container px="4" py="4" size="4">
          <Text as="p" color="gray" size="2">
            Template footer - add links, legal text, and contacts here.
          </Text>
        </Container>
      </footer>
    </Box>
  );
};
