/**
 * Post shapes matching backend ``PostRead`` / list responses.
 *
 * Datetimes arrive as ISO-8601 strings in the app timezone (see backend
 * ``settings.timezone`` / ``PostRead`` serializers).
 */
import type { DateFilterPreset } from "~/components/ui/filter-toolbar/date-range";

/** Sort values the posts list accepts (fastapi-filter ``order_by``). */
export const POSTS_ORDER_BY_VALUES = [
  "-created_at",
  "created_at",
  "title",
  "-title",
] as const;

/** One entry of ``POSTS_ORDER_BY_VALUES``. */
export type PostsOrderBy = (typeof POSTS_ORDER_BY_VALUES)[number];

/** Default ``order_by`` for list requests (newest first). */
export const DEFAULT_POSTS_ORDER_BY: PostsOrderBy = "-created_at";

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
 * Search / sort / filter sent to ``GET /api/posts`` (fastapi-filter).
 *
 * - ``search`` — free-text search
 * - ``orderBy`` — e.g. ``-created_at`` or ``title``
 * - ``createdAtGte`` / ``createdAtLte`` — inclusive date range
 */
export type PostsListQuery = {
  search: string;
  orderBy: string;
  createdAtGte: string;
  createdAtLte: string;
};

/**
 * Posts filter shown in the toolbar and stored in the page URL.
 *
 * API date bounds are derived from ``datePreset`` / ``dateFrom`` / ``dateTo``
 * when the list is fetched.
 */
export type PostsFilter = {
  search: string;
  orderBy: PostsOrderBy;
  datePreset: DateFilterPreset;
  dateFrom: string;
  dateTo: string;
};

export const EMPTY_POSTS_FILTER: PostsFilter = {
  search: "",
  orderBy: DEFAULT_POSTS_ORDER_BY,
  datePreset: "any",
  dateFrom: "",
  dateTo: "",
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
