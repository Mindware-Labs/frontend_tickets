import { AlertCircle, ArrowRight, CheckCircle2, Clock3 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  dashboardPanelBodyClass,
  dashboardPanelClass,
  dashboardPanelHeaderClass,
} from "@/app/(dashboard)/dashboard/dashboard-theme";
import { cn } from "@/lib/utils";
import type { AgentDashboardData } from "./agent-dashboard-types";

type AgentActionPanelProps = {
  data: AgentDashboardData;
};

export function AgentActionPanel({ data }: AgentActionPanelProps) {
  const pending =
    data.agentKpis.pendingFollowupTickets +
    data.agentKpis.overdueTickets +
    data.kpis.pendingActions;
  const isClear = pending === 0;

  return (
    <section className={dashboardPanelClass}>
      <div className={cn(dashboardPanelHeaderClass, "items-center")}>
        <div className="flex min-w-0 items-center gap-2">
          <span
            className={cn(
              "inline-flex size-8 items-center justify-center rounded-lg border",
              isClear
                ? "border-[#008f68]/20 bg-[#f0faf5] text-[#006b4f] dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-300"
                : "border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-300",
            )}
          >
            {isClear ? (
              <CheckCircle2 className="size-4" aria-hidden />
            ) : (
              <AlertCircle className="size-4" aria-hidden />
            )}
          </span>
          <div className="min-w-0">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-400">
              Shift focus
            </p>
            <h2 className="truncate text-[14px] font-bold text-slate-900 dark:text-neutral-100">
              {isClear ? "No urgent follow-up" : `${pending} items need attention`}
            </h2>
          </div>
        </div>
        <Button asChild size="sm" className="h-8 bg-[#008f68] text-xs hover:bg-[#007a5a]">
          <a href="/calls?tab=tickets">
            Open queue
            <ArrowRight className="ml-1 size-3.5" aria-hidden />
          </a>
        </Button>
      </div>
      <div className={cn(dashboardPanelBodyClass, "grid gap-2 sm:grid-cols-3")}>
        <ActionCount
          label="Pending follow-up"
          value={data.agentKpis.pendingFollowupTickets}
          tone={data.agentKpis.pendingFollowupTickets > 0 ? "amber" : "slate"}
        />
        <ActionCount
          label="Overdue tickets"
          value={data.agentKpis.overdueTickets}
          tone={data.agentKpis.overdueTickets > 0 ? "rose" : "slate"}
        />
        <ActionCount
          label="High priority"
          value={data.kpis.pendingActions}
          tone={data.kpis.pendingActions > 0 ? "rose" : "slate"}
        />
      </div>
    </section>
  );
}

function ActionCount({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone: "amber" | "rose" | "slate";
}) {
  return (
    <div
      className={cn(
        "flex items-center justify-between rounded-xl border px-3 py-2",
        tone === "rose" &&
          "border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-300",
        tone === "amber" &&
          "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-300",
        tone === "slate" &&
          "border-slate-200 bg-slate-50 text-slate-600 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-300",
      )}
    >
      <span className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide">
        <Clock3 className="size-3.5" aria-hidden />
        {label}
      </span>
      <span className="text-lg font-bold tabular-nums">{value}</span>
    </div>
  );
}
