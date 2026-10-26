/**
 * Posts list state: page traversal (replace) and load-more (append).
 *
 * The applied filter is the page URL (``search``, ``order_by``,
 * ``date_preset``, and custom ``date_from`` / ``date_to``). A reload,
 * bookmark, or shared link opens the same view. Relative date presets are
 * stored by name and recomputed on each load.
 *
 * Both modes call the same ``fetchPosts`` helper; they differ only in how
 * results update local state:
 * - ``goToPage`` — replace the list with that page (numbers / Prev / Next).
 * - ``loadMore`` — append the next page under the current items.
 * - ``applyQuery`` — write the filter to the URL; the load effect then
 *   reloads page 1.
 *
 * Extracted from the route because replace + append, loading flags, and
 * errors are easier to reason about (and reuse) outside the JSX.
 */
import { useQueryStates } from "nuqs";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";

import { fetchPosts } from "~/api/posts";
import { BACKEND_LOAD_FAILED } from "~/common-texts/errors";
import {
  hasActivePostsQuery,
  postsQueryParsers,
  postsQueryUrlKeys,
  toPostsListQuery,
} from "~/components/posts-toolbar/query-params";
import { POSTS_PAGE_SIZE } from "~/config";
import { APP_DURATION_ENTER_MS, APP_STAGGER_MS } from "~/styles/motion";
import type { Post, PostsFilter, PostsPage } from "~/types/posts";
import { EMPTY_POSTS_FILTER } from "~/types/posts";

export type UsePostsOptions = {
  /** Rows per request. Defaults to ``POSTS_PAGE_SIZE``. */
  pageSize?: number;
};

/** Hydration subscribe: the snapshot never changes, so there is nothing to hear. */
const unsubscribeHydration = () => {};

const subscribeHydration = () => unsubscribeHydration;

const hydratedOnClient = () => true;

const hydratedOnServer = () => false;

/**
 * False during prerender / the hydration pass so the shell matches the
 * static HTML, then true on the client where ``window.location`` is real.
 */
const useIsHydrated = (): boolean =>
  useSyncExternalStore(subscribeHydration, hydratedOnClient, hydratedOnServer);

export const usePosts = ({
  pageSize = POSTS_PAGE_SIZE,
}: UsePostsOptions = {}) => {
  const [queryParams, setQueryParams] = useQueryStates(postsQueryParsers, {
    history: "push",
    urlKeys: postsQueryUrlKeys,
  });
  const { search, orderBy, datePreset, dateFrom, dateTo } = queryParams;
  const filterKey = [search, orderBy, datePreset, dateFrom, dateTo].join("\0");
  const urlQuery = useMemo(
    (): PostsFilter => ({
      search,
      orderBy,
      datePreset,
      dateFrom,
      dateTo,
    }),
    [dateFrom, datePreset, dateTo, orderBy, search],
  );
  /** Bounds are derived here so a relative preset is computed once per URL. */
  const listQuery = useMemo(() => toPostsListQuery(urlQuery), [urlQuery]);
  const isHydrated = useIsHydrated();
  /** Empty until hydration so the prerendered toolbar matches the HTML. */
  const filter = isHydrated ? urlQuery : EMPTY_POSTS_FILTER;

  const [posts, setPosts] = useState<Post[]>([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  /** 1-based index of the first post currently shown (for “n–m of total”). */
  const [rangeFrom, setRangeFrom] = useState(0);
  const [hasNextPage, setHasNextPage] = useState(false);
  const [hasPreviousPage, setHasPreviousPage] = useState(false);
  /**
   * Raw ``searchParams`` string last applied to the list. Until it matches
   * the URL, the filter request is still in flight (including first load).
   */
  const [settledKey, setSettledKey] = useState<string | null>(null);
  /** True while a page-number request is in flight (same filter). */
  const [isPageLoading, setIsPageLoading] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const isFilterPending = settledKey !== filterKey;
  const isLoading = !isHydrated || isFilterPending || isPageLoading;
  /** Post ids just appended by ``loadMore`` — used for enter animation. */
  const [enteringPostIds, setEnteringPostIds] = useState<number[]>([]);
  /** Latest in-flight request. Older responses are ignored. */
  const requestSeq = useRef(0);

  const applyPageMeta = useCallback((result: PostsPage) => {
    setPage(result.page);
    setTotal(result.total);
    setTotalPages(result.totalPages);
    setHasNextPage(result.hasNextPage);
    setHasPreviousPage(result.hasPreviousPage);
  }, []);

  /** Replace the list with one page of the current filter (page controls). */
  const goToPage = useCallback(
    async (nextPage: number) => {
      const seq = ++requestSeq.current;
      setIsPageLoading(true);
      setIsLoadingMore(false);
      setError(null);
      try {
        const result = await fetchPosts({
          page: nextPage,
          pageSize,
          query: listQuery,
        });
        if (seq !== requestSeq.current) {
          return;
        }

        setEnteringPostIds([]);
        setPosts(result.posts);
        setRangeFrom(
          result.posts.length === 0
            ? 0
            : (result.page - 1) * result.pageSize + 1,
        );
        applyPageMeta(result);
      } catch (error_) {
        if (seq !== requestSeq.current) {
          return;
        }

        setError(
          error_ instanceof Error ? error_.message : BACKEND_LOAD_FAILED,
        );
      } finally {
        if (seq === requestSeq.current) {
          setIsPageLoading(false);
        }
      }
    },
    [applyPageMeta, listQuery, pageSize],
  );

  /**
   * Write search / sort / filter to the URL.
   *
   * The load effect reads that URL and reloads page 1. Same params are a
   * no-op so Apply on an unchanged filter does not push history.
   */
  const applyQuery = useCallback(
    (nextFilter: PostsFilter) => {
      const next = { ...nextFilter, search: nextFilter.search.trim() };
      if (
        next.search === search &&
        next.orderBy === orderBy &&
        next.datePreset === datePreset &&
        next.dateFrom === dateFrom &&
        next.dateTo === dateTo
      ) {
        return;
      }

      void setQueryParams(next);
    },
    [dateFrom, datePreset, dateTo, orderBy, search, setQueryParams],
  );

  /** Append the next page under the current list (load more). */
  const loadMore = useCallback(async () => {
    if (!hasNextPage || isLoading || isLoadingMore) {
      return;
    }

    const seq = ++requestSeq.current;
    try {
      setIsLoadingMore(true);
      setError(null);
      const result = await fetchPosts({
        page: page + 1,
        pageSize,
        query: listQuery,
      });
      if (seq !== requestSeq.current) {
        return;
      }

      setEnteringPostIds(result.posts.map((post) => post.id));
      setPosts((current) => [...current, ...result.posts]);
      // ``rangeFrom`` stays put so the label covers the full loaded window.
      applyPageMeta(result);
    } catch (error_) {
      if (seq !== requestSeq.current) {
        return;
      }

      setError(error_ instanceof Error ? error_.message : BACKEND_LOAD_FAILED);
    } finally {
      if (seq === requestSeq.current) {
        setIsLoadingMore(false);
      }
    }
  }, [
    applyPageMeta,
    hasNextPage,
    isLoading,
    isLoadingMore,
    page,
    listQuery,
    pageSize,
  ]);

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

  // First load and every URL filter change: replace with page 1.
  // Loading is derived from ``settledKey`` so this effect only writes state
  // after the request resolves.
  useEffect(() => {
    if (!isHydrated) {
      return;
    }

    const seq = ++requestSeq.current;
    const keyAtStart = filterKey;

    const loadFirstPage = async () => {
      try {
        const result = await fetchPosts({
          page: 1,
          pageSize,
          query: listQuery,
        });
        if (seq !== requestSeq.current) {
          return;
        }

        setEnteringPostIds([]);
        setPosts(result.posts);
        setRangeFrom(result.posts.length === 0 ? 0 : 1);
        applyPageMeta(result);
        setError(null);
        setIsPageLoading(false);
        setIsLoadingMore(false);
        setSettledKey(keyAtStart);
      } catch (error_) {
        if (seq !== requestSeq.current) {
          return;
        }

        setError(
          error_ instanceof Error ? error_.message : BACKEND_LOAD_FAILED,
        );
        setIsPageLoading(false);
        setIsLoadingMore(false);
        setSettledKey(keyAtStart);
      }
    };

    void loadFirstPage();
  }, [applyPageMeta, filterKey, isHydrated, listQuery, pageSize]);

  const rangeTo =
    rangeFrom === 0 || posts.length === 0 ? 0 : rangeFrom + posts.length - 1;

  const hasActiveQuery = hasActivePostsQuery(filter);

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
    error: isFilterPending ? null : error,
    query: filter,
    hasActiveQuery,
    enteringPostIds,
    goToPage,
    goToPreviousPage,
    goToNextPage,
    loadMore,
    applyQuery,
  };
};
