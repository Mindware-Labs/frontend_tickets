"use client";

import { PaginationFooter } from "@/components/common/pagination-footer";

interface LandlordsPaginationProps {
  totalCount: number;
  currentPage: number;
  totalPages: number;
  itemsPerPage: number;
  onItemsPerPageChange: (value: number) => void;
  onPageChange: (value: number) => void;
}

export function LandlordsPagination(props: LandlordsPaginationProps) {
  return <PaginationFooter {...props} itemLabel="landlords" />;
}
