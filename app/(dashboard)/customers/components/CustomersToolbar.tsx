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
  Search,
  ChevronDown,
  Megaphone,
  MousePointerClick,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { CampaignOption } from "../types";

export type CustomersFilterState = {
  campaign: string;
};

interface CustomersToolbarProps {
  search: string;
  onSearchChange: (value: string) => void;
  filters: CustomersFilterState;
  onFilterChange: (key: keyof CustomersFilterState, value: string) => void;
  onClearFilters: () => void;
  campaigns: CampaignOption[];
}

export function CustomersToolbar({
  search,
  onSearchChange,
  filters,
  onFilterChange,
  onClearFilters,
  campaigns,
}: CustomersToolbarProps) {
  const hasActiveFilters = filters.campaign !== "all";

  return (
    <div className="flex flex-col lg:flex-row items-stretch lg:items-center gap-2.5">
      <div className="relative flex-1 max-w-[420px]">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-[14px] w-[14px] text-muted-foreground" />
        <Input
          placeholder="Search customers by name, phone, ID, or campaign..."
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-[34px] pr-8 h-[30px] rounded-full text-[12.5px] bg-muted/30 border-border shadow-none focus-visible:ring-[#008f68]/30 focus-visible:border-[#008f68]/40"
        />
        <span className="absolute right-2.5 top-1/2 -translate-y-1/2 border border-border rounded px-1.5 py-[1px] text-[10px] text-muted-foreground font-mono bg-background">
          /
        </span>
      </div>

      <div className="flex items-center gap-1.5 px-1 text-[12px] font-medium text-muted-foreground lg:whitespace-nowrap">
        <MousePointerClick className="h-3.5 w-3.5 shrink-0" strokeWidth={2} />
        <span>Click a row to view customer details.</span>
      </div>

      <div className="flex flex-wrap items-center gap-1.5 lg:ml-auto">
        <Select
          value={filters.campaign}
          onValueChange={(v) => onFilterChange("campaign", v)}
        >
          <SelectTrigger
            className={cn(
              "h-[30px] gap-1.5 rounded-full pl-2.5 pr-2 border bg-white text-[12.5px] font-medium shadow-none transition-colors [&>svg]:hidden dark:bg-slate-900",
              filters.campaign !== "all"
                ? "border-[#008f68]/40 text-[#006b4f] hover:border-[#008f68]/60 hover:bg-[#f0fdf8] dark:border-[#00c98d]/40 dark:text-[#5bebb8] dark:hover:bg-[#00c98d]/10"
                : "border-[#e2e8f0] text-slate-500 hover:border-slate-300 dark:border-slate-700 dark:text-slate-400",
            )}
          >
            <Megaphone
              className={cn(
                "h-3.5 w-3.5 shrink-0",
                filters.campaign !== "all"
                  ? "text-[#008f68] dark:text-[#5bebb8]"
                  : "text-slate-400 dark:text-slate-500",
              )}
            />
            <SelectValue placeholder="All campaigns" />
            <ChevronDown
              className={cn(
                "h-3 w-3 shrink-0",
                filters.campaign !== "all"
                  ? "text-[#008f68]/60 dark:text-[#5bebb8]/60"
                  : "text-slate-400 dark:text-slate-500",
              )}
            />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All campaigns</SelectItem>
            {campaigns.map((c) => (
              <SelectItem key={c.id} value={String(c.id)}>
                {c.nombre}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {hasActiveFilters ? (
          <button
            type="button"
            onClick={onClearFilters}
            className="cursor-pointer text-[12px] text-slate-400 underline-offset-4 transition-colors hover:text-slate-700 hover:underline dark:text-slate-500 dark:hover:text-slate-300 ml-1"
          >
            Clear all
          </button>
        ) : null}
      </div>
    </div>
  );
}
