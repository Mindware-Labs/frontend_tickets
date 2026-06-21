import { cn } from "@/lib/utils";

import { DASHBOARD_CHART_HEIGHT_CLASS } from "../dashboard-theme";
import type { ScorecardItem } from "../types";
import { StatusBadge } from "./status-badge";

export function ScorecardProgress({ item }: { item: ScorecardItem }) {
  const barWidth = Math.min(100, Math.max(0, item.progress ?? item.score));

  return (
    <div className="rounded-xl border border-slate-100 bg-slate-50/50 px-3 py-2 dark:border-neutral-800 dark:bg-neutral-900/40">
      <div className="space-y-1">
        <div className="grid gap-1 sm:grid-cols-[1fr_auto] sm:items-center">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-[11px] font-semibold text-slate-800 dark:text-neutral-100">
                {item.metric}
              </span>
              <StatusBadge tone="slate">{item.cadence}</StatusBadge>
            </div>
            <p className="line-clamp-1 text-[10px] text-slate-500 dark:text-neutral-400">
              Target: {item.target}
            </p>
          </div>
          <span className="text-[11px] font-bold tabular-nums text-slate-800 dark:text-neutral-100">
            {item.actual}
          </span>
        </div>
        <div className="h-1.5 rounded-full bg-slate-100 dark:bg-neutral-800">
          <div
            className={cn(
              "h-1.5 rounded-full transition-[width]",
              item.score >= 90
                ? "bg-[#008f68]"
                : item.score >= 80
                  ? "bg-amber-500"
                  : "bg-rose-600",
            )}
            style={{ width: `${barWidth}%` }}
          />
        </div>
      </div>
    </div>
  );
}

export function ScorecardStack({
  items,
}: {
  items: ScorecardItem[];
}) {
  return (
    <div
      className={cn(
        DASHBOARD_CHART_HEIGHT_CLASS,
        "space-y-2 overflow-y-auto pr-0.5",
      )}
    >
      {items.map((item) => (
        <ScorecardProgress key={item.metric} item={item} />
      ))}
    </div>
  );
}
