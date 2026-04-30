"use client";

import { useMemo, useState } from "react";
import {
  AlertTriangle,
  BarChart3,
  CheckCircle,
  Clock,
  Ticket,
  TrendingUp,
  Users,
  ChevronRight,
  Target,
  UserPlus,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import {
  DISPOSITION_COLORS,
  DIRECTION_COLORS,
  PRIORITY_COLORS,
  STATUS_COLORS,
} from "./chart-colors";
import type { Ticket as YardTicket, YardStats, YardStatsDay } from "./types";
import { ActiveCampaignsModal } from "./ActiveCampaignsModal";
import { HighPriorityPendingModal } from "./HighPriorityPendingModal";
import { NewLeadsModal } from "./NewLeadsModal";

type YardDashboardProps = {
  stats: YardStats;
  yardTickets: YardTicket[];
  activeChartData: YardStatsDay[];
  reportStartDate: string;
  reportEndDate: string;
};

export function YardDashboard({
  stats,
  yardTickets,
  activeChartData,
  reportStartDate,
  reportEndDate,
}: YardDashboardProps) {
  const [showNewLeadsModal, setShowNewLeadsModal] = useState(false);
  const [showHighPriorityPendingModal, setShowHighPriorityPendingModal] =
    useState(false);
  const [showCampaignsModal, setShowCampaignsModal] = useState(false);

  const missedTicketsCount = useMemo(
    () =>
      stats.ticketsByDirection.reduce((total, item) => {
        return (item.direction || "").toUpperCase() === "MISSED"
          ? total + item.count
          : total;
      }, 0),
    [stats.ticketsByDirection],
  );
  const nonMissedTicketsCount = Math.max(
    stats.totalTickets - missedTicketsCount,
    0,
  );
  const resolutionRate =
    typeof stats.resolutionRate === "number"
      ? stats.resolutionRate
      : nonMissedTicketsCount > 0
        ? Math.round((stats.closedTickets / nonMissedTicketsCount) * 100)
        : 0;
  const topNewLead = stats.ticketsByNewLead[0];
  const topNewLeadName = topNewLead?.customerName?.trim() || "No data";
  const highPriorityPendingTickets = useMemo(
    () =>
      yardTickets.filter((ticket) => {
        const priority = (ticket.priority || "").toUpperCase();
        const status = (ticket.status || "").toUpperCase();
        const isCriticalPriority =
          priority === "HIGH" || priority === "EMERGENCY";
        const isClosed = status === "CLOSED" || status === "RESOLVED";
        return isCriticalPriority && !isClosed;
      }),
    [yardTickets],
  );
  const highPriorityClosedTickets = useMemo(
    () =>
      yardTickets.filter((ticket) => {
        const priority = (ticket.priority || "").toUpperCase();
        const status = (ticket.status || "").toUpperCase();
        const isCriticalPriority =
          priority === "HIGH" || priority === "EMERGENCY";
        const isClosed = status === "CLOSED" || status === "RESOLVED";
        return isCriticalPriority && isClosed;
      }),
    [yardTickets],
  );
  const highPriorityPendingCount = highPriorityPendingTickets.length;
  const highPriorityClosedCount = highPriorityClosedTickets.length;
  const emergencyPendingCount = highPriorityPendingTickets.filter(
    (ticket) => (ticket.priority || "").toUpperCase() === "EMERGENCY",
  ).length;
  const highPriorityPendingRate =
    stats.totalTickets > 0
      ? Math.round((highPriorityPendingCount / stats.totalTickets) * 100)
      : 0;
  const topCustomers = useMemo(() => {
    const buckets = new Map<
      string,
      { key: string; name: string; meta: string; count: number }
    >();

    yardTickets.forEach((ticket) => {
      const customerId = ticket.customerId ?? ticket.customer?.id ?? null;
      const customerName = ticket.customer?.name?.trim() || "";
      const customerPhone =
        ticket.customerPhone?.trim() ||
        ticket.customer?.phone?.trim() ||
        ticket.phone?.trim() ||
        "";

      const key =
        customerId !== null && customerId !== undefined
          ? `id:${customerId}`
          : customerPhone
            ? `phone:${customerPhone}`
            : customerName
              ? `name:${customerName.toLowerCase()}`
              : `unknown:${ticket.id}`;

      const name =
        customerName ||
        (customerId !== null && customerId !== undefined
          ? `Customer #${customerId}`
          : customerPhone || "Unknown customer");
      const meta =
        customerId !== null && customerId !== undefined
          ? `ID: ${customerId}`
          : customerPhone
            ? customerPhone
            : "No customer ID";

      const existing = buckets.get(key);
      if (existing) {
        existing.count += 1;
        return;
      }

      buckets.set(key, { key, name, meta, count: 1 });
    });

    return Array.from(buckets.values())
      .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name))
      .slice(0, 5);
  }, [yardTickets]);

  return (
    <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">
      {/* --- ROW 1: KPIs Principales --- */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Total Tickets */}
        <div className="group relative overflow-hidden rounded-2xl border bg-card p-6 shadow-sm transition-all hover:shadow-md hover:-translate-y-0.5">
          <div className="flex justify-between items-start">
            <div className="space-y-2">
              <p className="text-sm font-medium text-muted-foreground tracking-tight">
                Total Tickets
              </p>
              <h3 className="text-4xl font-bold tracking-tight text-foreground">
                {stats.totalTickets}
              </h3>
              <p className="text-xs font-medium text-muted-foreground bg-muted/50 inline-flex px-2 py-1 rounded-md">
                {stats.openTickets} open, {stats.closedTickets} closed
              </p>
            </div>
            <div className="p-3 rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400">
              <Ticket className="w-5 h-5" />
            </div>
          </div>
        </div>

        {/* Active Tickets */}
        <div className="group relative overflow-hidden rounded-2xl border bg-card p-6 shadow-sm transition-all hover:shadow-md hover:-translate-y-0.5">
          <div className="flex justify-between items-start">
            <div className="space-y-2">
              <p className="text-sm font-medium text-muted-foreground tracking-tight">
                Active Tickets
              </p>
              <h3 className="text-4xl font-bold tracking-tight text-foreground">
                {stats.openTickets}
              </h3>
              <p className="text-xs font-medium text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-500/10 inline-flex px-2 py-1 rounded-md">
                {stats.openTickets} active
              </p>
            </div>
            <div className="p-3 rounded-xl bg-amber-50 text-amber-600 dark:bg-amber-900/20 dark:text-amber-400">
              <Clock className="w-5 h-5" />
            </div>
          </div>
        </div>

        {/* Closed Tickets */}
        <div className="group relative overflow-hidden rounded-2xl border bg-card p-6 shadow-sm transition-all hover:shadow-md hover:-translate-y-0.5">
          <div className="flex justify-between items-start">
            <div className="space-y-2">
              <p className="text-sm font-medium text-muted-foreground tracking-tight">
                Closed Tickets
              </p>
              <h3 className="text-4xl font-bold tracking-tight text-foreground">
                {stats.closedTickets}
              </h3>
              <p className="text-xs font-medium text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 inline-flex px-2 py-1 rounded-md">
                {resolutionRate}% resolution rate
              </p>
            </div>
            <div className="p-3 rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400">
              <CheckCircle className="w-5 h-5" />
            </div>
          </div>
        </div>

        {/* Resolution Rate */}
        <div className="group relative overflow-hidden rounded-2xl border bg-card p-6 shadow-sm transition-all hover:shadow-md hover:-translate-y-0.5">
          <div className="flex justify-between items-start">
            <div className="space-y-2">
              <p className="text-sm font-medium text-muted-foreground tracking-tight">
                Resolution Rate
              </p>
              <h3 className="text-4xl font-bold tracking-tight text-foreground">
                {resolutionRate}%
              </h3>
              <p className="text-xs font-medium text-muted-foreground bg-muted/50 inline-flex px-2 py-1 rounded-md">
                {missedTicketsCount > 0
                  ? `${stats.closedTickets} closed • missed calls excluded`
                  : `${stats.closedTickets} of ${stats.totalTickets} resolved`}
              </p>
            </div>
            <div className="p-3 rounded-xl bg-purple-50 text-purple-600 dark:bg-purple-900/20 dark:text-purple-400">
              <Target className="w-5 h-5" />
            </div>
          </div>
        </div>
      </div>

      {/* --- ROW 2: KPIs Secundarios --- */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {/* New Leads */}
        <button
          onClick={() => setShowNewLeadsModal(true)}
          className="group relative overflow-hidden rounded-2xl border border-emerald-200/50 dark:border-emerald-900/30 bg-gradient-to-br from-card to-emerald-50/30 dark:to-emerald-950/20 p-5 text-left shadow-sm hover:shadow-md hover:border-emerald-300 dark:hover:border-emerald-800 transition-all duration-300 w-full"
        >
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-4 min-w-0">
              <div className="p-2.5 rounded-full bg-emerald-100 text-emerald-600 dark:bg-emerald-900/40 dark:text-emerald-400 group-hover:scale-110 group-hover:bg-emerald-200 dark:group-hover:bg-emerald-800/50 transition-all duration-300">
                <UserPlus className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-semibold text-emerald-600/80 dark:text-emerald-400/80 uppercase tracking-wider">
                  New Lead Customers
                </p>
                <div className="flex items-baseline gap-2 mt-0.5">
                  <h3 className="text-2xl font-bold text-foreground">
                    {stats.ticketsByNewLead.length}
                  </h3>
                  <span className="text-sm font-medium text-emerald-600 dark:text-emerald-400 group-hover:underline flex items-center">
                    View list <ChevronRight className="w-3 h-3 ml-0.5" />
                  </span>
                </div>
                <p className="mt-1 truncate text-xs font-medium text-foreground/80">
                  Top:{" "}
                  <span className="font-semibold text-foreground">
                    {topNewLeadName}
                  </span>
                </p>
              </div>
            </div>
          </div>
        </button>

        {/* High Priority Pending */}
        <button
          onClick={() => setShowHighPriorityPendingModal(true)}
          className="group relative overflow-hidden rounded-2xl border border-rose-200/50 dark:border-rose-900/30 bg-gradient-to-br from-card to-rose-50/30 dark:to-rose-950/20 p-5 text-left shadow-sm hover:shadow-md hover:border-rose-300 dark:hover:border-rose-800 transition-all duration-300 w-full"
        >
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-4 min-w-0">
              <div className="p-2.5 rounded-full bg-rose-100 text-rose-600 dark:bg-rose-900/40 dark:text-rose-400 group-hover:scale-110 group-hover:bg-rose-200 dark:group-hover:bg-rose-800/50 transition-all duration-300">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-semibold text-rose-600/80 dark:text-rose-400/80 uppercase tracking-wider">
                  High Priority Pending
                </p>
                <div className="flex items-baseline gap-2 mt-0.5">
                  <h3 className="text-2xl font-bold text-foreground">
                    {highPriorityPendingCount}
                  </h3>
                  <span className="text-sm font-medium text-rose-600 dark:text-rose-400 group-hover:underline flex items-center">
                    View list <ChevronRight className="w-3 h-3 ml-0.5" />
                  </span>
                </div>
                <p className="mt-1 truncate text-xs font-medium text-foreground/80">
                  <span className="font-semibold text-foreground">
                    {emergencyPendingCount}
                  </span>{" "}
                  emergency, {highPriorityPendingRate}% of total
                </p>
                <p className="mt-0.5 text-xs font-medium text-muted-foreground">
                  Closed / resolved high priority:{" "}
                  <span className="font-semibold text-foreground">
                    {highPriorityClosedCount}
                  </span>
                </p>
              </div>
            </div>
          </div>
        </button>

        {/* Active Campaigns Button */}
        <button
          onClick={() => setShowCampaignsModal(true)}
          className="group relative overflow-hidden rounded-2xl border border-pink-200/50 dark:border-pink-900/30 bg-gradient-to-br from-card to-pink-50/30 dark:to-pink-950/20 p-5 text-left shadow-sm hover:shadow-md hover:border-pink-300 dark:hover:border-pink-800 transition-all duration-300 w-full"
        >
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-4 min-w-0">
              <div className="p-2.5 rounded-full bg-pink-100 text-pink-600 dark:bg-pink-900/40 dark:text-pink-400 group-hover:scale-110 group-hover:bg-pink-200 dark:group-hover:bg-pink-800/50 transition-all duration-300">
                <TrendingUp className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-semibold text-pink-600/80 dark:text-pink-400/80 uppercase tracking-wider">
                  Active Campaigns
                </p>
                <div className="flex items-baseline gap-2 mt-0.5">
                  <h3 className="text-2xl font-bold text-foreground">
                    {stats.ticketsByCampaign.length}
                  </h3>
                  <span className="text-sm font-medium text-pink-600 dark:text-pink-400 group-hover:underline flex items-center">
                    View list <ChevronRight className="w-3 h-3 ml-0.5" />
                  </span>
                </div>
              </div>
            </div>
          </div>
        </button>
      </div>

      {/* --- ROW 3: Gráficos Principales --- */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Ticket Activity Line/Bar */}
        <div className="lg:col-span-2 rounded-2xl border bg-card p-6 shadow-sm flex flex-col">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h3 className="text-lg font-bold text-foreground">
                Ticket Activity Over Time
              </h3>
              <p className="text-sm text-muted-foreground">
                Volume of open vs closed tickets
              </p>
            </div>
            <div className="px-3 py-1 rounded-full bg-muted/50 border text-sm font-medium">
              Total: {stats.totalTickets}
            </div>
          </div>

          <div className="h-[300px] w-full mt-auto">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={activeChartData}
                margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  vertical={false}
                  stroke="hsl(var(--border))"
                  opacity={0.6}
                />
                <XAxis
                  dataKey="day"
                  axisLine={false}
                  tickLine={false}
                  angle={-45}
                  textAnchor="end"
                  height={60}
                  minTickGap={15}
                  tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
                  dy={10}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
                />
                <Tooltip
                  cursor={{ fill: "hsl(var(--muted)/0.4)" }}
                  contentStyle={{
                    background: "hsl(var(--background))",
                    borderRadius: "12px",
                    border: "1px solid hsl(var(--border))",
                    boxShadow: "0 10px 15px -3px rgb(0 0 0 / 0.1)",
                    padding: "12px",
                  }}
                  labelFormatter={(value, payload) => {
                    if (payload && payload[0]) {
                      return payload[0].payload.fullDate || value;
                    }
                    return value;
                  }}
                />
                <Legend
                  wrapperStyle={{ paddingTop: "10px" }}
                  iconType="circle"
                />
                <Bar
                  dataKey="open"
                  name="Active Tickets"
                  fill="oklch(0.65 0.22 25)"
                  radius={[4, 4, 0, 0]}
                  maxBarSize={45}
                />
                <Bar
                  dataKey="closed"
                  name="Closed Tickets"
                  fill="oklch(0.65 0.18 160)"
                  radius={[4, 4, 0, 0]}
                  maxBarSize={45}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Status Distribution */}
        <div className="flex flex-col rounded-2xl border bg-card shadow-sm overflow-hidden">
          <div className="p-6 pb-2">
            <h3 className="text-lg font-bold text-foreground">
              Status Distribution
            </h3>
            <p className="text-sm text-muted-foreground">
              Current state of tickets
            </p>
          </div>

          <div className="flex-1 min-h-[220px] relative mt-2">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={stats.ticketsByStatus}
                  cx="50%"
                  cy="50%"
                  innerRadius={70}
                  outerRadius={95}
                  paddingAngle={3}
                  dataKey="count"
                  stroke="hsl(var(--background))"
                  strokeWidth={3}
                >
                  {stats.ticketsByStatus.map((entry, index) => (
                    <Cell
                      key={`status-cell-${entry.status}`}
                      fill={
                        STATUS_COLORS[entry.status] ||
                        DISPOSITION_COLORS[index % DISPOSITION_COLORS.length]
                      }
                    />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            {/* Texto Centralizado Seguro */}
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none pt-2">
              <span className="text-3xl font-bold text-foreground leading-none">
                {stats.totalTickets}
              </span>
              <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest mt-1">
                Total
              </span>
            </div>
          </div>

          <div className="p-4 bg-muted/10 border-t mt-auto">
            <div className="flex flex-wrap gap-2 justify-center">
              {stats.ticketsByStatus.map((item, index) => (
                <div
                  key={item.status}
                  className="flex items-center gap-2 text-xs bg-background px-3 py-1.5 rounded-full border shadow-sm"
                >
                  <div
                    className="h-2 w-2 rounded-full shrink-0"
                    style={{
                      backgroundColor:
                        STATUS_COLORS[item.status] ||
                        DISPOSITION_COLORS[index % DISPOSITION_COLORS.length],
                    }}
                  />
                  <span className="text-muted-foreground font-medium capitalize">
                    {item.status.replace("_", " ").toLowerCase()}
                  </span>
                  <span className="font-bold text-foreground ml-1">
                    {item.count}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* --- ROW 4: Breakdown Charts (Disposition, Direction, Priority) --- */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Helper function to render breakdown cards */}
        {[
          {
            title: "Disposition",
            desc: "Ticket outcomes",
            data: stats.ticketsByDisposition,
            key: "disposition",
            colors: DISPOSITION_COLORS,
          },
          {
            title: "Direction",
            desc: "Communication type",
            data: stats.ticketsByDirection,
            key: "direction",
            colors: DIRECTION_COLORS,
          },
          {
            title: "Priority",
            desc: "Urgency levels",
            data: stats.ticketsByPriority,
            key: "priority",
            colors: PRIORITY_COLORS,
          },
        ].map((block) => (
          <div
            key={block.title}
            className="flex flex-col rounded-2xl border bg-card shadow-sm p-6"
          >
            <div>
              <h3 className="text-base font-bold text-foreground">
                {block.title}
              </h3>
              <p className="text-xs text-muted-foreground">{block.desc}</p>
            </div>

            <div className="h-48 my-4">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={block.data}
                    cx="50%"
                    cy="50%"
                    innerRadius={45}
                    outerRadius={70}
                    dataKey="count"
                    paddingAngle={2}
                    stroke="hsl(var(--background))"
                    strokeWidth={2}
                  >
                    {block.data.map((entry, index) => (
                      <Cell
                        key={(entry as any)[block.key]}
                        fill={
                          (block.colors as any)[(entry as any)[block.key]] ||
                          DISPOSITION_COLORS[index % DISPOSITION_COLORS.length]
                        }
                      />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            </div>

            <div className="mt-auto pt-4 border-t space-y-2.5 max-h-40 overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-muted">
              {block.data.length > 0 ? (
                block.data.map((item: any, index: number) => (
                  <div
                    key={item[block.key]}
                    className="flex items-center justify-between text-sm group"
                  >
                    <div className="flex items-center gap-2.5 truncate pr-2">
                      <div
                        className="w-2.5 h-2.5 rounded-full shrink-0"
                        style={{
                          backgroundColor:
                            (block.colors as any)[item[block.key]] ||
                            DISPOSITION_COLORS[
                              index % DISPOSITION_COLORS.length
                            ],
                        }}
                      />
                      <span className="text-muted-foreground group-hover:text-foreground transition-colors capitalize truncate">
                        {item[block.key].replace("_", " ").toLowerCase()}
                      </span>
                    </div>
                    <span className="font-semibold text-foreground bg-muted/50 px-2 py-0.5 rounded-md">
                      {item.count}
                    </span>
                  </div>
                ))
              ) : (
                <div className="text-sm text-muted-foreground text-center py-2">
                  No data recorded
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* --- ROW 5: Rankings (Agents & Campaigns) --- */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Agents */}
        <div className="rounded-2xl border bg-card shadow-sm p-6">
          <div className="flex items-center justify-between mb-6 pb-4 border-b">
            <div>
              <h3 className="text-lg font-bold text-foreground">Top Agents</h3>
              <p className="text-sm text-muted-foreground">
                Most active resolvers
              </p>
            </div>
            <div className="p-2 bg-muted rounded-lg">
              <Users className="h-5 w-5 text-muted-foreground" />
            </div>
          </div>

          <div className="space-y-3">
            {stats.ticketsByAgent.length > 0 ? (
              stats.ticketsByAgent.slice(0, 5).map((agent, index) => (
                <div
                  key={agent.agentId}
                  className="flex items-center justify-between p-3 rounded-xl hover:bg-muted/50 transition-colors border border-transparent hover:border-border"
                >
                  <div className="flex items-center gap-4">
                    <div
                      className={`flex items-center justify-center w-8 h-8 rounded-full font-bold text-sm ${
                        index === 0
                          ? "bg-amber-100 text-amber-700 dark:bg-amber-500/20"
                          : index === 1
                            ? "bg-slate-200 text-slate-700 dark:bg-slate-600/30"
                            : index === 2
                              ? "bg-orange-100 text-orange-800 dark:bg-orange-900/30"
                              : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {index + 1}
                    </div>
                    <div>
                      <p className="font-semibold text-foreground">
                        {agent.agentName}
                      </p>
                      <p className="text-xs text-muted-foreground font-mono">
                        ID: {agent.agentId}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-lg text-foreground">
                      {agent.count}
                    </p>
                    <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">
                      tickets
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-sm text-muted-foreground border-2 border-dashed rounded-xl">
                No agent data available
              </div>
            )}
          </div>
        </div>

        {/* Top Customers */}
        <div className="rounded-2xl border bg-card shadow-sm p-6">
          <div className="flex items-center justify-between mb-6 pb-4 border-b">
            <div>
              <h3 className="text-lg font-bold text-foreground">
                Top Customers
              </h3>
              <p className="text-sm text-muted-foreground">
                Highest ticket volume
              </p>
            </div>
            <div className="p-2 bg-muted rounded-lg">
              <BarChart3 className="h-5 w-5 text-muted-foreground" />
            </div>
          </div>

          <div className="space-y-3">
            {topCustomers.length > 0 ? (
              topCustomers.map((customer, index) => (
                <div
                  key={customer.key}
                  className="flex items-center justify-between p-3 rounded-xl hover:bg-muted/50 transition-colors border border-transparent hover:border-border"
                >
                  <div className="flex items-center gap-4">
                    <div
                      className={`flex items-center justify-center w-8 h-8 rounded-full font-bold text-sm ${
                        index === 0
                          ? "bg-blue-100 text-blue-700 dark:bg-blue-500/20"
                          : index === 1
                            ? "bg-indigo-100 text-indigo-700 dark:bg-indigo-500/20"
                            : index === 2
                              ? "bg-cyan-100 text-cyan-800 dark:bg-cyan-900/30"
                              : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {index + 1}
                    </div>
                    <div>
                      <p className="font-semibold text-foreground line-clamp-1">
                        {customer.name}
                      </p>
                      <p className="text-xs text-muted-foreground font-mono">
                        {customer.meta}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-lg text-foreground">
                      {customer.count}
                    </p>
                    <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">
                      tickets
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-sm text-muted-foreground border-2 border-dashed rounded-xl">
                No customer data available
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modal de Campañas Activas */}
      <NewLeadsModal
        open={showNewLeadsModal}
        onOpenChange={setShowNewLeadsModal}
        side="right"
        yardId={stats.yard.id}
        yardName={stats.yard.name}
        reportStartDate={reportStartDate}
        reportEndDate={reportEndDate}
        customersByNewLead={stats.ticketsByNewLead}
      />

      <HighPriorityPendingModal
        open={showHighPriorityPendingModal}
        onOpenChange={setShowHighPriorityPendingModal}
        side="right"
        yardId={stats.yard.id}
        yardName={stats.yard.name}
        reportStartDate={reportStartDate}
        reportEndDate={reportEndDate}
        tickets={yardTickets}
      />

      <ActiveCampaignsModal
        open={showCampaignsModal}
        onOpenChange={setShowCampaignsModal}
        side="right"
        yardId={stats.yard.id}
        yardName={stats.yard.name}
        reportStartDate={reportStartDate}
        reportEndDate={reportEndDate}
        campaignsByTickets={stats.ticketsByCampaign}
      />
    </div>
  );
}
