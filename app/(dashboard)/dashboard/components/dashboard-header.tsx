"use client";

import type { LucideIcon } from "lucide-react";
import { RefreshCw } from "lucide-react";

import { cn } from "@/lib/utils";

import {
  DashboardFilterTrigger,
  DashboardInlineActiveFilters,
  FilterHelpPopover,
} from "./dashboard-filter-bar";

export type DashboardViewKey = "operations" | "executive" | "marketing";

export type DashboardHeaderTab = {
  key: DashboardViewKey;
  label: string;
  icon: LucideIcon;
};

type DashboardHeaderProps = {
  tabs: readonly DashboardHeaderTab[];
  activeView: DashboardViewKey;
  onViewChange: (view: DashboardViewKey) => void;
  lastUpdated: string | null;
  isLoading: boolean;
  isRealtimeConnected: boolean;
  isRealtimeSyncing: boolean;
  onRefresh: () => void;
};

export function DashboardHeader({
  tabs,
  activeView,
  onViewChange,
  lastUpdated,
  isLoading,
  isRealtimeConnected,
  isRealtimeSyncing,
  onRefresh,
}: DashboardHeaderProps) {
  return (
    <header className="shrink-0">
      <div
        className={cn(
          "flex min-h-[56px] flex-col gap-3 rounded-xl border border-slate-200/80 bg-white px-4 py-2 shadow-sm",
          "md:flex-row md:items-center md:justify-between md:gap-4",
          "dark:border-slate-800 dark:bg-slate-950",
        )}
      >
        {/* Left: symmetric tabs + inline active filters */}
        <div className="flex min-w-0 flex-1 flex-wrap items-center gap-3 md:gap-4">
          <div
            className="flex w-full min-w-[280px] rounded-lg bg-slate-100 p-1 sm:w-auto sm:min-w-[320px] dark:bg-slate-900/80"
            role="tablist"
            aria-label="Dashboard views"
          >
            {tabs.map((tab) => {
              const isActive = activeView === tab.key;
              const Icon = tab.icon;
              return (
                <button
                  key={tab.key}
                  type="button"
                  role="tab"
                  aria-selected={isActive}
                  onClick={() => onViewChange(tab.key)}
                  className={cn(
                    "flex flex-1 items-center justify-center gap-2 rounded-md px-3 py-1.5 text-xs font-medium whitespace-nowrap transition-all duration-150",
                    isActive
                      ? "bg-white font-semibold text-[#008f68] shadow-sm dark:bg-slate-950 dark:text-emerald-400"
                      : "text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200",
                  )}
                >
                  <Icon
                    className={cn(
                      "size-3.5 shrink-0",
                      isActive
                        ? "text-[#008f68] dark:text-emerald-400"
                        : "text-slate-400",
                    )}
                    aria-hidden
                  />
                  {tab.label}
                </button>
              );
            })}
          </div>

          <DashboardInlineActiveFilters />
        </div>

        {/* Right: filter launcher, info, time, refresh */}
        <div className="flex items-center justify-between gap-3 border-t border-slate-100 pt-2 md:border-t-0 md:pt-0 md:justify-end">
          <DashboardFilterTrigger />

          <div
            className="hidden h-4 w-px bg-slate-200 md:block dark:bg-slate-700"
            aria-hidden
          />

          <div className="flex items-center gap-3 text-slate-400">
            <FilterHelpPopover />
            <span
              className={cn(
                "inline-flex items-center gap-1.5 rounded border px-2 py-0.5 text-xs font-semibold",
                isRealtimeConnected
                  ? "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-300"
                  : "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-300",
              )}
              title={
                isRealtimeConnected
                  ? "Socket connected: dashboard syncs from live events."
                  : "Socket disconnected: dashboard is using live polling."
              }
            >
              <span
                className={cn(
                  "size-1.5 rounded-full",
                  isRealtimeConnected ? "bg-emerald-500" : "bg-amber-500",
                  isRealtimeSyncing && "animate-pulse",
                )}
                aria-hidden
              />
              {isRealtimeConnected ? "Live" : "Polling"}
            </span>
            {lastUpdated ? (
              <span className="rounded border border-slate-200/40 bg-slate-100 px-2 py-0.5 font-mono text-xs font-medium text-slate-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-400">
                {lastUpdated}
              </span>
            ) : null}
            <button
              type="button"
              className="rounded-full p-1 text-slate-500 transition-colors hover:bg-slate-100 disabled:opacity-50 dark:hover:bg-slate-800"
              disabled={isLoading}
              onClick={onRefresh}
              title="Refresh dashboard data"
              aria-label="Refresh dashboard data"
            >
              <RefreshCw
                className={cn("size-3.5", isLoading && "animate-spin")}
              />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
