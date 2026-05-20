"use client";

import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search, X } from "lucide-react";

interface PhoneLinesToolbarProps {
  search: string;
  onSearchChange: (value: string) => void;
  selectedCount?: number;
  onClearSelection?: () => void;
  onDeleteSelected?: () => void;
}

export function PhoneLinesToolbar({
  search,
  onSearchChange,
  selectedCount = 0,
  onClearSelection,
  onDeleteSelected,
}: PhoneLinesToolbarProps) {
  const hasSelection = selectedCount > 0;

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center gap-2.5">
        {/* Search */}
        <div className="relative flex-1 max-w-[420px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-[14px] w-[14px] text-muted-foreground" />
          <Input
            placeholder="Search by phone number or label..."
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-[34px] pr-8 h-[30px] rounded-full text-[12.5px] bg-muted/30 border-border shadow-none focus-visible:ring-[#008f68]/30 focus-visible:border-[#008f68]/40"
          />
          <span className="absolute right-2.5 top-1/2 -translate-y-1/2 border border-border rounded px-1.5 py-[1px] text-[10px] text-muted-foreground font-mono bg-background">
            /
          </span>
        </div>
      </div>

      {/* Selection bar */}
      {hasSelection && (
        <div className="flex items-center justify-between py-2 px-3 bg-[#f0fdf8] rounded-lg border border-[#bbf7d0]">
          <div className="flex items-center gap-2.5">
            <Badge className="bg-[#008f68] text-white hover:bg-[#007a5a] px-2.5 py-0.5 text-[11px]">
              {selectedCount} selected
            </Badge>
            <span className="text-[12px] text-slate-600 font-medium">
              {selectedCount} line{selectedCount !== 1 ? "s" : ""} selected
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            {onDeleteSelected && (
              <button
                type="button"
                onClick={onDeleteSelected}
                className="h-7 px-2.5 rounded-md text-[11.5px] font-medium text-red-600 border border-red-200 bg-white hover:bg-red-50 transition-colors"
              >
                Delete
              </button>
            )}
            <button
              type="button"
              className="h-7 w-7 flex items-center justify-center rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
              onClick={onClearSelection}
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
