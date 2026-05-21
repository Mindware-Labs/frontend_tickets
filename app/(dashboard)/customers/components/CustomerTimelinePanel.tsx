"use client";

import { useCallback, useState } from "react";
import { History, X } from "lucide-react";
import {
  CustomerTimeline,
  CustomerTimelineToolbar,
  DEFAULT_TIMELINE_FILTERS,
  type CustomerTimelineMeta,
} from "./CustomerTimeline";
import type { TimelineFilters } from "../types";

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
  refreshKey = 0,
  onClose,
  onViewCall,
  onViewTicket,
}: CustomerTimelinePanelProps) {
  const [filters, setFilters] = useState<TimelineFilters>(
    DEFAULT_TIMELINE_FILTERS,
  );
  const [meta, setMeta] = useState<CustomerTimelineMeta>({
    total: 0,
    lastEventAgo: null,
    loading: false,
  });
  const [reloadToken, setReloadToken] = useState(0);

  const handleMetaChange = useCallback((next: CustomerTimelineMeta) => {
    setMeta(next);
  }, []);

  const handleRefresh = useCallback(() => {
    setReloadToken((t) => t + 1);
  }, []);

  const combinedRefreshKey = refreshKey + reloadToken;

  return (
    <aside className="motion-safe:animate-in motion-safe:fade-in-0 motion-safe:slide-in-from-right-8 flex h-full min-h-0 w-full min-w-0 shrink-0 flex-col border-l border-slate-200/80 bg-white antialiased shadow-2xl motion-safe:duration-300 motion-safe:ease-out sm:min-w-[420px] dark:border-slate-800 dark:bg-slate-950">
      <div className="motion-safe:animate-in motion-safe:fade-in-0 motion-safe:slide-in-from-top-2 relative flex shrink-0 items-center justify-between gap-3 border-b border-slate-200/70 bg-white px-4 py-2.5 motion-safe:delay-75 motion-safe:duration-300 sm:px-5 dark:border-slate-800 dark:bg-slate-950">
        <div className="flex min-w-0 items-center gap-3.5 pr-8">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-[#008f68]/15 bg-[#f0faf5] text-[#008f68] dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-400">
            <History className="h-4 w-4" strokeWidth={2.25} />
          </span>
          <div className="min-w-0 pt-0.5">
            <h2 className="truncate text-[15px] font-bold leading-tight text-slate-900 sm:text-[16px] dark:text-white">
              {customerName?.trim() || "Customer"}
            </h2>
            <div className="mt-0.5 flex items-center gap-1.5 text-[11px] font-medium text-slate-500">
              <span className="uppercase tracking-[0.08em] text-[#008f68]">
                Timeline
              </span>
              {eventHint != null && eventHint > 0 ? (
                <>
                  <span className="text-slate-300 dark:text-slate-600">•</span>
                  <span>
                    <span className="font-bold text-slate-700 dark:text-slate-300">
                      {eventHint}
                    </span>{" "}
                    interactions
                  </span>
                </>
              ) : null}
            </div>
          </div>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close activity timeline"
          className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full text-slate-400 transition-all hover:bg-slate-100 hover:text-slate-700 active:scale-95 sm:right-4 dark:hover:bg-slate-800 dark:hover:text-slate-200"
        >
          <X className="h-4 w-4" strokeWidth={2.5} />
        </button>
      </div>

      <div className="motion-safe:animate-in motion-safe:fade-in-0 motion-safe:slide-in-from-top-2 motion-safe:delay-100 motion-safe:duration-300">
        <CustomerTimelineToolbar
          variant="panel"
          filters={filters}
          onFiltersChange={setFilters}
          total={meta.total}
          lastEventAgo={meta.lastEventAgo}
          loading={meta.loading}
          onRefresh={handleRefresh}
        />
      </div>

      <div className="motion-safe:animate-in motion-safe:fade-in-0 motion-safe:slide-in-from-bottom-2 min-h-0 flex-1 overflow-y-auto overscroll-contain bg-[#f8fafc] px-1 py-1 motion-safe:delay-150 motion-safe:duration-300 dark:bg-slate-950">
        <CustomerTimeline
          customerId={customerId}
          canPlayRecordings={canPlayRecordings}
          refreshKey={combinedRefreshKey}
          expanded
          hideToolbar
          filters={filters}
          onFiltersChange={setFilters}
          onMetaChange={handleMetaChange}
          onViewCall={onViewCall}
          onViewTicket={onViewTicket}
        />
      </div>
    </aside>
  );
}
