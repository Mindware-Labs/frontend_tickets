"use client";

import type { LucideIcon } from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { DashboardChart } from "@/app/(dashboard)/dashboard/components/dashboard-chart";
import { DashboardEmptyState } from "@/app/(dashboard)/dashboard/components/dashboard-empty-state";
import { PanelCard } from "@/app/(dashboard)/dashboard/components/panel-card";
import {
  chartAxisTickStyle,
  chartGridStroke,
  chartLegendStyle,
  tooltipStyle,
} from "@/app/(dashboard)/dashboard/dashboard-theme";
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
  return (
    <PanelCard fill title={title} subtitle={subtitle} icon={icon}>
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
            <Tooltip contentStyle={tooltipStyle} />
            <Legend wrapperStyle={chartLegendStyle} />
            <Bar
              dataKey={primaryKey}
              name={primaryLabel}
              fill={primaryColor}
              radius={[3, 3, 0, 0]}
              maxBarSize={28}
            />
            <Bar
              dataKey="closed"
              name="Closed"
              fill={closedColor}
              radius={[3, 3, 0, 0]}
              maxBarSize={28}
            />
          </BarChart>
        </DashboardChart>
      )}
    </PanelCard>
  );
}
