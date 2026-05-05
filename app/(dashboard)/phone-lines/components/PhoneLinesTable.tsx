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
import { Checkbox } from "@/components/ui/checkbox";
import { Eye, Pencil, Trash2, Loader2, Phone } from "lucide-react";
import { PhoneLine } from "../types";
import { cn } from "@/lib/utils";

function formatPhoneDisplay(digits: string): string {
  const clean =
    digits.startsWith("1") && digits.length === 11 ? digits.slice(1) : digits;
  if (clean.length === 0) return digits;
  if (clean.length <= 3) return `+1 ${clean}`;
  if (clean.length <= 6) return `+1 ${clean.slice(0, 3)}-${clean.slice(3)}`;
  return `+1 ${clean.slice(0, 3)}-${clean.slice(3, 6)}-${clean.slice(6, 10)}`;
}

interface PhoneLinesTableProps {
  loading: boolean;
  lines: PhoneLine[];
  totalFiltered: number;
  selectedLines: number[];
  onSelectionChange: (ids: number[]) => void;
  onView?: (line: PhoneLine) => void;
  onEdit?: (line: PhoneLine) => void;
  onDelete?: (line: PhoneLine) => void;
  canManage?: boolean;
  currentPage?: number;
  onPageChange?: (page: number) => void;
  itemsPerPage?: number;
  totalPages?: number;
}

export function PhoneLinesTable({
  loading,
  lines,
  totalFiltered,
  selectedLines,
  onSelectionChange,
  onView,
  onEdit,
  onDelete,
  canManage = true,
  currentPage = 1,
  onPageChange,
  itemsPerPage = 10,
  totalPages = 1,
}: PhoneLinesTableProps) {
  const allSelected = lines.length > 0 && selectedLines.length === lines.length;

  const handleSelectAll = () => {
    if (allSelected) onSelectionChange([]);
    else onSelectionChange(lines.map((l) => l.id));
  };

  const handleSelectOne = (id: number) => {
    if (selectedLines.includes(id))
      onSelectionChange(selectedLines.filter((x) => x !== id));
    else onSelectionChange([...selectedLines, id]);
  };

  return (
    <div className="flex-1 flex flex-col gap-3">
      <div className="rounded-xl border border-border/80 overflow-hidden shadow-sm">
        <div className="max-h-[calc(100vh-12rem)] overflow-y-auto">
          <Table className="relative w-full table-fixed">
            <colgroup>
              <col className="w-[4%]" />
              <col className="w-[28%]" />
              <col className="w-[24%]" />
              <col className="w-[14%]" />
              <col className="w-[18%]" />
              <col className="w-[12%]" />
            </colgroup>

            <TableHeader className="bg-slate-50 sticky top-0 z-10 border-y border-slate-200 dark:bg-muted/40">
              <TableRow className="border-none hover:bg-transparent">
                <TableHead className="pl-4 h-11">
                  <Checkbox
                    checked={allSelected}
                    onCheckedChange={handleSelectAll}
                    className="border-slate-300 data-[state=checked]:bg-[#008f68] data-[state=checked]:border-[#008f68]"
                  />
                </TableHead>
                <TableHead className="pl-3 h-11 font-bold text-[11px] tracking-wider uppercase text-slate-500">
                  Phone Number
                </TableHead>
                <TableHead className="h-11 font-bold text-[11px] tracking-wider uppercase text-slate-500">
                  Label
                </TableHead>
                <TableHead className="h-11 font-bold text-[11px] tracking-wider uppercase text-slate-500">
                  Status
                </TableHead>
                <TableHead className="h-11 font-bold text-[11px] tracking-wider uppercase text-slate-500">
                  Created
                </TableHead>
                <TableHead className="h-11 font-bold text-[11px] tracking-wider uppercase text-slate-500 text-right pr-4">
                  Actions
                </TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-24 text-center">
                    <div className="flex items-center justify-center gap-2 text-slate-500 text-sm">
                      <Loader2 className="h-5 w-5 animate-spin" />
                      Loading phone lines...
                    </div>
                  </TableCell>
                </TableRow>
              ) : lines.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-24 text-center text-sm text-muted-foreground">
                    No phone lines found.
                  </TableCell>
                </TableRow>
              ) : (
                lines.map((line, i) => (
                  <TableRow
                    key={line.id}
                    className={cn(
                      "cursor-pointer group hover:bg-[#f0faf5]/60 dark:hover:bg-muted/50 border-b border-border/70 transition-all duration-150",
                      i % 2 === 1 ? "bg-slate-50/60 dark:bg-muted/20" : "bg-white dark:bg-card"
                    )}
                    onClick={() => onView?.(line)}
                  >
                    <TableCell className="pl-4 py-3" onClick={(e) => e.stopPropagation()}>
                      <Checkbox
                        checked={selectedLines.includes(line.id)}
                        onCheckedChange={() => handleSelectOne(line.id)}
                        className="border-slate-300 data-[state=checked]:bg-[#008f68] data-[state=checked]:border-[#008f68]"
                      />
                    </TableCell>

                    <TableCell className="pl-3 py-3">
                      <div className="flex items-center gap-2.5">
                        <div className="h-8 w-8 shrink-0 rounded-full bg-[#e2fae9] border border-[#bbf7d0] flex items-center justify-center">
                          <Phone className="h-3.5 w-3.5 text-[#008f68]" />
                        </div>
                        <span className="font-mono font-bold text-[14px] text-foreground">
                          {formatPhoneDisplay(line.phoneNumber)}
                        </span>
                      </div>
                    </TableCell>

                    <TableCell className="py-3">
                      {line.label ? (
                        <span className="text-[13.5px] text-slate-700 font-medium">{line.label}</span>
                      ) : (
                        <span className="text-muted-foreground italic text-sm">No label</span>
                      )}
                    </TableCell>

                    <TableCell className="py-3">
                      {line.isActive ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-[5px] rounded-full text-[12px] font-bold border bg-[#dcfce7] text-[#15803d] border-[#bbf7d0]">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                          Active
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-[5px] rounded-full text-[12px] font-bold border bg-slate-100 text-slate-500 border-slate-200">
                          <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                          Inactive
                        </span>
                      )}
                    </TableCell>

                    <TableCell className="py-3">
                      <span className="font-mono text-[13px] text-slate-500 font-medium">
                        {new Date(line.createdAt).toLocaleDateString()}
                      </span>
                    </TableCell>

                    <TableCell className="py-3 text-right pr-4" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        {canManage && onEdit && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-muted-foreground hover:bg-amber-50 hover:text-amber-600"
                            title="Edit line"
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
        <div className="flex items-center justify-between pt-4 pb-2 px-1">
          <Button
            variant="outline"
            className="h-[36px] px-3.5 rounded-[10px] text-[13px] font-medium text-muted-foreground shadow-sm hover:text-foreground border-border"
            onClick={() => onPageChange(Math.max(currentPage - 1, 1))}
            disabled={currentPage === 1}
          >
            <svg className="mr-2 h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
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
                  onClick={() => onPageChange(pageNum)}
                  className={cn(
                    "flex h-[36px] w-[36px] items-center justify-center rounded-[10px] text-[13px] transition-colors",
                    active
                      ? "bg-[#e2fae9] text-[#008f68] border border-[#a6f0c3] font-semibold"
                      : "text-muted-foreground font-medium hover:bg-muted/50 border border-transparent"
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
            onClick={() => onPageChange(Math.min(currentPage + 1, totalPages))}
            disabled={currentPage >= totalPages}
          >
            Next
            <svg className="ml-2 h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M5 12h14M12 5l7 7-7 7" />
            </svg>
          </Button>
        </div>
      )}
    </div>
  );
}
