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
  Check,
  Clock,
  Copy,
  Pencil,
  Phone,
  PhoneCall,
  RefreshCw,
  Tag,
  Ticket,
  X,
} from "lucide-react";
import { fetchFromBackend } from "@/lib/api-client";
import { useAircall } from "@/components/providers/AircallProvider";
import { useRole } from "@/components/providers/role-provider";
import { cn } from "@/lib/utils";
import type { PhoneLine } from "../types";
import {
  formatLineDate,
  formatPhoneDisplay,
  hasDialablePhone,
} from "../utils";
import { PhoneLineMark } from "./PhoneLineMark";

interface PhoneLineSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  line: PhoneLine | null;
  onEdit?: (line: PhoneLine) => void;
}

function hasText(value?: string | null): value is string {
  return Boolean(value?.trim());
}

function SectionLabel({ children }: { children: ReactNode }) {
  return (
    <p className="mb-3 text-[11px] font-bold uppercase tracking-[0.14em] text-slate-500 dark:text-slate-400">
      {children}
    </p>
  );
}

function StatusTile({ active }: { active: boolean }) {
  return (
    <div
      className={cn(
        "flex min-h-[54px] min-w-0 flex-1 items-center gap-3 rounded-xl border px-3.5 py-2.5 shadow-sm",
        active
          ? "border-emerald-200/80 bg-emerald-50 text-emerald-800 dark:border-emerald-500/30 dark:bg-emerald-500/15 dark:text-emerald-200"
          : "border-slate-200 bg-slate-50 text-slate-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200",
      )}
    >
      <span
        className={cn(
          "h-2.5 w-2.5 shrink-0 rounded-full",
          active
            ? "bg-emerald-500 shadow-[0_0_0_4px_rgba(16,185,129,0.16)]"
            : "bg-slate-400",
        )}
      />
      <span className="min-w-0">
        <span className="block text-[10px] font-bold uppercase tracking-[0.12em] opacity-70">
          Status
        </span>
        <span className="block truncate text-[14px] font-bold">
          {active ? "Active" : "Inactive"}
        </span>
      </span>
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
    <div className="min-w-0 rounded-xl border border-slate-200/70 bg-white p-3 shadow-sm dark:border-slate-800 dark:bg-slate-950">
      <div className="flex items-center gap-2 text-slate-400">
        <Icon className="h-3.5 w-3.5 shrink-0" strokeWidth={2} />
        <p className="truncate text-[11px] font-semibold uppercase tracking-[0.08em]">
          {label}
        </p>
      </div>
      <p className="mt-2 truncate text-[15px] font-bold text-slate-900 dark:text-slate-50">
        {value}
      </p>
      {helper ? (
        <p className="mt-0.5 truncate text-[11px] font-medium text-slate-500 dark:text-slate-400">
          {helper}
        </p>
      ) : null}
    </div>
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

function RowActions({ dial, copy }: { dial?: ReactNode; copy?: ReactNode }) {
  return (
    <div className="flex w-[84px] shrink-0 items-center justify-end gap-1.5">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center">
        {dial ?? null}
      </div>
      <div className="flex h-9 w-9 shrink-0 items-center justify-center">
        {copy ?? null}
      </div>
    </div>
  );
}

function DetailRow({
  icon: Icon,
  label,
  value,
  actions,
  muted = false,
}: {
  icon: LucideIcon;
  label: string;
  value: ReactNode;
  actions?: ReactNode;
  muted?: boolean;
}) {
  return (
    <div className="flex min-h-[58px] items-center gap-3 py-1.5">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-slate-100 bg-slate-50 text-slate-400 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-500">
        <Icon className="h-4 w-4 shrink-0" strokeWidth={2} />
      </div>
      <div className="flex min-w-0 flex-1 flex-col justify-center gap-0.5 py-1">
        <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-400 dark:text-slate-500">
          {label}
        </p>
        <div
          className={cn(
            "min-w-0 text-[13px] font-medium leading-relaxed text-slate-800 dark:text-slate-100",
            muted && "italic text-slate-400 dark:text-slate-500",
          )}
        >
          {value}
        </div>
      </div>
      <div>{actions ?? <RowActions />}</div>
    </div>
  );
}

function DialButton({
  phone,
  lineId,
  dial,
  canDial,
  variant = "header",
}: {
  phone?: string | null;
  lineId: number;
  dial: (phoneNumber: string, ticketId?: number | string) => boolean;
  canDial: boolean;
  variant?: "header" | "compact";
}) {
  const dialable = hasDialablePhone(phone);
  const disabled = !dialable || !canDial;

  const handleClick = () => {
    if (!dialable || !canDial || !phone) return;
    dial(phone.replace(/\D/g, ""), `phone-line-${lineId}`);
  };

  if (variant === "compact") {
    return (
      <button
        type="button"
        onClick={handleClick}
        disabled={disabled}
        aria-label="Call via Aircall"
        title="Call via Aircall"
        className={cn(
          "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border transition-all duration-200 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#008f68]/35",
          disabled
            ? "cursor-not-allowed border-slate-100 bg-slate-50 text-slate-300 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-600"
            : "border-[#008f68]/20 bg-[#f0faf5] text-[#008f68] hover:border-[#008f68]/40 hover:bg-[#e2fae9] dark:border-emerald-500/25 dark:bg-emerald-500/10 dark:text-emerald-300",
        )}
      >
        <PhoneCall className="h-4 w-4" strokeWidth={2} />
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={disabled}
      className={cn(
        "flex min-h-11 w-full items-center justify-center gap-2 rounded-xl border px-4 text-[13px] font-semibold transition-all active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#008f68]/35",
        disabled
          ? "cursor-not-allowed border-slate-200 bg-slate-100 text-slate-400 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-600"
          : "border-[#008f68] bg-[#008f68] text-white shadow-sm shadow-emerald-900/10 hover:bg-[#007a5a]",
      )}
    >
      <PhoneCall className="h-4 w-4" strokeWidth={2.25} />
      Call
    </button>
  );
}

function SheetAction({
  icon: Icon,
  label,
  href,
  onClick,
}: {
  icon: LucideIcon;
  label: string;
  href?: string;
  onClick?: () => void;
}) {
  const className =
    "flex min-h-11 w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-3 text-[13px] font-semibold text-slate-700 transition-all hover:border-slate-300 hover:bg-slate-50 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#008f68]/35 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-200 dark:hover:border-slate-700 dark:hover:bg-slate-900";

  const content = (
    <>
      <Icon className="h-4 w-4 shrink-0" strokeWidth={2.2} />
      <span className="min-w-0 truncate">{label}</span>
    </>
  );

  if (href) {
    return (
      <Link href={href} onClick={onClick} className={className}>
        {content}
      </Link>
    );
  }

  return (
    <button type="button" onClick={onClick} className={className}>
      {content}
    </button>
  );
}

export function PhoneLineSheet({
  open,
  onOpenChange,
  line,
  onEdit,
}: PhoneLineSheetProps) {
  const { role } = useRole();
  const isAgent = role?.toString().toLowerCase() === "agent";
  const {
    dial,
    status: aircallStatus,
    isLoggedIn: aircallLoggedIn,
    setSheetOpen,
  } = useAircall();
  const canDial = aircallStatus === "ready" && aircallLoggedIn;

  const [detail, setDetail] = useState<PhoneLine | null>(null);
  const [loading, setLoading] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  useEffect(() => {
    setSheetOpen(open);
    return () => setSheetOpen(false);
  }, [open, setSheetOpen]);

  useEffect(() => {
    if (!line?.id) {
      setDetail(null);
      return;
    }

    setDetail(line);
    let cancelled = false;

    const load = async () => {
      try {
        setLoading(true);
        const fetched = await fetchFromBackend(`/phone-lines/${line.id}`);
        if (!cancelled) setDetail(fetched);
      } catch {
        if (!cancelled) setDetail(line);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();
    return () => {
      cancelled = true;
    };
  }, [line]);

  useEffect(() => {
    if (!copiedField) return;
    const timeoutId = window.setTimeout(() => setCopiedField(null), 2000);
    return () => window.clearTimeout(timeoutId);
  }, [copiedField]);

  const copyText = async (key: string, text?: string | null) => {
    if (!hasText(text)) return;
    try {
      await navigator.clipboard.writeText(text.trim());
      setCopiedField(key);
    } catch {
      setCopiedField(null);
    }
  };

  const data = detail || line;
  const displayPhone = data ? formatPhoneDisplay(data.phoneNumber) : "";
  const rawPhone = data?.phoneNumber ?? "";

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        hideClose
        className={cn(
          "flex h-dvh w-full max-w-[560px] flex-col gap-0 overflow-visible p-0 sm:w-[min(560px,calc(100vw-2rem))]",
          "border-l border-slate-200/80 bg-slate-50 text-slate-900",
          "shadow-2xl shadow-slate-900/15 antialiased dark:border-slate-800 dark:bg-slate-950 dark:text-slate-50",
        )}
      >
        {!data ? (
          <>
            <SheetHeader className="sr-only">
              <SheetTitle>Phone line details</SheetTitle>
              <SheetDescription>No line selected.</SheetDescription>
            </SheetHeader>
            <div className="flex min-h-0 flex-1 items-center justify-center p-8 text-center">
              <div>
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-400 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                  <Phone className="h-6 w-6" strokeWidth={1.7} />
                </div>
                <p className="mt-4 text-sm font-semibold text-slate-900 dark:text-slate-50">
                  No line selected
                </p>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                  Pick a line from the table to view its details.
                </p>
              </div>
            </div>
          </>
        ) : (
          <>
            <SheetHeader className="sr-only">
              <SheetTitle>{displayPhone}</SheetTitle>
              <SheetDescription>
                Phone line profile with number, label, and quick actions.
              </SheetDescription>
            </SheetHeader>

            <div className="relative shrink-0 overflow-visible bg-white dark:bg-slate-950">
              <SheetClose
                aria-label="Close phone line details"
                className="absolute right-4 top-4 z-20 flex h-10 w-10 items-center justify-center rounded-full text-slate-400 transition-all hover:bg-slate-100 hover:text-slate-700 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#008f68]/35 dark:hover:bg-slate-900 dark:hover:text-slate-200"
              >
                <X className="h-5 w-5" strokeWidth={2} />
              </SheetClose>

              <div className="px-5 pb-4 pt-5 sm:px-6">
                <div className="flex items-start gap-4 pr-12">
                  <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-[#008f68]/15 bg-[#f0faf5] text-[#008f68] shadow-sm dark:border-emerald-500/25 dark:bg-emerald-500/10 dark:text-emerald-300">
                    <Phone className="h-6 w-6" strokeWidth={1.7} />
                  </div>

                  <div className="min-w-0 flex-1 pt-0.5">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded-md bg-slate-100 px-2 py-0.5 font-mono text-[11px] font-semibold text-slate-500 dark:bg-slate-900 dark:text-slate-400">
                        #{data.id}
                      </span>
                      {loading ? (
                        <span className="inline-flex items-center gap-1.5 rounded-md bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-500 dark:bg-slate-900 dark:text-slate-400">
                          <RefreshCw className="h-3 w-3 animate-spin" />
                          Refreshing
                        </span>
                      ) : null}
                    </div>

                    <h2 className="mt-2 min-w-0 font-mono text-[22px] font-bold leading-tight text-slate-950 wrap-anywhere dark:text-white">
                      {displayPhone}
                    </h2>

                    {hasText(data.label) ? (
                      <p className="mt-1 min-w-0 text-[13px] font-medium text-slate-500 wrap-anywhere dark:text-slate-400">
                        {data.label.trim()}
                      </p>
                    ) : (
                      <p className="mt-1 text-[13px] italic text-slate-400 dark:text-slate-500">
                        No label assigned
                      </p>
                    )}
                  </div>
                </div>

                <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2">
                  <StatusTile active={data.isActive} />
                  <MetricTile
                    icon={Clock}
                    label="Updated"
                    value={formatLineDate(data.updatedAt).split(",")[0] ?? "—"}
                    helper="Last change"
                  />
                </div>
              </div>
            </div>

            <div className="relative z-30 h-0 shrink-0 overflow-visible border-t border-slate-200/70 dark:border-slate-800" />

            <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
              <div className="space-y-6 px-5 py-5 pb-8 sm:px-6">
                <div>
                  <SectionLabel>Line details</SectionLabel>
                  <div className="divide-y divide-slate-100 overflow-hidden rounded-xl border border-slate-200/70 bg-white px-4 shadow-sm dark:divide-slate-800 dark:border-slate-800 dark:bg-slate-950">
                    <DetailRow
                      icon={Phone}
                      label="Phone number"
                      value={
                        <span className="font-mono font-semibold">
                          {displayPhone}
                        </span>
                      }
                      actions={
                        <RowActions
                          dial={
                            <DialButton
                              phone={rawPhone}
                              lineId={data.id}
                              dial={dial}
                              canDial={canDial}
                              variant="compact"
                            />
                          }
                          copy={
                            <CopyButton
                              copied={copiedField === "phone"}
                              label="Copy phone number"
                              onCopy={() => copyText("phone", rawPhone)}
                            />
                          }
                        />
                      }
                    />

                    <DetailRow
                      icon={Tag}
                      label="Label"
                      muted={!hasText(data.label)}
                      value={
                        hasText(data.label) ? data.label.trim() : "No label on file."
                      }
                      actions={
                        <RowActions
                          copy={
                            <CopyButton
                              copied={copiedField === "label"}
                              disabled={!hasText(data.label)}
                              label="Copy label"
                              onCopy={() => copyText("label", data.label)}
                            />
                          }
                        />
                      }
                    />
                  </div>
                </div>

                <div>
                  <SectionLabel>Timeline</SectionLabel>
                  <div className="divide-y divide-slate-100 overflow-hidden rounded-xl border border-slate-200/70 bg-white px-4 shadow-sm dark:divide-slate-800 dark:border-slate-800 dark:bg-slate-950">
                    <DetailRow
                      icon={Clock}
                      label="Created"
                      value={formatLineDate(data.createdAt)}
                    />
                    <DetailRow
                      icon={Clock}
                      label="Last updated"
                      value={formatLineDate(data.updatedAt)}
                    />
                  </div>
                </div>

                {!data.isActive ? (
                  <div className="rounded-xl border border-amber-200/80 bg-amber-50/80 px-4 py-3 text-[13px] leading-relaxed text-amber-950 dark:border-amber-900/40 dark:bg-amber-950/30 dark:text-amber-100">
                    This line is inactive. Aircall webhooks from this number will
                    not create new tickets until it is reactivated.
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
                <DialButton
                  phone={rawPhone}
                  lineId={data.id}
                  dial={dial}
                  canDial={canDial}
                />
                <SheetAction
                  icon={Ticket}
                  label="Tickets"
                  href={`/calls?phoneLineId=${data.id}`}
                  onClick={() => onOpenChange(false)}
                />
                {onEdit && !isAgent ? (
                  <SheetAction
                    icon={Pencil}
                    label="Edit"
                    onClick={() => {
                      onOpenChange(false);
                      onEdit(data);
                    }}
                  />
                ) : null}
              </div>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
