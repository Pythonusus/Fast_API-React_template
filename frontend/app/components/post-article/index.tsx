/**
 * The public post page: title, body, gallery, date.
 *
 * The detail route renders this for a saved post and for an admin draft.
 */
import { ArrowLeftIcon } from "@radix-ui/react-icons";
import { Card, Flex, Heading, Text } from "@radix-ui/themes";
import { Link } from "react-router";

import { PostContent } from "~/components/post-content";
import { PostGallery } from "~/components/post-gallery";
import { ShareButton } from "~/components/ui/share-button";
import type { Post } from "~/types/posts";
import { formatDate } from "~/utils/format-date";

import "./post-article.css";

type PostArticleProps = {
  post: Post;
};

export const PostBackLink = () => (
  <Link className="app-post-detail-back" to="/posts">
    <Flex align="center" gap="1">
      <ArrowLeftIcon aria-hidden />
      <Text size="2">All posts</Text>
    </Flex>
  </Link>
);

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

export const PostArticle = ({ post }: PostArticleProps) => {
  const showGallery = post.show_gallery && post.media.length > 0;

  return (
    <Card asChild size="3">
      <article className="app-post-detail-article">
        <header className="app-post-detail-header">
          <Heading as="h1" className="app-post-detail-title" size="8">
            {post.title}
          </Heading>
        </header>
        <PostContent html={post.content} />
        {showGallery ? (
          <Card className="app-post-gallery-card" mt="5" variant="surface">
            <PostGallery media={post.media} />
          </Card>
        ) : null}
        <PostDetailFooter
          createdAt={post.created_at}
          title={post.title}
          updatedAt={post.updated_at}
        />
      </article>
    </Card>
  );
};
