"use client";

import { useState, useMemo, useDeferredValue, useEffect } from "react";
import type { DateRange } from "react-day-picker";
import { startOfDay, endOfDay } from "date-fns";

export type ManualRecordFilterKey =
  | "status"
  | "campaign"
  | "yard"
  | "campaignOption"
  | "disposition"
  | "agent";

export interface ManualRecordFilters {
  status: string;
  campaign: string;
  yard: string;
  campaignOption: string;
  disposition: string;
  agent: string;
}

export function useManualRecordFilters() {
  const [search, setSearch] = useState("");
  const [activeView, setActiveView] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [campaignFilter, setCampaignFilter] = useState("all");
  const [yardFilter, setYardFilter] = useState("all");
  const [campaignOptionFilter, setCampaignOptionFilter] = useState("all");
  const [dispositionFilter, setDispositionFilter] = useState("all");
  const [agentFilter, setAgentFilter] = useState("all");
  const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  const deferredSearch = useDeferredValue(search);

  const filters: ManualRecordFilters = {
    status: statusFilter,
    campaign: campaignFilter,
    yard: yardFilter,
    campaignOption: campaignOptionFilter,
    disposition: dispositionFilter,
    agent: agentFilter,
  };

  const setFilter = (key: ManualRecordFilterKey, value: string) => {
    const setters: Record<ManualRecordFilterKey, (v: string) => void> = {
      status: setStatusFilter,
      campaign: setCampaignFilter,
      yard: setYardFilter,
      campaignOption: setCampaignOptionFilter,
      disposition: setDispositionFilter,
      agent: setAgentFilter,
    };
    setters[key](value);
  };

  const handleViewChange = (view: string) => {
    setActiveView(view);
  };

  const clearAllFilters = () => {
    setSearch("");
    setStatusFilter("all");
    setCampaignFilter("all");
    setYardFilter("all");
    setCampaignOptionFilter("all");
    setDispositionFilter("all");
    setAgentFilter("all");
    setDateRange(undefined);
  };

  const apiUrl = useMemo(() => {
    const params = new URLSearchParams();
    const normalizedSearch = deferredSearch.trim();
    const dateFrom = dateRange?.from ? startOfDay(dateRange.from) : null;
    const dateTo = dateRange?.from
      ? endOfDay(dateRange.to ?? dateRange.from)
      : null;

    params.set("page", String(Math.max(1, currentPage)));
    params.set("limit", String(Math.max(1, Math.min(itemsPerPage, 500))));
    params.set("includeViewCounts", "true");
    params.set("view", activeView);

    if (normalizedSearch) params.set("search", normalizedSearch);
    if (statusFilter !== "all") params.set("status", statusFilter);
    if (campaignFilter !== "all") params.set("campaignId", campaignFilter);
    if (yardFilter !== "all") params.set("yardId", yardFilter);
    if (campaignOptionFilter !== "all")
      params.set("campaignOption", campaignOptionFilter);
    if (dispositionFilter !== "all")
      params.set("disposition", dispositionFilter);
    if (agentFilter !== "all") params.set("createdByAgentId", agentFilter);
    if (dateFrom && dateTo) {
      params.set("startDate", dateFrom.toISOString());
      params.set("endDate", dateTo.toISOString());
    }

    return `/api/manual-records?${params.toString()}`;
  }, [
    deferredSearch,
    statusFilter,
    campaignFilter,
    yardFilter,
    campaignOptionFilter,
    dispositionFilter,
    agentFilter,
    activeView,
    currentPage,
    itemsPerPage,
    dateRange?.from?.getTime(),
    dateRange?.to?.getTime(),
  ]);

  useEffect(() => {
    setCurrentPage(1);
  }, [
    deferredSearch,
    statusFilter,
    campaignFilter,
    yardFilter,
    campaignOptionFilter,
    dispositionFilter,
    agentFilter,
    activeView,
    dateRange?.from?.getTime(),
    dateRange?.to?.getTime(),
    itemsPerPage,
  ]);

  return {
    search,
    setSearch,
    activeView,
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
    apiUrl,
    deferredSearch,
  };
}
