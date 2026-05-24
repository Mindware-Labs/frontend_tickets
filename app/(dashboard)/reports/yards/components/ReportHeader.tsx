"use client";

import {
  Building2,
  ClipboardList,
  Download,
  FileSpreadsheet,
  Filter,
  LayoutGrid,
} from "lucide-react";

import { cn } from "@/lib/utils";
import {
  YardContextChip,
  yardDashboardTabClass,
  yardDashboardTabIconClass,
  yardDashboardTabListClass,
  yardDashboardToolbarClass,
} from "./yard-dashboard-chrome";
import { YardFilterTrigger } from "./yard-filter-bar";
import type { Yard } from "./types";

type ReportHeaderProps = {
  selectedYard: Yard | null;
  startDate: string;
  endDate: string;
  canExport: boolean;
  canViewTickets: boolean;
  lastUpdated: string | null;
  onSelectOverview: () => void;
  onOpenFilters: () => void;
  onViewAllTickets: () => void;
  onExportPDF: () => void;
  onExportExcel: () => void;
  showCrossFilters?: boolean;
};

export function ReportHeader({
  selectedYard,
  startDate,
  endDate,
  canExport,
  canViewTickets,
  lastUpdated,
  onSelectOverview,
  onOpenFilters,
  onViewAllTickets,
  onExportPDF,
  onExportExcel,
  showCrossFilters = false,
}: ReportHeaderProps) {
  const hasDateRange = Boolean(startDate && endDate);
  const hasYardDetail = Boolean(selectedYard);
  const filtersConfigured = hasDateRange && hasYardDetail;

  return (
    <header className="shrink-0">
      <div className={yardDashboardToolbarClass}>
        <div className="flex min-w-0 flex-1 flex-wrap items-center gap-2 md:gap-3">
          <div
            className={yardDashboardTabListClass}
            role="tablist"
            aria-label="Yard report views"
          >
            <button
              type="button"
              role="tab"
              aria-selected={!hasYardDetail}
              onClick={onSelectOverview}
              className={yardDashboardTabClass(!hasYardDetail)}
            >
              <LayoutGrid
                className={yardDashboardTabIconClass(!hasYardDetail)}
                aria-hidden
              />
              All yards
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={hasYardDetail}
              disabled={!hasYardDetail}
              onClick={hasYardDetail ? undefined : onOpenFilters}
              className={cn(
                yardDashboardTabClass(hasYardDetail),
                !hasYardDetail &&
                  "disabled:cursor-not-allowed disabled:opacity-60",
              )}
            >
              <Building2
                className={yardDashboardTabIconClass(hasYardDetail)}
                aria-hidden
              />
              <span className="max-w-[140px] truncate">
                {selectedYard?.name ?? "Yard detail"}
              </span>
            </button>
          </div>

          {filtersConfigured ? (
            <div className="flex min-w-0 flex-1 flex-wrap items-center gap-1.5">
              <YardContextChip label="Yard" value={selectedYard!.name} />
              <YardContextChip
                label="Range"
                value={`${startDate} → ${endDate}`}
              />
            </div>
          ) : hasDateRange ? (
            <YardContextChip
              label="Range"
              value={`${startDate} → ${endDate}`}
            />
          ) : null}

        </div>

        <div className="flex w-full flex-col gap-2 border-t border-slate-100 pt-2 sm:flex-row sm:items-center sm:justify-between md:w-auto md:border-t-0 md:pt-0 md:justify-end">
          <div className="flex flex-wrap items-center gap-1.5 rounded-lg border border-slate-200/80 bg-slate-100/80 p-0.5 dark:border-slate-800 dark:bg-slate-900/80">
            {showCrossFilters ? <YardFilterTrigger /> : null}
            <button
              type="button"
              onClick={onOpenFilters}
              className={cn(
                "flex h-8 items-center gap-1.5 rounded-lg px-3 text-xs font-medium shadow-sm transition-colors",
                filtersConfigured || hasDateRange
                  ? "bg-[#008f68] text-white hover:bg-[#007a5a]"
                  : "bg-white text-slate-600 hover:bg-slate-50 dark:bg-slate-950 dark:text-slate-300",
              )}
            >
              <Filter className="size-3.5" aria-hidden />
              <span>Configure</span>
            </button>

            {canViewTickets ? (
              <button
                type="button"
                onClick={onViewAllTickets}
                className="flex h-8 items-center gap-1.5 rounded-lg bg-white px-3 text-xs font-medium text-slate-600 shadow-sm transition-colors hover:bg-slate-50 dark:bg-slate-950 dark:text-slate-300"
              >
                <ClipboardList className="size-3.5" aria-hidden />
                <span>Records</span>
              </button>
            ) : null}

            {canExport ? (
              <>
                <button
                  type="button"
                  onClick={onExportPDF}
                  className="flex h-8 items-center gap-1.5 rounded-lg bg-white px-3 text-xs font-medium text-slate-600 shadow-sm transition-colors hover:bg-slate-50 dark:bg-slate-950 dark:text-slate-300"
                >
                  <Download className="size-3.5" aria-hidden />
                  <span>PDF</span>
                </button>
                <button
                  type="button"
                  onClick={onExportExcel}
                  className="flex h-8 items-center gap-1.5 rounded-lg bg-white px-3 text-xs font-medium text-slate-600 shadow-sm transition-colors hover:bg-slate-50 dark:bg-slate-950 dark:text-slate-300"
                >
                  <FileSpreadsheet className="size-3.5" aria-hidden />
                  <span>Excel</span>
                </button>
              </>
            ) : null}
          </div>

          <div
            className="hidden h-4 w-px shrink-0 bg-slate-200 md:block dark:bg-slate-700"
            aria-hidden
          />

          <div className="flex shrink-0 items-center gap-2 text-slate-400">
            <span
              className={cn(
                "inline-flex items-center gap-1.5 rounded border px-2 py-0.5 text-xs font-semibold",
                filtersConfigured
                  ? "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-300"
                  : "border-slate-200 bg-slate-50 text-slate-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-400",
              )}
            >
              <span
                className={cn(
                  "size-1.5 rounded-full",
                  filtersConfigured ? "bg-emerald-500" : "bg-slate-400",
                )}
                aria-hidden
              />
              {filtersConfigured ? "Ready" : "Setup"}
            </span>
            {lastUpdated ? (
              <span className="rounded border border-slate-200/40 bg-slate-100 px-2 py-0.5 font-mono text-xs font-medium text-slate-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-400">
                {lastUpdated}
              </span>
            ) : null}
          </div>
        </div>
      </div>
    </header>
  );
}
