import { cn } from "@/lib/utils";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  LabelList,
  ComposedChart,
  Legend,
  Line,
  ReferenceLine,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { TooltipProps } from "recharts";

import {
  CHART_ANIMATION_DURATION,
  chartAxisTickStyle,
  chartBarCursor,
  chartGridStroke,
  chartLegendStyle,
  chartLineCursor,
  dashboardListItemClass,
  dashboardRowClass,
  dashboardShellClass,
  dashboardTableCellClass,
  dashboardTableCellStrongClass,
  dashboardTableHeadClass,
  DASHBOARD_CHART_HEIGHT_SM_CLASS,
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

const AGENT_BAR_RADIUS_TOP: [number, number, number, number] = [6, 6, 0, 0];
const AGENT_BAR_RADIUS_FLAT: [number, number, number, number] = [0, 0, 0, 0];
const AGENT_BAR_MAX_SIZE = 22;

const CALLS_RESOLVED_COLOR = toneClasses.emerald.chart;
const CALLS_UNRESOLVED_COLOR = "#cbd5e1";
const TICKETS_RESOLVED_COLOR = toneClasses.indigo.chart;
const TICKETS_UNRESOLVED_COLOR = toneClasses.amber.chart;
const COMBINED_RESOLUTION_COLOR = toneClasses.sky.chart;

type AgentActivityRow = {
  agent: string;
  calls: number;
  callsResolved: number;
  callsUnresolved: number;
  talk: number;
  resolved: number;
  totalTickets: number;
  ticketsUnresolved: number;
  resolution: number;
  callResolution: number;
  combinedResolution: number;
};

function AgentActivityTooltip({
  active,
  payload,
  label,
}: TooltipProps<number, string>) {
  if (!active || !payload?.length) return null;
  const row = payload[0]?.payload as AgentActivityRow | undefined;
  if (!row) return null;

  return (
    <div
      className="rounded-lg border border-slate-200/80 bg-white px-3 py-2 text-xs shadow-sm dark:border-slate-700 dark:bg-slate-900"
      style={tooltipStyle}
    >
      <p className="mb-1 font-semibold text-slate-900 dark:text-slate-100">
        {label}
      </p>
      <p className="text-slate-600 dark:text-slate-300">
        Calls: <span className="font-semibold tabular-nums">{row.calls}</span>
        {row.calls > 0 ? (
          <span className="ml-1 text-slate-500">
            ({row.callsResolved} resolved · {row.callResolution}%)
          </span>
        ) : null}
      </p>
      <p className="text-slate-600 dark:text-slate-300">
        Tickets:{" "}
        <span className="font-semibold tabular-nums">{row.totalTickets}</span>
        {row.totalTickets > 0 ? (
          <span className="ml-1 text-slate-500">
            ({row.resolved} resolved · {row.resolution}%)
          </span>
        ) : null}
      </p>
      <p className="text-slate-600 dark:text-slate-300">Talk: {row.talk} min</p>
      <p className="mt-1 text-[#008f68] dark:text-emerald-300">
        Combined resolution:{" "}
        <span className="font-semibold tabular-nums">
          {row.combinedResolution}%
        </span>
      </p>
    </div>
  );
}

export function OperationsDashboard() {
  const { data } = useSupportDashboardData();
  const { filters, toggleFilter, isFilterActive } = useCrossFilter();
  const agentFilterActive = !!filters.agent;
  const dayFilterActive   = !!filters.day;
  const selectedDay       = filters.day ?? undefined;
  const singleDayCallVolume =
    data.operationsTrend.length === 1 ? data.operationsTrend[0] : null;
  const singleDayCallVolumeRows = singleDayCallVolume
    ? [
        {
          metric: "Inbound",
          value: singleDayCallVolume.inbound,
          color: toneClasses.emerald.chart,
        },
        {
          metric: "Outbound",
          value: singleDayCallVolume.outbound,
          color: toneClasses.sky.chart,
        },
        {
          metric: "Tickets",
          value: singleDayCallVolume.tickets,
          color: toneClasses.indigo.chart,
        },
        {
          metric: "Missed",
          value: singleDayCallVolume.missed,
          color: toneClasses.rose.chart,
        },
      ]
    : [];

  // Custom dot: renders only on the selected day when a day filter is active,
  // fades other days to hint that filtering is in effect.
  const makeDayDot = (color: string) =>
    function DayDot(props: unknown) {
      const { cx, cy, payload } = props as {
        cx: number;
        cy: number;
        payload: { day?: string };
      };
      const day = payload.day ?? "";
      const dotKey = `${day}-${color}-${cx}-${cy}`;
      if (!dayFilterActive) {
        return <circle key={dotKey} cx={cx} cy={cy} r={0} fill="transparent" />;
      }
      return isFilterActive("day", payload.day ?? "") ? (
        <circle
          key={dotKey}
          cx={cx}
          cy={cy}
          r={5}
          fill={color}
          stroke="#fff"
          strokeWidth={1.5}
        />
      ) : (
        <circle
          key={dotKey}
          cx={cx}
          cy={cy}
          r={2.5}
          fill={color}
          fillOpacity={0.22}
        />
      );
    };

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
          ) : singleDayCallVolume ? (
            <DashboardChart>
              <BarChart
                data={singleDayCallVolumeRows}
                margin={{ left: -12, right: 10, top: 20, bottom: 0 }}
                barCategoryGap="28%"
                style={{ cursor: "pointer" }}
                onClick={() => toggleFilter("day", singleDayCallVolume.day)}
              >
                <CartesianGrid strokeDasharray="3 3" stroke={chartGridStroke} vertical={false} />
                <XAxis dataKey="metric" tickLine={false} axisLine={false} tick={chartAxisTickStyle} />
                <YAxis
                  tickLine={false}
                  axisLine={false}
                  tick={chartAxisTickStyle}
                  width={32}
                  allowDecimals={false}
                />
                <Tooltip
                  contentStyle={tooltipStyle}
                  cursor={chartBarCursor}
                  formatter={(value: number, name: string) => [value, name]}
                  labelFormatter={() => singleDayCallVolume.day}
                />
                <Bar
                  dataKey="value"
                  name="Volume"
                  radius={[6, 6, 0, 0]}
                  maxBarSize={72}
                  animationDuration={CHART_ANIMATION_DURATION}
                >
                  <LabelList
                    dataKey="value"
                    position="top"
                    className="fill-slate-700 text-[11px] font-semibold dark:fill-slate-200"
                  />
                  {singleDayCallVolumeRows.map((entry) => (
                    <Cell key={entry.metric} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </DashboardChart>
          ) : (
            <DashboardChart>
              <AreaChart
                data={data.operationsTrend}
                margin={{ left: -12, right: 4, top: 4, bottom: 0 }}
                style={{ cursor: "pointer" }}
              >
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
                <YAxis
                  tickLine={false}
                  axisLine={false}
                  tick={chartAxisTickStyle}
                  width={32}
                  allowDecimals={false}
                />
                <Tooltip contentStyle={tooltipStyle} cursor={chartLineCursor} />
                <Legend wrapperStyle={chartLegendStyle} />

                {/* Vertical marker on the selected day */}
                {selectedDay && (
                  <ReferenceLine
                    x={selectedDay}
                    stroke="rgba(0,143,104,0.45)"
                    strokeWidth={2}
                    strokeDasharray="4 3"
                  />
                )}

                <Area
                  type="monotone"
                  dataKey="inbound"
                  name="Inbound"
                  stroke={toneClasses.emerald.chart}
                  fill="url(#inboundFill)"
                  strokeWidth={2}
                  animationDuration={CHART_ANIMATION_DURATION}
                  dot={makeDayDot(toneClasses.emerald.chart)}
                  activeDot={{
                    r: 5,
                    cursor: "pointer",
                    onClick: (_event, dot) => {
                      const day = (dot as { payload?: { day?: string } }).payload?.day;
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
                  animationDuration={CHART_ANIMATION_DURATION}
                  dot={makeDayDot(toneClasses.sky.chart)}
                  activeDot={{
                    r: 5,
                    cursor: "pointer",
                    onClick: (_event, dot) => {
                      const day = (dot as { payload?: { day?: string } }).payload?.day;
                      if (day) toggleFilter("day", day);
                    },
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="tickets"
                  name="Tickets"
                  stroke={toneClasses.indigo.chart}
                  strokeWidth={2}
                  animationDuration={CHART_ANIMATION_DURATION}
                  dot={makeDayDot(toneClasses.indigo.chart)}
                  activeDot={{
                    r: 5,
                    cursor: "pointer",
                    onClick: (_event, dot) => {
                      const day = (dot as { payload?: { day?: string } }).payload?.day;
                      if (day) toggleFilter("day", day);
                    },
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="missed"
                  name="Missed"
                  stroke={toneClasses.rose.chart}
                  strokeWidth={2}
                  animationDuration={CHART_ANIMATION_DURATION}
                  dot={makeDayDot(toneClasses.rose.chart)}
                  activeDot={{
                    r: 5,
                    cursor: "pointer",
                    onClick: (_event, dot) => {
                      const day = (dot as { payload?: { day?: string } }).payload?.day;
                      if (day) toggleFilter("day", day);
                    },
                  }}
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
          subtitle="Resolved vs pending for calls and tickets per agent. Line shows combined resolution. Click a bar to filter."
        >
          {data.agentActivity.length === 0 ? (
            <DashboardEmptyState message="No agent performance data for this period." compact />
          ) : (
            <DashboardChart size="sm">
              <ComposedChart
                data={data.agentActivity}
                margin={{ left: -12, right: 8, top: 4, bottom: 0 }}
                barCategoryGap="22%"
                barGap={6}
              >
                <CartesianGrid strokeDasharray="3 3" stroke={chartGridStroke} vertical={false} />
                <XAxis dataKey="agent" tickLine={false} axisLine={false} tick={chartAxisTickStyle} />
                <YAxis
                  yAxisId="left"
                  tickLine={false}
                  axisLine={false}
                  tick={chartAxisTickStyle}
                  width={28}
                  allowDecimals={false}
                />
                <YAxis
                  yAxisId="right"
                  orientation="right"
                  domain={[0, 100]}
                  tickLine={false}
                  axisLine={false}
                  unit="%"
                  tick={chartAxisTickStyle}
                  width={36}
                />
                <Tooltip content={<AgentActivityTooltip />} cursor={chartBarCursor} />
                <Legend wrapperStyle={chartLegendStyle} />

                <Bar
                  yAxisId="left"
                  stackId="calls"
                  dataKey="callsResolved"
                  name="Resolved calls"
                  fill={CALLS_RESOLVED_COLOR}
                  radius={AGENT_BAR_RADIUS_FLAT}
                  maxBarSize={AGENT_BAR_MAX_SIZE}
                  cursor="pointer"
                  onClick={(bar) => {
                    const row = bar as { agent?: string };
                    if (row.agent) toggleFilter("agent", row.agent);
                  }}
                >
                  {data.agentActivity.map((entry) => (
                    <Cell
                      key={`callsResolved-${entry.agent}`}
                      fill={CALLS_RESOLVED_COLOR}
                      fillOpacity={crossFilterBarOpacity(
                        isFilterActive("agent", entry.agent),
                        agentFilterActive,
                      )}
                    />
                  ))}
                </Bar>
                <Bar
                  yAxisId="left"
                  stackId="calls"
                  dataKey="callsUnresolved"
                  name="Unresolved calls"
                  fill={CALLS_UNRESOLVED_COLOR}
                  radius={AGENT_BAR_RADIUS_TOP}
                  maxBarSize={AGENT_BAR_MAX_SIZE}
                  cursor="pointer"
                  onClick={(bar) => {
                    const row = bar as { agent?: string };
                    if (row.agent) toggleFilter("agent", row.agent);
                  }}
                >
                  {data.agentActivity.map((entry) => (
                    <Cell
                      key={`callsUnresolved-${entry.agent}`}
                      fill={CALLS_UNRESOLVED_COLOR}
                      fillOpacity={crossFilterBarOpacity(
                        isFilterActive("agent", entry.agent),
                        agentFilterActive,
                      )}
                    />
                  ))}
                </Bar>

                <Bar
                  yAxisId="left"
                  stackId="tickets"
                  dataKey="resolved"
                  name="Resolved tickets"
                  fill={TICKETS_RESOLVED_COLOR}
                  radius={AGENT_BAR_RADIUS_FLAT}
                  maxBarSize={AGENT_BAR_MAX_SIZE}
                  cursor="pointer"
                  onClick={(bar) => {
                    const row = bar as { agent?: string };
                    if (row.agent) toggleFilter("agent", row.agent);
                  }}
                >
                  {data.agentActivity.map((entry) => (
                    <Cell
                      key={`resolved-${entry.agent}`}
                      fill={TICKETS_RESOLVED_COLOR}
                      fillOpacity={crossFilterBarOpacity(
                        isFilterActive("agent", entry.agent),
                        agentFilterActive,
                      )}
                    />
                  ))}
                </Bar>
                <Bar
                  yAxisId="left"
                  stackId="tickets"
                  dataKey="ticketsUnresolved"
                  name="Pending tickets"
                  fill={TICKETS_UNRESOLVED_COLOR}
                  radius={AGENT_BAR_RADIUS_TOP}
                  maxBarSize={AGENT_BAR_MAX_SIZE}
                  cursor="pointer"
                  onClick={(bar) => {
                    const row = bar as { agent?: string };
                    if (row.agent) toggleFilter("agent", row.agent);
                  }}
                >
                  {data.agentActivity.map((entry) => (
                    <Cell
                      key={`ticketsUnresolved-${entry.agent}`}
                      fill={TICKETS_UNRESOLVED_COLOR}
                      fillOpacity={crossFilterBarOpacity(
                        isFilterActive("agent", entry.agent),
                        agentFilterActive,
                      )}
                    />
                  ))}
                </Bar>

                <Line
                  yAxisId="right"
                  type="monotone"
                  dataKey="combinedResolution"
                  name="Combined resolution %"
                  stroke={COMBINED_RESOLUTION_COLOR}
                  strokeWidth={2}
                  dot={{ r: 4, cursor: "pointer" }}
                  activeDot={{
                    r: 6,
                    cursor: "pointer",
                    onClick: (_event, dot) => {
                      const agent = (dot as { payload?: { agent?: string } })
                        .payload?.agent;
                      if (agent) toggleFilter("agent", agent);
                    },
                  }}
                />
              </ComposedChart>
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
