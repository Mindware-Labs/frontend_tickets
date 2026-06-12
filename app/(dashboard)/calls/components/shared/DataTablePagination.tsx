"use client";

import { PaginationFooter } from "@/components/common/pagination-footer";

export interface DataTablePaginationProps {
  currentPage: number;
  totalPages: number;
  totalCount: number;
  onPageChange: (page: number) => void;
  itemsPerPage?: number;
  onItemsPerPageChange?: (value: number) => void;
  itemLabel?: string;
  showStats?: boolean;
  className?: string;
}

export function DataTablePagination({
  currentPage,
  totalPages,
  totalCount,
  onPageChange,
  itemsPerPage,
  onItemsPerPageChange,
  itemLabel,
  showStats = false,
  className,
}: DataTablePaginationProps) {
  if (totalCount <= 0) return null;

  return (
    <PaginationFooter
      totalCount={totalCount}
      currentPage={currentPage}
      totalPages={totalPages}
      itemsPerPage={itemsPerPage}
      onItemsPerPageChange={onItemsPerPageChange}
      itemLabel={itemLabel}
      onPageChange={onPageChange}
      showStats={showStats}
      className={className}
    />
  );
}
