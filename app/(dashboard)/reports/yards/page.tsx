"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Loader2,
  Building,
  SlidersHorizontal,
  AlertCircle,
} from "lucide-react";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { toast } from "@/hooks/use-toast";
import { useDialogCleanup } from "@/hooks/use-dialog-cleanup";
import { fetchBlobFromBackend, fetchFromBackend } from "@/lib/api-client";
import { FiltersSheet } from "./components/FiltersSheet";
import { ReportHeader } from "./components/ReportHeader";
import { YardDashboard } from "./components/YardDashboard";
import { YardRecordsModal } from "./components/YardRecordsModal";
import { YardsOverview } from "./components/YardsOverview";
import { Button } from "@/components/ui/button";
import { dashboardCanvasClass } from "@/app/(dashboard)/dashboard/dashboard-theme";
import type { Ticket, Yard, YardStats } from "./components/types";

const parseLocalDateStart = (value: string) => {
  const [year, month, day] = value.split("-").map(Number);
  return new Date(year, month - 1, day, 0, 0, 0, 0);
};

const parseLocalDateEnd = (value: string) => {
  const [year, month, day] = value.split("-").map(Number);
  return new Date(year, month - 1, day, 23, 59, 59, 999);
};

type YardsOverviewReportRow = {
  yard?: Partial<Yard> & { id: number | string; name?: string | null };
  id?: number | string;
  name?: string | null;
  commonName?: string | null;
  isActive?: boolean | null;
  totalTickets?: number | string | null;
  totalCalls?: number | string | null;
  totalManualRecords?: number | string | null;
  openTickets?: number | string | null;
  inProgressTickets?: number | string | null;
  closedTickets?: number | string | null;
  lastActivity?: string | null;
};

const toSafeNumber = (value: unknown) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

const buildEmptyYardStats = (yard: Yard): YardStats => ({
  yard,
  totalTickets: 0,
  openTickets: 0,
  inProgressTickets: 0,
  closedTickets: 0,
  resolutionRate: 0,
  todayTickets: 0,
  lastActivity: null,
  ticketsByStatus: [],
  ticketsByDirection: [],
  ticketsByDisposition: [],
  ticketsByPriority: [],
  ticketsByDay: [],
  ticketsByAgent: [],
  ticketsByCampaign: [],
  ticketsByNewLead: [],
  newLeadCallsCount: 0,
  newLeadCustomersCount: 0,
  missedInbound: 0,
  missedOutbound: 0,
  activeAgents: 0,
  callResolutionRate: 0,
  callsByDay: [],
  manualRecordsByDay: [],
  newLeadPreview: [],
  avgResolutionTime: undefined,
  peakDay: undefined,
  peakDayCount: undefined,
});

const mapOverviewRowToYardStats = (row: YardsOverviewReportRow): YardStats | null => {
  const rawYardId = row.yard?.id ?? row.id;
  if (rawYardId === null || rawYardId === undefined) {
    return null;
  }

  const yardId = toSafeNumber(rawYardId);
  if (!yardId) {
    return null;
  }

  const yard: Yard = {
    id: yardId,
    name: row.yard?.name?.trim() || row.name?.trim() || `Yard #${yardId}`,
    commonName: row.yard?.commonName ?? row.commonName ?? null,
    isActive:
      row.yard?.isActive ??
      (typeof row.isActive === "boolean" ? row.isActive : true),
  };

  return {
    ...buildEmptyYardStats(yard),
    totalTickets: toSafeNumber(row.totalTickets),
    totalCalls: toSafeNumber(row.totalCalls),
    totalManualRecords: toSafeNumber(row.totalManualRecords),
    openTickets: toSafeNumber(row.openTickets),
    inProgressTickets: toSafeNumber(row.inProgressTickets),
    closedTickets: toSafeNumber(row.closedTickets),
    lastActivity: row.lastActivity || null,
  };
};

export default function YardReportsPage() {
  useDialogCleanup();
  const searchParams = useSearchParams();
  const router = useRouter();
  const yardIdParam = searchParams.get("yardId");
  const openFiltersParam = searchParams.get("openFilters");
  const startDateParam = searchParams.get("startDate");
  const endDateParam = searchParams.get("endDate");

  const [yards, setYards] = useState<Yard[]>([]);
  const [selectedYardId, setSelectedYardId] = useState<string>("");
  const [yardOpen, setYardOpen] = useState(false);
  const [filtersModalOpen, setFiltersModalOpen] = useState(false);
  const [loadingYards, setLoadingYards] = useState(false);
  const [yardsStats, setYardsStats] = useState<YardStats[]>([]);
  const [selectedYardStats, setSelectedYardStats] = useState<YardStats | null>(
    null,
  );
  const [loadingOverviewStats, setLoadingOverviewStats] = useState(false);
  const [loadingSelectedYardDetail, setLoadingSelectedYardDetail] =
    useState(false);
  const [selectedYardTickets, setSelectedYardTickets] = useState<Ticket[]>([]);
  const [showYardRecordsModal, setShowYardRecordsModal] = useState(false);
  const [startDate, setStartDate] = useState<string>(startDateParam || "");
  const [endDate, setEndDate] = useState<string>(endDateParam || "");
  const [reportLastUpdated, setReportLastUpdated] = useState<string | null>(
    null,
  );

  const isDateRangeValid = useMemo(() => {
    if (!startDate || !endDate) return true;
    try {
      return parseLocalDateStart(startDate) <= parseLocalDateEnd(endDate);
    } catch (e) {
      return true;
    }
  }, [startDate, endDate]);

  const selectedYardQueryKey = useMemo(() => {
    if (!selectedYardId || !startDate || !endDate || !isDateRangeValid) {
      return "";
    }
    return `${selectedYardId}|${startDate}|${endDate}`;
  }, [selectedYardId, startDate, endDate, isDateRangeValid]);

  const loadingStats = loadingOverviewStats || loadingSelectedYardDetail;

  useEffect(() => {
    const fetchYards = async () => {
      try {
        setLoadingYards(true);
        const data = await fetchFromBackend("/yards?page=1&limit=10000");
        const items = Array.isArray(data) ? data : data?.data || [];
        setYards(items.filter((yard: Yard) => yard.isActive !== false));
      } catch (error: any) {
        console.error("Error fetching yards:", error);

        let errorMessage = "Failed to load yards";
        if (
          error?.isNetworkError ||
          error?.message?.includes("fetch failed") ||
          error?.message?.includes("Failed to fetch")
        ) {
          errorMessage =
            "Cannot connect to backend server. Please check if the backend is running.";
        } else if (error?.status === 401) {
          errorMessage = "Session expired. Please login again.";
        } else if (error?.message) {
          errorMessage = error.message;
        }

        toast({
          title: "Error",
          description: errorMessage,
          variant: "destructive",
        });
      } finally {
        setLoadingYards(false);
      }
    };

    fetchYards();
  }, []);

  useEffect(() => {
    if (!startDate || !endDate || !isDateRangeValid) {
      setLoadingOverviewStats(false);
      setYardsStats([]);
      return;
    }

    let cancelled = false;

    const fetchYardsOverview = async () => {
      try {
        setLoadingOverviewStats(true);
        const params = new URLSearchParams({
          start: startDate,
          end: endDate,
        });
        const response = await fetchFromBackend(`/reports/yards?${params.toString()}`);
        if (cancelled) return;

        const rows: YardsOverviewReportRow[] = Array.isArray(response)
          ? response
          : response?.data || [];
        const overviewStats = rows
          .map(mapOverviewRowToYardStats)
          .filter(Boolean) as YardStats[];
        setYardsStats(overviewStats);
      } catch (error: any) {
        if (cancelled) return;
        console.error("Error fetching yard overview stats:", error);
        setYardsStats([]);

        let errorMessage = "Failed to load yard statistics";
        if (
          error?.isNetworkError ||
          error?.message?.includes("fetch failed") ||
          error?.message?.includes("Failed to fetch")
        ) {
          errorMessage =
            "Cannot connect to backend server. Please check if the backend is running.";
        } else if (error?.status === 401) {
          errorMessage = "Session expired. Please login again.";
        } else if (error?.message) {
          errorMessage = error.message;
        }

        toast({
          title: "Error",
          description: errorMessage,
          variant: "destructive",
        });
      } finally {
        if (!cancelled) {
          setLoadingOverviewStats(false);
        }
      }
    };

    fetchYardsOverview();
    return () => {
      cancelled = true;
    };
  }, [startDate, endDate, isDateRangeValid]);

  useEffect(() => {
    if (!selectedYardQueryKey) {
      setLoadingSelectedYardDetail(false);
      setSelectedYardTickets([]);
      setSelectedYardStats(null);
      return;
    }

    let cancelled = false;

    const fetchSelectedYardTickets = async () => {
      try {
        setLoadingSelectedYardDetail(true);
        setSelectedYardTickets([]);
        setSelectedYardStats(null);

        const pageSize = 1000;

        const fetchTicketsPage = async (pageNumber: number) => {
          const params = new URLSearchParams({
            page: String(pageNumber),
            limit: String(pageSize),
            sortBy: "createdAt",
            order: "ASC",
            start: startDate,
            end: endDate,
          });

          return fetchFromBackend(`/yards/${selectedYardId}/tickets?${params.toString()}`);
        };

        const firstResponse = await fetchTicketsPage(1);
        if (cancelled) return;

        const firstPageTickets: Ticket[] = Array.isArray(firstResponse)
          ? firstResponse
          : firstResponse?.data || [];

        const totalPagesRaw = Array.isArray(firstResponse)
          ? 1
          : Number(firstResponse?.totalPages);
        const totalPages =
          Number.isFinite(totalPagesRaw) && totalPagesRaw > 0
            ? totalPagesRaw
            : 1;

        if (totalPages <= 1) {
          setSelectedYardTickets(firstPageTickets);
          return;
        }

        const remainingPages = Array.from(
          { length: totalPages - 1 },
          (_, index) => index + 2,
        );
        const remainingTicketsByPage = new Map<number, Ticket[]>();
        const chunkSize = 4;

        for (let index = 0; index < remainingPages.length; index += chunkSize) {
          if (cancelled) return;

          const pageChunk = remainingPages.slice(index, index + chunkSize);
          const chunkResponses = await Promise.all(
            pageChunk.map(async (pageNumber) => ({
              pageNumber,
              response: await fetchTicketsPage(pageNumber),
            })),
          );

          if (cancelled) return;

          chunkResponses.forEach(({ pageNumber, response }) => {
            const pageTickets: Ticket[] = Array.isArray(response)
              ? response
              : response?.data || [];
            remainingTicketsByPage.set(pageNumber, pageTickets);
          });
        }

        const allTickets = [...firstPageTickets];
        remainingPages
          .sort((left, right) => left - right)
          .forEach((pageNumber) => {
            const pageTickets = remainingTicketsByPage.get(pageNumber);
            if (pageTickets?.length) {
              allTickets.push(...pageTickets);
            }
          });

        setSelectedYardTickets(allTickets);
      } catch (error: any) {
        if (cancelled) return;
        console.error("Error fetching selected yard tickets:", error);
        setSelectedYardTickets([]);

        let errorMessage = "Failed to load selected yard tickets";
        if (
          error?.isNetworkError ||
          error?.message?.includes("fetch failed") ||
          error?.message?.includes("Failed to fetch")
        ) {
          errorMessage =
            "Cannot connect to backend server. Please check if the backend is running.";
        } else if (error?.status === 401) {
          errorMessage = "Session expired. Please login again.";
        } else if (error?.message) {
          errorMessage = error.message;
        }

        toast({
          title: "Error",
          description: errorMessage,
          variant: "destructive",
        });
      } finally {
        if (!cancelled) {
          setLoadingSelectedYardDetail(false);
        }
      }
    };

    fetchSelectedYardTickets();
    return () => {
      cancelled = true;
    };
  }, [selectedYardQueryKey, selectedYardId, startDate, endDate]);

  useEffect(() => {
    if (!selectedYardQueryKey) {
      setSelectedYardStats(null);
      setReportLastUpdated(null);
      return;
    }

    let cancelled = false;

    const fetchSelectedYardStats = async () => {
      try {
        const params = new URLSearchParams({
          start: startDate,
          end: endDate,
        });
        const response = await fetchFromBackend(
          `/reports/yards/${selectedYardId}/detail?${params.toString()}`,
        );
        if (cancelled) return;

        const stats = (response?.data || response) as YardStats | null;
        setSelectedYardStats(stats || null);
        setReportLastUpdated(
          new Date().toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          }),
        );
      } catch (error: any) {
        if (cancelled) return;
        console.error("Error fetching selected yard report detail:", error);
        setSelectedYardStats(null);

        let errorMessage = "Failed to load selected yard report";
        if (
          error?.isNetworkError ||
          error?.message?.includes("fetch failed") ||
          error?.message?.includes("Failed to fetch")
        ) {
          errorMessage =
            "Cannot connect to backend server. Please check if the backend is running.";
        } else if (error?.status === 401) {
          errorMessage = "Session expired. Please login again.";
        } else if (error?.message) {
          errorMessage = error.message;
        }

        toast({
          title: "Error",
          description: errorMessage,
          variant: "destructive",
        });
      }
    };

    fetchSelectedYardStats();
    return () => {
      cancelled = true;
    };
  }, [
    selectedYardQueryKey,
    selectedYardId,
    startDate,
    endDate,
  ]);

  useEffect(() => {
    if (yardIdParam) {
      setSelectedYardId(yardIdParam);
    }
  }, [yardIdParam]);

  useEffect(() => {
    if (openFiltersParam === "1" || openFiltersParam === "true") {
      setFiltersModalOpen(true);
    }
  }, [openFiltersParam]);

  const selectedYard =
    yards.find((yard) => yard.id.toString() === selectedYardId) ||
    selectedYardStats?.yard ||
    yardsStats.find((item) => item.yard.id.toString() === selectedYardId)?.yard ||
    null;
  const hasDateRange = Boolean(startDate && endDate);

  const handleYardSelect = (yardId: string) => {
    setSelectedYardId(yardId);
    setYardOpen(false);
    const params = new URLSearchParams();
    params.set("yardId", yardId);
    if (startDate) params.set("startDate", startDate);
    if (endDate) params.set("endDate", endDate);
    router.push(`/reports/yards?${params.toString()}`);
  };

  const handleSelectOverview = () => {
    setSelectedYardId("");
    setSelectedYardStats(null);
    setReportLastUpdated(null);
    const params = new URLSearchParams();
    if (startDate) params.set("startDate", startDate);
    if (endDate) params.set("endDate", endDate);
    const query = params.toString();
    router.push(query ? `/reports/yards?${query}` : "/reports/yards");
  };

  const handleDateChange = () => {
    const params = new URLSearchParams();
    if (selectedYardId) params.set("yardId", selectedYardId);
    if (startDate) params.set("startDate", startDate);
    if (endDate) params.set("endDate", endDate);
    router.push(`/reports/yards?${params.toString()}`);
  };

  const applyFilters = () => {
    if (!startDate || !endDate) {
      toast({
        title: "Date range required",
        description: "Select start and end date before applying filters.",
        variant: "destructive",
      });
      setFiltersModalOpen(true);
      return;
    }

    if (!isDateRangeValid) {
      toast({
        title: "Invalid date range",
        description: "Start date cannot be later than end date.",
        variant: "destructive",
      });
      setFiltersModalOpen(true);
      return;
    }

    handleDateChange();
    setFiltersModalOpen(false);
  };

  const handleViewAllTickets = () => {
    if (!selectedYard || !selectedYardId || !startDate || !endDate) {
      toast({
        title: "Report not ready",
        description:
          "Select a yard and a valid date range before opening tickets.",
        variant: "destructive",
      });
      return;
    }

    if (!isDateRangeValid) {
      toast({
        title: "Invalid date range",
        description: "Start date cannot be later than end date.",
        variant: "destructive",
      });
      return;
    }

    setShowYardRecordsModal(true);
  };

  const getLogoUrl = () =>
    typeof window !== "undefined"
      ? `${window.location.origin}/images/logo.jpeg`
      : "/images/logo.jpeg";

  const activeTicketChartData = useMemo(() => {
    if (!selectedYardStats?.ticketsByDay) return [];
    return selectedYardStats.ticketsByDay.filter(
      (day) => day.total > 0 || day.closed > 0,
    );
  }, [selectedYardStats]);

  const activeCallsChartData = useMemo(() => {
    if (!selectedYardStats?.callsByDay) return [];
    return selectedYardStats.callsByDay.filter(
      (day) => (day.created ?? day.total) > 0 || day.closed > 0,
    );
  }, [selectedYardStats]);

  const activeManualChartData = useMemo(() => {
    if (!selectedYardStats?.manualRecordsByDay) return [];
    return selectedYardStats.manualRecordsByDay.filter(
      (day) => (day.created ?? day.total) > 0 || day.closed > 0,
    );
  }, [selectedYardStats]);

  const handleExportPDF = async () => {
    if (!selectedYardStats) return;
    if (!startDate || !endDate) {
      toast({
        title: "Select dates",
        description: "Start and end date are required to export the PDF.",
        variant: "destructive",
      });
      return;
    }

    if (!isDateRangeValid) {
      toast({
        title: "Invalid date range",
        description: "Start date cannot be later than end date.",
        variant: "destructive",
      });
      return;
    }

    try {
      const params = new URLSearchParams({
        start: startDate,
        end: endDate,
        logoUrl: getLogoUrl(),
      });

      const blob = await fetchBlobFromBackend(
        `/yards/${selectedYardId}/report/pdf?${params.toString()}`,
        { method: "GET" },
      );

      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `yard_report_${selectedYardStats.yard.name}_${startDate}_to_${endDate}.pdf`;
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
    if (!selectedYardStats) return;
    if (!startDate || !endDate) {
      toast({
        title: "Select dates",
        description: "Start and end date are required to export the Excel.",
        variant: "destructive",
      });
      return;
    }

    if (!isDateRangeValid) {
      toast({
        title: "Invalid date range",
        description: "Start date cannot be later than end date.",
        variant: "destructive",
      });
      return;
    }

    try {
      const params = new URLSearchParams({
        start: startDate,
        end: endDate,
      });
      const yardIdToExport = selectedYardStats.yard.id.toString();
      const blob = await fetchBlobFromBackend(
        `/yards/${yardIdToExport}/report/excel?${params.toString()}`,
        {
          method: "GET",
          headers: {
            Accept:
              "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
          },
        },
      );

      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `yard_report_${selectedYardStats.yard.name}_${startDate}_to_${endDate}.xlsx`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      toast({
        title: "Success",
        description: "Excel file downloaded successfully",
      });
    } catch (error: any) {
      console.error("Excel export error:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to download Excel",
        variant: "destructive",
      });
    }
  };

  const formatDate = (dateString?: string | null) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="flex min-h-[calc(100dvh-4.25rem)] min-h-0 flex-col px-4 pb-4 pt-2 animate-in fade-in duration-500">
      <div className="mx-auto flex w-full max-w-[1600px] min-h-0 flex-1 flex-col gap-2">
        <ReportHeader
          selectedYard={selectedYard}
          startDate={startDate}
          endDate={endDate}
          canExport={Boolean(selectedYardStats) && isDateRangeValid}
          canViewTickets={Boolean(
            selectedYard && startDate && endDate && isDateRangeValid,
          )}
          lastUpdated={reportLastUpdated}
          onSelectOverview={handleSelectOverview}
          onOpenFilters={() => setFiltersModalOpen(true)}
          onViewAllTickets={handleViewAllTickets}
          onExportPDF={handleExportPDF}
          onExportExcel={handleExportExcel}
        />

        <FiltersSheet
          open={filtersModalOpen}
          onOpenChange={setFiltersModalOpen}
          yardOpen={yardOpen}
          onYardOpenChange={setYardOpen}
          yards={yards}
          selectedYardId={selectedYardId}
          loadingYards={loadingYards}
          startDate={startDate}
          endDate={endDate}
          canExport={Boolean(selectedYardStats) && isDateRangeValid}
          onYardSelect={handleYardSelect}
          onStartDateChange={setStartDate}
          onEndDateChange={setEndDate}
          onExportPDF={handleExportPDF}
          onExportExcel={handleExportExcel}
          onApplyFilters={applyFilters}
        />

        {!selectedYardId || !selectedYard ? (
          <div className="space-y-4">
            {!hasDateRange || !isDateRangeValid ? (
              <div className="flex min-h-[420px] flex-col items-center justify-center rounded-2xl border-2 border-dashed bg-gradient-to-br from-muted/30 to-muted/10 p-8 text-center animate-in zoom-in-95 duration-300">
                <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-primary/10 ring-8 ring-primary/5">
                  <Building className="h-10 w-10 text-primary" />
                </div>
                <h3 className="text-xl font-bold">
                  Configure report to view yards
                </h3>
                <p className="mb-6 mt-3 max-w-md text-sm text-muted-foreground">
                  Select a date range and optionally a specific yard to load
                  the dashboard cards and detailed analytics.
                </p>
                <Button
                  onClick={() => setFiltersModalOpen(true)}
                  className="gap-2"
                  size="lg"
                >
                  <SlidersHorizontal className="h-4 w-4" />
                  Configure Report
                </Button>
              </div>
            ) : (
              <YardsOverview
                loadingStats={loadingStats}
                yardsStats={yardsStats}
                onSelectYard={handleYardSelect}
                onOpenFilters={() => setFiltersModalOpen(true)}
                formatDate={formatDate}
              />
            )}
          </div>
        ) : !hasDateRange ? (
          <div className="flex min-h-[420px] flex-col items-center justify-center gap-4 rounded-2xl border border-dashed p-6 text-center">
            <Alert className="max-w-md gap-4 px-4 py-4 text-left text-sm sm:text-base">
              <AlertCircle className="size-5 text-primary" />
              <div className="space-y-1">
                <AlertTitle className="text-base font-semibold">
                  Select a date range
                </AlertTitle>
                <AlertDescription className="text-sm sm:text-base">
                  Choose a start date and end date in Configure Report to load
                  the yard dashboard.
                </AlertDescription>
              </div>
            </Alert>
            <Button
              variant="ghost"
              size="sm"
              className="text-sm text-primary underline-offset-4"
              onClick={() => setFiltersModalOpen(true)}
            >
              Open Configure Report
            </Button>
          </div>
        ) : !isDateRangeValid ? (
          <div className="flex min-h-[420px] flex-col items-center justify-center gap-4 rounded-2xl border border-dashed border-amber-300/70 bg-amber-50/40 p-6 text-center dark:border-amber-500/35 dark:bg-amber-950/15">
            <Alert
              className="max-w-md gap-4 border-amber-300/70 bg-amber-50/90 px-4 py-4 text-left text-sm sm:text-base text-amber-900 shadow-lg ring-1 ring-amber-200/70 dark:border-amber-500/45 dark:bg-amber-950/35 dark:text-amber-100 dark:ring-amber-500/25"
            >
              <AlertCircle className="size-5 text-amber-600 dark:text-amber-300" />
              <div className="space-y-1">
                <AlertTitle className="text-base font-semibold text-amber-800 dark:text-amber-200">
                  Date range invalid
                </AlertTitle>
                <AlertDescription className="text-sm sm:text-base text-amber-700 dark:text-amber-100/90">
                  The start date ({startDate}) cannot be after the end date (
                  {endDate}). Update the range in the modal so the dashboard
                  finishes loading.
                </AlertDescription>
              </div>
            </Alert>
            <Button
              variant="ghost"
              size="sm"
              className="text-sm text-primary underline-offset-4"
              onClick={() => setFiltersModalOpen(true)}
            >
              Open Configure Report
            </Button>
          </div>
        ) : loadingStats || !selectedYardStats ? (
          <div className="flex flex-1 items-center justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            <span className="ml-2 text-muted-foreground">
              Loading dashboard...
            </span>
          </div>
        ) : (
          <div
            className={`min-h-0 flex-1 overflow-hidden ${dashboardCanvasClass}`}
          >
            <div className="scrollbar-app-hover h-full overflow-y-auto pb-2">
              <YardDashboard
                stats={selectedYardStats}
                yardTickets={selectedYardTickets}
                activeTicketChartData={activeTicketChartData}
                activeCallsChartData={activeCallsChartData}
                activeManualChartData={activeManualChartData}
                reportStartDate={startDate}
                reportEndDate={endDate}
              />
            </div>
          </div>
        )}
      </div>

      <YardRecordsModal
        open={showYardRecordsModal}
        onOpenChange={setShowYardRecordsModal}
        yardName={selectedYard?.name || "Selected Yard"}
        yardId={selectedYard?.id || selectedYardId}
        reportStartDate={startDate}
        reportEndDate={endDate}
      />
    </div>
  );
}
