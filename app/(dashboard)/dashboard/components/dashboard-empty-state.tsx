import { BarChart3 } from "lucide-react";

import { cn } from "@/lib/utils";

export function DashboardEmptyState({
  message = "No data for this period yet.",
  compact = false,
}: {
  message?: string;
  compact?: boolean;
}) {
  return (
    <div
      className={
        compact
          ? "flex h-full min-h-[120px] flex-col items-center justify-center rounded-xl border border-dashed border-slate-200 bg-slate-50/80 px-3 py-4 text-center dark:border-neutral-700 dark:bg-neutral-900/40"
          : "flex min-h-[200px] flex-col items-center justify-center rounded-xl border border-dashed border-slate-200 bg-slate-50/80 px-4 py-8 text-center dark:border-neutral-700 dark:bg-neutral-900/40"
      }
    >
      <BarChart3
        className={compact ? "mb-1 h-6 w-6 text-[#008f68]/50" : "mb-2 h-8 w-8 text-[#008f68]/50"}
        aria-hidden
      />
      <p className={compact ? "text-xs font-medium text-foreground" : "text-sm font-medium text-foreground"}>
        {message}
      </p>
      <p className={cn("mt-1 max-w-sm text-muted-foreground", compact ? "text-[10px]" : "text-xs")}>
        Metrics load from live APIs when calls, tickets, SMS, or wallboard data
        exist for the selected period.
      </p>
    </div>
  );
}
