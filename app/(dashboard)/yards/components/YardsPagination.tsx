"use client";

import { PaginationFooter } from "@/components/common/pagination-footer";

interface YardsPaginationProps {
  totalCount: number;
  currentPage: number;
  totalPages: number;
  itemsPerPage: number;
  onItemsPerPageChange: (value: number) => void;
  onPageChange: (value: number) => void;
}

export function YardsPagination(props: YardsPaginationProps) {
  return <PaginationFooter {...props} itemLabel="yards" />;
}
