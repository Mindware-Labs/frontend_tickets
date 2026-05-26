"use client";

import { AlertTriangle, ArrowRight, Clock, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import useSWR from "swr";
import { Button } from "@/components/ui/button";
import {
  revalidateNotifications,
  useNotifications,
} from "@/hooks/use-notifications";

interface OverdueCallsBannerProps {
  overdueCount?: number;
  onViewOverdue?: () => void;
}

const fetcher = async (url: string) => {
  const res = await fetch(url);
  const json = await res.json();
  if (!json.success) throw new Error(json.message || "Fetch failed");
  return json;
};

export function OverdueCallsBanner({
  overdueCount = 0,
  onViewOverdue,
}: OverdueCallsBannerProps) {
  const { notifications, refresh } = useNotifications();
  const { data: overdueCallsPayload } = useSWR(
    "/api/notifications/overdue-calls",
    fetcher,
    { refreshInterval: 60_000, revalidateOnFocus: true },
  );

  const [dismissedCount, setDismissedCount] = useState<number | null>(null);

  useEffect(() => {
    refresh();
    revalidateNotifications();
  }, [refresh]);

  const overdueCallIds = useMemo(() => {
    if (!Array.isArray(overdueCallsPayload?.data)) return new Set<number>();
    return new Set(
      overdueCallsPayload.data
        .map((id: unknown) => Number(id))
        .filter((id: number) => Number.isFinite(id)),
    );
  }, [overdueCallsPayload?.data]);

  const unreadOverdueNotifs = useMemo(
    () =>
      notifications.filter(
        (n) =>
          n.type === "CALLBACK_OVERDUE" &&
          !n.read &&
          n.callId != null &&
          overdueCallIds.has(n.callId),
      ),
    [notifications, overdueCallIds],
  );

  // Match the Overdue tab: only calls with status OVERDUE (not stale notifications).
  const count =
    overdueCount > 0
      ? overdueCount
      : overdueCallIds.size > 0
        ? overdueCallIds.size
        : 0;

  useEffect(() => {
    if (count > (dismissedCount ?? 0)) {
      setDismissedCount(null);
    }
  }, [count, dismissedCount]);

  if (count === 0 || dismissedCount === count) return null;

  const label =
    count === 1 ? "1 callback overdue" : `${count} callbacks overdue`;
  const latestMessage = unreadOverdueNotifs[0]?.message;

  return (
    <div
      role="alert"
      className="relative mb-3 overflow-hidden rounded-2xl border border-amber-200/80 bg-white shadow-[0_1px_3px_rgba(0,0,0,0.06)] dark:border-amber-900/50 dark:bg-slate-950"
    >
      <div
        className="pointer-events-none absolute inset-y-0 left-0 w-1 bg-gradient-to-b from-amber-400 via-amber-500 to-orange-500"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-amber-300/80 to-transparent"
        aria-hidden
      />

      <div className="flex flex-col gap-3 px-4 py-3 pl-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 flex-1 items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-amber-200/80 bg-amber-50 text-amber-700 dark:border-amber-900/70 dark:bg-amber-950/50 dark:text-amber-300">
            <Clock className="h-5 w-5" />
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
              <span className="inline-flex h-5 items-center gap-1 rounded-md border border-amber-200 bg-amber-50 px-1.5 text-[10px] font-bold uppercase tracking-wide text-amber-700 dark:border-amber-900/70 dark:bg-amber-950/60 dark:text-amber-300">
                <AlertTriangle className="h-3 w-3" />
                Action needed
              </span>
              <p className="truncate text-[14px] font-bold leading-tight tracking-tight text-slate-900 dark:text-slate-100">
                {label}
              </p>
            </div>
            <p className="mt-1 truncate text-[12px] font-medium leading-5 text-slate-600 dark:text-slate-400">
              {latestMessage ??
                "Follow-up date has passed. Review overdue callbacks and contact customers as soon as possible."}
            </p>
          </div>
        </div>

        <div className="flex shrink-0 items-center justify-end gap-2 sm:pl-4">
          {onViewOverdue ? (
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="h-8 rounded-lg border-[#008f68]/25 bg-white px-3 text-[12px] font-semibold text-[#008f68] shadow-sm shadow-slate-200/50 transition-colors hover:border-[#008f68]/40 hover:bg-[#f0faf5] hover:text-[#007a5a] dark:border-emerald-500/30 dark:bg-slate-950 dark:text-emerald-400 dark:shadow-none dark:hover:bg-emerald-500/10"
              onClick={onViewOverdue}
            >
              View overdue
              <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
            </Button>
          ) : null}
          <button
            type="button"
            onClick={() => setDismissedCount(count)}
            className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#008f68]/25 dark:hover:bg-slate-800 dark:hover:text-slate-200"
            aria-label="Dismiss banner"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
