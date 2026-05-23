"use client";

import { X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

import {
  type DashboardFilterKey,
  type DashboardFilters,
  filterDisplayValue,
  filterLabel,
  hasActiveDashboardFilters,
} from "../dashboard-filters";
import { useSupportDashboardData } from "../use-dashboard-real-data";

function FilterChip({
  filterKey,
  value,
  onRemove,
}: {
  filterKey: DashboardFilterKey;
  value: string;
  onRemove: () => void;
}) {
  return (
    <span className="inline-flex max-w-[220px] items-center gap-1 rounded-full border border-[#008f68]/30 bg-[#f0faf5] py-0.5 pr-1 pl-2 text-[11px] font-medium text-slate-700 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-100">
      <span className="shrink-0 text-[10px] font-semibold uppercase tracking-wide text-[#008f68] dark:text-emerald-300">
        {filterLabel(filterKey)}
      </span>
      <span className="truncate" title={value}>
        {filterDisplayValue(filterKey, value)}
      </span>
      <button
        type="button"
        className="ml-0.5 flex size-5 shrink-0 items-center justify-center rounded-full text-slate-500 hover:bg-white hover:text-slate-800 dark:hover:bg-slate-900"
        onClick={onRemove}
        aria-label={`Remove ${filterLabel(filterKey)} filter`}
      >
        <X className="size-3" />
      </button>
    </span>
  );
}

export function DashboardFilterBar({ className }: { className?: string }) {
  const { filters, clearFilters, setFilter, isFilterLoading } =
    useSupportDashboardData();

  if (!hasActiveDashboardFilters(filters)) {
    return (
      <p
        className={cn(
          "shrink-0 text-[10px] text-slate-400 dark:text-slate-500",
          className,
        )}
      >
        Click any chart, table row, or heatmap cell to filter all dashboard
        visuals. Heatmap selects day + hour together.
      </p>
    );
  }

  const entries = (
    Object.entries(filters) as [DashboardFilterKey, string | null][]
  ).filter(([, value]) => !!value);

  return (
    <div
      className={cn(
        "flex shrink-0 flex-wrap items-center gap-1.5 rounded-xl border border-slate-100 bg-white px-2 py-1.5 shadow-[0_1px_2px_rgba(0,0,0,0.04)] dark:border-slate-800 dark:bg-slate-950",
        className,
      )}
    >
      <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
        Filters
      </span>
      {entries.map(([key, value]) => (
        <FilterChip
          key={key}
          filterKey={key}
          value={value!}
          onRemove={() => setFilter(key, null)}
        />
      ))}
      {isFilterLoading ? (
        <span className="text-[10px] text-slate-400">Updating…</span>
      ) : null}
      <Button
        type="button"
        variant="ghost"
        size="sm"
        className="ml-auto h-7 rounded-lg px-2 text-[11px] font-semibold text-slate-500 hover:text-[#008f68]"
        onClick={clearFilters}
      >
        Clear all
      </Button>
    </div>
  );
}
