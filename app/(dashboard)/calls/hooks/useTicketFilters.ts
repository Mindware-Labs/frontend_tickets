"use client";

import { useState, useMemo, useDeferredValue, useEffect, useCallback } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import type { DateRange } from "react-day-picker";
import { startOfDay, endOfDay } from "date-fns";
import { buildTabUrlWithoutDeepLink } from "./useReturnToTimeline";

export type TicketFilterKey =
  | "status"
  | "priority"
  | "ticketType"
  | "campaign"
  | "campaignOption"
  | "yard"
  | "agent"
  | "phoneLine";

export interface TicketFilters {
  status: string;
  priority: string;
  ticketType: string;
  campaign: string;
  campaignOption: string;
  yard: string;
  agent: string;
  phoneLine: string;
}

interface UseTicketFiltersOptions {
  currentAgentId?: number;
}

export function useTicketFilters({ currentAgentId }: UseTicketFiltersOptions) {
  const searchParams = useSearchParams();
  const router = useRouter();

  const [search, setSearch] = useState("");
  const [activeView, setActiveView] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [ticketTypeFilter, setTicketTypeFilter] = useState("all");
  const [campaignFilter, setCampaignFilter] = useState("all");
  const [campaignOptionFilter, setCampaignOptionFilter] = useState("all");
  const [yardFilter, setYardFilter] = useState("all");
  const [agentFilter, setAgentFilter] = useState("all");
  const [phoneLineFilter, setPhoneLineFilter] = useState("all");
  const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  const deferredSearch = useDeferredValue(search);

  const filters: TicketFilters = {
    status: statusFilter,
    priority: priorityFilter,
    ticketType: ticketTypeFilter,
    campaign: campaignFilter,
    campaignOption: campaignOptionFilter,
    yard: yardFilter,
    agent: agentFilter,
    phoneLine: phoneLineFilter,
  };

  const setFilter = (key: TicketFilterKey, value: string) => {
    const setters: Record<TicketFilterKey, (v: string) => void> = {
      status: setStatusFilter,
      priority: setPriorityFilter,
      ticketType: setTicketTypeFilter,
      campaign: setCampaignFilter,
      campaignOption: setCampaignOptionFilter,
      yard: setYardFilter,
      agent: setAgentFilter,
      phoneLine: setPhoneLineFilter,
    };
    setters[key](value);
  };

  const handleViewChange = (view: string) => {
    setActiveView(view);
  };

  const resetTicketListFilters = useCallback(() => {
    setSearch("");
    setActiveView("all");
    setStatusFilter("all");
    setPriorityFilter("all");
    setTicketTypeFilter("all");
    setCampaignFilter("all");
    setCampaignOptionFilter("all");
    setYardFilter("all");
    setAgentFilter("all");
    setPhoneLineFilter("all");
    setDateRange(undefined);
    setCurrentPage(1);
  }, []);

  const clearAllFilters = () => {
    resetTicketListFilters();
  };

  const tabParam = searchParams.get("tab");
  const focusTicketId =
    tabParam === "tickets" ? searchParams.get("id") : null;

  useEffect(() => {
    if (!focusTicketId) return;
    setSearch(focusTicketId);
    setActiveView("all");
    setCurrentPage(1);
  }, [focusTicketId]);

  const leaveTicketFocus = useCallback(
    (destination?: string) => {
      resetTicketListFilters();
      if (destination) {
        router.replace(destination, { scroll: false });
        return;
      }
      router.replace(buildTabUrlWithoutDeepLink(searchParams, "tickets"), {
        scroll: false,
      });
    },
    [router, searchParams, resetTicketListFilters],
  );

  const clearTicketFocus = useCallback(() => {
    leaveTicketFocus();
  }, [leaveTicketFocus]);

  // Build SWR URL
  const ticketsApiUrl = useMemo(() => {
    const params = new URLSearchParams();
    const normalizedSearch = (focusTicketId || deferredSearch).trim();
    const dateFrom = dateRange?.from ? startOfDay(dateRange.from) : null;
    const dateTo = dateRange?.from
      ? endOfDay(dateRange.to ?? dateRange.from)
      : null;

    params.set("mode", "page");
    params.set("page", String(Math.max(1, currentPage)));
    params.set("limit", String(Math.max(1, Math.min(itemsPerPage, 500))));
    params.set("includeTotal", "true");
    params.set("includeViewCounts", "true");
    params.set("view", activeView);

    if (normalizedSearch) params.set("search", normalizedSearch);
    if (statusFilter !== "all") params.set("status", statusFilter);
    if (priorityFilter !== "all") params.set("priority", priorityFilter);
    if (ticketTypeFilter !== "all") params.set("ticketType", ticketTypeFilter);
    if (campaignFilter !== "all") params.set("campaignId", campaignFilter);
    if (campaignOptionFilter !== "all")
      params.set("campaignOption", campaignOptionFilter);
    if (yardFilter !== "all") params.set("yardId", yardFilter);
    if (agentFilter !== "all") params.set("agentId", agentFilter);
    if (phoneLineFilter !== "all") params.set("phoneLineId", phoneLineFilter);
    if (currentAgentId)
      params.set("assignedMeAgentId", currentAgentId.toString());
    if (dateFrom && dateTo) {
      params.set("startDate", dateFrom.toISOString());
      params.set("endDate", dateTo.toISOString());
    }

    return `/api/tickets?${params.toString()}`;
  }, [
    focusTicketId,
    deferredSearch,
    activeView,
    statusFilter,
    priorityFilter,
    ticketTypeFilter,
    campaignFilter,
    campaignOptionFilter,
    yardFilter,
    agentFilter,
    phoneLineFilter,
    currentAgentId,
    currentPage,
    itemsPerPage,
    dateRange?.from?.getTime(),
    dateRange?.to?.getTime(),
  ]);

  // Closed view tab removed — fall back if URL/state still references it
  useEffect(() => {
    if (activeView === "closed") setActiveView("all");
  }, [activeView]);

  // Reset page on filter change
  useEffect(() => {
    setCurrentPage(1);
  }, [
    search,
    statusFilter,
    priorityFilter,
    ticketTypeFilter,
    activeView,
    campaignFilter,
    campaignOptionFilter,
    yardFilter,
    agentFilter,
    phoneLineFilter,
    dateRange?.from?.getTime(),
    dateRange?.to?.getTime(),
    itemsPerPage,
  ]);

  return {
    search,
    setSearch,
    activeView,
    setActiveView,
    handleViewChange,
    filters,
    setFilter,
    clearAllFilters,
    dateRange,
    setDateRange,
    currentPage,
    setCurrentPage,
    itemsPerPage,
    setItemsPerPage,
    ticketsApiUrl,
    deferredSearch,
    searchParams,
    focusTicketId,
    leaveTicketFocus,
    clearTicketFocus,
    resetTicketListFilters,
  };
}
