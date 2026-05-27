"use client";

import { PaginationFooter } from "@/components/common/pagination-footer";

interface PhoneLinesPaginationProps {
  totalCount: number;
  currentPage: number;
  totalPages: number;
  itemsPerPage: number;
  onItemsPerPageChange: (value: number) => void;
  onPageChange: (value: number) => void;
}

export function PhoneLinesPagination(props: PhoneLinesPaginationProps) {
  const itemLabel = `line${props.totalCount !== 1 ? "s" : ""}`;
  return <PaginationFooter {...props} itemLabel={itemLabel} />;
}
