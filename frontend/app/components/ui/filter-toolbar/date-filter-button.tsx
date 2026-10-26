/**
 * Date-filter icon + popover. The draft commits when the user clicks Apply.
 *
 * Custom range: From stays empty until filled in; To defaults to today.
 */
import { CalendarIcon } from "@radix-ui/react-icons";
import { Button, Popover, Select, TextField } from "@radix-ui/themes";
import { useId, useState } from "react";

import {
  DATE_FILTER_PRESETS,
  isDateFilterActive,
  isDateFilterPreset,
  todayIsoDate,
  type DateFilterPreset,
} from "./date-range";
import "./filter-toolbar.css";
import { iconClassName } from "./icon-class";

export type DateFilterApply = {
  datePreset: DateFilterPreset;
  dateFrom: string;
  dateTo: string;
};

export type DateFilterProps = {
  datePreset: DateFilterPreset;
  dateFrom: string;
  dateTo: string;
  disabled?: boolean;
  onApply: (next: DateFilterApply) => void;
  ariaLabel?: string;
  /** Label above the preset select (e.g. “Posted”). */
  selectLabel?: string;
};

export const DateFilter = ({
  datePreset: appliedPreset,
  dateFrom: appliedFrom,
  dateTo: appliedTo,
  disabled = false,
  onApply,
  ariaLabel = "Filter by date",
  selectLabel = "Date",
}: DateFilterProps) => {
  const datePresetId = useId();
  const fromId = useId();
  const toId = useId();
  const [open, setOpen] = useState(false);
  const [datePreset, setDatePreset] = useState(appliedPreset);
  const [fromDate, setFromDate] = useState(appliedFrom);
  const [toDate, setToDate] = useState(appliedTo);
  // Adjust state during render when applied props change (React docs).
  const [tracked, setTracked] = useState({
    datePreset: appliedPreset,
    dateFrom: appliedFrom,
    dateTo: appliedTo,
  });
  if (
    tracked.datePreset !== appliedPreset ||
    tracked.dateFrom !== appliedFrom ||
    tracked.dateTo !== appliedTo
  ) {
    setTracked({
      datePreset: appliedPreset,
      dateFrom: appliedFrom,
      dateTo: appliedTo,
    });
    setDatePreset(appliedPreset);
    setFromDate(appliedFrom);
    setToDate(appliedTo);
  }

  const handleOpenChange = (nextOpen: boolean) => {
    if (nextOpen) {
      // Discard uncommitted edits so the fields match the active dot.
      setDatePreset(appliedPreset);
      setFromDate(appliedFrom);
      setToDate(appliedTo);
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
            active: isDateFilterActive(appliedPreset, appliedFrom, appliedTo),
          })}
          disabled={disabled}
          type="button"
        >
          <CalendarIcon height={22} width={22} />
        </button>
      </Popover.Trigger>
      <Popover.Content
        align="end"
        className="app-filter-toolbar-popover"
        side="bottom"
        sideOffset={6}
        width="260px"
      >
        <form
          className="app-filter-toolbar-popover-body"
          onSubmit={(event) => {
            event.preventDefault();
            const isCustom = datePreset === "custom";
            const nextFrom = isCustom ? fromDate.trim() : "";
            const nextTo = isCustom ? toDate.trim() : "";
            onApply({
              datePreset: isCustom && !nextFrom && !nextTo ? "any" : datePreset,
              dateFrom: nextFrom,
              dateTo: nextTo,
            });
            setOpen(false);
          }}
        >
          <label className="app-filter-toolbar-label" htmlFor={datePresetId}>
            {selectLabel}
            <Select.Root
              disabled={disabled}
              onValueChange={(value) => {
                if (!isDateFilterPreset(value)) {
                  return;
                }

                setDatePreset(value);
                if (value === "custom" && !toDate.trim()) {
                  setToDate(todayIsoDate());
                }
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
              <label className="app-filter-toolbar-label" htmlFor={fromId}>
                From
                <TextField.Root
                  className="app-filter-toolbar-date"
                  disabled={disabled}
                  id={fromId}
                  onChange={(event) => {
                    setFromDate(event.target.value);
                  }}
                  type="date"
                  value={fromDate}
                />
              </label>
              <label className="app-filter-toolbar-label" htmlFor={toId}>
                To
                <TextField.Root
                  className="app-filter-toolbar-date"
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
  );
};
