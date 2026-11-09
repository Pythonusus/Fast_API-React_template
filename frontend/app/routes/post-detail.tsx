/**
 * Post detail page (``/posts/:postId``).
 *
 * Not prerendered: the id is not known at build time, so the SPA fallback
 * serves the shell and ``usePost`` loads the post after hydration.
 *
 * States: loading, not found (invalid id or backend 404), error, and loaded.
 */
import { ArrowLeftIcon } from "@radix-ui/react-icons";
import { Card, Flex, Heading, Section, Text } from "@radix-ui/themes";
import type { MetaFunction } from "react-router";
import { Link, useParams } from "react-router";

import { BACKEND_UNAVAILABLE_HINT } from "~/common-texts/errors";
import { LOADING } from "~/common-texts/ui";
import { PostContent } from "~/components/post-content";
import { PostGallery } from "~/components/post-gallery";
import { ShareButton } from "~/components/ui/share-button";
import { usePost } from "~/hooks/use-post";
import { formatDate } from "~/utils/format-date";

import "./post-detail.css";

/**
 * Function to set the meta tags for the post detail page.
 * "meta" is a required name by React Router.
 */
export const meta: MetaFunction = () => [
  { title: "Post | FastAPI + React Template" },
  {
    name: "description",
    content: "Read a single post.",
  },
];

/** Date line and share control under the body and gallery. */
const PostDetailFooter = ({
  createdAt,
  title,
  updatedAt,
}: {
  createdAt: string;
  title: string;
  updatedAt: string;
}) => (
  <Flex align="center" justify="between" mt="5" width="100%">
    <ShareButton title={title} />
    <Text as="p" color="gray" size="2">
      <time dateTime={createdAt}>{formatDate(createdAt)}</time>
      {updatedAt === createdAt ? null : <> · Updated {formatDate(updatedAt)}</>}
    </Text>
  </Flex>
);

/** Parse the URL segment; ``null`` unless it is a positive integer. */
const parsePostId = (value: string | undefined): number | null => {
  if (!value || !/^\d+$/.test(value)) {
    return null;
  }

  const id = Number(value);

  return Number.isSafeInteger(id) && id > 0 ? id : null;
};

/** Post detail route component. */
const PostDetailRoute = () => {
  const { postId: postIdParam } = useParams();
  const { post, isLoading, notFound, error } = usePost(
    parsePostId(postIdParam),
  );

  return (
    <Section p="0">
      <Link className="app-post-detail-back" to="/posts">
        <Flex align="center" gap="1">
          <ArrowLeftIcon aria-hidden />
          <Text size="2">All posts</Text>
        </Flex>
      </Link>

      {isLoading ? (
        <Text as="p" color="gray" size="3">
          {LOADING}
        </Text>
      ) : null}

      {notFound ? (
        <>
          <Heading as="h1" mb="2" size="8">
            Post not found
          </Heading>
          <Text as="p" color="gray" size="3">
            This post does not exist or was removed.
          </Text>
        </>
      ) : null}

      {error ? (
        <Text as="p" color="red" size="3">
          {error} {BACKEND_UNAVAILABLE_HINT}
        </Text>
      ) : null}

      {post ? (
        <Card asChild size="3">
          <article className="app-post-detail-article">
            <header className="app-post-detail-header">
              <Heading as="h1" className="app-post-detail-title" size="8">
                {post.title}
              </Heading>
            </header>
            <PostContent html={post.content} />
            <PostGallery media={post.media} />
            <PostDetailFooter
              createdAt={post.created_at}
              title={post.title}
              updatedAt={post.updated_at}
            />
          </article>
        </Card>
      ) : null}
    </Section>
  );
};

export default PostDetailRoute;
