"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { PaginationFooter } from "@/components/common/pagination-footer";
import { Button } from "@/components/ui/button";
import { MapPin, Pencil, Phone, RotateCcw, Trash2 } from "lucide-react";
import {
  EntityLoadingSpinner,
  TableLoadingRow,
} from "@/components/shared/entity-loading-state";
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
import { Yard } from "../types";
import { YardMark } from "./YardMark";

interface YardsTableProps {
  loading: boolean;
  yards: Yard[];
  totalFiltered: number;
  onRowClick?: (yard: Yard) => void;
  onEdit?: (yard: Yard) => void;
  onDelete?: (yard: Yard) => void;
  onRestore?: (yard: Yard) => void;
  canManage?: boolean;
  currentPage?: number;
  onPageChange?: (page: number) => void;
  itemsPerPage?: number;
  onItemsPerPageChange?: (value: number) => void;
  totalPages?: number;
}

function TypePill({ type }: { type: Yard["yardType"] }) {
  const isSaas = type === "SAAS";
  return (
    <span
      className={cn(
        "inline-flex items-center px-2.5 py-[3px] rounded-full text-[11px] font-semibold border",
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
    <span className="inline-flex items-center gap-1.5 px-2.5 py-[3px] rounded-full text-[11px] font-semibold border bg-[#dcfce7] text-[#15803d] border-[#bbf7d0] dark:bg-emerald-500/15 dark:text-emerald-400 dark:border-emerald-500/30">
      <span className="w-[6px] h-[6px] rounded-full bg-[#22c55e] shrink-0" />
      Active
    </span>
  ) : (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-[3px] rounded-full text-[11px] font-semibold border bg-slate-100 text-slate-600 border-slate-200 dark:bg-neutral-500/15 dark:text-neutral-400 dark:border-neutral-500/30">
      <span className="w-[6px] h-[6px] rounded-full bg-slate-400 shrink-0" />
      Inactive
    </span>
  );
}

function ActivitiesBadge({ count }: { count: number }) {
  return (
    <span className="inline-flex items-center justify-center min-w-[28px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 text-[11px] font-semibold border border-slate-200 dark:bg-neutral-800 dark:text-neutral-300 dark:border-neutral-700">
      {count}
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
  onRestore,
  canManage = true,
  currentPage = 1,
  onPageChange,
  itemsPerPage = 10,
  onItemsPerPageChange,
  totalPages = 1,
}: YardsTableProps) {
  const showActions = canManage && Boolean(onEdit || onDelete || onRestore);
  const isEmpty = !loading && totalFiltered === 0;

  function RowActions({ yard }: { yard: Yard }) {
    if (!showActions) return null;
    return (
      <>
        {onEdit && (
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
        {onDelete && (
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-muted-foreground hover:bg-red-50 hover:text-red-600"
            title="Archive yard"
            aria-label="Archive yard"
            onClick={() => onDelete(yard)}
          >
            <Trash2 className="h-4 w-4 pointer-events-none" />
          </Button>
        )}
        {onRestore && (
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-muted-foreground hover:bg-[#f0faf5] hover:text-[#008f68]"
            title="Restore yard"
            aria-label="Restore yard"
            onClick={() => onRestore(yard)}
          >
            <RotateCcw className="h-4 w-4 pointer-events-none" />
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
                <TableHead className={cn(entityTableHeadClass, "w-[22%] max-w-[240px] pl-4")}>
                  Yard
                </TableHead>
                <TableHead className={cn(entityTableHeadClass, "w-[14%] max-w-[160px]")}>
                  Common Name
                </TableHead>
                <TableHead className={cn(entityTableHeadClass, "w-[120px] max-w-[240px]")}>
                  Address
                </TableHead>
                <TableHead className={cn(entityTableHeadClass, "w-[180px]")}>
                  Contact
                </TableHead>
                <TableHead className={cn(entityTableHeadClass, "w-[88px]")}>
                  Type
                </TableHead>
                <TableHead className={cn(entityTableHeadClass, "w-[100px]")}>
                  Status
                </TableHead>
                <TableHead className={cn(entityTableHeadClass, "w-[88px] text-center")}>
                  Activities
                </TableHead>
                {showActions && (
                  <TableHead className={entityTableActionsHeadClass}>Actions</TableHead>
                )}
              </TableRow>
            </TableHeader>

            <TableBody>
              {loading ? (
                <TableLoadingRow colSpan={showActions ? 8 : 7} kind="yards" />
              ) : isEmpty ? (
                <TableRow>
                  <TableCell
                    colSpan={showActions ? 8 : 7}
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
                    className={entityTableRowClass(i, Boolean(onRowClick))}
                  >
                    <TableCell className={cn(entityTableCellClass, "max-w-0 overflow-hidden pl-4")}>
                      <div className="flex min-w-0 items-center gap-2.5">
                        <YardMark className="h-8 w-8" />
                        <div className="min-w-0 flex-1">
                          <p
                            className="truncate text-[13px] font-bold leading-tight text-foreground"
                            title={yard.name}
                          >
                            {yard.name}
                          </p>
                          {yard.landlord?.name && (
                            <p
                              className="mt-0.5 truncate text-[11px] text-muted-foreground"
                              title={yard.landlord.name}
                            >
                              {yard.landlord.name}
                            </p>
                          )}
                        </div>
                      </div>
                    </TableCell>

                    <TableCell className={cn(entityTableCellClass, "max-w-0 overflow-hidden")}>
                      <p className="truncate" title={yard.commonName}>
                        {yard.commonName}
                      </p>
                    </TableCell>

                    <TableCell className={cn(entityTableCellClass, "max-w-0 overflow-hidden")}>
                      <div className="flex min-w-0 items-center gap-1.5">
                        <MapPin className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                        <span className="min-w-0 flex-1 truncate" title={yard.propertyAddress}>
                          {yard.propertyAddress}
                        </span>
                      </div>
                    </TableCell>

                    <TableCell className={cn(entityTableCellClass, "max-w-0 overflow-hidden")}>
                      <div className="flex min-w-0 items-center gap-1.5">
                        <Phone className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                        <span className="min-w-0 flex-1 truncate font-mono font-medium" title={yard.contactInfo}>
                          {yard.contactInfo}
                        </span>
                      </div>
                    </TableCell>

                    <TableCell className={entityTableCellClass}>
                      <TypePill type={yard.yardType} />
                    </TableCell>

                    <TableCell className={entityTableCellClass}>
                      <StatusPill active={yard.isActive} />
                    </TableCell>

                    <TableCell className={cn(entityTableCellClass, "text-center")}>
                      <ActivitiesBadge count={yard.ticketCount ?? yard.totalTickets ?? 0} />
                    </TableCell>

                    {showActions && (
                      <TableCell
                        className={entityTableActionsCellClass}
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div className="flex items-center justify-end gap-0.5">
                          <RowActions yard={yard} />
                        </div>
                      </TableCell>
                    )}
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Mobile: stacked cards */}
      <div className="lg:hidden">
        {loading ? (
          <div className="flex items-center justify-center rounded-xl border border-slate-200/80 bg-white py-10 dark:border-neutral-800 dark:bg-card">
            <EntityLoadingSpinner kind="yards" size="sm" />
          </div>
        ) : isEmpty ? (
          <div className="rounded-xl border border-slate-200/80 bg-white py-10 text-center text-sm text-muted-foreground dark:border-neutral-800 dark:bg-card">
            No yards found.
          </div>
        ) : (
          <EntityMobileList>
            {yards.map((yard) => (
              <EntityMobileCard
                key={yard.id}
                onClick={onRowClick ? () => onRowClick(yard) : undefined}
              >
                <EntityMobileCardHeader
                  mark={<YardMark className="h-8 w-8 shrink-0" />}
                  title={yard.name}
                  subtitle={yard.landlord?.name || yard.commonName || undefined}
                  actions={<RowActions yard={yard} />}
                />
                <div className="mt-2 flex flex-wrap items-center gap-1.5">
                  <TypePill type={yard.yardType} />
                  <StatusPill active={yard.isActive} />
                </div>
                <EntityMobileCardBody>
                  <EntityMobileField label="Address" className="col-span-2">
                    <div className="flex min-w-0 items-center gap-1.5">
                      <MapPin className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                      <span className="truncate">{yard.propertyAddress || "—"}</span>
                    </div>
                  </EntityMobileField>
                  <EntityMobileField label="Contact">
                    <div className="flex min-w-0 items-center gap-1.5">
                      <Phone className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                      <span className="truncate font-mono font-medium">
                        {yard.contactInfo || "—"}
                      </span>
                    </div>
                  </EntityMobileField>
                  <EntityMobileField label="Activities">
                    <ActivitiesBadge count={yard.ticketCount ?? yard.totalTickets ?? 0} />
                  </EntityMobileField>
                </EntityMobileCardBody>
              </EntityMobileCard>
            ))}
          </EntityMobileList>
        )}
      </div>

      {totalFiltered > 0 && onPageChange ? (
        <PaginationFooter
          totalCount={totalFiltered}
          currentPage={currentPage}
          totalPages={totalPages}
          itemsPerPage={itemsPerPage}
          onItemsPerPageChange={onItemsPerPageChange}
          showStats
          itemLabel="yards"
          onPageChange={onPageChange}
          loading={loading}
        />
      ) : null}
    </div>
  );
}
