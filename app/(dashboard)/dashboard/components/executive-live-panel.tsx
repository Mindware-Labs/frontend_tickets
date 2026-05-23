"use client";

import {
  Headphones,
  PhoneCall,
  PhoneIncoming,
  Users,
  AlertTriangle,
} from "lucide-react";

import { cn } from "@/lib/utils";

import type { ExecutiveLiveSnapshot } from "../dashboard-types";
import { toneClasses } from "../dashboard-theme";
import { DashboardEmptyState } from "./dashboard-empty-state";
import { StatusBadge } from "./status-badge";

function StatBlock({
  label,
  value,
  sub,
  tone = "slate",
}: {
  label: string;
  value: string;
  sub?: string;
  tone?: keyof typeof toneClasses;
}) {
  return (
    <div className="rounded-lg border border-slate-100 bg-slate-50/80 px-3 py-2 dark:border-slate-800 dark:bg-slate-900/50">
      <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
        {label}
      </p>
      <p
        className={cn(
          "mt-0.5 text-lg font-bold tabular-nums",
          tone === "emerald" && "text-[#008f68]",
          tone === "rose" && "text-rose-600",
          tone === "amber" && "text-amber-600",
          tone === "sky" && "text-sky-600",
          tone === "slate" && "text-slate-800 dark:text-slate-100",
        )}
      >
        {value}
      </p>
      {sub ? (
        <p className="mt-0.5 text-[10px] text-slate-500 dark:text-slate-400">{sub}</p>
      ) : null}
    </div>
  );
}

export function ExecutiveLivePanel({
  snapshot,
}: {
  snapshot: ExecutiveLiveSnapshot;
}) {
  const hasLiveData =
    snapshot.calls.active +
      snapshot.calls.queued +
      snapshot.calls.ringing +
      snapshot.agents.total >
    0;

  return (
    <div className="space-y-3">
      <p className="text-[10px] text-slate-500 dark:text-slate-400">
        Live call center and ticket workload · {snapshot.periodLabel}
      </p>

      {!hasLiveData ? (
        <DashboardEmptyState
          message="Live wallboard data is not available yet. Refresh or check Aircall sync."
          compact
        />
      ) : null}

      <div className="grid gap-2 sm:grid-cols-3">
        <StatBlock
          label="On calls now"
          value={String(snapshot.calls.active)}
          sub={`${snapshot.calls.ringing} ringing`}
          tone="emerald"
        />
        <StatBlock
          label="In queue"
          value={String(snapshot.calls.queued)}
          sub={`Longest · ${snapshot.wait.longestLabel}`}
          tone={snapshot.calls.queued ? "amber" : "slate"}
        />
        <StatBlock
          label="Avg answer time"
          value={snapshot.wait.avgLabel}
          sub="Answered calls in period"
          tone="sky"
        />
      </div>

      <div className="grid gap-2 sm:grid-cols-2">
        <div className="rounded-xl border border-slate-100 p-3 dark:border-slate-800">
          <div className="mb-2 flex items-center gap-2">
            <Users className="size-4 text-[#008f68]" aria-hidden />
            <h4 className="text-[12px] font-semibold text-slate-800 dark:text-slate-100">
              Agent availability
            </h4>
          </div>
          <div className="grid grid-cols-3 gap-2 text-center">
            <div>
              <p className="text-lg font-bold text-[#008f68] tabular-nums">
                {snapshot.agents.available}
              </p>
              <p className="text-[10px] text-slate-500">Available</p>
            </div>
            <div>
              <p className="text-lg font-bold text-amber-600 tabular-nums">
                {snapshot.agents.unavailable}
              </p>
              <p className="text-[10px] text-slate-500">Busy</p>
            </div>
            <div>
              <p className="text-lg font-bold text-slate-500 tabular-nums">
                {snapshot.agents.offline}
              </p>
              <p className="text-[10px] text-slate-500">Offline</p>
            </div>
          </div>
          <p className="mt-2 text-[10px] text-slate-500">
            {snapshot.agents.total} agents tracked in Aircall
          </p>
        </div>

        <div className="rounded-xl border border-slate-100 p-3 dark:border-slate-800">
          <div className="mb-2 flex items-center gap-2">
            <AlertTriangle className="size-4 text-rose-500" aria-hidden />
            <h4 className="text-[12px] font-semibold text-slate-800 dark:text-slate-100">
              Ticket workload
            </h4>
          </div>
          <div className="grid grid-cols-3 gap-2 text-center">
            <div>
              <p className="text-lg font-bold tabular-nums text-slate-800 dark:text-slate-100">
                {snapshot.tickets.open}
              </p>
              <p className="text-[10px] text-slate-500">Open</p>
            </div>
            <div>
              <p className="text-lg font-bold text-amber-600 tabular-nums">
                {snapshot.tickets.pending}
              </p>
              <p className="text-[10px] text-slate-500">Pending</p>
            </div>
            <div>
              <p className="text-lg font-bold text-rose-600 tabular-nums">
                {snapshot.tickets.overdue}
              </p>
              <p className="text-[10px] text-slate-500">Overdue</p>
            </div>
          </div>
        </div>
      </div>

      <div>
        <div className="mb-2 flex items-center gap-2">
          <PhoneCall className="size-4 text-slate-500" aria-hidden />
          <h4 className="text-[12px] font-semibold text-slate-800 dark:text-slate-100">
            Lines needing attention
          </h4>
        </div>
        {snapshot.lineAlerts.length === 0 ? (
          <p className="rounded-lg border border-dashed border-slate-200 px-3 py-4 text-center text-[11px] text-slate-500 dark:border-slate-700">
            All lines are within normal thresholds for this period.
          </p>
        ) : (
          <ul className="space-y-1.5">
            {snapshot.lineAlerts.map((row) => (
              <li
                key={row.line}
                className="flex items-center justify-between gap-2 rounded-lg border border-slate-100 bg-white px-3 py-2 dark:border-slate-800 dark:bg-slate-950"
              >
                <div className="flex min-w-0 items-center gap-2">
                  <Headphones className="size-3.5 shrink-0 text-slate-400" aria-hidden />
                  <span className="truncate text-[12px] font-medium text-slate-800 dark:text-slate-100">
                    {row.line}
                  </span>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <span className="text-[11px] text-slate-500">{row.detail}</span>
                  <StatusBadge tone={row.tone}>{row.tone === "rose" ? "Alert" : "Watch"}</StatusBadge>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      <p className="flex items-center gap-1.5 text-[10px] text-slate-400">
        <PhoneIncoming className="size-3" aria-hidden />
        Data from Aircall wallboard and ticket reports. Updates when you refresh the dashboard.
      </p>
    </div>
  );
}
