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
  ClipboardList,
  Clock3,
  Download,
  Headphones,
  ListChecks,
  MapPin,
  MessageSquare,
  PhoneCall,
  Radio,
  Target,
  Timer,
  TrendingUp,
  UserCheck,
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

type CoverageItem = {
  title: string;
  status: string;
  detail: string;
  tone: Tone;
  icon: LucideIcon;
};

type ScorecardItem = {
  metric: string;
  cadence: string;
  actual: string;
  target: string;
  score: number;
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

const requirementCoverage: CoverageItem[] = [
  {
    title: "Call records",
    status: "Available in app",
    detail:
      "calls table supports direction, status, disposition, duration, recordings, voicemail, agent, customer, yard, campaign and phone line.",
    tone: "emerald",
    icon: PhoneCall,
  },
  {
    title: "Ticket cases",
    status: "Available in app",
    detail:
      "tickets_v2 separates real cases from lightweight calls with callId, status, priority, follow-up owner and due date.",
    tone: "emerald",
    icon: ClipboardList,
  },
  {
    title: "Client number notes",
    status: "Available in app",
    detail:
      "customers already have phone, note, pinnedNote and a notes timeline, matching the persistent phone-number note requirement.",
    tone: "sky",
    icon: ListChecks,
  },
  {
    title: "Line of origin",
    status: "Available in app",
    detail:
      "phone_lines plus campaign and yard IDs can drive line, campaign and location attribution across calls and tickets.",
    tone: "sky",
    icon: Radio,
  },
  {
    title: "SMS analytics",
    status: "Aircall feed required",
    detail:
      "SMS volume, reply rate, open rate and message timeline panels are reserved for the two-way SMS integration.",
    tone: "amber",
    icon: MessageSquare,
  },
  {
    title: "Live wallboard",
    status: "Aircall Analytics+ required",
    detail:
      "queue depth, agent availability, utilization history and peak-hour heatmaps need live Aircall status and analytics events.",
    tone: "amber",
    icon: Headphones,
  },
];

const operationsMetrics: Metric[] = [
  {
    label: "Calls handled today",
    value: "728",
    detail: "432 inbound, 296 outbound",
    trend: "Source: calls.direction + agent",
    tone: "emerald",
    icon: PhoneCall,
  },
  {
    label: "Avg response time",
    value: "1m 18s",
    detail: "answeredAt - startedAt",
    trend: "Daily leadership KPI",
    tone: "sky",
    icon: Clock3,
  },
  {
    label: "Avg handle time",
    value: "5m 21s",
    detail: "Duration by line",
    trend: "ACW added after Aircall sync",
    tone: "amber",
    icon: Timer,
  },
  {
    label: "Follow-ups due",
    value: "37",
    detail: "14 overdue, 23 due today",
    trend: "Owner + due date workflow",
    tone: "rose",
    icon: AlertTriangle,
  },
];

const executiveMetrics: Metric[] = [
  {
    label: "Call volume by line",
    value: "14,820",
    detail: "All lines, last 30 days",
    trend: "Daily call KPI",
    tone: "emerald",
    icon: Radio,
  },
  {
    label: "Open tickets by line",
    value: "164",
    detail: "39 overdue or emergency",
    trend: "Daily ticket KPI",
    tone: "rose",
    icon: ClipboardList,
  },
  {
    label: "Ticket / call ratio",
    value: "18.4%",
    detail: "Calls that became cases",
    trend: "Weekly leadership KPI",
    tone: "indigo",
    icon: BarChart3,
  },
  {
    label: "Resolution rate by line",
    value: "82%",
    detail: "Resolved tickets / total",
    trend: "Monthly leadership KPI",
    tone: "sky",
    icon: CheckCircle2,
  },
];

const marketingMetrics: Metric[] = [
  {
    label: "Contact rate",
    value: "64%",
    detail: "Connected / attempted",
    trend: "Daily by campaign",
    tone: "emerald",
    icon: Target,
  },
  {
    label: "PTP + enrollment outcomes",
    value: "1,427",
    detail: "Promise to Pay and Enrolled tags",
    trend: "Disposition-driven funnel",
    tone: "indigo",
    icon: TrendingUp,
  },
  {
    label: "SMS reply rate",
    value: "31%",
    detail: "Post-call texts by campaign",
    trend: "Aircall SMS required",
    tone: "amber",
    icon: MessageSquare,
  },
  {
    label: "Calls per yard",
    value: "48",
    detail: "Tracked locations",
    trend: "Yard tags or dedicated numbers",
    tone: "sky",
    icon: MapPin,
  },
];

const operationsTrend = [
  { day: "Mon", inbound: 284, outbound: 226, missed: 18, tickets: 132 },
  { day: "Tue", inbound: 318, outbound: 244, missed: 22, tickets: 146 },
  { day: "Wed", inbound: 344, outbound: 268, missed: 19, tickets: 153 },
  { day: "Thu", inbound: 331, outbound: 251, missed: 24, tickets: 149 },
  { day: "Fri", inbound: 372, outbound: 289, missed: 23, tickets: 166 },
  { day: "Sat", inbound: 194, outbound: 122, missed: 13, tickets: 77 },
  { day: "Sun", inbound: 138, outbound: 92, missed: 9, tickets: 51 },
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
    detail: "Aircall live calls, app stores isLive",
    tone: "emerald" as Tone,
  },
  {
    label: "Queued callbacks",
    value: "11",
    detail: "Longest wait 02:18",
    tone: "amber" as Tone,
  },
  {
    label: "Agents available",
    value: "9",
    detail: "Requires Aircall user status",
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
    source: "phone_lines.label + AR campaigns",
    calls: "4,820",
    response: "1m 12s",
    contact: "68%",
    aht: "5m 48s",
    missed: "4.8%",
  },
  {
    line: "Wellness Outreach",
    source: "dedicated Aircall number",
    calls: "2,940",
    response: "1m 34s",
    contact: "58%",
    aht: "6m 12s",
    missed: "6.1%",
  },
  {
    line: "New Leads",
    source: "lead campaign phone line",
    calls: "3,180",
    response: "0m 54s",
    contact: "72%",
    aht: "4m 56s",
    missed: "3.9%",
  },
  {
    line: "New Client Onboarding",
    source: "campaign.tipo = ONBOARDING",
    calls: "1,470",
    response: "1m 46s",
    contact: "61%",
    aht: "7m 18s",
    missed: "5.3%",
  },
  {
    line: "General Support",
    source: "fallback phone line",
    calls: "3,410",
    response: "1m 26s",
    contact: "63%",
    aht: "5m 02s",
    missed: "4.6%",
  },
];

const followUpQueue = [
  {
    id: "CALL-1088",
    customer: "R. Alvarez",
    owner: "Maria G.",
    status: "Promise to Pay overdue",
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
    status: "Callback scheduled",
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

const executiveCallKpis: ScorecardItem[] = [
  {
    metric: "Call response time",
    cadence: "Daily",
    actual: "1m 18s",
    target: "< 1m 30s",
    score: 91,
  },
  {
    metric: "Average handle time by line",
    cadence: "Weekly",
    actual: "5m 21s",
    target: "< 6m",
    score: 89,
  },
  {
    metric: "Agent utilization rate",
    cadence: "Weekly",
    actual: "84%",
    target: "80-88%",
    score: 94,
  },
  {
    metric: "Callback promise kept rate",
    cadence: "Weekly",
    actual: "91%",
    target: "90%+",
    score: 91,
  },
  {
    metric: "Ticket response time",
    cadence: "Daily",
    actual: "18m",
    target: "< 20m",
    score: 90,
  },
  {
    metric: "Resolution rate by line",
    cadence: "Monthly",
    actual: "82%",
    target: "86%",
    score: 82,
  },
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
    line: "AR Collections",
    open: 42,
    overdue: 6,
    response: "18m",
    resolution: "14h",
    rate: "86%",
  },
  {
    yard: "Orlando",
    line: "Wellness Outreach",
    open: 31,
    overdue: 3,
    response: "21m",
    resolution: "16h",
    rate: "83%",
  },
  {
    yard: "Tampa",
    line: "New Leads",
    open: 28,
    overdue: 7,
    response: "27m",
    resolution: "19h",
    rate: "74%",
  },
  {
    yard: "Jacksonville",
    line: "New Client Onboarding",
    open: 19,
    overdue: 2,
    response: "14m",
    resolution: "11h",
    rate: "89%",
  },
];

const heatmapHours = [
  "8a",
  "9a",
  "10a",
  "11a",
  "12p",
  "1p",
  "2p",
  "3p",
  "4p",
  "5p",
];
const peakHourHeatmap = [
  { day: "Mon", values: [18, 26, 38, 52, 61, 58, 49, 44, 31, 20] },
  { day: "Tue", values: [22, 31, 42, 59, 67, 64, 56, 47, 35, 24] },
  { day: "Wed", values: [24, 35, 48, 63, 72, 69, 61, 53, 39, 27] },
  { day: "Thu", values: [21, 33, 45, 57, 66, 62, 55, 51, 37, 25] },
  { day: "Fri", values: [19, 29, 41, 54, 62, 59, 48, 42, 32, 22] },
  { day: "Sat", values: [10, 16, 24, 31, 36, 33, 28, 23, 18, 12] },
  { day: "Sun", values: [7, 12, 17, 21, 24, 23, 19, 16, 12, 9] },
];

const leadershipCadence = [
  {
    group: "Call KPI",
    metric: "Total call volume by yard / line",
    cadence: "Daily",
    source: "calls + phone_lines + yards",
  },
  {
    group: "Call KPI",
    metric: "Call response time",
    cadence: "Daily",
    source: "startedAt / answeredAt",
  },
  {
    group: "Call KPI",
    metric: "Average handle time by line",
    cadence: "Weekly",
    source: "duration + line",
  },
  {
    group: "Call KPI",
    metric: "Agent utilization rate",
    cadence: "Weekly",
    source: "Aircall status history",
  },
  {
    group: "Call KPI",
    metric: "Callback promise kept rate",
    cadence: "Weekly",
    source: "follow-up due date + final disposition",
  },
  {
    group: "Call KPI",
    metric: "Peak call hour heatmap",
    cadence: "Monthly",
    source: "Aircall Analytics+",
  },
  {
    group: "Ticket KPI",
    metric: "Open tickets by yard / line",
    cadence: "Daily",
    source: "tickets_v2 + yards + phone_lines",
  },
  {
    group: "Ticket KPI",
    metric: "Ticket response time",
    cadence: "Daily",
    source: "ticket createdAt / first update",
  },
  {
    group: "Ticket KPI",
    metric: "Ticket resolution time",
    cadence: "Weekly",
    source: "createdAt / updatedAt",
  },
  {
    group: "Ticket KPI",
    metric: "Overdue tickets by agent",
    cadence: "Daily",
    source: "status + assigned agent",
  },
  {
    group: "Ticket KPI",
    metric: "Ticket volume vs. call volume ratio",
    cadence: "Weekly",
    source: "tickets_v2 / calls",
  },
  {
    group: "Ticket KPI",
    metric: "Resolution rate by line",
    cadence: "Monthly",
    source: "ticket status + phone line",
  },
];

const campaignRates = [
  { campaign: "AR", contact: 68, conversion: 31, sms: 24, roi: 3.9 },
  { campaign: "Wellness", contact: 58, conversion: 42, sms: 36, roi: 4.2 },
  { campaign: "Leads", contact: 72, conversion: 19, sms: 28, roi: 2.7 },
  { campaign: "Onboarding", contact: 61, conversion: 54, sms: 41, roi: 3.1 },
];

const leadFunnel = [
  { stage: "New leads", value: 1240, pct: 100 },
  { stage: "Called", value: 1014, pct: 82 },
  { stage: "Connected", value: 731, pct: 59 },
  { stage: "Qualified", value: 412, pct: 33 },
  { stage: "Enrolled", value: 231, pct: 19 },
];

const arFunnel = [
  { stage: "Dials", value: 4820, pct: 100 },
  { stage: "Contacts", value: 3278, pct: 68 },
  { stage: "Promise to Pay", value: 1196, pct: 25 },
  { stage: "Paid", value: 612, pct: 13 },
];

const smsTrend = [
  { week: "W1", sent: 820, replies: 214, rate: 26 },
  { week: "W2", sent: 934, replies: 282, rate: 30 },
  { week: "W3", sent: 1048, replies: 329, rate: 31 },
  { week: "W4", sent: 1180, replies: 386, rate: 33 },
];

const dispositionBreakdown = [
  { name: "Resolved", value: 24, color: toneClasses.emerald.chart },
  { name: "Callback Required", value: 13, color: toneClasses.sky.chart },
  { name: "Callback Scheduled", value: 9, color: "#38bdf8" },
  { name: "Voicemail Left", value: 7, color: toneClasses.slate.chart },
  { name: "No Answer", value: 18, color: toneClasses.amber.chart },
  { name: "Promise to Pay", value: 12, color: "#16a34a" },
  { name: "Dispute", value: 6, color: toneClasses.rose.chart },
  { name: "Wrong Number", value: 4, color: "#78716c" },
  { name: "Enrolled", value: 6, color: toneClasses.indigo.chart },
  { name: "Escalated", value: 5, color: "#9333ea" },
];

const yardVolume = [
  { yard: "Miami", calls: 1840, outcomes: 612 },
  { yard: "Orlando", calls: 1320, outcomes: 421 },
  { yard: "Tampa", calls: 1184, outcomes: 336 },
  { yard: "Jacksonville", calls: 872, outcomes: 294 },
  { yard: "Atlanta", calls: 641, outcomes: 178 },
];

const marketingUseCases = [
  {
    campaign: "AR Collections",
    measures: "Dials, contacts reached, PTPs, avg duration, payment outcomes",
    source: "calls.disposition + campaign.tipo = AR",
  },
  {
    campaign: "Wellness Outreach",
    measures: "Enrollment conversion, best call windows, SMS engagement",
    source: "campaign line + Aircall SMS",
  },
  {
    campaign: "Lead Campaigns",
    measures: "Speed-to-lead, hot/warm/cold outcomes, lead-to-enrollment funnel",
    source: "startedAt / answeredAt + dispositions",
  },
  {
    campaign: "New Client Onboarding",
    measures: "Completion rate by stage, recording compliance, post-call SMS",
    source: "campaign.tipo = ONBOARDING",
  },
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
              "flex size-10 shrink-0 items-center justify-center rounded-[8px] border",
              tone.iconWrap,
              tone.border,
            )}
          >
            <Icon className={cn("size-5", tone.icon)} aria-hidden />
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
        <span className={cn("size-2 rounded-full", toneClass.bg)} />
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
        <p className="mt-2 max-w-4xl text-sm leading-6 text-slate-600 dark:text-slate-400">
          Mockups aligned to the Aircall platform analysis and the March 2026
          Rig Hut upgrade proposals: calls vs. tickets, client number notes,
          line-of-origin attribution, structured dispositions, follow-ups, SMS,
          yard reporting and leadership KPI cadence.
        </p>
      </div>
      <div className="flex flex-wrap gap-2 lg:justify-end">
        <Button
          type="button"
          variant="outline"
          className="h-9 rounded-[8px] border-slate-200 bg-white text-slate-700 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-200"
        >
          <CalendarDays className="size-4" aria-hidden />
          Last 30 days
        </Button>
        <Button type="button" className="h-9 rounded-[8px]">
          <Download className="size-4" aria-hidden />
          Export
        </Button>
      </div>
    </div>
  );
}

function RequirementCoveragePanel() {
  return (
    <PanelCard
      title="Requirement-to-data alignment"
      subtitle="What the current app can support now, and what must arrive from Aircall for the full dashboard layer."
    >
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {requirementCoverage.map((item) => {
          const Icon = item.icon;
          const tone = toneClasses[item.tone];

          return (
            <div
              key={item.title}
              className="rounded-[8px] border border-slate-200 p-3 dark:border-slate-800"
            >
              <div className="flex items-start gap-3">
                <span
                  className={cn(
                    "flex size-9 shrink-0 items-center justify-center rounded-[8px] border",
                    tone.iconWrap,
                    tone.border,
                  )}
                >
                  <Icon className={cn("size-4", tone.icon)} aria-hidden />
                </span>
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-sm font-semibold text-slate-950 dark:text-slate-50">
                      {item.title}
                    </p>
                    <StatusBadge tone={item.tone}>{item.status}</StatusBadge>
                  </div>
                  <p className="mt-2 text-sm leading-5 text-slate-600 dark:text-slate-400">
                    {item.detail}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </PanelCard>
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
          subtitle="Inbound, outbound, missed calls and tickets created by day."
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
                  name="Inbound calls"
                  stroke={toneClasses.emerald.chart}
                  fill="url(#inboundFill)"
                  strokeWidth={2}
                />
                <Area
                  type="monotone"
                  dataKey="outbound"
                  name="Outbound calls"
                  stroke={toneClasses.sky.chart}
                  fill="url(#outboundFill)"
                  strokeWidth={2}
                />
                <Line
                  type="monotone"
                  dataKey="tickets"
                  name="Tickets opened"
                  stroke={toneClasses.indigo.chart}
                  strokeWidth={2}
                  dot={false}
                />
                <Line
                  type="monotone"
                  dataKey="missed"
                  name="Missed"
                  stroke={toneClasses.rose.chart}
                  strokeWidth={2}
                  dot={false}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </PanelCard>

        <PanelCard
          title="Live wallboard"
          subtitle="Real-time queue visibility requested for supervisors."
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
                  name="Calls handled"
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
        subtitle="Line-of-origin performance for staffing, attribution and SLA review."
      >
        <div className="overflow-x-auto">
          <table className="w-full min-w-[920px] text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-slate-600 dark:border-slate-800 dark:text-slate-400">
                <th className="py-3 pr-4 font-medium">Line / campaign</th>
                <th className="py-3 pr-4 font-medium">Source in app</th>
                <th className="py-3 pr-4 font-medium">Calls</th>
                <th className="py-3 pr-4 font-medium">Response</th>
                <th className="py-3 pr-4 font-medium">Contact rate</th>
                <th className="py-3 pr-4 font-medium">AHT</th>
                <th className="py-3 pr-4 font-medium">Missed</th>
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
                  <td className="py-3 pr-4 text-slate-600 dark:text-slate-400">
                    {line.source}
                  </td>
                  <td className="py-3 pr-4 tabular-nums text-slate-700 dark:text-slate-300">
                    {line.calls}
                  </td>
                  <td className="py-3 pr-4 text-slate-700 dark:text-slate-300">
                    {line.response}
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
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </PanelCard>
    </div>
  );
}

function ScorecardProgress({ item }: { item: ScorecardItem }) {
  return (
    <div className="space-y-2">
      <div className="grid gap-2 sm:grid-cols-[1fr_auto] sm:items-center">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
              {item.metric}
            </span>
            <StatusBadge tone="slate">{item.cadence}</StatusBadge>
          </div>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            Target: {item.target}
          </p>
        </div>
        <span className="text-sm font-semibold tabular-nums text-slate-950 dark:text-slate-50">
          {item.actual}
        </span>
      </div>
      <div className="h-2 rounded-full bg-slate-100 dark:bg-slate-900">
        <div
          className={cn(
            "h-2 rounded-full",
            item.score >= 90
              ? "bg-emerald-600"
              : item.score >= 80
                ? "bg-amber-500"
                : "bg-rose-600",
          )}
          style={{ width: `${item.score}%` }}
        />
      </div>
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
          title="Leadership KPI scorecard"
          subtitle="Call KPIs and ticket KPIs compared against operating targets."
        >
          <div className="space-y-4">
            {executiveCallKpis.map((item) => (
              <ScorecardProgress key={item.metric} item={item} />
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
          title="Ticket risk by yard and line"
          subtitle="Open workload, overdue count, response time and resolution rate."
        >
          <div className="overflow-x-auto">
            <table className="w-full min-w-[700px] text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-slate-600 dark:border-slate-800 dark:text-slate-400">
                  <th className="py-3 pr-4 font-medium">Yard</th>
                  <th className="py-3 pr-4 font-medium">Line</th>
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
                    key={`${yard.yard}-${yard.line}`}
                    className="border-b border-slate-100 last:border-b-0 dark:border-slate-900"
                  >
                    <td className="py-3 pr-4 font-semibold text-slate-950 dark:text-slate-50">
                      {yard.yard}
                    </td>
                    <td className="py-3 pr-4 text-slate-700 dark:text-slate-300">
                      {yard.line}
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

      <PanelCard
        title="Automated report cadence"
        subtitle="Daily, weekly and monthly leadership metrics mapped to available app data and Aircall data."
      >
        <div className="overflow-x-auto">
          <table className="w-full min-w-[820px] text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-slate-600 dark:border-slate-800 dark:text-slate-400">
                <th className="py-3 pr-4 font-medium">Group</th>
                <th className="py-3 pr-4 font-medium">Metric</th>
                <th className="py-3 pr-4 font-medium">Cadence</th>
                <th className="py-3 pr-4 font-medium">Primary source</th>
              </tr>
            </thead>
            <tbody>
              {leadershipCadence.map((row) => (
                <tr
                  key={`${row.group}-${row.metric}`}
                  className="border-b border-slate-100 last:border-b-0 dark:border-slate-900"
                >
                  <td className="py-3 pr-4">
                    <StatusBadge tone={row.group === "Call KPI" ? "sky" : "indigo"}>
                      {row.group}
                    </StatusBadge>
                  </td>
                  <td className="py-3 pr-4 font-medium text-slate-950 dark:text-slate-50">
                    {row.metric}
                  </td>
                  <td className="py-3 pr-4 text-slate-700 dark:text-slate-300">
                    {row.cadence}
                  </td>
                  <td className="py-3 pr-4 text-slate-600 dark:text-slate-400">
                    {row.source}
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
          subtitle="Contact rate, outcome conversion, SMS reply rate and ROI by campaign line."
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
                  name="Outcome %"
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
          title="Post-integration SMS engagement"
          subtitle="Two-way SMS volume, replies and response rate. Requires Aircall SMS sync."
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
          title="Mandatory disposition mix"
          subtitle="Exact structured outcomes from the upgrade proposal and call enum."
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
                    paddingAngle={2}
                  >
                    {dispositionBreakdown.map((entry) => (
                      <Cell key={entry.name} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={tooltipStyle} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="grid gap-2 sm:grid-cols-2">
              {dispositionBreakdown.map((item) => (
                <div
                  key={item.name}
                  className="flex min-h-10 items-center justify-between gap-3 rounded-[8px] border border-slate-200 p-2 dark:border-slate-800"
                >
                  <span className="flex min-w-0 items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-300">
                    <span
                      className="size-3 shrink-0 rounded-[4px]"
                      style={{ backgroundColor: item.color }}
                    />
                    <span className="truncate">{item.name}</span>
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
        title="Campaign measurement plan"
        subtitle="Marketing requirements from the proposals mapped to real app entities and Aircall extensions."
      >
        <div className="overflow-x-auto">
          <table className="w-full min-w-[860px] text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-slate-600 dark:border-slate-800 dark:text-slate-400">
                <th className="py-3 pr-4 font-medium">Campaign</th>
                <th className="py-3 pr-4 font-medium">Measure</th>
                <th className="py-3 pr-4 font-medium">Primary source</th>
              </tr>
            </thead>
            <tbody>
              {marketingUseCases.map((row) => (
                <tr
                  key={row.campaign}
                  className="border-b border-slate-100 last:border-b-0 dark:border-slate-900"
                >
                  <td className="py-3 pr-4 font-semibold text-slate-950 dark:text-slate-50">
                    {row.campaign}
                  </td>
                  <td className="py-3 pr-4 text-slate-700 dark:text-slate-300">
                    {row.measures}
                  </td>
                  <td className="py-3 pr-4 text-slate-600 dark:text-slate-400">
                    {row.source}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </PanelCard>

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
      <RequirementCoveragePanel />

      <Tabs defaultValue="operations" className="space-y-4">
        <TabsList className="grid h-auto w-full grid-cols-1 rounded-[8px] border border-slate-200 bg-slate-50 p-1 dark:border-slate-800 dark:bg-slate-900 sm:grid-cols-3 lg:w-fit">
          <TabsTrigger
            value="operations"
            className="min-h-10 rounded-[6px] text-sm"
          >
            <Headphones className="size-4" aria-hidden />
            Operations
          </TabsTrigger>
          <TabsTrigger
            value="executive"
            className="min-h-10 rounded-[6px] text-sm"
          >
            <Users className="size-4" aria-hidden />
            Executive
          </TabsTrigger>
          <TabsTrigger
            value="marketing"
            className="min-h-10 rounded-[6px] text-sm"
          >
            <UserCheck className="size-4" aria-hidden />
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
