"use client";

import { Bar, BarChart, CartesianGrid, Line, LineChart, XAxis, YAxis } from "recharts";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import {
  dashboardChartSurfaceClass,
  dashboardPanelBodyClass,
  dashboardPanelClass,
  dashboardPanelHeaderClass,
} from "@/app/(dashboard)/dashboard/dashboard-theme";
import { cn } from "@/lib/utils";
import type { AgentDashboardData } from "./agent-dashboard-types";

const chartConfig = {
  calls: { label: "Calls", color: "#008f68" },
  tickets: { label: "Tickets", color: "#0284c7" },
} satisfies ChartConfig;

type AgentActivityChartsProps = {
  data: AgentDashboardData;
};

export function AgentActivityCharts({ data }: AgentActivityChartsProps) {
  const campaignData = data.charts.ticketsByCampaign.slice(0, 6).map((item) => ({
    name: item.name.length > 16 ? `${item.name.slice(0, 16)}...` : item.name,
    tickets: item.count,
  }));

  return (
    <div className="grid gap-2 xl:grid-cols-[1.15fr_0.85fr]">
      <section className={dashboardPanelClass}>
        <div className={dashboardPanelHeaderClass}>
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-400">
              Last 7 days
            </p>
            <h2 className="text-[14px] font-bold text-slate-900 dark:text-slate-100">
              Call activity
            </h2>
          </div>
          <span className="rounded-full border border-[#008f68]/20 bg-[#f0faf5] px-2 py-0.5 text-[10px] font-bold uppercase text-[#006b4f]">
            {data.kpis.callsLast7Days} calls
          </span>
        </div>
        <div className={dashboardPanelBodyClass}>
          <div className={cn(dashboardChartSurfaceClass, "h-[210px]")}>
            <ChartContainer config={chartConfig} className="h-full w-full">
              <LineChart data={data.charts.callsByDay} margin={{ left: -18, right: 8, top: 12, bottom: 0 }}>
                <CartesianGrid vertical={false} stroke="#e2e8f0" strokeDasharray="3 3" />
                <XAxis dataKey="day" tickLine={false} axisLine={false} tickMargin={8} fontSize={10} />
                <YAxis allowDecimals={false} tickLine={false} axisLine={false} fontSize={10} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Line
                  type="monotone"
                  dataKey="calls"
                  stroke="var(--color-calls)"
                  strokeWidth={2.5}
                  dot={{ r: 3, fill: "var(--color-calls)" }}
                  activeDot={{ r: 5 }}
                />
              </LineChart>
            </ChartContainer>
          </div>
        </div>
      </section>

      <section className={dashboardPanelClass}>
        <div className={dashboardPanelHeaderClass}>
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-400">
              Tickets
            </p>
            <h2 className="text-[14px] font-bold text-slate-900 dark:text-slate-100">
              Top campaigns
            </h2>
          </div>
        </div>
        <div className={dashboardPanelBodyClass}>
          <div className={cn(dashboardChartSurfaceClass, "h-[210px]")}>
            <ChartContainer config={chartConfig} className="h-full w-full">
              <BarChart data={campaignData} layout="vertical" margin={{ left: 12, right: 8, top: 8, bottom: 0 }}>
                <CartesianGrid horizontal={false} stroke="#e2e8f0" strokeDasharray="3 3" />
                <YAxis
                  dataKey="name"
                  type="category"
                  tickLine={false}
                  axisLine={false}
                  width={96}
                  fontSize={10}
                />
                <XAxis type="number" hide />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar dataKey="tickets" fill="var(--color-tickets)" radius={[0, 5, 5, 0]} barSize={16} />
              </BarChart>
            </ChartContainer>
          </div>
        </div>
      </section>
    </div>
  );
}
