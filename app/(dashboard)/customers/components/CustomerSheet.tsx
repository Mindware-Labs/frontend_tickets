"use client";

import { useEffect, useState, type ReactNode } from "react";
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
import { CustomerTimeline } from "./CustomerTimeline";

interface CustomerSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  customer: Customer | null;
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
    <p className="mb-3 text-[11px] font-bold uppercase tracking-[0.14em] text-slate-500 dark:text-slate-400">
      {children}
    </p>
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
    <div className="min-w-0 rounded-xl border border-slate-200/70 bg-white p-3 shadow-sm dark:border-slate-800 dark:bg-slate-950">
      <div className="flex items-center gap-2 text-slate-400">
        <Icon className="h-3.5 w-3.5 shrink-0" strokeWidth={2} />
        <p className="truncate text-[11px] font-semibold uppercase tracking-[0.08em]">
          {label}
        </p>
      </div>
      <p className="mt-1.5 text-[15px] font-bold leading-tight text-slate-900 dark:text-slate-50">
        {value}
      </p>
      {helper ? (
        <p className="mt-0.5 text-[11px] font-medium text-slate-500">{helper}</p>
      ) : null}
    </div>
  );
}

export function CustomerSheet({
  open,
  onOpenChange,
  customer,
  onEdit,
  onDelete,
}: CustomerSheetProps) {
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

  useEffect(() => {
    setSheetOpen(open);
    return () => setSheetOpen(false);
  }, [open, setSheetOpen]);

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
        const fetched = await fetchFromBackend(`/customers/${customer.id}`);
        if (!cancelled) setDetail((fetched as { data?: Customer })?.data ?? fetched);
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
          "flex h-dvh w-full max-w-[560px] flex-col gap-0 overflow-hidden p-0 sm:w-[min(560px,calc(100vw-2rem))]",
          "border-l border-slate-200/80 bg-slate-50 text-slate-900 antialiased",
          "shadow-2xl shadow-slate-900/15 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-50",
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

                <div className="mt-4 grid grid-cols-2 gap-2">
                  <MetricTile
                    icon={Phone}
                    label="Total calls"
                    value={String(callCount)}
                    helper="All time"
                  />
                  <MetricTile
                    icon={ActivitiesIcon}
                    label="Open tickets"
                    value={String(openCount)}
                    helper={openCount > 0 ? "Needs attention" : "None open"}
                  />
                  <MetricTile
                    icon={Clock}
                    label="Last contact"
                    value={formatShortDate(data.lastContactAt)}
                    helper="Most recent touch"
                  />
                  <MetricTile
                    icon={Ticket}
                    label="Total tickets"
                    value={String(ticketCount)}
                    helper="Includes closed"
                  />
                </div>
              </div>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
              <div className="space-y-6 px-5 py-5 pb-8 sm:px-6">
                <CustomerPinnedNotes
                  customer={data}
                  canEditPinned={!isAgent}
                  onCustomerChange={setDetail}
                  onActivityChange={() =>
                    setTimelineRefreshKey((value) => value + 1)
                  }
                />

                <div>
                  <SectionLabel>Contact</SectionLabel>
                  <div className="divide-y divide-slate-100 overflow-hidden rounded-xl border border-slate-200/70 bg-white shadow-sm dark:divide-slate-800 dark:border-slate-800 dark:bg-slate-950">
                    <div className="flex gap-3 px-4 py-3.5">
                      <Phone className="mt-0.5 h-4 w-4 text-slate-400" />
                      <div className="min-w-0 flex-1">
                        <p className="text-[11px] font-semibold uppercase text-slate-400">
                          Phone
                        </p>
                        <p className="font-mono text-[13px] font-medium">
                          {data.phone || "—"}
                        </p>
                      </div>
                      {hasText(data.phone) ? (
                        <button
                          type="button"
                          onClick={copyPhone}
                          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50"
                          aria-label="Copy phone"
                        >
                          {copied ? (
                            <Check className="h-4 w-4 text-emerald-600" />
                          ) : (
                            <Copy className="h-4 w-4" />
                          )}
                        </button>
                      ) : null}
                    </div>
                    {data.yard ? (
                      <div className="flex gap-3 px-4 py-3.5">
                        <Building2 className="mt-0.5 h-4 w-4 text-orange-600" />
                        <div>
                          <p className="text-[11px] font-semibold uppercase text-slate-400">
                            Yard
                          </p>
                          <p className="text-[13px] font-semibold text-[#008f68]">
                            {data.yard.name}
                          </p>
                        </div>
                      </div>
                    ) : null}
                  </div>
                </div>

                {data.campaigns && data.campaigns.length > 0 ? (
                  <div>
                    <SectionLabel>Campaigns</SectionLabel>
                    <div className="flex flex-wrap gap-2 rounded-xl border border-slate-200/70 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-950">
                      {data.campaigns.map((camp) => (
                        <span
                          key={camp.id}
                          className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-[12px] font-medium text-slate-700"
                        >
                          <Megaphone className="h-3 w-3 text-slate-400" />
                          {camp.nombre}
                        </span>
                      ))}
                    </div>
                  </div>
                ) : null}

                <CustomerTimeline
                  customerId={data.id}
                  canPlayRecordings={canPlayRecordings}
                  refreshKey={timelineRefreshKey}
                  onNavigate={() => onOpenChange(false)}
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
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
