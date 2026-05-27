"use client";

import { getPaginationPageItems } from "@/lib/pagination-pages";
import { cn } from "@/lib/utils";

interface PageNumberButtonsProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  className?: string;
  buttonClassName?: string;
  activeClassName?: string;
  inactiveClassName?: string;
  ellipsisClassName?: string;
  stopPropagation?: boolean;
}

export function PageNumberButtons({
  currentPage,
  totalPages,
  onPageChange,
  className,
  buttonClassName,
  activeClassName,
  inactiveClassName,
  ellipsisClassName,
  stopPropagation = false,
}: PageNumberButtonsProps) {
  const safeTotalPages = Math.max(1, totalPages);

  return (
    <div className={cn("flex items-center justify-center gap-1.5", className)}>
      {getPaginationPageItems(currentPage, safeTotalPages).map((item, index) =>
        item === "ellipsis" ? (
          <span
            key={`ellipsis-${index}`}
            className={cn(
              "flex h-9 w-9 select-none items-center justify-center text-[13px] font-medium text-slate-400 dark:text-slate-600",
              ellipsisClassName,
            )}
          >
            ...
          </span>
        ) : (
          <button
            key={item}
            type="button"
            onClick={(event) => {
              if (stopPropagation) event.stopPropagation();
              onPageChange(item);
            }}
            className={cn(
              "flex h-9 w-9 items-center justify-center rounded-lg border text-[13px] transition-all duration-200 shadow-sm",
              item === currentPage
                ? "border-[#008f68]/20 bg-[#f0faf5] text-[#008f68] font-semibold dark:border-emerald-500/20 dark:bg-emerald-950/20 dark:text-emerald-400"
                : "border-slate-200/60 bg-white font-medium text-slate-600 hover:bg-slate-50 hover:text-slate-900 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-400 dark:hover:bg-slate-900 dark:hover:text-slate-100",
              buttonClassName,
              item === currentPage ? activeClassName : inactiveClassName,
            )}
            aria-current={item === currentPage ? "page" : undefined}
          >
            {item}
          </button>
        ),
      )}
    </div>
  );
}
