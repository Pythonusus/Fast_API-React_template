/**
 * Fetch helpers for public posts endpoints.
 *
 * Create / update / delete stay admin-only;
 * This module only covers read APIs used by the React app.
 *
 * List pagination maps 1-based ``page`` to backend ``skip`` / ``limit``
 * (see ``backend/app/routers/posts.py``). Relative ``/api/...`` URLs work via
 * Vite proxy in development and Nginx in production.
 *
 * UI modes both use ``fetchPosts``; see ``usePosts``:
 * - Page traversal — replace the list with ``goToPage`` / numbered pages.
 * - Load more — append the next page with ``loadMore``.
 */

import { fetchDataError } from "~/common-texts/errors";
import { POSTS_MAX_PAGE_SIZE, POSTS_PAGE_SIZE } from "~/config";
import type {
  Post,
  PostsListQuery,
  PostsListResponse,
  PostsPage,
} from "~/types/posts";
import { DEFAULT_POSTS_ORDER_BY } from "~/types/posts";

export type FetchPostsOptions = {
  /** 1-based page index. Defaults to 1. */
  page?: number;
  /** Rows per page. Defaults to ``POSTS_PAGE_SIZE``. Capped at ``POSTS_MAX_PAGE_SIZE``. */
  pageSize?: number;
  /** Search / sort / filter (backend fastapi-filter params). */
  query?: Partial<PostsListQuery>;
};

/**
 * Fetch one page of posts.
 *
 * ``GET /api/posts?skip=&limit=&search=&order_by=&created_at__gte=&created_at__lte=``
 */
export const fetchPosts = async ({
  page = 1,
  pageSize = POSTS_PAGE_SIZE,
  query = {},
}: FetchPostsOptions = {}): Promise<PostsPage> => {
  const safePage = Math.max(1, Math.trunc(page));
  const safePageSize = Math.min(
    POSTS_MAX_PAGE_SIZE,
    Math.max(1, Math.trunc(pageSize)),
  );
  const skip = (safePage - 1) * safePageSize;

  const params = new URLSearchParams({
    skip: String(skip),
    limit: String(safePageSize),
  });

  const search = query.search?.trim();
  if (search) {
    params.set("search", search);
  }

  const orderBy = query.orderBy?.trim() || DEFAULT_POSTS_ORDER_BY;
  params.set("order_by", orderBy);

  const createdAtGte = query.createdAtGte?.trim();
  if (createdAtGte) {
    params.set("created_at__gte", createdAtGte);
  }

  const createdAtLte = query.createdAtLte?.trim();
  if (createdAtLte) {
    params.set("created_at__lte", createdAtLte);
  }

  const response = await fetch(`/api/posts?${params}`);

  if (!response.ok) {
    throw new Error(fetchDataError(response.status));
  }

  const data = (await response.json()) as PostsListResponse;
  const totalPages = Math.ceil(data.total / safePageSize);

  return {
    posts: data.items,
    page: safePage,
    pageSize: safePageSize,
    total: data.total,
    totalPages,
    hasNextPage: safePage < totalPages,
    hasPreviousPage: safePage > 1,
  };
};

/**
 * Fetch a single post by id.
 *
 * ``GET /api/posts/{post_id}``
 */
export const fetchPost = async (postId: number): Promise<Post> => {
  const response = await fetch(`/api/posts/${postId}`);

  if (!response.ok) {
    throw new Error(fetchDataError(response.status));
  }

  return response.json() as Promise<Post>;
};
