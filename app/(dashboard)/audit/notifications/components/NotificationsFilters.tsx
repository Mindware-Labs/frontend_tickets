"use client";

import { useState } from "react";
import { Search, X, Calendar, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Popover, PopoverContent, PopoverTrigger,
} from "@/components/ui/popover";
import {
  filterPillTriggerClassName,
  filterPillActiveClassName,
  filterPillIdleClassName,
  filterSelectContentClassName,
  filterSelectItemClassName,
} from "@/components/filters/filter-select-styles";
import type {
  NotificationFiltersProps,
  NotificationFiltersState,
  NotificationType,
  NotificationTab,
} from "./notification-types";

const TYPE_OPTIONS: Array<{ value: NotificationType; label: string }> = [
  { value: "CALLBACK_OVERDUE",        label: "Callback overdue" },
  { value: "TICKET_FOLLOWUP_OVERDUE", label: "Ticket follow-up" },
  { value: "SCHEDULED_CALL_DUE",      label: "Scheduled call"   },
];

const READ_OPTIONS = [
  { value: "false", label: "Unread" },
  { value: "true",  label: "Read"   },
];

const TABS: Array<[NotificationTab, string]> = [
  ["all",     "All"    ],
  ["unread",  "Unread" ],
  ["overdue", "Overdue"],
];

function fmtDate(s: string) {
  const [y, m, d] = s.split("-");
  return `${m}/${d}/${y.slice(2)}`;
}
function dateLabel(from: string, to: string) {
  if (!from && !to) return "Date";
  if (from && to)   return `${fmtDate(from)}–${fmtDate(to)}`;
  if (from)         return `≥ ${fmtDate(from)}`;
  return            `≤ ${fmtDate(to)}`;
}

export function NotificationsFilters({
  activeTab, filters, stats, hasFilters,
  agentOptions, searchRef,
  onTabChange, onFilterChange, onSearchChange, onClearFilters,
}: NotificationFiltersProps) {
  const [dateOpen, setDateOpen] = useState(false);
  const set = (k: keyof NotificationFiltersState, v: string) => onFilterChange(k, v);

  const activeDate  = !!(filters.from || filters.to);
  const activeType  = !!filters.type;
  const activeAgent = !!filters.agentId;
  const activeRead  = filters.read !== "";

  return (
    <div className="section-card mb-3 flex flex-wrap items-center gap-1.5 px-3 py-2">

      {/* ── Segmented tabs ── */}
      <div className="flex gap-0.5 rounded-lg border border-slate-200/80 bg-slate-100 p-0.5 dark:border-slate-700 dark:bg-slate-800/60">
        {TABS.map(([key, label]) => (
          <button
            key={key}
            onClick={() => onTabChange(key)}
            className={cn(
              "flex shrink-0 items-center gap-1 rounded-md px-2.5 py-1 text-[12px] font-medium transition-all",
              activeTab === key
                ? "bg-white font-semibold text-[#008f68] shadow-sm dark:bg-slate-950 dark:text-emerald-400"
                : "text-slate-500 hover:text-slate-700 dark:text-slate-400",
            )}
          >
            {label}
            <span className={cn(
              "rounded-full px-1.5 py-px text-[9px] font-bold tabular-nums",
              activeTab === key
                ? "bg-[#008f68]/10 text-[#008f68] dark:bg-emerald-400/15 dark:text-emerald-400"
                : "bg-slate-200 text-slate-500 dark:bg-slate-700 dark:text-slate-400",
            )}>
              {key === "all" ? stats.total : key === "unread" ? stats.unread : stats.overdue}
            </span>
          </button>
        ))}
      </div>

      {/* ── Separator ── */}
      <span className="h-5 w-px shrink-0 bg-slate-200 dark:bg-slate-700" aria-hidden />

      {/* ── Type ── */}
      <Select
        value={filters.type || "__all__"}
        onValueChange={(v) => set("type", v === "__all__" ? "" : v)}
      >
        <SelectTrigger className={cn(filterPillTriggerClassName, activeType ? filterPillActiveClassName : filterPillIdleClassName)}>
          <SelectValue placeholder="Type" />
        </SelectTrigger>
        <SelectContent className={filterSelectContentClassName}>
          <SelectItem value="__all__" className={filterSelectItemClassName}>All types</SelectItem>
          {TYPE_OPTIONS.map((o) => (
            <SelectItem key={o.value} value={o.value} className={filterSelectItemClassName}>{o.label}</SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* ── Agent ── */}
      <Select
        value={filters.agentId || "__all__"}
        onValueChange={(v) => set("agentId", v === "__all__" ? "" : v)}
      >
        <SelectTrigger className={cn(filterPillTriggerClassName, activeAgent ? filterPillActiveClassName : filterPillIdleClassName)}>
          <SelectValue placeholder="Agent" />
        </SelectTrigger>
        <SelectContent className={filterSelectContentClassName}>
          {agentOptions.map((o) => (
            <SelectItem key={o.value} value={o.value || "__all__"} className={filterSelectItemClassName}>{o.label}</SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* ── Read status ── */}
      <Select
        value={filters.read || "__all__"}
        onValueChange={(v) => set("read", v === "__all__" ? "" : v)}
      >
        <SelectTrigger className={cn(filterPillTriggerClassName, activeRead ? filterPillActiveClassName : filterPillIdleClassName)}>
          <SelectValue placeholder="Status" />
        </SelectTrigger>
        <SelectContent className={filterSelectContentClassName}>
          <SelectItem value="__all__" className={filterSelectItemClassName}>Any status</SelectItem>
          {READ_OPTIONS.map((o) => (
            <SelectItem key={o.value} value={o.value} className={filterSelectItemClassName}>{o.label}</SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* ── Date range ── */}
      <Popover open={dateOpen} onOpenChange={setDateOpen}>
        <PopoverTrigger asChild>
          <button className={cn(
            filterPillTriggerClassName, "inline-flex items-center gap-1",
            activeDate ? filterPillActiveClassName : filterPillIdleClassName,
          )}>
            <Calendar className="h-3 w-3 shrink-0" aria-hidden />
            <span className="min-w-0 truncate text-[12.5px]">{dateLabel(filters.from, filters.to)}</span>
            <ChevronDown className="h-3 w-3 shrink-0 opacity-40" aria-hidden />
          </button>
        </PopoverTrigger>
        <PopoverContent align="start" className="w-[210px] rounded-xl border border-slate-200 bg-white p-2.5 shadow-xl shadow-slate-900/8 dark:border-slate-700 dark:bg-slate-950">
          <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-slate-400">Date range</p>
          <div className="flex flex-col gap-1.5">
            {(["from", "to"] as const).map((k) => (
              <div key={k} className="flex flex-col gap-0.5">
                <label className="text-[10px] font-medium uppercase tracking-wider text-slate-400">{k === "from" ? "From" : "To"}</label>
                <input
                  type="date"
                  value={filters[k]}
                  onChange={(e) => set(k, e.target.value)}
                  className="h-7 w-full rounded-lg border border-slate-200 bg-slate-50 px-2 text-xs font-medium text-slate-900 outline-none transition-colors hover:border-slate-300 focus:border-[#008f68] focus:bg-white focus:ring-2 focus:ring-[#008f68]/20 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                />
              </div>
            ))}
            {activeDate && (
              <button
                onClick={() => { set("from", ""); set("to", ""); setDateOpen(false); }}
                className="mt-0.5 flex items-center justify-center gap-1 rounded-lg border border-slate-200 bg-white py-1 text-[11px] font-medium text-slate-500 hover:bg-slate-50 hover:text-slate-700 dark:border-slate-700 dark:bg-slate-900"
              >
                <X className="h-3 w-3" />Clear dates
              </button>
            )}
          </div>
        </PopoverContent>
      </Popover>

      {/* ── Search — flex-1 fills remaining space ── */}
      <div className="relative min-w-[160px] flex-1">
        <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3 w-3 -translate-y-1/2 text-slate-400" aria-hidden />
        <input
          ref={searchRef}
          type="search"
          placeholder="Search…"
          onChange={(e) => onSearchChange(e.target.value)}
          className="h-[30px] w-full rounded-full border border-slate-200/80 bg-white pl-7 pr-3 text-[12.5px] font-medium text-slate-900 shadow-sm outline-none transition-colors placeholder:text-slate-400 hover:border-slate-300 focus:border-[#008f68]/50 focus:ring-2 focus:ring-[#008f68]/15 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
        />
      </div>

      {/* ── Clear all ── */}
      {hasFilters && (
        <button
          onClick={onClearFilters}
          className="flex h-[30px] shrink-0 items-center gap-1 rounded-full px-2.5 text-[12px] font-medium text-slate-400 transition-colors hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-900/20 dark:hover:text-red-400"
        >
          <X className="h-3 w-3" aria-hidden />
          Clear
        </button>
      )}
    </div>
  );
}
