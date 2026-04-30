"use client";

import { Building, Loader2, SlidersHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
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
      <div className="flex min-h-[420px] flex-col items-center justify-center rounded-2xl border-2 border-dashed bg-gradient-to-br from-muted/30 to-muted/10 p-8 text-center animate-in zoom-in-95 duration-300">
        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-primary/10 mb-6 ring-8 ring-primary/5">
          <Building className="h-10 w-10 text-primary" />
        </div>
        <h3 className="text-xl font-bold">
          Seleccione una yarda para ver Dashboard
        </h3>
        <p className="mb-6 mt-3 text-sm text-muted-foreground max-w-md">
          Use el boton "Configure Report" en la parte superior para elegir una
          yarda y visualizar analisis detallados con graficas y estadisticas.
        </p>
        <Button onClick={onOpenFilters} className="gap-2" size="lg">
          <SlidersHorizontal className="h-4 w-4" />
          Configurar Reporte
        </Button>
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
              <div className="col-span-3 rounded-xl border bg-muted/20 p-3 sm:p-4">
                <p className="text-[11px] uppercase tracking-wide text-muted-foreground">
                  Total Tickets
                </p>
                <p className="mt-1 text-2xl font-bold sm:text-3xl">
                  {stats.totalTickets}
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
