/**
 * About page template — component-level fetch pattern.
 *
 * This route has no `clientLoader` and no `HydrateFallback`. The full page
 * structure is prerendered into static HTML at build time. Dynamic content is
 * fetched inside `AboutBackendMessageCard` after hydration via `fetchAbout()`.
 *
 * Compare with `routes/home.tsx`, which uses the route-level `clientLoader`
 * pattern instead.
 */
import { Heading, Section, Text } from "@radix-ui/themes";
import type { MetaFunction } from "react-router";

import { AboutBackendMessageCard } from "~/components/about-message-card";

/**
 * Function to set the meta tags for the about page.
 * "meta" is a required name by React Router.
 * You can't name this function anything else.
 */
export const meta: MetaFunction = () => [
  { title: "About | FastAPI + React Template" },
  {
    name: "description",
    content:
      "Starter about page that demonstrates SEO-friendly semantic sections and backend-connected text.",
  },
];

/**
 * About route component.
 *
 * No loader exports are needed because this page does not fetch data at the
 * route level. React Router prerenders this component as-is; the only client
 * request happens inside `AboutBackendMessageCard` after mount.
 *
 * Static content below is included in prerendered HTML. The backend message
 * card manages its own loading and error state internally.
 */
const AboutRoute = () => {
  return (
    <Section p="0">
      <header>
        <Heading as="h1" mb="2" size="8">
          About
        </Heading>
        <Text as="p" color="gray" mb="6" size="3">
          This template keeps structure simple and explains where static content
          and dynamic content belong.
        </Text>
      </header>

      <AboutBackendMessageCard />
    </Section>
  );
};

export default AboutRoute;
