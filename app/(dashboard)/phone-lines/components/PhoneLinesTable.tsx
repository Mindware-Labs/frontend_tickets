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
import { Pencil, RotateCcw, Trash2 } from "lucide-react";
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
  onRestore?: (line: PhoneLine) => void;
  canManage?: boolean;
  currentPage?: number;
  onPageChange?: (page: number) => void;
  itemsPerPage?: number;
  totalPages?: number;
}

function StatusPill({ active }: { active: boolean }) {
  return active ? (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-[3px] rounded-full text-[11px] font-semibold border bg-[#dcfce7] text-[#15803d] border-[#bbf7d0] dark:bg-emerald-500/15 dark:text-emerald-400 dark:border-emerald-500/30">
      <span className="w-[6px] h-[6px] rounded-full bg-[#22c55e] shrink-0" />
      Active
    </span>
  ) : (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-[3px] rounded-full text-[11px] font-semibold border bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-500/15 dark:text-slate-400 dark:border-slate-500/30">
      <span className="w-[6px] h-[6px] rounded-full bg-slate-400 shrink-0" />
      Inactive
    </span>
  );
}

function formatCreated(value: string) {
  return new Date(value).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function PhoneLinesTable({
  loading,
  lines,
  totalFiltered,
  onRowClick,
  onEdit,
  onDelete,
  onRestore,
  canManage = true,
  currentPage = 1,
  onPageChange,
  itemsPerPage = 10,
  totalPages = 1,
}: PhoneLinesTableProps) {
  const showActions = canManage && Boolean(onEdit || onDelete || onRestore);

  function RowActions({ line }: { line: PhoneLine }) {
    if (!showActions) return null;
    return (
      <>
        {onEdit && (
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
        {onDelete && (
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-muted-foreground hover:bg-red-50 hover:text-red-600"
            title="Archive line"
            aria-label="Archive line"
            onClick={() => onDelete(line)}
          >
            <Trash2 className="h-4 w-4 pointer-events-none" />
          </Button>
        )}
        {onRestore && (
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-muted-foreground hover:bg-[#f0faf5] hover:text-[#008f68]"
            title="Restore line"
            aria-label="Restore line"
            onClick={() => onRestore(line)}
          >
            <RotateCcw className="h-4 w-4 pointer-events-none" />
          </Button>
        )}
      </>
    );
  }

  const isEmpty = !loading && totalFiltered === 0;

  return (
    <div className="entity-table-root">
      {/* Desktop / tablet: table */}
      <div className="entity-table-frame hidden lg:block">
        <div className="entity-table-scroll">
          <Table className="relative w-full table-fixed">
            <TableHeader className={entityTableHeaderClass}>
              <TableRow className={entityTableHeaderRowClass}>
                <TableHead className={cn(entityTableHeadClass, "w-[32%] max-w-[280px] pl-4")}>
                  Phone line
                </TableHead>
                <TableHead className={cn(entityTableHeadClass, "w-[28%] max-w-[220px]")}>
                  Label
                </TableHead>
                <TableHead className={cn(entityTableHeadClass, "w-[14%]")}>
                  Status
                </TableHead>
                <TableHead className={cn(entityTableHeadClass, "w-[18%]")}>
                  Created
                </TableHead>
                {showActions && (
                  <TableHead className={entityTableActionsHeadClass}>Actions</TableHead>
                )}
              </TableRow>
            </TableHeader>

            <TableBody>
              {loading ? (
                <TableLoadingRow colSpan={showActions ? 5 : 4} kind="phone-lines" />
              ) : isEmpty ? (
                <TableRow>
                  <TableCell
                    colSpan={showActions ? 5 : 4}
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
                    className={entityTableRowClass(i, Boolean(onRowClick))}
                  >
                    <TableCell className={cn(entityTableCellClass, "max-w-0 overflow-hidden pl-4")}>
                      <div className="flex min-w-0 items-center gap-2.5">
                        <PhoneLineMark className="h-8 w-8" />
                        <p
                          className="min-w-0 flex-1 truncate font-mono text-[13px] font-bold leading-tight text-foreground"
                          title={formatPhoneDisplay(line.phoneNumber)}
                        >
                          {formatPhoneDisplay(line.phoneNumber)}
                        </p>
                      </div>
                    </TableCell>

                    <TableCell className={cn(entityTableCellClass, "max-w-0 overflow-hidden")}>
                      {line.label ? (
                        <p className="truncate font-medium text-slate-700 dark:text-slate-300" title={line.label}>
                          {line.label}
                        </p>
                      ) : (
                        <span className="italic text-slate-400">No label</span>
                      )}
                    </TableCell>

                    <TableCell className={entityTableCellClass}>
                      <StatusPill active={line.isActive} />
                    </TableCell>

                    <TableCell className={cn(entityTableCellClass, "font-mono text-slate-500")}>
                      {formatCreated(line.createdAt)}
                    </TableCell>

                    {showActions && (
                      <TableCell
                        className={entityTableActionsCellClass}
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div className="flex items-center justify-end gap-0.5">
                          <RowActions line={line} />
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
          <div className="flex items-center justify-center rounded-xl border border-slate-200/80 bg-white py-10 dark:border-slate-800 dark:bg-card">
            <EntityLoadingSpinner kind="phone-lines" size="sm" />
          </div>
        ) : isEmpty ? (
          <div className="rounded-xl border border-slate-200/80 bg-white py-10 text-center text-sm text-muted-foreground dark:border-slate-800 dark:bg-card">
            No phone lines found.
          </div>
        ) : (
          <EntityMobileList>
            {lines.map((line) => (
              <EntityMobileCard
                key={line.id}
                onClick={onRowClick ? () => onRowClick(line) : undefined}
              >
                <EntityMobileCardHeader
                  mark={<PhoneLineMark className="h-8 w-8 shrink-0" />}
                  title={
                    <span className="font-mono">
                      {formatPhoneDisplay(line.phoneNumber)}
                    </span>
                  }
                  subtitle={line.label || "No label"}
                  actions={<RowActions line={line} />}
                />
                <EntityMobileCardBody>
                  <EntityMobileField label="Status">
                    <StatusPill active={line.isActive} />
                  </EntityMobileField>
                  <EntityMobileField label="Created">
                    <span className="font-mono text-slate-500">
                      {formatCreated(line.createdAt)}
                    </span>
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
          onPageChange={onPageChange}
          loading={loading}
        />
      ) : null}
    </div>
  );
}
