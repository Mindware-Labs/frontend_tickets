"use client";

import { useEffect, useMemo, useState } from "react";
import { format } from "date-fns";
import { CalendarIcon, Clock } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

function to12hParts(date: Date) {
  const h24 = date.getHours();
  const isPM = h24 >= 12;
  const h12 = h24 === 0 ? 12 : h24 > 12 ? h24 - 12 : h24;
  return { h12, minutes: date.getMinutes(), isPM };
}

function buildIso(
  base: Date,
  h12: number,
  minutes: number,
  isPM: boolean,
): string {
  const h24 = h12 === 12 ? (isPM ? 12 : 0) : isPM ? h12 + 12 : h12;
  const d = new Date(base);
  d.setHours(h24, minutes, 0, 0);
  return d.toISOString();
}

function startOfToday(): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

interface FollowUpDateTimePickerProps {
  value?: string;
  onChange: (iso: string) => void;
  onClear?: () => void;
  placeholder?: string;
  className?: string;
  popoverClassName?: string;
  disablePast?: boolean;
  disabled?: boolean;
}

export function FollowUpDateTimePicker({
  value,
  onChange,
  onClear,
  placeholder = "Date & time",
  className,
  popoverClassName,
  disablePast = true,
  disabled,
}: FollowUpDateTimePickerProps) {
  const [open, setOpen] = useState(false);
  const [draftDate, setDraftDate] = useState<Date | undefined>(undefined);
  const [hourInput, setHourInput] = useState("12");
  const [minuteInput, setMinuteInput] = useState("00");
  const [isPM, setIsPM] = useState(false);

  const minSelectableDate = useMemo(() => startOfToday(), []);

  useEffect(() => {
    if (!open) return;
    const ref = value ? new Date(value) : new Date();
    const valid = !isNaN(ref.getTime());
    const base = valid ? ref : new Date();
    setDraftDate(value && valid ? new Date(value) : undefined);
    const { h12, minutes, isPM: pm } = to12hParts(base);
    setHourInput(String(h12).padStart(2, "0"));
    setMinuteInput(String(minutes).padStart(2, "0"));
    setIsPM(pm);
  }, [open, value]);

  const displayLabel = useMemo(() => {
    if (!value) return null;
    try {
      const d = new Date(value);
      if (isNaN(d.getTime())) return null;
      return format(d, "MMM d, yyyy · h:mm a");
    } catch {
      return null;
    }
  }, [value]);

  const calendarSelected = draftDate;

  const parseTimeInputs = () => {
    const h12 = Math.min(12, Math.max(1, parseInt(hourInput, 10) || 12));
    const minutes = Math.min(59, Math.max(0, parseInt(minuteInput, 10) || 0));
    return { h12, minutes };
  };

  const handleDateSelect = (date: Date | undefined) => {
    if (!date) return;
    const { h12, minutes } = parseTimeInputs();
    const h24 =
      h12 === 12 ? (isPM ? 12 : 0) : isPM ? h12 + 12 : h12;
    const next = new Date(date);
    next.setHours(h24, minutes, 0, 0);
    setDraftDate(next);
  };

  const handleDone = () => {
    const base = draftDate ?? new Date();
    const { h12, minutes } = parseTimeInputs();
    setHourInput(String(h12).padStart(2, "0"));
    setMinuteInput(String(minutes).padStart(2, "0"));
    onChange(buildIso(base, h12, minutes, isPM));
    setOpen(false);
  };
  const handleClear = () => {
    setDraftDate(undefined);
    onChange("");
    onClear?.();
    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          disabled={disabled}
          className={cn(
            "flex h-9 w-full items-center gap-2.5 rounded-lg border border-slate-200/80 bg-white px-3 text-left text-[13px] transition-all hover:border-[#008f68]/40 focus:outline-none focus:ring-1 focus:ring-[#008f68]/30 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100 dark:hover:border-emerald-500/40 dark:focus:ring-emerald-500/20",
            disabled && "cursor-not-allowed opacity-60",
            className,
          )}
        >
          <CalendarIcon className="h-4 w-4 shrink-0 text-[#008f68] dark:text-emerald-400" />
          <span
            className={cn(
              "truncate",
              displayLabel ? "font-medium text-slate-900 dark:text-slate-100" : "text-slate-400 dark:text-slate-500",
            )}
          >
            {displayLabel || placeholder}
          </span>
        </button>
      </PopoverTrigger>

      <PopoverContent
        data-ticket-sheet-overlay="true"
        align="center"
        sideOffset={6}
        avoidCollisions
        collisionPadding={16}
        className={cn(
          "w-[min(calc(100vw-2rem),20rem)] overflow-hidden rounded-xl border border-slate-200/90 bg-white p-0 shadow-xl dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100",
          popoverClassName,
        )}
      >
        {/* Compact calendar — outside days are kept (faded) so the first /
            last week of the month never render with awkward empty cells. */}
        <div className="px-4 pt-3.5 pb-3">
          <Calendar
            mode="single"
            selected={calendarSelected}
            onSelect={handleDateSelect}
            disabled={disablePast ? { before: minSelectableDate } : undefined}
            initialFocus
            showWeekNumber={false}
            showOutsideDays
            className="mx-auto w-full p-0 [--cell-size:2rem]"
            classNames={{
              root: "w-full",
              months: "relative flex w-full flex-col",
              month: "flex w-full flex-col gap-2",
              nav: "absolute inset-x-0 top-0 flex h-8 items-center justify-between",
              button_previous:
                "size-8 rounded-lg p-0 text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-450 dark:hover:bg-slate-800 dark:hover:text-slate-100",
              button_next:
                "size-8 rounded-lg p-0 text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-450 dark:hover:bg-slate-800 dark:hover:text-slate-100",
              month_caption:
                "flex h-8 w-full items-center justify-center px-10 text-[13px] font-semibold text-slate-700 dark:text-slate-205",
              caption_label: "select-none text-[13px] font-semibold leading-none",
              month_grid: "w-full table-fixed border-separate border-spacing-0",
              weekdays: "grid w-full grid-cols-7",
              week: "mt-1 grid w-full grid-cols-7",
              weekday:
                "flex h-6 items-center justify-center p-0 text-center text-[10px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500",
              week_number: "hidden",
              week_number_header: "hidden",
              day: "flex size-8 items-center justify-center p-0 text-center group/day select-none",
              day_button:
                "mx-auto flex size-8! min-w-8! items-center justify-center rounded-lg text-[13px] font-medium leading-none text-slate-800 transition-colors hover:bg-slate-100 hover:text-slate-955 data-[selected-single=true]:bg-[#e2f5ef] data-[selected-single=true]:text-slate-955 data-[selected-single=true]:shadow-none group-data-[focused=true]/day:ring-2 group-data-[focused=true]/day:ring-[#008f68]/20 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white dark:data-[selected-single=true]:bg-emerald-950 dark:data-[selected-single=true]:text-emerald-350 dark:group-data-[focused=true]/day:ring-emerald-500/30",
              today: "rounded-lg bg-transparent text-slate-900 dark:text-slate-100 font-semibold ring-1 ring-slate-200 dark:ring-slate-800",
              outside:
                "text-slate-300 aria-selected:text-slate-300 dark:text-slate-650",
              disabled: "text-slate-200 dark:text-slate-800 opacity-70",
            }}
          />
        </div>

        <div className="border-t border-slate-100 bg-slate-50/90 px-3 py-2.5 dark:border-slate-800/80 dark:bg-slate-900/40">
          <div className="grid grid-cols-[1fr_auto] items-center gap-3 rounded-lg border border-slate-200/70 bg-white px-2.5 py-2 dark:border-slate-800 dark:bg-slate-950">
            <div className="flex min-w-0 items-center gap-1.5">
              <Clock
                className="h-3.5 w-3.5 shrink-0 text-slate-400 dark:text-slate-500"
                aria-hidden
              />
              <input
                type="text"
                inputMode="numeric"
                maxLength={2}
                value={hourInput}
                onFocus={(e) => e.target.select()}
                onChange={(e) =>
                  setHourInput(e.target.value.replace(/\D/g, "").slice(0, 2))
                }
                className="h-7 w-9 rounded-md border border-slate-200 bg-slate-50 text-center text-[12px] font-semibold tabular-nums text-slate-800 focus:border-[#008f68] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#008f68]/30 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100 dark:focus:border-emerald-500 dark:focus:bg-slate-950 dark:focus:ring-emerald-500/20"
                aria-label="Hour"
              />
              <span className="text-[12px] font-bold text-slate-400 dark:text-slate-650">:</span>
              <input
                type="text"
                inputMode="numeric"
                maxLength={2}
                value={minuteInput}
                onFocus={(e) => e.target.select()}
                onChange={(e) =>
                  setMinuteInput(e.target.value.replace(/\D/g, "").slice(0, 2))
                }
                className="h-7 w-9 rounded-md border border-slate-200 bg-slate-50 text-center text-[12px] font-semibold tabular-nums text-slate-800 focus:border-[#008f68] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#008f68]/30 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100 dark:focus:border-emerald-500 dark:focus:bg-slate-950 dark:focus:ring-emerald-500/20"
                aria-label="Minute"
              />
            </div>
            <div className="flex rounded-md border border-slate-200 bg-slate-50 p-0.5 dark:border-slate-800 dark:bg-slate-900">
              {(["AM", "PM"] as const).map((period) => {
                const active = period === "PM" ? isPM : !isPM;
                return (
                  <button
                    key={period}
                    type="button"
                    onClick={() => setIsPM(period === "PM")}
                    className={cn(
                      "h-6 min-w-8 rounded px-2 text-[10px] font-bold transition-colors",
                      active
                        ? "bg-[#008f68] text-white shadow-sm dark:bg-emerald-600"
                        : "text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200",
                    )}
                  >
                    {period}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="mt-2.5 flex items-center justify-end gap-2 border-t border-slate-200/70 pt-2.5 dark:border-slate-800/80">
            <button
              type="button"
              onClick={handleClear}
              className="h-7 rounded-md px-2.5 text-[11px] font-semibold text-slate-500 transition-colors hover:bg-white hover:text-rose-600 dark:text-slate-400 dark:hover:bg-slate-850 dark:hover:text-rose-400"
            >
              Clear
            </button>
            <button
              type="button"
              onClick={handleDone}
              className="h-7 rounded-md bg-[#008f68] px-4 text-[11px] font-semibold text-white shadow-sm transition-colors hover:bg-[#007a5a] focus:outline-none focus:ring-2 focus:ring-[#008f68]/30 dark:bg-emerald-600 dark:hover:bg-emerald-700 dark:focus:ring-emerald-500/20"
            >
              Done
            </button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
