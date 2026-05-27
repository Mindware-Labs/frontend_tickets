import { Activity, CheckCircle2, ClipboardList, Phone, Ticket, XCircle } from "lucide-react";
import {
  dashboardPanelBodyClass,
  dashboardPanelClass,
  dashboardPanelHeaderClass,
  dashboardSectionLabelClass,
} from "@/app/(dashboard)/dashboard/dashboard-theme";
import { cn } from "@/lib/utils";
import type { AgentDashboardData } from "./agent-dashboard-types";

type AgentPerformancePanelProps = {
  data: AgentDashboardData;
};

export function AgentPerformancePanel({ data }: AgentPerformancePanelProps) {
  const totalActivity = Math.max(
    data.summary?.totalActivity ??
      data.agentKpis.totalCalls +
        data.agentKpis.totalTickets +
        data.agentKpis.totalManualRecords,
    0,
  );
  const callPct = percentOf(data.agentKpis.totalCalls, totalActivity);
  const ticketPct = percentOf(data.agentKpis.totalTickets, totalActivity);
  const recordPct = Math.max(0, 100 - callPct - ticketPct);

  const qualityRows = [
    {
      label: "Ticket resolution",
      value: data.agentKpis.resolutionRate,
      detail: `${data.agentKpis.resolvedTickets}/${data.agentKpis.totalTickets} closed`,
      tone: data.agentKpis.resolutionRate >= 80 ? "emerald" : data.agentKpis.resolutionRate >= 50 ? "amber" : "rose",
    },
    {
      label: "Manual completion",
      value: data.agentKpis.completionRate,
      detail: `${data.agentKpis.resolvedManualRecords}/${data.agentKpis.totalManualRecords} completed`,
      tone: data.agentKpis.completionRate >= 80 ? "emerald" : data.agentKpis.completionRate >= 50 ? "amber" : "rose",
    },
  ] as const;

  return (
    <div className="grid gap-2 xl:grid-cols-[0.95fr_1.05fr]">
      <section className={dashboardPanelClass}>
        <div className={dashboardPanelHeaderClass}>
          <div>
            <p className={dashboardSectionLabelClass}>Activity mix</p>
            <h2 className="text-[14px] font-bold text-slate-900 dark:text-slate-100">
              Where your work is landing
            </h2>
          </div>
          <span className="rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-[10px] font-bold uppercase text-slate-500">
            {totalActivity.toLocaleString()} total
          </span>
        </div>
        <div className={cn(dashboardPanelBodyClass, "space-y-3")}>
          <div className="overflow-hidden rounded-full border border-slate-200 bg-slate-100 p-0.5 dark:border-slate-800 dark:bg-slate-900">
            <div className="flex h-4 overflow-hidden rounded-full">
              <span className="bg-[#008f68]" style={{ width: `${callPct}%` }} />
              <span className="bg-sky-500" style={{ width: `${ticketPct}%` }} />
              <span className="bg-slate-500" style={{ width: `${recordPct}%` }} />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-2">
            <MixTile icon={Phone} label="Calls" value={data.agentKpis.totalCalls} pct={callPct} tone="emerald" />
            <MixTile icon={Ticket} label="Tickets" value={data.agentKpis.totalTickets} pct={ticketPct} tone="sky" />
            <MixTile icon={ClipboardList} label="Records" value={data.agentKpis.totalManualRecords} pct={recordPct} tone="slate" />
          </div>
        </div>
      </section>

      <section className={dashboardPanelClass}>
        <div className={dashboardPanelHeaderClass}>
          <div>
            <p className={dashboardSectionLabelClass}>Quality signals</p>
            <h2 className="text-[14px] font-bold text-slate-900 dark:text-slate-100">
              Close-rate snapshot
            </h2>
          </div>
          <Activity className="size-4 text-[#008f68]" aria-hidden />
        </div>
        <div className={cn(dashboardPanelBodyClass, "space-y-2.5")}>
          {qualityRows.map((row) => (
            <QualityRow key={row.label} {...row} />
          ))}
          <div className="grid grid-cols-2 gap-2 pt-1">
            <SignalTile
              icon={XCircle}
              label="Missed calls"
              value={data.agentKpis.missedCalls}
              tone={data.agentKpis.missedCalls > 0 ? "rose" : "emerald"}
            />
            <SignalTile
              icon={CheckCircle2}
              label="Resolved calls"
              value={data.agentKpis.resolvedCalls}
              tone="emerald"
            />
          </div>
        </div>
      </section>
    </div>
  );
}

function MixTile({
  icon: Icon,
  label,
  value,
  pct,
  tone,
}: {
  icon: typeof Phone;
  label: string;
  value: number;
  pct: number;
  tone: "emerald" | "sky" | "slate";
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white px-2.5 py-2 dark:border-slate-800 dark:bg-slate-950">
      <div className="flex items-center justify-between gap-2">
        <span
          className={cn(
            "inline-flex size-7 items-center justify-center rounded-lg",
            tone === "emerald" && "bg-[#f0faf5] text-[#008f68]",
            tone === "sky" && "bg-sky-50 text-sky-700",
            tone === "slate" && "bg-slate-100 text-slate-600",
          )}
        >
          <Icon className="size-3.5" aria-hidden />
        </span>
        <span className="text-[10px] font-bold text-slate-400 tabular-nums">{pct}%</span>
      </div>
      <p className="mt-1 text-[9px] font-semibold uppercase tracking-widest text-slate-400">{label}</p>
      <p className="text-lg font-bold text-slate-900 dark:text-slate-100 tabular-nums">{value}</p>
    </div>
  );
}

function QualityRow({
  label,
  value,
  detail,
  tone,
}: {
  label: string;
  value: number;
  detail: string;
  tone: "emerald" | "amber" | "rose";
}) {
  return (
    <div>
      <div className="mb-1 flex items-center justify-between gap-3">
        <span className="text-[11px] font-semibold text-slate-600 dark:text-slate-300">{label}</span>
        <span className="text-[11px] font-bold text-slate-900 dark:text-slate-100 tabular-nums">{value}%</span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-900">
        <div
          className={cn(
            "h-full rounded-full",
            tone === "emerald" && "bg-[#008f68]",
            tone === "amber" && "bg-amber-500",
            tone === "rose" && "bg-rose-500",
          )}
          style={{ width: `${Math.min(Math.max(value, 0), 100)}%` }}
        />
      </div>
      <p className="mt-1 text-[10px] font-medium text-slate-400">{detail}</p>
    </div>
  );
}

function SignalTile({
  icon: Icon,
  label,
  value,
  tone,
}: {
  icon: typeof CheckCircle2;
  label: string;
  value: number;
  tone: "emerald" | "rose";
}) {
  return (
    <div
      className={cn(
        "flex items-center justify-between rounded-xl border px-3 py-2",
        tone === "emerald" &&
          "border-[#008f68]/20 bg-[#f0faf5] text-[#006b4f] dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-300",
        tone === "rose" &&
          "border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-300",
      )}
    >
      <span className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wide">
        <Icon className="size-3.5" aria-hidden />
        {label}
      </span>
      <span className="text-lg font-bold tabular-nums">{value}</span>
    </div>
  );
}

function percentOf(value: number, total: number): number {
  if (!total) return 0;
  return Math.round((value / total) * 100);
}
