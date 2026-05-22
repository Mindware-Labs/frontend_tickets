import {
  Bar,
  ComposedChart,
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
import { MetricsGrid } from "./metrics-grid";
import { PanelCard } from "./panel-card";
import { ScorecardProgress } from "./scorecard-progress";
import { StatusBadge } from "./status-badge";

export function ExecutiveDashboard() {
  const { data } = useSupportDashboardData();
  const heatmapGridColumns = `56px repeat(${data.heatmapHours.length}, minmax(44px, 1fr))`;

  return (
    <div className="space-y-4">
      <MetricsGrid metrics={data.executiveMetrics} />

      <div className="grid gap-4 xl:grid-cols-[1fr_1fr]">
        <PanelCard
          title="Calls and tickets executive trend"
          subtitle="Weekly ratio of logged calls, opened tickets and resolved cases."
        >
          {data.ticketVsCallTrend.length === 0 ? (
            <DashboardEmptyState message="No executive trend data for this period." />
          ) : (
          <div className="h-[320px]">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart
                data={data.ticketVsCallTrend}
                margin={{ left: -16, right: 8 }}
              >
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
          )}
        </PanelCard>

        <PanelCard
          title="Leadership KPI scorecard"
          subtitle="Call KPIs and ticket KPIs compared against operating targets."
        >
          <div className="space-y-4">
            {data.executiveCallKpis.map((item) => (
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
          {data.peakHourHeatmap.length === 0 ? (
            <DashboardEmptyState message="No peak-hour heatmap from Aircall wallboard yet." />
          ) : (
          <div className="overflow-x-auto">
            <div className="min-w-[680px]">
              <div
                className="grid gap-1 text-xs text-muted-foreground"
                style={{ gridTemplateColumns: heatmapGridColumns }}
              >
                <span />
                {data.heatmapHours.map((hour) => (
                  <span key={hour} className="text-center">
                    {hour}
                  </span>
                ))}
              </div>
              <div className="mt-2 space-y-1">
                {data.peakHourHeatmap.map((row) => (
                  <div
                    key={row.day}
                    className="grid items-center gap-1"
                    style={{ gridTemplateColumns: heatmapGridColumns }}
                  >
                    <span className="text-xs font-medium text-slate-600 dark:text-slate-400">
                      {row.day}
                    </span>
                    {row.values.map((value, index) => (
                      <div
                        key={`${row.day}-${data.heatmapHours[index]}`}
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
          )}
        </PanelCard>

        <PanelCard
          title="Ticket risk by yard and line"
          subtitle="Open workload, overdue count, response time and resolution rate."
        >
          {data.ticketRisk.length === 0 ? (
            <DashboardEmptyState message="No yard ticket breakdown for this period." />
          ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[700px] text-left text-sm">
              <thead>
                <tr className="border-b border-border text-muted-foreground">
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
              {data.ticketRisk.map((yard) => (
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
          )}
        </PanelCard>
      </div>

      <PanelCard
        title="Leadership KPI snapshot"
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
              {data.leadershipCadence.map((row) => (
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
