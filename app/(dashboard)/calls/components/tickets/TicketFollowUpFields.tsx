"use client";

import { useEffect, useMemo, useState } from "react";
import { SelectItem } from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { CalendarIcon, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import { fmtDateTime } from "../../utils/call-helpers";
import { InspectorSelect } from "../shared/InspectorHelpers";

function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
      {children}
    </p>
  );
}

export interface TicketFollowUpFieldsProps {
  followUpDueDate: string;
  followUpAssignedToId: string;
  onFollowUpDueDateChange: (iso: string) => void;
  onFollowUpAssignedToIdChange: (id: string) => void;
  agents: { id: number; name: string }[];
  /** Extra classes for portaled overlays (e.g. z-[120] in peek panel) */
  popoverClassName?: string;
  selectContentClassName?: string;
}

export function TicketFollowUpFields({
  followUpDueDate,
  followUpAssignedToId,
  onFollowUpDueDateChange,
  onFollowUpAssignedToIdChange,
  agents,
  popoverClassName,
  selectContentClassName,
}: TicketFollowUpFieldsProps) {
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [timeHourInput, setTimeHourInput] = useState("12");
  const [timeMinuteInput, setTimeMinuteInput] = useState("00");
  const [timePeriod, setTimePeriod] = useState<"AM" | "PM">("AM");

  const followUpDateDisplay = useMemo(
    () => (followUpDueDate ? fmtDateTime(followUpDueDate) : null),
    [followUpDueDate],
  );

  useEffect(() => {
    if (followUpDueDate) {
      const d = new Date(followUpDueDate);
      const h24 = d.getHours();
      const h12 = h24 === 0 ? 12 : h24 > 12 ? h24 - 12 : h24;
      setTimeHourInput(String(h12).padStart(2, "0"));
      setTimeMinuteInput(String(d.getMinutes()).padStart(2, "0"));
      setTimePeriod(h24 < 12 ? "AM" : "PM");
    } else {
      setTimeHourInput("12");
      setTimeMinuteInput("00");
      setTimePeriod("AM");
    }
  }, [followUpDueDate]);

  const applyDateTime = (
    date: Date,
    closePopover = false,
    overrides?: {
      hourInput?: string;
      minuteInput?: string;
      period?: "AM" | "PM";
    },
  ) => {
    const h = parseInt(overrides?.hourInput ?? timeHourInput) || 12;
    const m = parseInt(overrides?.minuteInput ?? timeMinuteInput) || 0;
    const period = overrides?.period ?? timePeriod;
    const h24 =
      period === "AM" ? (h === 12 ? 0 : h) : h === 12 ? 12 : h + 12;
    const d = new Date(date);
    d.setHours(h24, m, 0, 0);
    onFollowUpDueDateChange(d.toISOString());
    if (closePopover) setCalendarOpen(false);
  };

  const commitTimeIfDateSet = (overrides?: {
    hourInput?: string;
    minuteInput?: string;
    period?: "AM" | "PM";
  }) => {
    if (!followUpDueDate) return;
    applyDateTime(new Date(followUpDueDate), false, overrides);
  };

  return (
    <div className="grid grid-cols-2 gap-2 rounded-lg p-2.5 bg-amber-50 border border-amber-200/70">
      <div>
        <div className="flex items-center gap-1.5 mb-1.5">
          <FieldLabel>Follow-up Date</FieldLabel>
          <span className="text-[8.5px] font-black text-amber-600 bg-amber-100 border border-amber-300/60 px-1.5 py-0.5 rounded-md uppercase tracking-wide">
            Follow-up
          </span>
        </div>
        <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
          <PopoverTrigger asChild>
            <button
              type="button"
              className="w-full h-8 flex items-center gap-2 px-2.5 text-xs rounded-lg border bg-white border-amber-300 hover:border-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-300/30 transition-colors text-left pointer-events-auto"
            >
              <CalendarIcon className="w-3.5 h-3.5 shrink-0 text-amber-500" />
              <span
                className={cn(
                  "min-w-0 truncate",
                  followUpDateDisplay
                    ? "text-slate-800 font-semibold text-xs"
                    : "text-amber-400 text-xs",
                )}
              >
                {followUpDateDisplay || "Pick date…"}
              </span>
            </button>
          </PopoverTrigger>
          <PopoverContent
            data-ticket-sheet-overlay="true"
            className={cn(
              "w-auto p-0 shadow-xl border-slate-200",
              popoverClassName,
            )}
            align="start"
          >
            <Calendar
              mode="single"
              selected={
                followUpDueDate ? new Date(followUpDueDate) : undefined
              }
              onSelect={(date) => {
                if (!date) return;
                applyDateTime(date);
              }}
              disabled={{ before: new Date() }}
              initialFocus
            />
            <div className="px-3 pb-3 border-t border-slate-100 pt-3">
              <div className="flex items-center gap-2">
                <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <div className="flex items-center gap-1">
                  <input
                    type="text"
                    maxLength={2}
                    value={timeHourInput}
                    onChange={(e) => {
                      setTimeHourInput(e.target.value.replace(/\D/g, ""));
                    }}
                    onBlur={() => {
                      const h = Math.min(
                        12,
                        Math.max(1, parseInt(timeHourInput) || 12),
                      );
                      const normalized = String(h).padStart(2, "0");
                      setTimeHourInput(normalized);
                      commitTimeIfDateSet({ hourInput: normalized });
                    }}
                    className="w-9 h-7 text-center text-xs font-semibold border border-slate-200 rounded-md focus:outline-none focus:ring-1 focus:ring-amber-400"
                  />
                  <span className="text-slate-500 text-xs font-bold">:</span>
                  <input
                    type="text"
                    maxLength={2}
                    value={timeMinuteInput}
                    onChange={(e) => {
                      setTimeMinuteInput(e.target.value.replace(/\D/g, ""));
                    }}
                    onBlur={() => {
                      const m = Math.min(
                        59,
                        Math.max(0, parseInt(timeMinuteInput) || 0),
                      );
                      const normalized = String(m).padStart(2, "0");
                      setTimeMinuteInput(normalized);
                      commitTimeIfDateSet({ minuteInput: normalized });
                    }}
                    className="w-9 h-7 text-center text-xs font-semibold border border-slate-200 rounded-md focus:outline-none focus:ring-1 focus:ring-amber-400"
                  />
                </div>
                <div className="flex rounded-md border border-slate-200 overflow-hidden">
                  {(["AM", "PM"] as const).map((p) => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => {
                        setTimePeriod(p);
                        if (followUpDueDate) {
                          commitTimeIfDateSet({ period: p });
                        }
                      }}
                      className={cn(
                        "px-2 h-7 text-[10px] font-bold transition-colors",
                        timePeriod === p
                          ? "bg-amber-500 text-white"
                          : "bg-white text-slate-500 hover:bg-slate-50",
                      )}
                    >
                      {p}
                    </button>
                  ))}
                </div>
                {followUpDueDate && (
                  <button
                    type="button"
                    onClick={() => {
                      const d = followUpDueDate
                        ? new Date(followUpDueDate)
                        : new Date();
                      applyDateTime(d, true);
                    }}
                    className="ml-auto text-[10px] font-semibold text-amber-600 hover:text-amber-700 bg-amber-50 border border-amber-200 px-2 py-1 rounded-md"
                  >
                    Done
                  </button>
                )}
              </div>
              {followUpDueDate && (
                <div className="mt-2 flex justify-end">
                  <button
                    type="button"
                    onClick={() => {
                      onFollowUpDueDateChange("");
                      setCalendarOpen(false);
                    }}
                    className="text-xs text-red-500 hover:text-red-600"
                  >
                    Clear
                  </button>
                </div>
              )}
            </div>
          </PopoverContent>
        </Popover>
      </div>

      <div>
        <FieldLabel>Assignee</FieldLabel>
        <InspectorSelect
          value={followUpAssignedToId || ""}
          onChange={(v) =>
            onFollowUpAssignedToIdChange(v === "none" ? "" : v)
          }
          placeholder="Assign…"
          contentClassName={selectContentClassName}
        >
          <SelectItem value="none">Unassigned</SelectItem>
          {agents.map((a) => (
            <SelectItem key={a.id} value={a.id.toString()}>
              {a.name}
            </SelectItem>
          ))}
        </InspectorSelect>
      </div>
    </div>
  );
}
