"use client";

import { useEffect, useState, type ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  AlertCircle,
  Building2,
  Check,
  Clock,
  Copy,
  Loader2,
  Megaphone,
  Pencil,
  Phone,
  PhoneCall,
  PhoneIncoming,
  PhoneMissed,
  PhoneOutgoing,
  RefreshCw,
  Ticket,
  X,
} from "lucide-react";
import { fetchFromBackend } from "@/lib/api-client";
import { useAircall } from "@/components/providers/AircallProvider";
import { useRole } from "@/components/providers/role-provider";
import { ActivitiesIcon } from "@/components/icons/activities-icon";
import { cn } from "@/lib/utils";
import type { Customer } from "../types";
import { CustomerMark } from "./CustomerMark";

interface CustomerSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  customer: Customer | null;
  onEdit?: (customer: Customer) => void;
}

interface RecentCall {
  id: number;
  direction: string;
  status: string;
  disposition?: string;
  notes?: string;
  createdAt: string;
  duration?: number;
  agent?: { name: string } | null;
  assignedTo?: { name: string } | null;
  yard?: { name: string } | null;
  campaign?: { nombre?: string; name?: string } | null;
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

function directionIcon(direction: string) {
  const dir = direction?.toUpperCase();
  if (dir === "INBOUND") return <PhoneIncoming className="h-3.5 w-3.5 text-blue-500" />;
  if (dir === "OUTBOUND") return <PhoneOutgoing className="h-3.5 w-3.5 text-green-500" />;
  return <PhoneMissed className="h-3.5 w-3.5 text-red-400" />;
}

export function CustomerSheet({
  open,
  onOpenChange,
  customer,
  onEdit,
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

  const [detail, setDetail] = useState<Customer | null>(null);
  const [loading, setLoading] = useState(false);
  const [recentCalls, setRecentCalls] = useState<RecentCall[]>([]);
  const [callsLoading, setCallsLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    setSheetOpen(open);
    return () => setSheetOpen(false);
  }, [open, setSheetOpen]);

  useEffect(() => {
    if (!customer?.id) {
      setDetail(null);
      setRecentCalls([]);
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

    setCallsLoading(true);
    fetchFromBackend(`/calls?customerId=${customer.id}&limit=5&page=1`)
      .then((data: unknown) => {
        if (cancelled) return;
        const arr = Array.isArray(data)
          ? data
          : ((data as { data?: RecentCall[] })?.data ?? []);
        setRecentCalls(arr.slice(0, 5));
      })
      .catch(() => {
        if (!cancelled) setRecentCalls([]);
      })
      .finally(() => {
        if (!cancelled) setCallsLoading(false);
      });

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
  const activityTotal = data?.ticketCount ?? 0;
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
                  <div className="rounded-xl border border-slate-200/70 bg-white px-3.5 py-2.5 shadow-sm dark:border-slate-800 dark:bg-slate-950">
                    <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-slate-400">
                      Total calls
                    </p>
                    <p className="mt-1 text-[14px] font-bold text-[#008f68]">
                      {data.totalCalls ?? data.callCount ?? 0}
                    </p>
                  </div>
                  <MetricTile
                    icon={ActivitiesIcon}
                    label="Activities"
                    value={String(activityTotal)}
                    helper={
                      openCount > 0 ? `${openCount} open` : "Calls · tickets · manual"
                    }
                  />
                  <MetricTile
                    icon={Clock}
                    label="Last contact"
                    value={formatShortDate(data.lastContactAt)}
                    helper="Most recent touch"
                  />
                </div>
              </div>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
              <div className="space-y-6 px-5 py-5 pb-8 sm:px-6">
                {data.pinnedNote ? (
                  <div className="flex items-start gap-2 rounded-xl border border-amber-200/60 bg-amber-50/80 p-3.5 dark:border-amber-900/40 dark:bg-amber-950/30">
                    <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
                    <p className="text-[13px] leading-relaxed text-amber-900 dark:text-amber-100">
                      {data.pinnedNote}
                    </p>
                  </div>
                ) : null}

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

                <div>
                  <SectionLabel>Recent calls</SectionLabel>
                  <div className="overflow-hidden rounded-xl border border-slate-200/70 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-950">
                    {callsLoading ? (
                      <div className="flex items-center justify-center gap-2 py-8 text-sm text-slate-500">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Loading calls...
                      </div>
                    ) : recentCalls.length === 0 ? (
                      <p className="py-8 text-center text-[13px] text-slate-500">
                        No calls found.
                      </p>
                    ) : (
                      recentCalls.map((call) => (
                        <button
                          key={call.id}
                          type="button"
                          onClick={() => {
                            onOpenChange(false);
                            router.push(`/calls?id=${call.id}`);
                          }}
                          className="flex w-full flex-col gap-1 border-b border-slate-100 px-4 py-3 text-left transition-colors last:border-0 hover:bg-[#f0faf5]/60 dark:border-slate-800"
                        >
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-1.5">
                              {directionIcon(call.direction)}
                              <span className="text-[12px] font-semibold capitalize text-slate-700">
                                {call.direction?.toLowerCase() || "call"}
                              </span>
                            </div>
                            <span className="text-[11px] text-slate-400">
                              {formatShortDate(call.createdAt)}
                            </span>
                          </div>
                          {call.campaign?.nombre ? (
                            <p className="text-[11px] text-slate-500">
                              {call.campaign.nombre}
                            </p>
                          ) : null}
                        </button>
                      ))
                    )}
                  </div>
                </div>

                {data.notes && data.notes.length > 0 ? (
                  <div>
                    <SectionLabel>Notes</SectionLabel>
                    <div className="space-y-2">
                      {data.notes.map((note) => (
                        <div
                          key={note.id}
                          className="rounded-xl border border-slate-200/70 bg-white p-3.5 shadow-sm dark:border-slate-800 dark:bg-slate-950"
                        >
                          <p className="whitespace-pre-wrap text-[13px] leading-relaxed text-slate-700 dark:text-slate-200">
                            {note.content}
                          </p>
                          <p className="mt-2 text-[11px] text-slate-400">
                            {formatDate(note.createdAt)}
                            {note.createdBy ? ` · ${note.createdBy}` : ""}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : hasText(data.note) ? (
                  <div>
                    <SectionLabel>Notes</SectionLabel>
                    <div className="rounded-xl border border-amber-200/60 bg-amber-50/50 p-4 dark:border-amber-900/40 dark:bg-amber-950/20">
                      <p className="whitespace-pre-wrap text-[13px] leading-relaxed text-slate-700">
                        {data.note}
                      </p>
                    </div>
                  </div>
                ) : null}
              </div>
            </div>

            <div className="shrink-0 border-t border-slate-200/70 bg-white/95 px-5 py-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] shadow-[0_-10px_30px_rgba(15,23,42,0.08)] backdrop-blur dark:border-slate-800 dark:bg-slate-950/95 sm:px-6">
              <div
                className={cn(
                  "grid gap-2",
                  onEdit && !isAgent ? "grid-cols-2 sm:grid-cols-3" : "grid-cols-2",
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
              </div>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
