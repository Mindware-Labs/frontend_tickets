"use client";

import { cn } from "@/lib/utils";

import type { DashboardFilterKey } from "../dashboard-filters";
import { useSupportDashboardData } from "../use-dashboard-real-data";

export function useCrossFilter() {
  const {
    filters,
    toggleFilter,
    toggleHeatmapSlot,
    isFilterActive,
    isHeatmapSlotActive,
  } = useSupportDashboardData();
  return {
    filters,
    toggleFilter,
    toggleHeatmapSlot,
    isFilterActive,
    isHeatmapSlotActive,
  };
}

export function crossFilterBarOpacity(
  isActive: boolean,
  hasFilter: boolean,
): number {
  if (!hasFilter) return 1;
  return isActive ? 1 : 0.35;
}

export function crossFilterRowClass(isActive: boolean) {
  return cn(
    "cursor-pointer transition-colors",
    isActive
      ? "border-[#008f68]/40 bg-[#f0faf5] ring-1 ring-[#008f68]/20 dark:border-emerald-500/30 dark:bg-emerald-500/10"
      : "hover:border-slate-200 hover:bg-slate-50/80 dark:hover:bg-slate-900/60",
  );
}

export function CrossFilterHint({ dimension }: { dimension: DashboardFilterKey }) {
  return (
    <span className="sr-only">
      Click to filter by {dimension}. Click again to clear.
    </span>
  );
}
