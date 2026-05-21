"use client";

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
  MousePointerClick,
  Search,
  Tag,
} from "lucide-react";
import { cn } from "@/lib/utils";
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
  const hasActiveFilters =
    search.length > 0 ||
    yardFilter !== "all" ||
    filters.type !== "all" ||
    filters.status !== "all";

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

      <div className="flex items-center gap-1.5 px-1 text-[12px] font-medium text-muted-foreground lg:whitespace-nowrap">
        <MousePointerClick className="h-3.5 w-3.5 shrink-0" strokeWidth={2} />
        <span>Click a card to view campaign details.</span>
      </div>

      <div className="flex flex-wrap items-center gap-1.5 lg:ml-auto">
        <Select
          value={filters.type}
          onValueChange={(v) => onFilterChange("type", v)}
        >
          <SelectTrigger
            className={cn(
              "h-[30px] gap-1.5 rounded-full border bg-white pl-2.5 pr-2 text-[12.5px] font-medium shadow-none dark:bg-slate-900 [&>svg]:hidden",
              filters.type !== "all"
                ? "border-[#008f68]/40 text-[#006b4f] hover:border-[#008f68]/60 hover:bg-[#f0fdf8]"
                : "border-[#e2e8f0] text-slate-500 hover:border-slate-300",
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
          <SelectContent>
            <SelectItem value="all">All types</SelectItem>
            <SelectItem value={ManagementType.ONBOARDING}>
              {CAMPAIGN_TYPE_LABELS[ManagementType.ONBOARDING]}
            </SelectItem>
            <SelectItem value={ManagementType.AR}>
              {CAMPAIGN_TYPE_LABELS[ManagementType.AR]}
            </SelectItem>
            <SelectItem value={ManagementType.OTHER}>
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
              "h-[30px] gap-1.5 rounded-full border bg-white pl-2.5 pr-2 text-[12.5px] font-medium shadow-none dark:bg-slate-900 [&>svg]:hidden",
              filters.status !== "all"
                ? "border-[#008f68]/40 text-[#006b4f] hover:border-[#008f68]/60 hover:bg-[#f0fdf8]"
                : "border-[#e2e8f0] text-slate-500 hover:border-slate-300",
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
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="inactive">Inactive</SelectItem>
          </SelectContent>
        </Select>

        <Select value={yardFilter} onValueChange={onYardFilterChange}>
          <SelectTrigger
            className={cn(
              "h-[30px] gap-1.5 rounded-full border bg-white pl-2.5 pr-2 text-[12.5px] font-medium shadow-none dark:bg-slate-900 [&>svg]:hidden",
              yardFilter !== "all"
                ? "border-[#008f68]/40 text-[#006b4f] hover:border-[#008f68]/60 hover:bg-[#f0fdf8]"
                : "border-[#e2e8f0] text-slate-500 hover:border-slate-300",
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
          <SelectContent>
            <SelectItem value="all">All yards</SelectItem>
            {yards.map((yard) => (
              <SelectItem key={yard.id} value={yard.id.toString()}>
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
