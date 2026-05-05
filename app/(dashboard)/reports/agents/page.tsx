"use client";

import React, { useEffect, useState } from "react";
import { PhoneMissed } from "lucide-react";
import {
  Download,
  CalendarDays,
  Phone,
  CheckCircle,
  Timer,
  Users,
  Loader2,
  FileSpreadsheet,
  Ticket,
  ClipboardList,
  PhoneIncoming,
  Clock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "@/hooks/use-toast";
import { fetchBlobFromBackend } from "@/lib/api-client";
import { fetchFromBackend } from "@/lib/api-client";
import { cn } from "@/lib/utils";

// ═══════════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════════

type AgentPerformanceRow = {
  agentId: number;
  agentName: string;
  totalCalls: number;
  inboundCalls: number;
  outboundCalls: number;
  missedCalls: number;
  voicemailCalls: number;
  answeredCalls: number;
  avgCallDurationSec: number;
  totalCallDurationSec: number;
  totalTickets: number;
  openTickets: number;
  closedTickets: number;
  pendingTickets: number;
  overdueTickets: number;
  totalManualRecords: number;
  manualRecordsWithNotes: number;
  resolutionRate: number;
};

type AgentsReportData = {
  period: {
    label: string;
    start: string;
    end: string;
  };
  summary: {
    totalCalls: number;
    totalAnsweredCalls: number;
    totalMissedCalls: number;
    totalInboundCalls: number;
    totalOutboundCalls: number;
    totalVoicemailCalls: number;
    totalTickets: number;
    openTickets: number;
    closedTickets: number;
    pendingTickets: number;
    overdueTickets: number;
    totalManualRecords: number;
    activeAgents: number;
    avgCallDurationSec: number;
    overallResolutionRate: number;
  };
  agentPerformance: AgentPerformanceRow[];
};

// ═══════════════════════════════════════════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════════════════════════════════════════

const formatDuration = (seconds: number): string => {
  if (!seconds || seconds <= 0) return "0s";
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) return `${h}h ${m}m ${s}s`;
  if (m > 0) return `${m}m ${s}s`;
  return `${s}s`;
};

const formatPct = (value: number, total: number): string => {
  if (total === 0) return "0%";
  return `${Math.round((value / total) * 100)}%`;
};

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════

export default function AgentsReportPage() {
  const [startDate, setStartDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 7);
    return d.toISOString().slice(0, 10);
  });
  const [endDate, setEndDate] = useState(() =>
    new Date().toISOString().slice(0, 10),
  );
  const [report, setReport] = useState<AgentsReportData | null>(null);
  const [loading, setLoading] = useState(true);
  const [agentPage, setAgentPage] = useState(0);
  const agentItemsPerPage = 5;

  const getLogoUrl = () =>
    typeof window !== "undefined"
      ? `${window.location.origin}/images/logo.jpeg`
      : "/images/logo.jpeg";

  const buildReport = async () => {
    setLoading(true);
    setAgentPage(0);
    try {
      const params = new URLSearchParams({ start: startDate, end: endDate });
      const response = await fetchFromBackend(
        `/reports/agents?${params.toString()}`,
      );
      if (response) {
        setReport(response);
      } else {
        setReport(null);
        toast({
          title: "No data",
          description: "No agent data available for the selected period.",
          variant: "destructive",
        });
      }
    } catch (error: any) {
      setReport(null);
      toast({
        title: "Error",
        description: error.message || "Failed to load report data",
        variant: "destructive",
      });
    }
    setLoading(false);
  };

  useEffect(() => {
    buildReport();
  }, [startDate, endDate]);


  const allAgents = report?.agentPerformance || [];
  const totalAgentPages = Math.ceil(allAgents.length / agentItemsPerPage);
  const paginatedAgents = allAgents.slice(
    agentPage * agentItemsPerPage,
    (agentPage + 1) * agentItemsPerPage,
  );

  const handleExportPdf = async () => {
    if (!report) return;
    if (!startDate || !endDate) {
      toast({ title: "Select dates", description: "Start and end date are required.", variant: "destructive" });
      return;
    }
    try {
      const params = new URLSearchParams({ start: startDate, end: endDate });
      const blob = await fetchBlobFromBackend(
        `/reports/agents/pdf?${params.toString()}&logoUrl=${encodeURIComponent(getLogoUrl())}`,
        { method: "GET" },
      );
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `agents_report_${startDate}_to_${endDate}.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error: any) {
      toast({ title: "Error", description: error.message || "Failed to download PDF", variant: "destructive" });
    }
  };

  const handleExportExcel = async () => {
    if (!report) return;
    if (!startDate || !endDate) {
      toast({ title: "Select dates", description: "Start and end date are required.", variant: "destructive" });
      return;
    }
    try {
      const params = new URLSearchParams({ start: startDate, end: endDate });
      const blob = await fetchBlobFromBackend(
        `/reports/agents/excel?${params.toString()}`,
        { method: "GET" },
      );
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `agents_report_${startDate}_to_${endDate}.xlsx`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error: any) {
      toast({ title: "Error", description: error.message || "Failed to download Excel", variant: "destructive" });
    }
  };

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-50 via-white to-slate-100 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 p-4 md:p-8 animate-in fade-in duration-500">
      <div className="mx-auto max-w-7xl space-y-10">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-foreground drop-shadow-sm">
              Agent Reports
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Agent performance across calls, tickets &amp; resolution rates.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row items-end gap-2">
            <div className="flex gap-2">
              <div className="space-y-1">
                <label className="text-xs font-medium leading-none">Start</label>
                <div className="relative">
                  <CalendarDays className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground pointer-events-none" />
                  <Input
                    id="agent-start-date"
                    type="date"
                    className="pl-9 w-[160px]"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                  />
                </div>
              </div>
              <div className="space-y-1">
                <label htmlFor="agent-end-date" className="text-xs font-medium text-muted-foreground">
                  End Date
                </label>
                <div className="relative">
                  <CalendarDays className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground pointer-events-none" />
                  <Input
                    id="agent-end-date"
                    type="date"
                    className="pl-9 w-[160px]"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                  />
                </div>
              </div>
            </div>
            <div className="flex gap-2">
              <Button type="button" variant="outline" onClick={handleExportPdf} disabled={!report} className="gap-2">
                <Download className="h-4 w-4" />
                <span className="hidden sm:inline">PDF</span>
              </Button>
              <Button type="button" variant="outline" onClick={handleExportExcel} disabled={!report} className="gap-2">
                <FileSpreadsheet className="h-4 w-4" />
                <span className="hidden sm:inline">Excel</span>
              </Button>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center gap-2 text-muted-foreground py-12 justify-center">
            <Loader2 className="h-5 w-5 animate-spin" />
            Generating report...
          </div>
        ) : !report ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <Users className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-base font-medium text-foreground">No report generated yet</p>
            <p className="text-sm text-muted-foreground mt-1">
              Select a date range to load the agents report.
            </p>
          </div>
        ) : (
          <>
            {/* ═══════════════ KPI CARDS ═══════════════ */}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {/* Calls KPIs */}
              <KpiCard
                title="Total Calls"
                value={report.summary.totalCalls}
                subtitle={`${report.summary.totalAnsweredCalls} answered · ${report.summary.totalMissedCalls} missed`}
                icon={<Phone className="w-5 h-5" />}
                color="bg-blue-100 text-blue-700 dark:bg-blue-500/10"
              />
             
          <KpiCard
                title="Total Tickets"
                value={report.summary.totalTickets}
                subtitle={`${report.summary.openTickets} open · ${report.summary.closedTickets} closed`}
                icon={<Ticket className="w-5 h-5" />}
                color="bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10"
              />
                <KpiCard
                title="Manual Records"
                value={report.summary.totalManualRecords}
                subtitle="Agent entries"
                icon={<ClipboardList className="w-5 h-5" />}
                color="bg-violet-100 text-violet-700 dark:bg-violet-500/10"
              />
              <KpiCard
                title="Missed Calls"
                value={report.summary.totalMissedCalls}
                subtitle={formatPct(report.summary.totalMissedCalls, report.summary.totalCalls)}
                icon={<PhoneMissed className="w-5 h-5" />}
                color="bg-red-100 text-red-700 dark:bg-red-500/10"
                valueClassName="text-red-600"
              />

      
         
            
            </div>

            {/* ═══════════════ AGENT PERFORMANCE TABLE ═══════════════ */}
            <div className="rounded-2xl border bg-card/80 backdrop-blur-sm p-6 shadow-lg">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Agent Performance
                </h3>
                <span className="text-xs text-muted-foreground">
                  {report.summary.activeAgents} active agents
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="text-xs text-muted-foreground uppercase border-b">
                      <th className="pb-3 font-semibold">Agent</th>
                      <th className="pb-3 font-semibold text-center">Calls</th>
                      <th className="pb-3 font-semibold text-center">In/Out/Miss</th>
                      <th className="pb-3 font-semibold text-center">Avg Duration</th>
                      <th className="pb-3 font-semibold text-center">Tickets</th>
                      <th className="pb-3 font-semibold text-center">Closed</th>
                      <th className="pb-3 font-semibold text-center">Resolution</th>
                      <th className="pb-3 font-semibold text-center">Manual Rec.</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/40">
                    {paginatedAgents.length > 0 ? (
                      paginatedAgents.map((agent) => (
                        <tr key={agent.agentId} className="text-sm hover:bg-muted/30 transition-colors">
                          <td className="py-3 font-medium">{agent.agentName}</td>
                          <td className="py-3 text-center">
                            <span className="inline-flex items-center justify-center rounded-full bg-blue-100 dark:bg-blue-500/10 px-2.5 py-0.5 text-xs font-bold text-blue-700">
                              {agent.totalCalls}
                            </span>
                          </td>
                          <td className="py-3 text-center">
                            <div className="flex items-center justify-center gap-1 text-xs">
                              <span className="text-blue-600 font-medium">{agent.inboundCalls}</span>
                              <span className="text-muted-foreground">/</span>
                              <span className="text-emerald-600 font-medium">{agent.outboundCalls}</span>
                              <span className="text-muted-foreground">/</span>
                              <span className="text-red-600 font-medium">{agent.missedCalls}</span>
                            </div>
                          </td>
                          <td className="py-3 text-center text-muted-foreground text-xs">
                            {formatDuration(agent.avgCallDurationSec)}
                          </td>
                          <td className="py-3 text-center">
                            <span className="inline-flex items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-500/10 px-2.5 py-0.5 text-xs font-bold text-emerald-700">
                              {agent.totalTickets}
                            </span>
                          </td>
                          <td className="py-3 text-center text-green-600 font-medium">
                            {agent.closedTickets}
                          </td>
                          <td className="py-3 text-center">
                            <span className={cn(
                              "text-xs font-bold px-2 py-0.5 rounded-full",
                              agent.resolutionRate >= 80
                                ? "bg-green-100 text-green-700"
                                : agent.resolutionRate >= 50
                                  ? "bg-amber-100 text-amber-700"
                                  : "bg-red-100 text-red-700"
                            )}>
                              {agent.resolutionRate}%
                            </span>
                          </td>
                          <td className="py-3 text-center text-muted-foreground">
                            {agent.totalManualRecords}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={8} className="py-8 text-center text-sm text-muted-foreground">
                          No agent activity in this period.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {totalAgentPages > 1 && (
                <div className="flex items-center justify-between pt-4 mt-4 border-t">
                  <Button variant="outline" size="sm" onClick={() => setAgentPage(Math.max(0, agentPage - 1))} disabled={agentPage === 0}>
                    Previous
                  </Button>
                  <span className="text-xs text-muted-foreground">
                    Page {agentPage + 1} of {totalAgentPages}
                  </span>
                  <Button variant="outline" size="sm" onClick={() => setAgentPage(Math.min(totalAgentPages - 1, agentPage + 1))} disabled={agentPage >= totalAgentPages - 1}>
                    Next
                  </Button>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// SUBCOMPONENTS
// ═══════════════════════════════════════════════════════════════════════════════

function KpiCard({
  title,
  value,
  subtitle,
  icon,
  color,
  valueClassName,
}: {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ReactNode;
  color: string;
  valueClassName?: string;
}) {
  return (
    <div className="relative overflow-hidden rounded-xl border bg-card p-5 shadow-sm transition-all hover:shadow-md">
      <div className="flex justify-between items-start">
        <div className="min-w-0 flex-1">
          <p className="text-xs text-muted-foreground truncate">{title}</p>
          <h3 className={cn("text-2xl font-bold mt-1", valueClassName)}>
            {value}
          </h3>
          {subtitle && (
            <p className="text-xs text-muted-foreground mt-1.5">{subtitle}</p>
          )}
        </div>
        <div className={cn("p-2 rounded-full flex-shrink-0", color)}>
          {icon}
        </div>
      </div>
    </div>
  );
}
