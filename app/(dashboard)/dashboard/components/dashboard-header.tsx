"use client";

import { useState } from "react";
import type { LucideIcon } from "lucide-react";
import { Calendar } from "lucide-react";

import { cn } from "@/lib/utils";

import { useSupportDashboardData } from "../use-dashboard-real-data";
import { parseCustomDashboardPeriod } from "../dashboard-filters";

import {
  DashboardFilterTrigger,
  DashboardInlineActiveFilters,
  FilterHelpPopover,
} from "./dashboard-filter-bar";
import { DashboardPeriodModal } from "./dashboard-period-modal";

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
  isRealtimeConnected: boolean;
  isRealtimeSyncing: boolean;
};

export function DashboardHeader({
  tabs,
  activeView,
  onViewChange,
  lastUpdated,
  isRealtimeConnected,
  isRealtimeSyncing,
}: DashboardHeaderProps) {
  const { data, period } = useSupportDashboardData();
  const [isPeriodModalOpen, setIsPeriodModalOpen] = useState(false);
  const hasLive = data.liveSnapshot.hasLive;

  const statusLabel = hasLive
    ? "Live"
    : isRealtimeSyncing
      ? "Syncing"
      : isRealtimeConnected
        ? "Connected"
        : "Offline";
  const statusActive = hasLive || isRealtimeConnected;

  const periodLabels: Record<string, string> = {
    "today": "Today",
    "7d": "7 Days",
    "30d": "Monthly",
    "90d": "90 Days",
    "all": "All Time",
  };
  const customPeriod = parseCustomDashboardPeriod(period);
  const activePeriodLabel = customPeriod
    ? "Custom"
    : periodLabels[period] || "Filter";

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

          {/* Filters help */}
          <div className="flex shrink-0 items-center gap-1">
            <span className="hidden text-[10px] font-semibold tracking-wider text-slate-400 uppercase sm:inline">
              Filters
            </span>
            <FilterHelpPopover />
          </div>

          <DashboardInlineActiveFilters />
        </div>

        {/* Right: filters, status, time */}
        <div className="flex items-center justify-between gap-3 border-t border-slate-100 pt-2 md:border-t-0 md:pt-0 md:justify-end">
          <button
            type="button"
            onClick={() => setIsPeriodModalOpen(true)}
            className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 shadow-sm transition-colors hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-300 cursor-pointer"
          >
            <Calendar className="size-3.5 text-slate-400" />
            <span>Period: <span className="font-semibold text-[#008f68] dark:text-emerald-400">{activePeriodLabel}</span></span>
          </button>

          <div className="flex items-center gap-2 text-slate-400">
            {lastUpdated ? (
              <span className="rounded border border-slate-200/40 bg-slate-100 px-2 py-0.5 font-mono text-xs font-medium text-slate-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-400">
                {lastUpdated}
              </span>
            ) : null}
          </div>
        </div>
      </div>

      <DashboardPeriodModal
        isOpen={isPeriodModalOpen}
        onOpenChange={setIsPeriodModalOpen}
      />
    </header>
  );
}
