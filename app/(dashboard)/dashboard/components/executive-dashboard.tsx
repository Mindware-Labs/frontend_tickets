"use client";

import { useMemo } from "react";
import { cn } from "@/lib/utils";
import {
  Bar,
  ComposedChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import {
  DASHBOARD_CHART_HEIGHT_SM_CLASS,
  chartAxisTickStyle,
  chartGridStroke,
  chartLegendStyle,
  dashboardRowClass,
  dashboardShellClass,
  dashboardTableCellClass,
  dashboardTableCellStrongClass,
  dashboardTableHeadClass,
  toneClasses,
  tooltipStyle,
} from "../dashboard-theme";
import { useSupportDashboardData } from "../use-dashboard-real-data";
import {
  crossFilterBarOpacity,
  crossFilterRowClass,
  useCrossFilter,
} from "./chart-cross-filter";
import { DashboardChart } from "./dashboard-chart";
import { DashboardEmptyState } from "./dashboard-empty-state";
import { MetricsGrid } from "./metrics-grid";
import { PanelCard } from "./panel-card";
import { ScorecardStack } from "./scorecard-progress";
import { StatusBadge } from "./status-badge";

export function ExecutiveDashboard() {
  const { data } = useSupportDashboardData();
  const { filters, toggleFilter, toggleHeatmapSlot, isFilterActive, isHeatmapSlotActive } =
    useCrossFilter();
  const dayFilterActive = !!filters.day;
  const heatmapGridColumns = `44px repeat(${data.heatmapHours.length}, minmax(36px, 1fr))`;
  const heatmapPeak = useMemo(() => {
    let max = 0;
    for (const row of data.peakHourHeatmap) {
      for (const value of row.values) {
        max = Math.max(max, value);
      }
    }
    return Math.max(max, 1);
  }, [data.peakHourHeatmap]);

  return (
    <div className={dashboardShellClass}>
      <MetricsGrid metrics={data.executiveMetrics} />

      <div className={`${dashboardRowClass} xl:grid-cols-2`}>
        <PanelCard
          fill
          title="Calls and tickets executive trend"
          subtitle="Click a week bar to filter by day label."
        >
          {data.ticketVsCallTrend.length === 0 ? (
            <DashboardEmptyState message="No executive trend data for this period." compact />
          ) : (
            <DashboardChart>
              <ComposedChart
                data={data.ticketVsCallTrend}
                margin={{ left: -12, right: 4, top: 4, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke={chartGridStroke} vertical={false} />
                <XAxis dataKey="week" tickLine={false} axisLine={false} tick={chartAxisTickStyle} />
                <YAxis tickLine={false} axisLine={false} tick={chartAxisTickStyle} width={32} />
                <Tooltip contentStyle={tooltipStyle} />
                <Legend wrapperStyle={chartLegendStyle} />
                <Bar
                  dataKey="calls"
                  name="Calls"
                  fill={toneClasses.emerald.chart}
                  radius={[4, 4, 0, 0]}
                  cursor="pointer"
                  onClick={(bar) => {
                    const row = bar as { week?: string };
                    if (row.week) toggleFilter("day", row.week);
                  }}
                >
                  {data.ticketVsCallTrend.map((entry) => (
                    <Cell
                      key={entry.week}
                      fill={toneClasses.emerald.chart}
                      fillOpacity={crossFilterBarOpacity(
                        isFilterActive("day", entry.week),
                        dayFilterActive,
                      )}
                    />
                  ))}
                </Bar>
                <Line
                  type="monotone"
                  dataKey="tickets"
                  name="Tickets"
                  stroke={toneClasses.indigo.chart}
                  strokeWidth={2}
                  dot={false}
                />
                <Line
                  type="monotone"
                  dataKey="resolved"
                  name="Resolved"
                  stroke={toneClasses.sky.chart}
                  strokeWidth={2}
                  dot={false}
                />
              </ComposedChart>
            </DashboardChart>
          )}
        </PanelCard>

        <PanelCard
          fill
          title="Leadership KPI scorecard"
          subtitle="Call and ticket KPIs vs targets."
        >
          <ScorecardStack items={data.executiveCallKpis} />
        </PanelCard>
      </div>

      <div className={`${dashboardRowClass} xl:grid-cols-2`}>
        <PanelCard
          fill
          title="Peak call hour heatmap"
          subtitle="Click a cell to filter by day and hour across all charts."
          bodyClassName="flex min-h-0 flex-col"
        >
          {data.peakHourHeatmap.length === 0 ? (
            <DashboardEmptyState message="No peak-hour heatmap data yet." compact />
          ) : (
            <div className={`min-h-0 flex-1 overflow-auto ${DASHBOARD_CHART_HEIGHT_SM_CLASS}`}>
              <div className="min-w-[560px]">
                <div
                  className="grid gap-0.5 text-[10px] text-muted-foreground"
                  style={{ gridTemplateColumns: heatmapGridColumns }}
                >
                  <span />
                  {data.heatmapHours.map((hour) => (
                    <span key={hour} className="text-center">
                      {hour}
                    </span>
                  ))}
                </div>
                <div className="mt-1 space-y-0.5">
                  {data.peakHourHeatmap.map((row) => (
                    <div
                      key={row.day}
                      className="grid items-center gap-0.5"
                      style={{ gridTemplateColumns: heatmapGridColumns }}
                    >
                      <span className="text-[10px] font-medium text-muted-foreground">
                        {row.day}
                      </span>
                      {row.values.map((value, index) => {
                        const hourKey =
                          data.heatmapHourKeys[index] ?? String(index);
                        return (
                          <button
                            key={`${row.day}-${hourKey}`}
                            type="button"
                            className={cn(
                              "flex h-7 items-center justify-center rounded-md text-[10px] font-semibold text-slate-900 transition ring-offset-1 hover:ring-2 hover:ring-[#008f68]/30 dark:text-slate-100",
                              isHeatmapSlotActive(row.day, hourKey) &&
                                "ring-2 ring-[#008f68]/50",
                            )}
                            style={{
                              backgroundColor: `rgba(0, 143, 104, ${Math.max(
                                0.1,
                                value / heatmapPeak,
                              )})`,
                            }}
                            onClick={() => toggleHeatmapSlot(row.day, hourKey)}
                            title={`Filter by ${row.day} ${data.heatmapHours[index]}`}
                          >
                            {value}
                          </button>
                        );
                      })}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </PanelCard>

        <PanelCard
          fill
          title="Ticket risk by yard"
          subtitle="Click a yard row to filter by yard."
          bodyClassName="flex flex-col"
        >
          {data.ticketRisk.length === 0 ? (
            <DashboardEmptyState message="No yard ticket breakdown." compact />
          ) : (
            <div className={`min-h-0 flex-1 overflow-auto ${DASHBOARD_CHART_HEIGHT_SM_CLASS}`}>
              <table className="w-full min-w-[560px] text-left">
                <thead>
                  <tr className="border-b border-slate-100 dark:border-slate-800">
                    <th className={dashboardTableHeadClass}>Yard</th>
                    <th className={dashboardTableHeadClass}>Open</th>
                    <th className={dashboardTableHeadClass}>Overdue</th>
                    <th className={dashboardTableHeadClass}>Resolution</th>
                    <th className={dashboardTableHeadClass}>Rate</th>
                  </tr>
                </thead>
                <tbody>
                  {data.ticketRisk.map((yard) => (
                    <tr
                      key={`${yard.yard}-${yard.line}`}
                      className={cn(
                        "border-b border-slate-50 last:border-b-0 dark:border-slate-800/80",
                        crossFilterRowClass(isFilterActive("yard", yard.yard)),
                      )}
                      onClick={() => toggleFilter("yard", yard.yard)}
                      onKeyDown={(event) => {
                        if (event.key === "Enter" || event.key === " ") {
                          event.preventDefault();
                          toggleFilter("yard", yard.yard);
                        }
                      }}
                      tabIndex={0}
                      role="button"
                    >
                      <td className={dashboardTableCellStrongClass}>{yard.yard}</td>
                      <td className={`${dashboardTableCellClass} tabular-nums`}>{yard.open}</td>
                      <td className="py-1.5 pr-3">
                        <StatusBadge tone={yard.overdue > 5 ? "rose" : "amber"}>
                          {yard.overdue}
                        </StatusBadge>
                      </td>
                      <td className={dashboardTableCellClass}>{yard.resolution}</td>
                      <td className={dashboardTableCellStrongClass}>{yard.rate}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </PanelCard>
      </div>

      <PanelCard title="Leadership KPI snapshot" subtitle="Metrics and cadence.">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-left">
            <thead>
              <tr className="border-b border-slate-100 dark:border-slate-800">
                <th className={dashboardTableHeadClass}>Group</th>
                <th className={dashboardTableHeadClass}>Metric</th>
                <th className={dashboardTableHeadClass}>Cadence</th>
                <th className={dashboardTableHeadClass}>Source</th>
              </tr>
            </thead>
            <tbody>
              {data.leadershipCadence.map((row) => (
                <tr
                  key={`${row.group}-${row.metric}`}
                  className="border-b border-slate-50 last:border-b-0 dark:border-slate-800/80"
                >
                  <td className="py-2 pr-3">
                    <StatusBadge tone={row.group === "Call KPI" ? "sky" : "indigo"}>
                      {row.group}
                    </StatusBadge>
                  </td>
                  <td className={dashboardTableCellStrongClass}>{row.metric}</td>
                  <td className={dashboardTableCellClass}>{row.cadence}</td>
                  <td className={`${dashboardTableCellClass} max-w-[200px] truncate`}>
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
