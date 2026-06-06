"use client";

import {
  AlertCircle,
  BarChart3,
  CalendarRange,
  CalendarX,
  CalendarDays,
  Megaphone,
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

type Props =
  | { mode: "no-campaign"; onConfigure: () => void; startDate?: never; endDate?: never }
  | { mode: "no-dates"; onConfigure: () => void; startDate?: never; endDate?: never }
  | { mode: "invalid-range"; onConfigure: () => void; startDate: string; endDate: string };

const setupItemsNoCampaign = [
  { label: "Campaign", value: "Select an active campaign", icon: Megaphone },
  { label: "Range", value: "Start and end dates", icon: CalendarRange },
  { label: "Output", value: "Analytics and exports", icon: BarChart3 },
];

const setupItemsNoDates = [
  { label: "Start date", value: "Beginning of the period", icon: CalendarRange },
  { label: "End date", value: "End of the period", icon: CalendarDays },
  { label: "Output", value: "Analytics and exports", icon: BarChart3 },
];

const setupItemsInvalidRange = [
  { label: "Start date", value: "Must be before end date", icon: CalendarRange },
  { label: "End date", value: "Must be after start date", icon: CalendarX },
  { label: "Action", value: "Correct and reapply filters", icon: SlidersHorizontal },
];

export function CampaignReportSetupEmptyState({ mode, onConfigure, startDate, endDate }: Props) {
  const isInvalid = mode === "invalid-range";
  const isNoCampaign = mode === "no-campaign";

  const setupItems = isInvalid
    ? setupItemsInvalidRange
    : isNoCampaign
    ? setupItemsNoCampaign
    : setupItemsNoDates;

  const mediaIcon = isInvalid ? (
    <AlertCircle className="size-5" aria-hidden />
  ) : isNoCampaign ? (
    <Megaphone className="size-5" aria-hidden />
  ) : (
    <CalendarDays className="size-5" aria-hidden />
  );

  const title = isInvalid
    ? "Date range invalid"
    : isNoCampaign
    ? "Configure a campaign report"
    : "Select a date range";

  const description = isInvalid
    ? `The start date (${startDate}) cannot be after the end date (${endDate}). Open Configure Report to correct the range.`
    : isNoCampaign
    ? "Select a campaign and date range to load analytics, cross-filters, customer matrix, and export actions."
    : "Choose a start and end date in Configure Report to load the campaign dashboard for the selected campaign.";

  const badgeLabel = isInvalid ? "Invalid range" : "Setup required";
  const badgeClass = isInvalid
    ? "border-amber-200 bg-white/80 text-[10px] font-semibold uppercase tracking-wide text-amber-800 dark:border-amber-500/30 dark:bg-slate-950 dark:text-amber-300"
    : "border-emerald-200 bg-white/80 text-[10px] font-semibold uppercase tracking-wide text-emerald-800 dark:border-emerald-500/30 dark:bg-slate-950 dark:text-emerald-300";
  const ctaBarClass = isInvalid
    ? "border-amber-100 bg-amber-50/60 dark:border-amber-500/25 dark:bg-amber-500/10"
    : "border-emerald-100 bg-emerald-50/60 dark:border-emerald-500/25 dark:bg-emerald-500/10";
  const mediaClass = isInvalid
    ? "mb-1 size-11 rounded-lg border border-amber-100 bg-amber-50 text-amber-600 dark:border-amber-500/25 dark:bg-amber-500/10 dark:text-amber-300"
    : "mb-1 size-11 rounded-lg border border-emerald-100 bg-[#f0faf5] text-[#008f68] dark:border-emerald-500/25 dark:bg-emerald-500/10 dark:text-emerald-300";
  const tileIconClass = isInvalid
    ? "size-3.5 shrink-0 text-amber-500 dark:text-amber-300"
    : "size-3.5 shrink-0 text-[#008f68] dark:text-emerald-300";

  return (
    <div className={cn("min-h-[420px]", dashboardCanvasClass)}>
      <Empty className="min-h-[388px] gap-4 rounded-2xl border border-solid border-slate-200/80 bg-white px-4 py-6 shadow-[0_1px_3px_rgba(0,0,0,0.06)] dark:border-slate-800 dark:bg-slate-950 md:p-8">
        <EmptyHeader className="max-w-xl gap-2">
          <EmptyMedia variant="icon" className={mediaClass}>
            {mediaIcon}
          </EmptyMedia>

          <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-400">
            Campaign report setup
          </p>

          <EmptyTitle className="text-[15px] font-semibold text-slate-900 dark:text-slate-100">
            {title}
          </EmptyTitle>

          <EmptyDescription className="max-w-md text-xs leading-5 text-slate-600 dark:text-slate-400">
            {description}
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
                  <Icon className={tileIconClass} aria-hidden />
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

          <div className={cn("flex w-full flex-col items-center justify-between gap-3 rounded-xl border px-3 py-2.5 sm:flex-row", ctaBarClass)}>
            <Badge variant="outline" className={badgeClass}>
              {badgeLabel}
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
