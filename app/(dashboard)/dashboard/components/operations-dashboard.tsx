import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { toneClasses, tooltipStyle } from "../dashboard-theme";
import { useSupportDashboardData } from "../use-dashboard-real-data";
import { DashboardEmptyState } from "./dashboard-empty-state";
import { DataRow } from "./data-row";
import { MetricsGrid } from "./metrics-grid";
import { PanelCard } from "./panel-card";
import { StatusBadge } from "./status-badge";

export function OperationsDashboard() {
  const { data } = useSupportDashboardData();

  return (
    <div className="space-y-4">
      <MetricsGrid metrics={data.operationsMetrics} />

      <div className="grid gap-4 xl:grid-cols-[1.45fr_1fr]">
        <PanelCard
          title="Call volume and ticket creation"
          subtitle="Inbound, outbound, missed calls and tickets created by day."
        >
          {data.operationsTrend.length === 0 ? (
            <DashboardEmptyState message="No call trend data for this period." />
          ) : (
          <div className="h-[320px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={data.operationsTrend}
                margin={{ left: -16, right: 8 }}
              >
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
          )}
        </PanelCard>

        <PanelCard
          title="Live wallboard"
          subtitle="Real-time queue visibility requested for supervisors."
        >
          <div className="grid gap-3 sm:grid-cols-2">
            {data.liveWallboard.map((item) => (
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
          {data.agentActivity.length === 0 ? (
            <DashboardEmptyState message="No agent performance data for this period." />
          ) : (
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={data.agentActivity}
                margin={{ left: -16, right: 8 }}
              >
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
          )}
        </PanelCard>

        <PanelCard
          title="Follow-up accountability"
          subtitle="Promised callbacks and ticket follow-ups with owner and due window."
        >
          {data.followUpQueue.length === 0 ? (
            <DashboardEmptyState
              message="No recent tickets in the follow-up queue."
              compact
            />
          ) : (
          <div className="space-y-3">
            {data.followUpQueue.map((item) => (
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
          )}
        </PanelCard>
      </div>

      <PanelCard
        title="Line and campaign operations"
        subtitle="Line-of-origin performance for staffing, attribution and SLA review."
      >
        {data.linePerformance.length === 0 ? (
          <DashboardEmptyState message="No line performance data from Aircall wallboard." />
        ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[920px] text-left text-sm">
            <thead>
              <tr className="border-b border-border text-muted-foreground">
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
              {data.linePerformance.map((line) => (
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
        )}
      </PanelCard>
    </div>
  );
}
