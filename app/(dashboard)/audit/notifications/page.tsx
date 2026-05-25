"use client";

import { useEffect, useState, useCallback, useRef, useMemo } from "react";

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
const TYPE_CFG: Record<NotificationType, { label: string; color: string; bg: string; border: string; dot: string }> = {
  CALLBACK_OVERDUE:        { label: "Callback overdue",       color: "#991B1B", bg: "#FEF2F2", border: "#FECACA", dot: "#EF4444" },
  CALLBACK_REMINDER:       { label: "Callback reminder",      color: "#92400E", bg: "#FFFBEB", border: "#FDE68A", dot: "#F59E0B" },
  TICKET_ASSIGNED:         { label: "Ticket assigned",        color: "#1E40AF", bg: "#EFF6FF", border: "#BFDBFE", dot: "#3B82F6" },
  TICKET_FOLLOWUP_OVERDUE: { label: "Ticket follow-up OD",    color: "#065F46", bg: "#ECFDF5", border: "#A7F3D0", dot: "#10B981" },
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
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 5,
      padding: "3px 9px", borderRadius: 999,
      fontSize: 11, fontWeight: 600, letterSpacing: "0.03em",
      background: c.bg, color: c.color,
      border: `1px solid ${c.border}`,
      whiteSpace: "nowrap",
    }}>
      <span style={{ width: 5, height: 5, borderRadius: "50%", background: c.dot, display: "inline-block", flexShrink: 0 }} />
      {c.label}
    </span>
  );
}

function ReadBadge({ read }: { read: boolean }) {
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 4,
      padding: "3px 9px", borderRadius: 999, fontSize: 11, fontWeight: 600,
      background: read ? "#F0FDF4" : "#FEF2F2",
      color: read ? "#166534" : "#991B1B",
      border: `1px solid ${read ? "#BBF7D0" : "#FECACA"}`,
    }}>
      {read ? (
        <svg width="9" height="9" viewBox="0 0 12 12" fill="none"><path d="M2 6l3 3 5-5" stroke="#166534" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
      ) : (
        <span style={{ width: 5, height: 5, borderRadius: "50%", background: "#EF4444", display: "inline-block" }} />
      )}
      {read ? "Read" : "Unread"}
    </span>
  );
}

function AgentChip({ agent }: { agent: { id: number; name?: string; role?: string } | null }) {
  if (!agent) return (
    <span style={{
      fontSize: 11, color: "#9CA3AF",
      background: "#F9FAFB", padding: "3px 9px", borderRadius: 999,
      border: "1px solid #E5E7EB", display: "inline-block",
    }}>
      Broadcast
    </span>
  );
  const [bg, fg] = agentColors(agent.id);
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 7 }}>
      <span style={{
        width: 26, height: 26, borderRadius: "50%",
        background: bg, color: fg,
        fontSize: 9, fontWeight: 700,
        display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
        border: `1.5px solid ${fg}33`,
      }}>
        {initials(agent.name)}
      </span>
      <span>
        <span style={{ fontSize: 13, color: "#111827", fontWeight: 500, display: "block", lineHeight: 1.2 }}>{agent.name || `Agent #${agent.id}`}</span>
        {agent.role && <span style={{ fontSize: 10, color: "#9CA3AF", display: "block" }}>{agent.role}</span>}
      </span>
    </span>
  );
}

function ResourceLinks({ callId, ticketId }: { callId: number | null; ticketId: number | null }) {
  if (!callId && !ticketId) return <span style={{ color: "#D1D5DB", fontSize: 13 }}>—</span>;
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 4 }} onClick={(e) => e.stopPropagation()}>
      {callId && (
        <a href={`/calls/${callId}`} style={{
          fontSize: 12, color: "#1D4ED8", textDecoration: "none",
          display: "inline-flex", alignItems: "center", gap: 4, fontWeight: 500,
          padding: "2px 7px", borderRadius: 6, background: "#EFF6FF", border: "1px solid #BFDBFE",
          width: "fit-content",
        }}>
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.6 1.27h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.91a16 16 0 0 0 6.08 6.08l1.71-1.85a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/>
          </svg>
          Call #{callId}
        </a>
      )}
      {ticketId && (
        <a href={`/tickets/${ticketId}`} style={{
          fontSize: 12, color: "#065F46", textDecoration: "none",
          display: "inline-flex", alignItems: "center", gap: 4, fontWeight: 500,
          padding: "2px 7px", borderRadius: 6, background: "#ECFDF5", border: "1px solid #A7F3D0",
          width: "fit-content",
        }}>
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/>
          </svg>
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
    <div style={{
      background: bg, border: `1px solid ${border}`,
      borderRadius: 14, padding: "18px 20px",
      display: "flex", alignItems: "flex-start", justifyContent: "space-between",
      minWidth: 0,
    }}>
      <div>
        <div style={{ fontSize: 11, fontWeight: 600, color: "#6B7280", letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 8 }}>{label}</div>
        <div style={{ fontSize: 32, fontWeight: 700, color, lineHeight: 1, fontVariantNumeric: "tabular-nums" }}>{value}</div>
        {sub && <div style={{ fontSize: 11, color: "#9CA3AF", marginTop: 4 }}>{sub}</div>}
      </div>
      <div style={{ opacity: 0.6, marginTop: 2 }}>{icon}</div>
    </div>
  );
}

function DonutChart({ segments }: { segments: { label: string; value: number; color: string }[] }) {
  const total = segments.reduce((s, x) => s + x.value, 0);
  if (total === 0) return null;
  const r = 32, cx = 40, cy = 40, stroke = 14;
  let offset = 0;
  const circ = 2 * Math.PI * r;
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
      <svg width={80} height={80}>
        <circle cx={cx} cy={cy} r={r} fill="none" stroke="#F3F4F6" strokeWidth={stroke} />
        {segments.map((seg, i) => {
          const pct = seg.value / total;
          const dash = circ * pct;
          const el = (
            <circle key={i} cx={cx} cy={cy} r={r} fill="none"
              stroke={seg.color} strokeWidth={stroke}
              strokeDasharray={`${dash} ${circ}`}
              strokeDashoffset={-offset * circ / 1}
              style={{ transform: "rotate(-90deg)", transformOrigin: `${cx}px ${cy}px` }}
            />
          );
          offset += pct;
          return el;
        })}
        <text x={cx} y={cy + 1} textAnchor="middle" dominantBaseline="middle" fontSize={13} fontWeight={700} fill="#111827">{total}</text>
      </svg>
      <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
        {segments.map(seg => (
          <div key={seg.label} style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <span style={{ width: 8, height: 8, borderRadius: "50%", background: seg.color, flexShrink: 0 }} />
            <span style={{ fontSize: 11, color: "#6B7280" }}>{seg.label}</span>
            <span style={{ fontSize: 11, fontWeight: 600, color: "#374151", marginLeft: "auto", minWidth: 20, textAlign: "right" }}>{seg.value}</span>
          </div>
        ))}
      </div>
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
      borderRadius: 12,
      padding: "16px 20px",
      display: "grid",
      gridTemplateColumns: "repeat(5, 1fr)",
      gap: 16,
    }}>
      <div style={{ gridColumn: "1 / 3" }}>
        <div style={{ fontSize: 10, fontWeight: 700, color: "#9CA3AF", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 5 }}>Full message</div>
        <div style={{ fontSize: 13, color: "#1F2937", lineHeight: 1.5 }}>{n.message}</div>
      </div>
      <div>
        <div style={{ fontSize: 10, fontWeight: 700, color: "#9CA3AF", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 5 }}>Created at</div>
        <div style={{ fontSize: 12, color: "#374151" }}>{fmtDateFull(n.createdAt)}</div>
        <div style={{ fontSize: 11, color: "#9CA3AF", marginTop: 2 }}>{timeAgo(n.createdAt)}</div>
      </div>
      <div>
        <div style={{ fontSize: 10, fontWeight: 700, color: "#9CA3AF", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 5 }}>Read at</div>
        {n.readAt ? (
          <>
            <div style={{ fontSize: 12, color: "#374151" }}>{fmtDateFull(n.readAt)}</div>
            {latency && <div style={{ fontSize: 11, color: "#10B981", marginTop: 2 }}>⚡ {latency} to read</div>}
          </>
        ) : (
          <div style={{ fontSize: 12, color: "#EF4444", fontStyle: "italic" }}>Not yet read</div>
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
    <div style={{ padding: "4px 0" }}>
      {days.map(day => (
        <div key={day} style={{ marginBottom: 28 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
            <div style={{
              fontSize: 11, fontWeight: 700, color: "#6B7280",
              letterSpacing: "0.07em", textTransform: "uppercase",
              background: "#F9FAFB", border: "1px solid #E5E7EB",
              padding: "3px 10px", borderRadius: 999,
            }}>{day}</div>
            <div style={{ flex: 1, height: 1, background: "#F3F4F6" }} />
            <div style={{ fontSize: 11, color: "#9CA3AF" }}>{grouped[day].length} event{grouped[day].length !== 1 ? "s" : ""}</div>
          </div>
          <div style={{ position: "relative", paddingLeft: 28 }}>
            <div style={{
              position: "absolute", left: 7, top: 0, bottom: 0,
              width: 1.5, background: "#E5E7EB", borderRadius: 1,
            }} />
            {grouped[day].map((n, idx) => {
              const c = TYPE_CFG[n.type];
              return (
                <div key={n.id} style={{
                  position: "relative", marginBottom: idx === grouped[day].length - 1 ? 0 : 12,
                  background: n.read ? "white" : "#FFFBEB",
                  border: `1px solid ${n.read ? "#F3F4F6" : "#FDE68A"}`,
                  borderRadius: 12, padding: "12px 16px",
                  display: "flex", gap: 14, alignItems: "flex-start",
                  transition: "border-color 0.15s, box-shadow 0.15s",
                }}
                  onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.borderColor = "#E5E7EB"; (e.currentTarget as HTMLDivElement).style.boxShadow = "0 2px 8px rgba(0,0,0,0.05)"; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.borderColor = n.read ? "#F3F4F6" : "#FDE68A"; (e.currentTarget as HTMLDivElement).style.boxShadow = "none"; }}
                >
                  <div style={{
                    position: "absolute", left: -23, top: 14,
                    width: 12, height: 12, borderRadius: "50%",
                    background: c.bg, border: `2px solid ${c.dot}`,
                    zIndex: 1,
                  }} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 10 }}>
                      <div>
                        <TypeBadge type={n.type} />
                        <div style={{
                          fontSize: 13, color: n.read ? "#6B7280" : "#111827", marginTop: 6,
                          fontWeight: n.read ? 400 : 600,
                          lineHeight: 1.45
                        }}>{n.message}</div>
                      </div>
                      <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 4, flexShrink: 0 }}>
                        <ReadBadge read={n.read} />
                        <span style={{ fontSize: 11, color: "#9CA3AF", fontFamily: "monospace" }}>
                          {new Date(n.createdAt).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}
                        </span>
                      </div>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 8, flexWrap: "wrap" }}>
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
    const sparkData = Array.from({ length: 7 }, (_, i) => {
      const d = new Date(); d.setDate(d.getDate() - (6 - i));
      const day = d.toLocaleDateString("en-US");
      return allData.filter(n => new Date(n.createdAt).toLocaleDateString("en-US") === day).length;
    });
    const byType: Record<string, number> = {};
    allData.forEach(n => { byType[n.type] = (byType[n.type] || 0) + 1; });
    return { total, unread, overdue, read, broadcast, sparkData, byType };
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
    // Marcar como leída si no lo está
    if (!n.read) {
      setAllData(prev => prev.map(item => item.id === n.id ? { ...item, read: true, readAt: new Date().toISOString() } : item));
    }
    toggleExpand(n.id);
  };

  const hasFilters = Object.values(filters).some(v => v !== "");

  const SortIcon = ({ field }: { field: SortField }) => (
    <span style={{ marginLeft: 4, opacity: sortField === field ? 1 : 0.3, fontSize: 10 }}>
      {sortField === field ? (sortDir === "asc" ? "↑" : "↓") : "↕"}
    </span>
  );

  const thStyle = (field?: SortField): React.CSSProperties => ({
    padding: "10px 14px",
    fontSize: 11, fontWeight: 700,
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
    <div style={{
      minHeight: "100vh",
      background: "#F9FAFB",
      fontFamily: "'Geist', 'DM Sans', 'Helvetica Neue', sans-serif",
      padding: "28px 28px 80px",
      opacity: animIn ? 1 : 0,
      transform: animIn ? "none" : "translateY(6px)",
      transition: "opacity 0.35s ease, transform 0.35s ease",
      boxSizing: "border-box", // solo en este contenedor, no hereda al sidebar
      maxWidth: "100%",
      overflowX: "hidden", // evita scroll horizontal que pueda empujar el sidebar
    }}>
      {/* Estilos internos, no globales */}
      <style>{`
        .notif-audit * { box-sizing: border-box; } /* scope local */
        .fi { height: 36px; border: 1px solid #E5E7EB; border-radius: 9px; padding: 0 11px; font-size: 13px; background: white; color: #111827; outline: none; width: 100%; transition: border-color .15s, box-shadow .15s; }
        .fi:focus { border-color: #10B981; box-shadow: 0 0 0 3px rgba(16,185,129,0.1); }
        .tab { padding: 7px 14px; font-size: 13px; font-weight: 500; border-radius: 8px; border: none; cursor: pointer; transition: all .15s; background: transparent; color: #6B7280; }
        .tab:hover { background: #F3F4F6; color: #374151; }
        .tab.active { background: white; color: #111827; box-shadow: 0 1px 3px rgba(0,0,0,0.08), 0 0 0 1px rgba(0,0,0,0.05); }
        .view-btn { width: 34px; height: 34px; border: 1px solid #E5E7EB; border-radius: 8px; background: white; cursor: pointer; display: flex; align-items: center; justify-content: center; color: #6B7280; transition: all .15s; }
        .view-btn.active { background: #111827; border-color: #111827; color: white; }
        .view-btn:hover:not(.active) { background: #F9FAFB; }
        .page-btn { min-width: 32px; height: 32px; padding: 0 8px; border: 1px solid #E5E7EB; border-radius: 8px; background: white; font-size: 13px; font-family: inherit; font-weight: 500; cursor: pointer; color: #374151; display: flex; align-items: center; justify-content: center; transition: all .15s; }
        .page-btn:hover:not(:disabled) { background: #F3F4F6; border-color: #D1D5DB; }
        .page-btn:disabled { opacity: 0.35; cursor: default; }
        .page-btn.active { background: #111827; color: white; border-color: #111827; }
        .export-btn { height: 36px; padding: 0 16px; border-radius: 9px; border: 1px solid #E5E7EB; background: white; font-size: 13px; font-family: inherit; font-weight: 500; color: #374151; cursor: pointer; display: flex; align-items: center; gap: 6px; transition: all .15s; white-space: nowrap; }
        .export-btn:hover { background: #F9FAFB; border-color: #D1D5DB; }
        .clear-btn { height: 36px; padding: 0 14px; border-radius: 9px; border: 1px solid #FCA5A5; background: #FEF2F2; font-size: 13px; font-family: inherit; font-weight: 500; color: #991B1B; cursor: pointer; display: flex; align-items: center; gap: 6px; transition: all .15s; white-space: nowrap; }
        .clear-btn:hover { background: #FEE2E2; }
        .section-card { background: white; border: 1px solid #E5E7EB; border-radius: 14px; overflow: hidden; }
        .row:hover td { background: #FAFAFA !important; }
        td { transition: background .12s; }
      `}</style>

      {/* ── Page header ── */}
      <div style={{ marginBottom: 24, display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: 16 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{
            width: 40, height: 40, borderRadius: 11,
            background: "#111827",
            display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
          }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
              <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
            </svg>
          </div>
          <div>
            <h1 style={{ fontSize: 21, fontWeight: 700, color: "#111827", lineHeight: 1.2 }}>Notifications Audit</h1>
            <p style={{ fontSize: 13, color: "#9CA3AF", marginTop: 2 }}>
              Complete delivery log · all agents · {allData.length} total records
            </p>
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{ position: "relative" }}>
            <svg style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: "#9CA3AF", pointerEvents: "none" }}
              width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
            </svg>
            <input ref={searchRef} className="fi" style={{ paddingLeft: 32, width: 240, height: 36 }}
              placeholder="Search by message, ID, agent…"
              onChange={e => handleSearch(e.target.value)} />
          </div>
          <div style={{ display: "flex", gap: 4 }}>
            <button className={`view-btn ${viewMode === "table" ? "active" : ""}`} onClick={() => setViewMode("table")} title="Table view">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M3 15h18M9 3v18"/>
              </svg>
            </button>
            <button className={`view-btn ${viewMode === "timeline" ? "active" : ""}`} onClick={() => setViewMode("timeline")} title="Timeline view">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/>
                <line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/>
                <line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/>
              </svg>
            </button>
          </div>
          <button className="export-btn">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
            </svg>
            Export CSV
          </button>
        </div>
      </div>

      {/* ── Stats grid (4 cards) ── */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, minmax(0, 1fr))", gap: 12, marginBottom: 20 }}>
        <StatCard label="Total" value={stats.total}
          sub={`${stats.broadcast} broadcast`}
          color="#111827" bg="white" border="#E5E7EB"
          icon={<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>}
        />
        <StatCard label="Unread" value={stats.unread}
          sub={`${Math.round(stats.unread / stats.total * 100)}% of total`}
          color="#991B1B" bg="#FEF2F2" border="#FECACA"
          icon={<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#EF4444" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>}
        />
        <StatCard label="Overdue" value={stats.overdue}
          sub="callbacks + tickets"
          color="#92400E" bg="#FFFBEB" border="#FDE68A"
          icon={<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#F59E0B" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>}
        />
        <StatCard label="Read" value={stats.read}
          sub={`${Math.round(stats.read / stats.total * 100)}% read rate`}
          color="#065F46" bg="#ECFDF5" border="#A7F3D0"
          icon={<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#10B981" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>}
        />
      </div>

      {/* ── Analytics row ── */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 20 }}>
        <div className="section-card" style={{ padding: "16px 20px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: "#9CA3AF", letterSpacing: "0.07em", textTransform: "uppercase", marginBottom: 4 }}>Activity — last 7 days</div>
            <div style={{ fontSize: 22, fontWeight: 700, color: "#111827" }}>{stats.sparkData.reduce((a, b) => a + b, 0)}</div>
            <div style={{ fontSize: 11, color: "#9CA3AF" }}>notifications sent</div>
          </div>
          <div style={{ display: "flex", alignItems: "flex-end", gap: 4 }}>
            {stats.sparkData.map((v, i) => {
              const max = Math.max(...stats.sparkData, 1);
              const h = Math.max(4, Math.round((v / max) * 44));
              return (
                <div key={i} title={`${v} notifications`} style={{
                  width: 10, height: h,
                  background: i === stats.sparkData.length - 1 ? "#111827" : "#E5E7EB",
                  borderRadius: 3,
                  transition: "height 0.3s ease",
                }} />
              );
            })}
          </div>
        </div>
        <div className="section-card" style={{ padding: "16px 20px" }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: "#9CA3AF", letterSpacing: "0.07em", textTransform: "uppercase", marginBottom: 12 }}>By type</div>
          <DonutChart segments={[
            { label: "Callback overdue",  value: stats.byType.CALLBACK_OVERDUE || 0,        color: "#EF4444" },
            { label: "Callback reminder", value: stats.byType.CALLBACK_REMINDER || 0,       color: "#F59E0B" },
            { label: "Ticket assigned",   value: stats.byType.TICKET_ASSIGNED || 0,         color: "#3B82F6" },
            { label: "Ticket follow-up",  value: stats.byType.TICKET_FOLLOWUP_OVERDUE || 0, color: "#10B981" },
          ]} />
        </div>
      </div>

      {/* ── Tabs + Filters ── */}
      <div className="section-card" style={{ marginBottom: 16 }}>
        <div style={{ padding: "10px 14px", borderBottom: "1px solid #F3F4F6", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", gap: 4, background: "#F9FAFB", padding: 4, borderRadius: 10 }}>
            {([
              ["all", "All notifications", stats.total],
              ["unread", "Unread", stats.unread],
              ["overdue", "Overdue", stats.overdue],
            ] as const).map(([key, label, count]) => (
              <button key={key} className={`tab ${activeTab === key ? "active" : ""}`}
                onClick={() => { setActiveTab(key); setPage(1); }}>
                {label}
                <span style={{
                  marginLeft: 6, fontSize: 10, fontWeight: 700,
                  background: activeTab === key ? "#F3F4F6" : "#E5E7EB",
                  color: "#6B7280",
                  padding: "1px 6px", borderRadius: 999,
                }}>{count}</span>
              </button>
            ))}
          </div>
          {hasFilters && (
            <button className="clear-btn" onClick={clearFilters}>
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M18 6 6 18M6 6l12 12"/></svg>
              Clear filters
            </button>
          )}
        </div>

        {/* Filter bar: single row with wrap */}
        <div style={{
          padding: "12px 14px",
          display: "flex",
          flexWrap: "wrap",
          gap: 10,
          alignItems: "flex-end",
          borderBottom: "1px solid #F3F4F6",
        }}>
          <div style={{ minWidth: 160, flex: "1 1 auto" }}>
            <label style={{ fontSize: 11, fontWeight: 600, color: "#9CA3AF", display: "block", marginBottom: 4, letterSpacing: "0.05em", textTransform: "uppercase" }}>Type</label>
            <select className="fi" value={filters.type} onChange={e => setFilter("type", e.target.value)}>
              <option value="">All types</option>
              <option value="CALLBACK_OVERDUE">Callback overdue</option>
              <option value="CALLBACK_REMINDER">Callback reminder</option>
              <option value="TICKET_ASSIGNED">Ticket assigned</option>
              <option value="TICKET_FOLLOWUP_OVERDUE">Ticket follow-up overdue</option>
            </select>
          </div>
          <div style={{ minWidth: 100, flex: "1 1 auto" }}>
            <label style={{ fontSize: 11, fontWeight: 600, color: "#9CA3AF", display: "block", marginBottom: 4, letterSpacing: "0.05em", textTransform: "uppercase" }}>Agent ID</label>
            <input className="fi" placeholder="e.g. 3" value={filters.agentId} onChange={e => setFilter("agentId", e.target.value)} />
          </div>
          <div style={{ minWidth: 110, flex: "1 1 auto" }}>
            <label style={{ fontSize: 11, fontWeight: 600, color: "#9CA3AF", display: "block", marginBottom: 4, letterSpacing: "0.05em", textTransform: "uppercase" }}>Status</label>
            <select className="fi" value={filters.read} onChange={e => setFilter("read", e.target.value)}>
              <option value="">Any</option>
              <option value="false">Unread</option>
              <option value="true">Read</option>
            </select>
          </div>
          <div style={{ minWidth: 130, flex: "1 1 auto" }}>
            <label style={{ fontSize: 11, fontWeight: 600, color: "#9CA3AF", display: "block", marginBottom: 4, letterSpacing: "0.05em", textTransform: "uppercase" }}>From</label>
            <input className="fi" type="date" value={filters.from} onChange={e => setFilter("from", e.target.value)} />
          </div>
          <div style={{ minWidth: 130, flex: "1 1 auto" }}>
            <label style={{ fontSize: 11, fontWeight: 600, color: "#9CA3AF", display: "block", marginBottom: 4, letterSpacing: "0.05em", textTransform: "uppercase" }}>To</label>
            <input className="fi" type="date" value={filters.to} onChange={e => setFilter("to", e.target.value)} />
          </div>
        </div>
      </div>

      {/* ── Table / Timeline ── */}
      <div className="section-card">
        <div style={{
          padding: "12px 16px", borderBottom: "1px solid #F3F4F6",
          display: "flex", alignItems: "center", gap: 12,
        }}>
          <span style={{ fontSize: 14, fontWeight: 600, color: "#111827" }}>
            {viewMode === "table" ? "Notification log" : "Timeline view"}
          </span>
          <span style={{
            fontSize: 11, color: "#6B7280", fontFamily: "'DM Mono', monospace",
            background: "#F3F4F6", padding: "2px 8px", borderRadius: 999,
          }}>{filtered.length} result{filtered.length !== 1 ? "s" : ""}</span>
        </div>

        {viewMode === "timeline" ? (
          <div style={{ padding: "20px 24px" }}>
            {slice.length === 0 ? (
              <div style={{ padding: "60px 20px", textAlign: "center", color: "#9CA3AF" }}>
                <div style={{ fontSize: 36, marginBottom: 10 }}>🔍</div>
                <div style={{ fontSize: 15, fontWeight: 500, color: "#374151" }}>No notifications found</div>
                <div style={{ fontSize: 13, marginTop: 4 }}>Try adjusting your filters</div>
              </div>
            ) : (
              <TimelineView entries={slice} />
            )}
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 800 }}>
              <thead>
                <tr>
                  <th style={{ ...thStyle("id"), width: 56 }} onClick={() => toggleSort("id")}>
                    ID <SortIcon field="id" />
                  </th>
                  <th style={{ ...thStyle("type"), width: 168 }} onClick={() => toggleSort("type")}>
                    Type <SortIcon field="type" />
                  </th>
                  <th style={{ ...thStyle(), minWidth: 220 }}>Message</th>
                  <th style={{ ...thStyle("agentId"), width: 160 }} onClick={() => toggleSort("agentId")}>
                    Recipient <SortIcon field="agentId" />
                  </th>
                  <th style={{ ...thStyle(), width: 110 }}>Resource</th>
                  <th style={{ ...thStyle("read"), width: 88 }} onClick={() => toggleSort("read")}>
                    Status <SortIcon field="read" />
                  </th>
                  <th style={{ ...thStyle("createdAt"), width: 140, textAlign: "right" as const }} onClick={() => toggleSort("createdAt")}>
                    Date <SortIcon field="createdAt" />
                  </th>
                </tr>
              </thead>
              <tbody>
                {slice.length === 0 ? (
                  <tr>
                    <td colSpan={7} style={{ padding: "60px 20px", textAlign: "center", color: "#9CA3AF", border: "none" }}>
                      <div style={{ fontSize: 36, marginBottom: 10 }}>🔍</div>
                      <div style={{ fontSize: 15, fontWeight: 600, color: "#374151" }}>No notifications match</div>
                      <div style={{ fontSize: 13, marginTop: 4 }}>Try adjusting or clearing your filters</div>
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
                      <td style={{ padding: "11px 14px", borderBottom: isExp ? "none" : "1px solid #F3F4F6" }}>
                        <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, color: "#9CA3AF" }}>#{n.id}</span>
                      </td>
                      <td style={{ padding: "11px 14px", borderBottom: isExp ? "none" : "1px solid #F3F4F6" }}>
                        <TypeBadge type={n.type} />
                      </td>
                      <td style={{
                        padding: "11px 14px", borderBottom: isExp ? "none" : "1px solid #F3F4F6",
                        maxWidth: 220, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                      }}>
                        <span style={{
                          fontSize: 13,
                          color: n.read ? "#6B7280" : "#111827",
                          fontWeight: n.read ? 400 : 600,
                        }} title={n.message}>
                          {n.message}
                        </span>
                      </td>
                      <td style={{ padding: "11px 14px", borderBottom: isExp ? "none" : "1px solid #F3F4F6" }}>
                        <AgentChip agent={n.agent} />
                      </td>
                      <td style={{ padding: "11px 14px", borderBottom: isExp ? "none" : "1px solid #F3F4F6" }}>
                        <ResourceLinks callId={n.callId} ticketId={n.ticketId} />
                      </td>
                      <td style={{ padding: "11px 14px", borderBottom: isExp ? "none" : "1px solid #F3F4F6" }}>
                        <ReadBadge read={n.read} />
                      </td>
                      <td style={{
                        padding: "11px 14px", borderBottom: isExp ? "none" : "1px solid #F3F4F6",
                        textAlign: "right",
                      }}>
                        <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 1 }}>
                          <span style={{ fontSize: 12, color: "#374151", fontFamily: "'DM Mono', monospace", whiteSpace: "nowrap" }}>
                            {fmtDateShort(n.createdAt)}
                          </span>
                          <span style={{ fontSize: 10, color: "#9CA3AF" }}>{timeAgo(n.createdAt)}</span>
                        </div>
                      </td>
                    </tr>,
                    isExp && (
                      <tr key={`exp-${n.id}`}>
                        <td colSpan={7} style={{ padding: "0 16px 12px 16px", borderBottom: "1px solid #F3F4F6" }}>
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

        {/* Paginación común */}
        {totalPages > 1 && (
          <div style={{
            display: "flex", alignItems: "center", justifyContent: "space-between",
            padding: "12px 16px", borderTop: "1px solid #F3F4F6",
          }}>
            <span style={{ fontSize: 12, color: "#9CA3AF" }}>
              Showing <strong style={{ color: "#374151" }}>{(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, filtered.length)}</strong> of <strong style={{ color: "#374151" }}>{filtered.length}</strong>
            </span>
            <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
              <button className="page-btn" disabled={page === 1} onClick={() => setPage(1)}>«</button>
              <button className="page-btn" disabled={page === 1} onClick={() => setPage(p => p - 1)}>‹</button>
              {(() => {
                const pages: (number | "…")[] = [];
                for (let p = 1; p <= totalPages; p++) {
                  if (p === 1 || p === totalPages || Math.abs(p - page) <= 1) pages.push(p);
                  else if (pages[pages.length - 1] !== "…") pages.push("…");
                }
                return pages.map((p, i) =>
                  p === "…"
                    ? <span key={`e${i}`} style={{ width: 32, textAlign: "center", color: "#9CA3AF", fontSize: 13 }}>…</span>
                    : <button key={p} className={`page-btn ${page === p ? "active" : ""}`} onClick={() => setPage(p as number)}>{p}</button>
                );
              })()}
              <button className="page-btn" disabled={page === totalPages} onClick={() => setPage(p => p + 1)}>›</button>
              <button className="page-btn" disabled={page === totalPages} onClick={() => setPage(totalPages)}>»</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}