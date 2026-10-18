/**
 * Reusable Radix Card wrapper with shared layout and hover styles.
 *
 * Use this instead of raw `Card` wherever equal-height cells, link color
 * inheritance, and the standard hover/focus scale are wanted.
 * Pass `asChild` to render as a link (or other element) via Radix Slot.
 */
import { Card } from "@radix-ui/themes";
import type { ComponentPropsWithoutRef } from "react";

import "./card-base.css";

export type CardBaseProps = ComponentPropsWithoutRef<typeof Card>;

export const CardBase = ({
  className,
  size = "2",
  ...props
}: CardBaseProps) => {
  const classes = ["app-card-base", className].filter(Boolean).join(" ");

  return <Card className={classes} size={size} {...props} />;
};
