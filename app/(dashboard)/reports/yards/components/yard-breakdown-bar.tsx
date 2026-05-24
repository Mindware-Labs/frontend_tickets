"use client";

import { useMemo } from "react";
import type { LucideIcon } from "lucide-react";
import { Bar, BarChart, Cell, Tooltip, XAxis, YAxis } from "recharts";

import { DashboardChart } from "@/app/(dashboard)/dashboard/components/dashboard-chart";
import { DashboardEmptyState } from "@/app/(dashboard)/dashboard/components/dashboard-empty-state";
import { PanelCard } from "@/app/(dashboard)/dashboard/components/panel-card";
import { chartAxisTickStyle, tooltipStyle } from "@/app/(dashboard)/dashboard/dashboard-theme";
import { DISPOSITION_COLORS } from "./chart-colors";
import { formatMetricLabel } from "./yard-report-ui";

type BreakdownItem = {
  key: string;
  count: number;
};

type YardBreakdownBarProps = {
  title: string;
  subtitle: string;
  data: BreakdownItem[];
  colorMap?: Record<string, string>;
  icon?: LucideIcon;
  barColor?: string;
};

function resolveColor(
  key: string,
  index: number,
  colorMap: Record<string, string>,
  fallback?: string,
): string {
  const upper = key.toUpperCase();
  return (
    colorMap[upper] ||
    colorMap[key] ||
    fallback ||
    DISPOSITION_COLORS[index % DISPOSITION_COLORS.length]
  );
}

export function YardBreakdownBar({
  title,
  subtitle,
  data,
  colorMap = {},
  icon,
  barColor,
}: YardBreakdownBarProps) {
  const segments = useMemo(() => {
    const filtered = data.filter((item) => item.count > 0);
    const total = filtered.reduce((sum, item) => sum + item.count, 0);
    return filtered
      .map((item, index) => ({
        key: item.key,
        name: formatMetricLabel(item.key),
        value: item.count,
        fill: resolveColor(item.key, index, colorMap, barColor),
        pct: total > 0 ? Math.round((item.count / total) * 100) : 0,
      }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 8);
  }, [data, colorMap, barColor]);

  const chartHeight = Math.max(120, segments.length * 28 + 16);

  return (
    <PanelCard
      fill
      title={title}
      subtitle={subtitle}
      icon={icon}
      bodyClassName="!py-2"
    >
      {segments.length === 0 ? (
        <DashboardEmptyState message="No data recorded" compact />
      ) : (
        <div className="w-full min-h-0" style={{ height: chartHeight }}>
          <DashboardChart size="sm" fill className="!h-full min-h-0">
            <BarChart
              data={segments}
              layout="vertical"
              margin={{ left: 4, right: 12, top: 0, bottom: 0 }}
            >
              <XAxis type="number" hide />
              <YAxis
                type="category"
                dataKey="name"
                tickLine={false}
                axisLine={false}
                width={88}
                tick={chartAxisTickStyle}
              />
              <Tooltip
                contentStyle={tooltipStyle}
                formatter={(value, _name, item) => {
                  const row = item?.payload as { pct?: number } | undefined;
                  return [`${value ?? 0} (${row?.pct ?? 0}%)`, "Count"];
                }}
              />
              <Bar dataKey="value" radius={[0, 4, 4, 0]} maxBarSize={18}>
                {segments.map((entry) => (
                  <Cell key={entry.key} fill={entry.fill} />
                ))}
              </Bar>
            </BarChart>
          </DashboardChart>
        </div>
      )}
    </PanelCard>
  );
}
