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
import {
  EntityLoadingSpinner,
  TableLoadingRow,
} from "@/components/shared/entity-loading-state";
import { Clock, Pencil, Phone, Pin, Trash2 } from "lucide-react";
import {
  TableCampaignBadges,
  TableYardBadges,
} from "@/components/entity-table-badges";
import {
  EntityMobileCard,
  EntityMobileCardBody,
  EntityMobileCardHeader,
  EntityMobileField,
  EntityMobileList,
  entityTableActionsCellClass,
  entityTableActionsHeadClass,
  entityTableCellClass,
  entityTableHeadClass,
  entityTableHeaderClass,
  entityTableHeaderRowClass,
  entityTableRowClass,
} from "@/components/shared/entity-table";
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

function getCustomerYards(customer: Customer) {
  const yards =
    customer.yards && customer.yards.length > 0
      ? customer.yards
      : customer.yard
        ? [customer.yard]
        : [];
  return yards.map((yard) => ({ id: yard.id, name: yard.name }));
}

function TicketsBadge({ openTickets }: { openTickets: number }) {
  return (
    <Badge
      variant={openTickets > 0 ? "destructive" : "outline"}
      className="min-w-6 justify-center rounded-full px-2 text-[11px]"
    >
      {openTickets}
    </Badge>
  );
}

function PinnedNote({ note }: { note: string }) {
  return (
    <div
      className="flex min-w-0 items-start gap-1 rounded-md border border-amber-200/80 bg-amber-50/90 px-1.5 py-1 dark:border-amber-900/50 dark:bg-amber-950/30"
      title={note}
    >
      <Pin className="mt-0.5 h-2.5 w-2.5 shrink-0 text-amber-600" />
      <p className="line-clamp-2 text-left text-[11px] font-medium leading-snug text-amber-900 dark:text-amber-100">
        {note}
      </p>
    </div>
  );
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
  const showActions = canManage && Boolean(onEdit || onDelete);
  const colSpan = showActions ? 8 : 7;
  const isEmpty = !loading && !error && totalFiltered === 0;

  function RowActions({ customer }: { customer: Customer }) {
    if (!showActions) return null;
    return (
      <>
        {onEdit && (
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
        )}
        {onDelete && (
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
        )}
      </>
    );
  }

  return (
    <div className="entity-table-root">
      {/* Desktop / tablet: table */}
      <div className="entity-table-frame hidden lg:block">
        <div className="entity-table-scroll">
          <Table className="relative w-full table-fixed">
            <TableHeader className={entityTableHeaderClass}>
              <TableRow className={entityTableHeaderRowClass}>
                <TableHead className={cn(entityTableHeadClass, "w-[180px] pl-4")}>
                  Customer
                </TableHead>
                <TableHead className={cn(entityTableHeadClass, "w-[160px]")}>
                  Yards
                </TableHead>
                <TableHead className={cn(entityTableHeadClass, "w-[130px]")}>
                  Campaigns
                </TableHead>
                <TableHead className={cn(entityTableHeadClass, "w-[60px] text-right")}>
                  Calls
                </TableHead>
                <TableHead className={cn(entityTableHeadClass, "w-[80px] text-center")}>
                  Tickets
                </TableHead>
                <TableHead className={cn(entityTableHeadClass, "w-[110px]")}>
                  Last contact
                </TableHead>
                <TableHead className={cn(entityTableHeadClass, "w-[160px]")}>
                  Pinned note
                </TableHead>
                {showActions && (
                  <TableHead className={entityTableActionsHeadClass}>Actions</TableHead>
                )}
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
              ) : isEmpty ? (
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

                  return (
                    <TableRow
                      key={customer.id}
                      onClick={() => onRowClick?.(customer)}
                      className={entityTableRowClass(index, Boolean(onRowClick))}
                    >
                      <TableCell className={cn(entityTableCellClass, "max-w-0 overflow-hidden pl-4")}>
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

                      <TableCell className={cn(entityTableCellClass, "max-w-0 overflow-hidden")}>
                        <TableYardBadges yards={getCustomerYards(customer)} />
                      </TableCell>

                      <TableCell className={cn(entityTableCellClass, "max-w-0 overflow-hidden")}>
                        <TableCampaignBadges
                          campaigns={(customer.campaigns ?? []).map((campaign) => ({
                            id: campaign.id,
                            name: campaign.nombre,
                          }))}
                        />
                      </TableCell>

                      <TableCell className={cn(entityTableCellClass, "text-right font-mono font-semibold text-slate-700 dark:text-slate-200")}>
                        {customer.callCount ?? customer.totalCalls ?? 0}
                      </TableCell>

                      <TableCell className={cn(entityTableCellClass, "text-center")}>
                        <TicketsBadge openTickets={openTickets} />
                      </TableCell>

                      <TableCell className={entityTableCellClass}>
                        <div
                          className="flex items-center gap-1 font-medium text-slate-500"
                          title={customer.lastContactAt || undefined}
                        >
                          <Clock className="h-3 w-3 shrink-0" />
                          <span className="truncate">
                            {formatRelativeDate(customer.lastContactAt)}
                          </span>
                        </div>
                      </TableCell>

                      <TableCell className={cn(entityTableCellClass, "max-w-0 overflow-hidden")}>
                        {hasPinnedNote ? (
                          <PinnedNote note={customer.pinnedNote as string} />
                        ) : (
                          <span className="text-slate-400">—</span>
                        )}
                      </TableCell>

                      {showActions && (
                        <TableCell
                          className={entityTableActionsCellClass}
                          onClick={(event) => event.stopPropagation()}
                        >
                          <div className="flex items-center justify-end gap-0.5">
                            <RowActions customer={customer} />
                          </div>
                        </TableCell>
                      )}
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Mobile: stacked cards */}
      <div className="lg:hidden">
        {loading ? (
          <div className="flex items-center justify-center rounded-xl border border-slate-200/80 bg-white py-10 dark:border-slate-800 dark:bg-card">
            <EntityLoadingSpinner kind="customers" size="sm" />
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-slate-200/80 bg-white py-10 text-center text-sm text-muted-foreground dark:border-slate-800 dark:bg-card">
            <span>{error}</span>
            {onRetry ? (
              <Button variant="outline" size="sm" onClick={onRetry}>
                Retry
              </Button>
            ) : null}
          </div>
        ) : isEmpty ? (
          <div className="rounded-xl border border-slate-200/80 bg-white py-10 text-center text-sm text-muted-foreground dark:border-slate-800 dark:bg-card">
            No customers found.
          </div>
        ) : (
          <EntityMobileList>
            {customers.map((customer) => {
              const openTickets = customer.openTickets ?? 0;
              const hasPinnedNote = Boolean(customer.pinnedNote?.trim());

              return (
                <EntityMobileCard
                  key={customer.id}
                  onClick={onRowClick ? () => onRowClick(customer) : undefined}
                >
                  <EntityMobileCardHeader
                    mark={<CustomerMark className="h-8 w-8 shrink-0" />}
                    title={customer.name || "Unknown"}
                    subtitle={
                      <span className="flex items-center gap-1">
                        <Phone className="h-2.5 w-2.5 shrink-0" />
                        <span className="truncate font-mono">
                          {customer.phone || "—"}
                        </span>
                      </span>
                    }
                    actions={<RowActions customer={customer} />}
                  />
                  <EntityMobileCardBody>
                    <EntityMobileField label="Calls">
                      <span className="font-mono font-semibold text-slate-700 dark:text-slate-200">
                        {customer.callCount ?? customer.totalCalls ?? 0}
                      </span>
                    </EntityMobileField>
                    <EntityMobileField label="Open tickets">
                      <TicketsBadge openTickets={openTickets} />
                    </EntityMobileField>
                    <EntityMobileField label="Yards" className="col-span-2">
                      <TableYardBadges yards={getCustomerYards(customer)} />
                    </EntityMobileField>
                    <EntityMobileField label="Campaigns" className="col-span-2">
                      <TableCampaignBadges
                        campaigns={(customer.campaigns ?? []).map((campaign) => ({
                          id: campaign.id,
                          name: campaign.nombre,
                        }))}
                      />
                    </EntityMobileField>
                    <EntityMobileField label="Last contact" className="col-span-2">
                      <div className="flex items-center gap-1 font-medium text-slate-500">
                        <Clock className="h-3 w-3 shrink-0" />
                        <span className="truncate">
                          {formatRelativeDate(customer.lastContactAt)}
                        </span>
                      </div>
                    </EntityMobileField>
                    {hasPinnedNote ? (
                      <EntityMobileField label="Pinned note" className="col-span-2">
                        <PinnedNote note={customer.pinnedNote as string} />
                      </EntityMobileField>
                    ) : null}
                  </EntityMobileCardBody>
                </EntityMobileCard>
              );
            })}
          </EntityMobileList>
        )}
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
