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

/** Russian count for the gallery heading: 1 файл, 2 файла, 5 файлов. */
const attachmentCount = (count: number): string => {
  const mod10 = count % 10;
  const mod100 = count % 100;
  let word = "файлов";

  if (mod10 === 1 && mod100 !== 11) {
    word = "файл";
  } else if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) {
    word = "файла";
  }

  return `${count} ${word}`;
};

const PostDetailFooter = ({
  title,
  updatedAt,
}: {
  title: string;
  updatedAt: string;
}) => (
  <Flex align="center" justify="between" mt="5" width="100%">
    <ShareButton title={title} />
    <Text as="p" color="gray" size="2">
      <time dateTime={updatedAt}>{formatDate(updatedAt)}</time>
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
          <Flex direction="column" gap="3" mt="6">
            <Flex align="baseline" gap="3" justify="between" wrap="wrap">
              <Heading as="h2" id="post-gallery-heading" size="4">
                Прикрепленные медиа
              </Heading>
              <Text color="gray" size="2">
                {attachmentCount(post.media.length)}
              </Text>
            </Flex>
            <Card className="app-post-gallery-card" variant="surface">
              <PostGallery media={post.media} />
            </Card>
          </Flex>
        ) : null}
        <PostDetailFooter title={post.title} updatedAt={post.updated_at} />
      </article>
    </Card>
  );
};
