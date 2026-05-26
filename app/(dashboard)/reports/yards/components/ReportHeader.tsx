"use client";

import {
  Building2,
  ClipboardList,
  Download,
  FileSpreadsheet,
  Filter,
  LayoutGrid,
  Loader2,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { YardContextChip, yardDashboardToolbarClass } from "./yard-dashboard-chrome";
import { YardFilterTrigger } from "./yard-filter-bar";
import type { Yard } from "./types";

type ReportHeaderProps = {
  selectedYard: Yard | null;
  startDate: string;
  endDate: string;
  canExport: boolean;
  canViewTickets: boolean;
  lastUpdated: string | null;
  onOpenFilters: () => void;
  onViewAllTickets: () => void;
  onExportPDF: () => void;
  onExportExcel: () => void;
  showCrossFilters?: boolean;
  isExportingPdf?: boolean;
  isExportingExcel?: boolean;
};

export function ReportHeader({
  selectedYard,
  startDate,
  endDate,
  canExport,
  canViewTickets,
  onOpenFilters,
  onViewAllTickets,
  onExportPDF,
  onExportExcel,
  showCrossFilters = false,
  isExportingPdf = false,
  isExportingExcel = false,
}: ReportHeaderProps) {
  const hasDateRange = Boolean(startDate && endDate);
  const hasYardDetail = Boolean(selectedYard);
  const filtersConfigured = hasDateRange && hasYardDetail;

  return (
    <header className="shrink-0">
      <div className={yardDashboardToolbarClass}>
        <div className="flex min-w-0 flex-1 flex-wrap items-center gap-2 md:gap-3">
          <div className="flex min-w-0 items-center gap-2">
            {hasYardDetail ? (
              <Building2
                className="size-4 shrink-0 text-[#008f68] dark:text-emerald-400"
                aria-hidden
              />
            ) : (
              <LayoutGrid
                className="size-4 shrink-0 text-[#008f68] dark:text-emerald-400"
                aria-hidden
              />
            )}
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-slate-900 dark:text-slate-100">
                {hasYardDetail ? selectedYard?.name : "All yards"}
              </p>
              <p className="text-[10px] font-medium uppercase tracking-wide text-slate-400">
                {hasYardDetail ? "Yard report" : "Overview"}
              </p>
            </div>
          </div>

          {filtersConfigured ? (
            <div className="flex min-w-0 flex-1 flex-wrap items-center gap-1.5">
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
                  disabled={isExportingPdf}
                  aria-busy={isExportingPdf}
                  className={cn(
                    "flex h-8 items-center gap-1.5 rounded-lg bg-white px-3 text-xs font-medium text-slate-600 shadow-sm transition-colors hover:bg-slate-50 dark:bg-slate-950 dark:text-slate-300",
                    isExportingPdf && "cursor-not-allowed opacity-70",
                  )}
                >
                  {isExportingPdf ? (
                    <Loader2 className="size-3.5 animate-spin" aria-hidden />
                  ) : (
                    <Download className="size-3.5" aria-hidden />
                  )}
                  <span>{isExportingPdf ? "Preparing…" : "PDF"}</span>
                </button>
                <button
                  type="button"
                  onClick={onExportExcel}
                  disabled={isExportingExcel}
                  aria-busy={isExportingExcel}
                  className={cn(
                    "flex h-8 items-center gap-1.5 rounded-lg bg-white px-3 text-xs font-medium text-slate-600 shadow-sm transition-colors hover:bg-slate-50 dark:bg-slate-950 dark:text-slate-300",
                    isExportingExcel && "cursor-not-allowed opacity-70",
                  )}
                >
                  {isExportingExcel ? (
                    <Loader2 className="size-3.5 animate-spin" aria-hidden />
                  ) : (
                    <FileSpreadsheet className="size-3.5" aria-hidden />
                  )}
                  <span>{isExportingExcel ? "Preparing…" : "Excel"}</span>
                </button>
              </>
            ) : null}
          </div>

        </div>
      </div>
    </header>
  );
}
