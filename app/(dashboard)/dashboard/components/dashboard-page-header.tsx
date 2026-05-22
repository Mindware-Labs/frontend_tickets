"use client";

import { RefreshCw } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

import { useSupportDashboardData } from "../use-dashboard-real-data";

export function DashboardPageHeader() {
  const { error, generatedAt, isLoading, refresh } = useSupportDashboardData();

  const today = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });

  const lastUpdated = generatedAt
    ? new Date(generatedAt).toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      })
    : null;

  return (
    <div className="flex w-full flex-col justify-between gap-3 border-b border-border px-0.5 pb-5 pt-2 md:flex-row md:items-center">
      <div className="min-w-0">
        <h2 className="text-2xl font-bold leading-tight tracking-tight text-slate-900 dark:text-slate-50">
          Dashboards
        </h2>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          {today} · Operations, executive and marketing KPIs · Last 30 days
          {lastUpdated ? ` · Updated ${lastUpdated}` : isLoading ? " · Loading…" : ""}
        </p>
        {error ? (
          <p className="mt-1.5 text-xs text-amber-700 dark:text-amber-400">
            Some data sources are unavailable: {error}
          </p>
        ) : null}
      </div>

      <Button
        type="button"
        variant="outline"
        className="h-9 rounded-xl border-border px-4 text-[13px] font-medium shadow-sm hover:border-[#008f68]/40 hover:bg-[#f0faf5] hover:text-[#008f68] dark:hover:bg-emerald-950/30"
        disabled={isLoading}
        onClick={() => void refresh()}
      >
        <RefreshCw
          className={cn("mr-1.5 h-4 w-4", isLoading && "animate-spin")}
          aria-hidden
        />
        Refresh data
      </Button>
    </div>
  );
}
