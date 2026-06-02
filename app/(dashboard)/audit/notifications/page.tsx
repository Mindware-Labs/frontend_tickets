"use client";

import { useEffect, useState, useCallback, useRef, useMemo } from "react";
import {
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
  Loader2,
  Phone,
  Radio,
  RefreshCw,
  Search,
  Table2,
  Users,
} from "lucide-react";
import { EntityLoadingSpinner, TableLoadingRow } from "@/components/shared/entity-loading-state";
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
type ExcelJsModule = typeof import("exceljs");

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

async function exportNotificationsWorkbook({
  entries,
  filename,
}: {
  entries: AuditEntry[];
  filename: string;
}) {
  const ExcelJS: ExcelJsModule = await import("exceljs");
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "Frontend Tickets";
  workbook.created = new Date();

  const stats = buildNotificationExportStats(entries);
  const summary = workbook.addWorksheet("Summary", {
    views: [{ state: "frozen", ySplit: 9 }],
  });
  summary.columns = [
    { key: "label", width: 28 },
    { key: "value", width: 38 },
    { key: "count", width: 12 },
    { key: "unread", width: 12 },
    { key: "read", width: 12 },
    { key: "avgRead", width: 16 },
  ];
  summary.addRows([
    ["Report", "Notifications audit export"],
    ["Exported at", fmtDateFull(new Date().toISOString())],
    ["Notifications", stats.total],
    ["Unread / Read", `${stats.unread} / ${stats.read}`],
    ["Broadcast", stats.broadcast],
    ["Average read latency", fmtCompactDuration(stats.averageReadLatency)],
    [],
    ["Type", "Label", "Count", "Unread", "Read", "Avg read latency"],
  ]);
  stats.byType.forEach((row) => {
    summary.addRow([
      row.type,
      TYPE_CFG[row.type].label,
      row.total,
      row.unread,
      row.read,
      fmtCompactDuration(row.averageReadLatency),
    ]);
  });
  styleNotificationSummary(summary);
  styleNotificationTable(summary, 8);

  const detail = workbook.addWorksheet("Notifications", {
    views: [{ state: "frozen", ySplit: 1 }],
  });
  detail.columns = [
    { header: "ID", key: "id", width: 10 },
    { header: "Type", key: "type", width: 26 },
    { header: "Message", key: "message", width: 70 },
    { header: "Recipient", key: "recipient", width: 28 },
    { header: "Recipient ID", key: "agentId", width: 12 },
    { header: "Status", key: "status", width: 12 },
    { header: "Created at", key: "createdAt", width: 24 },
    { header: "Read at", key: "readAt", width: 24 },
    { header: "Read latency", key: "readLatency", width: 16 },
    { header: "Delivered via", key: "deliveredVia", width: 16 },
    { header: "Call ID", key: "callId", width: 12 },
    { header: "Ticket ID", key: "ticketId", width: 12 },
    { header: "Schedule call ID", key: "scheduleCallId", width: 16 },
  ];
  detail.addRows(entries.map(notificationToExportRow));
  styleNotificationTable(detail, 1);
  detail.autoFilter = {
    from: { row: 1, column: 1 },
    to: { row: Math.max(detail.rowCount, 1), column: detail.columnCount },
  };

  const buffer = await workbook.xlsx.writeBuffer();
  downloadBlob(
    new Blob([buffer], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    }),
    filename,
  );
}

function buildNotificationExportStats(entries: AuditEntry[]) {
  const total = entries.length;
  const unread = entries.filter((entry) => !entry.read).length;
  const read = total - unread;
  const broadcast = entries.filter((entry) => !entry.agentId).length;
  const averageReadLatency = averageLatency(entries);
  const byType = Array.from(NOTIFICATION_TYPES).map((type) => {
    const rows = entries.filter((entry) => entry.type === type);
    return {
      type,
      total: rows.length,
      unread: rows.filter((entry) => !entry.read).length,
      read: rows.filter((entry) => entry.read).length,
      averageReadLatency: averageLatency(rows),
    };
  });

  return { total, unread, read, broadcast, averageReadLatency, byType };
}

function averageLatency(entries: AuditEntry[]): number | null {
  const values = entries
    .map((entry) => readLatencyMinutes(entry.createdAt, entry.readAt))
    .filter((value): value is number => value !== null);
  if (values.length === 0) return null;
  return Math.round(values.reduce((sum, value) => sum + value, 0) / values.length);
}

function notificationToExportRow(entry: AuditEntry) {
  return {
    id: entry.id,
    type: TYPE_CFG[entry.type].label,
    message: entry.message,
    recipient: entry.agent?.name || entry.agent?.email || "Broadcast",
    agentId: entry.agentId ?? "",
    status: entry.read ? "Read" : "Unread",
    createdAt: fmtDateFull(entry.createdAt),
    readAt: entry.readAt ? fmtDateFull(entry.readAt) : "",
    readLatency: readLatency(entry.createdAt, entry.readAt) ?? "",
    deliveredVia: entry.deliveredVia ?? "",
    callId: entry.callId ?? "",
    ticketId: entry.ticketId ?? "",
    scheduleCallId: entry.scheduleCallId ?? "",
  };
}

function styleNotificationSummary(worksheet: import("exceljs").Worksheet) {
  worksheet.getCell("A1").font = { bold: true, color: { argb: "FFFFFFFF" } };
  worksheet.getCell("B1").font = { bold: true, color: { argb: "FFFFFFFF" } };
  worksheet.getRow(1).fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FF008F68" },
  };
  for (let rowNumber = 2; rowNumber <= 6; rowNumber += 1) {
    worksheet.getCell(rowNumber, 1).font = { bold: true };
    worksheet.getCell(rowNumber, 1).fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FFF0FAF5" },
    };
  }
}

function styleNotificationTable(
  worksheet: import("exceljs").Worksheet,
  headerRow: number,
) {
  const header = worksheet.getRow(headerRow);
  header.font = { bold: true, color: { argb: "FFFFFFFF" } };
  header.fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FF008F68" },
  };
  header.alignment = { vertical: "middle", wrapText: true };

  worksheet.eachRow((row, rowNumber) => {
    row.alignment = { vertical: "top", wrapText: true };
    row.eachCell((cell) => {
      cell.border = {
        top: { style: "thin", color: { argb: "FFE2E8F0" } },
        left: { style: "thin", color: { argb: "FFE2E8F0" } },
        bottom: { style: "thin", color: { argb: "FFE2E8F0" } },
        right: { style: "thin", color: { argb: "FFE2E8F0" } },
      };
    });
    if (rowNumber > headerRow && rowNumber % 2 === 0) {
      row.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FFF8FAFC" },
      };
    }
  });
}

function dateStamp(): string {
  return new Date().toISOString().slice(0, 10);
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
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
  if (!agent)
    return (
      <span className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-[10px] font-semibold text-slate-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-400">
        <Radio className="size-2.5" aria-hidden="true" />
        Broadcast
      </span>
    );
  const [bg, fg] = agentColors(agent.id);
  return (
    <span className="inline-flex min-w-0 items-center gap-2">
      <span
        className="flex size-6 shrink-0 items-center justify-center rounded-full text-[9px] font-bold ring-1 ring-black/5"
        style={{ background: bg, color: fg }}
      >
        {initials(agent.name)}
      </span>
      <span className="min-w-0">
        <span className="block truncate text-xs font-medium leading-tight text-slate-800 dark:text-slate-200">
          {agent.name || `Agent #${agent.id}`}
        </span>
        {agent.role && (
          <span className="block text-[9px] uppercase tracking-wide text-slate-400">
            {agent.role}
          </span>
        )}
      </span>
    </span>
  );
}

function ResourceLinks({ callId, ticketId }: { callId: number | null; ticketId: number | null }) {
  if (!callId && !ticketId)
    return <span className="text-xs text-slate-300 dark:text-slate-600">—</span>;
  return (
    <div className="flex flex-col items-start gap-1" onClick={(e) => e.stopPropagation()}>
      {callId && (
        <a
          href={`/calls/${callId}`}
          className="inline-flex w-fit items-center gap-1 rounded-md border border-sky-200 bg-sky-50 px-1.5 py-0.5 text-[10.5px] font-semibold text-sky-700 transition-colors hover:bg-sky-100 dark:border-sky-500/30 dark:bg-sky-500/10 dark:text-sky-300"
        >
          <Phone className="h-3 w-3" aria-hidden="true" />
          Call #{callId}
        </a>
      )}
      {ticketId && (
        <a
          href={`/tickets/${ticketId}`}
          className="inline-flex w-fit items-center gap-1 rounded-md border border-emerald-200 bg-emerald-50 px-1.5 py-0.5 text-[10.5px] font-semibold text-[#006b4f] transition-colors hover:bg-emerald-100 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-300"
        >
          <FileText className="h-3 w-3" aria-hidden="true" />
          Ticket #{ticketId}
        </a>
      )}
    </div>
  );
}

// Delivery channel chip — surfaces how the notification reached the agent.
const DELIVERY_CFG: Record<
  string,
  { label: string; icon: typeof Radio; cls: string }
> = {
  websocket: {
    label: "Realtime",
    icon: Radio,
    cls: "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-300",
  },
  poll: {
    label: "Poll",
    icon: RefreshCw,
    cls: "border-sky-200 bg-sky-50 text-sky-700 dark:border-sky-500/30 dark:bg-sky-500/10 dark:text-sky-300",
  },
  push: {
    label: "Push",
    icon: Bell,
    cls: "border-violet-200 bg-violet-50 text-violet-700 dark:border-violet-500/30 dark:bg-violet-500/10 dark:text-violet-300",
  },
};

function DeliveryChip({ via }: { via?: "websocket" | "poll" | "push" }) {
  if (!via) return <span className="text-xs text-slate-300 dark:text-slate-600">—</span>;
  const cfg = DELIVERY_CFG[via] ?? {
    label: via,
    icon: Radio,
    cls: "border-slate-200 bg-slate-50 text-slate-600",
  };
  const Icon = cfg.icon;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-semibold capitalize",
        cfg.cls,
      )}
    >
      <Icon className="size-2.5" aria-hidden="true" />
      {cfg.label}
    </span>
  );
}

function DetailLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="mb-1 text-[9px] font-semibold uppercase tracking-widest text-slate-400">
      {children}
    </div>
  );
}

function ExpandedDetail({ n }: { n: AuditEntry }) {
  const latency = readLatency(n.createdAt, n.readAt);
  return (
    <div className="mb-1 grid grid-cols-2 gap-x-4 gap-y-3 rounded-xl border border-slate-200/80 bg-slate-50/60 p-3 dark:border-slate-800 dark:bg-slate-900/40 sm:grid-cols-4">
      <div className="col-span-2">
        <DetailLabel>Full message</DetailLabel>
        <p className="text-xs leading-relaxed text-slate-700 dark:text-slate-200">
          {n.message}
        </p>
      </div>
      <div>
        <DetailLabel>Created at</DetailLabel>
        <p className="text-[11px] text-slate-600 dark:text-slate-300">
          {fmtDateFull(n.createdAt)}
        </p>
        <p className="mt-0.5 text-[10px] text-slate-400">{timeAgo(n.createdAt)}</p>
      </div>
      <div>
        <DetailLabel>Read at</DetailLabel>
        {n.readAt ? (
          <>
            <p className="text-[11px] text-slate-600 dark:text-slate-300">
              {fmtDateFull(n.readAt)}
            </p>
            {latency && (
              <p className="mt-0.5 inline-flex items-center gap-1 text-[10px] font-semibold text-[#008f68] dark:text-emerald-400">
                <Clock3 className="size-2.5" aria-hidden="true" />
                {latency} to read
              </p>
            )}
          </>
        ) : (
          <p className="text-[11px] italic text-red-500">Not yet read</p>
        )}
      </div>
      <div>
        <DetailLabel>Delivered via</DetailLabel>
        <DeliveryChip via={n.deliveredVia} />
      </div>
      <div>
        <DetailLabel>Recipient</DetailLabel>
        <AgentChip agent={n.agent} />
      </div>
      {(n.callId || n.ticketId) && (
        <div className="col-span-2 sm:col-span-2">
          <DetailLabel>Linked resources</DetailLabel>
          <ResourceLinks callId={n.callId} ticketId={n.ticketId} />
        </div>
      )}
    </div>
  );
}

// ─── Timeline view ────────────────────────────────────────────────────────────
function TimelineView({ entries }: { entries: AuditEntry[] }) {
  const grouped = groupByDay(entries);
  const days = Object.keys(grouped);
  return (
    <div className="flex flex-col gap-5">
      {days.map((day) => (
        <div key={day}>
          <div className="mb-2.5 flex items-center gap-2">
            <span className="rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-widest text-slate-500 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400">
              {day}
            </span>
            <span
              aria-hidden
              className="h-px flex-1 bg-gradient-to-r from-slate-200 to-transparent dark:from-slate-800"
            />
            <span className="text-[10px] font-medium text-slate-400">
              {grouped[day].length} event{grouped[day].length !== 1 ? "s" : ""}
            </span>
          </div>
          <div className="relative flex flex-col gap-2 pl-6">
            <span
              aria-hidden
              className="absolute bottom-0 left-1.5 top-0 w-px bg-slate-200 dark:bg-slate-800"
            />
            {grouped[day].map((n) => {
              const c = TYPE_CFG[n.type];
              return (
                <div
                  key={n.id}
                  className={cn(
                    "group relative flex items-start gap-2.5 rounded-xl border px-3 py-2 transition-all hover:shadow-[0_1px_4px_rgba(15,23,42,0.06)]",
                    n.read
                      ? "border-slate-100 bg-white hover:border-slate-200 dark:border-slate-800 dark:bg-slate-950"
                      : "border-amber-200/70 bg-amber-50/50 hover:border-amber-300 dark:border-amber-900/40 dark:bg-amber-950/10",
                  )}
                >
                  <span
                    aria-hidden
                    className="absolute -left-[18px] top-3 size-2.5 rounded-full border-2"
                    style={{ background: c.bg, borderColor: c.dot }}
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <TypeBadge type={n.type} />
                        <p
                          className={cn(
                            "mt-1 text-xs leading-relaxed",
                            n.read
                              ? "font-normal text-slate-500 dark:text-slate-400"
                              : "font-semibold text-slate-900 dark:text-slate-100",
                          )}
                        >
                          {n.message}
                        </p>
                      </div>
                      <div className="flex shrink-0 flex-col items-end gap-1">
                        <ReadBadge read={n.read} />
                        <span className="font-mono text-[10px] text-slate-400">
                          {new Date(n.createdAt).toLocaleTimeString("en-US", {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                      </div>
                    </div>
                    <div className="mt-1.5 flex flex-wrap items-center gap-2">
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
  const [exportingExcel, setExportingExcel] = useState(false);
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
        { cache: "no-store", credentials: "include" },
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

  const exportWorkbook = async () => {
    if (filtered.length === 0) return;

    setExportingExcel(true);
    try {
      await exportNotificationsWorkbook({
        entries: filtered,
        filename: `notifications-audit-${dateStamp()}.xlsx`,
      });
    } catch (error: any) {
      setLoadError(error?.message || "Failed to export notifications workbook");
    } finally {
      setExportingExcel(false);
    }
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

  const auditTh = (field?: SortField, align: "left" | "right" = "left") =>
    cn(
      "whitespace-nowrap border-b border-slate-200 bg-slate-50/80 px-3 py-2 text-[10px] font-semibold uppercase tracking-wider transition-colors select-none dark:border-slate-800 dark:bg-slate-900/60",
      align === "right" ? "text-right" : "text-left",
      field
        ? sortField === field
          ? "cursor-pointer text-slate-700 dark:text-slate-200"
          : "cursor-pointer text-slate-400 hover:text-slate-600 dark:text-slate-500"
        : "text-slate-400 dark:text-slate-500",
    );

  const auditTd = (expanded: boolean) =>
    cn(
      "px-3 py-2 align-middle text-xs",
      !expanded && "border-b border-slate-100 dark:border-slate-800",
    );

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
          <button className="export-btn" onClick={exportWorkbook} disabled={filtered.length === 0 || exportingExcel}>
            {exportingExcel ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
            ) : (
              <ArrowDownToLine className="h-3.5 w-3.5" aria-hidden="true" />
            )}
            {exportingExcel ? "Exporting" : `Export XLSX (${filtered.length})`}
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
              <div className="flex items-center justify-center py-10 bg-gradient-to-b from-[#f0faf5]/50 via-white to-white dark:from-[#008f68]/5 dark:via-card dark:to-card rounded-xl">
                <EntityLoadingSpinner kind="notifications" size="sm" />
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
                  <th className={auditTh("id")} style={{ width: 50 }} onClick={() => toggleSort("id")}>
                    ID <SortIcon field="id" />
                  </th>
                  <th className={auditTh("type")} style={{ width: 140 }} onClick={() => toggleSort("type")}>
                    Type <SortIcon field="type" />
                  </th>
                  <th className={auditTh()} style={{ minWidth: 200 }}>Message</th>
                  <th className={auditTh("agentId")} style={{ width: 140 }} onClick={() => toggleSort("agentId")}>
                    Recipient <SortIcon field="agentId" />
                  </th>
                  <th className={auditTh()} style={{ width: 90 }}>Resource</th>
                  <th className={auditTh("read")} style={{ width: 75 }} onClick={() => toggleSort("read")}>
                    Status <SortIcon field="read" />
                  </th>
                  <th className={auditTh("createdAt", "right")} style={{ width: 120 }} onClick={() => toggleSort("createdAt")}>
                    Date <SortIcon field="createdAt" />
                  </th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <TableLoadingRow colSpan={7} kind="notifications" compact />
                ) : slice.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-5 py-12 text-center">
                      <Search className="mx-auto mb-2 h-7 w-7 text-slate-300 dark:text-slate-600" aria-hidden="true" />
                      <div className="text-[13px] font-semibold text-slate-700 dark:text-slate-200">No notifications match</div>
                      <div className="mt-0.5 text-[11px] text-slate-400">Try adjusting or clearing your filters</div>
                    </td>
                  </tr>
                ) : slice.map((n) => {
                  const isExp = expandedRows.has(n.id);
                  return [
                    <tr
                      key={n.id}
                      onClick={() => handleRowClick(n)}
                      className={cn(
                        "cursor-pointer transition-colors",
                        n.read
                          ? "bg-white hover:bg-[#f0faf5]/60 dark:bg-slate-950 dark:hover:bg-slate-900/60"
                          : "bg-amber-50/50 hover:bg-amber-50 dark:bg-amber-950/10 dark:hover:bg-amber-950/20",
                      )}
                    >
                      <td className={auditTd(isExp)}>
                        <span className="font-mono text-[10px] text-slate-400">#{n.id}</span>
                      </td>
                      <td className={auditTd(isExp)}>
                        <TypeBadge type={n.type} />
                      </td>
                      <td className={auditTd(isExp)} style={{ maxWidth: 260 }}>
                        <span
                          className={cn(
                            "block truncate",
                            n.read
                              ? "font-normal text-slate-500 dark:text-slate-400"
                              : "font-semibold text-slate-900 dark:text-slate-100",
                          )}
                          title={n.message}
                        >
                          {n.message}
                        </span>
                      </td>
                      <td className={auditTd(isExp)}>
                        <AgentChip agent={n.agent} />
                      </td>
                      <td className={auditTd(isExp)}>
                        <ResourceLinks callId={n.callId} ticketId={n.ticketId} />
                      </td>
                      <td className={auditTd(isExp)}>
                        <ReadBadge read={n.read} />
                      </td>
                      <td className={cn(auditTd(isExp), "text-right")}>
                        <div className="flex flex-col items-end gap-0.5">
                          <span className="whitespace-nowrap font-mono text-[11px] text-slate-600 dark:text-slate-300">
                            {fmtDateShort(n.createdAt)}
                          </span>
                          <span className="text-[9px] text-slate-400">{timeAgo(n.createdAt)}</span>
                        </div>
                      </td>
                    </tr>,
                    isExp && (
                      <tr key={`exp-${n.id}`} className={n.read ? "bg-white dark:bg-slate-950" : "bg-amber-50/50 dark:bg-amber-950/10"}>
                        <td colSpan={7} className="border-b border-slate-100 px-3 pb-2 dark:border-slate-800">
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
