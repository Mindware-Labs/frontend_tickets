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
  disabled?: boolean;
}

export function FollowUpDateTimePicker({
  value,
  onChange,
  onClear,
  placeholder = "Date & time",
  className,
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
            "flex h-9 w-full items-center gap-2.5 rounded-lg border border-slate-200/80 bg-white px-3 text-left text-[13px] transition-all hover:border-[#008f68]/40 focus:outline-none focus:ring-1 focus:ring-[#008f68]/30",
            disabled && "cursor-not-allowed opacity-60",
            className,
          )}
        >
          <CalendarIcon className="h-4 w-4 shrink-0 text-[#008f68]" />
          <span
            className={cn(
              "truncate",
              displayLabel ? "font-medium text-slate-900" : "text-slate-400",
            )}
          >
            {displayLabel || placeholder}
          </span>
        </button>
      </PopoverTrigger>

      <PopoverContent
        data-ticket-sheet-overlay="true"
        align="start"
        sideOffset={6}
        className="w-[280px] overflow-hidden rounded-xl border border-slate-200/90 p-0 shadow-xl"
      >
        <Calendar
          mode="single"
          selected={calendarSelected}
          onSelect={handleDateSelect}
          disabled={{ before: minSelectableDate }}
          initialFocus
          showWeekNumber={false}
          className="p-2"
          classNames={{
            month: "gap-2",
            month_grid: "w-full border-collapse",
            weekdays: "table-row",
            week: "table-row",
            weekday:
              "w-9 p-0 text-center text-[0.8rem] font-normal text-muted-foreground",
            week_number: "hidden",
            week_number_header: "hidden",
          }}
        />

        <div className="border-t border-slate-100 bg-slate-50/80 px-3 py-2.5">
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 shrink-0 text-slate-400" />

            <input
              type="text"
              inputMode="numeric"
              maxLength={2}
              value={hourInput}
              onFocus={(e) => e.target.select()}
              onChange={(e) =>
                setHourInput(e.target.value.replace(/\D/g, "").slice(0, 2))
              }
              className="h-9 w-10 rounded-md border border-slate-200 bg-white text-center text-sm font-semibold tabular-nums text-slate-800 focus:border-[#008f68] focus:outline-none focus:ring-1 focus:ring-[#008f68]/30"
              aria-label="Hour"
            />
            <span className="text-sm font-bold text-slate-400">:</span>
            <input
              type="text"
              inputMode="numeric"
              maxLength={2}
              value={minuteInput}
              onFocus={(e) => e.target.select()}
              onChange={(e) =>
                setMinuteInput(e.target.value.replace(/\D/g, "").slice(0, 2))
              }
              className="h-9 w-10 rounded-md border border-slate-200 bg-white text-center text-sm font-semibold tabular-nums text-slate-800 focus:border-[#008f68] focus:outline-none focus:ring-1 focus:ring-[#008f68]/30"
              aria-label="Minute"
            />

            <div className="flex rounded-md border border-slate-200 bg-white p-0.5">
              {(["AM", "PM"] as const).map((period) => {
                const active = period === "PM" ? isPM : !isPM;
                return (
                  <button
                    key={period}
                    type="button"
                    onClick={() => setIsPM(period === "PM")}
                    className={cn(
                      "rounded px-2.5 py-1 text-xs font-bold transition-colors",
                      active
                        ? "bg-[#008f68] text-white shadow-sm"
                        : "text-slate-500 hover:text-slate-700",
                    )}
                  >
                    {period}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="mt-2.5 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={handleClear}
              className="rounded-md px-2.5 py-1.5 text-xs font-semibold text-slate-500 hover:bg-white hover:text-red-600"
            >
              Clear
            </button>
            <button
              type="button"
              onClick={handleDone}
              className="rounded-md bg-[#008f68] px-4 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-[#007a5a] focus:outline-none focus:ring-2 focus:ring-[#008f68]/30"
            >
              Done
            </button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
