"use client";

import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Eye, Pencil, Trash2, Loader2, Building } from "lucide-react";
import { Landlord, YardOption } from "../types";
import { cn } from "@/lib/utils";

interface LandlordsTableProps {
  loading: boolean;
  landlords: Landlord[];
  totalFiltered: number;
  yards: YardOption[];
  selectedLandlords: number[];
  onSelectionChange: (ids: number[]) => void;
  onDetails?: (landlord: Landlord) => void;
  onEdit?: (landlord: Landlord) => void;
  onDelete?: (landlord: Landlord) => void;
  canManage?: boolean;
  currentPage?: number;
  onPageChange?: (page: number) => void;
  itemsPerPage?: number;
  totalPages?: number;
}

function getYardLabels(landlord: Landlord, yards: YardOption[]): string[] {
  if (landlord.yards && landlord.yards.length > 0) return landlord.yards.map((y) => y.name);
  return yards.filter((y) => y.landlord?.id === landlord.id).map((y) => y.name);
}

function getInitials(name: string | null | undefined): string {
  if (!name) return "?";
  return name.split(" ").map((n) => n[0]).join("").substring(0, 2).toUpperCase();
}

export function LandlordsTable({
  loading,
  landlords,
  totalFiltered,
  yards,
  selectedLandlords,
  onSelectionChange,
  onDetails,
  onEdit,
  onDelete,
  canManage = true,
  currentPage = 1,
  onPageChange,
  itemsPerPage = 10,
  totalPages = 1,
}: LandlordsTableProps) {
  const allSelected = landlords.length > 0 && selectedLandlords.length === landlords.length;

  const handleSelectAll = () => {
    if (allSelected) onSelectionChange([]);
    else onSelectionChange(landlords.map((l) => l.id));
  };

  const handleSelectOne = (id: number) => {
    if (selectedLandlords.includes(id)) onSelectionChange(selectedLandlords.filter((x) => x !== id));
    else onSelectionChange([...selectedLandlords, id]);
  };

  return (
    <div className="flex-1 flex flex-col gap-3">
      <div className="rounded-xl border border-border/80 overflow-hidden shadow-sm">
        <div className="max-h-[calc(100vh-12rem)] overflow-y-auto">
          <Table className="relative w-full table-fixed">
            <colgroup>
              <col className="w-[4%]" />
              <col className="w-[22%]" />
              <col className="w-[22%]" />
              <col className="w-[16%]" />
              <col className="w-[24%]" />
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
                  Landlord
                </TableHead>
                <TableHead className="h-11 font-bold text-[11px] tracking-wider uppercase text-slate-500">
                  Email
                </TableHead>
                <TableHead className="h-11 font-bold text-[11px] tracking-wider uppercase text-slate-500">
                  Phone
                </TableHead>
                <TableHead className="h-11 font-bold text-[11px] tracking-wider uppercase text-slate-500">
                  Yards
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
                      Loading landlords...
                    </div>
                  </TableCell>
                </TableRow>
              ) : landlords.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-24 text-center text-sm text-muted-foreground">
                    No landlords found.
                  </TableCell>
                </TableRow>
              ) : (
                landlords.map((landlord, i) => {
                  const yardNames = getYardLabels(landlord, yards);
                  return (
                    <TableRow
                      key={landlord.id}
                      className={cn(
                        "cursor-pointer group hover:bg-[#f0faf5]/60 dark:hover:bg-muted/50 border-b border-border/70 transition-all duration-150",
                        i % 2 === 1 ? "bg-slate-50/60 dark:bg-muted/20" : "bg-white dark:bg-card",
                      )}
                      onClick={() => onDetails?.(landlord)}
                    >
                      <TableCell className="pl-4 py-3" onClick={(e) => e.stopPropagation()}>
                        <Checkbox
                          checked={selectedLandlords.includes(landlord.id)}
                          onCheckedChange={() => handleSelectOne(landlord.id)}
                          className="border-slate-300 data-[state=checked]:bg-[#008f68] data-[state=checked]:border-[#008f68]"
                        />
                      </TableCell>

                      <TableCell className="pl-3 py-3">
                        <div className="flex items-center gap-2.5">
                          <Avatar className="h-8 w-8 shrink-0 rounded-full">
                            <AvatarFallback
                              className="text-[12px] font-bold rounded-full"
                              style={{ background: "#e2fae9", color: "#008f68" }}
                            >
                              {getInitials(landlord.name)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="min-w-0">
                            <div className="font-bold text-[14px] leading-tight truncate text-foreground">
                              {landlord.name || "Unknown"}
                            </div>
                          </div>
                        </div>
                      </TableCell>

                      <TableCell className="py-3">
                        <span className="text-[13.5px] text-slate-600 dark:text-slate-300 truncate block">
                          {landlord.email || <span className="text-muted-foreground">—</span>}
                        </span>
                      </TableCell>

                      <TableCell className="py-3">
                        {landlord.phone ? (
                          <span className="font-mono text-[13.5px] text-slate-600 dark:text-slate-300 font-medium">
                            {landlord.phone}
                          </span>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </TableCell>

                      <TableCell className="py-3">
                        {yardNames.length > 0 ? (
                          <div className="flex flex-wrap gap-1.5">
                            {yardNames.slice(0, 2).map((name) => (
                              <span
                                key={name}
                                className="inline-flex items-center gap-1 px-2 py-px rounded-full bg-[#e2fae9] text-[#008f68] border border-[#bbf7d0] text-[11.5px] font-medium"
                              >
                                <Building className="h-3 w-3" />
                                {name}
                              </span>
                            ))}
                            {yardNames.length > 2 && (
                              <span className="inline-flex items-center px-2 py-px rounded-full bg-slate-100 text-slate-500 border border-slate-200 text-[11.5px] font-medium">
                                +{yardNames.length - 2}
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="inline-flex items-center px-2 py-px rounded-full bg-slate-100 text-slate-500 border border-slate-200 text-[11.5px] font-medium">
                            No yards
                          </span>
                        )}
                      </TableCell>

                      <TableCell className="py-3 text-right pr-4" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-muted-foreground hover:bg-[#f0faf5] hover:text-[#008f68]"
                            title="View details"
                            onClick={() => onDetails?.(landlord)}
                          >
                            <Eye className="h-4 w-4 pointer-events-none" />
                          </Button>
                          {canManage && onEdit && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-muted-foreground hover:bg-amber-50 hover:text-amber-600"
                              title="Edit landlord"
                              onClick={() => onEdit(landlord)}
                            >
                              <Pencil className="h-4 w-4 pointer-events-none" />
                            </Button>
                          )}
                          {canManage && onDelete && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-muted-foreground hover:bg-red-50 hover:text-red-600"
                              title="Delete landlord"
                              onClick={() => onDelete(landlord)}
                            >
                              <Trash2 className="h-4 w-4 pointer-events-none" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
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
            onClick={(e) => { e.stopPropagation(); onPageChange(Math.max(currentPage - 1, 1)); }}
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
                  onClick={(e) => { e.stopPropagation(); onPageChange(pageNum); }}
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
            onClick={(e) => { e.stopPropagation(); onPageChange(Math.min(currentPage + 1, totalPages)); }}
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
