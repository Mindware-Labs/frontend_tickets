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
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  ArrowLeft,
  Building2,
  Check,
  Clock,
  Copy,
  ExternalLink,
  FileText,
  Globe,
  MapPin,
  Mail,
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
import type { Yard } from "../types";

interface YardSheetReturnLandlord {
  id: number;
  name: string;
}

interface YardSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  yard: Yard | null;
  onEdit?: (yard: Yard) => void;
  /** When opened from a landlord, show back navigation to restore that context. */
  returnLandlord?: YardSheetReturnLandlord | null;
}

function hasText(value?: string | null): value is string {
  return Boolean(value?.trim());
}

function hasDialablePhone(phone?: string | null): boolean {
  if (!phone?.trim()) return false;
  return phone.replace(/\D/g, "").length >= 7;
}

function formatActivityDate(value?: string | null) {
  if (!value) return "No recent activity";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "No recent activity";
  return date.toLocaleString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function normalizeExternalUrl(value?: string | null) {
  if (!hasText(value)) return null;
  const trimmed = value.trim();
  return /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
}

function getMapsUrl(address?: string | null) {
  if (!hasText(address)) return null;
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
    address.trim(),
  )}`;
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

function TypeTile({ type }: { type: Yard["yardType"] }) {
  const isSaas = type === "SAAS";
  return (
    <div
      className={cn(
        "flex min-h-[54px] min-w-0 flex-1 items-center gap-3 rounded-xl border px-3.5 py-2.5 shadow-sm",
        isSaas
          ? "border-blue-200/80 bg-blue-50 text-blue-800 dark:border-blue-500/30 dark:bg-blue-500/15 dark:text-blue-200"
          : "border-violet-200/80 bg-violet-50 text-violet-800 dark:border-violet-500/30 dark:bg-violet-500/15 dark:text-violet-200",
      )}
    >
      <Building2 className="h-4 w-4 shrink-0 opacity-75" strokeWidth={2} />
      <span className="min-w-0">
        <span className="block text-[10px] font-bold uppercase tracking-[0.12em] opacity-70">
          Service type
        </span>
        <span className="block truncate text-[14px] font-bold">
          {isSaas ? "SaaS" : "Full Service"}
        </span>
      </span>
    </div>
  );
}

function DialButton({
  phone,
  yardId,
  dial,
  canDial,
  variant = "header",
  className,
}: {
  phone?: string | null;
  yardId: number;
  dial: (phoneNumber: string, ticketId?: number | string) => boolean;
  canDial: boolean;
  variant?: "header" | "compact";
  className?: string;
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
        aria-label="Call via Aircall"
        title="Call via Aircall"
        className={cn(
          "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border transition-all duration-200 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#008f68]/35",
          disabled
            ? "cursor-not-allowed border-slate-100 bg-slate-50 text-slate-300 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-600"
            : "border-[#008f68]/20 bg-[#f0faf5] text-[#008f68] hover:border-[#008f68]/40 hover:bg-[#e2fae9] dark:border-emerald-500/25 dark:bg-emerald-500/10 dark:text-emerald-300 dark:hover:bg-emerald-500/15",
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
        className,
      )}
    >
      <PhoneCall className="h-4 w-4" strokeWidth={2.25} />
      Call
    </button>
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

function ExternalButton({
  href,
  label,
  icon: Icon = ExternalLink,
}: {
  href: string | null;
  label: string;
  icon?: LucideIcon;
}) {
  if (!href) {
    return (
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-slate-100 bg-slate-50 text-slate-300 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-700">
        <Icon className="h-4 w-4" strokeWidth={2} />
      </span>
    );
  }

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={label}
      title={label}
      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-slate-200/80 bg-white text-slate-400 transition-all duration-200 hover:border-slate-300 hover:bg-slate-50 hover:text-slate-700 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#008f68]/35 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-500 dark:hover:border-slate-700 dark:hover:bg-slate-900 dark:hover:text-slate-200"
    >
      <Icon className="h-4 w-4" strokeWidth={2} />
    </a>
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
  multiline = false,
  muted = false,
}: {
  icon: LucideIcon;
  label: string;
  value: ReactNode;
  actions?: ReactNode;
  multiline?: boolean;
  muted?: boolean;
}) {
  return (
    <div
      className={cn(
        "flex gap-3",
        multiline ? "items-start py-3.5" : "min-h-[58px] items-center py-1.5",
      )}
    >
      <div className={cn(ROW_ICON_CLASS, multiline && "mt-1")}>
        <Icon className="h-4 w-4 shrink-0" strokeWidth={2} />
      </div>
      <div
        className={cn(
          "flex min-w-0 flex-1 flex-col justify-center py-1",
          multiline ? "gap-1" : "gap-0.5",
        )}
      >
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
      <div className={cn(multiline && "mt-1")}>
        {actions ?? <RowActions />}
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

function SheetAction({
  icon: Icon,
  label,
  href,
  onClick,
  primary = false,
  className: actionClassName,
}: {
  icon: LucideIcon;
  label: string;
  href?: string;
  onClick?: () => void;
  primary?: boolean;
  className?: string;
}) {
  const className = cn(
    "flex min-h-11 w-full items-center justify-center gap-2 rounded-xl border px-3 text-[13px] font-semibold transition-all active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#008f68]/35",
    actionClassName,
    primary
      ? "border-[#008f68] bg-[#008f68] text-white shadow-sm shadow-emerald-900/10 hover:bg-[#007a5a]"
      : "border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-200 dark:hover:border-slate-700 dark:hover:bg-slate-900",
  );

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

function ReturnLandlordRail({
  landlord,
  onBack,
}: {
  landlord: YardSheetReturnLandlord;
  onBack: () => void;
}) {
  const railSurface =
    "border border-r-0 border-emerald-700/20 bg-gradient-to-l from-[#00a67a] via-[#008f68] to-[#007a5a] text-white";

  const expandLeft =
    "max-w-0 opacity-0 " +
    "group-hover/landlord-back:max-w-[min(280px,calc(100vw-6rem))] group-hover/landlord-back:opacity-100 " +
    "group-focus-visible/landlord-back:max-w-[min(280px,calc(100vw-6rem))] group-focus-visible/landlord-back:opacity-100 " +
    "group-active/landlord-back:max-w-[min(280px,calc(100vw-6rem))] group-active/landlord-back:opacity-100";

  return (
    <button
      type="button"
      onClick={onBack}
      aria-label={`Back to ${landlord.name}`}
      title={`Back to ${landlord.name}`}
      className={cn(
        "group/landlord-back overflow-visible",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#008f68]/45 focus-visible:ring-offset-2",
        "animate-in slide-in-from-left-8 fade-in duration-500",
      )}
    >
      <span
        className={cn(
          "relative inline-flex h-12 items-center overflow-visible",
          "drop-shadow-[0_10px_28px_rgba(0,111,80,0.38)]",
          "transition-[filter] duration-300",
          "group-hover/landlord-back:drop-shadow-[0_12px_32px_rgba(0,111,80,0.45)]",
          "group-active/landlord-back:drop-shadow-[0_12px_32px_rgba(0,111,80,0.45)]",
        )}
      >
        <span
          className={cn(
            "absolute right-full top-0 flex h-12 items-center gap-3 overflow-hidden",
            "rounded-l-[22px] border-r-0 pl-4 pr-4 -mr-px",
            railSurface,
            "origin-right transition-[max-width,opacity] duration-300 ease-out",
            expandLeft,
            "group-hover/landlord-back:rounded-r-none group-focus-visible/landlord-back:rounded-r-none group-active/landlord-back:rounded-r-none",
            "before:pointer-events-none before:absolute before:inset-y-0 before:left-0 before:w-10 before:rounded-l-[22px] before:bg-gradient-to-r before:from-white/12 before:to-transparent",
          )}
        >
          <ArrowLeft
            className="relative z-[1] h-4 w-4 shrink-0 text-white/95"
            strokeWidth={2.5}
          />
          <span className="relative z-[1] flex min-w-0 flex-col items-start justify-center gap-0.5 text-left">
            <span className="whitespace-nowrap text-[10px] font-bold uppercase tracking-[0.16em] text-emerald-50/90">
              Back to landlord
            </span>
            <span className="truncate whitespace-nowrap text-[14px] font-bold leading-tight">
              {landlord.name}
            </span>
          </span>
        </span>

        <span
          className={cn(
            "relative z-10 flex h-12 w-12 shrink-0 items-center justify-center",
            "rounded-l-[22px] border-r-0",
            railSurface,
            "transition-[border-radius] duration-300",
            "group-hover/landlord-back:rounded-l-none group-hover/landlord-back:border-l group-hover/landlord-back:border-white/20",
            "group-focus-visible/landlord-back:rounded-l-none group-active/landlord-back:rounded-l-none group-active/landlord-back:border-l group-active/landlord-back:border-white/20",
          )}
        >
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/15 ring-1 ring-inset ring-white/25">
            <User className="h-5 w-5" strokeWidth={2.5} />
          </span>
        </span>
      </span>
    </button>
  );
}

function FloatingNotesPopover({ notes }: { notes?: string | null }) {
  const cleanNotes = notes?.trim();

  if (!cleanNotes) {
    return null;
  }

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          className="absolute left-0 top-2 z-30 flex h-11 items-center gap-2 rounded-r-full border border-l-0 border-slate-200 bg-white px-3 text-[12px] font-bold text-slate-700 shadow-lg shadow-slate-900/10 transition-colors hover:border-[#008f68]/30 hover:bg-[#f0faf5] hover:text-[#008f68] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#008f68]/35 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-200 dark:hover:border-emerald-500/30 dark:hover:bg-emerald-500/10 dark:hover:text-emerald-300 sm:-left-12 sm:h-12 sm:w-12 sm:justify-center sm:rounded-l-full sm:border-l sm:px-0"
          aria-label="Open yard notes"
          title="Notes"
        >
          <FileText className="h-4 w-4 shrink-0" strokeWidth={2} />
          <span className="sm:sr-only">Notes</span>
          <span className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full border-2 border-white bg-[#008f68] dark:border-slate-950" />
        </button>
      </PopoverTrigger>
      <PopoverContent
        align="start"
        side="left"
        sideOffset={0}
        className="z-[60] w-[min(360px,calc(100vw-2rem))] rounded-xl border-slate-200 p-0 shadow-xl dark:border-slate-800"
      >
        <div className="border-b border-slate-100 px-4 py-3 dark:border-slate-800">
          <p className="text-sm font-semibold text-slate-900 dark:text-slate-50">
            Yard notes
          </p>
        </div>
        <div className="max-h-[320px] overflow-y-auto px-4 py-3">
          <p className="whitespace-pre-wrap text-[13px] leading-relaxed text-slate-700 [overflow-wrap:anywhere] dark:text-slate-200">
            {cleanNotes}
          </p>
        </div>
      </PopoverContent>
    </Popover>
  );
}

export function YardSheet({
  open,
  onOpenChange,
  yard,
  onEdit,
  returnLandlord,
}: YardSheetProps) {
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

  const [detail, setDetail] = useState<Yard | null>(null);
  const [loading, setLoading] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  useEffect(() => {
    setSheetOpen(open);
    return () => setSheetOpen(false);
  }, [open, setSheetOpen]);

  useEffect(() => {
    if (!yard?.id) {
      setDetail(null);
      return;
    }

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
  }, [yard]);

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

  const data = detail || yard;
  const ticketTotal = data?.ticketCount ?? data?.totalTickets ?? 0;
  const openTicketLabel =
    typeof data?.openTickets === "number"
      ? `${data.openTickets} open`
      : "Calls · tickets · manual";
  const lastActivityLabel = formatActivityDate(data?.lastActivity);
  const yardLinkUrl = normalizeExternalUrl(data?.yardLink);
  const mapsUrl = getMapsUrl(data?.propertyAddress);

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
              <SheetTitle>Yard details</SheetTitle>
              <SheetDescription>No yard selected.</SheetDescription>
            </SheetHeader>
            <div className="flex min-h-0 flex-1 items-center justify-center p-8 text-center">
              <div>
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-400 shadow-sm dark:border-slate-800 dark:bg-slate-900 dark:text-slate-500">
                  <Building2 className="h-6 w-6" strokeWidth={1.7} />
                </div>
                <p className="mt-4 text-sm font-semibold text-slate-900 dark:text-slate-50">
                  No yard selected
                </p>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                  Pick a yard from the table to view its details.
                </p>
              </div>
            </div>
          </>
        ) : (
          <>
            <SheetHeader className="sr-only">
              <SheetTitle>{data.name || "Yard details"}</SheetTitle>
              <SheetDescription>
                Yard profile with property, contact, landlord, notes, and quick
                actions.
              </SheetDescription>
            </SheetHeader>
            <FloatingNotesPopover notes={data.notes} />

            <div className="relative shrink-0 overflow-visible bg-white dark:bg-slate-950">
              <SheetClose
                aria-label="Close yard details"
                className="absolute right-4 top-4 z-20 flex h-10 w-10 items-center justify-center rounded-full text-slate-400 transition-all hover:bg-slate-100 hover:text-slate-700 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#008f68]/35 dark:hover:bg-slate-900 dark:hover:text-slate-200"
              >
                <X className="h-5 w-5" strokeWidth={2} />
              </SheetClose>

              <div
                className={cn(
                  "px-5 pt-5 sm:px-6",
                  returnLandlord ? "pb-6" : "pb-4",
                )}
              >
                <div className="flex items-start gap-4 pr-12">
                  <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-[#008f68]/15 bg-[#f0faf5] text-[#008f68] shadow-sm dark:border-emerald-500/25 dark:bg-emerald-500/10 dark:text-emerald-300">
                    <Building2 className="h-6 w-6" strokeWidth={1.7} />
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

                    <h2 className="mt-2 min-w-0 text-[22px] font-bold leading-tight text-slate-950 [overflow-wrap:anywhere] dark:text-white">
                      {data.name || "Unknown Yard"}
                    </h2>

                    {hasText(data.commonName) &&
                    data.commonName.trim() !== data.name.trim() ? (
                      <p className="mt-1 min-w-0 text-[13px] font-medium text-slate-500 [overflow-wrap:anywhere] dark:text-slate-400">
                        {data.commonName.trim()}
                      </p>
                    ) : null}
                  </div>
                </div>

                <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2">
                  <StatusTile active={data.isActive} />
                  <TypeTile type={data.yardType} />
                </div>

                <div className="mt-4 grid grid-cols-2 gap-2">
                  <MetricTile
                    icon={ActivitiesIcon}
                    label="Activities"
                    value={String(ticketTotal)}
                    helper={openTicketLabel}
                  />
                  <MetricTile
                    icon={Clock}
                    label="Activity"
                    value={lastActivityLabel}
                    helper="Last update"
                  />
                </div>
              </div>

            </div>

            <div
              className={cn(
                "relative z-30 h-0 shrink-0 overflow-visible border-t border-slate-200/70 dark:border-slate-800",
                returnLandlord ? "pointer-events-none" : "",
              )}
            >
              {returnLandlord ? (
                <div className="pointer-events-auto absolute top-0 left-0 -translate-y-1/2 sm:-translate-x-10">
                  <ReturnLandlordRail
                    landlord={returnLandlord}
                    onBack={() => {
                      onOpenChange(false);
                      router.push(
                        `/landlords?landlordId=${returnLandlord.id}`,
                      );
                    }}
                  />
                </div>
              ) : null}
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
              <div
                className={cn(
                  "space-y-6 px-5 pb-8 sm:px-6",
                  returnLandlord ? "pt-6 pb-5" : "py-5",
                )}
              >
                <div>
                  <SectionLabel>Property & Contact</SectionLabel>
                  <div className="divide-y divide-slate-100 overflow-hidden rounded-xl border border-slate-200/70 bg-white px-4 shadow-sm dark:divide-slate-800 dark:border-slate-800 dark:bg-slate-950">
                    <DetailRow
                      multiline
                      icon={MapPin}
                      label="Address"
                      muted={!hasText(data.propertyAddress)}
                      value={
                        hasText(data.propertyAddress) ? (
                          <p className="[overflow-wrap:anywhere]">
                            {data.propertyAddress.trim()}
                          </p>
                        ) : (
                          "No address on file."
                        )
                      }
                      actions={
                        <RowActions
                          external={
                            <ExternalButton
                              href={mapsUrl}
                              label="Open address in Google Maps"
                              icon={MapPin}
                            />
                          }
                          copy={
                            <CopyButton
                              copied={copiedField === "address"}
                              disabled={!hasText(data.propertyAddress)}
                              label="Copy address"
                              onCopy={() =>
                                copyText("address", data.propertyAddress)
                              }
                            />
                          }
                        />
                      }
                    />

                    <DetailRow
                      icon={Phone}
                      label="Primary phone"
                      muted={!hasText(data.contactInfo)}
                      value={
                        hasText(data.contactInfo) ? (
                          <p className="font-mono font-semibold text-slate-950 dark:text-white">
                            {data.contactInfo.trim()}
                          </p>
                        ) : (
                          "No phone on file."
                        )
                      }
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
                              disabled={!hasText(data.contactInfo)}
                              label="Copy phone"
                              onCopy={() =>
                                copyText("contact", data.contactInfo)
                              }
                            />
                          }
                        />
                      }
                    />

                    <DetailRow
                      icon={Globe}
                      label="Yard link"
                      muted={!yardLinkUrl}
                      value={
                        yardLinkUrl ? (
                          <a
                            href={yardLinkUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="block truncate font-semibold text-[#008f68] underline-offset-2 hover:underline dark:text-emerald-300"
                          >
                            {data.yardLink?.trim()}
                          </a>
                        ) : (
                          "No portal link added."
                        )
                      }
                      actions={
                        <RowActions
                          external={
                            <ExternalButton
                              href={yardLinkUrl}
                              label="Open yard link"
                              icon={ExternalLink}
                            />
                          }
                          copy={
                            <CopyButton
                              copied={copiedField === "yard-link"}
                              disabled={!hasText(data.yardLink)}
                              label="Copy yard link"
                              onCopy={() => copyText("yard-link", data.yardLink)}
                            />
                          }
                        />
                      }
                    />
                  </div>
                </div>

                <div>
                  <SectionLabel>Landlord</SectionLabel>
                  {data.landlord ? (
                    <div className="divide-y divide-slate-100 overflow-hidden rounded-xl border border-slate-200/70 bg-white px-4 shadow-sm dark:divide-slate-800 dark:border-slate-800 dark:bg-slate-950">
                      <DetailRow
                        icon={User}
                        label="Name"
                        value={
                          <p className="font-semibold text-slate-950 [overflow-wrap:anywhere] dark:text-white">
                            {data.landlord.name}
                          </p>
                        }
                      />

                      <DetailRow
                        icon={Phone}
                        label="Phone"
                        muted={!hasText(data.landlord.phone)}
                        value={
                          hasText(data.landlord.phone) ? (
                            <p className="font-mono font-semibold text-slate-950 dark:text-white">
                              {data.landlord.phone.trim()}
                            </p>
                          ) : (
                            "No phone on file."
                          )
                        }
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
                                disabled={!hasText(data.landlord.phone)}
                                label="Copy landlord phone"
                                onCopy={() =>
                                  copyText(
                                    "landlord-phone",
                                    data.landlord?.phone,
                                  )
                                }
                              />
                            }
                          />
                        }
                      />

                      <DetailRow
                        icon={Mail}
                        label="Email"
                        muted={!hasText(data.landlord.email)}
                        value={
                          hasText(data.landlord.email) ? (
                            <a
                              href={`mailto:${data.landlord.email.trim()}`}
                              className="block truncate font-semibold text-[#008f68] underline-offset-2 hover:underline dark:text-emerald-300"
                            >
                              {data.landlord.email.trim()}
                            </a>
                          ) : (
                            "No email on file."
                          )
                        }
                        actions={
                          <RowActions
                            external={
                              hasText(data.landlord.email) ? (
                                <ExternalButton
                                  href={`mailto:${data.landlord.email.trim()}`}
                                  label="Email landlord"
                                  icon={Mail}
                                />
                              ) : undefined
                            }
                            copy={
                              <CopyButton
                                copied={copiedField === "landlord-email"}
                                disabled={!hasText(data.landlord.email)}
                                label="Copy landlord email"
                                onCopy={() =>
                                  copyText(
                                    "landlord-email",
                                    data.landlord?.email,
                                  )
                                }
                              />
                            }
                          />
                        }
                      />
                    </div>
                  ) : (
                    <div className="rounded-xl border border-dashed border-slate-300 bg-white p-6 text-center shadow-sm dark:border-slate-700 dark:bg-slate-950">
                      <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-slate-400 dark:bg-slate-900 dark:text-slate-500">
                        <User className="h-4 w-4" strokeWidth={2} />
                      </div>
                      <p className="mt-3 text-[13px] font-semibold text-slate-700 dark:text-slate-200">
                        No landlord assigned
                      </p>
                      <p className="mt-1 text-[12px] text-slate-500 dark:text-slate-400">
                        Add one from the edit form when this yard has an owner
                        contact.
                      </p>
                    </div>
                  )}
                </div>

              </div>
            </div>

            <div className="shrink-0 border-t border-slate-200/70 bg-white/95 px-5 py-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] shadow-[0_-10px_30px_rgba(15,23,42,0.08)] backdrop-blur dark:border-slate-800 dark:bg-slate-950/95 sm:px-6">
              <div className="flex justify-center overflow-x-auto">
                <div className="flex flex-nowrap items-center gap-2">
                  <DialButton
                    phone={data.contactInfo}
                    yardId={data.id}
                    dial={dial}
                    canDial={canDial}
                    className="w-30 shrink-0"
                  />
                  <SheetAction
                    icon={ActivitiesIcon}
                    label="Activities"
                    href={`/calls?yardId=${data.id}`}
                    onClick={() => onOpenChange(false)}
                    className="w-30 shrink-0"
                  />
                  {!isAgent ? (
                    <SheetAction
                      icon={FileText}
                      label="Report"
                      href={`/reports/yards?yardId=${data.id}`}
                      onClick={() => onOpenChange(false)}
                      className="w-30 shrink-0"
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
                      className="w-30 shrink-0"
                    />
                  ) : null}
                </div>
              </div>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
