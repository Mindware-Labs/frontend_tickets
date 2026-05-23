"use client";

import { useState } from "react";
import { Headphones, RefreshCw, UserCheck, Users } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

import { dashboardCanvasClass } from "../dashboard-theme";
import { useSupportDashboardData } from "../use-dashboard-real-data";
import { DashboardFilterBar } from "./dashboard-filter-bar";
import { ExecutiveDashboard } from "./executive-dashboard";
import { MarketingDashboard } from "./marketing-dashboard";
import { OperationsDashboard } from "./operations-dashboard";

const VIEW_TABS = [
  { key: "operations", label: "Operations", shortLabel: "Ops", icon: Headphones },
  { key: "executive", label: "Executive", shortLabel: "Exec", icon: Users },
  { key: "marketing", label: "Marketing", shortLabel: "Mkt", icon: UserCheck },
] as const;

type DashboardView = (typeof VIEW_TABS)[number]["key"];

export function DashboardTabs() {
  const [activeView, setActiveView] = useState<DashboardView>("operations");
  const { error, generatedAt, isLoading, refresh } = useSupportDashboardData();

  const lastUpdated = generatedAt
    ? new Date(generatedAt).toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      })
    : null;

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="flex shrink-0 items-center gap-2 border-b border-slate-100 pb-2 pt-0.5 dark:border-slate-800">
        <div
          className="flex min-w-0 flex-1 items-center gap-0.5 overflow-x-auto rounded-xl bg-[#f4f5f7] p-0.5 dark:bg-slate-900/60 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
          role="tablist"
          aria-label="Dashboard views"
        >
          {VIEW_TABS.map((tab) => {
            const isActive = activeView === tab.key;
            const Icon = tab.icon;
            return (
              <button
                key={tab.key}
                type="button"
                role="tab"
                aria-selected={isActive}
                onClick={() => setActiveView(tab.key)}
                className={cn(
                  "flex min-h-[32px] shrink-0 items-center justify-center gap-1.5 rounded-lg px-2.5 py-1 text-[12px] font-semibold transition-all sm:px-3 sm:text-[13px]",
                  isActive
                    ? "border border-[#008f68]/30 bg-white text-slate-800 shadow-sm ring-1 ring-[#008f68]/15 dark:border-emerald-500/30 dark:bg-slate-950 dark:text-slate-100"
                    : "text-slate-500 hover:bg-white/70 hover:text-slate-700 dark:text-slate-400 dark:hover:bg-slate-950/50 dark:hover:text-slate-200",
                )}
              >
                <Icon className="h-3.5 w-3.5 shrink-0" aria-hidden />
                <span className="sm:hidden">{tab.shortLabel}</span>
                <span className="hidden sm:inline">{tab.label}</span>
              </button>
            );
          })}
        </div>

        <div className="flex shrink-0 items-center gap-1.5">
          {lastUpdated ? (
            <span className="hidden text-[11px] tabular-nums text-muted-foreground md:inline">
              {lastUpdated}
            </span>
          ) : null}
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-8 w-8 shrink-0 rounded-lg text-muted-foreground hover:bg-[#f0faf5] hover:text-[#008f68] dark:hover:bg-emerald-950/30"
            disabled={isLoading}
            onClick={() => void refresh()}
            title="Refresh dashboard data"
            aria-label="Refresh dashboard data"
          >
            <RefreshCw
              className={cn("h-3.5 w-3.5", isLoading && "animate-spin")}
            />
          </Button>
        </div>
      </div>

      {error ? (
        <p className="shrink-0 truncate pt-1 text-[11px] text-amber-700 dark:text-amber-400">
          Partial data: {error}
        </p>
      ) : null}

      <DashboardFilterBar className="mt-1.5" />

      <div
        className={cn(
          "mt-2 min-h-0 flex-1 overflow-y-auto pb-1",
          dashboardCanvasClass,
        )}
      >
        {activeView === "operations" ? <OperationsDashboard /> : null}
        {activeView === "executive" ? <ExecutiveDashboard /> : null}
        {activeView === "marketing" ? <MarketingDashboard /> : null}
      </div>
    </div>
  );
}
