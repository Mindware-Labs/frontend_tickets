"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetTitle,
} from "@/components/ui/sheet";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Calendar,
  CalendarCheck,
  Clock,
  Loader2,
  Phone,
  X,
  ArrowLeft,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { shouldIgnoreTicketSheetOutsideEvent } from "@/lib/ticket-sheet-outside-interaction";
import { toast } from "@/hooks/use-toast";
import { useAircall } from "@/components/providers/AircallProvider";
import { FollowUpDateTimePicker } from "./FollowUpDateTimePicker";
import { AsyncCustomerCombobox } from "../shared/AsyncCustomerCombobox";
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

// Module-level cache to make the modal load instantly (0ms) on opening
let cachedCalls: ScheduleCall[] | null = null;

export function ScheduleCallSheet({
  open,
  onOpenChange,
  customers,
  onSubmit,
  isSubmitting = false,
}: ScheduleCallSheetProps) {
  const [form, setForm] = useState<CreateScheduleCallFormData>({
    customerId: "",
    scheduledAt: "",
    notes: "",
  });

  const [scheduledCalls, setScheduledCalls] = useState<ScheduleCall[]>(() => cachedCalls ?? []);
  const [loadingList, setLoadingList] = useState(() => !cachedCalls);
  const [showCompleted, setShowCompleted] = useState(false);

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

  const handleSubmit = async () => {
    if (!form.customerId) return;
    if (!form.scheduledAt) return;
    try {
      await onSubmit(form);
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

  const customerLabel = (sc: ScheduleCall) => {
    if (sc.customer?.name) return sc.customer.name;
    if (sc.customer?.phone) return `📞 ${sc.customer.phone}`;
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
                    ? "Set a date and time to call a customer"
                    : `${visibleCalls.length} upcoming · Manage call schedules`}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* ── Body ── */}
        <div className="flex-1 min-h-0 overflow-y-auto bg-[#f4f5f7] dark:bg-slate-900/10 scrollbar-app">
          {view === "list" ? (
            /* ═══ LIST VIEW ═══ */
            <div className="p-4 space-y-4">
              {/* Action bar */}
              <button
                type="button"
                onClick={() => setView("create")}
                className="group flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-[#008f68]/40 bg-[#f0faf5] px-4 py-3.5 text-xs font-semibold text-[#008f68] transition-all hover:bg-[#008f68] hover:text-white hover:border-[#008f68] dark:border-emerald-500/25 dark:bg-emerald-950/15 dark:text-emerald-400 dark:hover:bg-emerald-600 dark:hover:text-white dark:hover:border-emerald-600 shadow-sm"
              >
                <Calendar className="size-3.5 transition-transform group-hover:scale-110" />
                Schedule a Call
              </button>

              {/* Filter toggle */}
              <div className="flex items-center justify-between px-1">
                <h3 className="text-[10px] font-semibold uppercase tracking-widest text-slate-450 dark:text-slate-500">
                  {showCompleted ? "All entries" : "Upcoming schedules"}
                </h3>
                <button
                  type="button"
                  onClick={() => setShowCompleted(!showCompleted)}
                  className="text-[10px] font-semibold uppercase tracking-wider text-[#008f68] hover:text-[#007a5a] transition-colors dark:text-emerald-400 dark:hover:text-emerald-300"
                >
                  {showCompleted ? "Hide completed" : "Show all"}
                </button>
              </div>

              {/* List */}
              {loadingList ? (
                <div className="flex flex-col items-center justify-center py-12 text-slate-450 dark:text-slate-500">
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
                    Click above to schedule one.
                  </p>
                </div>
              ) : (
                <div className="space-y-2.5">
                  {visibleCalls.map((sc) => {
                    const isOverdue =
                      sc.status === "PENDING" &&
                      new Date(sc.scheduledAt) <= new Date();
                    return (
                      <div
                        key={sc.id}
                        className={cn(
                          "relative overflow-hidden rounded-xl border p-3.5 pl-4 shadow-[0_1px_2px_rgba(0,0,0,0.03)] transition-all duration-200 hover:shadow-md",
                          isOverdue
                            ? "border-rose-200/80 bg-[#fff8f8] dark:border-rose-950/40 dark:bg-[#200c0f]"
                            : "border-slate-200/80 bg-white hover:border-slate-350 dark:border-slate-800 dark:bg-slate-950 dark:hover:border-slate-700",
                        )}
                      >
                        {/* Left Accent Stripe */}
                        <div
                          className={cn(
                            "absolute left-0 top-0 bottom-0 w-[3px]",
                            isOverdue ? "bg-rose-500 animate-pulse" : "bg-[#008f68] dark:bg-emerald-500",
                          )}
                        />
                        <div className="flex items-start gap-3">
                          {/* Icon box */}
                          <div
                            className={cn(
                              "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg shadow-sm border",
                              isOverdue
                                ? "border-rose-100 bg-rose-50 text-rose-600 dark:border-rose-900/30 dark:bg-rose-950/40 dark:text-rose-400"
                                : "border-emerald-100 bg-[#f0faf5] text-[#008f68] dark:border-emerald-950/30 dark:bg-emerald-950/40 dark:text-emerald-400",
                            )}
                          >
                            <Phone className="h-3.5 w-3.5" />
                          </div>
                          {/* Card Details */}
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center justify-between gap-2">
                              <span className="truncate text-xs font-semibold text-slate-850 dark:text-slate-200">
                                {customerLabel(sc)}
                              </span>
                              <div className="flex shrink-0 items-center gap-1.5">
                                {isOverdue && (
                                  <span className="shrink-0 rounded bg-rose-100 dark:bg-rose-950/80 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-rose-600 dark:text-rose-455">
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
                                  <span className={cn("size-1 rounded-full", statusDotColors[sc.status] || "bg-slate-400")} />
                                  {statusLabel[sc.status] || sc.status}
                                </span>
                              </div>
                            </div>

                            <div className="mt-1.5 flex items-center gap-1.5 text-[11px] text-slate-500 dark:text-slate-400">
                              <Clock className="h-3.5 w-3.5 shrink-0 text-slate-400 dark:text-slate-550" />
                              <span>
                                {format(
                                  new Date(sc.scheduledAt),
                                  "MMM d, yyyy · h:mm a",
                                )}
                              </span>
                            </div>

                            {sc.notes && (
                              <p className="mt-2 rounded-lg bg-slate-50/60 dark:bg-slate-900/40 p-2 text-[11px] text-slate-500 dark:text-slate-400 border border-slate-100/80 dark:border-slate-800/80 line-clamp-2 leading-relaxed">
                                {sc.notes}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          ) : (
            /* ═══ CREATE VIEW ═══ */
            <div className="p-3">
              <div className="overflow-hidden rounded-xl border border-slate-200/80 bg-white p-4.5 shadow-[0_1px_3px_rgba(0,0,0,0.06)] dark:border-slate-850 dark:bg-slate-950 space-y-4">
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
                    className="min-h-[100px] w-full resize-none rounded-lg border border-slate-200 bg-slate-50/50 px-3 py-2 text-xs text-slate-900 shadow-none transition-colors hover:border-slate-350 focus:border-[#008f68] focus:bg-white focus:ring-2 focus:ring-[#008f68]/20 dark:border-slate-800 dark:bg-slate-900/60 dark:text-slate-100 dark:placeholder:text-slate-500"
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ── Footer ── */}
        {view === "create" && (
          <div className="shrink-0 flex items-center justify-end gap-3 border-t border-slate-100 bg-slate-50/80 px-5 py-3.5 dark:border-slate-800 dark:bg-slate-900/60">
            <Button
              type="button"
              variant="outline"
              onClick={() => setView("list")}
              disabled={isSubmitting}
              className="h-9 rounded-lg border-slate-200 bg-white px-4 text-xs font-semibold text-slate-700 shadow-sm hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-300 dark:hover:bg-slate-900"
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleSubmit}
              disabled={!canSubmit}
              className="h-9 rounded-lg bg-[#008f68] px-5 text-xs font-semibold text-white shadow-sm hover:bg-[#007a5a] disabled:opacity-60 disabled:pointer-events-none dark:bg-emerald-600 dark:hover:bg-emerald-700"
            >
              {isSubmitting && (
                <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
              )}
              {isSubmitting ? "Scheduling..." : "Schedule Call"}
            </Button>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
