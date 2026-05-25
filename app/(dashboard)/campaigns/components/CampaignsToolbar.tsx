"use client";

import { useMemo, useState } from "react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ChevronDown,
  CircleDot,
  MapPin,
  Search,
  Tag,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  filterPillActiveClassName,
  filterPillIdleClassName,
  filterPillTriggerClassName,
  filterSelectContentClassName,
  filterSelectItemClassName,
  filterSelectSearchInputClassName,
} from "@/components/filters/filter-select-styles";
import { ManagementType } from "../../calls/types";
import { CAMPAIGN_TYPE_LABELS } from "../utils";
import type { YardSummary } from "../types";

export type CampaignsFilterState = {
  type: ManagementType | "all";
  status: "all" | "active" | "inactive";
};

interface CampaignsToolbarProps {
  search: string;
  onSearchChange: (value: string) => void;
  yardFilter: string;
  onYardFilterChange: (value: string) => void;
  filters: CampaignsFilterState;
  onFilterChange: (key: keyof CampaignsFilterState, value: string) => void;
  yards: YardSummary[];
  onClearFilters: () => void;
}

export function CampaignsToolbar({
  search,
  onSearchChange,
  yardFilter,
  onYardFilterChange,
  filters,
  onFilterChange,
  yards,
  onClearFilters,
}: CampaignsToolbarProps) {
  const [yardSearch, setYardSearch] = useState("");
  const hasActiveFilters =
    search.length > 0 ||
    yardFilter !== "all" ||
    filters.type !== "all" ||
    filters.status !== "all";
  const filteredYards = useMemo(() => {
    const term = yardSearch.trim().toLowerCase();
    if (!term) return yards;
    return yards.filter((yard) => yard.name.toLowerCase().includes(term));
  }, [yardSearch, yards]);

  return (
    <div className="flex flex-col gap-2.5 lg:flex-row lg:items-center">
      <div className="relative max-w-[420px] flex-1">
        <Search className="absolute left-3 top-1/2 h-[14px] w-[14px] -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search campaigns or yards..."
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          className="h-[30px] rounded-full border-border bg-muted/30 pl-[34px] pr-8 text-[12.5px] shadow-none focus-visible:border-[#008f68]/40 focus-visible:ring-[#008f68]/30"
        />
        <span className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded border border-border bg-background px-1.5 py-[1px] font-mono text-[10px] text-muted-foreground">
          /
        </span>
      </div>

  

      <div className="flex flex-wrap items-center gap-1.5 lg:ml-auto">
        <Select
          value={filters.type}
          onValueChange={(v) => onFilterChange("type", v)}
        >
          <SelectTrigger
            className={cn(
              filterPillTriggerClassName,
              filters.type !== "all"
                ? filterPillActiveClassName
                : filterPillIdleClassName,
            )}
          >
            <Tag
              className={cn(
                "h-3.5 w-3.5 shrink-0",
                filters.type !== "all" ? "text-[#008f68]" : "text-slate-400",
              )}
            />
            <SelectValue placeholder="Campaign type" />
            <ChevronDown className="h-3 w-3 shrink-0 text-slate-400" />
          </SelectTrigger>
          <SelectContent className={filterSelectContentClassName}>
            <SelectItem className={filterSelectItemClassName} value="all">All types</SelectItem>
            <SelectItem className={filterSelectItemClassName} value={ManagementType.ONBOARDING}>
              {CAMPAIGN_TYPE_LABELS[ManagementType.ONBOARDING]}
            </SelectItem>
            <SelectItem className={filterSelectItemClassName} value={ManagementType.AR}>
              {CAMPAIGN_TYPE_LABELS[ManagementType.AR]}
            </SelectItem>
            <SelectItem className={filterSelectItemClassName} value={ManagementType.OTHER}>
              {CAMPAIGN_TYPE_LABELS[ManagementType.OTHER]}
            </SelectItem>
          </SelectContent>
        </Select>

        <Select
          value={filters.status}
          onValueChange={(v) => onFilterChange("status", v)}
        >
          <SelectTrigger
            className={cn(
              filterPillTriggerClassName,
              filters.status !== "all"
                ? filterPillActiveClassName
                : filterPillIdleClassName,
            )}
          >
            <CircleDot
              className={cn(
                "h-3.5 w-3.5 shrink-0",
                filters.status !== "all" ? "text-[#008f68]" : "text-slate-400",
              )}
            />
            <SelectValue placeholder="Status" />
            <ChevronDown className="h-3 w-3 shrink-0 text-slate-400" />
          </SelectTrigger>
          <SelectContent className={filterSelectContentClassName}>
            <SelectItem className={filterSelectItemClassName} value="all">All statuses</SelectItem>
            <SelectItem className={filterSelectItemClassName} value="active">Active</SelectItem>
            <SelectItem className={filterSelectItemClassName} value="inactive">Inactive</SelectItem>
          </SelectContent>
        </Select>

        <Select value={yardFilter} onValueChange={onYardFilterChange}>
          <SelectTrigger
            className={cn(
              filterPillTriggerClassName,
              yardFilter !== "all"
                ? filterPillActiveClassName
                : filterPillIdleClassName,
            )}
          >
            <MapPin
              className={cn(
                "h-3.5 w-3.5 shrink-0",
                yardFilter !== "all" ? "text-[#008f68]" : "text-slate-400",
              )}
            />
            <SelectValue placeholder="All yards" />
            <ChevronDown className="h-3 w-3 shrink-0 text-slate-400" />
          </SelectTrigger>
          <SelectContent className={filterSelectContentClassName}>
            <div className="p-1">
              <Input
                value={yardSearch}
                onChange={(event) => setYardSearch(event.target.value)}
                onClick={(event) => event.stopPropagation()}
                onKeyDown={(event) => event.stopPropagation()}
                placeholder="Search yards..."
                className={filterSelectSearchInputClassName}
              />
            </div>
            <SelectItem className={filterSelectItemClassName} value="all">All yards</SelectItem>
            {filteredYards.map((yard) => (
              <SelectItem className={filterSelectItemClassName} key={yard.id} value={yard.id.toString()}>
                <span className="block max-w-[220px] truncate">{yard.name}</span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {hasActiveFilters ? (
          <button
            type="button"
            onClick={onClearFilters}
            className="ml-1 cursor-pointer text-[12px] text-slate-400 underline-offset-4 transition-colors hover:text-slate-700 hover:underline"
          >
            Clear filters
          </button>
        ) : null}
      </div>
    </div>
  );
}
