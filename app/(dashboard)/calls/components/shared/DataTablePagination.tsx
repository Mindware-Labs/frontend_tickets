"use client";

import { PageNumberButtons } from "@/components/common/page-number-buttons";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

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

  const safeTotalPages = Math.max(1, totalPages);

  return (
    <div
      className={cn(
        "flex items-center justify-between gap-2 px-1 pb-2 pt-4",
        className,
      )}
    >
      <Button
        variant="outline"
        className="h-[36px] shrink-0 rounded-[10px] border-border px-3.5 text-[13px] font-medium text-muted-foreground shadow-sm hover:text-foreground"
        onClick={() => onPageChange(Math.max(currentPage - 1, 1))}
        disabled={currentPage === 1}
      >
        <svg
          className="mr-2 h-3.5 w-3.5"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden
        >
          <path d="M19 12H5M12 19l-7-7 7-7" />
        </svg>
        Previous
      </Button>

      <div className="min-w-0 flex-1 overflow-x-auto px-2">
        <PageNumberButtons
          currentPage={currentPage}
          totalPages={safeTotalPages}
          onPageChange={onPageChange}
          className="min-w-max"
          buttonClassName="h-[36px] w-[36px]"
          ellipsisClassName="h-[36px] w-[36px]"
        />
      </div>

      <Button
        variant="outline"
        className="h-[36px] shrink-0 rounded-[10px] border-border px-3.5 text-[13px] font-medium text-muted-foreground shadow-sm hover:text-foreground"
        onClick={() => onPageChange(Math.min(currentPage + 1, safeTotalPages))}
        disabled={currentPage >= safeTotalPages}
      >
        Next
        <svg
          className="ml-2 h-3.5 w-3.5"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden
        >
          <path d="M5 12h14M12 5l7 7-7 7" />
        </svg>
      </Button>
    </div>
  );
}
