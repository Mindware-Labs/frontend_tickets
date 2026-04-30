"use client";

import React, { useEffect, useMemo, useState } from "react";
import { usePathname } from "next/navigation";
import {
  Search,
  Download,
  Trophy,
  PhoneOutgoing,
  Users,
  Loader2,
  CheckCircle,
  Timer,
  FileSpreadsheet,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "@/hooks/use-toast";
import { fetchBlobFromBackend } from "@/lib/api-client";
import { PaginationFooter } from "@/components/common/pagination-footer";

type AgentReport = {
  period: {
    label: string;
    start: string;
    end: string;
  };
  kpis: {
    totalAgents: number;
    totalTickets: number;
    closedTickets: number;
    openTickets: number;
    resolutionRate: number;
    avgDurationSeconds: number;
  };
  topPerformers: {
    byVolume: AgentRow | null;
    byResolution: AgentRow | null;
    byDuration: AgentRow | null;
  };
  agents: AgentRow[];
};

type AgentRow = {
  id: number;
  name: string;
  isActive?: boolean;
  totalTickets: number;
  closedTickets: number;
  openTickets: number;
  resolutionRate: number;
  avgDurationSeconds: number;
};

export default function AgentStatsPage() {
  const [startDate, setStartDate] = useState(() => {
    const date = new Date();
    date.setDate(date.getDate() - 7);
    return date.toISOString().slice(0, 10);
  });
  const [endDate, setEndDate] = useState(() =>
    new Date().toISOString().slice(0, 10)
  );
  const [searchTerm, setSearchTerm] = useState("");
  const [report, setReport] = useState<AgentReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

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
      const response = await fetch(`/api/reports/agents?${params.toString()}`);
      const result = await response.json();
      if (result?.success) {
        setReport(result.data);
      } else {
        setReport(null);
        toast({
          title: "Error",
          description: result?.message || "Failed to load agent report",
          variant: "destructive",
        });
      }
    } catch (error: any) {
      setReport(null);
      toast({
        title: "Error",
        description: error.message || "Failed to load agent report",
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

  const filteredAgents = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    if (!report?.agents) return [];
    return report.agents.filter((agent) =>
      agent.name.toLowerCase().includes(term)
    );
  }, [report, searchTerm]);

  const totalPages = Math.max(
    1,
    Math.ceil(filteredAgents.length / itemsPerPage)
  );
  const paginatedAgents = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredAgents.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredAgents, currentPage, itemsPerPage]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, itemsPerPage, report]);

  const handleExport = async (format: "pdf") => {
    if (!report) return;
    if (!startDate || !endDate) {
      toast({
        title: "Select dates",
        description: "Start and end date are required.",
        variant: "destructive",
      });
      return;
    }
    if (format === "pdf") {
      try {
        const params = new URLSearchParams({
          start: startDate,
          end: endDate,
        });
        const blob = await fetchBlobFromBackend(
          `/reports/agents/pdf?${params.toString()}&logoUrl=${encodeURIComponent(
            getLogoUrl()
          )}`,
          { method: "GET" }
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
        toast({
          title: "Error",
          description: error.message || "Failed to download PDF",
          variant: "destructive",
        });
      }
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
        `/reports/agents/excel?${params.toString()}`,
        { method: "GET" }
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
      toast({
        title: "Error",
        description: error.message || "Failed to download Excel",
        variant: "destructive",
      });
    }
  };

  const topByVolume = report?.topPerformers.byVolume;
  const topByResolution = report?.topPerformers.byResolution;
  const topByDuration = report?.topPerformers.byDuration;

  const dateLabel = report
    ? `${new Date(report.period.start).toLocaleDateString()} - ${new Date(
        report.period.end
      ).toLocaleDateString()}`
    : "";

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 p-4 md:p-8 animate-in fade-in duration-500">
      <div className="mx-auto max-w-7xl space-y-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-foreground drop-shadow-sm">
              Agent Performance
            </h1>
            <p className="text-sm text-muted-foreground">
              Individual productivity and resolution performance
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
              onClick={() => handleExport("pdf")}
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
            No data available.
          </div>
        ) : (
          <>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <div className="relative overflow-hidden rounded-xl border bg-card p-5 shadow-sm">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">
                      Top Volume
                    </p>
                    <h3 className="text-2xl font-bold">
                      {topByVolume?.name || "N/A"}
                    </h3>
                    <p className="text-xs text-muted-foreground mt-2">
                      {topByVolume
                        ? `${topByVolume.totalTickets} tickets handled`
                        : "No activity"}
                    </p>
                  </div>
                  <div className="p-2 rounded-full bg-amber-100 text-amber-700 dark:bg-amber-500/10">
                    <Trophy className="w-6 h-6" />
                  </div>
                </div>
              </div>

              <div className="relative overflow-hidden rounded-xl border bg-card p-5 shadow-sm">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">
                      Best Resolution
                    </p>
                    <h3 className="text-2xl font-bold">
                      {topByResolution?.name || "N/A"}
                    </h3>
                    <p className="text-xs text-emerald-600 mt-2 font-medium">
                      {topByResolution
                        ? `${topByResolution.resolutionRate}% resolution`
                        : "No activity"}
                    </p>
                  </div>
                  <div className="p-2 rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10">
                    <CheckCircle className="w-5 h-5" />
                  </div>
                </div>
              </div>

              <div className="relative overflow-hidden rounded-xl border bg-card p-5 shadow-sm">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">
                      Fastest Avg Duration
                    </p>
                    <h3 className="text-2xl font-bold">
                      {topByDuration?.name || "N/A"}
                    </h3>
                    <p className="text-xs text-primary mt-2 font-medium">
                      {topByDuration
                        ? formattedDuration(topByDuration.avgDurationSeconds)
                        : "No data"}
                    </p>
                  </div>
                  <div className="p-2 rounded-full bg-blue-100 text-blue-700 dark:bg-blue-500/10">
                    <Timer className="w-5 h-5" />
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border bg-card/80 backdrop-blur-sm shadow-lg shadow-slate-200/60 dark:shadow-slate-950/40 overflow-hidden">
              <div className="p-4 border-b flex flex-col sm:flex-row justify-between items-center gap-4">
                <div className="relative w-full sm:w-72">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    type="text"
                    placeholder="Search agent..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 rounded-lg text-sm"
                  />
                </div>
                <div className="text-xs text-muted-foreground flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  {report.kpis.totalAgents} agents active in period
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-muted/50 text-muted-foreground text-xs uppercase tracking-wider font-semibold">
                      <th className="px-6 py-4">Agent</th>
                      <th className="px-6 py-4 text-center">Status</th>
                      <th className="px-6 py-4 text-right">Total</th>
                      <th className="px-6 py-4 text-right">Closed</th>
                      <th className="px-6 py-4 text-right">Active</th>
                      <th className="px-6 py-4 text-right">Resolution</th>
                      <th className="px-6 py-4 text-right">Avg Duration</th>
                      <th className="px-6 py-4"></th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-border/40">
                    {paginatedAgents.map((agent) => (
                      <tr
                        key={agent.id}
                        className="hover:bg-muted/40 transition-colors"
                      >
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center text-xs font-bold text-muted-foreground">
                              {agent.name
                                ? agent.name.substring(0, 2).toUpperCase()
                                : "NA"}
                            </div>
                            <div>
                              <p className="text-sm font-medium text-foreground">
                                {agent.name}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                ID {agent.id}
                              </p>
                            </div>
                          </div>
                        </td>

                        <td className="px-6 py-4 text-center">
                          <span
                            className={`inline-flex px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                              agent.isActive
                                ? "bg-emerald-500 text-white"
                                : "bg-muted text-muted-foreground"
                            }`}
                          >
                            {agent.isActive ? "Active" : "Inactive"}
                          </span>
                        </td>

                        <td className="px-6 py-4 text-right text-sm text-muted-foreground font-medium">
                          {agent.totalTickets}
                        </td>

                        <td className="px-6 py-4 text-right text-sm text-muted-foreground">
                          {agent.closedTickets}
                        </td>

                        <td className="px-6 py-4 text-right text-sm text-muted-foreground">
                          {agent.openTickets}
                        </td>

                        <td className="px-6 py-4 text-right text-sm font-medium text-foreground">
                          {agent.resolutionRate}%
                        </td>

                        <td className="px-6 py-4 text-right text-sm text-muted-foreground">
                          {formattedDuration(agent.avgDurationSeconds)}
                        </td>

                        <td className="px-6 py-4 text-right text-xs text-muted-foreground">
                          <div className="flex items-center justify-end gap-1">
                            <PhoneOutgoing className="w-3 h-3" />
                            {agent.totalTickets}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="p-4 border-t flex flex-col sm:flex-row gap-3 sm:gap-6 sm:items-center sm:justify-between text-sm text-muted-foreground">
                <span className="hidden sm:inline">
                  Total tickets: {report.kpis.totalTickets}
                </span>
                <PaginationFooter
                  totalCount={filteredAgents.length}
                  currentPage={currentPage}
                  totalPages={totalPages}
                  itemsPerPage={itemsPerPage}
                  onItemsPerPageChange={(value) => setItemsPerPage(value)}
                  onPageChange={(value) => setCurrentPage(value)}
                  itemLabel="agents"
                />
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
