"use client";

import { PaginationFooter } from "@/components/common/pagination-footer";

// Card grid renders 3 columns, so page sizes are multiples of 9 (max 50 rule).
const CARD_GRID_PAGE_SIZES = [9, 18, 27, 45];

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
  onItemsPerPageChange,
  onPageChange,
}: CampaignsPaginationProps) {
  return (
    <PaginationFooter
      totalCount={totalCount}
      currentPage={currentPage}
      totalPages={totalPages}
      itemsPerPage={itemsPerPage}
      onItemsPerPageChange={onItemsPerPageChange}
      pageSizeOptions={CARD_GRID_PAGE_SIZES}
      onPageChange={onPageChange}
      itemLabel="campaigns"
      showStats
    />
  );
}
