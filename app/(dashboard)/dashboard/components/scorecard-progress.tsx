import { cn } from "@/lib/utils";

import type { ScorecardItem } from "../types";
import { StatusBadge } from "./status-badge";

export function ScorecardProgress({ item }: { item: ScorecardItem }) {
  return (
    <div className="space-y-2">
      <div className="grid gap-2 sm:grid-cols-[1fr_auto] sm:items-center">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
              {item.metric}
            </span>
            <StatusBadge tone="slate">{item.cadence}</StatusBadge>
          </div>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            Target: {item.target}
          </p>
        </div>
        <span className="text-sm font-semibold tabular-nums text-slate-950 dark:text-slate-50">
          {item.actual}
        </span>
      </div>
      <div className="h-2 rounded-full bg-slate-100 dark:bg-slate-900">
        <div
          className={cn(
            "h-2 rounded-full",
            item.score >= 90
              ? "bg-emerald-600"
              : item.score >= 80
                ? "bg-amber-500"
                : "bg-rose-600",
          )}
          style={{ width: `${item.score}%` }}
        />
      </div>
    </div>
  );
}
