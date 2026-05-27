"use client";

import { Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  filterPillActiveClassName,
  filterPillIdleClassName,
  filterPillTriggerClassName,
  filterSelectContentClassName,
  filterSelectItemClassName,
} from "@/components/filters/filter-select-styles";
import { cn } from "@/lib/utils";
import {
  type SmsDirectionFilter,
  type SmsPeriodKey,
  type SmsStatusFilter,
} from "./sms-types";

export interface SmsAgentFilterOption {
  value: string;
  label: string;
}

interface SmsFiltersBarProps {
  period: SmsPeriodKey;
  onPeriodChange: (value: SmsPeriodKey) => void;
  direction: SmsDirectionFilter;
  onDirectionChange: (value: SmsDirectionFilter) => void;
  status: SmsStatusFilter;
  onStatusChange: (value: SmsStatusFilter) => void;
  agentFilter: string;
  onAgentFilterChange: (value: string) => void;
  agentOptions: SmsAgentFilterOption[];
  search: string;
  onSearchChange: (value: string) => void;
  onClearAll: () => void;
  hasActiveFilters: boolean;
  loading?: boolean;
}

const PERIOD_OPTIONS: Array<{ value: SmsPeriodKey; label: string }> = [
  { value: "1d", label: "Today" },
  { value: "7d", label: "Last 7 days" },
  { value: "30d", label: "Last 30 days" },
  { value: "90d", label: "Last 90 days" },
];

const DIRECTION_OPTIONS: Array<{
  value: SmsDirectionFilter;
  label: string;
}> = [
  { value: "all", label: "All directions" },
  { value: "SENT", label: "Outbound" },
  { value: "RECEIVED", label: "Inbound" },
];

const STATUS_OPTIONS: Array<{ value: SmsStatusFilter; label: string }> = [
  { value: "all", label: "All statuses" },
  { value: "delivered", label: "Delivered" },
  { value: "sent", label: "Sent" },
  { value: "queued", label: "Queued" },
  { value: "failed", label: "Failed" },
  { value: "received", label: "Received" },
];

export function SmsFiltersBar({
  period,
  onPeriodChange,
  direction,
  onDirectionChange,
  status,
  onStatusChange,
  agentFilter,
  onAgentFilterChange,
  agentOptions,
  search,
  onSearchChange,
  onClearAll,
  hasActiveFilters,
  loading = false,
}: SmsFiltersBarProps) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <FilterPill
        ariaLabel="Date range"
        value={period}
        onValueChange={(v) => onPeriodChange(v as SmsPeriodKey)}
        options={PERIOD_OPTIONS}
        active={period !== "7d"}
      />
      <FilterPill
        ariaLabel="Direction"
        value={direction}
        onValueChange={(v) => onDirectionChange(v as SmsDirectionFilter)}
        options={DIRECTION_OPTIONS}
        active={direction !== "all"}
      />
      <FilterPill
        ariaLabel="Status"
        value={status}
        onValueChange={(v) => onStatusChange(v as SmsStatusFilter)}
        options={STATUS_OPTIONS}
        active={status !== "all"}
      />
      <FilterPill
        ariaLabel="Agent"
        value={agentFilter}
        onValueChange={onAgentFilterChange}
        options={agentOptions}
        active={agentFilter !== "all"}
      />

      <div className="relative ml-auto flex min-w-[200px] flex-1 items-center sm:max-w-[300px]">
        <Search
          className="pointer-events-none absolute left-2.5 size-3.5 text-slate-400"
          aria-hidden
        />
        <input
          type="search"
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search number, message, agent…"
          className="h-[30px] w-full rounded-full border border-slate-200 bg-white pl-7 pr-7 text-[12.5px] font-medium text-slate-700 shadow-sm shadow-slate-200/50 transition-colors placeholder:text-slate-400 hover:border-slate-300 focus:border-[#008f68] focus:outline-none focus:ring-2 focus:ring-[#008f68]/20 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
          aria-label="Search SMS messages"
        />
        {search && (
          <button
            type="button"
            onClick={() => onSearchChange("")}
            className="absolute right-1.5 inline-flex size-5 items-center justify-center rounded-full text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800"
            aria-label="Clear search"
          >
            <X className="size-3" aria-hidden />
          </button>
        )}
      </div>

      {hasActiveFilters && (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={onClearAll}
          className="h-[30px] gap-1.5 rounded-full px-2.5 text-[11px] font-semibold uppercase tracking-wider text-slate-500 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800"
        >
          <X className="size-3" aria-hidden />
          Clear
        </Button>
      )}

      {loading && (
        <span
          aria-hidden
          className="ml-1 inline-flex size-2 animate-pulse rounded-full bg-[#008f68]"
        />
      )}
    </div>
  );
}

function FilterPill({
  ariaLabel,
  value,
  onValueChange,
  options,
  active,
}: {
  ariaLabel: string;
  value: string;
  onValueChange: (value: string) => void;
  options: ReadonlyArray<{ value: string; label: string }>;
  active: boolean;
}) {
  return (
    <Select value={value} onValueChange={onValueChange}>
      <SelectTrigger
        aria-label={ariaLabel}
        className={cn(
          filterPillTriggerClassName,
          active ? filterPillActiveClassName : filterPillIdleClassName,
        )}
      >
        <SelectValue />
      </SelectTrigger>
      <SelectContent className={filterSelectContentClassName}>
        {options.map((option) => (
          <SelectItem
            key={option.value}
            value={option.value}
            className={filterSelectItemClassName}
          >
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
