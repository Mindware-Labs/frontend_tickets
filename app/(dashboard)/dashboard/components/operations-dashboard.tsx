import { cn } from "@/lib/utils";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
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
import { InsightsMetricGrid } from "./insights-metric-grid";
import { MetricsGrid } from "./metrics-grid";
import { PanelCard } from "./panel-card";
import { StatusBadge } from "./status-badge";

export function OperationsDashboard() {
  const { data } = useSupportDashboardData();
  const { filters, toggleFilter, isFilterActive } = useCrossFilter();
  const agentFilterActive = !!filters.agent;

  return (
    <div className={dashboardShellClass}>
      <MetricsGrid metrics={data.operationsMetrics} />

      <div className={`${dashboardRowClass} xl:grid-cols-[1.45fr_1fr]`}>
        <PanelCard
          fill
          title="Call volume and ticket creation"
          subtitle="Click a point on the chart to filter by day."
        >
          {data.operationsTrend.length === 0 ? (
            <DashboardEmptyState message="No call trend data for this period." compact />
          ) : (
            <DashboardChart>
              <AreaChart data={data.operationsTrend} margin={{ left: -12, right: 4, top: 4, bottom: 0 }}>
                <defs>
                  <linearGradient id="inboundFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={toneClasses.emerald.chart} stopOpacity={0.28} />
                    <stop offset="95%" stopColor={toneClasses.emerald.chart} stopOpacity={0.02} />
                  </linearGradient>
                  <linearGradient id="outboundFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={toneClasses.sky.chart} stopOpacity={0.22} />
                    <stop offset="95%" stopColor={toneClasses.sky.chart} stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke={chartGridStroke} vertical={false} />
                <XAxis dataKey="day" tickLine={false} axisLine={false} tick={chartAxisTickStyle} />
                <YAxis tickLine={false} axisLine={false} tick={chartAxisTickStyle} width={32} />
                <Tooltip contentStyle={tooltipStyle} />
                <Legend wrapperStyle={chartLegendStyle} />
                <Area
                  type="monotone"
                  dataKey="inbound"
                  name="Inbound"
                  stroke={toneClasses.emerald.chart}
                  fill="url(#inboundFill)"
                  strokeWidth={2}
                  activeDot={{
                    r: 5,
                    cursor: "pointer",
                    onClick: (_event, dot) => {
                      const day = (dot as { payload?: { day?: string } }).payload
                        ?.day;
                      if (day) toggleFilter("day", day);
                    },
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="outbound"
                  name="Outbound"
                  stroke={toneClasses.sky.chart}
                  fill="url(#outboundFill)"
                  strokeWidth={2}
                />
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
                  dataKey="missed"
                  name="Missed"
                  stroke={toneClasses.rose.chart}
                  strokeWidth={2}
                  dot={false}
                />
              </AreaChart>
            </DashboardChart>
          )}
        </PanelCard>

        <PanelCard
          fill
          title="Contact & missed-call insights"
          subtitle="Contact rate, missed rate, peak window and voicemail."
        >
          {data.operationsInsights.length === 0 ? (
            <DashboardEmptyState message="No call quality metrics for this period." compact />
          ) : (
            <InsightsMetricGrid items={data.operationsInsights} />
          )}
        </PanelCard>
      </div>

      <div className={`${dashboardRowClass} xl:grid-cols-2`}>
        <PanelCard
          fill
          title="Agent activity"
          subtitle="Click an agent bar to filter by agent."
        >
          {data.agentActivity.length === 0 ? (
            <DashboardEmptyState message="No agent performance data for this period." compact />
          ) : (
            <DashboardChart size="sm">
              <BarChart data={data.agentActivity} margin={{ left: -12, right: 4, top: 4, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={chartGridStroke} vertical={false} />
                <XAxis dataKey="agent" tickLine={false} axisLine={false} tick={chartAxisTickStyle} />
                <YAxis tickLine={false} axisLine={false} tick={chartAxisTickStyle} width={28} />
                <Tooltip contentStyle={tooltipStyle} />
                <Legend wrapperStyle={chartLegendStyle} />
                <Bar dataKey="talk" name="Talk (min)" fill={toneClasses.amber.chart} radius={[4, 4, 0, 0]} />
                <Bar
                  dataKey="calls"
                  name="Calls"
                  fill={toneClasses.emerald.chart}
                  radius={[4, 4, 0, 0]}
                  cursor="pointer"
                  onClick={(bar) => {
                    const row = bar as { agent?: string };
                    if (row.agent) toggleFilter("agent", row.agent);
                  }}
                >
                  {data.agentActivity.map((entry) => (
                    <Cell
                      key={entry.agent}
                      fill={toneClasses.emerald.chart}
                      fillOpacity={crossFilterBarOpacity(
                        isFilterActive("agent", entry.agent),
                        agentFilterActive,
                      )}
                    />
                  ))}
                </Bar>
                <Bar dataKey="resolution" name="Resolution %" fill={toneClasses.indigo.chart} radius={[4, 4, 0, 0]} />
              </BarChart>
            </DashboardChart>
          )}
        </PanelCard>

        <PanelCard
          fill
          title="Follow-up accountability"
          subtitle="Recent follow-ups with owner and due window."
          bodyClassName="flex flex-col"
        >
          {data.followUpQueue.length === 0 ? (
            <DashboardEmptyState message="No recent tickets in the follow-up queue." compact />
          ) : (
            <div
              className={`${DASHBOARD_CHART_HEIGHT_SM_CLASS} space-y-1.5 overflow-y-auto pr-0.5`}
            >
              {data.followUpQueue.map((item) => (
                <div
                  key={item.id}
                  className={cn(
                    "grid gap-1 md:grid-cols-[1fr_auto] md:items-center",
                    dashboardListItemClass,
                  )}
                >
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="font-mono text-[11px] font-semibold text-foreground">
                        {item.id}
                      </span>
                      <StatusBadge tone={item.tone}>{item.status}</StatusBadge>
                    </div>
                    <p className="mt-0.5 line-clamp-1 text-[11px] text-muted-foreground">
                      {item.customer} · {item.owner}
                    </p>
                  </div>
                  <span className="text-[11px] font-semibold text-foreground">{item.due}</span>
                </div>
              ))}
            </div>
          )}
        </PanelCard>
      </div>

      <PanelCard
        title="Line and campaign operations"
        subtitle="Click a line row to filter by phone line."
      >
        {data.linePerformance.length === 0 ? (
          <DashboardEmptyState message="No line performance data." compact />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-left">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-800">
                  <th className={dashboardTableHeadClass}>Line / campaign</th>
                  <th className={dashboardTableHeadClass}>Calls</th>
                  <th className={dashboardTableHeadClass}>Response</th>
                  <th className={dashboardTableHeadClass}>Contact</th>
                  <th className={dashboardTableHeadClass}>AHT</th>
                  <th className={dashboardTableHeadClass}>Missed</th>
                </tr>
              </thead>
              <tbody>
                {data.linePerformance.map((line) => (
                  <tr
                    key={line.line}
                    className={cn(
                      "border-b border-slate-50 last:border-b-0 dark:border-slate-800/80",
                      crossFilterRowClass(isFilterActive("line", line.line)),
                    )}
                    onClick={() => toggleFilter("line", line.line)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter" || event.key === " ") {
                        event.preventDefault();
                        toggleFilter("line", line.line);
                      }
                    }}
                    tabIndex={0}
                    role="button"
                  >
                    <td className={dashboardTableCellStrongClass}>{line.line}</td>
                    <td className={`${dashboardTableCellClass} tabular-nums`}>{line.calls}</td>
                    <td className={dashboardTableCellClass}>{line.response}</td>
                    <td className={dashboardTableCellClass}>{line.contact}</td>
                    <td className={dashboardTableCellClass}>{line.aht}</td>
                    <td className={dashboardTableCellClass}>{line.missed}</td>
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
