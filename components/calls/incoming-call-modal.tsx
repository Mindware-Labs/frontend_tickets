"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import {
  AlertTriangle,
  Archive,
  Building2,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  Clock,
  History,
  Mail,
  MapPin,
  Megaphone,
  Phone,
  PhoneIncoming,
  PhoneMissed,
  PhoneOutgoing,
  Pin,
  StickyNote,
  Ticket as TicketIcon,
  User2,
  Voicemail,
  X,
} from "lucide-react";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";

import type {
  ActivityFilter,
  AnyTicketRecord,
  CallRecord,
  CallState,
  CustomerActivity,
  CustomerFlag,
  CustomerProfile,
  IncomingCallContext,
  ManualRecordEntry,
} from "./incoming-call-modal-types";

interface IncomingCallModalProps {
  /** Visible state — when false, nothing is rendered. */
  open: boolean;
  onOpenChange: (open: boolean) => void;
  customer: CustomerProfile | null;
  call: IncomingCallContext;
  onCreateTicket?: () => void;
  onOpenProfile?: () => void;
  /**
   * When true the close (X) button is hidden so the panel behaves like a
   * persistent overlay. Useful for the demo preview page.
   */
  persistent?: boolean;
  /**
   * Where the panel anchors itself. Defaults to `bottom-right` (sits to the
   * left of the Aircall dock, with a viewport-relative offset). Use
   * `inline` to render in document flow — handy for previews.
   */
  position?: "bottom-right" | "bottom-left" | "inline";
}

const STATE_META: Record<
  CallState,
  { label: string; dot: string; chip: string }
> = {
  RINGING: {
    label: "Ringing",
    dot: "bg-emerald-500 animate-pulse",
    chip: "border-[#008f68]/25 bg-[#f0faf5] text-[#006b4f]",
  },
  ACTIVE: {
    label: "On call",
    dot: "bg-sky-500",
    chip: "border-sky-200 bg-sky-50 text-sky-700",
  },
  ENDED: {
    label: "Ended",
    dot: "bg-slate-400",
    chip: "border-slate-200 bg-slate-50 text-slate-600",
  },
};

const DIRECTION_META: Record<
  string,
  { label: string; icon: typeof PhoneIncoming; iconClass: string }
> = {
  INBOUND: {
    label: "Inbound",
    icon: PhoneIncoming,
    iconClass: "bg-[#f0faf5] text-[#008f68] ring-1 ring-[#008f68]/15",
  },
  OUTBOUND: {
    label: "Outbound",
    icon: PhoneOutgoing,
    iconClass: "bg-sky-50 text-sky-700 ring-1 ring-sky-300/40",
  },
  MISSED: {
    label: "Missed",
    icon: PhoneMissed,
    iconClass: "bg-rose-50 text-rose-700 ring-1 ring-rose-300/40",
  },
  VOICEMAIL: {
    label: "Voicemail",
    icon: Voicemail,
    iconClass: "bg-amber-50 text-amber-700 ring-1 ring-amber-300/40",
  },
};

const FLAG_STYLES: Record<CustomerFlag["kind"], string> = {
  overdue: "border-amber-200 bg-amber-50 text-amber-700",
  do_not_call: "border-rose-200 bg-rose-50 text-rose-700",
};

const TICKET_STATUS_STYLES: Record<string, string> = {
  ACTIVE: "border-sky-200 bg-sky-50 text-sky-700",
  PENDING_FOLLOWUP: "border-amber-200 bg-amber-50 text-amber-700",
  OVERDUE: "border-rose-200 bg-rose-50 text-rose-700",
  RESOLVED: "border-emerald-200 bg-emerald-50 text-emerald-700",
  CLOSED: "border-slate-200 bg-slate-50 text-slate-500",
  COMPLETED: "border-slate-200 bg-slate-50 text-slate-500",
};

// ── helpers ─────────────────────────────────────────────────────────────
function formatPhone(value: string) {
  return value.replace(/\s+/g, " ").trim();
}

function formatDuration(seconds?: number) {
  if (!seconds || seconds <= 0) return "00:00";
  const m = Math.floor(seconds / 60)
    .toString()
    .padStart(2, "0");
  const s = (seconds % 60).toString().padStart(2, "0");
  return `${m}:${s}`;
}

function formatRelative(iso?: string) {
  if (!iso) return "—";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "—";
  const diff = Date.now() - date.getTime();
  const min = 60 * 1000;
  const hr = 60 * min;
  const day = 24 * hr;
  if (diff < min) return "now";
  if (diff < hr) return `${Math.round(diff / min)}m`;
  if (diff < day) return `${Math.round(diff / hr)}h`;
  if (diff < 30 * day) return `${Math.round(diff / day)}d`;
  if (diff < 365 * day) return `${Math.round(diff / (30 * day))}mo`;
  return `${Math.round(diff / (365 * day))}y`;
}

function formatShortDate(iso?: string) {
  if (!iso) return "—";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function useCallTimer(call: IncomingCallContext) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (call.state === "ENDED") return;
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, [call.state, call.startedAt]);

  if (call.state === "ACTIVE" && call.answeredAt) {
    const sec = Math.max(
      0,
      Math.floor((now - new Date(call.answeredAt).getTime()) / 1000),
    );
    return formatDuration(sec);
  }
  if (call.state === "RINGING") {
    const sec = Math.max(
      0,
      Math.floor((now - new Date(call.startedAt).getTime()) / 1000),
    );
    return formatDuration(sec);
  }
  return "00:00";
}

// ── header ──────────────────────────────────────────────────────────────
function PanelHeader({
  customer,
  call,
  timer,
  onClose,
  persistent,
}: {
  customer: CustomerProfile | null;
  call: IncomingCallContext;
  timer: string;
  onClose: () => void;
  persistent?: boolean;
}) {
  const directionKey = call.direction;
  const dirMeta = DIRECTION_META[directionKey] ?? DIRECTION_META.INBOUND;
  const stateKey: CallState =
    call.direction === "MISSED" ? "ENDED" : call.state;
  const stateMeta = STATE_META[stateKey];
  const DirectionIcon = dirMeta.icon;

  return (
    <div className="relative flex shrink-0 items-start gap-2.5 border-b border-slate-200/80 bg-white px-3 py-2.5 dark:border-slate-800 dark:bg-slate-950">
      {/* top accent line — same as the app topbar */}
      <span
        className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#008f68]/45 to-transparent"
        aria-hidden
      />
      {/* vertical accent bar — same as topbar/dock */}
      <span
        className="mt-0.5 h-9 w-0.5 shrink-0 rounded-full bg-[#008f68]"
        aria-hidden
      />

      <span
        className={cn(
          "flex size-9 shrink-0 items-center justify-center rounded-lg",
          dirMeta.iconClass,
        )}
      >
        <DirectionIcon className="size-4" strokeWidth={2.25} />
      </span>

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5">
          <span className="text-[10px] font-semibold uppercase tracking-widest text-slate-400 dark:text-slate-500">
            {dirMeta.label}
          </span>
          <span className="text-slate-300">·</span>
          <span
            className={cn(
              "inline-flex items-center gap-1 rounded-full border px-1.5 py-[1px] text-[9px] font-semibold uppercase tracking-wider",
              stateMeta.chip,
            )}
          >
            <span className={cn("size-1 rounded-full", stateMeta.dot)} />
            {stateMeta.label}
          </span>
        </div>
        <p className="mt-0.5 truncate text-[13px] font-bold leading-tight text-slate-900 dark:text-slate-100">
          {customer?.name ?? "Unknown caller"}
        </p>
        <div className="mt-0.5 flex items-center gap-1.5 text-[10.5px] text-slate-500 dark:text-slate-400">
          <Phone className="size-2.5 shrink-0" />
          <span className="truncate font-medium">
            {customer ? formatPhone(customer.phone) : "Unknown number"}
          </span>
          {call.lineLabel ? (
            <>
              <span className="text-slate-300">·</span>
              <span className="truncate">{call.lineLabel}</span>
            </>
          ) : null}
        </div>
      </div>

      <div className="flex shrink-0 flex-col items-end gap-0.5">
        <span className="text-[8.5px] font-semibold uppercase tracking-widest text-slate-400">
          Duration
        </span>
        <span className="font-mono text-[15px] font-bold leading-none tabular-nums text-slate-900 dark:text-slate-100">
          {timer}
        </span>
      </div>

      {!persistent ? (
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="absolute right-1.5 top-1.5 flex h-6 w-6 items-center justify-center rounded-md text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#008f68]/25 dark:hover:bg-slate-800 dark:hover:text-slate-200"
        >
          <X className="size-3.5" />
        </button>
      ) : null}
    </div>
  );
}

// ── stats strip ─────────────────────────────────────────────────────────
function StatPill({
  label,
  value,
  tone = "slate",
}: {
  label: string;
  value: ReactNode;
  tone?: "slate" | "emerald" | "amber" | "rose";
}) {
  const tones: Record<typeof tone, string> = {
    slate: "border-slate-200 bg-slate-50 text-slate-600",
    emerald: "border-emerald-200 bg-emerald-50 text-emerald-700",
    amber: "border-amber-200 bg-amber-50 text-amber-700",
    rose: "border-rose-200 bg-rose-50 text-rose-700",
  };
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-md border px-1.5 py-[1px] text-[10px] font-semibold",
        tones[tone],
      )}
    >
      <span className="font-bold tabular-nums">{value}</span>
      <span className="font-medium uppercase tracking-wider opacity-80">
        {label}
      </span>
    </span>
  );
}

function FlagChip({ flag }: { flag: CustomerFlag }) {
  const Icon = flag.kind === "do_not_call" ? AlertTriangle : Clock;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-md border px-1.5 py-[1px] text-[10px] font-semibold uppercase tracking-wider",
        FLAG_STYLES[flag.kind],
      )}
    >
      <Icon className="size-2.5" />
      {flag.label}
    </span>
  );
}

// ── activity rows ───────────────────────────────────────────────────────
function CallRow({ item }: { item: CallRecord }) {
  const Icon =
    item.direction === "INBOUND"
      ? PhoneIncoming
      : item.direction === "OUTBOUND"
        ? PhoneOutgoing
        : item.direction === "MISSED"
          ? PhoneMissed
          : Voicemail;
  const tint =
    item.direction === "MISSED"
      ? "text-rose-500 bg-rose-50"
      : item.direction === "OUTBOUND"
        ? "text-sky-600 bg-sky-50"
        : item.direction === "VOICEMAIL"
          ? "text-amber-600 bg-amber-50"
          : "text-emerald-600 bg-emerald-50";

  return (
    <div className="flex items-start gap-2 rounded-md border border-slate-100 bg-white px-2 py-1.5 transition-colors hover:border-slate-200 hover:bg-slate-50/40">
      <span
        className={cn(
          "flex size-6 shrink-0 items-center justify-center rounded-md",
          tint,
        )}
      >
        <Icon className="size-3" />
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5">
          <span className="inline-flex items-center rounded border border-slate-200 bg-slate-50 px-1 py-[1px] text-[8.5px] font-bold uppercase tracking-wider text-slate-500">
            Call
          </span>
          <p className="truncate text-[11px] font-semibold text-slate-800">
            {item.direction === "MISSED"
              ? "Missed call"
              : (item.disposition?.replace(/_/g, " ") ?? "Call")}
          </p>
          {item.status === "OVERDUE" ? (
            <span className="inline-flex items-center rounded border border-rose-200 bg-rose-50 px-1 py-[1px] text-[8.5px] font-bold uppercase text-rose-700">
              Follow-up
            </span>
          ) : null}
        </div>
        <p className="mt-0.5 truncate text-[10px] text-slate-500">
          {item.agentName ?? "Unassigned"}
          {item.yardName ? ` · ${item.yardName}` : ""}
          {item.durationSec ? ` · ${formatDuration(item.durationSec)}` : ""}
        </p>
      </div>
      <span className="shrink-0 text-[9.5px] font-medium text-slate-400">
        {formatRelative(item.occurredAt)}
      </span>
    </div>
  );
}

function TicketActivityRow({ item }: { item: AnyTicketRecord }) {
  const isLegacy = item.variant === "legacy";
  const statusClass =
    TICKET_STATUS_STYLES[item.status] ?? TICKET_STATUS_STYLES.CLOSED;
  return (
    <div className="flex items-start gap-2 rounded-md border border-slate-100 bg-white px-2 py-1.5 transition-colors hover:border-slate-200 hover:bg-slate-50/40">
      <span
        className={cn(
          "flex size-6 shrink-0 items-center justify-center rounded-md",
          isLegacy
            ? "bg-slate-100 text-slate-500"
            : "bg-[#f0faf5] text-[#008f68]",
        )}
      >
        {isLegacy ? (
          <Archive className="size-3" />
        ) : (
          <TicketIcon className="size-3" />
        )}
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5">
          <span
            className={cn(
              "inline-flex items-center rounded border px-1 py-[1px] text-[8.5px] font-bold uppercase tracking-wider",
              isLegacy
                ? "border-slate-200 bg-slate-50 text-slate-500"
                : "border-emerald-200 bg-emerald-50 text-[#006b4f]",
            )}
          >
            {isLegacy ? "Legacy" : "Ticket"}
          </span>
          <p className="truncate text-[11px] font-semibold text-slate-800">
            {isLegacy ? item.legacyId : `#${item.id} · ${item.title}`}
          </p>
          <span
            className={cn(
              "inline-flex items-center rounded border px-1 py-[1px] text-[8.5px] font-bold uppercase tracking-wider",
              statusClass,
            )}
          >
            {item.status.replace(/_/g, " ")}
          </span>
        </div>
        <p className="mt-0.5 truncate text-[10px] text-slate-500">
          {(isLegacy ? item.agentName : item.assignedAgentName) ?? "Unassigned"}
          {item.yardName ? ` · ${item.yardName}` : ""}
        </p>
      </div>
      <span className="shrink-0 text-[9.5px] font-medium text-slate-400">
        {formatRelative(item.occurredAt)}
      </span>
    </div>
  );
}

function ManualRow({ item }: { item: ManualRecordEntry }) {
  return (
    <div className="flex items-start gap-2 rounded-md border border-slate-100 bg-white px-2 py-1.5 transition-colors hover:border-slate-200 hover:bg-slate-50/40">
      <span className="flex size-6 shrink-0 items-center justify-center rounded-md bg-indigo-50 text-indigo-600">
        <ClipboardList className="size-3" />
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5">
          <span className="inline-flex items-center rounded border border-indigo-200 bg-indigo-50 px-1 py-[1px] text-[8.5px] font-bold uppercase tracking-wider text-indigo-700">
            Record
          </span>
          <p className="truncate text-[11px] font-semibold text-slate-800">
            {item.title}
          </p>
        </div>
        <p className="mt-0.5 truncate text-[10px] text-slate-500">
          {item.recordType}
          {item.loggedByName ? ` · ${item.loggedByName}` : ""}
          {item.yardName ? ` · ${item.yardName}` : ""}
        </p>
      </div>
      <span className="shrink-0 text-[9.5px] font-medium text-slate-400">
        {formatRelative(item.occurredAt)}
      </span>
    </div>
  );
}

function ActivityRow({ item }: { item: CustomerActivity }) {
  if (item.kind === "call") return <CallRow item={item} />;
  if (item.kind === "ticket") return <TicketActivityRow item={item} />;
  return <ManualRow item={item} />;
}

function EmptyState({
  icon: Icon,
  message,
}: {
  icon: typeof Phone;
  message: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-1.5 rounded-md border border-dashed border-slate-200 bg-slate-50/50 px-3 py-5 text-center">
      <Icon className="size-4 text-slate-400" />
      <p className="text-[10.5px] font-medium text-slate-500">{message}</p>
    </div>
  );
}

// ── activity tab ────────────────────────────────────────────────────────
function buildActivityFeed(customer: CustomerProfile): CustomerActivity[] {
  const items: CustomerActivity[] = [
    ...customer.calls,
    ...customer.tickets,
    ...customer.manualRecords,
  ];
  items.sort(
    (a, b) =>
      new Date(b.occurredAt).getTime() - new Date(a.occurredAt).getTime(),
  );
  return items;
}

const ACTIVITY_PAGE_SIZE = 5;

function ActivityTab({ customer }: { customer: CustomerProfile }) {
  const [filter, setFilter] = useState<ActivityFilter>("all");
  const [page, setPage] = useState(1);

  const feed = useMemo(() => buildActivityFeed(customer), [customer]);

  const visible = useMemo(() => {
    if (filter === "all") return feed;
    return feed.filter((item) => {
      if (filter === "calls") return item.kind === "call";
      if (filter === "tickets") return item.kind === "ticket";
      return item.kind === "manual";
    });
  }, [feed, filter]);

  const counts = useMemo(
    () => ({
      all: feed.length,
      calls: customer.calls.length,
      tickets: customer.tickets.length,
      manual: customer.manualRecords.length,
    }),
    [customer, feed],
  );

  const filters: Array<{ key: ActivityFilter; label: string; count: number }> = [
    { key: "all", label: "All", count: counts.all },
    { key: "calls", label: "Calls", count: counts.calls },
    { key: "tickets", label: "Tickets", count: counts.tickets },
    { key: "manual", label: "Records", count: counts.manual },
  ];

  const totalPages = Math.max(1, Math.ceil(visible.length / ACTIVITY_PAGE_SIZE));

  // Reset to first page whenever the customer or filter changes
  useEffect(() => {
    setPage(1);
  }, [customer.id, filter]);

  // Clamp the page if the visible list shrinks (e.g. data refresh)
  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  const start = (page - 1) * ACTIVITY_PAGE_SIZE;
  const pageItems = visible.slice(start, start + ACTIVITY_PAGE_SIZE);
  const showingTo = Math.min(start + ACTIVITY_PAGE_SIZE, visible.length);

  return (
    <div className="space-y-2">
      {/* Filter chips — distributed equally across the row */}
      <div className="flex w-full items-stretch gap-0.5 rounded-md border border-slate-200/80 bg-slate-100 p-0.5">
        {filters.map((f) => {
          const active = filter === f.key;
          return (
            <button
              key={f.key}
              type="button"
              onClick={() => setFilter(f.key)}
              className={cn(
                "flex h-6 min-w-0 flex-1 items-center justify-center gap-1 rounded px-1 text-[10px] font-semibold transition-colors",
                active
                  ? "bg-white text-[#008f68] shadow-sm"
                  : "text-slate-500 hover:text-slate-800",
              )}
            >
              <span className="truncate">{f.label}</span>
              <span
                className={cn(
                  "rounded px-1 text-[9px] font-bold tabular-nums",
                  active
                    ? "bg-[#f0faf5] text-[#006b4f]"
                    : "bg-slate-200/80 text-slate-500",
                )}
              >
                {f.count}
              </span>
            </button>
          );
        })}
      </div>

      {visible.length === 0 ? (
        <EmptyState
          icon={History}
          message={
            filter === "all"
              ? "No activity yet for this customer"
              : `No ${filter} on file`
          }
        />
      ) : (
        <>
          <div className="space-y-1.5">
            {pageItems.map((item) => (
              <ActivityRow
                key={`${item.kind}-${"id" in item ? item.id : "x"}-${item.occurredAt}`}
                item={item}
              />
            ))}
          </div>

          {totalPages > 1 ? (
            <div className="flex items-center justify-between rounded-md border border-slate-200/80 bg-white px-2 py-1">
              <span className="text-[9.5px] font-semibold tabular-nums text-slate-500">
                {start + 1}–{showingTo}
                <span className="text-slate-300"> / </span>
                <span className="text-slate-700">{visible.length}</span>
              </span>
              <div className="flex items-center gap-0.5">
                <button
                  type="button"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page <= 1}
                  className="flex h-5 w-5 items-center justify-center rounded text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-700 disabled:cursor-not-allowed disabled:opacity-30"
                  aria-label="Previous page"
                >
                  <ChevronLeft className="size-3" />
                </button>
                <span className="px-1 text-[9.5px] font-bold tabular-nums text-slate-700">
                  {page}
                  <span className="font-medium text-slate-400">/{totalPages}</span>
                </span>
                <button
                  type="button"
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page >= totalPages}
                  className="flex h-5 w-5 items-center justify-center rounded text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-700 disabled:cursor-not-allowed disabled:opacity-30"
                  aria-label="Next page"
                >
                  <ChevronRight className="size-3" />
                </button>
              </div>
            </div>
          ) : null}
        </>
      )}
    </div>
  );
}

// ── notes tab ───────────────────────────────────────────────────────────
function NotesTab({ customer }: { customer: CustomerProfile }) {
  if (customer.notes.length === 0) {
    return <EmptyState icon={StickyNote} message="No notes on file" />;
  }
  return (
    <div className="space-y-1.5">
      {customer.notes.map((n) => (
        <article
          key={n.id}
          className="rounded-md border border-slate-100 bg-white px-2 py-1.5"
        >
          <div className="flex items-center justify-between gap-2">
            <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-slate-700">
              <User2 className="size-2.5 text-slate-400" />
              {n.authorName ?? "Unknown"}
            </span>
            <span className="text-[9.5px] font-medium text-slate-400">
              {formatShortDate(n.createdAt)} · {formatRelative(n.createdAt)}
            </span>
          </div>
          <p className="mt-0.5 text-[11px] leading-relaxed text-slate-700">
            {n.content}
          </p>
        </article>
      ))}
    </div>
  );
}

// ── info tab (compact customer card) ────────────────────────────────────
function InfoTab({ customer }: { customer: CustomerProfile }) {
  return (
    <div className="space-y-2">
      <dl className="grid grid-cols-[64px_1fr] items-center gap-x-2 gap-y-1.5 rounded-md border border-slate-100 bg-white px-2.5 py-2 text-[11px]">
        <dt className="text-[9px] font-semibold uppercase tracking-widest text-slate-400">
          Phone
        </dt>
        <dd className="truncate font-medium text-slate-800">
          {formatPhone(customer.phone)}
        </dd>

        {customer.email ? (
          <>
            <dt className="text-[9px] font-semibold uppercase tracking-widest text-slate-400">
              Email
            </dt>
            <dd className="flex items-center gap-1.5 truncate text-slate-700">
              <Mail className="size-2.5 shrink-0 text-slate-400" />
              <span className="truncate">{customer.email}</span>
            </dd>
          </>
        ) : null}

        {customer.city || customer.state ? (
          <>
            <dt className="text-[9px] font-semibold uppercase tracking-widest text-slate-400">
              Location
            </dt>
            <dd className="flex items-center gap-1.5 text-slate-700">
              <MapPin className="size-2.5 shrink-0 text-slate-400" />
              {[customer.city, customer.state].filter(Boolean).join(", ")}
            </dd>
          </>
        ) : null}

        <dt className="text-[9px] font-semibold uppercase tracking-widest text-slate-400">
          Since
        </dt>
        <dd className="text-slate-700">
          {formatShortDate(customer.customerSince)}
          <span className="text-slate-400">
            {" "}
            · {formatRelative(customer.customerSince)}
          </span>
        </dd>
      </dl>

      <div className="grid grid-cols-1 gap-2">
        <section className="rounded-md border border-slate-100 bg-white px-2.5 py-2">
          <p className="text-[9px] font-semibold uppercase tracking-widest text-slate-400">
            Yards ({customer.yards.length})
          </p>
          <div className="mt-1 flex flex-wrap gap-1">
            {customer.yards.length === 0 ? (
              <span className="text-[10px] text-slate-400">No yards linked</span>
            ) : (
              customer.yards.map((y) => (
                <span
                  key={y.id}
                  className="inline-flex items-center gap-1 rounded border border-slate-200 bg-slate-50 px-1.5 py-[1px] text-[10px] font-semibold text-slate-700"
                >
                  <Building2 className="size-2.5" />
                  {y.commonName ?? y.name}
                </span>
              ))
            )}
          </div>
        </section>

        <section className="rounded-md border border-slate-100 bg-white px-2.5 py-2">
          <p className="text-[9px] font-semibold uppercase tracking-widest text-slate-400">
            Campaigns ({customer.campaigns.length})
          </p>
          <div className="mt-1 flex flex-wrap gap-1">
            {customer.campaigns.length === 0 ? (
              <span className="text-[10px] text-slate-400">No campaigns</span>
            ) : (
              customer.campaigns.map((c) => (
                <span
                  key={c.id}
                  className="inline-flex items-center gap-1 rounded border border-emerald-100 bg-emerald-50 px-1.5 py-[1px] text-[10px] font-semibold text-emerald-700"
                >
                  <Megaphone className="size-2.5" />
                  {c.name}
                </span>
              ))
            )}
          </div>
        </section>
      </div>
    </div>
  );
}

// ── footer actions ──────────────────────────────────────────────────────
// Call control (answer / hangup / mute / hold) lives in the Aircall dock —
// this footer focuses on customer-side agent actions during/after the call.
function FooterActions({
  hasCustomer,
  onCreateTicket,
  onOpenProfile,
}: {
  hasCustomer: boolean;
  onCreateTicket?: () => void;
  onOpenProfile?: () => void;
}) {
  return (
    <div className="flex shrink-0 items-center gap-1.5 border-t border-slate-100 bg-slate-50/80 px-2.5 py-2 dark:border-slate-800 dark:bg-slate-900/60">
      <button
        type="button"
        onClick={onOpenProfile}
        disabled={!hasCustomer}
        className="flex h-7 flex-1 items-center justify-center gap-1 rounded-md border border-slate-200 bg-white px-2 text-[10.5px] font-semibold text-slate-700 transition-colors hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
      >
        <User2 className="size-3" />
        Open profile
      </button>
      <button
        type="button"
        onClick={onCreateTicket}
        disabled={!hasCustomer}
        className="flex h-7 flex-1 items-center justify-center gap-1 rounded-md bg-[#008f68] px-2 text-[10.5px] font-bold text-white shadow-[0_1px_3px_rgba(0,143,104,0.25)] transition-colors hover:bg-[#007a5a] disabled:cursor-not-allowed disabled:opacity-50"
      >
        <TicketIcon className="size-3" />
        Create ticket
      </button>
    </div>
  );
}

// ── main ────────────────────────────────────────────────────────────────
export function IncomingCallModal({
  open,
  onOpenChange,
  customer,
  call,
  onCreateTicket,
  onOpenProfile,
  persistent = false,
  position = "bottom-right",
}: IncomingCallModalProps) {
  const timer = useCallTimer(call);

  if (!open) return null;

  const positionClass =
    position === "inline"
      ? "relative"
      : position === "bottom-left"
        ? "fixed bottom-6 left-6 z-[55]"
        : // Default: bottom-right with offset to clear the Aircall dock
          "fixed bottom-6 right-[26.25rem] z-[55] max-[920px]:right-6 max-[920px]:bottom-[28rem]";

  return (
    <aside
      role={persistent ? undefined : "dialog"}
      aria-label="Incoming call · customer profile"
      className={cn(
        positionClass,
        "flex w-[380px] max-w-[calc(100vw-3rem)] flex-col",
        "overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-[0_8px_28px_rgba(15,23,42,0.16)]",
        "dark:border-slate-800 dark:bg-slate-950",
      )}
    >
      <PanelHeader
        customer={customer}
        call={call}
        timer={timer}
        onClose={() => onOpenChange(false)}
        persistent={persistent}
      />

      {/* Body */}
      <div className="scrollbar-app flex-1 overflow-y-auto bg-[#f4f5f7] px-2.5 py-2 dark:bg-slate-900/40">
        {customer ? (
          <div className="space-y-2">
            {/* Pinned note callout (compact) */}
            {customer.pinnedNote ? (
              <div className="flex items-start gap-1.5 rounded-md border border-amber-200 bg-amber-50/70 px-2 py-1.5">
                <Pin className="mt-0.5 size-3 shrink-0 text-amber-600" />
                <p className="text-[10.5px] leading-snug text-amber-900">
                  {customer.pinnedNote}
                </p>
              </div>
            ) : null}

            {/* Stats + flags strip */}
            <div className="flex flex-wrap items-center gap-1">
              <StatPill
                label="calls"
                value={customer.stats.totalCalls}
                tone="slate"
              />
              <StatPill
                label="open"
                value={customer.stats.openTickets}
                tone={customer.stats.openTickets > 0 ? "amber" : "slate"}
              />
              <StatPill
                label="legacy"
                value={customer.stats.legacyTickets}
                tone="slate"
              />
              <StatPill
                label="records"
                value={customer.stats.manualRecords}
                tone="slate"
              />
              {customer.flags.map((f) => (
                <FlagChip key={f.kind} flag={f} />
              ))}
            </div>

            {/* Tabs */}
            <Tabs defaultValue="activity" className="w-full">
              <TabsList className="flex h-7 w-full justify-start gap-0.5 rounded-md border border-slate-200/80 bg-slate-100 p-0.5 shadow-sm">
                {[
                  { value: "activity", label: "Activity", icon: History },
                  { value: "info", label: "Info", icon: User2 },
                  { value: "notes", label: "Notes", icon: StickyNote },
                ].map((t) => (
                  <TabsTrigger
                    key={t.value}
                    value={t.value}
                    className={cn(
                      "h-6 flex-1 rounded px-2 text-[10px] font-semibold text-slate-500 transition-colors",
                      "data-[state=active]:bg-white data-[state=active]:text-[#008f68] data-[state=active]:shadow-sm",
                      "hover:text-slate-800",
                    )}
                  >
                    <t.icon className="mr-1 size-2.5" />
                    {t.label}
                  </TabsTrigger>
                ))}
              </TabsList>

              <TabsContent
                value="activity"
                className="mt-2 focus-visible:outline-none"
              >
                <ActivityTab customer={customer} />
              </TabsContent>
              <TabsContent
                value="info"
                className="mt-2 focus-visible:outline-none"
              >
                <InfoTab customer={customer} />
              </TabsContent>
              <TabsContent
                value="notes"
                className="mt-2 focus-visible:outline-none"
              >
                <NotesTab customer={customer} />
              </TabsContent>
            </Tabs>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center gap-2 px-3 py-8 text-center">
            <span className="flex size-10 items-center justify-center rounded-xl bg-slate-100 text-slate-500">
              <PhoneIncoming className="size-4" />
            </span>
            <p className="text-[12px] font-semibold text-slate-800">
              Unknown caller
            </p>
            <p className="max-w-[260px] text-[10.5px] leading-relaxed text-slate-500">
              No customer profile matches this number. Answer the call and
              create a contact afterwards.
            </p>
          </div>
        )}
      </div>

      <FooterActions
        hasCustomer={Boolean(customer)}
        onCreateTicket={onCreateTicket}
        onOpenProfile={onOpenProfile}
      />
    </aside>
  );
}

export default IncomingCallModal;
