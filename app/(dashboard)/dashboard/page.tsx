"use client";

import type { ReactNode } from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ComposedChart,
  Legend,
  Line,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  AlertTriangle,
  BarChart3,
  CalendarDays,
  CheckCircle2,
  Clock3,
  Download,
  Headphones,
  MapPin,
  MessageSquare,
  PhoneCall,
  Radio,
  Target,
  Timer,
  TrendingUp,
  Users,
  type LucideIcon,
} from "lucide-react";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";

type Tone = "emerald" | "sky" | "amber" | "rose" | "indigo" | "slate";

type Metric = {
  label: string;
  value: string;
  detail: string;
  trend: string;
  tone: Tone;
  icon: LucideIcon;
};

const toneClasses: Record<
  Tone,
  {
    icon: string;
    iconWrap: string;
    border: string;
    text: string;
    bg: string;
    chart: string;
  }
> = {
  emerald: {
    icon: "text-emerald-700 dark:text-emerald-300",
    iconWrap: "bg-emerald-50 dark:bg-emerald-950/40",
    border: "border-emerald-200 dark:border-emerald-900",
    text: "text-emerald-700 dark:text-emerald-300",
    bg: "bg-emerald-600",
    chart: "#059669",
  },
  sky: {
    icon: "text-sky-700 dark:text-sky-300",
    iconWrap: "bg-sky-50 dark:bg-sky-950/40",
    border: "border-sky-200 dark:border-sky-900",
    text: "text-sky-700 dark:text-sky-300",
    bg: "bg-sky-600",
    chart: "#0284c7",
  },
  amber: {
    icon: "text-amber-700 dark:text-amber-300",
    iconWrap: "bg-amber-50 dark:bg-amber-950/40",
    border: "border-amber-200 dark:border-amber-900",
    text: "text-amber-700 dark:text-amber-300",
    bg: "bg-amber-500",
    chart: "#d97706",
  },
  rose: {
    icon: "text-rose-700 dark:text-rose-300",
    iconWrap: "bg-rose-50 dark:bg-rose-950/40",
    border: "border-rose-200 dark:border-rose-900",
    text: "text-rose-700 dark:text-rose-300",
    bg: "bg-rose-600",
    chart: "#e11d48",
  },
  indigo: {
    icon: "text-indigo-700 dark:text-indigo-300",
    iconWrap: "bg-indigo-50 dark:bg-indigo-950/40",
    border: "border-indigo-200 dark:border-indigo-900",
    text: "text-indigo-700 dark:text-indigo-300",
    bg: "bg-indigo-600",
    chart: "#4f46e5",
  },
  slate: {
    icon: "text-slate-700 dark:text-slate-300",
    iconWrap: "bg-slate-100 dark:bg-slate-900",
    border: "border-slate-200 dark:border-slate-800",
    text: "text-slate-700 dark:text-slate-300",
    bg: "bg-slate-500",
    chart: "#64748b",
  },
};

const tooltipStyle = {
  background: "hsl(var(--card))",
  border: "1px solid hsl(var(--border))",
  borderRadius: 8,
  color: "hsl(var(--foreground))",
  boxShadow: "0 10px 30px rgba(15, 23, 42, 0.12)",
};

const operationsMetrics: Metric[] = [
  {
    label: "Calls today",
    value: "728",
    detail: "432 inbound, 296 outbound",
    trend: "+12% vs last Tue",
    tone: "emerald",
    icon: PhoneCall,
  },
  {
    label: "Live queue",
    value: "18",
    detail: "7 active, 11 waiting",
    trend: "Peak window now",
    tone: "amber",
    icon: Headphones,
  },
  {
    label: "Avg handle time",
    value: "5m 21s",
    detail: "Talk + wrap-up",
    trend: "-24s vs target",
    tone: "sky",
    icon: Timer,
  },
  {
    label: "Overdue follow-ups",
    value: "14",
    detail: "8 calls, 6 tickets",
    trend: "Supervisor review",
    tone: "rose",
    icon: AlertTriangle,
  },
];

const executiveMetrics: Metric[] = [
  {
    label: "Call volume",
    value: "14,820",
    detail: "All lines, last 30 days",
    trend: "+8.4% month over month",
    tone: "emerald",
    icon: Radio,
  },
  {
    label: "Ticket resolution",
    value: "82%",
    detail: "Resolved inside SLA",
    trend: "+5.1 points",
    tone: "indigo",
    icon: CheckCircle2,
  },
  {
    label: "Callback kept rate",
    value: "91%",
    detail: "Promised callbacks honored",
    trend: "+7.2 points",
    tone: "sky",
    icon: Clock3,
  },
  {
    label: "At-risk workload",
    value: "39",
    detail: "Overdue or emergency",
    trend: "12 require action today",
    tone: "rose",
    icon: AlertTriangle,
  },
];

const marketingMetrics: Metric[] = [
  {
    label: "Contact rate",
    value: "64%",
    detail: "Connected / attempted",
    trend: "+6.8 points",
    tone: "emerald",
    icon: Target,
  },
  {
    label: "Lead enrollment",
    value: "18.6%",
    detail: "Lead to enrolled funnel",
    trend: "+2.4 points",
    tone: "indigo",
    icon: TrendingUp,
  },
  {
    label: "SMS reply rate",
    value: "31%",
    detail: "Across active campaigns",
    trend: "+4.9 points",
    tone: "sky",
    icon: MessageSquare,
  },
  {
    label: "Campaign ROI",
    value: "3.4x",
    detail: "Calls vs outcomes",
    trend: "AR and Wellness lead",
    tone: "amber",
    icon: BarChart3,
  },
];

const operationsTrend = [
  { day: "Mon", inbound: 284, outbound: 226, tickets: 132, callbacks: 42 },
  { day: "Tue", inbound: 318, outbound: 244, tickets: 146, callbacks: 48 },
  { day: "Wed", inbound: 344, outbound: 268, tickets: 153, callbacks: 51 },
  { day: "Thu", inbound: 331, outbound: 251, tickets: 149, callbacks: 45 },
  { day: "Fri", inbound: 372, outbound: 289, tickets: 166, callbacks: 56 },
  { day: "Sat", inbound: 194, outbound: 122, tickets: 77, callbacks: 21 },
  { day: "Sun", inbound: 138, outbound: 92, tickets: 51, callbacks: 17 },
];

const agentActivity = [
  { agent: "Lucia", calls: 68, talk: 351, resolution: 94 },
  { agent: "Maria", calls: 61, talk: 318, resolution: 90 },
  { agent: "Sofia", calls: 57, talk: 296, resolution: 88 },
  { agent: "Carlos", calls: 49, talk: 274, resolution: 81 },
  { agent: "Javier", calls: 44, talk: 248, resolution: 77 },
  { agent: "Diego", calls: 39, talk: 216, resolution: 69 },
];

const liveWallboard = [
  {
    label: "Active calls",
    value: "7",
    detail: "3 AR, 2 Leads, 2 Wellness",
    tone: "emerald" as Tone,
  },
  {
    label: "Queued calls",
    value: "11",
    detail: "Longest wait 02:18",
    tone: "amber" as Tone,
  },
  {
    label: "Agents available",
    value: "9",
    detail: "5 ready, 4 after-call work",
    tone: "sky" as Tone,
  },
  {
    label: "Missed today",
    value: "23",
    detail: "Top gap: 12p - 2p",
    tone: "rose" as Tone,
  },
];

const linePerformance = [
  {
    line: "AR Collections",
    calls: "4,820",
    contact: "68%",
    aht: "5m 48s",
    missed: "4.8%",
    owner: "Operations",
  },
  {
    line: "Wellness",
    calls: "2,940",
    contact: "58%",
    aht: "6m 12s",
    missed: "6.1%",
    owner: "Marketing",
  },
  {
    line: "New Leads",
    calls: "3,180",
    contact: "72%",
    aht: "4m 56s",
    missed: "3.9%",
    owner: "Sales",
  },
  {
    line: "Onboarding",
    calls: "1,470",
    contact: "61%",
    aht: "7m 18s",
    missed: "5.3%",
    owner: "Client Success",
  },
];

const followUpQueue = [
  {
    id: "CALL-1088",
    customer: "R. Alvarez",
    owner: "Maria G.",
    status: "PTP overdue",
    due: "2h late",
    tone: "rose" as Tone,
  },
  {
    id: "TCK-4217",
    customer: "Marcus Holloway",
    owner: "Carlos P.",
    status: "Dispute callback",
    due: "Today 3:30p",
    tone: "amber" as Tone,
  },
  {
    id: "CALL-1096",
    customer: "K. Nguyen",
    owner: "Lucia R.",
    status: "Enrollment follow-up",
    due: "Today 4:15p",
    tone: "sky" as Tone,
  },
  {
    id: "TCK-4231",
    customer: "Alvarez Bros",
    owner: "Sofia L.",
    status: "Escalated case",
    due: "Tomorrow 9:00a",
    tone: "indigo" as Tone,
  },
];

const executiveCallKpis = [
  { metric: "Response time", actual: 82, target: 90 },
  { metric: "AHT by line", actual: 76, target: 80 },
  { metric: "Utilization", actual: 88, target: 85 },
  { metric: "Callbacks kept", actual: 91, target: 90 },
  { metric: "Resolution by line", actual: 84, target: 86 },
];

const ticketVsCallTrend = [
  { week: "W1", calls: 3210, tickets: 842, resolved: 704 },
  { week: "W2", calls: 3488, tickets: 901, resolved: 762 },
  { week: "W3", calls: 3714, tickets: 974, resolved: 836 },
  { week: "W4", calls: 4408, tickets: 1056, resolved: 916 },
];

const ticketRisk = [
  {
    yard: "Miami",
    open: 42,
    overdue: 6,
    response: "18m",
    resolution: "14h",
    rate: "86%",
  },
  {
    yard: "Orlando",
    open: 31,
    overdue: 3,
    response: "21m",
    resolution: "16h",
    rate: "83%",
  },
  {
    yard: "Tampa",
    open: 28,
    overdue: 7,
    response: "27m",
    resolution: "19h",
    rate: "74%",
  },
  {
    yard: "Jacksonville",
    open: 19,
    overdue: 2,
    response: "14m",
    resolution: "11h",
    rate: "89%",
  },
];

const heatmapHours = ["8a", "9a", "10a", "11a", "12p", "1p", "2p", "3p", "4p", "5p"];
const peakHourHeatmap = [
  { day: "Mon", values: [18, 26, 38, 52, 61, 58, 49, 44, 31, 20] },
  { day: "Tue", values: [22, 31, 42, 59, 67, 64, 56, 47, 35, 24] },
  { day: "Wed", values: [24, 35, 48, 63, 72, 69, 61, 53, 39, 27] },
  { day: "Thu", values: [21, 33, 45, 57, 66, 62, 55, 51, 37, 25] },
  { day: "Fri", values: [19, 29, 41, 54, 62, 59, 48, 42, 32, 22] },
  { day: "Sat", values: [10, 16, 24, 31, 36, 33, 28, 23, 18, 12] },
  { day: "Sun", values: [7, 12, 17, 21, 24, 23, 19, 16, 12, 9] },
];

const campaignRates = [
  { campaign: "AR", contact: 68, conversion: 31, sms: 24, roi: 3.9 },
  { campaign: "Wellness", contact: 58, conversion: 42, sms: 36, roi: 4.2 },
  { campaign: "Leads", contact: 72, conversion: 19, sms: 28, roi: 2.7 },
  { campaign: "Onboarding", contact: 61, conversion: 54, sms: 41, roi: 3.1 },
];

const leadFunnel = [
  { stage: "Leads", value: 1240, pct: 100 },
  { stage: "Called", value: 1014, pct: 82 },
  { stage: "Connected", value: 731, pct: 59 },
  { stage: "Qualified", value: 412, pct: 33 },
  { stage: "Enrolled", value: 231, pct: 19 },
];

const arFunnel = [
  { stage: "Dials", value: 4820, pct: 100 },
  { stage: "Contacts", value: 3278, pct: 68 },
  { stage: "PTP", value: 1196, pct: 25 },
  { stage: "Paid", value: 612, pct: 13 },
];

const smsTrend = [
  { week: "W1", sent: 820, replies: 214, rate: 26 },
  { week: "W2", sent: 934, replies: 282, rate: 30 },
  { week: "W3", sent: 1048, replies: 329, rate: 31 },
  { week: "W4", sent: 1180, replies: 386, rate: 33 },
];

const dispositionBreakdown = [
  { name: "PTP", value: 26, color: toneClasses.emerald.chart },
  { name: "No answer", value: 31, color: toneClasses.amber.chart },
  { name: "Dispute", value: 12, color: toneClasses.rose.chart },
  { name: "Enrolled", value: 18, color: toneClasses.indigo.chart },
  { name: "Callback", value: 13, color: toneClasses.sky.chart },
];

const yardVolume = [
  { yard: "Miami", calls: 1840, outcomes: 612 },
  { yard: "Orlando", calls: 1320, outcomes: 421 },
  { yard: "Tampa", calls: 1184, outcomes: 336 },
  { yard: "Jacksonville", calls: 872, outcomes: 294 },
  { yard: "Atlanta", calls: 641, outcomes: 178 },
];

function MetricCard({ metric }: { metric: Metric }) {
  const tone = toneClasses[metric.tone];
  const Icon = metric.icon;

  return (
    <Card className="gap-0 rounded-[8px] border-slate-200 bg-white py-0 shadow-sm dark:border-slate-800 dark:bg-slate-950">
      <CardContent className="px-4 py-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-sm font-medium text-slate-600 dark:text-slate-400">
              {metric.label}
            </p>
            <p className="mt-2 text-2xl font-semibold text-slate-950 dark:text-slate-50">
              {metric.value}
            </p>
          </div>
          <span
            className={cn(
              "flex h-10 w-10 shrink-0 items-center justify-center rounded-[8px] border",
              tone.iconWrap,
              tone.border,
            )}
          >
            <Icon className={cn("h-5 w-5", tone.icon)} aria-hidden />
          </span>
        </div>
        <div className="mt-4 flex flex-col gap-1 text-sm">
          <span className="text-slate-600 dark:text-slate-400">
            {metric.detail}
          </span>
          <span className={cn("font-medium", tone.text)}>{metric.trend}</span>
        </div>
      </CardContent>
    </Card>
  );
}

function PanelCard({
  title,
  subtitle,
  children,
  className,
  action,
}: {
  title: string;
  subtitle?: string;
  children: ReactNode;
  className?: string;
  action?: ReactNode;
}) {
  return (
    <Card
      className={cn(
        "gap-0 rounded-[8px] border-slate-200 bg-white py-0 shadow-sm dark:border-slate-800 dark:bg-slate-950",
        className,
      )}
    >
      <CardHeader className="grid gap-1 border-b border-slate-100 px-4 py-4 dark:border-slate-800 sm:grid-cols-[1fr_auto] sm:items-start">
        <div className="min-w-0">
          <CardTitle className="text-base font-semibold text-slate-950 dark:text-slate-50">
            {title}
          </CardTitle>
          {subtitle ? (
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
              {subtitle}
            </p>
          ) : null}
        </div>
        {action ? <div className="mt-2 sm:mt-0">{action}</div> : null}
      </CardHeader>
      <CardContent className="px-4 py-4">{children}</CardContent>
    </Card>
  );
}

function StatusBadge({ children, tone }: { children: ReactNode; tone: Tone }) {
  const toneClass = toneClasses[tone];

  return (
    <span
      className={cn(
        "inline-flex min-h-6 items-center rounded-[6px] border px-2 text-xs font-medium",
        toneClass.iconWrap,
        toneClass.border,
        toneClass.text,
      )}
    >
      {children}
    </span>
  );
}

function DataRow({
  label,
  value,
  helper,
  tone,
}: {
  label: string;
  value: string;
  helper: string;
  tone: Tone;
}) {
  const toneClass = toneClasses[tone];

  return (
    <div className="grid gap-2 rounded-[8px] border border-slate-200 p-3 dark:border-slate-800 sm:grid-cols-[1fr_auto] sm:items-center">
      <div className="min-w-0">
        <p className="text-sm font-semibold text-slate-950 dark:text-slate-50">
          {label}
        </p>
        <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
          {helper}
        </p>
      </div>
      <div className="flex items-center gap-2 sm:justify-end">
        <span className={cn("h-2 w-2 rounded-full", toneClass.bg)} />
        <span className="text-lg font-semibold tabular-nums text-slate-950 dark:text-slate-50">
          {value}
        </span>
      </div>
    </div>
  );
}

function SectionIntro() {
  return (
    <div className="grid gap-4 rounded-[8px] border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-950 lg:grid-cols-[1fr_auto] lg:items-center">
      <div className="min-w-0">
        <p className="text-sm font-medium text-emerald-700 dark:text-emerald-300">
          Rig Hut Support Center
        </p>
        <h1 className="mt-2 text-2xl font-semibold text-slate-950 dark:text-slate-50">
          Support Center Dashboards
        </h1>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600 dark:text-slate-400">
          Operations, executive and marketing views aligned with the Aircall
          integration requirements: call logs, ticket KPIs, follow-ups, SMS,
          campaign attribution and yard performance.
        </p>
      </div>
      <div className="flex flex-wrap gap-2 lg:justify-end">
        <Button
          type="button"
          variant="outline"
          className="h-9 rounded-[8px] border-slate-200 bg-white text-slate-700 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-200"
        >
          <CalendarDays className="h-4 w-4" aria-hidden />
          Last 30 days
        </Button>
        <Button type="button" className="h-9 rounded-[8px]">
          <Download className="h-4 w-4" aria-hidden />
          Export
        </Button>
      </div>
    </div>
  );
}

function MetricsGrid({ metrics }: { metrics: Metric[] }) {
  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      {metrics.map((metric) => (
        <MetricCard key={metric.label} metric={metric} />
      ))}
    </div>
  );
}

function OperationsDashboard() {
  return (
    <div className="space-y-4">
      <MetricsGrid metrics={operationsMetrics} />

      <div className="grid gap-4 xl:grid-cols-[1.45fr_1fr]">
        <PanelCard
          title="Call volume and ticket creation"
          subtitle="Inbound, outbound, tickets created and follow-up callbacks by day."
        >
          <div className="h-[320px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={operationsTrend} margin={{ left: -16, right: 8 }}>
                <defs>
                  <linearGradient id="inboundFill" x1="0" y1="0" x2="0" y2="1">
                    <stop
                      offset="5%"
                      stopColor={toneClasses.emerald.chart}
                      stopOpacity={0.28}
                    />
                    <stop
                      offset="95%"
                      stopColor={toneClasses.emerald.chart}
                      stopOpacity={0.02}
                    />
                  </linearGradient>
                  <linearGradient id="outboundFill" x1="0" y1="0" x2="0" y2="1">
                    <stop
                      offset="5%"
                      stopColor={toneClasses.sky.chart}
                      stopOpacity={0.22}
                    />
                    <stop
                      offset="95%"
                      stopColor={toneClasses.sky.chart}
                      stopOpacity={0.02}
                    />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="day" tickLine={false} axisLine={false} />
                <YAxis tickLine={false} axisLine={false} />
                <Tooltip contentStyle={tooltipStyle} />
                <Legend />
                <Area
                  type="monotone"
                  dataKey="inbound"
                  name="Inbound"
                  stroke={toneClasses.emerald.chart}
                  fill="url(#inboundFill)"
                  strokeWidth={2}
                />
                <Area
                  type="monotone"
                  dataKey="outbound"
                  name="Outbound"
                  stroke={toneClasses.sky.chart}
                  fill="url(#outboundFill)"
                  strokeWidth={2}
                />
                <Line
                  type="monotone"
                  dataKey="tickets"
                  name="Tickets"
                  stroke={toneClasses.indigo.chart}
                  strokeWidth={2}
                  dot={false}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </PanelCard>

        <PanelCard
          title="Live wallboard"
          subtitle="Queue health for supervisors and floor leads."
        >
          <div className="grid gap-3 sm:grid-cols-2">
            {liveWallboard.map((item) => (
              <DataRow
                key={item.label}
                label={item.label}
                value={item.value}
                helper={item.detail}
                tone={item.tone}
              />
            ))}
          </div>
        </PanelCard>
      </div>

      <div className="grid gap-4 xl:grid-cols-[1fr_1fr]">
        <PanelCard
          title="Agent activity"
          subtitle="Calls handled, talk time and resolution quality by agent."
        >
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={agentActivity} margin={{ left: -16, right: 8 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="agent" tickLine={false} axisLine={false} />
                <YAxis tickLine={false} axisLine={false} />
                <Tooltip contentStyle={tooltipStyle} />
                <Legend />
                <Bar
                  dataKey="calls"
                  name="Calls"
                  fill={toneClasses.emerald.chart}
                  radius={[6, 6, 0, 0]}
                />
                <Bar
                  dataKey="resolution"
                  name="Resolution %"
                  fill={toneClasses.indigo.chart}
                  radius={[6, 6, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </PanelCard>

        <PanelCard
          title="Follow-up accountability"
          subtitle="Promised callbacks and ticket follow-ups with owner and due window."
        >
          <div className="space-y-3">
            {followUpQueue.map((item) => (
              <div
                key={item.id}
                className="grid gap-3 rounded-[8px] border border-slate-200 p-3 dark:border-slate-800 md:grid-cols-[1fr_auto] md:items-center"
              >
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono text-sm font-semibold text-slate-950 dark:text-slate-50">
                      {item.id}
                    </span>
                    <StatusBadge tone={item.tone}>{item.status}</StatusBadge>
                  </div>
                  <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
                    {item.customer} assigned to {item.owner}
                  </p>
                </div>
                <span className="text-sm font-semibold text-slate-950 dark:text-slate-50">
                  {item.due}
                </span>
              </div>
            ))}
          </div>
        </PanelCard>
      </div>

      <PanelCard
        title="Line and campaign operations"
        subtitle="Daily line-of-origin performance for staffing, attribution and SLA review."
      >
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-slate-600 dark:border-slate-800 dark:text-slate-400">
                <th className="py-3 pr-4 font-medium">Line</th>
                <th className="py-3 pr-4 font-medium">Calls</th>
                <th className="py-3 pr-4 font-medium">Contact rate</th>
                <th className="py-3 pr-4 font-medium">AHT</th>
                <th className="py-3 pr-4 font-medium">Missed</th>
                <th className="py-3 pr-4 font-medium">Audience</th>
              </tr>
            </thead>
            <tbody>
              {linePerformance.map((line) => (
                <tr
                  key={line.line}
                  className="border-b border-slate-100 last:border-b-0 dark:border-slate-900"
                >
                  <td className="py-3 pr-4 font-semibold text-slate-950 dark:text-slate-50">
                    {line.line}
                  </td>
                  <td className="py-3 pr-4 tabular-nums text-slate-700 dark:text-slate-300">
                    {line.calls}
                  </td>
                  <td className="py-3 pr-4 text-slate-700 dark:text-slate-300">
                    {line.contact}
                  </td>
                  <td className="py-3 pr-4 text-slate-700 dark:text-slate-300">
                    {line.aht}
                  </td>
                  <td className="py-3 pr-4 text-slate-700 dark:text-slate-300">
                    {line.missed}
                  </td>
                  <td className="py-3 pr-4 text-slate-700 dark:text-slate-300">
                    {line.owner}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </PanelCard>
    </div>
  );
}

function ExecutiveDashboard() {
  return (
    <div className="space-y-4">
      <MetricsGrid metrics={executiveMetrics} />

      <div className="grid gap-4 xl:grid-cols-[1fr_1fr]">
        <PanelCard
          title="Calls and tickets executive trend"
          subtitle="Weekly ratio of logged calls, opened tickets and resolved cases."
        >
          <div className="h-[320px]">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={ticketVsCallTrend} margin={{ left: -16, right: 8 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="week" tickLine={false} axisLine={false} />
                <YAxis tickLine={false} axisLine={false} />
                <Tooltip contentStyle={tooltipStyle} />
                <Legend />
                <Bar
                  dataKey="calls"
                  name="Calls"
                  fill={toneClasses.emerald.chart}
                  radius={[6, 6, 0, 0]}
                />
                <Line
                  type="monotone"
                  dataKey="tickets"
                  name="Tickets"
                  stroke={toneClasses.indigo.chart}
                  strokeWidth={3}
                />
                <Line
                  type="monotone"
                  dataKey="resolved"
                  name="Resolved"
                  stroke={toneClasses.sky.chart}
                  strokeWidth={3}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </PanelCard>

        <PanelCard
          title="Call KPI scorecard"
          subtitle="Operational KPIs compared against leadership targets."
        >
          <div className="space-y-4">
            {executiveCallKpis.map((item) => (
              <div key={item.metric} className="space-y-2">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                    {item.metric}
                  </span>
                  <span className="text-sm font-semibold tabular-nums text-slate-950 dark:text-slate-50">
                    {item.actual}% / {item.target}%
                  </span>
                </div>
                <div className="h-2 rounded-full bg-slate-100 dark:bg-slate-900">
                  <div
                    className={cn(
                      "h-2 rounded-full",
                      item.actual >= item.target
                        ? "bg-emerald-600"
                        : item.actual >= item.target - 6
                          ? "bg-amber-500"
                          : "bg-rose-600",
                    )}
                    style={{ width: `${item.actual}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </PanelCard>
      </div>

      <div className="grid gap-4 xl:grid-cols-[1fr_1fr]">
        <PanelCard
          title="Peak call hour heatmap"
          subtitle="Monthly pattern by day and hour for staffing decisions."
        >
          <div className="overflow-x-auto">
            <div className="min-w-[680px]">
              <div className="grid grid-cols-[56px_repeat(10,minmax(44px,1fr))] gap-1 text-xs text-slate-600 dark:text-slate-400">
                <span />
                {heatmapHours.map((hour) => (
                  <span key={hour} className="text-center">
                    {hour}
                  </span>
                ))}
              </div>
              <div className="mt-2 space-y-1">
                {peakHourHeatmap.map((row) => (
                  <div
                    key={row.day}
                    className="grid grid-cols-[56px_repeat(10,minmax(44px,1fr))] items-center gap-1"
                  >
                    <span className="text-xs font-medium text-slate-600 dark:text-slate-400">
                      {row.day}
                    </span>
                    {row.values.map((value, index) => (
                      <div
                        key={`${row.day}-${heatmapHours[index]}`}
                        className="flex h-9 items-center justify-center rounded-[6px] text-xs font-semibold text-slate-900"
                        style={{
                          backgroundColor: `rgba(5, 150, 105, ${Math.max(
                            0.12,
                            value / 90,
                          )})`,
                        }}
                      >
                        {value}
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </PanelCard>

        <PanelCard
          title="Ticket risk by yard"
          subtitle="Open workload, overdue count, response time and resolution rate."
        >
          <div className="overflow-x-auto">
            <table className="w-full min-w-[620px] text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-slate-600 dark:border-slate-800 dark:text-slate-400">
                  <th className="py-3 pr-4 font-medium">Yard</th>
                  <th className="py-3 pr-4 font-medium">Open</th>
                  <th className="py-3 pr-4 font-medium">Overdue</th>
                  <th className="py-3 pr-4 font-medium">Response</th>
                  <th className="py-3 pr-4 font-medium">Resolution</th>
                  <th className="py-3 pr-4 font-medium">Rate</th>
                </tr>
              </thead>
              <tbody>
                {ticketRisk.map((yard) => (
                  <tr
                    key={yard.yard}
                    className="border-b border-slate-100 last:border-b-0 dark:border-slate-900"
                  >
                    <td className="py-3 pr-4 font-semibold text-slate-950 dark:text-slate-50">
                      {yard.yard}
                    </td>
                    <td className="py-3 pr-4 tabular-nums text-slate-700 dark:text-slate-300">
                      {yard.open}
                    </td>
                    <td className="py-3 pr-4">
                      <StatusBadge tone={yard.overdue > 5 ? "rose" : "amber"}>
                        {yard.overdue}
                      </StatusBadge>
                    </td>
                    <td className="py-3 pr-4 text-slate-700 dark:text-slate-300">
                      {yard.response}
                    </td>
                    <td className="py-3 pr-4 text-slate-700 dark:text-slate-300">
                      {yard.resolution}
                    </td>
                    <td className="py-3 pr-4 font-semibold text-slate-950 dark:text-slate-50">
                      {yard.rate}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </PanelCard>
      </div>
    </div>
  );
}

function FunnelBars({
  title,
  data,
  tone,
}: {
  title: string;
  data: typeof leadFunnel;
  tone: Tone;
}) {
  const toneClass = toneClasses[tone];

  return (
    <div className="space-y-3">
      <p className="text-sm font-semibold text-slate-950 dark:text-slate-50">
        {title}
      </p>
      {data.map((item) => (
        <div key={item.stage} className="space-y-1">
          <div className="flex items-center justify-between gap-3 text-sm">
            <span className="text-slate-700 dark:text-slate-300">
              {item.stage}
            </span>
            <span className="font-semibold tabular-nums text-slate-950 dark:text-slate-50">
              {item.value.toLocaleString()} ({item.pct}%)
            </span>
          </div>
          <div className="h-2 rounded-full bg-slate-100 dark:bg-slate-900">
            <div
              className={cn("h-2 rounded-full", toneClass.bg)}
              style={{ width: `${item.pct}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

function MarketingDashboard() {
  return (
    <div className="space-y-4">
      <MetricsGrid metrics={marketingMetrics} />

      <div className="grid gap-4 xl:grid-cols-[1.2fr_1fr]">
        <PanelCard
          title="Campaign performance"
          subtitle="Contact rate, conversion, SMS reply rate and ROI by campaign line."
        >
          <div className="h-[330px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={campaignRates} margin={{ left: -16, right: 8 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="campaign" tickLine={false} axisLine={false} />
                <YAxis tickLine={false} axisLine={false} />
                <Tooltip contentStyle={tooltipStyle} />
                <Legend />
                <Bar
                  dataKey="contact"
                  name="Contact %"
                  fill={toneClasses.emerald.chart}
                  radius={[6, 6, 0, 0]}
                />
                <Bar
                  dataKey="conversion"
                  name="Conversion %"
                  fill={toneClasses.indigo.chart}
                  radius={[6, 6, 0, 0]}
                />
                <Bar
                  dataKey="sms"
                  name="SMS reply %"
                  fill={toneClasses.sky.chart}
                  radius={[6, 6, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </PanelCard>

        <PanelCard
          title="Campaign funnels"
          subtitle="Lead and AR funnels prepared for campaign-level attribution."
        >
          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-1">
            <FunnelBars title="Lead to enrollment" data={leadFunnel} tone="indigo" />
            <FunnelBars title="AR collection path" data={arFunnel} tone="emerald" />
          </div>
        </PanelCard>
      </div>

      <div className="grid gap-4 xl:grid-cols-[1fr_1fr]">
        <PanelCard
          title="SMS engagement"
          subtitle="Two-way SMS volume, replies and response rate."
        >
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={smsTrend} margin={{ left: -16, right: 8 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="week" tickLine={false} axisLine={false} />
                <YAxis yAxisId="left" tickLine={false} axisLine={false} />
                <YAxis
                  yAxisId="right"
                  orientation="right"
                  tickLine={false}
                  axisLine={false}
                  unit="%"
                />
                <Tooltip contentStyle={tooltipStyle} />
                <Legend />
                <Bar
                  yAxisId="left"
                  dataKey="sent"
                  name="Sent"
                  fill={toneClasses.sky.chart}
                  radius={[6, 6, 0, 0]}
                />
                <Bar
                  yAxisId="left"
                  dataKey="replies"
                  name="Replies"
                  fill={toneClasses.amber.chart}
                  radius={[6, 6, 0, 0]}
                />
                <Line
                  yAxisId="right"
                  type="monotone"
                  dataKey="rate"
                  name="Reply rate"
                  stroke={toneClasses.emerald.chart}
                  strokeWidth={3}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </PanelCard>

        <PanelCard
          title="Disposition mix"
          subtitle="Mandatory outcome tags ready for clean campaign reporting."
        >
          <div className="grid gap-4 lg:grid-cols-[240px_1fr] lg:items-center">
            <div className="h-[260px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={dispositionBreakdown}
                    dataKey="value"
                    nameKey="name"
                    innerRadius={62}
                    outerRadius={92}
                    paddingAngle={3}
                  >
                    {dispositionBreakdown.map((entry) => (
                      <Cell key={entry.name} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={tooltipStyle} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="space-y-3">
              {dispositionBreakdown.map((item) => (
                <div
                  key={item.name}
                  className="flex items-center justify-between gap-3 rounded-[8px] border border-slate-200 p-3 dark:border-slate-800"
                >
                  <span className="flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-300">
                    <span
                      className="h-3 w-3 rounded-[4px]"
                      style={{ backgroundColor: item.color }}
                    />
                    {item.name}
                  </span>
                  <span className="text-sm font-semibold tabular-nums text-slate-950 dark:text-slate-50">
                    {item.value}%
                  </span>
                </div>
              ))}
            </div>
          </div>
        </PanelCard>
      </div>

      <PanelCard
        title="Yard volume and outcomes"
        subtitle="Location reporting for marketing allocation and operational load."
      >
        <div className="h-[320px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={yardVolume} margin={{ left: -16, right: 8 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="yard" tickLine={false} axisLine={false} />
              <YAxis tickLine={false} axisLine={false} />
              <Tooltip contentStyle={tooltipStyle} />
              <Legend />
              <Bar
                dataKey="calls"
                name="Calls"
                fill={toneClasses.indigo.chart}
                radius={[6, 6, 0, 0]}
              />
              <Bar
                dataKey="outcomes"
                name="Positive outcomes"
                fill={toneClasses.emerald.chart}
                radius={[6, 6, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </PanelCard>
    </div>
  );
}

export default function DashboardPage() {
  return (
    <div className="min-h-[calc(100dvh-5.5rem)] space-y-5 py-5 tracking-normal">
      <SectionIntro />

      <Tabs defaultValue="operations" className="space-y-4">
        <TabsList className="grid h-auto w-full grid-cols-1 rounded-[8px] border border-slate-200 bg-slate-50 p-1 dark:border-slate-800 dark:bg-slate-900 sm:grid-cols-3 lg:w-fit">
          <TabsTrigger
            value="operations"
            className="min-h-10 rounded-[6px] text-sm"
          >
            <Headphones className="h-4 w-4" aria-hidden />
            Operations
          </TabsTrigger>
          <TabsTrigger
            value="executive"
            className="min-h-10 rounded-[6px] text-sm"
          >
            <Users className="h-4 w-4" aria-hidden />
            Executive
          </TabsTrigger>
          <TabsTrigger
            value="marketing"
            className="min-h-10 rounded-[6px] text-sm"
          >
            <MapPin className="h-4 w-4" aria-hidden />
            Marketing
          </TabsTrigger>
        </TabsList>

        <TabsContent value="operations" className="mt-0">
          <OperationsDashboard />
        </TabsContent>
        <TabsContent value="executive" className="mt-0">
          <ExecutiveDashboard />
        </TabsContent>
        <TabsContent value="marketing" className="mt-0">
          <MarketingDashboard />
        </TabsContent>
      </Tabs>
    </div>
  );
}
