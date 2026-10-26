/**
 * Sort icon + popover. Choosing an option commits immediately.
 */
import { Popover, Select } from "@radix-ui/themes";
import { useId, useState } from "react";

import "./filter-toolbar.css";
import { iconClassName } from "./icon-class";

export type SortButtonOption<Value extends string = string> = {
  value: Value;
  label: string;
};

export type SortButtonProps<Value extends string = string> = {
  /** Applied sort value. */
  value: Value;
  /** Baseline used for the active dot (usually newest first). */
  defaultValue: Value;
  options: readonly SortButtonOption<Value>[];
  disabled?: boolean;
  onChange: (orderBy: Value) => void;
  ariaLabel?: string;
};

export const SortButton = <Value extends string>({
  value,
  defaultValue,
  options,
  disabled = false,
  onChange,
  ariaLabel = "Sort",
}: SortButtonProps<Value>) => {
  const sortId = useId();
  const [open, setOpen] = useState(false);

  return (
    <Popover.Root onOpenChange={setOpen} open={open}>
      <Popover.Trigger>
        <button
          aria-label={ariaLabel}
          className={iconClassName({
            open,
            active: value !== defaultValue,
          })}
          disabled={disabled}
          type="button"
        >
          <span aria-hidden className="app-filter-toolbar-sort-icon" />
        </button>
      </Popover.Trigger>
      <Popover.Content
        align="end"
        className="app-filter-toolbar-popover"
        side="bottom"
        sideOffset={6}
        width="220px"
      >
        <label className="app-filter-toolbar-label" htmlFor={sortId}>
          Sort by
          <Select.Root
            disabled={disabled}
            onValueChange={(next) => {
              onChange(next as Value);
              setOpen(false);
            }}
            value={value}
          >
            <Select.Trigger id={sortId} />
            <Select.Content>
              {options.map((option) => (
                <Select.Item key={option.value} value={option.value}>
                  {option.label}
                </Select.Item>
              ))}
            </Select.Content>
          </Select.Root>
        </label>
      </Popover.Content>
    </Popover.Root>
  );
};
