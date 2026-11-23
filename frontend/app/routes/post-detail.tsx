/**
 * Post detail page (``/posts/:postId``).
 *
 * Not prerendered: the id is not known at build time, so the SPA fallback
 * serves the shell and ``usePost`` loads the post after hydration.
 *
 * Admin preview opens this same route with ``?draft=``. The draft is the
 * unsaved form, stored in ``localStorage``, and replaces the fetched post.
 *
 * States: loading, not found (invalid id or backend 404), error, and loaded.
 */
import { Heading, Section, Text } from "@radix-ui/themes";
import type { MetaFunction } from "react-router";
import { useParams, useSearchParams } from "react-router";

import { PostArticle, PostBackLink } from "~/components/post-article";
import { usePost } from "~/hooks/use-post";
import { loadPostPreview } from "~/utils/post-preview";

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

/** Parse the URL segment; ``null`` unless it is a positive integer. */
const parsePostId = (value: string | undefined): number | null => {
  if (!value || !/^\d+$/.test(value)) {
    return null;
  }

  const id = Number(value);

  return Number.isSafeInteger(id) && id > 0 ? id : null;
};

const PREVIEW_MISSING =
  "This preview is missing or out of date. Open it again from the admin post page.";

/** Post detail route component. */
const PostDetailRoute = () => {
  const { postId: postIdParam } = useParams();
  const [params] = useSearchParams();
  const draftId = params.get("draft");
  const preview = draftId ? loadPostPreview(draftId) : null;
  const {
    post: loaded,
    isLoading,
    notFound,
    error,
  } = usePost(draftId ? null : parsePostId(postIdParam));
  const post = preview ?? loaded;

  return (
    <Section p="0">
      <PostBackLink />
      {isLoading && !draftId ? (
        <Text as="p" color="gray" size="3">
          Loading…
        </Text>
      ) : null}

      {draftId && !preview ? (
        <Text as="p" color="gray" size="3">
          {PREVIEW_MISSING}
        </Text>
      ) : null}

      {notFound && !draftId ? (
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
          {error} We know about the problem and are working on it.
        </Text>
      ) : null}

      {post ? <PostArticle post={post} /> : null}
    </Section>
  );
};

export default PostDetailRoute;
