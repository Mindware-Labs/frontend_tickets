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
    <div
      className={cn(
        "flex flex-col gap-2 pt-2 pb-2 sm:flex-row sm:items-center sm:justify-between sm:gap-3",
        className,
      )}
    >
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

            {onItemsPerPageChange && (
              <Select
                value={itemsPerPage.toString()}
                onValueChange={handlePageSizeChange}
                disabled={loading}
              >
                <SelectTrigger
                  size="sm"
                  aria-label="Rows per page"
                  className={cn(
                    "h-full gap-1 rounded-none border-0 bg-slate-50/80 px-2.5 text-[11px] font-semibold tabular-nums text-slate-700 shadow-none hover:bg-slate-100 focus-visible:ring-0 data-[size=sm]:h-full dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 [&_svg]:size-3",
                    showStats &&
                      "border-l border-slate-200/60 dark:border-slate-800",
                  )}
                >
                  <SelectValue />
                  <span className="font-normal text-slate-400 dark:text-slate-500">
                    / page
                  </span>
                </SelectTrigger>
                <SelectContent align="start" className="min-w-[64px]">
                  {sizeOptions.map((size) => (
                    <SelectItem
                      key={size}
                      value={size.toString()}
                      className="py-1 text-[11px] tabular-nums"
                    >
                      {size}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>
        </div>
      )}

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
            ellipsisClassName="h-8 w-8 text-[12px]"
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
