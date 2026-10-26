/**
 * Posts query params ↔ URL query params.
 *
 * nuqs keeps ``search``, ``order_by``, ``date_preset``, ``date_from``, and
 * ``date_to`` in the page URL. Defaults are omitted. Unknown sort and date
 * values fall back. Relative presets (``week`` / ``month`` / ``year``) are
 * stored by name and turned into ``created_at`` bounds when the list is
 * fetched, so “past week” is always the week before that load.
 */
import { createParser, parseAsStringLiteral } from "nuqs";

import {
  buildDateFilterBounds,
  DATE_FILTER_PRESET_VALUES,
  isDateFilterActive,
} from "~/components/ui/filter-toolbar/date-range";
import type { PostsFilter, PostsListQuery } from "~/types/posts";
import { DEFAULT_POSTS_ORDER_BY, POSTS_ORDER_BY_VALUES } from "~/types/posts";

/** ``YYYY-MM-DD`` that is a real calendar day (URL input is not trusted). */
const isCalendarDay = (value: string): boolean => {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) {
    return false;
  }

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const date = new Date(year, month - 1, day);
  return (
    date.getFullYear() === year &&
    date.getMonth() === month - 1 &&
    date.getDate() === day
  );
};

/** Trimmed search text. Blank input is the default and stays out of the URL. */
const parseAsSearch = createParser({
  parse: (value) => value.trim(),
  serialize: (value) => value.trim(),
}).withDefault("");

/** Real ``YYYY-MM-DD``, or empty when the URL value is missing or invalid. */
const parseAsCalendarDay = createParser({
  parse: (value) => (isCalendarDay(value) ? value : null),
  serialize: (value) => value,
}).withDefault("");

/**
 * URL fields for the posts list. Keys here are camelCase; ``postsQueryUrlKeys``
 * maps them onto the snake_case query string.
 */
export const postsQueryParsers = {
  search: parseAsSearch,
  orderBy: parseAsStringLiteral(POSTS_ORDER_BY_VALUES).withDefault(
    DEFAULT_POSTS_ORDER_BY,
  ),
  datePreset: parseAsStringLiteral(DATE_FILTER_PRESET_VALUES).withDefault(
    "any",
  ),
  dateFrom: parseAsCalendarDay,
  dateTo: parseAsCalendarDay,
};

export const postsQueryUrlKeys = {
  search: "search",
  orderBy: "order_by",
  datePreset: "date_preset",
  dateFrom: "date_from",
  dateTo: "date_to",
} as const;

/** True when search, sort, or the date filter is not the default. */
export const hasActivePostsQuery = (query: PostsFilter): boolean =>
  Boolean(query.search.trim()) ||
  query.orderBy !== DEFAULT_POSTS_ORDER_BY ||
  isDateFilterActive(query.datePreset, query.dateFrom, query.dateTo);

/** API query fields. The date preset stays in the URL only. */
export const toPostsListQuery = (query: PostsFilter): PostsListQuery => {
  const bounds = buildDateFilterBounds({
    preset: query.datePreset,
    fromDate: query.datePreset === "custom" ? query.dateFrom : "",
    toDate: query.datePreset === "custom" ? query.dateTo : "",
  });
  return {
    search: query.search,
    orderBy: query.orderBy,
    createdAtGte: bounds.gte,
    createdAtLte: bounds.lte,
  };
};
