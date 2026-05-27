"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetTitle,
} from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";
import {
  Calendar,
  CalendarCheck,
  Check,
  ChevronsUpDown,
  Clock,
  Loader2,
  Phone,
  User,
  X,
  ArrowLeft,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAircall } from "@/components/providers/AircallProvider";
import {
  SheetAnchoredToasts,
  useSheetAnchoredToasts,
} from "../shared/SheetAnchoredToasts";
import { FollowUpDateTimePicker } from "./FollowUpDateTimePicker";
import { AsyncCustomerCombobox } from "../shared/AsyncCustomerCombobox";
import type {
  AgentOption,
  CustomerOption,
  CreateScheduleCallFormData,
  ScheduleCall,
} from "../../types";

interface ScheduleCallSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  customers: CustomerOption[];
  agents: AgentOption[];
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
  PENDING: "bg-amber-50 text-amber-700 border-amber-200/60",
  COMPLETED: "bg-emerald-50 text-emerald-700 border-emerald-200/60",
  CANCELLED: "bg-slate-100 text-slate-500 border-slate-200/60",
  MISSED: "bg-rose-50 text-rose-700 border-rose-200/60",
};

export function ScheduleCallSheet({
  open,
  onOpenChange,
  customers,
  agents,
  onSubmit,
  isSubmitting = false,
}: ScheduleCallSheetProps) {
  const [form, setForm] = useState<CreateScheduleCallFormData>({
    customerId: "",
    agentId: "",
    scheduledAt: "",
    notes: "",
  });
  const [agentOpen, setAgentOpen] = useState(false);
  const [localAgentSearch, setLocalAgentSearch] = useState("");

  const [scheduledCalls, setScheduledCalls] = useState<ScheduleCall[]>([]);
  const [loadingList, setLoadingList] = useState(false);
  const [showCompleted, setShowCompleted] = useState(false);

  const [view, setView] = useState<"list" | "create">("list");
  const [showSuccessToast, setShowSuccessToast] = useState(false);
  const [showErrorToast, setShowErrorToast] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const { setSheetOpen } = useAircall();

  useEffect(() => {
    setSheetOpen(open);
    return () => setSheetOpen(false);
  }, [open, setSheetOpen]);

  const sheetToasts = useSheetAnchoredToasts({
    open,
    showSuccessToast,
    showErrorToast,
    onSuccessToastDismiss: () => setShowSuccessToast(false),
    onErrorToastDismiss: () => setShowErrorToast(false),
  });

  const fetchScheduledCalls = useCallback(async () => {
    try {
      setLoadingList(true);
      const res = await fetch("/api/schedule-calls?limit=50");
      const json = await res.json();
      if (json.success) {
        setScheduledCalls(json.data ?? []);
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
      setForm({ customerId: "", agentId: "", scheduledAt: "", notes: "" });
      setLocalAgentSearch("");
      setShowCompleted(false);
      setView("list");
    }
  }, [open]);

  const filteredAgents = useMemo(() => {
    if (!localAgentSearch.trim()) return agents;
    const searchLower = localAgentSearch.toLowerCase();
    return agents.filter(
      (a) =>
        a.name.toLowerCase().includes(searchLower) ||
        a.email?.toLowerCase().includes(searchLower) ||
        a.id.toString().includes(searchLower),
    );
  }, [agents, localAgentSearch]);

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
      setShowSuccessToast(true);
      setView("list");
      fetchScheduledCalls();
      setForm({ customerId: "", agentId: "", scheduledAt: "", notes: "" });
    } catch {
      setErrorMessage("Failed to schedule call");
      setShowErrorToast(true);
    }
  };

  const canSubmit = form.customerId && form.scheduledAt && !isSubmitting;

  const customerLabel = (sc: ScheduleCall) => {
    if (sc.customer?.name) return sc.customer.name;
    if (sc.customer?.phone) return `📞 ${sc.customer.phone}`;
    return `Customer #${sc.customerId}`;
  };

  return (
    <>
      <SheetAnchoredToasts
        open={open}
        toastActive={sheetToasts.toastActive}
        toastVisible={sheetToasts.toastVisible}
        errorToastActive={sheetToasts.errorToastActive}
        errorToastVisible={sheetToasts.errorToastVisible}
        onDismissSuccess={sheetToasts.dismissSuccessToast}
        onDismissError={sheetToasts.dismissErrorToast}
        successTitle="Scheduled"
        successDescription="Call scheduled successfully"
        errorTitle="Error"
        errorDescription={errorMessage}
      />
      <Sheet open={open} onOpenChange={onOpenChange} modal={false}>
      <SheetContent
        side="right"
        hideClose
        className="w-svw sm:w-[480px] p-0 gap-0 flex flex-col bg-white overflow-hidden border-l border-slate-200/80"
      >
        <SheetTitle className="sr-only">
          Schedule a Call
        </SheetTitle>

        {/* ── Top Bar ── */}
        <div className="shrink-0 bg-white border-b border-slate-100">
          <div className="flex items-center justify-between px-4 py-3">
            <div className="flex items-center gap-3 min-w-0">
              {view === "create" ? (
                <button
                  type="button"
                  onClick={() => setView("list")}
                  className="flex size-8 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-700 transition-colors"
                >
                  <ArrowLeft className="size-4" />
                </button>
              ) : (
                <span className="flex size-8 items-center justify-center rounded-lg bg-[#f0faf5] text-[#008f68]">
                  <Calendar className="size-4" />
                </span>
              )}
              <div className="min-w-0">
                <p className="text-[13px] font-bold leading-tight text-slate-900 truncate">
                  {view === "create" ? "New Schedule" : "Scheduled Calls"}
                </p>
                <p className="text-[11px] text-slate-500 truncate">
                  {view === "create"
                    ? "Set a date and time to call a customer"
                    : `${visibleCalls.length} upcoming · Manage call schedules`}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              className="flex size-8 items-center justify-center rounded-lg bg-white/90 text-slate-400 shadow-sm ring-1 ring-slate-200/80 transition-colors hover:bg-white hover:text-slate-700"
            >
              <X className="size-4" />
            </button>
          </div>
        </div>

        {/* ── Body ── */}
        <ScrollArea className="flex-1 overflow-y-auto bg-[#f4f5f7]">
          {view === "list" ? (
            /* ═══ LIST VIEW ═══ */
            <div className="p-3 space-y-3">
              {/* Action bar */}
              <button
                type="button"
                onClick={() => setView("create")}
                className="flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-[#008f68]/40 bg-[#f0faf5] px-4 py-3 text-[13px] font-semibold text-[#008f68] transition-colors hover:bg-[#008f68] hover:text-white hover:border-[#008f68]"
              >
                <Calendar className="size-4" />
                Schedule a Call
              </button>

              {/* Filter toggle */}
              <div className="flex items-center justify-between px-0.5">
                <h3 className="text-[10px] font-semibold uppercase tracking-widest text-slate-400">
                  {showCompleted ? "All entries" : "Upcoming"}
                </h3>
                <button
                  type="button"
                  onClick={() => setShowCompleted(!showCompleted)}
                  className="text-[10px] font-semibold uppercase tracking-wider text-[#008f68] hover:text-[#007a5a] transition-colors"
                >
                  {showCompleted ? "Hide completed" : "Show all"}
                </button>
              </div>

              {/* List */}
              {loadingList ? (
                <div className="flex items-center justify-center py-10 text-slate-400">
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  <span className="text-xs">Loading...</span>
                </div>
              ) : visibleCalls.length === 0 ? (
                <div className="rounded-xl border border-dashed border-slate-200 bg-white px-4 py-10 text-center">
                  <CalendarCheck className="mx-auto h-8 w-8 text-slate-300 mb-2" />
                  <p className="text-[13px] font-semibold text-slate-400">
                    No scheduled calls
                  </p>
                  <p className="text-[11px] text-slate-400 mt-1">
                    Click above to schedule one.
                  </p>
                </div>
              ) : (
                <div className="space-y-1.5">
                  {visibleCalls.map((sc) => {
                    const isOverdue =
                      sc.status === "PENDING" &&
                      new Date(sc.scheduledAt) <= new Date();
                    return (
                      <div
                        key={sc.id}
                        className={cn(
                          "flex items-start gap-3 rounded-xl border bg-white px-3 py-3 transition-colors",
                          isOverdue
                            ? "border-rose-200/80 bg-rose-50/40"
                            : "border-slate-200/80 hover:border-slate-300",
                        )}
                      >
                        <div
                          className={cn(
                            "mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg",
                            isOverdue
                              ? "bg-rose-100 text-rose-600"
                              : "bg-[#f0faf5] text-[#008f68]",
                          )}
                        >
                          <Phone className="h-3.5 w-3.5" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5">
                            <span className="truncate text-[13px] font-semibold text-slate-800">
                              {customerLabel(sc)}
                            </span>
                            {isOverdue && (
                              <span className="shrink-0 rounded bg-rose-100 px-1 py-0.5 text-[9px] font-bold uppercase tracking-wider text-rose-600">
                                Overdue
                              </span>
                            )}
                          </div>
                          <div className="mt-1 flex items-center gap-2 text-[12px] text-slate-500">
                            <Clock className="h-3.5 w-3.5 shrink-0" />
                            <span>
                              {format(
                                new Date(sc.scheduledAt),
                                "MMM d, yyyy · h:mm a",
                              )}
                            </span>
                          </div>
                          {sc.notes && (
                            <p className="mt-1 text-[12px] text-slate-400 line-clamp-2">
                              {sc.notes}
                            </p>
                          )}
                          <div className="mt-2 flex items-center gap-2">
                            <span
                              className={cn(
                                "inline-flex items-center rounded-md border px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider",
                                statusColors[sc.status] ||
                                  "bg-slate-50 text-slate-500 border-slate-200",
                              )}
                            >
                              {statusLabel[sc.status] || sc.status}
                            </span>
                            {sc.agent && (
                              <span className="flex items-center gap-1 text-[11px] text-slate-400">
                                <User className="h-3 w-3" />
                                {sc.agent.name}
                              </span>
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
            <div className="p-3 space-y-4">
              {/* Customer */}
              <div className="space-y-2">
                <Label className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
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

              {/* Date & Time */}
              <div className="space-y-2">
                <Label className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                  Date & Time <span className="text-red-500">*</span>
                </Label>
                <FollowUpDateTimePicker
                  value={form.scheduledAt}
                  onChange={(iso) => setForm({ ...form, scheduledAt: iso })}
                  placeholder="Pick date & time"
                />
              </div>

              {/* Assign Agent */}
              <div className="space-y-2">
                <Label className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                  Assign Agent
                </Label>
                <Popover
                  open={agentOpen}
                  onOpenChange={(o) => {
                    setAgentOpen(o);
                    if (!o) setLocalAgentSearch("");
                  }}
                >
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      aria-expanded={agentOpen}
                      className={cn(
                        "w-full justify-between h-9 rounded-lg border border-slate-200/80 bg-white px-2.5 text-xs hover:border-slate-300",
                        !form.agentId && "text-slate-400",
                      )}
                    >
                      {form.agentId
                        ? agents.find((a) => a.id.toString() === form.agentId)
                            ?.name || "Unassigned"
                        : "Unassigned"}
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-full p-0" align="start">
                    <div className="flex flex-col">
                      <div className="px-3 py-2 border-b">
                        <Input
                          placeholder="Search agent..."
                          value={localAgentSearch}
                          onChange={(e) => setLocalAgentSearch(e.target.value)}
                          className="h-9 text-xs"
                        />
                      </div>
                      <ScrollArea className="h-48">
                        <div className="p-1">
                          <div
                            className={cn(
                              "relative flex cursor-pointer select-none items-center rounded-sm px-2 py-2 text-xs outline-none hover:bg-accent hover:text-accent-foreground",
                              !form.agentId && "bg-accent",
                            )}
                            onClick={() => {
                              setForm({ ...form, agentId: "" });
                              setLocalAgentSearch("");
                              setAgentOpen(false);
                            }}
                          >
                            <Check
                              className={cn(
                                "mr-2 h-4 w-4",
                                !form.agentId ? "opacity-100" : "opacity-0",
                              )}
                            />
                            Unassigned
                          </div>
                          {filteredAgents.map((a) => (
                            <div
                              key={a.id}
                              className={cn(
                                "relative flex cursor-pointer select-none items-center rounded-sm px-2 py-2 text-xs outline-none hover:bg-accent hover:text-accent-foreground",
                                form.agentId === a.id.toString() && "bg-accent",
                              )}
                              onClick={() => {
                                setForm({
                                  ...form,
                                  agentId: a.id.toString(),
                                });
                                setLocalAgentSearch("");
                                setAgentOpen(false);
                              }}
                            >
                              <Check
                                className={cn(
                                  "mr-2 h-4 w-4",
                                  form.agentId === a.id.toString()
                                    ? "opacity-100"
                                    : "opacity-0",
                                )}
                              />
                              <span>{a.name}</span>
                            </div>
                          ))}
                        </div>
                      </ScrollArea>
                    </div>
                  </PopoverContent>
                </Popover>
              </div>

              {/* Notes */}
              <div className="space-y-2">
                <Label className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                  Notes
                </Label>
                <Textarea
                  placeholder="Add notes about this scheduled call..."
                  value={form.notes}
                  onChange={(e) =>
                    setForm({ ...form, notes: e.target.value })
                  }
                  className="min-h-24 resize-y text-xs bg-white border-slate-200/80 rounded-lg"
                />
              </div>
            </div>
          )}
        </ScrollArea>

        {/* ── Footer ── */}
        {view === "create" && (
          <div className="shrink-0 flex items-center justify-end gap-3 border-t border-slate-100 bg-slate-50/80 px-4 py-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => setView("list")}
              disabled={isSubmitting}
              className="h-10 rounded-lg border-slate-200 bg-white px-4 text-xs font-semibold text-slate-700 shadow-sm hover:bg-slate-50"
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleSubmit}
              disabled={!canSubmit}
              className="h-10 rounded-lg bg-[#008f68] px-5 text-xs font-semibold text-white shadow-sm hover:bg-[#007a5a] disabled:opacity-60"
            >
              {isSubmitting && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              {isSubmitting ? "Scheduling..." : "Schedule Call"}
            </Button>
          </div>
        )}
      </SheetContent>
    </Sheet>
    </>
  );
}
