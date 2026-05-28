"use client";

import { Building, Loader2, SlidersHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import type { YardStats } from "./types";

type YardsOverviewProps = {
  loadingStats: boolean;
  yardsStats: YardStats[];
  onSelectYard: (yardId: string) => void;
  onOpenFilters: () => void;
  formatDate: (dateString?: string | null) => string;
};

export function YardsOverview({
  loadingStats,
  yardsStats,
  onSelectYard,
  onOpenFilters,
  formatDate,
}: YardsOverviewProps) {
  if (loadingStats) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        <span className="ml-2 text-muted-foreground">
          Loading yard statistics...
        </span>
      </div>
    );
  }

  if (yardsStats.length === 0) {
    return (
      <div className="flex min-h-[420px] items-center justify-center rounded-2xl bg-slate-50 p-6 dark:bg-slate-900/20 animate-in zoom-in-95 duration-300">
        <Empty className="min-h-[350px] gap-4 rounded-2xl border border-solid border-slate-200/80 bg-white px-6 py-8 shadow-[0_1px_3px_rgba(0,0,0,0.06)] dark:border-slate-800 dark:bg-slate-950 max-w-md w-full">
          <EmptyHeader className="gap-2">
            <EmptyMedia
              variant="icon"
              className="mb-1 size-11 rounded-lg border border-emerald-100 bg-[#f0faf5] text-[#008f68] dark:border-emerald-500/25 dark:bg-emerald-500/10 dark:text-emerald-300"
            >
              <Building className="size-5" aria-hidden />
            </EmptyMedia>

            <span className="text-[10px] font-semibold uppercase tracking-widest text-slate-400">
              No yards found
            </span>

            <EmptyTitle className="text-[15px] font-semibold text-slate-900 dark:text-slate-100">
              No yard statistics available
            </EmptyTitle>

            <EmptyDescription className="text-xs leading-5 text-slate-600 dark:text-slate-400">
              No statistics were found for any yard in the selected period. Try adjusting the date range or selecting another yard in the report configuration.
            </EmptyDescription>
          </EmptyHeader>

          <EmptyContent>
            <Button
              type="button"
              size="sm"
              onClick={onOpenFilters}
              className="h-9 rounded-lg bg-[#008f68] px-4 text-xs font-semibold text-white shadow-sm hover:bg-[#007a5a]"
            >
              <SlidersHorizontal data-icon="inline-start" className="mr-1.5 size-3.5" aria-hidden />
              Configure Report
            </Button>
          </EmptyContent>
        </Empty>
      </div>
    );
  }

  const minCardWidth =
    yardsStats.length <= 2
      ? 420
      : yardsStats.length <= 4
        ? 340
        : yardsStats.length <= 6
          ? 300
          : 260;

  return (
    <div
      className="grid gap-4 sm:gap-6"
      style={{
        gridTemplateColumns: `repeat(auto-fit, minmax(min(100%, ${minCardWidth}px), 1fr))`,
      }}
    >
      {yardsStats.map((stats) => (
        <button
          type="button"
          key={stats.yard.id}
          onClick={() => onSelectYard(stats.yard.id.toString())}
          className="group relative w-full min-h-[240px] overflow-hidden rounded-2xl border bg-card p-4 text-left shadow-sm transition-all sm:p-6 md:hover:border-primary md:hover:shadow-lg md:hover:scale-[1.01] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          <div className="relative flex h-full flex-col gap-4">
            <div className="flex items-start justify-between gap-3">
              <div className="flex min-w-0 items-start gap-3">
                <div className="rounded-lg bg-primary/10 p-2 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                  <Building className="h-4 w-4 sm:h-5 sm:w-5" />
                </div>
                <div className="min-w-0">
                  <h3 className="line-clamp-2 text-base font-semibold leading-tight sm:text-lg">
                    {stats.yard.name}
                  </h3>
                  <p className="mt-1 text-[11px] uppercase tracking-wide text-muted-foreground">
                    Yard Overview
                  </p>
                </div>
              </div>
              <div className="rounded-full border bg-muted/40 px-2.5 py-1 text-xs font-semibold text-muted-foreground">
                #{stats.yard.id}
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2 sm:gap-3">
              <div className="rounded-xl border bg-muted/20 p-3 sm:p-4">
                <p className="text-[11px] uppercase tracking-wide text-muted-foreground">
                  Total Tickets
                </p>
                <p className="mt-1 text-2xl font-bold sm:text-3xl">
                  {stats.totalTickets}
                </p>
              </div>

              <div className="rounded-xl border bg-muted/20 p-3 sm:p-4">
                <p className="text-[11px] uppercase tracking-wide text-muted-foreground">
                  Calls
                </p>
                <p className="mt-1 text-2xl font-bold sm:text-3xl">
                  {stats.totalCalls ?? 0}
                </p>
              </div>

              <div className="rounded-xl border bg-muted/20 p-3 sm:p-4">
                <p className="text-[11px] uppercase tracking-wide text-muted-foreground">
                  Manual
                </p>
                <p className="mt-1 text-2xl font-bold sm:text-3xl">
                  {stats.totalManualRecords ?? 0}
                </p>
              </div>

              <div className="rounded-xl border bg-background/70 p-3">
                <p className="text-[11px] uppercase tracking-wide text-muted-foreground">
                  Active
                </p>
                <p className="mt-1 text-base font-semibold text-orange-600 dark:text-orange-400">
                  {stats.openTickets}
                </p>
              </div>

              <div className="rounded-xl border bg-background/70 p-3">
                <p className="text-[11px] uppercase tracking-wide text-muted-foreground">
                  Closed
                </p>
                <p className="mt-1 text-base font-semibold text-emerald-600 dark:text-emerald-400">
                  {stats.closedTickets}
                </p>
              </div>

              <div className="rounded-xl border bg-background/70 p-3">
                <p className="text-[11px] uppercase tracking-wide text-muted-foreground">
                  Resolved
                </p>
                <p className="mt-1 text-base font-semibold">
                  {stats.totalTickets > 0
                    ? Math.round((stats.closedTickets / stats.totalTickets) * 100)
                    : 0}
                  %
                </p>
              </div>
            </div>

            <div className="mt-auto space-y-2">
              <div className="rounded-lg border bg-muted/20 p-3">
                <p className="text-[11px] uppercase tracking-wide text-muted-foreground">
                  Last Activity
                </p>
                <p className="mt-1 truncate text-sm font-medium">
                  {formatDate(stats.lastActivity)}
                </p>
              </div>
              <div className="flex items-center justify-end text-xs font-medium text-primary">
                View dashboard
              </div>
            </div>
          </div>
        </button>
      ))}
    </div>
  );
}
