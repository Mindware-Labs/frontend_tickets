import { ArrowRight, ClipboardList, Ticket } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  dashboardPanelBodyClass,
  dashboardPanelClass,
  dashboardPanelHeaderClass,
  dashboardTableCellClass,
  dashboardTableCellStrongClass,
  dashboardTableHeadClass,
} from "@/app/(dashboard)/dashboard/dashboard-theme";
import { TableCampaignBadge } from "@/components/entity-table-badges";
import { cn } from "@/lib/utils";
import type { AgentDashboardData } from "./agent-dashboard-types";
import { formatRelativeDate, statusLabel, statusTone } from "./agent-dashboard-utils";

type AgentWorkListsProps = {
  data: AgentDashboardData;
};

export function AgentWorkLists({ data }: AgentWorkListsProps) {
  return (
    <div className="grid gap-2 xl:grid-cols-2">
      <section className={dashboardPanelClass}>
        <div className={cn(dashboardPanelHeaderClass, "items-center")}>
          <div className="flex min-w-0 items-center gap-2">
            <span className="inline-flex size-8 items-center justify-center rounded-lg bg-[#f0faf5] text-[#008f68] ring-1 ring-[#008f68]/15 dark:bg-emerald-500/10 dark:text-emerald-300 dark:ring-emerald-500/20">
              <Ticket className="size-4" aria-hidden />
            </span>
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-400">
                Assigned
              </p>
              <h2 className="text-[14px] font-bold text-slate-900 dark:text-neutral-100">
                Recent tickets
              </h2>
            </div>
          </div>
          <Button asChild variant="ghost" size="sm" className="h-8 text-xs">
            <a href="/calls?tab=tickets">
              View all
              <ArrowRight className="ml-1 size-3.5" aria-hidden />
            </a>
          </Button>
        </div>
        <div className={cn(dashboardPanelBodyClass, "overflow-x-auto p-0")}>
          <table className="w-full min-w-[560px] border-collapse">
            <thead>
              <tr>
                <th className={cn(dashboardTableHeadClass, "pl-3")}>Ticket</th>
                <th className={dashboardTableHeadClass}>Campaign</th>
                <th className={dashboardTableHeadClass}>Status</th>
                <th className={cn(dashboardTableHeadClass, "text-right")}>Created</th>
              </tr>
            </thead>
            <tbody>
              {data.recentTickets.length ? (
                data.recentTickets.map((ticket) => (
                  <tr key={ticket.id} className="border-t border-slate-100 dark:border-neutral-800">
                    <td className={cn(dashboardTableCellStrongClass, "pl-3")}>
                      <div className="min-w-0">
                        <p className="truncate">#{ticket.id} · {ticket.clientName}</p>
                      </div>
                    </td>
                    <td className={dashboardTableCellClass}>
                      <TableCampaignBadge name={ticket.campaign} compact />
                    </td>
                    <td className={dashboardTableCellClass}>
                      <span className={cn("inline-flex rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase", statusTone(ticket.status))}>
                        {statusLabel(ticket.status)}
                      </span>
                    </td>
                    <td className={cn(dashboardTableCellClass, "text-right tabular-nums")}>
                      {formatRelativeDate(ticket.createdAt)}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4} className="px-3 py-8 text-center text-xs text-slate-500">
                    No assigned tickets found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section className={dashboardPanelClass}>
        <div className={cn(dashboardPanelHeaderClass, "items-center")}>
          <div className="flex min-w-0 items-center gap-2">
            <span className="inline-flex size-8 items-center justify-center rounded-lg bg-sky-50 text-sky-700 ring-1 ring-sky-200 dark:bg-sky-500/10 dark:text-sky-300 dark:ring-sky-500/20">
              <ClipboardList className="size-4" aria-hidden />
            </span>
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-400">
                Logged
              </p>
              <h2 className="text-[14px] font-bold text-slate-900 dark:text-neutral-100">
                Manual records
              </h2>
            </div>
          </div>
          <Button asChild variant="ghost" size="sm" className="h-8 text-xs">
            <a href="/calls?tab=manual-records">
              View all
              <ArrowRight className="ml-1 size-3.5" aria-hidden />
            </a>
          </Button>
        </div>
        <div className={cn(dashboardPanelBodyClass, "overflow-x-auto p-0")}>
          <table className="w-full min-w-[520px] border-collapse">
            <thead>
              <tr>
                <th className={cn(dashboardTableHeadClass, "pl-3")}>Customer</th>
                <th className={dashboardTableHeadClass}>Disposition</th>
                <th className={dashboardTableHeadClass}>Status</th>
                <th className={cn(dashboardTableHeadClass, "text-right")}>Created</th>
              </tr>
            </thead>
            <tbody>
              {(data.recentManualRecords || []).length ? (
                data.recentManualRecords!.map((record) => (
                  <tr key={record.id} className="border-t border-slate-100 dark:border-neutral-800">
                    <td className={cn(dashboardTableCellStrongClass, "pl-3")}>
                      <p className="truncate">{record.customer?.name || record.customer?.phone || `Record #${record.id}`}</p>
                    </td>
                    <td className={dashboardTableCellClass}>{record.disposition || "-"}</td>
                    <td className={dashboardTableCellClass}>
                      <span className={cn("inline-flex rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase", statusTone(record.status))}>
                        {statusLabel(record.status)}
                      </span>
                    </td>
                    <td className={cn(dashboardTableCellClass, "text-right tabular-nums")}>
                      {formatRelativeDate(record.createdAt)}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4} className="px-3 py-8 text-center text-xs text-slate-500">
                    No manual records found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
