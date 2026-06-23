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
  "h-8 shrink-0 rounded-lg border border-slate-200/80 bg-white px-3 text-[12px] font-medium text-slate-600 shadow-sm hover:bg-[#f8eeee] hover:text-[#260B0B] hover:border-[#260B0B]/20 active:bg-[#f8eeee] dark:border-neutral-800 dark:bg-neutral-950 dark:text-neutral-400 dark:hover:bg-neutral-900 dark:hover:text-neutral-100 flex items-center gap-1.5 transition-colors duration-150";

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
    <div
      className={cn(
        "flex flex-col gap-3 pt-2 pb-2 sm:flex-row sm:items-center sm:justify-between",
        className,
      )}
    >
      {/* ── Left: stats + rows-per-page ── */}
      <div className="flex items-center justify-center gap-2 sm:justify-start">
        {showStats && (
          <div className="flex h-8 items-center overflow-hidden rounded-lg border border-slate-200/80 bg-white px-2.5 shadow-sm dark:border-neutral-800 dark:bg-neutral-950">
            <p className="flex items-center whitespace-nowrap text-[12px] tabular-nums dark:text-neutral-400">
              <span className="font-semibold text-[#260B0B] dark:text-[#f0c7c7]">
                {start}–{end}
              </span>
              <span className="ml-1 font-medium text-slate-500">
                of {totalCount} {itemLabel}
              </span>
            </p>
          </div>
        )}

        {onItemsPerPageChange && (
          <Select
            value={itemsPerPage.toString()}
            onValueChange={(value) => onItemsPerPageChange(Number(value))}
            disabled={loading}
          >
            <SelectTrigger className="h-8 w-[100px] rounded-lg border border-slate-200/80 bg-white text-[12px] font-medium text-slate-600 shadow-sm hover:border-[#260B0B]/30 hover:text-[#260B0B] focus:border-[#260B0B] focus:ring-2 focus:ring-[#260B0B]/15 dark:border-neutral-800 dark:bg-neutral-950 dark:text-neutral-400 dark:hover:border-neutral-700 transition-colors duration-150">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="5">5 / page</SelectItem>
              <SelectItem value="10">10 / page</SelectItem>
              <SelectItem value="20">20 / page</SelectItem>
              <SelectItem value="50">50 / page</SelectItem>
            </SelectContent>
          </Select>
        )}
      </div>

      {/* ── Right: pager ── */}
      <div className="flex items-center justify-center gap-1.5 sm:justify-end">
            <Button
              variant="outline"
              size="sm"
              className={navButtonClass}
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
                ellipsisClassName="h-8 w-8 text-[12px] text-slate-400"
                stopPropagation
              />
            </div>

            <Button
              variant="outline"
              size="sm"
              className={navButtonClass}
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
