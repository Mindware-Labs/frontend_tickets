import { cn } from "@/lib/utils";
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
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import {
  DASHBOARD_CHART_HEIGHT_CLASS,
  DASHBOARD_CHART_HEIGHT_SM_CLASS,
  chartAxisTickStyle,
  chartGridStroke,
  chartLegendStyle,
  dashboardListItemClass,
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
import { FunnelBars } from "./funnel-bars";
import { MetricsGrid } from "./metrics-grid";
import { PanelCard } from "./panel-card";

export function MarketingDashboard() {
  const { data } = useSupportDashboardData();
  const { filters, toggleFilter, isFilterActive } = useCrossFilter();
  const dispositionTotal = data.dispositionBreakdown.reduce(
    (sum, item) => sum + item.value,
    0,
  );
  const hasFunnelData =
    data.leadFunnel.some((s) => s.value > 0) ||
    data.arFunnel.some((s) => s.value > 0);
  const campaignFilterActive = !!filters.campaign;
  const yardFilterActive = !!filters.yard;
  const dispositionFilterActive = !!filters.disposition;

  return (
    <div className={dashboardShellClass}>
      <MetricsGrid metrics={data.marketingMetrics} />

      <div className={`${dashboardRowClass} xl:grid-cols-[1.2fr_1fr]`}>
        <PanelCard
          fill
          title="Campaign performance"
          subtitle="Click a bar to filter the dashboard by campaign."
        >
          {data.campaignRates.length === 0 ? (
            <DashboardEmptyState message="No campaign breakdown for this period." compact />
          ) : (
            <DashboardChart>
              <BarChart data={data.campaignRates} margin={{ left: -12, right: 4, top: 4, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={chartGridStroke} vertical={false} />
                <XAxis dataKey="campaign" tickLine={false} axisLine={false} tick={chartAxisTickStyle} />
                <YAxis tickLine={false} axisLine={false} unit="%" tick={chartAxisTickStyle} width={28} />
                <Tooltip
                  contentStyle={tooltipStyle}
                  formatter={(value: number) => [`${value}%`, "Share of calls"]}
                />
                <Legend wrapperStyle={chartLegendStyle} />
                <Bar
                  dataKey="volume"
                  name="Share of calls"
                  fill={toneClasses.emerald.chart}
                  radius={[4, 4, 0, 0]}
                  cursor="pointer"
                  onClick={(bar) => {
                    const row = bar as { campaign?: string };
                    if (row.campaign) toggleFilter("campaign", row.campaign);
                  }}
                >
                  {data.campaignRates.map((entry) => (
                    <Cell
                      key={entry.campaign}
                      fill={toneClasses.emerald.chart}
                      fillOpacity={crossFilterBarOpacity(
                        isFilterActive("campaign", entry.campaign),
                        campaignFilterActive,
                      )}
                    />
                  ))}
                </Bar>
              </BarChart>
            </DashboardChart>
          )}
        </PanelCard>

        <PanelCard
          fill
          title="Campaign options"
          subtitle="Outcome distribution by campaign type."
          bodyClassName="min-h-0"
        >
          {!hasFunnelData ? (
            <DashboardEmptyState message="No campaign options for this period." compact />
          ) : (
            <div
              className={`grid ${DASHBOARD_CHART_HEIGHT_CLASS} grid-cols-1 gap-3 md:grid-cols-2`}
            >
              <FunnelBars title="Onboarding" data={data.leadFunnel} tone="indigo" compact />
              <FunnelBars title="AR" data={data.arFunnel} tone="emerald" compact />
            </div>
          )}
        </PanelCard>
      </div>

      <div className={`${dashboardRowClass} xl:grid-cols-2`}>
        <PanelCard
          fill
          title="SMS engagement"
          subtitle="Filtered by day when a day filter is active."
        >
          {data.smsTrend.length === 0 ? (
            <DashboardEmptyState message="No SMS activity for this period." compact />
          ) : (
            <DashboardChart size="sm">
              <ComposedChart data={data.smsTrend} margin={{ left: -12, right: 4, top: 4, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={chartGridStroke} vertical={false} />
                <XAxis dataKey="week" tickLine={false} axisLine={false} tick={chartAxisTickStyle} />
                <YAxis yAxisId="left" tickLine={false} axisLine={false} tick={chartAxisTickStyle} width={28} />
                <YAxis
                  yAxisId="right"
                  orientation="right"
                  tickLine={false}
                  axisLine={false}
                  unit="%"
                  tick={chartAxisTickStyle}
                  width={32}
                />
                <Tooltip contentStyle={tooltipStyle} />
                <Legend wrapperStyle={chartLegendStyle} />
                <Bar
                  yAxisId="left"
                  dataKey="sent"
                  name="Sent"
                  fill={toneClasses.sky.chart}
                  radius={[4, 4, 0, 0]}
                />
                <Bar
                  yAxisId="left"
                  dataKey="replies"
                  name="Replies"
                  fill={toneClasses.amber.chart}
                  radius={[4, 4, 0, 0]}
                />
                <Line
                  yAxisId="right"
                  type="monotone"
                  dataKey="rate"
                  name="Reply rate"
                  stroke={toneClasses.emerald.chart}
                  strokeWidth={2}
                  dot={false}
                />
              </ComposedChart>
            </DashboardChart>
          )}
        </PanelCard>

        <PanelCard
          fill
          title="Disposition mix"
          subtitle="Click a slice or row to filter by disposition."
          bodyClassName="flex min-h-0 flex-col"
        >
          {data.dispositionBreakdown.length === 0 ? (
            <DashboardEmptyState message="No disposition breakdown." compact />
          ) : (
            <div
              className={cn(
                "flex min-h-0 flex-1 flex-col gap-3 sm:flex-row sm:items-center",
                DASHBOARD_CHART_HEIGHT_SM_CLASS,
              )}
            >
              <div className="flex shrink-0 items-center justify-center sm:w-[168px]">
                <DashboardChart size="sm" className="aspect-square w-full max-w-[168px]">
                  <PieChart>
                    <Pie
                      data={data.dispositionBreakdown}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      innerRadius={data.dispositionBreakdown.length === 1 ? 52 : 44}
                      outerRadius={data.dispositionBreakdown.length === 1 ? 72 : 64}
                      paddingAngle={0}
                      cursor="pointer"
                      onClick={(slice) => {
                        const row = slice as { name?: string };
                        if (row.name) toggleFilter("disposition", row.name);
                      }}
                    >
                      {data.dispositionBreakdown.map((entry) => (
                        <Cell
                          key={entry.name}
                          fill={entry.color}
                          fillOpacity={crossFilterBarOpacity(
                            isFilterActive("disposition", entry.name),
                            dispositionFilterActive,
                          )}
                        />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={tooltipStyle} />
                  </PieChart>
                </DashboardChart>
              </div>
              <div className="min-h-0 min-w-0 flex-1">
                <p className="mb-2 text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                  {dispositionTotal} calls · {data.dispositionBreakdown.length}{" "}
                  {data.dispositionBreakdown.length === 1 ? "disposition" : "dispositions"}
                </p>
                <ul
                  className={cn(
                    "grid grid-cols-1 gap-1.5",
                    data.dispositionBreakdown.length > 2 &&
                      "sm:grid-cols-2 sm:gap-2",
                  )}
                >
                  {data.dispositionBreakdown.map((item) => (
                    <li key={item.name}>
                      <button
                        type="button"
                        onClick={() => toggleFilter("disposition", item.name)}
                        className={cn(
                          "flex w-full items-center justify-between gap-3 rounded-lg border border-slate-100 bg-slate-50/80 px-3 py-2 text-left dark:border-slate-800 dark:bg-slate-900/50",
                          crossFilterRowClass(
                            isFilterActive("disposition", item.name),
                          ),
                        )}
                      >
                        <span className="flex min-w-0 items-center gap-2 text-[11px] font-medium text-slate-800 dark:text-slate-100">
                          <span
                            className="size-2.5 shrink-0 rounded-sm"
                            style={{ backgroundColor: item.color }}
                          />
                          <span className="truncate">{item.name}</span>
                        </span>
                        <span className="shrink-0 text-[11px] font-semibold tabular-nums text-slate-600 dark:text-slate-300">
                          {item.value}
                          {dispositionTotal > 0
                            ? ` (${Math.round((item.value / dispositionTotal) * 100)}%)`
                            : ""}
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}
        </PanelCard>
      </div>

      <div className={`${dashboardRowClass} xl:grid-cols-2`}>
        <PanelCard title="Campaign volume by line" subtitle="Click a row to filter by campaign.">
          {data.marketingUseCases.length === 0 ? (
            <DashboardEmptyState message="No campaigns with activity." compact />
          ) : (
            <div className="max-h-[200px] overflow-auto">
              <table className="w-full text-left">
                <thead className="sticky top-0 bg-white dark:bg-slate-950">
                  <tr className="border-b border-slate-100 dark:border-slate-800">
                    <th className={dashboardTableHeadClass}>Campaign</th>
                    <th className={dashboardTableHeadClass}>Measure</th>
                  </tr>
                </thead>
                <tbody>
                  {data.marketingUseCases.map((row) => (
                    <tr
                      key={row.campaign}
                      className={cn(
                        "border-b border-slate-50 last:border-b-0 dark:border-slate-800/80",
                        crossFilterRowClass(
                          isFilterActive("campaign", row.campaign),
                        ),
                      )}
                      onClick={() => toggleFilter("campaign", row.campaign)}
                      onKeyDown={(event) => {
                        if (event.key === "Enter" || event.key === " ") {
                          event.preventDefault();
                          toggleFilter("campaign", row.campaign);
                        }
                      }}
                      tabIndex={0}
                      role="button"
                    >
                      <td className={dashboardTableCellStrongClass}>{row.campaign}</td>
                      <td className={dashboardTableCellClass}>{row.measures}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </PanelCard>

        <PanelCard title="Yard volume and outcomes" subtitle="Click a yard bar to filter.">
          {data.yardVolume.length === 0 ? (
            <DashboardEmptyState message="No yard volume data." compact />
          ) : (
            <DashboardChart size="sm">
              <BarChart data={data.yardVolume} margin={{ left: -12, right: 4, top: 4, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={chartGridStroke} vertical={false} />
                <XAxis dataKey="yard" tickLine={false} axisLine={false} tick={chartAxisTickStyle} />
                <YAxis tickLine={false} axisLine={false} tick={chartAxisTickStyle} width={28} />
                <Tooltip contentStyle={tooltipStyle} />
                <Legend wrapperStyle={chartLegendStyle} />
                <Bar
                  dataKey="calls"
                  name="Calls"
                  fill={toneClasses.indigo.chart}
                  radius={[4, 4, 0, 0]}
                  cursor="pointer"
                  onClick={(bar) => {
                    const row = bar as { yard?: string };
                    if (row.yard) toggleFilter("yard", row.yard);
                  }}
                >
                  {data.yardVolume.map((entry) => (
                    <Cell
                      key={`${entry.yard}-calls`}
                      fill={toneClasses.indigo.chart}
                      fillOpacity={crossFilterBarOpacity(
                        isFilterActive("yard", entry.yard),
                        yardFilterActive,
                      )}
                    />
                  ))}
                </Bar>
                <Bar dataKey="outcomes" name="Outcomes" fill={toneClasses.emerald.chart} radius={[4, 4, 0, 0]} />
              </BarChart>
            </DashboardChart>
          )}
        </PanelCard>
      </div>
    </div>
  );
}
