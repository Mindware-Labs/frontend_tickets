"use client";

import { useState } from "react";
import { Calendar, Check, Clock, Globe, Landmark } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useSupportDashboardData } from "../use-dashboard-real-data";
import { cn } from "@/lib/utils";

type PresetOption = {
  key: string;
  label: string;
  description: string;
  icon: typeof Calendar;
};

const PRESETS: PresetOption[] = [
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
  const [selectedPeriod, setSelectedPeriod] = useState<string>(period);

  const handleApply = () => {
    setPeriod(selectedPeriod);
    onOpenChange(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[480px] rounded-2xl border border-slate-200/80 bg-white p-0 shadow-2xl dark:border-slate-800 dark:bg-slate-950 overflow-hidden">
        {/* Header compliant with DESIGN_SYSTEM.md §8.1 */}
        <div className="flex items-center gap-3.5 border-b border-slate-100 px-5 py-4 dark:border-slate-900">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#f0faf5] text-[#008f68] dark:bg-emerald-500/10 dark:text-emerald-400">
            <Calendar className="size-5" />
          </div>
          <div className="text-left">
            <DialogTitle className="text-[15px] font-semibold text-slate-900 dark:text-slate-50">
              Filter by Period
            </DialogTitle>
            <DialogDescription className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 mt-0.5">
              DASHBOARD TIME RANGES
            </DialogDescription>
          </div>
        </div>

        {/* Body content with beautiful selectors */}
        <div className="p-4 bg-slate-50/60 dark:bg-slate-900/10 flex flex-col gap-2.5">
          <span className="text-[10px] font-semibold uppercase tracking-widest text-slate-400">
            Period Presets
          </span>

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
                    "flex items-start gap-3 w-full text-left rounded-xl border p-3 transition-all duration-200 cursor-pointer outline-none relative group",
                    isSelected
                      ? "border-[#008f68] bg-[#f0faf5]/50 shadow-[0_2px_8px_rgba(0,143,104,0.06)] dark:border-emerald-500/40 dark:bg-emerald-500/5"
                      : "border-slate-200/60 bg-white hover:border-slate-300 hover:shadow-xs hover:scale-[1.005] dark:border-slate-800 dark:bg-slate-950 dark:hover:border-slate-700"
                  )}
                >
                  {/* Left Icon inside circle */}
                  <div
                    className={cn(
                      "flex size-8 shrink-0 items-center justify-center rounded-lg transition-colors",
                      isSelected
                        ? "bg-[#008f68] text-white dark:bg-emerald-500"
                        : "bg-slate-100 text-slate-400 group-hover:bg-slate-200/70 dark:bg-slate-900 dark:group-hover:bg-slate-800"
                    )}
                  >
                    <Icon className="size-4.5" />
                  </div>

                  {/* Text Details */}
                  <div className="flex-1 min-w-0 pr-6">
                    <p
                      className={cn(
                        "text-xs font-semibold tracking-tight transition-colors",
                        isSelected
                          ? "text-[#008f68] dark:text-emerald-400"
                          : "text-slate-800 dark:text-slate-200"
                      )}
                    >
                      {option.label}
                    </p>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-normal mt-0.5 truncate-3-lines">
                      {option.description}
                    </p>
                  </div>

                  {/* Active Indicator Checkmark */}
                  {isSelected && (
                    <div className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#008f68] dark:text-emerald-400 duration-150 animate-in fade-in zoom-in-75">
                      <Check className="size-4.5 stroke-[2.5]" />
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Footer compliant with DESIGN_SYSTEM.md §8.1 */}
        <DialogFooter className="bg-slate-50/80 dark:bg-slate-900/40 px-4 py-3 flex items-center justify-end gap-2 border-t border-slate-100 dark:border-slate-900">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="h-9 px-4 rounded-lg text-xs font-medium border-slate-200/80 bg-white text-slate-600 hover:bg-slate-50 hover:text-slate-800 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-400 dark:hover:bg-slate-900"
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleApply}
            className="h-9 px-5 rounded-lg text-xs font-semibold text-white bg-[#008f68] hover:bg-[#007a5a] shadow-sm transition-colors duration-150 active:scale-[0.98]"
          >
            Apply Filter
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
