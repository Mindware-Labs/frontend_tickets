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
  Search,
  Table2,
  X,
} from "lucide-react";
import { appPanelClass } from "@/components/layout/sidebar-theme";
import { getPaginationPageItems } from "@/lib/pagination-pages";
import { cn } from "@/lib/utils";

// ─── Types ────────────────────────────────────────────────────────────────────
type NotificationType =
  | "CALLBACK_OVERDUE"
  | "CALLBACK_REMINDER"
  | "TICKET_ASSIGNED"
  | "TICKET_FOLLOWUP_OVERDUE";

type SortField = "id" | "type" | "agentId" | "read" | "createdAt";
type SortDir = "asc" | "desc";
type ViewMode = "table" | "timeline";

interface AuditEntry {
  id: number;
  type: NotificationType;
  message: string;
  agentId: number | null;
  agent: { id: number; name?: string; role?: string } | null;
  callId: number | null;
  ticketId: number | null;
  read: boolean;
  createdAt: string;
  readAt?: string | null;
  deliveredVia?: "websocket" | "poll" | "push";
}

// ─── Mock data ─────────────────────────────────────────────────────────────────
const MOCK_DATA: AuditEntry[] = [
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
  CALLBACK_REMINDER: {
    label: "Callback reminder",
    badgeClass: "border-amber-200 bg-amber-50 text-amber-700",
    dotClass: "bg-amber-500",
    bg: "#FFFBEB",
    dot: "#F59E0B",
  },
  TICKET_ASSIGNED: {
    label: "Ticket assigned",
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

function StatCard({ label, value, sub, color, bg, border, icon }: {
  label: string; value: number | string; sub?: string;
  color: string; bg: string; border: string; icon: React.ReactNode;
}) {
  return (
    <div
      className="flex min-w-0 items-start justify-between rounded-xl border bg-white px-3 py-2.5 shadow-[0_1px_2px_rgba(15,23,42,0.04)] dark:bg-slate-950"
      style={{ background: bg, borderColor: border }}
    >
      <div>
        <div className="mb-1 text-[9px] font-semibold uppercase tracking-wide text-slate-500">
          {label}
        </div>
        <div
          className="text-xl font-bold leading-none tabular-nums"
          style={{ color }}
        >
          {value}
        </div>
        {sub && <div className="mt-1 text-[10px] text-slate-400">{sub}</div>}
      </div>
      <div className="mt-0.5 text-slate-400">{icon}</div>
    </div>
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
  const [allData, setAllData] = useState<AuditEntry[]>(MOCK_DATA);
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

  // ── Derived stats ────────────────────────────────────────────────────────────
  const stats = useMemo(() => {
    const total = allData.length;
    const unread = allData.filter(n => !n.read).length;
    const overdue = allData.filter(n => n.type.includes("OVERDUE")).length;
    const read = allData.filter(n => n.read).length;
    const broadcast = allData.filter(n => !n.agentId).length;
    return { total, unread, overdue, read, broadcast };
  }, [allData]);

  // ── Filter + sort ─────────────────────────────────────────────────────────────
  const filtered = useMemo(() => {
    let arr = [...allData];
    if (activeTab === "unread") arr = arr.filter(n => !n.read);
    if (activeTab === "overdue") arr = arr.filter(n => n.type.includes("OVERDUE"));
    if (filters.type) arr = arr.filter(n => n.type === filters.type);
    if (filters.agentId) arr = arr.filter(n => String(n.agentId) === filters.agentId);
    if (filters.read !== "") arr = arr.filter(n => String(n.read) === filters.read);
    if (filters.from) arr = arr.filter(n => new Date(n.createdAt) >= new Date(filters.from));
    if (filters.to) arr = arr.filter(n => new Date(n.createdAt) <= new Date(filters.to + "T23:59:59Z"));
    if (filters.search) {
      const q = filters.search.toLowerCase();
      arr = arr.filter(n =>
        n.message.toLowerCase().includes(q) ||
        String(n.id).includes(q) ||
        (n.agent?.name?.toLowerCase().includes(q)) ||
        (n.callId && String(n.callId).includes(q)) ||
        (n.ticketId && String(n.ticketId).includes(q))
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

  const handleRowClick = (n: AuditEntry) => {
    if (!n.read) {
      setAllData(prev => prev.map(item => item.id === n.id ? { ...item, read: true, readAt: new Date().toISOString() } : item));
    }
    toggleExpand(n.id);
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
      className="min-h-dvh max-w-full overflow-x-hidden bg-[#f4f5f7] px-3 pb-8 pt-2 transition-[opacity,transform] duration-300 sm:px-4 lg:px-5 dark:bg-slate-950"
      style={{
        opacity: animIn ? 1 : 0,
        transform: animIn ? "none" : "translateY(4px)",
      }}
    >
      <style>{`
        .notif-audit * { box-sizing: border-box; }
        .fi { height: 36px; border: 1px solid rgb(226 232 240 / .8); border-radius: 8px; padding: 0 10px; font-size: 12px; background: white; color: #0f172a; outline: none; width: 100%; transition: border-color .15s, box-shadow .15s, background .15s; }
        .fi:focus { border-color: #008f68; box-shadow: 0 0 0 2px rgba(0,143,104,0.14); }
        .tab { padding: 6px 10px; font-size: 12px; font-weight: 500; border-radius: 6px; border: none; cursor: pointer; transition: color .15s, background .15s, box-shadow .15s; background: transparent; color: #64748b; }
        .tab:hover { color: #1e293b; }
        .tab.active { background: white; color: #008f68; box-shadow: 0 1px 2px rgba(15,23,42,0.08); font-weight: 600; }
        .view-btn { width: 32px; height: 32px; border-radius: 8px; cursor: pointer; display: flex; align-items: center; justify-content: center; color: #64748b; transition: color .15s, background .15s, box-shadow .15s; }
        .view-btn.active { background: white; color: #008f68; box-shadow: 0 1px 2px rgba(15,23,42,0.08); }
        .view-btn:hover:not(.active) { background: rgba(255,255,255,.55); color: #1e293b; }
        .page-btn { min-width: 30px; height: 30px; padding: 0 8px; border: 1px solid rgb(226 232 240 / .8); border-radius: 8px; background: white; font-size: 12px; font-family: inherit; font-weight: 500; cursor: pointer; color: #475569; display: flex; align-items: center; justify-content: center; transition: all .15s; }
        .page-btn:hover:not(:disabled) { background: #f8fafc; border-color: #cbd5e1; color: #0f172a; }
        .page-btn:disabled { opacity: 0.35; cursor: default; }
        .page-btn.active { background: #f0faf5; color: #008f68; border-color: rgba(0,143,104,.25); font-weight: 700; }
        .export-btn { height: 36px; padding: 0 12px; border-radius: 8px; border: 1px solid rgb(226 232 240 / .8); background: white; font-size: 12px; font-family: inherit; font-weight: 600; color: #334155; cursor: pointer; display: flex; align-items: center; gap: 6px; transition: all .15s; white-space: nowrap; }
        .export-btn:hover { background: #f8fafc; border-color: #cbd5e1; color: #0f172a; }
        .clear-btn { height: 32px; padding: 0 10px; border-radius: 8px; border: 1px solid #fecaca; background: #fef2f2; font-size: 12px; font-family: inherit; font-weight: 600; color: #991b1b; cursor: pointer; display: flex; align-items: center; gap: 5px; transition: all .15s; white-space: nowrap; }
        .clear-btn:hover { background: #fee2e2; }
        .section-card { background: white; border: 1px solid rgb(226 232 240 / .8); border-radius: 16px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.06); }
        .row:hover td { background: #f8fafc !important; }
        td { transition: background .12s; }
      `}</style>

      {/* ── Page header ── */}
      <div className={cn(appPanelClass, "mb-2.5 flex flex-wrap items-center justify-between gap-3 px-3.5 py-3")}>
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#008f68] text-white shadow-[0_1px_2px_rgba(0,143,104,0.18)]">
            <Bell className="h-4 w-4" aria-hidden="true" />
          </div>
          <div>
            <h1 className="text-[15px] font-bold leading-tight tracking-[-0.02em] text-slate-900">Notifications Audit</h1>
            <p className="mt-0.5 text-[11px] font-medium text-slate-500">
              Complete delivery log - all agents - {allData.length} total records
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="relative">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" aria-hidden="true" />
            <input ref={searchRef} className="fi w-[220px] pl-8"
              placeholder="Search..."
              onChange={e => handleSearch(e.target.value)} />
          </div>
          <div className="flex gap-0.5 rounded-lg border border-slate-200/80 bg-slate-100 p-0.5">
            <button className={`view-btn ${viewMode === "table" ? "active" : ""}`} onClick={() => setViewMode("table")} title="Table view">
              <Table2 className="h-3.5 w-3.5" aria-hidden="true" />
            </button>
            <button className={`view-btn ${viewMode === "timeline" ? "active" : ""}`} onClick={() => setViewMode("timeline")} title="Timeline view">
              <List className="h-3.5 w-3.5" aria-hidden="true" />
            </button>
          </div>
          <button className="export-btn">
            <ArrowDownToLine className="h-3.5 w-3.5" aria-hidden="true" />
            Export Csv
          </button>
        </div>
      </div>

      {/* ── Stats grid (4 cards) ── */}
      <div className="mb-3 grid grid-cols-1 gap-2 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Total" value={stats.total}
          sub={`${stats.broadcast} broadcast`}
          color="#111827" bg="white" border="#E5E7EB"
          icon={<Bell className="h-4 w-4" aria-hidden="true" />}
        />
        <StatCard label="Unread" value={stats.unread}
          sub={`${Math.round(stats.unread / stats.total * 100)}% of total`}
          color="#991B1B" bg="#FEF2F2" border="#FECACA"
          icon={<AlertCircle className="h-4 w-4 text-red-500" aria-hidden="true" />}
        />
        <StatCard label="Overdue" value={stats.overdue}
          sub="callbacks + tickets"
          color="#92400E" bg="#FFFBEB" border="#FDE68A"
          icon={<Clock3 className="h-4 w-4 text-amber-500" aria-hidden="true" />}
        />
        <StatCard label="Read" value={stats.read}
          sub={`${Math.round(stats.read / stats.total * 100)}% read rate`}
          color="#065F46" bg="#ECFDF5" border="#A7F3D0"
          icon={<Check className="h-4 w-4 text-emerald-500" aria-hidden="true" />}
        />
      </div>

      {/* ── Tabs + Filters ── */}
      <div className="section-card" style={{ marginBottom: 12 }}>
        <div style={{ padding: "8px 12px", borderBottom: "1px solid #F3F4F6", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", gap: 3, background: "#F9FAFB", padding: 3, borderRadius: 8 }}>
            {([
              ["all", "All", stats.total],
              ["unread", "Unread", stats.unread],
              ["overdue", "Overdue", stats.overdue],
            ] as const).map(([key, label, count]) => (
              <button key={key} className={`tab ${activeTab === key ? "active" : ""}`}
                onClick={() => { setActiveTab(key); setPage(1); }}>
                {label}
                <span style={{
                  marginLeft: 4, fontSize: 9, fontWeight: 700,
                  background: activeTab === key ? "#F3F4F6" : "#E5E7EB",
                  color: "#6B7280",
                  padding: "1px 5px", borderRadius: 999,
                }}>{count}</span>
              </button>
            ))}
          </div>
          {hasFilters && (
            <button className="clear-btn" onClick={clearFilters}>
              <X className="h-3 w-3" aria-hidden="true" />
              Clear
            </button>
          )}
        </div>

        {/* Filter bar - más compacta */}
        <div style={{
          padding: "8px 12px",
          display: "flex",
          flexWrap: "wrap",
          gap: 8,
          alignItems: "flex-end",
          borderBottom: "1px solid #F3F4F6",
        }}>
          <div style={{ minWidth: 130, flex: "1 1 auto" }}>
            <label style={{ fontSize: 9, fontWeight: 600, color: "#9CA3AF", display: "block", marginBottom: 3, letterSpacing: "0.05em", textTransform: "uppercase" }}>Type</label>
            <select className="fi" value={filters.type} onChange={e => setFilter("type", e.target.value)} style={{ height: 30, fontSize: 11 }}>
              <option value="">All types</option>
              <option value="CALLBACK_OVERDUE">Callback overdue</option>
              <option value="CALLBACK_REMINDER">Callback reminder</option>
              <option value="TICKET_ASSIGNED">Ticket assigned</option>
              <option value="TICKET_FOLLOWUP_OVERDUE">Ticket follow-up overdue</option>
            </select>
          </div>
          <div style={{ minWidth: 80, flex: "1 1 auto" }}>
            <label style={{ fontSize: 9, fontWeight: 600, color: "#9CA3AF", display: "block", marginBottom: 3, letterSpacing: "0.05em", textTransform: "uppercase" }}>Agent ID</label>
            <input className="fi" placeholder="e.g. 3" value={filters.agentId} onChange={e => setFilter("agentId", e.target.value)} style={{ height: 30, fontSize: 11 }} />
          </div>
          <div style={{ minWidth: 90, flex: "1 1 auto" }}>
            <label style={{ fontSize: 9, fontWeight: 600, color: "#9CA3AF", display: "block", marginBottom: 3, letterSpacing: "0.05em", textTransform: "uppercase" }}>Status</label>
            <select className="fi" value={filters.read} onChange={e => setFilter("read", e.target.value)} style={{ height: 30, fontSize: 11 }}>
              <option value="">Any</option>
              <option value="false">Unread</option>
              <option value="true">Read</option>
            </select>
          </div>
          <div style={{ minWidth: 110, flex: "1 1 auto" }}>
            <label style={{ fontSize: 9, fontWeight: 600, color: "#9CA3AF", display: "block", marginBottom: 3, letterSpacing: "0.05em", textTransform: "uppercase" }}>From</label>
            <input className="fi" type="date" value={filters.from} onChange={e => setFilter("from", e.target.value)} style={{ height: 30, fontSize: 11 }} />
          </div>
          <div style={{ minWidth: 110, flex: "1 1 auto" }}>
            <label style={{ fontSize: 9, fontWeight: 600, color: "#9CA3AF", display: "block", marginBottom: 3, letterSpacing: "0.05em", textTransform: "uppercase" }}>To</label>
            <input className="fi" type="date" value={filters.to} onChange={e => setFilter("to", e.target.value)} style={{ height: 30, fontSize: 11 }} />
          </div>
        </div>
      </div>

      {/* ── Table / Timeline ── */}
      <div className="section-card">
        <div style={{
          padding: "8px 14px", borderBottom: "1px solid #F3F4F6",
          display: "flex", alignItems: "center", gap: 10,
        }}>
          <span style={{ fontSize: 12, fontWeight: 600, color: "#111827" }}>
            {viewMode === "table" ? "Notification log" : "Timeline view"}
          </span>
          <span style={{
            fontSize: 10, color: "#6B7280", fontFamily: "'DM Mono', monospace",
            background: "#F3F4F6", padding: "1px 6px", borderRadius: 999,
          }}>{filtered.length} result{filtered.length !== 1 ? "s" : ""}</span>
        </div>

        {viewMode === "timeline" ? (
          <div style={{ padding: "14px 18px" }}>
            {slice.length === 0 ? (
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
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 750 }}>
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
                {slice.length === 0 ? (
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
          <div style={{
            display: "flex", alignItems: "center", justifyContent: "space-between",
            padding: "8px 12px", borderTop: "1px solid #F3F4F6",
          }}>
            <span style={{ fontSize: 11, color: "#9CA3AF" }}>
              <strong style={{ color: "#374151" }}>{(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, filtered.length)}</strong> of <strong style={{ color: "#374151" }}>{filtered.length}</strong>
            </span>
            <div style={{ display: "flex", gap: 3, alignItems: "center" }}>
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
