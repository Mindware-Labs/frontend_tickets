"use client";

import { useMemo } from "react";
import { Users } from "lucide-react";
import { Bar, BarChart, Cell, Tooltip, XAxis, YAxis } from "recharts";

import { DashboardChart } from "@/app/(dashboard)/dashboard/components/dashboard-chart";
import { PanelCard } from "@/app/(dashboard)/dashboard/components/panel-card";
import {
  DASHBOARD_CHART_HEIGHT_SM_CLASS,
  chartAxisTickStyle,
  dashboardListItemClass,
  dashboardPairedRowClass,
  toneClasses,
  tooltipStyle,
} from "@/app/(dashboard)/dashboard/dashboard-theme";
import { cn } from "@/lib/utils";

type AgentRow = {
  agentId: number;
  agentName: string;
  count: number;
};

type YardAgentsPanelProps = {
  agents: AgentRow[];
};

function shortenLabel(value: string, max = 16) {
  const trimmed = value.trim();
  if (trimmed.length <= max) return trimmed;
  return `${trimmed.slice(0, max - 1)}…`;
}

export function YardAgentsPanel({ agents }: YardAgentsPanelProps) {
  const ranked = useMemo(
    () => [...agents].sort((a, b) => b.count - a.count).slice(0, 8),
    [agents],
  );

  const totalCalls = useMemo(
    () => ranked.reduce((sum, agent) => sum + agent.count, 0),
    [ranked],
  );

  const chartData = useMemo(
    () =>
      ranked.map((agent) => ({
        agentId: agent.agentId,
        agent: shortenLabel(agent.agentName),
        fullName: agent.agentName,
        calls: agent.count,
        pct:
          totalCalls > 0 ? Math.round((agent.count / totalCalls) * 100) : 0,
      })),
    [ranked, totalCalls],
  );

  if (ranked.length === 0) {
    return null;
  }

  return (
    <PanelCard
      fill
      title="Top agents"
      subtitle="Call volume share in period"
      icon={Users}
      bodyClassName="min-h-0"
    >
      <div className={cn(dashboardPairedRowClass, "!gap-2")}>
        <div className={cn("min-h-0", DASHBOARD_CHART_HEIGHT_SM_CLASS)}>
          <DashboardChart size="sm" fill>
            <BarChart
              data={chartData}
              layout="vertical"
              margin={{ left: 4, right: 8, top: 0, bottom: 0 }}
            >
              <XAxis type="number" hide />
              <YAxis
                type="category"
                dataKey="agent"
                tickLine={false}
                axisLine={false}
                width={76}
                tick={chartAxisTickStyle}
              />
              <Tooltip
                contentStyle={tooltipStyle}
                formatter={(value, _name, item) => {
                  const row = item?.payload as
                    | { fullName?: string; pct?: number }
                    | undefined;
                  return [
                    `${value ?? 0} calls (${row?.pct ?? 0}%)`,
                    row?.fullName ?? "Agent",
                  ];
                }}
              />
              <Bar
                dataKey="calls"
                radius={[0, 4, 4, 0]}
                maxBarSize={16}
                fill={toneClasses.emerald.chart}
              >
                {chartData.map((entry) => (
                  <Cell key={entry.agentId} fill={toneClasses.emerald.chart} />
                ))}
              </Bar>
            </BarChart>
          </DashboardChart>
        </div>

        <div className="grid min-h-0 content-start gap-1 overflow-y-auto sm:grid-cols-2 [scrollbar-width:thin]">
          {chartData.map((agent, index) => (
            <div
              key={agent.agentId}
              className={cn(
                "flex items-center justify-between gap-2 !px-2.5 !py-1.5",
                dashboardListItemClass,
              )}
            >
              <span className="flex min-w-0 items-center gap-1.5 text-[11px] text-slate-700 dark:text-slate-200">
                <span className="flex size-4 shrink-0 items-center justify-center rounded-full bg-slate-100 text-[9px] font-bold text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                  {index + 1}
                </span>
                <span className="truncate" title={agent.fullName}>
                  {agent.fullName}
                </span>
              </span>
              <span className="shrink-0 text-[11px] font-semibold tabular-nums text-slate-800 dark:text-slate-100">
                {agent.calls}
                <span className="ml-0.5 font-normal text-slate-400">
                  ({agent.pct}%)
                </span>
              </span>
            </div>
          ))}
        </div>
      </div>
    </PanelCard>
  );
}
