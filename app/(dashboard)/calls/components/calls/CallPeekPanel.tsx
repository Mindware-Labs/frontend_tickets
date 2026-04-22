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
  User,
  Tag,
  MapPin,
  FileText,
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
  PROMISE_TO_PAY: { text: "#0891b2", bg: "#ecfeff", label: "Promise to Pay" },
  DISPUTE: { text: "#dc2626", bg: "#fef2f2", label: "Dispute" },
  WRONG_NUMBER: { text: "#64748b", bg: "#f1f5f9", label: "Wrong Number" },
  ENROLLED: { text: "#7c3aed", bg: "#f5f3ff", label: "Enrolled" },
  ESCALATED: { text: "#9b1c1c", bg: "#fef2f2", label: "Escalated" },
};

function dirStyle(dir: string, hasMissed: boolean) {
  const d = dir.toLowerCase();
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
    // strip UUID prefix pattern (uuid_filename.ext → filename.ext)
    return name.replace(/^[0-9a-f-]{36}_/i, "");
  } catch {
    return url;
  }
}

// ── Sub-components ────────────────────────────────────────────────────────────

/**
 * InfoCell — a single grid cell.
 * Label is small + uppercase + subtle; value is semibold and prominent.
 * colSpan="full" → spans both columns; truncate → ellipsis + title on hover.
 */
function InfoCell({
  icon: Icon,
  label,
  value,
  colSpan = "1",
  truncate = false,
}: {
  icon: React.ElementType;
  label: string;
  value: React.ReactNode;
  colSpan?: "full" | "1";
  truncate?: boolean;
}) {
  if (!value || value === "—") return null;
  const strValue = typeof value === "string" ? value : undefined;
  return (
    <div className={colSpan === "full" ? "col-span-2" : "min-w-0"}>
      <p className="flex items-center gap-1.5 text-xs font-medium text-gray-400 uppercase tracking-wider leading-none">
        <Icon className="w-3 h-3 shrink-0" />
        {label}
      </p>
      <p
        className={cn(
          "text-sm font-semibold text-gray-900 mt-1 leading-snug",
          truncate ? "truncate whitespace-nowrap" : "wrap-break-word",
        )}
        title={truncate && strValue ? strValue : undefined}
      >
        {value}
      </p>
    </div>
  );
}

/** Strict two-column grid — cells control their own span via colSpan="full" */
function InfoGrid({ children }: { children: React.ReactNode }) {
  return <div className="grid grid-cols-2 gap-x-4 gap-y-4">{children}</div>;
}

function SectionHeader({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-2 pt-4 pb-2">
      <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest">
        {label}
      </span>
      <div className="flex-1 h-px bg-gray-100" />
    </div>
  );
}

function SkeletonBlock({ className }: { className?: string }) {
  return (
    <div className={cn("animate-pulse rounded-md bg-gray-100", className)} />
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
  // Aircall panel is on the left when both dock + sheet are open
  const aircallOnLeft = dockOpen && aircallSheetOpen;
  // Visibility — two-phase (active = in DOM, visible = CSS transition applied)
  const [active, setActive] = useState(false);
  const [visible, setVisible] = useState(false);

  // Download state per attachment URL
  const [downloading, setDownloading] = useState<Record<string, boolean>>({});
  const [downloadError, setDownloadError] = useState<Record<string, boolean>>(
    {},
  );

  // Collapsible notes section
  const [notesExpanded, setNotesExpanded] = useState(true);

  const scrollRef = useRef<HTMLDivElement>(null);

  // ── Mount / unmount animation ─────────────────────────────────────────────
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

  // Reset scroll when call changes
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: 0 });
    setNotesExpanded(true);
    setDownloadError({});
  }, [call?.id]);

  // ── Attachment download ────────────────────────────────────────────────────
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

  // ── Derived display data ───────────────────────────────────────────────────
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

  // ── Responsive positioning ─────────────────────────────────────────────────
  // Mobile  → bottom sheet: full-width, bottom-0, rounded-t-2xl
  // Desktop → floating panel in gap to the left of Side Sheet

  const mobileClasses = cn(
    "fixed bottom-0 left-0 right-0 z-50 flex flex-col",
    "pointer-events-auto",
    "bg-white rounded-t-2xl",
    "shadow-[0_-8px_32px_-4px_rgba(0,0,0,0.14)]",
    "border border-gray-200/80",
    "max-h-[85vh]",
    "transition-all duration-300 ease-out",
    visible ? "translate-y-0 opacity-100" : "translate-y-full opacity-0",
  );

  const desktopClasses = cn(
    "fixed z-[65] pointer-events-auto flex flex-col",
    "bg-white rounded-2xl border border-gray-200/80",
    "shadow-[0_20px_40px_-8px_rgba(0,0,0,0.14),0_8px_16px_-6px_rgba(0,0,0,0.08)]",
    // Fixed width only when Aircall is NOT on the left — otherwise width is
    // determined by the left/right bounds so both gaps are exactly 1rem.
    !aircallOnLeft && "w-[400px]",
    aircallOnLeft && "min-w-[280px]",
    "transition-all duration-300 ease-out",
    visible
      ? "translate-x-0 opacity-100 scale-100"
      : "translate-x-4 opacity-0 scale-95",
  );

  const containerClass = isMobile ? mobileClasses : desktopClasses;
  const containerStyle = isMobile
    ? undefined
    : {
        // Same 1rem gap on the right (from Sheet left edge)
        right: "calc(min(80svw, 1100px) + 1rem)",
        top: "4rem",
        bottom: "1rem",
        // When Aircall dock is visible on the left: same 1rem gap from its right edge.
        // Aircall panel: left-6 (1.5rem) + w-95 (380px) = ~404px from left.
        ...(aircallOnLeft ? { left: "calc(1.5rem + 380px + 1rem)" } : {}),
      };

  return (
    <>
      {/* Backdrop (mobile only) */}
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
          // Stop the native event from reaching Radix's document-level listener,
          // which would otherwise treat any click here as an "outside click"
          // and close the open Sheet/Dialog.
          e.nativeEvent.stopImmediatePropagation();
        }}
      >
        {/* ── Drag handle (mobile only) ────────────────────────────────────── */}
        {isMobile && (
          <div className="shrink-0 flex justify-center pt-3 pb-1">
            <div className="w-10 h-1 rounded-full bg-gray-300" />
          </div>
        )}

        {/* ── Header ────────────────────────────────────────────────────────── */}
        <div className="shrink-0 flex items-center justify-between px-4 py-3 border-b border-gray-100">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-gray-100 shrink-0">
              <FileText className="w-4 h-4 text-gray-500" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-gray-900 leading-tight truncate">
                {isLoading ? "Loading…" : `Call #${call?.id}`}
              </p>
              <p className="text-xs text-gray-400 tabular-nums leading-tight mt-0.5">
                {isLoading ? "—" : dateLabel}
              </p>
            </div>
          </div>
          <button
            type="button"
            aria-label="Close preview"
            onClick={onClose}
            className="shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors ml-2"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* ── Loading skeleton ──────────────────────────────────────────────── */}
        {isLoading && (
          <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
            <div className="flex gap-2">
              <SkeletonBlock className="h-5 w-16" />
              <SkeletonBlock className="h-5 w-20" />
              <SkeletonBlock className="h-5 w-14" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              {[100, 80, 90, 70].map((w, i) => (
                <div key={i} className="space-y-1.5">
                  <SkeletonBlock className="h-3 w-16" />
                  <SkeletonBlock
                    className="h-4"
                    style={{ width: `${w}%` } as React.CSSProperties}
                  />
                </div>
              ))}
            </div>
            <SkeletonBlock className="h-16 w-full" />
          </div>
        )}

        {/* ── Content ───────────────────────────────────────────────────────── */}
        {!isLoading && call && (
          <div
            ref={scrollRef}
            className="flex-1 overflow-y-auto px-4 pb-2"
            style={{ scrollbarWidth: "thin" }}
          >
            {/* Status badges */}
            <div className="flex items-center gap-2 flex-wrap py-3">
              <span
                className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full"
                style={{ color: dirColor, background: dirColor + "18" }}
              >
                <DirIcon className="w-3 h-3" />
                {dirLabel}
              </span>
              <span
                className="inline-flex items-center text-xs font-semibold px-2 py-0.5 rounded-full"
                style={{ color: sc.text, background: sc.bg }}
              >
                {sc.label}
              </span>
              {dc && (
                <span
                  className="inline-flex items-center text-xs font-semibold px-2 py-0.5 rounded-full"
                  style={{ color: dc.text, background: dc.bg }}
                >
                  {dc.label}
                </span>
              )}
              {missedReason && (
                <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full bg-red-50 text-red-600">
                  <AlertCircle className="w-3 h-3" />
                  {missedReason}
                </span>
              )}
              {followUp && (
                <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full bg-amber-50 text-amber-700">
                  <CalendarIcon className="w-3 h-3" />
                  Pending Follow-up
                </span>
              )}
            </div>

            {/* ── Call Info section ──────────────────────────────────────────── */}
            <SectionHeader label="Call Info" />
            <InfoGrid>
              <InfoCell
                icon={CalendarIcon}
                label="Date"
                value={fullDate}
                colSpan="full"
              />
              <InfoCell icon={Clock} label="Duration" value={duration} />
              {aircallId && (
                <InfoCell
                  icon={ExternalLink}
                  label="Aircall ID"
                  value={aircallId}
                  truncate
                />
              )}
            </InfoGrid>

            {/* ── Assignment section ─────────────────────────────────────────── */}
            <SectionHeader label="Assignment" />
            <InfoGrid>
              <InfoCell icon={User} label="Agent" value={agentName} truncate />
              <InfoCell
                icon={Phone}
                label="Phone Line"
                value={phoneLine}
                truncate
              />
              <InfoCell
                icon={Tag}
                label="Campaign"
                value={campaignName}
                truncate
              />
              <InfoCell
                icon={Tag}
                label="Campaign Option"
                value={campaignOpt ?? onboardingOpt}
                truncate
              />
              <InfoCell
                icon={MapPin}
                label="Yard"
                value={yardName}
                colSpan="full"
                truncate
              />
            </InfoGrid>

            {/* ── Follow-up section ─────────────────────────────────────────── */}
            {followUp && (
              <>
                <SectionHeader label="Follow-up" />
                <InfoGrid>
                  <InfoCell
                    icon={CalendarIcon}
                    label="Due Date"
                    value={fmtDate(followUp)}
                  />
                  {followUpAgent && (
                    <InfoCell
                      icon={User}
                      label="Assigned To"
                      value={followUpAgent}
                    />
                  )}
                </InfoGrid>
              </>
            )}

            {/* ── Notes ─────────────────────────────────────────────────────── */}
            {notes && (
              <>
                <SectionHeader label="Notes" />
                <div className="pb-1">
                  <button
                    type="button"
                    onClick={() => setNotesExpanded((p) => !p)}
                    className="w-full flex items-center justify-between text-xs font-medium text-gray-500 hover:text-gray-700 transition-colors mb-2"
                  >
                    <span>{notesExpanded ? "Hide notes" : "Show notes"}</span>
                    {notesExpanded ? (
                      <ChevronUp className="w-3.5 h-3.5" />
                    ) : (
                      <ChevronDown className="w-3.5 h-3.5" />
                    )}
                  </button>
                  {notesExpanded && (
                    <div className="rounded-xl bg-gray-50 border border-gray-100 px-3 py-2.5">
                      <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap wrap-break-word">
                        {notes}
                      </p>
                    </div>
                  )}
                </div>
              </>
            )}

            {/* ── Attachments ───────────────────────────────────────────────── */}
            {attachments.length > 0 && (
              <>
                <SectionHeader label={`Attachments (${attachments.length})`} />
                <div className="pb-1 space-y-2">
                  {attachments.map((url) => {
                    const filename = getFilename(url);
                    const isDownloading = !!downloading[url];
                    const hasError = !!downloadError[url];
                    return (
                      <div
                        key={url}
                        className="flex items-center gap-2 rounded-xl border border-gray-100 bg-gray-50 px-3 py-2.5"
                      >
                        <Paperclip className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                        <span
                          className="flex-1 text-xs font-medium text-gray-600 truncate"
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
                            "shrink-0 w-6 h-6 rounded-lg flex items-center justify-center transition-colors",
                            hasError
                              ? "text-red-500 bg-red-50 hover:bg-red-100"
                              : "text-gray-400 hover:text-[#008f68] hover:bg-green-50",
                            isDownloading && "opacity-50 cursor-not-allowed",
                          )}
                        >
                          {isDownloading ? (
                            <Loader2 className="w-3 h-3 animate-spin" />
                          ) : hasError ? (
                            <AlertCircle className="w-3 h-3" />
                          ) : (
                            <Download className="w-3 h-3" />
                          )}
                        </button>
                      </div>
                    );
                  })}
                </div>
              </>
            )}

            {/* Bottom padding */}
            <div className="h-2" />
          </div>
        )}

        {/* ── Sticky footer ─────────────────────────────────────────────────── */}
        {!isLoading && call && (
          <div className="sticky bottom-0 shrink-0 px-4 py-2.5 border-t border-gray-100 bg-gray-50 rounded-b-2xl">
            {onLink ? (
              <button
                type="button"
                onClick={onLink}
                className="w-full h-8 flex items-center justify-center gap-1.5 bg-violet-600 hover:bg-violet-700 text-white text-xs font-semibold rounded-xl transition-all active:scale-[0.98]"
              >
                <Link2 className="w-3.5 h-3.5" />
                Link to current call
              </button>
            ) : (
              <p className="text-xs text-gray-400 text-center">
                Read-only preview · Edit in the main panel
              </p>
            )}
          </div>
        )}
      </div>
    </>
  );
}
