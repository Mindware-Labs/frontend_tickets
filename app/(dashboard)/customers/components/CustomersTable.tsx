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
import { PaginationFooter } from "@/components/common/pagination-footer";
import { Button } from "@/components/ui/button";
import { TableLoadingRow } from "@/components/shared/entity-loading-state";
import { Clock, Pencil, Phone, Pin, Trash2 } from "lucide-react";
import {
  TableCampaignBadges,
  TableYardBadges,
} from "@/components/entity-table-badges";
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
    <div className="entity-table-root w-full overflow-x-auto">
      <div className="entity-table-frame min-w-[800px]">
        <Table>
          <TableHeader className="sticky top-0 z-10 border-y border-slate-200 bg-slate-50 dark:bg-muted/40">
            <TableRow className="border-none hover:bg-transparent">
              <TableHead className="w-[180px] pl-4 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                Customer
              </TableHead>
              <TableHead className="w-[160px] text-[11px] font-bold uppercase tracking-wider text-slate-500">
                Yards
              </TableHead>
              <TableHead className="w-[130px] text-[11px] font-bold uppercase tracking-wider text-slate-500">
                Campaigns
              </TableHead>
              <TableHead className="w-[60px] text-right text-[11px] font-bold uppercase tracking-wider text-slate-500">
                Calls
              </TableHead>
              <TableHead className="w-[80px] text-center text-[11px] font-bold uppercase tracking-wider text-slate-500">
                Tickets
              </TableHead>
              <TableHead className="w-[110px] text-[11px] font-bold uppercase tracking-wider text-slate-500">
                Last contact
              </TableHead>
              <TableHead className="w-[160px] text-[11px] font-bold uppercase tracking-wider text-slate-500">
                Pinned note
              </TableHead>
              <TableHead className="w-[80px] pr-4 text-right text-[11px] font-bold uppercase tracking-wider text-slate-500">
                Actions
              </TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {loading ? (
              <TableLoadingRow colSpan={colSpan} kind="customers" />
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
                    <TableCell className="max-w-0 overflow-hidden py-2.5 pl-4">
                      <div className="flex min-w-0 items-center gap-2">
                        <CustomerMark className="h-7 w-7 shrink-0" />
                        <div className="min-w-0 flex-1">
                          <p
                            className="truncate text-[13px] font-bold leading-tight text-foreground"
                            title={customer.name || undefined}
                          >
                            {customer.name || "Unknown"}
                          </p>
                          <div className="mt-0.5 flex items-center gap-1 text-[11px] text-muted-foreground">
                            <Phone className="h-2.5 w-2.5 shrink-0" />
                            <span className="truncate font-mono">
                              {customer.phone || "—"}
                            </span>
                          </div>
                        </div>
                      </div>
                    </TableCell>

                    <TableCell className="max-w-0 overflow-hidden py-2.5">
                      <TableYardBadges
                        yards={customerYards.map((yard) => ({
                          id: yard.id,
                          name: yard.name,
                        }))}
                      />
                    </TableCell>

                    <TableCell className="max-w-0 overflow-hidden py-2.5">
                      <TableCampaignBadges
                        campaigns={(customer.campaigns ?? []).map((campaign) => ({
                          id: campaign.id,
                          name: campaign.nombre,
                        }))}
                      />
                    </TableCell>

                    <TableCell className="py-2.5 text-right font-mono text-[12px] font-semibold text-slate-700 dark:text-slate-200">
                      {customer.callCount ?? customer.totalCalls ?? 0}
                    </TableCell>

                    <TableCell className="py-2.5 text-center">
                      <Badge
                        variant={openTickets > 0 ? "destructive" : "outline"}
                        className="min-w-6 justify-center rounded-full px-2 text-[11px]"
                      >
                        {openTickets}
                      </Badge>
                    </TableCell>

                    <TableCell className="py-2.5">
                      <div
                        className="flex items-center gap-1 text-[11px] font-medium text-slate-500"
                        title={customer.lastContactAt || undefined}
                      >
                        <Clock className="h-3 w-3 shrink-0" />
                        <span className="truncate">
                          {formatRelativeDate(customer.lastContactAt)}
                        </span>
                      </div>
                    </TableCell>

                    <TableCell className="max-w-0 overflow-hidden py-2.5">
                      {hasPinnedNote ? (
                        <div
                          className="flex min-w-0 items-start gap-1 rounded-md border border-amber-200/80 bg-amber-50/90 px-1.5 py-1 dark:border-amber-900/50 dark:bg-amber-950/30"
                          title={customer.pinnedNote}
                        >
                          <Pin className="mt-0.5 h-2.5 w-2.5 shrink-0 text-amber-600" />
                          <p className="line-clamp-2 text-left text-[11px] font-medium leading-snug text-amber-900 dark:text-amber-100">
                            {customer.pinnedNote}
                          </p>
                        </div>
                      ) : (
                        <span className="text-[12px] text-slate-400">—</span>
                      )}
                    </TableCell>

                    <TableCell
                      className="py-2.5 pr-4 text-right"
                      onClick={(event) => event.stopPropagation()}
                    >
                      <div className="flex items-center justify-end gap-0.5">
                        {canManage && onEdit ? (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-muted-foreground hover:bg-amber-50 hover:text-amber-600"
                            title="Edit customer"
                            aria-label="Edit customer"
                            onClick={() => onEdit(customer)}
                          >
                            <Pencil className="h-3.5 w-3.5 pointer-events-none" />
                          </Button>
                        ) : null}
                        {canManage && onDelete ? (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-muted-foreground hover:bg-red-50 hover:text-red-600"
                            title="Delete customer"
                            aria-label="Delete customer"
                            onClick={() => onDelete(customer)}
                          >
                            <Trash2 className="h-3.5 w-3.5 pointer-events-none" />
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

      {totalFiltered > 0 && onPageChange ? (
        <PaginationFooter
          totalCount={totalFiltered}
          currentPage={currentPage}
          totalPages={totalPages}
          itemsPerPage={itemsPerPage}
          onPageChange={onPageChange}
          itemLabel="customers"
          loading={loading}
        />
      ) : null}
    </div>
  );
}
