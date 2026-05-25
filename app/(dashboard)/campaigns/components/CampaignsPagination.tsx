"use client";

import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

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
  if (totalCount === 0) return null;

  return (
    <div className="flex items-center justify-between px-1 pb-2 pt-3">
      <Button
        variant="outline"
        className="h-8 rounded-lg border-border px-3 text-[12px] font-medium text-muted-foreground shadow-sm hover:text-foreground"
        onClick={() => onPageChange(Math.max(currentPage - 1, 1))}
        disabled={currentPage === 1}
      >
        Previous
      </Button>

      <div className="flex flex-col items-center gap-0.5 text-center">
        <div className="hidden items-center justify-center gap-1 md:flex">
          {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
            let pageNum = i + 1;
            if (totalPages > 5 && currentPage > 3) {
              pageNum = currentPage - 2 + i;
              if (pageNum > totalPages) pageNum = totalPages - 4 + i;
            }
            if (pageNum <= 0 || pageNum > totalPages) return null;
            const active = pageNum === currentPage;
            return (
              <button
                key={pageNum}
                type="button"
                onClick={() => onPageChange(pageNum)}
                className={cn(
                  "flex h-8 w-8 items-center justify-center rounded-lg text-[12px] transition-colors",
                  active
                    ? "border border-[#a6f0c3] bg-[#e2fae9] font-semibold text-[#008f68]"
                    : "border border-transparent font-medium text-muted-foreground hover:bg-muted/50",
                )}
              >
                {pageNum}
              </button>
            );
          })}
        </div>
        <span className="text-[10px] font-medium text-muted-foreground">
          {(currentPage - 1) * itemsPerPage + 1}–{Math.min(currentPage * itemsPerPage, totalCount)} of {totalCount}
        </span>
      </div>

      <Button
        variant="outline"
        className="h-8 rounded-lg border-border px-3 text-[12px] font-medium text-muted-foreground shadow-sm hover:text-foreground"
        onClick={() => onPageChange(Math.min(currentPage + 1, totalPages))}
        disabled={currentPage >= totalPages}
      >
        Next
      </Button>
    </div>
  );
}