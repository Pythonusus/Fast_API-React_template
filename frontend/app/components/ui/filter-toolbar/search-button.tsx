/**
 * Search icon + popover. The draft commits when the user submits Search.
 */
import { Cross2Icon, MagnifyingGlassIcon } from "@radix-ui/react-icons";
import { Button, Popover, TextField } from "@radix-ui/themes";
import { useId, useState } from "react";

import "./filter-toolbar.css";
import { iconClassName } from "./icon-class";

export type SearchButtonProps = {
  /** Applied search text. Drives the active dot. */
  value: string;
  disabled?: boolean;
  onApply: (search: string) => void;
  ariaLabel?: string;
  placeholder?: string;
};

export const SearchButton = ({
  value,
  disabled = false,
  onApply,
  ariaLabel = "Search",
  placeholder = "Search…",
}: SearchButtonProps) => {
  const searchId = useId();
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState(value);
  // Adjust state during render when the applied value changes (React docs).
  const [tracked, setTracked] = useState(value);
  if (tracked !== value) {
    setTracked(value);
    setDraft(value);
  }

  const handleOpenChange = (nextOpen: boolean) => {
    if (nextOpen) {
      // Discard uncommitted edits so the field matches the active dot.
      setDraft(value);
    }
    setOpen(nextOpen);
  };

  return (
    <Popover.Root onOpenChange={handleOpenChange} open={open}>
      <Popover.Trigger>
        <button
          aria-label={ariaLabel}
          className={iconClassName({
            open,
            active: Boolean(value.trim()),
          })}
          disabled={disabled}
          type="button"
        >
          <MagnifyingGlassIcon height={22} width={22} />
        </button>
      </Popover.Trigger>
      <Popover.Content
        align="end"
        className="app-filter-toolbar-popover"
        side="bottom"
        sideOffset={6}
        width="280px"
      >
        <form
          className="app-filter-toolbar-popover-body"
          onSubmit={(event) => {
            event.preventDefault();
            onApply(draft);
            setOpen(false);
          }}
        >
          <label className="app-filter-toolbar-label" htmlFor={searchId}>
            Search
            <TextField.Root
              disabled={disabled}
              id={searchId}
              onChange={(event) => {
                setDraft(event.target.value);
              }}
              placeholder={placeholder}
              value={draft}
            >
              {draft.trim() ? (
                <TextField.Slot side="right">
                  <button
                    aria-label="Clear search"
                    className="app-filter-toolbar-field-clear"
                    disabled={disabled}
                    onClick={() => {
                      setDraft("");
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
  );
};
