/**
 * Posts list navigation: full-width “Show more” plus numbered pages.
 *
 * Layout matches a minimal catalog pattern — solid accent load-more on top,
 * quiet page numbers underneath (active = accent square). The whole block
 * is omitted when ``totalPages <= 1``.
 */
import { ChevronLeftIcon, ChevronRightIcon } from "@radix-ui/react-icons";
import { Button } from "@radix-ui/themes";

import { buildPageItems } from "./build-page-items";
import "./posts-navigate.css";

export type PostsNavigateProps = {
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
  disabled?: boolean;
  isLoadingMore?: boolean;
  onGoToPage: (page: number) => void;
  onPreviousPage: () => void;
  onNextPage: () => void;
  onLoadMore: () => void;
};

export const PostsNavigate = ({
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
}: PostsNavigateProps) => {
  if (totalPages <= 1) {
    return null;
  }

  const pageItems = buildPageItems(page, totalPages);
  const rangeLabel =
    rangeFrom > 0 && rangeTo > 0 ? `${rangeFrom}–${rangeTo} of ${total}` : null;

  return (
    <section aria-label="Posts navigation" className="app-posts-navigate">
      {hasNextPage ? (
        <Button
          className="app-posts-navigate__more"
          disabled={disabled}
          loading={isLoadingMore}
          onClick={onLoadMore}
          size="3"
          type="button"
        >
          Show more
        </Button>
      ) : null}

      <div className="app-posts-navigate__bar">
        <nav aria-label="Pagination">
          <ul className="app-posts-navigate__list">
            {hasPreviousPage ? (
              <li>
                <button
                  aria-label="Previous page"
                  className="app-posts-navigate__arrow"
                  disabled={disabled}
                  onClick={onPreviousPage}
                  type="button"
                >
                  <ChevronLeftIcon height={16} width={16} />
                </button>
              </li>
            ) : null}

            {pageItems.map((item, index) =>
              item === "ellipsis" ? (
                <li key={`ellipsis-${index}`}>
                  <span aria-hidden className="app-posts-navigate__ellipsis">
                    …
                  </span>
                </li>
              ) : (
                <li key={item}>
                  <button
                    aria-current={item === page ? "page" : undefined}
                    aria-label={`Page ${item}`}
                    className={[
                      "app-posts-navigate__page",
                      item === page ? "app-posts-navigate__page--active" : "",
                    ]
                      .filter(Boolean)
                      .join(" ")}
                    disabled={disabled || item === page}
                    onClick={() => {
                      onGoToPage(item);
                    }}
                    type="button"
                  >
                    {item}
                  </button>
                </li>
              ),
            )}

            {hasNextPage ? (
              <li>
                <button
                  aria-label="Next page"
                  className="app-posts-navigate__arrow"
                  disabled={disabled}
                  onClick={onNextPage}
                  type="button"
                >
                  <ChevronRightIcon height={16} width={16} />
                </button>
              </li>
            ) : null}
          </ul>
        </nav>

        {rangeLabel ? (
          <p className="app-posts-navigate__range" aria-live="polite">
            {rangeLabel}
          </p>
        ) : null}
      </div>
    </section>
  );
};
