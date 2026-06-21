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
import { Mail, Pencil, Phone, Trash2 } from "lucide-react";
import {
  EntityLoadingSpinner,
  TableLoadingRow,
} from "@/components/shared/entity-loading-state";
import { TableYardBadges } from "@/components/entity-table-badges";
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
  onItemsPerPageChange?: (value: number) => void;
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
  onItemsPerPageChange,
  totalPages = 1,
}: LandlordsTableProps) {
  const showActions = canManage && Boolean(onEdit || onDelete);
  const isEmpty = !loading && totalFiltered === 0;

  function RowActions({ landlord }: { landlord: Landlord }) {
    if (!showActions) return null;
    return (
      <>
        {onEdit && (
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
        {onDelete && (
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
                <TableHead className={cn(entityTableHeadClass, "w-[26%] max-w-[260px] pl-4")}>
                  Landlord
                </TableHead>
                <TableHead className={cn(entityTableHeadClass, "w-[26%] max-w-[240px]")}>
                  Email
                </TableHead>
                <TableHead className={cn(entityTableHeadClass, "min-w-[130px]")}>
                  Phone
                </TableHead>
                <TableHead className={cn(entityTableHeadClass, "w-[22%] max-w-[220px]")}>
                  Yards
                </TableHead>
                {showActions && (
                  <TableHead className={entityTableActionsHeadClass}>Actions</TableHead>
                )}
              </TableRow>
            </TableHeader>

            <TableBody>
              {loading ? (
                <TableLoadingRow colSpan={showActions ? 5 : 4} kind="landlords" />
              ) : isEmpty ? (
                <TableRow>
                  <TableCell
                    colSpan={showActions ? 5 : 4}
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
                      className={entityTableRowClass(i, Boolean(onRowClick))}
                    >
                      <TableCell className={cn(entityTableCellClass, "max-w-0 overflow-hidden pl-4")}>
                        <div className="flex min-w-0 items-center gap-2.5">
                          <LandlordMark className="h-8 w-8" />
                          <p
                            className="min-w-0 flex-1 truncate text-[13px] font-bold leading-tight text-foreground"
                            title={landlord.name}
                          >
                            {landlord.name || "Unknown"}
                          </p>
                        </div>
                      </TableCell>

                      <TableCell className={cn(entityTableCellClass, "max-w-0 overflow-hidden")}>
                        <div className="flex min-w-0 items-center gap-1.5">
                          <Mail className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                          <span className="min-w-0 flex-1 truncate" title={landlord.email}>
                            {landlord.email || "—"}
                          </span>
                        </div>
                      </TableCell>

                      <TableCell className={entityTableCellClass}>
                        <div className="flex items-center gap-1.5">
                          <Phone className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                          <span className="font-mono font-medium">
                            {landlord.phone || "—"}
                          </span>
                        </div>
                      </TableCell>

                      <TableCell className={cn(entityTableCellClass, "max-w-0 overflow-hidden")}>
                        <TableYardBadges
                          yards={yardNames.map((name, index) => ({
                            id: index,
                            name,
                          }))}
                        />
                      </TableCell>

                      {showActions && (
                        <TableCell
                          className={entityTableActionsCellClass}
                          onClick={(e) => e.stopPropagation()}
                        >
                          <div className="flex items-center justify-end gap-0.5">
                            <RowActions landlord={landlord} />
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
          <div className="flex items-center justify-center rounded-xl border border-slate-200/80 bg-white py-10 dark:border-neutral-800 dark:bg-card">
            <EntityLoadingSpinner kind="landlords" size="sm" />
          </div>
        ) : isEmpty ? (
          <div className="rounded-xl border border-slate-200/80 bg-white py-10 text-center text-sm text-muted-foreground dark:border-neutral-800 dark:bg-card">
            No landlords found.
          </div>
        ) : (
          <EntityMobileList>
            {landlords.map((landlord) => {
              const yardNames = getYardLabels(landlord, yards);
              return (
                <EntityMobileCard
                  key={landlord.id}
                  onClick={onRowClick ? () => onRowClick(landlord) : undefined}
                >
                  <EntityMobileCardHeader
                    mark={<LandlordMark className="h-8 w-8 shrink-0" />}
                    title={landlord.name || "Unknown"}
                    actions={<RowActions landlord={landlord} />}
                  />
                  <EntityMobileCardBody>
                    <EntityMobileField label="Email">
                      <div className="flex min-w-0 items-center gap-1.5">
                        <Mail className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                        <span className="truncate">{landlord.email || "—"}</span>
                      </div>
                    </EntityMobileField>
                    <EntityMobileField label="Phone">
                      <div className="flex items-center gap-1.5">
                        <Phone className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                        <span className="font-mono font-medium">
                          {landlord.phone || "—"}
                        </span>
                      </div>
                    </EntityMobileField>
                    <EntityMobileField label="Yards" className="col-span-2">
                      <TableYardBadges
                        yards={yardNames.map((name, index) => ({
                          id: index,
                          name,
                        }))}
                      />
                    </EntityMobileField>
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
          onItemsPerPageChange={onItemsPerPageChange}
          showStats
          itemLabel="landlords"
          onPageChange={onPageChange}
          loading={loading}
        />
      ) : null}
    </div>
  );
}
