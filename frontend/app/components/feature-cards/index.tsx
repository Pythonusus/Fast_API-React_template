/**
 * Responsive project/feature cards.
 *
 * Swap the sample link card and the placeholders for real projects.
 * Layout uses Radix Grid breakpoints (1 / 2 / 3 columns) instead of
 * Bootstrap `col-12 col-md-6 col-xl-4`.
 */
import { ExternalLinkIcon } from "@radix-ui/react-icons";
import { Card, Flex, Grid, Heading, Text } from "@radix-ui/themes";

import reactLogo from "~/assets/react.svg";
import "./feature-cards.css";

const ComingSoonCard = () => {
  return (
    <Card className="app-feature-card" size="2">
      <Heading as="h3" mb="2" size="4">
        Coming soon
      </Heading>
      <Text as="p" mb="0">
        This slot is empty because a bug was sitting in the chair between the
        keyboard and the monitor.
      </Text>
    </Card>
  );
};

export const FeatureCards = () => {
  return (
    <section aria-labelledby="featured-heading">
      <Heading as="h2" id="featured-heading" mb="4" size="5">
        Featured
      </Heading>
      <Grid
        columns={{ initial: "1", sm: "2", lg: "3" }}
        gap="4"
        mb="6"
        width="100%"
      >
        <Card asChild className="app-feature-card" size="2">
          <a
            aria-label="Open React documentation"
            href="https://react.dev/"
            rel="noopener noreferrer"
            target="_blank"
            title="Open React documentation"
          >
            <Flex direction="column" gap="3" height="100%">
              <Flex align="center" gap="3">
                <img alt="" height="56" src={reactLogo} width="56" />
                <Heading as="h3" mb="0" size="4">
                  React documentation
                </Heading>
              </Flex>
              <Text as="p" mb="0">
                Official React docs — a sample external project card you can
                replace with your own app.
              </Text>
              <Flex aria-hidden justify="end" mt="auto">
                <ExternalLinkIcon />
              </Flex>
            </Flex>
          </a>
        </Card>
        <ComingSoonCard />
        <ComingSoonCard />
      </Grid>
    </section>
  );
};
