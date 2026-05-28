"use client";

import { useEffect, useState } from "react";
import { format } from "date-fns";
import { Calendar, Check, Clock, Globe, Landmark, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar as CalendarWidget } from "@/components/ui/calendar";
import { useAircall } from "@/components/providers/AircallProvider";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import {
  createCustomDashboardPeriod,
  parseCustomDashboardPeriod,
} from "../dashboard-filters";
import { useSupportDashboardData } from "../use-dashboard-real-data";

type PresetOption = {
  key: string;
  label: string;
  description: string;
  icon: typeof Calendar;
};

const PRESETS: PresetOption[] = [
  {
    key: "today",
    label: "Today",
    description: "View real-time data and activity for the current day only.",
    icon: Clock,
  },
  {
    key: "7d",
    label: "Last 7 Days",
    description: "Ideal for monitoring recent weekly operational performance.",
    icon: Clock,
  },
  {
    key: "30d",
    label: "Monthly (Last 30 Days)",
    description: "Recommended default interval for full operational analysis.",
    icon: Calendar,
  },
  {
    key: "90d",
    label: "Last 90 Days",
    description: "Evaluate medium-term volume and revenue trends.",
    icon: Landmark,
  },
  {
    key: "all",
    label: "All Time",
    description: "Visualize the entire historical record of calls and tickets.",
    icon: Globe,
  },
];

type DashboardPeriodModalProps = {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
};

export function DashboardPeriodModal({
  isOpen,
  onOpenChange,
}: DashboardPeriodModalProps) {
  const { period, setPeriod } = useSupportDashboardData();
  const { setSheetOpen } = useAircall();
  const [selectedPeriod, setSelectedPeriod] = useState<string>(period);
  const [customStartDate, setCustomStartDate] = useState("");
  const [customEndDate, setCustomEndDate] = useState("");
  const [startPopoverOpen, setStartPopoverOpen] = useState(false);
  const [endPopoverOpen, setEndPopoverOpen] = useState(false);

  useEffect(() => {
    if (isOpen) {
      const customPeriod = parseCustomDashboardPeriod(period);
      setSelectedPeriod(customPeriod ? "custom" : period);
      setCustomStartDate(customPeriod?.start || "");
      setCustomEndDate(customPeriod?.end || "");
    }
  }, [isOpen, period]);

  useEffect(() => {
    if (!isOpen) {
      setStartPopoverOpen(false);
      setEndPopoverOpen(false);
    }
    setSheetOpen(isOpen);
    return () => setSheetOpen(false);
  }, [isOpen, setSheetOpen]);

  const localStartDate = customStartDate
    ? new Date(customStartDate + "T12:00:00")
    : undefined;
  const localEndDate = customEndDate
    ? new Date(customEndDate + "T12:00:00")
    : undefined;
  const formattedStartDate = localStartDate
    ? format(localStartDate, "MMM d, yyyy")
    : null;
  const formattedEndDate = localEndDate
    ? format(localEndDate, "MMM d, yyyy")
    : null;

  const hasCustomRange = Boolean(customStartDate && customEndDate);
  const isCustomRangeValid =
    !hasCustomRange || customStartDate <= customEndDate;
  const canApply =
    selectedPeriod !== "custom" || (hasCustomRange && isCustomRangeValid);

  const handleApply = () => {
    if (selectedPeriod === "custom") {
      setPeriod(createCustomDashboardPeriod(customStartDate, customEndDate));
    } else {
      setPeriod(selectedPeriod);
    }
    onOpenChange(false);
  };

  return (
    <Sheet open={isOpen} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="flex h-full w-full flex-col gap-0 overflow-hidden border-slate-200/80 bg-[#f4f5f7] p-0 shadow-2xl sm:max-w-[460px] dark:border-slate-800 dark:bg-slate-950"
      >
        <SheetHeader className="z-10 border-b border-slate-200/80 bg-white px-4 py-3 shadow-[0_1px_3px_rgba(0,0,0,0.04)] dark:border-slate-800 dark:bg-slate-950">
          <SheetTitle className="flex items-center gap-2 text-[15px] font-semibold text-slate-900 dark:text-slate-100">
            <span className="flex size-9 items-center justify-center rounded-lg bg-[#f0faf5] text-[#008f68] dark:bg-emerald-500/10 dark:text-emerald-400">
              <Calendar className="size-4" aria-hidden />
            </span>
            <div className="flex min-w-0 flex-col gap-0.5">
              <span>Filter by Period</span>
              <span className="text-[10px] font-semibold uppercase tracking-widest text-slate-400">
                DASHBOARD TIME RANGES
              </span>
            </div>
          </SheetTitle>
          <SheetDescription className="pl-11 text-xs leading-5 text-slate-500">
            Choose the time range used by the dashboard metrics and charts.
          </SheetDescription>
        </SheetHeader>

        <div className="scrollbar-app flex flex-1 flex-col gap-3 overflow-y-auto px-3 py-3">
          <div className="flex flex-col gap-3 rounded-2xl border border-slate-200/80 bg-white px-3.5 py-3 shadow-[0_1px_3px_rgba(0,0,0,0.06)] dark:border-slate-800 dark:bg-slate-950">
            <label className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-widest text-slate-400">
              <Calendar className="size-3.5 text-[#008f68]" aria-hidden />
              Period presets
            </label>

            <div className="flex flex-col gap-2">
              {PRESETS.map((option) => {
                const isSelected = selectedPeriod === option.key;
                const Icon = option.icon;

                return (
                  <button
                    key={option.key}
                    type="button"
                    onClick={() => setSelectedPeriod(option.key)}
                    className={cn(
                      "group relative flex w-full cursor-pointer items-start gap-3 rounded-xl border p-3 text-left outline-none transition-colors duration-200 focus-visible:ring-2 focus-visible:ring-[#008f68]/25",
                      isSelected
                        ? "border-[#008f68] bg-[#f0faf5]/50 shadow-[0_2px_8px_rgba(0,143,104,0.06)] dark:border-emerald-500/40 dark:bg-emerald-500/5"
                        : "border-slate-200/60 bg-slate-50/60 hover:border-slate-300 hover:bg-white dark:border-slate-800 dark:bg-slate-900/40 dark:hover:border-slate-700 dark:hover:bg-slate-900/80",
                    )}
                  >
                    <div
                      className={cn(
                        "flex size-8 shrink-0 items-center justify-center rounded-lg transition-colors",
                        isSelected
                          ? "bg-[#008f68] text-white dark:bg-emerald-500"
                          : "bg-slate-100 text-slate-400 group-hover:bg-slate-200/70 dark:bg-slate-900 dark:group-hover:bg-slate-800",
                      )}
                    >
                      <Icon className="size-4" aria-hidden />
                    </div>

                    <div className="min-w-0 flex-1 pr-6">
                      <p
                        className={cn(
                          "text-xs font-semibold transition-colors",
                          isSelected
                            ? "text-[#008f68] dark:text-emerald-400"
                            : "text-slate-800 dark:text-slate-200",
                        )}
                      >
                        {option.label}
                      </p>
                      <p className="mt-0.5 text-[11px] leading-normal text-slate-500 dark:text-slate-400">
                        {option.description}
                      </p>
                    </div>

                    {isSelected ? (
                      <div className="absolute right-3.5 top-1/2 -translate-y-1/2 animate-in fade-in zoom-in-75 text-[#008f68] duration-150 dark:text-emerald-400">
                        <Check className="size-4 stroke-[2.5]" aria-hidden />
                      </div>
                    ) : null}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex flex-col gap-3 rounded-2xl border border-slate-200/80 bg-white px-3.5 py-3 shadow-[0_1px_3px_rgba(0,0,0,0.06)] dark:border-slate-800 dark:bg-slate-950">
            <label className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-widest text-slate-400">
              <Calendar className="size-3.5 text-[#008f68]" aria-hidden />
              Custom range
            </label>

            <button
              type="button"
              onClick={() => setSelectedPeriod("custom")}
              className={cn(
                "group relative flex w-full cursor-pointer items-start gap-3 rounded-xl border p-3 text-left outline-none transition-colors duration-200 focus-visible:ring-2 focus-visible:ring-[#008f68]/25",
                selectedPeriod === "custom"
                  ? "border-[#008f68] bg-[#f0faf5]/50 shadow-[0_2px_8px_rgba(0,143,104,0.06)] dark:border-emerald-500/40 dark:bg-emerald-500/5"
                  : "border-slate-200/60 bg-slate-50/60 hover:border-slate-300 hover:bg-white dark:border-slate-800 dark:bg-slate-900/40 dark:hover:border-slate-700 dark:hover:bg-slate-900/80",
              )}
            >
              <div
                className={cn(
                  "flex size-8 shrink-0 items-center justify-center rounded-lg transition-colors",
                  selectedPeriod === "custom"
                    ? "bg-[#008f68] text-white dark:bg-emerald-500"
                    : "bg-slate-100 text-slate-400 group-hover:bg-slate-200/70 dark:bg-slate-900 dark:group-hover:bg-slate-800",
                )}
              >
                <Calendar className="size-4" aria-hidden />
              </div>
              <div className="min-w-0 flex-1 pr-6">
                <p
                  className={cn(
                    "text-xs font-semibold transition-colors",
                    selectedPeriod === "custom"
                      ? "text-[#008f68] dark:text-emerald-400"
                      : "text-slate-800 dark:text-slate-200",
                  )}
                >
                  Custom dates
                </p>
                <p className="mt-0.5 text-[11px] leading-normal text-slate-500 dark:text-slate-400">
                  Choose exact start and end dates for dashboard reporting.
                </p>
              </div>
              {selectedPeriod === "custom" ? (
                <div className="absolute right-3.5 top-1/2 -translate-y-1/2 animate-in fade-in zoom-in-75 text-[#008f68] duration-150 dark:text-emerald-400">
                  <Check className="size-4 stroke-[2.5]" aria-hidden />
                </div>
              ) : null}
            </button>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                  Start date
                </label>
                <Popover
                  modal
                  open={startPopoverOpen}
                  onOpenChange={(nextOpen) =>
                    setStartPopoverOpen(isOpen ? nextOpen : false)
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
                        onSelect={(date) => {
                          setSelectedPeriod("custom");
                          setCustomStartDate(
                            date ? format(date, "yyyy-MM-dd") : "",
                          );
                          setStartPopoverOpen(false);
                        }}
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
                            onClick={() => {
                              setCustomStartDate("");
                              setStartPopoverOpen(false);
                            }}
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
                  open={endPopoverOpen}
                  onOpenChange={(nextOpen) =>
                    setEndPopoverOpen(isOpen ? nextOpen : false)
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
                        onSelect={(date) => {
                          setSelectedPeriod("custom");
                          setCustomEndDate(
                            date ? format(date, "yyyy-MM-dd") : "",
                          );
                          setEndPopoverOpen(false);
                        }}
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
                            onClick={() => {
                              setCustomEndDate("");
                              setEndPopoverOpen(false);
                            }}
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

            {selectedPeriod === "custom" && !hasCustomRange ? (
              <p className="rounded-xl border border-sky-200 bg-sky-50/70 px-3.5 py-2.5 text-xs text-sky-900 dark:border-sky-900/50 dark:bg-sky-950/20 dark:text-sky-200">
                Select both start date and end date to apply a custom period.
              </p>
            ) : null}

            {selectedPeriod === "custom" && hasCustomRange && !isCustomRangeValid ? (
              <p className="rounded-xl border border-amber-200 bg-amber-50/70 px-3.5 py-2.5 text-xs text-amber-900 dark:border-amber-900/50 dark:bg-amber-950/20 dark:text-amber-200">
                Start date cannot be later than end date.
              </p>
            ) : null}
          </div>
        </div>

        <SheetFooter className="flex-col-reverse gap-2 border-t border-slate-200/80 bg-white px-3 py-3 shadow-[0_-1px_3px_rgba(0,0,0,0.04)] sm:flex-row dark:border-slate-800 dark:bg-slate-950">
          <Button
            type="button"
            variant="ghost"
            onClick={() => onOpenChange(false)}
            className="h-9 w-full rounded-lg text-xs font-medium sm:w-auto sm:flex-1"
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleApply}
            disabled={!canApply}
            className="h-9 w-full rounded-lg bg-[#008f68] text-xs font-semibold text-white shadow-sm transition-colors duration-150 hover:bg-[#007a5a] sm:w-auto sm:flex-1"
          >
            <Check data-icon="inline-start" />
            Apply Filter
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
