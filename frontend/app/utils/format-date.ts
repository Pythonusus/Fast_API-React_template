/**
 * Format an ISO timestamp as a locale-aware medium date (e.g. "Oct 30, 2026").
 * Returns the input unchanged when it is not a valid date.
 */
export const formatDate = (iso: string): string => {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) {
    return iso;
  }

  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
  }).format(date);
};
