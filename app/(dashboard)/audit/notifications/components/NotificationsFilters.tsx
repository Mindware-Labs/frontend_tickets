"use client";

import { X } from "lucide-react";
import type {
  NotificationFiltersProps,
  NotificationFiltersState,
  NotificationType,
} from "./notification-types";

const TYPE_OPTIONS: Array<{ value: NotificationType; label: string }> = [
  { value: "CALLBACK_OVERDUE", label: "Callback overdue" },
  { value: "TICKET_FOLLOWUP_OVERDUE", label: "Ticket follow-up overdue" },
  { value: "SCHEDULED_CALL_DUE", label: "Scheduled call due" },
];

function FilterField({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="flex min-w-0 flex-col gap-1">
      <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
        {label}
      </span>
      {children}
    </label>
  );
}

export function NotificationsFilters({
  activeTab,
  filters,
  stats,
  hasFilters,
  agentOptions,
  searchRef,
  onTabChange,
  onFilterChange,
  onSearchChange,
  onClearFilters,
}: NotificationFiltersProps) {
  const setFilter = (key: keyof NotificationFiltersState, value: string) =>
    onFilterChange(key, value);

  return (
    <div className="section-card mb-3">
      <div className="flex flex-col gap-2 border-b border-slate-100 px-3 py-2 dark:border-slate-800 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 gap-0.5 overflow-x-auto rounded-lg border border-slate-200/80 bg-slate-100 p-0.5">
          {([
            ["all", "All", stats.total],
            ["unread", "Unread", stats.unread],
            ["overdue", "Overdue", stats.overdue],
          ] as const).map(([key, label, count]) => (
            <button
              key={key}
              className={`tab ${activeTab === key ? "active" : ""}`}
              onClick={() => onTabChange(key)}
            >
              {label}
              <span className="ml-1 rounded-full bg-slate-200 px-1.5 py-px text-[9px] font-bold text-slate-500">
                {count}
              </span>
            </button>
          ))}
        </div>
        {hasFilters && (
          <button
            className="clear-btn w-full justify-center sm:w-auto"
            onClick={onClearFilters}
          >
            <X className="h-3 w-3" aria-hidden="true" />
            Clear
          </button>
        )}
      </div>

      <div className="grid gap-2 border-b border-slate-100 px-3 py-2 dark:border-slate-800 sm:grid-cols-2 lg:grid-cols-[1.4fr_1.15fr_1fr_0.75fr_0.9fr_0.9fr]">
        <FilterField label="Search">
          <div className="relative flex min-w-0 items-center">
            <input
              ref={searchRef}
              className="fi h-9 pl-8 pr-2 text-xs"
              placeholder="Message, ID, agent..."
              onChange={(event) => onSearchChange(event.target.value)}
            />
          </div>
        </FilterField>
        <FilterField label="Type">
          <select
            className="fi h-9 text-xs"
            value={filters.type}
            onChange={(event) => setFilter("type", event.target.value)}
          >
            <option value="">All types</option>
            {TYPE_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </FilterField>
        <FilterField label="Agent">
          <select
            className="fi h-9 text-xs"
            value={filters.agentId}
            onChange={(event) => setFilter("agentId", event.target.value)}
          >
            {agentOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </FilterField>
        <FilterField label="Status">
          <select
            className="fi h-9 text-xs"
            value={filters.read}
            onChange={(event) => setFilter("read", event.target.value)}
          >
            <option value="">Any</option>
            <option value="false">Unread</option>
            <option value="true">Read</option>
          </select>
        </FilterField>
        <FilterField label="From">
          <input
            className="fi h-9 text-xs"
            type="date"
            value={filters.from}
            onChange={(event) => setFilter("from", event.target.value)}
          />
        </FilterField>
        <FilterField label="To">
          <input
            className="fi h-9 text-xs"
            type="date"
            value={filters.to}
            onChange={(event) => setFilter("to", event.target.value)}
          />
        </FilterField>
      </div>
    </div>
  );
}
