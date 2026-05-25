"use client";

/**
 * CallPeekPanel
 * ─────────────
 * Floating read-only panel that displays the full details of a call from the
 * customer's history.
 *
 * Responsive behaviour:
 *  - Mobile  (<768 px): Bottom Sheet — full-width, anchored at bottom, rounded
 *    top corners, slide-in-from-bottom animation.
 *  - Desktop (≥768 px): Floating panel in the gap to the left of the Side
 *    Sheet, zoom-in + slide-in-from-right animation.
 */

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";
import { useAircall } from "@/components/providers/AircallProvider";
import type { Ticket } from "@/lib/mock-data";
import {
  X,
  Download,
  Paperclip,
  Clock,
  CalendarIcon,
  Phone,
  PhoneOutgoing,
  PhoneCall,
  ArrowDownLeft,
  Voicemail,
  User,
  Tag,
  MapPin,
  ExternalLink,
  Loader2,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  Link2,
} from "lucide-react";
import {
  formatEnumLabel,
  fmtDate,
  fmtRelative,
} from "../../utils/call-helpers";

// ── Constants ─────────────────────────────────────────────────────────────────

const BACKEND_API_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

// ── Helpers ───────────────────────────────────────────────────────────────────

const fmtDateTime = (iso?: string | null) => {
  if (!iso) return "—";
  try {
    const d = new Date(iso);
    if (isNaN(d.getTime())) return "—";
    return d.toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return "—";
  }
};

const fmtDuration = (s?: number | null) => {
  if (s == null) return "—";
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${m}:${String(sec).padStart(2, "0")}`;
};

const STATUS_COLORS: Record<
  string,
  { text: string; bg: string; label: string }
> = {
  ACTIVE: { text: "#008f68", bg: "#e6f5f0", label: "Active" },
  COMPLETED: { text: "#64748b", bg: "#f1f5f9", label: "Completed" },
  PENDING_FOLLOWUP: {
    text: "#c47a00",
    bg: "#fef3d6",
    label: "Pending Follow-up",
  },
  OVERDUE: { text: "#c0392b", bg: "#fde8e6", label: "Overdue" },
};

const DISPOSITION_COLORS: Record<
  string,
  { text: string; bg: string; label: string }
> = {
  RESOLVED: { text: "#008f68", bg: "#e6f5f0", label: "Resolved" },
  CALLBACK_REQUIRED: {
    text: "#c47a00",
    bg: "#fef3d6",
    label: "Callback Required",
  },
  CALLBACK_SCHEDULED: {
    text: "#d97706",
    bg: "#fffbeb",
    label: "Callback Scheduled",
  },
  VOICEMAIL_LEFT: { text: "#2563eb", bg: "#eff6ff", label: "Voicemail Left" },
  NO_ANSWER: { text: "#c0392b", bg: "#fde8e6", label: "No Answer" },
  NEW_LEAD: { text: "#047857", bg: "#d1fae5", label: "New Lead" },
  PROMISE_TO_PAY: { text: "#0891b2", bg: "#ecfeff", label: "Promise to Pay" },
  DISPUTE: { text: "#dc2626", bg: "#fef2f2", label: "Dispute" },
  WRONG_NUMBER: { text: "#64748b", bg: "#f1f5f9", label: "Wrong Number" },
  ENROLLED: { text: "#7c3aed", bg: "#f5f3ff", label: "Enrolled" },
  ESCALATED: { text: "#9b1c1c", bg: "#fef2f2", label: "Escalated" },
};

function dirStyle(dir: string, hasMissed: boolean) {
  const d = dir.toLowerCase();
  if (d === "voicemail")
    return { color: "#7c3aed", label: "Voicemail", Icon: Voicemail };
  if (d === "missed" || hasMissed)
    return { color: "#c0392b", label: "Missed", Icon: PhoneCall };
  if (d === "outbound")
    return { color: "#2563eb", label: "Outbound", Icon: PhoneOutgoing };
  return { color: "#008f68", label: "Inbound", Icon: ArrowDownLeft };
}

function getFilename(url: string): string {
  try {
    const decoded = decodeURIComponent(url);
    const name = decoded.split("/").pop()?.split("?")[0] ?? url;
    return name.replace(/^[0-9a-f-]{36}_/i, "");
  } catch {
    return url;
  }
}

// ── Sub-components ────────────────────────────────────────────────────────────

function PeekBadge({
  color,
  bg,
  icon: Icon,
  children,
}: {
  color: string;
  bg: string;
  icon?: React.ElementType;
  children: React.ReactNode;
}) {
  return (
    <span
      className="inline-flex items-center gap-1 text-[10.5px] font-semibold px-2 py-0.5 rounded-md leading-none"
      style={{ color, background: bg }}
    >
      {Icon && <Icon className="w-3 h-3 shrink-0" />}
      {children}
    </span>
  );
}

function MetricTile({
  icon: Icon,
  label,
  value,
  mono = false,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div className="rounded-lg border border-slate-100 bg-slate-50/80 px-2.5 py-2 min-w-0">
      <p className="flex items-center gap-1 text-[9px] font-semibold text-slate-400 uppercase tracking-wide">
        <Icon className="w-2.5 h-2.5 shrink-0" />
        {label}
      </p>
      <p
        className={cn(
          "text-[12px] font-semibold text-slate-800 mt-1 leading-tight truncate",
          mono && "font-mono tabular-nums",
        )}
        title={value}
      >
        {value}
      </p>
    </div>
  );
}

function DetailRow({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ElementType;
  label: string;
  value: React.ReactNode;
}) {
  if (!value || value === "—") return null;
  const strValue = typeof value === "string" ? value : undefined;
  return (
    <div className="flex items-start gap-2.5 py-2 border-b border-slate-100/90 last:border-0">
      <div className="w-6 h-6 rounded-md bg-white border border-slate-100 flex items-center justify-center shrink-0 mt-0.5">
        <Icon className="w-3 h-3 text-slate-400" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[9px] font-semibold text-slate-400 uppercase tracking-wide">
          {label}
        </p>
        <p
          className="text-[12px] font-medium text-slate-800 mt-0.5 leading-snug wrap-break-word"
          title={strValue}
        >
          {value}
        </p>
      </div>
    </div>
  );
}

function DetailSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  const items = Array.isArray(children)
    ? children.filter(Boolean)
    : children;
  if (!items || (Array.isArray(items) && items.length === 0)) return null;

  return (
    <section className="rounded-xl border border-slate-100 bg-white overflow-hidden">
      <div className="px-3 py-1.5 bg-slate-50/90 border-b border-slate-100">
        <h3 className="text-[9.5px] font-bold text-slate-500 uppercase tracking-widest">
          {title}
        </h3>
      </div>
      <div className="px-3">{children}</div>
    </section>
  );
}

function SkeletonBlock(props: React.HTMLAttributes<HTMLDivElement>) {
  const { className, ...rest } = props;
  return (
    <div
      className={cn("animate-pulse rounded-md bg-slate-100", className)}
      {...rest}
    />
  );
}

// ── Main Component ────────────────────────────────────────────────────────────

interface CallPeekPanelProps {
  call: Ticket | null;
  isLoading: boolean;
  onClose: () => void;
  onLink?: () => void;
}

export function CallPeekPanel({
  call,
  isLoading,
  onClose,
  onLink,
}: CallPeekPanelProps) {
  const isMobile = useIsMobile();
  const { dockOpen, sheetOpen: aircallSheetOpen } = useAircall();
  const aircallOnLeft = dockOpen && aircallSheetOpen;
  const [active, setActive] = useState(false);
  const [visible, setVisible] = useState(false);
  const [downloading, setDownloading] = useState<Record<string, boolean>>({});
  const [downloadError, setDownloadError] = useState<Record<string, boolean>>(
    {},
  );
  const [notesExpanded, setNotesExpanded] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);

  const isOpen = isLoading || call !== null;

  useEffect(() => {
    if (!isOpen) {
      setVisible(false);
      const t = setTimeout(() => setActive(false), 300);
      return () => clearTimeout(t);
    }
    setActive(true);
    setVisible(false);
    const raf = requestAnimationFrame(() =>
      requestAnimationFrame(() => setVisible(true)),
    );
    return () => cancelAnimationFrame(raf);
  }, [isOpen]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: 0 });
    setNotesExpanded(true);
    setDownloadError({});
  }, [call?.id]);

  const handleDownload = async (rawUrl: string) => {
    setDownloading((p) => ({ ...p, [rawUrl]: true }));
    setDownloadError((p) => ({ ...p, [rawUrl]: false }));
    try {
      const token =
        (typeof document !== "undefined" &&
          document.cookie
            .split("; ")
            .find((r) => r.startsWith("auth-token="))
            ?.split("=")[1]) ||
        (typeof window !== "undefined" && localStorage.getItem("auth_token")) ||
        null;

      const encodedUrl = encodeURIComponent(rawUrl);
      const res = await fetch(
        `${BACKEND_API_URL}/calls/${call?.id}/attachments/${encodedUrl}/download`,
        { headers: token ? { Authorization: `Bearer ${token}` } : {} },
      );
      if (!res.ok) throw new Error(`${res.status}`);
      const blob = await res.blob();
      const blobUrl = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = blobUrl;
      link.download = getFilename(rawUrl);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setTimeout(() => URL.revokeObjectURL(blobUrl), 10_000);
    } catch {
      setDownloadError((p) => ({ ...p, [rawUrl]: true }));
    } finally {
      setDownloading((p) => ({ ...p, [rawUrl]: false }));
    }
  };

  if (!active) return null;

  const c = call as any;
  const direction = c?.direction ?? "inbound";
  const hasMissed = !!c?.missedCallReason;
  const {
    color: dirColor,
    label: dirLabel,
    Icon: DirIcon,
  } = dirStyle(direction, hasMissed);

  const statusKey = (c?.status ?? "")
    .toString()
    .toUpperCase()
    .replace(/ /g, "_");
  const sc = STATUS_COLORS[statusKey] ?? STATUS_COLORS.COMPLETED;

  const dispositionKey = (c?.disposition ?? "")
    .toString()
    .toUpperCase()
    .replace(/ /g, "_");
  const dc = dispositionKey ? DISPOSITION_COLORS[dispositionKey] : null;

  const agentName = c?.agent?.name ?? c?.agentName ?? c?.assignedTo ?? null;
  const campaignName = c?.campaign?.nombre ?? null;
  const campaignOpt = c?.campaignOption
    ? formatEnumLabel(c.campaignOption)
    : null;
  const onboardingOpt = c?.onboardingOption
    ? formatEnumLabel(c.onboardingOption)
    : null;
  const yardName = c?.yard?.name ?? c?.yardName ?? null;
  const phoneLine = c?.phoneLine?.label ?? c?.phoneLineName ?? null;
  const notes = c?.notes ?? c?.issueDetail ?? null;
  const followUp = c?.followUpDueDate ?? null;
  const followUpAgent = c?.followUpAssignedTo?.name ?? null;
  const attachments: string[] = c?.attachments ?? [];
  const dateLabel = fmtRelative(c?.callDate ?? c?.createdAt);
  const fullDate = fmtDateTime(c?.callDate ?? c?.createdAt);
  const duration = fmtDuration(c?.duration);
  const missedReason = c?.missedCallReason
    ? formatEnumLabel(c.missedCallReason)
    : null;
  const aircallId = c?.aircallId ?? null;

  const mobileClasses = cn(
    "fixed bottom-0 left-0 right-0 z-50 flex flex-col",
    "pointer-events-auto",
    "bg-white rounded-t-2xl",
    "shadow-[0_-8px_32px_-4px_rgba(0,0,0,0.14)]",
    "border border-slate-200/80",
    "max-h-[85vh]",
    "transition-all duration-300 ease-out",
    visible ? "translate-y-0 opacity-100" : "translate-y-full opacity-0",
  );

  const desktopClasses = cn(
    "fixed z-[65] pointer-events-auto flex flex-col",
    "bg-[#f8f9fb] rounded-2xl border border-slate-200/80",
    "shadow-[0_20px_40px_-8px_rgba(0,0,0,0.14),0_8px_16px_-6px_rgba(0,0,0,0.08)]",
    !aircallOnLeft && "w-[min(400px,calc(100vw-2rem))]",
    aircallOnLeft && "min-w-[280px] max-w-[400px]",
    "transition-all duration-300 ease-out",
    visible
      ? "translate-x-0 opacity-100 scale-100"
      : "translate-x-4 opacity-0 scale-95",
  );

  const containerClass = isMobile ? mobileClasses : desktopClasses;
  const containerStyle = isMobile
    ? undefined
    : {
        right: "calc(min(80svw, 1100px) + 1rem)",
        top: "4rem",
        maxHeight: "calc(100vh - 5rem)",
        ...(aircallOnLeft ? { left: "calc(1.5rem + 380px + 1rem)" } : {}),
      };

  return (
    <>
      {isMobile && (
        <div
          className={cn(
            "fixed inset-0 z-40 bg-black/40 backdrop-blur-sm transition-opacity duration-300",
            visible
              ? "opacity-100 pointer-events-auto"
              : "opacity-0 pointer-events-none",
          )}
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      <div
        role="complementary"
        aria-label={`Details for call #${call?.id ?? "…"}`}
        data-peek-panel="true"
        className={containerClass}
        style={containerStyle}
        onPointerDown={(e) => {
          e.nativeEvent.stopImmediatePropagation();
        }}
      >
        {isMobile && (
          <div className="shrink-0 flex justify-center pt-3 pb-1">
            <div className="w-10 h-1 rounded-full bg-slate-300" />
          </div>
        )}

        {/* Header */}
        <div
          className="shrink-0 flex items-center justify-between gap-3 px-4 py-3 border-b border-slate-200/80 bg-white rounded-t-2xl"
          style={{
            boxShadow: `inset 3px 0 0 0 ${dirColor}`,
          }}
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <div
              className="flex items-center justify-center w-9 h-9 rounded-xl shrink-0"
              style={{ background: `${dirColor}14`, color: dirColor }}
            >
              <DirIcon className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <p className="text-[13px] font-bold text-slate-900 leading-tight truncate">
                {isLoading ? "Loading…" : `Call #${call?.id}`}
              </p>
              <p className="text-[11px] text-slate-500 tabular-nums leading-tight mt-0.5">
                {isLoading ? "—" : dateLabel}
              </p>
            </div>
          </div>
          <button
            type="button"
            aria-label="Close preview"
            onClick={onClose}
            className="shrink-0 w-7 h-7 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {isLoading && (
          <div className="overflow-y-auto px-4 py-4 space-y-3 bg-white">
            <div className="flex gap-1.5 flex-wrap">
              <SkeletonBlock className="h-5 w-14 rounded-md" />
              <SkeletonBlock className="h-5 w-16 rounded-md" />
              <SkeletonBlock className="h-5 w-20 rounded-md" />
            </div>
            <div className="grid grid-cols-3 gap-2">
              {[1, 2, 3].map((i) => (
                <SkeletonBlock key={i} className="h-14 rounded-lg" />
              ))}
            </div>
            <SkeletonBlock className="h-24 w-full rounded-xl" />
          </div>
        )}

        {!isLoading && call && (
          <div
            ref={scrollRef}
            className={cn(
              "overflow-y-auto px-3 py-3 space-y-3",
              isMobile ? "flex-1 min-h-0" : "max-h-[calc(100vh-11rem)]",
            )}
            style={{ scrollbarWidth: "thin" }}
          >
            {/* Status strip */}
            <div className="flex flex-wrap gap-1.5 p-2.5 rounded-xl border border-slate-100 bg-white">
              <PeekBadge color={dirColor} bg={`${dirColor}18`} icon={DirIcon}>
                {dirLabel}
              </PeekBadge>
              <PeekBadge color={sc.text} bg={sc.bg}>
                {sc.label}
              </PeekBadge>
              {dc && (
                <PeekBadge color={dc.text} bg={dc.bg}>
                  {dc.label}
                </PeekBadge>
              )}
              {missedReason && (
                <PeekBadge color="#c0392b" bg="#fde8e6" icon={AlertCircle}>
                  {missedReason}
                </PeekBadge>
              )}
              {followUp && (
                <PeekBadge color="#c47a00" bg="#fef3d6" icon={CalendarIcon}>
                  Follow-up
                </PeekBadge>
              )}
            </div>

            {/* Key metrics */}
            <div
              className={cn(
                "grid gap-2",
                aircallId ? "grid-cols-3" : "grid-cols-2",
              )}
            >
              <div className="col-span-full">
                <MetricTile
                  icon={CalendarIcon}
                  label="Date"
                  value={fullDate}
                />
              </div>
              <MetricTile icon={Clock} label="Duration" value={duration} mono />
              {aircallId && (
                <MetricTile
                  icon={ExternalLink}
                  label="Aircall"
                  value={String(aircallId)}
                  mono
                />
              )}
            </div>

            <DetailSection title="Assignment">
              <DetailRow icon={User} label="Agent" value={agentName} />
              <DetailRow icon={Phone} label="Phone line" value={phoneLine} />
              <DetailRow icon={Tag} label="Campaign" value={campaignName} />
              <DetailRow
                icon={Tag}
                label="Option"
                value={campaignOpt ?? onboardingOpt}
              />
              <DetailRow icon={MapPin} label="Yard" value={yardName} />
            </DetailSection>

            {followUp && (
              <DetailSection title="Follow-up">
                <DetailRow
                  icon={CalendarIcon}
                  label="Due"
                  value={fmtDate(followUp)}
                />
                {followUpAgent && (
                  <DetailRow
                    icon={User}
                    label="Assigned to"
                    value={followUpAgent}
                  />
                )}
              </DetailSection>
            )}

            {notes && (
              <section className="rounded-xl border border-slate-100 bg-white overflow-hidden">
                <button
                  type="button"
                  onClick={() => setNotesExpanded((p) => !p)}
                  className="w-full flex items-center justify-between px-3 py-2 bg-slate-50/90 border-b border-slate-100 hover:bg-slate-100/80 transition-colors"
                >
                  <span className="text-[9.5px] font-bold text-slate-500 uppercase tracking-widest">
                    Notes
                  </span>
                  {notesExpanded ? (
                    <ChevronUp className="w-3.5 h-3.5 text-slate-400" />
                  ) : (
                    <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                  )}
                </button>
                {notesExpanded && (
                  <div className="px-3 py-2.5">
                    <p className="text-[12px] text-slate-600 leading-relaxed whitespace-pre-wrap wrap-break-word">
                      {notes}
                    </p>
                  </div>
                )}
              </section>
            )}

            {attachments.length > 0 && (
              <section className="rounded-xl border border-slate-100 bg-white overflow-hidden">
                <div className="px-3 py-1.5 bg-slate-50/90 border-b border-slate-100">
                  <h3 className="text-[9.5px] font-bold text-slate-500 uppercase tracking-widest">
                    Attachments ({attachments.length})
                  </h3>
                </div>
                <div className="px-2 py-2 space-y-1.5">
                  {attachments.map((url) => {
                    const filename = getFilename(url);
                    const isDownloading = !!downloading[url];
                    const hasError = !!downloadError[url];
                    return (
                      <div
                        key={url}
                        className="flex items-center gap-2 rounded-lg border border-slate-100 bg-slate-50/60 px-2.5 py-2"
                      >
                        <Paperclip className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span
                          className="flex-1 text-[11px] font-medium text-slate-600 truncate"
                          title={filename}
                        >
                          {filename}
                        </span>
                        <button
                          type="button"
                          aria-label={`Download ${filename}`}
                          disabled={isDownloading}
                          onClick={() => handleDownload(url)}
                          className={cn(
                            "shrink-0 w-7 h-7 rounded-lg flex items-center justify-center transition-colors",
                            hasError
                              ? "text-red-500 bg-red-50 hover:bg-red-100"
                              : "text-slate-400 hover:text-[#008f68] hover:bg-[#008f68]/10",
                            isDownloading && "opacity-50 cursor-not-allowed",
                          )}
                        >
                          {isDownloading ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : hasError ? (
                            <AlertCircle className="w-3.5 h-3.5" />
                          ) : (
                            <Download className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </div>
                    );
                  })}
                </div>
              </section>
            )}
          </div>
        )}

        {!isLoading && call && (
          <div className="shrink-0 px-3 py-3 border-t border-slate-200/80 bg-white rounded-b-2xl">
            {onLink ? (
              <button
                type="button"
                onClick={onLink}
                className="w-full h-9 flex items-center justify-center gap-2 bg-[#008f68] hover:bg-[#007a5c] text-white text-[12px] font-semibold rounded-xl shadow-sm transition-all active:scale-[0.98]"
              >
                <Link2 className="w-3.5 h-3.5" />
                Link to current call
              </button>
            ) : (
              <p className="text-[11px] text-slate-400 text-center py-1">
                Read-only preview
              </p>
            )}
          </div>
        )}
      </div>
    </>
  );
}
