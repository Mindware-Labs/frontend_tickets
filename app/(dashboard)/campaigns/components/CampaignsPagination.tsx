"use client";

import { PaginationFooter } from "@/components/common/pagination-footer";

interface CampaignsPaginationProps {
  totalCount: number;
  currentPage: number;
  totalPages: number;
  itemsPerPage: number;
  onItemsPerPageChange: (value: number) => void;
  onPageChange: (page: number) => void;
}

export function CampaignsPagination({
  totalCount,
  currentPage,
  totalPages,
  itemsPerPage,
  onPageChange,
}: CampaignsPaginationProps) {
  return (
    <PaginationFooter
      totalCount={totalCount}
      currentPage={currentPage}
      totalPages={totalPages}
      itemsPerPage={itemsPerPage}
      onPageChange={onPageChange}
      itemLabel="campaigns"
    />
  );
}
