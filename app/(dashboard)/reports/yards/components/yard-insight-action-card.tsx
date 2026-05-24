"use client";

import type { LucideIcon } from "lucide-react";
import { ChevronRight } from "lucide-react";

import { cn } from "@/lib/utils";
import {
  dashboardMetricTileClass,
} from "@/app/(dashboard)/dashboard/dashboard-theme";
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
  { tile: string; icon: string; link: string }
> = {
  emerald: {
    tile: "border-emerald-100 bg-emerald-50/50 text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-200",
    icon: "text-[#008f68]",
    link: "text-[#008f68] dark:text-emerald-300",
  },
  sky: {
    tile: "border-sky-100 bg-sky-50/50 text-sky-700 dark:border-sky-500/30 dark:bg-sky-500/10 dark:text-sky-200",
    icon: "text-sky-600 dark:text-sky-400",
    link: "text-sky-600 dark:text-sky-400",
  },
  amber: {
    tile: "border-amber-100 bg-amber-50/50 text-amber-700 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-200",
    icon: "text-amber-600 dark:text-amber-400",
    link: "text-amber-600 dark:text-amber-400",
  },
  rose: {
    tile: "border-rose-100 bg-rose-50/50 text-rose-700 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-200",
    icon: "text-rose-600 dark:text-rose-400",
    link: "text-rose-600 dark:text-rose-400",
  },
  indigo: {
    tile: "border-indigo-100 bg-indigo-50/50 text-indigo-700 dark:border-indigo-500/30 dark:bg-indigo-500/10 dark:text-indigo-200",
    icon: "text-indigo-600 dark:text-indigo-400",
    link: "text-indigo-600 dark:text-indigo-400",
  },
  slate: {
    tile: "border-slate-100 bg-slate-50/60 text-slate-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200",
    icon: "text-slate-500 dark:text-slate-400",
    link: "text-slate-600 dark:text-slate-400",
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
        "group flex w-full gap-2.5 py-2.5 text-left transition-colors hover:brightness-[0.98] dark:hover:brightness-110",
        styles.tile,
      )}
    >
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white/60 dark:bg-slate-950/40">
        <Icon className={cn("h-3.5 w-3.5", styles.icon)} aria-hidden />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-[9px] font-semibold uppercase leading-tight tracking-wide">
          {label}
        </p>
        <div className="mt-0.5 flex flex-wrap items-baseline gap-x-2 gap-y-0">
          <span className="text-lg font-bold leading-none tabular-nums sm:text-xl">
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
