"use client";

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";

/** useLayoutEffect that no-ops on the server to avoid SSR warnings. */
const useIsoLayoutEffect =
  typeof window !== "undefined" ? useLayoutEffect : useEffect;

/** Width of the call-detail window — kept in sync with its className. */
const DETAIL_WIDTH = 440;
/** Gap between the panel and the detail window when anchored beside it. */
const DETAIL_GAP = 12;

type AnchorPos = { left: number; top: number };
import {
  AlertTriangle,
  Archive,
  Building2,
  CalendarClock,
  Check,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  Clock,
  Copy,
  FileText,
  GripHorizontal,
  Hash,
  History,
  Mail,
  MapPin,
  Megaphone,
  Mic,
  Phone,
  PhoneIncoming,
  PhoneMissed,
  PhoneOutgoing,
  Pin,
  StickyNote,
  Tag,
  Ticket as TicketIcon,
  User2,
  Voicemail,
  X,
} from "lucide-react";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { CallRecordingPlayer } from "@/app/(dashboard)/calls/components/calls/CallRecordingPlayer";

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
  /**
   * When true the close (X) button is hidden so the panel behaves like a
   * persistent overlay. Useful for the demo preview page.
   */
  persistent?: boolean;
  /**
   * Allow the agent to reposition the panel by dragging its header.
   * Defaults to true. (Ignored for `inline` previews where it still works
   * but moves relative to its flow position.)
   */
  draggable?: boolean;
  /**
   * Where the panel anchors itself. Defaults to `center` (always centered in
   * the viewport). Use `inline` to render in document flow — handy for previews.
   */
  position?: "center" | "bottom-right" | "bottom-left" | "inline";
}

const STATE_META: Record<
  CallState,
  { label: string; dot: string; chip: string }
> = {
  RINGING: {
    label: "Ringing",
    dot: "bg-emerald-500 animate-pulse",
    chip: "border-[#008f68]/25 bg-[#f0faf5] text-[#006b4f] dark:border-emerald-500/25 dark:bg-emerald-500/10 dark:text-emerald-300",
  },
  ACTIVE: {
    label: "On call",
    dot: "bg-sky-500",
    chip: "border-sky-200 bg-sky-50 text-sky-700 dark:border-sky-500/20 dark:bg-sky-500/10 dark:text-sky-300",
  },
  ENDED: {
    label: "Ended",
    dot: "bg-slate-400",
    chip: "border-slate-200 bg-slate-50 text-slate-600 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-300",
  },
};

const DIRECTION_META: Record<
  string,
  { label: string; icon: typeof PhoneIncoming; iconClass: string }
> = {
  INBOUND: {
    label: "Inbound",
    icon: PhoneIncoming,
    iconClass: "bg-[#f0faf5] text-[#008f68] ring-1 ring-[#008f68]/15 dark:bg-emerald-500/10 dark:text-emerald-400 dark:ring-emerald-500/25",
  },
  OUTBOUND: {
    label: "Outbound",
    icon: PhoneOutgoing,
    iconClass: "bg-sky-50 text-sky-700 ring-1 ring-sky-300/40 dark:bg-sky-500/10 dark:text-sky-300 dark:ring-sky-500/25",
  },
  MISSED: {
    label: "Missed",
    icon: PhoneMissed,
    iconClass: "bg-rose-50 text-rose-700 ring-1 ring-rose-300/40 dark:bg-rose-500/10 dark:text-rose-300 dark:ring-rose-500/25",
  },
  VOICEMAIL: {
    label: "Voicemail",
    icon: Voicemail,
    iconClass: "bg-amber-50 text-amber-700 ring-1 ring-amber-300/40 dark:bg-amber-500/10 dark:text-amber-300 dark:ring-amber-500/25",
  },
};

const FLAG_STYLES: Record<CustomerFlag["kind"], string> = {
  overdue: "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-300",
  do_not_call: "border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-500/20 dark:bg-rose-500/10 dark:text-rose-300",
};

const TICKET_STATUS_STYLES: Record<string, string> = {
  ACTIVE: "border-sky-200 bg-sky-50 text-sky-700 dark:border-sky-500/20 dark:bg-sky-500/10 dark:text-sky-300",
  PENDING_FOLLOWUP: "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-300",
  OVERDUE: "border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-500/20 dark:bg-rose-500/10 dark:text-rose-300",
  RESOLVED: "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-300",
  CLOSED: "border-slate-200 bg-slate-50 text-slate-500 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-400",
  COMPLETED: "border-slate-200 bg-slate-50 text-slate-500 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-400",
};

const PRIORITY_STYLES: Record<string, string> = {
  LOW: "border-slate-200 bg-slate-50 text-slate-500 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-400",
  MEDIUM: "border-sky-200 bg-sky-50 text-sky-700 dark:border-sky-500/20 dark:bg-sky-500/10 dark:text-sky-300",
  HIGH: "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-300",
  URGENT: "border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-500/20 dark:bg-rose-500/10 dark:text-rose-300",
  EMERGENCY: "border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-500/20 dark:bg-rose-500/10 dark:text-rose-300",
};

// ── helpers ─────────────────────────────────────────────────────────────
function formatPhone(value: string) {
  return value.replace(/\s+/g, " ").trim();
}

function formatDuration(seconds?: number) {
  if (!seconds || seconds <= 0) return null;
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

function formatDateTime(iso?: string) {
  if (!iso) return null;
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return null;
  return date.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function titleCase(value?: string) {
  if (!value) return null;
  return value
    .replace(/_/g, " ")
    .toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

/** Drag-to-move offset shared by the panel and the call-detail window. */
function useDragOffset() {
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [dragging, setDragging] = useState(false);
  const start = useRef({ px: 0, py: 0, ox: 0, oy: 0 });

  const beginDrag = useCallback(
    (e: ReactPointerEvent) => {
      // Don't start a drag from interactive controls (close, copy, links).
      if ((e.target as HTMLElement).closest("button, a, [data-no-drag]")) return;
      start.current = { px: e.clientX, py: e.clientY, ox: offset.x, oy: offset.y };
      setDragging(true);
    },
    [offset.x, offset.y],
  );

  useEffect(() => {
    if (!dragging) return;
    const onMove = (e: PointerEvent) => {
      const { px, py, ox, oy } = start.current;
      setOffset({ x: ox + (e.clientX - px), y: oy + (e.clientY - py) });
    };
    const onUp = () => setDragging(false);
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
    };
  }, [dragging]);

  const reset = useCallback(() => setOffset({ x: 0, y: 0 }), []);

  return { offset, dragging, beginDrag, reset };
}

/** Tiny copy-to-clipboard button with a transient "copied" state. */
function CopyButton({ value, label }: { value: string; label: string }) {
  const [copied, setCopied] = useState(false);
  useEffect(() => {
    if (!copied) return;
    const id = window.setTimeout(() => setCopied(false), 1400);
    return () => window.clearTimeout(id);
  }, [copied]);

  return (
    <button
      type="button"
      aria-label={`Copy ${label}`}
      title={`Copy ${label}`}
      onClick={(e) => {
        e.stopPropagation();
        void navigator.clipboard?.writeText(value).then(() => setCopied(true));
      }}
      className="flex size-4 shrink-0 items-center justify-center rounded text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#008f68]/25 dark:hover:bg-neutral-800 dark:hover:text-neutral-200"
    >
      {copied ? (
        <Check className="size-2.5 text-[#008f68]" />
      ) : (
        <Copy className="size-2.5" />
      )}
    </button>
  );
}

// ── header ──────────────────────────────────────────────────────────────
function PanelHeader({
  customer,
  call,
  onClose,
  persistent,
  draggable,
  onPointerDown,
}: {
  customer: CustomerProfile | null;
  call: IncomingCallContext;
  onClose: () => void;
  persistent?: boolean;
  draggable?: boolean;
  onPointerDown?: (e: ReactPointerEvent) => void;
}) {
  const directionKey = call.direction;
  const dirMeta = DIRECTION_META[directionKey] ?? DIRECTION_META.INBOUND;
  const stateKey: CallState =
    call.direction === "MISSED" ? "ENDED" : call.state;
  const stateMeta = STATE_META[stateKey];
  const DirectionIcon = dirMeta.icon;

  return (
    <div
      onPointerDown={draggable ? onPointerDown : undefined}
      className={cn(
        "relative flex shrink-0 items-start gap-2.5 border-b border-slate-200/80 bg-white px-3 py-2.5 pr-8 dark:border-neutral-800 dark:bg-neutral-950",
        draggable && "cursor-grab touch-none select-none active:cursor-grabbing",
      )}
    >
      {/* top accent line — same as the app topbar */}
      <span
        className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#008f68]/45 to-transparent"
        aria-hidden
      />
      {/* drag affordance — centered grip handle */}
      {draggable ? (
        <GripHorizontal
          className="pointer-events-none absolute left-1/2 top-0.5 size-3.5 -translate-x-1/2 text-slate-300 dark:text-neutral-600"
          aria-hidden
        />
      ) : null}
      {/* vertical accent bar — same as topbar/dock */}
      <span
        className="mt-0.5 h-9 w-0.5 shrink-0 rounded-full bg-[#008f68]"
        aria-hidden
      />

      <span
        className={cn(
          "flex size-9 shrink-0 items-center justify-center rounded-xl",
          dirMeta.iconClass,
        )}
      >
        <DirectionIcon className="size-4" strokeWidth={2.25} />
      </span>

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5">
          <span className="text-[10px] font-semibold uppercase tracking-widest text-slate-400 dark:text-neutral-500">
            {dirMeta.label}
          </span>
          <span className="text-slate-300 dark:text-neutral-600">·</span>
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
        <p className="mt-0.5 truncate text-[14px] font-bold leading-tight text-slate-900 dark:text-neutral-100">
          {customer?.name ?? "Unknown caller"}
        </p>
        <div className="mt-0.5 flex items-center gap-1.5 text-[10.5px] text-slate-500 dark:text-neutral-400">
          <Phone className="size-2.5 shrink-0" />
          <span className="truncate font-medium">
            {customer ? formatPhone(customer.phone) : "Unknown number"}
          </span>
          {customer?.phone ? (
            <CopyButton value={customer.phone} label="phone number" />
          ) : null}
          {call.lineLabel ? (
            <>
              <span className="text-slate-300 dark:text-neutral-600">·</span>
              <span className="truncate">{call.lineLabel}</span>
            </>
          ) : null}
        </div>
      </div>

      {!persistent ? (
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="absolute right-1.5 top-1.5 flex h-7 w-7 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#008f68]/25 dark:hover:bg-neutral-800 dark:hover:text-neutral-200"
        >
          <X className="size-4" />
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
    slate: "border-slate-200 bg-slate-50 text-slate-600 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-300",
    emerald: "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-300",
    amber: "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-300",
    rose: "border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-500/20 dark:bg-rose-500/10 dark:text-rose-300",
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

/** Shared chip for a meta tag inside an activity row. */
function MiniTag({ className, children }: { className?: string; children: ReactNode }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded border px-1 py-[1px] text-[8.5px] font-bold uppercase tracking-wider",
        className,
      )}
    >
      {children}
    </span>
  );
}

/**
 * Secondary "who · where" line shared by every activity row. Each field is
 * colour-coded so agent / yard / campaign are easy to tell apart at a glance.
 */
function MetaChips({
  agent,
  yard,
  campaign,
  className,
}: {
  agent?: string | null;
  yard?: string | null;
  campaign?: string | null;
  className?: string;
}) {
  const chips: ReactNode[] = [];
  if (agent) {
    chips.push(
      <span key="a" className="inline-flex min-w-0 items-center gap-1 text-slate-600 dark:text-neutral-300">
        <User2 className="size-2.5 shrink-0 text-slate-400" />
        <span className="truncate">{agent}</span>
      </span>,
    );
  }
  if (yard) {
    chips.push(
      <span key="y" className="inline-flex min-w-0 items-center gap-1 text-sky-700 dark:text-sky-400">
        <Building2 className="size-2.5 shrink-0 text-sky-500" />
        <span className="truncate">{yard}</span>
      </span>,
    );
  }
  if (campaign) {
    chips.push(
      <span key="c" className="inline-flex min-w-0 items-center gap-1 text-[#006b4f] dark:text-emerald-400">
        <Megaphone className="size-2.5 shrink-0 text-[#008f68]" />
        <span className="truncate">{campaign}</span>
      </span>,
    );
  }
  if (chips.length === 0) return null;
  return (
    <div
      className={cn(
        "mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[10px] font-medium",
        className,
      )}
    >
      {chips}
    </div>
  );
}

/** Optional one-line note preview, surfaced so agents see context at a glance. */
function NotePreview({ note }: { note?: string }) {
  const trimmed = note?.trim();
  if (!trimmed) return null;
  return (
    <p className="mt-0.5 line-clamp-1 text-[10px] italic leading-snug text-slate-400">
      “{trimmed}”
    </p>
  );
}

// ── activity rows ───────────────────────────────────────────────────────
const ROW_CARD =
  "flex items-start gap-2 rounded-lg border border-slate-100 bg-white px-2 py-1.5 transition-colors hover:border-[#008f68]/30 hover:bg-[#f0faf5]/40 dark:border-neutral-800 dark:bg-neutral-950 dark:hover:border-[#008f68]/30";

function callIcon(direction: CallRecord["direction"]) {
  return direction === "INBOUND"
    ? PhoneIncoming
    : direction === "OUTBOUND"
      ? PhoneOutgoing
      : direction === "MISSED"
        ? PhoneMissed
        : Voicemail;
}

function callTint(direction: CallRecord["direction"]) {
  return direction === "MISSED"
    ? "text-rose-500 bg-rose-50 dark:bg-rose-500/10 dark:text-rose-300"
    : direction === "OUTBOUND"
      ? "text-sky-600 bg-sky-50 dark:bg-sky-500/10 dark:text-sky-300"
      : direction === "VOICEMAIL"
        ? "text-amber-600 bg-amber-50 dark:bg-amber-500/10 dark:text-amber-300"
        : "text-emerald-600 bg-emerald-50 dark:bg-emerald-500/10 dark:text-emerald-300";
}

function CallRow({
  item,
  onSelect,
}: {
  item: CallRecord;
  onSelect?: (call: CallRecord) => void;
}) {
  const Icon = callIcon(item.direction);
  const tint = callTint(item.direction);
  const duration = formatDuration(item.durationSec);
  const statusClass = item.status
    ? (TICKET_STATUS_STYLES[item.status] ?? TICKET_STATUS_STYLES.CLOSED)
    : null;

  return (
    <div
      role={onSelect ? "button" : undefined}
      tabIndex={onSelect ? 0 : undefined}
      onClick={onSelect ? () => onSelect(item) : undefined}
      onKeyDown={
        onSelect
          ? (e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                onSelect(item);
              }
            }
          : undefined
      }
      className={cn(ROW_CARD, onSelect && "cursor-pointer")}
    >
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
          <p className="min-w-0 flex-1 truncate text-[11px] font-semibold text-slate-800 dark:text-neutral-100">
            {item.direction === "MISSED"
              ? "Missed call"
              : (titleCase(item.disposition) ?? "Call")}
          </p>
          {statusClass ? (
            <MiniTag className={statusClass}>
              {item.status?.replace(/_/g, " ")}
            </MiniTag>
          ) : null}
        </div>
        <MetaChips
          agent={item.agentName ?? "Unassigned"}
          yard={item.yardName}
          campaign={item.campaignName}
        />
        {duration || item.recordingUrl ? (
          <div className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[9.5px] font-medium text-slate-400">
            {duration ? (
              <span className="inline-flex items-center gap-1 tabular-nums">
                <Clock className="size-2.5" />
                {duration}
              </span>
            ) : null}
            {item.recordingUrl ? (
              <a
                href={item.recordingUrl}
                target="_blank"
                rel="noreferrer"
                data-no-drag
                onClick={(e) => e.stopPropagation()}
                className="inline-flex items-center gap-1 font-semibold text-[#008f68] hover:underline"
              >
                <Mic className="size-2.5" />
                Recording
              </a>
            ) : null}
          </div>
        ) : null}
        <NotePreview note={item.notes} />
      </div>
    </div>
  );
}

function TicketActivityRow({
  item,
  onSelect,
}: {
  item: AnyTicketRecord;
  onSelect?: (ticket: AnyTicketRecord) => void;
}) {
  const isLegacy = item.variant === "legacy";
  const statusClass =
    TICKET_STATUS_STYLES[item.status] ?? TICKET_STATUS_STYLES.CLOSED;
  const priority = !isLegacy ? item.priority : undefined;
  return (
    <div
      role={onSelect ? "button" : undefined}
      tabIndex={onSelect ? 0 : undefined}
      title={onSelect ? "View ticket details" : undefined}
      onClick={onSelect ? () => onSelect(item) : undefined}
      onKeyDown={
        onSelect
          ? (e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                onSelect(item);
              }
            }
          : undefined
      }
      className={cn(ROW_CARD, onSelect && "cursor-pointer")}
    >
      <span
        className={cn(
          "flex size-6 shrink-0 items-center justify-center rounded-md",
          isLegacy
            ? "bg-slate-100 text-slate-500 dark:bg-neutral-800 dark:text-neutral-400"
            : "bg-[#f0faf5] text-[#008f68] dark:bg-emerald-500/10 dark:text-emerald-400",
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
          <p className="min-w-0 flex-1 truncate text-[11px] font-semibold text-slate-800 dark:text-neutral-100">
            {isLegacy ? item.legacyId : `#${item.id} · ${item.title}`}
          </p>
          <MiniTag className={statusClass}>
            {item.status.replace(/_/g, " ")}
          </MiniTag>
        </div>
        <div className="mt-0.5 flex flex-wrap items-center gap-1">
          {priority ? (
            <MiniTag className={PRIORITY_STYLES[priority] ?? PRIORITY_STYLES.LOW}>
              {priority}
            </MiniTag>
          ) : null}
          {!isLegacy && item.ticketType ? (
            <MiniTag className="border-slate-200 bg-slate-50 text-slate-500 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-400">
              {item.ticketType}
            </MiniTag>
          ) : null}
        </div>
        <MetaChips
          agent={(isLegacy ? item.agentName : item.assignedAgentName) ?? "Unassigned"}
          yard={item.yardName}
          campaign={item.campaignName}
        />
        <NotePreview note={item.notes} />
      </div>
    </div>
  );
}

function ManualRow({ item }: { item: ManualRecordEntry }) {
  return (
    <div className={ROW_CARD}>
      <span className="flex size-6 shrink-0 items-center justify-center rounded-md bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-300">
        <ClipboardList className="size-3" />
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5">
          <p className="min-w-0 flex-1 truncate text-[11px] font-semibold text-slate-800 dark:text-neutral-100">
            {item.title}
          </p>
          {item.recordType ? (
            <MiniTag className="border-slate-200 bg-slate-50 text-slate-500 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-400">
              {item.recordType}
            </MiniTag>
          ) : null}
        </div>
        <MetaChips
          agent={item.loggedByName}
          yard={item.yardName}
          campaign={item.campaignName}
        />
        <NotePreview note={item.notes} />
      </div>
    </div>
  );
}

function ActivityRow({
  item,
  onSelectCall,
  onSelectTicket,
}: {
  item: CustomerActivity;
  onSelectCall?: (call: CallRecord) => void;
  onSelectTicket?: (ticket: AnyTicketRecord) => void;
}) {
  if (item.kind === "call")
    return <CallRow item={item} onSelect={onSelectCall} />;
  if (item.kind === "ticket")
    return <TicketActivityRow item={item} onSelect={onSelectTicket} />;
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
    <div className="flex flex-col items-center justify-center gap-1.5 rounded-lg border border-dashed border-slate-200 bg-slate-50/50 px-3 py-6 text-center dark:border-neutral-800 dark:bg-neutral-900/40">
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

const ACTIVITY_PAGE_SIZE = 6;

function ActivityTab({
  customer,
  onSelectCall,
  onSelectTicket,
}: {
  customer: CustomerProfile;
  onSelectCall?: (call: CallRecord) => void;
  onSelectTicket?: (ticket: AnyTicketRecord) => void;
}) {
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
      <div className="flex w-full items-stretch gap-0.5 rounded-md border border-slate-200/80 bg-slate-100 p-0.5 dark:border-neutral-800 dark:bg-neutral-900">
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
                  ? "bg-white text-[#008f68] shadow-sm dark:bg-neutral-950 dark:text-emerald-400"
                  : "text-slate-500 hover:text-slate-800",
              )}
            >
              <span className="truncate">{f.label}</span>
              <span
                className={cn(
                  "rounded px-1 text-[9px] font-bold tabular-nums",
                  active
                    ? "bg-[#f0faf5] text-[#006b4f] dark:bg-emerald-950/40 dark:text-emerald-300"
                    : "bg-slate-200/80 text-slate-500 dark:bg-neutral-700 dark:text-neutral-400",
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
                onSelectCall={onSelectCall}
                onSelectTicket={onSelectTicket}
              />
            ))}
          </div>

          {totalPages > 1 ? (
            <div className="flex items-center justify-between rounded-md border border-slate-200/80 bg-white px-2 py-1 dark:border-neutral-800 dark:bg-neutral-950">
              <span className="text-[9.5px] font-semibold tabular-nums text-slate-500 dark:text-neutral-400">
                {start + 1}–{showingTo}
                <span className="text-slate-300 dark:text-neutral-600"> / </span>
                <span className="text-slate-700 dark:text-neutral-200">{visible.length}</span>
              </span>
              <div className="flex items-center gap-0.5">
                <button
                  type="button"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page <= 1}
                  className="flex h-5 w-5 items-center justify-center rounded text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-700 disabled:cursor-not-allowed disabled:opacity-30 dark:text-neutral-400 dark:hover:bg-neutral-800 dark:hover:text-neutral-200"
                  aria-label="Previous page"
                >
                  <ChevronLeft className="size-3" />
                </button>
                <span className="px-1 text-[9.5px] font-bold tabular-nums text-slate-700 dark:text-neutral-200">
                  {page}
                  <span className="font-medium text-slate-400 dark:text-neutral-500">/{totalPages}</span>
                </span>
                <button
                  type="button"
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page >= totalPages}
                  className="flex h-5 w-5 items-center justify-center rounded text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-700 disabled:cursor-not-allowed disabled:opacity-30 dark:text-neutral-400 dark:hover:bg-neutral-800 dark:hover:text-neutral-200"
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
  // Pinned notes first, then most recent.
  const ordered = [...customer.notes].sort((a, b) => {
    if (Boolean(a.isPinned) !== Boolean(b.isPinned)) return a.isPinned ? -1 : 1;
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });
  return (
    <div className="space-y-1.5">
      {ordered.map((n) => (
        <article
          key={n.id}
          className={cn(
            "rounded-lg border bg-white px-2 py-1.5 dark:bg-neutral-950",
            n.isPinned
              ? "border-amber-200 bg-amber-50/40 dark:border-amber-500/25 dark:bg-amber-500/10"
              : "border-slate-100 dark:border-neutral-800",
          )}
        >
          <div className="flex items-center justify-between gap-2">
            <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-slate-700 dark:text-neutral-200">
              {n.isPinned ? (
                <Pin className="size-2.5 text-amber-500" />
              ) : (
                <User2 className="size-2.5 text-slate-400" />
              )}
              {n.authorName ?? "Unknown"}
            </span>
            <span className="text-[9.5px] font-medium text-slate-400">
              {formatShortDate(n.createdAt)} · {formatRelative(n.createdAt)}
            </span>
          </div>
          <p className="mt-0.5 text-[11px] leading-relaxed text-slate-700 dark:text-neutral-300">
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
      <dl className="grid grid-cols-[64px_1fr] items-center gap-x-2 gap-y-1.5 rounded-lg border border-slate-100 bg-white px-2.5 py-2 text-[11px] dark:border-neutral-800 dark:bg-neutral-950">
        <dt className="text-[9px] font-semibold uppercase tracking-widest text-slate-400">
          Phone
        </dt>
        <dd className="flex items-center gap-1.5 truncate font-medium text-slate-800 dark:text-neutral-200">
          <span className="truncate">{formatPhone(customer.phone)}</span>
          {customer.phone ? (
            <CopyButton value={customer.phone} label="phone number" />
          ) : null}
        </dd>

        {customer.email ? (
          <>
            <dt className="text-[9px] font-semibold uppercase tracking-widest text-slate-400">
              Email
            </dt>
            <dd className="flex items-center gap-1.5 truncate text-slate-700 dark:text-neutral-300">
              <Mail className="size-2.5 shrink-0 text-slate-400" />
              <span className="truncate">{customer.email}</span>
              <CopyButton value={customer.email} label="email" />
            </dd>
          </>
        ) : null}

        {customer.city || customer.state ? (
          <>
            <dt className="text-[9px] font-semibold uppercase tracking-widest text-slate-400">
              Location
            </dt>
            <dd className="flex items-center gap-1.5 text-slate-700 dark:text-neutral-300">
              <MapPin className="size-2.5 shrink-0 text-slate-400" />
              {[customer.city, customer.state].filter(Boolean).join(", ")}
            </dd>
          </>
        ) : null}

        {customer.stats.lastContactAt ? (
          <>
            <dt className="text-[9px] font-semibold uppercase tracking-widest text-slate-400">
              Last
            </dt>
            <dd className="text-slate-700 dark:text-neutral-300">
              {formatShortDate(customer.stats.lastContactAt)}
              <span className="text-slate-400">
                {" "}
                · {formatRelative(customer.stats.lastContactAt)}
              </span>
            </dd>
          </>
        ) : null}

        <dt className="text-[9px] font-semibold uppercase tracking-widest text-slate-400">
          Since
        </dt>
        <dd className="text-slate-700 dark:text-neutral-300">
          {formatShortDate(customer.customerSince)}
          <span className="text-slate-400">
            {" "}
            · {formatRelative(customer.customerSince)}
          </span>
        </dd>
      </dl>

      <div className="grid grid-cols-1 gap-2">
        <section className="rounded-lg border border-slate-100 bg-white px-2.5 py-2 dark:border-neutral-800 dark:bg-neutral-950">
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
                  className="inline-flex items-center gap-1 rounded border border-slate-200 bg-slate-50 px-1.5 py-[1px] text-[10px] font-semibold text-slate-700 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-200"
                >
                  <Building2 className="size-2.5" />
                  {y.commonName ?? y.name}
                </span>
              ))
            )}
          </div>
        </section>

        <section className="rounded-lg border border-slate-100 bg-white px-2.5 py-2 dark:border-neutral-800 dark:bg-neutral-950">
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
                  className="inline-flex items-center gap-1 rounded border border-emerald-100 bg-emerald-50 px-1.5 py-[1px] text-[10px] font-semibold text-emerald-700 dark:border-emerald-900/50 dark:bg-emerald-950/40 dark:text-emerald-300"
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

// ── call detail modal (parallel overlay) ───────────────────────────────
function DetailRow({
  icon: Icon,
  label,
  value,
  valueClass,
}: {
  icon: typeof Phone;
  label: string;
  value: ReactNode;
  valueClass?: string;
}) {
  return (
    <div className="grid grid-cols-[88px_1fr] items-start gap-2 px-3 py-2">
      <dt className="flex items-center gap-1 pt-px text-[9px] font-semibold uppercase tracking-widest text-slate-400">
        <Icon className="size-2.5 shrink-0" />
        {label}
      </dt>
      <dd className={cn("min-w-0 break-words text-[11px] font-medium text-slate-700 dark:text-neutral-300", valueClass)}>
        {value}
      </dd>
    </div>
  );
}

/**
 * Parallel modal that surfaces every field of a single call. Rendered through
 * a portal (so it escapes the draggable panel's transform) and layered above
 * the panel. Closes on Escape, backdrop click, or its own × button.
 */
function CallDetailModal({
  call,
  anchor,
  onClose,
}: {
  call: CallRecord;
  anchor: AnchorPos | null;
  onClose: () => void;
}) {
  const { offset, dragging, beginDrag } = useDragOffset();

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  if (typeof document === "undefined") return null;

  const Icon = callIcon(call.direction);
  const dirMeta = DIRECTION_META[call.direction] ?? DIRECTION_META.INBOUND;
  const duration = formatDuration(call.durationSec);
  const statusClass = call.status
    ? (TICKET_STATUS_STYLES[call.status] ?? TICKET_STATUS_STYLES.CLOSED)
    : null;

  return createPortal(
    <aside
      role="dialog"
      aria-label="Call details"
      style={{
        ...(anchor ? { left: anchor.left, top: anchor.top } : null),
        transform: `translate(${offset.x}px, ${offset.y}px)`,
        ...(dragging ? { transition: "none" } : null),
      }}
      className={cn(
        "fixed z-[70] flex max-h-[calc(100vh-3rem)] w-[440px] max-w-[calc(100vw-2rem)] flex-col overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-[0_12px_36px_rgba(15,23,42,0.18)] dark:border-neutral-800 dark:bg-neutral-950",
        anchor ? "" : "bottom-6 left-6",
        dragging && "shadow-[0_20px_50px_rgba(15,23,42,0.28)]",
      )}
    >
      {/* header — drag handle */}
      <div
        onPointerDown={beginDrag}
        className="relative flex cursor-grab touch-none select-none items-center gap-2.5 border-b border-slate-200/80 bg-white px-3.5 py-3 pr-10 active:cursor-grabbing dark:border-neutral-800 dark:bg-neutral-950"
      >
        <span
          className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#008f68]/45 to-transparent"
          aria-hidden
        />
        <GripHorizontal
          className="pointer-events-none absolute left-1/2 top-0.5 size-3.5 -translate-x-1/2 text-slate-300 dark:text-neutral-600"
          aria-hidden
        />
          <span
            className={cn(
              "flex size-9 shrink-0 items-center justify-center rounded-xl",
              dirMeta.iconClass,
            )}
          >
            <Icon className="size-4" strokeWidth={2.25} />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-400">
              Call details
            </p>
            <p className="truncate text-[14px] font-bold leading-tight text-slate-900 dark:text-neutral-100">
              {call.direction === "MISSED"
                ? "Missed call"
                : (titleCase(call.disposition) ?? `${dirMeta.label} call`)}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close call details"
            className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#008f68]/25 dark:hover:bg-neutral-800 dark:hover:text-neutral-200"
          >
            <X className="size-4" />
          </button>
        </div>

        {/* body */}
        <div className="scrollbar-app min-h-0 flex-1 overflow-y-auto bg-[#f4f5f7] p-3 dark:bg-neutral-900/40">
          <div className="mb-2 flex flex-wrap items-center gap-1.5">
            <span
              className={cn(
                "inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[10px] font-semibold",
                callTint(call.direction),
              )}
            >
              <Icon className="size-2.5" />
              {dirMeta.label}
            </span>
            {statusClass ? (
              <MiniTag className={statusClass}>
                {call.status?.replace(/_/g, " ")}
              </MiniTag>
            ) : null}
            {call.id ? (
              <MiniTag className="border-slate-200 bg-slate-50 text-slate-500 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-400">
                #{call.id}
              </MiniTag>
            ) : null}
          </div>

          <dl className="divide-y divide-slate-100 rounded-xl border border-slate-100 bg-white dark:divide-neutral-800 dark:border-neutral-800 dark:bg-neutral-950">
            <DetailRow
              icon={CalendarClock}
              label="When"
              value={formatDateTime(call.occurredAt) ?? "—"}
            />
            <DetailRow icon={Clock} label="Duration" value={duration ?? "—"} />
            <DetailRow
              icon={Tag}
              label="Disposition"
              value={titleCase(call.disposition) ?? "—"}
            />
            <DetailRow
              icon={User2}
              label="Agent"
              value={call.agentName ?? "Unassigned"}
              valueClass="text-slate-700 dark:text-neutral-200"
            />
            <DetailRow
              icon={Building2}
              label="Yard"
              value={call.yardName ?? "—"}
              valueClass="text-sky-700 dark:text-sky-400"
            />
            <DetailRow
              icon={Megaphone}
              label="Campaign"
              value={call.campaignName ?? "—"}
              valueClass="text-[#006b4f] dark:text-emerald-400"
            />
            <DetailRow icon={Hash} label="Call ID" value={call.id ?? "—"} />
          </dl>

          {call.recordingUrl ? (
            <section className="mt-2 overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-[0_1px_3px_rgba(0,0,0,0.06)] dark:border-neutral-800 dark:bg-neutral-950">
              <div className="flex items-center gap-2 px-3.5 pb-2.5 pt-3">
                <div className="flex size-6 shrink-0 items-center justify-center rounded-lg bg-[#008f68]/10">
                  <Mic className="size-3 text-[#008f68]" />
                </div>
                <span className="flex-1 text-[11px] font-bold uppercase tracking-wider text-slate-700 dark:text-slate-200">
                  Recording
                </span>
                {duration ? (
                  <span className="font-mono text-[10px] tabular-nums text-slate-400">
                    {duration}
                  </span>
                ) : null}
              </div>
              <div className="px-3.5 pb-3.5">
                <CallRecordingPlayer
                  callId={call.id}
                  durationSec={call.durationSec ?? null}
                />
              </div>
            </section>
          ) : null}

          <section className="mt-2 rounded-xl border border-slate-100 bg-white p-2.5 dark:border-neutral-800 dark:bg-neutral-950">
            <p className="flex items-center gap-1 text-[9px] font-semibold uppercase tracking-widest text-slate-400">
              <FileText className="size-2.5" />
              Notes
            </p>
            <p className="mt-1 whitespace-pre-wrap text-[11px] leading-relaxed text-slate-700 dark:text-neutral-300">
              {call.notes?.trim() || (
                <span className="italic text-slate-400">
                  No notes recorded for this call.
                </span>
              )}
            </p>
          </section>
        </div>
      </aside>,
    document.body,
  );
}

// ── main ────────────────────────────────────────────────────────────────
function TicketDetailModal({
  ticket,
  anchor,
  onClose,
}: {
  ticket: AnyTicketRecord;
  anchor: AnchorPos | null;
  onClose: () => void;
}) {
  const { offset, dragging, beginDrag } = useDragOffset();

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  if (typeof document === "undefined") return null;

  const isLegacy = ticket.variant === "legacy";
  const statusClass =
    TICKET_STATUS_STYLES[ticket.status] ?? TICKET_STATUS_STYLES.CLOSED;
  const priority = !isLegacy ? ticket.priority : undefined;
  const hasFollowUp =
    !isLegacy &&
    (Boolean(ticket.followUpDueDate) ||
      Boolean(ticket.followUpAssignedToName) ||
      Boolean(ticket.followUpAssignedToId));
  const idRows =
    !isLegacy
      ? [
          { label: "Customer ID", value: ticket.customerId },
          { label: "Call ID", value: ticket.callId },
          { label: "Yard ID", value: ticket.yardId },
          { label: "Campaign ID", value: ticket.campaignId },
          { label: "Agent ID", value: ticket.agentId },
          { label: "Phone line ID", value: ticket.phoneLineId },
          { label: "Follow-up ID", value: ticket.followUpAssignedToId },
        ].filter((row) => row.value !== undefined && row.value !== null)
      : [];

  return createPortal(
    <aside
      role="dialog"
      aria-label="Ticket details"
      style={{
        ...(anchor ? { left: anchor.left, top: anchor.top } : null),
        transform: `translate(${offset.x}px, ${offset.y}px)`,
        ...(dragging ? { transition: "none" } : null),
      }}
      className={cn(
        "fixed z-[70] flex max-h-[calc(100vh-3rem)] w-[440px] max-w-[calc(100vw-2rem)] flex-col overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-[0_12px_36px_rgba(15,23,42,0.18)] dark:border-neutral-800 dark:bg-neutral-950",
        anchor ? "" : "bottom-6 left-6",
        dragging && "shadow-[0_20px_50px_rgba(15,23,42,0.28)]",
      )}
    >
      <div
        onPointerDown={beginDrag}
        className="relative flex cursor-grab touch-none select-none items-center gap-2.5 border-b border-slate-200/80 bg-white px-3.5 py-3 pr-10 active:cursor-grabbing dark:border-neutral-800 dark:bg-neutral-950"
      >
        <span
          className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#008f68]/45 to-transparent"
          aria-hidden
        />
        <GripHorizontal
          className="pointer-events-none absolute left-1/2 top-0.5 size-3.5 -translate-x-1/2 text-slate-300 dark:text-slate-600"
          aria-hidden
        />
        <span
          className={cn(
            "flex size-9 shrink-0 items-center justify-center rounded-xl",
            isLegacy
              ? "bg-slate-100 text-slate-500 dark:bg-neutral-800 dark:text-neutral-400"
              : "bg-[#f0faf5] text-[#008f68] ring-1 ring-[#008f68]/15 dark:bg-emerald-500/10 dark:text-emerald-400 dark:ring-emerald-500/25",
          )}
        >
          {isLegacy ? (
            <Archive className="size-4" strokeWidth={2.25} />
          ) : (
            <TicketIcon className="size-4" strokeWidth={2.25} />
          )}
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-400">
            Ticket details
          </p>
          <p className="truncate text-[14px] font-bold leading-tight text-slate-900 dark:text-slate-100">
            {isLegacy ? "Legacy ticket" : `Ticket #${ticket.id}`}
          </p>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close ticket details"
          className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#008f68]/25 dark:hover:bg-neutral-800"
        >
          <X className="size-4" />
        </button>
      </div>

      <div className="scrollbar-app min-h-0 flex-1 overflow-y-auto bg-[#f4f5f7] p-3 dark:bg-neutral-900/40">
        <div className="mb-2 flex flex-wrap items-center gap-1.5">
          <MiniTag className={statusClass}>
            {ticket.status.replace(/_/g, " ")}
          </MiniTag>
          {priority ? (
            <MiniTag className={PRIORITY_STYLES[priority] ?? PRIORITY_STYLES.LOW}>
              {priority}
            </MiniTag>
          ) : null}
          {!isLegacy && ticket.ticketType ? (
            <MiniTag className="border-slate-200 bg-slate-50 text-slate-500 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-400">
              {ticket.ticketType}
            </MiniTag>
          ) : null}
          <MiniTag className="border-slate-200 bg-slate-50 text-slate-500 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-400">
            #{ticket.id}
          </MiniTag>
        </div>

        <dl className="divide-y divide-slate-100 rounded-xl border border-slate-100 bg-white dark:divide-neutral-800 dark:border-neutral-800 dark:bg-neutral-950">
          <DetailRow icon={Hash} label="Ticket ID" value={ticket.id} />
          {!isLegacy ? (
            <>
              <DetailRow
                icon={Tag}
                label="Status"
                value={ticket.status.replace(/_/g, " ")}
              />
              <DetailRow
                icon={AlertTriangle}
                label="Priority"
                value={priority ?? "-"}
              />
              <DetailRow
                icon={TicketIcon}
                label="Type"
                value={ticket.ticketType ?? "-"}
              />
            </>
          ) : null}
          <DetailRow
            icon={CalendarClock}
            label="Created"
            value={formatDateTime(ticket.occurredAt) ?? "-"}
          />
          {!isLegacy && hasFollowUp ? (
            <>
              {ticket.followUpDueDate ? (
                <DetailRow
                  icon={Clock}
                  label="Follow-up"
                  value={formatDateTime(ticket.followUpDueDate) ?? "-"}
                />
              ) : null}
              <DetailRow
                icon={User2}
                label="Follow-up agent"
                value={
                  ticket.followUpAssignedToName ??
                  ticket.followUpAssignedToId ??
                  "-"
                }
              />
            </>
          ) : null}
          {isLegacy ? (
            <DetailRow
              icon={PhoneIncoming}
              label="Direction"
              value={ticket.direction ?? "-"}
            />
          ) : null}
          {!isLegacy && ticket.resolvedAt ? (
            <DetailRow
              icon={Check}
              label="Resolved"
              value={formatDateTime(ticket.resolvedAt) ?? "-"}
            />
          ) : null}
          {isLegacy && ticket.disposition ? (
            <DetailRow
              icon={Tag}
              label="Disposition"
              value={titleCase(ticket.disposition) ?? "-"}
            />
          ) : null}
          {!isLegacy && ticket.campaignOption ? (
            <DetailRow
              icon={Tag}
              label="Campaign option"
              value={titleCase(ticket.campaignOption) ?? "-"}
            />
          ) : null}
          <DetailRow
            icon={User2}
            label="Agent"
            value={
              (isLegacy ? ticket.agentName : ticket.assignedAgentName) ??
              "Unassigned"
            }
            valueClass="text-slate-700 dark:text-slate-200"
          />
          <DetailRow
            icon={Building2}
            label="Yard"
            value={ticket.yardName ?? "-"}
            valueClass="text-sky-700 dark:text-sky-400"
          />
          <DetailRow
            icon={Megaphone}
            label="Campaign"
            value={ticket.campaignName ?? "-"}
            valueClass="text-[#006b4f] dark:text-emerald-400"
          />
        </dl>

        {idRows.length > 0 ? (
          <dl className="mt-2 divide-y divide-slate-100 rounded-xl border border-slate-100 bg-white dark:divide-neutral-800 dark:border-neutral-800 dark:bg-neutral-950">
            {idRows.map((row) => (
              <DetailRow
                key={row.label}
                icon={Hash}
                label={row.label}
                value={row.value}
              />
            ))}
          </dl>
        ) : null}

        <section className="mt-2 rounded-xl border border-slate-100 bg-white p-2.5 dark:border-neutral-800 dark:bg-neutral-950">
          <p className="flex items-center gap-1 text-[9px] font-semibold uppercase tracking-widest text-slate-400">
            <FileText className="size-2.5" />
            Issue detail
          </p>
          <p className="mt-1 whitespace-pre-wrap text-[11px] leading-relaxed text-slate-700 dark:text-slate-300">
            {ticket.notes?.trim() || (
              <span className="italic text-slate-400">
                No details recorded for this ticket.
              </span>
            )}
          </p>
        </section>

      </div>
    </aside>,
    document.body,
  );
}

export function IncomingCallModal({
  open,
  onOpenChange,
  customer,
  call,
  persistent = false,
  draggable = true,
  position = "center",
}: IncomingCallModalProps) {
  // Drag-to-move: offset applied as a transform on top of the anchor position.
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [dragging, setDragging] = useState(false);
  const dragStart = useRef({ px: 0, py: 0, ox: 0, oy: 0 });

  // Currently expanded activity detail modal + where to anchor it.
  const [selectedCall, setSelectedCall] = useState<CallRecord | null>(null);
  const [selectedTicket, setSelectedTicket] = useState<AnyTicketRecord | null>(
    null,
  );
  const panelRef = useRef<HTMLElement>(null);
  const [detailAnchor, setDetailAnchor] = useState<AnchorPos | null>(null);

  // Keep the detail window pinned beside the panel — recomputed while the
  // panel is dragged (offset) and on viewport resize.
  useIsoLayoutEffect(() => {
    if (!selectedCall && !selectedTicket) return;
    const el = panelRef.current;
    if (!el) return;
    const compute = () => {
      const r = el.getBoundingClientRect();
      const margin = 8;
      // Prefer the left side of the panel; fall back to the right if there's
      // no room, then clamp inside the viewport.
      let left = r.left - DETAIL_WIDTH - DETAIL_GAP;
      if (left < margin) left = r.right + DETAIL_GAP;
      left = Math.min(
        Math.max(margin, left),
        Math.max(margin, window.innerWidth - DETAIL_WIDTH - margin),
      );
      const top = Math.min(
        Math.max(margin, r.top),
        Math.max(margin, window.innerHeight - 160),
      );
      setDetailAnchor({ left, top });
    };
    compute();
    window.addEventListener("resize", compute);
    return () => window.removeEventListener("resize", compute);
  }, [selectedCall, selectedTicket, offset.x, offset.y]);

  // Re-center whenever the panel is reopened so it never gets "lost".
  useEffect(() => {
    if (open) setOffset({ x: 0, y: 0 });
  }, [open]);

  // Drop any open detail when the panel closes or the customer changes.
  useEffect(() => {
    setSelectedCall(null);
    setSelectedTicket(null);
  }, [open, customer?.id]);

  const beginDrag = useCallback(
    (e: ReactPointerEvent) => {
      // Don't start a drag from interactive controls (close, copy, links).
      if (
        (e.target as HTMLElement).closest("button, a, [data-no-drag]")
      )
        return;
      dragStart.current = {
        px: e.clientX,
        py: e.clientY,
        ox: offset.x,
        oy: offset.y,
      };
      setDragging(true);
    },
    [offset.x, offset.y],
  );

  useEffect(() => {
    if (!dragging) return;
    const onMove = (e: PointerEvent) => {
      const { px, py, ox, oy } = dragStart.current;
      setOffset({ x: ox + (e.clientX - px), y: oy + (e.clientY - py) });
    };
    const onUp = () => setDragging(false);
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
    };
  }, [dragging]);

  // Allow closing with Escape from anywhere while the panel is open. When the
  // detail modal is open it owns Escape, so the panel stays put.
  useEffect(() => {
    if (!open || persistent) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !selectedCall && !selectedTicket)
        onOpenChange(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, persistent, onOpenChange, selectedCall, selectedTicket]);

  if (!open) return null;

  const positionClass =
    position === "inline"
      ? "relative"
      : position === "bottom-left"
        ? "fixed bottom-6 left-6 z-[55]"
        : position === "bottom-right"
          ? "fixed bottom-6 right-[26.25rem] z-[55] max-[920px]:right-6 max-[920px]:bottom-[28rem]"
          : // center (default): top-1/2 left-1/2, centering baked into the transform
            "fixed top-1/2 left-1/2 z-[55]";

  // For centered mode the -50%/-50% is baked into the transform so the
  // drag offset composes naturally without an extra wrapper element.
  const isCentered = position === "center";
  const tx = isCentered ? `calc(-50% + ${offset.x}px)` : `${offset.x}px`;
  const ty = isCentered ? `calc(-50% + ${offset.y}px)` : `${offset.y}px`;

  return (
    <aside
      ref={panelRef}
      role={persistent ? undefined : "dialog"}
      aria-label="Incoming call · customer profile"
      style={{
        transform: `translate(${tx}, ${ty})`,
        ...(dragging ? { transition: "none" } : null),
      }}
      className={cn(
        positionClass,
        "flex w-[460px] max-w-[calc(100vw-2rem)] flex-col",
        position === "inline"
          ? "max-h-[760px]"
          : "max-h-[min(760px,calc(100vh-3rem))]",
        "overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-[0_12px_36px_rgba(15,23,42,0.18)]",
        "dark:border-neutral-800 dark:bg-neutral-950",
        dragging && "shadow-[0_20px_50px_rgba(15,23,42,0.28)]",
      )}
    >
      <PanelHeader
        customer={customer}
        call={call}
        onClose={() => onOpenChange(false)}
        persistent={persistent}
        draggable={draggable}
        onPointerDown={beginDrag}
      />

      {/* Body */}
      <div className="scrollbar-app min-h-0 flex-1 overflow-y-auto bg-[#f4f5f7] px-2.5 py-2 dark:bg-neutral-900/40">
        {customer ? (
          <div className="space-y-2">
            {/* Pinned note callout (compact) */}
            {customer.pinnedNote ? (
              <div className="flex items-start gap-1.5 rounded-lg border border-amber-200 bg-amber-50/70 px-2 py-1.5 dark:border-amber-900/50 dark:bg-amber-950/30">
                <Pin className="mt-0.5 size-3 shrink-0 text-amber-600" />
                <p className="text-[10.5px] leading-snug text-amber-900 dark:text-amber-100">
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
              <TabsList className="flex h-7 w-full justify-start gap-0.5 rounded-md border border-slate-200/80 bg-slate-100 p-0.5 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
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
                      "data-[state=active]:bg-white data-[state=active]:text-[#008f68] data-[state=active]:shadow-sm dark:data-[state=active]:bg-neutral-950 dark:data-[state=active]:text-emerald-400",
                      "text-slate-500 hover:text-slate-800 dark:text-neutral-400 dark:hover:text-neutral-200",
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
                <ActivityTab
                  customer={customer}
                  onSelectCall={(nextCall) => {
                    setSelectedTicket(null);
                    setSelectedCall(nextCall);
                  }}
                  onSelectTicket={(nextTicket) => {
                    setSelectedCall(null);
                    setSelectedTicket(nextTicket);
                  }}
                />
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
            <span className="flex size-10 items-center justify-center rounded-xl bg-slate-100 text-slate-500 dark:bg-neutral-800 dark:text-neutral-400">
              <PhoneIncoming className="size-4" />
            </span>
            <p className="text-[12px] font-semibold text-slate-800 dark:text-neutral-100">
              Unknown caller
            </p>
            <p className="max-w-[260px] text-[10.5px] leading-relaxed text-slate-500 dark:text-neutral-400">
              No customer profile matches this number. Answer the call and
              create a contact afterwards.
            </p>
          </div>
        )}
      </div>

      {selectedCall ? (
        <CallDetailModal
          key={selectedCall.id}
          call={selectedCall}
          anchor={detailAnchor}
          onClose={() => setSelectedCall(null)}
        />
      ) : null}
      {selectedTicket ? (
        <TicketDetailModal
          key={`${selectedTicket.variant}-${selectedTicket.id}`}
          ticket={selectedTicket}
          anchor={detailAnchor}
          onClose={() => setSelectedTicket(null)}
        />
      ) : null}
    </aside>
  );
}

export default IncomingCallModal;
