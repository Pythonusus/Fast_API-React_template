/**
 * Posts page: toolbar (search/sort/filter) + grid + pagination.
 *
 * The shell is prerendered at build time. After hydration, ``usePosts``
 * loads the first page. Numbered controls replace the grid; Show more
 * appends. ``Pagination`` hides entirely when there is only one page.
 *
 * Flow:
 *   Build      → Static HTML with shell
 *   Page load  → User sees prerendered content immediately
 *   Hydration  → Hook fetches page 1 from the backend
 *   On error   → Shows error message; the app does not crash entirely
 */
import { Grid, Heading, Section, Text } from "@radix-ui/themes";
import type { CSSProperties } from "react";
import type { MetaFunction } from "react-router";

import { START_BACKEND_SERVER_HINT } from "~/common-texts/errors";
import { PostContent } from "~/components/post-content";
import { PostsToolbar } from "~/components/posts-toolbar";
import { CardBase } from "~/components/ui/card-base";
import { Pagination } from "~/components/ui/pagination";
import { usePosts } from "~/hooks/use-posts";

import "./posts.css";

/**
 * Function to set the meta tags for the posts page.
 * "meta" is a required name by React Router.
 * You can't name this function anything else.
 */
export const meta: MetaFunction = () => [
  { title: "Posts | FastAPI + React Template" },
  {
    name: "description",
    content: "Posts grid page with search, sort, filters, and pagination.",
  },
];

const formatPostDate = (iso: string): string => {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) {
    return iso;
  }

  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
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
    query,
    hasActiveQuery,
    enteringPostIds,
    goToPage,
    goToPreviousPage,
    goToNextPage,
    loadMore,
    applyQuery,
  } = usePosts();

  const controlsDisabled = isLoading || isLoadingMore;
  const enteringIndexById = new Map(
    enteringPostIds.map((id, index) => [id, index]),
  );

  return (
    <Section p="0">
      <header className="app-posts-header">
        <Heading as="h1" className="app-posts-header-title" size="8">
          Posts
        </Heading>
        <Text as="p" className="app-posts-header-desc" color="gray" size="3">
          Browse posts. Use the icons to search, sort, or pick a date range.
        </Text>
        <PostsToolbar
          disabled={controlsDisabled}
          onApply={(nextQuery) => {
            void applyQuery(nextQuery);
          }}
          query={query}
        />
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
          {hasActiveQuery
            ? "No posts match your search or filters."
            : "No posts yet."}
        </Text>
      ) : null}

      {posts.length > 0 ? (
        <Grid
          columns={{ initial: "1", sm: "2", lg: "3" }}
          gap="4"
          mb="6"
          width="100%"
        >
          {posts.map((post) => {
            const enterIndex = enteringIndexById.get(post.id);
            const isEntering = enterIndex !== undefined;

            return (
              <CardBase
                className={[
                  "app-posts-card",
                  isEntering ? "app-posts-card-enter" : "",
                ]
                  .filter(Boolean)
                  .join(" ")}
                key={post.id}
                style={
                  isEntering
                    ? ({
                        "--app-enter-index": enterIndex,
                      } as CSSProperties)
                    : undefined
                }
              >
                <Heading
                  as="h2"
                  className="app-posts-card-title"
                  mb="2"
                  size="4"
                >
                  {post.title}
                </Heading>
                <Text as="p" color="gray" mb="3" size="2">
                  {formatPostDate(post.created_at)}
                </Text>
                <PostContent
                  className="app-posts-card-body"
                  html={post.content}
                />
              </CardBase>
            );
          })}
        </Grid>
      ) : null}

      <Pagination
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
