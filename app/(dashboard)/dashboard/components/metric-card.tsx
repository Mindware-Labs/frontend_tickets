import type { LucideIcon } from "lucide-react";

import { cn } from "@/lib/utils";

import type { Metric } from "../types";

const toneAccent: Record<
  Metric["tone"],
  { wrap: string; icon: string; trend: string }
> = {
  emerald: {
    wrap: "bg-[#e2fae9] border-[#c5efd4]",
    icon: "text-[#008f68]",
    trend: "text-[#008f68]",
  },
  sky: {
    wrap: "bg-sky-50 border-sky-100 dark:bg-sky-950/40 dark:border-sky-900",
    icon: "text-sky-600 dark:text-sky-400",
    trend: "text-sky-600 dark:text-sky-400",
  },
  amber: {
    wrap: "bg-amber-50 border-amber-100 dark:bg-amber-950/40 dark:border-amber-900",
    icon: "text-amber-600 dark:text-amber-400",
    trend: "text-amber-600 dark:text-amber-400",
  },
  rose: {
    wrap: "bg-rose-50 border-rose-100 dark:bg-rose-950/40 dark:border-rose-900",
    icon: "text-rose-600 dark:text-rose-400",
    trend: "text-rose-600 dark:text-rose-400",
  },
  indigo: {
    wrap: "bg-indigo-50 border-indigo-100 dark:bg-indigo-950/40 dark:border-indigo-900",
    icon: "text-indigo-600 dark:text-indigo-400",
    trend: "text-indigo-600 dark:text-indigo-400",
  },
  slate: {
    wrap: "bg-muted/50 border-border",
    icon: "text-muted-foreground",
    trend: "text-muted-foreground",
  },
};

export function MetricCard({ metric }: { metric: Metric }) {
  const accent = toneAccent[metric.tone];
  const Icon = metric.icon as LucideIcon;

  return (
    <div className="rounded-xl border border-border bg-card p-4 shadow-sm transition-shadow hover:shadow-md">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[12.5px] font-medium text-muted-foreground">
            {metric.label}
          </p>
          <p className="mt-1.5 text-2xl font-bold tracking-tight text-foreground">
            {metric.value}
          </p>
        </div>
        <span
          className={cn(
            "flex size-10 shrink-0 items-center justify-center rounded-xl border",
            accent.wrap,
          )}
        >
          <Icon className={cn("size-[18px]", accent.icon)} aria-hidden />
        </span>
      </div>
      <div className="mt-3 flex flex-col gap-0.5 text-[12.5px]">
        <span className="text-muted-foreground">{metric.detail}</span>
        <span className={cn("font-medium", accent.trend)}>{metric.trend}</span>
      </div>
    </div>
  );
}
