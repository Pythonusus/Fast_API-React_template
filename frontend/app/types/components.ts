/**
 * Shared components prop types.
 */

export type HeaderProps = {
  // Current visual theme used to style the header.
  appearance: "light" | "dark";
  // Means component must have a prop `onToggleTheme` that is a function.
  onToggleTheme: () => void;
};
