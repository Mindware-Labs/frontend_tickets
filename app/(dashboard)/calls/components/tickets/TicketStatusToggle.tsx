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

/** Statuses available in create/edit toggles (CLOSED excluded). */
export const SELECTABLE_TICKET_STATUSES = [
  SupportTicketStatus.ACTIVE,
  SupportTicketStatus.PENDING_FOLLOWUP,
  SupportTicketStatus.OVERDUE,
  SupportTicketStatus.RESOLVED,
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
}: {
  value: string;
  onChange: (status: string) => void;
  className?: string;
  includeAll?: boolean;
  compact?: boolean;
  /** Display only — no status changes from this control */
  readOnly?: boolean;
}) {
  const activeKey =
    includeAll && (!value || value === "all")
      ? "all"
      : normalizeStatusKey(value);

  const keys = includeAll
    ? (["all", ...SELECTABLE_TICKET_STATUSES] as const)
    : SELECTABLE_TICKET_STATUSES;

  return (
    <div
      className={cn(
        "grid gap-1.5",
        compact
          ? "grid-cols-2 sm:grid-cols-4"
          : includeAll
            ? "grid-cols-3 sm:grid-cols-5"
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
                : "bg-white border-slate-200 text-slate-500",
              !readOnly &&
                !isActive &&
                "hover:border-slate-300 hover:bg-slate-50",
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
