"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import type { ExecutiveCallIntentMix } from "../dashboard-types";
import {
  chartAxisTickStyle,
  chartGridStroke,
  toneClasses,
  tooltipStyle,
} from "../dashboard-theme";
import {
  crossFilterBarOpacity,
  crossFilterRowClass,
  useCrossFilter,
} from "./chart-cross-filter";
import { DashboardChart } from "./dashboard-chart";
import { DashboardEmptyState } from "./dashboard-empty-state";

export function ExecutiveCallIntentTopDriver({
  topReason,
}: {
  topReason: string | null;
}) {
  if (!topReason) return null;

  return (
    <div className="rounded-lg border border-[#008f68]/20 bg-[#f0faf5] px-3 py-1 text-right dark:border-emerald-500/25 dark:bg-emerald-500/10">
      <p className="text-[9px] font-semibold uppercase tracking-wide text-[#008f68] dark:text-emerald-400">
        Top driver
      </p>
      <p className="max-w-[200px] truncate text-[11px] font-semibold text-slate-800 dark:text-slate-100 sm:max-w-[280px]">
        {topReason}
      </p>
    </div>
  );
}

const INTENT_BAR_COLORS = [
  toneClasses.emerald.chart,
  toneClasses.sky.chart,
  toneClasses.amber.chart,
  toneClasses.indigo.chart,
  toneClasses.rose.chart,
  "#0d9488",
  "#6366f1",
  "#a855f7",
] as const;

export function ExecutiveCallIntentPanel({
  mix,
}: {
  mix: ExecutiveCallIntentMix;
}) {
  const { filters, toggleFilter, isFilterActive } = useCrossFilter();
  const reasonFilterActive = !!filters.callReason;
  const chartData = mix.rows.map((row) => ({
    ...row,
    label: row.reason,
  }));

  return (
    <div className="space-y-3">
      <p className="text-[10px] text-slate-500 dark:text-slate-400">
        Period · {mix.periodLabel}
      </p>

      {mix.rows.length === 0 ? (
        <DashboardEmptyState
          message="No campaign options were recorded on calls in this period."
          compact
        />
      ) : (
        <>
          <p className="text-[11px] text-slate-600 dark:text-slate-300">
            <span className="font-semibold tabular-nums text-slate-800 dark:text-slate-100">
              {mix.totalClassified}
            </span>{" "}
            calls tagged with a reason (payment status, registration, move-out, etc.).
            This is call-level intent, not marketing campaign ROI or ticket backlog.
          </p>

          <DashboardChart size="sm">
            <BarChart
              data={chartData}
              layout="vertical"
              margin={{ left: 4, right: 12, top: 4, bottom: 0 }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                stroke={chartGridStroke}
                horizontal={false}
              />
              <XAxis
                type="number"
                tickLine={false}
                axisLine={false}
                tick={chartAxisTickStyle}
                allowDecimals={false}
              />
              <YAxis
                type="category"
                dataKey="label"
                tickLine={false}
                axisLine={false}
                tick={chartAxisTickStyle}
                width={108}
              />
              <Tooltip
                contentStyle={tooltipStyle}
                formatter={(value: number, _name, item) => {
                  const payload = item?.payload as { share?: number } | undefined;
                  return [
                    `${value} calls (${payload?.share ?? 0}% of tagged)`,
                    "Volume",
                  ];
                }}
              />
              <Bar
                dataKey="calls"
                name="Calls"
                radius={[0, 6, 6, 0]}
                maxBarSize={22}
                cursor="pointer"
                onClick={(bar) => {
                  const row = bar as { reason?: string };
                  if (row.reason) toggleFilter("callReason", row.reason);
                }}
              >
                {chartData.map((entry, index) => (
                  <Cell
                    key={entry.reason}
                    fill={INTENT_BAR_COLORS[index % INTENT_BAR_COLORS.length]}
                    fillOpacity={crossFilterBarOpacity(
                      isFilterActive("callReason", entry.reason),
                      reasonFilterActive,
                    )}
                  />
                ))}
              </Bar>
            </BarChart>
          </DashboardChart>

          <ul className="grid gap-1 sm:grid-cols-2 lg:grid-cols-4">
            {mix.rows.slice(0, 4).map((row, index) => (
              <li
                key={row.reason}
                className={`${crossFilterRowClass(
                  isFilterActive("callReason", row.reason),
                )} flex items-center gap-2 rounded-lg border border-slate-100 bg-slate-50/80 px-2.5 py-1.5 dark:border-slate-800 dark:bg-slate-900/50`}
                onClick={() => toggleFilter("callReason", row.reason)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    toggleFilter("callReason", row.reason);
                  }
                }}
                tabIndex={0}
                role="button"
              >
                <span
                  className="size-2 shrink-0 rounded-sm"
                  style={{
                    backgroundColor:
                      INTENT_BAR_COLORS[index % INTENT_BAR_COLORS.length],
                  }}
                />
                <div className="min-w-0">
                  <p className="truncate text-[11px] font-medium text-slate-800 dark:text-slate-100">
                    {row.reason}
                  </p>
                  <p className="text-[10px] tabular-nums text-slate-500">
                    {row.share}% · {row.calls} calls
                  </p>
                </div>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}
