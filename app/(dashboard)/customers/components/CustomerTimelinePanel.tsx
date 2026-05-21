"use client";

import { History, X } from "lucide-react";
import { CustomerTimeline } from "./CustomerTimeline";

interface CustomerTimelinePanelProps {
  customerId: number;
  customerName?: string;
  eventHint?: number;
  canPlayRecordings: boolean;
  refreshKey?: number;
  onClose: () => void;
  onViewCall?: (callId: number) => void;
  onViewTicket?: (ticketId: number) => void;
}

export function CustomerTimelinePanel({
  customerId,
  customerName,
  eventHint,
  canPlayRecordings,
  refreshKey,
  onClose,
  onViewCall,
  onViewTicket,
}: CustomerTimelinePanelProps) {
  return (
    <aside className="flex h-full min-h-0 w-[min(720px,58%)] min-w-[340px] shrink-0 flex-col border-r border-slate-200/90 bg-slate-50 dark:border-slate-800 dark:bg-slate-950">
      <div className="flex shrink-0 items-center justify-between gap-3 border-b border-slate-200/80 bg-white px-5 py-4 dark:border-slate-800 dark:bg-slate-950">
        <div className="flex min-w-0 items-center gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#008f68]/10 text-[#008f68]">
            <History className="h-5 w-5" strokeWidth={2} />
          </span>
          <div className="min-w-0">
            <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-[#008f68]">
              Activity timeline
            </p>
            <h2 className="truncate text-[18px] font-bold text-slate-950 dark:text-white">
              {customerName?.trim() || "Customer"}
            </h2>
            {eventHint != null && eventHint > 0 ? (
              <p className="text-[12px] text-slate-500">
                <span className="font-semibold tabular-nums text-slate-700 dark:text-slate-300">
                  {eventHint}
                </span>{" "}
                interactions
              </p>
            ) : null}
          </div>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close activity timeline"
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-slate-200 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-800 dark:border-slate-700 dark:hover:bg-slate-800"
        >
          <X className="h-4 w-4" strokeWidth={2} />
        </button>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain bg-white dark:bg-slate-950">
        <CustomerTimeline
          customerId={customerId}
          canPlayRecordings={canPlayRecordings}
          refreshKey={refreshKey}
          expanded
          onViewCall={onViewCall}
          onViewTicket={onViewTicket}
        />
      </div>
    </aside>
  );
}
