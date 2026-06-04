"use client";

import { useMemo } from "react";
import {
  PhoneOutgoing,
  History,
  UserRound,
  Ticket,
} from "lucide-react";
import { formatDistanceToNow, format, isToday, isYesterday } from "date-fns";
import type { AgentOption, SupportTicketRecord } from "../../types";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useAircall } from "@/components/providers/AircallProvider";

export interface CustomerTicketGroup {
  key: string;
  customerId?: number;
  customerName: string;
  customerPhone: string;
  tickets: SupportTicketRecord[];
  latestTicket: SupportTicketRecord;
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

const PRIORITY_META: Record<string, { label: string; color: string; bg: string }> =
  {
    LOW: { label: "Low", color: "#475569", bg: "#f1f5f9" },
    MEDIUM: { label: "Medium", color: "#b45309", bg: "#fef3c7" },
    HIGH: { label: "High", color: "#c2410c", bg: "#ffedd5" },
    EMERGENCY: { label: "Emergency", color: "#b91c1c", bg: "#fee2e2" },
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

function issuePreview(ticket: SupportTicketRecord): string | null {
  const raw = ticket.issueDetail?.trim();
  if (!raw || /^["'`]+$/.test(raw)) return null;
  return raw;
}

interface InlineTicketTimelineProps {
  group: CustomerTicketGroup;
  agents: AgentOption[];
  onOpenView?: (t: SupportTicketRecord) => void;
}

export function InlineTicketTimeline({
  group,
  agents,
  onOpenView,
}: InlineTicketTimelineProps) {
  const { dial, status, isLoggedIn } = useAircall();
  const canDial = status === "ready" && isLoggedIn;

  const sortedTickets = useMemo(() => {
    return [...group.tickets].sort((a, b) => {
      const ad = new Date(a.createdAt || 0).getTime();
      const bd = new Date(b.createdAt || 0).getTime();
      return bd - ad;
    });
  }, [group.tickets]);

  const lastEventAgo = useMemo(() => {
    const first = sortedTickets[0];
    if (!first?.createdAt) return null;
    const d = new Date(first.createdAt);
    if (isNaN(d.getTime())) return null;
    return formatDistanceToNow(d, { addSuffix: true });
  }, [sortedTickets]);

  const hasPhone =
    !!group.customerPhone && group.customerPhone !== "unknown";
  const latestTicket = sortedTickets[0];
  const latestStatusKey = latestTicket
    ? normalizeStatusKey(latestTicket.status)
    : null;
  const latestMeta = latestStatusKey
    ? STATUS_META[latestStatusKey] ?? STATUS_META.CLOSED
    : null;

  const handleCallBack = () => {
    if (!hasPhone) return;
    dial(group.customerPhone, latestTicket?.callId ?? undefined);
  };

  const resolveAgent = (t: SupportTicketRecord): string | null => {
    if (t.assignedTo?.name) return t.assignedTo.name;
    if (t.agentId) {
      const found = agents.find(
        (a) => a.id.toString() === t.agentId!.toString(),
      );
      if (found) return found.name;
    }
    return null;
  };

  return (
    <div className="mx-2 mb-2 rounded-xl border border-slate-200/80 bg-[#f8f9fb] shadow-sm">
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
            style={{ color: latestMeta.color, background: latestMeta.bg }}
          >
            Latest: {latestMeta.label}
          </span>
        )}
      </div>

      <div className="px-3 py-3">
        <div className="mb-3">
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
            Ticket timeline · {sortedTickets.length}{" "}
            {sortedTickets.length === 1 ? "ticket" : "tickets"}
          </p>
          {lastEventAgo && (
            <p className="text-[10.5px] text-slate-400 mt-0.5">
              Last activity {lastEventAgo}
            </p>
          )}
        </div>

        <div className="relative rounded-lg border border-slate-100 bg-white px-3 py-2.5">
          <div className="absolute top-3 bottom-3 left-[1.15rem] w-px bg-slate-200" />
          <ol className="space-y-2.5">
            {sortedTickets.map((ticket, index) => {
              const date = new Date(ticket.createdAt || 0);
              const dateLabel = isNaN(date.getTime())
                ? "—"
                : formatShortDate(date);
              const statusKey = normalizeStatusKey(ticket.status);
              const sm = STATUS_META[statusKey] ?? STATUS_META.CLOSED;
              const pm =
                PRIORITY_META[ticket.priority] ?? PRIORITY_META.MEDIUM;
              const agentName = resolveAgent(ticket);
              const notes = issuePreview(ticket);
              const isLatest = index === 0;

              return (
                <li
                  key={ticket.id}
                  className={cn(
                    "relative pl-8 min-w-0",
                    isLatest && "rounded-md px-2 py-1 bg-slate-50/80",
                  )}
                >
                  <span
                    className={cn(
                      "absolute left-0 top-1 flex h-5 w-5 items-center justify-center rounded-full bg-white border-2",
                      sm.ring,
                    )}
                  >
                    <Ticket
                      className="h-2.5 w-2.5"
                      style={{ color: sm.color }}
                    />
                  </span>

                  <div className={cn(
                    "min-w-0 space-y-0.5",
                    isLatest && "ml-6"
                  )}>
                    <p className="text-[10.5px] text-slate-500 tabular-nums whitespace-nowrap">
                      {dateLabel}
                      <span className="text-slate-300 mx-1.5">·</span>
                      <span className="font-mono text-slate-400">
                        #{ticket.id}
                      </span>
                    </p>
                    <div className="flex flex-wrap items-center gap-1.5 min-w-0">
                      <span
                        className="text-[10.5px] font-semibold px-1.5 py-0.5 rounded-md shrink-0"
                        style={{ color: sm.color, background: sm.bg }}
                      >
                        {sm.label}
                      </span>
                      <span
                        className="text-[10.5px] font-semibold px-1.5 py-0.5 rounded-md shrink-0"
                        style={{ color: pm.color, background: pm.bg }}
                      >
                        {pm.label}
                      </span>
                      {ticket.ticketType && (
                        <span className="text-[10.5px] text-slate-600 shrink-0">
                          {formatLabel(ticket.ticketType)}
                        </span>
                      )}
                      {agentName && (
                        <>
                          <span className="text-slate-300 shrink-0">·</span>
                          <span className="text-[10.5px] text-slate-600 truncate max-w-[9rem]">
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

                  {ticket.callId && (
                    <p className="mt-1 text-[10px] font-medium text-blue-600">
                      Linked to call #{ticket.callId}
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

        <div className="mt-3 flex flex-wrap items-center gap-2">
          <Button
            type="button"
            size="sm"
            className="h-8 px-3.5 bg-[#008f68] hover:bg-[#007a5c] text-white text-[12px] font-semibold rounded-lg shadow-sm"
            onClick={handleCallBack}
            disabled={!hasPhone || !canDial}
            title={
              !hasPhone
                ? "No phone number"
                : !canDial
                  ? "Aircall is not connected"
                  : `Call ${group.customerPhone}`
            }
          >
            <PhoneOutgoing className="h-3.5 w-3.5 mr-1.5" />
            Call back
          </Button>
          {onOpenView && latestTicket && (
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="h-8 px-3.5 text-[12px] font-semibold rounded-lg border-slate-200 text-[#008f68] hover:bg-[#008f68]/8 hover:border-[#008f68]/40"
              onClick={() => onOpenView(latestTicket)}
            >
              <History className="h-3.5 w-3.5 mr-1.5" />
              Open ticket
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
