import { BarChart3 } from "lucide-react";

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
          ? "flex items-center justify-center rounded-xl border border-dashed border-border bg-muted/20 px-4 py-8 text-center"
          : "flex min-h-[220px] flex-col items-center justify-center rounded-xl border border-dashed border-border bg-muted/20 px-6 py-10 text-center"
      }
    >
      <BarChart3
        className="mb-2 h-8 w-8 text-muted-foreground/60"
        aria-hidden
      />
      <p className="text-sm font-medium text-foreground">{message}</p>
      <p className="mt-1 max-w-sm text-xs text-muted-foreground">
        Metrics load from live APIs when calls, tickets, SMS, or wallboard data
        exist for the selected period.
      </p>
    </div>
  );
}
