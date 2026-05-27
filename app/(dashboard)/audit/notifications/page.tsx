"use client";

import { useEffect, useState, useCallback, useRef, useMemo } from "react";
import {
  AlertCircle,
  ArrowDown,
  ArrowDownToLine,
  ArrowUp,
  ArrowUpDown,
  Bell,
  ChevronsLeft,
  ChevronsRight,
  ChevronLeft,
  ChevronRight,
  Check,
  Clock3,
  FileText,
  List,
  Phone,
  Radio,
  RefreshCw,
  Search,
  Table2,
  Users,
  X,
} from "lucide-react";
import { appPanelClass } from "@/components/layout/sidebar-theme";
import { getPaginationPageItems } from "@/lib/pagination-pages";
import { cn } from "@/lib/utils";
import { NotificationsFilters } from "./components/NotificationsFilters";
import { NotificationsStatsGrid } from "./components/NotificationsStatsGrid";
import type { NotificationTab } from "./components/notification-types";

// ─── Types ────────────────────────────────────────────────────────────────────
type NotificationType =
  | "CALLBACK_OVERDUE"
  | "TICKET_FOLLOWUP_OVERDUE"
  | "SCHEDULED_CALL_DUE";

type SortField = "id" | "type" | "agentId" | "read" | "createdAt";
type SortDir = "asc" | "desc";
type ViewMode = "table" | "timeline";

interface AuditEntry {
  id: number;
  type: NotificationType;
  message: string;
  agentId: number | null;
  agent: { id: number; name?: string; role?: string; email?: string } | null;
  callId: number | null;
  ticketId: number | null;
  scheduleCallId?: number | null;
  read: boolean;
  createdAt: string;
  readAt?: string | null;
  deliveredVia?: "websocket" | "poll" | "push";
}

// ─── Mock data ─────────────────────────────────────────────────────────────────
const MOCK_DATA: any[] = [
  { id: 1,  type: "CALLBACK_OVERDUE",         message: "Callback overdue for María López — was due May 24, 9:00 AM",       agentId: 3,    agent: { id: 3, name: "Carlos R.",  role: "Agent"    }, callId: 102, ticketId: null, read: false, createdAt: "2026-05-24T09:15:00Z", readAt: null,                  deliveredVia: "websocket" },
  { id: 2,  type: "TICKET_FOLLOWUP_OVERDUE",  message: "Ticket follow-up overdue for +1561-269-4191 — was due May 24, 2:00 PM", agentId: 5, agent: { id: 5, name: "Ana M.",     role: "Agent"    }, callId: null, ticketId: 47, read: false, createdAt: "2026-05-24T08:55:00Z", readAt: null,                  deliveredVia: "websocket" },
  { id: 3,  type: "CALLBACK_REMINDER",        message: "Callback reminder for Juan García — due in 30 minutes",             agentId: null, agent: null,                               callId: 99,  ticketId: null, read: true,  createdAt: "2026-05-23T18:30:00Z", readAt: "2026-05-23T18:35:00Z", deliveredVia: "poll"      },
  { id: 4,  type: "TICKET_ASSIGNED",          message: "Ticket #51 assigned to you by supervisor",                          agentId: 5,    agent: { id: 5, name: "Ana M.",     role: "Agent"    }, callId: null, ticketId: 51, read: true,  createdAt: "2026-05-23T16:00:00Z", readAt: "2026-05-23T16:12:00Z", deliveredVia: "websocket" },
  { id: 5,  type: "CALLBACK_OVERDUE",         message: "Callback overdue for +1509-401-8327 — was due May 22, 11:00 AM",   agentId: 3,    agent: { id: 3, name: "Carlos R.",  role: "Agent"    }, callId: 88,  ticketId: null, read: true,  createdAt: "2026-05-22T12:05:00Z", readAt: "2026-05-22T12:30:00Z", deliveredVia: "websocket" },
  { id: 6,  type: "TICKET_FOLLOWUP_OVERDUE",  message: "Ticket follow-up overdue for Pedro Sánchez — was due May 21, 3:30 PM", agentId: 2, agent: { id: 2, name: "Laura V.",   role: "Supervisor" }, callId: null, ticketId: 38, read: false, createdAt: "2026-05-21T15:40:00Z", readAt: null,                  deliveredVia: "poll"      },
  { id: 7,  type: "CALLBACK_OVERDUE",         message: "Callback overdue for +1813-598-3972 — was due May 20, 8:00 AM",    agentId: null, agent: null,                               callId: 75,  ticketId: null, read: false, createdAt: "2026-05-20T08:10:00Z", readAt: null,                  deliveredVia: "websocket" },
  { id: 8,  type: "TICKET_ASSIGNED",          message: "Ticket #44 assigned to you by admin",                               agentId: 2,    agent: { id: 2, name: "Laura V.",   role: "Supervisor" }, callId: null, ticketId: 44, read: true,  createdAt: "2026-05-19T14:20:00Z", readAt: "2026-05-19T14:45:00Z", deliveredVia: "websocket" },
  { id: 9,  type: "CALLBACK_REMINDER",        message: "Callback reminder for 19546299690 — due in 1 hour",                agentId: 3,    agent: { id: 3, name: "Carlos R.",  role: "Agent"    }, callId: 60,  ticketId: null, read: true,  createdAt: "2026-05-18T10:00:00Z", readAt: "2026-05-18T10:05:00Z", deliveredVia: "push"      },
  { id: 10, type: "TICKET_FOLLOWUP_OVERDUE",  message: "Ticket follow-up overdue for Empresa XYZ — was due May 17, 4:00 PM", agentId: 5,  agent: { id: 5, name: "Ana M.",     role: "Agent"    }, callId: null, ticketId: 29, read: true,  createdAt: "2026-05-17T17:05:00Z", readAt: "2026-05-17T17:20:00Z", deliveredVia: "poll"      },
  { id: 11, type: "CALLBACK_OVERDUE",         message: "Callback overdue for Roberto D. — was due May 16, 10:00 AM",       agentId: 2,    agent: { id: 2, name: "Laura V.",   role: "Supervisor" }, callId: 55,  ticketId: null, read: false, createdAt: "2026-05-16T11:00:00Z", readAt: null,                  deliveredVia: "websocket" },
  { id: 12, type: "TICKET_ASSIGNED",          message: "Ticket #39 assigned to Carlos by admin",                           agentId: 3,    agent: { id: 3, name: "Carlos R.",  role: "Agent"    }, callId: null, ticketId: 39, read: true,  createdAt: "2026-05-15T09:30:00Z", readAt: "2026-05-15T09:50:00Z", deliveredVia: "websocket" },
  { id: 13, type: "CALLBACK_REMINDER",        message: "Callback reminder for +1329-208-3124 — due in 15 minutes",        agentId: null, agent: null,                               callId: 44,  ticketId: null, read: true,  createdAt: "2026-05-14T14:45:00Z", readAt: "2026-05-14T14:46:00Z", deliveredVia: "push"      },
  { id: 14, type: "CALLBACK_OVERDUE",         message: "Callback overdue for Empresa ABC — was due May 13, 1:00 PM",      agentId: 5,    agent: { id: 5, name: "Ana M.",     role: "Agent"    }, callId: 33,  ticketId: null, read: true,  createdAt: "2026-05-13T14:00:00Z", readAt: "2026-05-13T15:00:00Z", deliveredVia: "websocket" },
  { id: 15, type: "TICKET_FOLLOWUP_OVERDUE",  message: "Ticket follow-up overdue for Sandra C. — was due May 12, 9:30 AM", agentId: 3,  agent: { id: 3, name: "Carlos R.",  role: "Agent"    }, callId: null, ticketId: 22, read: false, createdAt: "2026-05-12T10:00:00Z", readAt: null,                  deliveredVia: "poll"      },
  { id: 16, type: "TICKET_ASSIGNED",          message: "Ticket #18 assigned to Laura by admin",                            agentId: 2,    agent: { id: 2, name: "Laura V.",   role: "Supervisor" }, callId: null, ticketId: 18, read: true,  createdAt: "2026-05-11T11:10:00Z", readAt: "2026-05-11T11:30:00Z", deliveredVia: "websocket" },
  { id: 17, type: "CALLBACK_OVERDUE",         message: "Callback overdue for +1903-326-2483 — was due May 10, 3:00 PM",   agentId: null, agent: null,                               callId: 21,  ticketId: null, read: false, createdAt: "2026-05-10T15:10:00Z", readAt: null,                  deliveredVia: "websocket" },
  { id: 18, type: "CALLBACK_REMINDER",        message: "Callback reminder for 525585539716 — due in 2 hours",             agentId: 5,    agent: { id: 5, name: "Ana M.",     role: "Agent"    }, callId: 18,  ticketId: null, read: true,  createdAt: "2026-05-09T08:00:00Z", readAt: "2026-05-09T08:10:00Z", deliveredVia: "push"      },
  { id: 19, type: "TICKET_ASSIGNED",          message: "Ticket #12 assigned to you by supervisor",                         agentId: 3,    agent: { id: 3, name: "Carlos R.",  role: "Agent"    }, callId: null, ticketId: 12, read: true,  createdAt: "2026-05-08T13:00:00Z", readAt: "2026-05-08T13:25:00Z", deliveredVia: "websocket" },
  { id: 20, type: "TICKET_FOLLOWUP_OVERDUE",  message: "Ticket follow-up overdue for Clinica Norte — was due May 7, 10:00 AM", agentId: 2, agent: { id: 2, name: "Laura V.", role: "Supervisor" }, callId: null, ticketId: 8,  read: true,  createdAt: "2026-05-07T10:30:00Z", readAt: "2026-05-07T11:00:00Z", deliveredVia: "poll"      },
  { id: 21, type: "CALLBACK_OVERDUE",         message: "Callback overdue for +1 329-208-3124 — was due May 6, 2:00 PM",   agentId: 5,    agent: { id: 5, name: "Ana M.",     role: "Agent"    }, callId: 9,   ticketId: null, read: true,  createdAt: "2026-05-06T14:15:00Z", readAt: "2026-05-06T14:50:00Z", deliveredVia: "websocket" },
  { id: 22, type: "CALLBACK_REMINDER",        message: "Callback reminder for María López — due tomorrow at 9:00 AM",     agentId: 3,    agent: { id: 3, name: "Carlos R.",  role: "Agent"    }, callId: 5,   ticketId: null, read: true,  createdAt: "2026-05-05T17:00:00Z", readAt: "2026-05-05T17:02:00Z", deliveredVia: "push"      },
  { id: 23, type: "TICKET_ASSIGNED",          message: "Ticket #5 assigned to Ana by supervisor",                          agentId: 5,    agent: { id: 5, name: "Ana M.",     role: "Agent"    }, callId: null, ticketId: 5,  read: true,  createdAt: "2026-05-04T10:00:00Z", readAt: "2026-05-04T10:15:00Z", deliveredVia: "websocket" },
  { id: 24, type: "TICKET_FOLLOWUP_OVERDUE",  message: "Ticket follow-up overdue for +1813-598-3972 — was due May 3",    agentId: null, agent: null,                               callId: null, ticketId: 3,  read: true,  createdAt: "2026-05-03T09:00:00Z", readAt: "2026-05-03T09:30:00Z", deliveredVia: "poll"      },
  { id: 25, type: "CALLBACK_OVERDUE",         message: "Callback overdue for Pedro Sánchez — was due May 2, 11:00 AM",    agentId: 2,    agent: { id: 2, name: "Laura V.",   role: "Supervisor" }, callId: 2,   ticketId: null, read: false, createdAt: "2026-05-02T11:30:00Z", readAt: null,                  deliveredVia: "websocket" },
];

// ─── Type config ──────────────────────────────────────────────────────────────
const TYPE_CFG: Record<
  NotificationType,
  {
    label: string;
    badgeClass: string;
    dotClass: string;
    bg: string;
    dot: string;
  }
> = {
  CALLBACK_OVERDUE: {
    label: "Callback overdue",
    badgeClass: "border-red-200 bg-red-50 text-red-700",
    dotClass: "bg-red-500",
    bg: "#FEF2F2",
    dot: "#EF4444",
  },
  SCHEDULED_CALL_DUE: {
    label: "Scheduled call due",
    badgeClass: "border-sky-200 bg-sky-50 text-sky-700",
    dotClass: "bg-sky-500",
    bg: "#EFF6FF",
    dot: "#3B82F6",
  },
  TICKET_FOLLOWUP_OVERDUE: {
    label: "Ticket follow-up OD",
    badgeClass: "border-emerald-200 bg-emerald-50 text-emerald-700",
    dotClass: "bg-emerald-500",
    bg: "#ECFDF5",
    dot: "#10B981",
  },
};

const AGENT_COLORS: [string, string][] = [
  ["#ECFDF5","#065F46"], ["#EFF6FF","#1E40AF"], ["#FFFBEB","#92400E"],
  ["#F5F3FF","#5B21B6"], ["#FFF1F2","#9F1239"],
];

const AUDIT_FETCH_LIMIT = 250;

// ─── Helpers ──────────────────────────────────────────────────────────────────
function fmtDateFull(d: string) {
  return new Date(d).toLocaleString("en-US", { month: "short", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit" });
}
function fmtDateShort(d: string) {
  return new Date(d).toLocaleString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
}
function timeAgo(d: string) {
  const diff = Date.now() - new Date(d).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const days = Math.floor(h / 24);
  return `${days}d ago`;
}
function readLatency(created: string, readAt?: string | null) {
  if (!readAt) return null;
  const diff = new Date(readAt).getTime() - new Date(created).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "<1m";
  if (m < 60) return `${m}m`;
  return `${Math.floor(m / 60)}h ${m % 60}m`;
}
function readLatencyMinutes(created: string, readAt?: string | null) {
  if (!readAt) return null;
  const diff = new Date(readAt).getTime() - new Date(created).getTime();
  if (!Number.isFinite(diff) || diff < 0) return null;
  return Math.max(0, Math.round(diff / 60000));
}
function fmtCompactDuration(minutes: number | null) {
  if (minutes === null) return "—";
  if (minutes < 1) return "<1m";
  if (minutes < 60) return `${minutes}m`;
  return `${Math.floor(minutes / 60)}h ${minutes % 60}m`;
}
function initials(name?: string) {
  if (!name) return "?";
  return name.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase();
}
function agentColors(id: number): [string, string] {
  return AGENT_COLORS[id % AGENT_COLORS.length];
}
function groupByDay(entries: AuditEntry[]): Record<string, AuditEntry[]> {
  return entries.reduce((acc, e) => {
    const day = new Date(e.createdAt).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
    if (!acc[day]) acc[day] = [];
    acc[day].push(e);
    return acc;
  }, {} as Record<string, AuditEntry[]>);
}

const NOTIFICATION_TYPES = new Set<NotificationType>([
  "CALLBACK_OVERDUE",
  "TICKET_FOLLOWUP_OVERDUE",
  "SCHEDULED_CALL_DUE",
]);

function normalizeNotificationType(type: unknown): NotificationType {
  const normalized = String(type || "").toUpperCase();
  return NOTIFICATION_TYPES.has(normalized as NotificationType)
    ? (normalized as NotificationType)
    : "SCHEDULED_CALL_DUE";
}

function normalizeAgent(raw: any, agentId: number | null): AuditEntry["agent"] {
  const agent = raw?.agent || raw?.recipient || raw?.user || null;
  if (agent && typeof agent === "object") {
    const id = Number(agent.id ?? agentId);
    return {
      id: Number.isFinite(id) ? id : agentId ?? 0,
      name:
        agent.name ||
        [agent.firstName, agent.lastName].filter(Boolean).join(" ") ||
        agent.email,
      role: agent.role,
    };
  }
  return agentId ? { id: agentId, name: `Agent #${agentId}` } : null;
}

function normalizeAuditEntry(raw: any): AuditEntry | null {
  const id = Number(raw?.id);
  if (!Number.isFinite(id)) return null;

  const agentIdValue = raw?.agentId ?? raw?.recipientId ?? raw?.userId ?? null;
  const agentId =
    agentIdValue === null || agentIdValue === undefined
      ? null
      : Number(agentIdValue);
  const callIdValue = raw?.callId ?? raw?.call?.id ?? null;
  const ticketIdValue = raw?.ticketId ?? raw?.ticket?.id ?? null;
  const scheduleCallIdValue =
    raw?.scheduleCallId ?? raw?.scheduleCall?.id ?? null;

  return {
    id,
    type: normalizeNotificationType(raw?.type),
    message: String(raw?.message || raw?.title || "Notification"),
    agentId: Number.isFinite(agentId) ? agentId : null,
    agent: normalizeAgent(raw, Number.isFinite(agentId) ? agentId : null),
    callId:
      callIdValue === null || callIdValue === undefined
        ? null
        : Number(callIdValue),
    ticketId:
      ticketIdValue === null || ticketIdValue === undefined
        ? null
        : Number(ticketIdValue),
    scheduleCallId:
      scheduleCallIdValue === null || scheduleCallIdValue === undefined
        ? null
        : Number(scheduleCallIdValue),
    read: Boolean(raw?.read ?? raw?.isRead),
    createdAt: raw?.createdAt || raw?.created_at || new Date().toISOString(),
    readAt: raw?.readAt || raw?.read_at || null,
    deliveredVia: raw?.deliveredVia || raw?.deliveryChannel || undefined,
  };
}

function extractNotificationRows(payload: any): AuditEntry[] {
  const rows: any[] = Array.isArray(payload)
    ? payload
    : Array.isArray(payload?.data)
      ? payload.data
      : Array.isArray(payload?.notifications)
        ? payload.notifications
        : Array.isArray(payload?.data?.data)
          ? payload.data.data
          : [];

  return rows
    .map(normalizeAuditEntry)
    .filter((entry): entry is AuditEntry => Boolean(entry));
}

function csvEscape(value: unknown) {
  const text = String(value ?? "");
  return /[",\n\r]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

// ─── Sub-components ───────────────────────────────────────────────────────────
function TypeBadge({ type }: { type: NotificationType }) {
  const c = TYPE_CFG[type];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 whitespace-nowrap rounded-full border px-2 py-0.5 text-[10px] font-semibold",
        c.badgeClass,
      )}
    >
      <span className={cn("h-1 w-1 shrink-0 rounded-full", c.dotClass)} />
      {c.label}
    </span>
  );
}

function ReadBadge({ read }: { read: boolean }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-semibold",
        read
          ? "border-emerald-200 bg-emerald-50 text-emerald-700"
          : "border-red-200 bg-red-50 text-red-700",
      )}
    >
      {read ? (
        <Check className="h-3 w-3" aria-hidden="true" />
      ) : (
        <span className="h-1 w-1 rounded-full bg-red-500" />
      )}
      {read ? "Read" : "Unread"}
    </span>
  );
}

function AgentChip({ agent }: { agent: { id: number; name?: string; role?: string } | null }) {
  if (!agent) return (
    <span style={{
      fontSize: 10, color: "#9CA3AF",
      background: "#F9FAFB", padding: "2px 7px", borderRadius: 999,
      border: "1px solid #E5E7EB", display: "inline-block",
    }}>
      Broadcast
    </span>
  );
  const [bg, fg] = agentColors(agent.id);
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
      <span style={{
        width: 22, height: 22, borderRadius: "50%",
        background: bg, color: fg,
        fontSize: 8, fontWeight: 700,
        display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
        border: `1px solid ${fg}33`,
      }}>
        {initials(agent.name)}
      </span>
      <span>
        <span style={{ fontSize: 12, color: "#111827", fontWeight: 500, display: "block", lineHeight: 1.2 }}>{agent.name || `Agent #${agent.id}`}</span>
        {agent.role && <span style={{ fontSize: 9, color: "#9CA3AF", display: "block" }}>{agent.role}</span>}
      </span>
    </span>
  );
}

function ResourceLinks({ callId, ticketId }: { callId: number | null; ticketId: number | null }) {
  if (!callId && !ticketId) return <span style={{ color: "#D1D5DB", fontSize: 12 }}>—</span>;
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 3 }} onClick={(e) => e.stopPropagation()}>
      {callId && (
        <a href={`/calls/${callId}`} style={{
          fontSize: 11, color: "#1D4ED8", textDecoration: "none",
          display: "inline-flex", alignItems: "center", gap: 3, fontWeight: 500,
          padding: "1px 5px", borderRadius: 5, background: "#EFF6FF", border: "1px solid #BFDBFE",
          width: "fit-content",
        }}>
          <Phone className="h-3 w-3" aria-hidden="true" />
          Call #{callId}
        </a>
      )}
      {ticketId && (
        <a href={`/tickets/${ticketId}`} style={{
          fontSize: 11, color: "#065F46", textDecoration: "none",
          display: "inline-flex", alignItems: "center", gap: 3, fontWeight: 500,
          padding: "1px 5px", borderRadius: 5, background: "#ECFDF5", border: "1px solid #A7F3D0",
          width: "fit-content",
        }}>
          <FileText className="h-3 w-3" aria-hidden="true" />
          Ticket #{ticketId}
        </a>
      )}
    </div>
  );
}

function StatCard({
  label,
  value,
  sub,
  icon,
  tone = "neutral",
  active = false,
  onClick,
}: {
  label: string;
  value: number | string;
  sub?: string;
  icon: React.ReactNode;
  tone?: "neutral" | "danger" | "warning" | "success" | "brand" | "info";
  active?: boolean;
  onClick?: () => void;
}) {
  const toneClass =
    tone === "brand"
      ? "border-emerald-100 bg-[#f0faf5] text-[#008f68]"
      : tone === "danger"
        ? "border-red-100 bg-red-50/70 text-red-700"
        : tone === "warning"
          ? "border-amber-100 bg-amber-50/70 text-amber-700"
          : tone === "success"
            ? "border-emerald-100 bg-emerald-50/70 text-emerald-700"
            : tone === "info"
              ? "border-sky-100 bg-sky-50/70 text-sky-700"
              : "border-slate-100 bg-white text-slate-900";

  const className = cn(
    "flex min-w-0 items-start justify-between rounded-xl border px-3 py-2.5 text-left shadow-[0_1px_2px_rgba(15,23,42,0.04)] transition-colors dark:border-slate-800 dark:bg-slate-950",
    toneClass,
    onClick &&
      "cursor-pointer hover:border-[#008f68]/35 hover:bg-[#fbfefd] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#008f68]/25",
    active && "border-[#008f68]/45 bg-[#f0faf5] ring-1 ring-[#008f68]/15",
  );

  const content = (
    <>
      <div className="min-w-0">
        <div className="mb-1 truncate text-[9px] font-semibold uppercase tracking-wide text-slate-500">
          {label}
        </div>
        <div className="text-xl font-bold leading-none tabular-nums">
          {value}
        </div>
        {sub && <div className="mt-1 truncate text-[10px] font-medium text-slate-500">{sub}</div>}
      </div>
      <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-white/70 bg-white/70 text-current shadow-sm dark:border-slate-800 dark:bg-slate-900">
        {icon}
      </div>
    </>
  );

  if (onClick) {
    return (
      <button type="button" className={className} onClick={onClick} aria-pressed={active}>
        {content}
      </button>
    );
  }

  return <div className={className}>{content}</div>;
}

function FilterField({
  label,
  children,
  className,
}: {
  label: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <label className={cn("min-w-0 space-y-1", className)}>
      <span className="block text-[10px] font-semibold uppercase tracking-wider text-slate-400">
        {label}
      </span>
      {children}
    </label>
  );
}

function ExpandedDetail({ n }: { n: AuditEntry }) {
  const latency = readLatency(n.createdAt, n.readAt);
  return (
    <div style={{
      margin: "0 0 2px 0",
      background: "linear-gradient(135deg, #F8FBF9 0%, #F0F9FF 100%)",
      border: "1px solid #E5E7EB",
      borderRadius: 10,
      padding: "10px 14px",
      display: "grid",
      gridTemplateColumns: "repeat(5, 1fr)",
      gap: 12,
    }}>
      <div style={{ gridColumn: "1 / 3" }}>
        <div style={{ fontSize: 9, fontWeight: 700, color: "#9CA3AF", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 3 }}>Full message</div>
        <div style={{ fontSize: 12, color: "#1F2937", lineHeight: 1.4 }}>{n.message}</div>
      </div>
      <div>
        <div style={{ fontSize: 9, fontWeight: 700, color: "#9CA3AF", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 3 }}>Created at</div>
        <div style={{ fontSize: 11, color: "#374151" }}>{fmtDateFull(n.createdAt)}</div>
        <div style={{ fontSize: 10, color: "#9CA3AF", marginTop: 2 }}>{timeAgo(n.createdAt)}</div>
      </div>
      <div>
        <div style={{ fontSize: 9, fontWeight: 700, color: "#9CA3AF", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 3 }}>Read at</div>
        {n.readAt ? (
          <>
            <div style={{ fontSize: 11, color: "#374151" }}>{fmtDateFull(n.readAt)}</div>
            {latency && <div style={{ fontSize: 10, color: "#10B981", marginTop: 2 }}>⚡ {latency} to read</div>}
          </>
        ) : (
          <div style={{ fontSize: 11, color: "#EF4444", fontStyle: "italic" }}>Not yet read</div>
        )}
      </div>
    </div>
  );
}

// ─── Timeline view ────────────────────────────────────────────────────────────
function TimelineView({ entries }: { entries: AuditEntry[] }) {
  const grouped = groupByDay(entries);
  const days = Object.keys(grouped);
  return (
    <div style={{ padding: "2px 0" }}>
      {days.map(day => (
        <div key={day} style={{ marginBottom: 20 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
            <div style={{
              fontSize: 10, fontWeight: 700, color: "#6B7280",
              letterSpacing: "0.07em", textTransform: "uppercase",
              background: "#F9FAFB", border: "1px solid #E5E7EB",
              padding: "2px 8px", borderRadius: 999,
            }}>{day}</div>
            <div style={{ flex: 1, height: 1, background: "#F3F4F6" }} />
            <div style={{ fontSize: 10, color: "#9CA3AF" }}>{grouped[day].length} event{grouped[day].length !== 1 ? "s" : ""}</div>
          </div>
          <div style={{ position: "relative", paddingLeft: 24 }}>
            <div style={{
              position: "absolute", left: 6, top: 0, bottom: 0,
              width: 1, background: "#E5E7EB", borderRadius: 1,
            }} />
            {grouped[day].map((n, idx) => {
              const c = TYPE_CFG[n.type];
              return (
                <div key={n.id} style={{
                  position: "relative", marginBottom: idx === grouped[day].length - 1 ? 0 : 8,
                  background: n.read ? "white" : "#FFFBEB",
                  border: `1px solid ${n.read ? "#F3F4F6" : "#FDE68A"}`,
                  borderRadius: 10, padding: "8px 12px",
                  display: "flex", gap: 10, alignItems: "flex-start",
                  transition: "border-color 0.15s, box-shadow 0.15s",
                }}
                  onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.borderColor = "#E5E7EB"; (e.currentTarget as HTMLDivElement).style.boxShadow = "0 1px 4px rgba(0,0,0,0.05)"; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.borderColor = n.read ? "#F3F4F6" : "#FDE68A"; (e.currentTarget as HTMLDivElement).style.boxShadow = "none"; }}
                >
                  <div style={{
                    position: "absolute", left: -20, top: 11,
                    width: 10, height: 10, borderRadius: "50%",
                    background: c.bg, border: `2px solid ${c.dot}`,
                    zIndex: 1,
                  }} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 8 }}>
                      <div>
                        <TypeBadge type={n.type} />
                        <div style={{
                          fontSize: 12, color: n.read ? "#6B7280" : "#111827", marginTop: 4,
                          fontWeight: n.read ? 400 : 600,
                          lineHeight: 1.4
                        }}>{n.message}</div>
                      </div>
                      <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 3, flexShrink: 0 }}>
                        <ReadBadge read={n.read} />
                        <span style={{ fontSize: 10, color: "#9CA3AF", fontFamily: "monospace" }}>
                          {new Date(n.createdAt).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}
                        </span>
                      </div>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 6, flexWrap: "wrap" }}>
                      <AgentChip agent={n.agent} />
                      <ResourceLinks callId={n.callId} ticketId={n.ticketId} />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────
export default function NotificationsAuditPage() {
  const [allData, setAllData] = useState<AuditEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const PAGE_SIZE = 10;
  const [page, setPage] = useState(1);
  const [sortField, setSortField] = useState<SortField>("createdAt");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [viewMode, setViewMode] = useState<ViewMode>("table");
  const [expandedRows, setExpandedRows] = useState<Set<number>>(new Set());
  const [animIn, setAnimIn] = useState(false);
  const [activeTab, setActiveTab] = useState<"all" | "unread" | "overdue">("all");
  const [filters, setFilters] = useState({
    type: "" as NotificationType | "",
    agentId: "",
    read: "",
    from: "",
    to: "",
    search: "",
  });
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  useEffect(() => { setTimeout(() => setAnimIn(true), 50); }, []);

  const loadNotifications = useCallback(async (showRefresh = false) => {
    if (showRefresh) setIsRefreshing(true);
    else setIsLoading(true);
    setLoadError(null);

    try {
      const response = await fetch(
        `/api/notifications?audit=true&includeTotal=true&limit=${AUDIT_FETCH_LIMIT}`,
        { cache: "no-store" },
      );
      const payload = await response.json().catch(() => null);

      if (!response.ok || payload?.success === false) {
        throw new Error(
          payload?.message || `Failed to load notifications (${response.status})`,
        );
      }

      setAllData(extractNotificationRows(payload));
      setPage(1);
    } catch (error: any) {
      setLoadError(error?.message || "Failed to load notifications");
      setAllData([]);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadNotifications();
  }, [loadNotifications]);

  // ── Derived stats ────────────────────────────────────────────────────────────
  const stats = useMemo(() => {
    const total = allData.length;
    const unread = allData.filter(n => !n.read).length;
    const overdue = allData.filter(n => n.type.includes("OVERDUE")).length;
    const read = allData.filter(n => n.read).length;
    const broadcast = allData.filter(n => !n.agentId).length;
    const calls = allData.filter(n => n.callId).length;
    const tickets = allData.filter(n => n.ticketId).length;
    const schedules = allData.filter(n => n.scheduleCallId).length;
    const todayKey = new Date().toDateString();
    const today = allData.filter(n => new Date(n.createdAt).toDateString() === todayKey).length;
    const latencyValues = allData
      .map(n => readLatencyMinutes(n.createdAt, n.readAt))
      .filter((value): value is number => value !== null);
    const avgReadMinutes =
      latencyValues.length > 0
        ? Math.round(latencyValues.reduce((sum, value) => sum + value, 0) / latencyValues.length)
        : null;
    return { total, unread, overdue, read, broadcast, calls, tickets, schedules, today, avgReadMinutes };
  }, [allData]);

  const agentOptions = useMemo(() => {
    const byId = new Map<string, string>();
    let hasBroadcast = false;
    for (const notification of allData) {
      if (!notification.agentId) {
        hasBroadcast = true;
        continue;
      }
      byId.set(
        String(notification.agentId),
        notification.agent?.name || notification.agent?.email || `Agent #${notification.agentId}`,
      );
    }
    return [
      { value: "", label: "All agents" },
      ...(hasBroadcast ? [{ value: "broadcast", label: "Broadcast" }] : []),
      ...Array.from(byId.entries())
        .sort((a, b) => a[1].localeCompare(b[1]))
        .map(([value, label]) => ({ value, label })),
    ];
  }, [allData]);

  // ── Filter + sort ─────────────────────────────────────────────────────────────
  const filtered = useMemo(() => {
    let arr = [...allData];
    if (activeTab === "unread") arr = arr.filter(n => !n.read);
    if (activeTab === "overdue") arr = arr.filter(n => n.type.includes("OVERDUE"));
    if (filters.type) arr = arr.filter(n => n.type === filters.type);
    if (filters.agentId === "broadcast") arr = arr.filter(n => !n.agentId);
    else if (filters.agentId) arr = arr.filter(n => String(n.agentId) === filters.agentId);
    if (filters.read !== "") arr = arr.filter(n => String(n.read) === filters.read);
    if (filters.from) arr = arr.filter(n => new Date(n.createdAt) >= new Date(filters.from));
    if (filters.to) arr = arr.filter(n => new Date(n.createdAt) <= new Date(filters.to + "T23:59:59Z"));
    if (filters.search) {
      const q = filters.search.toLowerCase();
      arr = arr.filter(n =>
        n.message.toLowerCase().includes(q) ||
        String(n.id).includes(q) ||
        (n.agent?.name?.toLowerCase().includes(q)) ||
        (n.agent?.email?.toLowerCase().includes(q)) ||
        (n.callId && String(n.callId).includes(q)) ||
        (n.ticketId && String(n.ticketId).includes(q)) ||
        (n.scheduleCallId && String(n.scheduleCallId).includes(q))
      );
    }
    arr.sort((a, b) => {
      let av: any = a[sortField], bv: any = b[sortField];
      if (sortField === "createdAt") { av = new Date(av).getTime(); bv = new Date(bv).getTime(); }
      if (av === null || av === undefined) av = sortDir === "asc" ? Infinity : -Infinity;
      if (bv === null || bv === undefined) bv = sortDir === "asc" ? Infinity : -Infinity;
      return sortDir === "asc" ? (av > bv ? 1 : -1) : (av < bv ? 1 : -1);
    });
    return arr;
  }, [filters, sortField, sortDir, activeTab, allData]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const slice = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const setFilter = useCallback((key: string, val: string) => {
    setFilters(prev => ({ ...prev, [key]: val }));
    setPage(1);
  }, []);

  const handleSearch = (val: string) => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => setFilter("search", val), 280);
  };

  const clearFilters = () => {
    setFilters({ type: "", agentId: "", read: "", from: "", to: "", search: "" });
    setPage(1);
    if (searchRef.current) searchRef.current.value = "";
  };

  const toggleSort = (field: SortField) => {
    if (sortField === field) setSortDir(d => d === "asc" ? "desc" : "asc");
    else { setSortField(field); setSortDir("desc"); }
  };

  const toggleExpand = (id: number) => {
    setExpandedRows(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const handleRowClick = async (n: AuditEntry) => {
    if (!n.read) {
      setAllData(prev => prev.map(item => item.id === n.id ? { ...item, read: true, readAt: new Date().toISOString() } : item));
      try {
        const response = await fetch(`/api/notifications/${n.id}/read`, {
          method: "PATCH",
        });
        if (!response.ok) {
          throw new Error("Failed to mark notification read");
        }
      } catch {
        setAllData(prev => prev.map(item => item.id === n.id ? { ...item, read: false, readAt: null } : item));
      }
    }
    toggleExpand(n.id);
  };

  const exportCsv = () => {
    const headers = [
      "id",
      "type",
      "message",
      "agentId",
      "agentName",
      "callId",
      "ticketId",
      "scheduleCallId",
      "read",
      "createdAt",
      "readAt",
    ];
    const rows = filtered.map((n) => [
      n.id,
      n.type,
      n.message,
      n.agentId ?? "",
      n.agent?.name ?? "Broadcast",
      n.callId ?? "",
      n.ticketId ?? "",
      n.scheduleCallId ?? "",
      n.read,
      n.createdAt,
      n.readAt ?? "",
    ]);
    const csv = [headers, ...rows]
      .map((row) => row.map(csvEscape).join(","))
      .join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `notifications-audit-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const hasFilters = Object.values(filters).some(v => v !== "");

  const SortIcon = ({ field }: { field: SortField }) => (
    <span className={cn("ml-1 inline-flex align-middle", sortField === field ? "opacity-100" : "opacity-30")}>
      {sortField === field ? (
        sortDir === "asc" ? (
          <ArrowUp className="h-3 w-3" aria-hidden="true" />
        ) : (
          <ArrowDown className="h-3 w-3" aria-hidden="true" />
        )
      ) : (
        <ArrowUpDown className="h-3 w-3" aria-hidden="true" />
      )}
    </span>
  );

  const thStyle = (field?: SortField): React.CSSProperties => ({
    padding: "8px 12px",
    fontSize: 10, fontWeight: 700,
    color: field && sortField === field ? "#111827" : "#6B7280",
    letterSpacing: "0.06em", textTransform: "uppercase",
    textAlign: "left", borderBottom: "1px solid #F3F4F6",
    background: "#FAFAFA",
    whiteSpace: "nowrap",
    cursor: field ? "pointer" : "default",
    userSelect: "none",
    transition: "color 0.15s",
  });

  // ─── Render ──────────────────────────────────────────────────────────────────
  return (
    <div
      className="min-h-dvh max-w-full overflow-x-hidden bg-[#f4f5f7] px-3 pb-8 pt-2 font-sans transition-[opacity,transform] duration-300 sm:px-4 lg:px-5 dark:bg-slate-950"
      style={{
        opacity: animIn ? 1 : 0,
        transform: animIn ? "none" : "translateY(4px)",
      }}
    >
      <style>{`
        .notif-audit * { box-sizing: border-box; }
        .fi { height: 36px; border: 1px solid transparent; border-radius: 8px; padding: 0 10px; font-size: 12px; font-weight: 500; background: #f8fafc; color: #0f172a; outline: none; width: 100%; transition: border-color .15s, box-shadow .15s, background .15s; }
        .fi:focus { border-color: #008f68; background: white; box-shadow: 0 0 0 2px rgba(0,143,104,0.20); }
        .fi:hover { border-color: #cbd5e1; }
        .tab { padding: 6px 12px; font-size: 12px; font-weight: 500; border-radius: 6px; border: none; cursor: pointer; transition: color .15s, background .15s, box-shadow .15s; background: transparent; color: #64748b; }
        .tab:hover { color: #1e293b; }
        .tab.active { background: white; color: #008f68; box-shadow: 0 1px 2px rgba(15,23,42,0.08); font-weight: 600; }
        .view-btn { width: 32px; height: 32px; border-radius: 8px; cursor: pointer; display: flex; align-items: center; justify-content: center; color: #64748b; transition: color .15s, background .15s, box-shadow .15s; }
        .view-btn.active { background: white; color: #008f68; box-shadow: 0 1px 2px rgba(15,23,42,0.08); }
        .view-btn:hover:not(.active) { background: rgba(255,255,255,.55); color: #1e293b; }
        .page-btn { min-width: 30px; height: 30px; padding: 0 8px; border: 1px solid rgb(226 232 240 / .8); border-radius: 8px; background: white; font-size: 12px; font-family: inherit; font-weight: 500; cursor: pointer; color: #475569; display: flex; align-items: center; justify-content: center; transition: all .15s; }
        .page-btn:hover:not(:disabled) { background: #f8fafc; border-color: #cbd5e1; color: #0f172a; }
        .page-btn:disabled { opacity: 0.35; cursor: default; }
        .page-btn.active { background: #f0faf5; color: #008f68; border-color: rgba(0,143,104,.25); font-weight: 700; }
        .export-btn { height: 36px; padding: 0 12px; border-radius: 8px; border: 1px solid rgb(226 232 240 / .8); background: white; font-size: 11px; font-family: inherit; font-weight: 700; color: #475569; cursor: pointer; display: flex; align-items: center; gap: 6px; transition: all .15s; white-space: nowrap; text-transform: uppercase; letter-spacing: .04em; }
        .export-btn:hover { background: #f8fafc; border-color: #cbd5e1; color: #0f172a; }
        .clear-btn { height: 36px; padding: 0 12px; border-radius: 8px; border: 1px solid #fecaca; background: #fef2f2; font-size: 12px; font-family: inherit; font-weight: 600; color: #991b1b; cursor: pointer; display: flex; align-items: center; gap: 5px; transition: all .15s; white-space: nowrap; }
        .clear-btn:hover { background: #fee2e2; }
        .section-card { background: white; border: 1px solid rgb(226 232 240 / .8); border-radius: 16px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.06); }
        .audit-th { padding: 9px 12px; border-bottom: 1px solid #e2e8f0; background: #f8fafc; font-size: 10px; font-weight: 700; color: #64748b; letter-spacing: .06em; text-transform: uppercase; white-space: nowrap; user-select: none; }
        .audit-td { padding: 9px 12px; border-bottom: 1px solid #f1f5f9; vertical-align: middle; }
        .row:hover td { background: #f8fafc !important; }
        td { transition: background .12s; }
        .dark .fi { background: rgb(15 23 42 / .8); color: #e2e8f0; }
        .dark .fi:focus { background: #020617; }
        .dark .section-card { background: #020617; border-color: #1e293b; }
      `}</style>

      {/* ── Page header ── */}
      <div className={cn(appPanelClass, "mb-2 flex flex-col gap-2 px-3.5 py-2 lg:flex-row lg:items-center lg:justify-between")}>
        <div className="flex min-w-0 items-center gap-3">
          <span className="h-7 w-0.5 shrink-0 rounded-full bg-[#008f68]" />
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#f0faf5] text-[#008f68] ring-1 ring-[#008f68]/15">
            <Bell className="h-4 w-4" aria-hidden="true" />
          </div>
          <div className="min-w-0">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-400">Audit · Notifications</p>
            <h1 className="text-[14px] font-bold leading-tight tracking-[-0.02em] text-slate-900">Notification delivery log</h1>
            <p className="mt-0.5 text-[11px] font-medium text-slate-500">
              Latest {allData.length.toLocaleString()} loaded · {filtered.length.toLocaleString()} visible
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          <div className="flex gap-0.5 rounded-lg border border-slate-200/80 bg-slate-100 p-0.5">
            <button className={`view-btn ${viewMode === "table" ? "active" : ""}`} onClick={() => setViewMode("table")} title="Table view">
              <Table2 className="h-3.5 w-3.5" aria-hidden="true" />
            </button>
            <button className={`view-btn ${viewMode === "timeline" ? "active" : ""}`} onClick={() => setViewMode("timeline")} title="Timeline view">
              <List className="h-3.5 w-3.5" aria-hidden="true" />
            </button>
          </div>
          <button className="export-btn" onClick={exportCsv} disabled={filtered.length === 0}>
            <ArrowDownToLine className="h-3.5 w-3.5" aria-hidden="true" />
            Export CSV
          </button>
        </div>
      </div>

      {loadError && (
        <div className="mb-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs font-medium text-red-700">
          {loadError}
        </div>
      )}

      <NotificationsStatsGrid
        stats={stats}
        activeTab={activeTab}
        filters={filters}
        formatDuration={fmtCompactDuration}
        onTabChange={(tab) => {
          setActiveTab(tab);
          setPage(1);
        }}
        onFilterChange={setFilter}
      />

      <NotificationsFilters
        activeTab={activeTab}
        filters={filters}
        stats={stats}
        hasFilters={hasFilters}
        agentOptions={agentOptions}
        searchRef={searchRef}
        onTabChange={(tab: NotificationTab) => {
          setActiveTab(tab);
          setPage(1);
        }}
        onFilterChange={setFilter}
        onSearchChange={handleSearch}
        onClearFilters={clearFilters}
      />

      {/* ── Table / Timeline ── */}
      <div className="section-card">
        <div className="flex flex-col gap-1 border-b border-slate-100 px-3.5 py-2 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2">
            <span className="text-[12px] font-semibold text-slate-900">
              {viewMode === "table" ? "Notification log" : "Timeline view"}
            </span>
            <span className="rounded-full bg-slate-100 px-2 py-0.5 font-mono text-[10px] font-semibold text-slate-500">
              {filtered.length} result{filtered.length !== 1 ? "s" : ""}
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-1.5 text-[10px] font-semibold text-slate-400">
            <span className="inline-flex items-center gap-1 rounded-full bg-red-50 px-2 py-0.5 text-red-700">
              <span className="h-1.5 w-1.5 rounded-full bg-red-500" />
              {stats.unread} unread
            </span>
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-emerald-700">
              <Users className="h-3 w-3" aria-hidden="true" />
              {stats.broadcast} broadcast
            </span>
          </div>
        </div>

        {viewMode === "timeline" ? (
          <div style={{ padding: "14px 18px" }}>
            {isLoading ? (
              <div style={{ padding: "40px 20px", textAlign: "center", color: "#9CA3AF" }}>
                <RefreshCw className="mx-auto mb-2 h-7 w-7 animate-spin text-slate-300" aria-hidden="true" />
                <div style={{ fontSize: 13, fontWeight: 500, color: "#374151" }}>Loading notifications</div>
              </div>
            ) : slice.length === 0 ? (
              <div style={{ padding: "40px 20px", textAlign: "center", color: "#9CA3AF" }}>
                <Search className="mx-auto mb-2 h-7 w-7 text-slate-300" aria-hidden="true" />
                <div style={{ fontSize: 13, fontWeight: 500, color: "#374151" }}>No notifications found</div>
                <div style={{ fontSize: 11, marginTop: 2 }}>Try adjusting your filters</div>
              </div>
            ) : (
              <TimelineView entries={slice} />
            )}
          </div>
        ) : (
          <div className="scrollbar-app overflow-x-auto">
            <table className="w-full border-collapse" style={{ minWidth: 820 }}>
              <thead>
                <tr>
                  <th style={{ ...thStyle("id"), width: 50 }} onClick={() => toggleSort("id")}>
                    ID <SortIcon field="id" />
                  </th>
                  <th style={{ ...thStyle("type"), width: 140 }} onClick={() => toggleSort("type")}>
                    Type <SortIcon field="type" />
                  </th>
                  <th style={{ ...thStyle(), minWidth: 200 }}>Message</th>
                  <th style={{ ...thStyle("agentId"), width: 140 }} onClick={() => toggleSort("agentId")}>
                    Recipient <SortIcon field="agentId" />
                  </th>
                  <th style={{ ...thStyle(), width: 90 }}>Resource</th>
                  <th style={{ ...thStyle("read"), width: 75 }} onClick={() => toggleSort("read")}>
                    Status <SortIcon field="read" />
                  </th>
                  <th style={{ ...thStyle("createdAt"), width: 120, textAlign: "right" as const }} onClick={() => toggleSort("createdAt")}>
                    Date <SortIcon field="createdAt" />
                  </th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr>
                    <td colSpan={7} style={{ padding: "40px 20px", textAlign: "center", color: "#9CA3AF", border: "none" }}>
                      <RefreshCw className="mx-auto mb-2 h-7 w-7 animate-spin text-slate-300" aria-hidden="true" />
                      <div style={{ fontSize: 13, fontWeight: 600, color: "#374151" }}>Loading notifications</div>
                    </td>
                  </tr>
                ) : slice.length === 0 ? (
                  <tr>
                    <td colSpan={7} style={{ padding: "40px 20px", textAlign: "center", color: "#9CA3AF", border: "none" }}>
                      <Search className="mx-auto mb-2 h-7 w-7 text-slate-300" aria-hidden="true" />
                      <div style={{ fontSize: 13, fontWeight: 600, color: "#374151" }}>No notifications match</div>
                      <div style={{ fontSize: 11, marginTop: 2 }}>Try adjusting or clearing your filters</div>
                    </td>
                  </tr>
                ) : slice.map(n => {
                  const isExp = expandedRows.has(n.id);
                  return [
                    <tr key={n.id}
                      onClick={() => handleRowClick(n)}
                      style={{
                        cursor: "pointer",
                        background: n.read ? "white" : "#FFFBEB",
                        transition: "background 0.15s",
                      }}
                      className="row"
                    >
                      <td style={{ padding: "8px 12px", borderBottom: isExp ? "none" : "1px solid #F3F4F6" }}>
                        <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: "#9CA3AF" }}>#{n.id}</span>
                      </td>
                      <td style={{ padding: "8px 12px", borderBottom: isExp ? "none" : "1px solid #F3F4F6" }}>
                        <TypeBadge type={n.type} />
                      </td>
                      <td style={{
                        padding: "8px 12px", borderBottom: isExp ? "none" : "1px solid #F3F4F6",
                        maxWidth: 200, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                      }}>
                        <span style={{
                          fontSize: 12,
                          color: n.read ? "#6B7280" : "#111827",
                          fontWeight: n.read ? 400 : 600,
                        }} title={n.message}>
                          {n.message}
                        </span>
                      </td>
                      <td style={{ padding: "8px 12px", borderBottom: isExp ? "none" : "1px solid #F3F4F6" }}>
                        <AgentChip agent={n.agent} />
                      </td>
                      <td style={{ padding: "8px 12px", borderBottom: isExp ? "none" : "1px solid #F3F4F6" }}>
                        <ResourceLinks callId={n.callId} ticketId={n.ticketId} />
                      </td>
                      <td style={{ padding: "8px 12px", borderBottom: isExp ? "none" : "1px solid #F3F4F6" }}>
                        <ReadBadge read={n.read} />
                      </td>
                      <td style={{
                        padding: "8px 12px", borderBottom: isExp ? "none" : "1px solid #F3F4F6",
                        textAlign: "right",
                      }}>
                        <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 1 }}>
                          <span style={{ fontSize: 11, color: "#374151", fontFamily: "'DM Mono', monospace", whiteSpace: "nowrap" }}>
                            {fmtDateShort(n.createdAt)}
                          </span>
                          <span style={{ fontSize: 9, color: "#9CA3AF" }}>{timeAgo(n.createdAt)}</span>
                        </div>
                      </td>
                    </tr>,
                    isExp && (
                      <tr key={`exp-${n.id}`}>
                        <td colSpan={7} style={{ padding: "0 12px 8px 12px", borderBottom: "1px solid #F3F4F6" }}>
                          <ExpandedDetail n={n} />
                        </td>
                      </tr>
                    ),
                  ];
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Paginación más compacta */}
        {totalPages > 1 && (
          <div className="flex flex-col gap-2 border-t border-slate-100 px-3 py-2 sm:flex-row sm:items-center sm:justify-between">
            <span style={{ fontSize: 11, color: "#9CA3AF" }}>
              <strong style={{ color: "#374151" }}>{(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, filtered.length)}</strong> of <strong style={{ color: "#374151" }}>{filtered.length}</strong>
            </span>
            <div className="flex min-w-0 items-center gap-1 overflow-x-auto">
              <button className="page-btn" disabled={page === 1} onClick={() => setPage(1)} aria-label="First page">
                <ChevronsLeft className="h-3.5 w-3.5" aria-hidden="true" />
              </button>
              <button className="page-btn" disabled={page === 1} onClick={() => setPage(p => p - 1)} aria-label="Previous page">
                <ChevronLeft className="h-3.5 w-3.5" aria-hidden="true" />
              </button>
              {getPaginationPageItems(page, totalPages).map((item, i) =>
                item === "ellipsis" ? (
                  <span key={`e${i}`} style={{ width: 28, textAlign: "center", color: "#9CA3AF", fontSize: 12 }}>...</span>
                ) : (
                  <button key={item} className={`page-btn ${page === item ? "active" : ""}`} onClick={() => setPage(item)} style={{ minWidth: 28, height: 28 }}>{item}</button>
                ),
              )}
              <button className="page-btn" disabled={page === totalPages} onClick={() => setPage(p => p + 1)} aria-label="Next page">
                <ChevronRight className="h-3.5 w-3.5" aria-hidden="true" />
              </button>
              <button className="page-btn" disabled={page === totalPages} onClick={() => setPage(totalPages)} aria-label="Last page">
                <ChevronsRight className="h-3.5 w-3.5" aria-hidden="true" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
