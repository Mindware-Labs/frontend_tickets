"use client";

import { ChevronLeft, History } from "lucide-react";
import { cn } from "@/lib/utils";
import { CustomerTimeline } from "./CustomerTimeline";

interface CustomerTimelinePopupProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  customerId: number;
  customerName?: string;
  eventHint?: number;
  canPlayRecordings: boolean;
  refreshKey?: number;
  onNavigate?: () => void;
}

export function CustomerTimelinePopup({
  open,
  onOpenChange,
  customerId,
  customerName,
  eventHint,
  canPlayRecordings,
  refreshKey,
  onNavigate,
}: CustomerTimelinePopupProps) {
  if (!open) return null;

  return (
    <div
      className="absolute inset-0 z-50 flex flex-col"
      role="dialog"
      aria-modal="true"
      aria-labelledby="customer-timeline-popup-title"
    >
      <button
        type="button"
        aria-label="Close activity timeline"
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm animate-in fade-in-0 duration-150"
        onClick={() => onOpenChange(false)}
      />

      <div className="relative z-10 flex min-h-0 flex-1 flex-col p-3 sm:p-4">
        <div
          className={cn(
            "pointer-events-auto mx-auto flex min-h-0 w-full max-w-[min(100%,480px)] flex-1 flex-col overflow-hidden",
            "rounded-xl border border-slate-200/90 bg-white shadow-xl",
            "animate-in slide-in-from-bottom-2 fade-in-0 duration-200",
            "dark:border-slate-800 dark:bg-slate-950",
          )}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex shrink-0 items-center gap-2 border-b border-slate-100 px-3 py-2.5 dark:border-slate-800">
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              aria-label="Close"
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-800 dark:hover:bg-slate-800"
            >
              <ChevronLeft className="h-4 w-4" strokeWidth={2} />
            </button>
            <div className="flex min-w-0 flex-1 items-center gap-2">
              <History className="h-4 w-4 shrink-0 text-[#008f68]" />
              <div className="min-w-0">
                <h3
                  id="customer-timeline-popup-title"
                  className="truncate text-[14px] font-semibold text-slate-900 dark:text-white"
                >
                  {customerName?.trim() || "Customer"}
                </h3>
                <p className="text-[11px] text-slate-500">
                  Activity
                  {eventHint != null && eventHint > 0 ? (
                    <span className="tabular-nums"> · {eventHint}</span>
                  ) : null}
                </p>
              </div>
            </div>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
            <CustomerTimeline
              customerId={customerId}
              canPlayRecordings={canPlayRecordings}
              refreshKey={refreshKey}
              compact
              onNavigate={() => {
                onOpenChange(false);
                onNavigate?.();
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
