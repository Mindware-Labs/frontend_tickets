"use client";

import { useEffect, useState } from "react";
import { Headphones, UserCheck, Users } from "lucide-react";

import { cn } from "@/lib/utils";

import { dashboardCanvasClass } from "../dashboard-theme";
import { useSupportDashboardData } from "../use-dashboard-real-data";
import {
  DashboardHeader,
  type DashboardViewKey,
} from "./dashboard-header";
import { DashboardFilterTransition } from "./dashboard-filter-transition";
import { DashboardLoadingOverlay } from "./dashboard-loading-overlay";
import { ExecutiveDashboard } from "./executive-dashboard";
import { MarketingDashboard } from "./marketing-dashboard";
import { OperationsDashboard } from "./operations-dashboard";

const VIEW_TABS = [
  { key: "operations" as const, label: "Operations", icon: Headphones },
  { key: "executive" as const, label: "Executive", icon: Users },
  { key: "marketing" as const, label: "Marketing", icon: UserCheck },
];

export function DashboardTabs() {
  const [activeView, setActiveView] = useState<DashboardViewKey>("operations");
  const {
    error,
    generatedAt,
    isLoading,
    isRealtimeConnected,
    isRealtimeSyncing,
  } = useSupportDashboardData();

  const [lastUpdated, setLastUpdated] = useState<string | null>(null);

  useEffect(() => {
    if (!generatedAt) {
      setLastUpdated(null);
      return;
    }
    setLastUpdated(
      new Date(generatedAt).toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      }),
    );
  }, [generatedAt]);

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <DashboardHeader
        tabs={VIEW_TABS}
        activeView={activeView}
        onViewChange={setActiveView}
        lastUpdated={lastUpdated}
        isRealtimeConnected={isRealtimeConnected}
        isRealtimeSyncing={isRealtimeSyncing}
      />

      {error ? (
        <p className="shrink-0 truncate pt-1.5 text-[11px] text-amber-700 dark:text-amber-400">
          Partial data: {error}
        </p>
      ) : null}

      <div
        className={cn(
          "relative mt-2 min-h-0 flex-1 overflow-hidden",
          dashboardCanvasClass,
        )}
      >
        <DashboardLoadingOverlay show={isLoading} />

        <DashboardFilterTransition>
          <div
            className={cn(
              "scrollbar-app-hover h-full overflow-y-auto pb-2",
              isLoading && "pointer-events-none select-none",
            )}
            aria-hidden={isLoading}
          >
            {activeView === "operations" ? <OperationsDashboard /> : null}
            {activeView === "executive" ? <ExecutiveDashboard /> : null}
            {activeView === "marketing" ? <MarketingDashboard /> : null}
          </div>
        </DashboardFilterTransition>
      </div>
    </div>
  );
}
