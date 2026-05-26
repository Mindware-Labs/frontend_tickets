
"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { formatDistanceToNow } from "date-fns";
import { CallActions } from "@/components/dashboard/call-actions";
import KPICard from "@/components/dashboard/kpi-card";
import {
  Ticket as TicketIcon,
  RotateCcw,
  Clock,
  Target,
  CheckCircle2,
  AlertCircle,
  BarChart3,
  PieChart,
  ArrowRight,
  Phone,
  ClipboardList,
} from "lucide-react";
import { FiAlertTriangle } from "react-icons/fi";
import { Button } from "@/components/ui/button";
import { auth } from "@/lib/auth";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { toast } from "sonner";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  Bar,
  BarChart,
  CartesianGrid,
  RadialBar,
  RadialBarChart,
  XAxis,
  YAxis,
  Area,
  AreaChart,
} from "recharts";
import { TableCampaignBadge } from "@/components/entity-table-badges";
import { cn } from "@/lib/utils";

// ============================================
// Funciones auxiliares (sin dependencias de utils)
// ============================================
function formatRelativeDate(value?: string | null) {
  if (!value) return "—";
  const date = new Date(value);
  if (isNaN(date.getTime())) return "—";
  return formatDistanceToNow(date, { addSuffix: true });
}

function formatDuration(seconds?: number | null): string {
  if (!seconds || seconds <= 0) return "—";
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  if (mins === 0) return `${secs}s`;
  return `${mins}m ${secs}s`;
}

// ============================================
// Tipos locales (coinciden con los datos reales de la API)
// ============================================
type AgentTicket = {
  id?: number;
  status?: string | null;
  priority?: string | null;
  createdAt?: string | null;
  assignedTo?: { id?: number; name?: string; email?: string } | null;
  agentId?: number | string | null;
  assignedToId?: number | string | null;
  campaign?: string | { nombre?: string } | null;
  disposition?: string | null;
  duration?: number;
  direction?: string;
};

type AgentManualRecord = {
  id: number;
  status?: string | null;
  disposition?: string | null;
  createdAt?: string | null;
  createdByAgentId?: number | null;
  customer?: { name?: string; phone?: string };
};

type DashboardTicket = {
  id: number;
  clientName: string;
  campaign: string;
  status: string;
  createdAt: string;
};

type DashboardData = {
  generatedAt: string;
  kpis: {
    totalCalls: number;
    totalTickets: number;
    activeTickets: number;
    openTickets: number;
    inProgressTickets: number;
    closedTickets: number;
    pendingActions: number;
    resolutionRate: number;
    callsLast7Days: number;
  };
  charts: {
    callsByDay: { day: string; calls: number }[];
    ticketsByCampaign: { name: string; count: number }[];
    ticketsByDisposition: { name: string; count: number }[];
  };
  recentTickets: DashboardTicket[];
  recentManualRecords?: AgentManualRecord[];
  agentKpis?: ExtendedAgentKPIs;
  summary?: {
    agentId: number;
    totalActivity: number;
    totalCalls: number;
    totalTickets: number;
    totalManualRecords: number;
    needsAttention: number;
    completionRate: number;
    resolutionRate: number;
  };
};

type ExtendedAgentKPIs = {
  totalCalls: number;
  resolvedCalls: number;
  missedCalls: number;
  avgDurationSec: number;
  totalTickets: number;
  resolvedTickets: number;
  pendingFollowupTickets: number;
  overdueTickets: number;
  resolutionRate: number;
  totalManualRecords: number;
  resolvedManualRecords: number;
  completionRate: number;
};

// ============================================
// Componente principal
// ============================================
export default function AgentDashboardPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [agentKpis, setAgentKpis] = useState<ExtendedAgentKPIs | null>(null);
  const [personalData, setPersonalData] = useState<DashboardData | null>(null);
  const [manualRecords, setManualRecords] = useState<AgentManualRecord[]>([]);
  const [manualRecordsLoading, setManualRecordsLoading] = useState(false);
  const [manualRecordsError, setManualRecordsError] = useState<string | null>(null);

  const currentUser = auth.getUser?.();
  const agentId = currentUser?.id;

  // ============================================
  // Carga de datos
  // ============================================
  const loadDashboard = useCallback(async () => {
    setIsLoading(true);
    setLoadError(null);
    try {
      const response = await fetch("/api/dashboard/agent-stats", {
        cache: "no-store",
      });
      const payload = await response.json();
      if (!payload?.success) {
        throw new Error(payload?.message || "Unable to load dashboard data.");
      }
      const data = payload.data as DashboardData;
      setDashboardData(data);
      setAgentKpis(data.agentKpis || null);
      setManualRecords(data.recentManualRecords || []);
      setManualRecordsError(null);
    } catch (error: any) {
      setLoadError(error.message || "Unable to load dashboard data.");
      setDashboardData(null);
      setAgentKpis(null);
      setManualRecords([]);
      setManualRecordsError(error.message || "Failed to load manual records");
      toast.error("Failed to load dashboard data.", {
        description: error.message || "Please try again.",
      });
    } finally {
      setIsLoading(false);
    }
  }, []);

  const loadAgentKpis = useCallback(async () => {
    const calls: AgentTicket[] = [];
    const tickets: AgentTicket[] = [];
    const manualRecordsRaw: AgentManualRecord[] = [];
    return;

    // Calcular KPIs
    // totalCalls viene de la API de llamadas
    const totalCalls = calls.length;
    const resolvedCalls = calls.filter(
      (t) => t.status?.toUpperCase() === "COMPLETED" || t.disposition?.toUpperCase() === "RESOLVED" || t.status?.toUpperCase() === "RESOLVED"
    ).length;
    const missedCalls = calls.filter((t) => t.direction?.toUpperCase() === "MISSED").length;
    const totalDuration = calls.reduce((sum, t) => sum + (t.duration || 0), 0);
    const avgDurationSec = totalCalls ? Math.round(totalDuration / totalCalls) : 0;

    // totalTickets viene de la API de tickets
    const totalTickets = tickets.length;
    const resolvedTickets = tickets.filter(
      (t) => t.status?.toUpperCase() === "RESOLVED" || t.status?.toUpperCase() === "CLOSED"
    ).length;
    const pendingFollowupTickets = tickets.filter(
      (t) => t.status?.toUpperCase() === "PENDING_FOLLOWUP"
    ).length;
    const overdueTickets = tickets.filter((t) => t.status?.toUpperCase() === "OVERDUE").length;
    const resolutionRate = totalTickets ? Math.round((resolvedTickets / totalTickets) * 100) : 0;

    const totalManualRecords = manualRecordsRaw.length;
    const resolvedManualRecords = manualRecordsRaw.filter(
      (r) => r.status?.toUpperCase() === "RESOLVED" || r.status?.toUpperCase() === "CLOSED"
    ).length;
    const completionRate = totalManualRecords ? Math.round((resolvedManualRecords / totalManualRecords) * 100) : 0;

    setAgentKpis({
      totalCalls,
      resolvedCalls,
      missedCalls,
      avgDurationSec,
      totalTickets,
      resolvedTickets,
      pendingFollowupTickets,
      overdueTickets,
      resolutionRate,
      totalManualRecords,
      resolvedManualRecords,
      completionRate,
    });

    // Preparar datos para gráficos y tabla de tickets recientes
    const now = new Date();
    const dayBuckets = Array.from({ length: 7 }).map((_, idx) => {
      const date = new Date(now);
      date.setDate(now.getDate() - (6 - idx));
      date.setHours(0, 0, 0, 0);
      return {
        key: date.toISOString().slice(0, 10),
        label: date.toLocaleDateString("en-US", { weekday: "short" }),
        count: 0,
      };
    });
    const bucketMap = dayBuckets.reduce<Record<string, number>>((acc, b, i) => {
      acc[b.key] = i;
      return acc;
    }, {});

    // Usamos 'calls' para el gráfico de volumen de llamadas
    calls.forEach((call) => {
      if (!call.createdAt) return;
      const created = new Date(call.createdAt);
      if (isNaN(created.getTime())) return;
      const key = created.toISOString().slice(0, 10);
      const idx = bucketMap[key];
      if (idx !== undefined) dayBuckets[idx].count += 1;
    });

    const callsByDay = dayBuckets.map((b) => ({ day: b.label, calls: b.count }));

    const normalizeLabel = (value: unknown) => {
      if (value === null || value === undefined) return "Unspecified";
      if (typeof value === "string") {
        const trimmed = value.trim();
        if (!trimmed) return "Unspecified";
        return trimmed
          .toLowerCase()
          .split("_")
          .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
          .join(" ");
      }
      return String(value);
    };

    // Usamos 'tickets' para la distribución por campaña y disposición
    const ticketsByCampaignMap = tickets.reduce<Record<string, number>>((acc, ticket) => {
      let campaignLabel = "Unspecified";
      if (ticket.campaign && typeof ticket.campaign === "object" && "nombre" in ticket.campaign) {
        campaignLabel = (ticket.campaign as any).nombre || "Unspecified";
      } else if (typeof (ticket as any).campaign === "string") {
        campaignLabel = normalizeLabel((ticket as any).campaign);
      }
      acc[campaignLabel] = (acc[campaignLabel] || 0) + 1;
      return acc;
    }, {});

    const ticketsByDispositionMap = tickets.reduce<Record<string, number>>((acc, ticket) => {
      const label = normalizeLabel((ticket as any).disposition || "Unspecified");
      acc[label] = (acc[label] || 0) + 1;
      return acc;
    }, {});

    const ticketsByCampaign = Object.entries(ticketsByCampaignMap).map(([name, count]) => ({ name, count }));
    const ticketsByDisposition = Object.entries(ticketsByDispositionMap).map(([name, count]) => ({ name, count }));

    const recentTickets: DashboardTicket[] = tickets.slice(0, 5).map((ticket) => ({
      id: Number(ticket.id || 0),
      clientName:
        (ticket as any).clientName ||
        (ticket as any).customer?.name ||
        (ticket as any).customer?.nombre ||
        "Unassigned",
      campaign: (ticket as any).campaign?.nombre || (ticket as any).campaign || "Unspecified",
      status: normalizeLabel(ticket.status || "Unspecified"),
      createdAt: ticket.createdAt || new Date().toISOString(),
    }));

    setPersonalData({
      kpis: {
        totalCalls: totalCalls,
        totalTickets: totalTickets,
        activeTickets: tickets.filter((t) => !["RESOLVED", "CLOSED"].includes(t.status?.toUpperCase() || "")).length,
        openTickets: tickets.filter((t) => t.status?.toUpperCase() === "OPEN").length,
        inProgressTickets: tickets.filter((t) => t.status?.toUpperCase() === "IN_PROGRESS").length,
        closedTickets: resolvedTickets,
        pendingActions: tickets.filter((t) => t.priority?.toUpperCase() === "HIGH" && t.status?.toUpperCase() !== "RESOLVED").length,
        resolutionRate,
        callsLast7Days: dayBuckets.reduce((sum, b) => sum + b.count, 0),
      },
      charts: { callsByDay, ticketsByCampaign, ticketsByDisposition },
      recentTickets,
      generatedAt: new Date().toISOString(),
    });
  }, [agentId]);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  // ============================================
  // Datos para gráficos (siempre se ejecutan)
  // ============================================
  const callsData = useMemo(
    () =>
      (personalData || dashboardData)?.charts.callsByDay?.length
        ? (personalData || dashboardData)!.charts.callsByDay
        : [
            { day: "Mon", calls: 0 },
            { day: "Tue", calls: 0 },
            { day: "Wed", calls: 0 },
            { day: "Thu", calls: 0 },
            { day: "Fri", calls: 0 },
            { day: "Sat", calls: 0 },
            { day: "Sun", calls: 0 },
          ],
    [dashboardData, personalData]
  );

  const typeData = useMemo(
    () =>
      (personalData || dashboardData)?.charts.ticketsByDisposition?.length
        ? (personalData || dashboardData)!.charts.ticketsByDisposition
        : [{ name: "No data", count: 0 }],
    [dashboardData, personalData]
  );

  const campaignData = useMemo(
    () =>
      (personalData || dashboardData)?.charts.ticketsByCampaign?.length
        ? (personalData || dashboardData)!.charts.ticketsByCampaign
        : [{ name: "No data", count: 0 }],
    [dashboardData, personalData]
  );

  const chartConfig = useMemo<ChartConfig>(
    () => ({
      calls: { label: "Calls", color: "hsl(var(--primary))" },
      tickets: { label: "Tickets", color: "hsl(var(--chart-2))" },
      "segment-0": { label: "Type 1", color: "hsl(var(--chart-1))" },
      "segment-1": { label: "Type 2", color: "hsl(var(--chart-2))" },
      "segment-2": { label: "Type 3", color: "hsl(var(--chart-3))" },
      "segment-3": { label: "Type 4", color: "hsl(var(--chart-4))" },
      "segment-4": { label: "Type 5", color: "hsl(var(--chart-5))" },
    }),
    []
  );

  const radialData = useMemo(
    () =>
      typeData.map((item, index) => {
        const segmentKey = `segment-${index % 5}`;
        return {
          name: item.name,
          count: item.count,
          segmentKey,
          fill: `var(--color-${segmentKey})`,
        };
      }),
    [typeData]
  );

  const campaignChartData = useMemo(
    () => campaignData.map((campaign) => ({ name: campaign.name, tickets: campaign.count })),
    [campaignData]
  );

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 18) return "Good afternoon";
    return "Good evening";
  };

  const isLoadingAny = isLoading || manualRecordsLoading;
  const hasData = !!(dashboardData || personalData || agentKpis);

  const baseData = personalData || dashboardData;
  const generatedAt = baseData?.generatedAt || new Date().toISOString();
  const recentTickets = baseData?.recentTickets || [];
  const myKpis = agentKpis || {
    totalCalls: 0,
    resolvedCalls: 0,
    missedCalls: 0,
    avgDurationSec: 0,
    totalTickets: 0,
    resolvedTickets: 0,
    pendingFollowupTickets: 0,
    overdueTickets: 0,
    resolutionRate: 0,
    totalManualRecords: 0,
    resolvedManualRecords: 0,
    completionRate: 0,
  };
  const overallKpis = dashboardData?.kpis || {
    totalCalls: 0,
    totalTickets: 0,
    activeTickets: 0,
    openTickets: 0,
    inProgressTickets: 0,
    closedTickets: 0,
    pendingActions: 0,
    resolutionRate: 0,
    callsLast7Days: 0,
  };

  const statusClass = (status: string) => {
    const s = status.toLowerCase();
    if (s.includes("open")) return "bg-blue-500/10 text-blue-700 border-blue-200 dark:text-blue-400 dark:border-blue-800";
    if (s.includes("progress")) return "bg-amber-500/10 text-amber-700 border-amber-200 dark:text-amber-400 dark:border-amber-800";
    if (s.includes("resolved") || s.includes("closed")) return "bg-emerald-500/10 text-emerald-700 border-emerald-200 dark:text-emerald-400 dark:border-emerald-800";
    return "bg-muted text-muted-foreground border-border";
  };

  const recentManualRecords = useMemo(
    () => [...manualRecords].sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()).slice(0, 5),
    [manualRecords]
  );

  // ============================================
  // Renderizado principal (sin returns condicionales)
  // ============================================
  return (
    <div className="space-y-8 p-1 animate-in fade-in duration-500 pb-10">
      {isLoadingAny && !hasData ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      ) : !hasData ? (
        <div className="flex h-[50vh] flex-col items-center justify-center space-y-4">
          <div className="rounded-full bg-muted p-4">
            <FiAlertTriangle className="h-8 w-8 text-muted-foreground" />
          </div>
          <h1 className="text-xl font-semibold tracking-tight text-foreground">
            Dashboard Unavailable
          </h1>
          <p className="text-sm text-muted-foreground max-w-xs text-center">
            {loadError || "No dashboard data available yet."}
          </p>
          <Button onClick={loadDashboard} variant="outline" size="sm">
            Try Again
          </Button>
        </div>
      ) : (
        <>
          {/* HEADER */}
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-foreground">
                {getGreeting()}, {currentUser?.name ?? "Agent"}
              </h1>
              <p className="text-muted-foreground mt-1">
                {new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
                {" — your performance overview"}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <div className="hidden sm:flex flex-col items-end text-right mr-2">
                <span className="text-xs text-muted-foreground">Last updated</span>
                <span className="text-xs font-medium tabular-nums">
                  {new Date(generatedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                </span>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  loadDashboard();
                }}
                className="shadow-sm"
                disabled={isLoadingAny}
              >
                <RotateCcw className={cn("mr-2 h-3.5 w-3.5", isLoadingAny && "animate-spin")} />
                Refresh
              </Button>
            </div>
          </div>

          {dashboardData?.summary && (
            <div className="grid grid-cols-2 gap-3 rounded-xl border bg-card p-3 shadow-sm md:grid-cols-5">
              <div>
                <p className="text-[11px] font-medium text-muted-foreground">Total Activity</p>
                <p className="text-xl font-semibold tabular-nums">{dashboardData.summary.totalActivity}</p>
              </div>
              <div>
                <p className="text-[11px] font-medium text-muted-foreground">Calls</p>
                <p className="text-xl font-semibold tabular-nums">{dashboardData.summary.totalCalls}</p>
              </div>
              <div>
                <p className="text-[11px] font-medium text-muted-foreground">Tickets</p>
                <p className="text-xl font-semibold tabular-nums">{dashboardData.summary.totalTickets}</p>
              </div>
              <div>
                <p className="text-[11px] font-medium text-muted-foreground">Manual Records</p>
                <p className="text-xl font-semibold tabular-nums">{dashboardData.summary.totalManualRecords}</p>
              </div>
              <div>
                <p className="text-[11px] font-medium text-muted-foreground">Needs Attention</p>
                <p className="text-xl font-semibold tabular-nums">{dashboardData.summary.needsAttention}</p>
              </div>
            </div>
          )}

          {/* Agent KPIs */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <KPICard
              title="My Calls"
              value={myKpis.totalCalls}
              secondaryValue={`${myKpis.resolvedCalls} resolved`}
              icon={Phone}
              iconBg="bg-primary"
              trend={`${myKpis.missedCalls} missed · ${formatDuration(myKpis.avgDurationSec)} avg`}
              trendUp={myKpis.missedCalls === 0}
            />
            <KPICard
              title="My Tickets"
              value={myKpis.totalTickets}
              secondaryValue={`${myKpis.resolvedTickets} closed`}
              icon={TicketIcon}
              iconBg="bg-indigo-500"
              trend={`${myKpis.pendingFollowupTickets} follow-up · ${myKpis.overdueTickets} overdue`}
              trendUp={myKpis.overdueTickets === 0}
            />
            <KPICard
              title="My Manual Records"
              value={myKpis.totalManualRecords}
              secondaryValue={`${myKpis.resolvedManualRecords} completed`}
              icon={ClipboardList}
              iconBg="bg-gray-500"
              trend={`${myKpis.completionRate}% completion rate`}
              trendUp={myKpis.completionRate >= 80}
            />
            <KPICard
              title="My Attention"
              value={myKpis.pendingFollowupTickets + myKpis.overdueTickets}
              secondaryValue="Requires attention"
              icon={AlertCircle}
              iconBg="bg-rose-500"
              trend={myKpis.pendingFollowupTickets + myKpis.overdueTickets === 0 ? "All clear" : `${myKpis.pendingFollowupTickets + myKpis.overdueTickets} critical`}
              trendUp={myKpis.pendingFollowupTickets + myKpis.overdueTickets === 0}
            />
          </div>

          {/* Alerta de urgencia */}
          {(myKpis.pendingFollowupTickets > 0 || myKpis.overdueTickets > 0) && (
            <div className="flex items-center gap-3 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm dark:border-rose-900/50 dark:bg-rose-950/30">
              <AlertCircle className="h-4 w-4 shrink-0 text-rose-600 dark:text-rose-400" />
              <span className="text-rose-700 dark:text-rose-300 font-medium">
                You have <strong>{myKpis.pendingFollowupTickets + myKpis.overdueTickets}</strong> ticket
                {(myKpis.pendingFollowupTickets + myKpis.overdueTickets) === 1 ? "" : "s"} requiring attention.
              </span>
              <a href="/calls?tab=tickets" className="ml-auto shrink-0 text-xs font-semibold text-rose-700 underline underline-offset-4 hover:opacity-80 dark:text-rose-300">
                View tickets
              </a>
            </div>
          )}

          {/* CONTENIDO PRINCIPAL: gráficos + tablas */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Columna izquierda (2/3) */}
            <div className="lg:col-span-2 space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <BarChart3 className="h-4 w-4 text-primary" />
                    Call Volume
                  </CardTitle>
                  <CardDescription>Daily call inflow over the last week</CardDescription>
                </CardHeader>
                <CardContent>
                  <ChartContainer config={chartConfig} className="h-62.5 w-full">
                    <AreaChart data={callsData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <defs>
                        <linearGradient id="fillCalls" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="var(--color-calls)" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="var(--color-calls)" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                      <XAxis dataKey="day" tickLine={false} axisLine={false} tickMargin={10} className="text-xs text-muted-foreground" />
                      <YAxis tickLine={false} axisLine={false} className="text-xs text-muted-foreground" />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Area type="monotone" dataKey="calls" stroke="var(--color-calls)" fill="url(#fillCalls)" strokeWidth={2} />
                    </AreaChart>
                  </ChartContainer>
                </CardContent>
              </Card>

              {/* Recent Tickets */}
              <Card className="overflow-hidden">
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle className="text-base flex items-center gap-2">
                      <Clock className="h-4 w-4 text-primary" />
                      Recent Tickets
                    </CardTitle>
                    <CardDescription>Latest tickets assigned to you</CardDescription>
                  </div>
                  <Button variant="ghost" size="sm" className="text-xs gap-1" asChild>
                    <a href="/calls?tab=tickets">View all <ArrowRight className="h-3 w-3" /></a>
                  </Button>
                </CardHeader>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader className="bg-muted/40">
                      <TableRow>
                        <TableHead className="w-20">ID</TableHead>
                        <TableHead>Client</TableHead>
                        <TableHead>Campaign</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {recentTickets.length ? (
                        recentTickets.map((ticket) => (
                          <TableRow key={ticket.id} className="group">
                            <TableCell className="font-mono text-xs text-muted-foreground">#{ticket.id}</TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <div className="h-8 w-8 rounded-full bg-secondary flex items-center justify-center text-xs font-bold text-secondary-foreground">
                                  {ticket.clientName.charAt(0)}
                                </div>
                                <div className="flex flex-col">
                                  <span className="font-medium text-sm">{ticket.clientName}</span>
                                  <span className="text-[10px] text-muted-foreground">
                                    {new Date(ticket.createdAt).toLocaleDateString()}
                                  </span>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell className="max-w-0 overflow-hidden">
                              <TableCampaignBadge name={ticket.campaign} />
                            </TableCell>
                            <TableCell>
                              <Badge variant="secondary" className={cn("font-medium text-[10px] uppercase", statusClass(ticket.status))}>
                                {ticket.status}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right">
                              <CallActions ticketId={String(ticket.id)} />
                            </TableCell>
                          </TableRow>
                        ))
                      ) : (
                        <TableRow>
                          <TableCell colSpan={5} className="h-32 text-center text-muted-foreground">
                            No tickets found.
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              </Card>

              {/* Recent Manual Records */}
              <Card className="overflow-hidden">
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle className="text-base flex items-center gap-2">
                      <ClipboardList className="h-4 w-4 text-primary" />
                      Recent Manual Records
                    </CardTitle>
                    <CardDescription>Latest manual records created by you</CardDescription>
                  </div>
                  <Button variant="ghost" size="sm" className="text-xs gap-1" asChild>
                    <a href="/calls?tab=manual-records">View all <ArrowRight className="h-3 w-3" /></a>
                  </Button>
                </CardHeader>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader className="bg-muted/40">
                      <TableRow>
                        <TableHead className="w-20">ID</TableHead>
                        <TableHead>Customer</TableHead>
                        <TableHead>Disposition</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Date</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {recentManualRecords.length ? (
                        recentManualRecords.map((record) => (
                          <TableRow key={record.id} className="group">
                            <TableCell className="font-mono text-xs text-muted-foreground">#{record.id}</TableCell>
                            <TableCell>{record.customer?.name || "—"}</TableCell>
                            <TableCell>{record.disposition || "—"}</TableCell>
                            <TableCell>
                              <Badge variant="secondary" className={cn("font-medium text-[10px] uppercase", statusClass(record.status || "Open"))}>
                                {record.status || "Open"}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-muted-foreground text-xs">
                              {record.createdAt ? formatRelativeDate(record.createdAt) : "—"}
                            </TableCell>
                          </TableRow>
                        ))
                      ) : (
                        <TableRow>
                          <TableCell colSpan={5} className="h-32 text-center text-muted-foreground">
                            {manualRecordsError ? `Error: ${manualRecordsError}` : "No manual records found."}
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              </Card>
            </div>

            {/* Columna derecha (1/3) */}
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <PieChart className="h-4 w-4 text-primary" />
                    Distribution
                  </CardTitle>
                  <CardDescription>Calls by disposition</CardDescription>
                </CardHeader>
                <CardContent>
                  <ChartContainer config={chartConfig} className="mx-auto aspect-square max-h-62.5">
                    <RadialBarChart data={radialData} innerRadius={40} outerRadius={100} startAngle={90} endAngle={-270}>
                      <RadialBar dataKey="count" background cornerRadius={5} />
                      <ChartTooltip cursor={false} content={<ChartTooltipContent hideLabel nameKey="segmentKey" />} />
                    </RadialBarChart>
                  </ChartContainer>
                  <div className="flex flex-wrap justify-center gap-2 mt-4">
                    {radialData.slice(0, 4).map((entry, index) => (
                      <div key={index} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <div className="h-2 w-2 rounded-full" style={{ backgroundColor: entry.fill }} />
                        <span className="truncate max-w-20">{entry.name}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Target className="h-4 w-4 text-primary" />
                    Top Campaigns
                  </CardTitle>
                  <CardDescription>Call volume by campaign</CardDescription>
                </CardHeader>
                <CardContent>
                  <ChartContainer config={chartConfig} className="h-62.5 w-full">
                    <BarChart data={campaignChartData} layout="vertical" margin={{ left: 0, right: 0 }}>
                      <CartesianGrid horizontal={false} strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <YAxis
                        dataKey="name"
                        type="category"
                        tickLine={false}
                        axisLine={false}
                        width={100}
                        className="text-xs font-medium"
                        tickFormatter={(val) => (val.length > 15 ? val.slice(0, 15) + "..." : val)}
                      />
                      <XAxis type="number" hide />
                      <ChartTooltip cursor={false} content={<ChartTooltipContent />} />
                      <Bar dataKey="tickets" fill="var(--color-tickets)" radius={[0, 4, 4, 0]} barSize={20} />
                    </BarChart>
                  </ChartContainer>
                </CardContent>
              </Card>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
