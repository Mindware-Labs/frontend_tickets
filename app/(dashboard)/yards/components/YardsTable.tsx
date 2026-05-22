"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { MapPin, Pencil, Phone, Trash2 } from "lucide-react";
import { TableLoadingRow } from "@/components/shared/entity-loading-state";
import { cn } from "@/lib/utils";
import { Yard } from "../types";
import { YardMark } from "./YardMark";

interface YardsTableProps {
  loading: boolean;
  yards: Yard[];
  totalFiltered: number;
  onRowClick?: (yard: Yard) => void;
  onEdit?: (yard: Yard) => void;
  onDelete?: (yard: Yard) => void;
  canManage?: boolean;
  currentPage?: number;
  onPageChange?: (page: number) => void;
  itemsPerPage?: number;
  totalPages?: number;
}

function TypePill({ type }: { type: Yard["yardType"] }) {
  const isSaas = type === "SAAS";
  return (
    <span
      className={cn(
        "inline-flex items-center px-2.5 py-[3px] rounded-full text-[11.5px] font-semibold border",
        isSaas
          ? "bg-blue-50 text-blue-700 border-blue-100 dark:bg-blue-500/10 dark:text-blue-400 dark:border-blue-500/30"
          : "bg-violet-50 text-violet-700 border-violet-100 dark:bg-violet-500/10 dark:text-violet-400 dark:border-violet-500/30",
      )}
    >
      {isSaas ? "SaaS" : "Full Service"}
    </span>
  );
}

function StatusPill({ active }: { active: boolean }) {
  return active ? (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-[3px] rounded-full text-[11.5px] font-semibold border bg-[#dcfce7] text-[#15803d] border-[#bbf7d0] dark:bg-emerald-500/15 dark:text-emerald-400 dark:border-emerald-500/30">
      <span className="w-[6px] h-[6px] rounded-full bg-[#22c55e] shrink-0" />
      Active
    </span>
  ) : (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-[3px] rounded-full text-[11.5px] font-semibold border bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-500/15 dark:text-slate-400 dark:border-slate-500/30">
      <span className="w-[6px] h-[6px] rounded-full bg-slate-400 shrink-0" />
      Inactive
    </span>
  );
}

export function YardsTable({
  loading,
  yards,
  totalFiltered,
  onRowClick,
  onEdit,
  onDelete,
  canManage = true,
  currentPage = 1,
  onPageChange,
  itemsPerPage = 10,
  totalPages = 1,
}: YardsTableProps) {
  return (
    <div className="entity-table-root">
      <div className="entity-table-frame">
        <div className="entity-table-scroll">
          <Table className="relative w-full table-fixed">
            <TableHeader className="bg-slate-50 sticky top-0 z-10 border-y border-slate-200 dark:bg-muted/40">
              <TableRow className="border-none hover:bg-transparent">
                <TableHead className="w-[22%] max-w-[240px] pl-4 font-bold text-[11px] tracking-wider uppercase text-slate-500">
                  Yard
                </TableHead>
                <TableHead className="w-[14%] max-w-[160px] font-bold text-[11px] tracking-wider uppercase text-slate-500">
                  Common Name
                </TableHead>
                <TableHead className="w-[22%] max-w-[240px] font-bold text-[11px] tracking-wider uppercase text-slate-500">
                  Address
                </TableHead>
                <TableHead className="min-w-[130px] font-bold text-[11px] tracking-wider uppercase text-slate-500">
                  Contact
                </TableHead>
                <TableHead className="w-[110px] font-bold text-[11px] tracking-wider uppercase text-slate-500">
                  Type
                </TableHead>
                <TableHead className="w-[100px] font-bold text-[11px] tracking-wider uppercase text-slate-500">
                  Status
                </TableHead>
                <TableHead className="w-[88px] font-bold text-[11px] tracking-wider uppercase text-slate-500 text-center">
                  Activities
                </TableHead>
                <TableHead className="w-[120px] font-bold text-[11px] tracking-wider uppercase text-slate-500 text-right pr-4">
                  Actions
                </TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {loading ? (
                <TableLoadingRow colSpan={8} kind="yards" />
              ) : totalFiltered === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={8}
                    className="h-24 text-center text-sm text-muted-foreground"
                  >
                    No yards found.
                  </TableCell>
                </TableRow>
              ) : (
                yards.map((yard, i) => (
                  <TableRow
                    key={yard.id}
                    onClick={() => onRowClick?.(yard)}
                    className={cn(
                      "group hover:bg-[#f0faf5]/60 dark:hover:bg-muted/50 border-b border-border/70 transition-all duration-150",
                      i % 2 === 1 ? "bg-slate-50/60 dark:bg-muted/20" : "bg-white dark:bg-card",
                      onRowClick && "cursor-pointer",
                    )}
                  >
                    <TableCell className="max-w-0 overflow-hidden pl-4 py-3">
                      <div className="flex min-w-0 items-center gap-2.5">
                        <YardMark className="h-8 w-8" />
                        <div className="min-w-0 flex-1">
                          <p
                            className="truncate font-bold text-[14px] leading-tight text-foreground"
                            title={yard.name}
                          >
                            {yard.name}
                          </p>
                          {yard.landlord?.name && (
                            <p
                              className="mt-0.5 truncate text-[11.5px] text-muted-foreground"
                              title={yard.landlord.name}
                            >
                              {yard.landlord.name}
                            </p>
                          )}
                        </div>
                      </div>
                    </TableCell>

                    <TableCell className="max-w-0 overflow-hidden py-3">
                      <p
                        className="truncate text-[13.5px] text-slate-600 dark:text-slate-300"
                        title={yard.commonName}
                      >
                        {yard.commonName}
                      </p>
                    </TableCell>

                    <TableCell className="max-w-0 overflow-hidden py-3">
                      <div className="flex min-w-0 items-center gap-1.5">
                        <MapPin className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                        <span
                          className="min-w-0 flex-1 truncate text-[13px] text-slate-600"
                          title={yard.propertyAddress}
                        >
                          {yard.propertyAddress}
                        </span>
                      </div>
                    </TableCell>

                    <TableCell className="py-3">
                      <div className="flex items-center gap-1.5">
                        <Phone className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                        <span className="font-mono text-[13px] text-slate-600 font-medium">
                          {yard.contactInfo}
                        </span>
                      </div>
                    </TableCell>

                    <TableCell className="py-3">
                      <TypePill type={yard.yardType} />
                    </TableCell>

                    <TableCell className="py-3">
                      <StatusPill active={yard.isActive} />
                    </TableCell>

                    <TableCell className="py-3 text-center">
                      <span className="inline-flex items-center justify-center min-w-[28px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 text-[12px] font-semibold border border-slate-200">
                        {yard.ticketCount ?? yard.totalTickets ?? 0}
                      </span>
                    </TableCell>

                    <TableCell className="py-3 text-right pr-4" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-1">
                        {canManage && onEdit && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-muted-foreground hover:bg-amber-50 hover:text-amber-600"
                            title="Edit yard"
                            aria-label="Edit yard"
                            onClick={() => onEdit(yard)}
                          >
                            <Pencil className="h-4 w-4 pointer-events-none" />
                          </Button>
                        )}
                        {canManage && onDelete && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-muted-foreground hover:bg-red-50 hover:text-red-600"
                            title="Delete yard"
                            aria-label="Delete yard"
                            onClick={() => onDelete(yard)}
                          >
                            <Trash2 className="h-4 w-4 pointer-events-none" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {totalFiltered > 0 && onPageChange && (
        <div className="flex items-center justify-between pt-2 pb-2 px-1">
          <Button
            variant="outline"
            className="h-[36px] px-3.5 rounded-[10px] text-[13px] font-medium text-muted-foreground shadow-sm hover:text-foreground border-border"
            onClick={(e) => {
              e.stopPropagation();
              onPageChange(Math.max(currentPage - 1, 1));
            }}
            disabled={currentPage === 1}
          >
            <svg
              className="mr-2 h-3.5 w-3.5"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M19 12H5M12 19l-7-7 7-7" />
            </svg>
            Previous
          </Button>

          <div className="hidden md:flex items-center justify-center gap-1.5">
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              let pageNum = i + 1;
              if (totalPages > 5 && currentPage > 3) {
                pageNum = currentPage - 2 + i;
                if (pageNum > totalPages) pageNum = totalPages - 4 + i;
              }
              if (pageNum <= 0 || pageNum > totalPages) return null;
              const active = pageNum === currentPage;
              return (
                <button
                  key={pageNum}
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onPageChange(pageNum);
                  }}
                  className={cn(
                    "flex h-[36px] w-[36px] items-center justify-center rounded-[10px] text-[13px] transition-colors",
                    active
                      ? "bg-[#e2fae9] text-[#008f68] border border-[#a6f0c3] font-semibold"
                      : "text-muted-foreground font-medium hover:bg-muted/50 border border-transparent",
                  )}
                >
                  {pageNum}
                </button>
              );
            })}
          </div>

          <Button
            variant="outline"
            className="h-[36px] px-3.5 rounded-[10px] text-[13px] font-medium text-muted-foreground shadow-sm hover:text-foreground border-border"
            onClick={(e) => {
              e.stopPropagation();
              onPageChange(Math.min(currentPage + 1, totalPages));
            }}
            disabled={currentPage >= totalPages}
          >
            Next
            <svg
              className="ml-2 h-3.5 w-3.5"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M5 12h14M12 5l7 7-7 7" />
            </svg>
          </Button>
        </div>
      )}
    </div>
  );
}
