"use client";

import { useState } from "react";
import {
  Activity,
  BarChart3,
  CheckCircle,
  Clock,
  Ticket,
  TrendingUp,
  Users,
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
import type { YardStats, YardStatsDay } from "./types";
import { ActiveCampaignsModal } from "./ActiveCampaignsModal";

type YardDashboardProps = {
  stats: YardStats;
  activeChartData: YardStatsDay[];
};

export function YardDashboard({ stats, activeChartData }: YardDashboardProps) {
  const [showCampaignsModal, setShowCampaignsModal] = useState(false);

  const resolutionRate =
    stats.totalTickets > 0
      ? Math.round((stats.closedTickets / stats.totalTickets) * 100)
      : 0;

  return (
    <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div className="relative overflow-hidden rounded-xl border bg-card p-5 shadow-sm">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs text-muted-foreground">Total Tickets</p>
              <h3 className="text-3xl font-bold mt-1">{stats.totalTickets}</h3>
              <p className="text-xs text-muted-foreground mt-2">
                {stats.openTickets} open, {stats.closedTickets} closed
              </p>
            </div>
            <div className="p-2 rounded-full bg-blue-100 text-blue-700 dark:bg-blue-500/10">
              <Ticket className="w-5 h-5" />
            </div>
          </div>
        </div>

        <div className="relative overflow-hidden rounded-xl border bg-card p-5 shadow-sm">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs text-muted-foreground">Open Tickets</p>
              <h3 className="text-3xl font-bold mt-1">{stats.openTickets}</h3>
              <p className="text-xs text-muted-foreground mt-2">
                {stats.inProgressTickets} in progress
              </p>
            </div>
            <div className="p-2 rounded-full bg-orange-100 text-orange-700 dark:bg-orange-500/10">
              <Clock className="w-5 h-5" />
            </div>
          </div>
        </div>

        <div className="relative overflow-hidden rounded-xl border bg-card p-5 shadow-sm">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs text-muted-foreground">Closed Tickets</p>
              <h3 className="text-3xl font-bold mt-1">{stats.closedTickets}</h3>
              <p className="text-xs text-muted-foreground mt-2">
                {resolutionRate}% resolution rate
              </p>
            </div>
            <div className="p-2 rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10">
              <CheckCircle className="w-5 h-5" />
            </div>
          </div>
        </div>

        <div className="relative overflow-hidden rounded-xl border bg-card p-5 shadow-sm">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wider font-medium">
                Resolution Rate
              </p>
              <h3 className="text-2xl font-bold mt-1">{resolutionRate}%</h3>
              <p className="text-xs text-muted-foreground mt-2">
                {stats.closedTickets} of {stats.totalTickets} resolved
              </p>
            </div>
            <div className="p-2 rounded-full bg-purple-100 text-purple-700 dark:bg-purple-500/10">
              <BarChart3 className="w-5 h-5" />
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <div className="relative overflow-hidden rounded-xl border bg-card p-5 shadow-sm">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wider font-medium">
                Today's Volume
              </p>
              <h3 className="text-2xl font-bold mt-1">
                {stats.todayTickets || 0}
              </h3>
              <p className="text-xs text-muted-foreground mt-1">
                {stats.todayTickets === 1
                  ? "1 ticket created today"
                  : "Tickets created today"}
              </p>
            </div>
            <div className="p-2 rounded-full bg-indigo-100 text-indigo-700 dark:bg-indigo-500/10">
              <Activity className="w-5 h-5" />
            </div>
          </div>
        </div>

        <div className="relative overflow-hidden rounded-xl border bg-card p-5 shadow-sm">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs text-muted-foreground">Active Agents</p>
              <h3 className="text-2xl font-bold mt-1">
                {stats.ticketsByAgent.length}
              </h3>
              <p className="text-xs text-muted-foreground mt-2 truncate">
                Top: {stats.ticketsByAgent[0]?.agentName || "N/A"}
              </p>
            </div>
            <div className="p-2 rounded-full bg-cyan-100 text-cyan-700 dark:bg-cyan-500/10">
              <Users className="w-5 h-5" />
            </div>
          </div>
        </div>

        <button
          onClick={() => setShowCampaignsModal(true)}
          className="group relative overflow-hidden rounded-xl border bg-card p-5 text-left shadow-sm hover:shadow-md hover:border-primary/50 transition-all duration-300 cursor-pointer"
        >
          <div className="relative flex justify-between items-start">
            <div>
              <p className="text-xs text-muted-foreground">Active Campaigns</p>
              <h3 className="text-2xl font-bold mt-1">
                {stats.ticketsByCampaign.length}
              </h3>
              <p className="text-xs text-muted-foreground mt-2 truncate">
                {stats.ticketsByCampaign[0]?.campaignName || "N/A"}
              </p>
              <p className="text-xs text-primary mt-1 font-medium group-hover:underline">
                View campaign cards -&gt;
              </p>
            </div>
            <div className="p-2 rounded-full bg-pink-100 text-pink-700 dark:bg-pink-500/10 group-hover:scale-110 transition-transform duration-300">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 rounded-2xl border bg-card/80 backdrop-blur-sm p-6 shadow-lg">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-semibold text-foreground">
              Ticket Activity Over Time
            </h3>
            <span className="text-xs text-muted-foreground">
              Total: {stats.totalTickets}
            </span>
          </div>

          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={activeChartData}
                margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  vertical={false}
                  stroke="hsl(var(--border))"
                  opacity={0.5}
                />
                <XAxis
                  dataKey="day"
                  axisLine={false}
                  tickLine={false}
                  angle={-45}
                  textAnchor="end"
                  height={60}
                  minTickGap={15}
                  tick={{
                    fill: "hsl(var(--muted-foreground))",
                    fontSize: 11,
                  }}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{
                    fill: "hsl(var(--muted-foreground))",
                    fontSize: 12,
                  }}
                />
                <Tooltip
                  cursor={{ fill: "hsl(var(--muted)/0.3)" }}
                  contentStyle={{
                    background: "hsl(var(--background))",
                    borderRadius: "8px",
                    border: "1px solid hsl(var(--border))",
                    boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
                  }}
                  labelFormatter={(value, payload) => {
                    if (payload && payload[0]) {
                      return payload[0].payload.fullDate || value;
                    }
                    return value;
                  }}
                />
                <Legend wrapperStyle={{ paddingTop: "20px" }} />
                <Bar
                  dataKey="open"
                  name="Open"
                  fill="oklch(0.65 0.22 25)"
                  radius={[4, 4, 0, 0]}
                  maxBarSize={45}
                />
                <Bar
                  dataKey="closed"
                  name="Closed"
                  fill="oklch(0.65 0.18 160)"
                  radius={[4, 4, 0, 0]}
                  maxBarSize={45}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="flex flex-col rounded-xl border bg-card text-card-foreground shadow-sm overflow-hidden">
          <div className="p-6 pb-2 border-b">
            <h3 className="font-semibold leading-none tracking-tight flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-primary" />
              Status Distribution
            </h3>
          </div>

          <div className="flex-1 min-h-[200px] relative bg-gradient-to-b from-background to-muted/10">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={stats.ticketsByStatus}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={2}
                  dataKey="count"
                  cornerRadius={4}
                  stroke="hsl(var(--background))"
                  strokeWidth={2}
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
                <Tooltip
                  contentStyle={{
                    borderRadius: "8px",
                    border: "1px solid hsl(var(--border))",
                  }}
                  itemStyle={{ fontWeight: "bold" }}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none flex-col">
              <span className="text-3xl font-bold tracking-tighter">
                {stats.totalTickets}
              </span>
              <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider">
                Total
              </span>
            </div>
          </div>

          <div className="p-4 bg-muted/20 border-t">
            <div className="grid grid-cols-2 gap-2">
              {stats.ticketsByStatus.map((item, index) => (
                <div
                  key={item.status}
                  className="flex items-center gap-2 text-xs bg-background p-2 rounded-md border shadow-sm"
                >
                  <div
                    className="h-2 w-2 rounded-full shrink-0"
                    style={{
                      backgroundColor:
                        STATUS_COLORS[item.status] ||
                        DISPOSITION_COLORS[index % DISPOSITION_COLORS.length],
                    }}
                  />
                  <span className="text-muted-foreground capitalize truncate flex-1">
                    {item.status.replace("_", " ").toLowerCase()}
                  </span>
                  <span className="font-mono font-bold">{item.count}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="rounded-2xl border bg-card/80 backdrop-blur-sm p-6 shadow-lg">
          <h3 className="text-lg font-semibold text-foreground mb-1">
            Disposition Breakdown
          </h3>
          <p className="text-xs text-muted-foreground mb-4">
            All ticket dispositions
          </p>
          <div className="h-52 mb-4">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={stats.ticketsByDisposition}
                  cx="50%"
                  cy="50%"
                  innerRadius={40}
                  outerRadius={60}
                  dataKey="count"
                  paddingAngle={5}
                >
                  {stats.ticketsByDisposition.map((entry, index) => (
                    <Cell
                      key={entry.disposition}
                      fill={
                        DISPOSITION_COLORS[index % DISPOSITION_COLORS.length]
                      }
                    />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="space-y-2 max-h-44 overflow-y-auto pr-2 scrollbar-thin">
            {stats.ticketsByDisposition.length > 0 ? (
              stats.ticketsByDisposition.map((item, index) => (
                <div
                  key={item.disposition}
                  className="flex items-center justify-between text-sm"
                >
                  <div className="flex items-center gap-2">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{
                        backgroundColor:
                          DISPOSITION_COLORS[index % DISPOSITION_COLORS.length],
                      }}
                    />
                    <span className="text-muted-foreground capitalize">
                      {item.disposition.replace("_", " ").toLowerCase()}
                    </span>
                  </div>
                  <span className="font-medium text-foreground">
                    {item.count}
                  </span>
                </div>
              ))
            ) : (
              <div className="text-sm text-muted-foreground text-center py-4">
                No dispositions recorded
              </div>
            )}
          </div>
        </div>

        <div className="rounded-2xl border bg-card/80 backdrop-blur-sm p-6 shadow-lg">
          <h3 className="text-lg font-semibold text-foreground mb-1">
            Direction Breakdown
          </h3>
          <p className="text-xs text-muted-foreground mb-4">Call directions</p>
          <div className="h-52 mb-4">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={stats.ticketsByDirection}
                  cx="50%"
                  cy="50%"
                  innerRadius={40}
                  outerRadius={60}
                  dataKey="count"
                  paddingAngle={5}
                >
                  {stats.ticketsByDirection.map((entry, index) => (
                    <Cell
                      key={entry.direction}
                      fill={
                        DIRECTION_COLORS[entry.direction] ||
                        DISPOSITION_COLORS[index % DISPOSITION_COLORS.length]
                      }
                    />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="space-y-2">
            {stats.ticketsByDirection.map((item, index) => (
              <div
                key={item.direction}
                className="flex items-center justify-between text-sm"
              >
                <div className="flex items-center gap-2">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{
                      backgroundColor:
                        DIRECTION_COLORS[item.direction] ||
                        DISPOSITION_COLORS[index % DISPOSITION_COLORS.length],
                    }}
                  />
                  <span className="text-muted-foreground capitalize">
                    {item.direction.replace("_", " ").toLowerCase()}
                  </span>
                </div>
                <span className="font-medium text-foreground">
                  {item.count}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border bg-card/80 backdrop-blur-sm p-6 shadow-lg">
          <h3 className="text-lg font-semibold text-foreground mb-1">
            Priority Breakdown
          </h3>
          <p className="text-xs text-muted-foreground mb-4">
            Ticket priorities
          </p>
          <div className="h-52 mb-4">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={stats.ticketsByPriority}
                  cx="50%"
                  cy="50%"
                  innerRadius={40}
                  outerRadius={60}
                  dataKey="count"
                  paddingAngle={5}
                >
                  {stats.ticketsByPriority.map((entry, index) => (
                    <Cell
                      key={entry.priority}
                      fill={
                        PRIORITY_COLORS[entry.priority] ||
                        DISPOSITION_COLORS[index % DISPOSITION_COLORS.length]
                      }
                    />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="space-y-2">
            {stats.ticketsByPriority.map((item, index) => (
              <div
                key={item.priority}
                className="flex items-center justify-between text-sm"
              >
                <div className="flex items-center gap-2">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{
                      backgroundColor:
                        PRIORITY_COLORS[item.priority] ||
                        DISPOSITION_COLORS[index % DISPOSITION_COLORS.length],
                    }}
                  />
                  <span className="text-muted-foreground capitalize">
                    {item.priority.replace("_", " ").toLowerCase()}
                  </span>
                </div>
                <span className="font-medium text-foreground">
                  {item.count}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="rounded-2xl border bg-card/80 backdrop-blur-sm p-6 shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-foreground">
              Top Agents
            </h3>
            <Users className="h-5 w-5 text-muted-foreground" />
          </div>
          <div className="space-y-3">
            {stats.ticketsByAgent.length > 0 ? (
              stats.ticketsByAgent.slice(0, 10).map((agent, index) => (
                <div
                  key={agent.agentId}
                  className="flex items-center justify-between p-3 rounded-lg bg-muted/30"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary font-bold text-sm">
                      {index + 1}
                    </div>
                    <div>
                      <p className="font-medium text-sm">{agent.agentName}</p>
                      <p className="text-xs text-muted-foreground">
                        Agent #{agent.agentId}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-lg">{agent.count}</p>
                    <p className="text-xs text-muted-foreground">tickets</p>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-sm text-muted-foreground">
                No agent data available
              </div>
            )}
          </div>
        </div>

        <div className="rounded-2xl border bg-card/80 backdrop-blur-sm p-6 shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-foreground">
              Top Campaigns
            </h3>
            <BarChart3 className="h-5 w-5 text-muted-foreground" />
          </div>
          <div className="space-y-3">
            {stats.ticketsByCampaign.length > 0 ? (
              stats.ticketsByCampaign.slice(0, 10).map((campaign, index) => (
                <div
                  key={campaign.campaignId}
                  className="flex items-center justify-between p-3 rounded-lg bg-muted/30"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary font-bold text-sm">
                      {index + 1}
                    </div>
                    <div>
                      <p className="font-medium text-sm">
                        {campaign.campaignName}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Campaign #{campaign.campaignId}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-lg">{campaign.count}</p>
                    <p className="text-xs text-muted-foreground">tickets</p>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-sm text-muted-foreground">
                No campaign data available
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modal de Campañas Activas */}
      <ActiveCampaignsModal
        open={showCampaignsModal}
        onOpenChange={setShowCampaignsModal}
        yardId={stats.yard.id}
        yardName={stats.yard.name}
        campaignsByTickets={stats.ticketsByCampaign}
      />
    </div>
  );
}
