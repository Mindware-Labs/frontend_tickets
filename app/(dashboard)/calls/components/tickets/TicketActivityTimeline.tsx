"use client";

import {
  Activity,
  CalendarClock,
  MessageSquare,
  Ticket as TicketIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { TicketUpdateRecord } from "../../types";
import { fmtRelative, formatEnumLabel } from "../../utils/call-helpers";

const TYPE_META: Record<
  string,
  { icon: typeof TicketIcon; color: string; label: (u: TicketUpdateRecord) => string }
> = {
  CREATED: {
    icon: TicketIcon,
    color: "#008f68",
    label: () => "Ticket created",
  },
  NOTE: {
    icon: MessageSquare,
    color: "#c47a00",
    label: () => "Note added",
  },
  STATUS_CHANGE: {
    icon: Activity,
    color: "#7c3aed",
    label: (u) => {
      const from = u.fromStatus ? formatEnumLabel(u.fromStatus) : "—";
      const to = u.toStatus ? formatEnumLabel(u.toStatus) : "—";
      return `Status: ${from} → ${to}`;
    },
  },
  FOLLOW_UP_SET: {
    icon: CalendarClock,
    color: "#d97706",
    label: () => "Follow-up scheduled",
  },
};

interface TicketActivityTimelineProps {
  updates: TicketUpdateRecord[];
  isLoading?: boolean;
  className?: string;
}

export function TicketActivityTimeline({
  updates,
  isLoading,
  className,
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
    <div className={cn("space-y-0", className)}>
      {updates.map((u, idx) => {
        const meta = TYPE_META[u.type] || TYPE_META.NOTE;
        const Icon = meta.icon;
        const agentName = u.agent?.name || (u.agentId ? `Agent #${u.agentId}` : "System");

        return (
          <div key={u.id} className="relative flex gap-2.5 pl-1">
            {idx < updates.length - 1 && (
              <span
                className="absolute left-[11px] top-6 bottom-0 w-px bg-slate-200"
                aria-hidden
              />
            )}
            <div
              className="relative z-10 mt-0.5 w-6 h-6 rounded-full flex items-center justify-center shrink-0 border border-white shadow-sm"
              style={{ background: `${meta.color}18` }}
            >
              <Icon className="w-3 h-3" style={{ color: meta.color }} />
            </div>
            <div className="flex-1 min-w-0 pb-4">
              <p className="text-[12px] font-semibold text-slate-800 leading-snug">
                {meta.label(u)}
              </p>
              {u.note?.trim() && (
                <p className="text-[11px] text-slate-600 mt-0.5 leading-relaxed whitespace-pre-wrap">
                  {u.note.trim()}
                </p>
              )}
              <p className="text-[10px] text-slate-400 mt-1">
                {agentName}
                {u.createdAt ? ` · ${fmtRelative(u.createdAt)}` : ""}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
