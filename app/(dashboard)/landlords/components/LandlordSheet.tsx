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
  ChevronRight,
  Copy,
  ExternalLink,
  FileText,
  Mail,
  MapPin,
  Pencil,
  Phone,
  PhoneCall,
  RefreshCw,
  User,
  X,
} from "lucide-react";
import { ActivitiesIcon } from "@/components/icons/activities-icon";
import { fetchFromBackend } from "@/lib/api-client";
import { useAircall } from "@/components/providers/AircallProvider";
import { useRole } from "@/components/providers/role-provider";
import { cn } from "@/lib/utils";
import type { Landlord, YardOption } from "../types";
import { LandlordMark } from "./LandlordMark";
import { YardMark } from "../../yards/components/YardMark";

interface LandlordSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  landlord: Landlord | null;
  yards: YardOption[];
  onEdit?: (landlord: Landlord) => void;
}

function hasText(value?: string | null): value is string {
  return Boolean(value?.trim());
}

function hasDialablePhone(phone?: string | null): boolean {
  if (!phone?.trim()) return false;
  return phone.replace(/\D/g, "").length >= 7;
}

function getLinkedYards(
  landlord: Landlord | null,
  allYards: YardOption[],
): YardOption[] {
  if (!landlord) return [];

  const base =
    landlord.yards && landlord.yards.length > 0
      ? landlord.yards
      : allYards.filter((y) => y.landlord?.id === landlord.id);

  return base.map((yard) => {
    const full = allYards.find((y) => y.id === yard.id);
    return full ? { ...full, ...yard } : yard;
  });
}

function SectionLabel({
  children,
  action,
}: {
  children: ReactNode;
  action?: ReactNode;
}) {
  return (
    <div className="mb-3 flex min-h-6 items-center justify-between gap-3">
      <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-slate-500 dark:text-slate-400">
        {children}
      </p>
      {action}
    </div>
  );
}

function YardTypePill({ type }: { type?: YardOption["yardType"] }) {
  if (!type) return null;
  const isSaas = type === "SAAS";
  return (
    <span
      className={cn(
        "inline-flex rounded-full border px-2.5 py-0.5 text-[11px] font-semibold",
        isSaas
          ? "border-blue-200/80 bg-blue-50 text-blue-700"
          : "border-violet-200/80 bg-violet-50 text-violet-700",
      )}
    >
      {isSaas ? "SaaS" : "Full Service"}
    </span>
  );
}

function YardStatusPill({ active }: { active?: boolean }) {
  if (active === undefined) return null;
  return active ? (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200/80 bg-emerald-50 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-700">
      <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
      Active
    </span>
  ) : (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-slate-50 px-2.5 py-0.5 text-[11px] font-semibold text-slate-600">
      <span className="h-1.5 w-1.5 rounded-full bg-slate-400" />
      Inactive
    </span>
  );
}

function LinkedYardCard({
  yard,
  landlordId,
  onNavigate,
}: {
  yard: YardOption;
  landlordId: number;
  onNavigate: () => void;
}) {
  const ticketTotal = yard.ticketCount ?? yard.totalTickets ?? 0;

  return (
    <Link
      href={`/yards?yardId=${yard.id}&landlordId=${landlordId}`}
      onClick={onNavigate}
      className="group block rounded-xl border border-slate-200/70 bg-white p-4 shadow-sm transition-all hover:border-[#008f68]/35 hover:shadow-md dark:border-slate-800 dark:bg-slate-950"
    >
      <div className="flex items-start gap-3">
        <YardMark className="h-10 w-10 shrink-0" iconClassName="h-5 w-5" />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <h3 className="min-w-0 text-[14px] font-bold leading-snug text-slate-900 wrap-anywhere group-hover:text-[#007a5a] dark:text-slate-50">
              {yard.name}
            </h3>
            <span className="shrink-0 rounded-md bg-slate-100 px-1.5 py-0.5 font-mono text-[10px] font-semibold text-slate-500">
              #{yard.id}
            </span>
          </div>
          {hasText(yard.commonName) &&
          yard.commonName!.trim() !== yard.name.trim() ? (
            <p className="mt-1 text-[12px] font-medium text-slate-500 wrap-anywhere">
              {yard.commonName!.trim()}
            </p>
          ) : null}

          <div className="mt-3 grid grid-cols-1 gap-2.5 min-[400px]:grid-cols-2">
            <div className="flex min-w-0 gap-2 min-[400px]:col-span-2">
              <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-slate-400" />
              <p
                className={cn(
                  "min-w-0 text-[12px] leading-relaxed wrap-anywhere",
                  hasText(yard.propertyAddress)
                    ? "text-slate-700"
                    : "italic text-slate-400",
                )}
              >
                {hasText(yard.propertyAddress)
                  ? yard.propertyAddress.trim()
                  : "No address on file"}
              </p>
            </div>

            <div className="flex min-w-0 items-center gap-2">
              <Phone className="h-3.5 w-3.5 shrink-0 text-slate-400" />
              <p
                className={cn(
                  "min-w-0 truncate font-mono text-[12px] font-medium",
                  hasText(yard.contactInfo)
                    ? "text-slate-800"
                    : "italic text-slate-400",
                )}
              >
                {hasText(yard.contactInfo) ? yard.contactInfo.trim() : "—"}
              </p>
            </div>

            <div className="flex min-w-0 items-center gap-2">
              <ActivitiesIcon className="h-3.5 w-3.5 shrink-0 text-slate-400" />
              <p className="text-[12px] font-medium text-slate-700">
                {ticketTotal} activit{ticketTotal === 1 ? "y" : "ies"}
              </p>
            </div>
          </div>

          <div className="mt-3 flex flex-wrap items-center gap-2">
            <YardTypePill type={yard.yardType} />
            <YardStatusPill active={yard.isActive} />
          </div>
        </div>
        <ExternalLink className="mt-1 h-4 w-4 shrink-0 text-slate-300 transition-colors group-hover:text-[#008f68]" />
      </div>

      <div className="mt-3 flex items-center justify-between gap-2 border-t border-slate-100 pt-3 dark:border-slate-800">
        <span className="text-[12px] font-semibold text-[#008f68]">
          View yard details
        </span>
        <ChevronRight className="h-4 w-4 text-[#008f68] transition-transform group-hover:translate-x-0.5" />
      </div>
    </Link>
  );
}

const ROW_ICON_CLASS =
  "flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-slate-100 bg-slate-50 text-slate-400 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-500";
const ACTION_SLOT_CLASS = "flex h-9 w-9 shrink-0 items-center justify-center";

function RowActions({
  dial,
  external,
  copy,
}: {
  dial?: ReactNode;
  external?: ReactNode;
  copy?: ReactNode;
}) {
  if (dial && !external) {
    return (
      <div className="flex w-[84px] shrink-0 items-center justify-end gap-1.5">
        <div className={ACTION_SLOT_CLASS}>{dial}</div>
        <div className={ACTION_SLOT_CLASS}>{copy ?? null}</div>
      </div>
    );
  }

  if (!dial && external) {
    return (
      <div className="flex w-[84px] shrink-0 items-center justify-end gap-1.5">
        <div className={ACTION_SLOT_CLASS}>{external}</div>
        <div className={ACTION_SLOT_CLASS}>{copy ?? null}</div>
      </div>
    );
  }

  return (
    <div className="flex w-[126px] shrink-0 items-center justify-end gap-1.5">
      <div className={ACTION_SLOT_CLASS}>{dial ?? null}</div>
      <div className={ACTION_SLOT_CLASS}>{external ?? null}</div>
      <div className={ACTION_SLOT_CLASS}>{copy ?? null}</div>
    </div>
  );
}

function DetailRow({
  icon: Icon,
  label,
  value,
  actions,
}: {
  icon: LucideIcon;
  label: string;
  value: ReactNode;
  actions?: ReactNode;
}) {
  return (
    <div className="flex min-h-[58px] items-center gap-3 py-1.5">
      <div className={ROW_ICON_CLASS}>
        <Icon className="h-4 w-4 shrink-0" strokeWidth={2} />
      </div>
      <div className="flex min-w-0 flex-1 flex-col justify-center gap-0.5 py-1">
        <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-400 dark:text-slate-500">
          {label}
        </p>
        <div className="min-w-0 text-[13px] font-medium leading-relaxed text-slate-800 dark:text-slate-100">
          {value}
        </div>
      </div>
      <div>{actions ?? <RowActions />}</div>
    </div>
  );
}

function MetricTile({
  icon: Icon,
  label,
  value,
}: {
  icon: LucideIcon;
  label: string;
  value: string;
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
        "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border bg-white transition-all duration-200 active:scale-95 dark:bg-slate-950",
        disabled
          ? "cursor-not-allowed border-slate-100 text-slate-300"
          : copied
            ? "border-emerald-200 bg-emerald-50 text-emerald-600"
            : "border-slate-200/80 text-slate-400 hover:border-slate-300 hover:bg-slate-50 hover:text-slate-700",
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

function DialButton({
  phone,
  landlordId,
  dial,
  canDial,
  variant = "header",
}: {
  phone?: string | null;
  landlordId: number;
  dial: (phoneNumber: string, ticketId?: number | string) => boolean;
  canDial: boolean;
  variant?: "header" | "compact";
}) {
  const dialable = hasDialablePhone(phone);
  const disabled = !dialable || !canDial;

  const handleClick = () => {
    if (!dialable || !canDial || !phone) return;
    dial(phone.trim(), `landlord-${landlordId}`);
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
          "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border transition-all duration-200 active:scale-95",
          disabled
            ? "cursor-not-allowed border-slate-100 bg-slate-50 text-slate-300"
            : "border-[#008f68]/20 bg-[#f0faf5] text-[#008f68] hover:border-[#008f68]/40 hover:bg-[#e2fae9]",
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
        "flex min-h-11 w-full items-center justify-center gap-2 rounded-xl border px-4 text-[13px] font-semibold transition-all active:scale-[0.98]",
        disabled
          ? "cursor-not-allowed border-slate-200 bg-slate-100 text-slate-400"
          : "border-[#008f68] bg-[#008f68] text-white shadow-sm hover:bg-[#007a5a]",
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
    "flex min-h-11 w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-3 text-[13px] font-semibold text-slate-700 transition-all hover:border-slate-300 hover:bg-slate-50 active:scale-[0.98] dark:border-slate-800 dark:bg-slate-950 dark:text-slate-200";

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

export function LandlordSheet({
  open,
  onOpenChange,
  landlord,
  yards,
  onEdit,
}: LandlordSheetProps) {
  const { role } = useRole();
  const isAgent = role?.toString().toLowerCase() === "agent";
  const {
    dial,
    status: aircallStatus,
    isLoggedIn: aircallLoggedIn,
    setSheetOpen,
  } = useAircall();
  const canDial = aircallStatus === "ready" && aircallLoggedIn;

  const [detail, setDetail] = useState<Landlord | null>(null);
  const [loading, setLoading] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  useEffect(() => {
    setSheetOpen(open);
    return () => setSheetOpen(false);
  }, [open, setSheetOpen]);

  useEffect(() => {
    if (!landlord?.id) {
      setDetail(null);
      return;
    }

    setDetail(landlord);
    let cancelled = false;

    const load = async () => {
      try {
        setLoading(true);
        const fetched = await fetchFromBackend(`/landlords/${landlord.id}`);
        if (!cancelled) setDetail(fetched);
      } catch {
        if (!cancelled) setDetail(landlord);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();
    return () => {
      cancelled = true;
    };
  }, [landlord]);

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

  const data = detail || landlord;
  const linkedYards = getLinkedYards(data, yards);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        hideClose
        className={cn(
          "flex h-dvh w-full max-w-[560px] flex-col gap-0 overflow-hidden p-0 sm:w-[min(560px,calc(100vw-2rem))]",
          "border-l border-slate-200/80 bg-slate-50 text-slate-900 shadow-2xl dark:border-slate-800 dark:bg-slate-950 dark:text-slate-50",
        )}
      >
        {!data ? (
          <>
            <SheetHeader className="sr-only">
              <SheetTitle>Landlord details</SheetTitle>
              <SheetDescription>No landlord selected.</SheetDescription>
            </SheetHeader>
            <div className="flex min-h-0 flex-1 items-center justify-center p-8 text-center">
              <p className="text-sm text-slate-500">No landlord selected.</p>
            </div>
          </>
        ) : (
          <>
            <SheetHeader className="sr-only">
              <SheetTitle>{data.name}</SheetTitle>
              <SheetDescription>Landlord profile and linked yards.</SheetDescription>
            </SheetHeader>

            <div className="relative shrink-0 border-b border-slate-200/70 bg-white dark:border-slate-800 dark:bg-slate-950">
              <SheetClose
                aria-label="Close landlord details"
                className="absolute right-4 top-4 z-20 flex h-10 w-10 items-center justify-center rounded-full text-slate-400 transition-all hover:bg-slate-100 hover:text-slate-700 active:scale-95"
              >
                <X className="h-5 w-5" strokeWidth={2} />
              </SheetClose>

              <div className="px-5 pb-4 pt-5 sm:px-6">
                <div className="flex items-start gap-4 pr-12">
                  <LandlordMark className="h-14 w-14" iconClassName="h-6 w-6" />

                  <div className="min-w-0 flex-1 pt-0.5">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded-md bg-slate-100 px-2 py-0.5 font-mono text-[11px] font-semibold text-slate-500 dark:bg-slate-900">
                        #{data.id}
                      </span>
                      {loading ? (
                        <span className="inline-flex items-center gap-1.5 rounded-md bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-500">
                          <RefreshCw className="h-3 w-3 animate-spin" />
                          Refreshing
                        </span>
                      ) : null}
                    </div>
                    <h2 className="mt-2 min-w-0 text-[22px] font-bold leading-tight text-slate-950 [overflow-wrap:anywhere] dark:text-white">
                      {data.name || "Unknown landlord"}
                    </h2>
                  </div>
                </div>

                <div className="mt-4 grid grid-cols-2 gap-2">
                  <MetricTile
                    icon={Building2}
                    label="Yards"
                    value={String(linkedYards.length)}
                  />
                  <MetricTile
                    icon={User}
                    label="Landlord ID"
                    value={`#${data.id}`}
                  />
                </div>
              </div>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
              <div className="space-y-6 px-5 py-5 pb-8 sm:px-6">
                <div>
                  <SectionLabel>Contact</SectionLabel>
                  <div className="divide-y divide-slate-100 overflow-hidden rounded-xl border border-slate-200/70 bg-white px-4 shadow-sm dark:divide-slate-800 dark:border-slate-800 dark:bg-slate-950">
                    <DetailRow
                      icon={Phone}
                      label="Phone"
                      value={
                        hasText(data.phone) ? (
                          <p className="font-mono font-semibold text-slate-950">
                            {data.phone.trim()}
                          </p>
                        ) : (
                          <span className="italic text-slate-400">
                            No phone on file.
                          </span>
                        )
                      }
                      actions={
                        <RowActions
                          dial={
                            <DialButton
                              variant="compact"
                              phone={data.phone}
                              landlordId={data.id}
                              dial={dial}
                              canDial={canDial}
                            />
                          }
                          copy={
                            <CopyButton
                              copied={copiedField === "phone"}
                              disabled={!hasText(data.phone)}
                              label="Copy phone"
                              onCopy={() => copyText("phone", data.phone)}
                            />
                          }
                        />
                      }
                    />

                    <DetailRow
                      icon={Mail}
                      label="Email"
                      value={
                        hasText(data.email) ? (
                          <a
                            href={`mailto:${data.email.trim()}`}
                            className="block truncate font-semibold text-[#008f68] underline-offset-2 hover:underline"
                          >
                            {data.email.trim()}
                          </a>
                        ) : (
                          <span className="italic text-slate-400">
                            No email on file.
                          </span>
                        )
                      }
                      actions={
                        <RowActions
                          external={
                            hasText(data.email) ? (
                              <a
                                href={`mailto:${data.email.trim()}`}
                                aria-label="Email landlord"
                                title="Email landlord"
                                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-slate-200/80 bg-white text-slate-400 transition-all hover:border-slate-300 hover:bg-slate-50 hover:text-slate-700"
                              >
                                <Mail className="h-4 w-4" strokeWidth={2} />
                              </a>
                            ) : undefined
                          }
                          copy={
                            <CopyButton
                              copied={copiedField === "email"}
                              disabled={!hasText(data.email)}
                              label="Copy email"
                              onCopy={() => copyText("email", data.email)}
                            />
                          }
                        />
                      }
                    />
                  </div>
                </div>

                <div>
                  <SectionLabel
                    action={
                      linkedYards.length > 0 ? (
                        <span className="rounded-full border border-[#bbf7d0] bg-[#e2fae9] px-2 py-0.5 text-[11px] font-semibold text-[#008f68]">
                          {linkedYards.length}
                        </span>
                      ) : null
                    }
                  >
                    Associated yards
                  </SectionLabel>
                  {linkedYards.length === 0 ? (
                    <div className="rounded-xl border border-dashed border-slate-300 bg-white p-6 text-center shadow-sm dark:border-slate-700 dark:bg-slate-950">
                      <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-slate-50 text-slate-400">
                        <Building2 className="h-5 w-5" strokeWidth={2} />
                      </div>
                      <p className="mt-3 text-[13px] font-semibold text-slate-600">
                        No yards linked
                      </p>
                      <p className="mt-1 text-[12px] text-slate-500">
                        Assign yards when editing this landlord.
                      </p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 gap-3">
                      {linkedYards.map((yard) => (
                        <LinkedYardCard
                          key={yard.id}
                          yard={yard}
                          landlordId={data.id}
                          onNavigate={() => onOpenChange(false)}
                        />
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="shrink-0 border-t border-slate-200/70 bg-white/95 px-5 py-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] shadow-[0_-10px_30px_rgba(15,23,42,0.08)] backdrop-blur dark:border-slate-800 dark:bg-slate-950/95 sm:px-6">
              <div
                className={cn(
                  "grid gap-2",
                  !isAgent && onEdit
                    ? "grid-cols-3"
                    : !isAgent || onEdit
                      ? "grid-cols-2"
                      : "grid-cols-1",
                )}
              >
                <DialButton
                  phone={data.phone}
                  landlordId={data.id}
                  dial={dial}
                  canDial={canDial}
                />
                {!isAgent ? (
                  <SheetAction
                    icon={FileText}
                    label="Report"
                    href={`/reports/landlords?landlordId=${data.id}`}
                    onClick={() => onOpenChange(false)}
                  />
                ) : null}
                {onEdit ? (
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
