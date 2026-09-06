/**
 * Home page template — route-level `clientLoader` pattern.
 *
 * ## Two ways to fetch backend data in this template
 *
 * ### 1. Route-level fetch (`clientLoader`) — this file (Home)
 *
 * - Export `clientLoader` with `{ hydrate: true }` to fetch in the browser after hydration.
 * - Export `HydrateFallback` for the HTML prerendered at build time while the loader runs.
 * - Pass loader data into presentational components via `useLoaderData`.
 * - Best when the route should wait for data before rendering, or when several
 *   components share the same loader result.
 *
 * Flow:
 *   Build      → `HydrateFallback` HTML is prerendered
 *   Page load  → User sees fallback immediately
 *   Hydration  → `clientLoader` runs, then `HomeRoute` replaces the fallback
 *
 * ### 2. Component-level fetch — see `routes/about.tsx`
 *
 * - No `clientLoader`, no `HydrateFallback`. The route is fully static HTML.
 * - A component (e.g. `AboutBackendMessageCard`) calls `fetchAbout()` on mount.
 * - Best when most of the page is static and only a section needs dynamic data.
 *   Other sections (like forms) can be interactive immediately after hydration.
 *
 * Flow:
 *   Build      → Full page HTML is prerendered
 *   Page load  → User sees the complete layout immediately
 *   Hydration  → Only the dynamic component fetches and updates its own slot
 *
 * ### User-triggered requests (both patterns)
 *
 * Forms and buttons that fetch on click (e.g. `MirrorExampleCard`) do not need
 * a loader at all — they work the same in either pattern.
 */
import { Flex, Heading, Section, Text } from "@radix-ui/themes";
import type { MetaFunction } from "react-router";
import { useLoaderData } from "react-router";

import { fetchHello } from "~/api/example-api";
import {
  BACKEND_LOAD_FAILED,
  BACKEND_UNAVAILABLE,
} from "~/common-texts/errors";
import { BackendMessageCard } from "~/components/home-message-card";
import { MirrorExampleCard } from "~/components/mirror-example-card";

type HomeLoaderData = {
  helloMessage: string;
  helloError: string | null;
};

type HomePageProps = HomeLoaderData & {
  isLoading?: boolean;
};

/**
 * Function to set the meta tags for the home page.
 * "meta" is a required name by React Router.
 * You can't name this function anything else.
 */
export const meta: MetaFunction = () => [
  { title: "Home | FastAPI + React Template" },
  {
    name: "description",
    content:
      "Starter home page that demonstrates SEO-friendly structure, client-side data fetching, and a mirror API call.",
  },
];

/**
 * Function to load dynamic data for the home page.
 * "clientLoader" is a required name by React Router.
 * You can't name this function anything else.
 *
 * Errors are handled inside the loader function, not thrown upward.
 * If fetchHello() throws (network failure, 500, backend down), the loader
 * still resolves successfully with fallback data instead of crashing the route.
 *
 * You do not need it if no dynamic data is loaded on the page.
 *
 * If you are using it, you should also add `HydrateFallback` to the route.
 */
export const clientLoader = Object.assign(
  async (): Promise<HomeLoaderData> => {
    try {
      const { message } = await fetchHello();
      return { helloError: null, helloMessage: message };
    } catch (error) {
      return {
        helloError:
          error instanceof Error ? error.message : BACKEND_LOAD_FAILED,
        helloMessage: BACKEND_UNAVAILABLE,
      };
    }
  },
  /* This tells React Router not to run this function during build time and
   * run it on client-side after hydration.
   */
  { hydrate: true as const },
);

/**
 * Shared Home page UI used by both `HydrateFallback` and `HomeRoute`.
 * `isLoading` switches between the prerender placeholder and live content.
 */
const HomePage = ({
  helloMessage,
  helloError,
  isLoading = false,
}: HomePageProps) => {
  return (
    <Section p="0">
      <header>
        <Heading as="h1" mb="2" size="8">
          Home
        </Heading>
        <Text as="p" color="gray" mb="6" size="3">
          Use this page as a starting point for landing sections, feature
          highlights, and API-connected UI.
        </Text>
      </header>

      <Flex direction="column" gap="4">
        <BackendMessageCard
          error={helloError}
          isLoading={isLoading}
          message={helloMessage}
        />
        <MirrorExampleCard isLoading={isLoading} />
      </Flex>
    </Section>
  );
};

/**
 * Prerendered placeholder while `clientLoader` runs after hydration.
 * React Router inlines this into static HTML at build time.
 * It is needed to prevent the page from flashing blank during hydration.
 *
 * "HydrateFallback" is a required export name — React Router looks it up by name.
 *
 * This replaces the entire route until `clientLoader` finishes — not individual components.
 * To prerender static shell + load dynamic parts separately, fetch inside a component on mount.
 * See `routes/about.tsx`.
 */
export const HydrateFallback = () => (
  <HomePage
    helloError={null}
    helloMessage="Loading page content..."
    isLoading={true}
  />
);

/**
 * Home route component rendered after hydration.
 * Reads data from `clientLoader` via `useLoaderData` (fetched in the browser, not on the server).
 */
const HomeRoute = () => {
  const { helloError, helloMessage } = useLoaderData<typeof clientLoader>();

  return (
    <HomePage
      helloError={helloError}
      helloMessage={helloMessage}
      isLoading={false}
    />
  );
};

export default HomeRoute;
