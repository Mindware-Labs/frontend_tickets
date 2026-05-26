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

  const safeTotalPages = Math.max(1, totalPages);

  return (
    <div className="flex flex-col gap-3 pt-2 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-center gap-2">
        <p className="text-[12px] font-medium text-slate-500">
          Showing{" "}
          <span className="font-semibold text-slate-700 dark:text-slate-200">
            {(currentPage - 1) * itemsPerPage + 1}-
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

      <div className="flex min-w-0 items-center justify-between gap-2 sm:justify-end">
        <Button
          variant="outline"
          className="h-9 shrink-0 rounded-[10px] border-border px-3.5 text-[13px] font-medium text-muted-foreground shadow-sm"
          onClick={() => onPageChange(Math.max(currentPage - 1, 1))}
          disabled={currentPage === 1}
        >
          Previous
        </Button>

        <div className="min-w-0 overflow-x-auto">
          <PageNumberButtons
            currentPage={currentPage}
            totalPages={safeTotalPages}
            onPageChange={onPageChange}
            className="min-w-max gap-1"
          />
        </div>

        <Button
          variant="outline"
          className="h-9 shrink-0 rounded-[10px] border-border px-3.5 text-[13px] font-medium text-muted-foreground shadow-sm"
          onClick={() => onPageChange(Math.min(currentPage + 1, safeTotalPages))}
          disabled={currentPage >= safeTotalPages}
        >
          Next
        </Button>
      </div>
    </div>
  );
}
