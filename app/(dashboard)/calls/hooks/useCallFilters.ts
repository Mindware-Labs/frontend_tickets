"use client";

import { useState, useMemo, useDeferredValue, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import type { DateRange } from "react-day-picker";
import { startOfDay, endOfDay } from "date-fns";

export type FilterKey =
  | "status"
  | "direction"
  | "disposition"
  | "campaign"
  | "campaignOption"
  | "yard"
  | "agent"
  | "phoneLine";

export interface Filters {
  status: string;
  direction: string;
  disposition: string;
  campaign: string;
  campaignOption: string;
  yard: string;
  agent: string;
  phoneLine: string;
}

interface UseCallFiltersOptions {
  currentAgentId?: number;
}

export function useCallFilters({ currentAgentId }: UseCallFiltersOptions) {
  const searchParams = useSearchParams();
  const router = useRouter();

  const [search, setSearch] = useState("");
  const [activeView, setActiveView] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [directionFilter, setDirectionFilter] = useState("all");
  const [dispositionFilter, setDispositionFilter] = useState("all");
  const [campaignFilter, setCampaignFilter] = useState("all");
  const [campaignOptionFilter, setCampaignOptionFilter] = useState("all");
  const [yardFilter, setYardFilter] = useState("all");
  const [agentFilter, setAgentFilter] = useState("all");
  const [phoneLineFilter, setPhoneLineFilter] = useState("all");
  const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  const deferredSearch = useDeferredValue(search);

  const filters: Filters = {
    status: statusFilter,
    direction: directionFilter,
    disposition: dispositionFilter,
    campaign: campaignFilter,
    campaignOption: campaignOptionFilter,
    yard: yardFilter,
    agent: agentFilter,
    phoneLine: phoneLineFilter,
  };

  const setFilter = (key: FilterKey, value: string) => {
    const setters: Record<FilterKey, (v: string) => void> = {
      status: setStatusFilter,
      direction: setDirectionFilter,
      disposition: setDispositionFilter,
      campaign: setCampaignFilter,
      campaignOption: setCampaignOptionFilter,
      yard: setYardFilter,
      agent: setAgentFilter,
      phoneLine: setPhoneLineFilter,
    };
    setters[key](value);
  };

  const handleViewChange = (view: string) => {
    if (typeof window !== "undefined") {
      const currentUrl = new URL(window.location.href);
      if (
        currentUrl.searchParams.has("customerId") &&
        !searchParams.get("customerId")
      ) {
        currentUrl.searchParams.delete("customerId");
        router.replace(currentUrl.pathname + currentUrl.search, {
          scroll: false,
        });
      }
    }
    setActiveView(view);
  };

  const focusCallId = searchParams.get("id");

  // Deep link ?id= — list only that call in the table
  useEffect(() => {
    if (!focusCallId) return;
    setSearch(focusCallId);
    setActiveView("all");
    setCurrentPage(1);
  }, [focusCallId]);

  // Build SWR URL
  const ticketsApiUrl = useMemo(() => {
    const params = new URLSearchParams();
    const currentCustomerIdParam = searchParams.get("customerId");
    const normalizedSearch = (focusCallId || deferredSearch).trim();
    const directionValue = directionFilter?.trim();
    const dateFrom = dateRange?.from ? startOfDay(dateRange.from) : null;
    const dateTo = dateRange?.from
      ? endOfDay(dateRange.to ?? dateRange.from)
      : null;

    params.set("mode", "page");
    params.set("page", String(Math.max(1, currentPage)));
    params.set("limit", String(Math.max(1, Math.min(itemsPerPage, 500))));
    params.set("includeTotal", "true");
    params.set("includeViewCounts", "true");
    params.set("view", focusCallId ? "all" : activeView);
    params.set("groupBy", "customer");

    if (normalizedSearch) params.set("search", normalizedSearch);
    if (statusFilter !== "all") params.set("status", statusFilter);
    if (directionValue && directionValue !== "all")
      params.set("direction", directionValue);
    if (dispositionFilter !== "all")
      params.set("disposition", dispositionFilter);
    if (campaignFilter !== "all") params.set("campaignId", campaignFilter);
    if (campaignOptionFilter !== "all")
      params.set("campaignOption", campaignOptionFilter);
    if (yardFilter !== "all") params.set("yardId", yardFilter);
    if (agentFilter !== "all") params.set("agentId", agentFilter);
    if (phoneLineFilter !== "all") params.set("phoneLineId", phoneLineFilter);
    if (currentCustomerIdParam)
      params.set("customerId", currentCustomerIdParam);
    if (currentAgentId)
      params.set("assignedMeAgentId", currentAgentId.toString());
    if (dateFrom && dateTo) {
      params.set("startDate", dateFrom.toISOString());
      params.set("endDate", dateTo.toISOString());
    }

    return `/api/calls?${params.toString()}`;
  }, [
    searchParams,
    focusCallId,
    deferredSearch,
    activeView,
    statusFilter,
    directionFilter,
    dispositionFilter,
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

  // URL search param sync
  useEffect(() => {
    const searchParam = searchParams.get("search");
    let searchParamValue = searchParam ? decodeURIComponent(searchParam) : null;

    if (typeof window !== "undefined" && !searchParamValue) {
      const urlParams = new URLSearchParams(window.location.search);
      const urlSearchParam = urlParams.get("search");
      if (urlSearchParam) searchParamValue = decodeURIComponent(urlSearchParam);
    }

    if (searchParamValue !== null && searchParamValue.trim() !== "") {
      if (searchParamValue !== search) setSearch(searchParamValue);
    } else if (!searchParamValue && search) {
      setSearch("");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  // View param from URL
  useEffect(() => {
    const viewParam = searchParams.get("view");
    if (viewParam) setActiveView(viewParam);
  }, [searchParams]);

  // Reset page on filter change
  useEffect(() => {
    setCurrentPage(1);
  }, [
    search,
    statusFilter,
    directionFilter,
    dispositionFilter,
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
    dateRange,
    setDateRange,
    currentPage,
    setCurrentPage,
    itemsPerPage,
    setItemsPerPage,
    ticketsApiUrl,
    deferredSearch,
    searchParams,
    focusCallId,
  };
}
