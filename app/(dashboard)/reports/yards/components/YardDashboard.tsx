"use client";

import { useMemo, useState } from "react";
import {
  AlertTriangle,
  BarChart3,
  ClipboardList,
  Contact,
  FilePenLine,
  Phone,
  Target,
  Ticket,
  UserPlus,
} from "lucide-react";
import { MetricCard } from "@/app/(dashboard)/dashboard/components/metric-card";
import {
  dashboardRowClass,
  dashboardShellClass,
  toneClasses,
} from "@/app/(dashboard)/dashboard/dashboard-theme";
import type { Metric } from "@/app/(dashboard)/dashboard/types";
import {
  DISPOSITION_LABEL_COLORS,
  DIRECTION_COLORS,
  PRIORITY_COLORS,
} from "./chart-colors";
import { HighPriorityPendingModal } from "./HighPriorityPendingModal";
import { NewLeadsModal } from "./NewLeadsModal";
import { OpenTicketsModal } from "./OpenTicketsModal";
import type { Ticket as YardTicket, YardStats, YardStatsDay } from "./types";
import { InsightActionCard } from "./yard-insight-action-card";
import { YardActivityChart } from "./yard-activity-chart";
import { YardAgentsPanel } from "./yard-agents-panel";
import { YardBreakdownBar } from "./yard-breakdown-bar";

type YardDashboardProps = {
  stats: YardStats;
  yardTickets: YardTicket[];
  activeTicketChartData: YardStatsDay[];
  activeCallsChartData: YardStatsDay[];
  activeManualChartData: YardStatsDay[];
  reportStartDate: string;
  reportEndDate: string;
};

export function YardDashboard({
  stats,
  yardTickets,
  activeTicketChartData,
  activeCallsChartData,
  activeManualChartData,
  reportStartDate,
  reportEndDate,
}: YardDashboardProps) {
  const [showNewLeadsModal, setShowNewLeadsModal] = useState(false);
  const [showHighPriorityPendingModal, setShowHighPriorityPendingModal] =
    useState(false);
  const [showOpenTicketsModal, setShowOpenTicketsModal] = useState(false);

  const totalCalls = stats.totalCalls ?? 0;
  const totalTickets = stats.totalTickets;
  const manualRecords = stats.totalManualRecords ?? 0;
  const contactsTotal = totalTickets + totalCalls + manualRecords;
  const contactsBreakdown = [
    totalTickets > 0 ? `${totalTickets} tickets` : null,
    totalCalls > 0 ? `${totalCalls} calls` : null,
    manualRecords > 0 ? `${manualRecords} manual` : null,
  ]
    .filter(Boolean)
    .join(" · ");

  const newLeadCustomers =
    stats.newLeadCustomersCount ?? stats.ticketsByNewLead.length;
  const newLeadCalls = stats.newLeadCallsCount ?? 0;
  const resolutionRate = stats.resolutionRate ?? 0;
  const closedTickets = stats.closedTickets ?? 0;
  const closedCalls = stats.closedCalls ?? 0;
  const closedManual = stats.closedManualRecords ?? 0;
  const closedContactsTotal = closedTickets + closedCalls + closedManual;
  const resolutionBreakdown = [
    closedTickets > 0 ? `${closedTickets} tickets` : null,
    closedCalls > 0 ? `${closedCalls} calls` : null,
    closedManual > 0 ? `${closedManual} manual` : null,
  ]
    .filter(Boolean)
    .join(" · ");

  const topNewLead = stats.ticketsByNewLead[0];
  const topNewLeadLabel =
    topNewLead?.phone?.trim() ||
    topNewLead?.customerName?.trim() ||
    "No data";

  const highPriorityPendingTickets = useMemo(
    () =>
      yardTickets.filter((ticket) => {
        const priority = (ticket.priority || "").toUpperCase();
        const status = (ticket.status || "").toUpperCase();
        const isCritical =
          priority === "HIGH" || priority === "EMERGENCY";
        const isClosed =
          status === "COMPLETED" ||
          status === "CLOSED" ||
          status === "RESOLVED";
        return isCritical && !isClosed;
      }),
    [yardTickets],
  );

  const highPriorityClosedCount = useMemo(
    () =>
      yardTickets.filter((ticket) => {
        const priority = (ticket.priority || "").toUpperCase();
        const status = (ticket.status || "").toUpperCase();
        const isCritical =
          priority === "HIGH" || priority === "EMERGENCY";
        const isClosed =
          status === "COMPLETED" ||
          status === "CLOSED" ||
          status === "RESOLVED";
        return isCritical && isClosed;
      }).length,
    [yardTickets],
  );

  const emergencyPendingCount = highPriorityPendingTickets.filter(
    (ticket) => (ticket.priority || "").toUpperCase() === "EMERGENCY",
  ).length;

  const highPriorityPendingRate =
    stats.totalTickets > 0
      ? Math.round(
          (highPriorityPendingTickets.length / stats.totalTickets) * 100,
        )
      : 0;

  const openWorkloadTickets = useMemo(
    () =>
      yardTickets.filter((ticket) => {
        const status = (ticket.status || "").toUpperCase();
        return (
          status !== "COMPLETED" &&
          status !== "CLOSED" &&
          status !== "RESOLVED"
        );
      }),
    [yardTickets],
  );

  const openWorkloadCount = openWorkloadTickets.length;
  const openOnlyCount = stats.openTickets ?? 0;
  const inProgressCount = stats.inProgressTickets ?? 0;

  const dispositionChartData = useMemo(
    () =>
      stats.ticketsByDisposition.map((item) => ({
        key: item.disposition,
        count: item.count,
      })),
    [stats.ticketsByDisposition],
  );

  const directionChartData = useMemo(
    () =>
      stats.ticketsByDirection.map((item) => ({
        key: item.direction,
        count: item.count,
      })),
    [stats.ticketsByDirection],
  );

  const priorityChartData = useMemo(
    () =>
      stats.ticketsByPriority.map((item) => ({
        key: item.priority,
        count: item.count,
      })),
    [stats.ticketsByPriority],
  );

  const headlineMetrics: Metric[] = [
    {
      label: "Contacts",
      value: String(contactsTotal),
      detail: contactsBreakdown || "No activity in period",
      trend: `${stats.activeAgents ?? stats.ticketsByAgent.length} active agents`,
      tone: "emerald",
      icon: Contact,
    },
    {
      label: "Tickets",
      value: String(totalTickets),
      detail: `${stats.openTickets} open · ${stats.closedTickets} closed`,
      trend: `${stats.inProgressTickets} in progress`,
      tone: "sky",
      icon: Ticket,
    },
    {
      label: "Resolution",
      value: `${resolutionRate}%`,
      detail:
        resolutionBreakdown ||
        `${closedContactsTotal} closed of ${contactsTotal} contacts`,
      trend: stats.avgResolutionTime
        ? `Avg ${stats.avgResolutionTime.toFixed(1)}h (tickets)`
        : `${closedContactsTotal} closed in period`,
      tone: "indigo",
      icon: Target,
    },
    {
      label: "Calls",
      value: String(totalCalls),
      detail: "Aircall in period",
      trend: `${stats.activeAgents ?? stats.ticketsByAgent.length} active agents`,
      tone: "slate",
      icon: Phone,
    },
  ];

  return (
    <div className={dashboardShellClass}>
      <div className="grid grid-cols-2 gap-2 xl:grid-cols-4">
        {headlineMetrics.map((metric) => (
          <MetricCard key={metric.label} metric={metric} />
        ))}
      </div>

      <div className={`${dashboardRowClass} lg:grid-cols-3 lg:[&>*]:min-h-[76px]`}>
        <InsightActionCard
          label="New lead customers"
          value={newLeadCustomers}
          tone="emerald"
          icon={UserPlus}
          onClick={() => setShowNewLeadsModal(true)}
          primaryHint={`Top: ${topNewLeadLabel}`}
          secondaryHint={`${newLeadCalls} lead calls in period`}
        />
        <InsightActionCard
          label="High priority pending"
          value={highPriorityPendingTickets.length}
          tone="rose"
          icon={AlertTriangle}
          onClick={() => setShowHighPriorityPendingModal(true)}
          primaryHint={`${emergencyPendingCount} emergency, ${highPriorityPendingRate}% of total`}
          secondaryHint={`Closed / resolved high priority: ${highPriorityClosedCount}`}
        />
        <InsightActionCard
          label="Open workload"
          value={openWorkloadCount}
          tone="sky"
          icon={ClipboardList}
          onClick={() => setShowOpenTicketsModal(true)}
          primaryHint={`${openOnlyCount} open · ${inProgressCount} in progress`}
          secondaryHint={
            openWorkloadCount > 0
              ? "Review issue and owner on each card"
              : "No active tickets in period"
          }
        />
      </div>

      <div className={`${dashboardRowClass} xl:grid-cols-3 xl:[&>*]:min-h-[246px]`}>
        <YardActivityChart
          title="Call activity"
          subtitle="Created vs closed on call day (Aircall)"
          icon={Phone}
          data={activeCallsChartData}
          primaryKey="created"
          primaryLabel="Created"
          primaryColor={toneClasses.sky.chart}
          closedColor={toneClasses.emerald.chart}
        />
        <YardActivityChart
          title="Ticket activity"
          subtitle="Opened vs closed on ticket day"
          icon={Ticket}
          data={activeTicketChartData}
          primaryKey="open"
          primaryLabel="Open"
          primaryColor={toneClasses.amber.chart}
          closedColor={toneClasses.emerald.chart}
        />
        <YardActivityChart
          title="Manual records"
          subtitle="Created vs closed on record day"
          icon={FilePenLine}
          data={activeManualChartData}
          primaryKey="created"
          primaryLabel="Created"
          primaryColor={toneClasses.indigo.chart}
          closedColor={toneClasses.emerald.chart}
        />
      </div>

      <div className={`${dashboardRowClass} lg:grid-cols-3 lg:[&>*]:min-h-[218px]`}>
        <YardBreakdownBar
          title="Disposition"
          subtitle="Call outcomes in period"
          data={dispositionChartData}
          colorMap={DISPOSITION_LABEL_COLORS}
          icon={BarChart3}
          filterKey="disposition"
        />
        <YardBreakdownBar
          title="Direction"
          subtitle="Inbound, outbound, missed"
          data={directionChartData}
          colorMap={DIRECTION_COLORS}
          icon={Phone}
          barColor={toneClasses.sky.chart}
          filterKey="direction"
        />
        <YardBreakdownBar
          title="Priority"
          subtitle="Ticket urgency levels"
          data={priorityChartData}
          colorMap={PRIORITY_COLORS}
          icon={Target}
          barColor={toneClasses.amber.chart}
          filterKey="priority"
        />
      </div>

      <YardAgentsPanel
        agents={stats.ticketsByAgent}
        customers={stats.ticketsByNewLead}
      />

      <NewLeadsModal
        open={showNewLeadsModal}
        onOpenChange={setShowNewLeadsModal}
        side="right"
        yardId={stats.yard.id}
        yardName={stats.yard.name}
        reportStartDate={reportStartDate}
        reportEndDate={reportEndDate}
        customersByNewLead={stats.ticketsByNewLead}
        yardTickets={yardTickets}
      />

      <HighPriorityPendingModal
        open={showHighPriorityPendingModal}
        onOpenChange={setShowHighPriorityPendingModal}
        side="right"
        yardId={stats.yard.id}
        yardName={stats.yard.name}
        reportStartDate={reportStartDate}
        reportEndDate={reportEndDate}
        tickets={yardTickets}
      />

      <OpenTicketsModal
        open={showOpenTicketsModal}
        onOpenChange={setShowOpenTicketsModal}
        side="right"
        yardId={stats.yard.id}
        yardName={stats.yard.name}
        reportStartDate={reportStartDate}
        reportEndDate={reportEndDate}
        tickets={yardTickets}
      />
    </div>
  );
}
