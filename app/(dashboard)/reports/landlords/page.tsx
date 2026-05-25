"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";
import { useReportSession } from "@/hooks/use-report-session";
import { fetchBlobFromBackend } from "@/lib/api-client";
import { fetchFromBackend } from "@/lib/api-client";
import type { Landlord, YardOption } from "../../landlords/types";
import { useRole } from "@/components/providers/role-provider";
import { LandlordFiltersSheet } from "./Components/LandlordFiltersSheet";
import {
  FileText,
  Download,
  PhoneIncoming,
  PhoneOutgoing,
  BarChart3,
  Home,
  Mail,
  Filter,
  Activity,
  FileSpreadsheet,
  SlidersHorizontal,
  Loader2,
  Building,
  TrendingUp,
  CheckCircle2,
  XCircle,
  Clock,
  AlertCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

// ═══════════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════════

type LandlordReport = {
  totals: { total: number; inbound: number; outbound: number };
  averagePerYard: number;
  topYards: Array<{ id: number; name: string; total: number }>;
  callsByDay: Array<{ date: string; total: number; inbound: number; outbound: number }>;
  yards: Array<{ id: number; name: string; total: number; inbound: number; outbound: number }>;
  statusBreakdown: Record<string, number>;
};

// ═══════════════════════════════════════════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════════════════════════════════════════

const STATUS_STYLES: Record<string, { bg: string; text: string; border: string; icon: React.ReactNode }> = {
  OPEN:            { bg: "bg-blue-50",   text: "text-blue-700",   border: "border-blue-200",   icon: <AlertCircle className="h-3.5 w-3.5" /> },
  IN_PROGRESS:     { bg: "bg-sky-50",    text: "text-sky-700",    border: "border-sky-200",    icon: <Activity className="h-3.5 w-3.5" /> },
  PENDING_FOLLOWUP:{ bg: "bg-amber-50",  text: "text-amber-700",  border: "border-amber-200",  icon: <Clock className="h-3.5 w-3.5" /> },
  OVERDUE:         { bg: "bg-red-50",    text: "text-red-700",    border: "border-red-200",    icon: <XCircle className="h-3.5 w-3.5" /> },
  RESOLVED:        { bg: "bg-green-50",  text: "text-green-700",  border: "border-green-200",  icon: <CheckCircle2 className="h-3.5 w-3.5" /> },
  CLOSED:          { bg: "bg-emerald-50",text: "text-emerald-700",border: "border-emerald-200",icon: <CheckCircle2 className="h-3.5 w-3.5" /> },
};

const DEFAULT_STATUS_STYLE = { bg: "bg-slate-100", text: "text-slate-600", border: "border-slate-200", icon: <BarChart3 className="h-3.5 w-3.5" /> };

// ═══════════════════════════════════════════════════════════════════════════════
// SUB-COMPONENTS
// ═══════════════════════════════════════════════════════════════════════════════

const MetricCard = ({
  title,
  value,
  icon,
  color,
  subtitle,
}: {
  title: string;
  value: number | string;
  icon?: React.ReactNode;
  color?: string;
  subtitle?: string;
}) => (
  <div className="relative overflow-hidden rounded-xl border bg-card p-6 shadow-sm transition-all hover:shadow-md">
    <div className="flex items-center justify-between pb-2">
      <p className="text-sm font-medium text-muted-foreground">{title}</p>
      {icon && <div className={cn("rounded-full p-2 bg-opacity-10", color)}>{icon}</div>}
    </div>
    <div className="flex items-baseline gap-2">
      <div className="text-3xl font-bold tracking-tight text-black dark:text-white">{value}</div>
      {subtitle && <span className="text-xs text-muted-foreground">{subtitle}</span>}
    </div>
  </div>
);

const StatusBreakdown = ({ statusBreakdown, total }: { statusBreakdown: Record<string, number>; total: number }) => {
  const entries = Object.entries(statusBreakdown).filter(([, count]) => count > 0);
  if (entries.length === 0) return null;

  return (
    <div className="rounded-xl border bg-card shadow-sm">
      <div className="border-b px-6 py-4">
        <h3 className="font-semibold flex items-center gap-2">
          <BarChart3 className="h-4 w-4" />
          Status Breakdown
        </h3>
        <p className="text-sm text-muted-foreground mt-1">{total} total calls across all statuses</p>
      </div>
      <div className="p-4">
        <div className="flex flex-wrap gap-3">
          {entries.map(([status, count]) => {
            const style = STATUS_STYLES[status] || DEFAULT_STATUS_STYLE;
            const pct = total > 0 ? Math.round((count / total) * 100) : 0;
            const label = status.toLowerCase().split("_").map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
            return (
              <div key={status} className={cn("flex items-center gap-2 rounded-lg border px-4 py-3", style.bg, style.border)}>
                <span className={style.text}>{style.icon}</span>
                <div>
                  <div className={cn("text-lg font-bold", style.text)}>{count}</div>
                  <div className="text-xs text-muted-foreground">{label} ({pct}%)</div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN PAGE
// ═══════════════════════════════════════════════════════════════════════════════

export default function LandlordReportsPage() {
  const { role } = useRole();
  const normalizedRole = role?.toString().toLowerCase();
  const isAgent = normalizedRole === "agent";
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const landlordIdParam = searchParams.get("landlordId");

  const [landlords, setLandlords] = useState<Landlord[]>([]);
  const [yards, setYards] = useState<YardOption[]>([]);
  const [selectedLandlordId, setSelectedLandlordId] = useState<string>("");
  const [landlordOpen, setLandlordOpen] = useState(false);
  const [reportStartDate, setReportStartDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 7);
    return d.toISOString().slice(0, 10);
  });
  const [reportEndDate, setReportEndDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [reportYardId, setReportYardId] = useState("all");
  const [reportLoading, setReportLoading] = useState(false);
  const [reportSending, setReportSending] = useState(false);
  const [reportError, setReportError] = useState<string | null>(null);
  const [reportData, setReportData] = useState<LandlordReport | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(false);

  const getLogoUrl = () =>
    typeof window !== "undefined" ? `${window.location.origin}/images/logo.jpeg` : "/images/logo.jpeg";

  useEffect(() => {
    if (isAgent) {
      router.replace("/landlords");
      return;
    }
    const loadLandlords = async () => {
      try {
        const data = await fetchFromBackend("/landlords?page=1&limit=500");
        setLandlords(Array.isArray(data) ? data : (data?.data ?? []));
      } catch {
        toast({ title: "Error", description: "Failed to load landlords", variant: "destructive" });
      }
    };
    const loadYards = async () => {
      try {
        const data = await fetchFromBackend("/yards");
        setYards(Array.isArray(data) ? data : (data?.data ?? []));
      } catch {
        console.error("Failed to load yards");
      }
    };
    loadLandlords();
    loadYards();
  }, [isAgent, router]);

  useEffect(() => {
    if (landlordIdParam) setSelectedLandlordId(landlordIdParam);
  }, [landlordIdParam]);

  useEffect(() => {
    setConfirmOpen(false);
  }, [pathname]);

  // ── Remember "where I left off" between sidebar navigations ────────────
  // Most of this report's state lives in component state (dates, yard
  // filter), so we ship it through the snapshot's `state` blob and only the
  // landlordId travels via URL — that lets the existing param effect
  // re-hydrate the selection.
  const reportSessionSearch = useMemo(() => {
    const params = new URLSearchParams();
    if (selectedLandlordId) params.set("landlordId", selectedLandlordId);
    return params.toString();
  }, [selectedLandlordId]);

  useReportSession<{
    reportStartDate: string;
    reportEndDate: string;
    reportYardId: string;
  }>({
    scope: "reports/landlords",
    isUrlBare: !landlordIdParam,
    searchString: reportSessionSearch,
    state: { reportStartDate, reportEndDate, reportYardId },
    onRestoreState: (saved) => {
      if (!saved) return;
      if (saved.reportStartDate) setReportStartDate(saved.reportStartDate);
      if (saved.reportEndDate) setReportEndDate(saved.reportEndDate);
      if (saved.reportYardId) setReportYardId(saved.reportYardId);
    },
    enabled: !isAgent,
  });

  if (isAgent) return null;

  const selectedLandlord = useMemo(
    () => landlords.find((l) => l.id.toString() === selectedLandlordId) ?? null,
    [landlords, selectedLandlordId],
  );

  const yardOptions = useMemo(() => {
    if (!selectedLandlord) return [];
    const fromRelation = selectedLandlord.yards?.map((y) => ({ id: y.id, label: y.commonName || y.name })) ?? [];
    if (fromRelation.length > 0) return fromRelation;
    return yards
      .filter((y) => y.landlord?.id === selectedLandlord.id)
      .map((y) => ({ id: y.id, label: y.commonName || y.name }));
  }, [selectedLandlord, yards]);

  // ── Handlers (preserved) ──────────────────────────────────────────────────

  const handleGenerateReport = async () => {
    if (!selectedLandlordId) {
      toast({ title: "Select a landlord", description: "Pick a landlord before generating the report.", variant: "destructive" });
      return;
    }
    setReportLoading(true);
    setReportError(null);
    try {
      const query = new URLSearchParams({ startDate: reportStartDate, endDate: reportEndDate });
      if (reportYardId !== "all") query.set("yardId", reportYardId);
      query.set("logoUrl", getLogoUrl());
      const response = await fetch(`/api/landlords/${selectedLandlordId}/report?${query.toString()}`);
      const result = await response.json();
      if (!response.ok) throw new Error(result?.message || result?.error || "Failed to load report");
      setReportData(result);
    } catch (error: any) {
      setReportError(error.message || "Failed to generate report");
    } finally {
      setReportLoading(false);
    }
  };

  const handleSendReport = async () => {
    if (!selectedLandlordId || !selectedLandlord) {
      toast({ title: "Select a landlord", description: "Pick a landlord before sending the report.", variant: "destructive" });
      return;
    }
    setReportSending(true);
    setReportError(null);
    try {
      const payload: any = { startDate: reportStartDate, endDate: reportEndDate };
      if (reportYardId !== "all") payload.yardId = Number(reportYardId);
      payload.logoUrl = getLogoUrl();
      const response = await fetch(`/api/landlords/${selectedLandlordId}/report`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result?.message || result?.error || "Failed to send report");
      toast({ title: "Report sent", description: `Report emailed to ${selectedLandlord.email}` });
    } catch (error: any) {
      setReportError(error.message || "Failed to send report");
    } finally {
      setReportSending(false);
    }
  };

  const handleDownloadReport = async () => {
    if (!reportData || !selectedLandlord) return;
    try {
      const query = new URLSearchParams({ startDate: reportStartDate, endDate: reportEndDate });
      if (reportYardId !== "all") query.set("yardId", reportYardId);
      query.set("logoUrl", getLogoUrl());
      const blob = await fetchBlobFromBackend(`/landlords/${selectedLandlordId}/report/pdf?${query.toString()}`, { method: "GET" });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `landlord_report_${selectedLandlordId}.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error: any) {
      toast({ title: "Error", description: error.message || "Failed to download report.", variant: "destructive" });
    }
  };

  const handleDownloadExcel = async () => {
    if (!reportData || !selectedLandlord) return;
    try {
      const query = new URLSearchParams({ startDate: reportStartDate, endDate: reportEndDate });
      if (reportYardId !== "all") query.set("yardId", reportYardId);
      const blob = await fetchBlobFromBackend(`/landlords/${selectedLandlordId}/report/excel?${query.toString()}`, { method: "GET" });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `landlord_report_${selectedLandlordId}.xlsx`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error: any) {
      toast({ title: "Error", description: error.message || "Failed to download Excel report.", variant: "destructive" });
    }
  };

  // ── Derived ───────────────────────────────────────────────────────────────

  const topYard = reportData?.topYards?.[0] ?? null;
  const activeYards = reportData?.yards?.filter((y) => y.total > 0).length ?? 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 p-4 md:p-8 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 animate-in fade-in duration-500">
      <div className="mx-auto max-w-7xl space-y-10">

        {/* ── Header ── */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between pb-5 border-b">
          <div className="space-y-1.5">
            <h1 className="text-3xl font-bold tracking-tight text-foreground drop-shadow-sm">
              Landlord Reports
            </h1>
            <p className="text-sm text-muted-foreground">
              {selectedLandlord && reportData
                ? `${selectedLandlord.name} · ${reportStartDate} to ${reportEndDate}`
                : "Select a landlord and date range to generate analytics"}
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Button
              variant="default"
              onClick={() => setFiltersOpen(true)}
              className="gap-2 shadow-sm"
            >
              <SlidersHorizontal className="h-4 w-4" />
              Configure Report
            </Button>

            {reportData && (
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  onClick={() => setConfirmOpen(true)}
                  disabled={reportSending || reportLoading}
                  className="gap-2 hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200"
                >
                  <Mail className="h-4 w-4" />
                  <span className="hidden sm:inline">{reportSending ? "Sending..." : "Email"}</span>
                </Button>
                <Button
                  variant="outline"
                  onClick={handleDownloadReport}
                  className="gap-2 hover:bg-rose-50 hover:text-rose-600 hover:border-rose-200"
                >
                  <Download className="h-4 w-4" />
                  <span className="hidden sm:inline">PDF</span>
                </Button>
                <Button
                  variant="outline"
                  onClick={handleDownloadExcel}
                  className="gap-2 hover:bg-emerald-50 hover:text-emerald-600 hover:border-emerald-200"
                >
                  <FileSpreadsheet className="h-4 w-4" />
                  <span className="hidden sm:inline">Excel</span>
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* ── Filters Sheet ── */}
        <LandlordFiltersSheet
          open={filtersOpen}
          onOpenChange={setFiltersOpen}
          landlords={landlords}
          selectedLandlordId={selectedLandlordId}
          landlordOpen={landlordOpen}
          onLandlordOpenChange={setLandlordOpen}
          onLandlordSelect={(id) => {
            setSelectedLandlordId(id);
            setReportYardId("all");
            setReportData(null);
            setReportError(null);
            setLandlordOpen(false);
          }}
          yardOptions={yardOptions}
          reportYardId={reportYardId}
          onReportYardIdChange={setReportYardId}
          startDate={reportStartDate}
          endDate={reportEndDate}
          onStartDateChange={setReportStartDate}
          onEndDateChange={setReportEndDate}
          canExport={Boolean(reportData)}
          reportLoading={reportLoading}
          onGenerate={handleGenerateReport}
          onExportPDF={handleDownloadReport}
          onExportExcel={handleDownloadExcel}
        />

        {/* ── Email confirmation dialog ── */}
        <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Send report by email?</AlertDialogTitle>
              <AlertDialogDescription>
                The landlord activity report will be sent to{" "}
                <span className="font-semibold">{selectedLandlord?.email || "the configured address"}</span>.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={reportSending}>Cancel</AlertDialogCancel>
              <AlertDialogAction
                disabled={reportSending}
                onClick={async () => { setConfirmOpen(false); await handleSendReport(); }}
              >
                {reportSending ? "Sending..." : "Send report"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* ── Error banner ── */}
        {reportError && (
          <div className="rounded-lg bg-destructive/10 p-4 text-sm text-destructive border border-destructive/20 flex items-center gap-2">
            <AlertCircle className="h-4 w-4 shrink-0" />
            {reportError}
          </div>
        )}

        {/* ── Content ── */}
        {reportLoading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            <span className="ml-2 text-muted-foreground">Generating report...</span>
          </div>
        ) : !reportData ? (
          <div className="flex min-h-[420px] flex-col items-center justify-center rounded-2xl border-2 border-dashed bg-gradient-to-br from-muted/30 to-muted/10 p-8 text-center animate-in zoom-in-95 duration-300">
            <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-primary/10 ring-8 ring-primary/5">
              <Filter className="h-10 w-10 text-primary" />
            </div>
            <h3 className="text-xl font-bold">Configure report to view analytics</h3>
            <p className="mb-6 mt-3 max-w-md text-sm text-muted-foreground">
              Select a landlord and date range to load performance data and detailed breakdowns.
            </p>
            <Button onClick={() => setFiltersOpen(true)} className="gap-2" size="lg">
              <SlidersHorizontal className="h-4 w-4" />
              Configure Report
            </Button>
          </div>
        ) : (
          <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-500">

            {/* ── KPI Cards ── */}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <MetricCard
                title="Total Calls"
                value={reportData.totals.total}
                icon={<BarChart3 className="h-4 w-4 text-slate-600" />}
                color="text-slate-600"
                subtitle={`${reportData.yards.length} yard${reportData.yards.length !== 1 ? "s" : ""}`}
              />
              <MetricCard
                title="Inbound"
                value={reportData.totals.inbound}
                icon={<PhoneIncoming className="h-4 w-4 text-emerald-600" />}
                color="text-emerald-600"
                subtitle={reportData.totals.total > 0 ? `${Math.round((reportData.totals.inbound / reportData.totals.total) * 100)}%` : undefined}
              />
              <MetricCard
                title="Outbound"
                value={reportData.totals.outbound}
                icon={<PhoneOutgoing className="h-4 w-4 text-amber-600" />}
                color="text-amber-600"
                subtitle={reportData.totals.total > 0 ? `${Math.round((reportData.totals.outbound / reportData.totals.total) * 100)}%` : undefined}
              />
              <MetricCard
                title="Avg / Yard"
                value={reportData.averagePerYard}
                icon={<Home className="h-4 w-4 text-blue-600" />}
                color="text-blue-600"
                subtitle={activeYards > 0 ? `${activeYards} active` : undefined}
              />
            </div>

            {/* ── Status Breakdown ── */}
            <StatusBreakdown statusBreakdown={reportData.statusBreakdown} total={reportData.totals.total} />

            {/* ── Yard + Daily tables ── */}
            <div className="grid gap-6 md:grid-cols-2">
              {/* Yard Breakdown */}
              <div className="flex flex-col rounded-xl border bg-card text-card-foreground shadow-sm">
                <div className="border-b px-6 py-4 bg-slate-50/50 dark:bg-slate-950/20">
                  <h3 className="font-semibold flex items-center gap-2">
                    <Building className="h-4 w-4 text-muted-foreground" />
                    Yard Breakdown
                  </h3>
                  <p className="text-xs text-muted-foreground mt-0.5">{reportData.yards.length} yards in range</p>
                </div>
                <div className="max-h-[400px] overflow-y-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-muted/50 text-xs uppercase text-muted-foreground sticky top-0">
                      <tr>
                        <th className="px-5 py-3 text-left font-semibold">Yard</th>
                        <th className="px-5 py-3 text-right font-semibold">Total</th>
                        <th className="px-5 py-3 text-right font-semibold">In</th>
                        <th className="px-5 py-3 text-right font-semibold">Out</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {reportData.yards.length === 0 ? (
                        <tr>
                          <td colSpan={4} className="px-5 py-6 text-center text-muted-foreground text-sm">
                            No data available
                          </td>
                        </tr>
                      ) : (
                        reportData.yards
                          .slice()
                          .sort((a, b) => b.total - a.total)
                          .map((yard) => (
                            <tr key={yard.id} className="hover:bg-muted/30 transition-colors">
                              <td className="px-5 py-3 font-medium truncate max-w-[160px]">{yard.name}</td>
                              <td className="px-5 py-3 text-right font-bold">{yard.total}</td>
                              <td className="px-5 py-3 text-right text-emerald-600 font-medium">{yard.inbound}</td>
                              <td className="px-5 py-3 text-right text-amber-600 font-medium">{yard.outbound}</td>
                            </tr>
                          ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Calls by Day */}
              <div className="flex flex-col rounded-xl border bg-card text-card-foreground shadow-sm">
                <div className="border-b px-6 py-4 bg-slate-50/50 dark:bg-slate-950/20">
                  <h3 className="font-semibold flex items-center gap-2">
                    <Activity className="h-4 w-4 text-muted-foreground" />
                    Calls by Day
                  </h3>
                  <p className="text-xs text-muted-foreground mt-0.5">{reportData.callsByDay.length} days with activity</p>
                </div>
                <div className="max-h-[400px] overflow-y-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-muted/50 text-xs uppercase text-muted-foreground sticky top-0">
                      <tr>
                        <th className="px-5 py-3 text-left font-semibold">Date</th>
                        <th className="px-5 py-3 text-right font-semibold">Total</th>
                        <th className="px-5 py-3 text-right font-semibold">In</th>
                        <th className="px-5 py-3 text-right font-semibold">Out</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {reportData.callsByDay.length === 0 ? (
                        <tr>
                          <td colSpan={4} className="px-5 py-6 text-center text-muted-foreground text-sm">
                            No data available
                          </td>
                        </tr>
                      ) : (
                        reportData.callsByDay.map((day) => (
                          <tr key={day.date} className="hover:bg-muted/30 transition-colors">
                            <td className="px-5 py-3 font-medium">{day.date}</td>
                            <td className="px-5 py-3 text-right font-bold">{day.total}</td>
                            <td className="px-5 py-3 text-right text-emerald-600 font-medium">{day.inbound}</td>
                            <td className="px-5 py-3 text-right text-amber-600 font-medium">{day.outbound}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* ── Top Yards + Top Yard Highlight ── */}
            <div className="grid gap-6 md:grid-cols-2">
              <div className="rounded-xl border bg-card p-6 shadow-sm">
                <h3 className="font-semibold mb-4 flex items-center gap-2 text-sm uppercase tracking-wider text-muted-foreground">
                  <TrendingUp className="h-4 w-4" />
                  Top Performing Yards
                </h3>
                <div className="space-y-3">
                  {reportData.topYards.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No data.</p>
                  ) : (
                    reportData.topYards.map((yard, i) => {
                      const maxTotal = reportData.topYards[0]?.total || 1;
                      const pct = Math.round((yard.total / maxTotal) * 100);
                      return (
                        <div key={yard.id} className="space-y-1.5">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                                {i + 1}
                              </div>
                              <span className="font-medium text-sm truncate max-w-[160px]">{yard.name}</span>
                            </div>
                            <Badge variant="secondary" className="font-bold">{yard.total}</Badge>
                          </div>
                          <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
                            <div
                              className="h-full rounded-full bg-primary transition-all duration-500"
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              {topYard && (
                <div className="rounded-xl border bg-gradient-to-br from-primary/5 to-primary/10 p-6 shadow-sm flex flex-col justify-between">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-1.5">
                      <TrendingUp className="h-3.5 w-3.5" /> Top Yard
                    </p>
                    <div className="flex items-start gap-4">
                      <div className="h-12 w-12 rounded-xl bg-primary/20 flex items-center justify-center shrink-0">
                        <Building className="h-6 w-6 text-primary" />
                      </div>
                      <div>
                        <p className="text-xl font-bold leading-tight">{topYard.name}</p>
                        <p className="text-sm text-muted-foreground mt-0.5">Highest call volume</p>
                      </div>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-3 mt-6">
                    {[
                      { label: "Total", value: topYard.total, color: "text-foreground" },
                      { label: "Inbound", value: reportData.yards.find((y) => y.id === topYard.id)?.inbound ?? 0, color: "text-emerald-600" },
                      { label: "Outbound", value: reportData.yards.find((y) => y.id === topYard.id)?.outbound ?? 0, color: "text-amber-600" },
                    ].map(({ label, value, color }) => (
                      <div key={label} className="bg-background/70 rounded-lg p-3 text-center border border-border/50">
                        <p className={cn("text-xl font-bold", color)}>{value}</p>
                        <p className="text-[10px] text-muted-foreground mt-0.5">{label}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
