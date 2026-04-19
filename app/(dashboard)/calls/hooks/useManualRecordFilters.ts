"use client";

import { useState, useMemo, useDeferredValue, useEffect } from "react";
import type { DateRange } from "react-day-picker";
import { startOfDay, endOfDay } from "date-fns";

export type ManualRecordFilterKey = "campaign" | "yard" | "campaignOption" | "disposition";

export interface ManualRecordFilters {
  campaign: string;
  yard: string;
  campaignOption: string;
  disposition: string;
}

export function useManualRecordFilters() {
  const [search, setSearch] = useState("");
  const [campaignFilter, setCampaignFilter] = useState("all");
  const [yardFilter, setYardFilter] = useState("all");
  const [campaignOptionFilter, setCampaignOptionFilter] = useState("all");
  const [dispositionFilter, setDispositionFilter] = useState("all");
  const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  const deferredSearch = useDeferredValue(search);

  const filters: ManualRecordFilters = {
    campaign: campaignFilter,
    yard: yardFilter,
    campaignOption: campaignOptionFilter,
    disposition: dispositionFilter,
  };

  const setFilter = (key: ManualRecordFilterKey, value: string) => {
    const setters: Record<ManualRecordFilterKey, (v: string) => void> = {
      campaign: setCampaignFilter,
      yard: setYardFilter,
      campaignOption: setCampaignOptionFilter,
      disposition: setDispositionFilter,
    };
    setters[key](value);
  };

  const clearAllFilters = () => {
    setSearch("");
    setCampaignFilter("all");
    setYardFilter("all");
    setCampaignOptionFilter("all");
    setDispositionFilter("all");
    setDateRange(undefined);
  };

  const apiUrl = useMemo(() => {
    const params = new URLSearchParams();
    params.set("page", String(Math.max(1, currentPage)));
    params.set("limit", String(Math.max(1, Math.min(itemsPerPage, 500))));
    if (campaignFilter !== "all") params.set("campaignId", campaignFilter);
    if (yardFilter !== "all") params.set("yardId", yardFilter);
    return `/api/manual-records?${params.toString()}`;
  }, [campaignFilter, yardFilter, currentPage, itemsPerPage]);

  // Reset page on filter/search change
  useEffect(() => {
    setCurrentPage(1);
  }, [
    deferredSearch,
    campaignFilter,
    yardFilter,
    campaignOptionFilter,
    dispositionFilter,
    dateRange?.from?.getTime(),
    itemsPerPage,
  ]);

  return {
    search,
    setSearch,
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
