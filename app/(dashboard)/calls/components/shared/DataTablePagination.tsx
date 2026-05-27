"use client";

import { PaginationFooter } from "@/components/common/pagination-footer";

export interface DataTablePaginationProps {
  currentPage: number;
  totalPages: number;
  totalCount: number;
  onPageChange: (page: number) => void;
  className?: string;
}

export function DataTablePagination({
  currentPage,
  totalPages,
  totalCount,
  onPageChange,
  className,
}: DataTablePaginationProps) {
  if (totalCount <= 0) return null;

  return (
    <PaginationFooter
      totalCount={totalCount}
      currentPage={currentPage}
      totalPages={totalPages}
      onPageChange={onPageChange}
      showStats={false}
      className={className}
    />
  );
}
