"use client";

import { Filter, Info, SlidersHorizontal, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
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
  type DashboardFilterKey,
  filterDisplayValue,
  filterLabel,
  hasActiveDashboardFilters,
} from "../dashboard-filters";
import { useSupportDashboardData } from "../use-dashboard-real-data";

const FILTER_HINT =
  "Click any chart, table row, or heatmap cell to filter every visual on this dashboard. A heatmap cell sets both day and hour.";

function FilterChip({
  filterKey,
  value,
  onRemove,
  variant = "sheet",
}: {
  filterKey: DashboardFilterKey;
  value: string;
  onRemove: () => void;
  variant?: "sheet" | "inline";
}) {
  const label = `${filterLabel(filterKey)}: ${filterDisplayValue(filterKey, value)}`;

  if (variant === "inline") {
    return (
      <div className="flex max-w-[220px] shrink-0 items-center gap-1.5 rounded-md border border-emerald-100 bg-emerald-50 py-0.5 pr-1 pl-2.5 text-xs font-medium text-emerald-800 duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] animate-in fade-in zoom-in-95 dark:border-emerald-500/30 dark:bg-emerald-500/15 dark:text-emerald-100">
        <span className="truncate" title={label}>
          {label}
        </span>
        <button
          type="button"
          className="rounded p-0.5 text-emerald-700 transition-colors hover:bg-emerald-200/70 dark:hover:bg-emerald-500/25"
          onClick={onRemove}
          title="Clear filter"
          aria-label={`Remove ${filterLabel(filterKey)} filter`}
        >
          <X className="size-3" />
        </button>
      </div>
    );
  }

  return (
    <span className="inline-flex max-w-[240px] items-center gap-1 rounded-md border border-[#008f68]/25 bg-[#f0faf5]/80 py-1 pr-1 pl-2.5 text-[11px] font-medium text-slate-700 shadow-sm dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-50">
      <span className="shrink-0 text-[10px] font-semibold uppercase tracking-wide text-[#008f68] dark:text-emerald-300">
        {filterLabel(filterKey)}
      </span>
      <span className="truncate" title={value}>
        {filterDisplayValue(filterKey, value)}
      </span>
      <button
        type="button"
        className="flex size-6 shrink-0 items-center justify-center rounded-md text-slate-500 hover:bg-white/80 hover:text-slate-800 dark:hover:bg-neutral-800"
        onClick={onRemove}
        aria-label={`Remove ${filterLabel(filterKey)} filter`}
      >
        <X className="size-3.5" />
      </button>
    </span>
  );
}

function ActiveFilterList({
  className,
  variant = "sheet",
}: {
  className?: string;
  variant?: "sheet" | "inline";
}) {
  const { filters, clearFilters, setFilter } = useSupportDashboardData();

  const entries = (
    Object.entries(filters) as [DashboardFilterKey, string | null][]
  ).filter(([, value]) => !!value);

  if (!entries.length) return null;

  return (
    <div
      className={cn(
        "flex items-center gap-1.5",
        variant === "inline" ? "min-w-0 flex-wrap" : "flex-wrap gap-1.5",
        className,
      )}
    >
      {entries.map(([key, value]) => (
        <FilterChip
          key={key}
          filterKey={key}
          value={value!}
          variant={variant}
          onRemove={() => setFilter(key, null)}
        />
      ))}
      {variant === "sheet" ? (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-8 rounded-lg px-2 text-[11px] font-semibold text-slate-500 hover:text-[#008f68]"
          onClick={clearFilters}
        >
          Clear all
        </Button>
      ) : null}
    </div>
  );
}

/** Active filters inline beside tabs (fills header whitespace). */
export function DashboardInlineActiveFilters() {
  const { filters, clearFilters } = useSupportDashboardData();
  const active = hasActiveDashboardFilters(filters);

  return (
    <div
      className={cn(
        "grid min-w-0 flex-1 transition-[grid-template-rows,opacity,margin] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none",
        active
          ? "grid-rows-[1fr] opacity-100"
          : "grid-rows-[0fr] opacity-0",
      )}
      aria-hidden={!active}
    >
      <div className="overflow-hidden">
        <div
          className="flex flex-wrap items-center gap-2 rounded-lg border border-slate-200/60 bg-slate-50 py-1 pr-1.5 pl-2.5 duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] animate-in fade-in slide-in-from-left-1 dark:border-neutral-700 dark:bg-neutral-900/50"
          role="region"
          aria-label="Active dashboard filters"
        >
          <div className="flex shrink-0 items-center gap-1 text-[10px] font-bold tracking-wider text-slate-400 uppercase">
            <SlidersHorizontal className="size-3 text-slate-400" aria-hidden />
            <span>Filtered:</span>
          </div>

          <ActiveFilterList variant="inline" className="min-w-0 flex-1" />

          <button
            type="button"
            className="shrink-0 px-1.5 py-0.5 text-[11px] font-medium text-slate-400 transition-colors duration-200 hover:text-slate-600 dark:hover:text-neutral-300"
            onClick={clearFilters}
          >
            Clear
          </button>
        </div>
      </div>
    </div>
  );
}

/** Filter button + sheet for managing active filters. */
export function DashboardFilterTrigger({ className }: { className?: string }) {
  const { filters } = useSupportDashboardData();
  const active = hasActiveDashboardFilters(filters);
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
            <span className="ml-0.5 flex size-4 items-center justify-center rounded-full bg-white text-[10px] font-bold text-[#008f68]">
              {count}
            </span>
          ) : null}
        </button>
      </SheetTrigger>
      <SheetContent side="bottom" className="max-h-[85dvh] rounded-t-2xl px-4 pb-6">
        <SheetHeader className="text-left">
          <SheetTitle className="text-base">Dashboard filters</SheetTitle>
          <SheetDescription>{FILTER_HINT}</SheetDescription>
        </SheetHeader>
        <div className="mt-4">
          <ActiveFilterList />
          {!active ? (
            <p className="text-[12px] text-slate-500">
              No filters applied. Select data on a chart or table to narrow the view.
            </p>
          ) : null}
        </div>
      </SheetContent>
    </Sheet>
  );
}

export function FilterHelpPopover() {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          className="cursor-pointer text-slate-400 transition-colors hover:text-slate-600 dark:hover:text-neutral-300"
          aria-label="How cross-filtering works"
        >
          <Info className="size-4" />
        </button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-72 text-[12px] leading-relaxed">
        {FILTER_HINT}
      </PopoverContent>
    </Popover>
  );
}

export { ActiveFilterList };
