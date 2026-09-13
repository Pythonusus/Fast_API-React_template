/**
 * Catch-all 404 page for unmatched URLs.
 *
 * React Router matches this module when no other route fits the path
 * (`path: "*"` in `routes.ts`). Because it is a real route, it can export
 * `meta` like Home and About, and it renders inside the root `Layout`
 * (header, footer, and theme stay in place).
 */
import { Box, Button, Flex, Heading, Section, Text } from "@radix-ui/themes";
import { Link, type MetaFunction } from "react-router";

import lostPageImage from "~/assets/404.webp";
import "~/styles/components/404.css";

/**
 * Function to set the meta tags for the 404 page.
 * "meta" is a required name by React Router.
 * You can't name this function anything else.
 */
export const meta: MetaFunction = () => [
  { title: "404 Page not found" },
  {
    name: "description",
    content: "This page does not exist.",
  },
];

const Page404 = () => {
  return (
    <Section p="0">
      <Flex align="center" direction="column" gap="4">
        <Flex align="center" direction="column">
          <Text
            as="p"
            color="indigo"
            size="9"
            weight="bold"
            className="page-404-code"
          >
            404
          </Text>
          <Heading align="center" as="h1" size="8">
            Page not found
          </Heading>
          <Box asChild height="auto" maxWidth="100%" my="-6" width="600px">
            <img
              alt="A sad computer that could not find this page"
              src={lostPageImage}
            />
          </Box>
          <Text align="center" as="p" color="gray" size="3">
            We looked everywhere. Even under the couch. Still no trace of this
            page.
          </Text>
        </Flex>
        <Button asChild size="3">
          <Link to="/">Take me home</Link>
        </Button>
      </Flex>
    </Section>
  );
};

export default Page404;
