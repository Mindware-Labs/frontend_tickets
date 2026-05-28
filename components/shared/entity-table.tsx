"use client";

import * as React from "react";

import { cn } from "@/lib/utils";

/**
 * Shared tokens + primitives for entity list tables (Customers, Yards,
 * Landlords, Phone Lines, …). Single source of truth aligned with
 * DESIGN_SYSTEM.md §9 (Tablas):
 *   - Header: 10px uppercase tracking-wider, muted slate, sticky.
 *   - Cells: text-xs (12px), no arbitrary font sizes.
 *   - Rows: subtle zebra + teal hover (#f0faf5).
 *
 * Each table renders a real <table> on md+ and a stacked card list on mobile
 * so the data stays readable on small screens instead of forcing a tiny
 * horizontal scroll.
 */

/** Sticky header wrapper (applied to <TableHeader>). */
export const entityTableHeaderClass =
  "sticky top-0 z-10 border-b border-slate-200/80 bg-slate-50/95 backdrop-blur supports-[backdrop-filter]:bg-slate-50/80 dark:border-slate-800 dark:bg-slate-900/85";

/** Header row — no hover, no bottom border (the header wrapper owns it). */
export const entityTableHeaderRowClass = "border-none hover:bg-transparent";

/** Header cell (applied to <TableHead>). */
export const entityTableHeadClass =
  "h-9 px-3 text-left align-middle text-[10px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 whitespace-nowrap";

/** Body cell (applied to <TableCell>). Keep cells at text-xs per design system. */
export const entityTableCellClass =
  "px-3 py-2.5 align-middle text-xs text-slate-600 dark:text-slate-300";

/** Fixed-width actions column (icon buttons per row). */
export const entityTableActionsHeadClass = cn(
  entityTableHeadClass,
  "w-[112px] pr-4 text-right",
);
export const entityTableActionsCellClass = cn(
  entityTableCellClass,
  "pr-4 text-right",
);

/** Zebra + teal-hover body row. Pass the row index and whether it is clickable. */
export function entityTableRowClass(index: number, clickable?: boolean) {
  return cn(
    "group border-b border-slate-100 transition-colors duration-150 hover:bg-[#f0faf5]/70 dark:border-slate-800 dark:hover:bg-muted/50",
    index % 2 === 1
      ? "bg-slate-50/50 dark:bg-muted/20"
      : "bg-white dark:bg-card",
    clickable && "cursor-pointer",
  );
}

/** Inline muted em dash used for empty values. */
export const EmptyCell = (
  <span className="text-xs text-slate-400">—</span>
);

/* ---------------------------------------------------------------------------
 * Mobile card primitives (rendered on < md, in place of the table)
 * ------------------------------------------------------------------------- */

export function EntityMobileList({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return <div className={cn("flex flex-col gap-2", className)}>{children}</div>;
}

export function EntityMobileCard({
  onClick,
  className,
  children,
}: {
  onClick?: () => void;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div
      onClick={onClick}
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={
        onClick
          ? (event) => {
              if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                onClick();
              }
            }
          : undefined
      }
      className={cn(
        "rounded-xl border border-slate-200/80 bg-white p-3 shadow-[0_1px_2px_rgba(0,0,0,0.04)] transition-colors dark:border-slate-800 dark:bg-card",
        onClick &&
          "cursor-pointer hover:border-[#008f68]/40 hover:bg-[#f0faf5]/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#008f68]/25 active:bg-[#f0faf5]/70 dark:hover:bg-muted/40",
        className,
      )}
    >
      {children}
    </div>
  );
}

/** Top section of a card: identity (mark + title/subtitle) and row actions. */
export function EntityMobileCardHeader({
  mark,
  title,
  subtitle,
  actions,
}: {
  mark?: React.ReactNode;
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  actions?: React.ReactNode;
}) {
  return (
    <div className="flex items-start justify-between gap-2">
      <div className="flex min-w-0 items-center gap-2.5">
        {mark}
        <div className="min-w-0">
          <div className="truncate text-[13px] font-bold leading-tight text-foreground">
            {title}
          </div>
          {subtitle ? (
            <div className="mt-0.5 truncate text-[11px] text-muted-foreground">
              {subtitle}
            </div>
          ) : null}
        </div>
      </div>
      {actions ? (
        <div
          className="flex shrink-0 items-center gap-0.5"
          onClick={(event) => event.stopPropagation()}
        >
          {actions}
        </div>
      ) : null}
    </div>
  );
}

/** A labelled field inside a card body. Renders label above value. */
export function EntityMobileField({
  label,
  children,
  className,
}: {
  label: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("min-w-0", className)}>
      <div className="mb-0.5 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
        {label}
      </div>
      <div className="min-w-0 text-xs text-slate-600 dark:text-slate-300">
        {children}
      </div>
    </div>
  );
}

/** Two-column grid of fields below the card header. */
export function EntityMobileCardBody({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className={cn(
        "mt-3 grid grid-cols-2 gap-x-3 gap-y-2.5 border-t border-slate-100 pt-3 dark:border-slate-800",
        className,
      )}
    >
      {children}
    </div>
  );
}
