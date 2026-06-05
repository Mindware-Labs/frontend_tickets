"use client";

import { useCallback, useEffect, useState } from "react";
import { Bell } from "lucide-react";
import { appPanelClass } from "@/components/layout/sidebar-theme";
import { cn } from "@/lib/utils";
import { NotificationsStatsGrid } from "./components/NotificationsStatsGrid";
import { NotificationsTable } from "./components/NotificationsTable";
import type {
  AuditEntry,
  NotificationStats,
  NotificationTab,
  NotificationType,
} from "./components/notification-types";

const PAGE_SIZE = 10;

const EMPTY_STATS: NotificationStats = {
  total: 0,
  unread: 0,
  overdue: 0,
  read: 0,
  broadcast: 0,
  calls: 0,
  tickets: 0,
  schedules: 0,
  today: 0,
  avgReadMinutes: null,
};

// ─── Helpers ──────────────────────────────────────────────────────────────────
function fmtCompactDuration(minutes: number | null) {
  if (minutes === null) return "—";
  if (minutes < 1) return "<1m";
  if (minutes < 60) return `${minutes}m`;
  return `${Math.floor(minutes / 60)}h ${minutes % 60}m`;
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
      id: Number.isFinite(id) ? id : (agentId ?? 0),
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

function normalizeStats(raw: any): NotificationStats {
  if (!raw || typeof raw !== "object") return EMPTY_STATS;
  const num = (value: unknown) => {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
  };
  const avg = raw.avgReadMinutes;
  return {
    total: num(raw.total),
    unread: num(raw.unread),
    overdue: num(raw.overdue),
    read: num(raw.read),
    broadcast: num(raw.broadcast),
    calls: num(raw.calls),
    tickets: num(raw.tickets),
    schedules: num(raw.schedules),
    today: num(raw.today),
    avgReadMinutes:
      avg === null || avg === undefined ? null : num(avg),
  };
}

// ─── Main page ────────────────────────────────────────────────────────────────
export default function NotificationsAuditPage() {
  const [rows, setRows] = useState<AuditEntry[]>([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState<NotificationStats>(EMPTY_STATS);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [animIn, setAnimIn] = useState(false);
  const [activeTab, setActiveTab] = useState<NotificationTab>("all");
  const [filters, setFilters] = useState({
    type: "" as NotificationType | "",
    agentId: "",
    read: "",
    from: "",
    to: "",
    search: "",
  });

  useEffect(() => {
    setTimeout(() => setAnimIn(true), 50);
  }, []);

  // Aggregate KPIs — computed server-side over the whole table, fetched once.
  const loadStats = useCallback(async () => {
    try {
      const response = await fetch(
        `/api/notifications?audit=true&stats=true&page=1&limit=1`,
        { cache: "no-store", credentials: "include" },
      );
      const payload = await response.json().catch(() => null);
      if (response.ok && payload?.stats) {
        setStats(normalizeStats(payload.stats));
      }
    } catch {
      // Stats are best-effort; the ledger below is the source of truth.
    }
  }, []);

  // One page of the ledger at a time — only `limit` rows leave the database.
  const loadPage = useCallback(async (targetPage: number) => {
    setIsLoading(true);
    setLoadError(null);

    try {
      const response = await fetch(
        `/api/notifications?audit=true&includeTotal=true&page=${targetPage}&limit=${PAGE_SIZE}`,
        { cache: "no-store", credentials: "include" },
      );
      const payload = await response.json().catch(() => null);

      if (!response.ok || payload?.success === false) {
        throw new Error(
          payload?.message ||
            `Failed to load notifications (${response.status})`,
        );
      }

      setRows(extractNotificationRows(payload));
      setTotal(Number(payload?.total) || 0);
      setTotalPages(Math.max(1, Number(payload?.totalPages) || 1));
    } catch (error: any) {
      setLoadError(error?.message || "Failed to load notifications");
      setRows([]);
      setTotal(0);
      setTotalPages(1);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadStats();
  }, [loadStats]);

  useEffect(() => {
    loadPage(page);
  }, [page, loadPage]);

  const setFilter = useCallback((key: string, val: string) => {
    setFilters((prev) => ({ ...prev, [key]: val }));
  }, []);

  // ─── Render ──────────────────────────────────────────────────────────────────
  return (
    <div
      className="min-h-dvh max-w-full overflow-x-hidden bg-[#f4f5f7] px-3 pb-8 pt-2 font-sans transition-[opacity,transform] duration-300 sm:px-4 lg:px-5 dark:bg-slate-950"
      style={{
        opacity: animIn ? 1 : 0,
        transform: animIn ? "none" : "translateY(4px)",
      }}
    >
      {/* ── Page header ── */}
      <div
        className={cn(
          appPanelClass,
          "mb-2 flex flex-col gap-2 px-3.5 py-2 lg:flex-row lg:items-center lg:justify-between",
        )}
      >
        <div className="flex min-w-0 items-center gap-3">
          <span className="h-7 w-0.5 shrink-0 rounded-full bg-[#008f68]" />
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#f0faf5] text-[#008f68] ring-1 ring-[#008f68]/15">
            <Bell className="h-4 w-4" aria-hidden="true" />
          </div>
          <div className="min-w-0">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-400">
              Audit · Notifications
            </p>
            <h1 className="text-[14px] font-bold leading-tight tracking-[-0.02em] text-slate-900">
              Notification delivery log
            </h1>
            <p className="mt-0.5 text-[11px] font-medium text-slate-500">
              {total.toLocaleString()} total
            </p>
          </div>
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
        onTabChange={(tab) => setActiveTab(tab)}
        onFilterChange={setFilter}
      />

      <div className="mt-3">
        <NotificationsTable
          rows={rows}
          isLoading={isLoading}
          total={total}
          page={page}
          totalPages={totalPages}
          pageSize={PAGE_SIZE}
          onPageChange={setPage}
        />
      </div>
    </div>
  );
}
