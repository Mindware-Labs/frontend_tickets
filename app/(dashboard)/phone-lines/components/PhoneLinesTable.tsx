"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { PageNumberButtons } from "@/components/common/page-number-buttons";
import { Button } from "@/components/ui/button";
import { Pencil, Trash2 } from "lucide-react";
import { TableLoadingRow } from "@/components/shared/entity-loading-state";
import { cn } from "@/lib/utils";
import { PhoneLine } from "../types";
import { formatPhoneDisplay } from "../utils";
import { PhoneLineMark } from "./PhoneLineMark";

interface PhoneLinesTableProps {
  loading: boolean;
  lines: PhoneLine[];
  totalFiltered: number;
  onRowClick?: (line: PhoneLine) => void;
  onEdit?: (line: PhoneLine) => void;
  onDelete?: (line: PhoneLine) => void;
  canManage?: boolean;
  currentPage?: number;
  onPageChange?: (page: number) => void;
  itemsPerPage?: number;
  totalPages?: number;
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

export function PhoneLinesTable({
  loading,
  lines,
  totalFiltered,
  onRowClick,
  onEdit,
  onDelete,
  canManage = true,
  currentPage = 1,
  onPageChange,
  itemsPerPage = 10,
  totalPages = 1,
}: PhoneLinesTableProps) {
  return (
    <div className="entity-table-root">
      <div className="entity-table-frame">
        <div className="entity-table-scroll">
          <Table className="relative w-full table-fixed">
            <TableHeader className="bg-slate-50 sticky top-0 z-10 border-y border-slate-200 dark:bg-muted/40">
              <TableRow className="border-none hover:bg-transparent">
                <TableHead className="w-[32%] max-w-[280px] pl-4 font-bold text-[11px] tracking-wider uppercase text-slate-500">
                  Phone line
                </TableHead>
                <TableHead className="w-[28%] max-w-[220px] font-bold text-[11px] tracking-wider uppercase text-slate-500">
                  Label
                </TableHead>
                <TableHead className="w-[14%] font-bold text-[11px] tracking-wider uppercase text-slate-500">
                  Status
                </TableHead>
                <TableHead className="w-[18%] font-bold text-[11px] tracking-wider uppercase text-slate-500">
                  Created
                </TableHead>
                <TableHead className="w-[120px] font-bold text-[11px] tracking-wider uppercase text-slate-500 text-right pr-4">
                  Actions
                </TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {loading ? (
                <TableLoadingRow colSpan={5} kind="phone-lines" />
              ) : totalFiltered === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={5}
                    className="h-24 text-center text-sm text-muted-foreground"
                  >
                    No phone lines found.
                  </TableCell>
                </TableRow>
              ) : (
                lines.map((line, i) => (
                  <TableRow
                    key={line.id}
                    onClick={() => onRowClick?.(line)}
                    className={cn(
                      "group hover:bg-[#f0faf5]/60 dark:hover:bg-muted/50 border-b border-border/70 transition-all duration-150",
                      i % 2 === 1
                        ? "bg-slate-50/60 dark:bg-muted/20"
                        : "bg-white dark:bg-card",
                      onRowClick && "cursor-pointer",
                    )}
                  >
                    <TableCell className="max-w-0 overflow-hidden pl-4 py-3">
                      <div className="flex min-w-0 items-center gap-2.5">
                        <PhoneLineMark className="h-8 w-8" />
                        <p
                          className="min-w-0 flex-1 truncate font-mono font-bold text-[14px] leading-tight text-foreground"
                          title={formatPhoneDisplay(line.phoneNumber)}
                        >
                          {formatPhoneDisplay(line.phoneNumber)}
                        </p>
                      </div>
                    </TableCell>

                    <TableCell className="max-w-0 overflow-hidden py-3">
                      {line.label ? (
                        <p
                          className="truncate text-[13.5px] font-medium text-slate-700 dark:text-slate-300"
                          title={line.label}
                        >
                          {line.label}
                        </p>
                      ) : (
                        <span className="text-muted-foreground italic text-sm">
                          No label
                        </span>
                      )}
                    </TableCell>

                    <TableCell className="py-3">
                      <StatusPill active={line.isActive} />
                    </TableCell>

                    <TableCell className="py-3">
                      <span className="font-mono text-[13px] text-slate-500 font-medium">
                        {new Date(line.createdAt).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </span>
                    </TableCell>

                    <TableCell
                      className="py-3 text-right pr-4"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div className="flex items-center justify-end gap-1">
                        {canManage && onEdit && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-muted-foreground hover:bg-amber-50 hover:text-amber-600"
                            title="Edit line"
                            aria-label="Edit line"
                            onClick={() => onEdit(line)}
                          >
                            <Pencil className="h-4 w-4 pointer-events-none" />
                          </Button>
                        )}
                        {canManage && onDelete && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-muted-foreground hover:bg-red-50 hover:text-red-600"
                            title="Delete line"
                            aria-label="Delete line"
                            onClick={() => onDelete(line)}
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

          <div className="min-w-0 overflow-x-auto px-2">
            <PageNumberButtons
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={onPageChange}
              stopPropagation
              className="min-w-max"
              buttonClassName="h-[36px] w-[36px]"
              ellipsisClassName="h-[36px] w-[36px]"
            />
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
