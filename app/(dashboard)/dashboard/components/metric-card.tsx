import type { LucideIcon } from "lucide-react";

import { cn } from "@/lib/utils";

import { dashboardMetricTileClass } from "../dashboard-theme";
import type { Metric } from "../types";

const toneTile: Record<
  Metric["tone"],
  { tile: string; icon: string; trend: string }
> = {
  emerald: {
    tile: "border-emerald-100 bg-emerald-50/50 text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-200",
    icon: "text-[#008f68]",
    trend: "text-[#008f68] dark:text-emerald-300",
  },
  sky: {
    tile: "border-sky-100 bg-sky-50/50 text-sky-700 dark:border-sky-500/30 dark:bg-sky-500/10 dark:text-sky-200",
    icon: "text-sky-600 dark:text-sky-400",
    trend: "text-sky-600 dark:text-sky-400",
  },
  amber: {
    tile: "border-amber-100 bg-amber-50/50 text-amber-700 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-200",
    icon: "text-amber-600 dark:text-amber-400",
    trend: "text-amber-600 dark:text-amber-400",
  },
  rose: {
    tile: "border-rose-100 bg-rose-50/50 text-rose-700 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-200",
    icon: "text-rose-600 dark:text-rose-400",
    trend: "text-rose-600 dark:text-rose-400",
  },
  indigo: {
    tile: "border-indigo-100 bg-indigo-50/50 text-indigo-700 dark:border-indigo-500/30 dark:bg-indigo-500/10 dark:text-indigo-200",
    icon: "text-indigo-600 dark:text-indigo-400",
    trend: "text-indigo-600 dark:text-indigo-400",
  },
  slate: {
    tile: "border-slate-100 bg-slate-50/60 text-slate-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200",
    icon: "text-slate-500 dark:text-slate-400",
    trend: "text-slate-600 dark:text-slate-400",
  },
};

export function MetricCard({ metric }: { metric: Metric }) {
  const tone = toneTile[metric.tone];
  const Icon = metric.icon as LucideIcon;

  return (
    <div
      className={cn(
        dashboardMetricTileClass,
        "flex gap-2.5 py-2 sm:items-center",
        tone.tile,
      )}
    >
      <div
        className={cn(
          "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white/60 dark:bg-slate-950/40",
        )}
      >
        <Icon className={cn("h-3.5 w-3.5", tone.icon)} aria-hidden />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-[9px] font-semibold uppercase leading-tight tracking-wide">
          {metric.label}
        </p>
        <p className="mt-0.5 text-lg font-bold leading-none tabular-nums sm:text-xl">
          {metric.value}
        </p>
      </div>
      <div className="hidden min-w-0 max-w-[42%] flex-col gap-0 text-right text-[10px] leading-snug sm:flex">
        <span className="line-clamp-2 text-slate-500 dark:text-slate-400">
          {metric.detail}
        </span>
        <span className={cn("line-clamp-1 font-semibold", tone.trend)}>
          {metric.trend}
        </span>
      </div>
      <div className="min-w-0 flex-1 flex-col gap-0 text-[10px] leading-snug sm:hidden">
        <span className="line-clamp-1 text-slate-500 dark:text-slate-400">
          {metric.detail}
        </span>
        <span className={cn("line-clamp-1 font-semibold", tone.trend)}>
          {metric.trend}
        </span>
      </div>
    </div>
  );
}
