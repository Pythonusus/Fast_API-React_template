/**
 * Shared list toolbar: search, sort, and date-range via icon popovers, plus
 * clear. Domain-agnostic — keep API field names and copy in a thin wrapper.
 *
 * CSS is imported here; callers do not import ``list-toolbar.css``.
 * Date presets come from ``~/utils/date-filter``.
 *
 * ## Reuse
 *
 * 1. Define your list query type (e.g. ``createdAtGte`` / ``createdAtLte``).
 * 2. Map ↔ ``ListToolbarQuery`` (``search``, ``orderBy``, ``dateGte``, ``dateLte``).
 * 3. Pass ``sortOptions``, ``defaultOrderBy``, labels, and ``onApply`` (usually
 *    reload page 1). Sort changes call ``onApply`` immediately; search/date
 *    commit on Apply / Search in the popover.
 * 4. Put the wrapper under ``components/<domain>/`` (see ``posts-toolbar``),
 *    not inside ``ui/``.
 *
 * ### ``ListToolbarQuery``
 *
 * - ``search`` — free text
 * - ``orderBy`` — sort value matching an option in ``sortOptions``
 * - ``dateGte`` / ``dateLte`` — ISO datetime strings or ``""``
 *
 * ### Required props
 *
 * | Prop | Role |
 * |------|------|
 * | ``query`` | Applied values — drives “active” icon state |
 * | ``defaultOrderBy`` | Baseline for sort-active + Clear |
 * | ``sortOptions`` | ``{ value, label }[]`` for the sort select |
 * | ``onApply`` | Commit draft search/sort/dates |
 *
 * Optional: ``disabled``, aria labels, ``searchPlaceholder``, ``dateSelectLabel``.
 *
 * @example Thin domain wrapper
 * ```tsx
 * const toListQuery = (q: ItemsQuery): ListToolbarQuery => ({
 *   search: q.search,
 *   orderBy: q.orderBy,
 *   dateGte: q.createdAtGte,
 *   dateLte: q.createdAtLte,
 * });
 *
 * const toItemsQuery = (q: ListToolbarQuery): ItemsQuery => ({
 *   search: q.search,
 *   orderBy: q.orderBy,
 *   createdAtGte: q.dateGte,
 *   createdAtLte: q.dateLte,
 * });
 *
 * export const ItemsToolbar = ({ query, disabled, onApply }) => (
 *   <ListToolbar
 *     defaultOrderBy="-created_at"
 *     disabled={disabled}
 *     onApply={(next) => {
 *       onApply(toItemsQuery(next));
 *     }}
 *     query={toListQuery(query)}
 *     searchPlaceholder="Search items…"
 *     sortOptions={ITEMS_SORT_OPTIONS}
 *   />
 * );
 * ```
 */
import {
  CalendarIcon,
  Cross2Icon,
  MagnifyingGlassIcon,
} from "@radix-ui/react-icons";
import { Button, Popover, Select, TextField } from "@radix-ui/themes";
import { useId, useState } from "react";

import "./list-toolbar.css";
import {
  buildDateFilterBounds,
  DATE_FILTER_PRESETS,
  type DateFilterPreset,
} from "~/utils/date-filter";

export type ListToolbarQuery = {
  search: string;
  orderBy: string;
  dateGte: string;
  dateLte: string;
};

export type ListToolbarSortOption = {
  value: string;
  label: string;
};

export type ListToolbarProps = {
  /** Applied (committed) values — drives “active” icon state. */
  query: ListToolbarQuery;
  /** Default ``orderBy`` used for “sort active” and Clear. */
  defaultOrderBy: string;
  /** Options for the sort select; ``value`` must match API ``orderBy``. */
  sortOptions: readonly ListToolbarSortOption[];
  disabled?: boolean;
  /** Commit draft search/sort/dates (usually reload page 1). */
  onApply: (query: ListToolbarQuery) => void;
  ariaLabel?: string;
  searchAriaLabel?: string;
  searchPlaceholder?: string;
  sortAriaLabel?: string;
  dateAriaLabel?: string;
  /** Label above the date preset select (e.g. “Posted”). */
  dateSelectLabel?: string;
  clearAriaLabel?: string;
};

type OpenPanel = "search" | "sort" | "date" | null;

const iconClassName = ({
  open,
  active,
}: {
  open: boolean;
  active: boolean;
}): string =>
  [
    "app-list-toolbar-icon",
    open ? "app-list-toolbar-icon-open" : "",
    active ? "app-list-toolbar-icon-active" : "",
  ]
    .filter(Boolean)
    .join(" ");

export const ListToolbar = ({
  query,
  defaultOrderBy,
  sortOptions,
  disabled = false,
  onApply,
  ariaLabel = "List tools",
  searchAriaLabel = "Search",
  searchPlaceholder = "Search…",
  sortAriaLabel = "Sort",
  dateAriaLabel = "Filter by date",
  dateSelectLabel = "Date",
  clearAriaLabel = "Clear search and filters",
}: ListToolbarProps) => {
  const searchId = useId();
  const sortId = useId();
  const datePresetId = useId();
  const fromId = useId();
  const toId = useId();

  const [openPanel, setOpenPanel] = useState<OpenPanel>(null);
  const [draftSearch, setDraftSearch] = useState(query.search);
  const [draftOrderBy, setDraftOrderBy] = useState(query.orderBy);
  const [datePreset, setDatePreset] = useState<DateFilterPreset>("any");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  const searchActive = Boolean(query.search.trim());
  const sortActive = query.orderBy !== defaultOrderBy;
  const dateActive =
    Boolean(query.dateGte.trim()) || Boolean(query.dateLte.trim());
  const anythingActive = searchActive || sortActive || dateActive;

  const setPanelOpen = (panel: Exclude<OpenPanel, null>, open: boolean) => {
    setOpenPanel(open ? panel : null);
  };

  const applyQuery = (patch?: Partial<ListToolbarQuery>) => {
    const bounds = buildDateFilterBounds({
      preset: datePreset,
      fromDate,
      toDate,
    });
    onApply({
      search: draftSearch,
      orderBy: draftOrderBy,
      dateGte: bounds.gte,
      dateLte: bounds.lte,
      ...patch,
    });
  };

  const clearAll = () => {
    setDraftSearch("");
    setDraftOrderBy(defaultOrderBy);
    setDatePreset("any");
    setFromDate("");
    setToDate("");
    setOpenPanel(null);
    onApply({
      search: "",
      orderBy: defaultOrderBy,
      dateGte: "",
      dateLte: "",
    });
  };

  return (
    <section aria-label={ariaLabel} className="app-list-toolbar">
      <div className="app-list-toolbar-icons">
        <Popover.Root
          onOpenChange={(open) => {
            setPanelOpen("search", open);
          }}
          open={openPanel === "search"}
        >
          <Popover.Trigger>
            <button
              aria-label={searchAriaLabel}
              className={iconClassName({
                open: openPanel === "search",
                active: searchActive,
              })}
              disabled={disabled}
              type="button"
            >
              <MagnifyingGlassIcon height={22} width={22} />
            </button>
          </Popover.Trigger>
          <Popover.Content
            align="end"
            className="app-list-toolbar-popover"
            side="bottom"
            sideOffset={6}
            width="280px"
          >
            <form
              className="app-list-toolbar-popover-body"
              onSubmit={(event) => {
                event.preventDefault();
                applyQuery();
                setOpenPanel(null);
              }}
            >
              <label className="app-list-toolbar-label" htmlFor={searchId}>
                Search
                <TextField.Root
                  disabled={disabled}
                  id={searchId}
                  onChange={(event) => {
                    setDraftSearch(event.target.value);
                  }}
                  placeholder={searchPlaceholder}
                  value={draftSearch}
                >
                  {draftSearch.trim() ? (
                    <TextField.Slot side="right">
                      <button
                        aria-label="Clear search"
                        className="app-list-toolbar-field-clear"
                        disabled={disabled}
                        onClick={() => {
                          setDraftSearch("");
                        }}
                        type="button"
                      >
                        <Cross2Icon height={14} width={14} />
                      </button>
                    </TextField.Slot>
                  ) : null}
                </TextField.Root>
              </label>
              <Button disabled={disabled} type="submit">
                Search
              </Button>
            </form>
          </Popover.Content>
        </Popover.Root>

        <Popover.Root
          onOpenChange={(open) => {
            setPanelOpen("sort", open);
          }}
          open={openPanel === "sort"}
        >
          <Popover.Trigger>
            <button
              aria-label={sortAriaLabel}
              className={iconClassName({
                open: openPanel === "sort",
                active: sortActive,
              })}
              disabled={disabled}
              type="button"
            >
              <span aria-hidden className="app-list-toolbar-sort-icon" />
            </button>
          </Popover.Trigger>
          <Popover.Content
            align="end"
            className="app-list-toolbar-popover"
            side="bottom"
            sideOffset={6}
            width="220px"
          >
            <label className="app-list-toolbar-label" htmlFor={sortId}>
              Sort by
              <Select.Root
                disabled={disabled}
                onValueChange={(value) => {
                  setDraftOrderBy(value);
                  applyQuery({ orderBy: value });
                  setOpenPanel(null);
                }}
                value={draftOrderBy}
              >
                <Select.Trigger id={sortId} />
                <Select.Content>
                  {sortOptions.map((option) => (
                    <Select.Item key={option.value} value={option.value}>
                      {option.label}
                    </Select.Item>
                  ))}
                </Select.Content>
              </Select.Root>
            </label>
          </Popover.Content>
        </Popover.Root>

        <Popover.Root
          onOpenChange={(open) => {
            setPanelOpen("date", open);
          }}
          open={openPanel === "date"}
        >
          <Popover.Trigger>
            <button
              aria-label={dateAriaLabel}
              className={iconClassName({
                open: openPanel === "date",
                active: dateActive,
              })}
              disabled={disabled}
              type="button"
            >
              <CalendarIcon height={22} width={22} />
            </button>
          </Popover.Trigger>
          <Popover.Content
            align="end"
            className="app-list-toolbar-popover"
            side="bottom"
            sideOffset={6}
            width="260px"
          >
            <form
              className="app-list-toolbar-popover-body"
              onSubmit={(event) => {
                event.preventDefault();
                applyQuery();
                setOpenPanel(null);
              }}
            >
              <label className="app-list-toolbar-label" htmlFor={datePresetId}>
                {dateSelectLabel}
                <Select.Root
                  disabled={disabled}
                  onValueChange={(value) => {
                    setDatePreset(value as DateFilterPreset);
                  }}
                  value={datePreset}
                >
                  <Select.Trigger id={datePresetId} />
                  <Select.Content>
                    {DATE_FILTER_PRESETS.map((option) => (
                      <Select.Item key={option.value} value={option.value}>
                        {option.label}
                      </Select.Item>
                    ))}
                  </Select.Content>
                </Select.Root>
              </label>

              {datePreset === "custom" ? (
                <>
                  <label className="app-list-toolbar-label" htmlFor={fromId}>
                    From
                    <TextField.Root
                      className="app-list-toolbar-date"
                      disabled={disabled}
                      id={fromId}
                      onChange={(event) => {
                        setFromDate(event.target.value);
                      }}
                      type="date"
                      value={fromDate}
                    />
                  </label>
                  <label className="app-list-toolbar-label" htmlFor={toId}>
                    To
                    <TextField.Root
                      className="app-list-toolbar-date"
                      disabled={disabled}
                      id={toId}
                      onChange={(event) => {
                        setToDate(event.target.value);
                      }}
                      type="date"
                      value={toDate}
                    />
                  </label>
                </>
              ) : null}

              <Button disabled={disabled} type="submit">
                Apply
              </Button>
            </form>
          </Popover.Content>
        </Popover.Root>

        <button
          aria-hidden={!anythingActive}
          aria-label={clearAriaLabel}
          className={[
            "app-list-toolbar-icon",
            "app-list-toolbar-clear",
            anythingActive ? "" : "app-list-toolbar-clear-hidden",
          ]
            .filter(Boolean)
            .join(" ")}
          disabled={disabled || !anythingActive}
          onClick={clearAll}
          tabIndex={anythingActive ? undefined : -1}
          type="button"
        >
          <Cross2Icon height={20} width={20} />
        </button>
      </div>
    </section>
  );
};
