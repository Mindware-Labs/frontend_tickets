"use client";

import { useEffect, useState, useMemo } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetFooter,
} from "@/components/ui/sheet";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Check,
  ChevronsUpDown,
  Building,
  Download,
  FileSpreadsheet,
  Calendar,
  Ticket,
  Clock,
  Loader2,
  BarChart3,
  Phone,
  CheckCircle,
  PhoneMissed,
  Users,
  TrendingUp,
  Activity,
  SlidersHorizontal,
} from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { fetchFromBackend, fetchBlobFromBackend } from "@/lib/api-client";
import { cn } from "@/lib/utils";
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
import ExcelJS from "exceljs";

type Yard = {
  id: number;
  name: string;
  commonName?: string | null;
  isActive?: boolean;
  yardType?: string | null;
  createdAt?: string;
};

type Ticket = {
  id: number;
  yardId?: number | null;
  status?: string | null;
  priority?: string | null;
  disposition?: string | null;
  direction?: string | null;
  createdAt?: string;
  updatedAt?: string;
  customer?: { name?: string | null };
  agent?: { name?: string | null; id?: number } | null;
  agentId?: number | null;
  campaignId?: number | null;
  campaign?: { id?: number | null; nombre?: string | null } | null;
};

type YardStats = {
  yard: Yard;
  totalTickets: number;
  openTickets: number;
  inProgressTickets: number;
  closedTickets: number;
  lastActivity?: string | null;
  ticketsByStatus: { status: string; count: number }[];
  ticketsByDirection: { direction: string; count: number }[];
  ticketsByDisposition: { disposition: string; count: number }[];
  ticketsByPriority: { priority: string; count: number }[];
  ticketsByDay: {
    date: string;
    day: string;
    fullDate: string;
    total: number;
    open: number;
    closed: number;
  }[];
  ticketsByAgent: { agentId: number; agentName: string; count: number }[];
  ticketsByCampaign: {
    campaignId: number;
    campaignName: string;
    count: number;
  }[];
  avgResolutionTime?: number; // in hours
  peakDay?: string;
  peakDayCount?: number;
};

const DISPOSITION_COLORS = [
  "oklch(0.65 0.18 160)", // Green
  "oklch(0.75 0.18 85)", // Yellow
  "var(--color-primary)", // Primary
  "oklch(0.65 0.22 25)", // Red
  "oklch(0.72 0.16 250)", // Blue
  "oklch(0.70 0.20 300)", // Purple
  "oklch(0.68 0.18 180)", // Teal
  "oklch(0.66 0.20 60)", // Orange
];

const STATUS_COLORS: Record<string, string> = {
  OPEN: "oklch(0.65 0.22 25)", // Red
  IN_PROGRESS: "oklch(0.75 0.18 85)", // Yellow
  CLOSED: "oklch(0.65 0.18 160)", // Green
};

const DIRECTION_COLORS: Record<string, string> = {
  INBOUND: "oklch(0.72 0.16 250)", // Blue
  OUTBOUND: "oklch(0.65 0.18 160)", // Green
  MISSED: "oklch(0.65 0.22 25)", // Red
  TEXT_MESSAGE: "oklch(0.70 0.20 300)", // Purple
};

const PRIORITY_COLORS: Record<string, string> = {
  LOW: "oklch(0.75 0.18 85)", // Yellow
  MEDIUM: "oklch(0.72 0.16 250)", // Blue
  HIGH: "oklch(0.68 0.18 180)", // Orange
  EMERGENCY: "oklch(0.65 0.22 25)", // Red
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
  const [loading, setLoading] = useState(false);
  const [yardsStats, setYardsStats] = useState<YardStats[]>([]);
  const [selectedYardStats, setSelectedYardStats] = useState<YardStats | null>(
    null,
  );
  const [loadingStats, setLoadingStats] = useState(false);
  const [startDate, setStartDate] = useState(() => {
    if (startDateParam) return startDateParam;
    const d = new Date();
    d.setDate(d.getDate() - 30);
    return d.toISOString().slice(0, 10);
  });
  const [endDate, setEndDate] = useState(() => {
    if (endDateParam) return endDateParam;
    return new Date().toISOString().slice(0, 10);
  });

  // Fetch yards
  useEffect(() => {
    const fetchYards = async () => {
      try {
        setLoading(true);
        const data = await fetchFromBackend("/yards?page=1&limit=10000");
        const items = Array.isArray(data) ? data : data?.data || [];
        setYards(items.filter((yard: Yard) => yard.isActive !== false));
      } catch (error: any) {
        console.error("Error fetching yards:", error);

        // Determine error message
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
        setLoading(false);
      }
    };
    fetchYards();
  }, []);

  // Fetch tickets and calculate stats for all yards
  useEffect(() => {
    const fetchYardsStats = async () => {
      if (!startDate || !endDate) return;

      try {
        setLoadingStats(true);
        const ticketsData = await fetchFromBackend(
          `/tickets?page=1&limit=10000`,
        );
        const allTickets: Ticket[] = Array.isArray(ticketsData)
          ? ticketsData
          : ticketsData?.data || [];

        // Filter tickets by date range
        const filteredTickets = allTickets.filter((ticket) => {
          const ticketDate = ticket.createdAt || ticket.updatedAt;
          if (!ticketDate) return false;
          const date = new Date(ticketDate);
          const start = new Date(startDate);
          const end = new Date(endDate);
          end.setHours(23, 59, 59, 999);
          return date >= start && date <= end;
        });

        // Group tickets by yard
        const statsMap = new Map<number, YardStats>();

        yards.forEach((yard) => {
          const yardTickets = filteredTickets.filter(
            (t) => t.yardId === yard.id,
          );

          // Status breakdown
          const ticketsByStatus = yardTickets.reduce(
            (acc, ticket) => {
              const status = ticket.status || "UNKNOWN";
              acc[status] = (acc[status] || 0) + 1;
              return acc;
            },
            {} as Record<string, number>,
          );

          // Direction breakdown
          const ticketsByDirection = yardTickets.reduce(
            (acc, ticket) => {
              const direction = ticket.direction || "UNKNOWN";
              acc[direction] = (acc[direction] || 0) + 1;
              return acc;
            },
            {} as Record<string, number>,
          );

          // Disposition breakdown - Include ALL dispositions, even if count is 0
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
            (acc, disposition) => {
              const count = yardTickets.filter(
                (t) => t.disposition === disposition,
              ).length;
              acc[disposition] = count;
              return acc;
            },
            {} as Record<string, number>,
          );

          // Priority breakdown
          const ticketsByPriority = yardTickets.reduce(
            (acc, ticket) => {
              const priority = ticket.priority || "UNKNOWN";
              acc[priority] = (acc[priority] || 0) + 1;
              return acc;
            },
            {} as Record<string, number>,
          );

          // Agent breakdown
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

          // Campaign breakdown
          const ticketsByCampaignMap = new Map<
            number,
            { campaignId: number; campaignName: string; count: number }
          >();
          yardTickets.forEach((ticket) => {
            const campaignId = ticket.campaignId;
            if (campaignId) {
              const campaignName =
                ticket.campaign?.nombre || `Campaign #${campaignId}`;
              const existing = ticketsByCampaignMap.get(campaignId);
              if (existing) {
                existing.count += 1;
              } else {
                ticketsByCampaignMap.set(campaignId, {
                  campaignId,
                  campaignName,
                  count: 1,
                });
              }
            }
          });

          // Get last activity (most recent ticket created or updated)
          const lastActivity = yardTickets
            .map((t) => t.updatedAt || t.createdAt)
            .filter(Boolean)
            .sort()
            .reverse()[0];

          // Group by day with open/closed breakdown - Include ALL days in date range
          const ticketsByDayMap = new Map<
            string,
            { total: number; open: number; closed: number }
          >();

          // Initialize all days in the date range with 0 tickets
          const rangeStart = new Date(startDate);
          const rangeEnd = new Date(endDate);
          rangeEnd.setHours(23, 59, 59, 999);
          const currentDate = new Date(rangeStart);
          while (currentDate <= rangeEnd) {
            const dateStr = currentDate.toISOString().split("T")[0];
            ticketsByDayMap.set(dateStr, {
              total: 0,
              open: 0,
              closed: 0,
            });
            currentDate.setDate(currentDate.getDate() + 1);
          }

          // Add actual ticket data
          yardTickets.forEach((ticket) => {
            const date = new Date(ticket.createdAt || ticket.updatedAt || "");
            const dateStr = date.toISOString().split("T")[0];
            const existing = ticketsByDayMap.get(dateStr);
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
              const d = new Date(date);
              const dayOfMonth = d.getDate();
              const weekday = d.toLocaleDateString("en-US", {
                weekday: "short",
              });
              const month = d.toLocaleDateString("en-US", { month: "short" });

              // Format date label - Always include day number
              let dayLabel: string;
              if (daysDiff <= 14) {
                // Short range: Show "Mon 19" or "Mon Dec 19"
                dayLabel = `${weekday} ${dayOfMonth}`;
              } else if (daysDiff <= 60) {
                // Medium range: Show "Dec 19"
                dayLabel = `${month} ${dayOfMonth}`;
              } else {
                // Long range: Show "Dec 19" or just "19" if too many days
                dayLabel = `${month} ${dayOfMonth}`;
              }
              return {
                date,
                day: dayLabel,
                fullDate: d.toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                }),
                dayOfMonth, // Add for easier access
                ...data,
              };
            })
            .sort((a, b) => a.date.localeCompare(b.date));

          // Find peak day
          const peakDayEntry = ticketsByDay.reduce(
            (max, day) => (day.total > (max?.total || 0) ? day : max),
            null as (typeof ticketsByDay)[0] | null,
          );

          // Calculate average resolution time (for closed tickets)
          const closedTicketsWithDates = yardTickets.filter(
            (t) => t.status === "CLOSED" && t.createdAt && t.updatedAt,
          );
          let avgResolutionTime: number | undefined;
          if (closedTicketsWithDates.length > 0) {
            const totalHours = closedTicketsWithDates.reduce((sum, ticket) => {
              const created = new Date(ticket.createdAt!);
              const updated = new Date(ticket.updatedAt!);
              const hours =
                (updated.getTime() - created.getTime()) / (1000 * 60 * 60);
              return sum + hours;
            }, 0);
            avgResolutionTime = totalHours / closedTicketsWithDates.length;
          }

          const openTickets = yardTickets.filter(
            (t) => t.status === "OPEN",
          ).length;
          const inProgressTickets = yardTickets.filter(
            (t) => t.status === "IN_PROGRESS",
          ).length;
          const closedTickets = yardTickets.filter(
            (t) => t.status === "CLOSED",
          ).length;

          statsMap.set(yard.id, {
            yard,
            totalTickets: yardTickets.length,
            openTickets,
            inProgressTickets,
            closedTickets,
            lastActivity: lastActivity || null,
            ticketsByStatus: Object.entries(ticketsByStatus).map(
              ([status, count]) => ({ status, count }),
            ),
            ticketsByDirection: Object.entries(ticketsByDirection).map(
              ([direction, count]) => ({ direction, count }),
            ),
            ticketsByDisposition: Object.entries(ticketsByDisposition)
              .filter(([, count]) => count > 0)
              .map(([disposition, count]) => ({ disposition, count })),
            ticketsByPriority: Object.entries(ticketsByPriority).map(
              ([priority, count]) => ({ priority, count }),
            ),
            ticketsByDay,
            ticketsByAgent: Array.from(ticketsByAgentMap.values()).sort(
              (a, b) => b.count - a.count,
            ),
            ticketsByCampaign: Array.from(ticketsByCampaignMap.values()).sort(
              (a, b) => b.count - a.count,
            ),
            avgResolutionTime,
            peakDay: peakDayEntry?.day || undefined,
            peakDayCount: peakDayEntry?.total || undefined,
          });
        });

        setYardsStats(Array.from(statsMap.values()));
      } catch (error: any) {
        console.error("Error fetching yard stats:", error);

        // Determine error message
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

    if (yards.length > 0 && startDate && endDate) {
      fetchYardsStats();
    }
  }, [yards, startDate, endDate]);

  // Update selected yard stats when yard is selected
  useEffect(() => {
    if (selectedYardId && yardsStats.length > 0) {
      const stats = yardsStats.find(
        (s) => s.yard.id.toString() === selectedYardId,
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
    yards.find((y) => y.id.toString() === selectedYardId) || null;

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
    handleDateChange();
    setFiltersModalOpen(false);
  };

  const getLogoUrl = () =>
    typeof window !== "undefined"
      ? `${window.location.origin}/images/logo.jpeg`
      : "/images/logo.jpeg";

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

      // Header
      const headerRow = worksheet.addRow([]);
      headerRow.height = 30;
      const headerCell = worksheet.mergeCells(1, 1, 1, 4);
      const headerCellValue = worksheet.getCell(1, 1);
      headerCellValue.value = `YARD REPORT - ${selectedYardStats.yard.name}`;
      headerCellValue.font = {
        size: 18,
        bold: true,
        color: { argb: "FFFFFFFF" },
      };
      headerCellValue.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FF1E40AF" },
      };
      headerCellValue.alignment = { vertical: "middle", horizontal: "center" };

      // Date range
      const dateRow = worksheet.addRow([]);
      dateRow.height = 25;
      const dateCell = worksheet.mergeCells(2, 1, 2, 4);
      const dateCellValue = worksheet.getCell(2, 1);
      dateCellValue.value = `Period: ${startDate} - ${endDate}`;
      dateCellValue.font = {
        size: 12,
        bold: true,
        color: { argb: "FF1E40AF" },
      };
      dateCellValue.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FFE0E7FF" },
      };
      dateCellValue.alignment = { vertical: "middle", horizontal: "center" };

      worksheet.addRow([]);

      // Stats
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

      // Additional Stats
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

      // Tickets by Status
      worksheet.addRow(["Status", "Count"]);
      selectedYardStats.ticketsByStatus.forEach((item) => {
        worksheet.addRow([item.status, item.count]);
      });

      worksheet.addRow([]);

      // Tickets by Disposition
      worksheet.addRow(["Disposition", "Count"]);
      selectedYardStats.ticketsByDisposition.forEach((item) => {
        worksheet.addRow([item.disposition, item.count]);
      });

      worksheet.addRow([]);

      // Tickets by Direction
      worksheet.addRow(["Direction", "Count"]);
      selectedYardStats.ticketsByDirection.forEach((item) => {
        worksheet.addRow([item.direction, item.count]);
      });

      worksheet.addRow([]);

      // Tickets by Priority
      worksheet.addRow(["Priority", "Count"]);
      selectedYardStats.ticketsByPriority.forEach((item) => {
        worksheet.addRow([item.priority, item.count]);
      });

      worksheet.addRow([]);

      // Top Agents
      worksheet.addRow(["Top Agents", "Tickets"]);
      selectedYardStats.ticketsByAgent.slice(0, 10).forEach((agent) => {
        worksheet.addRow([agent.agentName, agent.count]);
      });

      worksheet.addRow([]);

      // Top Campaigns
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
        {/* Header Section */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground drop-shadow-sm">
              Yard Reports
            </h1>
            <p className="text-xs md:text-sm text-muted-foreground mt-1">
              {selectedYard
                ? `${selectedYard.name} - ${startDate} to ${endDate}`
                : "Select a yard to view analytics"}
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
            <Button
              variant="outline"
              onClick={() => setFiltersModalOpen(true)}
              className="gap-2"
            >
              <SlidersHorizontal className="h-4 w-4" />
              Configure Report
            </Button>
            {selectedYardStats && (
              <>
                <Button
                  variant="outline"
                  onClick={handleExportPDF}
                  className="gap-2"
                >
                  <Download className="w-4 h-4" />
                  Export PDF
                </Button>
                <Button
                  variant="outline"
                  onClick={handleExportExcel}
                  className="gap-2"
                >
                  <FileSpreadsheet className="w-4 h-4" />
                  Export Excel
                </Button>
              </>
            )}
          </div>
        </div>

        {/* Filters Sheet */}
        <Sheet open={filtersModalOpen} onOpenChange={setFiltersModalOpen}>
          <SheetContent
            side="right"
            className="w-full sm:max-w-lg overflow-y-auto p-6 sm:p-8"
          >
            <SheetHeader className="space-y-1.5">
              <SheetTitle className="text-xl">Configure Yard Report</SheetTitle>
              <SheetDescription className="text-sm">
                Select the yard, date range and export options.
              </SheetDescription>
            </SheetHeader>

            <div className="space-y-6 mt-1">
              <div className="space-y-2">
                <label className="text-sm font-semibold leading-none flex items-center gap-2">
                  <Building className="h-4 w-4 text-primary" />
                  Select Yard
                </label>
                <Popover open={yardOpen} onOpenChange={setYardOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      aria-expanded={yardOpen}
                      className="w-full justify-between"
                      disabled={loading}
                    >
                      {selectedYardId
                        ? yards.find((y) => y.id.toString() === selectedYardId)
                            ?.name || "Select a yard..."
                        : "Select a yard..."}
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent
                    className="w-[var(--radix-popover-trigger-width)] p-0"
                    align="start"
                  >
                    <Command>
                      <CommandInput placeholder="Search yard..." />
                      <CommandList>
                        <CommandEmpty>
                          {loading ? "Loading yards..." : "No yard found."}
                        </CommandEmpty>
                        <CommandGroup>
                          {yards.map((yard) => (
                            <CommandItem
                              key={yard.id}
                              value={yard.name}
                              onSelect={() =>
                                handleYardSelect(yard.id.toString())
                              }
                            >
                              <Check
                                className={cn(
                                  "mr-2 h-4 w-4",
                                  selectedYardId === yard.id.toString()
                                    ? "opacity-100"
                                    : "opacity-0",
                                )}
                              />
                              {yard.name}
                              {yard.commonName && (
                                <span className="text-muted-foreground ml-2">
                                  ({yard.commonName})
                                </span>
                              )}
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
              </div>

              <div className="space-y-3">
                <label className="text-sm font-semibold leading-none flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-primary" />
                  Date Range
                </label>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="space-y-2">
                    <label className="text-xs font-medium text-muted-foreground">
                      Start Date
                    </label>
                    <Input
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-medium text-muted-foreground">
                      End Date
                    </label>
                    <Input
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                    />
                  </div>
                </div>
              </div>

              {selectedYardStats && (
                <div className="space-y-3">
                  <div className="border-t pt-4">
                    <label className="text-sm font-semibold leading-none flex items-center gap-2 mb-3">
                      <Download className="h-4 w-4 text-primary" />
                      Export Options
                    </label>
                    <div className="grid gap-3">
                      <Button
                        variant="outline"
                        onClick={handleExportPDF}
                        disabled={!selectedYardStats}
                        className="gap-2 w-full h-10"
                      >
                        <Download className="w-4 h-4" />
                        Export PDF
                      </Button>
                      <Button
                        variant="outline"
                        onClick={handleExportExcel}
                        disabled={!selectedYardStats}
                        className="gap-2 w-full h-10"
                      >
                        <FileSpreadsheet className="w-4 h-4" />
                        Export Excel
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <SheetFooter className="flex-col sm:flex-row gap-3 mt-8 pt-6 border-t">
              <Button
                variant="outline"
                onClick={() => setFiltersModalOpen(false)}
                className="w-full sm:w-auto sm:flex-1 h-10"
              >
                Close
              </Button>
              <Button
                onClick={applyFilters}
                className="gap-2 w-full sm:w-auto sm:flex-1 h-10"
              >
                <Calendar className="h-4 w-4" />
                Apply Filters
              </Button>
            </SheetFooter>
          </SheetContent>
        </Sheet>

        {/* Yards Overview - Show all yards when none selected */}
        {!selectedYardId || !selectedYard ? (
          <div className="space-y-4">
            {loadingStats ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                <span className="ml-2 text-muted-foreground">
                  Loading yard statistics...
                </span>
              </div>
            ) : yardsStats.length === 0 ? (
              <div className="flex min-h-[420px] flex-col items-center justify-center rounded-2xl border-2 border-dashed bg-gradient-to-br from-muted/30 to-muted/10 p-8 text-center animate-in zoom-in-95 duration-300">
                <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-primary/10 mb-6 ring-8 ring-primary/5">
                  <Building className="h-10 w-10 text-primary" />
                </div>
                <h3 className="text-xl font-bold">
                  Seleccione una yarda para ver Dashboard
                </h3>
                <p className="mb-6 mt-3 text-sm text-muted-foreground max-w-md">
                  Use el botón "Configure Report" en la parte superior para
                  elegir una yarda y visualizar análisis detallados con gráficas
                  y estadísticas.
                </p>
                <Button
                  onClick={() => setFiltersModalOpen(true)}
                  className="gap-2"
                  size="lg"
                >
                  <SlidersHorizontal className="h-4 w-4" />
                  Configurar Reporte
                </Button>
              </div>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {yardsStats.map((stats) => (
                  <div
                    key={stats.yard.id}
                    onClick={() => handleYardSelect(stats.yard.id.toString())}
                    className="group relative overflow-hidden rounded-xl border bg-card p-6 shadow-sm transition-all hover:shadow-lg cursor-pointer hover:border-primary hover:scale-[1.02]"
                  >
                    <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                    <div className="relative">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                          <div className="p-2 rounded-lg bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                            <Building className="h-5 w-5" />
                          </div>
                          <h3 className="font-semibold text-lg truncate">
                            {stats.yard.name}
                          </h3>
                        </div>
                      </div>
                      <div className="space-y-3">
                        <div>
                          <p className="text-xs text-muted-foreground">
                            Total Tickets
                          </p>
                          <p className="text-2xl font-bold">
                            {stats.totalTickets}
                          </p>
                        </div>
                        <div className="flex gap-4 text-sm">
                          <div className="flex items-center gap-1">
                            <div className="w-2 h-2 rounded-full bg-orange-500" />
                            <span className="text-muted-foreground">Open:</span>
                            <span className="font-medium">
                              {stats.openTickets}
                            </span>
                          </div>
                          <div className="flex items-center gap-1">
                            <div className="w-2 h-2 rounded-full bg-emerald-500" />
                            <span className="text-muted-foreground">
                              Closed:
                            </span>
                            <span className="font-medium">
                              {stats.closedTickets}
                            </span>
                          </div>
                        </div>
                        <div className="pt-2 border-t">
                          <p className="text-xs text-muted-foreground">
                            Last Activity
                          </p>
                          <p className="text-sm font-medium">
                            {formatDate(stats.lastActivity)}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : loadingStats || !selectedYardStats ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            <span className="ml-2 text-muted-foreground">
              Loading dashboard...
            </span>
          </div>
        ) : (
          <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">
            {/* KPI Cards - Expanded */}
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <div className="relative overflow-hidden rounded-xl border bg-card p-5 shadow-sm">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-xs text-muted-foreground">
                      Total Tickets
                    </p>
                    <h3 className="text-3xl font-bold mt-1">
                      {selectedYardStats.totalTickets}
                    </h3>
                    <p className="text-xs text-muted-foreground mt-2">
                      {selectedYardStats.openTickets} open,{" "}
                      {selectedYardStats.closedTickets} closed
                    </p>
                  </div>
                  <div className="p-2 rounded-full bg-blue-100 text-blue-700 dark:bg-blue-500/10">
                    <Ticket className="w-5 h-5" />
                  </div>
                </div>
              </div>

              <div className="relative overflow-hidden rounded-xl border bg-card p-5 shadow-sm">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-xs text-muted-foreground">
                      Open Tickets
                    </p>
                    <h3 className="text-3xl font-bold mt-1">
                      {selectedYardStats.openTickets}
                    </h3>
                    <p className="text-xs text-muted-foreground mt-2">
                      {selectedYardStats.inProgressTickets} in progress
                    </p>
                  </div>
                  <div className="p-2 rounded-full bg-orange-100 text-orange-700 dark:bg-orange-500/10">
                    <Clock className="w-5 h-5" />
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
                      {selectedYardStats.closedTickets}
                    </h3>
                    <p className="text-xs text-muted-foreground mt-2">
                      {selectedYardStats.totalTickets > 0
                        ? Math.round(
                            (selectedYardStats.closedTickets /
                              selectedYardStats.totalTickets) *
                              100,
                          )
                        : 0}
                      % resolution rate
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
                      Avg Resolution
                    </p>
                    <h3 className="text-2xl font-bold mt-1">
                      {selectedYardStats.avgResolutionTime
                        ? `${Math.round(selectedYardStats.avgResolutionTime)}h`
                        : "N/A"}
                    </h3>
                    <p className="text-xs text-muted-foreground mt-2">
                      {selectedYardStats.peakDay
                        ? `Peak: ${selectedYardStats.peakDay} (${selectedYardStats.peakDayCount})`
                        : "No peak day"}
                    </p>
                  </div>
                  <div className="p-2 rounded-full bg-purple-100 text-purple-700 dark:bg-purple-500/10">
                    <BarChart3 className="w-5 h-5" />
                  </div>
                </div>
              </div>
            </div>

            {/* Secondary Stats Row */}
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              <div className="relative overflow-hidden rounded-xl border bg-card p-5 shadow-sm">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-xs text-muted-foreground">
                      Last Activity
                    </p>
                    <h3 className="text-base font-semibold mt-1">
                      {selectedYardStats.lastActivity
                        ? new Date(
                            selectedYardStats.lastActivity,
                          ).toLocaleDateString()
                        : "N/A"}
                    </h3>
                    <p className="text-xs text-muted-foreground mt-1">
                      {selectedYardStats.lastActivity
                        ? new Date(
                            selectedYardStats.lastActivity,
                          ).toLocaleTimeString()
                        : "No activity"}
                    </p>
                  </div>
                  <div className="p-2 rounded-full bg-indigo-100 text-indigo-700 dark:bg-indigo-500/10">
                    <Activity className="w-5 h-5" />
                  </div>
                </div>
              </div>

              <div className="relative overflow-hidden rounded-xl border bg-card p-5 shadow-sm">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-xs text-muted-foreground">
                      Active Agents
                    </p>
                    <h3 className="text-2xl font-bold mt-1">
                      {selectedYardStats.ticketsByAgent.length}
                    </h3>
                    <p className="text-xs text-muted-foreground mt-2 truncate">
                      Top:{" "}
                      {selectedYardStats.ticketsByAgent[0]?.agentName || "N/A"}
                    </p>
                  </div>
                  <div className="p-2 rounded-full bg-cyan-100 text-cyan-700 dark:bg-cyan-500/10">
                    <Users className="w-5 h-5" />
                  </div>
                </div>
              </div>

              <div
                className="group relative overflow-hidden rounded-xl border bg-card p-5 shadow-sm cursor-pointer hover:shadow-lg transition-all hover:border-primary hover:scale-[1.02]"
                onClick={() => router.push("/campaigns")}
              >
                <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="relative flex justify-between items-start">
                  <div>
                    <p className="text-xs text-muted-foreground">
                      Active Campaigns
                    </p>
                    <h3 className="text-2xl font-bold mt-1">
                      {selectedYardStats.ticketsByCampaign.length}
                    </h3>
                    <p className="text-xs text-muted-foreground mt-2 truncate">
                      {selectedYardStats.ticketsByCampaign[0]?.campaignName ||
                        "N/A"}
                    </p>
                    <p className="text-xs text-primary mt-1 font-medium group-hover:underline">
                      View campaigns →
                    </p>
                  </div>
                  <div className="p-2 rounded-full bg-pink-100 text-pink-700 dark:bg-pink-500/10 group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                    <TrendingUp className="w-5 h-5" />
                  </div>
                </div>
              </div>
            </div>

            {/* Charts Row 1 */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              <div className="lg:col-span-2 rounded-2xl border bg-card/80 backdrop-blur-sm p-6 shadow-lg">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-lg font-semibold text-foreground">
                    Ticket Activity Over Time
                  </h3>
                  <span className="text-xs text-muted-foreground">
                    Total: {selectedYardStats.totalTickets}
                  </span>
                </div>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={selectedYardStats.ticketsByDay}>
                      <CartesianGrid
                        strokeDasharray="3 3"
                        vertical={false}
                        stroke="hsl(var(--border))"
                      />
                      <XAxis
                        dataKey="day"
                        axisLine={false}
                        tickLine={false}
                        angle={-45}
                        textAnchor="end"
                        height={80}
                        tick={{
                          fill: "hsl(var(--muted-foreground))",
                          fontSize: 11,
                        }}
                        interval={0}
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
                        labelFormatter={(value, payload) => {
                          if (payload && payload[0]) {
                            return payload[0].payload.fullDate || value;
                          }
                          return value;
                        }}
                      />
                      <Legend />
                      <Bar
                        dataKey="open"
                        name="Open"
                        fill="oklch(0.65 0.22 25)"
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
                  Status Breakdown
                </h3>
                <p className="text-xs text-muted-foreground mb-4">
                  Tickets by status
                </p>
                <div className="h-56 mb-4">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={selectedYardStats.ticketsByStatus}
                        cx="50%"
                        cy="50%"
                        innerRadius={40}
                        outerRadius={60}
                        dataKey="count"
                        paddingAngle={5}
                      >
                        {selectedYardStats.ticketsByStatus.map((entry, i) => (
                          <Cell
                            key={entry.status}
                            fill={
                              STATUS_COLORS[entry.status] ||
                              DISPOSITION_COLORS[i % DISPOSITION_COLORS.length]
                            }
                          />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="space-y-2">
                  {selectedYardStats.ticketsByStatus.map((item, index) => (
                    <div
                      key={item.status}
                      className="flex items-center justify-between text-sm"
                    >
                      <div className="flex items-center gap-2">
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{
                            backgroundColor:
                              STATUS_COLORS[item.status] ||
                              DISPOSITION_COLORS[
                                index % DISPOSITION_COLORS.length
                              ],
                          }}
                        />
                        <span className="text-muted-foreground capitalize">
                          {item.status.replace("_", " ").toLowerCase()}
                        </span>
                      </div>
                      <span className="font-medium text-foreground">
                        {item.count}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Charts Row 2 - Dispositions, Directions, Priorities */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              {/* Disposition Breakdown - ALL Dispositions */}
              <div className="rounded-2xl border bg-card/80 backdrop-blur-sm p-6 shadow-lg">
                <h3 className="text-lg font-semibold text-foreground mb-1">
                  Disposition Breakdown
                </h3>
                <p className="text-xs text-muted-foreground mb-4">
                  All ticket dispositions
                </p>
                <div className="h-52 mb-4">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={selectedYardStats.ticketsByDisposition}
                        cx="50%"
                        cy="50%"
                        innerRadius={40}
                        outerRadius={60}
                        dataKey="count"
                        paddingAngle={5}
                      >
                        {selectedYardStats.ticketsByDisposition.map(
                          (entry, i) => (
                            <Cell
                              key={entry.disposition}
                              fill={
                                DISPOSITION_COLORS[
                                  i % DISPOSITION_COLORS.length
                                ]
                              }
                            />
                          ),
                        )}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="space-y-2 max-h-44 overflow-y-auto pr-2 scrollbar-thin">
                  {selectedYardStats.ticketsByDisposition.length > 0 ? (
                    selectedYardStats.ticketsByDisposition.map(
                      (item, index) => (
                        <div
                          key={item.disposition}
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
                            <span className="text-muted-foreground capitalize">
                              {item.disposition.replace("_", " ").toLowerCase()}
                            </span>
                          </div>
                          <span className="font-medium text-foreground">
                            {item.count}
                          </span>
                        </div>
                      ),
                    )
                  ) : (
                    <div className="text-sm text-muted-foreground text-center py-4">
                      No dispositions recorded
                    </div>
                  )}
                </div>
              </div>

              {/* Direction Breakdown */}
              <div className="rounded-2xl border bg-card/80 backdrop-blur-sm p-6 shadow-lg">
                <h3 className="text-lg font-semibold text-foreground mb-1">
                  Direction Breakdown
                </h3>
                <p className="text-xs text-muted-foreground mb-4">
                  Call directions
                </p>
                <div className="h-52 mb-4">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={selectedYardStats.ticketsByDirection}
                        cx="50%"
                        cy="50%"
                        innerRadius={40}
                        outerRadius={60}
                        dataKey="count"
                        paddingAngle={5}
                      >
                        {selectedYardStats.ticketsByDirection.map(
                          (entry, i) => (
                            <Cell
                              key={entry.direction}
                              fill={
                                DIRECTION_COLORS[entry.direction] ||
                                DISPOSITION_COLORS[
                                  i % DISPOSITION_COLORS.length
                                ]
                              }
                            />
                          ),
                        )}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="space-y-2">
                  {selectedYardStats.ticketsByDirection.map((item, index) => (
                    <div
                      key={item.direction}
                      className="flex items-center justify-between text-sm"
                    >
                      <div className="flex items-center gap-2">
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{
                            backgroundColor:
                              DIRECTION_COLORS[item.direction] ||
                              DISPOSITION_COLORS[
                                index % DISPOSITION_COLORS.length
                              ],
                          }}
                        />
                        <span className="text-muted-foreground capitalize">
                          {item.direction.replace("_", " ").toLowerCase()}
                        </span>
                      </div>
                      <span className="font-medium text-foreground">
                        {item.count}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Priority Breakdown */}
              <div className="rounded-2xl border bg-card/80 backdrop-blur-sm p-6 shadow-lg">
                <h3 className="text-lg font-semibold text-foreground mb-1">
                  Priority Breakdown
                </h3>
                <p className="text-xs text-muted-foreground mb-4">
                  Ticket priorities
                </p>
                <div className="h-52 mb-4">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={selectedYardStats.ticketsByPriority}
                        cx="50%"
                        cy="50%"
                        innerRadius={40}
                        outerRadius={60}
                        dataKey="count"
                        paddingAngle={5}
                      >
                        {selectedYardStats.ticketsByPriority.map((entry, i) => (
                          <Cell
                            key={entry.priority}
                            fill={
                              PRIORITY_COLORS[entry.priority] ||
                              DISPOSITION_COLORS[i % DISPOSITION_COLORS.length]
                            }
                          />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="space-y-2">
                  {selectedYardStats.ticketsByPriority.map((item, index) => (
                    <div
                      key={item.priority}
                      className="flex items-center justify-between text-sm"
                    >
                      <div className="flex items-center gap-2">
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{
                            backgroundColor:
                              PRIORITY_COLORS[item.priority] ||
                              DISPOSITION_COLORS[
                                index % DISPOSITION_COLORS.length
                              ],
                          }}
                        />
                        <span className="text-muted-foreground capitalize">
                          {item.priority.replace("_", " ").toLowerCase()}
                        </span>
                      </div>
                      <span className="font-medium text-foreground">
                        {item.count}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Top Agents and Campaigns */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Top Agents */}
              <div className="rounded-2xl border bg-card/80 backdrop-blur-sm p-6 shadow-lg">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-foreground">
                    Top Agents
                  </h3>
                  <Users className="h-5 w-5 text-muted-foreground" />
                </div>
                <div className="space-y-3">
                  {selectedYardStats.ticketsByAgent.length > 0 ? (
                    selectedYardStats.ticketsByAgent
                      .slice(0, 10)
                      .map((agent, index) => (
                        <div
                          key={agent.agentId}
                          className="flex items-center justify-between p-3 rounded-lg bg-muted/30"
                        >
                          <div className="flex items-center gap-3">
                            <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary font-bold text-sm">
                              {index + 1}
                            </div>
                            <div>
                              <p className="font-medium text-sm">
                                {agent.agentName}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                Agent #{agent.agentId}
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="font-bold text-lg">{agent.count}</p>
                            <p className="text-xs text-muted-foreground">
                              tickets
                            </p>
                          </div>
                        </div>
                      ))
                  ) : (
                    <div className="text-center py-8 text-sm text-muted-foreground">
                      No agent data available
                    </div>
                  )}
                </div>
              </div>

              {/* Top Campaigns */}
              <div className="rounded-2xl border bg-card/80 backdrop-blur-sm p-6 shadow-lg">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-foreground">
                    Top Campaigns
                  </h3>
                  <BarChart3 className="h-5 w-5 text-muted-foreground" />
                </div>
                <div className="space-y-3">
                  {selectedYardStats.ticketsByCampaign.length > 0 ? (
                    selectedYardStats.ticketsByCampaign
                      .slice(0, 10)
                      .map((campaign, index) => (
                        <div
                          key={campaign.campaignId}
                          className="flex items-center justify-between p-3 rounded-lg bg-muted/30"
                        >
                          <div className="flex items-center gap-3">
                            <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary font-bold text-sm">
                              {index + 1}
                            </div>
                            <div>
                              <p className="font-medium text-sm">
                                {campaign.campaignName}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                Campaign #{campaign.campaignId}
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="font-bold text-lg">
                              {campaign.count}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              tickets
                            </p>
                          </div>
                        </div>
                      ))
                  ) : (
                    <div className="text-center py-8 text-sm text-muted-foreground">
                      No campaign data available
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
