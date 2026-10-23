/**
 * Post shapes matching backend ``PostRead`` / list responses.
 *
 * Datetimes arrive as ISO-8601 strings in the app timezone (see backend
 * ``settings.timezone`` / ``PostRead`` serializers).
 */

/** Single post from ``GET /api/posts/{id}`` or a list item. */
export type Post = {
  id: number;
  title: string;
  content: string;
  created_at: string;
  updated_at: string;
};

/** Raw JSON body from ``GET /api/posts`` (``PostsListResponse``). */
export type PostsListResponse = {
  items: Post[];
  total: number;
};

/**
 * One page of posts from ``fetchPosts``, with client pagination meta.
 *
 * ``totalPages`` comes from ``total / pageSize``. Controls hide when
 * ``totalPages <= 1``.
 */
export type PostsPage = {
  posts: Post[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
};
