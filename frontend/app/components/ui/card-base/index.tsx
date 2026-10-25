/**
 * Shared Radix Themes ``Card`` with equal-height layout, link color
 * inheritance, and the standard hover/focus scale.
 *
 * Prefer this over raw ``Card`` for grid/list cells. CSS is imported here —
 * callers do not import ``card-base.css``.
 *
 * ## Reuse
 *
 * - Import: ``import { CardBase } from "~/components/ui/card-base"``.
 * - Props: all Radix ``Card`` props (``CardBaseProps``). Default ``size="2"``.
 * - Extra ``className`` values append after ``app-card-base`` — use a route
 *   class for clamps / min-heights; do not fork ``card-base.css`` for one-offs.
 * - Pass ``asChild`` to render as a link (or other element) via Radix Slot;
 *   put ``href`` / ``aria-label`` on the child.
 *
 * @example Plain card
 * ```tsx
 * <CardBase>
 *   <Heading as="h3" size="4">Title</Heading>
 *   <Text as="p">Body</Text>
 * </CardBase>
 * ```
 *
 * @example Link card
 * ```tsx
 * <CardBase asChild>
 *   <a href="/items/1" aria-label="Open item">…</a>
 * </CardBase>
 * ```
 *
 * @example Page-specific layout class
 * ```tsx
 * <CardBase className="app-posts-card">…</CardBase>
 * ```
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
