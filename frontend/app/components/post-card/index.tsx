/**
 * One post in the posts grid.
 */
import { Box, Flex, Heading, Text } from "@radix-ui/themes";
import type { CSSProperties } from "react";
import { Link } from "react-router";

import { PostContent } from "~/components/post-content";
import { CardBase } from "~/components/ui/card-base";
import { ShareButton } from "~/components/ui/share-button";
import type { Post } from "~/types/posts";
import { formatDate } from "~/utils/format-date";

import "./post-card.css";

type PostCardProps = {
  post: Post;
  /** Stagger index for cards appended with “Show more”. */
  enterIndex?: number;
};

export const PostCard = ({ post, enterIndex }: PostCardProps) => {
  const isEntering = enterIndex !== undefined;

  return (
    <CardBase
      className={["app-posts-card", isEntering ? "app-posts-card-enter" : ""]
        .filter(Boolean)
        .join(" ")}
      style={
        isEntering
          ? ({ "--app-enter-index": enterIndex } as CSSProperties)
          : undefined
      }
    >
      <Heading as="h2" className="app-posts-card-title" mb="3" size="4">
        <Link className="app-posts-card-link" to={`/posts/${post.id}`}>
          {post.title}
        </Link>
      </Heading>
      {post.cover ? (
        <Box mb="3">
          <img
            alt=""
            className="app-posts-card-cover"
            loading="lazy"
            src={post.cover.url}
          />
        </Box>
      ) : null}
      <PostContent className="app-posts-card-body" html={post.content} />
      <Flex align="center" justify="between" mt="3" width="100%">
        <ShareButton
          className="app-posts-card-share"
          size="1"
          title={post.title}
          url={`/posts/${post.id}`}
        />
        <Text as="p" color="gray" size="2">
          <time dateTime={post.created_at}>{formatDate(post.created_at)}</time>
        </Text>
      </Flex>
    </CardBase>
  );
};
