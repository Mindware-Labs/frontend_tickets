import {
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

import { toneClasses, tooltipStyle } from "../dashboard-theme";
import { useSupportDashboardData } from "../use-dashboard-real-data";
import { DashboardEmptyState } from "./dashboard-empty-state";
import { FunnelBars } from "./funnel-bars";
import { MetricsGrid } from "./metrics-grid";
import { PanelCard } from "./panel-card";

export function MarketingDashboard() {
  const { data } = useSupportDashboardData();
  const dispositionTotal = data.dispositionBreakdown.reduce(
    (sum, item) => sum + item.value,
    0,
  );
  const hasFunnelData =
    data.leadFunnel.some((s) => s.value > 0) ||
    data.arFunnel.some((s) => s.value > 0);

  return (
    <div className="space-y-4">
      <MetricsGrid metrics={data.marketingMetrics} />

      <div className="grid gap-4 xl:grid-cols-[1.2fr_1fr]">
        <PanelCard
          title="Campaign performance"
          subtitle="Contact rate, outcome conversion, SMS reply rate and ROI by campaign line."
        >
          {data.campaignRates.length === 0 ? (
            <DashboardEmptyState message="No campaign breakdown for this period." />
          ) : (
          <div className="h-[330px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={data.campaignRates}
                margin={{ left: -16, right: 8 }}
              >
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
          )}
        </PanelCard>

        <PanelCard
          title="Campaign options"
          subtitle="Call outcomes by campaign option from reports/performance (calls.campaignOption)."
        >
          {!hasFunnelData ? (
            <DashboardEmptyState message="No campaign options recorded for this period." />
          ) : (
          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-1">
            <FunnelBars
              title="Onboarding"
              data={data.leadFunnel}
              tone="indigo"
            />
            <FunnelBars
              title="AR"
              data={data.arFunnel}
              tone="emerald"
            />
          </div>
          )}
        </PanelCard>
      </div>

      <div className="grid gap-4 xl:grid-cols-[1fr_1fr]">
        <PanelCard
          title="Post-integration SMS engagement"
          subtitle="Two-way SMS volume, replies and response rate. Requires Aircall SMS sync."
        >
          {data.smsTrend.length === 0 ? (
            <DashboardEmptyState message="No SMS activity for this period." />
          ) : (
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart
                data={data.smsTrend}
                margin={{ left: -16, right: 8 }}
              >
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
          )}
        </PanelCard>

        <PanelCard
          title="Mandatory disposition mix"
          subtitle="Exact structured outcomes from the upgrade proposal and call enum."
        >
          {data.dispositionBreakdown.length === 0 ? (
            <DashboardEmptyState message="No disposition breakdown for this period." />
          ) : (
          <div className="grid gap-4 lg:grid-cols-[240px_1fr] lg:items-center">
            <div className="h-[260px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={data.dispositionBreakdown}
                    dataKey="value"
                    nameKey="name"
                    innerRadius={62}
                    outerRadius={92}
                    paddingAngle={2}
                  >
                    {data.dispositionBreakdown.map((entry) => (
                      <Cell key={entry.name} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={tooltipStyle} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="grid gap-2 sm:grid-cols-2">
              {data.dispositionBreakdown.map((item) => (
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
                  <span className="text-sm font-semibold tabular-nums text-foreground">
                    {item.value}
                    {dispositionTotal > 0
                      ? ` (${Math.round((item.value / dispositionTotal) * 100)}%)`
                      : ""}
                  </span>
                </div>
              ))}
            </div>
          </div>
          )}
        </PanelCard>
      </div>

      <PanelCard
        title="Campaign volume by line"
        subtitle="Live campaign breakdown from the performance report."
      >
        {data.marketingUseCases.length === 0 ? (
          <DashboardEmptyState message="No campaigns with activity in this period." />
        ) : (
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
              {data.marketingUseCases.map((row) => (
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
        )}
      </PanelCard>

      <PanelCard
        title="Yard volume and outcomes"
        subtitle="Location reporting for marketing allocation and operational load."
      >
        {data.yardVolume.length === 0 ? (
          <DashboardEmptyState message="No yard volume data for this period." />
        ) : (
        <div className="h-[320px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data.yardVolume} margin={{ left: -16, right: 8 }}>
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
        )}
      </PanelCard>
    </div>
  );
}
