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
  /** Page-size choices offered in the "Rows" selector (max 50 by product rule). */
  pageSizeOptions?: number[];
  onPageChange: (value: number) => void;
  itemLabel?: string;
  className?: string;
  loading?: boolean;
  showStats?: boolean;
}

const DEFAULT_PAGE_SIZE_OPTIONS = [10, 20, 30, 50];

const navButtonClass =
  "h-8 shrink-0 rounded-lg border border-slate-200/60 bg-white px-2.5 text-[12px] font-medium text-slate-600 shadow-sm hover:bg-slate-50 hover:text-slate-900 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-400 dark:hover:bg-slate-900 dark:hover:text-slate-100 flex items-center gap-1.5";

export function PaginationFooter({
  totalCount,
  currentPage,
  totalPages,
  itemsPerPage = 10,
  onItemsPerPageChange,
  pageSizeOptions = DEFAULT_PAGE_SIZE_OPTIONS,
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
  // Always include the current value so non-standard defaults (e.g. 9 in card
  // grids) render correctly in the trigger.
  const sizeOptions = Array.from(
    new Set([...pageSizeOptions, itemsPerPage]),
  ).sort((a, b) => a - b);

  const handlePageSizeChange = (value: string) => {
    onItemsPerPageChange?.(Number(value));
    onPageChange(1);
  };

  return (
    <div className={cn("flex flex-col gap-3 pt-2 pb-2", className)}>
      {showStats && (
        <p className="text-[12px] font-medium text-slate-500 dark:text-neutral-400 text-center">
          Showing{" "}
          <span className="font-semibold text-slate-900 dark:text-neutral-200">
            {start}-{end}
          </span>{" "}
          of {totalCount} {itemLabel}
        </p>
      )}

      {/* ── Left: stats + rows-per-page as one unified pill ── */}
      {(showStats || onItemsPerPageChange) && (
        <div className="flex items-center justify-center sm:justify-start">
          <div className="flex h-8 items-stretch overflow-hidden rounded-lg border border-slate-200/60 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-950">
            {showStats && (
              <p className="flex items-center whitespace-nowrap px-2.5 text-[12px] font-medium tabular-nums text-slate-500 dark:text-slate-400">
                <span className="font-semibold text-slate-900 dark:text-slate-200">
                  {start}–{end}
                </span>
                <span className="ml-1">
                  of {totalCount} {itemLabel}
                </span>
              </p>
            )}
          </div>

          {onItemsPerPageChange && (
            <div className="flex justify-center sm:justify-start">
              <Select
                value={itemsPerPage.toString()}
                onValueChange={(value) => onItemsPerPageChange(Number(value))}
                disabled={loading}
              >
                <SelectTrigger className="h-8 w-[100px] rounded-lg border border-slate-200/60 bg-white text-[12px] font-medium text-slate-600 hover:border-slate-300 dark:border-neutral-800 dark:bg-neutral-950 dark:text-neutral-400 dark:hover:border-neutral-700 shadow-sm">
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

          {/* ── Right: pager ── */}
          <div className="flex items-center justify-center gap-1.5 sm:justify-end">
            <Button
              variant="outline"
              size="sm"
              className="h-8 shrink-0 rounded-lg border border-slate-200/60 bg-white px-3 text-[12px] font-medium text-slate-600 shadow-sm hover:bg-slate-50 hover:text-slate-900 dark:border-neutral-800 dark:bg-neutral-950 dark:text-neutral-400 dark:hover:bg-neutral-900 dark:hover:text-neutral-100 flex items-center gap-1.5"
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

            <div className="min-w-0 overflow-x-auto px-1 flex justify-center">
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
              className="h-8 shrink-0 rounded-lg border border-slate-200/60 bg-white px-3 text-[12px] font-medium text-slate-600 shadow-sm hover:bg-slate-50 hover:text-slate-900 dark:border-neutral-800 dark:bg-neutral-950 dark:text-neutral-400 dark:hover:bg-neutral-900 dark:hover:text-neutral-100 flex items-center gap-1.5"
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

      )};
    </div>
  );
}
