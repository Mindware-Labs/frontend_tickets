"use client";

import { useEffect, useState, type ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import Link from "next/link";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Building2,
  Check,
  Clock,
  Copy,
  ExternalLink,
  FileText,
  MapPin,
  Mail,
  Pencil,
  Phone,
  PhoneOutgoing,
  Ticket,
  User,
  X,
} from "lucide-react";
import { fetchFromBackend } from "@/lib/api-client";
import { useAircall } from "@/components/providers/AircallProvider";
import { useRole } from "@/components/providers/role-provider";
import { cn } from "@/lib/utils";
import type { Yard } from "../types";

interface YardSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  yard: Yard | null;
  onEdit?: (yard: Yard) => void;
}

function hasDialablePhone(phone?: string | null): boolean {
  if (!phone?.trim()) return false;
  return phone.replace(/\D/g, "").length >= 7;
}

function formatActivityDate(value?: string | null) {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.toLocaleString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function SectionLabel({ children }: { children: ReactNode }) {
  return (
    <p className="mb-3 text-[11px] font-bold uppercase tracking-[0.15em] text-slate-400">
      {children}
    </p>
  );
}

function StatusChip({ active }: { active: boolean }) {
  return active ? (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200/80 bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold text-emerald-700">
      <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 shadow-[0_0_0_2px_rgba(16,185,129,0.2)]" />
      Active
    </span>
  ) : (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-[11px] font-semibold text-slate-600">
      <span className="h-1.5 w-1.5 rounded-full bg-slate-400" />
      Inactive
    </span>
  );
}

function TypeChip({ type }: { type: Yard["yardType"] }) {
  const isSaas = type === "SAAS";
  return (
    <span
      className={cn(
        "inline-flex rounded-full border px-2.5 py-1 text-[11px] font-semibold",
        isSaas
          ? "border-blue-200/80 bg-blue-50 text-blue-700"
          : "border-violet-200/80 bg-violet-50 text-violet-700",
      )}
    >
      {isSaas ? "SaaS" : "Full Service"}
    </span>
  );
}

function DialButton({
  phone,
  yardId,
  dial,
  canDial,
  variant = "header",
}: {
  phone?: string | null;
  yardId: number;
  dial: (phoneNumber: string, ticketId?: number | string) => boolean;
  canDial: boolean;
  variant?: "header" | "compact";
}) {
  const dialable = hasDialablePhone(phone);
  const disabled = !dialable || !canDial;

  const handleClick = () => {
    if (!dialable || !canDial || !phone) return;
    dial(phone.trim(), `yard-${yardId}`);
  };

  if (variant === "compact") {
    return (
      <button
        type="button"
        onClick={handleClick}
        disabled={disabled}
        title="Call via Aircall"
        className={cn(
          "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border transition-all duration-200 active:scale-95",
          disabled
            ? "cursor-not-allowed border-slate-100 bg-slate-50 text-slate-300"
            : "border-[#008f68]/20 bg-[#f0faf5] text-[#008f68] hover:border-[#008f68]/40 hover:bg-[#e2fae9]",
        )}
      >
        <PhoneOutgoing className="h-4 w-4" strokeWidth={2} />
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={disabled}
      className={cn(
        "flex h-9 items-center gap-2 rounded-full px-4 text-[13px] font-semibold transition-all active:scale-95",
        disabled
          ? "cursor-not-allowed bg-slate-100 text-slate-400"
          : "bg-[#008f68] text-white shadow-sm hover:bg-[#007a5a]",
      )}
    >
      <PhoneOutgoing className="h-4 w-4" strokeWidth={2.25} />
      Call
    </button>
  );
}

function CopyButton({
  onCopy,
  copied,
}: {
  onCopy: () => void;
  copied: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onCopy}
      className={cn(
        "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border bg-white transition-all duration-200 active:scale-95",
        copied
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

const iconActionBase =
  "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border";

const ROW_ICON_CLASS =
  "flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-slate-100 bg-slate-50 text-slate-400";
const ACTION_SLOT_CLASS = "flex h-8 w-8 shrink-0 items-center justify-center";

/** Fixed dial + copy slots so every row aligns on the right. */
function RowActions({ dial, copy }: { dial?: ReactNode; copy?: ReactNode }) {
  return (
    <div className="flex w-[76px] shrink-0 items-center justify-end gap-1.5">
      <div className={ACTION_SLOT_CLASS}>{dial ?? null}</div>
      <div className={ACTION_SLOT_CLASS}>{copy ?? null}</div>
    </div>
  );
}

function DetailRow({
  icon: Icon,
  children,
  actions,
  multiline = false,
}: {
  icon: LucideIcon;
  children: ReactNode;
  actions?: ReactNode;
  /** Wrap long text (e.g. address) instead of overflowing horizontally. */
  multiline?: boolean;
}) {
  return (
    <div
      className={cn(
        "flex gap-3",
        multiline ? "items-start py-3" : "min-h-[52px] items-center py-1",
      )}
    >
      <div className={cn(ROW_ICON_CLASS, multiline && "mt-0.5")}>
        <Icon className="h-4 w-4 shrink-0" strokeWidth={2} />
      </div>
      <div
        className={cn(
          "flex min-w-0 flex-1 py-1",
          multiline ? "items-start" : "items-center",
        )}
      >
        {children}
      </div>
      <div className={cn(multiline && "mt-0.5")}>
        {actions ?? <RowActions />}
      </div>
    </div>
  );
}

const actionRowClass =
  "group flex min-h-[52px] w-full cursor-pointer items-center gap-3 px-4 py-1 text-left transition-colors hover:bg-slate-50 active:bg-slate-100/90";

/** Full-width clickable action row (label + trailing icon). */
function ActionRow({
  icon: Icon,
  label,
  href,
  onClick,
  accent,
}: {
  icon: LucideIcon;
  label: string;
  href?: string;
  onClick?: () => void;
  accent?: boolean;
}) {
  const trailingClass = cn(
    iconActionBase,
    "pointer-events-none transition-colors",
    accent
      ? "border-[#008f68]/20 bg-[#f0faf5] text-[#008f68] group-hover:border-[#008f68]/30 group-hover:bg-[#e2fae9]"
      : "border-slate-200/80 bg-slate-50/50 text-slate-500 group-hover:border-slate-200 group-hover:bg-slate-100",
  );

  const content = (
    <>
      <div className={ROW_ICON_CLASS}>
        <Icon className="h-4 w-4 shrink-0" strokeWidth={2} />
      </div>
      <p className="min-w-0 flex-1 text-[13px] font-medium leading-none text-slate-800">
        {label}
      </p>
      <span className={trailingClass} aria-hidden>
        <Icon className="h-4 w-4" strokeWidth={2} />
      </span>
    </>
  );

  if (href) {
    return (
      <Link
        href={href}
        onClick={onClick}
        className={actionRowClass}
        aria-label={label}
      >
        {content}
      </Link>
    );
  }

  return (
    <button
      type="button"
      onClick={onClick}
      className={actionRowClass}
      aria-label={label}
    >
      {content}
    </button>
  );
}

export function YardSheet({
  open,
  onOpenChange,
  yard,
  onEdit,
}: YardSheetProps) {
  const { role } = useRole();
  const isAgent = role?.toString().toLowerCase() === "agent";
  const {
    dial,
    status: aircallStatus,
    isLoggedIn: aircallLoggedIn,
    setSheetOpen,
  } = useAircall();
  const canDial = aircallStatus === "ready" && aircallLoggedIn;

  const [detail, setDetail] = useState<Yard | null>(null);
  const [loading, setLoading] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  useEffect(() => {
    setSheetOpen(open);
    return () => setSheetOpen(false);
  }, [open, setSheetOpen]);

  useEffect(() => {
    if (!yard?.id) return;
    setDetail(yard);
    let cancelled = false;
    const load = async () => {
      try {
        setLoading(true);
        const fetchedData = await fetchFromBackend(`/yards/${yard.id}`);
        if (!cancelled) setDetail(fetchedData);
      } catch {
        if (!cancelled) setDetail(yard);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, [yard?.id]);

  const copyText = (key: string, text: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedField(key);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const data = detail || yard;
  const lastActivityLabel = formatActivityDate(data?.lastActivity) ?? "None";

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        hideClose
        className={cn(
          "flex h-full w-full max-w-[420px] flex-col gap-0 overflow-hidden p-0",
          "border-l border-slate-200/80 bg-[#fbfcff]",
          "shadow-2xl shadow-slate-900/10 antialiased",
        )}
      >
        {!data ? (
          <SheetHeader className="sr-only">
            <SheetTitle>Yard details</SheetTitle>
          </SheetHeader>
        ) : (
          <>
            <SheetHeader className="sr-only">
              <SheetTitle>{data.name}</SheetTitle>
            </SheetHeader>

            <div className="relative shrink-0 border-b border-slate-200/70 bg-white pt-6">
              <SheetClose
                aria-label="Close yard details"
                className="absolute right-4 top-4 z-20 flex h-8 w-8 items-center justify-center rounded-full text-slate-400 transition-all hover:bg-slate-100 hover:text-slate-700 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#008f68]/35"
              >
                <X className="h-5 w-5" strokeWidth={2} />
              </SheetClose>

              <div className="px-6 pb-5 pt-1">
                <div className="flex items-center gap-4 pr-8">
                  <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-[#008f68]/15 bg-[#f0faf5] text-[#008f68]">
                    <Building2 className="h-6 w-6" strokeWidth={1.5} />
                  </div>

                  <div className="min-w-0 flex-1 pt-0.5">
                    <div className="flex items-start justify-between gap-3">
                      <h2 className="min-w-0 break-all text-[20px] font-bold leading-tight text-slate-900">
                        {data.name || "Unknown Yard"}
                      </h2>
                      <span className="mt-1 shrink-0 rounded-md bg-slate-100 px-2 py-0.5 font-mono text-[11px] font-semibold text-slate-500">
                        #{data.id}
                      </span>
                      {loading ? (
                        <span className="mt-1 shrink-0 rounded-md bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-500">
                          Refreshing
                        </span>
                      ) : null}
                    </div>

                    {data.commonName?.trim() &&
                    data.commonName.trim() !== data.name.trim() ? (
                      <p className="mt-1.5 min-w-0 break-all text-[13px] font-medium text-slate-500">
                        {data.commonName}
                      </p>
                    ) : null}
                  </div>
                </div>

                <div className="mt-5 flex flex-wrap items-center justify-center gap-2.5">
                  <StatusChip active={data.isActive} />
                  <TypeChip type={data.yardType} />

                  <div className="inline-flex max-w-full items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 py-1 shadow-sm">
                    <Phone className="h-3 w-3 shrink-0 text-slate-400" />
                    <span className="min-w-0 break-all font-mono text-[12px] font-semibold text-slate-700">
                      {data.contactInfo || "No phone"}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-center gap-2 border-t border-slate-100 bg-slate-50/50 px-5 py-2.5 text-[12px] text-slate-500">
                <Clock
                  className="h-3.5 w-3.5 shrink-0 text-slate-400"
                  strokeWidth={2}
                />
                <span className="min-w-0 break-all">
                  Last activity:{" "}
                  <span className="font-semibold text-slate-700">
                    {lastActivityLabel}
                  </span>
                </span>
              </div>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
              <div className="space-y-6 px-6 py-6 pb-8">
                {/* Property & Contact */}
                <div>
                  <SectionLabel>Property & Contact</SectionLabel>
                  <div className="divide-y divide-slate-100 overflow-hidden rounded-2xl border border-slate-200/60 bg-white px-4 shadow-sm">
                    <DetailRow
                      multiline
                      icon={MapPin}
                      actions={
                        <RowActions
                          copy={
                            <CopyButton
                              copied={copiedField === "address"}
                              onCopy={() =>
                                copyText("address", data.propertyAddress)
                              }
                            />
                          }
                        />
                      }
                    >
                      <p className="min-w-0 wrap-anywhere text-[13px] font-medium leading-relaxed text-slate-800">
                        {data.propertyAddress}
                      </p>
                    </DetailRow>

                    <DetailRow
                      icon={Phone}
                      actions={
                        <RowActions
                          dial={
                            <DialButton
                              variant="compact"
                              phone={data.contactInfo}
                              yardId={data.id}
                              dial={dial}
                              canDial={canDial}
                            />
                          }
                          copy={
                            <CopyButton
                              copied={copiedField === "contact"}
                              onCopy={() =>
                                copyText("contact", data.contactInfo)
                              }
                            />
                          }
                        />
                      }
                    >
                      <p className="font-mono text-[13px] font-semibold leading-none text-slate-900">
                        {data.contactInfo || "—"}
                      </p>
                    </DetailRow>

                    {data.yardLink && (
                      <DetailRow icon={ExternalLink} actions={<RowActions />}>
                        <a
                          href={
                            data.yardLink.startsWith("http")
                              ? data.yardLink
                              : `https://${data.yardLink}`
                          }
                          target="_blank"
                          rel="noopener noreferrer"
                          className="truncate text-[13px] font-medium text-[#008f68] hover:underline underline-offset-2"
                        >
                          {data.yardLink}
                        </a>
                      </DetailRow>
                    )}
                  </div>
                </div>

                {/* Landlord */}
                <div>
                  <SectionLabel>Landlord</SectionLabel>
                  {data.landlord ? (
                    <div className="divide-y divide-slate-100 overflow-hidden rounded-2xl border border-slate-200/60 bg-white px-4 shadow-sm">
                      <DetailRow icon={User} actions={<RowActions />}>
                        <p className="text-[13px] font-semibold leading-none text-slate-900">
                          {data.landlord.name}
                        </p>
                      </DetailRow>

                      {data.landlord.phone && (
                        <DetailRow
                          icon={Phone}
                          actions={
                            <RowActions
                              dial={
                                <DialButton
                                  variant="compact"
                                  phone={data.landlord.phone}
                                  yardId={data.id}
                                  dial={dial}
                                  canDial={canDial}
                                />
                              }
                              copy={
                                <CopyButton
                                  copied={copiedField === "landlord-phone"}
                                  onCopy={() =>
                                    copyText(
                                      "landlord-phone",
                                      data.landlord!.phone!,
                                    )
                                  }
                                />
                              }
                            />
                          }
                        >
                          <p className="font-mono text-[13px] font-semibold leading-none text-slate-900">
                            {data.landlord.phone}
                          </p>
                        </DetailRow>
                      )}

                      {data.landlord.email && (
                        <DetailRow
                          icon={Mail}
                          actions={
                            <RowActions
                              copy={
                                <CopyButton
                                  copied={copiedField === "landlord-email"}
                                  onCopy={() =>
                                    copyText(
                                      "landlord-email",
                                      data.landlord!.email!,
                                    )
                                  }
                                />
                              }
                            />
                          }
                        >
                          <p className="truncate text-[13px] font-medium leading-none text-slate-800">
                            {data.landlord.email}
                          </p>
                        </DetailRow>
                      )}
                    </div>
                  ) : (
                    <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50/50 p-6 text-center">
                      <p className="text-[13px] font-medium text-slate-500">
                        No landlord assigned.
                      </p>
                    </div>
                  )}
                </div>

                {/* Notes */}
                <div>
                  <SectionLabel>Notes</SectionLabel>
                  <div className="rounded-2xl border border-slate-200/60 bg-white p-4 shadow-sm">
                    <p
                      className={cn(
                        "whitespace-pre-wrap text-[13px] leading-relaxed",
                        data.notes?.trim()
                          ? "text-slate-800"
                          : "italic text-slate-400",
                      )}
                    >
                      {data.notes?.trim() || "No additional notes..."}
                    </p>
                  </div>
                </div>

                {/* Quick actions — entire row is clickable */}
                <div>
                  <SectionLabel>Actions</SectionLabel>
                  <div className="divide-y divide-slate-100 overflow-hidden rounded-2xl border border-slate-200/60 bg-white shadow-sm">
                    <ActionRow
                      icon={Ticket}
                      label="View all tickets"
                      href={`/calls?yardId=${data.id}`}
                      onClick={() => onOpenChange(false)}
                    />

                    {!isAgent && (
                      <ActionRow
                        icon={FileText}
                        label="Yard report"
                        href={`/reports/yards?yardId=${data.id}`}
                        onClick={() => onOpenChange(false)}
                        accent
                      />
                    )}

                    {onEdit && (
                      <ActionRow
                        icon={Pencil}
                        label="Edit yard"
                        onClick={() => {
                          onOpenChange(false);
                          onEdit(data);
                        }}
                      />
                    )}
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
