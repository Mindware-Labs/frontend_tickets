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
import { Mail, Pencil, Phone, Trash2 } from "lucide-react";
import { TableLoadingRow } from "@/components/shared/entity-loading-state";
import { TableYardBadges } from "@/components/entity-table-badges";
import { cn } from "@/lib/utils";
import { Landlord, YardOption } from "../types";
import { LandlordMark } from "./LandlordMark";

interface LandlordsTableProps {
  loading: boolean;
  landlords: Landlord[];
  totalFiltered: number;
  yards: YardOption[];
  onRowClick?: (landlord: Landlord) => void;
  onEdit?: (landlord: Landlord) => void;
  onDelete?: (landlord: Landlord) => void;
  canManage?: boolean;
  currentPage?: number;
  onPageChange?: (page: number) => void;
  itemsPerPage?: number;
  totalPages?: number;
}

function getYardLabels(landlord: Landlord, yards: YardOption[]): string[] {
  if (landlord.yards && landlord.yards.length > 0) {
    return landlord.yards.map((y) => y.name);
  }
  return yards.filter((y) => y.landlord?.id === landlord.id).map((y) => y.name);
}

export function LandlordsTable({
  loading,
  landlords,
  totalFiltered,
  yards,
  onRowClick,
  onEdit,
  onDelete,
  canManage = true,
  currentPage = 1,
  onPageChange,
  itemsPerPage = 10,
  totalPages = 1,
}: LandlordsTableProps) {
  return (
    <div className="entity-table-root">
      <div className="entity-table-frame">
        <div className="entity-table-scroll">
          <Table className="relative w-full table-fixed">
            <TableHeader className="bg-slate-50 sticky top-0 z-10 border-y border-slate-200 dark:bg-muted/40">
              <TableRow className="border-none hover:bg-transparent">
                <TableHead className="w-[26%] max-w-[260px] pl-4 font-bold text-[11px] tracking-wider uppercase text-slate-500">
                  Landlord
                </TableHead>
                <TableHead className="w-[26%] max-w-[240px] font-bold text-[11px] tracking-wider uppercase text-slate-500">
                  Email
                </TableHead>
                <TableHead className="min-w-[130px] font-bold text-[11px] tracking-wider uppercase text-slate-500">
                  Phone
                </TableHead>
                <TableHead className="w-[22%] max-w-[220px] font-bold text-[11px] tracking-wider uppercase text-slate-500">
                  Yards
                </TableHead>
                <TableHead className="w-[120px] font-bold text-[11px] tracking-wider uppercase text-slate-500 text-right pr-4">
                  Actions
                </TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {loading ? (
                <TableLoadingRow colSpan={5} kind="landlords" />
              ) : totalFiltered === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={5}
                    className="h-24 text-center text-sm text-muted-foreground"
                  >
                    No landlords found.
                  </TableCell>
                </TableRow>
              ) : (
                landlords.map((landlord, i) => {
                  const yardNames = getYardLabels(landlord, yards);
                  return (
                    <TableRow
                      key={landlord.id}
                      onClick={() => onRowClick?.(landlord)}
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
                          <LandlordMark className="h-8 w-8" />
                          <p
                            className="min-w-0 flex-1 truncate font-bold text-[14px] leading-tight text-foreground"
                            title={landlord.name}
                          >
                            {landlord.name || "Unknown"}
                          </p>
                        </div>
                      </TableCell>

                      <TableCell className="max-w-0 overflow-hidden py-3">
                        <div className="flex min-w-0 items-center gap-1.5">
                          <Mail className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                          <span
                            className="min-w-0 flex-1 truncate text-[13px] text-slate-600"
                            title={landlord.email}
                          >
                            {landlord.email || "—"}
                          </span>
                        </div>
                      </TableCell>

                      <TableCell className="py-3">
                        <div className="flex items-center gap-1.5">
                          <Phone className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                          <span className="font-mono text-[13px] font-medium text-slate-600">
                            {landlord.phone || "—"}
                          </span>
                        </div>
                      </TableCell>

                      <TableCell className="max-w-0 overflow-hidden py-3">
                        <TableYardBadges
                          yards={yardNames.map((name, index) => ({
                            id: index,
                            name,
                          }))}
                        />
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
                              title="Edit landlord"
                              aria-label="Edit landlord"
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
                              aria-label="Delete landlord"
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
