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
  Layers,
  CircleDot,
  MousePointerClick,
} from "lucide-react";
import { cn } from "@/lib/utils";

export type YardsFilterState = {
  type: string;
  status: string;
};

interface YardsToolbarProps {
  search: string;
  onSearchChange: (value: string) => void;
  filters: YardsFilterState;
  onFilterChange: (key: keyof YardsFilterState, value: string) => void;
  onClearFilters: () => void;
}

export function YardsToolbar({
  search,
  onSearchChange,
  filters,
  onFilterChange,
  onClearFilters,
}: YardsToolbarProps) {
  const hasActiveFilters = filters.type !== "all" || filters.status !== "all";

  return (
    <div className="flex flex-col lg:flex-row items-stretch lg:items-center gap-2.5">
      {/* Search */}
      <div className="relative flex-1 max-w-[420px]">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-[14px] w-[14px] text-muted-foreground" />
        <Input
          placeholder="Search yards by name, address, contact, or landlord..."
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
        <span>Click a row to view yard details.</span>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-1.5 lg:ml-auto">
        {/* Type Select */}
        <Select value={filters.type} onValueChange={(v) => onFilterChange("type", v)}>
          <SelectTrigger
            className={cn(
              "h-[30px] gap-1.5 rounded-full pl-2.5 pr-2 border bg-white text-[12.5px] font-medium shadow-none transition-colors [&>svg]:hidden dark:bg-slate-900",
              filters.type !== "all"
                ? "border-[#008f68]/40 text-[#006b4f] hover:border-[#008f68]/60 hover:bg-[#f0fdf8] dark:border-[#00c98d]/40 dark:text-[#5bebb8] dark:hover:bg-[#00c98d]/10"
                : "border-[#e2e8f0] text-slate-500 hover:border-slate-300 dark:border-slate-700 dark:text-slate-400",
            )}
          >
            <Layers className={cn(
              "h-3.5 w-3.5 shrink-0",
              filters.type !== "all" ? "text-[#008f68] dark:text-[#5bebb8]" : "text-slate-400 dark:text-slate-500",
            )} />
            <SelectValue placeholder="All types" />
            <ChevronDown className={cn(
              "h-3 w-3 shrink-0",
              filters.type !== "all" ? "text-[#008f68]/60 dark:text-[#5bebb8]/60" : "text-slate-400 dark:text-slate-500",
            )} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All types</SelectItem>
            <SelectItem value="SAAS">SaaS</SelectItem>
            <SelectItem value="FULL_SERVICE">Full Service</SelectItem>
          </SelectContent>
        </Select>

        {/* Status Select */}
        <Select value={filters.status} onValueChange={(v) => onFilterChange("status", v)}>
          <SelectTrigger
            className={cn(
              "h-[30px] gap-1.5 rounded-full pl-2.5 pr-2 border bg-white text-[12.5px] font-medium shadow-none transition-colors [&>svg]:hidden dark:bg-slate-900",
              filters.status !== "all"
                ? "border-[#008f68]/40 text-[#006b4f] hover:border-[#008f68]/60 hover:bg-[#f0fdf8] dark:border-[#00c98d]/40 dark:text-[#5bebb8] dark:hover:bg-[#00c98d]/10"
                : "border-[#e2e8f0] text-slate-500 hover:border-slate-300 dark:border-slate-700 dark:text-slate-400",
            )}
          >
            <CircleDot className={cn(
              "h-3.5 w-3.5 shrink-0",
              filters.status !== "all" ? "text-[#008f68] dark:text-[#5bebb8]" : "text-slate-400 dark:text-slate-500",
            )} />
            <SelectValue placeholder="All statuses" />
            <ChevronDown className={cn(
              "h-3 w-3 shrink-0",
              filters.status !== "all" ? "text-[#008f68]/60 dark:text-[#5bebb8]/60" : "text-slate-400 dark:text-slate-500",
            )} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="inactive">Inactive</SelectItem>
          </SelectContent>
        </Select>

        {/* Clear all — only when filters are active */}
        {hasActiveFilters && (
          <button
            type="button"
            onClick={onClearFilters}
            className="cursor-pointer text-[12px] text-slate-400 underline-offset-4 transition-colors hover:text-slate-700 hover:underline dark:text-slate-500 dark:hover:text-slate-300 ml-1"
          >
            Clear all
          </button>
        )}
      </div>
    </div>
  );
}
