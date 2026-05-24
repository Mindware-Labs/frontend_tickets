"use client";

import { useMemo } from "react";
import type { LucideIcon } from "lucide-react";
import { UserPlus, Users } from "lucide-react";
import { Bar, BarChart, Cell, Tooltip, XAxis, YAxis } from "recharts";

import { DashboardChart } from "@/app/(dashboard)/dashboard/components/dashboard-chart";
import { PanelCard } from "@/app/(dashboard)/dashboard/components/panel-card";
import {
  DASHBOARD_CHART_HEIGHT_SM_CLASS,
  dashboardListItemClass,
  dashboardPairedRowClass,
  dashboardRowClass,
  toneClasses,
  tooltipStyle,
} from "@/app/(dashboard)/dashboard/dashboard-theme";
import { cn } from "@/lib/utils";
import type { YardDashboardFilterKey } from "./yard-dashboard-filters";
import {
  crossFilterBarOpacity,
  crossFilterRowClass,
  useYardDashboardData,
} from "./yard-cross-filter";

type AgentRow = {
  agentId: number;
  agentName: string;
  count: number;
};

type CustomerRow = {
  customerId: number | null;
  customerName: string;
  count: number;
  phone?: string | null;
};

type RankedItem = {
  id: string;
  label: string;
  shortLabel: string;
  count: number;
  hint?: string | null;
  filterValue?: string;
};

type YardRankedPanelProps = {
  title: string;
  subtitle: string;
  icon: LucideIcon;
  items: RankedItem[];
  countLabel?: string;
  filterKey?: YardDashboardFilterKey;
  barColor?: string;
};

function shortenLabel(value: string, max = 16) {
  const trimmed = value.trim();
  if (trimmed.length <= max) return trimmed;
  return `${trimmed.slice(0, max - 1)}…`;
}

/** Recharts wraps Y-axis labels on spaces; phones must stay on one line. */
function formatChartAxisLabel(value: string, max = 18) {
  const trimmed = value.trim();
  const isPhoneLike = /^\+?[\d\s().-]+$/.test(trimmed);
  const singleLine = isPhoneLike
    ? trimmed.replace(/\s+/g, "\u00a0")
    : trimmed;
  if (singleLine.length <= max) return singleLine;
  return `${singleLine.slice(0, max - 1)}…`;
}

/** Recharts calls `tick` as a render fn, not a React component — keep lowercase. */
function renderRankedChartYAxisTick({
  x = 0,
  y = 0,
  payload,
}: {
  x?: number;
  y?: number;
  payload?: { value?: string };
}) {
  return (
    <text
      x={x}
      y={y}
      dy={3}
      textAnchor="end"
      fill="#94a3b8"
      fontSize={10}
    >
      {payload?.value}
    </text>
  );
}

function YardRankedPanel({
  title,
  subtitle,
  icon,
  items,
  countLabel = "items",
  filterKey,
  barColor = toneClasses.emerald.chart,
}: YardRankedPanelProps) {
  const { toggleFilter, isFilterActive, hasActiveFilters } =
    useYardDashboardData();

  const ranked = useMemo(
    () => [...items].sort((a, b) => b.count - a.count).slice(0, 8),
    [items],
  );

  const total = useMemo(
    () => ranked.reduce((sum, item) => sum + item.count, 0),
    [ranked],
  );

  const chartData = useMemo(
    () =>
      ranked.map((item) => ({
        id: item.id,
        label: item.shortLabel,
        fullLabel: item.label,
        count: item.count,
        pct: total > 0 ? Math.round((item.count / total) * 100) : 0,
        filterValue: item.filterValue,
      })),
    [ranked, total],
  );

  const filterActive = Boolean(filterKey && hasActiveFilters);

  if (ranked.length === 0) {
    return (
      <PanelCard fill title={title} subtitle={subtitle} icon={icon} bodyClassName="min-h-0">
        <p className="py-6 text-center text-xs text-slate-500 dark:text-slate-400">
          No data in this period
        </p>
      </PanelCard>
    );
  }

  const handleFilter = (value?: string) => {
    if (!filterKey || !value) return;
    toggleFilter(filterKey, value);
  };

  return (
    <PanelCard fill title={title} subtitle={subtitle} icon={icon} bodyClassName="min-h-0">
      <div className={cn(dashboardPairedRowClass, "!gap-2")}>
        <div className={cn("min-h-0 shrink-0", DASHBOARD_CHART_HEIGHT_SM_CLASS)}>
          <DashboardChart size="sm">
            <BarChart
              data={chartData}
              layout="vertical"
              margin={{ left: 4, right: 8, top: 4, bottom: 4 }}
            >
              <XAxis type="number" hide />
              <YAxis
                type="category"
                dataKey="label"
                tickLine={false}
                axisLine={false}
                width={92}
                tick={renderRankedChartYAxisTick}
              />
              <Tooltip
                contentStyle={tooltipStyle}
                formatter={(value, _name, item) => {
                  const row = item?.payload as
                    | { fullLabel?: string; pct?: number }
                    | undefined;
                  return [
                    `${value ?? 0} ${countLabel} (${row?.pct ?? 0}%)`,
                    row?.fullLabel ?? title,
                  ];
                }}
              />
              <Bar
                dataKey="count"
                radius={[0, 4, 4, 0]}
                maxBarSize={16}
                fill={barColor}
                cursor={filterKey ? "pointer" : "default"}
                onClick={(bar) => {
                  const row = bar as { filterValue?: string };
                  handleFilter(row.filterValue);
                }}
              >
                {chartData.map((entry) => (
                  <Cell
                    key={entry.id}
                    fill={barColor}
                    fillOpacity={
                      filterKey
                        ? crossFilterBarOpacity(
                            isFilterActive(
                              filterKey,
                              entry.filterValue ?? entry.fullLabel,
                            ),
                            filterActive,
                          )
                        : 1
                    }
                  />
                ))}
              </Bar>
            </BarChart>
          </DashboardChart>
        </div>

        <div className="grid min-h-0 content-start gap-1 overflow-y-auto [scrollbar-width:thin]">
          {chartData.map((row, index) => {
            const active = filterKey
              ? isFilterActive(filterKey, row.filterValue ?? row.fullLabel)
              : false;
            const RowTag = filterKey ? "button" : "div";

            return (
              <RowTag
                key={row.id}
                type={filterKey ? "button" : undefined}
                onClick={filterKey ? () => handleFilter(row.filterValue) : undefined}
                className={cn(
                  "flex w-full items-center justify-between gap-2 !px-2.5 !py-1.5 text-left",
                  dashboardListItemClass,
                  filterKey && crossFilterRowClass(active),
                )}
              >
                <span className="flex min-w-0 items-center gap-1.5 text-[11px] text-slate-700 dark:text-slate-200">
                  <span className="flex size-4 shrink-0 items-center justify-center rounded-full bg-slate-100 text-[9px] font-bold text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                    {index + 1}
                  </span>
                  <span className="min-w-0 truncate" title={row.fullLabel}>
                    {row.fullLabel}
                  </span>
                </span>
                <span className="shrink-0 text-[11px] font-semibold tabular-nums text-slate-800 dark:text-slate-100">
                  {row.count}
                  <span className="ml-0.5 font-normal text-slate-400">
                    ({row.pct}%)
                  </span>
                </span>
              </RowTag>
            );
          })}
        </div>
      </div>
    </PanelCard>
  );
}

type YardAgentsPanelProps = {
  agents: AgentRow[];
  customers: CustomerRow[];
};

export function YardAgentsPanel({ agents, customers }: YardAgentsPanelProps) {
  const agentItems = useMemo<RankedItem[]>(
    () =>
      agents.map((agent) => ({
        id: String(agent.agentId),
        label: agent.agentName,
        shortLabel: formatChartAxisLabel(agent.agentName, 16),
        count: agent.count,
        filterValue: agent.agentName,
      })),
    [agents],
  );

  const customerItems = useMemo<RankedItem[]>(
    () =>
      customers.map((customer) => {
        const name =
          customer.customerName?.trim() ||
          (customer.customerId
            ? `Customer #${customer.customerId}`
            : "Unknown customer");
        const phone = customer.phone?.trim() || null;
        const chartPrimary = phone || name;
        return {
          id: String(customer.customerId ?? name),
          label: phone && phone !== name ? `${name} · ${phone}` : name,
          shortLabel: formatChartAxisLabel(chartPrimary),
          count: customer.count,
          hint: phone,
          filterValue: name,
        };
      }),
    [customers],
  );

  if (agentItems.length === 0 && customerItems.length === 0) {
    return null;
  }

  return (
    <div className={cn(dashboardRowClass, "xl:grid-cols-2 xl:[&>*]:min-h-[246px]")}>
      <YardRankedPanel
        title="Top customers"
        subtitle="Click a row or bar to filter by customer"
        icon={UserPlus}
        items={customerItems}
        countLabel="leads"
        filterKey="customer"
        barColor={toneClasses.sky.chart}
      />
      <YardRankedPanel
        title="Top agents"
        subtitle="Click a row or bar to filter by agent"
        icon={Users}
        items={agentItems}
        countLabel="calls"
        filterKey="agent"
        barColor={toneClasses.emerald.chart}
      />
    </div>
  );
}
