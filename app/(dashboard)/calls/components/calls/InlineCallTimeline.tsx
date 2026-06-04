"use client";

import { useMemo } from "react";
import {
  PhoneIncoming,
  PhoneOutgoing,
  PhoneMissed,
  Voicemail,
  History,
  UserRound,
} from "lucide-react";
import { formatDistanceToNow, format, isToday, isYesterday } from "date-fns";
import type { Call } from "@/lib/mock-data";
import type { AgentOption } from "../../types";
import type { CustomerCallGroup } from "./CustomerTimelineDrawer";
import { getTicketAssignee, getAssigneeName } from "../../utils/call-helpers";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useAircall } from "@/components/providers/AircallProvider";

interface InlineCallTimelineProps {
  group: CustomerCallGroup;
  agents: AgentOption[];
  onOpenTimeline?: (group: CustomerCallGroup) => void;
}

function formatShortDate(date: Date): string {
  if (isToday(date)) return `Today ${format(date, "HH:mm")}`;
  if (isYesterday(date)) return `Yesterday ${format(date, "HH:mm")}`;
  return format(date, "MMM d, HH:mm");
}

function directionMeta(direction?: string) {
  const d = (direction || "").toLowerCase();
  if (d === "outbound") {
    return {
      label: "Outbound",
      color: "#2563eb",
      bg: "#eff6ff",
      ring: "border-blue-400",
      Icon: PhoneOutgoing,
    };
  }
  if (d === "missed") {
    return {
      label: "Missed",
      color: "#c0392b",
      bg: "#fde8e6",
      ring: "border-rose-400",
      Icon: PhoneMissed,
    };
  }
  if (d === "voicemail") {
    return {
      label: "Voicemail",
      color: "#c47a00",
      bg: "#fef3d6",
      ring: "border-amber-400",
      Icon: Voicemail,
    };
  }
  return {
    label: "Inbound",
    color: "#008f68",
    bg: "#e6f5f0",
    ring: "border-emerald-400",
    Icon: PhoneIncoming,
  };
}

function formatDuration(seconds?: number): string {
  if (!seconds || seconds <= 0) return "—";
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

function resolveAgentName(call: Call, agents: AgentOption[]): string | null {
  const assignee = getTicketAssignee(call);
  if (assignee) return getAssigneeName(assignee);
  const agentId = (call as any).agentId;
  if (agentId) {
    const found = agents.find((a) => a.id.toString() === agentId.toString());
    if (found) return found.name;
  }
  return null;
}

/** Skip empty or placeholder-only note fragments (e.g. a lone `"`). */
function notePreview(call: Call): string | null {
  const raw =
    (call.notes as string | undefined) ||
    ((call as any).issueDetail as string | undefined);
  if (!raw) return null;
  const trimmed = raw.trim();
  if (!trimmed || /^["'`]+$/.test(trimmed)) return null;
  return trimmed;
}

export function InlineCallTimeline({
  group,
  agents,
  onOpenTimeline,
}: InlineCallTimelineProps) {
  const { dial, status, isLoggedIn } = useAircall();
  const canDial = status === "ready" && isLoggedIn;

  const sortedCalls = useMemo(() => {
    return [...group.calls].sort((a, b) => {
      const ad = new Date(a.callDate || a.createdAt || 0).getTime();
      const bd = new Date(b.callDate || b.createdAt || 0).getTime();
      return bd - ad;
    });
  }, [group.calls]);

  const lastEventAgo = useMemo(() => {
    const first = sortedCalls[0];
    if (!first) return null;
    const d = new Date(first.callDate || first.createdAt || 0);
    if (isNaN(d.getTime())) return null;
    return formatDistanceToNow(d, { addSuffix: true });
  }, [sortedCalls]);

  const latestCallId = sortedCalls[0]?.id;
  const hasPhone = !!group.customerPhone && group.customerPhone !== "unknown";
  const latestMeta = sortedCalls[0]
    ? directionMeta(sortedCalls[0].direction)
    : null;

  const handleCallBack = () => {
    if (!hasPhone) return;
    dial(group.customerPhone, latestCallId);
  };

  return (
    <div className="mx-2 mb-2 rounded-xl border border-slate-200/80 bg-[#f8f9fb] shadow-sm">
      {/* Summary strip */}
      <div className="flex items-center justify-between gap-3 px-3 py-2.5 bg-white border-b border-slate-100 rounded-t-xl overflow-hidden">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 rounded-lg bg-[#008f68]/10 flex items-center justify-center shrink-0">
            <UserRound className="w-4 h-4 text-[#008f68]" />
          </div>
          <div className="min-w-0">
            <p className="text-[12px] font-semibold text-slate-800 truncate">
              {group.customerName || "Unknown"}
            </p>
            {hasPhone && (
              <p className="text-[10.5px] font-mono text-slate-500 truncate tabular-nums">
                {group.customerPhone}
              </p>
            )}
          </div>
        </div>
        {latestMeta && (
          <span
            className="shrink-0 inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-md"
            style={{
              color: latestMeta.color,
              background: latestMeta.bg,
            }}
          >
            <latestMeta.Icon className="w-3 h-3" />
            Latest: {latestMeta.label}
          </span>
        )}
      </div>

      <div className="px-3 py-3">
        {/* Header */}
        <div className="flex items-center justify-between gap-2 mb-3">
          <div>
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
              Call timeline · {sortedCalls.length}{" "}
              {sortedCalls.length === 1 ? "event" : "events"}
            </p>
            {lastEventAgo && (
              <p className="text-[10.5px] text-slate-400 mt-0.5">
                Last activity {lastEventAgo}
              </p>
            )}
          </div>
        </div>

        {/* Timeline */}
        <div className="relative rounded-lg border border-slate-100 bg-white px-3 py-2.5">
          <div className="absolute top-3 bottom-3 left-[1.15rem] w-px bg-slate-200" />
          <ol className="space-y-2.5">
            {sortedCalls.map((call, index) => {
              const meta = directionMeta(call.direction);
              const date = new Date(call.callDate || call.createdAt || 0);
              const dateLabel = isNaN(date.getTime())
                ? "—"
                : formatShortDate(date);
              const duration = formatDuration(call.duration ?? undefined);
              const agentName = resolveAgentName(call, agents);
              const notes = notePreview(call);
              const Icon = meta.Icon;
              const isLatest = index === 0;
              const relatedCallId = (call as any).relatedCallId as
                | number
                | string
                | null
                | undefined;

              return (
                <li
                  key={call.id}
                  className={cn(
                    "relative pl-8 min-w-0",
                    isLatest && "rounded-md px-2 py-1 bg-slate-50/80",
                  )}
                >
                  <span
                    className={cn(
                      "absolute left-0 top-1 flex h-5 w-5 items-center justify-center rounded-full bg-white border-2",
                      meta.ring,
                    )}
                  >
                    <Icon
                      className="h-2.5 w-2.5"
                      style={{ color: meta.color }}
                    />
                  </span>

                  <div className={cn(
                    "min-w-0 space-y-0.5",
                    isLatest && "ml-6"
                  )}>
                    <p className="text-[10.5px] text-slate-500 tabular-nums whitespace-nowrap">
                      {dateLabel}
                    </p>
                    <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 min-w-0">
                      <span
                        className="text-[11.5px] font-semibold shrink-0"
                        style={{ color: meta.color }}
                      >
                        {meta.label}
                      </span>
                      {call.duration != null && call.duration > 0 && (
                        <span className="text-[10.5px] font-mono text-slate-400 tabular-nums shrink-0">
                          {duration}
                        </span>
                      )}
                      {agentName && (
                        <>
                          <span className="text-slate-300 select-none shrink-0">
                            ·
                          </span>
                          <span className="text-[10.5px] text-slate-600 truncate max-w-[10rem]">
                            {agentName}
                          </span>
                        </>
                      )}
                      {isLatest && (
                        <span className="text-[9px] font-bold uppercase tracking-wide text-[#008f68] bg-[#008f68]/10 px-1.5 py-px rounded shrink-0">
                          Latest
                        </span>
                      )}
                    </div>
                  </div>

                  {relatedCallId && (
                    <p className="mt-1 text-[10px] font-medium text-violet-600">
                      Linked to call #{relatedCallId}
                    </p>
                  )}

                  {notes && (
                    <p className="mt-1 text-[12.5px] text-slate-500 leading-snug whitespace-pre-wrap wrap-break-word border-l-2 border-slate-200 pl-2">
                      {notes}
                    </p>
                  )}
                </li>
              );
            })}
          </ol>
        </div>

        {/* Actions */}
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <Button
            type="button"
            size="sm"
            className="h-8 px-3.5 bg-[#008f68] hover:bg-[#007a5c] text-white text-[12px] font-semibold rounded-lg shadow-sm"
            onClick={handleCallBack}
            disabled={!hasPhone || !canDial}
            title={
              !hasPhone
                ? "No phone number on file"
                : !canDial
                  ? "Aircall is not connected"
                  : `Call ${group.customerPhone}`
            }
          >
            <PhoneOutgoing className="h-3.5 w-3.5 mr-1.5" />
            Call back
          </Button>
          {onOpenTimeline && (
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="h-8 px-3.5 text-[12px] font-semibold rounded-lg border-slate-200 text-[#008f68] hover:bg-[#008f68]/8 hover:border-[#008f68]/40"
              onClick={() => onOpenTimeline(group)}
            >
              <History className="h-3.5 w-3.5 mr-1.5" />
              Open timeline
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
