"use client";

import { formatDistanceToNow } from "date-fns";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Clock, MapPin, Pencil, Phone, Pin, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Customer } from "../types";
import { CustomerMark } from "./CustomerMark";

interface CustomersTableProps {
  loading: boolean;
  customers: Customer[];
  totalFiltered: number;
  error?: string | null;
  onRetry?: () => void;
  onRowClick?: (customer: Customer) => void;
  onEdit?: (customer: Customer) => void;
  onDelete?: (customer: Customer) => void;
  canManage?: boolean;
  currentPage?: number;
  onPageChange?: (page: number) => void;
  itemsPerPage?: number;
  totalPages?: number;
}

function formatRelativeDate(value?: string) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return formatDistanceToNow(date, { addSuffix: true });
}

function getResultRange(page: number, itemsPerPage: number, total: number) {
  if (total === 0) return "0 of 0";
  const start = (page - 1) * itemsPerPage + 1;
  const end = Math.min(page * itemsPerPage, total);
  return `${start}-${end} of ${total}`;
}

export function CustomersTable({
  loading,
  customers,
  totalFiltered,
  error,
  onRetry,
  onRowClick,
  onEdit,
  onDelete,
  canManage = true,
  currentPage = 1,
  onPageChange,
  itemsPerPage = 10,
  totalPages = 1,
}: CustomersTableProps) {
  const colSpan = 8;

  return (
    <div className="entity-table-root">
      <div className="entity-table-frame">
        <div className="entity-table-scroll">
          <Table className="relative min-w-[1040px] table-fixed">
            <TableHeader className="sticky top-0 z-10 border-y border-slate-200 bg-slate-50 dark:bg-muted/40">
              <TableRow className="border-none hover:bg-transparent">
                <TableHead className="w-[250px] pl-4 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  Customer
                </TableHead>
                <TableHead className="w-[240px] text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  Yards
                </TableHead>
                <TableHead className="w-[150px] text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  Campaigns
                </TableHead>
                <TableHead className="w-[80px] text-right text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  Calls
                </TableHead>
                <TableHead className="w-[110px] text-center text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  Open tickets
                </TableHead>
                <TableHead className="w-[130px] text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  Last contact
                </TableHead>
                <TableHead className="w-[90px] text-center text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  Pinned note
                </TableHead>
                <TableHead className="w-[110px] pr-4 text-right text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  Actions
                </TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {loading ? (
                Array.from({ length: itemsPerPage }).map((_, index) => (
                  <TableRow key={index} className="border-b border-border/70">
                    <TableCell className="pl-4">
                      <div className="flex items-center gap-2.5">
                        <Skeleton className="h-8 w-8 rounded-full" />
                        <div className="flex flex-1 flex-col gap-1.5">
                          <Skeleton className="h-3.5 w-32" />
                          <Skeleton className="h-3 w-24" />
                        </div>
                      </div>
                    </TableCell>
                    {Array.from({ length: colSpan - 1 }).map((__, cell) => (
                      <TableCell key={cell}>
                        <Skeleton className="h-4 w-full max-w-[120px]" />
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : error ? (
                <TableRow>
                  <TableCell colSpan={colSpan} className="h-28 text-center">
                    <div className="flex flex-col items-center justify-center gap-3 text-sm text-muted-foreground">
                      <span>{error}</span>
                      {onRetry ? (
                        <Button variant="outline" size="sm" onClick={onRetry}>
                          Retry
                        </Button>
                      ) : null}
                    </div>
                  </TableCell>
                </TableRow>
              ) : totalFiltered === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={colSpan}
                    className="h-24 text-center text-sm text-muted-foreground"
                  >
                    No customers found.
                  </TableCell>
                </TableRow>
              ) : (
                customers.map((customer, index) => {
                  const openTickets = customer.openTickets ?? 0;
                  const hasPinnedNote = Boolean(customer.pinnedNote?.trim());
                  const customerYards =
                    customer.yards && customer.yards.length > 0
                      ? customer.yards
                      : customer.yard
                        ? [customer.yard]
                        : [];

                  return (
                    <TableRow
                      key={customer.id}
                      onClick={() => onRowClick?.(customer)}
                      className={cn(
                        "group border-b border-border/70 transition-all duration-150 hover:bg-[#f0faf5]/60 dark:hover:bg-muted/50",
                        index % 2 === 1
                          ? "bg-slate-50/60 dark:bg-muted/20"
                          : "bg-white dark:bg-card",
                        onRowClick && "cursor-pointer",
                      )}
                    >
                      <TableCell className="max-w-0 overflow-hidden py-3 pl-4">
                        <div className="flex min-w-0 items-center gap-2.5">
                          <CustomerMark className="h-8 w-8" />
                          <div className="min-w-0 flex-1">
                            <p
                              className="truncate text-[14px] font-bold leading-tight text-foreground"
                              title={customer.name || undefined}
                            >
                              {customer.name || "Unknown"}
                            </p>
                            <div className="mt-0.5 flex items-center gap-1.5 text-[11.5px] text-muted-foreground">
                              <Phone className="h-3 w-3 shrink-0" />
                              <span className="truncate font-mono">
                                {customer.phone || "—"}
                              </span>
                            </div>
                          </div>
                        </div>
                      </TableCell>

                      <TableCell className="max-w-0 overflow-hidden py-3">
                        {customerYards.length > 0 ? (
                          <div
                            className="flex min-w-0 flex-wrap gap-1"
                            title={customerYards.map((yard) => yard.name).join(", ")}
                          >
                            {customerYards.slice(0, 2).map((yard) => (
                              <Badge
                                key={yard.id}
                                variant="outline"
                                className="max-w-full gap-1 truncate rounded-full font-medium"
                              >
                                <MapPin className="h-3 w-3 shrink-0" />
                                <span className="truncate">{yard.name}</span>
                              </Badge>
                            ))}
                            {customerYards.length > 2 ? (
                              <Badge variant="outline" className="rounded-full">
                                +{customerYards.length - 2}
                              </Badge>
                            ) : null}
                          </div>
                        ) : (
                          <span className="text-[13px] text-slate-400">—</span>
                        )}
                      </TableCell>

                      <TableCell className="max-w-0 overflow-hidden py-3">
                        {customer.campaigns && customer.campaigns.length > 0 ? (
                          <div className="flex min-w-0 flex-wrap gap-1">
                            {customer.campaigns.slice(0, 2).map((campaign) => (
                              <Badge
                                key={campaign.id}
                                variant="secondary"
                                className="max-w-full truncate rounded-full font-medium"
                                title={campaign.nombre}
                              >
                                {campaign.nombre}
                              </Badge>
                            ))}
                            {customer.campaigns.length > 2 ? (
                              <Badge variant="outline" className="rounded-full">
                                +{customer.campaigns.length - 2}
                              </Badge>
                            ) : null}
                          </div>
                        ) : (
                          <span className="text-[13px] text-slate-400">—</span>
                        )}
                      </TableCell>

                      <TableCell className="py-3 text-right font-mono text-[13px] font-semibold text-slate-700 dark:text-slate-200">
                        {customer.callCount ?? customer.totalCalls ?? 0}
                      </TableCell>

                      <TableCell className="py-3 text-center">
                        <Badge
                          variant={openTickets > 0 ? "destructive" : "outline"}
                          className="min-w-8 justify-center rounded-full"
                        >
                          {openTickets}
                        </Badge>
                      </TableCell>

                      <TableCell className="py-3">
                        <div
                          className="flex items-center gap-1.5 text-[12px] font-medium text-slate-500"
                          title={customer.lastContactAt || undefined}
                        >
                          <Clock className="h-3.5 w-3.5 shrink-0" />
                          <span className="truncate">
                            {formatRelativeDate(customer.lastContactAt)}
                          </span>
                        </div>
                      </TableCell>

                      <TableCell className="py-3 text-center">
                        {hasPinnedNote ? (
                          <span
                            className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-amber-200 bg-amber-50 text-amber-700"
                            title="Persistent note exists"
                          >
                            <Pin className="h-3.5 w-3.5" />
                          </span>
                        ) : (
                          <span className="text-[13px] text-slate-400">—</span>
                        )}
                      </TableCell>

                      <TableCell
                        className="py-3 pr-4 text-right"
                        onClick={(event) => event.stopPropagation()}
                      >
                        <div className="flex items-center justify-end gap-1">
                          {canManage && onEdit ? (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-muted-foreground hover:bg-amber-50 hover:text-amber-600"
                              title="Edit customer"
                              aria-label="Edit customer"
                              onClick={() => onEdit(customer)}
                            >
                              <Pencil className="h-4 w-4 pointer-events-none" />
                            </Button>
                          ) : null}
                          {canManage && onDelete ? (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-muted-foreground hover:bg-red-50 hover:text-red-600"
                              title="Delete customer"
                              aria-label="Delete customer"
                              onClick={() => onDelete(customer)}
                            >
                              <Trash2 className="h-4 w-4 pointer-events-none" />
                            </Button>
                          ) : null}
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

      {totalFiltered > 0 && onPageChange ? (
        <div className="flex items-center justify-between px-1 pb-2 pt-2">
          <Button
            variant="outline"
            className="h-[36px] rounded-[10px] border-border px-3.5 text-[13px] font-medium text-muted-foreground shadow-sm hover:text-foreground"
            onClick={() => onPageChange(Math.max(currentPage - 1, 1))}
            disabled={currentPage === 1 || loading}
          >
            Previous
          </Button>

          <div className="flex flex-col items-center gap-0.5 text-center">
            <div className="hidden items-center justify-center gap-1.5 md:flex">
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
                    onClick={() => onPageChange(pageNum)}
                    className={cn(
                      "flex h-[36px] w-[36px] items-center justify-center rounded-[10px] text-[13px] transition-colors",
                      active
                        ? "border border-[#a6f0c3] bg-[#e2fae9] font-semibold text-[#008f68]"
                        : "border border-transparent font-medium text-muted-foreground hover:bg-muted/50",
                    )}
                  >
                    {pageNum}
                  </button>
                );
              })}
            </div>
            <span className="text-[11px] font-medium text-muted-foreground">
              {getResultRange(currentPage, itemsPerPage, totalFiltered)}
            </span>
          </div>

          <Button
            variant="outline"
            className="h-[36px] rounded-[10px] border-border px-3.5 text-[13px] font-medium text-muted-foreground shadow-sm hover:text-foreground"
            onClick={() => onPageChange(Math.min(currentPage + 1, totalPages))}
            disabled={currentPage >= totalPages || loading}
          >
            Next
          </Button>
        </div>
      ) : null}
    </div>
  );
}
