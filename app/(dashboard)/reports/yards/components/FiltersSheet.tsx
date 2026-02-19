"use client";

import {
  Building,
  Calendar,
  Check,
  ChevronsUpDown,
  Download,
  FileSpreadsheet,
  X,
} from "lucide-react";
import { useEffect, useState } from "react";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
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
import { Calendar as CalendarWidget } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import type { Yard } from "./types";

type FiltersSheetProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  yardOpen: boolean;
  onYardOpenChange: (open: boolean) => void;
  yards: Yard[];
  selectedYardId: string;
  loadingYards: boolean;
  startDate: string;
  endDate: string;
  canExport: boolean;
  onYardSelect: (yardId: string) => void;
  onStartDateChange: (value: string) => void;
  onEndDateChange: (value: string) => void;
  onExportPDF: () => void;
  onExportExcel: () => void;
  onApplyFilters: () => void;
};

export function FiltersSheet({
  open,
  onOpenChange,
  yardOpen,
  onYardOpenChange,
  yards,
  selectedYardId,
  loadingYards,
  startDate,
  endDate,
  canExport,
  onYardSelect,
  onStartDateChange,
  onEndDateChange,
  onExportPDF,
  onExportExcel,
  onApplyFilters,
}: FiltersSheetProps) {
  const selectedYardName = selectedYardId
    ? yards.find((yard) => yard.id.toString() === selectedYardId)?.name
    : null;

  const [localStartDate, setLocalStartDate] = useState<Date | undefined>(
    undefined,
  );
  const [localEndDate, setLocalEndDate] = useState<Date | undefined>(undefined);

  useEffect(() => {
    setLocalStartDate(
      startDate ? new Date(startDate + "T00:00:00") : undefined,
    );
  }, [startDate]);

  useEffect(() => {
    setLocalEndDate(endDate ? new Date(endDate + "T00:00:00") : undefined);
  }, [endDate]);

  const handleStartSelect = (date: Date | undefined) => {
    setLocalStartDate(date);
    if (!date) {
      onStartDateChange("");
      return;
    }
    onStartDateChange(date.toISOString().slice(0, 10));
  };

  const handleEndSelect = (date: Date | undefined) => {
    setLocalEndDate(date);
    if (!date) {
      onEndDateChange("");
      return;
    }
    onEndDateChange(date.toISOString().slice(0, 10));
  };

  const isDateRangeValid = (() => {
    if (!startDate || !endDate) return true;
    try {
      return new Date(startDate) <= new Date(endDate);
    } catch (e) {
      return true;
    }
  })();
  const hasDateRange = Boolean(startDate && endDate);
  const showMissingDateAlert = Boolean(selectedYardId) && !hasDateRange;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="w-full sm:max-w-lg overflow-y-auto p-6 sm:p-8"
      >
        <SheetHeader className="space-y-1.5">
          <SheetTitle className="text-xl">Configure Yard Report</SheetTitle>
          <SheetDescription className="text-sm">
            Select the yard, date range and export options.
          </SheetDescription>
        </SheetHeader>

        <div className="space-y-6 mt-1">
          <div className="space-y-2">
            <label className="text-sm font-semibold leading-none flex items-center gap-2">
              <Building className="h-4 w-4 text-primary" />
              Select Yard
            </label>

            <Popover open={yardOpen} onOpenChange={onYardOpenChange}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  aria-expanded={yardOpen}
                  className="w-full justify-between"
                  disabled={loadingYards}
                >
                  {selectedYardName || "Select a yard..."}
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>

              <PopoverContent
                className="w-[var(--radix-popover-trigger-width)] p-0"
                align="start"
              >
                <Command>
                  <CommandInput placeholder="Search yard..." />
                  <CommandList>
                    <CommandEmpty>
                      {loadingYards ? "Loading yards..." : "No yard found."}
                    </CommandEmpty>
                    <CommandGroup>
                      {yards.map((yard) => (
                        <CommandItem
                          key={yard.id}
                          value={yard.name}
                          onSelect={() => onYardSelect(yard.id.toString())}
                        >
                          <Check
                            className={cn(
                              "mr-2 h-4 w-4",
                              selectedYardId === yard.id.toString()
                                ? "opacity-100"
                                : "opacity-0",
                            )}
                          />
                          {yard.name}
                          {yard.commonName && (
                            <span className="ml-2 text-xs text-muted-foreground">
                              {yard.commonName}
                            </span>
                          )}
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
          </div>

          <div className="space-y-3">
            <label className="text-sm font-semibold leading-none flex items-center gap-2">
              <Calendar className="h-4 w-4 text-primary" />
              Date Range
            </label>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-2">
                <label className="text-xs font-medium text-muted-foreground">
                  Start Date
                </label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={`justify-start text-left font-normal w-full h-9 px-3 text-sm whitespace-nowrap ${
                        !localStartDate ? "text-muted-foreground" : ""
                      }`}
                    >
                      <Calendar className="mr-2 h-4 w-4 shrink-0" />
                      {localStartDate ? (
                        <span>{format(localStartDate, "MMM d, yyyy")}</span>
                      ) : (
                        <span>Pick a start date</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="end">
                    <div className="p-3 space-y-3">
                      <CalendarWidget
                        mode="single"
                        selected={localStartDate}
                        onSelect={handleStartSelect}
                        numberOfMonths={1}
                        disabled={{ after: new Date() }}
                        className="rounded-md"
                      />
                      {localStartDate && (
                        <div className="flex justify-end px-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 text-xs"
                            onClick={() => handleStartSelect(undefined)}
                          >
                            <X className="mr-1 h-3 w-3" />
                            Clear
                          </Button>
                        </div>
                      )}
                    </div>
                  </PopoverContent>
                </Popover>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-medium text-muted-foreground">
                  End Date
                </label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={`justify-start text-left font-normal w-full h-9 px-3 text-sm whitespace-nowrap ${
                        !localEndDate ? "text-muted-foreground" : ""
                      }`}
                    >
                      <Calendar className="mr-2 h-4 w-4 shrink-0" />
                      {localEndDate ? (
                        <span>{format(localEndDate, "MMM d, yyyy")}</span>
                      ) : (
                        <span>Pick an end date</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="end">
                    <div className="p-3 space-y-3">
                      <CalendarWidget
                        mode="single"
                        selected={localEndDate}
                        onSelect={handleEndSelect}
                        numberOfMonths={1}
                        disabled={{ after: new Date() }}
                        className="rounded-md"
                      />
                      {localEndDate && (
                        <div className="flex justify-end px-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 text-xs"
                            onClick={() => handleEndSelect(undefined)}
                          >
                            <X className="mr-1 h-3 w-3" />
                            Clear
                          </Button>
                        </div>
                      )}
                    </div>
                  </PopoverContent>
                </Popover>
              </div>
            </div>
          </div>

          {canExport && (
            <div className="space-y-3">
              <div className="border-t pt-4">
                <label className="text-sm font-semibold leading-none flex items-center gap-2 mb-3">
                  <Download className="h-4 w-4 text-primary" />
                  Export Options
                </label>
                <div className="grid gap-3">
                  <Button
                    variant="outline"
                    onClick={onExportPDF}
                    className="gap-2 w-full h-10"
                    disabled={!hasDateRange || !isDateRangeValid}
                  >
                    <Download className="w-4 h-4" />
                    Export PDF
                  </Button>
                  <Button
                    variant="outline"
                    onClick={onExportExcel}
                    className="gap-2 w-full h-10"
                    disabled={!hasDateRange || !isDateRangeValid}
                  >
                    <FileSpreadsheet className="w-4 h-4" />
                    Export Excel
                  </Button>
                </div>
              </div>
            </div>
          )}

          {showMissingDateAlert && (
            <div className="pt-4">
              <Alert className="mt-3 gap-3 border-sky-300/70 bg-sky-50/85 px-4 py-3 text-sm sm:text-base text-sky-900 shadow-lg ring-1 ring-sky-200/70 dark:border-sky-500/40 dark:bg-sky-950/35 dark:text-sky-100 dark:ring-sky-500/25">
                <AlertCircle className="h-5 w-5 text-sky-600 dark:text-sky-300" />
                <div className="space-y-1">
                  <AlertTitle className="text-base font-semibold text-sky-800 dark:text-sky-200">
                    Date range required
                  </AlertTitle>
                  <AlertDescription className="text-sm text-sky-700 dark:text-sky-100/90">
                    Select both Start Date and End Date before applying the
                    filters.
                  </AlertDescription>
                </div>
              </Alert>
            </div>
          )}

          {startDate && endDate && !isDateRangeValid && (
            <div className="pt-4">
              <Alert
                className="mt-3 gap-3 border-amber-300/70 bg-amber-50/85 px-4 py-3 text-sm sm:text-base text-amber-900 shadow-lg ring-1 ring-amber-200/70 dark:border-amber-500/40 dark:bg-amber-950/35 dark:text-amber-100 dark:ring-amber-500/25"
              >
                <AlertCircle className="h-5 w-5 text-amber-600 dark:text-amber-300" />
                <div className="space-y-1">
                  <AlertTitle className="text-base font-semibold text-amber-800 dark:text-amber-200">
                    Invalid date range
                  </AlertTitle>
                  <AlertDescription className="text-sm text-amber-700 dark:text-amber-100/90">
                    Start date ({startDate}) cannot be later than end date (
                    {endDate}). Adjust the range before applying the filters.
                  </AlertDescription>
                </div>
              </Alert>
            </div>
          )}
        </div>

        <SheetFooter className="flex-col sm:flex-row gap-3 mt-8 pt-6 border-t">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="w-full sm:w-auto sm:flex-1 h-10"
          >
            Close
          </Button>
          <Button
            onClick={onApplyFilters}
            className="gap-2 w-full sm:w-auto sm:flex-1 h-10"
            disabled={!hasDateRange || !isDateRangeValid}
          >
            <Calendar className="h-4 w-4" />
            Apply Filters
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
