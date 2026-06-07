"use client";

import type { LucideIcon } from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { DashboardChart } from "@/app/(dashboard)/dashboard/components/dashboard-chart";
import { DashboardEmptyState } from "@/app/(dashboard)/dashboard/components/dashboard-empty-state";
import { PanelCard } from "@/app/(dashboard)/dashboard/components/panel-card";
import {
  CHART_ANIMATION_DURATION,
  chartAxisTickStyle,
  chartBarCursor,
  chartGridStroke,
  chartLegendStyle,
  tooltipStyle,
} from "@/app/(dashboard)/dashboard/dashboard-theme";
import { crossFilterBarOpacity, useYardDashboardData } from "./yard-cross-filter";
import type { YardStatsDay } from "./types";

type YardActivityChartProps = {
  title: string;
  subtitle: string;
  icon: LucideIcon;
  data: YardStatsDay[];
  primaryKey: "created" | "open";
  primaryLabel: string;
  primaryColor: string;
  closedColor: string;
};

export function YardActivityChart({
  title,
  subtitle,
  icon,
  data,
  primaryKey,
  primaryLabel,
  primaryColor,
  closedColor,
}: YardActivityChartProps) {
  const { toggleFilter, isFilterActive, hasActiveFilters } =
    useYardDashboardData();
  const dayFilterActive = hasActiveFilters;

  return (
    <PanelCard
      fill
      title={title}
      subtitle={`${subtitle} · Click a day to filter`}
      icon={icon}
    >
      {data.length === 0 ? (
        <DashboardEmptyState message="No activity in period." compact />
      ) : (
        <DashboardChart size="sm">
          <BarChart
            data={data}
            margin={{ left: -12, right: 4, top: 4, bottom: 0 }}
          >
            <CartesianGrid
              strokeDasharray="3 3"
              stroke={chartGridStroke}
              vertical={false}
            />
            <XAxis
              dataKey="day"
              tickLine={false}
              axisLine={false}
              tick={chartAxisTickStyle}
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              tick={chartAxisTickStyle}
              width={28}
              allowDecimals={false}
            />
            <Tooltip contentStyle={tooltipStyle} cursor={chartBarCursor} />
            <Legend wrapperStyle={chartLegendStyle} />
            <Bar
              dataKey={primaryKey}
              name={primaryLabel}
              fill={primaryColor}
              radius={[3, 3, 0, 0]}
              maxBarSize={28}
              animationDuration={CHART_ANIMATION_DURATION}
              cursor="pointer"
              onClick={(bar) => {
                const row = bar as YardStatsDay;
                if (row.date) toggleFilter("day", row.date);
              }}
            >
              {data.map((entry) => (
                <Cell
                  key={`${entry.date}-primary`}
                  fillOpacity={crossFilterBarOpacity(
                    isFilterActive("day", entry.date),
                    dayFilterActive,
                  )}
                />
              ))}
            </Bar>
            <Bar
              dataKey="closed"
              name="Closed"
              fill={closedColor}
              radius={[3, 3, 0, 0]}
              maxBarSize={28}
              animationDuration={CHART_ANIMATION_DURATION}
              cursor="pointer"
              onClick={(bar) => {
                const row = bar as YardStatsDay;
                if (row.date) toggleFilter("day", row.date);
              }}
            >
              {data.map((entry) => (
                <Cell
                  key={`${entry.date}-closed`}
                  fillOpacity={crossFilterBarOpacity(
                    isFilterActive("day", entry.date),
                    dayFilterActive,
                  )}
                />
              ))}
            </Bar>
          </BarChart>
        </DashboardChart>
      )}
    </PanelCard>
  );
}
