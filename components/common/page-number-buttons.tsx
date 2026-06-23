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
              "flex h-9 w-9 select-none items-center justify-center text-[13px] font-medium text-slate-400 dark:text-neutral-600",
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
              "flex h-8 w-8 items-center justify-center rounded-lg border text-[12px] transition-all duration-150 shadow-sm",
              item === currentPage
                ? "border-[#260B0B]/25 bg-[#f8eeee] text-[#260B0B] font-semibold dark:border-[#f0c7c7]/20 dark:bg-[#260B0B]/25 dark:text-[#f0c7c7]"
                : "border-slate-200/80 bg-white font-medium text-slate-600 hover:bg-[#f8eeee] hover:text-[#260B0B] hover:border-[#260B0B]/20 dark:border-neutral-800 dark:bg-neutral-950 dark:text-neutral-400 dark:hover:bg-neutral-900 dark:hover:text-neutral-100",
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
