"use client";

import { AlertCircle, Bell, Check, Clock3, FileText, Radio } from "lucide-react";
import { cn } from "@/lib/utils";
import type {
  NotificationFiltersState,
  NotificationStats,
  NotificationTab,
} from "./notification-types";

interface NotificationsStatsGridProps {
  stats: NotificationStats;
  activeTab: NotificationTab;
  filters: NotificationFiltersState;
  formatDuration: (minutes: number | null) => string;
  onTabChange: (tab: NotificationTab) => void;
  onFilterChange: (key: keyof NotificationFiltersState, value: string) => void;
}

export function NotificationsStatsGrid({
  stats,
  activeTab,
  filters,
  formatDuration,
  onTabChange,
  onFilterChange,
}: NotificationsStatsGridProps) {
  return (
    <div className="mb-3 grid grid-cols-2 gap-2 lg:grid-cols-3 xl:grid-cols-6">
      <StatCard
        label="Total"
        value={stats.total}
        sub={`${stats.broadcast} broadcast`}
        tone="neutral"
        icon={<Bell className="h-4 w-4" aria-hidden="true" />}
        active={activeTab === "all" && !filters.read}
        onClick={() => {
          onTabChange("all");
          onFilterChange("read", "");
        }}
      />
      <StatCard
        label="Unread"
        value={stats.unread}
        sub={`${stats.total ? Math.round((stats.unread / stats.total) * 100) : 0}% of total`}
        tone="danger"
        icon={<AlertCircle className="h-4 w-4 text-red-500" aria-hidden="true" />}
        active={activeTab === "unread"}
        onClick={() => {
          onTabChange("unread");
          onFilterChange("read", "");
        }}
      />
      <StatCard
        label="Overdue"
        value={stats.overdue}
        sub="callbacks + tickets"
        tone="warning"
        icon={<Clock3 className="h-4 w-4 text-amber-500" aria-hidden="true" />}
        active={activeTab === "overdue"}
        onClick={() => {
          onTabChange("overdue");
          onFilterChange("read", "");
        }}
      />
      <StatCard
        label="Read"
        value={stats.read}
        sub={`${stats.total ? Math.round((stats.read / stats.total) * 100) : 0}% read rate`}
        tone="success"
        icon={<Check className="h-4 w-4 text-emerald-500" aria-hidden="true" />}
        active={filters.read === "true"}
        onClick={() => {
          onTabChange("all");
          onFilterChange("read", "true");
        }}
      />
      <StatCard
        label="Resources"
        value={stats.calls + stats.tickets + stats.schedules}
        sub={`${stats.calls} calls / ${stats.tickets} tickets`}
        tone="info"
        icon={<FileText className="h-4 w-4" aria-hidden="true" />}
      />
      <StatCard
        label="Avg read"
        value={formatDuration(stats.avgReadMinutes)}
        sub={`${stats.today} today`}
        tone="brand"
        icon={<Radio className="h-4 w-4" aria-hidden="true" />}
      />
    </div>
  );
}

function StatCard({
  label,
  value,
  sub,
  tone,
  icon,
  active,
  onClick,
}: {
  label: string;
  value: string | number;
  sub?: string;
  tone: "neutral" | "danger" | "warning" | "success" | "info" | "brand";
  icon?: React.ReactNode;
  active?: boolean;
  onClick?: () => void;
}) {
  const toneClass = {
    neutral:
      "border-slate-200/80 bg-white text-slate-700 hover:border-slate-300 dark:border-neutral-800 dark:bg-neutral-950 dark:text-neutral-200",
    danger:
      "border-rose-200 bg-white text-rose-700 hover:border-rose-300 dark:border-rose-500/30 dark:bg-neutral-950 dark:text-rose-300",
    warning:
      "border-amber-200 bg-white text-amber-700 hover:border-amber-300 dark:border-amber-500/30 dark:bg-neutral-950 dark:text-amber-300",
    success:
      "border-emerald-200 bg-white text-emerald-700 hover:border-emerald-300 dark:border-emerald-500/30 dark:bg-neutral-950 dark:text-emerald-300",
    info:
      "border-sky-200 bg-white text-sky-700 hover:border-sky-300 dark:border-sky-500/30 dark:bg-neutral-950 dark:text-sky-300",
    brand:
      "border-[#008f68]/25 bg-white text-[#006b4f] hover:border-[#008f68]/40 dark:border-emerald-500/30 dark:bg-neutral-950 dark:text-emerald-300",
  }[tone];

  const iconClass = {
    neutral: "bg-slate-100 text-slate-500 dark:bg-neutral-900 dark:text-neutral-400",
    danger: "bg-rose-50 text-rose-600 dark:bg-rose-500/10 dark:text-rose-300",
    warning:
      "bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-300",
    success:
      "bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-300",
    info: "bg-sky-50 text-sky-600 dark:bg-sky-500/10 dark:text-sky-300",
    brand: "bg-[#f0faf5] text-[#008f68] dark:bg-emerald-500/10 dark:text-emerald-300",
  }[tone];

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "group flex min-h-[78px] min-w-0 items-start gap-2.5 rounded-xl border px-2.5 py-2 text-left shadow-[0_1px_3px_rgba(0,0,0,0.06)] transition-colors",
        onClick ? "cursor-pointer hover:bg-slate-50/80 dark:hover:bg-neutral-900/70" : "cursor-default",
        toneClass,
        active && "border-[#008f68]/45 bg-[#f0faf5] ring-2 ring-[#008f68]/15 dark:bg-emerald-500/10",
      )}
      disabled={!onClick}
    >
      <span
        className={cn(
          "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ring-1 ring-black/5",
          iconClass,
        )}
      >
        {icon}
      </span>
      <span className="flex min-w-0 flex-1 flex-col">
        <span className="text-[9px] font-semibold uppercase tracking-wide text-slate-400">
          {label}
        </span>
        <span className="mt-0.5 truncate text-xl font-bold leading-tight tabular-nums text-slate-900 dark:text-neutral-100">
          {value}
        </span>
        {sub && (
          <span className="truncate text-[11px] font-medium text-slate-500 dark:text-neutral-400">
            {sub}
          </span>
        )}
      </span>
    </button>
  );
}
