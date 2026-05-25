"use client";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  filterSelectContentClassName,
  filterSelectItemClassName,
  filterSelectTriggerClassName,
} from "@/components/filters/filter-select-styles";
import { Plus } from "lucide-react";

interface YardsFiltersProps {
  typeFilter: string;
  statusFilter: string;
  onTypeChange: (value: string) => void;
  onStatusChange: (value: string) => void;
  onCreate?: () => void;
  canCreate?: boolean;
}

export function YardsFilters({
  typeFilter,
  statusFilter,
  onTypeChange,
  onStatusChange,
  onCreate,
  canCreate = true,
}: YardsFiltersProps) {
  return (
    <div className="w-52 flex-shrink-0 space-y-3">
      <div>
        <h1 className="text-xl font-bold tracking-tight">Yards</h1>
        <p className="text-xs text-muted-foreground">Manage all yards</p>
      </div>

      {canCreate && onCreate && (
        <Button onClick={onCreate} className="w-full" size="sm">
          <Plus className="mr-2 h-4 w-4" />
          New Yard
        </Button>
      )}

      <div className="space-y-2">
        <h3 className="text-xs font-semibold">Filters</h3>

        <div className="space-y-1.5">
          <Label className="text-xs">Type</Label>
          <Select value={typeFilter} onValueChange={onTypeChange}>
            <SelectTrigger className={filterSelectTriggerClassName}>
              <SelectValue placeholder="All types" />
            </SelectTrigger>
            <SelectContent className={filterSelectContentClassName}>
              <SelectItem className={filterSelectItemClassName} value="all">All types</SelectItem>
              <SelectItem className={filterSelectItemClassName} value="SAAS">SaaS</SelectItem>
              <SelectItem className={filterSelectItemClassName} value="FULL_SERVICE">Full Service</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          <Label className="text-xs">Status</Label>
          <Select value={statusFilter} onValueChange={onStatusChange}>
            <SelectTrigger className={filterSelectTriggerClassName}>
              <SelectValue placeholder="All statuses" />
            </SelectTrigger>
            <SelectContent className={filterSelectContentClassName}>
              <SelectItem className={filterSelectItemClassName} value="all">All statuses</SelectItem>
              <SelectItem className={filterSelectItemClassName} value="active">Active</SelectItem>
              <SelectItem className={filterSelectItemClassName} value="inactive">Inactive</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
}
