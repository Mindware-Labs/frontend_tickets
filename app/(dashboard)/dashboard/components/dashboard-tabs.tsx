"use client";

import { useState } from "react";
import { Headphones, UserCheck, Users } from "lucide-react";

import { cn } from "@/lib/utils";

import { ExecutiveDashboard } from "./executive-dashboard";
import { MarketingDashboard } from "./marketing-dashboard";
import { OperationsDashboard } from "./operations-dashboard";

const VIEW_TABS = [
  { key: "operations", label: "Operations", icon: Headphones },
  { key: "executive", label: "Executive", icon: Users },
  { key: "marketing", label: "Marketing", icon: UserCheck },
] as const;

type DashboardView = (typeof VIEW_TABS)[number]["key"];

export function DashboardTabs() {
  const [activeView, setActiveView] = useState<DashboardView>("operations");

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="mt-1 flex items-end border-b border-border">
        <div className="flex min-w-0 flex-1 items-end overflow-x-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
          <div className="flex px-0.5">
            {VIEW_TABS.map((tab) => {
              const isActive = activeView === tab.key;
              const Icon = tab.icon;
              return (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => setActiveView(tab.key)}
                  className={cn(
                    "-mb-px mr-4 flex items-center gap-2 whitespace-nowrap border-b-2 px-2 py-2.5 text-[13px] font-medium transition-colors",
                    isActive
                      ? "border-[#008f68] text-foreground"
                      : "border-transparent text-muted-foreground hover:text-foreground",
                  )}
                >
                  <Icon className="h-4 w-4 shrink-0" aria-hidden />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <div className="mt-4 min-h-0 flex-1 overflow-y-auto pb-2">
        {activeView === "operations" ? <OperationsDashboard /> : null}
        {activeView === "executive" ? <ExecutiveDashboard /> : null}
        {activeView === "marketing" ? <MarketingDashboard /> : null}
      </div>
    </div>
  );
}
