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
import { YardTicketsModal } from "./components/YardTicketsModal";
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

type AgentSummary = {
  id: number | string;
  name?: string | null;
  isActive?: boolean | null;
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
  useDialogCleanup();
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
  const [ticketsInRange, setTicketsInRange] = useState<Ticket[]>([]);
  const [showYardTicketsModal, setShowYardTicketsModal] = useState(false);
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
        const rangeStart = parseLocalDateStart(startDate);
        const rangeEnd = parseLocalDateEnd(endDate);
        const ticketQueryParams = new URLSearchParams({
          page: "1",
          limit: "10000",
          includeTotal: "false",
          startDate: rangeStart.toISOString(),
          endDate: rangeEnd.toISOString(),
        });

        const [ticketsData, campaignsData, agentsData] = await Promise.all([
          fetchFromBackend(`/tickets?${ticketQueryParams.toString()}`),
          fetchFromBackend("/campaign?page=1&limit=1000"),
          fetchFromBackend("/agents?page=1&limit=10000").catch((error) => {
            console.warn(
              "Failed to load agents directory for yards report:",
              error,
            );
            return [];
          }),
        ]);
        const allTickets: Ticket[] = Array.isArray(ticketsData)
          ? ticketsData
          : ticketsData?.data || [];
        const allCampaigns: CampaignSummary[] = Array.isArray(campaignsData)
          ? campaignsData
          : campaignsData?.data || [];
        const allAgents: AgentSummary[] = Array.isArray(agentsData)
          ? agentsData
          : agentsData?.data || [];
        const agentNamesById = allAgents.reduce<Map<string, string>>(
          (accumulator, agent) => {
            const id = agent?.id;
            const name = agent?.name?.trim();
            if (
              id !== null &&
              id !== undefined &&
              name &&
              !name.startsWith("Agent #")
            ) {
              accumulator.set(id.toString(), name);
            }
            return accumulator;
          },
          new Map(),
        );
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

        const filteredTickets = allTickets.filter((ticket) => {
          const ticketDate = ticket.createdAt || ticket.updatedAt;
          if (!ticketDate) return false;
          const date = new Date(ticketDate);
          if (Number.isNaN(date.getTime())) return false;
          return date >= rangeStart && date <= rangeEnd;
        });
        setTicketsInRange(filteredTickets);

        const ticketsByYardId = new Map<string, Ticket[]>();
        filteredTickets.forEach((ticket) => {
          const ticketYardId = ticket.yardId ?? ticket.yard?.id;
          if (ticketYardId === null || ticketYardId === undefined) return;
          const yardKey = ticketYardId.toString();
          const existing = ticketsByYardId.get(yardKey);
          if (existing) {
            existing.push(ticket);
          } else {
            ticketsByYardId.set(yardKey, [ticket]);
          }
        });

        const statsMap = new Map<number, YardStats>();
        const todayDateKey = toLocalDateKey(new Date());
        const daysDiff = Math.ceil(
          (rangeEnd.getTime() - rangeStart.getTime()) / (1000 * 60 * 60 * 24),
        );

        yards.forEach((yard) => {
          const yardTickets = ticketsByYardId.get(yard.id.toString()) || [];

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
          const dispositionCounts = yardTickets.reduce(
            (accumulator, ticket) => {
              const disposition = ticket.disposition || "UNKNOWN";
              accumulator[disposition] = (accumulator[disposition] || 0) + 1;
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
              const count = dispositionCounts[disposition] || 0;
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
            const rawAgentId =
              ticket.agentId ?? ticket.assignedTo?.id ?? ticket.agent?.id;
            if (rawAgentId === null || rawAgentId === undefined) return;

            const agentId = Number(rawAgentId);
            if (!Number.isFinite(agentId)) return;

            const agentName =
              ticket.assignedTo?.name?.trim() ||
              ticket.agent?.name?.trim() ||
              agentNamesById.get(agentId.toString()) ||
              `Agent #${agentId}`;

            const existing = ticketsByAgentMap.get(agentId);
            if (existing) {
              existing.count += 1;
              if (
                existing.agentName.startsWith("Agent #") &&
                !agentName.startsWith("Agent #")
              ) {
                existing.agentName = agentName;
              }
            } else {
              ticketsByAgentMap.set(agentId, {
                agentId,
                agentName,
                count: 1,
              });
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

          const ticketsByNewLeadMap = new Map<
            string,
            {
              customerId: number | null;
              customerName: string;
              count: number;
              phone?: string | null;
              issueDetails: {
                ticketId: number;
                issueDetail: string;
                createdAt?: string | null;
              }[];
            }
          >();
          yardTickets.forEach((ticket) => {
            if ((ticket.disposition || "").toUpperCase() !== "NEW_LEAD") return;

            const rawCustomerId = ticket.customer?.id ?? ticket.customerId;
            const parsedCustomerId =
              rawCustomerId !== null && rawCustomerId !== undefined
                ? Number(rawCustomerId)
                : null;
            const customerId = Number.isFinite(parsedCustomerId)
              ? parsedCustomerId
              : null;
            const customerName =
              ticket.customer?.name?.trim() ||
              (customerId !== null ? `Customer #${customerId}` : "Unknown Lead");
            const phone =
              ticket.customer?.phone?.trim() ||
              ticket.customerPhone?.trim() ||
              ticket.phone?.trim() ||
              null;
            const issueDetail = ticket.issueDetail?.trim();
            const leadKey =
              customerId !== null
                ? `id:${customerId}`
                : `name:${customerName.toLowerCase()}|phone:${(phone || "").toLowerCase()}`;

            const existing = ticketsByNewLeadMap.get(leadKey);
            if (existing) {
              existing.count += 1;
              if (
                existing.customerName.startsWith("Customer #") &&
                !customerName.startsWith("Customer #")
              ) {
                existing.customerName = customerName;
              }
              if (!existing.phone && phone) {
                existing.phone = phone;
              }
              if (issueDetail) {
                existing.issueDetails.push({
                  ticketId: ticket.id,
                  issueDetail,
                  createdAt: ticket.createdAt || ticket.updatedAt || null,
                });
              }
            } else {
              ticketsByNewLeadMap.set(leadKey, {
                customerId,
                customerName,
                count: 1,
                phone,
                issueDetails: issueDetail
                  ? [
                      {
                        ticketId: ticket.id,
                        issueDetail,
                        createdAt: ticket.createdAt || ticket.updatedAt || null,
                      },
                    ]
                  : [],
              });
            }
          });

          let lastActivity: string | null = null;
          let lastActivityTimestamp = 0;
          yardTickets.forEach((ticket) => {
            const candidate = ticket.updatedAt || ticket.createdAt;
            if (!candidate) return;
            const candidateDate = new Date(candidate);
            const candidateTimestamp = candidateDate.getTime();
            if (Number.isNaN(candidateTimestamp)) return;
            if (candidateTimestamp > lastActivityTimestamp) {
              lastActivityTimestamp = candidateTimestamp;
              lastActivity = candidate;
            }
          });

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

          const openTickets = ticketsByStatus.OPEN || 0;
          const inProgressTickets = ticketsByStatus.IN_PROGRESS || 0;
          const closedTickets = ticketsByStatus.CLOSED || 0;

          statsMap.set(yard.id, {
            yard,
            totalTickets: yardTickets.length,
            openTickets,
            inProgressTickets,
            closedTickets,
            todayTickets:
              ticketsByDay.find((day) => day.date === todayDateKey)?.total || 0,
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
            ticketsByNewLead: Array.from(ticketsByNewLeadMap.values()).sort(
              (left, right) => {
                if (right.count !== left.count) return right.count - left.count;
                return left.customerName.localeCompare(right.customerName);
              },
            ),
            avgResolutionTime,
            peakDay: peakDayEntry?.day || undefined,
            peakDayCount: peakDayEntry?.total || undefined,
          });
        });

        setYardsStats(Array.from(statsMap.values()));
      } catch (error: any) {
        console.error("Error fetching yard stats:", error);
        setTicketsInRange([]);

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
  const selectedYardTickets = useMemo(() => {
    if (!selectedYardId) return [];

    return ticketsInRange.filter((ticket) => {
      const ticketYardId = ticket.yardId ?? ticket.yard?.id;
      if (ticketYardId === null || ticketYardId === undefined) return false;
      return ticketYardId.toString() === selectedYardId;
    });
  }, [ticketsInRange, selectedYardId]);
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

    setShowYardTicketsModal(true);
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 p-2 md:p-4 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 animate-in fade-in duration-500">
      <div className="mx-auto max-w-[1600px] space-y-4">
        <ReportHeader
          selectedYard={selectedYard}
          startDate={startDate}
          endDate={endDate}
          canExport={Boolean(selectedYardStats) && isDateRangeValid}
          canViewTickets={Boolean(
            selectedYard && startDate && endDate && isDateRangeValid,
          )}
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
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            <span className="ml-2 text-muted-foreground">
              Loading dashboard...
            </span>
          </div>
        ) : (
          <YardDashboard
            stats={selectedYardStats}
            yardTickets={selectedYardTickets}
            activeChartData={activeChartData}
            reportStartDate={startDate}
            reportEndDate={endDate}
          />
        )}
      </div>

      <YardTicketsModal
        open={showYardTicketsModal}
        onOpenChange={setShowYardTicketsModal}
        yardName={selectedYard?.name || "Selected Yard"}
        reportStartDate={startDate}
        reportEndDate={endDate}
        tickets={selectedYardTickets}
      />
    </div>
  );
}
