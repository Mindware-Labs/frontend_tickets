"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Check,
  ChevronsUpDown,
  CalendarDays,
  Download,
  FileSpreadsheet,
  Loader2,
  SlidersHorizontal,
  AlertCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  filterSelectContentClassName,
  filterSelectItemClassName,
  filterSelectSearchInputClassName,
  filterSelectTriggerClassName,
} from "@/components/filters/filter-select-styles";
import type { Landlord } from "../../../landlords/types";

interface YardOption {
  id: number;
  label: string;
}

interface LandlordFiltersSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  landlords: Landlord[];
  selectedLandlordId: string;
  landlordOpen: boolean;
  onLandlordOpenChange: (open: boolean) => void;
  onLandlordSelect: (id: string) => void;
  yardOptions: YardOption[];
  reportYardId: string;
  onReportYardIdChange: (v: string) => void;
  startDate: string;
  endDate: string;
  onStartDateChange: (v: string) => void;
  onEndDateChange: (v: string) => void;
  canExport: boolean;
  reportLoading: boolean;
  onGenerate: () => void;
  onExportPDF: () => void;
  onExportExcel: () => void;
}

export function LandlordFiltersSheet({
  open,
  onOpenChange,
  landlords,
  selectedLandlordId,
  landlordOpen,
  onLandlordOpenChange,
  onLandlordSelect,
  yardOptions,
  reportYardId,
  onReportYardIdChange,
  startDate,
  endDate,
  onStartDateChange,
  onEndDateChange,
  canExport,
  reportLoading,
  onGenerate,
  onExportPDF,
  onExportExcel,
}: LandlordFiltersSheetProps) {
  const [yardSearch, setYardSearch] = useState("");
  const isDateRangeValid = !startDate || !endDate || new Date(startDate) <= new Date(endDate);
  const canGenerate = Boolean(selectedLandlordId && startDate && endDate && isDateRangeValid);
  const filteredYardOptions = useMemo(() => {
    const term = yardSearch.trim().toLowerCase();
    if (!term) return yardOptions;
    return yardOptions.filter((yard) => yard.label.toLowerCase().includes(term));
  }, [yardSearch, yardOptions]);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full max-w-sm flex flex-col gap-0 p-0">
        <SheetHeader className="px-6 pt-6 pb-4 border-b">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <SlidersHorizontal className="h-5 w-5 text-primary" />
            </div>
            <div>
              <SheetTitle className="text-base">Configure Report</SheetTitle>
              <SheetDescription className="text-xs mt-0.5">
                Select landlord, yard, and date range
              </SheetDescription>
            </div>
          </div>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
          {/* Landlord */}
          <div className="space-y-2">
            <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Landlord <span className="text-destructive">*</span>
            </label>
            <Popover open={landlordOpen} onOpenChange={onLandlordOpenChange}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  aria-expanded={landlordOpen}
                  className="w-full justify-between font-normal"
                >
                  {selectedLandlordId
                    ? (landlords.find((l) => l.id.toString() === selectedLandlordId)?.name ?? "Select landlord")
                    : "Select landlord"}
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-full p-0" align="start">
                <Command>
                  <CommandInput placeholder="Search landlord..." />
                  <CommandList>
                    <CommandEmpty>No landlord found.</CommandEmpty>
                    <CommandGroup>
                      {landlords.map((l) => (
                        <CommandItem
                          key={l.id}
                          value={l.name}
                          onSelect={() => onLandlordSelect(l.id.toString())}
                        >
                          <Check
                            className={cn(
                              "mr-2 h-4 w-4",
                              selectedLandlordId === l.id.toString() ? "opacity-100" : "opacity-0",
                            )}
                          />
                          {l.name}
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
          </div>

          {/* Yard */}
          <div className="space-y-2">
            <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Yard
            </label>
            <Select value={reportYardId} onValueChange={onReportYardIdChange} disabled={!selectedLandlordId}>
              <SelectTrigger className={filterSelectTriggerClassName}>
                <SelectValue placeholder="All yards" />
              </SelectTrigger>
              <SelectContent className={filterSelectContentClassName}>
                <div className="p-1">
                  <Input
                    value={yardSearch}
                    onChange={(event) => setYardSearch(event.target.value)}
                    onClick={(event) => event.stopPropagation()}
                    onKeyDown={(event) => event.stopPropagation()}
                    placeholder="Search yards..."
                    className={filterSelectSearchInputClassName}
                  />
                </div>
                <SelectItem className={filterSelectItemClassName} value="all">All yards</SelectItem>
                {filteredYardOptions.map((y) => (
                  <SelectItem className={filterSelectItemClassName} key={y.id} value={y.id.toString()}>
                    {y.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Date range */}
          <div className="space-y-2">
            <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Date Range <span className="text-destructive">*</span>
            </label>
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <p className="text-[11px] text-muted-foreground">From</p>
                <div className="relative">
                  <CalendarDays className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="date"
                    className="pl-9"
                    value={startDate}
                    onChange={(e) => onStartDateChange(e.target.value)}
                  />
                </div>
              </div>
              <div className="space-y-1">
                <p className="text-[11px] text-muted-foreground">To</p>
                <div className="relative">
                  <CalendarDays className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="date"
                    className="pl-9"
                    value={endDate}
                    onChange={(e) => onEndDateChange(e.target.value)}
                  />
                </div>
              </div>
            </div>
            {!isDateRangeValid && (
              <div className="flex items-center gap-1.5 text-xs text-destructive">
                <AlertCircle className="h-3.5 w-3.5" />
                Start date cannot be after end date.
              </div>
            )}
          </div>

          {/* Export */}
          {canExport && (
            <div className="space-y-2 pt-2 border-t">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Export
              </p>
              <div className="grid grid-cols-2 gap-2">
                <Button
                  variant="outline"
                  onClick={() => { onExportPDF(); onOpenChange(false); }}
                  className="gap-2 hover:bg-rose-50 hover:text-rose-600 hover:border-rose-200"
                >
                  <Download className="h-4 w-4" />
                  PDF
                </Button>
                <Button
                  variant="outline"
                  onClick={() => { onExportExcel(); onOpenChange(false); }}
                  className="gap-2 hover:bg-emerald-50 hover:text-emerald-600 hover:border-emerald-200"
                >
                  <FileSpreadsheet className="h-4 w-4" />
                  Excel
                </Button>
              </div>
            </div>
          )}
        </div>

        <div className="px-6 py-4 border-t bg-muted/20">
          <Button
            className="w-full gap-2"
            onClick={() => { onGenerate(); onOpenChange(false); }}
            disabled={!canGenerate || reportLoading}
          >
            {reportLoading ? (
              <><Loader2 className="h-4 w-4 animate-spin" /> Generating...</>
            ) : (
              <><SlidersHorizontal className="h-4 w-4" /> Generate Report</>
            )}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
