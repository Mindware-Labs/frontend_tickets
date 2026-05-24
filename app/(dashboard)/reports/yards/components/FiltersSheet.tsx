"use client";

import {
  Calendar,
  Check,
  ChevronsUpDown,
  Download,
  FileSpreadsheet,
  X,
  MapPin,
  AlertCircle,
  Filter,
} from "lucide-react";
import { useEffect, useState, type WheelEvent } from "react";
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
  // Popover states for auto-closing dates
  const [startPopoverOpen, setStartPopoverOpen] = useState(false);
  const [endPopoverOpen, setEndPopoverOpen] = useState(false);

  const [localStartDate, setLocalStartDate] = useState<Date | undefined>(
    undefined,
  );
  const [localEndDate, setLocalEndDate] = useState<Date | undefined>(undefined);

  const selectedYardName = selectedYardId
    ? yards.find((yard) => yard.id.toString() === selectedYardId)?.name
    : null;

  // Sync external props to local state safely
  useEffect(() => {
    setLocalStartDate(
      startDate ? new Date(startDate + "T12:00:00") : undefined,
    );
  }, [startDate]);

  useEffect(() => {
    setLocalEndDate(endDate ? new Date(endDate + "T12:00:00") : undefined);
  }, [endDate]);

  useEffect(() => {
    if (open) return;
    onYardOpenChange(false);
    setStartPopoverOpen(false);
    setEndPopoverOpen(false);
  }, [open, onYardOpenChange]);

  const handleStartSelect = (date: Date | undefined) => {
    setLocalStartDate(date);
    if (!date) {
      onStartDateChange("");
    } else {
      onStartDateChange(format(date, "yyyy-MM-dd"));
      setStartPopoverOpen(false); // Auto-close UX
    }
  };

  const handleEndSelect = (date: Date | undefined) => {
    setLocalEndDate(date);
    if (!date) {
      onEndDateChange("");
    } else {
      onEndDateChange(format(date, "yyyy-MM-dd"));
      setEndPopoverOpen(false); // Auto-close UX
    }
  };

  const handleYardSelect = (yardId: string) => {
    onYardSelect(yardId);
    onYardOpenChange(false); // Auto-close UX
  };

  const handleYardListWheel = (event: WheelEvent<HTMLDivElement>) => {
    const list = event.currentTarget;

    if (list.scrollHeight <= list.clientHeight) {
      return;
    }

    // Keep wheel scrolling inside the yard dropdown when rendered in a Sheet.
    event.preventDefault();
    event.stopPropagation();
    list.scrollTop += event.deltaY;
  };

  // Validations
  const hasDateRange = Boolean(startDate && endDate);
  const isDateRangeValid = hasDateRange
    ? new Date(startDate) <= new Date(endDate)
    : true;
  const showMissingDateAlert = Boolean(selectedYardId) && !hasDateRange;
  const isYardPopoverOpen = open && yardOpen;
  const isStartDatePopoverOpen = open && startPopoverOpen;
  const isEndDatePopoverOpen = open && endPopoverOpen;
  const formattedStartDate = localStartDate
    ? format(localStartDate, "MMM d, yyyy")
    : null;
  const formattedEndDate = localEndDate
    ? format(localEndDate, "MMM d, yyyy")
    : null;

  const handleSheetOpenChange = (nextOpen: boolean) => {
    if (!nextOpen) {
      onYardOpenChange(false);
      setStartPopoverOpen(false);
      setEndPopoverOpen(false);
    }
    onOpenChange(nextOpen);
  };

  return (
    <Sheet open={open} onOpenChange={handleSheetOpenChange}>
      <SheetContent
        side="right"
        className="flex h-full w-full flex-col gap-0 overflow-hidden border-slate-200/80 bg-[#f4f5f7] p-0 shadow-2xl sm:max-w-[460px] dark:border-slate-800 dark:bg-slate-950"
      >
        <SheetHeader className="z-10 border-b border-slate-200/80 bg-white px-4 py-3 shadow-[0_1px_3px_rgba(0,0,0,0.04)] dark:border-slate-800 dark:bg-slate-950">
          <SheetTitle className="flex items-center gap-2 text-[15px] font-semibold text-slate-900 dark:text-slate-100">
            <span className="flex size-9 items-center justify-center rounded-lg bg-[#f0faf5] text-[#008f68] dark:bg-emerald-500/10 dark:text-emerald-400">
              <Filter className="size-4" aria-hidden />
            </span>
            <div className="flex min-w-0 flex-col gap-0.5">
              <span>Report filters</span>
              <span className="text-[10px] font-semibold uppercase tracking-widest text-slate-400">
                Yard report setup
              </span>
            </div>
          </SheetTitle>
          <SheetDescription className="pl-11 text-xs leading-5 text-slate-500">
            Choose a yard and a valid date range before applying the report.
          </SheetDescription>
        </SheetHeader>

        <div className="scrollbar-app flex flex-1 flex-col gap-3 overflow-y-auto px-3 py-3">
          <div className="flex flex-col gap-3 rounded-2xl border border-slate-200/80 bg-white px-3.5 py-3 shadow-[0_1px_3px_rgba(0,0,0,0.06)] dark:border-slate-800 dark:bg-slate-950">
            <label className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-widest text-slate-400">
              <MapPin className="size-3.5 text-[#008f68]" aria-hidden />
              Location
            </label>

            <Popover
              modal
              open={isYardPopoverOpen}
              onOpenChange={(nextOpen) =>
                onYardOpenChange(open ? nextOpen : false)
              }
            >
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  aria-expanded={yardOpen}
                  className={cn(
                    "h-9 w-full justify-between rounded-lg border-transparent bg-slate-50 px-2.5 text-xs font-medium text-slate-900 shadow-none transition-colors hover:border-slate-300 hover:bg-white focus-visible:border-[#008f68] focus-visible:ring-[#008f68]/20 dark:bg-slate-900 dark:text-slate-100 dark:hover:border-slate-700",
                    !selectedYardId && "text-slate-500",
                  )}
                  disabled={loadingYards}
                >
                  <span className="truncate">
                    {selectedYardName || "Select a yard..."}
                  </span>
                  <ChevronsUpDown data-icon="inline-end" className="opacity-50" />
                </Button>
              </PopoverTrigger>

              <PopoverContent
                className="z-[60] w-[var(--radix-popover-trigger-width)] rounded-xl border-slate-200/80 p-0 shadow-xl dark:border-slate-800"
                align="start"
              >
                <Command>
                  <CommandInput
                    placeholder="Search yard..."
                    className="h-9 text-xs"
                  />
                  <CommandList
                    className="max-h-[220px]"
                    onWheel={handleYardListWheel}
                  >
                    <CommandEmpty className="py-6 text-center text-xs">
                      {loadingYards ? (
                        <span className="animate-pulse text-slate-500">
                          Loading yards...
                        </span>
                      ) : (
                        "No yard found."
                      )}
                    </CommandEmpty>
                    <CommandGroup>
                      {yards.map((yard) => (
                        <CommandItem
                          key={yard.id}
                          value={yard.name}
                          onSelect={() => handleYardSelect(yard.id.toString())}
                          className="my-0.5 cursor-pointer rounded-lg text-xs"
                        >
                          <Check
                            className={cn(
                              "mr-2 size-3.5 transition-opacity",
                              selectedYardId === yard.id.toString()
                                ? "text-[#008f68] opacity-100"
                                : "opacity-0",
                            )}
                          />
                          <span className="font-medium">{yard.name}</span>
                          {yard.commonName && (
                            <span className="ml-2 truncate text-[11px] text-slate-500">
                              ({yard.commonName})
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

          <div className="flex flex-col gap-3 rounded-2xl border border-slate-200/80 bg-white px-3.5 py-3 shadow-[0_1px_3px_rgba(0,0,0,0.06)] dark:border-slate-800 dark:bg-slate-950">
            <div className="flex items-start justify-between gap-3">
              <label className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-widest text-slate-400">
                <Calendar className="size-3.5 text-[#008f68]" aria-hidden />
                Date range
              </label>
              {hasDateRange ? (
                <span className="rounded-md border border-emerald-100 bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-[#008f68] dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-300">
                  Selected
                </span>
              ) : null}
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                  Start date
                </label>
                <Popover
                  modal
                  open={isStartDatePopoverOpen}
                  onOpenChange={(nextOpen) =>
                    setStartPopoverOpen(open ? nextOpen : false)
                  }
                >
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "h-9 w-full justify-start rounded-lg border-transparent bg-slate-50 px-2.5 text-left text-xs font-medium text-slate-900 shadow-none transition-colors hover:border-slate-300 hover:bg-white focus-visible:border-[#008f68] focus-visible:ring-[#008f68]/20 dark:bg-slate-900 dark:text-slate-100 dark:hover:border-slate-700",
                        !localStartDate && "text-slate-500",
                      )}
                    >
                      <Calendar
                        data-icon="inline-start"
                        className="text-slate-400"
                      />
                      {formattedStartDate ? (
                        <span className="truncate">{formattedStartDate}</span>
                      ) : (
                        <span>Pick a date</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent
                    className="z-[60] w-auto rounded-xl border-slate-200/80 p-0 shadow-xl dark:border-slate-800"
                    align="start"
                  >
                    <div className="flex flex-col gap-2 p-2">
                      <CalendarWidget
                        mode="single"
                        selected={localStartDate}
                        onSelect={handleStartSelect}
                        numberOfMonths={1}
                        disabled={{ after: new Date() }}
                        className="rounded-md"
                      />
                      {localStartDate && (
                        <div className="border-t border-slate-200 pt-2 dark:border-slate-800">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-full text-xs text-slate-500 hover:text-slate-900 dark:hover:text-slate-100"
                            onClick={() => handleStartSelect(undefined)}
                          >
                            <X data-icon="inline-start" />
                            Clear selection
                          </Button>
                        </div>
                      )}
                    </div>
                  </PopoverContent>
                </Popover>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                  End date
                </label>
                <Popover
                  modal
                  open={isEndDatePopoverOpen}
                  onOpenChange={(nextOpen) =>
                    setEndPopoverOpen(open ? nextOpen : false)
                  }
                >
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "h-9 w-full justify-start rounded-lg border-transparent bg-slate-50 px-2.5 text-left text-xs font-medium text-slate-900 shadow-none transition-colors hover:border-slate-300 hover:bg-white focus-visible:border-[#008f68] focus-visible:ring-[#008f68]/20 dark:bg-slate-900 dark:text-slate-100 dark:hover:border-slate-700",
                        !localEndDate && "text-slate-500",
                      )}
                    >
                      <Calendar
                        data-icon="inline-start"
                        className="text-slate-400"
                      />
                      {formattedEndDate ? (
                        <span className="truncate">{formattedEndDate}</span>
                      ) : (
                        <span>Pick a date</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent
                    className="z-[60] w-auto rounded-xl border-slate-200/80 p-0 shadow-xl dark:border-slate-800"
                    align="end"
                  >
                    <div className="flex flex-col gap-2 p-2">
                      <CalendarWidget
                        mode="single"
                        selected={localEndDate}
                        onSelect={handleEndSelect}
                        numberOfMonths={1}
                        disabled={{ after: new Date() }}
                        className="rounded-md"
                      />
                      {localEndDate && (
                        <div className="border-t border-slate-200 pt-2 dark:border-slate-800">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-full text-xs text-slate-500 hover:text-slate-900 dark:hover:text-slate-100"
                            onClick={() => handleEndSelect(undefined)}
                          >
                            <X data-icon="inline-start" />
                            Clear selection
                          </Button>
                        </div>
                      )}
                    </div>
                  </PopoverContent>
                </Popover>
              </div>
            </div>

            {hasDateRange && isDateRangeValid ? (
              <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-600 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300">
                <span className="font-semibold text-slate-900 dark:text-slate-100">
                  Range:
                </span>{" "}
                {formattedStartDate} to {formattedEndDate}
              </div>
            ) : null}

            {showMissingDateAlert && (
              <Alert className="border-sky-200 bg-sky-50/70 text-sky-900 shadow-sm dark:border-sky-900/50 dark:bg-sky-950/20 dark:text-sky-200">
                <AlertCircle className="size-4 text-sky-600 dark:text-sky-400" />
                <AlertTitle className="text-xs font-semibold">
                  Missing dates
                </AlertTitle>
                <AlertDescription className="mt-1 text-xs">
                  Select both start date and end date to generate the report.
                </AlertDescription>
              </Alert>
            )}

            {hasDateRange && !isDateRangeValid && (
              <Alert className="border-amber-200 bg-amber-50/70 text-amber-900 shadow-sm dark:border-amber-900/50 dark:bg-amber-950/20 dark:text-amber-200">
                <AlertCircle className="size-4 text-amber-600 dark:text-amber-400" />
                <AlertTitle className="text-xs font-semibold">
                  Invalid range
                </AlertTitle>
                <AlertDescription className="mt-1 text-xs">
                  Start date cannot be later than end date. Please adjust the
                  range.
                </AlertDescription>
              </Alert>
            )}
          </div>

          {canExport && (
            <div className="flex flex-col gap-3 rounded-2xl border border-emerald-100 bg-emerald-50/70 px-3.5 py-3 shadow-[0_1px_3px_rgba(0,0,0,0.04)] dark:border-emerald-500/20 dark:bg-emerald-500/10">
              <label className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-widest text-[#008f68] dark:text-emerald-300">
                <Download className="size-3.5" aria-hidden />
                Quick export
              </label>
              <div className="grid grid-cols-2 gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={onExportPDF}
                  className="h-9 rounded-lg bg-white text-xs shadow-sm transition-all hover:border-[#008f68]/50 hover:text-[#008f68] dark:bg-slate-950"
                  disabled={!hasDateRange || !isDateRangeValid}
                >
                  <Download data-icon="inline-start" />
                  PDF
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={onExportExcel}
                  className="h-9 rounded-lg bg-white text-xs shadow-sm transition-all hover:border-[#008f68]/50 hover:text-[#008f68] dark:bg-slate-950 dark:hover:text-emerald-400"
                  disabled={!hasDateRange || !isDateRangeValid}
                >
                  <FileSpreadsheet data-icon="inline-start" />
                  Excel
                </Button>
              </div>
            </div>
          )}
        </div>

        <SheetFooter className="flex-col-reverse gap-2 border-t border-slate-200/80 bg-white px-3 py-3 shadow-[0_-1px_3px_rgba(0,0,0,0.04)] sm:flex-row dark:border-slate-800 dark:bg-slate-950">
          <Button
            variant="ghost"
            onClick={() => onOpenChange(false)}
            className="h-9 w-full rounded-lg text-xs font-medium sm:w-auto sm:flex-1"
          >
            Cancel
          </Button>
          <Button
            onClick={onApplyFilters}
            className="h-9 w-full rounded-lg bg-[#008f68] text-xs font-semibold shadow-sm hover:bg-[#007a5a] sm:w-auto sm:flex-1"
            disabled={!hasDateRange || !isDateRangeValid}
          >
            <Check data-icon="inline-start" />
            Apply filters
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
