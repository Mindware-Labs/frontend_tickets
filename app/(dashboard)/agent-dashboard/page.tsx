"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { usePathname } from "next/navigation";
import { CallActions } from "@/components/dashboard/call-actions";
import { DashboardSkeleton } from "@/components/dashboard/dashboard-skeleton";
import {
  Ticket as TicketIcon,
  RotateCcw,
  TrendingUp,
  Clock,
  Target,
  CheckCircle2,
  AlertCircle,
  BarChart3,
  PieChart,
  ArrowRight,
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
import { cn } from "@/lib/utils";

// ... (Tipos anteriores se mantienen igual)
type DashboardTicket = {
  id: number;
  clientName: string;
  campaign: string;
  status: string;
  createdAt: string;
};

type AgentTicket = {
  id?: number;
  status?: string | null;
  priority?: string | null;
  createdAt?: string | null;
  assignedTo?: any;
  assignedToUser?: { id?: number; name?: string; email?: string } | null;
  agentId?: number | string | null;
  assignedToId?: number | string | null;
  campaign?: string | { nombre?: string } | null;
  disposition?: string | null;
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
};

const RADIAL_PALETTE = [
  "var(--color-segment-0)",
  "var(--color-segment-1)",
  "var(--color-segment-2)",
  "var(--color-segment-3)",
  "var(--color-segment-4)",
];

export default function AgentDashboardPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(
    null,
  );
  const [loadError, setLoadError] = useState<string | null>(null);
  const [agentKpis, setAgentKpis] = useState<DashboardData["kpis"] | null>(
    null,
  );
  const [personalData, setPersonalData] = useState<DashboardData | null>(null);

  // ... (Lógica de carga de datos se mantiene igual)
  const loadDashboard = useCallback(async () => {
    setIsLoading(true);
    setLoadError(null);
    try {
      const currentUser = auth.getUser?.();
      const agentId = currentUser?.id;
      const token =
        typeof window !== "undefined"
          ? localStorage.getItem("auth_token")
          : null;
      const response = await fetch(
        `/api/dashboard/agent-stats${agentId ? `?agentId=${agentId}` : ""}`,
        {
          cache: "no-store",
          headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        },
      );
      const payload = await response.json();
      if (!payload?.success) {
        throw new Error(payload?.message || "Unable to load dashboard data.");
      }
      setDashboardData(payload.data);
    } catch (error: any) {
      setLoadError(error.message || "Unable to load dashboard data.");
      toast.error("Failed to load dashboard data.", {
        description: error.message || "Please try again.",
      });
    } finally {
      setIsLoading(false);
    }
  }, []);

  const loadAgentKpis = useCallback(async () => {
    try {
      const user = auth.getUser?.();
      if (!user?.id) {
        setAgentKpis(null);
        return;
      }

      const response = await fetch("/api/calls");
      const payload = await response.json();
      if (!payload?.success || !Array.isArray(payload.data)) {
        throw new Error(
          payload?.message || "No se pudieron cargar los tickets del agente.",
        );
      }

      const fullName = [user.name, user.lastName]
        .filter(Boolean)
        .join(" ")
        .trim()
        .toLowerCase();
      const userEmail = user.email?.toLowerCase() || "";

      const isTicketAssignedToUser = (ticket: AgentTicket) => {
        const assigned =
          (typeof ticket.assignedTo === "object"
            ? ticket.assignedTo?.id
            : ticket.assignedTo) ??
          ticket.assignedToId ??
          ticket.agentId ??
          ticket.assignedToUser?.id;
        if (assigned && Number(assigned) === Number(user.id)) return true;

        const assignedEmail =
          (typeof ticket.assignedTo === "object"
            ? ticket.assignedTo?.email
            : undefined) || ticket.assignedToUser?.email;
        if (
          assignedEmail &&
          userEmail &&
          assignedEmail.toLowerCase() === userEmail
        )
          return true;

        const assignedName =
          (typeof ticket.assignedTo === "object"
            ? ticket.assignedTo?.name
            : undefined) || ticket.assignedToUser?.name;
        if (assignedName && fullName && assignedName.toLowerCase() === fullName)
          return true;

        return false;
      };

      const myTickets: AgentTicket[] = payload.data.filter(
        isTicketAssignedToUser,
      );

      const statusIs = (ticket: AgentTicket, targets: Set<string>) => {
        const normalized = (ticket.status || "").toString().toUpperCase();
        return targets.has(normalized);
      };

      const PRIORITY_ALERT = new Set(["HIGH", "EMERGENCY"]);
      const STATUS_CLOSED = new Set(["CLOSED", "RESOLVED"]);
      const STATUS_OPEN = new Set(["OPEN"]);
      const STATUS_IN_PROGRESS = new Set(["IN_PROGRESS"]);

      const openTickets = myTickets.filter((t) =>
        statusIs(t, STATUS_OPEN),
      ).length;
      const inProgressTickets = myTickets.filter((t) =>
        statusIs(t, STATUS_IN_PROGRESS),
      ).length;
      const closedTickets = myTickets.filter((t) =>
        statusIs(t, STATUS_CLOSED),
      ).length;
      const pendingActions = myTickets.filter((t) => {
        const priority = (t.priority || "").toString().toUpperCase();
        return PRIORITY_ALERT.has(priority) && !statusIs(t, STATUS_CLOSED);
      }).length;

      const now = new Date();
      const sevenDaysAgo = new Date(now);
      sevenDaysAgo.setDate(now.getDate() - 6);
      sevenDaysAgo.setHours(0, 0, 0, 0);
      const callsLast7Days = myTickets.reduce((sum, ticket) => {
        if (!ticket.createdAt) return sum;
        const created = new Date(ticket.createdAt);
        if (Number.isNaN(created.getTime())) return sum;
        return created >= sevenDaysAgo ? sum + 1 : sum;
      }, 0);

      const totalTickets = myTickets.length;
      const totalCalls = totalTickets;
      const activeTickets = openTickets + inProgressTickets;
      const resolutionRate =
        totalTickets > 0 ? Math.round((closedTickets / totalTickets) * 100) : 0;

      const kpis = {
        totalCalls,
        totalTickets,
        activeTickets,
        openTickets,
        inProgressTickets,
        closedTickets,
        pendingActions,
        resolutionRate,
        callsLast7Days,
      };

      const formatDateKey = (date: Date) => {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, "0");
        const day = String(date.getDate()).padStart(2, "0");
        return `${year}-${month}-${day}`;
      };

      const dayBuckets = Array.from({ length: 7 }).map((_, index) => {
        const date = new Date(now);
        date.setDate(now.getDate() - (6 - index));
        date.setHours(0, 0, 0, 0);
        return {
          key: formatDateKey(date),
          label: date.toLocaleDateString("en-US", { weekday: "short" }),
          count: 0,
        };
      });

      const bucketMap = dayBuckets.reduce<Record<string, number>>(
        (acc, bucket, index) => {
          acc[bucket.key] = index;
          return acc;
        },
        {},
      );

      myTickets.forEach((ticket) => {
        if (!ticket.createdAt) return;
        const created = new Date(ticket.createdAt);
        if (Number.isNaN(created.getTime())) return;
        const key = formatDateKey(created);
        const idx = bucketMap[key];
        if (idx === undefined) return;
        dayBuckets[idx].count += 1;
      });

      const callsByDay = dayBuckets.map((bucket) => ({
        day: bucket.label,
        calls: bucket.count,
      }));

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

      const ticketsByCampaignMap = myTickets.reduce<Record<string, number>>(
        (acc, ticket) => {
          let campaignLabel = "Unspecified";
          if (
            ticket.campaign &&
            typeof ticket.campaign === "object" &&
            "nombre" in ticket.campaign
          ) {
            campaignLabel = (ticket.campaign as any).nombre || "Unspecified";
          } else if (typeof (ticket as any).campaign === "string") {
            campaignLabel = normalizeLabel((ticket as any).campaign);
          }
          acc[campaignLabel] = (acc[campaignLabel] || 0) + 1;
          return acc;
        },
        {},
      );

      const ticketsByDispositionMap = myTickets.reduce<Record<string, number>>(
        (acc, ticket) => {
          const label = normalizeLabel(
            (ticket as any).disposition || "Unspecified",
          );
          acc[label] = (acc[label] || 0) + 1;
          return acc;
        },
        {},
      );

      const ticketsByCampaign = Object.entries(ticketsByCampaignMap).map(
        ([name, count]) => ({ name, count }),
      );
      const ticketsByDisposition = Object.entries(ticketsByDispositionMap).map(
        ([name, count]) => ({ name, count }),
      );

      const recentTickets: DashboardTicket[] = myTickets
        .slice(0, 5)
        .map((ticket) => ({
          id: Number(ticket.id || 0),
          clientName:
            (ticket as any).clientName ||
            (ticket as any).customer?.name ||
            (ticket as any).customer?.nombre ||
            "Unassigned",
          campaign:
            (ticket as any).campaign?.nombre ||
            (ticket as any).campaign ||
            "Unspecified",
          status: normalizeLabel(ticket.status || "Unspecified"),
          createdAt: ticket.createdAt || new Date().toISOString(),
        }));

      setAgentKpis(kpis);
      setPersonalData({
        kpis,
        charts: {
          callsByDay,
          ticketsByCampaign: ticketsByCampaign.length
            ? ticketsByCampaign
            : [{ name: "No data", count: 0 }],
          ticketsByDisposition: ticketsByDisposition.length
            ? ticketsByDisposition
            : [{ name: "No data", count: 0 }],
        },
        recentTickets,
        generatedAt: new Date().toISOString(),
      });
    } catch (error: any) {
      console.error("Failed to load agent KPIs:", error);
      setAgentKpis(null);
      setPersonalData(null);
      toast.error("No se pudo cargar tus métricas personales.", {
        description: error?.message || "Intenta de nuevo más tarde.",
      });
    }
  }, []);

  useEffect(() => {
    loadDashboard();
    loadAgentKpis();
  }, [loadDashboard, loadAgentKpis]);

  // Cleanup on route change to prevent overlay issues
  const pathname = usePathname();
  useEffect(() => {
    // Add cleanup logic here if modals are added in the future
  }, [pathname]);

  // ... (Configuración de datos de gráficas se mantiene igual, solo ajustes visuales)
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
    [dashboardData, personalData],
  );

  const typeData = useMemo(
    () =>
      (personalData || dashboardData)?.charts.ticketsByDisposition?.length
        ? (personalData || dashboardData)!.charts.ticketsByDisposition
        : [{ name: "No data", count: 0 }],
    [dashboardData, personalData],
  );

  const campaignData = useMemo(
    () =>
      (personalData || dashboardData)?.charts.ticketsByCampaign?.length
        ? (personalData || dashboardData)!.charts.ticketsByCampaign
        : [{ name: "No data", count: 0 }],
    [dashboardData, personalData],
  );

  const chartConfig = useMemo<ChartConfig>(
    () => ({
      calls: {
        label: "Calls",
        color: "hsl(var(--primary))",
      },
      tickets: {
        label: "Tickets",
        color: "hsl(var(--chart-2))",
      },
      // Configuración dinámica para segmentos radiales
      "segment-0": { label: "Type 1", color: "hsl(var(--chart-1))" },
      "segment-1": { label: "Type 2", color: "hsl(var(--chart-2))" },
      "segment-2": { label: "Type 3", color: "hsl(var(--chart-3))" },
      "segment-3": { label: "Type 4", color: "hsl(var(--chart-4))" },
      "segment-4": { label: "Type 5", color: "hsl(var(--chart-5))" },
    }),
    [],
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
    [typeData],
  );

  const totalCallsLast7Days = useMemo(
    () =>
      agentKpis?.callsLast7Days ??
      callsData.reduce((sum, item) => sum + item.calls, 0),
    [agentKpis, callsData],
  );

  const campaignChartData = useMemo(
    () =>
      campaignData.map((campaign) => ({
        name: campaign.name,
        tickets: campaign.count,
      })),
    [campaignData],
  );

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 18) return "Good afternoon";
    return "Good evening";
  };

  if (isLoading && !dashboardData && !personalData)
    return <DashboardSkeleton />;

  if (!dashboardData && !personalData) {
    return (
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
    );
  }

  const baseData = personalData || dashboardData!;
  const { recentTickets, generatedAt } = baseData;
  const fallbackKpis: DashboardData["kpis"] = {
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
  const myKpis = personalData?.kpis || agentKpis || fallbackKpis;

  const statusClass = (status: string) => {
    const s = status.toLowerCase();
    if (s.includes("open"))
      return "bg-blue-500/10 text-blue-700 border-blue-200 dark:text-blue-400 dark:border-blue-800";
    if (s.includes("progress"))
      return "bg-amber-500/10 text-amber-700 border-amber-200 dark:text-amber-400 dark:border-amber-800";
    if (s.includes("resolved") || s.includes("closed"))
      return "bg-emerald-500/10 text-emerald-700 border-emerald-200 dark:text-emerald-400 dark:border-emerald-800";
    return "bg-muted text-muted-foreground border-border";
  };

  return (
    <div className="space-y-8 p-1 animate-in fade-in duration-500 pb-10">
      {/* HEADER SECTION */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            Dashboard
          </h1>
          <p className="text-muted-foreground mt-1">
            Here's what's happening with your calls today.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="hidden sm:flex flex-col items-end text-right mr-2">
            <span className="text-xs text-muted-foreground">Last updated</span>
            <span className="text-xs font-medium tabular-nums">
              {new Date(generatedAt).toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </span>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={loadDashboard}
            className="shadow-sm"
            disabled={isLoading}
          >
            <RotateCcw
              className={cn("mr-2 h-3.5 w-3.5", isLoading && "animate-spin")}
            />
            Refresh
          </Button>
        </div>
      </div>

      {/* KPI GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-l-4 border-l-primary shadow-sm hover:shadow-md transition-shadow">
          <CardContent className="p-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Total Tickets
                </p>
                <h3 className="text-3xl font-bold mt-2 tracking-tight">
                  {myKpis.totalTickets}
                </h3>
              </div>
              <div className="p-2 bg-primary/10 rounded-lg text-primary">
                <TicketIcon className="h-5 w-5" />
              </div>
            </div>
            <div className="mt-4 flex items-center text-xs text-muted-foreground">
              <span className="text-emerald-600 font-medium mr-1 flex items-center">
                <TrendingUp className="h-3 w-3 mr-0.5" /> +
                {myKpis.callsLast7Days}
              </span>
              <span>last 7 days</span>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-amber-500 shadow-sm hover:shadow-md transition-shadow">
          <CardContent className="p-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Pending Action
                </p>
                <h3 className="text-3xl font-bold mt-2 tracking-tight text-amber-600 dark:text-amber-500">
                  {myKpis.activeTickets}
                </h3>
              </div>
              <div className="p-2 bg-amber-500/10 rounded-lg text-amber-600">
                <Clock className="h-5 w-5" />
              </div>
            </div>
            <div className="mt-4 flex items-center text-xs text-muted-foreground gap-3">
              <span className="flex items-center gap-1">
                <div className="h-2 w-2 rounded-full bg-blue-500" />{" "}
                {myKpis.openTickets} Open
              </span>
              <span className="flex items-center gap-1">
                <div className="h-2 w-2 rounded-full bg-amber-500" />{" "}
                {myKpis.inProgressTickets} WIP
              </span>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-emerald-500 shadow-sm hover:shadow-md transition-shadow">
          <CardContent className="p-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Resolution Rate
                </p>
                <h3 className="text-3xl font-bold mt-2 tracking-tight text-emerald-600 dark:text-emerald-500">
                  {myKpis.resolutionRate}%
                </h3>
              </div>
              <div className="p-2 bg-emerald-500/10 rounded-lg text-emerald-600">
                <CheckCircle2 className="h-5 w-5" />
              </div>
            </div>
            <p className="mt-4 text-xs text-muted-foreground">
              {myKpis.closedTickets} tickets successfully closed
            </p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-destructive shadow-sm hover:shadow-md transition-shadow">
          <CardContent className="p-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Urgent Priority
                </p>
                <h3 className="text-3xl font-bold mt-2 tracking-tight text-destructive">
                  {myKpis.pendingActions}
                </h3>
              </div>
              <div className="p-2 bg-destructive/10 rounded-lg text-destructive">
                <AlertCircle className="h-5 w-5" />
              </div>
            </div>
            <p className="mt-4 text-xs text-muted-foreground">
              Requires immediate attention
            </p>
          </CardContent>
        </Card>
      </div>

      {/* MAIN CONTENT GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Charts */}
        <div className="lg:col-span-2 space-y-6">
          {/* Weekly Activity Chart */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <BarChart3 className="h-4 w-4 text-primary" />
                Call Volume
              </CardTitle>
              <CardDescription>
                Daily call inflow over the last week
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ChartContainer config={chartConfig} className="h-62.5 w-full">
                <AreaChart
                  data={callsData}
                  margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                >
                  <defs>
                    <linearGradient id="fillCalls" x1="0" y1="0" x2="0" y2="1">
                      <stop
                        offset="5%"
                        stopColor="var(--color-calls)"
                        stopOpacity={0.3}
                      />
                      <stop
                        offset="95%"
                        stopColor="var(--color-calls)"
                        stopOpacity={0}
                      />
                    </linearGradient>
                  </defs>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    vertical={false}
                    stroke="hsl(var(--border))"
                  />
                  <XAxis
                    dataKey="day"
                    tickLine={false}
                    axisLine={false}
                    tickMargin={10}
                    className="text-xs text-muted-foreground"
                  />
                  <YAxis
                    tickLine={false}
                    axisLine={false}
                    className="text-xs text-muted-foreground"
                  />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Area
                    type="monotone"
                    dataKey="calls"
                    stroke="var(--color-calls)"
                    fill="url(#fillCalls)"
                    strokeWidth={2}
                  />
                </AreaChart>
              </ChartContainer>
            </CardContent>
          </Card>

          {/* Recent Calls Table */}
          <Card className="overflow-hidden">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-base flex items-center gap-2">
                  <Clock className="h-4 w-4 text-primary" />
                  Recent Activity
                </CardTitle>
                <CardDescription>Latest calls assigned to you</CardDescription>
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="text-xs gap-1"
                asChild
              >
                <a href="/tickets">
                  View all <ArrowRight className="h-3 w-3" />
                </a>
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
                        <TableCell className="font-mono text-xs text-muted-foreground">
                          #{ticket.id}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <div className="h-8 w-8 rounded-full bg-secondary flex items-center justify-center text-xs font-bold text-secondary-foreground">
                              {ticket.clientName.charAt(0)}
                            </div>
                            <div className="flex flex-col">
                              <span className="font-medium text-sm">
                                {ticket.clientName}
                              </span>
                              <span className="text-[10px] text-muted-foreground">
                                {new Date(
                                  ticket.createdAt,
                                ).toLocaleDateString()}
                              </span>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant="outline"
                            className="font-normal text-xs bg-background"
                          >
                            {ticket.campaign}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant="secondary"
                            className={cn(
                              "font-medium text-[10px] uppercase",
                              statusClass(ticket.status),
                            )}
                          >
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
                      <TableCell
                        colSpan={5}
                        className="h-32 text-center text-muted-foreground"
                      >
                        No recent call activity found.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </Card>
        </div>

        {/* Right Column: Secondary Charts */}
        <div className="space-y-6">
          {/* Distribution Radial Chart */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <PieChart className="h-4 w-4 text-primary" />
                Distribution
              </CardTitle>
              <CardDescription>Calls by disposition</CardDescription>
            </CardHeader>
            <CardContent>
              <ChartContainer
                config={chartConfig}
                className="mx-auto aspect-square max-h-62.5"
              >
                <RadialBarChart
                  data={radialData}
                  innerRadius={40}
                  outerRadius={100}
                  startAngle={90}
                  endAngle={-270}
                >
                  <RadialBar dataKey="count" background cornerRadius={5} />
                  <ChartTooltip
                    cursor={false}
                    content={
                      <ChartTooltipContent hideLabel nameKey="segmentKey" />
                    }
                  />
                </RadialBarChart>
              </ChartContainer>
              <div className="flex flex-wrap justify-center gap-2 mt-4">
                {radialData.slice(0, 4).map((entry, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-1.5 text-xs text-muted-foreground"
                  >
                    <div
                      className="h-2 w-2 rounded-full"
                      style={{ backgroundColor: entry.fill }}
                    />
                    <span className="truncate max-w-20">{entry.name}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Campaign Performance Bar Chart */}
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
                <BarChart
                  data={campaignChartData}
                  layout="vertical"
                  margin={{ left: 0, right: 0 }}
                >
                  <CartesianGrid
                    horizontal={false}
                    strokeDasharray="3 3"
                    stroke="hsl(var(--border))"
                  />
                  <YAxis
                    dataKey="name"
                    type="category"
                    tickLine={false}
                    axisLine={false}
                    width={100}
                    className="text-xs font-medium"
                    tickFormatter={(val) =>
                      val.length > 15 ? val.slice(0, 15) + "..." : val
                    }
                  />
                  <XAxis type="number" hide />
                  <ChartTooltip
                    cursor={false}
                    content={<ChartTooltipContent />}
                  />
                  <Bar
                    dataKey="tickets"
                    fill="var(--color-tickets)"
                    radius={[0, 4, 4, 0]}
                    barSize={20}
                  />
                </BarChart>
              </ChartContainer>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
