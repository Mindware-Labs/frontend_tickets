"use client";

import type { LucideIcon } from "lucide-react";
import { ChevronRight } from "lucide-react";

import { cn } from "@/lib/utils";
import { dashboardMetricTileClass } from "@/app/(dashboard)/dashboard/dashboard-theme";
import type { Tone } from "@/app/(dashboard)/dashboard/types";

type InsightActionCardProps = {
  label: string;
  value: number | string;
  onClick: () => void;
  icon: LucideIcon;
  tone: Tone;
  primaryHint?: string;
  secondaryHint?: string;
};

const toneTile: Record<
  Tone,
  { icon: string; iconWrap: string; link: string; accent: string }
> = {
  emerald: {
    icon: "text-[#008f68]",
    iconWrap: "bg-[#f0faf5] dark:bg-emerald-500/10",
    link: "text-[#008f68] dark:text-emerald-300",
    accent: "bg-[#008f68]",
  },
  sky: {
    icon: "text-sky-600 dark:text-sky-400",
    iconWrap: "bg-sky-50 dark:bg-sky-500/10",
    link: "text-sky-600 dark:text-sky-400",
    accent: "bg-sky-500",
  },
  amber: {
    icon: "text-amber-600 dark:text-amber-400",
    iconWrap: "bg-amber-50 dark:bg-amber-500/10",
    link: "text-amber-600 dark:text-amber-400",
    accent: "bg-amber-500",
  },
  rose: {
    icon: "text-rose-600 dark:text-rose-400",
    iconWrap: "bg-rose-50 dark:bg-rose-500/10",
    link: "text-rose-600 dark:text-rose-400",
    accent: "bg-rose-500",
  },
  indigo: {
    icon: "text-indigo-600 dark:text-indigo-400",
    iconWrap: "bg-indigo-50 dark:bg-indigo-500/10",
    link: "text-indigo-600 dark:text-indigo-400",
    accent: "bg-indigo-500",
  },
  slate: {
    icon: "text-slate-500 dark:text-slate-400",
    iconWrap: "bg-slate-100 dark:bg-slate-900",
    link: "text-slate-600 dark:text-slate-400",
    accent: "bg-slate-400",
  },
};

export function InsightActionCard({
  label,
  value,
  onClick,
  icon: Icon,
  tone,
  primaryHint,
  secondaryHint,
}: InsightActionCardProps) {
  const styles = toneTile[tone];

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        dashboardMetricTileClass,
        "group relative flex min-h-[74px] w-full gap-2.5 overflow-hidden border-slate-200/80 bg-white py-2.5 text-left text-slate-900 transition-colors hover:border-slate-300 hover:bg-slate-50/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#008f68]/25 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100 dark:hover:bg-slate-900/60",
      )}
    >
      <span
        className={cn(
          "absolute inset-y-2 left-0 w-0.5 rounded-r-full",
          styles.accent,
        )}
        aria-hidden
      />
      <div
        className={cn(
          "ml-1 flex size-8 shrink-0 items-center justify-center rounded-lg",
          styles.iconWrap,
        )}
      >
        <Icon className={cn("size-3.5", styles.icon)} aria-hidden />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-[9px] font-semibold uppercase leading-tight tracking-wide text-slate-500 dark:text-slate-400">
          {label}
        </p>
        <div className="mt-0.5 flex flex-wrap items-baseline gap-x-2 gap-y-0">
          <span className="text-lg font-bold leading-none tabular-nums text-slate-900 sm:text-xl dark:text-slate-100">
            {value}
          </span>
          <span
            className={cn(
              "inline-flex items-center text-[10px] font-semibold group-hover:underline",
              styles.link,
            )}
          >
            View list
            <ChevronRight className="ml-0.5 size-3" aria-hidden />
          </span>
        </div>
        {primaryHint ? (
          <p className="mt-1 line-clamp-1 text-[10px] leading-snug text-slate-500 dark:text-slate-400">
            {primaryHint}
          </p>
        ) : null}
        {secondaryHint ? (
          <p className="line-clamp-1 text-[10px] leading-snug text-slate-400 dark:text-slate-500">
            {secondaryHint}
          </p>
        ) : null}
      </div>
      <ChevronRight
        className="size-4 shrink-0 self-center text-slate-400 opacity-0 transition-opacity group-hover:opacity-100"
        aria-hidden
      />
    </button>
  );
}
