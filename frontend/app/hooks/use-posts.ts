/**
 * Posts list state: page traversal (replace) and load-more (append).
 *
 * Both modes call the same ``fetchPosts`` helper; they differ only in how
 * results update local state:
 * - ``goToPage`` — replace the list with that page (numbers / Prev / Next).
 * - ``loadMore`` — append the next page under the current items.
 * - ``applyQuery`` — set search/sort/filter and reload page 1.
 *
 * Extracted from the route because replace + append, loading flags, and
 * errors are easier to reason about (and reuse) outside the JSX.
 */
import { useCallback, useEffect, useState } from "react";

import { fetchPosts } from "~/api/posts";
import { BACKEND_LOAD_FAILED } from "~/common-texts/errors";
import { POSTS_PAGE_SIZE } from "~/config";
import { APP_DURATION_ENTER_MS, APP_STAGGER_MS } from "~/styles/motion";
import type { Post, PostsListQuery, PostsPage } from "~/types/posts";
import { EMPTY_POSTS_QUERY } from "~/types/posts";

export type UsePostsOptions = {
  /** Rows per request. Defaults to ``POSTS_PAGE_SIZE``. */
  pageSize?: number;
};

export const usePosts = ({
  pageSize = POSTS_PAGE_SIZE,
}: UsePostsOptions = {}) => {
  const [posts, setPosts] = useState<Post[]>([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  /** 1-based index of the first post currently shown (for “n–m of total”). */
  const [rangeFrom, setRangeFrom] = useState(0);
  const [hasNextPage, setHasNextPage] = useState(false);
  const [hasPreviousPage, setHasPreviousPage] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState<PostsListQuery>(EMPTY_POSTS_QUERY);
  /** Post ids just appended by ``loadMore`` — used for enter animation. */
  const [enteringPostIds, setEnteringPostIds] = useState<number[]>([]);

  const applyPageMeta = (result: PostsPage) => {
    setPage(result.page);
    setTotal(result.total);
    setTotalPages(result.totalPages);
    setHasNextPage(result.hasNextPage);
    setHasPreviousPage(result.hasPreviousPage);
  };

  /** Replace the list with posts for ``nextPage`` (page traversal). */
  const goToPage = useCallback(
    async (nextPage: number) => {
      try {
        setIsLoading(true);
        setError(null);
        const result = await fetchPosts({
          page: nextPage,
          pageSize,
          query,
        });
        setEnteringPostIds([]);
        setPosts(result.posts);
        setRangeFrom(
          result.posts.length === 0
            ? 0
            : (result.page - 1) * result.pageSize + 1,
        );
        applyPageMeta(result);
      } catch (error_) {
        setError(
          error_ instanceof Error ? error_.message : BACKEND_LOAD_FAILED,
        );
      } finally {
        setIsLoading(false);
      }
    },
    [pageSize, query],
  );

  /**
   * Apply search / sort / filter and reload from page 1.
   *
   * Called by the posts toolbar when the user clicks Apply or Clear.
   */
  const applyQuery = useCallback(
    async (nextQuery: PostsListQuery) => {
      setQuery(nextQuery);
      try {
        setIsLoading(true);
        setError(null);
        const result = await fetchPosts({
          page: 1,
          pageSize,
          query: nextQuery,
        });
        setEnteringPostIds([]);
        setPosts(result.posts);
        setRangeFrom(result.posts.length === 0 ? 0 : 1);
        applyPageMeta(result);
      } catch (error_) {
        setError(
          error_ instanceof Error ? error_.message : BACKEND_LOAD_FAILED,
        );
      } finally {
        setIsLoading(false);
      }
    },
    [pageSize],
  );

  /** Append the next page under the current list (load more). */
  const loadMore = useCallback(async () => {
    if (!hasNextPage || isLoading || isLoadingMore) {
      return;
    }

    try {
      setIsLoadingMore(true);
      setError(null);
      const result = await fetchPosts({
        page: page + 1,
        pageSize,
        query,
      });
      setEnteringPostIds(result.posts.map((post) => post.id));
      setPosts((current) => [...current, ...result.posts]);
      // ``rangeFrom`` stays put so the label covers the full loaded window.
      applyPageMeta(result);
    } catch (error_) {
      setError(error_ instanceof Error ? error_.message : BACKEND_LOAD_FAILED);
    } finally {
      setIsLoadingMore(false);
    }
  }, [hasNextPage, isLoading, isLoadingMore, page, pageSize, query]);

  // Drop enter markers after the last staggered card finishes animating.
  useEffect(() => {
    if (enteringPostIds.length === 0) {
      return;
    }

    const timer = globalThis.setTimeout(
      () => {
        setEnteringPostIds([]);
      },
      APP_DURATION_ENTER_MS +
        Math.max(0, enteringPostIds.length - 1) * APP_STAGGER_MS,
    );
    return () => {
      globalThis.clearTimeout(timer);
    };
  }, [enteringPostIds]);

  const goToPreviousPage = useCallback(() => {
    if (hasPreviousPage && !isLoading && !isLoadingMore) {
      void goToPage(page - 1);
    }
  }, [goToPage, hasPreviousPage, isLoading, isLoadingMore, page]);

  const goToNextPage = useCallback(() => {
    if (hasNextPage && !isLoading && !isLoadingMore) {
      void goToPage(page + 1);
    }
  }, [goToPage, hasNextPage, isLoading, isLoadingMore, page]);

  // Initial load: ``isLoading`` starts true, so only update state after await.
  useEffect(() => {
    const loadFirstPage = async () => {
      try {
        const result = await fetchPosts({
          page: 1,
          pageSize,
          query: EMPTY_POSTS_QUERY,
        });
        setEnteringPostIds([]);
        setPosts(result.posts);
        setRangeFrom(result.posts.length === 0 ? 0 : 1);
        applyPageMeta(result);
        setError(null);
      } catch (error_) {
        setError(
          error_ instanceof Error ? error_.message : BACKEND_LOAD_FAILED,
        );
      } finally {
        setIsLoading(false);
      }
    };

    void loadFirstPage();
  }, [pageSize]);

  const rangeTo =
    rangeFrom === 0 || posts.length === 0 ? 0 : rangeFrom + posts.length - 1;

  const hasActiveQuery =
    Boolean(query.search.trim()) ||
    Boolean(query.createdAtGte.trim()) ||
    Boolean(query.createdAtLte.trim()) ||
    query.orderBy !== EMPTY_POSTS_QUERY.orderBy;

  return {
    posts,
    page,
    pageSize,
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
  };
};
