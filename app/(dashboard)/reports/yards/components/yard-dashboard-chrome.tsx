"use client";

import type { LucideIcon } from "lucide-react";

import { cn } from "@/lib/utils";

export const yardDashboardToolbarClass = cn(
  "flex min-h-[56px] flex-col gap-2 rounded-2xl border border-slate-200/80 bg-white px-3 py-2 shadow-[0_1px_3px_rgba(0,0,0,0.06)]",
  "md:flex-row md:items-center md:justify-between md:gap-4",
  "dark:border-neutral-800 dark:bg-neutral-950",
);

export const yardDashboardTabListClass =
  "flex w-full min-w-[260px] rounded-lg border border-slate-200/80 bg-slate-100 p-1 shadow-sm sm:w-auto sm:min-w-[300px] dark:border-neutral-800 dark:bg-neutral-900/80";

export function yardDashboardTabClass(isActive: boolean) {
  return cn(
    "flex h-8 flex-1 items-center justify-center gap-1.5 rounded-md px-2.5 text-xs font-medium whitespace-nowrap transition-all duration-150",
    isActive
      ? "bg-white font-semibold text-[#008f68] shadow-sm dark:bg-neutral-950 dark:text-emerald-400"
      : "text-slate-500 hover:text-slate-800 dark:text-neutral-400 dark:hover:text-neutral-200",
  );
}

export function yardDashboardTabIconClass(isActive: boolean) {
  return cn(
    "size-3.5 shrink-0",
    isActive ? "text-[#008f68] dark:text-emerald-400" : "text-slate-400",
  );
}

export function YardContextChip({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div
      className="flex h-7 max-w-[260px] shrink-0 items-center gap-1.5 rounded-md border border-emerald-100 bg-emerald-50 pr-2 pl-2.5 text-xs font-medium text-emerald-800 dark:border-emerald-500/30 dark:bg-emerald-500/15 dark:text-emerald-100"
      title={`${label}: ${value}`}
    >
      <span className="shrink-0 text-[10px] font-semibold uppercase tracking-wide text-[#008f68] dark:text-emerald-300">
        {label}
      </span>
      <span className="truncate">{value}</span>
    </div>
  );
}

export function YardStatusBadge({
  label,
  tone = "ready",
}: {
  label: string;
  tone?: "ready" | "muted" | "loading";
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded border px-2 py-0.5 text-xs font-semibold",
        tone === "ready" &&
          "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-300",
        tone === "muted" &&
          "border-slate-200 bg-slate-50 text-slate-600 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-400",
        tone === "loading" &&
          "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-300",
      )}
    >
      <span
        className={cn(
          "size-1.5 rounded-full",
          tone === "ready" && "bg-emerald-500",
          tone === "muted" && "bg-slate-400",
          tone === "loading" && "animate-pulse bg-amber-500",
        )}
        aria-hidden
      />
      {label}
    </span>
  );
}

export type YardSegmentTab<T extends string> = {
  value: T;
  label: string;
  icon?: LucideIcon;
  count?: number;
};

export function YardSegmentedTabs<T extends string>({
  tabs,
  activeValue,
  onChange,
  ariaLabel,
  className,
  layout = "flex",
}: {
  tabs: YardSegmentTab<T>[];
  activeValue: T;
  onChange: (value: T) => void;
  ariaLabel: string;
  className?: string;
  layout?: "flex" | "grid";
}) {
  return (
    <div
      className={cn(
        yardDashboardTabListClass,
        layout === "grid" && "grid grid-cols-2 gap-1 sm:grid-cols-4",
        className,
      )}
      role="tablist"
      aria-label={ariaLabel}
    >
      {tabs.map((tab) => {
        const isActive = activeValue === tab.value;
        const Icon = tab.icon;
        return (
          <button
            key={tab.value}
            type="button"
            role="tab"
            aria-selected={isActive}
            onClick={() => onChange(tab.value)}
            className={cn(
              yardDashboardTabClass(isActive),
              layout === "grid" && "flex-none",
            )}
          >
            {Icon ? (
              <Icon className={yardDashboardTabIconClass(isActive)} aria-hidden />
            ) : null}
            <span>{tab.label}</span>
            {typeof tab.count === "number" ? (
              <span
                className={cn(
                  "rounded px-1 py-0 text-[10px] font-bold tabular-nums",
                  isActive
                    ? "bg-emerald-50 text-[#008f68] dark:bg-emerald-500/20 dark:text-emerald-300"
                    : "bg-slate-200/80 text-slate-600 dark:bg-neutral-800 dark:text-neutral-400",
                )}
              >
                {tab.count}
              </span>
            ) : null}
          </button>
        );
      })}
    </div>
  );
}
