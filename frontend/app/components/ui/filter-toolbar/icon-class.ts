/** Icon-button class names shared by the filter toolbar controls. */
export const iconClassName = ({
  open,
  active,
}: {
  open: boolean;
  active: boolean;
}): string =>
  [
    "app-filter-toolbar-icon",
    open ? "app-filter-toolbar-icon-open" : "",
    active ? "app-filter-toolbar-icon-active" : "",
  ]
    .filter(Boolean)
    .join(" ");
