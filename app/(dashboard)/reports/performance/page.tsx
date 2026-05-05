"use client";

import React, { useEffect, useState } from "react";
import { PhoneMissed } from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import {
  Download,
  Calendar,
  CalendarDays,
  FileText,
  Phone,
  CheckCircle,
  Timer,
  Users,
  Loader2,
  FileSpreadsheet,
  Ticket,
  ClipboardList,
  PhoneIncoming,
  TrendingUp,
  AlertCircle,
  Clock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "@/hooks/use-toast";
import { fetchBlobFromBackend } from "@/lib/api-client";
import { fetchFromBackend } from "@/lib/api-client";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

// ═══════════════════════════════════════════════════════════════════════════════
// TYPES (aligned with new backend model)
// ═══════════════════════════════════════════════════════════════════════════════

type KvPair = {
  label: string;
  count: number;
};

type AgentPerformanceRow = {
  agentId: number;
  agentName: string;
  // Calls
  totalCalls: number;
  inboundCalls: number;
  outboundCalls: number;
  missedCalls: number;
  voicemailCalls: number;
  answeredCalls: number;
  avgCallDurationSec: number;
  totalCallDurationSec: number;
  // Tickets
  totalTickets: number;
  openTickets: number;
  closedTickets: number;
  pendingTickets: number;
  overdueTickets: number;
  // Manual Records
  totalManualRecords: number;
  manualRecordsWithNotes: number;
  // Combined
  resolutionRate: number; // percentage
};

type PerformanceReportData = {
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
  callsByDay: { date: string; day: string; total: number; answered: number; missed: number }[];
  callsByDirection: { name: string; value: number }[];
  dispositionBreakdown: KvPair[];
  ticketStatusBreakdown: KvPair[];
  ticketPriorityBreakdown: KvPair[];
  campaignOptionBreakdown: KvPair[];
  agentPerformance: AgentPerformanceRow[];
  dailyAgentActivity: {
    date: string;
    day: string;
    activeAgents: number;
    totalCalls: number;
    totalTickets: number;
    totalManualRecords: number;
  }[];
};

// ═══════════════════════════════════════════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════════════════════════════════════════

const DISPOSITION_COLORS = [
  "oklch(0.65 0.18 160)",
  "oklch(0.75 0.18 85)",
  "#3b82f6",
  "oklch(0.65 0.22 25)",
  "oklch(0.72 0.16 250)",
  "oklch(0.60 0.20 300)",
  "oklch(0.55 0.15 40)",
];

const DIRECTION_COLORS: Record<string, string> = {
  Inbound: "#3b82f6",
  Outbound: "#10b981",
  Missed: "#ef4444",
  Voicemail: "#f59e0b",
};

const STATUS_COLORS: Record<string, string> = {
  OPEN: "#3b82f6",
  IN_PROGRESS: "#0284c7",
  PENDING_FOLLOWUP: "#f59e0b",
  OVERDUE: "#ef4444",
  RESOLVED: "#22c55e",
  CLOSED: "#166534",
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

export default function PerformanceReportPage() {
  const [startDate, setStartDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 7);
    return d.toISOString().slice(0, 10);
  });
  const [endDate, setEndDate] = useState(() =>
    new Date().toISOString().slice(0, 10),
  );
  const [report, setReport] = useState<PerformanceReportData | null>(null);
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


  // Pagination for agents
  const allAgents = report?.agentPerformance || [];
  const totalAgentPages = Math.ceil(allAgents.length / agentItemsPerPage);
  const paginatedAgents = allAgents.slice(
    agentPage * agentItemsPerPage,
    (agentPage + 1) * agentItemsPerPage,
  );

  // Derived data for charts
  const callsChartData = report?.callsByDay || [];
  const callDirectionData = report?.callsByDirection || [
    { name: "Inbound", value: report?.summary?.totalInboundCalls || 0 },
    { name: "Outbound", value: report?.summary?.totalOutboundCalls || 0 },
    { name: "Missed", value: report?.summary?.totalMissedCalls || 0 },
    { name: "Voicemail", value: report?.summary?.totalVoicemailCalls || 0 },
  ];
  const ticketStatusData = report?.ticketStatusBreakdown || [];
  const dispositionData = report?.dispositionBreakdown || [];

  const handleExportPdf = async () => {
    if (!report) return;
    if (!startDate || !endDate) {
      toast({
        title: "Select dates",
        description: "Start and end date are required.",
        variant: "destructive",
      });
      return;
    }
    try {
      const params = new URLSearchParams({
        start: startDate,
        end: endDate,
      });
      const blob = await fetchBlobFromBackend(
        `/reports/performance/pdf?${params.toString()}&logoUrl=${encodeURIComponent(
          getLogoUrl(),
        )}`,
        { method: "GET" },
      );
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `performance_report_${startDate}_to_${endDate}.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to download PDF",
        variant: "destructive",
      });
    }
  };

  const handleExportExcel = async () => {
    if (!report) return;
    if (!startDate || !endDate) {
      toast({
        title: "Select dates",
        description: "Start and end date are required.",
        variant: "destructive",
      });
      return;
    }
    try {
      const params = new URLSearchParams({
        start: startDate,
        end: endDate,
      });
      const blob = await fetchBlobFromBackend(
        `/reports/performance/excel?${params.toString()}`,
        { method: "GET" },
      );
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `performance_report_${startDate}_to_${endDate}.xlsx`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to download Excel",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-50 via-white to-slate-100 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 p-4 md:p-8 animate-in fade-in duration-500">
      <div className="mx-auto max-w-7xl space-y-10">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-foreground drop-shadow-sm">
              Performance Report
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
           Operational metrics and campaign performance overview.
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
            <Button
              type="button"
              variant="outline"
              onClick={handleExportPdf}
              disabled={!report}
              className="gap-2"
            >
              <Download className="h-4 w-4" />
              <span className="hidden sm:inline">PDF</span>
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={handleExportExcel}
              disabled={!report}
              className="gap-2"
            >
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
              Select a date range and click <strong>Generate Report</strong>.
            </p>
          </div>
        ) : (
          <>
            {/* ═══════════════ KPI CARDS (8 cards: Calls + Tickets + Manual) ═══════════════ */}
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
                title="Inbound / Outbound"
                value={`${report.summary.totalInboundCalls} / ${report.summary.totalOutboundCalls}`}
                subtitle={`${report.summary.totalVoicemailCalls} voicemail`}
                icon={<PhoneIncoming className="w-5 h-5" />}
                color="bg-indigo-100 text-indigo-700 dark:bg-indigo-500/10"
              />
              <KpiCard
                title="Avg Call Duration"
                value={formatDuration(report.summary.avgCallDurationSec)}
                subtitle={`Active agents: ${report.summary.activeAgents}`}
                icon={<Timer className="w-5 h-5" />}
                color="bg-purple-100 text-purple-700 dark:bg-purple-500/10"
              />
              <KpiCard
                title="Missed Calls"
                value={report.summary.totalMissedCalls}
                subtitle={formatPct(report.summary.totalMissedCalls, report.summary.totalCalls)}
                icon={<PhoneMissed className="w-5 h-5" />}
                color="bg-red-100 text-red-700 dark:bg-red-500/10"
                valueClassName="text-red-600"
              />

              {/* Tickets KPIs */}
              <KpiCard
                title="Total Tickets"
                value={report.summary.totalTickets}
                subtitle={`${report.summary.openTickets} open · ${report.summary.closedTickets} closed`}
                icon={<Ticket className="w-5 h-5" />}
                color="bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10"
              />
              <KpiCard
                title="Resolution Rate"
                value={`${report.summary.overallResolutionRate}%`}
                subtitle={`${report.summary.closedTickets} resolved`}
                icon={<CheckCircle className="w-5 h-5" />}
                color="bg-green-100 text-green-700 dark:bg-green-500/10"
              />
              <KpiCard
                title="Pending Tickets"
                value={report.summary.pendingTickets}
                subtitle={`${report.summary.overdueTickets} overdue`}
                icon={<Clock className="w-5 h-5" />}
                color="bg-amber-100 text-amber-700 dark:bg-amber-500/10"
                valueClassName={report.summary.overdueTickets > 0 ? "text-red-600" : ""}
              />
              <KpiCard
                title="Manual Records"
                value={report.summary.totalManualRecords}
                subtitle="Agent entries"
                icon={<ClipboardList className="w-5 h-5" />}
                color="bg-violet-100 text-violet-700 dark:bg-violet-500/10"
              />
            </div>

            {/* ═══════════════ CHARTS ROW 1: Call Activity + Direction Pie ═══════════════ */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Call Activity Bar Chart */}
              <div className="lg:col-span-2 rounded-2xl border bg-card/80 backdrop-blur-sm p-6 shadow-lg">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-lg font-semibold">Call Activity</h3>
                  <span className="text-xs text-muted-foreground">
                    {callsChartData.length} days
                  </span>
                </div>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={callsChartData}>
                      <CartesianGrid
                        strokeDasharray="3 3"
                        vertical={false}
                        stroke="hsl(var(--border))"
                      />
                      <XAxis
                        dataKey="day"
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
                      />
                      <YAxis
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
                      />
                      <Tooltip
                        contentStyle={{
                          background: "hsl(var(--background))",
                          borderRadius: "8px",
                          border: "1px solid hsl(var(--border))",
                        }}
                      />
                      <Legend />
                      <Bar dataKey="answered" name="Answered" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="missed" name="Missed" fill="#ef4444" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Call Direction Pie */}
              <div className="rounded-2xl border bg-card/80 backdrop-blur-sm p-6 shadow-lg">
                <h3 className="text-lg font-semibold mb-1">Call Direction</h3>
                <p className="text-xs text-muted-foreground mb-6">
                  Inbound / Outbound / Missed / Voicemail
                </p>
                <div className="h-64 relative">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={callDirectionData.filter(d => d.value > 0)}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        dataKey="value"
                        paddingAngle={3}
                      >
                        {callDirectionData.filter(d => d.value > 0).map((entry) => (
                          <Cell
                            key={entry.name}
                            fill={DIRECTION_COLORS[entry.name] || "#94a3b8"}
                          />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                    <span className="text-2xl font-bold">{report.summary.totalCalls}</span>
                    <span className="text-xs text-muted-foreground">total calls</span>
                  </div>
                </div>
                <div className="space-y-2 mt-4">
                  {callDirectionData.filter(d => d.value > 0).map((item) => (
                    <div key={item.name} className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: DIRECTION_COLORS[item.name] || "#94a3b8" }}
                        />
                        <span className="text-muted-foreground">{item.name}</span>
                      </div>
                      <span className="font-medium">{item.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* ═══════════════ CHARTS ROW 2: Ticket Status + Disposition ═══════════════ */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Ticket Status Pie */}
              <div className="rounded-2xl border bg-card/80 backdrop-blur-sm p-6 shadow-lg">
                <h3 className="text-lg font-semibold mb-1">Ticket Status</h3>
                <p className="text-xs text-muted-foreground mb-6">
                  {report.summary.totalTickets} total tickets
                </p>
                <div className="h-64 relative">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={ticketStatusData.filter(d => d.count > 0).map(d => ({ name: d.label, value: d.count }))}
                        cx="50%"
                        cy="50%"
                        outerRadius={90}
                        dataKey="value"
                        paddingAngle={3}
                      >
                        {ticketStatusData.filter(d => d.count > 0).map((entry) => (
                          <Cell
                            key={entry.label}
                            fill={STATUS_COLORS[entry.label] || "#94a3b8"}
                          />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="space-y-2 mt-4">
                  {ticketStatusData.filter(d => d.count > 0).map((item) => (
                    <div key={item.label} className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: STATUS_COLORS[item.label] || "#94a3b8" }}
                        />
                        <span className="text-muted-foreground">{item.label.replace(/_/g, " ")}</span>
                      </div>
                      <span className="font-medium">{item.count}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Disposition Breakdown */}
              <div className="rounded-2xl border bg-card/80 backdrop-blur-sm p-6 shadow-lg">
                <h3 className="text-lg font-semibold mb-1">Disposition Breakdown</h3>
                <p className="text-xs text-muted-foreground mb-6">
                  Call outcomes
                </p>
                <div className="h-64 relative">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={dispositionData.map(d => ({ name: d.label, value: d.count }))}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        dataKey="value"
                        paddingAngle={3}
                      >
                        {dispositionData.map((entry, i) => (
                          <Cell
                            key={entry.label}
                            fill={DISPOSITION_COLORS[i % DISPOSITION_COLORS.length]}
                          />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="space-y-2 mt-4 max-h-48 overflow-y-auto">
                  {dispositionData.map((item, i) => (
                    <div key={item.label} className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <div
                          className="w-3 h-3 rounded-full flex-shrink-0"
                          style={{
                            backgroundColor: DISPOSITION_COLORS[i % DISPOSITION_COLORS.length],
                          }}
                        />
                        <span className="text-muted-foreground truncate max-w-[200px]">
                          {item.label.replace(/_/g, " ")}
                        </span>
                      </div>
                      <span className="font-medium">{item.count}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* ═══════════════ CAMPAIGN OPTIONS ═══════════════ */}
            {report.campaignOptionBreakdown && report.campaignOptionBreakdown.length > 0 && (
              <div className="rounded-2xl border bg-card/80 backdrop-blur-sm p-6 shadow-lg">
                <h3 className="text-lg font-semibold mb-4">Campaign Mix</h3>
                <div className="flex flex-col gap-2 max-h-64 overflow-y-auto">
                  {report.campaignOptionBreakdown.map((item) => {
                    const pct = report.summary.totalCalls + report.summary.totalTickets > 0
                      ? Math.round((item.count / (report.summary.totalCalls + report.summary.totalTickets)) * 100)
                      : 0;
                    return (
                      <Badge
                        key={item.label}
                        variant="outline"
                        className="px-4 py-2 text-sm font-medium w-full justify-between"
                      >
                        {item.label.replace(/_/g, " ")}: {item.count} ({pct}%)
                      </Badge>
                    );
                  })}
                </div>
              </div>
            )}

           
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