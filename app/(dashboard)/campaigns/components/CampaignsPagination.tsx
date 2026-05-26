"use client";

import { PageNumberButtons } from "@/components/common/page-number-buttons";
import { Button } from "@/components/ui/button";

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
  if (totalCount === 0) return null;

  const safeTotalPages = Math.max(1, totalPages);

  return (
    <div className="flex items-center justify-between gap-2 px-1 pb-2 pt-3">
      <Button
        variant="outline"
        className="h-8 shrink-0 rounded-lg border-border px-3 text-[12px] font-medium text-muted-foreground shadow-sm hover:text-foreground"
        onClick={() => onPageChange(Math.max(currentPage - 1, 1))}
        disabled={currentPage === 1}
      >
        Previous
      </Button>

      <div className="flex min-w-0 flex-1 flex-col items-center gap-0.5 text-center">
        <div className="w-full overflow-x-auto px-2">
          <PageNumberButtons
            currentPage={currentPage}
            totalPages={safeTotalPages}
            onPageChange={onPageChange}
            className="min-w-max"
            buttonClassName="h-8 w-8 rounded-lg text-[12px]"
            ellipsisClassName="h-8 w-8 text-[12px]"
          />
        </div>
        <span className="text-[10px] font-medium text-muted-foreground">
          {(currentPage - 1) * itemsPerPage + 1}-
          {Math.min(currentPage * itemsPerPage, totalCount)} of {totalCount}
        </span>
      </div>

      <Button
        variant="outline"
        className="h-8 shrink-0 rounded-lg border-border px-3 text-[12px] font-medium text-muted-foreground shadow-sm hover:text-foreground"
        onClick={() => onPageChange(Math.min(currentPage + 1, safeTotalPages))}
        disabled={currentPage >= safeTotalPages}
      >
        Next
      </Button>
    </div>
  );
}
