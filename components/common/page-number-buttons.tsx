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
              "flex h-9 w-9 select-none items-center justify-center text-[13px] font-medium text-muted-foreground",
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
              "flex h-9 w-9 items-center justify-center rounded-[10px] border text-[13px] transition-colors",
              item === currentPage
                ? "border-[#a6f0c3] bg-[#e2fae9] font-semibold text-[#008f68]"
                : "border-transparent font-medium text-muted-foreground hover:bg-muted/50",
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
