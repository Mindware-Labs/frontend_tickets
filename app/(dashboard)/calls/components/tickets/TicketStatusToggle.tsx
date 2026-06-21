"use client";

import { cn } from "@/lib/utils";
import { SupportTicketStatus } from "../../types";

export const TICKET_STATUS_COLORS: Record<
  string,
  { text: string; bg: string; label: string }
> = {
  ACTIVE: { text: "#008f68", bg: "#e6f5f0", label: "Active" },
  PENDING_FOLLOWUP: {
    text: "#c47a00",
    bg: "#fef3d6",
    label: "Follow-up",
  },
  OVERDUE: { text: "#c0392b", bg: "#fde8e6", label: "Overdue" },
  RESOLVED: { text: "#006d50", bg: "#e6f5f0", label: "Resolved" },
};

/** Statuses available in edit / log-update toggles (CLOSED excluded). */
export const SELECTABLE_TICKET_STATUSES = [
  SupportTicketStatus.ACTIVE,
  SupportTicketStatus.PENDING_FOLLOWUP,
  SupportTicketStatus.OVERDUE,
  SupportTicketStatus.RESOLVED,
] as const;

/** Statuses for manual ticket create (no RESOLVED or CLOSED). */
export const CREATE_TICKET_STATUSES = [
  SupportTicketStatus.ACTIVE,
  SupportTicketStatus.PENDING_FOLLOWUP,
  SupportTicketStatus.OVERDUE,
] as const;

const ALL_OPTION = {
  text: "#475569",
  bg: "#f8fafc",
  label: "All",
} as const;

function normalizeStatusKey(status?: string | null) {
  const key = (status || "").toString().toUpperCase().replace(/\s+/g, "_");
  if (key === "OPEN" || key === "IN_PROGRESS") return SupportTicketStatus.ACTIVE;
  return key;
}

export function TicketStatusToggle({
  value,
  onChange,
  className,
  includeAll = false,
  compact = false,
  readOnly = false,
  statuses = SELECTABLE_TICKET_STATUSES,
}: {
  value: string;
  onChange: (status: string) => void;
  className?: string;
  includeAll?: boolean;
  compact?: boolean;
  /** Display only — no status changes from this control */
  readOnly?: boolean;
  /** Override which statuses appear (e.g. create form omits Resolved). */
  statuses?: readonly string[];
}) {
  const activeKey =
    includeAll && (!value || value === "all")
      ? "all"
      : normalizeStatusKey(value);

  const keys = includeAll
    ? (["all", ...statuses] as const)
    : statuses;

  return (
    <div
      className={cn(
        "grid gap-1.5",
        compact
          ? statuses.length <= 3
            ? "grid-cols-3"
            : "grid-cols-2 sm:grid-cols-4"
          : includeAll
            ? "grid-cols-3 sm:grid-cols-5"
            : statuses.length <= 3
              ? "grid-cols-3"
              : "grid-cols-2 sm:grid-cols-4",
        className,
      )}
    >
      {keys.map((key) => {
        const cfg =
          key === "all" ? ALL_OPTION : TICKET_STATUS_COLORS[key] ?? ALL_OPTION;
        const isActive = activeKey === key;
        return (
          <button
            key={key}
            type="button"
            disabled={readOnly}
            onClick={readOnly ? undefined : () => onChange(key)}
            className={cn(
              "font-semibold rounded-lg border transition-all leading-tight px-1",
              compact ? "h-7 text-[9.5px]" : "h-8 text-[10px]",
              readOnly && !isActive && "opacity-50 cursor-default",
              readOnly && isActive && "cursor-default",
              isActive
                ? "shadow-sm"
                : "bg-white dark:bg-neutral-900 border-slate-200 dark:border-neutral-700 text-slate-500 dark:text-neutral-400",
              !readOnly &&
                !isActive &&
                "hover:border-slate-300 dark:hover:border-neutral-600 hover:bg-slate-50 dark:hover:bg-neutral-800",
            )}
            style={
              isActive
                ? {
                    background: cfg.bg,
                    color: cfg.text,
                    borderColor: `${cfg.text}40`,
                  }
                : undefined
            }
          >
            {cfg.label}
          </button>
        );
      })}
    </div>
  );
}
