"use client";

/**
 * Dashboard Mockups — Test Page
 *
 * Mockups de los 3 dashboards propuestos:
 *   1. Operations Management Dashboard
 *   2. Executive Leadership Dashboard
 *   3. Marketing Views / Metrics
 *
 * NOTA: Todos los datos son mock (estáticos). La entidad `Ticket` tendrá
 * nuevos campos (callId, followUpDueDate, followUpAssignedToId) que aquí
 * se representan visualmente como columnas/medidas derivadas.
 */

import { useMemo, useState } from "react";
import KPICard from "@/components/dashboard/kpi-card";
import ChartCard from "@/components/dashboard/chart-card";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Phone,
  PhoneCall,
  PhoneIncoming,
  Users,
  UserCheck,
  Clock,
  Timer,
  CheckCircle2,
  AlertTriangle,
  Target,
  TrendingUp,
  TrendingDown,
  Ticket as TicketIcon,
  Mail,
  MessageSquare,
  DollarSign,
  HeartPulse,
  Sparkles,
  CalendarClock,
  Activity,
  Headphones,
  BarChart3,
  MapPin,
  Info,
} from "lucide-react";
import {
  Bar,
  BarChart as RBarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  Area,
  AreaChart,
  Funnel,
  FunnelChart,
  LabelList,
} from "recharts";

// ───────────────────────────────────────────────────────────── MOCK DATA ──

const AGENTS_DAILY = [
  {
    agent: "María G.",
    calls: 54,
    talkMin: 312,
    wrapMin: 58,
    resolutionPct: 88,
    promisesKept: 18,
    promisesTotal: 20,
  },
  {
    agent: "Carlos P.",
    calls: 48,
    talkMin: 287,
    wrapMin: 72,
    resolutionPct: 81,
    promisesKept: 12,
    promisesTotal: 17,
  },
  {
    agent: "Lucía R.",
    calls: 61,
    talkMin: 345,
    wrapMin: 49,
    resolutionPct: 92,
    promisesKept: 22,
    promisesTotal: 23,
  },
  {
    agent: "Diego M.",
    calls: 37,
    talkMin: 201,
    wrapMin: 89,
    resolutionPct: 64,
    promisesKept: 6,
    promisesTotal: 14,
  },
  {
    agent: "Sofía L.",
    calls: 52,
    talkMin: 298,
    wrapMin: 55,
    resolutionPct: 85,
    promisesKept: 16,
    promisesTotal: 19,
  },
  {
    agent: "Javier T.",
    calls: 43,
    talkMin: 252,
    wrapMin: 63,
    resolutionPct: 77,
    promisesKept: 10,
    promisesTotal: 15,
  },
];

const LIVE_QUEUE = [
  { type: "Active", count: 7, color: "bg-emerald-500" },
  { type: "In Queue", count: 12, color: "bg-amber-500" },
  { type: "Available", count: 5, color: "bg-sky-500" },
  { type: "On Break", count: 2, color: "bg-zinc-400" },
];

const ACTIVE_CALLS = [
  {
    id: "C-8821",
    agent: "María G.",
    customer: "R. Alvarez",
    line: "AR — Line 1",
    duration: "04:12",
    status: "Active",
  },
  {
    id: "C-8822",
    agent: "Lucía R.",
    customer: "J. Martinez",
    line: "Wellness — L3",
    duration: "02:45",
    status: "Active",
  },
  {
    id: "C-8823",
    agent: "Sofía L.",
    customer: "P. Rojas",
    line: "Leads — L2",
    duration: "07:08",
    status: "Active",
  },
  {
    id: "—",
    agent: "—",
    customer: "K. Ng",
    line: "AR — Line 1",
    duration: "00:42",
    status: "Queued",
  },
  {
    id: "—",
    agent: "—",
    customer: "T. Villa",
    line: "Leads — L2",
    duration: "01:12",
    status: "Queued",
  },
];

const CALLS_BY_DAY = [
  { day: "Mon", calls: 412 },
  { day: "Tue", calls: 487 },
  { day: "Wed", calls: 521 },
  { day: "Thu", calls: 498 },
  { day: "Fri", calls: 563 },
  { day: "Sat", calls: 298 },
  { day: "Sun", calls: 187 },
];

const CALLS_BY_YARD = [
  { yard: "Miami", calls: 842, avgHandle: 5.2 },
  { yard: "Orlando", calls: 621, avgHandle: 4.8 },
  { yard: "Tampa", calls: 514, avgHandle: 6.1 },
  { yard: "Jacksonville", calls: 389, avgHandle: 5.7 },
  { yard: "Atlanta", calls: 276, avgHandle: 4.3 },
];

const TICKETS_BY_YARD = [
  { yard: "Miami", open: 42, overdue: 6 },
  { yard: "Orlando", open: 31, overdue: 3 },
  { yard: "Tampa", open: 28, overdue: 7 },
  { yard: "Jacksonville", open: 19, overdue: 2 },
  { yard: "Atlanta", open: 14, overdue: 1 },
];

const OVERDUE_BY_AGENT = [
  { agent: "Diego M.", overdue: 8 },
  { agent: "Carlos P.", overdue: 5 },
  { agent: "Javier T.", overdue: 4 },
  { agent: "Sofía L.", overdue: 2 },
  { agent: "María G.", overdue: 1 },
];

// Heatmap: hour (0-23) × weekday
const HEATMAP = Array.from({ length: 7 }, (_, d) =>
  Array.from({ length: 24 }, (_, h) => {
    // synthetic peak around 10-12 and 15-17
    const base =
      Math.max(0, 40 - Math.abs(11 - h) * 4) +
      Math.max(0, 30 - Math.abs(16 - h) * 5);
    const weekend = d === 5 || d === 6 ? 0.4 : 1;
    return Math.round(base * weekend + Math.random() * 10);
  }),
);
const DAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

const CAMPAIGN_CONTACT_RATE = [
  { campaign: "AR Q1", contactRate: 68, conversions: 42, roi: 3.2 },
  { campaign: "Wellness Spring", contactRate: 54, conversions: 88, roi: 4.1 },
  { campaign: "Leads Hot-List", contactRate: 72, conversions: 31, roi: 2.4 },
  { campaign: "Winback", contactRate: 41, conversions: 19, roi: 1.8 },
];

const AR_CAMPAIGN = [
  { name: "Dials", value: 4820 },
  { name: "Contacts", value: 1842 },
  { name: "PTPs captured", value: 612 },
  { name: "Payments kept", value: 388 },
];

const LEAD_FUNNEL = [
  { name: "Leads received", value: 1240, fill: "var(--chart-1)" },
  { name: "Contacted", value: 864, fill: "var(--chart-2)" },
  { name: "Qualified", value: 512, fill: "var(--chart-3)" },
  { name: "Enrolled", value: 218, fill: "var(--chart-4)" },
];

const DISPOSITIONS = [
  { name: "Hot", value: 142, fill: "hsl(0 80% 60%)" },
  { name: "Warm", value: 286, fill: "hsl(35 90% 58%)" },
  { name: "Cold", value: 612, fill: "hsl(210 60% 60%)" },
];

const WELLNESS_HOURS = [
  { hour: "9a", enrollments: 12 },
  { hour: "10a", enrollments: 21 },
  { hour: "11a", enrollments: 28 },
  { hour: "12p", enrollments: 19 },
  { hour: "1p", enrollments: 14 },
  { hour: "2p", enrollments: 23 },
  { hour: "3p", enrollments: 31 },
  { hour: "4p", enrollments: 26 },
  { hour: "5p", enrollments: 17 },
];

const SMS_ENGAGEMENT = [
  { day: "W1", sent: 820, replied: 210 },
  { day: "W2", sent: 940, replied: 284 },
  { day: "W3", sent: 1012, replied: 331 },
  { day: "W4", sent: 1180, replied: 402 },
];

// ───────────────────────────────────────────────── HELPERS / PRIMITIVES ──

function fmtMin(mins: number) {
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

function SectionTitle({
  title,
  subtitle,
  icon: Icon,
}: {
  title: string;
  subtitle?: string;
  icon?: React.ComponentType<{ className?: string }>;
}) {
  return (
    <div className="flex items-center gap-2 mb-1">
      {Icon && (
        <div className="p-1.5 rounded-md bg-primary/10 text-primary">
          <Icon className="h-3.5 w-3.5" />
        </div>
      )}
      <h2 className="text-sm font-bold tracking-tight">{title}</h2>
      {subtitle && (
        <span className="text-xs text-muted-foreground hidden md:inline">
          · {subtitle}
        </span>
      )}
    </div>
  );
}

function StatusDot({ color }: { color: string }) {
  return (
    <span
      className={`inline-block h-2.5 w-2.5 rounded-full ${color} animate-pulse`}
    />
  );
}

function MiniChart({
  title,
  children,
  height = 200,
}: {
  title: string;
  children: React.ReactNode;
  height?: number;
}) {
  return (
    <Card className="border-none glass-card overflow-hidden">
      <CardHeader className="py-2 px-4 border-b border-border/5">
        <CardTitle className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="px-3 pt-2 pb-2" style={{ height }}>
        {children}
      </CardContent>
    </Card>
  );
}

function MiniKPI({
  title,
  value,
  icon: Icon,
  color,
  trend,
  trendUp,
}: {
  title: string;
  value: string | number;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  trend?: string;
  trendUp?: boolean;
}) {
  return (
    <Card className="border-none glass-card">
      <CardContent className="py-2 px-3 flex items-center gap-2">
        <div className={`p-1.5 rounded-md ${color} bg-opacity-15`}>
          <Icon className={`h-3.5 w-3.5 ${color.replace("bg-", "text-")}`} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground truncate">
            {title}
          </p>
          <div className="flex items-baseline gap-1.5">
            <span className="text-base font-bold leading-tight">{value}</span>
            {trend && (
              <span
                className={`text-[10px] font-bold ${
                  trendUp ? "text-emerald-600" : "text-rose-600"
                }`}
              >
                {trend}
              </span>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function Heatmap() {
  const max = Math.max(...HEATMAP.flat());
  return (
    <div className="overflow-x-auto">
      <div className="min-w-[640px]">
        <div
          className="grid"
          style={{ gridTemplateColumns: "48px repeat(24, 1fr)", gap: 3 }}
        >
          <div />
          {Array.from({ length: 24 }, (_, h) => (
            <div
              key={h}
              className="text-[10px] text-center text-muted-foreground"
            >
              {h % 3 === 0 ? `${h}h` : ""}
            </div>
          ))}
          {HEATMAP.flatMap((row, d) => [
            <div
              key={`label-${d}`}
              className="text-xs font-semibold text-muted-foreground flex items-center"
            >
              {DAY_LABELS[d]}
            </div>,
            ...row.map((v, h) => {
              const intensity = v / max;
              return (
                <div
                  key={`${d}-${h}`}
                  title={`${DAY_LABELS[d]} ${h}:00 → ${v} calls`}
                  className="h-6 rounded-[3px] transition-transform hover:scale-110"
                  style={{
                    background: `hsl(210 80% ${95 - intensity * 55}%)`,
                  }}
                />
              );
            }),
          ])}
        </div>
        <div className="flex items-center gap-2 mt-4 text-xs text-muted-foreground">
          <span>Low</span>
          <div className="flex gap-0.5">
            {[0.1, 0.3, 0.5, 0.7, 0.9].map((i) => (
              <div
                key={i}
                className="h-3 w-6 rounded-sm"
                style={{ background: `hsl(210 80% ${95 - i * 55}%)` }}
              />
            ))}
          </div>
          <span>High</span>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────── PAGE ──

export default function DashboardMockupsPage() {
  const [tab, setTab] = useState("operations");

  return (
    <div className="px-4 py-2 space-y-2 max-w-[1600px] mx-auto">
      {/* Header + Tabs — single compact row */}
      <Tabs value={tab} onValueChange={setTab} className="w-full">
        <div className="flex items-center gap-3 flex-wrap">
          <Badge
            variant="outline"
            className="bg-amber-500/10 text-amber-700 border-amber-500/30 text-[10px] py-0 h-5"
          >
            <Sparkles className="h-3 w-3 mr-1" /> MOCKUP
          </Badge>
          <h1 className="text-sm font-bold tracking-tight whitespace-nowrap">
            Dashboard Mockups
          </h1>
          <Popover>
            <PopoverTrigger asChild>
              <button
                type="button"
                className="inline-flex items-center justify-center h-6 w-6 rounded-full text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                aria-label="Ver detalles del mockup"
              >
                <Info className="h-3.5 w-3.5" />
              </button>
            </PopoverTrigger>
            <PopoverContent align="start" className="w-80 text-xs space-y-2">
              <p className="font-semibold text-sm">Acerca de esta página</p>
              <p className="text-muted-foreground">
                Prototipos visuales de los 3 paneles propuestos. Todos los datos
                son estáticos (mock).
              </p>
              <div>
                <p className="font-semibold mb-1">Ticket — campos nuevos:</p>
                <ul className="space-y-1 font-mono text-[11px]">
                  <li>
                    <code className="bg-muted px-1 py-0.5 rounded">callId</code>{" "}
                    — Call que originó el ticket
                  </li>
                  <li>
                    <code className="bg-muted px-1 py-0.5 rounded">
                      followUpDueDate
                    </code>{" "}
                    — deadline del callback
                  </li>
                  <li>
                    <code className="bg-muted px-1 py-0.5 rounded">
                      followUpAssignedToId
                    </code>{" "}
                    — agente responsable
                  </li>
                </ul>
              </div>
            </PopoverContent>
          </Popover>

          <TabsList className="ml-auto h-8 p-0.5">
            <TabsTrigger
              value="operations"
              className="py-1 px-3 flex items-center gap-1.5 text-xs"
            >
              <Headphones className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Operations</span>
            </TabsTrigger>
            <TabsTrigger
              value="executive"
              className="py-1 px-3 flex items-center gap-1.5 text-xs"
            >
              <BarChart3 className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Executive</span>
            </TabsTrigger>
            <TabsTrigger
              value="marketing"
              className="py-1 px-3 flex items-center gap-1.5 text-xs"
            >
              <Target className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Marketing</span>
            </TabsTrigger>
          </TabsList>
        </div>

        {/* ═══════════════════════════════════════════ 1. OPERATIONS ═══ */}
        <TabsContent value="operations" className="space-y-2 mt-2">
          {/* Live Queue */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {LIVE_QUEUE.map((q) => (
              <Card key={q.type} className="border-none glass-card">
                <CardContent className="py-3 px-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                        {q.type}
                      </p>
                      <p className="text-2xl font-bold mt-0.5">{q.count}</p>
                    </div>
                    <StatusDot color={q.color} />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Active calls table */}
          <Card className="border-none glass-card">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <PhoneCall className="h-4 w-4 text-primary" />
                Live Queue — Active & Queued Calls
              </CardTitle>
              <CardDescription>
                Actualización en tiempo real vía WebSocket.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Call ID</TableHead>
                    <TableHead>Agent</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Line</TableHead>
                    <TableHead>Duration</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {ACTIVE_CALLS.map((c, i) => (
                    <TableRow key={i}>
                      <TableCell className="font-mono text-xs">
                        {c.id}
                      </TableCell>
                      <TableCell className="font-medium">{c.agent}</TableCell>
                      <TableCell>{c.customer}</TableCell>
                      <TableCell className="text-muted-foreground">
                        {c.line}
                      </TableCell>
                      <TableCell className="font-mono">{c.duration}</TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={
                            c.status === "Active"
                              ? "bg-emerald-500/10 text-emerald-700 border-emerald-500/30"
                              : "bg-amber-500/10 text-amber-700 border-amber-500/30"
                          }
                        >
                          {c.status}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* Daily metrics per agent */}
          <Card className="border-none glass-card">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Users className="h-4 w-4 text-primary" />
                Daily Metrics by Agent
              </CardTitle>
              <CardDescription>
                Calls, talk time, wrap-up time, resolution & callback promises.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Agent</TableHead>
                    <TableHead className="text-right">Calls</TableHead>
                    <TableHead className="text-right">Talk time</TableHead>
                    <TableHead className="text-right">Wrap-up</TableHead>
                    <TableHead>Resolution</TableHead>
                    <TableHead>Promises kept</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {AGENTS_DAILY.map((a) => {
                    const keptPct = Math.round(
                      (a.promisesKept / a.promisesTotal) * 100,
                    );
                    const needsTraining = keptPct < 70;
                    return (
                      <TableRow key={a.agent}>
                        <TableCell className="font-medium flex items-center gap-2">
                          {a.agent}
                          {needsTraining && (
                            <Badge
                              variant="outline"
                              className="bg-rose-500/10 text-rose-700 border-rose-500/30 text-[10px]"
                            >
                              Needs coaching
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-right font-mono">
                          {a.calls}
                        </TableCell>
                        <TableCell className="text-right font-mono">
                          {fmtMin(a.talkMin)}
                        </TableCell>
                        <TableCell className="text-right font-mono">
                          {fmtMin(a.wrapMin)}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Progress
                              value={a.resolutionPct}
                              className="h-2 w-24"
                            />
                            <span className="text-xs font-semibold w-10">
                              {a.resolutionPct}%
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <span
                            className={`text-sm font-semibold ${needsTraining ? "text-rose-600" : "text-emerald-600"}`}
                          >
                            {a.promisesKept}/{a.promisesTotal} ({keptPct}%)
                          </span>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* Accountability — callback promises */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
            <Card className="border-none glass-card">
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <CalendarClock className="h-4 w-4 text-primary" />
                  Callback Promise Accountability
                </CardTitle>
                <CardDescription>
                  Usa los campos nuevos{" "}
                  <code className="text-[10px]">followUpDueDate</code> y{" "}
                  <code className="text-[10px]">followUpAssignedToId</code> del
                  Ticket.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-3 gap-3 text-center">
                  <div className="p-4 rounded-xl bg-emerald-500/10">
                    <CheckCircle2 className="h-5 w-5 text-emerald-600 mx-auto mb-1" />
                    <p className="text-2xl font-bold text-emerald-700">84</p>
                    <p className="text-[11px] uppercase text-emerald-700/80">
                      Kept
                    </p>
                  </div>
                  <div className="p-4 rounded-xl bg-amber-500/10">
                    <Clock className="h-5 w-5 text-amber-600 mx-auto mb-1" />
                    <p className="text-2xl font-bold text-amber-700">23</p>
                    <p className="text-[11px] uppercase text-amber-700/80">
                      Pending
                    </p>
                  </div>
                  <div className="p-4 rounded-xl bg-rose-500/10">
                    <AlertTriangle className="h-5 w-5 text-rose-600 mx-auto mb-1" />
                    <p className="text-2xl font-bold text-rose-700">15</p>
                    <p className="text-[11px] uppercase text-rose-700/80">
                      Missed
                    </p>
                  </div>
                </div>
                <Separator />
                <div>
                  <p className="text-sm font-semibold mb-2">
                    Monthly kept rate
                  </p>
                  <div className="flex items-center gap-3">
                    <Progress value={69} className="h-3 flex-1" />
                    <span className="font-bold text-lg">69%</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <MiniChart title="Overdue Tickets by Agent">
              <ResponsiveContainer width="100%" height="100%">
                <RBarChart
                  data={OVERDUE_BY_AGENT}
                  layout="vertical"
                  margin={{ left: 20 }}
                >
                  <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                  <XAxis type="number" />
                  <YAxis type="category" dataKey="agent" width={80} />
                  <Tooltip />
                  <Bar
                    dataKey="overdue"
                    fill="hsl(0 80% 60%)"
                    radius={[0, 6, 6, 0]}
                  />
                </RBarChart>
              </ResponsiveContainer>
            </MiniChart>
          </div>
        </TabsContent>

        {/* ═════════════════════════════════════════════ 2. EXECUTIVE ═══ */}
        <TabsContent value="executive" className="space-y-2 mt-2">
          {/* Top KPIs */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            <MiniKPI
              title="Total calls (7d)"
              value="2,966"
              icon={Phone}
              color="bg-primary"
              trend="+12%"
              trendUp
            />
            <MiniKPI
              title="Open tickets"
              value="134"
              icon={TicketIcon}
              color="bg-amber-500"
              trend="+4%"
              trendUp={false}
            />
            <MiniKPI
              title="Avg handle time"
              value="5:24"
              icon={Timer}
              color="bg-sky-500"
              trend="-8%"
              trendUp
            />
            <MiniKPI
              title="Agent utilization"
              value="78%"
              icon={UserCheck}
              color="bg-emerald-500"
              trend="+3%"
              trendUp
            />
          </div>

          {/* Daily call KPIs */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
            <MiniChart title="Call volume — last 7 days">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={CALLS_BY_DAY}>
                  <defs>
                    <linearGradient id="cv" x1="0" y1="0" x2="0" y2="1">
                      <stop
                        offset="0%"
                        stopColor="hsl(210 90% 60%)"
                        stopOpacity={0.6}
                      />
                      <stop
                        offset="100%"
                        stopColor="hsl(210 90% 60%)"
                        stopOpacity={0.05}
                      />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                  <XAxis dataKey="day" />
                  <YAxis />
                  <Tooltip />
                  <Area
                    type="monotone"
                    dataKey="calls"
                    stroke="hsl(210 90% 50%)"
                    fill="url(#cv)"
                    strokeWidth={2}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </MiniChart>

            <MiniChart title="Call volume by yard">
              <ResponsiveContainer width="100%" height="100%">
                <RBarChart data={CALLS_BY_YARD}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                  <XAxis dataKey="yard" />
                  <YAxis />
                  <Tooltip />
                  <Bar
                    dataKey="calls"
                    fill="hsl(260 70% 60%)"
                    radius={[6, 6, 0, 0]}
                  >
                    <LabelList
                      dataKey="calls"
                      position="top"
                      className="text-[10px]"
                    />
                  </Bar>
                </RBarChart>
              </ResponsiveContainer>
            </MiniChart>
          </div>

          {/* Weekly handle time + utilization */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
            <Card className="border-none glass-card lg:col-span-2">
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Timer className="h-4 w-4 text-primary" />
                  Avg handle time by line (weekly)
                </CardTitle>
              </CardHeader>
              <CardContent className="h-[170px]">
                <ResponsiveContainer width="100%" height="100%">
                  <RBarChart data={CALLS_BY_YARD}>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                    <XAxis dataKey="yard" />
                    <YAxis
                      label={{
                        value: "min",
                        angle: -90,
                        position: "insideLeft",
                      }}
                    />
                    <Tooltip />
                    <Bar
                      dataKey="avgHandle"
                      fill="hsl(160 70% 50%)"
                      radius={[6, 6, 0, 0]}
                    />
                  </RBarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card className="border-none glass-card">
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                  Callback promises kept (weekly)
                </CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col items-center justify-center h-[170px]">
                <div className="relative">
                  <svg width="180" height="180" viewBox="0 0 180 180">
                    <circle
                      cx="90"
                      cy="90"
                      r="75"
                      fill="none"
                      stroke="hsl(var(--muted))"
                      strokeWidth="14"
                    />
                    <circle
                      cx="90"
                      cy="90"
                      r="75"
                      fill="none"
                      stroke="hsl(160 70% 45%)"
                      strokeWidth="14"
                      strokeDasharray={`${(69 / 100) * 2 * Math.PI * 75} ${2 * Math.PI * 75}`}
                      strokeLinecap="round"
                      transform="rotate(-90 90 90)"
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <p className="text-4xl font-bold">69%</p>
                    <p className="text-xs text-muted-foreground">kept</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Monthly heatmap */}
          <Card className="border-none glass-card">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Activity className="h-4 w-4 text-primary" />
                Peak call hours heatmap (monthly)
              </CardTitle>
              <CardDescription>
                Day × hour — intensidad = volumen de llamadas.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Heatmap />
            </CardContent>
          </Card>

          {/* Ticket KPIs */}
          <SectionTitle title="Ticket KPIs" icon={TicketIcon} />
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
            <MiniChart title="Open tickets + overdue by yard (daily)">
              <ResponsiveContainer width="100%" height="100%">
                <RBarChart data={TICKETS_BY_YARD}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                  <XAxis dataKey="yard" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar
                    dataKey="open"
                    fill="hsl(210 80% 55%)"
                    radius={[6, 6, 0, 0]}
                  />
                  <Bar
                    dataKey="overdue"
                    fill="hsl(0 80% 60%)"
                    radius={[6, 6, 0, 0]}
                  />
                </RBarChart>
              </ResponsiveContainer>
            </MiniChart>

            <Card className="border-none glass-card">
              <CardHeader>
                <CardTitle className="text-base">Macro metrics</CardTitle>
                <CardDescription>Weekly/Monthly consolidated.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-5">
                {[
                  {
                    label: "Ticket resolution time (avg)",
                    value: "1d 4h",
                    trend: "-12%",
                    trendUp: true,
                  },
                  {
                    label: "Tickets vs. calls ratio",
                    value: "0.31",
                    trend: "+0.02",
                    trendUp: false,
                  },
                  {
                    label: "Resolution rate by line",
                    value: "82%",
                    trend: "+5%",
                    trendUp: true,
                  },
                  {
                    label: "Lead → enrollment conv.",
                    value: "17.6%",
                    trend: "+2.1%",
                    trendUp: true,
                  },
                  {
                    label: "Campaign ROI (avg)",
                    value: "3.1x",
                    trend: "+0.4x",
                    trendUp: true,
                  },
                ].map((m) => (
                  <div
                    key={m.label}
                    className="flex items-center justify-between"
                  >
                    <p className="text-sm text-muted-foreground">{m.label}</p>
                    <div className="flex items-center gap-3">
                      <span className="font-bold text-lg">{m.value}</span>
                      <Badge
                        variant="outline"
                        className={
                          m.trendUp
                            ? "bg-emerald-500/10 text-emerald-700 border-emerald-500/30"
                            : "bg-rose-500/10 text-rose-700 border-rose-500/30"
                        }
                      >
                        {m.trendUp ? (
                          <TrendingUp className="h-3 w-3 mr-1" />
                        ) : (
                          <TrendingDown className="h-3 w-3 mr-1" />
                        )}
                        {m.trend}
                      </Badge>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* ═══════════════════════════════════════════ 3. MARKETING ═══ */}
        <TabsContent value="marketing" className="space-y-2 mt-2">
          {/* General metrics */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
            <MiniKPI
              title="Calls by yard"
              value="2,642"
              icon={MapPin}
              color="bg-primary"
            />
            <MiniKPI
              title="Contact rate"
              value="58.8%"
              icon={PhoneIncoming}
              color="bg-sky-500"
              trend="+3%"
              trendUp
            />
            <MiniKPI
              title="Handle time / line"
              value="5:12"
              icon={Timer}
              color="bg-emerald-500"
            />
            <MiniKPI
              title="Onboarding compl."
              value="71%"
              icon={UserCheck}
              color="bg-violet-500"
              trend="+6%"
              trendUp
            />
            <MiniKPI
              title="SMS engagement"
              value="34%"
              icon={MessageSquare}
              color="bg-amber-500"
              trend="+4%"
              trendUp
            />
          </div>

          {/* Contact rate per campaign */}
          <Card className="border-none glass-card">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Campaign overview</CardTitle>
              <CardDescription>
                Contact rate, conversions & ROI.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Campaign</TableHead>
                    <TableHead>Contact rate</TableHead>
                    <TableHead className="text-right">Conversions</TableHead>
                    <TableHead className="text-right">ROI</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {CAMPAIGN_CONTACT_RATE.map((c) => (
                    <TableRow key={c.campaign}>
                      <TableCell className="font-medium">
                        {c.campaign}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Progress
                            value={c.contactRate}
                            className="h-2 w-28"
                          />
                          <span className="text-xs font-semibold w-10">
                            {c.contactRate}%
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right font-mono">
                        {c.conversions}
                      </TableCell>
                      <TableCell className="text-right">
                        <Badge
                          variant="outline"
                          className="bg-emerald-500/10 text-emerald-700 border-emerald-500/30"
                        >
                          {c.roi}x
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* Campaign-specific views */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
            {/* AR */}
            <Card className="border-none glass-card">
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <DollarSign className="h-4 w-4 text-emerald-600" />
                  AR (Collections)
                </CardTitle>
                <CardDescription>
                  Dials → Contacts → PTPs → Payments kept.
                </CardDescription>
              </CardHeader>
              <CardContent className="h-[180px]">
                <ResponsiveContainer width="100%" height="100%">
                  <RBarChart
                    data={AR_CAMPAIGN}
                    layout="vertical"
                    margin={{ left: 40 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                    <XAxis type="number" />
                    <YAxis type="category" dataKey="name" width={140} />
                    <Tooltip />
                    <Bar
                      dataKey="value"
                      fill="hsl(160 70% 45%)"
                      radius={[0, 6, 6, 0]}
                    >
                      <LabelList
                        dataKey="value"
                        position="right"
                        className="text-[11px]"
                      />
                    </Bar>
                  </RBarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Wellness */}
            <Card className="border-none glass-card">
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <HeartPulse className="h-4 w-4 text-rose-500" />
                  Wellness
                </CardTitle>
                <CardDescription>
                  Enrollments by hour — best call windows.
                </CardDescription>
              </CardHeader>
              <CardContent className="h-[180px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={WELLNESS_HOURS}>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                    <XAxis dataKey="hour" />
                    <YAxis />
                    <Tooltip />
                    <Line
                      type="monotone"
                      dataKey="enrollments"
                      stroke="hsl(340 80% 55%)"
                      strokeWidth={3}
                      dot={{ r: 4 }}
                      activeDot={{ r: 6 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Leads funnel */}
            <Card className="border-none glass-card">
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Target className="h-4 w-4 text-sky-600" />
                  Leads — Funnel
                </CardTitle>
                <CardDescription>
                  Lead → Contacted → Qualified → Enrolled.
                </CardDescription>
              </CardHeader>
              <CardContent className="h-[180px]">
                <div className="space-y-2 pt-2">
                  {LEAD_FUNNEL.map((step, i) => {
                    const max = LEAD_FUNNEL[0].value;
                    const pct = (step.value / max) * 100;
                    const colors = [
                      "hsl(210 85% 55%)",
                      "hsl(190 80% 50%)",
                      "hsl(170 75% 45%)",
                      "hsl(150 75% 42%)",
                    ];
                    return (
                      <div key={step.name} className="space-y-1">
                        <div className="flex justify-between text-sm">
                          <span className="font-medium">{step.name}</span>
                          <span className="font-mono font-semibold">
                            {step.value.toLocaleString()}
                          </span>
                        </div>
                        <div className="h-8 bg-muted rounded-md overflow-hidden relative">
                          <div
                            className="h-full rounded-md transition-all flex items-center justify-end px-3 text-white text-xs font-bold"
                            style={{ width: `${pct}%`, background: colors[i] }}
                          >
                            {pct.toFixed(0)}%
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Leads dispositions */}
            <Card className="border-none glass-card">
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Activity className="h-4 w-4 text-amber-600" />
                  Lead Dispositions
                </CardTitle>
                <CardDescription>
                  Hot / Warm / Cold breakdown + avg response time.
                </CardDescription>
              </CardHeader>
              <CardContent className="h-[180px]">
                <div className="grid grid-cols-5 h-full gap-2">
                  <div className="col-span-3">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Tooltip />
                        <Pie
                          data={DISPOSITIONS}
                          dataKey="value"
                          nameKey="name"
                          innerRadius={55}
                          outerRadius={90}
                          paddingAngle={3}
                        >
                          {DISPOSITIONS.map((entry) => (
                            <Cell key={entry.name} fill={entry.fill} />
                          ))}
                        </Pie>
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="col-span-2 flex flex-col justify-center gap-3">
                    {DISPOSITIONS.map((d) => (
                      <div key={d.name} className="flex items-center gap-2">
                        <div
                          className="h-3 w-3 rounded-sm"
                          style={{ background: d.fill }}
                        />
                        <div className="flex-1">
                          <p className="text-xs text-muted-foreground">
                            {d.name}
                          </p>
                          <p className="font-bold">{d.value}</p>
                        </div>
                      </div>
                    ))}
                    <Separator className="my-2" />
                    <div>
                      <p className="text-xs text-muted-foreground">
                        Avg response time
                      </p>
                      <p className="font-bold text-lg">4m 12s</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* SMS engagement */}
          <MiniChart title="SMS engagement — sent vs replied (weekly)">
            <ResponsiveContainer width="100%" height="100%">
              <RBarChart data={SMS_ENGAGEMENT}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                <XAxis dataKey="day" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar
                  dataKey="sent"
                  fill="hsl(210 80% 55%)"
                  radius={[6, 6, 0, 0]}
                />
                <Bar
                  dataKey="replied"
                  fill="hsl(35 90% 55%)"
                  radius={[6, 6, 0, 0]}
                />
              </RBarChart>
            </ResponsiveContainer>
          </MiniChart>
        </TabsContent>
      </Tabs>

      {/* Footer note — ticket entity */}
      <Card className="border-dashed bg-muted/30">
        <CardHeader>
          <CardTitle className="text-sm flex items-center gap-2">
            <TicketIcon className="h-4 w-4" /> Ticket entity — campos relevantes
            para estos dashboards
          </CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
          <div>
            <p className="font-semibold mb-1">Existentes</p>
            <ul className="space-y-0.5 font-mono text-muted-foreground">
              <li>customerId · yardId · campaignId · agentId · phoneLineId</li>
              <li>status · priority · issueDetail · campaignOption</li>
              <li>attachments · createdAt · updatedAt</li>
            </ul>
          </div>
          <div>
            <p className="font-semibold mb-1 text-primary">
              Nuevos (impactan Operations + Executive)
            </p>
            <ul className="space-y-0.5 font-mono text-primary/80">
              <li>callId → Call que originó el ticket</li>
              <li>followUpDueDate → deadline de callback promise</li>
              <li>followUpAssignedToId → agente responsable del follow-up</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
