"use client";

import { useMemo } from "react";
import { ClipboardList, History, UserRound } from "lucide-react";
import {
  formatDistanceToNow,
  format,
  isToday,
  isYesterday,
} from "date-fns";
import type { ManualRecord } from "../../types";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export interface CustomerManualRecordGroup {
  key: string;
  customerId?: number;
  customerName: string;
  customerPhone: string;
  records: ManualRecord[];
  latestRecord: ManualRecord;
}

const STATUS_META: Record<
  string,
  { label: string; color: string; bg: string; ring: string }
> = {
  ACTIVE: {
    label: "Active",
    color: "#008f68",
    bg: "#e6f5f0",
    ring: "border-emerald-400",
  },
  OPEN: {
    label: "Active",
    color: "#008f68",
    bg: "#e6f5f0",
    ring: "border-emerald-400",
  },
  IN_PROGRESS: {
    label: "Active",
    color: "#008f68",
    bg: "#e6f5f0",
    ring: "border-emerald-400",
  },
  PENDING_FOLLOWUP: {
    label: "Follow-up",
    color: "#c47a00",
    bg: "#fef3d6",
    ring: "border-amber-400",
  },
  OVERDUE: {
    label: "Overdue",
    color: "#c0392b",
    bg: "#fde8e6",
    ring: "border-rose-400",
  },
  RESOLVED: {
    label: "Resolved",
    color: "#008f68",
    bg: "#e6f5f0",
    ring: "border-emerald-400",
  },
  CLOSED: {
    label: "Closed",
    color: "#64748b",
    bg: "#f1f5f9",
    ring: "border-slate-300",
  },
};

const formatLabel = (v: string) =>
  v
    .replace(/_/g, " ")
    .toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase());

const normalizeStatusKey = (status?: string | null) => {
  const key = (status || "").toString().toUpperCase().replace(/\s+/g, "_");
  return key === "OPEN" || key === "IN_PROGRESS" ? "ACTIVE" : key;
};

function formatShortDate(date: Date): string {
  if (isToday(date)) return `Today ${format(date, "HH:mm")}`;
  if (isYesterday(date)) return `Yesterday ${format(date, "HH:mm")}`;
  return format(date, "MMM d, HH:mm");
}

function recordAgentName(record: ManualRecord): string | null {
  return (
    record.createdBy?.name?.trim() ||
    record.createdByName?.trim() ||
    (record.createdByAgentId ? `Agent #${record.createdByAgentId}` : null)
  );
}

interface InlineManualRecordTimelineProps {
  group: CustomerManualRecordGroup;
  onOpenRecord?: (record: ManualRecord) => void;
}

export function InlineManualRecordTimeline({
  group,
  onOpenRecord,
}: InlineManualRecordTimelineProps) {
  const sortedRecords = useMemo(() => {
    return [...group.records].sort((a, b) => {
      const ad = new Date(a.createdAt || 0).getTime();
      const bd = new Date(b.createdAt || 0).getTime();
      return bd - ad;
    });
  }, [group.records]);

  const lastEventAgo = useMemo(() => {
    const first = sortedRecords[0];
    if (!first?.createdAt) return null;
    const d = new Date(first.createdAt);
    if (isNaN(d.getTime())) return null;
    return formatDistanceToNow(d, { addSuffix: true });
  }, [sortedRecords]);

  const latestRecord = sortedRecords[0];
  const latestStatusKey = latestRecord
    ? normalizeStatusKey(latestRecord.status)
    : null;
  const latestMeta = latestStatusKey
    ? STATUS_META[latestStatusKey] ?? STATUS_META.CLOSED
    : null;

  return (
    <div className="mx-2 mb-2 rounded-xl border border-slate-200/80 bg-[#f8f9fb] shadow-sm">
      <div className="flex items-center justify-between gap-3 overflow-hidden rounded-t-xl border-b border-slate-100 bg-white px-3 py-2.5">
        <div className="flex min-w-0 items-center gap-2.5">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#008f68]/10">
            <UserRound className="h-4 w-4 text-[#008f68]" />
          </div>
          <div className="min-w-0">
            <p className="truncate text-[12px] font-semibold text-slate-800">
              {group.customerName || "Unknown"}
            </p>
            {group.customerPhone && group.customerPhone !== "unknown" && (
              <p className="truncate font-mono text-[10.5px] tabular-nums text-slate-500">
                {group.customerPhone}
              </p>
            )}
          </div>
        </div>
        {latestMeta && (
          <span
            className="inline-flex shrink-0 items-center gap-1 rounded-md px-2 py-0.5 text-[10px] font-semibold"
            style={{ color: latestMeta.color, background: latestMeta.bg }}
          >
            Latest: {latestMeta.label}
          </span>
        )}
      </div>

      <div className="px-3 py-3">
        <div className="mb-3">
          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">
            Record timeline · {sortedRecords.length}{" "}
            {sortedRecords.length === 1 ? "record" : "records"}
          </p>
          {lastEventAgo && (
            <p className="mt-0.5 text-[10.5px] text-slate-400">
              Last activity {lastEventAgo}
            </p>
          )}
        </div>

        <div className="relative rounded-lg border border-slate-100 bg-white px-3 py-2.5">
          <div className="absolute bottom-3 left-[1.15rem] top-3 w-px bg-slate-200" />
          <ol className="space-y-2.5">
            {sortedRecords.map((record, index) => {
              const date = new Date(record.createdAt || 0);
              const dateLabel = isNaN(date.getTime())
                ? "—"
                : formatShortDate(date);
              const statusKey = normalizeStatusKey(record.status);
              const sm = STATUS_META[statusKey] ?? STATUS_META.CLOSED;
              const agent = recordAgentName(record);
              const notes = record.notes?.trim();
              const isLatest = index === 0;

              return (
                <li
                  key={record.id}
                  className={cn(
                    "relative min-w-0 pl-8",
                    isLatest && "rounded-md bg-slate-50/80 py-1",
                  )}
                >
                  <span
                    className={cn(
                      "absolute left-0 top-1 flex h-5 w-5 items-center justify-center rounded-full bg-white border-2",
                      sm.ring,
                    )}
                  >
                    <ClipboardList
                      className="h-2.5 w-2.5"
                      style={{ color: sm.color }}
                    />
                  </span>

                  <div className="min-w-0 space-y-0.5">
                    <p className="whitespace-nowrap text-[10.5px] tabular-nums text-slate-500">
                      {dateLabel}
                      <span className="mx-1.5 text-slate-300">·</span>
                      <span className="font-mono text-slate-400">
                        #{record.id}
                      </span>
                    </p>
                    <div className="flex min-w-0 flex-wrap items-center gap-1.5">
                      <span
                        className="shrink-0 rounded-md px-1.5 py-0.5 text-[10.5px] font-semibold"
                        style={{ color: sm.color, background: sm.bg }}
                      >
                        {sm.label}
                      </span>
                      {record.disposition && (
                        <span className="shrink-0 text-[10.5px] text-slate-600">
                          {formatLabel(record.disposition)}
                        </span>
                      )}
                      {agent && (
                        <>
                          <span className="shrink-0 text-slate-300">·</span>
                          <span className="max-w-[9rem] truncate text-[10.5px] text-slate-600">
                            {agent}
                          </span>
                        </>
                      )}
                      {isLatest && (
                        <span className="shrink-0 rounded bg-[#008f68]/10 px-1.5 py-px text-[9px] font-bold uppercase tracking-wide text-[#008f68]">
                          Latest
                        </span>
                      )}
                    </div>
                  </div>

                  {notes && (
                    <p className="mt-1 line-clamp-2 border-l-2 border-slate-200 pl-2 text-[10.5px] leading-snug text-slate-500">
                      {notes}
                    </p>
                  )}
                </li>
              );
            })}
          </ol>
        </div>

        {onOpenRecord && latestRecord && (
          <div className="mt-3">
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="h-8 rounded-lg border-slate-200 px-3.5 text-[12px] font-semibold text-[#008f68] hover:border-[#008f68]/40 hover:bg-[#008f68]/8"
              onClick={() => onOpenRecord(latestRecord)}
            >
              <History className="mr-1.5 h-3.5 w-3.5" />
              Open record
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
