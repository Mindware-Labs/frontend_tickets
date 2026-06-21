"use client";

import { cn } from "@/lib/utils";
import { AlertTriangle, CheckCircle2, MinusCircle } from "lucide-react";

import type { ScorecardItem } from "../types";
import { StatusBadge } from "./status-badge";

function scoreStatus(score: number): {
  label: string;
  tone: "emerald" | "amber" | "rose";
  Icon: typeof CheckCircle2;
} {
  if (score >= 90) {
    return { label: "On track", tone: "emerald", Icon: CheckCircle2 };
  }
  if (score >= 75) {
    return { label: "Watch", tone: "amber", Icon: MinusCircle };
  }
  return { label: "Needs attention", tone: "rose", Icon: AlertTriangle };
}

function ScorecardCard({ item }: { item: ScorecardItem }) {
  const status = scoreStatus(item.score);
  const StatusIcon = status.Icon;
  const fill = Math.min(100, Math.max(0, item.progress ?? item.score));

  return (
    <article className="flex h-full min-h-0 flex-col rounded-lg border border-slate-100 bg-slate-50/50 p-2 dark:border-neutral-800 dark:bg-neutral-900/40">
      <div className="flex items-start justify-between gap-1.5">
        <div className="min-w-0 flex-1">
          <h4 className="text-[11px] font-semibold leading-tight text-slate-800 dark:text-neutral-100">
            {item.metric}
          </h4>
          <p className="mt-0.5 line-clamp-1 text-[9px] text-slate-500 dark:text-neutral-400">
            Goal · {item.target}
          </p>
        </div>
        <StatusBadge tone={status.tone} className="shrink-0 text-[9px]">
          <StatusIcon className="mr-0.5 inline size-2.5" aria-hidden />
          <span className="hidden sm:inline">{status.label}</span>
        </StatusBadge>
      </div>

      <div className="mt-2 flex items-end justify-between gap-2">
        <div className="min-w-0">
          <p className="text-[9px] font-semibold uppercase tracking-wide text-slate-400">
            Actual
          </p>
          <p className="truncate text-base font-bold tabular-nums text-slate-900 dark:text-neutral-50">
            {item.actual}
          </p>
        </div>
        <div className="shrink-0 text-right">
          <p className="text-[9px] font-semibold uppercase tracking-wide text-slate-400">
            Health
          </p>
          <p
            className={cn(
              "text-base font-bold tabular-nums",
              status.tone === "emerald" && "text-[#008f68]",
              status.tone === "amber" && "text-amber-600",
              status.tone === "rose" && "text-rose-600",
            )}
          >
            {item.score}%
          </p>
        </div>
      </div>

      <div className="mt-auto pt-2">
        <div className="mb-0.5 flex justify-between text-[9px] text-slate-500">
          <span>{item.cadence}</span>
          <span className="tabular-nums">{fill}%</span>
        </div>
        <div className="h-1.5 overflow-hidden rounded-full bg-slate-200/80 dark:bg-neutral-800">
          <div
            className={cn(
              "h-1.5 rounded-full transition-[width]",
              status.tone === "emerald" && "bg-[#008f68]",
              status.tone === "amber" && "bg-amber-500",
              status.tone === "rose" && "bg-rose-600",
            )}
            style={{ width: `${fill}%` }}
          />
        </div>
      </div>
    </article>
  );
}

export function KpiScorecardGrid({ items }: { items: ScorecardItem[] }) {
  return (
    <div
      className={cn(
        "grid h-full min-h-[180px] grid-cols-2 gap-1.5",
        "lg:grid-cols-3 lg:grid-rows-2",
      )}
    >
      {items.map((item) => (
        <ScorecardCard key={item.metric} item={item} />
      ))}
    </div>
  );
}
