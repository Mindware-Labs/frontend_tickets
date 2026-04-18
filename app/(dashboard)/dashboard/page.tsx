"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { usePathname } from "next/navigation";
import KPICard from "@/components/dashboard/kpi-card";
import { CallActions } from "@/components/dashboard/call-actions";
import { DashboardSkeleton } from "@/components/dashboard/dashboard-skeleton";
import {
  Ticket as TicketIcon,
  Calendar,
  RotateCcw,
  TrendingUp,
} from "lucide-react";
import { FiPhoneCall, FiCheckCircle, FiAlertTriangle } from "react-icons/fi";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
  LabelList,
  Line,
  LineChart,
  RadialBar,
  RadialBarChart,
  XAxis,
  YAxis,
} from "recharts";

// --- TIPOS ---

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
    ticketsByCampaign: any[];
    ticketsByDisposition: { name: string; count: number }[];
  };
  recentTickets: DashboardTicket[];
};

type Agent = {
  id: number;
  name: string;
  email?: string | null;
  isActive?: boolean;
};

const RADIAL_PALETTE = [
  "oklch(0.65 0.18 160)",
  "oklch(0.75 0.18 85)",
  "var(--color-primary)",
  "oklch(0.65 0.22 25)",
  "oklch(0.72 0.16 250)",
];

export default function DashboardPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(
    null,
  );
  const [loadError, setLoadError] = useState<string | null>(null);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [agentsError, setAgentsError] = useState<string | null>(null);

  const loadDashboard = useCallback(async () => {
    setIsLoading(true);
    setLoadError(null);
    setAgentsError(null);
    try {
      // Read token from cookie (auth-token), not localStorage
      let token: string | null = null;
      if (typeof window !== "undefined") {
        const match = document.cookie.match(/(?:^|;\s*)auth-token=([^;]*)/);
        token = match ? decodeURIComponent(match[1]) : null;
      }

      const authHeaders: Record<string, string> = token
        ? { Authorization: `Bearer ${token}` }
        : {};

      const [dashboardResponse, agentsResponse] = await Promise.all([
        fetch("/api/dashboard/stats", {
          cache: "no-store",
          headers: authHeaders,
        }),
        fetch("/api/agents", {
          cache: "no-store",
          headers: authHeaders,
        }),
      ]);

      const payload = await dashboardResponse.json();
      if (!payload?.success) {
        throw new Error(payload?.message || "Unable to load dashboard data.");
      }
      setDashboardData(payload.data);

      try {
        const agentsPayload = await agentsResponse.json();
        if (!agentsPayload?.success) {
          throw new Error(agentsPayload?.message || "Unable to load agents.");
        }
        setAgents(Array.isArray(agentsPayload.data) ? agentsPayload.data : []);
      } catch (error: any) {
        setAgents([]);
        setAgentsError(error.message || "Unable to load agents.");
      }
    } catch (error: any) {
      setLoadError(error.message || "Unable to load dashboard data.");
      toast.error("Failed to load dashboard data.", {
        description: error.message || "Please try again.",
      });
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  // Cleanup on route change
  const pathname = usePathname();
  useEffect(() => {}, [pathname]);

  // --- PREPARACIÓN DE DATOS ---

  const callsData = useMemo(
    () =>
      dashboardData?.charts.callsByDay?.length
        ? dashboardData.charts.callsByDay
        : [
            { day: "Mon", calls: 0 },
            { day: "Tue", calls: 0 },
            { day: "Wed", calls: 0 },
            { day: "Thu", calls: 0 },
            { day: "Fri", calls: 0 },
            { day: "Sat", calls: 0 },
            { day: "Sun", calls: 0 },
          ],
    [dashboardData],
  );

  const typeData = useMemo(
    () =>
      dashboardData?.charts.ticketsByDisposition?.length
        ? dashboardData.charts.ticketsByDisposition
        : [{ name: "No data", count: 0 }],
    [dashboardData],
  );

  const campaignChartData = useMemo(() => {
    const rawData = dashboardData?.charts?.ticketsByCampaign || [];
    return rawData
      .map((item: any) => ({
        name: item.name || item.nombre || "Unknown",
        tickets: Number(item.count ?? item.ticketCount ?? item.tickets ?? 0),
        fill: "var(--color-tickets)",
      }))
      .sort((a, b) => b.tickets - a.tickets)
      .slice(0, 10);
  }, [dashboardData]);

  const lineChartConfig = useMemo<ChartConfig>(
    () => ({
      calls: {
        label: "Calls",
        color: "oklch(0.75 0.18 85)",
      },
    }),
    [],
  );

  const campaignChartConfig = useMemo<ChartConfig>(
    () => ({
      tickets: {
        label: "Tickets",
        color: "#22d3ee",
      },
      label: {
        color: "var(--background)",
      },
    }),
    [],
  );

  const radialData = useMemo(
    () =>
      typeData.map((item, index) => {
        const segmentKey = `segment-${index}`;
        return {
          name: item.name,
          count: item.count,
          segmentKey,
          fill: `var(--color-${segmentKey})`,
        };
      }),
    [typeData],
  );

  const radialChartConfig = useMemo<ChartConfig>(() => {
    return radialData.reduce((acc, item, index) => {
      acc[item.segmentKey] = {
        label: item.name,
        color: RADIAL_PALETTE[index % RADIAL_PALETTE.length],
      };
      return acc;
    }, {} as ChartConfig);
  }, [radialData]);

  const totalCallsLast7Days = useMemo(
    () => callsData.reduce((sum, item) => sum + item.calls, 0),
    [callsData],
  );

  // --- RENDERIZADO ---

  if (isLoading && !dashboardData) return <DashboardSkeleton />;

  if (!dashboardData) {
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

  const { kpis, recentTickets, generatedAt } = dashboardData;

  const statusClass = (status: string) => {
    if (status === "Open")
      return "bg-blue-100 text-blue-700 dark:bg-blue-500/15 dark:text-blue-400 border-blue-200 dark:border-blue-500/20";
    if (status === "In Progress")
      return "bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-400 border-amber-200 dark:border-amber-500/20";
    if (status === "Resolved")
      return "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/20";
    if (status === "Closed")
      return "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400 border-slate-200 dark:border-slate-700";
    return "bg-muted text-muted-foreground border-border";
  };

  const agentStatusClass = (isActive?: boolean) =>
    isActive
      ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/20"
      : "bg-muted text-muted-foreground border-border";

  return (
    <div className="space-y-8 p-1 animate-in fade-in duration-500">
      {/* --- HEADER --- */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between border-b pb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-foreground to-muted-foreground/70">
            Dashboard
          </h1>
          <p className="text-sm text-muted-foreground mt-1 flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            Live metrics from the ticketing.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="hidden md:flex flex-col items-end mr-2">
            <span className="text-xs font-medium text-muted-foreground">
              Last updated
            </span>
            <span className="text-xs font-mono text-foreground">
              {new Date(generatedAt).toLocaleTimeString("en-US", {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </span>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={loadDashboard}
            className="h-9 shadow-sm"
          >
            <RotateCcw
              className={`mr-2 h-3.5 w-3.5 ${isLoading ? "animate-spin" : ""}`}
            />
            Refresh
          </Button>
        </div>
      </div>

      {/* --- KPIS --- */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KPICard
          title="Total calls answered"
          value={kpis.totalCalls}
          secondaryValue={`Total tickets: ${kpis.totalTickets}`}
          icon={FiPhoneCall}
          iconBg="bg-blue-500/10 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400"
        />
        <KPICard
          title="Active Tickets"
          value={kpis.activeTickets}
          secondaryValue={`Open: ${kpis.openTickets} · In progress: ${kpis.inProgressTickets}`}
          icon={TicketIcon}
          iconBg="bg-violet-500/10 text-violet-600 dark:bg-violet-500/20 dark:text-violet-400"
        />
        <KPICard
          title="Success Rate"
          value={`${kpis.resolutionRate}%`}
          secondaryValue={`Closed: ${kpis.closedTickets}`}
          icon={FiCheckCircle}
          iconBg="bg-emerald-500/10 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400"
        />
        <KPICard
          title="Pending Actions"
          value={kpis.pendingActions}
          secondaryValue="High priority open"
          icon={FiAlertTriangle}
          iconBg="bg-amber-500/10 text-amber-600 dark:bg-amber-500/20 dark:text-amber-400"
        />
      </div>

      {/* --- ANALYTICS --- */}
      <div className="space-y-6">
        <Tabs defaultValue="overview" className="space-y-4">
          <div className="flex items-center justify-between">
            <TabsList className="bg-muted/50 p-1 border">
              <TabsTrigger value="overview" className="text-xs px-4">
                Overview
              </TabsTrigger>
              <TabsTrigger value="campaigns" className="text-xs px-4">
                Campaigns
              </TabsTrigger>
              <TabsTrigger value="agents" className="text-xs px-4">
                Agents
              </TabsTrigger>
            </TabsList>
            <div className="hidden md:flex items-center gap-2 text-xs text-muted-foreground bg-secondary/50 px-3 py-1 rounded-full">
              <Calendar className="h-3 w-3" />
              <span>Last 7 Days</span>
            </div>
          </div>

          <TabsContent
            value="overview"
            className="space-y-4 focus-visible:outline-none focus-visible:ring-0"
          >
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-7">
              {/* Gráfico 1: Activity Icon */}
              <div className="col-span-4">
                <Card className="h-full">
                  <CardHeader className="space-y-1">
                    <CardTitle className="text-base">
                      Call Volume Trends
                    </CardTitle>
                    <CardDescription>
                      Last 7 days of inbound activity
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="h-[260px]">
                    <ChartContainer
                      config={lineChartConfig}
                      className="h-full w-full"
                    >
                      <LineChart
                        accessibilityLayer
                        data={callsData}
                        margin={{ left: 8, right: 8 }}
                      >
                        <CartesianGrid vertical={false} />
                        <XAxis
                          dataKey="day"
                          tickLine={false}
                          axisLine={false}
                          tickMargin={10}
                        />
                        <ChartTooltip
                          cursor={false}
                          content={<ChartTooltipContent hideLabel />}
                        />
                        <Line
                          dataKey="calls"
                          type="monotone"
                          stroke="var(--color-calls)"
                          strokeWidth={2}
                          dot={false}
                        />
                      </LineChart>
                    </ChartContainer>
                  </CardContent>
                  <CardFooter className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>Total calls: {totalCallsLast7Days}</span>
                    <span className="flex items-center gap-1">
                      Live refresh
                      <TrendingUp className="h-3 w-3 text-primary" />
                    </span>
                  </CardFooter>
                </Card>
              </div>

              {/* Gráfico 2: PieChart Icon */}
              <div className="col-span-3">
                <Card className="h-full">
                  <CardHeader className="space-y-1">
                    <CardTitle className="text-base">
                      Workflow Distribution
                    </CardTitle>
                    <CardDescription>Share by call disposition</CardDescription>
                  </CardHeader>
                  <CardContent className="flex h-[260px] items-center justify-center">
                    <ChartContainer
                      config={radialChartConfig}
                      className="mx-auto aspect-square max-h-[220px] w-full"
                    >
                      <RadialBarChart
                        data={radialData}
                        innerRadius={40}
                        outerRadius={110}
                        startAngle={90}
                        endAngle={-270}
                      >
                        <ChartTooltip
                          cursor={false}
                          content={
                            <ChartTooltipContent
                              hideLabel
                              nameKey="segmentKey"
                            />
                          }
                        />
                        <RadialBar
                          dataKey="count"
                          background
                          cornerRadius={8}
                        />
                      </RadialBarChart>
                    </ChartContainer>
                  </CardContent>
                  <CardFooter className="text-xs text-muted-foreground">
                    {radialData.length} workflow categories tracked
                  </CardFooter>
                </Card>
              </div>
            </div>
          </TabsContent>

          {/* --- FIX PARA NOMBRES LARGOS --- */}
          <TabsContent
            value="campaigns"
            className="focus-visible:outline-none focus-visible:ring-0"
          >
            <div className="grid grid-cols-1">
              <Card className="w-full">
                <CardHeader>
                  <CardTitle>Campaign Performance</CardTitle>
                  <CardDescription>
                    Top active campaigns by call volume
                  </CardDescription>
                </CardHeader>
                <CardContent className="px-2 sm:p-6">
                  <ChartContainer
                    config={campaignChartConfig}
                    className="aspect-auto h-[350px] w-full"
                  >
                    <BarChart
                      accessibilityLayer
                      data={campaignChartData}
                      layout="vertical"
                      margin={{
                        left: 20, // 1. Margen de seguridad extra a la izquierda
                        right: 50,
                        top: 0,
                        bottom: 0,
                      }}
                      barGap={2}
                    >
                      <CartesianGrid horizontal={false} />

                      <YAxis
                        dataKey="name"
                        type="category"
                        tickLine={false}
                        tickMargin={10}
                        axisLine={false}
                        width={230} // 2. Mucho más espacio reservado para el texto
                        tickFormatter={(value) => {
                          // 3. Permite textos más largos antes de poner '...'
                          return value.length > 36
                            ? `${value.slice(0, 36)}...`
                            : value;
                        }}
                        className="text-xs font-medium text-muted-foreground"
                      />

                      <XAxis dataKey="tickets" type="number" hide />

                      <ChartTooltip
                        cursor={{ fill: "var(--muted)", opacity: 0.2 }}
                        content={<ChartTooltipContent indicator="line" />}
                      />

                      <Bar
                        dataKey="tickets"
                        layout="vertical"
                        fill="var(--color-tickets)"
                        radius={[0, 4, 4, 0]}
                        barSize={24}
                      >
                        <LabelList
                          dataKey="tickets"
                          position="right"
                          offset={10}
                          className="fill-foreground font-bold"
                          fontSize={12}
                        />
                      </Bar>
                    </BarChart>
                  </ChartContainer>
                </CardContent>
                <CardFooter className="flex-col items-start gap-2 text-sm border-t pt-4 bg-muted/20">
                  <div className="flex w-full items-start gap-2 text-sm">
                    <div className="grid gap-2">
                      <div className="flex items-center gap-2 font-medium leading-none">
                        Most active campaign trending up{" "}
                        <TrendingUp className="h-4 w-4" />
                      </div>
                      <div className="flex items-center gap-2 leading-none text-muted-foreground">
                        Showing top {campaignChartData.length} campaigns by
                        volume
                      </div>
                    </div>
                  </div>
                </CardFooter>
              </Card>
            </div>
          </TabsContent>

          <TabsContent
            value="agents"
            className="space-y-4 focus-visible:outline-none focus-visible:ring-0"
          >
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-foreground">
                  Agents Overview
                </h3>
                <p className="text-xs text-muted-foreground">
                  {agentsError ? agentsError : `Total agents: ${agents.length}`}
                </p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="text-xs hover:bg-transparent text-primary hover:text-primary/80 group"
                asChild
              >
                <a href="/reports/agents" className="flex items-center">
                  View agent report
                  <span className="ml-1 transition-transform group-hover:translate-x-1">
                    &rarr;
                  </span>
                </a>
              </Button>
            </div>

            <div className="rounded-xl border bg-card/50 text-card-foreground shadow-sm overflow-hidden">
              <Table>
                <TableHeader className="bg-muted/50">
                  <TableRow className="hover:bg-transparent border-b border-border/60">
                    <TableHead className="font-semibold text-xs text-muted-foreground">
                      AGENT
                    </TableHead>
                    <TableHead className="font-semibold text-xs text-muted-foreground">
                      EMAIL
                    </TableHead>
                    <TableHead className="text-right font-semibold text-xs text-muted-foreground">
                      STATUS
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {agents.length ? (
                    agents.map((agent) => (
                      <TableRow
                        key={agent.id}
                        className="border-b border-border/40 hover:bg-muted/30 transition-colors"
                      >
                        <TableCell>
                          <div className="flex flex-col">
                            <span className="font-medium text-sm text-foreground">
                              {agent.name}
                            </span>
                            <span className="text-[10px] text-muted-foreground">
                              ID {agent.id}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {agent.email || "No email"}
                        </TableCell>
                        <TableCell className="text-right">
                          <Badge
                            variant="outline"
                            className={`
                        text-[10px] font-semibold px-2.5 py-0.5 border rounded-full shadow-none
                        ${agentStatusClass(agent.isActive)}
                      `}
                          >
                            {agent.isActive ? "Active" : "Inactive"}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell
                        colSpan={3}
                        className="h-24 text-center text-sm text-muted-foreground"
                      >
                        No agents available.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* --- RECENT TICKETS --- */}
      <div className="space-y-4 pt-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-primary/10 rounded-md">
              <TrendingUp className="h-4 w-4 text-primary" />
            </div>
            <h2 className="text-lg font-semibold tracking-tight">
              Recent Tickets Activity
            </h2>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="text-xs hover:bg-transparent text-primary hover:text-primary/80 group"
            asChild
          >
            <a href="/tickets" className="flex items-center">
              View all tickets
              <span className="ml-1 transition-transform group-hover:translate-x-1">
                &rarr;
              </span>
            </a>
          </Button>
        </div>

        <div className="rounded-xl border bg-card/50 text-card-foreground shadow-sm overflow-hidden">
          <Table>
            <TableHeader className="bg-muted/50">
              <TableRow className="hover:bg-transparent border-b border-border/60">
                <TableHead className="w-[80px] font-semibold text-xs text-muted-foreground">
                  ID
                </TableHead>
                <TableHead className="font-semibold text-xs text-muted-foreground">
                  CLIENT
                </TableHead>
                <TableHead className="font-semibold text-xs text-muted-foreground">
                  CAMPAIGN
                </TableHead>
                <TableHead className="font-semibold text-xs text-muted-foreground">
                  STATUS
                </TableHead>
                <TableHead className="text-right font-semibold text-xs text-muted-foreground">
                  ACTIONS
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {recentTickets.length ? (
                recentTickets.map((ticket) => (
                  <TableRow
                    key={ticket.id}
                    className="border-b border-border/40 hover:bg-muted/30 transition-colors"
                  >
                    <TableCell className="font-mono text-xs text-muted-foreground">
                      #{ticket.id}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-medium text-sm text-foreground">
                          {ticket.clientName}
                        </span>
                        <span className="text-[10px] text-muted-foreground">
                          {new Date(ticket.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-secondary text-secondary-foreground border border-border/50">
                        {ticket.campaign}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={`
                        text-[10px] font-semibold px-2.5 py-0.5 border rounded-full shadow-none
                        ${statusClass(ticket.status)}
                      `}
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
                    className="h-24 text-center text-sm text-muted-foreground"
                  >
                    No recent call activity found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}
