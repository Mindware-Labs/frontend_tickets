"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, RefreshCw, Search } from "lucide-react";

interface PhoneLinesToolbarProps {
  search: string;
  onSearchChange: (value: string) => void;
  onRefresh: () => void;
  onCreate?: () => void;
  canCreate?: boolean;
  totalCount: number;
}

export function PhoneLinesToolbar({
  search,
  onSearchChange,
  onRefresh,
  onCreate,
  canCreate = true,
  totalCount,
}: PhoneLinesToolbarProps) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
      <div className="flex items-center gap-2">
        <div className="relative">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search lines..."
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-9 w-56"
          />
        </div>
        <span className="text-sm text-muted-foreground hidden sm:block">
          {totalCount} line{totalCount !== 1 ? "s" : ""}
        </span>
      </div>

      <div className="flex items-center gap-2">
        <Button variant="outline" size="sm" onClick={onRefresh}>
          <RefreshCw className="h-4 w-4" />
        </Button>
        {canCreate && onCreate && (
          <Button size="sm" onClick={onCreate}>
            <Plus className="h-4 w-4 mr-1" />
            New Line
          </Button>
        )}
      </div>
    </div>
  );
}
