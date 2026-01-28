"use client";

import React, { useEffect, useMemo, useState } from "react";
import { PhoneMissed } from "lucide-react";
import { usePathname } from "next/navigation";
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
  Phone,
  CheckCircle,
  Timer,
  Users,
  Loader2,
  FileSpreadsheet,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "@/hooks/use-toast";
import { fetchBlobFromBackend } from "@/lib/api-client";

type ReportData = {
  period: {
    label: string;
    start: string;
    end: string;
  };
  kpis: {
    totalCalls: number;
    closedTickets: number;
    openTickets: number;
    resolutionRate: number;
    avgDurationSeconds: number;
    activeAgents: number;
    missedInboundCalls: number;
    missedOutboundCalls: number;
  };
  callsByDay: { date: string; day: string; total: number; closed: number }[];
  dispositionBreakdown: { name: string; value: number }[];
  campaignBreakdown: { name: string; value: number }[];
  statusBreakdown: { name: string; value: number }[];
  agentPerformance: {
    id: number;
    name: string;
    totalTickets: number;
    closedTickets: number;
    avgDurationSeconds: number;
  }[];
};

const DISPOSITION_COLORS = [
  "oklch(0.65 0.18 160)",
  "oklch(0.75 0.18 85)",
  "var(--color-primary)",
  "oklch(0.65 0.22 25)",
  "oklch(0.72 0.16 250)",
];

export default function PerformancePage() {
  const [startDate, setStartDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 7);
    return d.toISOString().slice(0, 10);
  });
  const [endDate, setEndDate] = useState(() =>
    new Date().toISOString().slice(0, 10),
  );
  const [report, setReport] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(true);

  const getLogoUrl = () =>
    typeof window !== "undefined"
      ? `${window.location.origin}/images/logo.jpeg`
      : "/images/logo.jpeg";

  const fetchReport = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        start: startDate,
        end: endDate,
      });
      const response = await fetch(
        `/api/reports/performance?${params.toString()}`,
      );
      const result = await response.json();
      if (result?.success) {
        setReport(result.data);
      } else {
        setReport(null);
        toast({
          title: "Error",
          description: result?.message || "Failed to load report data",
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
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReport();
  }, [startDate, endDate]);

  // Cleanup on route change to prevent overlay issues
  const pathname = usePathname();
  useEffect(() => {
    // Add cleanup logic here if modals are added in the future
  }, [pathname]);

  const formattedDuration = (seconds: number) => {
    if (!seconds) return "0s";
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs}s`;
  };

  const callsChartData = report?.callsByDay || [];
  const dispositionData = report?.dispositionBreakdown || [];
  const topAgents = report?.agentPerformance.slice(0, 5) || [];

  const totalClosed = report?.kpis.closedTickets || 0;

  const handleExport = async () => {
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

  const dateLabel = `${startDate} - ${endDate}`;

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-50 via-white to-slate-100 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 p-4 md:p-8 animate-in fade-in duration-500">
      <div className="mx-auto max-w-7xl space-y-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-foreground drop-shadow-sm">
              Performance Report
            </h1>
            <p className="text-sm text-muted-foreground">
              Operational metrics and campaign performance overview
            </p>
            <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground mt-2">
              <span>{report?.period.label}</span>
              <span className="inline-block h-1 w-1 rounded-full bg-muted-foreground/50" />
              <span>{dateLabel}</span>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 rounded-2xl border bg-card/80 backdrop-blur-sm px-4 py-3 shadow-md">
            <div className="flex items-center gap-2">
              <label className="text-xs font-medium leading-none">Start</label>
              <Input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-36"
              />
            </div>
            <div className="flex items-center gap-2">
              <label className="text-xs font-medium leading-none">End</label>
              <Input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-36"
              />
            </div>

            <Button
              variant="outline"
              onClick={handleExport}
              disabled={!report}
              className="gap-2"
            >
              <Download className="w-4 h-4" /> PDF
            </Button>
            <Button
              variant="outline"
              onClick={handleExportExcel}
              disabled={!report}
              className="gap-2"
            >
              <FileSpreadsheet className="w-4 h-4" /> Excel
            </Button>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center gap-2 text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            Loading report...
          </div>
        ) : !report ? (
          <div className="text-sm text-muted-foreground">
            No data available for the selected period.
          </div>
        ) : (
          <>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <div className="relative overflow-hidden rounded-xl border bg-card p-5 shadow-sm">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-xs text-muted-foreground">Total Calls</p>
                    <h3 className="text-3xl font-bold mt-1">
                      {report.kpis.totalCalls}
                    </h3>
                    <p className="text-xs text-muted-foreground mt-2">
                      {report.kpis.openTickets} open tickets
                    </p>
                  </div>
                  <div className="p-2 rounded-full bg-blue-100 text-blue-700 dark:bg-blue-500/10">
                    <Phone className="w-5 h-5" />
                  </div>
                </div>
              </div>

              <div className="relative overflow-hidden rounded-xl border bg-card p-5 shadow-sm">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-xs text-muted-foreground">
                      Missed Inbound
                    </p>
                    <h3 className="text-3xl font-bold mt-1">
                      {report.kpis.missedInboundCalls || 0}
                    </h3>
                    <p className="text-xs text-muted-foreground mt-2">
                      Unanswered incoming
                    </p>
                  </div>
                  <div className="p-2 rounded-full bg-red-100 text-red-700 dark:bg-red-500/10">
                    <PhoneMissed className="w-5 h-5" />
                  </div>
                </div>
              </div>

              <div className="relative overflow-hidden rounded-xl border bg-card p-5 shadow-sm">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-xs text-muted-foreground">
                      Missed Outbound
                    </p>
                    <h3 className="text-3xl font-bold mt-1">
                      {report.kpis.missedOutboundCalls || 0}
                    </h3>
                    <p className="text-xs text-muted-foreground mt-2">
                      Unanswered outgoing
                    </p>
                  </div>
                  <div className="p-2 rounded-full bg-orange-100 text-orange-700 dark:bg-orange-500/10">
                    <PhoneMissed className="w-5 h-5" />
                  </div>
                </div>
              </div>

              <div className="relative overflow-hidden rounded-xl border bg-card p-5 shadow-sm">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-xs text-muted-foreground">
                      Resolution Rate
                    </p>
                    <h3 className="text-3xl font-bold mt-1">
                      {report.kpis.resolutionRate}%
                    </h3>
                    <p className="text-xs text-muted-foreground mt-2">
                      {report.kpis.closedTickets} closed tickets
                    </p>
                  </div>
                  <div className="p-2 rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10">
                    <CheckCircle className="w-5 h-5" />
                  </div>
                </div>
              </div>

              <div className="relative overflow-hidden rounded-xl border bg-card p-5 shadow-sm">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-xs text-muted-foreground">
                      Avg Call Duration
                    </p>
                    <h3 className="text-3xl font-bold mt-1">
                      {formattedDuration(report.kpis.avgDurationSeconds)}
                    </h3>
                    <p className="text-xs text-muted-foreground mt-2">
                      Active agents: {report.kpis.activeAgents}
                    </p>
                  </div>
                  <div className="p-2 rounded-full bg-purple-100 text-purple-700 dark:bg-purple-500/10">
                    <Timer className="w-5 h-5" />
                  </div>
                </div>
              </div>

              <div className="relative overflow-hidden rounded-xl border bg-card p-5 shadow-sm">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-xs text-muted-foreground">
                      Closed Tickets
                    </p>
                    <h3 className="text-3xl font-bold mt-1">
                      {report.kpis.closedTickets}
                    </h3>
                    <p className="text-xs text-muted-foreground mt-2">
                      Total calls {report.kpis.totalCalls}
                    </p>
                  </div>
                  <div className="p-2 rounded-full bg-amber-100 text-amber-700 dark:bg-amber-500/10">
                    <BarChart className="w-5 h-5" />
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 rounded-2xl border bg-card/80 backdrop-blur-sm p-6 shadow-lg">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-lg font-semibold text-foreground">
                    Call Activity
                  </h3>
                  <span className="text-xs text-muted-foreground">
                    Total calls: {report.kpis.totalCalls}
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
                        tick={{
                          fill: "hsl(var(--muted-foreground))",
                          fontSize: 12,
                        }}
                      />
                      <YAxis
                        axisLine={false}
                        tickLine={false}
                        tick={{
                          fill: "hsl(var(--muted-foreground))",
                          fontSize: 12,
                        }}
                      />
                      <Tooltip
                        contentStyle={{
                          background: "hsl(var(--background))",
                          borderRadius: "8px",
                          border: "1px solid hsl(var(--border))",
                        }}
                      />
                      <Legend />
                      <Bar
                        dataKey="total"
                        name="Total Calls"
                        fill="oklch(0.75 0.18 85)"
                        radius={[4, 4, 0, 0]}
                      />
                      <Bar
                        dataKey="closed"
                        name="Closed"
                        fill="oklch(0.65 0.18 160)"
                        radius={[4, 4, 0, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="rounded-2xl border bg-card/80 backdrop-blur-sm p-6 shadow-lg">
                <h3 className="text-lg font-semibold text-foreground mb-1">
                  Workflow Breakdown
                </h3>
                <p className="text-xs text-muted-foreground mb-6">
                  Disposition split by total tickets
                </p>

                <div className="h-64 relative">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={dispositionData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        dataKey="value"
                        paddingAngle={5}
                      >
                        {dispositionData.map((entry, i) => (
                          <Cell
                            key={entry.name}
                            fill={
                              DISPOSITION_COLORS[i % DISPOSITION_COLORS.length]
                            }
                          />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>

                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-2xl font-bold text-foreground">
                      {totalClosed}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      Closed tickets
                    </span>
                  </div>
                </div>

                <div className="space-y-3 mt-4">
                  {dispositionData.map((item, index) => (
                    <div
                      key={item.name}
                      className="flex items-center justify-between text-sm"
                    >
                      <div className="flex items-center gap-2">
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{
                            backgroundColor:
                              DISPOSITION_COLORS[
                                index % DISPOSITION_COLORS.length
                              ],
                          }}
                        />
                        <span className="text-muted-foreground">
                          {item.name}
                        </span>
                      </div>
                      <span className="font-medium text-foreground">
                        {item.value}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="rounded-2xl border bg-card/80 backdrop-blur-sm p-6 shadow-lg">
                <h3 className="text-lg font-semibold text-foreground mb-4">
                  Campaign Mix
                </h3>
                <div className="space-y-3 uppercase">
                  {report.campaignBreakdown.map((item) => (
                    <div
                      key={item.name}
                      className="flex items-center justify-between text-sm"
                    >
                      <span className="text-muted-foreground uppercase">
                        {item.name.toUpperCase()}
                      </span>
                      <span className="font-medium text-foreground">
                        {item.value}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="lg:col-span-2 rounded-2xl border bg-card/80 backdrop-blur-sm p-6 shadow-lg">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-foreground">
                    Top Agents
                  </h3>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Users className="h-4 w-4" />
                    {report.kpis.activeAgents} active
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="text-xs text-muted-foreground uppercase">
                        <th className="pb-2">Agent</th>
                        <th className="pb-2 text-right">Total</th>
                        <th className="pb-2 text-right">Closed</th>
                        <th className="pb-2 text-right">Avg Duration</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/40">
                      {topAgents.length ? (
                        topAgents.map((agent) => (
                          <tr key={agent.id} className="text-sm">
                            <td className="py-3 text-foreground font-medium">
                              {agent.name}
                            </td>
                            <td className="py-3 text-right text-muted-foreground">
                              {agent.totalTickets}
                            </td>
                            <td className="py-3 text-right text-muted-foreground">
                              {agent.closedTickets}
                            </td>
                            <td className="py-3 text-right text-muted-foreground">
                              {formattedDuration(agent.avgDurationSeconds)}
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td
                            className="py-6 text-center text-sm text-muted-foreground"
                            colSpan={4}
                          >
                            No agent activity in this period.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
