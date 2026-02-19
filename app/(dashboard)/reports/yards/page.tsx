"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import ExcelJS from "exceljs";
import {
  Loader2,
  Building,
  SlidersHorizontal,
  AlertCircle,
} from "lucide-react";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { toast } from "@/hooks/use-toast";
import { fetchBlobFromBackend, fetchFromBackend } from "@/lib/api-client";
import { FiltersSheet } from "./components/FiltersSheet";
import { ReportHeader } from "./components/ReportHeader";
import { YardDashboard } from "./components/YardDashboard";
import { YardsOverview } from "./components/YardsOverview";
import { Button } from "@/components/ui/button";
import type { Ticket, Yard, YardStats } from "./components/types";

type CampaignSummary = {
  id: number | string;
  nombre?: string | null;
  isActive?: boolean | null;
  yardaId?: number | string | null;
  yardId?: number | string | null;
  yarda?: { id?: number | string | null } | null;
  yard?: { id?: number | string | null } | null;
};

const parseLocalDateStart = (value: string) => {
  const [year, month, day] = value.split("-").map(Number);
  return new Date(year, month - 1, day, 0, 0, 0, 0);
};

const parseLocalDateEnd = (value: string) => {
  const [year, month, day] = value.split("-").map(Number);
  return new Date(year, month - 1, day, 23, 59, 59, 999);
};

const toLocalDateKey = (value: Date | string) => {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const fromDateKeyToLocalDate = (value: string) => {
  const [year, month, day] = value.split("-").map(Number);
  return new Date(year, month - 1, day);
};

const getCampaignYardKey = (campaign: CampaignSummary): string | null => {
  const candidateYardId =
    campaign.yarda?.id ??
    campaign.yard?.id ??
    campaign.yardaId ??
    campaign.yardId;

  if (candidateYardId === null || candidateYardId === undefined) {
    return null;
  }

  return candidateYardId.toString();
};

export default function YardReportsPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const yardIdParam = searchParams.get("yardId");
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
  const [loadingStats, setLoadingStats] = useState(false);
  const [startDate, setStartDate] = useState<string>(startDateParam || "");
  const [endDate, setEndDate] = useState<string>(endDateParam || "");

  const isDateRangeValid = useMemo(() => {
    if (!startDate || !endDate) return true;
    try {
      return parseLocalDateStart(startDate) <= parseLocalDateEnd(endDate);
    } catch (e) {
      return true;
    }
  }, [startDate, endDate]);

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
    const fetchYardsStats = async () => {
      if (!startDate || !endDate) return;
      if (!isDateRangeValid) return;

      try {
        setLoadingStats(true);
        const [ticketsData, campaignsData] = await Promise.all([
          fetchFromBackend("/tickets?page=1&limit=10000"),
          fetchFromBackend("/campaign?page=1&limit=1000"),
        ]);
        const allTickets: Ticket[] = Array.isArray(ticketsData)
          ? ticketsData
          : ticketsData?.data || [];
        const allCampaigns: CampaignSummary[] = Array.isArray(campaignsData)
          ? campaignsData
          : campaignsData?.data || [];
        const campaignsById = allCampaigns.reduce<
          Map<string, { yardIdKey: string | null; isActive: boolean; name: string }>
        >((accumulator, campaign) => {
          accumulator.set(campaign.id.toString(), {
            yardIdKey: getCampaignYardKey(campaign),
            isActive: campaign.isActive !== false,
            name: campaign.nombre?.trim() || "",
          });
          return accumulator;
        }, new Map());
        const rangeStart = parseLocalDateStart(startDate);
        const rangeEnd = parseLocalDateEnd(endDate);

        const filteredTickets = allTickets.filter((ticket) => {
          const ticketDate = ticket.createdAt || ticket.updatedAt;
          if (!ticketDate) return false;
          const date = new Date(ticketDate);
          if (Number.isNaN(date.getTime())) return false;
          return date >= rangeStart && date <= rangeEnd;
        });

        const statsMap = new Map<number, YardStats>();

        yards.forEach((yard) => {
          const yardTickets = filteredTickets.filter((ticket) => {
            const ticketYardId = ticket.yardId;
            if (ticketYardId === null || ticketYardId === undefined) return false;
            return ticketYardId.toString() === yard.id.toString();
          });

          const ticketsByStatus = yardTickets.reduce(
            (accumulator, ticket) => {
              const status = ticket.status || "UNKNOWN";
              accumulator[status] = (accumulator[status] || 0) + 1;
              return accumulator;
            },
            {} as Record<string, number>,
          );

          const ticketsByDirection = yardTickets.reduce(
            (accumulator, ticket) => {
              const direction = ticket.direction || "UNKNOWN";
              accumulator[direction] = (accumulator[direction] || 0) + 1;
              return accumulator;
            },
            {} as Record<string, number>,
          );

          const allDispositions = [
            "BOOKING",
            "GENERAL_INFO",
            "COMPLAINT",
            "SUPPORT",
            "BILLING",
            "TECHNICAL_ISSUE",
            "NEW_LEAD",
            "SPAM",
          ];
          const ticketsByDisposition = allDispositions.reduce(
            (accumulator, disposition) => {
              const count = yardTickets.filter(
                (ticket) => ticket.disposition === disposition,
              ).length;
              accumulator[disposition] = count;
              return accumulator;
            },
            {} as Record<string, number>,
          );

          const ticketsByPriority = yardTickets.reduce(
            (accumulator, ticket) => {
              const priority = ticket.priority || "UNKNOWN";
              accumulator[priority] = (accumulator[priority] || 0) + 1;
              return accumulator;
            },
            {} as Record<string, number>,
          );

          const ticketsByAgentMap = new Map<
            number,
            { agentId: number; agentName: string; count: number }
          >();
          yardTickets.forEach((ticket) => {
            const agentId = ticket.agentId || ticket.agent?.id;
            if (agentId) {
              const agentName = ticket.agent?.name || `Agent #${agentId}`;
              const existing = ticketsByAgentMap.get(agentId);
              if (existing) {
                existing.count += 1;
              } else {
                ticketsByAgentMap.set(agentId, {
                  agentId,
                  agentName,
                  count: 1,
                });
              }
            }
          });

          const ticketsByCampaignMap = new Map<
            string,
            { campaignId: number | string; campaignName: string; count: number }
          >();
          yardTickets.forEach((ticket) => {
            const rawCampaignId = ticket.campaignId ?? ticket.campaign?.id;
            if (rawCampaignId === null || rawCampaignId === undefined) return;

            const campaignIdKey = rawCampaignId.toString();
            const campaignMeta = campaignsById.get(campaignIdKey);
            if (!campaignMeta || !campaignMeta.isActive) return;
            if (campaignMeta.yardIdKey !== yard.id.toString()) return;

            const parsedCampaignId = Number(campaignIdKey);
            const normalizedCampaignId = Number.isFinite(parsedCampaignId)
              ? parsedCampaignId
              : campaignIdKey;

            const campaignNameFromTicket = ticket.campaign?.nombre?.trim() || "";
            const campaignName = campaignMeta.name || campaignNameFromTicket;
            const existing = ticketsByCampaignMap.get(campaignIdKey);
            if (existing) {
              existing.count += 1;
              if (campaignName && existing.campaignName.startsWith("Campaign #")) {
                existing.campaignName = campaignName;
              }
            } else {
              ticketsByCampaignMap.set(campaignIdKey, {
                campaignId: normalizedCampaignId,
                campaignName: campaignName || `Campaign #${campaignIdKey}`,
                count: 1,
              });
            }
          });

          const lastActivity = yardTickets
            .map((ticket) => ticket.updatedAt || ticket.createdAt)
            .filter(Boolean)
            .sort()
            .reverse()[0];

          const ticketsByDayMap = new Map<
            string,
            { total: number; open: number; closed: number }
          >();

          const currentDate = new Date(rangeStart.getTime());

          while (currentDate <= rangeEnd) {
            const dateKey = toLocalDateKey(currentDate);
            ticketsByDayMap.set(dateKey, {
              total: 0,
              open: 0,
              closed: 0,
            });
            currentDate.setDate(currentDate.getDate() + 1);
          }

          yardTickets.forEach((ticket) => {
            const ticketDate = ticket.createdAt || ticket.updatedAt;
            if (!ticketDate) return;
            const dateKey = toLocalDateKey(ticketDate);
            if (!dateKey) return;
            const existing = ticketsByDayMap.get(dateKey);
            if (existing) {
              existing.total += 1;
              if (ticket.status === "CLOSED") {
                existing.closed += 1;
              } else {
                existing.open += 1;
              }
            }
          });

          const daysDiff = Math.ceil(
            (rangeEnd.getTime() - rangeStart.getTime()) / (1000 * 60 * 60 * 24),
          );

          const ticketsByDay = Array.from(ticketsByDayMap.entries())
            .map(([date, data]) => {
              const dayDate = fromDateKeyToLocalDate(date);
              const dayOfMonth = dayDate.getDate();
              const weekday = dayDate.toLocaleDateString("en-US", {
                weekday: "short",
              });
              const month = dayDate.toLocaleDateString("en-US", {
                month: "short",
              });

              let dayLabel: string;
              if (daysDiff <= 14) {
                dayLabel = `${weekday} ${dayOfMonth}`;
              } else {
                dayLabel = `${month} ${dayOfMonth}`;
              }

              return {
                date,
                day: dayLabel,
                fullDate: dayDate.toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                }),
                dayOfMonth,
                ...data,
              };
            })
            .sort((left, right) => left.date.localeCompare(right.date));

          const peakDayEntry = ticketsByDay.reduce(
            (max, day) => (day.total > (max?.total || 0) ? day : max),
            null as (typeof ticketsByDay)[0] | null,
          );

          const closedTicketsWithDates = yardTickets.filter(
            (ticket) =>
              ticket.status === "CLOSED" &&
              ticket.createdAt &&
              ticket.updatedAt,
          );

          let avgResolutionTime: number | undefined;
          if (closedTicketsWithDates.length > 0) {
            const totalHours = closedTicketsWithDates.reduce((sum, ticket) => {
              const createdAt = new Date(ticket.createdAt!);
              const updatedAt = new Date(ticket.updatedAt!);
              const hours =
                (updatedAt.getTime() - createdAt.getTime()) / (1000 * 60 * 60);
              return sum + hours;
            }, 0);
            avgResolutionTime = totalHours / closedTicketsWithDates.length;
          }

          const openTickets = yardTickets.filter(
            (ticket) => ticket.status === "OPEN",
          ).length;
          const inProgressTickets = yardTickets.filter(
            (ticket) => ticket.status === "IN_PROGRESS",
          ).length;
          const closedTickets = yardTickets.filter(
            (ticket) => ticket.status === "CLOSED",
          ).length;

          statsMap.set(yard.id, {
            yard,
            totalTickets: yardTickets.length,
            openTickets,
            inProgressTickets,
            closedTickets,
            todayTickets:
              ticketsByDay.find(
                (day) => day.date === toLocalDateKey(new Date()),
              )?.total || 0,
            lastActivity: lastActivity || null,
            ticketsByStatus: Object.entries(ticketsByStatus).map(
              ([status, count]) => ({
                status,
                count,
              }),
            ),
            ticketsByDirection: Object.entries(ticketsByDirection).map(
              ([direction, count]) => ({
                direction,
                count,
              }),
            ),
            ticketsByDisposition: Object.entries(ticketsByDisposition)
              .filter(([, count]) => count > 0)
              .map(([disposition, count]) => ({ disposition, count })),
            ticketsByPriority: Object.entries(ticketsByPriority).map(
              ([priority, count]) => ({
                priority,
                count,
              }),
            ),
            ticketsByDay,
            ticketsByAgent: Array.from(ticketsByAgentMap.values()).sort(
              (left, right) => right.count - left.count,
            ),
            ticketsByCampaign: Array.from(ticketsByCampaignMap.values()).sort(
              (left, right) => right.count - left.count,
            ),
            avgResolutionTime,
            peakDay: peakDayEntry?.day || undefined,
            peakDayCount: peakDayEntry?.total || undefined,
          });
        });

        setYardsStats(Array.from(statsMap.values()));
      } catch (error: any) {
        console.error("Error fetching yard stats:", error);

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
        setLoadingStats(false);
      }
    };

    if (yards.length > 0 && startDate && endDate && isDateRangeValid) {
      fetchYardsStats();
    }
  }, [yards, startDate, endDate]);

  useEffect(() => {
    if (selectedYardId && yardsStats.length > 0) {
      const stats = yardsStats.find(
        (item) => item.yard.id.toString() === selectedYardId,
      );
      setSelectedYardStats(stats || null);
    } else {
      setSelectedYardStats(null);
    }
  }, [selectedYardId, yardsStats]);

  useEffect(() => {
    if (yardIdParam) {
      setSelectedYardId(yardIdParam);
    }
  }, [yardIdParam]);

  const selectedYard =
    yards.find((yard) => yard.id.toString() === selectedYardId) || null;
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

  const getLogoUrl = () =>
    typeof window !== "undefined"
      ? `${window.location.origin}/images/logo.jpeg`
      : "/images/logo.jpeg";

  const activeChartData = useMemo(() => {
    if (!selectedYardStats?.ticketsByDay) return [];
    return selectedYardStats.ticketsByDay.filter((day) => day.total > 0);
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
      const workbook = new ExcelJS.Workbook();
      workbook.creator = "Tickets Hut System";
      workbook.created = new Date();
      workbook.modified = new Date();

      const worksheet = workbook.addWorksheet("Yard Report");
      worksheet.columns = [
        { width: 30 },
        { width: 20 },
        { width: 15 },
        { width: 20 },
      ];

      worksheet.addRow([]);
      worksheet.getRow(1).height = 30;
      worksheet.mergeCells(1, 1, 1, 4);
      const headerCell = worksheet.getCell(1, 1);
      headerCell.value = `YARD REPORT - ${selectedYardStats.yard.name}`;
      headerCell.font = {
        size: 18,
        bold: true,
        color: { argb: "FFFFFFFF" },
      };
      headerCell.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FF1E40AF" },
      };
      headerCell.alignment = { vertical: "middle", horizontal: "center" };

      worksheet.addRow([]);
      worksheet.getRow(2).height = 25;
      worksheet.mergeCells(2, 1, 2, 4);
      const dateCell = worksheet.getCell(2, 1);
      dateCell.value = `Period: ${startDate} - ${endDate}`;
      dateCell.font = {
        size: 12,
        bold: true,
        color: { argb: "FF1E40AF" },
      };
      dateCell.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FFE0E7FF" },
      };
      dateCell.alignment = { vertical: "middle", horizontal: "center" };

      worksheet.addRow([]);
      worksheet.addRow(["Metric", "Value"]);
      worksheet.addRow(["Total Tickets", selectedYardStats.totalTickets]);
      worksheet.addRow(["Open Tickets", selectedYardStats.openTickets]);
      worksheet.addRow(["Closed Tickets", selectedYardStats.closedTickets]);
      worksheet.addRow([
        "Last Activity",
        selectedYardStats.lastActivity
          ? new Date(selectedYardStats.lastActivity).toLocaleString()
          : "N/A",
      ]);

      worksheet.addRow([]);
      worksheet.addRow([
        "In Progress Tickets",
        selectedYardStats.inProgressTickets,
      ]);
      worksheet.addRow([
        "Average Resolution Time",
        selectedYardStats.avgResolutionTime
          ? `${Math.round(selectedYardStats.avgResolutionTime)} hours`
          : "N/A",
      ]);
      worksheet.addRow([
        "Peak Day",
        selectedYardStats.peakDay
          ? `${selectedYardStats.peakDay} (${selectedYardStats.peakDayCount} tickets)`
          : "N/A",
      ]);

      worksheet.addRow([]);
      worksheet.addRow(["Status", "Count"]);
      selectedYardStats.ticketsByStatus.forEach((item) => {
        worksheet.addRow([item.status, item.count]);
      });

      worksheet.addRow([]);
      worksheet.addRow(["Disposition", "Count"]);
      selectedYardStats.ticketsByDisposition.forEach((item) => {
        worksheet.addRow([item.disposition, item.count]);
      });

      worksheet.addRow([]);
      worksheet.addRow(["Direction", "Count"]);
      selectedYardStats.ticketsByDirection.forEach((item) => {
        worksheet.addRow([item.direction, item.count]);
      });

      worksheet.addRow([]);
      worksheet.addRow(["Priority", "Count"]);
      selectedYardStats.ticketsByPriority.forEach((item) => {
        worksheet.addRow([item.priority, item.count]);
      });

      worksheet.addRow([]);
      worksheet.addRow(["Top Agents", "Tickets"]);
      selectedYardStats.ticketsByAgent.slice(0, 10).forEach((agent) => {
        worksheet.addRow([agent.agentName, agent.count]);
      });

      worksheet.addRow([]);
      worksheet.addRow(["Top Campaigns", "Tickets"]);
      selectedYardStats.ticketsByCampaign.slice(0, 10).forEach((campaign) => {
        worksheet.addRow([campaign.campaignName, campaign.count]);
      });

      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });

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
        description: "Excel file generated successfully",
      });
    } catch (error: any) {
      console.error("Excel export error:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to generate Excel file",
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 p-2 md:p-4 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 animate-in fade-in duration-500">
      <div className="mx-auto max-w-[1600px] space-y-4">
        <ReportHeader
          selectedYard={selectedYard}
          startDate={startDate}
          endDate={endDate}
          canExport={Boolean(selectedYardStats) && isDateRangeValid}
          onOpenFilters={() => setFiltersModalOpen(true)}
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
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            <span className="ml-2 text-muted-foreground">
              Loading dashboard...
            </span>
          </div>
        ) : (
          <YardDashboard
            stats={selectedYardStats}
            activeChartData={activeChartData}
          />
        )}
      </div>
    </div>
  );
}
