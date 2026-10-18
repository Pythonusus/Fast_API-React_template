/**
 * Posts page: grid with minimal load-more + numbered pagination.
 *
 * The shell is prerendered at build time. After hydration, ``usePosts``
 * loads the first page. Numbered controls replace the grid; Show more
 * appends. ``PostsNavigate`` hides entirely when there is only one page.
 *
 * Flow:
 *   Build      → Static HTML with shell
 *   Page load  → User sees prerendered content immediately
 *   Hydration  → Hook fetches page 1 from the backend
 *   On error   → Shows error message; the app does not crash entirely
 */
import { Grid, Heading, Section, Text } from "@radix-ui/themes";
import type { MetaFunction } from "react-router";

import { START_BACKEND_SERVER_HINT } from "~/common-texts/errors";
import { PostsNavigate } from "~/components/posts-navigate";
import { CardBase } from "~/components/ui/card-base";
import { usePosts } from "~/hooks/use-posts";

/**
 * Function to set the meta tags for the posts page.
 * "meta" is a required name by React Router.
 * You can't name this function anything else.
 */
export const meta: MetaFunction = () => [
  { title: "Posts | FastAPI + React Template" },
  {
    name: "description",
    content: "Posts grid page with pagination.",
  },
];

const formatPostDate = (iso: string): string => {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) {
    return iso;
  }

  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
};

/** Posts route component. */
const PostsRoute = () => {
  const {
    posts,
    page,
    total,
    totalPages,
    rangeFrom,
    rangeTo,
    hasNextPage,
    hasPreviousPage,
    isLoading,
    isLoadingMore,
    error,
    goToPage,
    goToPreviousPage,
    goToNextPage,
    loadMore,
  } = usePosts();

  const controlsDisabled = isLoading || isLoadingMore;

  return (
    <Section p="0">
      <header>
        <Heading as="h1" mb="2" size="8">
          Posts
        </Heading>
        <Text as="p" color="gray" mb="6" size="3">
          Browse posts with page numbers, or append the next page with Show
          more.
        </Text>
      </header>

      {error ? (
        <Text as="p" color="red" mb="4" size="3">
          {error} {START_BACKEND_SERVER_HINT}
        </Text>
      ) : null}

      {isLoading && posts.length === 0 ? (
        <Text as="p" color="gray" mb="4" size="3">
          Loading…
        </Text>
      ) : null}

      {!isLoading && !error && posts.length === 0 ? (
        <Text as="p" color="gray" mb="4" size="3">
          No posts yet.
        </Text>
      ) : null}

      {posts.length > 0 ? (
        <Grid
          columns={{ initial: "1", sm: "2", lg: "3" }}
          gap="4"
          mb="6"
          width="100%"
        >
          {posts.map((post) => (
            <CardBase key={post.id}>
              <Heading as="h2" mb="2" size="4">
                {post.title}
              </Heading>
              <Text as="p" color="gray" mb="0" size="2">
                {formatPostDate(post.created_at)}
              </Text>
            </CardBase>
          ))}
        </Grid>
      ) : null}

      <PostsNavigate
        disabled={controlsDisabled}
        hasNextPage={hasNextPage}
        hasPreviousPage={hasPreviousPage}
        isLoadingMore={isLoadingMore}
        onGoToPage={(nextPage) => {
          void goToPage(nextPage);
        }}
        onLoadMore={() => {
          void loadMore();
        }}
        onNextPage={goToNextPage}
        onPreviousPage={goToPreviousPage}
        page={page}
        rangeFrom={rangeFrom}
        rangeTo={rangeTo}
        total={total}
        totalPages={totalPages}
      />
    </Section>
  );
};

export default PostsRoute;
