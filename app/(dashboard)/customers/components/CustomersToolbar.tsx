"use client";

import { useEffect, useRef } from "react";
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
  MousePointerClick,
  Pin,
  Search,
  TicketCheck,
} from "lucide-react";
import { cn } from "@/lib/utils";
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
          "h-[30px] gap-1.5 rounded-full border bg-white pl-2.5 pr-2 text-[12.5px] font-medium shadow-none transition-colors [&>svg]:hidden dark:bg-slate-900",
          active
            ? "border-[#008f68]/40 text-[#006b4f] hover:border-[#008f68]/60 hover:bg-[#f0fdf8] dark:border-[#00c98d]/40 dark:text-[#5bebb8] dark:hover:bg-[#00c98d]/10"
            : "border-[#e2e8f0] text-slate-500 hover:border-slate-300 dark:border-slate-700 dark:text-slate-400",
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
      <SelectContent>{children}</SelectContent>
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

      <div className="flex items-center gap-1.5 px-1 text-[12px] font-medium text-muted-foreground lg:whitespace-nowrap">
        <MousePointerClick className="h-3.5 w-3.5 shrink-0" strokeWidth={2} />
        <span>Click a row to view customer details.</span>
      </div>

      <div className="flex flex-wrap items-center gap-1.5 lg:ml-auto">
        <FilterSelect
          value={filters.campaign}
          onValueChange={(value) => onFilterChange("campaign", value)}
          active={filters.campaign !== "all"}
          icon={Megaphone}
          placeholder="All campaigns"
        >
          <SelectItem value="all">All campaigns</SelectItem>
          {campaigns.map((campaign) => (
            <SelectItem key={campaign.id} value={String(campaign.id)}>
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
          <SelectItem value="all">All yards</SelectItem>
          {yards.map((yard) => (
            <SelectItem key={yard.id} value={String(yard.id)}>
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
          <SelectItem value="all">Open tickets: All</SelectItem>
          <SelectItem value="yes">Open tickets: Yes</SelectItem>
          <SelectItem value="no">Open tickets: No</SelectItem>
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
          <SelectItem value="all">Pinned note: All</SelectItem>
          <SelectItem value="yes">Pinned note: Yes</SelectItem>
          <SelectItem value="no">Pinned note: No</SelectItem>
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
