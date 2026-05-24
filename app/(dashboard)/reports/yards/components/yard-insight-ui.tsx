"use client";

import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import { ChevronDown } from "lucide-react";

import { useAircall } from "@/components/providers/AircallProvider";
import { Button } from "@/components/ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { cn } from "@/lib/utils";
import {
  getRecordPriorityClass,
  getRecordStatusClass,
} from "@/components/records/record-table-ui";

export function formatInsightDateTime(value?: string | null) {
  if (!value) return "—";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "—";
  return parsed.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function formatInsightLabel(value?: string | null) {
  if (!value) return "—";
  return value.replace(/_/g, " ").toLowerCase();
}

export function getInsightSheetMaxWidthClass(cardCount: number) {
  if (cardCount <= 1) return "sm:max-w-[min(92vw,520px)]";
  if (cardCount === 2) return "sm:max-w-[min(92vw,900px)]";
  return "sm:max-w-[min(92vw,1280px)]";
}

export function getInsightCardsGridClass(cardCount: number) {
  const cols =
    cardCount <= 1
      ? "grid-cols-1"
      : cardCount === 2
        ? "grid-cols-1 sm:grid-cols-2"
        : "grid-cols-1 sm:grid-cols-2 xl:grid-cols-3";
  return cn(cols, "items-start");
}

export function InsightSheetAccent() {
  return (
    <div
      className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#008f68]/45 to-transparent"
      aria-hidden
    />
  );
}

export function InsightSummaryBadge({
  icon: Icon,
  label,
  tone = "neutral",
}: {
  icon: LucideIcon;
  label: string;
  tone?: "neutral" | "brand" | "danger" | "warning";
}) {
  const toneClass =
    tone === "brand"
      ? "border-emerald-200/80 bg-[#f0faf5] text-[#008f68] dark:border-emerald-800/60 dark:bg-emerald-900/20 dark:text-emerald-400"
      : tone === "danger"
        ? "border-rose-200/80 bg-rose-50 text-rose-700 dark:border-rose-800/60 dark:bg-rose-900/20 dark:text-rose-300"
        : tone === "warning"
          ? "border-amber-200/80 bg-amber-50 text-amber-800 dark:border-amber-800/60 dark:bg-amber-900/20 dark:text-amber-300"
          : "border-slate-200/80 bg-slate-50 text-slate-700 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200";

  return (
    <div
      className={cn(
        "flex h-7 items-center gap-1.5 rounded-lg border px-2.5 text-[11px] font-semibold",
        toneClass,
      )}
    >
      <Icon className="size-3.5 shrink-0 opacity-80" aria-hidden />
      {label}
    </div>
  );
}

export function InsightKpiStrip({
  label,
  value,
  tone = "brand",
}: {
  label: string;
  value: ReactNode;
  tone?: "brand" | "danger" | "sky";
}) {
  const toneClass =
    tone === "danger"
      ? "border-rose-100 bg-rose-50/80 dark:border-rose-900/40 dark:bg-rose-950/25"
      : tone === "sky"
        ? "border-sky-100 bg-sky-50/80 dark:border-sky-900/40 dark:bg-sky-950/25"
        : "border-emerald-100 bg-[#f0faf5] dark:border-emerald-900/30 dark:bg-emerald-950/20";

  const valueClass =
    tone === "danger"
      ? "text-rose-700 dark:text-rose-300"
      : tone === "sky"
        ? "text-sky-700 dark:text-sky-300"
        : "text-[#008f68] dark:text-emerald-300";

  return (
    <div
      className={cn(
        "flex items-center justify-between rounded-lg border px-2.5 py-2",
        toneClass,
      )}
    >
      <p className="text-[9px] font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
        {label}
      </p>
      <p
        className={cn(
          "text-lg font-bold leading-none tabular-nums",
          valueClass,
        )}
      >
        {value}
      </p>
    </div>
  );
}

export function InsightMetaRow({
  label,
  value,
  mono = false,
}: {
  label: string;
  value: ReactNode;
  mono?: boolean;
}) {
  return (
    <div className="flex items-start justify-between gap-2 text-[11px]">
      <span className="shrink-0 text-slate-500">{label}</span>
      <span
        className={cn(
          "min-w-0 text-right font-medium text-slate-800 dark:text-slate-100",
          mono && "font-mono text-[10px]",
        )}
      >
        {value}
      </span>
    </div>
  );
}

export function InsightStatusPill({ status }: { status?: string | null }) {
  const pulse =
    (status || "").toUpperCase() === "ACTIVE" ||
    (status || "").toUpperCase() === "PENDING_FOLLOWUP" ||
    (status || "").toUpperCase() === "OPEN";

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-semibold capitalize",
        getRecordStatusClass(status),
      )}
    >
      {pulse ? (
        <span className="relative flex size-1.5">
          <span className="absolute inline-flex size-full animate-ping rounded-full bg-current opacity-60" />
          <span className="relative inline-flex size-1.5 rounded-full bg-current" />
        </span>
      ) : null}
      {formatInsightLabel(status)}
    </span>
  );
}

export function InsightPriorityPill({
  priority,
}: {
  priority?: string | null;
}) {
  const normalized = (priority || "").toUpperCase();
  return (
    <span
      className={cn(
        "inline-flex rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase",
        getRecordPriorityClass(priority),
        normalized === "EMERGENCY" && "ring-1 ring-rose-300/80",
      )}
    >
      {priority || "—"}
    </span>
  );
}

export function InsightRecordPanel({
  title,
  badge,
  children,
  className,
}: {
  title: string;
  badge?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "rounded-lg border border-slate-200/80 bg-slate-50/50 dark:border-slate-800 dark:bg-slate-900/40",
        className,
      )}
    >
      <div className="flex items-center justify-between gap-2 border-b border-slate-200/70 px-2.5 py-1.5 dark:border-slate-800">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">
          {title}
        </p>
        {badge}
      </div>
      <div className="space-y-2 p-2.5">{children}</div>
    </div>
  );
}

export function InsightIssueBlock({
  text,
  emptyLabel = "No notes on record",
}: {
  text?: string | null;
  emptyLabel?: string;
}) {
  const trimmed = text?.trim();
  if (!trimmed) {
    return (
      <p className="rounded-md border border-dashed border-slate-200/80 bg-white/60 px-2 py-2 text-[11px] italic text-slate-400 dark:border-slate-700 dark:bg-slate-950/50">
        {emptyLabel}
      </p>
    );
  }

  return (
    <p className="max-h-28 overflow-y-auto rounded-md border border-slate-200/80 bg-white px-2 py-1.5 text-[11px] leading-relaxed whitespace-pre-wrap text-slate-700 scrollbar-app dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200">
      {trimmed}
    </p>
  );
}

export function InsightEmptyState({
  icon: Icon,
  title,
  description,
}: {
  icon: LucideIcon;
  title: string;
  description: string;
}) {
  return (
    <div className="mx-auto flex w-full max-w-md flex-col items-center justify-center py-16 text-center">
      <div className="mb-4 rounded-xl bg-white p-4 ring-1 ring-slate-200/80 dark:bg-slate-950 dark:ring-slate-800">
        <Icon className="size-10 text-slate-400" aria-hidden />
      </div>
      <h3 className="text-[15px] font-semibold text-slate-900 dark:text-slate-100">
        {title}
      </h3>
      <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
        {description}
      </p>
    </div>
  );
}

export function InsightExpandableDetails({
  children,
  count,
  className,
  open: openProp,
  defaultOpen = false,
  onOpenChange,
}: {
  children: ReactNode;
  count?: number;
  className?: string;
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
}) {
  const [uncontrolledOpen, setUncontrolledOpen] = useState(defaultOpen);
  const open = openProp ?? uncontrolledOpen;

  const handleOpenChange = (next: boolean) => {
    if (openProp === undefined) {
      setUncontrolledOpen(next);
    }
    onOpenChange?.(next);
  };
  const countLabel =
    count !== undefined && count > 0
      ? ` (${count})`
      : count === 0
        ? ""
        : "";

  return (
    <Collapsible
      open={open}
      onOpenChange={handleOpenChange}
      className={cn(className)}
    >
      <CollapsibleTrigger asChild>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="h-8 w-full rounded-lg border-slate-200/80 bg-white text-[11px] font-semibold text-[#008f68] shadow-none hover:border-[#008f68]/30 hover:bg-[#f0faf5] dark:border-slate-700 dark:bg-slate-950 dark:text-emerald-400 dark:hover:bg-emerald-950/30"
          aria-expanded={open}
        >
          {open ? "Hide details" : "View details"}
          {countLabel}
          <ChevronDown
            className={cn(
              "ml-auto size-3.5 shrink-0 opacity-70 transition-transform duration-200",
              open && "rotate-180",
            )}
            aria-hidden
          />
        </Button>
      </CollapsibleTrigger>
      <CollapsibleContent className="mt-2 space-y-2">{children}</CollapsibleContent>
    </Collapsible>
  );
}

export const insightCardClass =
  "flex w-full flex-col self-start overflow-hidden rounded-xl border border-slate-200/80 bg-white shadow-[0_1px_3px_rgba(0,0,0,0.06)] transition-[box-shadow] duration-200 dark:border-slate-800 dark:bg-slate-950";

export const insightCardExpandedClass =
  "shadow-[0_4px_14px_rgba(0,143,104,0.12)] ring-1 ring-[#008f68]/20 dark:shadow-[0_4px_14px_rgba(0,0,0,0.35)]";

/** Reserve space for the sheet close control and hide the Aircall FAB while open. */
export const insightSheetHeaderClass =
  "space-y-0 px-4 py-3 pr-12 text-left sm:px-5 sm:pr-14";

export function useInsightSheetChrome(open: boolean) {
  const { setSheetOpen, closeDock } = useAircall();

  useEffect(() => {
    setSheetOpen(open);
    if (open) closeDock();
    return () => setSheetOpen(false);
  }, [open, setSheetOpen, closeDock]);
}
