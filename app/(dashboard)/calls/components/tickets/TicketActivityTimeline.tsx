"use client";

import {
  Activity,
  Clock,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { TicketUpdateRecord } from "../../types";
import { formatEnumLabel } from "../../utils/call-helpers";
import { format, isToday, isYesterday } from "date-fns";

function fmtShortDate(iso?: string | null): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "—";
  if (isToday(d)) return `Today ${format(d, "HH:mm")}`;
  if (isYesterday(d)) return `Yesterday ${format(d, "HH:mm")}`;
  return format(d, "EEE, d MMM");
}

const TYPE_BADGE: Record<
  string,
  { label: string; color: string; bg: string; border: string }
> = {
  CREATED: {
    label: "Created",
    color: "#008f68",
    bg: "#e6f5f0",
    border: "#008f68",
  },
  NOTE: {
    label: "Note",
    color: "#c47a00",
    bg: "#fef3d6",
    border: "#c47a00",
  },
  STATUS_CHANGE: {
    label: "Status",
    color: "#7c3aed",
    bg: "#f5f3ff",
    border: "#7c3aed",
  },
  FOLLOW_UP_SET: {
    label: "Follow-up",
    color: "#d97706",
    bg: "#fffbeb",
    border: "#d97706",
  },
};

const STATUS_COLORS: Record<string, { color: string; bg: string }> = {
  OPEN: { color: "#008f68", bg: "#e6f5f0" },
  IN_PROGRESS: { color: "#2563eb", bg: "#eff6ff" },
  PENDING_FOLLOWUP: { color: "#d97706", bg: "#fffbeb" },
  OVERDUE: { color: "#c0392b", bg: "#fde8e6" },
  RESOLVED: { color: "#065f4a", bg: "#d1fae5" },
  CLOSED: { color: "#64748b", bg: "#f1f5f9" },
};

function StatusBadge({ value }: { value: string }) {
  const key = value.toUpperCase().replace(/\s+/g, "_");
  const cfg = STATUS_COLORS[key] ?? { color: "#64748b", bg: "#f1f5f9" };
  return (
    <span
      className="inline-flex items-center gap-1 text-[10.5px] font-semibold px-2 py-0.5 rounded-md"
      style={{ color: cfg.color, background: cfg.bg }}
    >
      <span
        className="w-1.5 h-1.5 rounded-full shrink-0"
        style={{ background: cfg.color }}
      />
      {formatEnumLabel(value)}
    </span>
  );
}

interface TicketActivityTimelineProps {
  updates: TicketUpdateRecord[];
  isLoading?: boolean;
  className?: string;
  /** Ticket-level follow-up date, used as fallback when metadata doesn't carry it */
  ticketFollowUpDueDate?: string | null;
}

export function TicketActivityTimeline({
  updates,
  isLoading,
  className,
  ticketFollowUpDueDate,
}: TicketActivityTimelineProps) {
  if (isLoading) {
    return (
      <div className={cn("py-6 text-center text-xs text-slate-400", className)}>
        Loading activity…
      </div>
    );
  }

  if (updates.length === 0) {
    return (
      <div
        className={cn(
          "py-6 text-center text-xs text-slate-400 flex flex-col items-center gap-1.5",
          className,
        )}
      >
        <Activity className="w-4 h-4 opacity-40" />
        <span>No activity yet</span>
      </div>
    );
  }

  return (
    <div className={cn("space-y-2", className)}>
      {updates.map((u) => {
        const badge = TYPE_BADGE[u.type] ?? TYPE_BADGE.NOTE;
        const agentName =
          u.authorName ||
          u.agent?.name ||
          (typeof u.metadata?.userName === "string" ? u.metadata.userName : null) ||
          (u.agentId ? `Agent #${u.agentId}` : "System");

        const isPendingFollowup =
          u.toStatus?.toUpperCase() === "PENDING_FOLLOWUP" ||
          u.type === "FOLLOW_UP_SET";
        const rawFollowUpDate =
          (u.metadata?.followUpDueDate as string | null | undefined) ??
          (isPendingFollowup ? (ticketFollowUpDueDate ?? null) : null);
        const followUpDate = rawFollowUpDate ? fmtShortDate(rawFollowUpDate) : null;

        return (
          <div
            key={u.id}
            className="rounded-xl border border-slate-100 bg-white shadow-[0_1px_2px_rgba(0,0,0,0.04)] overflow-hidden"
          >
            {/* Top accent line */}
            <div
              className="h-[2px] w-full"
              style={{ background: badge.border + "40" }}
            />

            <div className="px-3 py-2.5 space-y-1.5">
              {/* Row 1: ID + date */}
              <div className="flex items-center justify-between gap-2">
                <span className="text-[11px] font-bold text-slate-700 font-mono">
                  #{u.id}
                </span>
                <span className="text-[10.5px] text-slate-400 tabular-nums">
                  {fmtShortDate(u.createdAt)}
                </span>
              </div>

              {/* Row 2: type badge + status badges */}
              <div className="flex flex-wrap items-center gap-1.5">
                <span
                  className="inline-flex items-center gap-1 text-[10.5px] font-semibold px-2 py-0.5 rounded-md"
                  style={{ color: badge.color, background: badge.bg }}
                >
                  {badge.label}
                </span>

                {u.type === "STATUS_CHANGE" && u.fromStatus && u.toStatus && (
                  <>
                    <StatusBadge value={u.fromStatus} />
                    <span className="text-[10px] text-slate-400">→</span>
                    <StatusBadge value={u.toStatus} />
                  </>
                )}

                {u.type === "CREATED" && u.toStatus && (
                  <StatusBadge value={u.toStatus} />
                )}
              </div>

              {/* Row 3: agent */}
              <div className="flex items-center gap-1.5">
                <span
                  className="w-2 h-2 rounded-full shrink-0 border-2"
                  style={{
                    borderColor: badge.border,
                    background: badge.bg,
                  }}
                />
                <span className="text-[11px] text-slate-600 truncate">
                  {agentName}
                </span>
              </div>

              {/* Row 4: note content */}
              {u.note?.trim() && (
                <p className="text-[11.5px] text-slate-600 leading-relaxed whitespace-pre-wrap border-l-2 border-slate-200 pl-2 select-text pointer-events-auto">
                  {u.note.trim()}
                </p>
              )}

              {/* Row 5: follow-up date */}
              {followUpDate && (
                <div className="flex items-center gap-1 text-[10.5px] text-amber-600">
                  <Clock className="w-3 h-3 shrink-0" />
                  <span className="font-medium">Due {followUpDate}</span>
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
