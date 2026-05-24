"use client";

import {
  BarChart3,
  Building2,
  CalendarRange,
  SlidersHorizontal,
} from "lucide-react";

import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { dashboardCanvasClass } from "@/app/(dashboard)/dashboard/dashboard-theme";
import { cn } from "@/lib/utils";

type YardReportSetupEmptyStateProps = {
  onConfigure: () => void;
};

const setupItems = [
  {
    label: "Range",
    value: "Start and end dates",
    icon: CalendarRange,
  },
  {
    label: "Scope",
    value: "All yards or one yard",
    icon: Building2,
  },
  {
    label: "Output",
    value: "Cards and analytics",
    icon: BarChart3,
  },
];

export function YardReportSetupEmptyState({
  onConfigure,
}: YardReportSetupEmptyStateProps) {
  return (
    <div className={cn("min-h-[420px]", dashboardCanvasClass)}>
      <Empty className="min-h-[388px] gap-4 rounded-2xl border border-solid border-slate-200/80 bg-white px-4 py-6 shadow-[0_1px_3px_rgba(0,0,0,0.06)] dark:border-slate-800 dark:bg-slate-950 md:p-8">
        <EmptyHeader className="max-w-xl gap-2">
          <EmptyMedia
            variant="icon"
            className="mb-1 size-11 rounded-lg border border-emerald-100 bg-[#f0faf5] text-[#008f68] dark:border-emerald-500/25 dark:bg-emerald-500/10 dark:text-emerald-300"
          >
            <Building2 className="size-5" aria-hidden />
          </EmptyMedia>

          <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-400">
            Yard report setup
          </p>

          <EmptyTitle className="text-[15px] font-semibold text-slate-900 dark:text-slate-100">
            Configure report to view yards
          </EmptyTitle>

          <EmptyDescription className="max-w-md text-xs leading-5 text-slate-600 dark:text-slate-400">
            Select a date range to load all-yard cards. Add a specific yard
            when you need the detailed dashboard and exports.
          </EmptyDescription>
        </EmptyHeader>

        <EmptyContent className="max-w-2xl gap-3">
          <div className="grid w-full gap-2 sm:grid-cols-3">
            {setupItems.map((item) => {
              const Icon = item.icon;

              return (
                <div
                  key={item.label}
                  className="flex min-h-16 items-center gap-2 rounded-xl border border-slate-100 bg-slate-50/70 px-3 py-2 text-left dark:border-slate-800 dark:bg-slate-900/40"
                >
                  <Icon
                    className="size-3.5 shrink-0 text-[#008f68] dark:text-emerald-300"
                    aria-hidden
                  />
                  <div className="min-w-0">
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                      {item.label}
                    </p>
                    <p className="mt-0.5 text-xs font-medium text-slate-700 dark:text-slate-200">
                      {item.value}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="flex w-full flex-col items-center justify-between gap-3 rounded-xl border border-emerald-100 bg-emerald-50/60 px-3 py-2.5 sm:flex-row dark:border-emerald-500/25 dark:bg-emerald-500/10">
            <Badge
              variant="outline"
              className="border-emerald-200 bg-white/80 text-[10px] font-semibold uppercase tracking-wide text-emerald-800 dark:border-emerald-500/30 dark:bg-slate-950 dark:text-emerald-300"
            >
              Setup required
            </Badge>

            <Button
              type="button"
              size="sm"
              onClick={onConfigure}
              className="h-9 rounded-lg bg-[#008f68] px-3 text-xs font-semibold text-white shadow-sm hover:bg-[#007a5a] focus-visible:ring-[#008f68]/25"
            >
              <SlidersHorizontal data-icon="inline-start" aria-hidden />
              Configure Report
            </Button>
          </div>
        </EmptyContent>
      </Empty>
    </div>
  );
}
