/**
 * Build the numbered pagination strip (with ellipsis gaps).
 *
 * Example for page 3 of 71: ``[1, 2, 3, 4, 5, "ellipsis", 71]``.
 * Returns an empty array when ``totalPages <= 1`` (caller hides the nav).
 */

export type PageItem = number | "ellipsis";

export const buildPageItems = (
  currentPage: number,
  totalPages: number,
): PageItem[] => {
  if (totalPages <= 1) {
    return [];
  }

  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, index) => index + 1);
  }

  const nearby: number[] = [];
  for (let page = currentPage - 2; page <= currentPage + 2; page += 1) {
    if (page >= 1 && page <= totalPages) {
      nearby.push(page);
    }
  }

  const included = new Set<number>([1, totalPages, ...nearby]);
  const items: PageItem[] = [];
  let previous: number | undefined;

  for (let page = 1; page <= totalPages; page += 1) {
    if (!included.has(page)) {
      continue;
    }

    if (previous !== undefined && page - previous > 1) {
      items.push("ellipsis");
    }

    items.push(page);
    previous = page;
  }

  return items;
};
