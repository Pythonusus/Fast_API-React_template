/**
 * Posts-specific list toolbar over the shared ``ListToolbar``.
 *
 * Maps posts query fields (``createdAtGte`` / ``createdAtLte``) onto the
 * generic date bounds and supplies posts labels / sort options.
 */
import { POSTS_SORT_OPTIONS } from "./sort-options";

import {
  ListToolbar,
  type ListToolbarQuery,
} from "~/components/ui/list-toolbar";
import type { PostsListQuery } from "~/types/posts";
import { DEFAULT_POSTS_ORDER_BY } from "~/types/posts";

export type PostsToolbarProps = {
  query: PostsListQuery;
  disabled?: boolean;
  onApply: (query: PostsListQuery) => void;
};

const toListQuery = (query: PostsListQuery): ListToolbarQuery => ({
  search: query.search,
  orderBy: query.orderBy,
  dateGte: query.createdAtGte,
  dateLte: query.createdAtLte,
});

const toPostsQuery = (query: ListToolbarQuery): PostsListQuery => ({
  search: query.search,
  orderBy: query.orderBy,
  createdAtGte: query.dateGte,
  createdAtLte: query.dateLte,
});

export const PostsToolbar = ({
  query,
  disabled = false,
  onApply,
}: PostsToolbarProps) => (
  <ListToolbar
    ariaLabel="Posts tools"
    clearAriaLabel="Clear search and filters"
    dateAriaLabel="Filter by date"
    dateSelectLabel="Posted"
    defaultOrderBy={DEFAULT_POSTS_ORDER_BY}
    disabled={disabled}
    onApply={(next) => {
      onApply(toPostsQuery(next));
    }}
    query={toListQuery(query)}
    searchAriaLabel="Search posts"
    searchPlaceholder="Search posts…"
    sortAriaLabel="Sort posts"
    sortOptions={POSTS_SORT_OPTIONS}
  />
);
