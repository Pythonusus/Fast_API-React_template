/**
 * Shared list pagination: optional full-width “Show more” plus a numbered
 * strip (prev/next, ellipsis, “n–m of total”).
 *
 * Designed for list hooks that support replace (``goToPage``) and append
 * (``loadMore``). CSS is imported here; callers do not import
 * ``pagination.css``. ``build-page-items.ts`` is internal — routes normally
 * do not call it.
 *
 * ## Reuse
 *
 * Wire props from your list hook / API page meta. Keep resource-specific
 * fetching in the hook; this component only renders controls.
 *
 * - Hidden when ``totalPages <= 1`` (fades out, then unmounts).
 * - At **≤519px**, only “Show more” is visible; the numbered bar is CSS-hidden.
 * - Omit ``onLoadMore`` for page-numbers-only UIs (no Show more row).
 * - Pass ``disabled`` while any list request is in flight; ``isLoadingMore``
 *   for the Show more button spinner.
 *
 * ### Typical props
 *
 * | Prop | Notes |
 * |------|--------|
 * | ``page``, ``totalPages``, ``total`` | From the list API / hook |
 * | ``rangeFrom``, ``rangeTo`` | 1-based visible window for the range label |
 * | ``hasNextPage``, ``hasPreviousPage`` | Drive arrows / Show more |
 * | ``onGoToPage``, ``onPreviousPage``, ``onNextPage`` | Replace-mode navigation |
 * | ``onLoadMore?`` | Append next page |
 *
 * @example With replace + append (posts)
 * ```tsx
 * <Pagination
 *   disabled={isLoading || isLoadingMore}
 *   hasNextPage={hasNextPage}
 *   hasPreviousPage={hasPreviousPage}
 *   isLoadingMore={isLoadingMore}
 *   onGoToPage={(p) => {
 *     void goToPage(p);
 *   }}
 *   onLoadMore={() => {
 *     void loadMore();
 *   }}
 *   onNextPage={goToNextPage}
 *   onPreviousPage={goToPreviousPage}
 *   page={page}
 *   rangeFrom={rangeFrom}
 *   rangeTo={rangeTo}
 *   total={total}
 *   totalPages={totalPages}
 * />
 * ```
 */
import { ChevronLeftIcon, ChevronRightIcon } from "@radix-ui/react-icons";
import { Button } from "@radix-ui/themes";
import { useEffect, useState } from "react";

import { buildPageItems, type PageItem } from "./build-page-items";

import { APP_DURATION_MS } from "~/styles/motion";

import "./pagination.css";

export type PaginationProps = {
  page: number;
  totalPages: number;
  /** First visible item index (1-based). */
  rangeFrom: number;
  /** Last visible item index (1-based). */
  rangeTo: number;
  /** Total items across all pages. */
  total: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
  /** Block all controls while a request is in flight. */
  disabled?: boolean;
  /** Loading state for the “Show more” button. */
  isLoadingMore?: boolean;
  /** Replace the list with this page (numbered controls). */
  onGoToPage: (page: number) => void;
  onPreviousPage: () => void;
  onNextPage: () => void;
  /** When set, shows a full-width “Show more” control above the page strip. */
  onLoadMore?: () => void;
};

/**
 * Keep the node mounted through the exit transition, then unmount.
 * Enter mounts during render; exit unmount is deferred via timeout only.
 */
const useDelayedPresence = (open: boolean): boolean => {
  const [mounted, setMounted] = useState(open);

  if (open && !mounted) {
    setMounted(true);
  }

  useEffect(() => {
    if (open || !mounted) {
      return;
    }

    const timer = globalThis.setTimeout(() => {
      setMounted(false);
    }, APP_DURATION_MS);
    return () => {
      globalThis.clearTimeout(timer);
    };
  }, [open, mounted]);

  return mounted;
};

const presenceClass = (visible: boolean): string =>
  visible
    ? "app-pagination-presence-visible"
    : "app-pagination-presence-hidden";

const PageStripItem = ({
  item,
  page,
  disabled,
  onGoToPage,
}: {
  item: PageItem;
  page: number;
  disabled: boolean;
  onGoToPage: (page: number) => void;
}) => {
  if (item === "ellipsis") {
    return (
      <li className="app-pagination-slot">
        <span aria-hidden className="app-pagination-ellipsis">
          …
        </span>
      </li>
    );
  }

  const isCurrent = item === page;

  return (
    <li className="app-pagination-slot">
      <button
        aria-current={isCurrent ? "page" : undefined}
        aria-label={`Page ${item}`}
        className={[
          "app-pagination-page",
          isCurrent ? "app-pagination-page-active" : "",
        ]
          .filter(Boolean)
          .join(" ")}
        disabled={disabled || isCurrent}
        onClick={() => {
          onGoToPage(item);
        }}
        type="button"
      >
        {item}
      </button>
    </li>
  );
};

export const Pagination = ({
  page,
  totalPages,
  rangeFrom,
  rangeTo,
  total,
  hasNextPage,
  hasPreviousPage,
  disabled = false,
  isLoadingMore = false,
  onGoToPage,
  onPreviousPage,
  onNextPage,
  onLoadMore,
}: PaginationProps) => {
  const shouldShow = totalPages > 1;
  const mounted = useDelayedPresence(shouldShow);

  if (!mounted) {
    return null;
  }

  const pageItems = buildPageItems(page, totalPages);
  const rangeLabel =
    rangeFrom > 0 && rangeTo > 0 ? `${rangeFrom}–${rangeTo} of ${total}` : null;
  const loadMoreEnabled = typeof onLoadMore === "function";
  const showLoadMore = loadMoreEnabled && hasNextPage;

  return (
    <section
      aria-hidden={!shouldShow}
      aria-label="Pagination"
      className={[
        "app-pagination",
        shouldShow ? "app-pagination-visible" : "app-pagination-hidden",
      ].join(" ")}
    >
      {loadMoreEnabled ? (
        <div
          className={[
            "app-pagination-more-wrap",
            presenceClass(showLoadMore),
          ].join(" ")}
        >
          <Button
            aria-hidden={!showLoadMore}
            className="app-pagination-more"
            disabled={disabled || !showLoadMore}
            loading={isLoadingMore}
            onClick={onLoadMore}
            size="3"
            tabIndex={showLoadMore ? undefined : -1}
            type="button"
          >
            Show more
          </Button>
        </div>
      ) : null}

      <div className="app-pagination-bar">
        <nav aria-label="Pages">
          <ul className="app-pagination-list">
            <li
              aria-hidden={!hasPreviousPage}
              className={[
                "app-pagination-slot",
                presenceClass(hasPreviousPage),
              ].join(" ")}
            >
              <button
                aria-label="Previous page"
                className="app-pagination-arrow"
                disabled={disabled || !hasPreviousPage}
                onClick={onPreviousPage}
                tabIndex={hasPreviousPage ? undefined : -1}
                type="button"
              >
                <ChevronLeftIcon height={16} width={16} />
              </button>
            </li>

            {pageItems.map((item, index) => (
              <PageStripItem
                disabled={disabled}
                item={item}
                key={item === "ellipsis" ? `ellipsis-${index}` : item}
                onGoToPage={onGoToPage}
                page={page}
              />
            ))}

            <li
              aria-hidden={!hasNextPage}
              className={[
                "app-pagination-slot",
                presenceClass(hasNextPage),
              ].join(" ")}
            >
              <button
                aria-label="Next page"
                className="app-pagination-arrow"
                disabled={disabled || !hasNextPage}
                onClick={onNextPage}
                tabIndex={hasNextPage ? undefined : -1}
                type="button"
              >
                <ChevronRightIcon height={16} width={16} />
              </button>
            </li>
          </ul>
        </nav>

        {rangeLabel ? (
          <p className="app-pagination-range" aria-live="polite">
            {rangeLabel}
          </p>
        ) : null}
      </div>
    </section>
  );
};
