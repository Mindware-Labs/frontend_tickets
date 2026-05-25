"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { ReactNode } from "react";
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
  MapPin,
  Megaphone,
  Pin,
  Search,
  TicketCheck,
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
import type { CampaignOption, YardOption } from "../types";

export type CustomersFilterState = {
  campaign: string;
  yard: string;
  hasOpenTickets: "all" | "yes" | "no";
  hasPinnedNote: "all" | "yes" | "no";
};

interface CustomersToolbarProps {
  search: string;
  onSearchChange: (value: string) => void;
  filters: CustomersFilterState;
  onFilterChange: (key: keyof CustomersFilterState, value: string) => void;
  onClearFilters: () => void;
  campaigns: CampaignOption[];
  yards: YardOption[];
}

function FilterSelect({
  value,
  onValueChange,
  active,
  icon: Icon,
  children,
  placeholder,
}: {
  value: string;
  onValueChange: (value: string) => void;
  active: boolean;
  icon: typeof Megaphone;
  children: ReactNode;
  placeholder: string;
}) {
  return (
    <Select value={value} onValueChange={onValueChange}>
      <SelectTrigger
        aria-label={placeholder}
        className={cn(
          filterPillTriggerClassName,
          active ? filterPillActiveClassName : filterPillIdleClassName,
        )}
      >
        <Icon
          className={cn(
            "h-3.5 w-3.5 shrink-0",
            active
              ? "text-[#008f68] dark:text-[#5bebb8]"
              : "text-slate-400 dark:text-slate-500",
          )}
        />
        <SelectValue placeholder={placeholder} />
        <ChevronDown
          className={cn(
            "h-3 w-3 shrink-0",
            active
              ? "text-[#008f68]/60 dark:text-[#5bebb8]/60"
              : "text-slate-400 dark:text-slate-500",
          )}
        />
      </SelectTrigger>
      <SelectContent className={filterSelectContentClassName}>
        {children}
      </SelectContent>
    </Select>
  );
}

export function CustomersToolbar({
  search,
  onSearchChange,
  filters,
  onFilterChange,
  onClearFilters,
  campaigns,
  yards,
}: CustomersToolbarProps) {
  const searchRef = useRef<HTMLInputElement | null>(null);
  const [campaignSearch, setCampaignSearch] = useState("");
  const [yardSearch, setYardSearch] = useState("");
  const hasActiveFilters =
    filters.campaign !== "all" ||
    filters.yard !== "all" ||
    filters.hasOpenTickets !== "all" ||
    filters.hasPinnedNote !== "all";

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      const isTyping =
        target?.tagName === "INPUT" ||
        target?.tagName === "TEXTAREA" ||
        target?.isContentEditable;
      if (event.key === "/" && !isTyping) {
        event.preventDefault();
        searchRef.current?.focus();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const filteredCampaigns = useMemo(() => {
    const term = campaignSearch.trim().toLowerCase();
    if (!term) return campaigns;
    return campaigns.filter((campaign) =>
      campaign.nombre.toLowerCase().includes(term),
    );
  }, [campaignSearch, campaigns]);

  const filteredYards = useMemo(() => {
    const term = yardSearch.trim().toLowerCase();
    if (!term) return yards;
    return yards.filter((yard) => yard.name.toLowerCase().includes(term));
  }, [yardSearch, yards]);

  return (
    <div className="flex flex-col items-stretch gap-2.5 lg:flex-row lg:items-center">
      <div className="relative flex-1 lg:max-w-[420px]">
        <Search className="absolute left-3 top-1/2 h-[14px] w-[14px] -translate-y-1/2 text-muted-foreground" />
        <Input
          ref={searchRef}
          placeholder="Search customers by name, phone, ID, or campaign..."
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          className="h-[30px] rounded-full border-border bg-muted/30 pl-[34px] pr-8 text-[12.5px] shadow-none focus-visible:border-[#008f68]/40 focus-visible:ring-[#008f68]/30"
        />
        <span className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded border border-border bg-background px-1.5 py-[1px] font-mono text-[10px] text-muted-foreground">
          /
        </span>
      </div>

      

      <div className="flex flex-wrap items-center gap-1.5 lg:ml-auto">
        <FilterSelect
          value={filters.campaign}
          onValueChange={(value) => onFilterChange("campaign", value)}
          active={filters.campaign !== "all"}
          icon={Megaphone}
          placeholder="All campaigns"
        >
          <div className="p-1">
            <Input
              value={campaignSearch}
              onChange={(event) => setCampaignSearch(event.target.value)}
              onClick={(event) => event.stopPropagation()}
              onKeyDown={(event) => event.stopPropagation()}
              placeholder="Search campaigns..."
              className={filterSelectSearchInputClassName}
            />
          </div>
          <SelectItem className={filterSelectItemClassName} value="all">
            All campaigns
          </SelectItem>
          {filteredCampaigns.map((campaign) => (
            <SelectItem
              key={campaign.id}
              className={filterSelectItemClassName}
              value={String(campaign.id)}
            >
              {campaign.nombre}
            </SelectItem>
          ))}
        </FilterSelect>

        <FilterSelect
          value={filters.yard}
          onValueChange={(value) => onFilterChange("yard", value)}
          active={filters.yard !== "all"}
          icon={MapPin}
          placeholder="All yards"
        >
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
          <SelectItem className={filterSelectItemClassName} value="all">
            All yards
          </SelectItem>
          {filteredYards.map((yard) => (
            <SelectItem
              key={yard.id}
              className={filterSelectItemClassName}
              value={String(yard.id)}
            >
              {yard.name}
            </SelectItem>
          ))}
        </FilterSelect>

        <FilterSelect
          value={filters.hasOpenTickets}
          onValueChange={(value) =>
            onFilterChange("hasOpenTickets", value as CustomersFilterState["hasOpenTickets"])
          }
          active={filters.hasOpenTickets !== "all"}
          icon={TicketCheck}
          placeholder="Open tickets"
        >
          <SelectItem className={filterSelectItemClassName} value="all">
            Open tickets: All
          </SelectItem>
          <SelectItem className={filterSelectItemClassName} value="yes">
            Open tickets: Yes
          </SelectItem>
          <SelectItem className={filterSelectItemClassName} value="no">
            Open tickets: No
          </SelectItem>
        </FilterSelect>

        <FilterSelect
          value={filters.hasPinnedNote}
          onValueChange={(value) =>
            onFilterChange("hasPinnedNote", value as CustomersFilterState["hasPinnedNote"])
          }
          active={filters.hasPinnedNote !== "all"}
          icon={Pin}
          placeholder="Pinned note"
        >
          <SelectItem className={filterSelectItemClassName} value="all">
            Pinned note: All
          </SelectItem>
          <SelectItem className={filterSelectItemClassName} value="yes">
            Pinned note: Yes
          </SelectItem>
          <SelectItem className={filterSelectItemClassName} value="no">
            Pinned note: No
          </SelectItem>
        </FilterSelect>

        {hasActiveFilters ? (
          <button
            type="button"
            onClick={onClearFilters}
            className="ml-1 cursor-pointer text-[12px] text-slate-400 underline-offset-4 transition-colors hover:text-slate-700 hover:underline dark:text-slate-500 dark:hover:text-slate-300"
          >
            Clear filters
          </button>
        ) : null}
      </div>
    </div>
  );
}
