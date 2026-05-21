"use client";

import { History, X } from "lucide-react";
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
        className="absolute inset-0 bg-slate-900/55 backdrop-blur-[2px] animate-in fade-in-0 duration-200"
        onClick={() => onOpenChange(false)}
      />

      <div className="relative z-10 flex min-h-0 flex-1 items-center justify-center p-4 sm:p-5">
        <div
          className={cn(
            "pointer-events-auto flex max-h-[min(88dvh,680px)] w-full max-w-[min(100%,500px)] flex-col overflow-hidden",
            "rounded-2xl border-2 border-[#008f68]/35 bg-white shadow-[0_24px_60px_rgba(15,23,42,0.28)]",
            "ring-4 ring-[#008f68]/10",
            "animate-in zoom-in-95 fade-in-0 duration-200",
            "dark:border-emerald-500/40 dark:bg-slate-950 dark:ring-emerald-500/15",
          )}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex shrink-0 items-start justify-between gap-3 border-b border-[#008f68]/15 bg-gradient-to-r from-[#f0faf5] via-white to-white px-4 py-3.5 sm:px-5 dark:from-emerald-950/40 dark:via-slate-950 dark:to-slate-950">
            <div className="flex min-w-0 items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-[#008f68]/20 bg-white text-[#008f68] shadow-sm dark:border-emerald-800 dark:bg-slate-900">
                <History className="h-5 w-5" strokeWidth={2} />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#008f68]">
                  Activity timeline
                </p>
                <h3
                  id="customer-timeline-popup-title"
                  className="truncate text-[16px] font-bold text-slate-950 dark:text-white"
                >
                  {customerName?.trim() || "Customer"}
                </h3>
                {eventHint != null && eventHint > 0 ? (
                  <p className="mt-0.5 text-[11px] font-medium text-slate-500">
                    {eventHint} recorded interactions
                  </p>
                ) : null}
              </div>
            </div>
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              aria-label="Close"
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-500 shadow-sm transition-all hover:bg-slate-50 hover:text-slate-800 active:scale-95 dark:border-slate-700 dark:bg-slate-900"
            >
              <X className="h-4 w-4" strokeWidth={2} />
            </button>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain bg-slate-50/80 dark:bg-slate-950/80">
            <CustomerTimeline
              customerId={customerId}
              canPlayRecordings={canPlayRecordings}
              refreshKey={refreshKey}
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
