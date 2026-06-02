"use client";

import type { LucideIcon } from "lucide-react";
import {
  BarChart3,
  Bell,
  Building2,
  FileText,
  Landmark,
  Megaphone,
  MessagesSquare,
  Phone,
  Ticket,
  UserCog,
  Users,
} from "lucide-react";

import { TableCell, TableRow } from "@/components/ui/table";
import { cn } from "@/lib/utils";

export type EntityLoadingKind =
  | "calls"
  | "tickets"
  | "manual-records"
  | "yards"
  | "customers"
  | "landlords"
  | "phone-lines"
  | "campaigns"
  | "users"
  | "dashboard"
  | "sms"
  | "notifications";

const ENTITY_META: Record<
  EntityLoadingKind,
  { label: string; icon: LucideIcon }
> = {
  calls: { label: "Loading calls", icon: Phone },
  tickets: { label: "Loading tickets", icon: Ticket },
  "manual-records": { label: "Loading records", icon: FileText },
  yards: { label: "Loading yards", icon: Building2 },
  customers: { label: "Loading customers", icon: Users },
  landlords: { label: "Loading landlords", icon: Landmark },
  "phone-lines": { label: "Loading phone lines", icon: Phone },
  campaigns: { label: "Loading campaigns", icon: Megaphone },
  users: { label: "Loading team members", icon: UserCog },
  dashboard: { label: "Loading dashboard", icon: BarChart3 },
  sms: { label: "Loading conversations", icon: MessagesSquare },
  notifications: { label: "Loading notifications", icon: Bell },
};

const SPINNER_SIZE = {
  sm: "h-9 w-9",
  md: "h-11 w-11",
  lg: "h-14 w-14",
} as const;

const ICON_SIZE = {
  sm: "h-3.5 w-3.5",
  md: "h-4 w-4",
  lg: "h-5 w-5",
} as const;

export type EntityLoadingSpinnerProps = {
  kind: EntityLoadingKind;
  size?: keyof typeof SPINNER_SIZE;
  className?: string;
  label?: string;
};

export function EntityLoadingSpinner({
  kind,
  size = "md",
  className,
  label,
}: EntityLoadingSpinnerProps) {
  const meta = ENTITY_META[kind];
  const Icon = meta.icon;
  const displayLabel = label ?? meta.label;

  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-3 text-center",
        className,
      )}
      role="status"
      aria-live="polite"
      aria-busy="true"
      aria-label={displayLabel}
    >
      <div className={cn("relative shrink-0", SPINNER_SIZE[size])}>
        <div
          className="absolute inset-0 rounded-full border-2 border-slate-200/90 dark:border-slate-700/80 entity-loading-ring-outer"
          aria-hidden
        />
        <div
          className="absolute inset-0 rounded-full border-2 border-transparent border-t-[#008f68] border-r-[#008f68]/35 entity-loading-ring-inner"
          aria-hidden
        />
        <div
          className="absolute inset-[22%] rounded-full bg-[#e2fae9]/80 dark:bg-[#008f68]/15 entity-loading-ring-pulse"
          aria-hidden
        />
        <div className="absolute inset-0 flex items-center justify-center">
          <Icon
            className={cn(ICON_SIZE[size], "text-[#008f68] dark:text-[#34d399]")}
            strokeWidth={2}
            aria-hidden
          />
        </div>
      </div>

      <div className="space-y-1">
        <p className="text-[13px] font-semibold tracking-tight text-slate-700 dark:text-slate-200">
          {displayLabel}
          <span className="entity-loading-ellipsis" aria-hidden>
            …
          </span>
        </p>
        <p className="text-[11px] text-slate-500 dark:text-slate-400">
          Please wait a moment
        </p>
      </div>
    </div>
  );
}

export type TableLoadingRowProps = {
  colSpan: number;
  kind: EntityLoadingKind;
  minHeight?: string;
  compact?: boolean;
};

export function TableLoadingRow({
  colSpan,
  kind,
  minHeight = "min-h-[11rem]",
  compact = false,
}: TableLoadingRowProps) {
  return (
    <TableRow className="border-0 hover:bg-transparent">
      <TableCell colSpan={colSpan} className={cn("p-0", minHeight)}>
        <div
          className={cn(
            "flex h-full w-full items-center justify-center",
            compact ? "py-8" : "py-10",
            "bg-gradient-to-b from-[#f0faf5]/50 via-white to-white",
            "dark:from-[#008f68]/5 dark:via-card dark:to-card",
          )}
        >
          <EntityLoadingSpinner
            kind={kind}
            size={compact ? "sm" : "md"}
          />
        </div>
      </TableCell>
    </TableRow>
  );
}

export type EntityGridLoadingProps = {
  kind: EntityLoadingKind;
  className?: string;
};

export function EntityGridLoading({ kind, className }: EntityGridLoadingProps) {
  return (
    <div
      className={cn(
        "flex min-h-[280px] flex-1 items-center justify-center rounded-2xl border border-border/50",
        "bg-gradient-to-b from-[#f0faf5]/40 to-white dark:from-[#008f68]/5 dark:to-card",
        className,
      )}
      role="status"
      aria-busy="true"
    >
      <EntityLoadingSpinner kind={kind} size="lg" />
    </div>
  );
}
