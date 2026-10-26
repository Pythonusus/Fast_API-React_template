/**
 * Date-range presets for the filter toolbar.
 *
 * Output is inclusive ``gte`` / ``lte`` datetime strings suitable for
 * fastapi-filter (or any API that takes ISO-like local datetimes).
 */

export const DATE_FILTER_PRESET_VALUES = [
  "any",
  "week",
  "month",
  "year",
  "custom",
] as const;

export type DateFilterPreset = (typeof DATE_FILTER_PRESET_VALUES)[number];

export type DateFilterBounds = {
  gte: string;
  lte: string;
};

export const DATE_FILTER_PRESETS: {
  value: DateFilterPreset;
  label: string;
}[] = [
  { value: "any", label: "Any time" },
  { value: "week", label: "Past week" },
  { value: "month", label: "Past month" },
  { value: "year", label: "Past year" },
  { value: "custom", label: "Custom range" },
];

/** True when ``value`` is one of ``DATE_FILTER_PRESET_VALUES``. */
export const isDateFilterPreset = (value: string): value is DateFilterPreset =>
  (DATE_FILTER_PRESET_VALUES as readonly string[]).includes(value);

/** True when the preset actually narrows the range. */
export const isDateFilterActive = (
  preset: DateFilterPreset,
  fromDate: string,
  toDate: string,
): boolean => {
  if (preset === "any") {
    return false;
  }

  if (preset === "custom") {
    return Boolean(fromDate.trim() || toDate.trim());
  }

  return true;
};

const pad = (value: number): string => String(value).padStart(2, "0");

/** Local calendar day as ``YYYY-MM-DD`` (the custom range's default end). */
export const todayIsoDate = (): string => {
  const date = new Date();
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
};

/** Format a ``Date`` as ``YYYY-MM-DDTHH:MM:SS`` for filter APIs. */
export const formatFilterDateTime = (date: Date): string => {
  return [
    `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`,
    `T${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`,
  ].join("");
};

const startOfDay = (isoDate: string): string => `${isoDate}T00:00:00`;

const endOfDay = (isoDate: string): string => `${isoDate}T23:59:59`;

const daysAgo = (days: number): Date => {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return date;
};

const EMPTY_BOUNDS: DateFilterBounds = {
  gte: "",
  lte: "",
};

/** Build inclusive date bounds from a preset or custom from/to dates. */
export const buildDateFilterBounds = ({
  preset,
  fromDate,
  toDate,
}: {
  preset: DateFilterPreset;
  fromDate: string;
  toDate: string;
}): DateFilterBounds => {
  if (preset === "any") {
    return EMPTY_BOUNDS;
  }

  if (preset === "custom") {
    const from = fromDate.trim();
    const to = toDate.trim();
    return {
      gte: from ? startOfDay(from) : "",
      lte: to ? endOfDay(to) : "",
    };
  }

  let spanDays = 365;
  if (preset === "week") {
    spanDays = 7;
  } else if (preset === "month") {
    spanDays = 30;
  }

  return {
    gte: formatFilterDateTime(daysAgo(spanDays)),
    lte: formatFilterDateTime(new Date()),
  };
};
