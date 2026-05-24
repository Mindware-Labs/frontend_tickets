import type { LucideIcon } from "lucide-react";

import { cn } from "@/lib/utils";

import { dashboardMetricTileClass } from "../dashboard-theme";
import type { Metric } from "../types";

const toneTile: Record<
  Metric["tone"],
  {
    tile: string;
    icon: string;
    iconWrap: string;
    trend: string;
    accent: string;
  }
> = {
  emerald: {
    tile: "border-slate-200/80 bg-white text-slate-900 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100",
    icon: "text-[#008f68]",
    iconWrap: "bg-[#f0faf5] dark:bg-emerald-500/10",
    trend: "text-[#008f68] dark:text-emerald-300",
    accent: "bg-[#008f68]",
  },
  sky: {
    tile: "border-slate-200/80 bg-white text-slate-900 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100",
    icon: "text-sky-600 dark:text-sky-400",
    iconWrap: "bg-sky-50 dark:bg-sky-500/10",
    trend: "text-sky-600 dark:text-sky-400",
    accent: "bg-sky-500",
  },
  amber: {
    tile: "border-slate-200/80 bg-white text-slate-900 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100",
    icon: "text-amber-600 dark:text-amber-400",
    iconWrap: "bg-amber-50 dark:bg-amber-500/10",
    trend: "text-amber-600 dark:text-amber-400",
    accent: "bg-amber-500",
  },
  rose: {
    tile: "border-slate-200/80 bg-white text-slate-900 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100",
    icon: "text-rose-600 dark:text-rose-400",
    iconWrap: "bg-rose-50 dark:bg-rose-500/10",
    trend: "text-rose-600 dark:text-rose-400",
    accent: "bg-rose-500",
  },
  indigo: {
    tile: "border-slate-200/80 bg-white text-slate-900 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100",
    icon: "text-indigo-600 dark:text-indigo-400",
    iconWrap: "bg-indigo-50 dark:bg-indigo-500/10",
    trend: "text-indigo-600 dark:text-indigo-400",
    accent: "bg-indigo-500",
  },
  slate: {
    tile: "border-slate-200/80 bg-white text-slate-900 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100",
    icon: "text-slate-500 dark:text-slate-400",
    iconWrap: "bg-slate-100 dark:bg-slate-900",
    trend: "text-slate-600 dark:text-slate-400",
    accent: "bg-slate-400",
  },
};

export function MetricCard({ metric }: { metric: Metric }) {
  const tone = toneTile[metric.tone];
  const Icon = metric.icon as LucideIcon;

  return (
    <div
      className={cn(
        dashboardMetricTileClass,
        "relative flex gap-2.5 overflow-hidden py-2 sm:items-center",
        tone.tile,
      )}
    >
      <span
        className={cn(
          "absolute inset-y-2 left-0 w-0.5 rounded-r-full",
          tone.accent,
        )}
        aria-hidden
      />
      <div
        className={cn(
          "ml-1 flex size-8 shrink-0 items-center justify-center rounded-lg",
          tone.iconWrap,
        )}
      >
        <Icon className={cn("size-3.5", tone.icon)} aria-hidden />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-[9px] font-semibold uppercase leading-tight tracking-wide text-slate-500 dark:text-slate-400">
          {metric.label}
        </p>
        <p className="mt-0.5 text-lg font-bold leading-none tabular-nums text-slate-900 sm:text-xl dark:text-slate-100">
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
