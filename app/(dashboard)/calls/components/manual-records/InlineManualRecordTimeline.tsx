"use client";

import { useMemo } from "react";
import { History, UserRound } from "lucide-react";
import { formatDistanceToNow, format, isToday, isYesterday } from "date-fns";
import { es } from "date-fns/locale";
import type { ManualRecord } from "../../types";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { chipColors } from "@/lib/chip-colors";

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
  { label: string; color: string; bg: string; dot: string }
> = {
  ACTIVE:          { label: "Active",    color: "#006d50", bg: "#e6f5f0", dot: "#008f68" },
  OPEN:            { label: "Active",    color: "#006d50", bg: "#e6f5f0", dot: "#008f68" },
  IN_PROGRESS:     { label: "Active",    color: "#006d50", bg: "#e6f5f0", dot: "#008f68" },
  PENDING_FOLLOWUP:{ label: "Follow-up", color: "#b45309", bg: "#fef3c7", dot: "#d97706" },
  OVERDUE:         { label: "Overdue",   color: "#b91c1c", bg: "#fee2e2", dot: "#dc2626" },
  RESOLVED:        { label: "Resolved",  color: "#006d50", bg: "#e6f5f0", dot: "#008f68" },
  CLOSED:          { label: "Closed",    color: "#475569", bg: "#f1f5f9", dot: "#64748b" },
};

const normalizeStatusKey = (s?: string | null) => {
  const k = (s || "").toUpperCase().replace(/\s+/g, "_");
  return k === "OPEN" || k === "IN_PROGRESS" ? "ACTIVE" : k;
};

const formatLabel = (v: string) =>
  v.replace(/_/g, " ").toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());

function formatCardDate(date: Date): string {
  if (isToday(date))     return format(date, "HH:mm");
  if (isYesterday(date)) return `ayer ${format(date, "HH:mm")}`;
  return format(date, "EEE, d MMM", { locale: es });
}

function recordAgentName(r: ManualRecord): string | null {
  return (
    r.createdBy?.name?.trim() ||
    r.createdByName?.trim() ||
    (r.createdByAgentId ? `Agent #${r.createdByAgentId}` : null)
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
  const sortedRecords = useMemo(
    () =>
      [...group.records].sort(
        (a, b) =>
          new Date(b.createdAt || 0).getTime() -
          new Date(a.createdAt || 0).getTime(),
      ),
    [group.records],
  );

  const lastEventAgo = useMemo(() => {
    const first = sortedRecords[0];
    if (!first?.createdAt) return null;
    const d = new Date(first.createdAt);
    return isNaN(d.getTime()) ? null : formatDistanceToNow(d, { addSuffix: true });
  }, [sortedRecords]);

  return (
    <div className="mx-2 mb-2 rounded-xl border border-slate-200/80 dark:border-neutral-700 bg-[#f8f9fb] dark:bg-neutral-950 shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between gap-3 overflow-hidden rounded-t-xl border-b border-slate-100 dark:border-neutral-800 bg-white dark:bg-neutral-900 px-3 py-2.5">
        <div className="flex min-w-0 items-center gap-2.5">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#008f68]/10">
            <UserRound className="h-4 w-4 text-[#008f68]" />
          </div>
          <div className="min-w-0">
            <p className="truncate text-[12px] font-semibold text-slate-800 dark:text-neutral-200">
              {group.customerName || "Unknown"}
            </p>
            {group.customerPhone && group.customerPhone !== "unknown" && (
              <p className="truncate font-mono text-[10.5px] tabular-nums text-slate-500">
                {group.customerPhone}
              </p>
            )}
          </div>
        </div>
        <span className="shrink-0 text-[10.5px] text-slate-400">
          {sortedRecords.length}{" "}
          {sortedRecords.length === 1 ? "record" : "records"}
          {lastEventAgo ? ` · ${lastEventAgo}` : ""}
        </span>
      </div>

      {/* Timeline */}
      <div className="px-3 py-3">
        <ol className="relative space-y-2">
          {sortedRecords.map((record, index) => {
            const isLast = index === sortedRecords.length - 1;
            const date = new Date(record.createdAt || 0);
            const dateLabel = isNaN(date.getTime()) ? "—" : formatCardDate(date);
            const sk = normalizeStatusKey(record.status);
            const sm = STATUS_META[sk] ?? STATUS_META.CLOSED;
            const agent = recordAgentName(record);
            const notes = record.notes?.trim();
            const isLatest = index === 0;

            return (
              <li key={record.id} className="relative flex gap-3 pl-1">
                {/* Dot + vertical connector */}
                <div className="relative flex flex-col items-center">
                  <span
                    className="relative z-10 mt-3 flex h-3 w-3 shrink-0 rounded-full border-2 border-white dark:border-neutral-900 shadow-sm"
                    style={{ background: sm.dot }}
                  />
                  {/* Line: only between items, not after the last */}
                  {!isLast && (
                    <span className="mt-1 w-px flex-1 bg-slate-200 dark:bg-neutral-700" />
                  )}
                </div>

                {/* Card */}
                <button
                  type="button"
                  onClick={() => onOpenRecord?.(record)}
                  className={cn(
                    "mb-2 w-full rounded-xl border text-left transition-all",
                    isLatest
                      ? "border-[#008f68]/20 bg-[#008f68]/5 shadow-sm hover:border-[#008f68]/30 hover:bg-[#008f68]/8"
                      : "border-slate-100 dark:border-neutral-800 bg-white dark:bg-neutral-900 hover:border-slate-200 dark:hover:border-neutral-700 hover:bg-slate-50/60 dark:hover:bg-neutral-800/50",
                  )}
                >
                  <div className="px-3 py-2.5">
                    {/* Top row: ID + date */}
                    <div className="mb-1.5 flex items-center justify-between gap-2">
                      <span
                        className="font-mono text-[11px] font-bold"
                        style={{ color: sm.color }}
                      >
                        #{record.id}
                      </span>
                      <span className="shrink-0 text-[10px] tabular-nums text-slate-400">
                        {dateLabel}
                      </span>
                    </div>

                    {/* Pills */}
                    <div className="mb-1.5 flex flex-wrap items-center gap-1">
                      <span
                        className="inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[10px] font-semibold"
                        style={chipColors(sm.color, sm.bg)}
                      >
                        <span
                          className="h-1.5 w-1.5 shrink-0 rounded-full"
                          style={{ background: sm.dot }}
                        />
                        {sm.label}
                      </span>

                      {record.campaignOption && (
                        <span className="inline-flex items-center rounded-md bg-slate-100 dark:bg-neutral-800 px-1.5 py-0.5 text-[10px] font-semibold text-slate-600 dark:text-neutral-300">
                          {formatLabel(record.campaignOption)}
                        </span>
                      )}

                      {record.disposition && (
                        <span className="inline-flex items-center rounded-md bg-slate-100 dark:bg-neutral-800 px-1.5 py-0.5 text-[10px] font-semibold text-slate-600 dark:text-neutral-300">
                          {formatLabel(record.disposition)}
                        </span>
                      )}

                      {isLatest && (
                        <span className="ml-auto shrink-0 rounded bg-[#008f68]/10 px-1.5 py-px text-[9px] font-bold uppercase tracking-wide text-[#008f68]">
                          Latest
                        </span>
                      )}
                    </div>

                    {/* Agent */}
                    {agent && (
                      <div className="mb-1 flex items-center gap-1.5">
                        <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-slate-300" />
                        <span className="truncate text-[11px] text-slate-600 dark:text-neutral-300">
                          {agent}
                        </span>
                      </div>
                    )}

                    {/* Notes */}
                    {notes && (
                      <p className="line-clamp-2 text-[11.5px] italic leading-snug text-slate-500 dark:text-neutral-200">
                        {notes}
                      </p>
                    )}

                    {/* Campaign name */}
                    {record.campaign?.nombre && (
                      <p className="mt-1 truncate text-[10px] text-slate-400">
                        {record.campaign.nombre}
                      </p>
                    )}
                  </div>
                </button>
              </li>
            );
          })}
        </ol>

        {onOpenRecord && sortedRecords[0] && (
          <Button
            type="button"
            size="sm"
            variant="outline"
            className="mt-1 h-8 w-full rounded-lg border-slate-200 dark:border-neutral-700 px-3.5 text-[12px] font-semibold text-[#008f68] hover:border-[#008f68]/40 hover:bg-[#008f68]/8"
            onClick={() => onOpenRecord(sortedRecords[0])}
          >
            <History className="mr-1.5 h-3.5 w-3.5" />
            Open latest record
          </Button>
        )}
      </div>
    </div>
  );
}
