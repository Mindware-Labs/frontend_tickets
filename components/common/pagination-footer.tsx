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

interface PaginationFooterProps {
  totalCount: number;
  currentPage: number;
  totalPages: number;
  itemsPerPage: number;
  onItemsPerPageChange: (value: number) => void;
  onPageChange: (value: number) => void;
  itemLabel: string;
}

export function PaginationFooter({
  totalCount,
  currentPage,
  totalPages,
  itemsPerPage,
  onItemsPerPageChange,
  onPageChange,
  itemLabel,
}: PaginationFooterProps) {
  if (totalCount === 0) return null;

  const safeTotalPages = Math.max(1, totalPages);
  const start = (currentPage - 1) * itemsPerPage + 1;
  const end = Math.min(currentPage * itemsPerPage, totalCount);

  return (
    <div className="flex flex-col gap-3 px-2 sm:flex-row sm:items-center sm:justify-between">
      <p className="text-[12px] font-medium text-muted-foreground">
        Showing{" "}
        <span className="font-semibold text-foreground">
          {start}-{end}
        </span>{" "}
        of {totalCount} {itemLabel}
      </p>

      <div className="flex min-w-0 flex-col gap-2 sm:flex-row sm:items-center sm:justify-end">
        <Select
          value={itemsPerPage.toString()}
          onValueChange={(value) => onItemsPerPageChange(Number(value))}
        >
          <SelectTrigger className="h-8 w-[100px] rounded-lg text-[12px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="5">5 / page</SelectItem>
            <SelectItem value="10">10 / page</SelectItem>
            <SelectItem value="20">20 / page</SelectItem>
            <SelectItem value="50">50 / page</SelectItem>
          </SelectContent>
        </Select>

        <div className="flex min-w-0 items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            className="h-8 shrink-0 rounded-lg px-3 text-[12px]"
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
              className="min-w-max"
              buttonClassName="h-8 w-8 rounded-lg text-[12px]"
              ellipsisClassName="h-8 w-8 text-[12px]"
            />
          </div>

          <Button
            variant="outline"
            size="sm"
            className="h-8 shrink-0 rounded-lg px-3 text-[12px]"
            onClick={() =>
              onPageChange(Math.min(currentPage + 1, safeTotalPages))
            }
            disabled={currentPage >= safeTotalPages}
          >
            Next
          </Button>
        </div>
      </div>
    </div>
  );
}
