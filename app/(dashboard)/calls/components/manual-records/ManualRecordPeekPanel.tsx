"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { chipColors } from "@/lib/chip-colors";
import { useIsMobile } from "@/hooks/use-mobile";
import { useAircall } from "@/components/providers/AircallProvider";
import type { ManualRecord } from "../../types";
import {
  X,
  ClipboardList,
  User,
  Tag,
  MapPin,
  CalendarIcon,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { fmtDate, fmtDateTime } from "../../utils/call-helpers";

// ── Color maps ────────────────────────────────────────────────────────────────

const STATUS_PILL: Record<string, { dot: string; bg: string; fg: string; label: string }> = {
  ACTIVE: { dot: "#008f68", bg: "#e6f5f0", fg: "#006d50", label: "Active" },
  OPEN: { dot: "#008f68", bg: "#e6f5f0", fg: "#006d50", label: "Active" },
  IN_PROGRESS: { dot: "#008f68", bg: "#e6f5f0", fg: "#006d50", label: "Active" },
  PENDING_FOLLOWUP: { dot: "#d97706", bg: "#fef3c7", fg: "#b45309", label: "Follow-up" },
  OVERDUE: { dot: "#dc2626", bg: "#fee2e2", fg: "#b91c1c", label: "Overdue" },
  RESOLVED: { dot: "#008f68", bg: "#e6f5f0", fg: "#006d50", label: "Resolved" },
  CLOSED: { dot: "#64748b", bg: "#f1f5f9", fg: "#475569", label: "Closed" },
};

const DISPOSITION_COLORS: Record<string, { text: string; bg: string; label: string }> = {
  RESOLVED: { text: "#008f68", bg: "#e6f5f0", label: "Resolved" },
  CALLBACK_REQUIRED: { text: "#c47a00", bg: "#fef3d6", label: "Callback Required" },
  CALLBACK_SCHEDULED: { text: "#d97706", bg: "#fffbeb", label: "Callback Scheduled" },
  CALLBACK_COMPLETE: { text: "#065f4a", bg: "#d1fae5", label: "Callback Complete" },
  VOICEMAIL_LEFT: { text: "#2563eb", bg: "#eff6ff", label: "Voicemail Left" },
  NO_ANSWER: { text: "#c0392b", bg: "#fde8e6", label: "No Answer" },
  NEW_LEAD: { text: "#047857", bg: "#d1fae5", label: "New Lead" },
  PROMISE_TO_PAY: { text: "#0891b2", bg: "#ecfeff", label: "Promise to Pay" },
  DISPUTE: { text: "#dc2626", bg: "#fef2f2", label: "Dispute" },
  WRONG_NUMBER: { text: "#64748b", bg: "#f1f5f9", label: "Wrong Number" },
  ENROLLED: { text: "#7c3aed", bg: "#f5f3ff", label: "Enrolled" },
  ESCALATED: { text: "#9b1c1c", bg: "#fef2f2", label: "Escalated" },
};

const normalizeKey = (v?: string | null) =>
  (v || "").toString().toUpperCase().replace(/\s+/g, "_");

const formatLabel = (v: string) =>
  v.replace(/_/g, " ").toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());

// ── Sub-components ────────────────────────────────────────────────────────────

function PeekBadge({
  color,
  bg,
  children,
}: {
  color: string;
  bg: string;
  children: React.ReactNode;
}) {
  return (
    <span
      className="inline-flex items-center gap-1 text-[10.5px] font-semibold px-2 py-0.5 rounded-md leading-none"
      style={chipColors(color, bg)}
    >
      {children}
    </span>
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
    <div className="flex items-start gap-2.5 py-2 border-b border-slate-100/90 dark:border-neutral-800 last:border-0">
      <div className="w-6 h-6 rounded-md bg-white dark:bg-neutral-800 border border-slate-100 dark:border-neutral-700 flex items-center justify-center shrink-0 mt-0.5">
        <Icon className="w-3 h-3 text-slate-400" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[9px] font-semibold text-slate-400 dark:text-neutral-500 uppercase tracking-wide">
          {label}
        </p>
        <p
          className="text-[12px] font-medium text-slate-800 dark:text-neutral-200 mt-0.5 leading-snug break-words"
          title={strValue}
        >
          {value}
        </p>
      </div>
    </div>
  );
}

function DetailSection({ title, children }: { title: string; children: React.ReactNode }) {
  const items = Array.isArray(children) ? children.filter(Boolean) : children;
  if (!items || (Array.isArray(items) && items.length === 0)) return null;
  return (
    <section className="rounded-xl border border-slate-100 dark:border-neutral-800 bg-white dark:bg-neutral-900 overflow-hidden">
      <div className="px-3 py-1.5 bg-slate-50/90 dark:bg-neutral-800/50 border-b border-slate-100 dark:border-neutral-800">
        <h3 className="text-[9.5px] font-bold text-slate-500 dark:text-neutral-400 uppercase tracking-widest">
          {title}
        </h3>
      </div>
      <div className="px-3">{children}</div>
    </section>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────

interface ManualRecordPeekPanelProps {
  record: ManualRecord | null;
  onClose: () => void;
}

export function ManualRecordPeekPanel({ record, onClose }: ManualRecordPeekPanelProps) {
  const isMobile = useIsMobile();
  const { dockOpen, sheetOpen: aircallSheetOpen } = useAircall();
  const aircallOnLeft = dockOpen && aircallSheetOpen;
  const [active, setActive] = useState(false);
  const [visible, setVisible] = useState(false);
  const [notesExpanded, setNotesExpanded] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);

  const isOpen = record !== null;

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
  }, [record?.id]);

  if (!active) return null;

  const statusKey = normalizeKey(record?.status);
  const sp = STATUS_PILL[statusKey] || STATUS_PILL.CLOSED;
  const dispositionKey = normalizeKey(record?.disposition);
  const dc = dispositionKey ? DISPOSITION_COLORS[dispositionKey] : null;

  const agentName =
    record?.createdBy?.name?.trim() ||
    record?.createdByName?.trim() ||
    null;
  const campaignName = (record?.campaign as { nombre?: string } | null)?.nombre || null;
  const campaignOption = record?.campaignOption ? formatLabel(record.campaignOption) : null;
  const yardName = record?.yard?.commonName || record?.yard?.name || null;
  const notes = record?.notes || null;
  const dateLabel = record?.createdAt ? fmtDateTime(record.createdAt) : "—";

  const mobileClasses = cn(
    "fixed bottom-0 left-0 right-0 z-50 flex flex-col",
    "pointer-events-auto",
    "bg-white dark:bg-neutral-900 rounded-t-2xl",
    "shadow-[0_-8px_32px_-4px_rgba(0,0,0,0.14)]",
    "border border-slate-200/80 dark:border-neutral-700",
    "max-h-[85vh]",
    "transition-all duration-300 ease-out",
    visible ? "translate-y-0 opacity-100" : "translate-y-full opacity-0",
  );

  const desktopClasses = cn(
    "fixed z-[65] pointer-events-auto flex flex-col",
    "bg-[#f8f9fb] dark:bg-neutral-900 rounded-2xl border border-slate-200/80 dark:border-neutral-700",
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
          onClick={(e) => { e.stopPropagation(); onClose(); }}
          aria-hidden="true"
        />
      )}

      <div
        role="complementary"
        aria-label={`Details for record #${record?.id ?? "…"}`}
        data-peek-panel="true"
        className={containerClass}
        style={containerStyle}
        onPointerDown={(e) => e.nativeEvent.stopImmediatePropagation()}
      >
        {isMobile && (
          <div className="shrink-0 flex justify-center pt-3 pb-1">
            <div className="w-10 h-1 rounded-full bg-slate-300" />
          </div>
        )}

        {/* Header */}
        <div className="shrink-0 flex items-center justify-between gap-3 px-4 py-3 border-b border-slate-200/80 dark:border-neutral-700 bg-white dark:bg-neutral-900 rounded-t-2xl"
          style={{ boxShadow: "inset 3px 0 0 0 #008f68" }}
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <div
              className="flex items-center justify-center w-9 h-9 rounded-xl shrink-0"
              style={{ background: "#008f6814", color: "#008f68" }}
            >
              <ClipboardList className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <p className="text-[13px] font-bold text-slate-900 dark:text-neutral-100 leading-tight truncate">
                Record #{record?.id}
              </p>
              <p className="text-[11px] text-slate-500 dark:text-neutral-400 tabular-nums leading-tight mt-0.5">
                {dateLabel}
              </p>
            </div>
          </div>
          <button
            type="button"
            aria-label="Close preview"
            onClick={(e) => { e.stopPropagation(); onClose(); }}
            className="shrink-0 w-7 h-7 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-700 dark:hover:text-neutral-200 hover:bg-slate-100 dark:hover:bg-neutral-700 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        {record && (
          <div
            ref={scrollRef}
            className={cn(
              "overflow-y-auto px-3 py-3 space-y-3",
              isMobile ? "flex-1 min-h-0" : "max-h-[calc(100vh-11rem)]",
            )}
            style={{ scrollbarWidth: "thin" }}
          >
            {/* Status + disposition strip */}
            <div className="flex flex-wrap gap-1.5 p-2.5 rounded-xl border border-slate-100 dark:border-neutral-800 bg-white dark:bg-neutral-800/50">
              <PeekBadge color={sp.fg} bg={sp.bg}>
                <span
                  className="w-1.5 h-1.5 rounded-full shrink-0"
                  style={{ background: sp.dot }}
                />
                {sp.label}
              </PeekBadge>
              {dc && (
                <PeekBadge color={dc.text} bg={dc.bg}>
                  <span
                    className="w-1.5 h-1.5 rounded-full shrink-0"
                    style={{ background: dc.text }}
                  />
                  {dc.label}
                </PeekBadge>
              )}
            </div>

            {/* Date tile */}
            <div className="rounded-lg border border-slate-100 dark:border-neutral-800 bg-slate-50/80 dark:bg-neutral-800/50 px-2.5 py-2">
              <p className="flex items-center gap-1 text-[9px] font-semibold text-slate-400 dark:text-neutral-500 uppercase tracking-wide">
                <CalendarIcon className="w-2.5 h-2.5 shrink-0" />
                Created
              </p>
              <p className="text-[12px] font-semibold text-slate-800 dark:text-neutral-200 mt-1 leading-tight">
                {fmtDate(record.createdAt)}
              </p>
            </div>

            <DetailSection title="Assignment">
              <DetailRow icon={User} label="Agent" value={agentName} />
              <DetailRow icon={Tag} label="Campaign" value={campaignName} />
              <DetailRow icon={Tag} label="Option" value={campaignOption} />
              <DetailRow icon={MapPin} label="Yard" value={yardName} />
            </DetailSection>

            {notes && (
              <section className="rounded-xl border border-slate-100 dark:border-neutral-800 bg-white dark:bg-neutral-900 overflow-hidden">
                <button
                  type="button"
                  onClick={() => setNotesExpanded((p) => !p)}
                  className="w-full flex items-center justify-between px-3 py-2 bg-slate-50/90 dark:bg-neutral-800/50 border-b border-slate-100 dark:border-neutral-800 hover:bg-slate-100/80 dark:hover:bg-neutral-700/80 transition-colors"
                >
                  <span className="text-[9.5px] font-bold text-slate-500 dark:text-neutral-400 uppercase tracking-widest">
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
                    <p className="text-[13.5px] text-slate-600 dark:text-neutral-100 leading-relaxed whitespace-pre-wrap break-words">
                      {notes}
                    </p>
                  </div>
                )}
              </section>
            )}
          </div>
        )}
      </div>
    </>
  );
}
