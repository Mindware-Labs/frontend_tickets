"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetFooter,
  SheetTitle,
} from "@/components/ui/sheet";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  AlertTriangle,
  ArrowLeft,
  Calendar,
  CalendarCheck,
  Check,
  CheckCheck,
  ChevronLeft,
  ChevronRight,
  Clock,
  Info,
  Loader2,
  Phone,
  User,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { PageNumberButtons } from "@/components/common/page-number-buttons";
import { shouldIgnoreTicketSheetOutsideEvent } from "@/lib/ticket-sheet-outside-interaction";
import { toast } from "@/hooks/use-toast";
import { useAircall } from "@/components/providers/AircallProvider";
import { FollowUpDateTimePicker } from "./FollowUpDateTimePicker";
import { AsyncCustomerCombobox } from "../shared/AsyncCustomerCombobox";
import { ScheduleCallStatus } from "../../types";
import type {
  CustomerOption,
  CreateScheduleCallFormData,
  ScheduleCall,
} from "../../types";

interface ScheduleCallSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  customers: CustomerOption[];
  onSubmit: (data: CreateScheduleCallFormData) => Promise<void>;
  isSubmitting?: boolean;
  onSchedulesChanged?: () => void;
}

const statusLabel: Record<string, string> = {
  PENDING: "Pending",
  COMPLETED: "Completed",
  CANCELLED: "Cancelled",
  MISSED: "Missed",
};

const statusColors: Record<string, string> = {
  PENDING: "bg-amber-50 text-amber-700 border-amber-200/60 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/20",
  COMPLETED: "bg-emerald-50 text-emerald-700 border-emerald-200/60 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20",
  CANCELLED: "bg-slate-100 text-slate-500 border-slate-200/60 dark:bg-slate-800/80 dark:text-slate-400 dark:border-slate-700",
  MISSED: "bg-rose-50 text-rose-700 border-rose-200/60 dark:bg-rose-500/10 dark:text-rose-400 dark:border-rose-500/20",
};

const statusDotColors: Record<string, string> = {
  PENDING: "bg-amber-500 dark:bg-amber-400",
  COMPLETED: "bg-emerald-500 dark:bg-emerald-400",
  CANCELLED: "bg-slate-400 dark:bg-slate-500",
  MISSED: "bg-rose-500 dark:bg-rose-400",
};

function ScheduleStat({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone: "teal" | "rose" | "slate";
}) {
  const toneClass = {
    teal: "bg-[#f0faf5] text-[#008f68] ring-[#008f68]/15 dark:bg-emerald-500/10 dark:text-emerald-400 dark:ring-emerald-500/20",
    rose: "bg-rose-50 text-rose-600 ring-rose-500/15 dark:bg-rose-500/10 dark:text-rose-400 dark:ring-rose-500/20",
    slate: "bg-slate-100 text-slate-600 ring-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:ring-slate-700",
  }[tone];

  return (
    <div className="rounded-xl border border-slate-200/80 bg-white px-3 py-2.5 shadow-[0_1px_2px_rgba(0,0,0,0.03)] dark:border-slate-800 dark:bg-slate-950">
      <p className="text-[9px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
        {label}
      </p>
      <p
        className={cn(
          "mt-1 inline-flex min-w-8 items-center justify-center rounded-lg px-2 py-1 text-[13px] font-bold tabular-nums ring-1",
          toneClass,
        )}
      >
        {value}
      </p>
    </div>
  );
}

// Module-level cache to make the modal load instantly (0ms) on opening
let cachedCalls: ScheduleCall[] | null = null;

// How many reminders to show per page in the list view.
const PAGE_SIZE = 6;

export function ScheduleCallSheet({
  open,
  onOpenChange,
  customers,
  onSubmit,
  isSubmitting = false,
  onSchedulesChanged,
}: ScheduleCallSheetProps) {
  const [form, setForm] = useState<CreateScheduleCallFormData>({
    customerId: "",
    scheduledAt: "",
    notes: "",
  });

  const [scheduledCalls, setScheduledCalls] = useState<ScheduleCall[]>(() => cachedCalls ?? []);
  const [loadingList, setLoadingList] = useState(() => !cachedCalls);
  const [showCompleted, setShowCompleted] = useState(false);
  const [updatingCallId, setUpdatingCallId] = useState<number | null>(null);
  const [page, setPage] = useState(1);

  const [view, setView] = useState<"list" | "create">("list");

  const { setSheetOpen } = useAircall();

  useEffect(() => {
    setSheetOpen(open);
    return () => setSheetOpen(false);
  }, [open, setSheetOpen]);

  const fetchScheduledCalls = useCallback(async () => {
    try {
      if (!cachedCalls) {
        setLoadingList(true);
      }
      const res = await fetch("/api/schedule-calls?limit=50");
      const json = await res.json();
      if (json.success) {
        const data = json.data ?? [];
        setScheduledCalls(data);
        cachedCalls = data;
      }
    } catch {
    } finally {
      setLoadingList(false);
    }
  }, []);

  useEffect(() => {
    if (open) {
      fetchScheduledCalls();
    }
  }, [open, fetchScheduledCalls]);

  useEffect(() => {
    if (!open) {
      setForm({ customerId: "", scheduledAt: "", notes: "" });
      setShowCompleted(false);
      setView("list");
      setPage(1);
    }
  }, [open]);

  const visibleCalls = useMemo(() => {
    const sorted = [...scheduledCalls].sort(
      (a, b) =>
        new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime(),
    );
    if (showCompleted) return sorted;
    return sorted.filter((c) => c.status === "PENDING");
  }, [scheduledCalls, showCompleted]);

  // Pagination over the filtered list.
  const totalPages = Math.max(1, Math.ceil(visibleCalls.length / PAGE_SIZE));
  const pageStart = (page - 1) * PAGE_SIZE;
  const pageEnd = Math.min(pageStart + PAGE_SIZE, visibleCalls.length);
  const pagedCalls = visibleCalls.slice(pageStart, pageStart + PAGE_SIZE);

  // Reset to the first page whenever the filter changes.
  useEffect(() => {
    setPage(1);
  }, [showCompleted]);

  // Clamp the page if the visible list shrinks (e.g. after marking done).
  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  const now = Date.now();
  const pendingCalls = scheduledCalls.filter((c) => c.status === "PENDING");
  const overdueCount = pendingCalls.filter(
    (c) => new Date(c.scheduledAt).getTime() <= now,
  ).length;
  const upcomingCount = pendingCalls.length - overdueCount;
  const completedCount = scheduledCalls.filter(
    (c) => c.status === "COMPLETED",
  ).length;

  const handleSubmit = async () => {
    if (!form.customerId) return;
    if (!form.scheduledAt) return;
    try {
      await onSubmit(form);
      await fetchScheduledCalls();
      onSchedulesChanged?.();
      toast({
        title: "Scheduled",
        description: "Call scheduled successfully",
      });
      // Close sheet immediately on success
      onOpenChange(false);
    } catch {
      toast({
        title: "Error",
        description: "Failed to schedule call",
        variant: "destructive",
      });
    }
  };

  const canSubmit = form.customerId && form.scheduledAt && !isSubmitting;

  const markScheduleDone = async (scheduleId: number) => {
    try {
      setUpdatingCallId(scheduleId);
      const response = await fetch(`/api/schedule-calls/${scheduleId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "COMPLETED" }),
      });
      const result = await response.json();
      if (!result.success) {
        throw new Error(result.message || "Failed to mark schedule done");
      }

      setScheduledCalls((current) => {
        const next = current.map((call) =>
          call.id === scheduleId
            ? { ...call, status: ScheduleCallStatus.COMPLETED }
            : call,
        );
        cachedCalls = next;
        return next;
      });
      onSchedulesChanged?.();
      toast({
        title: "Marked done",
        description: "Scheduled call completed.",
      });
    } catch {
      toast({
        title: "Error",
        description: "Failed to update scheduled call",
        variant: "destructive",
      });
    } finally {
      setUpdatingCallId(null);
    }
  };

  const customerLabel = (sc: ScheduleCall) => {
    if (sc.customer?.name) return sc.customer.name;
    if (sc.customer?.phone) return sc.customer.phone;
    return `Customer #${sc.customerId}`;
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="w-svw sm:w-[480px] p-0 flex flex-col bg-[#f4f5f7] dark:bg-slate-900/30 overflow-hidden border-l border-slate-200/80 dark:border-slate-800 shadow-2xl [&>button.absolute]:hidden"
        onPointerDownOutside={(e) => {
          if (shouldIgnoreTicketSheetOutsideEvent(e)) {
            e.preventDefault();
          }
        }}
        onFocusOutside={(e) => {
          if (shouldIgnoreTicketSheetOutsideEvent(e)) {
            e.preventDefault();
          }
        }}
        onInteractOutside={(e) => {
          if (shouldIgnoreTicketSheetOutsideEvent(e)) {
            e.preventDefault();
          }
        }}
      >
        {/* ── Brand touch top accent line ── */}
        <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-[#008f68] via-emerald-400 to-[#007a5a] z-50" />

        {/* ── Absolute Floating Close Button ── */}
        <SheetClose asChild>
          <button
            type="button"
            aria-label="Close scheduled calls sheet"
            className="absolute right-4 top-4 z-50 flex size-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-400 shadow-sm transition-all hover:bg-slate-50 hover:text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#008f68]/20 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-500 dark:hover:bg-slate-900 dark:hover:text-slate-200"
          >
            <X className="size-4" />
          </button>
        </SheetClose>

        {/* ── Top Bar ── */}
        <div className="shrink-0 bg-white border-b border-slate-100 dark:bg-slate-950 dark:border-slate-800/80 pt-1">
          <div className="flex items-center justify-between px-5 py-4 sm:px-6">
            <div className="flex items-center gap-3.5 min-w-0">
              {view === "create" ? (
                <button
                  type="button"
                  onClick={() => setView("list")}
                  className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-500 hover:bg-slate-50 hover:text-slate-700 transition-colors shadow-sm dark:border-slate-800 dark:bg-slate-950 dark:text-slate-400 dark:hover:bg-slate-900"
                  title="Go back to list"
                >
                  <ArrowLeft className="size-5" />
                </button>
              ) : (
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-dashed border-emerald-500/30 bg-emerald-50 text-[#008f68] dark:border-emerald-500/20 dark:bg-emerald-950/20 dark:text-emerald-400">
                  <Calendar className="size-5" />
                </div>
              )}
              <div className="min-w-0 pr-6">
                <SheetTitle className="truncate text-[15px] font-semibold leading-tight text-slate-900 dark:text-slate-50">
                  {view === "create" ? "New Schedule" : "Scheduled Calls"}
                </SheetTitle>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate mt-0.5">
                  {view === "create"
                    ? "Set a reminder date and time for a customer call"
                    : `${upcomingCount} upcoming · ${overdueCount} overdue`}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* ── Body ── */}
        <div className="flex-1 min-h-0 overflow-y-auto bg-[#f4f5f7] dark:bg-slate-900/10 scrollbar-app">
          {view === "list" ? (
            /* ═══ LIST VIEW ═══ */
            <div className="flex flex-col gap-4 px-4 pb-4 pt-0">
              <div className="rounded-xl border border-[#008f68]/15 bg-[#f0faf5] p-3 text-[#065f4a] shadow-[0_1px_2px_rgba(0,143,104,0.05)] dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-300">
                <div className="flex items-start gap-2.5">
                  <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-white/70 text-[#008f68] ring-1 ring-[#008f68]/10 dark:bg-slate-950/50 dark:text-emerald-400 dark:ring-emerald-500/20">
                    <Info className="size-4" aria-hidden />
                  </span>
                  <div className="min-w-0">
                    <p className="text-[11px] font-semibold uppercase tracking-wider">
                      Call reminder scheduling
                    </p>
                    <p className="mt-1 text-[11.5px] leading-5 text-slate-600 dark:text-slate-300">
                      Use scheduled calls to create reminders for customer callbacks. Due reminders appear as alerts and can be marked done after the call is handled.
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <ScheduleStat label="Upcoming" value={upcomingCount} tone="teal" />
                <ScheduleStat label="Overdue" value={overdueCount} tone="rose" />
                <ScheduleStat label="Done" value={completedCount} tone="slate" />
              </div>

              {/* Filter tabs */}
              <div className="flex rounded-lg bg-slate-100 p-1 border border-slate-200/80 shadow-sm dark:bg-slate-900/80 dark:border-slate-700/60">
                {(
                  [
                    { label: "Upcoming", value: false },
                    { label: "All entries", value: true },
                  ] as const
                ).map(({ label, value }) => {
                  const active = showCompleted === value;
                  return (
                    <button
                      key={label}
                      type="button"
                      onClick={() => setShowCompleted(value)}
                      className={cn(
                        "flex-1 px-3 py-1.5 text-xs transition-all",
                        active
                          ? "rounded-md bg-white font-semibold text-[#008f68] shadow-sm dark:bg-slate-950 dark:text-emerald-400"
                          : "text-slate-500 hover:text-slate-800 dark:text-slate-400",
                      )}
                    >
                      {label}
                    </button>
                  );
                })}
              </div>

              <div className="flex flex-col gap-2">
              {/* List section label */}
              {!loadingList && visibleCalls.length > 0 && (
                <div className="flex items-center justify-between px-0.5">
                  <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-400 dark:text-slate-500">
                    {showCompleted ? "All reminders" : "Upcoming reminders"}
                  </p>
                  <span className="inline-flex min-w-5 items-center justify-center rounded-full bg-slate-100 px-1.5 py-0.5 text-[10px] font-semibold tabular-nums text-slate-500 dark:bg-slate-800 dark:text-slate-400">
                    {visibleCalls.length}
                  </span>
                </div>
              )}

              {/* List */}
              {loadingList ? (
                <div className="flex flex-col items-center justify-center py-12 text-slate-400 dark:text-slate-500">
                  <Loader2 className="h-5 w-5 animate-spin mb-2 text-[#008f68] dark:text-emerald-400" />
                  <span className="text-[11px] font-medium">Loading scheduled calls...</span>
                </div>
              ) : visibleCalls.length === 0 ? (
                <div className="rounded-xl border border-dashed border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-950 px-4 py-12 text-center shadow-sm">
                  <CalendarCheck className="mx-auto h-8 w-8 text-slate-300 dark:text-slate-700 mb-2.5" />
                  <p className="text-[12px] font-semibold text-slate-500 dark:text-slate-400">
                    No scheduled calls
                  </p>
                  <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1">
                    Click below to schedule one.
                  </p>
                </div>
              ) : (
                <div className="space-y-2.5">
                  {pagedCalls.map((sc) => {
                    const isOverdue =
                      sc.status === "PENDING" &&
                      new Date(sc.scheduledAt) <= new Date();
                    return (
                      <div
                        key={sc.id}
                        className={cn(
                          "relative overflow-hidden rounded-xl border p-3.5 pl-4 transition-all duration-200",
                          isOverdue
                            ? "border-rose-200/80 bg-[#fff8f8] shadow-[0_2px_12px_rgba(244,63,94,0.10)] hover:shadow-[0_4px_16px_rgba(244,63,94,0.15)] dark:border-rose-900/40 dark:bg-[#200c0f] dark:shadow-[0_2px_12px_rgba(244,63,94,0.06)]"
                            : "border-slate-200/80 bg-white shadow-[0_1px_2px_rgba(0,0,0,0.03)] hover:border-slate-300 hover:shadow-md dark:border-slate-800 dark:bg-slate-950 dark:hover:border-slate-700",
                        )}
                      >
                        {/* Left Accent Stripe */}
                        <div
                          className={cn(
                            "absolute left-0 top-0 bottom-0 w-[3px]",
                            isOverdue
                              ? "bg-gradient-to-b from-rose-400 via-rose-500 to-rose-400 animate-pulse-slow"
                              : "bg-[#008f68] dark:bg-emerald-500",
                          )}
                        />
                        <div className="flex items-start gap-3">
                          {/* Icon box */}
                          <div
                            className={cn(
                              "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border shadow-sm",
                              isOverdue
                                ? "border-rose-200/80 bg-rose-50 text-rose-500 ring-2 ring-rose-200/40 animate-pulse-slow dark:border-rose-900/40 dark:bg-rose-950/40 dark:text-rose-400 dark:ring-rose-800/30"
                                : "border-emerald-100 bg-[#f0faf5] text-[#008f68] dark:border-emerald-950/30 dark:bg-emerald-950/40 dark:text-emerald-400",
                            )}
                          >
                            <Phone className="h-3.5 w-3.5" />
                          </div>
                          {/* Card Details */}
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center justify-between gap-2">
                              <span className="truncate text-xs font-semibold text-slate-900 dark:text-slate-200">
                                {customerLabel(sc)}
                              </span>
                              <div className="flex shrink-0 items-center gap-1.5">
                                {isOverdue && (
                                  <span className="inline-flex items-center gap-1 rounded border border-rose-200/80 bg-rose-50 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-rose-600 dark:border-rose-900/40 dark:bg-rose-950/60 dark:text-rose-400">
                                    <span className="size-1.5 rounded-full bg-rose-500 animate-pulse dark:bg-rose-400" />
                                    Overdue
                                  </span>
                                )}
                                <span
                                  className={cn(
                                    "inline-flex items-center gap-1 rounded-md border px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider",
                                    statusColors[sc.status] ||
                                      "bg-slate-50 text-slate-500 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700",
                                  )}
                                >
                                  <span className={cn("size-1.5 rounded-full", statusDotColors[sc.status] || "bg-slate-400")} />
                                  {statusLabel[sc.status] || sc.status}
                                </span>
                              </div>
                            </div>

                            <div className={cn(
                              "mt-1.5 flex items-center gap-1.5 text-[11px]",
                              isOverdue ? "text-rose-400/80 dark:text-rose-500/70" : "text-slate-500 dark:text-slate-400",
                            )}>
                              <Clock className={cn("h-3.5 w-3.5 shrink-0", isOverdue ? "text-rose-400 dark:text-rose-500" : "text-slate-400 dark:text-slate-500")} />
                              <span>
                                {format(
                                  new Date(sc.scheduledAt),
                                  "MMM d, yyyy · h:mm a",
                                )}
                              </span>
                            </div>

                            {(sc.createdBy?.name || sc.createdByName) && (
                              <div className="mt-1 flex items-center gap-1.5 text-[11px] text-slate-400 dark:text-slate-500">
                                <User className="h-3 w-3 shrink-0" />
                                <span className="truncate">{sc.createdBy?.name ?? sc.createdByName}</span>
                              </div>
                            )}

                            {sc.notes && (
                              <p className={cn(
                                "mt-2 rounded-lg p-2 text-[11px] border line-clamp-2 leading-relaxed",
                                isOverdue
                                  ? "bg-rose-50/60 border-rose-100/80 text-rose-500/80 dark:bg-rose-950/20 dark:border-rose-900/40 dark:text-rose-400/70"
                                  : "bg-slate-50/60 border-slate-100/80 text-slate-500 dark:bg-slate-900/40 dark:border-slate-800/80 dark:text-slate-400",
                              )}>
                                {sc.notes}
                              </p>
                            )}

                            {sc.status === "PENDING" && (
                              <div className={cn(
                                "mt-3 flex items-center justify-between gap-2 border-t pt-2.5",
                                isOverdue ? "border-rose-100/80 dark:border-rose-900/30" : "border-slate-100 dark:border-slate-800",
                              )}>
                                <div className={cn(
                                  "flex min-w-0 items-center gap-1.5 text-[10.5px] font-medium",
                                  isOverdue ? "text-rose-500 dark:text-rose-400" : "text-slate-400 dark:text-slate-500",
                                )}>
                                  {isOverdue ? (
                                    <AlertTriangle className="size-3.5 shrink-0 animate-pulse-slow" aria-hidden />
                                  ) : (
                                    <Clock className="size-3.5 shrink-0" aria-hidden />
                                  )}
                                  <span className="truncate">
                                    {isOverdue ? "Due reminder needs attention" : "Waiting for scheduled time"}
                                  </span>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => markScheduleDone(sc.id)}
                                  disabled={updatingCallId === sc.id}
                                  className={cn(
                                    "inline-flex h-7 shrink-0 items-center gap-1.5 rounded-lg border px-2.5 text-[10.5px] font-semibold shadow-sm transition-all duration-150 disabled:opacity-60",
                                    isOverdue
                                      ? "border-rose-200/80 bg-rose-50 text-rose-600 hover:border-[#008f68]/30 hover:bg-[#f0faf5] hover:text-[#008f68] dark:border-rose-900/40 dark:bg-rose-950/30 dark:text-rose-400 dark:hover:border-emerald-500/30 dark:hover:bg-emerald-500/10 dark:hover:text-emerald-400"
                                      : "border-slate-200 bg-white text-slate-600 hover:border-[#008f68]/30 hover:bg-[#f0faf5] hover:text-[#008f68] dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:border-emerald-500/30 dark:hover:bg-emerald-500/10 dark:hover:text-emerald-400",
                                  )}
                                >
                                  {updatingCallId === sc.id ? (
                                    <Loader2 className="size-3.5 animate-spin" aria-hidden />
                                  ) : (
                                    <CheckCheck className="size-3.5" aria-hidden />
                                  )}
                                  Done
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Pagination */}
              {!loadingList && visibleCalls.length > 0 && totalPages > 1 && (
                <div className="flex items-center justify-between gap-2 rounded-xl border border-slate-200/80 bg-white px-2.5 py-2 shadow-[0_1px_2px_rgba(0,0,0,0.03)] dark:border-slate-800 dark:bg-slate-950">
                  <span className="shrink-0 text-[10.5px] font-medium text-slate-400 dark:text-slate-500">
                    <span className="font-semibold tabular-nums text-slate-600 dark:text-slate-300">
                      {pageStart + 1}–{pageEnd}
                    </span>{" "}
                    of {visibleCalls.length}
                  </span>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      disabled={page <= 1}
                      aria-label="Previous page"
                      className="flex h-7 w-7 items-center justify-center rounded-lg border border-slate-200/60 bg-white text-slate-500 shadow-sm transition-colors hover:bg-slate-50 hover:text-slate-900 disabled:cursor-not-allowed disabled:opacity-40 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-400 dark:hover:bg-slate-900"
                    >
                      <ChevronLeft className="size-3.5" />
                    </button>
                    <PageNumberButtons
                      currentPage={page}
                      totalPages={totalPages}
                      onPageChange={setPage}
                      className="gap-1"
                      buttonClassName="h-7 w-7 rounded-lg text-[11px] shadow-none"
                      ellipsisClassName="h-7 w-7 text-[11px]"
                    />
                    <button
                      type="button"
                      onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                      disabled={page >= totalPages}
                      aria-label="Next page"
                      className="flex h-7 w-7 items-center justify-center rounded-lg border border-slate-200/60 bg-white text-slate-500 shadow-sm transition-colors hover:bg-slate-50 hover:text-slate-900 disabled:cursor-not-allowed disabled:opacity-40 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-400 dark:hover:bg-slate-900"
                    >
                      <ChevronRight className="size-3.5" />
                    </button>
                  </div>
                </div>
              )}
              </div>

              {/* Action bar */}
              <button
                type="button"
                onClick={() => setView("create")}
                className="group flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-[#008f68]/40 bg-white px-4 py-3.5 text-xs font-semibold text-[#008f68] shadow-sm transition-all hover:border-[#008f68] hover:bg-[#f0faf5] dark:border-emerald-500/25 dark:bg-slate-950 dark:text-emerald-400 dark:hover:border-emerald-600 dark:hover:bg-emerald-500/10"
              >
                <Calendar className="size-3.5 transition-transform group-hover:scale-110" />
                Schedule a Call
              </button>
            </div>
          ) : (
            /* ═══ CREATE VIEW ═══ */
            <div className="p-3">
              <div className="flex flex-col gap-4 overflow-hidden rounded-xl border border-slate-200/80 bg-white p-4 shadow-[0_1px_3px_rgba(0,0,0,0.06)] dark:border-slate-800 dark:bg-slate-950">
                {/* Customer selection */}
                <div className="space-y-1.5">
                  <Label className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    Customer <span className="text-red-500">*</span>
                  </Label>
                  <AsyncCustomerCombobox
                    value={form.customerId}
                    onChange={(value) =>
                      setForm({ ...form, customerId: value })
                    }
                    placeholder="Select customer..."
                    searchPlaceholder="Search customer..."
                  />
                </div>

                {/* Date & Time picker */}
                <div className="space-y-1.5">
                  <Label className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    Date &amp; Time <span className="text-red-500">*</span>
                  </Label>
                  <FollowUpDateTimePicker
                    value={form.scheduledAt}
                    onChange={(iso) => setForm({ ...form, scheduledAt: iso })}
                    placeholder="Pick date & time"
                    className="w-full"
                  />
                </div>

                {/* Notes Textarea */}
                <div className="space-y-1.5">
                  <Label className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    Notes
                  </Label>
                  <Textarea
                    placeholder="Add notes about this scheduled call..."
                    value={form.notes}
                    onChange={(e) =>
                      setForm({ ...form, notes: e.target.value })
                    }
                    className="min-h-[100px] w-full resize-none rounded-lg border border-slate-200 bg-slate-50/50 px-3 py-2 text-xs text-slate-900 shadow-none transition-colors hover:border-slate-300 focus:border-[#008f68] focus:bg-white focus:ring-2 focus:ring-[#008f68]/20 dark:border-slate-800 dark:bg-slate-900/60 dark:text-slate-100 dark:placeholder:text-slate-500"
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ── Footer ── */}
        {view === "create" && (
          <SheetFooter className="flex-col-reverse gap-2 border-t border-slate-200/80 bg-white px-3 py-3 shadow-[0_-1px_3px_rgba(0,0,0,0.04)] sm:flex-row dark:border-slate-800 dark:bg-slate-950">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setView("list")}
              disabled={isSubmitting}
              className="h-9 w-full rounded-lg text-xs font-medium sm:w-auto sm:flex-1"
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleSubmit}
              disabled={!canSubmit}
              className="h-9 w-full rounded-lg bg-[#008f68] text-xs font-semibold text-white shadow-sm transition-colors duration-150 hover:bg-[#007a5a] disabled:opacity-60 disabled:pointer-events-none sm:w-auto sm:flex-1"
            >
              {isSubmitting ? (
                <Loader2 data-icon="inline-start" className="animate-spin" />
              ) : (
                <Check data-icon="inline-start" />
              )}
              {isSubmitting ? "Scheduling..." : "Schedule Call"}
            </Button>
          </SheetFooter>
        )}
      </SheetContent>
    </Sheet>
  );
}
