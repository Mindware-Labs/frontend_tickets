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
  CHART_ANIMATION_DURATION,
  chartAxisTickStyle,
  chartBarCursor,
  chartGridStroke,
  chartLegendStyle,
  dashboardPairedRowClass,
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
import {
  ExecutiveCallIntentPanel,
  ExecutiveCallIntentTopDriver,
} from "./executive-call-intent-panel";
import { KpiScorecardGrid } from "./kpi-scorecard-grid";
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

      <div className={dashboardPairedRowClass}>
        <PanelCard
          fill
          title="Calls and tickets executive trend"
          subtitle="Click a week bar to filter by day label."
          bodyClassName="flex min-h-0 flex-1 flex-col"
        >
          {data.ticketVsCallTrend.length === 0 ? (
            <DashboardEmptyState message="No executive trend data for this period." compact />
          ) : (
            <DashboardChart fill>
              <ComposedChart
                data={data.ticketVsCallTrend}
                margin={{ left: -12, right: 4, top: 4, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke={chartGridStroke} vertical={false} />
                <XAxis dataKey="week" tickLine={false} axisLine={false} tick={chartAxisTickStyle} />
                <YAxis
                  tickLine={false}
                  axisLine={false}
                  tick={chartAxisTickStyle}
                  width={32}
                  allowDecimals={false}
                />
                <Tooltip contentStyle={tooltipStyle} cursor={chartBarCursor} />
                <Legend wrapperStyle={chartLegendStyle} />
                <Bar
                  dataKey="calls"
                  name="Calls"
                  fill={toneClasses.emerald.chart}
                  radius={[4, 4, 0, 0]}
                  maxBarSize={48}
                  animationDuration={CHART_ANIMATION_DURATION}
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
                  activeDot={{ r: 4 }}
                  animationDuration={CHART_ANIMATION_DURATION}
                />
                <Line
                  type="monotone"
                  dataKey="resolved"
                  name="Resolved"
                  stroke={toneClasses.sky.chart}
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 4 }}
                  animationDuration={CHART_ANIMATION_DURATION}
                />
              </ComposedChart>
            </DashboardChart>
          )}
        </PanelCard>

        <PanelCard
          fill
          title="Leadership KPIs"
          subtitle="Actual vs goal."
          bodyClassName="flex min-h-0 flex-1 flex-col"
        >
          <KpiScorecardGrid items={data.executiveCallKpis} />
        </PanelCard>
      </div>

      <div className={`${dashboardRowClass} xl:grid-cols-2 xl:items-start`}>
        <PanelCard
          title="Customer call reasons"
          subtitle="Share of calls by campaign option on the call — billing, registration, move-out, and similar drivers."
          subtitleAction={
            <ExecutiveCallIntentTopDriver
              topReason={data.executiveCallIntentMix.topReason}
            />
          }
          bodyClassName="py-2"
        >
          <ExecutiveCallIntentPanel mix={data.executiveCallIntentMix} />
        </PanelCard>

        <PanelCard
          title="Ticket risk by yard"
          subtitle="Click a yard row to filter by yard."
          bodyClassName="p-0"
        >
          {data.ticketRisk.length === 0 ? (
            <DashboardEmptyState message="No yard ticket breakdown." compact />
          ) : (
            <div className="overflow-x-auto px-3 py-2">
              <table className="w-full min-w-[560px] text-left">
                <thead>
                  <tr className="border-b border-slate-100 dark:border-neutral-800">
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
                        "border-b border-slate-50 last:border-b-0 dark:border-neutral-800/80",
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

      <PanelCard
        title="Peak call hour heatmap"
        subtitle="Click a cell to filter by day and hour across all charts."
        bodyClassName="p-0"
      >
        {data.peakHourHeatmap.length === 0 ? (
          <DashboardEmptyState message="No peak-hour heatmap data yet." compact />
        ) : (
          <div className="overflow-x-auto px-3 py-2.5">
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
                            "flex h-7 items-center justify-center rounded-md text-[10px] font-semibold text-slate-900 transition ring-offset-1 hover:ring-2 hover:ring-[#008f68]/30 dark:text-neutral-100",
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
    </div>
  );
}
