"use client";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { RefreshCw, Search, ListFilter, X, Trash2 } from "lucide-react";

interface PhoneLinesToolbarProps {
  search: string;
  onSearchChange: (value: string) => void;
  onRefresh: () => void;
  onCreate?: () => void;
  canCreate?: boolean;
  totalCount: number;
  selectedCount?: number;
  onClearSelection?: () => void;
  onDeleteSelected?: () => void;
}

export function PhoneLinesToolbar({
  search,
  onSearchChange,
  onRefresh,
  totalCount,
  selectedCount = 0,
  onClearSelection,
  onDeleteSelected,
}: PhoneLinesToolbarProps) {
  const hasSelection = selectedCount > 0;

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            placeholder="Search by phone number or label..."
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-10 bg-white border-slate-200 focus:border-[#008f68] focus:ring-[#008f68]"
          />
        </div>

        <Button
          variant="outline"
          className="h-10 px-4 rounded-xl text-slate-600 hover:text-slate-900 border-slate-200 shadow-none"
        >
          <ListFilter className="h-4 w-4 mr-2" />
          Filters
        </Button>

        <Button
          variant="outline"
          size="icon"
          className="h-10 w-10 rounded-xl border-slate-200 shadow-none"
          onClick={onRefresh}
        >
          <RefreshCw className="h-4 w-4" />
        </Button>

        <div className="text-sm text-slate-500 whitespace-nowrap">
          {totalCount} line{totalCount !== 1 ? "s" : ""}
        </div>
      </div>

      {hasSelection && (
        <div className="flex items-center justify-between p-3 bg-[#f0fdf8] rounded-xl border border-[#bbf7d0]">
          <div className="flex items-center gap-3">
            <Badge className="bg-[#008f68] text-white hover:bg-[#007a5a] px-3 py-1">
              {selectedCount} selected
            </Badge>
            <span className="text-sm text-slate-700 font-medium">
              {selectedCount} line{selectedCount !== 1 ? "s" : ""} selected
            </span>
          </div>

          <div className="flex items-center gap-2">
            {onDeleteSelected && (
              <Button
                variant="outline"
                size="sm"
                className="h-8 px-3 rounded-lg text-red-600 border-red-200 hover:bg-red-50 shadow-none text-xs"
                onClick={onDeleteSelected}
              >
                <Trash2 className="h-3.5 w-3.5 mr-1.5" />
                Delete Selected
              </Button>
            )}
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0 text-slate-500 hover:text-slate-700"
              onClick={onClearSelection}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
