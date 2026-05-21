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

interface UsersPaginationProps {
  totalCount: number;
  currentPage: number;
  totalPages: number;
  itemsPerPage: number;
  onItemsPerPageChange: (value: number) => void;
  onPageChange: (page: number) => void;
}

export function UsersPagination({
  totalCount,
  currentPage,
  totalPages,
  itemsPerPage,
  onItemsPerPageChange,
  onPageChange,
}: UsersPaginationProps) {
  if (totalCount === 0) return null;

  return (
    <div className="flex flex-col gap-3 pt-2 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-center gap-2">
        <p className="text-[12px] font-medium text-slate-500">
          Showing{" "}
          <span className="font-semibold text-slate-700 dark:text-slate-200">
            {(currentPage - 1) * itemsPerPage + 1}–
            {Math.min(currentPage * itemsPerPage, totalCount)}
          </span>{" "}
          of {totalCount}
        </p>
        <Select
          value={itemsPerPage.toString()}
          onValueChange={(v) => onItemsPerPageChange(Number(v))}
        >
          <SelectTrigger className="h-8 w-[108px] rounded-lg text-[12px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="6">6 / page</SelectItem>
            <SelectItem value="9">9 / page</SelectItem>
            <SelectItem value="12">12 / page</SelectItem>
            <SelectItem value="18">18 / page</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="flex items-center justify-between gap-2 sm:justify-end">
        <Button
          variant="outline"
          className="h-9 rounded-[10px] px-3.5 text-[13px] font-medium text-muted-foreground shadow-sm border-border"
          onClick={() => onPageChange(Math.max(currentPage - 1, 1))}
          disabled={currentPage === 1}
        >
          Previous
        </Button>

        <div className="hidden items-center gap-1 md:flex">
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
                  "flex h-9 w-9 items-center justify-center rounded-[10px] text-[13px] transition-colors",
                  active
                    ? "border border-[#a6f0c3] bg-[#e2fae9] font-semibold text-[#008f68]"
                    : "font-medium text-muted-foreground hover:bg-muted/50",
                )}
              >
                {pageNum}
              </button>
            );
          })}
        </div>

        <Button
          variant="outline"
          className="h-9 rounded-[10px] px-3.5 text-[13px] font-medium text-muted-foreground shadow-sm border-border"
          onClick={() => onPageChange(Math.min(currentPage + 1, totalPages))}
          disabled={currentPage >= totalPages}
        >
          Next
        </Button>
      </div>
    </div>
  );
}
