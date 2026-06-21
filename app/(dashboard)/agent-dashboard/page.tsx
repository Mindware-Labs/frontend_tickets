"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  CheckCircle2,
  Target,
  Timer,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { auth } from "@/lib/auth";
import {
  dashboardPanelClass,
  dashboardSectionLabelClass,
  dashboardShellClass,
} from "@/app/(dashboard)/dashboard/dashboard-theme";
import { cn } from "@/lib/utils";
import { AgentActionPanel } from "./components/agent-action-panel";
import { AgentActivityCharts } from "./components/agent-activity-charts";
import { AgentPerformancePanel } from "./components/agent-performance-panel";
import { AgentWorkLists } from "./components/agent-work-lists";
import type { AgentDashboardData, AgentKpis } from "./components/agent-dashboard-types";
import { formatDuration, formatTime } from "./components/agent-dashboard-utils";

const EMPTY_KPIS: AgentKpis = {
  totalCalls: 0,
  resolvedCalls: 0,
  missedCalls: 0,
  avgDurationSec: 0,
  totalTickets: 0,
  resolvedTickets: 0,
  pendingFollowupTickets: 0,
  overdueTickets: 0,
  resolutionRate: 0,
  totalManualRecords: 0,
  resolvedManualRecords: 0,
  completionRate: 0,
};

type ApiEnvelope<T> = {
  success: boolean;
  data?: T;
  message?: string;
};

export default function AgentDashboardPage() {
  const [data, setData] = useState<AgentDashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const currentUser = auth.getUser?.();

  const loadDashboard = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/dashboard/agent-stats", {
        cache: "no-store",
        credentials: "include",
      });
      const payload: ApiEnvelope<AgentDashboardData> = await response.json();
      if (!response.ok || !payload.success || !payload.data) {
        throw new Error(payload.message || `Request failed (${response.status})`);
      }
      setData(payload.data);
    } catch (err) {
      setData(null);
      setError(err instanceof Error ? err.message : "Unable to load agent dashboard.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadDashboard();
  }, [loadDashboard]);

  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 18) return "Good afternoon";
    return "Good evening";
  }, []);

  if (isLoading) {
    return <AgentDashboardSkeleton />;
  }

  if (!data) {
    return (
      <div className={cn(dashboardPanelClass, "mx-auto max-w-xl px-5 py-8 text-center")}>
        <span className="mx-auto inline-flex size-11 items-center justify-center rounded-xl bg-rose-50 text-rose-700 ring-1 ring-rose-200 dark:bg-rose-500/10 dark:text-rose-300 dark:ring-rose-500/20">
          <AlertCircle className="size-5" aria-hidden />
        </span>
        <h1 className="mt-3 text-lg font-bold text-slate-900 dark:text-neutral-100">
          Agent dashboard unavailable
        </h1>
        <p className="mx-auto mt-2 max-w-sm text-sm text-slate-500">
          {error || "No activity could be loaded for this agent."}
        </p>
        <Button
          type="button"
          onClick={() => void loadDashboard()}
          className="mt-4 h-9 bg-[#008f68] text-xs hover:bg-[#007a5a]"
        >
          Try again
        </Button>
      </div>
    );
  }

  const kpis = data.agentKpis || EMPTY_KPIS;
  const needsAttention =
    data.summary?.needsAttention ??
    kpis.pendingFollowupTickets + kpis.overdueTickets + data.kpis.pendingActions;

  return (
    <div className={dashboardShellClass}>
      <section className={cn(dashboardPanelClass, "relative px-3.5 py-3")}>
        <span
          aria-hidden
          className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#008f68]/45 to-transparent"
        />
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex min-w-0 items-center gap-2.5">
            <span className="h-8 w-0.5 shrink-0 rounded-full bg-[#008f68]" />
            <span className="inline-flex size-10 shrink-0 items-center justify-center rounded-xl bg-[#f0faf5] text-[#008f68] ring-1 ring-[#008f68]/15">
              <Target className="size-5" aria-hidden strokeWidth={2.25} />
            </span>
            <div className="min-w-0">
              <p className={dashboardSectionLabelClass}>Agent workspace</p>
              <h1 className="truncate text-[18px] font-bold tracking-tight text-slate-900 dark:text-neutral-100">
                {greeting}, {currentUser?.name || "Agent"}
              </h1>
              <p className="mt-0.5 text-[12px] font-medium text-slate-500">
                {needsAttention > 0
                  ? `${needsAttention} item${needsAttention === 1 ? "" : "s"} need follow-up today`
                  : "All urgent work is clear"}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-1.5">
            <span className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-[11px] font-semibold text-slate-500 shadow-sm dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-400">
              Updated {formatTime(data.generatedAt)}
            </span>
          </div>
        </div>
      </section>

      <AgentActionPanel data={data} />
      <AgentPerformancePanel data={data} />

      <div className="grid gap-2 lg:grid-cols-3">
        <section className={cn(dashboardPanelClass, "px-3 py-2.5")}>
          <p className={dashboardSectionLabelClass}>Completion</p>
          <div className="mt-2 flex items-center justify-between gap-3">
            <div>
              <p className="text-2xl font-bold text-slate-900 dark:text-neutral-100 tabular-nums">
                {kpis.completionRate}%
              </p>
              <p className="text-[11px] font-medium text-slate-500">Manual record close rate</p>
            </div>
            <CheckCircle2 className="size-9 text-[#008f68]" aria-hidden />
          </div>
        </section>
        <section className={cn(dashboardPanelClass, "px-3 py-2.5")}>
          <p className={dashboardSectionLabelClass}>Resolution</p>
          <div className="mt-2 flex items-center justify-between gap-3">
            <div>
              <p className="text-2xl font-bold text-slate-900 dark:text-neutral-100 tabular-nums">
                {kpis.resolutionRate}%
              </p>
              <p className="text-[11px] font-medium text-slate-500">Ticket resolution rate</p>
            </div>
            <Target className="size-9 text-sky-600" aria-hidden />
          </div>
        </section>
        <section className={cn(dashboardPanelClass, "px-3 py-2.5")}>
          <p className={dashboardSectionLabelClass}>Average call</p>
          <div className="mt-2 flex items-center justify-between gap-3">
            <div>
              <p className="text-2xl font-bold text-slate-900 dark:text-neutral-100 tabular-nums">
                {formatDuration(kpis.avgDurationSec)}
              </p>
              <p className="text-[11px] font-medium text-slate-500">{kpis.missedCalls} missed calls</p>
            </div>
            <Timer className="size-9 text-amber-600" aria-hidden />
          </div>
        </section>
      </div>

      <AgentActivityCharts data={data} />
      <AgentWorkLists data={data} />
    </div>
  );
}

function AgentDashboardSkeleton() {
  return (
    <div className={dashboardShellClass}>
      <div className={cn(dashboardPanelClass, "h-[92px] animate-pulse bg-white dark:bg-neutral-800")} />
      <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className={cn(dashboardPanelClass, "h-[74px] animate-pulse bg-white dark:bg-neutral-800")} />
        ))}
      </div>
      <div className={cn(dashboardPanelClass, "h-[130px] animate-pulse bg-white dark:bg-neutral-800")} />
      <div className="grid gap-2 xl:grid-cols-2">
        <div className={cn(dashboardPanelClass, "h-[270px] animate-pulse bg-white dark:bg-neutral-800")} />
        <div className={cn(dashboardPanelClass, "h-[270px] animate-pulse bg-white dark:bg-neutral-800")} />
      </div>
    </div>
  );
}
