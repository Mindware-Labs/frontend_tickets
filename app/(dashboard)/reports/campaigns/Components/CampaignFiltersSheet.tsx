"use client";

import {
  Calendar,
  Check,
  ChevronsUpDown,
  Download,
  FileSpreadsheet,
  X,
  AlertCircle,
  Filter,
  Megaphone,
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

type Campaign = {
  id: number;
  nombre: string;
  yarda?: { name?: string | null } | null;
  isActive?: boolean;
  tipo?: string;
  createdAt?: string;
};

type CampaignFiltersSheetProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  campaignOpen: boolean;
  onCampaignOpenChange: (open: boolean) => void;
  campaigns: Campaign[];
  selectedCampaignId: string;
  loadingCampaigns: boolean;
  startDate: string;
  endDate: string;
  canExport: boolean;
  onCampaignSelect: (campaignId: string) => void;
  onStartDateChange: (value: string) => void;
  onEndDateChange: (value: string) => void;
  onExportPDF: () => void;
  onExportExcel: () => void;
  onApplyFilters: () => void;
};

export function CampaignFiltersSheet({
  open,
  onOpenChange,
  campaignOpen,
  onCampaignOpenChange,
  campaigns,
  selectedCampaignId,
  loadingCampaigns,
  startDate,
  endDate,
  canExport,
  onCampaignSelect,
  onStartDateChange,
  onEndDateChange,
  onExportPDF,
  onExportExcel,
  onApplyFilters,
}: CampaignFiltersSheetProps) {
  const [startPopoverOpen, setStartPopoverOpen] = useState(false);
  const [endPopoverOpen, setEndPopoverOpen] = useState(false);

  const [localStartDate, setLocalStartDate] = useState<Date | undefined>(undefined);
  const [localEndDate, setLocalEndDate] = useState<Date | undefined>(undefined);

  const selectedCampaignName = selectedCampaignId
    ? campaigns.find((c) => c.id.toString() === selectedCampaignId)?.nombre
    : null;

  useEffect(() => {
    setLocalStartDate(startDate ? new Date(startDate + "T12:00:00") : undefined);
  }, [startDate]);

  useEffect(() => {
    setLocalEndDate(endDate ? new Date(endDate + "T12:00:00") : undefined);
  }, [endDate]);

  useEffect(() => {
    if (open) return;
    onCampaignOpenChange(false);
    setStartPopoverOpen(false);
    setEndPopoverOpen(false);
  }, [open, onCampaignOpenChange]);

  const handleStartSelect = (date: Date | undefined) => {
    setLocalStartDate(date);
    if (!date) {
      onStartDateChange("");
    } else {
      onStartDateChange(format(date, "yyyy-MM-dd"));
      setStartPopoverOpen(false);
    }
  };

  const handleEndSelect = (date: Date | undefined) => {
    setLocalEndDate(date);
    if (!date) {
      onEndDateChange("");
    } else {
      onEndDateChange(format(date, "yyyy-MM-dd"));
      setEndPopoverOpen(false);
    }
  };

  const handleCampaignSelect = (campaignId: string) => {
    onCampaignSelect(campaignId);
    onCampaignOpenChange(false);
  };

  const handleSheetOpenChange = (nextOpen: boolean) => {
    if (!nextOpen) {
      onCampaignOpenChange(false);
      setStartPopoverOpen(false);
      setEndPopoverOpen(false);
    }
    onOpenChange(nextOpen);
  };

  const hasDateRange = Boolean(startDate && endDate);
  const isDateRangeValid = hasDateRange
    ? new Date(startDate) <= new Date(endDate)
    : true;
  const showMissingDateAlert = Boolean(selectedCampaignId) && !hasDateRange;
  const isCampaignPopoverOpen = open && campaignOpen;
  const isStartDatePopoverOpen = open && startPopoverOpen;
  const isEndDatePopoverOpen = open && endPopoverOpen;

  return (
    <Sheet open={open} onOpenChange={handleSheetOpenChange}>
      <SheetContent
        side="right"
        className="flex h-full w-full flex-col overflow-hidden p-0 sm:max-w-lg"
      >
        <SheetHeader className="px-6 py-5 border-b bg-card/50 backdrop-blur-sm z-10">
          <SheetTitle className="flex items-center gap-2.5 text-xl font-bold">
            <div className="p-2 rounded-lg bg-primary/10 text-primary">
              <Filter className="h-5 w-5" />
            </div>
            Report Filters
          </SheetTitle>
          <SheetDescription className="ml-11 text-sm">
            Configure the parameters to generate your campaign report.
          </SheetDescription>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6">
          {/* Campaign */}
          <div className="space-y-3 rounded-xl border bg-muted/20 p-4">
            <label className="text-sm font-semibold tracking-tight flex items-center gap-2 text-foreground">
              <Megaphone className="h-4 w-4 text-primary" />
              Campaign
            </label>

            <Popover
              modal
              open={isCampaignPopoverOpen}
              onOpenChange={(nextOpen) => onCampaignOpenChange(open ? nextOpen : false)}
            >
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  aria-expanded={campaignOpen}
                  className={cn(
                    "w-full justify-between bg-background transition-colors hover:bg-muted/50",
                    !selectedCampaignId && "text-muted-foreground",
                  )}
                  disabled={loadingCampaigns}
                >
                  <span className="truncate">
                    {selectedCampaignName || "Select a campaign..."}
                  </span>
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>

              <PopoverContent
                className="z-[60] w-[var(--radix-popover-trigger-width)] p-0 rounded-xl"
                align="start"
              >
                <Command>
                  <CommandInput placeholder="Search campaign..." className="h-10" />
                  <CommandList className="max-h-[220px]">
                    <CommandEmpty className="py-6 text-center text-sm">
                      {loadingCampaigns ? (
                        <span className="animate-pulse text-muted-foreground">
                          Loading campaigns...
                        </span>
                      ) : (
                        "No campaign found."
                      )}
                    </CommandEmpty>
                    <CommandGroup>
                      {campaigns.map((c) => (
                        <CommandItem
                          key={c.id}
                          value={c.nombre}
                          onSelect={() => handleCampaignSelect(c.id.toString())}
                          className="cursor-pointer my-0.5 rounded-lg"
                        >
                          <Check
                            className={cn(
                              "mr-2 h-4 w-4 transition-opacity",
                              selectedCampaignId === c.id.toString()
                                ? "opacity-100 text-primary"
                                : "opacity-0",
                            )}
                          />
                          <span className="font-medium">{c.nombre}</span>
                          {c.yarda?.name && (
                            <span className="ml-2 text-xs text-muted-foreground truncate">
                              ({c.yarda.name})
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

          {/* Date Range */}
          <div className="space-y-4 rounded-xl border bg-muted/20 p-4">
            <label className="text-sm font-semibold tracking-tight flex items-center gap-2 text-foreground">
              <Calendar className="h-4 w-4 text-primary" />
              Date Range
            </label>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <label className="text-[13px] font-medium text-muted-foreground ml-1">
                  Start Date
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
                        "justify-start text-left font-normal w-full h-10 bg-background transition-colors hover:bg-muted/50",
                        !localStartDate && "text-muted-foreground",
                      )}
                    >
                      <Calendar className="mr-2 h-4 w-4 shrink-0 text-muted-foreground" />
                      {localStartDate ? (
                        <span className="truncate">{format(localStartDate, "MMM d, yyyy")}</span>
                      ) : (
                        <span>Pick a date</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="z-[60] w-auto p-0 rounded-xl" align="start">
                    <div className="p-3">
                      <CalendarWidget
                        mode="single"
                        selected={localStartDate}
                        onSelect={handleStartSelect}
                        numberOfMonths={1}
                        disabled={{ after: new Date() }}
                        className="rounded-md"
                      />
                      {localStartDate && (
                        <div className="flex justify-end pt-2 border-t mt-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 text-xs text-muted-foreground hover:text-foreground w-full"
                            onClick={() => handleStartSelect(undefined)}
                          >
                            <X className="mr-2 h-3.5 w-3.5" />
                            Clear selection
                          </Button>
                        </div>
                      )}
                    </div>
                  </PopoverContent>
                </Popover>
              </div>

              <div className="space-y-1.5">
                <label className="text-[13px] font-medium text-muted-foreground ml-1">
                  End Date
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
                        "justify-start text-left font-normal w-full h-10 bg-background transition-colors hover:bg-muted/50",
                        !localEndDate && "text-muted-foreground",
                      )}
                    >
                      <Calendar className="mr-2 h-4 w-4 shrink-0 text-muted-foreground" />
                      {localEndDate ? (
                        <span className="truncate">{format(localEndDate, "MMM d, yyyy")}</span>
                      ) : (
                        <span>Pick a date</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="z-[60] w-auto p-0 rounded-xl" align="end">
                    <div className="p-3">
                      <CalendarWidget
                        mode="single"
                        selected={localEndDate}
                        onSelect={handleEndSelect}
                        numberOfMonths={1}
                        disabled={{ after: new Date() }}
                        className="rounded-md"
                      />
                      {localEndDate && (
                        <div className="flex justify-end pt-2 border-t mt-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 text-xs text-muted-foreground hover:text-foreground w-full"
                            onClick={() => handleEndSelect(undefined)}
                          >
                            <X className="mr-2 h-3.5 w-3.5" />
                            Clear selection
                          </Button>
                        </div>
                      )}
                    </div>
                  </PopoverContent>
                </Popover>
              </div>
            </div>

            {showMissingDateAlert && (
              <Alert className="mt-2 border-sky-200 bg-sky-50/50 text-sky-900 shadow-sm dark:border-sky-900/50 dark:bg-sky-950/20 dark:text-sky-200">
                <AlertCircle className="h-4 w-4 text-sky-600 dark:text-sky-400" />
                <AlertTitle className="text-sm font-semibold">Missing Dates</AlertTitle>
                <AlertDescription className="text-xs mt-1">
                  Select both Start Date and End Date to generate the report.
                </AlertDescription>
              </Alert>
            )}

            {hasDateRange && !isDateRangeValid && (
              <Alert className="mt-2 border-amber-200 bg-amber-50/50 text-amber-900 shadow-sm dark:border-amber-900/50 dark:bg-amber-950/20 dark:text-amber-200">
                <AlertCircle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                <AlertTitle className="text-sm font-semibold">Invalid Range</AlertTitle>
                <AlertDescription className="text-xs mt-1">
                  Start date cannot be later than end date. Please adjust the range.
                </AlertDescription>
              </Alert>
            )}
          </div>

          {canExport && (
            <div className="space-y-3 rounded-xl border border-primary/10 bg-primary/5 p-4">
              <label className="text-sm font-semibold tracking-tight flex items-center gap-2 text-primary">
                <Download className="h-4 w-4" />
                Quick Export
              </label>
              <div className="grid grid-cols-2 gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={onExportPDF}
                  className="gap-2 h-10 bg-background hover:border-primary/50 hover:text-primary transition-all"
                  disabled={!hasDateRange || !isDateRangeValid}
                >
                  <Download className="w-4 h-4" />
                  PDF
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={onExportExcel}
                  className="gap-2 h-10 bg-background hover:border-emerald-500/50 hover:text-emerald-600 dark:hover:text-emerald-400 transition-all"
                  disabled={!hasDateRange || !isDateRangeValid}
                >
                  <FileSpreadsheet className="w-4 h-4" />
                  Excel
                </Button>
              </div>
            </div>
          )}
        </div>

        <SheetFooter className="px-6 py-4 border-t bg-card/50 backdrop-blur-sm flex-col-reverse sm:flex-row gap-3">
          <Button
            variant="ghost"
            onClick={() => onOpenChange(false)}
            className="w-full sm:w-auto sm:flex-1 h-11 font-medium"
          >
            Cancel
          </Button>
          <Button
            onClick={onApplyFilters}
            className="gap-2 w-full sm:w-auto sm:flex-1 h-11 font-semibold shadow-md"
            disabled={!selectedCampaignId || !hasDateRange || !isDateRangeValid}
          >
            <Check className="h-4 w-4" />
            Apply Filters
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
