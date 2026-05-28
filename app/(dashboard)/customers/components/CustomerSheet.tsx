"use client";

import { useCallback, useEffect, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import type { LucideIcon } from "lucide-react";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Building2,
  Check,
  ChevronRight,
  Clock,
  Copy,
  History,
  Megaphone,
  Pencil,
  Phone,
  PhoneCall,
  RefreshCw,
  Ticket,
  Trash2,
  Users,
  X,
} from "lucide-react";
import { fetchFromBackend } from "@/lib/api-client";
import { useAircall } from "@/components/providers/AircallProvider";
import { useRole } from "@/components/providers/role-provider";
import { ActivitiesIcon } from "@/components/icons/activities-icon";
import { cn } from "@/lib/utils";
import type { Customer } from "../types";
import { CustomerPinnedNotes } from "./CustomerPinnedNotes";
import { CustomerTimelinePanel } from "./CustomerTimelinePanel";
import {
  fetchCustomerNotes,
  mergeCustomerNotes,
  normalizeCustomerNotes,
} from "../utils/notes";

interface CustomerSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  customer: Customer | null;
  /** Re-open timeline panel when returning from /calls?returnTo=...&timeline=1 */
  openTimelineFromUrl?: boolean;
  onEdit?: (customer: Customer) => void;
  onDelete?: (customer: Customer) => void;
}

function hasText(value?: string | null): value is string {
  return Boolean(value?.trim());
}

function formatShortDate(value?: string | null) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function SectionLabel({ children }: { children: ReactNode }) {
  return (
    <p className="mb-2 text-[10px] font-semibold uppercase tracking-widest text-slate-400 dark:text-slate-500">
      {children}
    </p>
  );
}

function CopyButton({
  onCopy,
  copied,
  label = "Copy",
  disabled = false,
}: {
  onCopy: () => void;
  copied: boolean;
  label?: string;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onCopy}
      disabled={disabled}
      aria-label={label}
      title={label}
      className={cn(
        "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border bg-white transition-all duration-200 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#008f68]/35 dark:bg-slate-950",
        disabled
          ? "cursor-not-allowed border-slate-100 text-slate-300 dark:border-slate-800 dark:text-slate-700"
          : copied
            ? "border-emerald-200 bg-emerald-50 text-emerald-600 dark:border-emerald-500/30 dark:bg-emerald-500/15 dark:text-emerald-300"
            : "border-slate-200/80 text-slate-400 hover:border-slate-300 hover:bg-slate-50 hover:text-slate-700 dark:border-slate-800 dark:text-slate-500 dark:hover:border-slate-700 dark:hover:bg-slate-900 dark:hover:text-slate-200",
      )}
    >
      {copied ? (
        <Check className="h-4 w-4" strokeWidth={2.5} />
      ) : (
        <Copy className="h-4 w-4" strokeWidth={2} />
      )}
    </button>
  );
}

const ROW_ICON_CLASS =
  "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-slate-200/80 bg-slate-50 text-slate-400 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-500";

function DetailRow({
  icon: Icon,
  label,
  value,
  actions,
  multiline = false,
}: {
  icon: LucideIcon;
  label: string;
  value: ReactNode;
  actions?: ReactNode;
  multiline?: boolean;
}) {
  return (
    <div
      className={cn(
        "flex gap-3 px-3.5",
        multiline ? "items-start py-3" : "min-h-[52px] items-center py-1.5",
      )}
    >
      <div className={cn(ROW_ICON_CLASS, multiline && "mt-0.5")}>
        <Icon className="h-4 w-4 shrink-0" strokeWidth={2} />
      </div>
      <div
        className={cn(
          "flex min-w-0 flex-1 flex-col justify-center py-1",
          multiline ? "gap-1.5" : "gap-0.5",
        )}
      >
        <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
          {label}
        </p>
        <div className="min-w-0 text-xs font-medium leading-relaxed text-slate-700 dark:text-slate-100">
          {value}
        </div>
      </div>
      {actions ? (
        <div className={cn("shrink-0", multiline && "mt-0.5")}>{actions}</div>
      ) : null}
    </div>
  );
}

function MetricTile({
  icon: Icon,
  label,
  value,
  helper,
}: {
  icon: LucideIcon;
  label: string;
  value: string;
  helper?: string;
}) {
  return (
    <div className="min-w-0 rounded-xl border border-slate-200/80 bg-white px-2.5 py-2 shadow-[0_1px_3px_rgba(0,0,0,0.06)] dark:border-slate-800 dark:bg-slate-950">
      <div className="flex items-center gap-1.5 text-slate-400">
        <Icon className="h-3.5 w-3.5 shrink-0 text-[#008f68]" strokeWidth={2} />
        <p className="truncate text-[9px] font-semibold uppercase tracking-wide">
          {label}
        </p>
      </div>
      <p className="mt-1 truncate text-lg font-bold leading-tight tabular-nums text-slate-900 dark:text-slate-50">
        {value}
      </p>
      {helper ? (
        <p className="mt-0.5 truncate text-[10px] font-medium text-slate-500 dark:text-slate-400">
          {helper}
        </p>
      ) : null}
    </div>
  );
}

function SheetAction({
  icon: Icon,
  label,
  onClick,
  disabled,
  primary = false,
  danger = false,
  className: actionClassName,
}: {
  icon: LucideIcon;
  label: string;
  onClick?: () => void;
  disabled?: boolean;
  primary?: boolean;
  danger?: boolean;
  className?: string;
}) {
  const className = cn(
    "flex min-h-10 flex-1 items-center justify-center gap-1.5 rounded-xl border px-2 text-[11px] font-semibold transition-all active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#008f68]/35 sm:text-[12px]",
    actionClassName,
    disabled &&
      "cursor-not-allowed border-slate-200 bg-slate-100 text-slate-400 dark:border-slate-800 dark:bg-slate-900",
    !disabled &&
      primary &&
      "border-[#008f68] bg-[#008f68] text-white shadow-sm hover:bg-[#007a5a]",
    !disabled &&
      danger &&
      "border-red-200 bg-white text-red-600 hover:bg-red-50 dark:border-red-900/50 dark:bg-slate-950 dark:hover:bg-red-950/30",
    !disabled &&
      !primary &&
      !danger &&
      "border-slate-200/80 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-200 dark:hover:bg-slate-900",
  );

  const content = (
    <>
      <Icon className="h-3.5 w-3.5 shrink-0 sm:h-4 sm:w-4" strokeWidth={2.2} />
      <span className="min-w-0 truncate">{label}</span>
    </>
  );

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={className}
    >
      {content}
    </button>
  );
}

export function CustomerSheet({
  open,
  onOpenChange,
  customer,
  openTimelineFromUrl = false,
  onEdit,
  onDelete,
}: CustomerSheetProps) {
  const router = useRouter();
  const { role } = useRole();
  const isAgent = role?.toString().toLowerCase() === "agent";
  const {
    dial,
    status: aircallStatus,
    isLoggedIn: aircallLoggedIn,
    setSheetOpen,
  } = useAircall();
  const canDial = aircallStatus === "ready" && aircallLoggedIn;
  const canPlayRecordings = !isAgent;

  const [detail, setDetail] = useState<Customer | null>(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [timelineRefreshKey, setTimelineRefreshKey] = useState(0);
  const [timelineOpen, setTimelineOpen] = useState(false);

  useEffect(() => {
    setSheetOpen(open);
    return () => setSheetOpen(false);
  }, [open, setSheetOpen]);

  useEffect(() => {
    if (!open) setTimelineOpen(false);
  }, [open]);

  useEffect(() => {
    if (open && openTimelineFromUrl) {
      setTimelineOpen(true);
    }
  }, [open, openTimelineFromUrl]);

  const buildReturnTo = useCallback(() => {
    const id = detail?.id ?? customer?.id;
    if (!id) return "/customers";
    const params = new URLSearchParams();
    params.set("customerId", String(id));
    params.set("timeline", "1");
    return `/customers?${params.toString()}`;
  }, [detail?.id, customer?.id]);

  const goToCall = useCallback(
    (callId: number) => {
      const returnTo = encodeURIComponent(buildReturnTo());
      router.push(`/calls?id=${callId}&returnTo=${returnTo}`);
    },
    [buildReturnTo, router],
  );

  const goToTicket = useCallback(
    (ticketId: number) => {
      const returnTo = encodeURIComponent(buildReturnTo());
      router.push(`/calls?tab=tickets&id=${ticketId}&returnTo=${returnTo}`);
    },
    [buildReturnTo, router],
  );

  const goToManualRecord = useCallback(
    (recordId: number) => {
      const returnTo = encodeURIComponent(buildReturnTo());
      router.push(
        `/calls?tab=manual-records&id=${recordId}&returnTo=${returnTo}`,
      );
    },
    [buildReturnTo, router],
  );

  useEffect(() => {
    if (!customer?.id) {
      setDetail(null);
      return;
    }

    setDetail(customer);
    let cancelled = false;

    const load = async () => {
      try {
        setLoading(true);
        const [fetched, notes] = await Promise.all([
          fetchFromBackend(`/customers/${customer.id}`),
          fetchCustomerNotes(customer.id).catch(() => []),
        ]);
        if (!cancelled) {
          const base =
            (fetched as { data?: Customer })?.data ?? (fetched as Customer);
          const mergedNotes =
            notes.length > 0
              ? notes
              : normalizeCustomerNotes(base.notes ?? []);
          setDetail(
            mergeCustomerNotes({ ...base, notes: mergedNotes }, mergedNotes),
          );
        }
      } catch {
        if (!cancelled) setDetail(customer);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();

    return () => {
      cancelled = true;
    };
  }, [customer]);

  useEffect(() => {
    if (!copied) return;
    const t = window.setTimeout(() => setCopied(false), 2000);
    return () => window.clearTimeout(t);
  }, [copied]);

  const data = detail || customer;
  const callCount = data?.callCount ?? data?.totalCalls ?? 0;
  const ticketCount = data?.ticketCount ?? 0;
  const openCount = data?.openTickets ?? 0;
  const timelineCount = callCount + ticketCount;
  const customerYards =
    data?.yards && data.yards.length > 0
      ? data.yards
      : data?.yard
        ? [data.yard]
        : [];

  const copyPhone = async () => {
    if (!hasText(data?.phone)) return;
    try {
      await navigator.clipboard.writeText(data.phone.trim());
      setCopied(true);
    } catch {
      setCopied(false);
    }
  };

  const showEdit = Boolean(onEdit && !isAgent);
  const showDelete = Boolean(onDelete && !isAgent);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        hideClose
        className={cn(
          "flex h-dvh flex-row gap-0 overflow-hidden p-0",
          "border-l border-slate-200/80 bg-[#f4f5f7] text-slate-900 antialiased",
          "shadow-2xl shadow-slate-900/15 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-50",
          timelineOpen
            ? "w-[min(1280px,calc(100vw-1rem))] max-w-[calc(100vw-1rem)]"
            : "w-full max-w-[560px] sm:w-[min(560px,calc(100vw-2rem))]",
        )}
      >
        {timelineOpen && data ? (
          <div className="min-h-0 min-w-0 flex-1 overflow-hidden">
            <CustomerTimelinePanel
              customerId={data.id}
              customerName={data.name}
              eventHint={timelineCount}
              canPlayRecordings={canPlayRecordings}
              refreshKey={timelineRefreshKey}
              onClose={() => setTimelineOpen(false)}
              onViewCall={goToCall}
              onViewTicket={goToTicket}
              onViewManualRecord={goToManualRecord}
            />
          </div>
        ) : null}

        <div
          className={cn(
            "ml-auto flex min-h-0 min-w-0 flex-col",
            timelineOpen &&
              "w-full max-w-[560px] shrink-0 sm:w-[min(560px,calc(100vw-2rem))] sm:flex-none",
            !timelineOpen && "flex-1",
          )}
        >
          {!data ? (
            <>
              <SheetHeader className="sr-only">
                <SheetTitle>Customer details</SheetTitle>
                <SheetDescription>No customer selected.</SheetDescription>
              </SheetHeader>
              <div className="flex min-h-0 flex-1 items-center justify-center p-8 text-center">
                <p className="text-sm text-slate-500">
                  Select a customer from the table.
                </p>
              </div>
            </>
          ) : (
            <>
              <SheetHeader className="sr-only">
                <SheetTitle>{data.name || "Customer details"}</SheetTitle>
                <SheetDescription>
                  Customer profile with contact, campaigns, and activity.
                </SheetDescription>
              </SheetHeader>

              <div className="relative flex h-full min-h-0 flex-col">
                <div className="relative shrink-0 overflow-hidden border-b border-slate-200/80 bg-white shadow-[0_1px_3px_rgba(0,0,0,0.06)] dark:border-slate-800 dark:bg-slate-950">
                  <div className="h-px bg-gradient-to-r from-transparent via-[#008f68]/45 to-transparent" />
                  <SheetClose
                    aria-label="Close customer details"
                    className="absolute right-3 top-3 z-20 flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200/80 bg-white text-slate-400 shadow-sm transition-all hover:bg-slate-50 hover:text-slate-700 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#008f68]/35 dark:border-slate-800 dark:bg-slate-950 dark:hover:bg-slate-900 dark:hover:text-slate-200"
                  >
                    <X className="h-5 w-5" strokeWidth={2} />
                  </SheetClose>

                  <div className="px-4 pb-3.5 pt-4 sm:px-5">
                    <div className="flex items-start gap-3 pr-10">
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-emerald-100 bg-[#f0faf5] text-[#008f68] shadow-sm dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-400">
                        <Users className="h-5 w-5" strokeWidth={2} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <span className="inline-flex rounded-md bg-slate-100 px-1.5 py-0.5 font-mono text-[10px] font-semibold text-slate-500 dark:bg-slate-900 dark:text-slate-400">
                          #{data.id}
                        </span>
                        {loading ? (
                          <span className="ml-1.5 inline-flex items-center gap-1 text-[10px] font-semibold text-slate-400">
                            <RefreshCw className="h-3 w-3 animate-spin" />
                          </span>
                        ) : null}
                        <h2 className="mt-1 text-[18px] font-bold leading-tight text-slate-900 [overflow-wrap:anywhere] dark:text-white">
                          {data.name || "Unknown Customer"}
                        </h2>
                        <p className="mt-0.5 text-[12px] text-slate-500">
                          Customer since {formatShortDate(data.createdAt)}
                        </p>
                      </div>
                    </div>

                    <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
                      <MetricTile
                        icon={Phone}
                        label="Calls"
                        value={String(callCount)}
                        helper="All time"
                      />
                      <MetricTile
                        icon={ActivitiesIcon}
                        label="Open"
                        value={String(openCount)}
                        helper={openCount > 0 ? "Active" : "None"}
                      />
                      <MetricTile
                        icon={Clock}
                        label="Last"
                        value={formatShortDate(data.lastContactAt)}
                        helper="Contact"
                      />
                      <MetricTile
                        icon={Ticket}
                        label="Tickets"
                        value={String(ticketCount)}
                        helper="Total"
                      />
                    </div>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setTimelineOpen(true);
                      }}
                      className={cn(
                        "mt-2.5 flex w-full items-center gap-2 rounded-xl border px-3 py-2 text-left transition-all active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#008f68]/25",
                        timelineOpen
                          ? "border-[#008f68]/30 bg-[#f0faf5] ring-2 ring-[#008f68]/15"
                          : "border-[#008f68]/20 bg-[#f0faf5] text-[#008f68] hover:border-[#008f68]/35 hover:bg-[#e8faf0]",
                      )}
                    >
                      <History className="h-4 w-4 shrink-0" strokeWidth={2} />
                      <span className="min-w-0 flex-1 text-[12px] font-semibold text-[#008f68]">
                        Activity timeline
                      </span>
                      <span className="rounded-md border border-white/80 bg-white px-1.5 py-0.5 font-mono text-[10px] font-bold text-[#008f68] shadow-sm dark:border-slate-700 dark:bg-slate-900">
                        {timelineCount}
                      </span>
                      <ChevronRight className="h-3.5 w-3.5 shrink-0 opacity-70" />
                    </button>
                  </div>
                </div>

                <div className="scrollbar-app min-h-0 flex-1 overflow-y-auto overscroll-contain">
                  <div className="space-y-4 px-4 py-3 pb-4 sm:px-5">
                    <div>
                      <SectionLabel>Customer details</SectionLabel>
                      <div className="divide-y divide-slate-100 overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-[0_1px_3px_rgba(0,0,0,0.06)] dark:divide-slate-800 dark:border-slate-800 dark:bg-slate-950">
                        <DetailRow
                          icon={Phone}
                          label="Phone"
                          value={
                            <p className="font-mono font-bold text-slate-900 dark:text-white">
                              {data.phone || "—"}
                            </p>
                          }
                          actions={
                            hasText(data.phone) ? (
                              <CopyButton
                                copied={copied}
                                label="Copy phone"
                                onCopy={copyPhone}
                              />
                            ) : null
                          }
                        />
                        {customerYards.length > 0 ? (
                          <DetailRow
                            multiline
                            icon={Building2}
                            label="Yards"
                            value={
                              <div className="flex flex-wrap gap-1.5">
                                {customerYards.map((yard) => (
                                  <span
                                    key={yard.id}
                                    className="inline-flex max-w-full rounded-md border border-emerald-100 bg-[#f0faf5] px-2 py-0.5 text-[11px] font-semibold text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950/30 dark:text-emerald-300"
                                    title={yard.name}
                                  >
                                    <span className="truncate">{yard.name}</span>
                                  </span>
                                ))}
                              </div>
                            }
                          />
                        ) : null}
                        {data.campaigns && data.campaigns.length > 0 ? (
                          <DetailRow
                            multiline
                            icon={Megaphone}
                            label="Campaigns"
                            value={
                              <div className="flex flex-wrap gap-1.5">
                                {data.campaigns.map((camp) => (
                                  <span
                                    key={camp.id}
                                    className="inline-flex max-w-full rounded-md border border-slate-200/80 bg-slate-50 px-2 py-0.5 text-[11px] font-semibold text-slate-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
                                  >
                                    {camp.nombre}
                                  </span>
                                ))}
                              </div>
                            }
                          />
                        ) : null}
                      </div>
                    </div>

                    <div>
                      <SectionLabel>Notes</SectionLabel>
                      <CustomerPinnedNotes
                        customer={data}
                        canEditPinned={!isAgent}
                        canManageNotes={!isAgent}
                        onCustomerChange={setDetail}
                        onNotesMutated={() =>
                          setTimelineRefreshKey((value) => value + 1)
                        }
                      />
                    </div>
                  </div>
                </div>

                <div className="shrink-0 border-t border-slate-200/80 bg-white/90 p-4 pb-[calc(1rem+env(safe-area-inset-bottom))] backdrop-blur-sm dark:border-slate-800 dark:bg-slate-950/90">
                  <div className="flex flex-wrap gap-2">
                    <SheetAction
                      icon={PhoneCall}
                      label="Call"
                      disabled={!hasText(data.phone) || !canDial}
                      primary
                      onClick={() => {
                        if (!data.phone) return;
                        dial(data.phone.trim(), data.id);
                      }}
                    />
                    {showEdit ? (
                      <SheetAction
                        icon={Pencil}
                        label="Edit"
                        primary
                        onClick={() => {
                          onOpenChange(false);
                          onEdit?.(data);
                        }}
                      />
                    ) : null}
                    {showDelete ? (
                      <SheetAction
                        icon={Trash2}
                        label="Delete"
                        danger
                        onClick={() => {
                          onOpenChange(false);
                          onDelete?.(data);
                        }}
                      />
                    ) : null}
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
