"use client";

import { useCallback, useEffect, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import type { LucideIcon } from "lucide-react";
import Link from "next/link";
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
  Clock,
  Copy,
  History,
  ChevronRight,
  Megaphone,
  Pencil,
  Phone,
  PhoneCall,
  RefreshCw,
  Ticket,
  Trash2,
  X,
} from "lucide-react";
import { fetchFromBackend } from "@/lib/api-client";
import { useAircall } from "@/components/providers/AircallProvider";
import { useRole } from "@/components/providers/role-provider";
import { ActivitiesIcon } from "@/components/icons/activities-icon";
import { cn } from "@/lib/utils";
import type { Customer } from "../types";
import { CustomerMark } from "./CustomerMark";
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

function formatDate(value?: string | null) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatShortDate(value?: string | null) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function SectionLabel({ children }: { children: ReactNode }) {
  return (
    <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.14em] text-slate-500 dark:text-slate-400">
      {children}
    </p>
  );
}

function DetailsCard({ children }: { children: ReactNode }) {
  return (
    <div className="overflow-hidden rounded-xl border border-slate-200/70 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-950">
      {children}
    </div>
  );
}

function DetailsRow({
  icon: Icon,
  label,
  children,
  iconClassName,
}: {
  icon: LucideIcon;
  label: string;
  children: ReactNode;
  iconClassName?: string;
}) {
  return (
    <div className="flex gap-3 border-b border-slate-100 px-3.5 py-3 last:border-b-0 dark:border-slate-800">
      <Icon
        className={cn("mt-0.5 h-4 w-4 shrink-0 text-slate-400", iconClassName)}
      />
      <div className="min-w-0 flex-1">
        <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-slate-400">
          {label}
        </p>
        <div className="mt-1">{children}</div>
      </div>
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
    <div className="min-w-0 rounded-lg border border-slate-200/70 bg-white px-2 py-2 shadow-sm dark:border-slate-800 dark:bg-slate-950">
      <div className="flex items-center gap-1 text-slate-400">
        <Icon className="h-3 w-3 shrink-0" strokeWidth={2} />
        <p className="truncate text-[9px] font-bold uppercase tracking-[0.06em]">
          {label}
        </p>
      </div>
      <p className="mt-0.5 text-[14px] font-bold leading-tight text-slate-900 dark:text-slate-50">
        {value}
      </p>
      {helper ? (
        <p className="text-[9px] font-medium text-slate-500">{helper}</p>
      ) : null}
    </div>
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
          setDetail(mergeCustomerNotes({ ...base, notes: mergedNotes }, mergedNotes));
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

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        hideClose
        className={cn(
          "flex h-dvh flex-row gap-0 overflow-hidden p-0",
          "border-l border-slate-200/80 bg-slate-50 text-slate-900 antialiased",
          "shadow-2xl shadow-slate-900/15 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-50",
          timelineOpen
            ? "w-[min(1280px,calc(100vw-1rem))] max-w-[calc(100vw-1rem)]"
            : "w-full max-w-[560px] sm:w-[min(560px,calc(100vw-2rem))]",
        )}
      >
        {timelineOpen && data ? (
          <CustomerTimelinePanel
            customerId={data.id}
            customerName={data.name}
            eventHint={callCount + ticketCount}
            canPlayRecordings={canPlayRecordings}
            refreshKey={timelineRefreshKey}
            onClose={() => setTimelineOpen(false)}
            onViewCall={goToCall}
            onViewTicket={goToTicket}
          />
        ) : null}

        <div
          className={cn(
            "flex min-h-0 min-w-0 flex-1 flex-col",
            timelineOpen && "w-[min(520px,42%)] shrink-0",
          )}
        >
        {!data ? (
          <>
            <SheetHeader className="sr-only">
              <SheetTitle>Customer details</SheetTitle>
              <SheetDescription>No customer selected.</SheetDescription>
            </SheetHeader>
            <div className="flex min-h-0 flex-1 items-center justify-center p-8 text-center">
              <p className="text-sm text-slate-500">Select a customer from the table.</p>
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
            <div className="relative shrink-0 border-b border-slate-200/70 bg-white dark:border-slate-800 dark:bg-slate-950">
              <SheetClose
                aria-label="Close customer details"
                className="absolute right-4 top-4 z-20 flex h-10 w-10 items-center justify-center rounded-full text-slate-400 transition-all hover:bg-slate-100 hover:text-slate-700 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#008f68]/35"
              >
                <X className="h-5 w-5" strokeWidth={2} />
              </SheetClose>

              <div className="px-5 pb-4 pt-5 sm:px-6">
                <div className="flex items-start gap-4 pr-12">
                  <CustomerMark className="h-14 w-14 rounded-2xl" iconClassName="h-6 w-6" />
                  <div className="min-w-0 flex-1 pt-0.5">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded-md bg-slate-100 px-2 py-0.5 font-mono text-[11px] font-semibold text-slate-500 dark:bg-slate-900 dark:text-slate-400">
                        #{data.id}
                      </span>
                      {loading ? (
                        <span className="inline-flex items-center gap-1 rounded-md bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-500">
                          <RefreshCw className="h-3 w-3 animate-spin" />
                          Refreshing
                        </span>
                      ) : null}
                    </div>
                    <h2 className="mt-2 text-[22px] font-bold leading-tight text-slate-950 wrap-anywhere dark:text-white">
                      {data.name || "Unknown Customer"}
                    </h2>
                    <p className="mt-1 text-[13px] font-medium text-slate-500">
                      Customer since {formatShortDate(data.createdAt)}
                    </p>
                  </div>
                </div>

                <div className="mt-3 grid grid-cols-4 gap-1.5 sm:gap-2">
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
                    "group mt-3 flex w-full items-center gap-2 rounded-lg border px-3 py-2 text-left transition-colors",
                    timelineOpen
                      ? "border-[#008f68] bg-[#e8faf0] ring-2 ring-[#008f68]/20 dark:bg-emerald-950/50"
                      : "border-[#008f68]/25 bg-[#f0faf5]/60 hover:border-[#008f68]/45 hover:bg-[#e8faf0] dark:border-emerald-800/50 dark:bg-emerald-950/30",
                  )}
                >
                  <History className="h-4 w-4 shrink-0 text-[#008f68]" strokeWidth={2} />
                  <span className="min-w-0 flex-1 text-[12px] font-semibold text-slate-800 dark:text-slate-100">
                    Activity timeline
                  </span>
                  <span className="rounded bg-white/80 px-1.5 py-0.5 font-mono text-[10px] font-semibold text-[#008f68] ring-1 ring-[#008f68]/20 dark:bg-slate-900">
                    {callCount + ticketCount}
                  </span>
                  <ChevronRight className="h-3.5 w-3.5 shrink-0 text-slate-400 group-hover:text-[#008f68]" />
                </button>
              </div>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
              <div className="space-y-3 px-4 py-3 pb-8 sm:px-5">
                <div>
                  <SectionLabel>Customer details</SectionLabel>
                  <DetailsCard>
                    <DetailsRow icon={Phone} label="Phone">
                      <div className="flex items-center justify-between gap-2">
                        <p className="font-mono text-[13px] font-semibold text-slate-900 dark:text-slate-50">
                          {data.phone || "—"}
                        </p>
                        {hasText(data.phone) ? (
                          <button
                            type="button"
                            onClick={copyPhone}
                            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-slate-200 text-slate-500 hover:bg-slate-50 dark:border-slate-700"
                            aria-label="Copy phone"
                          >
                            {copied ? (
                              <Check className="h-3.5 w-3.5 text-emerald-600" />
                            ) : (
                              <Copy className="h-3.5 w-3.5" />
                            )}
                          </button>
                        ) : null}
                      </div>
                    </DetailsRow>
                    {customerYards.length > 0 ? (
                      <DetailsRow
                        icon={Building2}
                        label="Yards"
                        iconClassName="text-orange-600"
                      >
                        <div className="flex flex-wrap gap-1">
                          {customerYards.map((yard) => (
                            <span
                              key={yard.id}
                              className="inline-flex max-w-full rounded-md border border-slate-200 bg-slate-50 px-2 py-0.5 text-[11px] font-semibold text-[#008f68] dark:border-slate-700 dark:bg-slate-900"
                              title={yard.name}
                            >
                              <span className="truncate">{yard.name}</span>
                            </span>
                          ))}
                        </div>
                      </DetailsRow>
                    ) : null}
                    {data.campaigns && data.campaigns.length > 0 ? (
                      <DetailsRow icon={Megaphone} label="Campaigns">
                        <div className="flex flex-wrap gap-1">
                          {data.campaigns.map((camp) => (
                            <span
                              key={camp.id}
                              className="inline-flex items-center gap-1 rounded-md border border-slate-200 bg-slate-50 px-2 py-0.5 text-[11px] font-medium text-slate-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
                            >
                              {camp.nombre}
                            </span>
                          ))}
                        </div>
                      </DetailsRow>
                    ) : null}
                  </DetailsCard>
                </div>

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

            <div className="shrink-0 border-t border-slate-200/70 bg-white/95 px-5 py-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] shadow-[0_-10px_30px_rgba(15,23,42,0.08)] backdrop-blur dark:border-slate-800 dark:bg-slate-950/95 sm:px-6">
              <div
                className={cn(
                  "grid gap-2",
                  onEdit && onDelete && !isAgent
                    ? "grid-cols-2 sm:grid-cols-4"
                    : onEdit && !isAgent
                      ? "grid-cols-2 sm:grid-cols-3"
                      : "grid-cols-2",
                )}
              >
                <button
                  type="button"
                  disabled={!hasText(data.phone) || !canDial}
                  onClick={() => {
                    if (!data.phone) return;
                    dial(data.phone.trim(), data.id);
                  }}
                  className={cn(
                    "flex min-h-11 items-center justify-center gap-2 rounded-xl border px-2 text-[12px] font-semibold transition-all active:scale-[0.98]",
                    !hasText(data.phone) || !canDial
                      ? "cursor-not-allowed border-slate-200 bg-slate-100 text-slate-400"
                      : "border-[#008f68] bg-[#008f68] text-white shadow-sm hover:bg-[#007a5a]",
                  )}
                >
                  <PhoneCall className="h-4 w-4 shrink-0" />
                  Call
                </button>
                <Link
                  href={`/calls?customerId=${data.id}`}
                  onClick={() => onOpenChange(false)}
                  className="flex min-h-11 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-2 text-[12px] font-semibold text-slate-700 transition-all hover:bg-slate-50 active:scale-[0.98] dark:border-slate-800 dark:bg-slate-950 dark:text-slate-200"
                >
                  <ActivitiesIcon className="h-4 w-4 shrink-0" />
                  Activities
                </Link>
                {onEdit && !isAgent ? (
                  <button
                    type="button"
                    onClick={() => {
                      onOpenChange(false);
                      onEdit(data);
                    }}
                    className="flex min-h-11 items-center justify-center gap-2 rounded-xl border border-[#008f68] bg-[#008f68] px-2 text-[12px] font-semibold text-white shadow-sm hover:bg-[#007a5a] active:scale-[0.98]"
                  >
                    <Pencil className="h-4 w-4 shrink-0" />
                    Edit
                  </button>
                ) : null}
                {onDelete && !isAgent ? (
                  <button
                    type="button"
                    onClick={() => {
                      onOpenChange(false);
                      onDelete(data);
                    }}
                    className="flex min-h-11 items-center justify-center gap-2 rounded-xl border border-red-200 bg-white px-2 text-[12px] font-semibold text-red-600 shadow-sm hover:bg-red-50 active:scale-[0.98]"
                  >
                    <Trash2 className="h-4 w-4 shrink-0" />
                    Delete
                  </button>
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
