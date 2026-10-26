/**
 * Posts filter toolbar: search, sort, date filter, and clear.
 *
 * Each control commits only its own fields. The applied filter is the
 * ``query`` prop (posts keep it in the page URL).
 */
import { Cross2Icon } from "@radix-ui/react-icons";

import { POSTS_SORT_OPTIONS } from "./sort-options";

import { DateFilter } from "~/components/ui/filter-toolbar/date-filter-button";
import "~/components/ui/filter-toolbar/filter-toolbar.css";
import { iconClassName } from "~/components/ui/filter-toolbar/icon-class";
import { SearchButton } from "~/components/ui/filter-toolbar/search-button";
import { SortButton } from "~/components/ui/filter-toolbar/sort-button";
import type { PostsFilter } from "~/types/posts";
import { DEFAULT_POSTS_ORDER_BY, EMPTY_POSTS_FILTER } from "~/types/posts";

export type PostsToolbarProps = {
  query: PostsFilter;
  disabled?: boolean;
  onApply: (query: PostsFilter) => void;
};

const hasActiveFilter = (query: PostsFilter): boolean =>
  Boolean(query.search.trim()) ||
  query.orderBy !== DEFAULT_POSTS_ORDER_BY ||
  Boolean(query.createdAtGte.trim()) ||
  Boolean(query.createdAtLte.trim());

export const PostsToolbar = ({
  query,
  disabled = false,
  onApply,
}: PostsToolbarProps) => {
  const anythingActive = hasActiveFilter(query);

  return (
    <section aria-label="Posts filters" className="app-filter-toolbar">
      <div className="app-filter-toolbar-icons">
        <SearchButton
          ariaLabel="Search posts"
          disabled={disabled}
          onApply={(search) => {
            onApply({ ...query, search });
          }}
          placeholder="Search posts…"
          value={query.search}
        />
        <SortButton
          ariaLabel="Sort posts"
          defaultValue={DEFAULT_POSTS_ORDER_BY}
          disabled={disabled}
          onChange={(orderBy) => {
            onApply({ ...query, orderBy });
          }}
          options={POSTS_SORT_OPTIONS}
          value={query.orderBy}
        />
        <DateFilter
          ariaLabel="Filter by date"
          dateFrom={query.dateFrom}
          datePreset={query.datePreset}
          dateTo={query.dateTo}
          disabled={disabled}
          onApply={(next) => {
            onApply({
              ...query,
              createdAtGte: next.dateGte,
              createdAtLte: next.dateLte,
              datePreset: next.datePreset,
              dateFrom: next.dateFrom,
              dateTo: next.dateTo,
            });
          }}
          selectLabel="Posted"
        />
        <button
          aria-hidden={!anythingActive}
          aria-label="Clear search and filters"
          className={[
            iconClassName({ open: false, active: false }),
            "app-filter-toolbar-clear",
            anythingActive ? "" : "app-filter-toolbar-clear-hidden",
          ]
            .filter(Boolean)
            .join(" ")}
          disabled={disabled || !anythingActive}
          onClick={() => {
            onApply(EMPTY_POSTS_FILTER);
          }}
          tabIndex={anythingActive ? undefined : -1}
          type="button"
        >
          <Cross2Icon height={20} width={20} />
        </button>
      </div>
    </section>
  );
};
