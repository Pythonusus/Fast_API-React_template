/**
 * Posts query params ↔ URL query params.
 *
 * The query string is the source of truth so a reload, the back button, and
 * a shared link open the same search, sort, and date preset. Relative
 * presets (``week`` / ``month`` / ``year``) are stored by name and turned
 * into ``created_at`` bounds when the params are read, so “past week” is
 * always the week before that load.
 *
 * Omitted params mean the defaults: empty search, newest first, any date.
 */
import {
  buildDateFilterBounds,
  isDateFilterPreset,
} from "~/components/ui/filter-toolbar/date-range";
import type { PostsFilter, PostsListQuery } from "~/types/posts";
import { DEFAULT_POSTS_ORDER_BY, POSTS_ORDER_BY_VALUES } from "~/types/posts";

const ORDER_BY_VALUES = new Set<string>(POSTS_ORDER_BY_VALUES);

const RELATIVE_DATE_PRESETS = ["week", "month", "year"] as const;

type RelativeDatePreset = (typeof RELATIVE_DATE_PRESETS)[number];

const isRelativeDatePreset = (preset: string): preset is RelativeDatePreset =>
  (RELATIVE_DATE_PRESETS as readonly string[]).includes(preset);

/** ``YYYY-MM-DD`` that is a real calendar day (URL input is not trusted). */
const isIsoDate = (value: string): boolean => {
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

const appendCustomDates = (
  params: URLSearchParams,
  filter: PostsFilter,
): void => {
  if (filter.datePreset !== "custom") {
    return;
  }

  const dateFrom = isIsoDate(filter.dateFrom) ? filter.dateFrom : "";
  const dateTo = isIsoDate(filter.dateTo) ? filter.dateTo : "";
  if (!dateFrom && !dateTo) {
    return;
  }

  params.set("date_preset", "custom");
  if (dateFrom) {
    params.set("date_from", dateFrom);
  }

  if (dateTo) {
    params.set("date_to", dateTo);
  }
};

const emptyDate = {
  createdAtGte: "",
  createdAtLte: "",
  datePreset: "any" as const,
  dateFrom: "",
  dateTo: "",
};

/**
 * Read posts query params from the page URL.
 *
 * Unknown ``order_by`` / ``date_preset`` values fall back to the defaults.
 * A custom range is kept when at least one of ``date_from`` / ``date_to``
 * is a real calendar day.
 */
export const parsePostsQueryParams = (params: URLSearchParams): PostsFilter => {
  const search = params.get("search")?.trim() ?? "";
  const orderByRaw = params.get("order_by")?.trim() ?? "";
  const orderBy = ORDER_BY_VALUES.has(orderByRaw)
    ? orderByRaw
    : DEFAULT_POSTS_ORDER_BY;
  const presetRaw = params.get("date_preset")?.trim() ?? "any";
  const datePreset = isDateFilterPreset(presetRaw) ? presetRaw : "any";

  if (isRelativeDatePreset(datePreset)) {
    const bounds = buildDateFilterBounds({
      preset: datePreset,
      fromDate: "",
      toDate: "",
    });
    return {
      search,
      orderBy,
      createdAtGte: bounds.gte,
      createdAtLte: bounds.lte,
      datePreset,
      dateFrom: "",
      dateTo: "",
    };
  }

  if (datePreset === "custom") {
    const dateFromRaw = params.get("date_from")?.trim() ?? "";
    const dateToRaw = params.get("date_to")?.trim() ?? "";
    const dateFrom = isIsoDate(dateFromRaw) ? dateFromRaw : "";
    const dateTo = isIsoDate(dateToRaw) ? dateToRaw : "";
    if (dateFrom || dateTo) {
      const bounds = buildDateFilterBounds({
        preset: "custom",
        fromDate: dateFrom,
        toDate: dateTo,
      });
      return {
        search,
        orderBy,
        createdAtGte: bounds.gte,
        createdAtLte: bounds.lte,
        datePreset: "custom",
        dateFrom,
        dateTo,
      };
    }
  }

  return {
    search,
    orderBy,
    ...emptyDate,
  };
};

/** Serialize posts query params, dropping defaults so the URL stays short. */
export const toPostsQueryParams = (filter: PostsFilter): URLSearchParams => {
  const params = new URLSearchParams();
  const search = filter.search.trim();
  if (search) {
    params.set("search", search);
  }

  if (filter.orderBy !== DEFAULT_POSTS_ORDER_BY) {
    params.set("order_by", filter.orderBy);
  }

  if (isRelativeDatePreset(filter.datePreset)) {
    params.set("date_preset", filter.datePreset);
    return params;
  }

  appendCustomDates(params, filter);
  return params;
};

/** API query fields from a filter (date preset stays in the URL only). */
export const toPostsListQuery = (filter: PostsFilter): PostsListQuery => ({
  search: filter.search,
  orderBy: filter.orderBy,
  createdAtGte: filter.createdAtGte,
  createdAtLte: filter.createdAtLte,
});
