"use client";

import { PageNumberButtons } from "@/components/common/page-number-buttons";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

interface PaginationFooterProps {
  totalCount: number;
  currentPage: number;
  totalPages: number;
  itemsPerPage?: number;
  onItemsPerPageChange?: (value: number) => void;
  onPageChange: (value: number) => void;
  itemLabel?: string;
  className?: string;
  loading?: boolean;
  showStats?: boolean;
}

export function PaginationFooter({
  totalCount,
  currentPage,
  totalPages,
  itemsPerPage = 10,
  onItemsPerPageChange,
  onPageChange,
  itemLabel = "items",
  className,
  loading = false,
  showStats = false,
}: PaginationFooterProps) {
  if (totalCount === 0) return null;

  const safeTotalPages = Math.max(1, totalPages);
  const start = (currentPage - 1) * itemsPerPage + 1;
  const end = Math.min(currentPage * itemsPerPage, totalCount);

  return (
    <div className={cn("flex flex-col gap-3 pt-2 pb-2", className)}>
      {showStats && (
        <p className="text-[12px] font-medium text-slate-500 dark:text-slate-400 text-center">
          Showing{" "}
          <span className="font-semibold text-slate-900 dark:text-slate-200">
            {start}-{end}
          </span>{" "}
          of {totalCount} {itemLabel}
        </p>
      )}

      {onItemsPerPageChange && (
        <div className="flex justify-center sm:justify-start">
          <Select
            value={itemsPerPage.toString()}
            onValueChange={(value) => onItemsPerPageChange(Number(value))}
            disabled={loading}
          >
            <SelectTrigger className="h-8 w-[100px] rounded-lg border border-slate-200/60 bg-white text-[12px] font-medium text-slate-600 hover:border-slate-300 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-400 dark:hover:border-slate-700 shadow-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="5">5 / page</SelectItem>
              <SelectItem value="10">10 / page</SelectItem>
              <SelectItem value="20">20 / page</SelectItem>
              <SelectItem value="50">50 / page</SelectItem>
            </SelectContent>
          </Select>
        </div>
      )}

      <div className="flex items-center justify-between w-full">
        <Button
          variant="outline"
          size="sm"
          className="h-8 shrink-0 rounded-lg border border-slate-200/60 bg-white px-3 text-[12px] font-medium text-slate-600 shadow-sm hover:bg-slate-50 hover:text-slate-900 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-400 dark:hover:bg-slate-900 dark:hover:text-slate-100 flex items-center gap-1.5"
          onClick={() => onPageChange(Math.max(currentPage - 1, 1))}
          disabled={currentPage === 1 || loading}
        >
          <svg
            className="h-3 w-3 shrink-0"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden
          >
            <path d="M19 12H5M12 19l-7-7 7-7" />
          </svg>
          Previous
        </Button>

        <div className="min-w-0 flex-1 overflow-x-auto px-2 flex justify-center">
          <PageNumberButtons
            currentPage={currentPage}
            totalPages={safeTotalPages}
            onPageChange={onPageChange}
            className="min-w-max"
            buttonClassName="h-8 w-8 rounded-lg text-[12px]"
            ellipsisClassName="h-8 w-8 text-[12px]"
            stopPropagation
          />
        </div>

        <Button
          variant="outline"
          size="sm"
          className="h-8 shrink-0 rounded-lg border border-slate-200/60 bg-white px-3 text-[12px] font-medium text-slate-600 shadow-sm hover:bg-slate-50 hover:text-slate-900 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-400 dark:hover:bg-slate-900 dark:hover:text-slate-100 flex items-center gap-1.5"
          onClick={() =>
            onPageChange(Math.min(currentPage + 1, safeTotalPages))
          }
          disabled={currentPage >= safeTotalPages || loading}
        >
          Next
          <svg
            className="h-3 w-3 shrink-0"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden
          >
            <path d="M5 12h14M12 5l7 7-7 7" />
          </svg>
        </Button>
      </div>
    </div>
  );
}
