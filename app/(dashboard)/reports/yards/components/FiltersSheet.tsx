"use client";

import {
  Calendar,
  Check,
  ChevronsUpDown,
  Download,
  FileSpreadsheet,
  Loader2,
  X,
  MapPin,
  AlertCircle,
  Filter,
} from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
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
  onApplyFilters: (start?: string, end?: string) => void;
  isExportingPdf?: boolean;
  isExportingExcel?: boolean;
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
  isExportingPdf = false,
  isExportingExcel = false,
}: FiltersSheetProps) {
  // Popover states for auto-closing dates
  const [startPopoverOpen, setStartPopoverOpen] = useState(false);
  const [endPopoverOpen, setEndPopoverOpen] = useState(false);
  const [activePreset, setActivePreset] = useState<string | null>(null);

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
    setStartPopoverOpen(false);
    setActivePreset(null);
  };

  const handleEndSelect = (date: Date | undefined) => {
    setLocalEndDate(date);
    setEndPopoverOpen(false);
    setActivePreset(null);
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
  const hasDateRange = Boolean(localStartDate && localEndDate);
  const isDateRangeValid = hasDateRange && localStartDate && localEndDate
    ? localStartDate <= localEndDate
    : true;
  const showMissingDateAlert = Boolean(selectedYardId) && !hasDateRange;


  const presetBtn = (active: boolean) =>
    cn(
      "flex flex-col items-start text-left w-full px-2.5 py-1.5 rounded-xl border transition-all",
      active
        ? "border-emerald-300 bg-emerald-50 dark:border-emerald-600/50 dark:bg-emerald-500/10"
        : "border-slate-100 bg-slate-50/60 hover:bg-slate-100 hover:border-slate-200 dark:border-neutral-800 dark:bg-neutral-900/40 dark:hover:bg-neutral-900/80",
    );
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
        className="flex h-full w-full flex-col gap-0 overflow-hidden border-slate-200/80 bg-[#f4f5f7] p-0 shadow-2xl sm:max-w-[460px] dark:border-neutral-800 dark:bg-neutral-950"
      >
        <SheetHeader className="z-10 border-b border-slate-200/80 bg-white px-4 py-3 shadow-[0_1px_3px_rgba(0,0,0,0.04)] dark:border-neutral-800 dark:bg-neutral-950">
          <SheetTitle className="flex items-center gap-2 text-[15px] font-semibold text-slate-900 dark:text-neutral-100">
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
          <div className="flex flex-col gap-3 rounded-2xl border border-slate-200/80 bg-white px-3.5 py-3 shadow-[0_1px_3px_rgba(0,0,0,0.06)] dark:border-neutral-800 dark:bg-neutral-950">
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
                    "h-9 w-full justify-between rounded-lg border-transparent bg-slate-50 px-2.5 text-xs font-medium text-slate-900 shadow-none transition-colors hover:border-slate-300 hover:bg-white focus-visible:border-[#008f68] focus-visible:ring-[#008f68]/20 dark:bg-neutral-900 dark:text-neutral-100 dark:hover:border-neutral-700",
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
                className="z-[60] w-[var(--radix-popover-trigger-width)] rounded-xl border-slate-200/80 p-0 shadow-xl dark:border-neutral-800"
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

          <div className="flex flex-col gap-3 rounded-2xl border border-slate-200/80 bg-white px-3.5 py-3 shadow-[0_1px_3px_rgba(0,0,0,0.06)] dark:border-neutral-800 dark:bg-neutral-950">
            <div className="flex items-center justify-between gap-3">
              <label className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-slate-400">
                <Calendar className="size-3.5 text-[#008f68]" aria-hidden />
                Date range
              </label>
              {hasDateRange ? (
                <span className="rounded-full border border-emerald-250 bg-emerald-50/50 px-2.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-[#008f68] dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-300">
                  Selected
                </span>
              ) : null}
            </div>

            {/* Date Shortcuts Grid */}
            <TooltipProvider delayDuration={300}>
            <div className="grid grid-cols-3 gap-2 pt-1">
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    type="button"
                    className={presetBtn(activePreset === "allTime")}
                    onClick={() => {
                      const today = new Date();
                      let start = new Date(2026, 0, 1);
                      const selectedYard = yards.find((y) => y.id.toString() === selectedYardId);
                      if (selectedYard?.createdAt) {
                        const parsed = new Date(selectedYard.createdAt);
                        if (!isNaN(parsed.getTime())) start = parsed;
                      }
                      setLocalStartDate(start);
                      setLocalEndDate(today);
                      setActivePreset("allTime");
                    }}
                  >
                    <span className={cn("text-[12px] font-semibold leading-tight", activePreset === "allTime" ? "text-[#008f68] dark:text-emerald-400" : "text-slate-800 dark:text-neutral-200")}>All time</span>
                    <span className="text-[8px] font-bold uppercase tracking-wider text-slate-400 mt-0.5">YARD HISTORY</span>
                  </button>
                </TooltipTrigger>
                <TooltipContent side="top" className="text-xs">
                  From yard start date → today
                </TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    type="button"
                    className={presetBtn(activePreset === "last7")}
                    onClick={() => {
                      const today = new Date();
                      const start = new Date();
                      start.setDate(today.getDate() - 7);
                      setLocalStartDate(start);
                      setLocalEndDate(today);
                      setActivePreset("last7");
                    }}
                  >
                    <span className={cn("text-[12px] font-semibold leading-tight", activePreset === "last7" ? "text-[#008f68] dark:text-emerald-400" : "text-slate-800 dark:text-neutral-200")}>Last 7 days</span>
                    <span className="text-[8px] font-bold uppercase tracking-wider text-slate-400 mt-0.5">RECENT ACTIVITY</span>
                  </button>
                </TooltipTrigger>
                <TooltipContent side="top" className="text-xs">
                  {format(new Date(new Date().setDate(new Date().getDate() - 7)), "MMM d")} → {format(new Date(), "MMM d, yyyy")}
                </TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    type="button"
                    className={presetBtn(activePreset === "last30")}
                    onClick={() => {
                      const today = new Date();
                      const start = new Date();
                      start.setDate(today.getDate() - 30);
                      setLocalStartDate(start);
                      setLocalEndDate(today);
                      setActivePreset("last30");
                    }}
                  >
                    <span className={cn("text-[12px] font-semibold leading-tight", activePreset === "last30" ? "text-[#008f68] dark:text-emerald-400" : "text-slate-800 dark:text-neutral-200")}>Last 30 days</span>
                    <span className="text-[8px] font-bold uppercase tracking-wider text-slate-400 mt-0.5">ROLLING MONTH</span>
                  </button>
                </TooltipTrigger>
                <TooltipContent side="top" className="text-xs">
                  {format(new Date(new Date().setDate(new Date().getDate() - 30)), "MMM d")} → {format(new Date(), "MMM d, yyyy")}
                </TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    type="button"
                    className={presetBtn(activePreset === "thisMonth")}
                    onClick={() => {
                      const today = new Date();
                      const start = new Date(today.getFullYear(), today.getMonth(), 1);
                      setLocalStartDate(start);
                      setLocalEndDate(today);
                      setActivePreset("thisMonth");
                    }}
                  >
                    <span className={cn("text-[12px] font-semibold leading-tight", activePreset === "thisMonth" ? "text-[#008f68] dark:text-emerald-400" : "text-slate-800 dark:text-neutral-200")}>This month</span>
                    <span className="text-[8px] font-bold uppercase tracking-wider text-slate-400 mt-0.5">MONTH TO DATE</span>
                  </button>
                </TooltipTrigger>
                <TooltipContent side="top" className="text-xs">
                  {format(new Date(new Date().getFullYear(), new Date().getMonth(), 1), "MMM d")} → {format(new Date(), "MMM d, yyyy")}
                </TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    type="button"
                    className={presetBtn(activePreset === "lastMonth")}
                    onClick={() => {
                      const today = new Date();
                      const start = new Date(today.getFullYear(), today.getMonth() - 1, 1);
                      const end = new Date(today.getFullYear(), today.getMonth(), 0);
                      setLocalStartDate(start);
                      setLocalEndDate(end);
                      setActivePreset("lastMonth");
                    }}
                  >
                    <span className={cn("text-[12px] font-semibold leading-tight", activePreset === "lastMonth" ? "text-[#008f68] dark:text-emerald-400" : "text-slate-800 dark:text-neutral-200")}>Last month</span>
                    <span className="text-[8px] font-bold uppercase tracking-wider text-slate-400 mt-0.5">PREVIOUS MONTH</span>
                  </button>
                </TooltipTrigger>
                <TooltipContent side="top" className="text-xs">
                  {format(new Date(new Date().getFullYear(), new Date().getMonth() - 1, 1), "MMM d")} → {format(new Date(new Date().getFullYear(), new Date().getMonth(), 0), "MMM d, yyyy")}
                </TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    type="button"
                    className={presetBtn(activePreset === "ytd")}
                    onClick={() => {
                      const today = new Date();
                      const start = new Date(today.getFullYear(), 0, 1);
                      setLocalStartDate(start);
                      setLocalEndDate(today);
                      setActivePreset("ytd");
                    }}
                  >
                    <span className={cn("text-[12px] font-semibold leading-tight", activePreset === "ytd" ? "text-[#008f68] dark:text-emerald-400" : "text-slate-800 dark:text-neutral-200")}>YTD</span>
                    <span className="text-[8px] font-bold uppercase tracking-wider text-slate-400 mt-0.5">YEAR TO DATE</span>
                  </button>
                </TooltipTrigger>
                <TooltipContent side="top" className="text-xs">
                  {format(new Date(new Date().getFullYear(), 0, 1), "MMM d")} → {format(new Date(), "MMM d, yyyy")}
                </TooltipContent>
              </Tooltip>
            </div>
            </TooltipProvider>

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
                        "h-9 w-full justify-start rounded-lg border-transparent bg-slate-50 px-2.5 text-left text-xs font-medium text-slate-900 shadow-none transition-colors hover:border-slate-300 hover:bg-white focus-visible:border-[#008f68] focus-visible:ring-[#008f68]/20 dark:bg-neutral-900 dark:text-neutral-100 dark:hover:border-neutral-700",
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
                    className="z-[60] w-auto rounded-xl border-slate-200/80 p-0 shadow-xl dark:border-neutral-800"
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
                        <div className="border-t border-slate-200 pt-2 dark:border-neutral-800">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-full text-xs text-slate-500 hover:text-slate-900 dark:hover:text-neutral-100"
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
                        "h-9 w-full justify-start rounded-lg border-transparent bg-slate-50 px-2.5 text-left text-xs font-medium text-slate-900 shadow-none transition-colors hover:border-slate-300 hover:bg-white focus-visible:border-[#008f68] focus-visible:ring-[#008f68]/20 dark:bg-neutral-900 dark:text-neutral-100 dark:hover:border-neutral-700",
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
                    className="z-[60] w-auto rounded-xl border-slate-200/80 p-0 shadow-xl dark:border-neutral-800"
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
                        <div className="border-t border-slate-200 pt-2 dark:border-neutral-800">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-full text-xs text-slate-500 hover:text-slate-900 dark:hover:text-neutral-100"
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
              <div className="rounded-xl border border-slate-200/80 bg-slate-50/40 px-3.5 py-2.5 text-xs text-slate-700 dark:border-neutral-800 dark:bg-neutral-900/40 dark:text-neutral-300">
                <span className="font-bold text-slate-900 dark:text-neutral-100">
                  Range:
                </span>{" "}
                {formattedStartDate} to {formattedEndDate}
              </div>
            ) : null}

            {!selectedYardId && (
              <Alert className="border-amber-200 bg-amber-50/70 text-amber-900 shadow-sm dark:border-amber-900/50 dark:bg-amber-950/20 dark:text-amber-200">
                <AlertCircle className="size-4 text-amber-600 dark:text-amber-400" />
                <AlertTitle className="text-xs font-semibold">
                  Yard selection required
                </AlertTitle>
                <AlertDescription className="mt-1 text-xs">
                  Please select a yard from the Location dropdown to view the report and enable filters.
                </AlertDescription>
              </Alert>
            )}

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
                  className="h-9 rounded-lg bg-white text-xs shadow-sm transition-all hover:border-[#008f68]/50 hover:text-[#008f68] dark:bg-neutral-950"
                  disabled={!hasDateRange || !isDateRangeValid || isExportingPdf}
                  aria-busy={isExportingPdf}
                >
                  {isExportingPdf ? (
                    <Loader2 className="animate-spin" data-icon="inline-start" />
                  ) : (
                    <Download data-icon="inline-start" />
                  )}
                  {isExportingPdf ? "Preparing…" : "PDF"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={onExportExcel}
                  className="h-9 rounded-lg bg-white text-xs shadow-sm transition-all hover:border-[#008f68]/50 hover:text-[#008f68] dark:bg-neutral-950 dark:hover:text-emerald-400"
                  disabled={!hasDateRange || !isDateRangeValid || isExportingExcel}
                  aria-busy={isExportingExcel}
                >
                  {isExportingExcel ? (
                    <Loader2 className="animate-spin" data-icon="inline-start" />
                  ) : (
                    <FileSpreadsheet data-icon="inline-start" />
                  )}
                  {isExportingExcel ? "Preparing…" : "Excel"}
                </Button>
              </div>
            </div>
          )}
        </div>

        <SheetFooter className="flex-col-reverse gap-2 border-t border-slate-200/80 bg-white px-3 py-3 shadow-[0_-1px_3px_rgba(0,0,0,0.04)] sm:flex-row dark:border-neutral-800 dark:bg-neutral-950">
          <Button
            variant="ghost"
            onClick={() => onOpenChange(false)}
            className="h-9 w-full rounded-lg text-xs font-medium sm:w-auto sm:flex-1"
          >
            Cancel
          </Button>
          <Button
            onClick={() => {
              onApplyFilters(
                localStartDate ? format(localStartDate, "yyyy-MM-dd") : "",
                localEndDate ? format(localEndDate, "yyyy-MM-dd") : ""
              );
            }}
            className="h-9 w-full rounded-lg bg-[#008f68] text-xs font-semibold shadow-sm hover:bg-[#007a5a] sm:w-auto sm:flex-1"
            disabled={!selectedYardId || !hasDateRange || !isDateRangeValid}
          >
            <Check data-icon="inline-start" />
            Apply filters
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
