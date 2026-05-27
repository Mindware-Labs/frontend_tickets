"use client";

import { PaginationFooter } from "@/components/common/pagination-footer";

interface UsersPaginationProps {
  totalCount: number;
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export function UsersPagination({
  totalCount,
  currentPage,
  totalPages,
  onPageChange,
}: UsersPaginationProps) {
  return (
    <PaginationFooter
      totalCount={totalCount}
      currentPage={currentPage}
      totalPages={totalPages}
      onPageChange={onPageChange}
      itemLabel="users"
    />
  );
}
