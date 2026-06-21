"use client";

import { Filter, X } from "lucide-react";

import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

import {
  hasActiveYardDashboardFilters,
  yardFilterLabel,
  type YardDashboardFilterKey,
} from "./yard-dashboard-filters";
import { useYardDashboardData } from "./use-yard-dashboard-data";

const FILTER_HINT =
  "Click any chart bar, activity day, or agent row to filter the whole yard dashboard. Click again to clear.";

function YardFilterChip({
  filterKey,
  value,
  onRemove,
}: {
  filterKey: YardDashboardFilterKey;
  value: string;
  onRemove: () => void;
}) {
  const label = `${yardFilterLabel(filterKey)}: ${value}`;

  return (
    <div className="flex max-w-[240px] shrink-0 items-center gap-1.5 rounded-md border border-emerald-100 bg-emerald-50 py-0.5 pr-1 pl-2.5 text-xs font-medium text-emerald-800 duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] animate-in fade-in zoom-in-95 dark:border-emerald-500/30 dark:bg-emerald-500/15 dark:text-emerald-100">
      <span className="truncate" title={label}>
        {label}
      </span>
      <button
        type="button"
        className="rounded p-0.5 text-emerald-700 transition-colors hover:bg-emerald-200/70 dark:hover:bg-emerald-500/25"
        onClick={onRemove}
        title="Clear filter"
        aria-label={`Remove ${yardFilterLabel(filterKey)} filter`}
      >
        <X className="size-3" />
      </button>
    </div>
  );
}

export function YardInlineActiveFilters() {
  const { filters, clearFilters, toggleFilter } = useYardDashboardData();
  const active = hasActiveYardDashboardFilters(filters);

  if (!active) return null;

  return (
    <div className="flex min-w-0 flex-1 flex-wrap items-center gap-1.5">
      {(Object.keys(filters) as YardDashboardFilterKey[]).map((key) => {
        const value = filters[key];
        if (!value) return null;
        return (
          <YardFilterChip
            key={key}
            filterKey={key}
            value={value}
            onRemove={() => toggleFilter(key, value)}
          />
        );
      })}
      <button
        type="button"
        onClick={clearFilters}
        className="text-[11px] font-medium text-slate-500 underline-offset-2 hover:text-slate-800 hover:underline dark:text-neutral-400 dark:hover:text-neutral-200"
      >
        Clear all
      </button>
    </div>
  );
}

export function YardFilterTrigger({ className }: { className?: string }) {
  const { filters, clearFilters, toggleFilter } = useYardDashboardData();
  const active = hasActiveYardDashboardFilters(filters);
  const count = Object.values(filters).filter(Boolean).length;

  return (
    <Sheet>
      <SheetTrigger asChild>
        <button
          type="button"
          className={cn(
            "flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-medium shadow-sm transition-colors",
            active
              ? "bg-[#008f68] text-white hover:bg-[#007a5a]"
              : "border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 dark:border-neutral-700 dark:bg-neutral-950 dark:text-neutral-300",
            className,
          )}
        >
          <Filter className="size-3.5" aria-hidden />
          <span>Filters</span>
          {active ? (
            <span className="ml-0.5 flex size-4 items-center justify-center rounded-full bg-white text-[10px] font-bold text-[#008f68] dark:bg-neutral-900">
              {count}
            </span>
          ) : null}
        </button>
      </SheetTrigger>
      <SheetContent side="bottom" className="max-h-[85dvh] rounded-t-2xl px-4 pb-6">
        <SheetHeader className="text-left">
          <SheetTitle className="text-base">Yard dashboard filters</SheetTitle>
          <SheetDescription>{FILTER_HINT}</SheetDescription>
        </SheetHeader>
        <div className="mt-4 space-y-3">
          {active ? (
            <div className="flex flex-wrap gap-2">
              {(Object.keys(filters) as YardDashboardFilterKey[]).map((key) => {
                const value = filters[key];
                if (!value) return null;
                return (
                  <YardFilterChip
                    key={key}
                    filterKey={key}
                    value={value}
                    onRemove={() => toggleFilter(key, value)}
                  />
                );
              })}
            </div>
          ) : (
            <p className="text-[12px] text-slate-500">
              No filters applied. Select data on a chart to narrow the view.
            </p>
          )}
          {active ? (
            <button
              type="button"
              onClick={clearFilters}
              className="text-sm font-medium text-[#008f68] hover:underline"
            >
              Clear all filters
            </button>
          ) : null}
        </div>
      </SheetContent>
    </Sheet>
  );
}
