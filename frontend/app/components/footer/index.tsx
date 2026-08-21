/**
 * Shared footer used by every page.
 */
import { Flex, Text } from "@radix-ui/themes";
import "./footer.css";

export const Footer = () => {
  return (
    <Flex asChild className="app-footer" justify="center" p="4">
      <footer>
        <Text as="p" color="gray" size="2">
          Template footer - add links, legal text, and contacts here.
        </Text>
      </footer>
    </Flex>
  );
};
