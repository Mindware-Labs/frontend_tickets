"use client";

import {
  CalendarClock,
  FileClock,
  FileText,
  Inbox,
  Phone,
  PhoneMissed,
  Radio,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { PaginationFooter } from "@/components/common/pagination-footer";
import { TableLoadingRow } from "@/components/shared/entity-loading-state";
import {
  dashboardTableCellClass,
  dashboardTableHeadClass,
} from "@/app/(dashboard)/dashboard/dashboard-theme";
import type { AuditEntry, NotificationType } from "./notification-types";

// ── Type presentation — distinct icon-in-tile language (one tone per type) ──────
const TYPE_META: Record<
  NotificationType,
  { label: string; icon: typeof Phone; tile: string }
> = {
  CALLBACK_OVERDUE: {
    label: "Callback overdue",
    icon: PhoneMissed,
    tile: "bg-rose-50 text-rose-600 ring-rose-100 dark:bg-rose-500/10 dark:text-rose-300 dark:ring-rose-500/20",
  },
  SCHEDULED_CALL_DUE: {
    label: "Scheduled call due",
    icon: CalendarClock,
    tile: "bg-sky-50 text-sky-600 ring-sky-100 dark:bg-sky-500/10 dark:text-sky-300 dark:ring-sky-500/20",
  },
  TICKET_FOLLOWUP_OVERDUE: {
    label: "Ticket follow-up",
    icon: FileClock,
    tile: "bg-amber-50 text-amber-600 ring-amber-100 dark:bg-amber-500/10 dark:text-amber-300 dark:ring-amber-500/20",
  },
};

const AVATAR_PALETTE: [string, string][] = [
  ["#ECFDF5", "#065F46"],
  ["#EFF6FF", "#1E40AF"],
  ["#FFFBEB", "#92400E"],
  ["#F5F3FF", "#5B21B6"],
  ["#FFF1F2", "#9F1239"],
];

function initials(name?: string) {
  if (!name) return "?";
  return name
    .split(" ")
    .map((w) => w[0])
    .filter(Boolean)
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function avatarColors(id: number): [string, string] {
  return AVATAR_PALETTE[id % AVATAR_PALETTE.length];
}

function relativeTime(d: string) {
  const diff = Date.now() - new Date(d).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

function clockTime(d: string) {
  return new Date(d).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

// ── Cells ───────────────────────────────────────────────────────────────────────
function Recipient({ agent }: { agent: AuditEntry["agent"] }) {
  if (!agent)
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-[10px] font-semibold text-slate-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-400">
        <Radio className="size-2.5" aria-hidden="true" />
        Broadcast
      </span>
    );
  const [bg, fg] = avatarColors(agent.id);
  return (
    <span className="inline-flex min-w-0 items-center gap-2">
      <span
        className="flex size-6 shrink-0 items-center justify-center rounded-full text-[9px] font-bold ring-1 ring-black/5"
        style={{ background: bg, color: fg }}
      >
        {initials(agent.name)}
      </span>
      <span className="min-w-0 truncate text-xs font-medium text-slate-700 dark:text-slate-200">
        {agent.name || `Agent #${agent.id}`}
      </span>
    </span>
  );
}

function ResourceTags({
  callId,
  ticketId,
}: {
  callId: number | null;
  ticketId: number | null;
}) {
  if (!callId && !ticketId) return null;
  return (
    <span className="mt-1 flex flex-wrap items-center gap-1">
      {callId && (
        <a
          href={`/calls/${callId}`}
          onClick={(e) => e.stopPropagation()}
          className="inline-flex items-center gap-1 rounded border border-sky-200 bg-sky-50 px-1 py-px text-[10px] font-semibold text-sky-700 transition-colors hover:bg-sky-100 dark:border-sky-500/30 dark:bg-sky-500/10 dark:text-sky-300"
        >
          <Phone className="size-2.5" aria-hidden="true" />#{callId}
        </a>
      )}
      {ticketId && (
        <a
          href={`/tickets/${ticketId}`}
          onClick={(e) => e.stopPropagation()}
          className="inline-flex items-center gap-1 rounded border border-emerald-200 bg-emerald-50 px-1 py-px text-[10px] font-semibold text-[#006b4f] transition-colors hover:bg-emerald-100 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-300"
        >
          <FileText className="size-2.5" aria-hidden="true" />#{ticketId}
        </a>
      )}
    </span>
  );
}

// ── Table ───────────────────────────────────────────────────────────────────────
// Server-paginated: `rows` is just the current page, while `total`/`page`/
// `totalPages` drive the footer. The parent fetches each page on demand.
export function NotificationsTable({
  rows,
  isLoading,
  total,
  page,
  totalPages,
  pageSize,
  onPageChange,
}: {
  rows: AuditEntry[];
  isLoading: boolean;
  total: number;
  page: number;
  totalPages: number;
  pageSize: number;
  onPageChange: (page: number) => void;
}) {
  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-[0_1px_3px_rgba(0,0,0,0.06)] dark:border-slate-800 dark:bg-slate-950">
      {/* Header strip */}
      <div className="flex items-center gap-2 border-b border-slate-100 px-3.5 py-2.5 dark:border-slate-800">
        <span
          className="h-4 w-0.5 shrink-0 rounded-full bg-[#008f68]"
          aria-hidden="true"
        />
        <span className="text-[12px] font-bold tracking-tight text-slate-900 dark:text-slate-100">
          Delivery ledger
        </span>
        <span className="rounded-md border border-slate-200 bg-slate-50 px-1.5 py-0.5 font-mono text-[10px] font-semibold text-slate-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-400">
          {total.toLocaleString()}
        </span>
      </div>

      <div className="scrollbar-app max-h-[560px] overflow-auto">
        <table className="w-full min-w-[640px] table-fixed border-separate border-spacing-0">
          <thead className="sticky top-0 z-10">
            <tr className="bg-slate-50/95 backdrop-blur dark:bg-slate-900/95">
              <th
                className={cn(
                  dashboardTableHeadClass,
                  "w-[46%] border-b border-slate-100 pl-3.5 dark:border-slate-800",
                )}
              >
                Notification
              </th>
              <th
                className={cn(
                  dashboardTableHeadClass,
                  "w-[22%] border-b border-slate-100 dark:border-slate-800",
                )}
              >
                Recipient
              </th>
              <th
                className={cn(
                  dashboardTableHeadClass,
                  "w-[14%] border-b border-slate-100 dark:border-slate-800",
                )}
              >
                Status
              </th>
              <th
                className={cn(
                  dashboardTableHeadClass,
                  "w-[18%] whitespace-nowrap border-b border-slate-100 pr-3.5 text-right dark:border-slate-800",
                )}
              >
                When
              </th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <TableLoadingRow colSpan={4} kind="notifications" compact />
            ) : rows.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-4 py-16 text-center">
                  <Inbox
                    className="mx-auto mb-2 size-8 text-slate-200 dark:text-slate-700"
                    aria-hidden="true"
                  />
                  <p className="text-[13px] font-semibold text-slate-700 dark:text-slate-200">
                    No notifications yet
                  </p>
                  <p className="mt-0.5 text-[11px] text-slate-400">
                    Delivered notifications will appear here.
                  </p>
                </td>
              </tr>
            ) : (
              rows.map((n) => {
                const meta = TYPE_META[n.type];
                const Icon = meta.icon;
                return (
                  <tr
                    key={n.id}
                    className="group border-b border-slate-100 transition-colors last:border-0 hover:bg-[#f0faf5]/60 dark:border-slate-800/70 dark:hover:bg-slate-900/50"
                  >
                    {/* Notification — type tile + message + inline resources */}
                    <td className={cn(dashboardTableCellClass, "pl-3.5")}>
                      <div className="flex items-start gap-2.5">
                        <span className="relative flex shrink-0">
                          {!n.read && (
                            <span
                              className="absolute -left-1 top-1 h-7 w-0.5 rounded-full bg-[#008f68]"
                              aria-hidden="true"
                            />
                          )}
                          <span
                            className={cn(
                              "flex size-7 items-center justify-center rounded-lg ring-1",
                              meta.tile,
                            )}
                          >
                            <Icon className="size-3.5" aria-hidden="true" />
                          </span>
                        </span>
                        <span className="min-w-0">
                          <span className="block text-[9px] font-semibold uppercase tracking-wide text-slate-400">
                            {meta.label}
                          </span>
                          <span
                            className={cn(
                              "block max-w-[640px] truncate text-xs leading-snug text-slate-700 dark:text-slate-200",
                              !n.read &&
                                "font-semibold text-slate-900 dark:text-slate-100",
                            )}
                            title={n.message}
                          >
                            {n.message}
                          </span>
                          <ResourceTags
                            callId={n.callId}
                            ticketId={n.ticketId}
                          />
                        </span>
                      </div>
                    </td>
                    {/* Recipient */}
                    <td className={dashboardTableCellClass}>
                      <Recipient agent={n.agent} />
                    </td>
                    {/* Status */}
                    <td className={dashboardTableCellClass}>
                      <span
                        className={cn(
                          "inline-flex items-center gap-1.5 text-[11px] font-semibold",
                          n.read
                            ? "text-slate-400"
                            : "text-[#006b4f] dark:text-emerald-300",
                        )}
                      >
                        <span
                          className={cn(
                            "size-1.5 rounded-full",
                            n.read ? "bg-slate-300" : "bg-[#008f68]",
                          )}
                          aria-hidden="true"
                        />
                        {n.read ? "Read" : "Unread"}
                      </span>
                    </td>
                    {/* When */}
                    <td
                      className={cn(
                        dashboardTableCellClass,
                        "pr-3.5 text-right",
                      )}
                    >
                      <span className="block whitespace-nowrap font-mono text-[11px] text-slate-600 dark:text-slate-300">
                        {clockTime(n.createdAt)}
                      </span>
                      <span className="block text-[9px] text-slate-400">
                        {relativeTime(n.createdAt)}
                      </span>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      <PaginationFooter
        totalCount={total}
        currentPage={page}
        totalPages={totalPages}
        itemsPerPage={pageSize}
        onPageChange={onPageChange}
        loading={isLoading}
        className="border-t border-slate-100 px-4 dark:border-slate-800"
      />
    </div>
  );
}
