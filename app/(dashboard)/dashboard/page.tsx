"use client";

/**
 * CallCenter OS — Premium Dashboard
 * Power BI style: light theme, Z layout, no global scroll
 * 3 tabs: Operations · Executive · Marketing
 * Charts: Recharts (Area, Bar, Line, Pie, Radial, Funnel)
 */

import { useState, useEffect, useCallback, useRef } from "react";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  RadialBarChart,
  RadialBar,
  ComposedChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  LabelList,
  ReferenceLine,
} from "recharts";
import {
  Phone,
  PhoneCall,
  Users,
  UserCheck,
  Clock,
  Timer,
  CheckCircle2,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  MessageSquare,
  DollarSign,
  HeartPulse,
  Sparkles,
  CalendarClock,
  Activity,
  Headphones,
  BarChart3,
  MapPin,
  Shield,
  ChevronUp,
  ChevronDown,
  Minus,
  Voicemail,
  ShieldAlert,
  AlertCircle,
  RefreshCw,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";

// ─────────────────────────────────────────── PALETTE ─────
const C = {
  bg: "#FFFFFF",
  surface: "#F8FAFC",
  card: "#FFFFFF",
  border: "#E2E8F0",
  border2: "#CBD5E1",
  text: "#1E293B",
  muted: "#64748B",
  hint: "#94A3B8",
  blue: "#3B82F6",
  cyan: "#06B6D4",
  violet: "#8B5CF6",
  emerald: "#10B981",
  amber: "#F59E0B",
  rose: "#F43F5E",
  indigo: "#6366F1",
  teal: "#14B8A6",
  chart1: "#3B82F6",
  chart2: "#8B5CF6",
  chart3: "#06B6D4",
  chart4: "#10B981",
  chart5: "#F59E0B",
};

// ─────────────────────────────────────────── STATIC SEED DATA ────────

const SEED_CALLS_7D = [
  { day: "Mon", calls: 412, tickets: 128, resolved: 104 },
  { day: "Tue", calls: 487, tickets: 151, resolved: 138 },
  { day: "Wed", calls: 521, tickets: 167, resolved: 149 },
  { day: "Thu", calls: 498, tickets: 155, resolved: 141 },
  { day: "Fri", calls: 563, tickets: 178, resolved: 162 },
  { day: "Sat", calls: 298, tickets: 94, resolved: 88 },
  { day: "Sun", calls: 187, tickets: 58, resolved: 54 },
];

const SEED_CALLS_30D = Array.from({ length: 30 }, (_, i) => ({
  d: i + 1,
  calls: Math.round(350 + Math.sin(i / 3) * 120 + ((i * 7) % 80)),
  target: 450,
}));

const SEED_AGENTS = [
  {
    agent: "Lucia R.",
    calls: 61,
    talkMin: 345,
    wrapMin: 49,
    res: 92,
    kept: 22,
    total: 23,
    score: 96,
  },
  {
    agent: "Maria G.",
    calls: 54,
    talkMin: 312,
    wrapMin: 58,
    res: 88,
    kept: 18,
    total: 20,
    score: 89,
  },
  {
    agent: "Sofia L.",
    calls: 52,
    talkMin: 298,
    wrapMin: 55,
    res: 85,
    kept: 16,
    total: 19,
    score: 84,
  },
  {
    agent: "Carlos P.",
    calls: 48,
    talkMin: 287,
    wrapMin: 72,
    res: 81,
    kept: 12,
    total: 17,
    score: 74,
  },
  {
    agent: "Javier T.",
    calls: 43,
    talkMin: 252,
    wrapMin: 63,
    res: 77,
    kept: 10,
    total: 15,
    score: 68,
  },
  {
    agent: "Diego M.",
    calls: 37,
    talkMin: 201,
    wrapMin: 89,
    res: 64,
    kept: 6,
    total: 14,
    score: 52,
  },
];

const SEED_YARDS_DATA = [
  { yard: "Miami", calls: 842, open: 42, ovd: 6, aht: 5.2, contact: 71 },
  { yard: "Orlando", calls: 621, open: 31, ovd: 3, aht: 4.8, contact: 68 },
  { yard: "Tampa", calls: 514, open: 28, ovd: 7, aht: 6.1, contact: 59 },
  { yard: "Jacksonville", calls: 389, open: 19, ovd: 2, aht: 5.7, contact: 74 },
  { yard: "Atlanta", calls: 276, open: 14, ovd: 1, aht: 4.3, contact: 62 },
];

const SEED_DISPOSITIONS = [
  { name: "Hot", value: 142, color: C.rose },
  { name: "Warm", value: 286, color: C.amber },
  { name: "Cold", value: 612, color: C.blue },
];

const SEED_CAMPAIGN_DATA = [
  { name: "AR Q1", rate: 68, conv: 42, roi: 3.2, spend: 12400 },
  { name: "Wellness", rate: 54, conv: 88, roi: 4.1, spend: 8900 },
  { name: "Leads Hot", rate: 72, conv: 31, roi: 2.4, spend: 5600 },
  { name: "Winback", rate: 41, conv: 19, roi: 1.8, spend: 3200 },
];

const SEED_LEAD_FUNNEL = [
  { stage: "Leads", value: 1240, pct: 100 },
  { stage: "Contacted", value: 864, pct: 69.7 },
  { stage: "Qualified", value: 512, pct: 41.3 },
  { stage: "Enrolled", value: 218, pct: 17.6 },
];

const SEED_AR_FUNNEL = [
  { stage: "Dials", value: 4820, pct: 100 },
  { stage: "Contacts", value: 1842, pct: 38.2 },
  { stage: "PTPs", value: 612, pct: 12.7 },
  { stage: "Payments", value: 388, pct: 8.0 },
];

const SEED_WELLNESS_ENROLL = [
  { h: "9a", v: 12 },
  { h: "10a", v: 21 },
  { h: "11a", v: 28 },
  { h: "12p", v: 19 },
  { h: "1p", v: 14 },
  { h: "2p", v: 23 },
  { h: "3p", v: 31 },
  { h: "4p", v: 26 },
  { h: "5p", v: 17 },
];

const SEED_SMS_DATA = [
  { week: "W1", sent: 820, replied: 210, rate: 25.6 },
  { week: "W2", sent: 940, replied: 284, rate: 30.2 },
  { week: "W3", sent: 1012, replied: 331, rate: 32.7 },
  { week: "W4", sent: 1180, replied: 402, rate: 34.1 },
];

const HEATMAP = Array.from({ length: 7 }, (_, d) =>
  Array.from({ length: 24 }, (_, h) => {
    const base =
      Math.max(0, 40 - Math.abs(11 - h) * 4) +
      Math.max(0, 30 - Math.abs(16 - h) * 5);
    return Math.round(base * (d >= 5 ? 0.4 : 1) + ((d * 24 + h) % 13));
  }),
);
const HM_DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

const SEED_ACTIVE_CALLS = [
  {
    id: "C-8821",
    agent: "Maria G.",
    customer: "R. Alvarez",
    line: "AR — L1",
    dur: "04:12",
    status: "Active",
  },
  {
    id: "C-8822",
    agent: "Lucia R.",
    customer: "J. Martinez",
    line: "Wellness — L3",
    dur: "02:45",
    status: "Active",
  },
  {
    id: "C-8823",
    agent: "Sofia L.",
    customer: "P. Rojas",
    line: "Leads — L2",
    dur: "07:08",
    status: "Active",
  },
  {
    id: "—",
    agent: "—",
    customer: "K. Ng",
    line: "AR — L1",
    dur: "00:42",
    status: "Queued",
  },
  {
    id: "—",
    agent: "—",
    customer: "T. Villa",
    line: "Leads — L2",
    dur: "01:12",
    status: "Queued",
  },
];

const RADIAL_AGENTS = SEED_AGENTS.map((a) => ({
  ...a,
  fill: a.score >= 85 ? C.emerald : a.score >= 70 ? C.amber : C.rose,
}));

const OVERDUE_ACTIONS = [
  {
    id: "T-1042",
    client: "Marcus Holloway",
    agent: "Priya Shah",
    tag: "Callback Req.",
    due: "2 hrs ago",
  },
  {
    id: "T-1088",
    client: "Rig Hut Logistics",
    agent: "Carlos P.",
    tag: "PTP Overdue",
    due: "4 hrs ago",
  },
  {
    id: "T-1095",
    client: "Sarah Jenkins",
    agent: "Diego M.",
    tag: "Dispute",
    due: "1 día ago",
  },
  {
    id: "T-1102",
    client: "Alvarez Bros",
    agent: "María G.",
    tag: "Escalado",
    due: "1 día ago",
  },
];

const CALLER_TYPE = [
  { name: "New", value: 65, color: C.blue },
  { name: "Returning", value: 35, color: "#94A3B8" },
];

// ─────────────────────────────────────────── HELPERS ─────
const fmt = (n: number) => n.toLocaleString("en");
const fmtMin = (m: number) => {
  const h = Math.floor(m / 60),
    r = m % 60;
  return h ? `${h}h ${r}m` : `${r}m`;
};
const pctColor = (v: number) =>
  v >= 85 ? C.emerald : v >= 70 ? C.amber : C.rose;

// ─────────────────────────────────────────── LIVE DATA HOOK ──────────────────

/** Drift a number ±maxDelta, clamp to [min, max] */
function drift(v: number, maxDelta: number, min = 0, max = Infinity) {
  const delta = Math.round((Math.random() - 0.5) * 2 * maxDelta);
  return Math.min(max, Math.max(min, v + delta));
}

/** Tick a "MM:SS" call duration string forward by 2–5 seconds */
function tickDur(dur: string): string {
  const [m, s] = dur.split(":").map(Number);
  const addSecs = Math.floor(Math.random() * 4) + 2;
  const totalSecs = m * 60 + s + addSecs;
  const nm = Math.floor(totalSecs / 60);
  const ns = totalSecs % 60;
  return `${String(nm).padStart(2, "0")}:${String(ns).padStart(2, "0")}`;
}

interface OpsKpis {
  totalCalls: number;
  promiseFulfilled: number;
  promiseTotal: number;
  overdue: number;
  openTotal: number;
  resolutionPct: number;
  ahtMin: number;
  ahtSec: number;
  voicemails: number;
}

interface LiveQueue {
  label: string;
  count: number;
  color: string;
}

interface DashboardLiveData {
  calls7d: typeof SEED_CALLS_7D;
  calls30d: typeof SEED_CALLS_30D;
  activeCalls: typeof SEED_ACTIVE_CALLS;
  agents: typeof SEED_AGENTS;
  yardsData: typeof SEED_YARDS_DATA;
  dispositions: typeof SEED_DISPOSITIONS;
  campaignData: typeof SEED_CAMPAIGN_DATA;
  leadFunnel: typeof SEED_LEAD_FUNNEL;
  arFunnel: typeof SEED_AR_FUNNEL;
  wellnessEnroll: typeof SEED_WELLNESS_ENROLL;
  smsData: typeof SEED_SMS_DATA;
  opsKpis: OpsKpis;
  liveQueue: LiveQueue[];
  flashedKeys: Set<string>;
  lastUpdated: Date;
  refresh: () => void;
}

function useDashboardData(intervalMs = 4500): DashboardLiveData {
  const [calls7d, setCalls7d] = useState(SEED_CALLS_7D);
  const [calls30d, setCalls30d] = useState(SEED_CALLS_30D);
  const [activeCalls, setActiveCalls] = useState(SEED_ACTIVE_CALLS);
  const [agents, setAgents] = useState(SEED_AGENTS);
  const [yardsData, setYardsData] = useState(SEED_YARDS_DATA);
  const [dispositions, setDispositions] = useState(SEED_DISPOSITIONS);
  const [campaignData, setCampaignData] = useState(SEED_CAMPAIGN_DATA);
  const [leadFunnel, setLeadFunnel] = useState(SEED_LEAD_FUNNEL);
  const [arFunnel, setArFunnel] = useState(SEED_AR_FUNNEL);
  const [wellnessEnroll, setWellnessEnroll] = useState(SEED_WELLNESS_ENROLL);
  const [smsData, setSmsData] = useState(SEED_SMS_DATA);
  const [lastUpdated, setLastUpdated] = useState(new Date());
  const [flashedKeys, setFlashedKeys] = useState<Set<string>>(new Set());

  const [opsKpis, setOpsKpis] = useState<OpsKpis>({
    totalCalls: 7,
    promiseFulfilled: 84,
    promiseTotal: 122,
    overdue: 19,
    openTotal: 134,
    resolutionPct: 82,
    ahtMin: 5,
    ahtSec: 24,
    voicemails: 4,
  });

  const [liveQueue, setLiveQueue] = useState<LiveQueue[]>([
    { label: "Active", count: 7, color: C.emerald },
    { label: "Queued", count: 12, color: C.amber },
    { label: "Available", count: 5, color: C.blue },
    { label: "Break", count: 2, color: C.muted },
  ]);

  const tick = useCallback(() => {
    const newFlash = new Set<string>();

    setLiveQueue((prev) =>
      prev.map((q) => {
        const maxD = q.label === "Queued" ? 3 : 1;
        const nc = drift(q.count, maxD, 0, q.label === "Queued" ? 20 : 12);
        if (nc !== q.count) newFlash.add(`queue_${q.label}`);
        return { ...q, count: nc };
      }),
    );

    setActiveCalls((prev) => prev.map((c) => ({ ...c, dur: tickDur(c.dur) })));

    setOpsKpis((prev) => {
      const next = {
        ...prev,
        totalCalls: drift(prev.totalCalls, 1, 0, 30),
        voicemails: drift(prev.voicemails, 1, 0, 12),
        overdue: drift(prev.overdue, 1, 0, 40),
        resolutionPct: drift(prev.resolutionPct, 1, 70, 100),
        promiseFulfilled: drift(
          prev.promiseFulfilled,
          1,
          60,
          prev.promiseTotal,
        ),
        ahtSec: drift(prev.ahtSec, 5, 0, 59),
      };
      if (next.voicemails !== prev.voicemails) newFlash.add("kpi_voicemails");
      if (next.overdue !== prev.overdue) newFlash.add("kpi_overdue");
      if (next.totalCalls !== prev.totalCalls) newFlash.add("kpi_totalCalls");
      return next;
    });

    setCalls7d((prev) => {
      const next = [...prev];
      for (let i = 5; i < 7; i++) {
        next[i] = {
          ...next[i],
          calls: drift(next[i].calls, 12, 100, 700),
          tickets: drift(next[i].tickets, 4, 20, 200),
          resolved: drift(next[i].resolved, 4, 20, 200),
        };
      }
      return next;
    });

    setCalls30d((prev) => {
      const next = [...prev];
      for (let i = 27; i < 30; i++) {
        next[i] = { ...next[i], calls: drift(next[i].calls, 15, 200, 700) };
      }
      return next;
    });

    if (Math.random() < 0.4) {
      setAgents((prev) =>
        prev.map((a) => ({
          ...a,
          calls: drift(a.calls, 1, 10, 120),
          res: drift(a.res, 1, 50, 100),
          score: drift(a.score, 1, 40, 100),
        })),
      );
    }

    if (Math.random() < 0.3) {
      setYardsData((prev) =>
        prev.map((y) => ({
          ...y,
          calls: drift(y.calls, 8, 100, 1200),
          open: drift(y.open, 1, 0, 80),
        })),
      );
    }

    if (Math.random() < 0.3) {
      setDispositions((prev) =>
        prev.map((d) => ({
          ...d,
          value: drift(d.value, 3, 50, 900),
        })),
      );
    }

    if (Math.random() < 0.25) {
      setCampaignData((prev) =>
        prev.map((c) => ({
          ...c,
          rate: drift(c.rate, 1, 20, 95),
          conv: drift(c.conv, 2, 5, 150),
        })),
      );
    }

    if (Math.random() < 0.4) {
      setWellnessEnroll((prev) => {
        const next = [...prev];
        const idx = Math.floor(Math.random() * prev.length);
        next[idx] = { ...next[idx], v: drift(next[idx].v, 3, 5, 50) };
        return next;
      });
    }

    if (Math.random() < 0.2) {
      setSmsData((prev) => {
        const next = [...prev];
        const updated = {
          ...next[3],
          sent: drift(next[3].sent, 20, 800, 1800),
          replied: drift(next[3].replied, 8, 200, 600),
        };
        next[3] = {
          ...updated,
          rate: parseFloat(((updated.replied / updated.sent) * 100).toFixed(1)),
        };
        return next;
      });
    }

    if (Math.random() < 0.2) {
      setLeadFunnel((prev) => {
        const next = [...prev];
        next[0] = { ...next[0], value: drift(next[0].value, 10, 1000, 2000) };
        return next;
      });
      setArFunnel((prev) => {
        const next = [...prev];
        next[0] = { ...next[0], value: drift(next[0].value, 20, 4000, 6000) };
        return next;
      });
    }

    setFlashedKeys(newFlash);
    setLastUpdated(new Date());
    setTimeout(() => setFlashedKeys(new Set()), 700);
  }, []);

  const refresh = useCallback(() => tick(), [tick]);

  useEffect(() => {
    const id = setInterval(tick, intervalMs);
    return () => clearInterval(id);
  }, [tick, intervalMs]);

  return {
    calls7d,
    calls30d,
    activeCalls,
    agents,
    yardsData,
    dispositions,
    campaignData,
    leadFunnel,
    arFunnel,
    wellnessEnroll,
    smsData,
    opsKpis,
    liveQueue,
    flashedKeys,
    lastUpdated,
    refresh,
  };
}

// ─────────────────────────────── CUSTOM TOOLTIP ───
const LightTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div
      style={{
        background: "#FFFFFF",
        border: `1px solid ${C.border}`,
        borderRadius: 8,
        padding: "8px 12px",
        fontSize: 12,
        color: C.text,
        boxShadow: "0 4px 6px -2px rgba(0,0,0,0.05)",
      }}
    >
      {label && (
        <p
          style={{
            color: C.muted,
            marginBottom: 4,
            fontSize: 11,
            fontWeight: 600,
          }}
        >
          {label}
        </p>
      )}
      {payload.map((p: any, i: number) => (
        <p key={i} style={{ color: p.color ?? C.text, margin: "2px 0" }}>
          <span style={{ color: C.muted }}>{p.name}: </span>
          <strong>
            {typeof p.value === "number" ? fmt(p.value) : p.value}
          </strong>
        </p>
      ))}
    </div>
  );
};

// ─────────────────────────────────────────── UI ATOMS ────

function KpiCard({
  label,
  value,
  sub,
  trend,
  icon: Icon,
  accent,
  flashStyle,
}: {
  label: string;
  value: string | number;
  sub?: string;
  trend?: { val: string; up: boolean | null };
  icon?: React.ComponentType<{ size?: number; color?: string }>;
  accent: string;
  flashStyle?: React.CSSProperties;
}) {
  return (
    <div
      className="relative flex flex-col justify-between rounded-xl overflow-hidden transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5"
      style={{
        background: `linear-gradient(160deg, ${accent}08 0%, #ffffff 55%)`,
        border: `1px solid ${C.border}`,
        borderTop: `3px solid ${accent}`,
        padding: "14px 16px",
        flex: 1,
        minWidth: 0,
        boxShadow: `0 1px 2px 0 rgba(0,0,0,0.04)`,
        ...flashStyle,
      }}
    >
      <div
        style={{
          position: "absolute",
          top: -16,
          right: -16,
          width: 100,
          height: 100,
          borderRadius: "50%",
          background: accent,
          opacity: 0.06,
          filter: "blur(24px)",
          pointerEvents: "none",
        }}
      />

      <div className="flex items-start justify-between">
        <span
          style={{
            fontSize: 11,
            fontWeight: 600,
            color: C.muted,
            textTransform: "uppercase",
            letterSpacing: "0.6px",
          }}
        >
          {label}
        </span>
        {Icon && (
          <div
            style={{
              padding: "7px",
              borderRadius: 9,
              background: `${accent}14`,
              border: `1px solid ${accent}28`,
            }}
          >
            <Icon size={14} color={accent} />
          </div>
        )}
      </div>
      <div>
        <div
          className="tracking-tight"
          style={{
            fontSize: 26,
            fontWeight: 800,
            color: C.text,
            lineHeight: 1.1,
            letterSpacing: "-0.8px",
            fontFamily: "'DM Sans', sans-serif",
          }}
        >
          {value}
        </div>
        {sub && (
          <div style={{ fontSize: 11, color: C.muted, marginTop: 2 }}>
            {sub}
          </div>
        )}
      </div>
      {trend && (
        <div className="flex items-center gap-1" style={{ marginTop: 6 }}>
          {trend.up === true && <ChevronUp size={12} color={C.emerald} />}
          {trend.up === false && <ChevronDown size={12} color={C.rose} />}
          {trend.up === null && <Minus size={12} color={C.muted} />}
          <span
            style={{
              fontSize: 11,
              fontWeight: 600,
              color:
                trend.up === true
                  ? C.emerald
                  : trend.up === false
                    ? C.rose
                    : C.muted,
            }}
          >
            {trend.val}
          </span>
          <span style={{ fontSize: 10, color: C.hint }}>vs last week</span>
        </div>
      )}
    </div>
  );
}

function FilterChip({
  label,
  onClear,
}: {
  label: string;
  onClear: () => void;
}) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 4,
        fontSize: 10,
        fontWeight: 600,
        padding: "2px 6px 2px 9px",
        borderRadius: 20,
        background: `${C.blue}12`,
        color: C.blue,
        border: `1px solid ${C.blue}30`,
        flexShrink: 0,
      }}
    >
      <span>{label}</span>
      <button
        onClick={onClear}
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "none",
          border: "none",
          cursor: "pointer",
          color: C.blue,
          padding: "0 2px",
          lineHeight: 1,
          fontSize: 13,
          fontWeight: 700,
        }}
      >
        ×
      </button>
    </div>
  );
}

function SectionCard({
  title,
  titleRight,
  children,
  className = "",
  style = {},
  noPad = false,
}: {
  title?: string;
  titleRight?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
  noPad?: boolean;
}) {
  return (
    <div
      className={`flex flex-col ${className}`}
      style={{
        background: C.card,
        border: `1px solid ${C.border}`,
        borderRadius: 12,
        overflow: "hidden",
        transition: "border-color 0.2s, box-shadow 0.2s",
        ...style,
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLDivElement).style.borderColor = C.border2;
        (e.currentTarget as HTMLDivElement).style.boxShadow =
          "0 2px 8px rgba(0,0,0,0.06)";
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLDivElement).style.borderColor = C.border;
        (e.currentTarget as HTMLDivElement).style.boxShadow = "";
      }}
    >
      {title && (
        <div
          style={{
            padding: "10px 14px 8px",
            borderBottom: `1px solid ${C.border}`,
            fontSize: 11,
            fontWeight: 700,
            color: C.muted,
            textTransform: "uppercase",
            letterSpacing: "0.6px",
            flexShrink: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <span>{title}</span>
          {titleRight}
        </div>
      )}
      <div
        style={
          noPad
            ? { flex: 1, minHeight: 0 }
            : { padding: "10px 14px", flex: 1, minHeight: 0 }
        }
      >
        {children}
      </div>
    </div>
  );
}

function StatusDot({ color }: { color: string }) {
  return (
    <span
      style={{
        display: "inline-block",
        width: 7,
        height: 7,
        borderRadius: "50%",
        background: color,
        boxShadow: `0 0 5px ${color}`,
        animation: "pulse2 2s infinite",
      }}
    />
  );
}

function MiniPbar({
  v,
  color,
  h = 4,
}: {
  v: number;
  color: string;
  h?: number;
}) {
  return (
    <div
      style={{
        height: h,
        borderRadius: h,
        background: C.border2,
        overflow: "hidden",
        width: "100%",
      }}
    >
      <div
        style={{
          height: "100%",
          width: `${v}%`,
          background: color,
          borderRadius: h,
          transition: "width 0.5s",
        }}
      />
    </div>
  );
}

function FunnelBars({
  data,
}: {
  data: { stage: string; value: number; pct: number }[];
}) {
  const colors = [C.blue, C.cyan, C.teal, C.emerald];
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
      {data.map((r, i) => (
        <div key={r.stage}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              marginBottom: 3,
            }}
          >
            <span style={{ fontSize: 11, color: C.muted }}>{r.stage}</span>
            <div style={{ display: "flex", gap: 8 }}>
              <span
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  color: C.text,
                  fontFamily: "monospace",
                }}
              >
                {fmt(r.value)}
              </span>
              <span
                style={{
                  fontSize: 10,
                  color: colors[i],
                  fontFamily: "monospace",
                }}
              >
                {r.pct.toFixed(1)}%
              </span>
            </div>
          </div>
          <div
            style={{
              height: 6,
              borderRadius: 3,
              background: C.border2,
              overflow: "hidden",
            }}
          >
            <div
              style={{
                height: "100%",
                width: `${r.pct}%`,
                background: colors[i],
                borderRadius: 3,
              }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

// ─────────────────────────────────────────── TAB: OPERATIONS ──

function PanelOps({ data }: { data: DashboardLiveData }) {
  const {
    opsKpis: kpi,
    liveQueue,
    activeCalls,
    agents,
    calls7d,
    flashedKeys,
  } = data;
  const fulfillPct = Math.round(
    (kpi.promiseFulfilled / kpi.promiseTotal) * 100,
  );
  const ahtStr = `${kpi.ahtMin}:${String(kpi.ahtSec).padStart(2, "0")}`;

  const [filterAgent, setFilterAgent] = useState<string | null>(null);

  const flashStyle = (key: string): React.CSSProperties =>
    flashedKeys.has(key)
      ? { animation: "kpiFlash 0.6s ease", animationFillMode: "forwards" }
      : {};

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 8,
        flex: 1,
        minHeight: 0,
        overflow: "hidden",
      }}
    >
      {/* ROW 1 — KPIs */}
      <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
        <KpiCard
          label="Total Calls"
          value={String(kpi.totalCalls)}
          trend={{ val: "+2 vs yesterday", up: true }}
          icon={PhoneCall}
          accent={C.emerald}
          flashStyle={flashStyle("kpi_totalCalls")}
        />
        <KpiCard
          label="Callback Promises"
          value={`${kpi.promiseFulfilled}/${kpi.promiseTotal}`}
          sub={`${fulfillPct}% fulfillment rate`}
          trend={{ val: "−3% this week", up: false }}
          icon={CalendarClock}
          accent={C.amber}
        />
        <KpiCard
          label="Overdue Tickets"
          value={String(kpi.overdue)}
          sub={`of ${kpi.openTotal} open total`}
          trend={{ val: "−4 vs yesterday", up: true }}
          icon={AlertTriangle}
          accent={C.rose}
          flashStyle={flashStyle("kpi_overdue")}
        />
        <KpiCard
          label="Resolution Today"
          value={`${kpi.resolutionPct}%`}
          sub="target: 85%"
          trend={{ val: "+1.2%", up: true }}
          icon={CheckCircle2}
          accent={C.blue}
        />
        <KpiCard
          label="Avg AHT"
          value={ahtStr}
          sub="minutes per call"
          trend={{ val: "−8%", up: true }}
          icon={Timer}
          accent={C.violet}
        />
        <KpiCard
          label="Pending Voicemails"
          value={String(kpi.voicemails)}
          sub="Avg response: 14m"
          trend={{ val: "+1 vs yesterday", up: false }}
          icon={Voicemail}
          accent={C.cyan}
          flashStyle={flashStyle("kpi_voicemails")}
        />
      </div>

      {/* ROW 2 — Calls + Agent performance */}
      <div style={{ display: "flex", gap: 8, flex: "0 0 auto", height: 200 }}>
        {/* Area: 7 day calls */}

        <SectionCard title="Calls — Last 7 Days" style={{ flex: 2 }}>
          <ResponsiveContainer width="100%" height={140}>
            <AreaChart
              data={calls7d}
              margin={{ top: 4, right: 4, left: -20, bottom: 0 }}
            >
              <defs>
                <linearGradient id="gCalls" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={C.blue} stopOpacity={0.35} />
                  <stop offset="95%" stopColor={C.blue} stopOpacity={0.03} />
                </linearGradient>
                <linearGradient id="gResolved" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={C.emerald} stopOpacity={0.25} />
                  <stop offset="95%" stopColor={C.emerald} stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke={C.border}
                vertical={false}
              />
              <XAxis
                dataKey="day"
                tick={{ fill: C.muted, fontSize: 10 }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fill: C.muted, fontSize: 10 }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip content={<LightTooltip />} />
              <Area
                type="monotone"
                dataKey="calls"
                stroke={C.blue}
                strokeWidth={2}
                fill="url(#gCalls)"
                name="Calls"
              />
              <Area
                type="monotone"
                dataKey="resolved"
                stroke={C.emerald}
                strokeWidth={2}
                fill="url(#gResolved)"
                name="Resolved"
              />
            </AreaChart>
          </ResponsiveContainer>
        </SectionCard>

        {/* Priority Action Queue */}
        <div
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            background: C.card,
            border: `1px solid ${C.border}`,
            borderRadius: 12,
            overflow: "hidden",
          }}
        >
          <div
            style={{
              padding: "10px 14px 8px",
              borderBottom: `1px solid ${C.border}`,
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              flexShrink: 0,
              background: C.surface,
            }}
          >
            <h3
              style={{
                fontSize: 11,
                fontWeight: 700,
                color: C.text,
                display: "flex",
                alignItems: "center",
                gap: 6,
                margin: 0,
              }}
            >
              <ShieldAlert size={14} color={C.rose} /> Priority Action Queue
            </h3>
            <span
              style={{
                background: `${C.rose}15`,
                color: C.rose,
                padding: "2px 8px",
                borderRadius: 20,
                fontSize: 10,
                fontWeight: 700,
              }}
            >
              {kpi.overdue} Overdue
            </span>
          </div>
          <div
            className="[&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:bg-slate-200 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-track]:bg-transparent"
            style={{ flex: 1, overflowY: "auto", padding: "0 8px 8px" }}
          >
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr
                  style={{
                    fontSize: 10,
                    color: C.hint,
                    textTransform: "uppercase",
                    letterSpacing: "0.5px",
                    borderBottom: `1px solid ${C.border}`,
                  }}
                >
                  <th
                    style={{
                      padding: "8px 0 6px 8px",
                      fontWeight: 600,
                      textAlign: "left",
                    }}
                  >
                    Client / ID
                  </th>
                  <th
                    style={{
                      padding: "8px 0 6px",
                      fontWeight: 600,
                      textAlign: "left",
                    }}
                  >
                    Agent
                  </th>
                  <th
                    style={{
                      padding: "8px 0 6px",
                      fontWeight: 600,
                      textAlign: "left",
                    }}
                  >
                    Reason
                  </th>
                  <th
                    style={{
                      padding: "8px 8px 6px 0",
                      fontWeight: 600,
                      textAlign: "right",
                    }}
                  >
                    Delay
                  </th>
                </tr>
              </thead>
              <tbody>
                {OVERDUE_ACTIONS.map((action, idx) => (
                  <tr
                    key={idx}
                    style={{
                      borderBottom: `1px solid ${C.border}`,
                      transition: "background .15s",
                    }}
                    onMouseEnter={(e) =>
                      (e.currentTarget.style.background = `${C.rose}08`)
                    }
                    onMouseLeave={(e) =>
                      (e.currentTarget.style.background = "transparent")
                    }
                  >
                    <td style={{ padding: "8px 0 8px 8px" }}>
                      <div
                        style={{ fontSize: 11, fontWeight: 700, color: C.text }}
                      >
                        {action.client}
                      </div>
                      <div
                        style={{
                          fontSize: 9,
                          color: C.hint,
                          fontFamily: "monospace",
                        }}
                      >
                        {action.id}
                      </div>
                    </td>
                    <td
                      style={{
                        padding: "8px 0",
                        fontSize: 11,
                        color: C.muted,
                        fontWeight: 500,
                      }}
                    >
                      {action.agent}
                    </td>
                    <td style={{ padding: "8px 0" }}>
                      <Badge
                        variant="outline"
                        style={{
                          fontSize: 9,
                          background: C.surface,
                          color: C.muted,
                          borderColor: C.border2,
                        }}
                      >
                        {action.tag}
                      </Badge>
                    </td>
                    <td
                      style={{ padding: "8px 8px 8px 0", textAlign: "right" }}
                    >
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "flex-end",
                          gap: 4,
                          color: C.rose,
                          fontWeight: 700,
                          fontSize: 11,
                        }}
                      >
                        <AlertCircle size={11} />
                        {action.due}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Live queue pills */}
        <SectionCard title="Live Queue" style={{ flex: "0 0 160px" }}>
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 8,
              paddingTop: 4,
            }}
          >
            {liveQueue.map((q) => (
              <div
                key={q.label}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <StatusDot color={q.color} />
                  <span style={{ fontSize: 11, color: C.muted }}>
                    {q.label}
                  </span>
                </div>
                <span
                  style={{
                    fontSize: 18,
                    fontWeight: 800,
                    color: q.color,
                    fontFamily: "'DM Sans', sans-serif",
                  }}
                >
                  {q.count}
                </span>
              </div>
            ))}
          </div>
        </SectionCard>
      </div>

      {/* ROW 3 — Active calls table + agent metrics */}
      <div style={{ display: "flex", gap: 8, flex: 1, minHeight: 0 }}>
        {/* Active calls */}
        <SectionCard
          title="Active & Queued Calls"
          titleRight={
            filterAgent ? (
              <FilterChip
                label={filterAgent}
                onClear={() => setFilterAgent(null)}
              />
            ) : undefined
          }
          style={{ flex: 1 }}
          noPad
        >
          <div
            className="[&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:bg-slate-200 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-track]:bg-transparent"
            style={{ overflowY: "auto", maxHeight: "100%", padding: "0 14px" }}
          >
            <table
              style={{
                width: "100%",
                borderCollapse: "collapse",
                fontSize: 11,
              }}
            >
              <thead>
                <tr>
                  {[
                    "ID",
                    "Agent",
                    "Customer",
                    "Line",
                    "Duration",
                    "Status",
                  ].map((h, i) => (
                    <th
                      key={h}
                      style={{
                        padding: "8px 6px 6px",
                        textAlign: i >= 4 ? "right" : "left",
                        color: C.hint,
                        fontWeight: 600,
                        fontSize: 10,
                        textTransform: "uppercase",
                        letterSpacing: "0.5px",
                        borderBottom: `1px solid ${C.border}`,
                        position: "sticky",
                        top: 0,
                        background: C.card,
                      }}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {(filterAgent
                  ? activeCalls.filter((r) => r.agent === filterAgent)
                  : activeCalls
                ).map((r, i) => (
                  <tr
                    key={i}
                    style={{ borderBottom: `1px solid ${C.border}` }}
                    onMouseEnter={(e) =>
                      (e.currentTarget.style.background = C.surface)
                    }
                    onMouseLeave={(e) =>
                      (e.currentTarget.style.background = "transparent")
                    }
                  >
                    <td
                      style={{
                        padding: "7px 6px",
                        fontFamily: "monospace",
                        color: C.hint,
                        fontSize: 10,
                      }}
                    >
                      {r.id}
                    </td>
                    <td
                      style={{
                        padding: "7px 6px",
                        fontWeight: 600,
                        color: C.text,
                      }}
                    >
                      {r.agent}
                    </td>
                    <td style={{ padding: "7px 6px", color: C.muted }}>
                      {r.customer}
                    </td>
                    <td style={{ padding: "7px 6px", color: C.hint }}>
                      {r.line}
                    </td>
                    <td
                      style={{
                        padding: "7px 6px",
                        textAlign: "right",
                        fontFamily: "monospace",
                        color: C.text,
                      }}
                    >
                      {r.dur}
                    </td>
                    <td style={{ padding: "7px 6px", textAlign: "right" }}>
                      <span
                        style={{
                          fontSize: 10,
                          fontWeight: 600,
                          padding: "2px 7px",
                          borderRadius: 4,
                          background:
                            r.status === "Active"
                              ? `${C.emerald}15`
                              : `${C.amber}15`,
                          color: r.status === "Active" ? C.emerald : C.amber,
                          border: `1px solid ${r.status === "Active" ? C.emerald : C.amber}30`,
                        }}
                      >
                        {r.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </SectionCard>

        {/* Agent metrics table */}
        <SectionCard title="Agent Metrics" style={{ flex: 1 }} noPad>
          <div
            className="[&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:bg-slate-200 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-track]:bg-transparent"
            style={{ overflowY: "auto", maxHeight: "100%", padding: "0 14px" }}
          >
            <table
              style={{
                width: "100%",
                borderCollapse: "collapse",
                fontSize: 11,
              }}
            >
              <thead>
                <tr>
                  {[
                    "Agent",
                    "Calls",
                    "Talk",
                    "Resolution",
                    "Promises",
                    "Score",
                  ].map((h, i) => (
                    <th
                      key={h}
                      style={{
                        padding: "8px 6px 6px",
                        textAlign: i >= 1 ? "right" : "left",
                        color: C.hint,
                        fontWeight: 600,
                        fontSize: 10,
                        textTransform: "uppercase",
                        letterSpacing: "0.5px",
                        borderBottom: `1px solid ${C.border}`,
                        position: "sticky",
                        top: 0,
                        background: C.card,
                      }}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {agents.map((a, i) => {
                  const kPct = Math.round((a.kept / a.total) * 100);
                  const risk = kPct < 70;
                  const isSelected = filterAgent === a.agent;
                  return (
                    <tr
                      key={i}
                      style={{
                        borderBottom: `1px solid ${C.border}`,
                        background: isSelected ? `${C.blue}0d` : "transparent",
                        cursor: "pointer",
                        transition: "background .15s",
                      }}
                      onClick={() =>
                        setFilterAgent(isSelected ? null : a.agent)
                      }
                      onMouseEnter={(e) =>
                        (e.currentTarget.style.background = isSelected
                          ? `${C.blue}18`
                          : C.surface)
                      }
                      onMouseLeave={(e) =>
                        (e.currentTarget.style.background = isSelected
                          ? `${C.blue}0d`
                          : "transparent")
                      }
                    >
                      <td
                        style={{
                          padding: "7px 6px",
                          fontWeight: 600,
                          color: C.text,
                        }}
                      >
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 5,
                          }}
                        >
                          {a.agent}
                          {risk && (
                            <span
                              style={{
                                fontSize: 9,
                                padding: "1px 5px",
                                borderRadius: 3,
                                background: `${C.rose}15`,
                                color: C.rose,
                                border: `1px solid ${C.rose}30`,
                              }}
                            >
                              coaching
                            </span>
                          )}
                        </div>
                      </td>
                      <td
                        style={{
                          padding: "7px 6px",
                          textAlign: "right",
                          fontFamily: "monospace",
                          color: C.text,
                        }}
                      >
                        {a.calls}
                      </td>
                      <td
                        style={{
                          padding: "7px 6px",
                          textAlign: "right",
                          fontFamily: "monospace",
                          color: C.muted,
                          fontSize: 10,
                        }}
                      >
                        {fmtMin(a.talkMin)}
                      </td>
                      <td style={{ padding: "7px 6px", textAlign: "right" }}>
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "flex-end",
                            gap: 5,
                          }}
                        >
                          <div style={{ width: 44 }}>
                            <MiniPbar v={a.res} color={pctColor(a.res)} />
                          </div>
                          <span
                            style={{
                              fontFamily: "monospace",
                              color: pctColor(a.res),
                              fontSize: 10,
                            }}
                          >
                            {a.res}%
                          </span>
                        </div>
                      </td>
                      <td
                        style={{
                          padding: "7px 6px",
                          textAlign: "right",
                          fontFamily: "monospace",
                          color: risk ? C.rose : C.emerald,
                          fontSize: 10,
                        }}
                      >
                        {a.kept}/{a.total}
                      </td>
                      <td style={{ padding: "7px 6px", textAlign: "right" }}>
                        <span
                          style={{
                            fontSize: 11,
                            fontWeight: 700,
                            color:
                              a.score >= 85
                                ? C.emerald
                                : a.score >= 70
                                  ? C.amber
                                  : C.rose,
                          }}
                        >
                          {a.score}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </SectionCard>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────── TAB: EXECUTIVE ──

function PanelExec({ data }: { data: DashboardLiveData }) {
  const { calls30d, yardsData, opsKpis: kpi } = data;
  const hmMax = Math.max(...HEATMAP.flat());
  const fulfillPct = Math.round(
    (kpi.promiseFulfilled / kpi.promiseTotal) * 100,
  );
  const totalCalls7d = SEED_CALLS_7D.reduce((s, d) => s + d.calls, 0);
  const [filterYard, setFilterYard] = useState<string | null>(null);
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 8,
        flex: 1,
        minHeight: 0,
        overflow: "hidden",
      }}
    >
      {/* ROW 1 — KPIs (6 cards, no Target) */}
      <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
        <KpiCard
          label="7-Day Calls"
          value={fmt(totalCalls7d)}
          sub="daily avg: 424"
          trend={{ val: "+12%", up: true }}
          icon={Phone}
          accent={C.blue}
        />
        <KpiCard
          label="Open Tickets"
          value={String(kpi.openTotal)}
          sub={`${kpi.overdue} overdue`}
          trend={{ val: "+4%", up: false }}
          icon={Activity}
          accent={C.amber}
        />
        <KpiCard
          label="Average Time"
          value={`${kpi.ahtMin}:${String(kpi.ahtSec).padStart(2, "0")}`}
          sub="minutes per call"
          trend={{ val: "−8%", up: true }}
          icon={Timer}
          accent={C.emerald}
        />
        <KpiCard
          label="Utilization"
          value="78%"
          sub="target 85%"
          trend={{ val: "+3%", up: true }}
          icon={UserCheck}
          accent={C.violet}
        />
        <KpiCard
          label="Campaign ROI"
          value="3.1×"
          sub="monthly average"
          trend={{ val: "+0.4×", up: true }}
          icon={TrendingUp}
          accent={C.cyan}
        />
        <KpiCard
          label="Promises Kept"
          value={`${fulfillPct}%`}
          sub={`${kpi.promiseFulfilled} of ${kpi.promiseTotal} this week`}
          trend={{ val: "−2%", up: false }}
          icon={Shield}
          accent={C.rose}
        />
      </div>

      {/* ROW 2 — 30 day area + bar yards */}
      <div style={{ display: "flex", gap: 8, flex: "0 0 auto", height: 200 }}>
        <SectionCard title="Call Trend — 30 Days " style={{ flex: 2 }}>
          <ResponsiveContainer width="100%" height={150}>
            <ComposedChart
              data={calls30d}
              margin={{ top: 4, right: 4, left: -22, bottom: 0 }}
            >
              <defs>
                <linearGradient id="g30" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={C.blue} stopOpacity={0.4} />
                  <stop offset="95%" stopColor={C.blue} stopOpacity={0.03} />
                </linearGradient>
              </defs>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke={C.border}
                vertical={false}
              />
              <XAxis
                dataKey="d"
                tick={{ fill: C.hint, fontSize: 9 }}
                axisLine={false}
                tickLine={false}
                interval={4}
              />
              <YAxis
                tick={{ fill: C.muted, fontSize: 10 }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip content={<LightTooltip />} />

              <ReferenceLine
                y={450}
                stroke={C.rose}
                strokeDasharray="4 4"
                strokeWidth={1.5}
                label={{
                  value: "Target",
                  position: "insideTopRight",
                  fill: C.rose,
                  fontSize: 9,
                  fontWeight: 600,
                }}
              />
              <Area
                type="monotone"
                dataKey="calls"
                stroke={C.blue}
                strokeWidth={2}
                fill="url(#g30)"
                name="Calls"
              />
            </ComposedChart>
          </ResponsiveContainer>
        </SectionCard>

        <SectionCard
          title="Calls by Yard"
          titleRight={
            filterYard ? (
              <FilterChip
                label={filterYard}
                onClear={() => setFilterYard(null)}
              />
            ) : undefined
          }
          style={{ flex: 1 }}
        >
          <ResponsiveContainer width="100%" height={150}>
            <BarChart
              data={yardsData}
              margin={{ top: 4, right: 4, left: -20, bottom: 0 }}
              onClick={(d) => {
                const y = d?.activePayload?.[0]?.payload?.yard as
                  | string
                  | undefined;
                if (y) setFilterYard(filterYard === y ? null : y);
              }}
              style={{ cursor: "pointer" }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                stroke={C.border}
                vertical={false}
              />
              <XAxis
                dataKey="yard"
                tick={{ fill: C.muted, fontSize: 9 }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fill: C.muted, fontSize: 9 }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip content={<LightTooltip />} />
              <Bar dataKey="calls" radius={[4, 4, 0, 0]} name="Calls">
                {yardsData.map((entry, i) => (
                  <Cell
                    key={i}
                    fill={[C.blue, C.violet, C.cyan, C.indigo, C.teal][i]}
                    opacity={filterYard && entry.yard !== filterYard ? 0.2 : 1}
                  />
                ))}
                <LabelList
                  dataKey="calls"
                  position="top"
                  style={{ fill: C.hint, fontSize: 9 }}
                />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </SectionCard>

        <SectionCard title="Open vs Overdue" style={{ flex: 1 }}>
          <ResponsiveContainer width="100%" height={150}>
            <BarChart
              data={yardsData}
              margin={{ top: 4, right: 4, left: -20, bottom: 0 }}
              barSize={10}
              onClick={(d) => {
                const y = d?.activePayload?.[0]?.payload?.yard as
                  | string
                  | undefined;
                if (y) setFilterYard(filterYard === y ? null : y);
              }}
              style={{ cursor: "pointer" }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                stroke={C.border}
                vertical={false}
              />
              <XAxis
                dataKey="yard"
                tick={{ fill: C.muted, fontSize: 9 }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fill: C.muted, fontSize: 9 }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip content={<LightTooltip />} />
              <Legend wrapperStyle={{ fontSize: 10, color: C.muted }} />
              <Bar
                dataKey="open"
                name="Open"
                fill={C.blue}
                radius={[3, 3, 0, 0]}
              >
                {yardsData.map((entry, i) => (
                  <Cell
                    key={i}
                    fill={C.blue}
                    opacity={filterYard && entry.yard !== filterYard ? 0.2 : 1}
                  />
                ))}
              </Bar>
              <Bar
                dataKey="ovd"
                name="Overdue"
                fill={C.rose}
                radius={[3, 3, 0, 0]}
              >
                {yardsData.map((entry, i) => (
                  <Cell
                    key={i}
                    fill={C.rose}
                    opacity={filterYard && entry.yard !== filterYard ? 0.2 : 1}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </SectionCard>
      </div>

      {/* ROW 3 — Heatmap + macro table */}
      <div style={{ display: "flex", gap: 8, flex: 1, minHeight: 0 }}>
        <SectionCard
          title="Heatmap — Call Volume by Hour × Day"
          style={{ flex: 3 }}
        >
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "28px repeat(24, 1fr)",
              gap: "3px",
            }}
          >
            <div />
            {Array.from({ length: 24 }, (_, h) => (
              <div
                key={h}
                style={{ fontSize: 8, textAlign: "center", color: C.hint }}
              >
                {h % 4 === 0 ? `${h}h` : ""}
              </div>
            ))}
            {HEATMAP.map((row, d) => [
              <div
                key={`l${d}`}
                style={{
                  fontSize: 9,
                  color: C.muted,
                  display: "flex",
                  alignItems: "center",
                }}
              >
                {HM_DAYS[d]}
              </div>,
              ...row.map((v, h) => {
                const t = v / hmMax;
                const l = Math.round(95 - t * 60);
                return (
                  <div
                    key={`${d}-${h}`}
                    title={`${HM_DAYS[d]} ${h}:00 → ${v}`}
                    style={{
                      height: 25,
                      borderRadius: 3,
                      background: `hsl(210 90% ${l}%)`,
                      opacity: 0.85 + t * 0.15,
                    }}
                  />
                );
              }),
            ])}
          </div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 4,
              marginTop: 6,
              fontSize: 9,
              color: C.muted,
            }}
          >
            <span>Low</span>
            {[0.1, 0.3, 0.5, 0.7, 0.9].map((t) => (
              <div
                key={t}
                style={{
                  width: 18,
                  height: 7,
                  borderRadius: 2,
                  background: `hsl(210 90% ${Math.round(95 - t * 60)}%)`,
                }}
              />
            ))}
            <span>High</span>
          </div>
        </SectionCard>

        <div
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            gap: 8,
            minHeight: 0,
          }}
        >
          <SectionCard title="Executive Metrics" style={{ flex: 1 }}>
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                height: "100%",
                justifyContent: "space-between",
              }}
            >
              {[
                {
                  label: "Avg Resolution Time",
                  val: "1d 4h",
                  trend: "−12%",
                  up: true,
                },
                {
                  label: "Ticket/Call Ratio",
                  val: "0.31",
                  trend: "+0.02",
                  up: false,
                },
                {
                  label: "Resolution Rate",
                  val: "82%",
                  trend: "+5%",
                  up: true,
                },
                {
                  label: "Lead → Enrollment",
                  val: "17.6%",
                  trend: "+2.1%",
                  up: true,
                },
                {
                  label: "Avg Campaign ROI",
                  val: "3.1×",
                  trend: "+0.4×",
                  up: true,
                },
                {
                  label: "Promises Kept (Month)",
                  val: "69%",
                  trend: "−2%",
                  up: false,
                },
              ].map((m) => (
                <div
                  key={m.label}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "5px 0",
                    borderBottom: `1px solid ${C.border}`,
                  }}
                >
                  <span style={{ fontSize: 11, color: C.muted }}>
                    {m.label}
                  </span>
                  <div
                    style={{ display: "flex", alignItems: "center", gap: 8 }}
                  >
                    <span
                      style={{
                        fontSize: 15,
                        fontWeight: 800,
                        color: C.text,
                        fontFamily: "'DM Sans', sans-serif",
                      }}
                    >
                      {m.val}
                    </span>
                    <span
                      style={{
                        fontSize: 10,
                        fontWeight: 600,
                        padding: "2px 6px",
                        borderRadius: 4,
                        background: m.up ? `${C.emerald}15` : `${C.rose}15`,
                        color: m.up ? C.emerald : C.rose,
                      }}
                    >
                      {m.trend}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </SectionCard>
          <SectionCard title="Executive SLAs" style={{ flexShrink: 0 }}>
            <div style={{ display: "flex", gap: 16 }}>
              {[
                { label: "Call Response Time", value: "12 seconds", ok: true },
                {
                  label: "Ticket Response Time",
                  value: "45 minutes",
                  ok: false,
                },
              ].map((sla) => (
                <div
                  key={sla.label}
                  style={{
                    flex: 1,
                    padding: "10px 12px",
                    borderRadius: 8,
                    background: sla.ok ? `${C.emerald}08` : `${C.rose}08`,
                    border: `1px solid ${sla.ok ? C.emerald : C.rose}25`,
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 6,
                      marginBottom: 4,
                    }}
                  >
                    <span
                      style={{
                        width: 8,
                        height: 8,
                        borderRadius: "50%",
                        background: sla.ok ? C.emerald : C.rose,
                        display: "inline-block",
                        boxShadow: `0 0 5px ${sla.ok ? C.emerald : C.rose}`,
                      }}
                    />
                    <span
                      style={{
                        fontSize: 10,
                        fontWeight: 600,
                        color: C.muted,
                        textTransform: "uppercase",
                        letterSpacing: "0.5px",
                      }}
                    >
                      {sla.label}
                    </span>
                  </div>
                  <div
                    style={{
                      fontSize: 22,
                      fontWeight: 800,
                      color: sla.ok ? C.emerald : C.rose,
                      fontFamily: "'DM Sans', sans-serif",
                      letterSpacing: "-0.5px",
                    }}
                  >
                    {sla.value}
                  </div>
                </div>
              ))}
            </div>
          </SectionCard>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────── TAB: MARKETING ──

function PanelMkt({ data }: { data: DashboardLiveData }) {
  const {
    dispositions,
    campaignData,
    leadFunnel,
    arFunnel,
    wellnessEnroll,
    smsData,
  } = data;
  const [filterDisp, setFilterDisp] = useState<string | null>(null);
  const [filterCampaign, setFilterCampaign] = useState<string | null>(null);
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 8,
        flex: 1,
        minHeight: 0,
        overflow: "hidden",
      }}
    >
      {/* ROW 1 — KPIs */}
      <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
        <KpiCard
          label="Calls by Location"
          value="2,642"
          sub="Miami leads: 842"
          trend={{ val: "+7%", up: true }}
          icon={MapPin}
          accent={C.blue}
        />
        <KpiCard
          label="Contact Rate"
          value="58.8%"
          sub="target: 65%"
          trend={{ val: "+3%", up: true }}
          icon={PhoneCall}
          accent={C.cyan}
        />
        <KpiCard
          label="Missed Call Rate"
          value="4.2%"
          sub="Peak window: 12pm-1pm"
          trend={{ val: "+0.3%", up: false }}
          icon={Phone}
          accent={C.violet}
        />
        <KpiCard
          label="Onboarding Compl."
          value="71%"
          sub="target: 75%"
          trend={{ val: "+6%", up: true }}
          icon={UserCheck}
          accent={C.emerald}
        />
        <KpiCard
          label="SMS Engagement"
          value="34%"
          sub="402 replies W4"
          trend={{ val: "+4%", up: true }}
          icon={MessageSquare}
          accent={C.amber}
        />
        <KpiCard
          label="Lead → Customer"
          value="17.6%"
          sub="218 of 1,240 leads"
          trend={{ val: "+2.1%", up: true }}
          icon={TrendingUp}
          accent={C.rose}
        />
      </div>

      {/* ROW 2 — Campaign + lead funnel + dispositions */}
      <div style={{ display: "flex", gap: 8, flex: "0 0 auto", height: 210 }}>
        {/* Campaign bar */}
        <SectionCard
          title="Contact Rate by Campaign"
          titleRight={
            filterCampaign ? (
              <FilterChip
                label={filterCampaign}
                onClear={() => setFilterCampaign(null)}
              />
            ) : undefined
          }
          style={{ flex: 1 }}
        >
          <ResponsiveContainer width="100%" height={155}>
            <BarChart
              data={campaignData}
              layout="vertical"
              margin={{ top: 0, right: 40, left: 10, bottom: 0 }}
              barSize={14}
              onClick={(d) => {
                const n = d?.activePayload?.[0]?.payload?.name as
                  | string
                  | undefined;
                if (n) setFilterCampaign(filterCampaign === n ? null : n);
              }}
              style={{ cursor: "pointer" }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                stroke={C.border}
                horizontal={false}
              />
              <XAxis
                type="number"
                tick={{ fill: C.muted, fontSize: 9 }}
                axisLine={false}
                tickLine={false}
                domain={[0, 100]}
                unit="%"
              />
              <YAxis
                type="category"
                dataKey="name"
                tick={{ fill: C.muted, fontSize: 10 }}
                axisLine={false}
                tickLine={false}
                width={70}
              />
              <Tooltip content={<LightTooltip />} />
              <Bar dataKey="rate" name="Contact rate" radius={[0, 4, 4, 0]}>
                {campaignData.map((r, i) => (
                  <Cell
                    key={i}
                    fill={
                      r.rate >= 65 ? C.emerald : r.rate >= 50 ? C.amber : C.rose
                    }
                    opacity={
                      filterCampaign && r.name !== filterCampaign ? 0.2 : 1
                    }
                  />
                ))}
                <LabelList
                  dataKey="rate"
                  position="right"
                  style={{ fill: C.muted, fontSize: 10 }}
                  formatter={(v: any) => `${v}%`}
                />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </SectionCard>

        {/* Lead funnel */}
        <SectionCard title="Lead Funnel" style={{ flex: 1 }}>
          <FunnelBars data={leadFunnel} />
        </SectionCard>

        {/* AR funnel */}
        <SectionCard title="AR — Collections" style={{ flex: 1 }}>
          <FunnelBars data={arFunnel} />
        </SectionCard>

        {/* New vs Returning Callers Donut */}
        <SectionCard
          title="New vs. Returning Callers"
          style={{ flex: "0 0 190px" }}
        >
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              height: "100%",
              gap: 6,
            }}
          >
            <div style={{ width: "100%", flex: 1, minHeight: 0 }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={CALLER_TYPE}
                    cx="50%"
                    cy="50%"
                    innerRadius={30}
                    outerRadius={55}
                    dataKey="value"
                    paddingAngle={3}
                  >
                    {CALLER_TYPE.map((d, i) => (
                      <Cell
                        key={i}
                        fill={d.color}
                        stroke={C.card}
                        strokeWidth={2}
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    content={<LightTooltip />}
                    formatter={(v: any) => [`${v}%`, ""]}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div style={{ display: "flex", gap: 12, flexShrink: 0 }}>
              {CALLER_TYPE.map((d) => (
                <div
                  key={d.name}
                  style={{ display: "flex", alignItems: "center", gap: 5 }}
                >
                  <div
                    style={{
                      width: 9,
                      height: 9,
                      borderRadius: 3,
                      background: d.color,
                    }}
                  />
                  <span style={{ fontSize: 10, color: C.muted }}>{d.name}</span>
                  <span
                    style={{
                      fontSize: 11,
                      fontWeight: 700,
                      color: C.text,
                      fontFamily: "'DM Sans', sans-serif",
                    }}
                  >
                    {d.value}%
                  </span>
                </div>
              ))}
            </div>
          </div>
        </SectionCard>

        {/* Dispositions Pie - FIXED */}
        <SectionCard
          title="Lead Disposition"
          titleRight={
            filterDisp ? (
              <FilterChip
                label={filterDisp}
                onClear={() => setFilterDisp(null)}
              />
            ) : undefined
          }
          style={{ flex: "0 0 280px" }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              height: "100%",
              gap: 12,
            }}
          >
            <div style={{ width: 130, height: 155 }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={dispositions}
                    cx="50%"
                    cy="50%"
                    innerRadius={35}
                    outerRadius={60}
                    dataKey="value"
                    paddingAngle={2}
                    onClick={(d) =>
                      setFilterDisp(
                        filterDisp === d.name ? null : d.name,
                      )
                    }
                    style={{ cursor: "pointer" }}
                  >
                    {dispositions.map((d, i) => (
                      <Cell
                        key={i}
                        fill={d.color}
                        stroke={C.card}
                        strokeWidth={2}
                        opacity={
                          filterDisp && d.name !== filterDisp ? 0.2 : 1
                        }
                      />
                    ))}
                  </Pie>
                  <Tooltip content={<LightTooltip />} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 10,
                flex: 1,
              }}
            >
              {dispositions.map((d) => {
                const total = dispositions.reduce(
                  (sum, item) => sum + item.value,
                  0,
                );
                const pct = ((d.value / total) * 100).toFixed(1);
                return (
                  <div key={d.name}>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 6,
                        marginBottom: 3,
                      }}
                    >
                      <div
                        style={{
                          width: 10,
                          height: 10,
                          borderRadius: 3,
                          background: d.color,
                          flexShrink: 0,
                        }}
                      />
                      <span
                        style={{ fontSize: 11, fontWeight: 600, color: C.text }}
                      >
                        {d.name}
                      </span>
                      <span
                        style={{
                          fontSize: 11,
                          color: C.muted,
                          marginLeft: "auto",
                        }}
                      >
                        {pct}%
                      </span>
                    </div>
                    <div style={{ marginLeft: 16 }}>
                      <span
                        style={{
                          fontSize: 15,
                          fontWeight: 700,
                          color: C.text,
                          fontFamily: "'DM Sans', sans-serif",
                        }}
                      >
                        {fmt(d.value)}
                      </span>
                      <span
                        style={{ fontSize: 10, color: C.hint, marginLeft: 4 }}
                      >
                        leads
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </SectionCard>
      </div>

      {/* ROW 3 — Wellness line + SMS composed + campaign ROI scatter */}
      <div style={{ display: "flex", gap: 8, flex: 1, minHeight: 0 }}>
        <SectionCard title="Wellness — Enrollments by Hour" style={{ flex: 1 }}>
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={wellnessEnroll}
              margin={{ top: 4, right: 4, left: -20, bottom: 0 }}
            >
              <defs>
                <linearGradient id="gW" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={C.rose} stopOpacity={0.4} />
                  <stop offset="95%" stopColor={C.rose} stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke={C.border}
                vertical={false}
              />
              <XAxis
                dataKey="h"
                tick={{ fill: C.muted, fontSize: 10 }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fill: C.muted, fontSize: 10 }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip content={<LightTooltip />} />
              <Area
                type="monotone"
                dataKey="v"
                stroke={C.rose}
                strokeWidth={2}
                fill="url(#gW)"
                name="Enrollments"
                dot={{ fill: C.rose, r: 3, strokeWidth: 0 }}
                activeDot={{ r: 5 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </SectionCard>

        <SectionCard title="SMS — Sent vs Replies + Rate" style={{ flex: 1 }}>
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart
              data={smsData}
              margin={{ top: 4, right: 4, left: -20, bottom: 0 }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                stroke={C.border}
                vertical={false}
              />
              <XAxis
                dataKey="week"
                tick={{ fill: C.muted, fontSize: 10 }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                yAxisId="left"
                tick={{ fill: C.muted, fontSize: 9 }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                yAxisId="right"
                orientation="right"
                tick={{ fill: C.muted, fontSize: 9 }}
                axisLine={false}
                tickLine={false}
                unit="%"
                domain={[0, 100]}
              />
              <Tooltip content={<LightTooltip />} />
              <Legend wrapperStyle={{ fontSize: 10, color: C.muted }} />
              <Bar
                yAxisId="left"
                dataKey="sent"
                name="Sent"
                fill={C.blue}
                radius={[3, 3, 0, 0]}
              />
              <Bar
                yAxisId="left"
                dataKey="replied"
                name="Replied"
                fill={C.amber}
                radius={[3, 3, 0, 0]}
              />
              <Line
                yAxisId="right"
                type="monotone"
                dataKey="rate"
                name="Reply Rate %"
                stroke={C.cyan}
                strokeWidth={2}
                dot={{ fill: C.cyan, r: 3 }}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </SectionCard>

        <SectionCard title="Campaigns — ROI vs Conversions" style={{ flex: 1 }}>
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={C.border} />
              <XAxis
                type="number"
                dataKey="conv"
                name="Conversions"
                tick={{ fill: C.muted, fontSize: 9 }}
                axisLine={false}
                tickLine={false}
                label={{
                  value: "Conv.",
                  fill: C.hint,
                  fontSize: 9,
                  position: "insideBottom",
                  offset: -2,
                }}
              />
              <YAxis
                type="number"
                dataKey="roi"
                name="ROI"
                tick={{ fill: C.muted, fontSize: 9 }}
                axisLine={false}
                tickLine={false}
                label={{
                  value: "ROI×",
                  fill: C.hint,
                  fontSize: 9,
                  angle: -90,
                  position: "insideLeft",
                }}
              />
              <Tooltip content={<LightTooltip />} />
              <Scatter data={campaignData} name="Campaigns">
                {campaignData.map((r, i) => (
                  <Cell
                    key={i}
                    fill={[C.blue, C.emerald, C.amber, C.rose][i]}
                    opacity={
                      filterCampaign && r.name !== filterCampaign ? 0.15 : 1
                    }
                  />
                ))}
              </Scatter>
            </ComposedChart>
          </ResponsiveContainer>
          <div
            style={{ display: "flex", gap: 8, marginTop: 4, flexWrap: "wrap" }}
          >
            {campaignData.map((r, i) => (
              <div
                key={r.name}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 4,
                  cursor: "pointer",
                  opacity:
                    filterCampaign && r.name !== filterCampaign ? 0.3 : 1,
                  transition: "opacity .15s",
                }}
                onClick={() =>
                  setFilterCampaign(filterCampaign === r.name ? null : r.name)
                }
              >
                <div
                  style={{
                    width: 7,
                    height: 7,
                    borderRadius: "50%",
                    background: [C.blue, C.emerald, C.amber, C.rose][i],
                  }}
                />
                <span style={{ fontSize: 9, color: C.muted }}>{r.name}</span>
              </div>
            ))}
          </div>
        </SectionCard>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────── PAGE ROOT ───

type Tab = "ops" | "exec" | "mkt";
const TABS: { id: Tab; label: string; icon: React.ReactNode }[] = [
  { id: "ops", label: "Operations", icon: <Headphones size={13} /> },
  { id: "exec", label: "Executive", icon: <BarChart3 size={13} /> },
  { id: "mkt", label: "Marketing", icon: <Sparkles size={13} /> },
];

export default function DashboardProPage() {
  const [tab, setTab] = useState<Tab>("ops");
  const live = useDashboardData();

  return (
    <div
      style={{
        height: "calc(100vh - 64px)",
        display: "flex",
        flexDirection: "column",
        background: C.bg,
        color: C.text,
        fontFamily: "'DM Sans', system-ui, sans-serif",
        overflow: "hidden",
        padding: "10px 12px",
        gap: 10,
      }}
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,400;0,9..40,600;0,9..40,800&display=swap');
        @keyframes pulse2 { 0%,100%{opacity:1;box-shadow: 0 0 5px currentColor} 50%{opacity:.5;box-shadow: 0 0 2px currentColor} }
        @keyframes kpiFlash { 0%{background:rgba(99,102,241,0.18);} 100%{background:transparent;} }
        ::-webkit-scrollbar { width: 6px; height: 6px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: #E2E8F0; border-radius: 9999px; }
        ::-webkit-scrollbar-thumb:hover { background: #CBD5E1; }
      `}</style>

      {/* ── NAV BAR ── */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 10,
          flexShrink: 0,
        }}
      >
        {/* Tabs */}
        <div
          style={{
            display: "flex",
            gap: 2,
            background: C.surface,
            border: `1px solid ${C.border}`,
            borderRadius: 10,
            padding: 3,
          }}
        >
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                fontSize: 12,
                fontWeight: 600,
                padding: "6px 14px",
                borderRadius: 8,
                border: "none",
                cursor: "pointer",
                transition: "all .18s",
                background: tab === t.id ? C.card : "transparent",
                color: tab === t.id ? C.text : C.muted,
                boxShadow:
                  tab === t.id
                    ? "0 1px 4px rgba(0,0,0,0.08), inset 0 0 0 1px rgba(0,0,0,0.05)"
                    : "none",
              }}
            >
              {t.icon} {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── PANEL ── */}
      {tab === "ops" && <PanelOps data={live} />}
      {tab === "exec" && <PanelExec data={live} />}
      {tab === "mkt" && <PanelMkt data={live} />}
    </div>
  );
}
