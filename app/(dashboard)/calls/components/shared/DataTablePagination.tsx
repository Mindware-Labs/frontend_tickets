"use client";

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
        "flex items-center justify-between pt-4 pb-2 px-1",
        className,
      )}
    >
      <Button
        variant="outline"
        className="h-[36px] px-3.5 rounded-[10px] text-[13px] font-medium text-muted-foreground shadow-sm hover:text-foreground border-border"
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

      <div className="hidden md:flex items-center justify-center gap-1.5">
        {(() => {
          const windowSize = Math.min(5, safeTotalPages);
          let startPage = 1;
          if (safeTotalPages > 5 && currentPage > 3) {
            startPage = currentPage - 2;
            if (startPage + 4 > safeTotalPages) {
              startPage = safeTotalPages - 4;
            }
          }
          const pages = Array.from(
            { length: windowSize },
            (_, i) => startPage + i,
          );
          const lastInWindow = pages[pages.length - 1];
          const showEllipsis =
            safeTotalPages > 5 && lastInWindow < safeTotalPages - 1;
          const showLastPage =
            safeTotalPages > 5 && lastInWindow < safeTotalPages;

          return (
            <>
              {pages.map((pageNum) => {
                if (pageNum <= 0 || pageNum > safeTotalPages) return null;
                const active = pageNum === currentPage;
                return (
                  <button
                    key={pageNum}
                    type="button"
                    onClick={() => onPageChange(pageNum)}
                    className={cn(
                      "flex h-[36px] w-[36px] items-center justify-center rounded-[10px] text-[13px] transition-colors",
                      active
                        ? "bg-[#e2fae9] text-[#008f68] border border-[#a6f0c3] font-semibold"
                        : "text-muted-foreground font-medium hover:bg-muted/50 border border-transparent",
                    )}
                  >
                    {pageNum}
                  </button>
                );
              })}
              {showEllipsis && (
                <span className="flex h-[36px] w-[36px] items-center justify-center text-[13px] text-muted-foreground select-none">
                  …
                </span>
              )}
              {showLastPage && (
                <button
                  type="button"
                  onClick={() => onPageChange(safeTotalPages)}
                  className={cn(
                    "flex h-[36px] w-[36px] items-center justify-center rounded-[10px] text-[13px] transition-colors",
                    currentPage === safeTotalPages
                      ? "bg-[#e2fae9] text-[#008f68] border border-[#a6f0c3] font-semibold"
                      : "text-muted-foreground font-medium hover:bg-muted/50 border border-transparent",
                  )}
                >
                  {safeTotalPages}
                </button>
              )}
            </>
          );
        })()}
      </div>

      <Button
        variant="outline"
        className="h-[36px] px-3.5 rounded-[10px] text-[13px] font-medium text-muted-foreground shadow-sm hover:text-foreground border-border"
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
