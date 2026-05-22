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
      className="relative mb-3 overflow-hidden rounded-xl border border-amber-200/90 bg-gradient-to-r from-amber-50 via-white to-orange-50/80 shadow-sm dark:border-amber-900/50 dark:from-amber-950/50 dark:via-slate-950 dark:to-orange-950/30"
    >
      <div
        className="pointer-events-none absolute inset-y-0 left-0 w-1 bg-gradient-to-b from-amber-400 to-orange-500"
        aria-hidden
      />

      <div className="flex flex-col gap-3 px-4 py-3 pl-5 sm:flex-row sm:items-center">
        <div className="flex min-w-0 flex-1 items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-900/60">
            <Clock className="h-5 w-5 text-amber-700 dark:text-amber-300" />
          </div>

          <div className="min-w-0 flex-1">
            <p className="flex flex-wrap items-center gap-2 text-sm font-semibold text-slate-900 dark:text-slate-100">
              <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-amber-800 dark:bg-amber-900/70 dark:text-amber-200">
                <AlertTriangle className="h-3 w-3" />
                Action needed
              </span>
              {label}
            </p>
            <p className="mt-1 text-xs leading-relaxed text-slate-600 dark:text-slate-400">
              {latestMessage ??
                "Follow-up date has passed. Review overdue callbacks and contact customers as soon as possible."}
            </p>
          </div>
        </div>

        <div className="flex shrink-0 items-center justify-end gap-2 sm:pl-2">
          {onViewOverdue ? (
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="h-8 border-amber-300/80 bg-white text-xs font-semibold text-amber-900 shadow-none hover:bg-amber-50 dark:border-amber-800 dark:bg-slate-900 dark:text-amber-200 dark:hover:bg-amber-950/60"
              onClick={onViewOverdue}
            >
              View overdue
              <ArrowRight className="ml-1 h-3.5 w-3.5" />
            </Button>
          ) : null}
          <button
            type="button"
            onClick={() => setDismissedCount(count)}
            className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-amber-100/80 hover:text-slate-700 dark:hover:bg-amber-900/40 dark:hover:text-slate-200"
            aria-label="Dismiss banner"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
