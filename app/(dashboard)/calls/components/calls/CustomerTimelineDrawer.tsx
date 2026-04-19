"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import useSWR from "swr";
import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import {
  X,
  Phone,
  PhoneCall,
  Loader2,
  PhoneOutgoing,
  StickyNote,
  Activity,
  CalendarIcon,
  CheckCircle2,
  Plus,
  Clock,
} from "lucide-react";
import type { Ticket } from "@/lib/mock-data";
import {
  AgentOption,
  CampaignOption,
  CallDisposition,
  CallStatus,
  CreateTicketFormData,
  CustomerOption,
  ManagementType,
  OnboardingOption,
  ArOption,
  YardOption,
} from "../../types";
import {
  getClientName,
  getClientPhone,
  getDirectionText,
  getStatusBadgeColor,
  isMissedCall,
} from "../../utils/call-helpers";
import type { Filters } from "../../hooks/useCallFilters";
import { useAircall } from "@/components/providers/AircallProvider";
import { format } from "date-fns";

// ── Types ─────────────────────────────────────────────────────────────────────

export interface CustomerCallGroup {
  key: string;
  customerId?: number;
  customerName: string;
  customerPhone: string;
  calls: Ticket[];
  latestCall: Ticket;
}

interface CustomerTimelineDrawerProps {
  open: boolean;
  onClose: () => void;
  group: CustomerCallGroup | null;
  selectedCall: Ticket | null;
  onSelectCall: (call: Ticket) => void;
  editFormData: CreateTicketFormData;
  setEditFormData: (next: CreateTicketFormData) => void;
  attachmentFiles: File[];
  setAttachmentFiles: (next: File[]) => void;
  savedAttachments: string[];
  isUpdating: boolean;
  onUpdate: () => void;
  customers: CustomerOption[];
  yards: YardOption[];
  agents: AgentOption[];
  campaigns: CampaignOption[];
  getAttachmentLabel: (value: string) => string;
  getAttachmentUrl: (value: string) => string;
  onCreateTicket?: () => void;
  activeFilters?: Filters;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

const fetcher = (url: string) => fetch(url).then((r) => r.json());

const fmtLabel = (v: string) =>
  v
    .replace(/_/g, " ")
    .toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase());

const fmtEnumLabel = (value: string) => {
  if (value === OnboardingOption.PAID_WITH_LL) return "Paid with LL";
  return fmtLabel(value);
};

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

const fmtDate = (iso?: string | null) => {
  if (!iso) return "—";
  try {
    const d = new Date(iso);
    if (isNaN(d.getTime())) return "—";
    return format(d, "MMM d, yyyy");
  } catch {
    return "—";
  }
};

const fmtRelative = (iso?: string | null): string => {
  if (!iso) return "—";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "—";
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffDays = Math.floor(diffMs / 86400000);
  if (diffDays === 0)
    return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  if (diffDays < 7)
    return d.toLocaleDateString([], {
      weekday: "short",
      month: "short",
      day: "numeric",
    });
  return d.toLocaleDateString([], {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
};

// ── Status/direction color maps ───────────────────────────────────────────────

const STATUS_COLORS: Record<string, { dot: string; text: string; bg: string }> =
  {
    ACTIVE: { dot: "#008f68", text: "#008f68", bg: "#e6f5f0" },
    COMPLETED: { dot: "#64748b", text: "#64748b", bg: "#f1f5f9" },
    PENDING_FOLLOWUP: { dot: "#c47a00", text: "#c47a00", bg: "#fef3d6" },
    OVERDUE: { dot: "#c0392b", text: "#c0392b", bg: "#fde8e6" },
  };

// ── Inspector label / value helpers ──────────────────────────────────────────

function InspLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[10px] text-slate-500 uppercase tracking-wider mb-1 font-semibold">
      {children}
    </p>
  );
}

function InspVal({ children }: { children: React.ReactNode }) {
  return <p className="text-xs font-semibold text-slate-800">{children}</p>;
}

// Compact select for the inspector
function InspectorSelect({
  value,
  onChange,
  placeholder,
  children,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  children: React.ReactNode;
}) {
  return (
    <Select
      value={value || "none"}
      onValueChange={(v) => onChange(v === "none" ? "" : v)}
    >
      <SelectTrigger className="h-7 text-xs bg-slate-50 border-transparent hover:border-slate-300 focus:bg-white focus:ring-2 focus:ring-blue-100 focus:border-blue-400 rounded-lg w-full transition-colors">
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>{children}</SelectContent>
    </Select>
  );
}

// ── Interaction card (left column) ────────────────────────────────────────────

function InteractionCard({
  call,
  isActive,
  onClick,
}: {
  call: Ticket;
  isActive: boolean;
  onClick: () => void;
}) {
  const ref = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    if (isActive)
      ref.current?.scrollIntoView({ block: "nearest", behavior: "smooth" });
  }, [isActive]);

  const dateLabel = fmtRelative(call.callDate || call.createdAt);
  const dir = (call.direction || "inbound").toString().toLowerCase();
  const isMissed = dir === "missed" || !!(call as any).missedCallReason;
  const isOut = dir === "outbound";
  const dirColor = isMissed ? "#c0392b" : isOut ? "#2563eb" : "#008f68";
  const dirLabel = isMissed ? "Missed" : isOut ? "Outbound" : "Inbound";
  const statusKey = (call.status || "")
    .toString()
    .toUpperCase()
    .replace(/ /g, "_");
  const sc = STATUS_COLORS[statusKey] || STATUS_COLORS.COMPLETED;

  return (
    <button
      ref={ref}
      type="button"
      onClick={onClick}
      className={cn(
        "w-full text-left px-3 py-3 border-b border-slate-100 transition-all last:border-0",
        isActive
          ? "bg-white border-l-[4px] border-l-blue-600 shadow-sm pl-2.5"
          : "border-l-[4px] border-l-transparent hover:bg-slate-100",
      )}
    >
      <div className="flex items-center justify-between gap-1 mb-1">
        <span className="text-[11px] font-bold text-slate-700 font-mono">
          #{call.id}
        </span>
        <span className="text-[10px] text-slate-400">{dateLabel}</span>
      </div>
      <div className="flex flex-wrap items-center gap-1">
        <span
          className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
          style={{ color: dirColor, background: dirColor + "18" }}
        >
          {dirLabel}
        </span>
        <span
          className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
          style={{ color: sc.text, background: sc.bg }}
        >
          {statusKey === "ACTIVE"
            ? "Active"
            : statusKey === "PENDING_FOLLOWUP"
              ? "Pending"
              : statusKey === "OVERDUE"
                ? "Overdue"
                : "Done"}
        </span>
      </div>
      {call.duration != null && (
        <p className="text-[10px] text-slate-400 mt-1 font-mono">
          {Math.floor(call.duration / 60)}:
          {String(call.duration % 60).padStart(2, "0")}
        </p>
      )}
    </button>
  );
}

// ── Mock activity timeline entries ────────────────────────────────────────────

const MOCK_TIMELINE = [
  {
    id: 1,
    type: "system",
    icon: PhoneCall,
    color: "#2563eb",
    title: "Call logged",
    time: "Auto-generated",
  },
  {
    id: 2,
    type: "note",
    icon: StickyNote,
    color: "#c47a00",
    title: "Internal note added",
    time: "by Agent",
  },
  {
    id: 3,
    type: "status",
    icon: Activity,
    color: "#7c3aed",
    title: "Status updated",
    time: "via form",
  },
];

// ── Main Drawer ───────────────────────────────────────────────────────────────

export function CustomerTimelineDrawer({
  open,
  onClose,
  group,
  selectedCall,
  onSelectCall,
  editFormData,
  setEditFormData,
  attachmentFiles,
  setAttachmentFiles,
  savedAttachments,
  isUpdating,
  onUpdate,
  customers,
  yards,
  agents,
  campaigns,
  getAttachmentLabel,
  getAttachmentUrl,
  onCreateTicket,
  activeFilters,
}: CustomerTimelineDrawerProps) {
  const [calendarOpen, setCalendarOpen] = useState(false);

  const {
    dial,
    status: aircallStatus,
    isLoggedIn: aircallLoggedIn,
  } = useAircall();
  const canDial = aircallStatus === "ready" && aircallLoggedIn;
  const dialPhone =
    editFormData.customerPhone ||
    (selectedCall as any)?.customer?.phone ||
    (selectedCall as any)?.customerPhone ||
    "";

  // Fetch full call history
  const historyUrl = useMemo(() => {
    if (!open || !group?.customerId) return null;
    const params = new URLSearchParams();
    params.set("mode", "page");
    params.set("customerId", String(group.customerId));
    params.set("limit", "200");
    if (activeFilters) {
      if (activeFilters.campaign && activeFilters.campaign !== "all")
        params.set("campaignId", activeFilters.campaign);
      if (
        activeFilters.campaignOption &&
        activeFilters.campaignOption !== "all"
      )
        params.set("campaignOption", activeFilters.campaignOption);
      if (activeFilters.yard && activeFilters.yard !== "all")
        params.set("yardId", activeFilters.yard);
      if (activeFilters.status && activeFilters.status !== "all")
        params.set("status", activeFilters.status);
      if (activeFilters.direction && activeFilters.direction !== "all")
        params.set("direction", activeFilters.direction);
      if (activeFilters.disposition && activeFilters.disposition !== "all")
        params.set("disposition", activeFilters.disposition);
      if (activeFilters.agent && activeFilters.agent !== "all")
        params.set("agentId", activeFilters.agent);
      if (activeFilters.phoneLine && activeFilters.phoneLine !== "all")
        params.set("phoneLineId", activeFilters.phoneLine);
    }
    return `/api/calls?${params.toString()}`;
  }, [open, group?.customerId, activeFilters]);

  const { data: historyData, isLoading: isLoadingHistory } = useSWR(
    historyUrl,
    fetcher,
    { revalidateOnFocus: false },
  );

  const allCalls = useMemo<Ticket[]>(() => {
    if (historyData?.success && Array.isArray(historyData.data?.data)) {
      return [...historyData.data.data].sort(
        (a, b) =>
          new Date(b.callDate || b.createdAt || 0).getTime() -
          new Date(a.callDate || a.createdAt || 0).getTime(),
      );
    }
    if (historyData?.success && Array.isArray(historyData.data)) {
      return [...historyData.data].sort(
        (a, b) =>
          new Date(b.callDate || b.createdAt || 0).getTime() -
          new Date(a.callDate || a.createdAt || 0).getTime(),
      );
    }
    return group?.calls ?? [];
  }, [historyData, group?.calls]);

  const activeCallId = selectedCall?.id ?? group?.latestCall?.id;
  const customerName = group?.customerName ?? getClientName(selectedCall);
  const customerPhone = group?.customerPhone ?? getClientPhone(selectedCall);
  const callCount = allCalls.length || group?.calls.length || 0;

  // Campaign logic for inspector
  const selectedCampaign = useMemo(() => {
    if (!editFormData.campaignId) return null;
    return campaigns.find((c) => c.id.toString() === editFormData.campaignId);
  }, [campaigns, editFormData.campaignId]);
  const selectedCampaignType = selectedCampaign?.tipo?.toString().toUpperCase();
  const isOnboarding = selectedCampaignType === ManagementType.ONBOARDING;
  const isAr = selectedCampaignType === ManagementType.AR;
  const campaignOptionValues = isOnboarding
    ? Object.values(OnboardingOption)
    : isAr
      ? Object.values(ArOption)
      : [];

  const followUpDateDisplay = editFormData.followUpDueDate
    ? fmtDate(editFormData.followUpDueDate)
    : null;

  // Technical metadata from the raw call object
  const raw = selectedCall as any;
  const aircallId = raw?.aircallId || "—";
  const phoneLine = raw?.phoneLine
    ? raw.phoneLine.label || raw.phoneLine.phoneNumber
    : editFormData.phoneLineId
      ? editFormData.phoneLineId
      : "—";
  const durationSec =
    raw?.duration ??
    (editFormData.duration ? parseInt(editFormData.duration) : null);
  const recordingUrl = raw?.recordingUrl || editFormData.recordingUrl;

  // SVG waveform
  const waveformSeed =
    typeof selectedCall?.id === "number" ? selectedCall.id : 1;
  const waveHeights = Array.from({ length: 120 }, (_, i) => {
    const n =
      Math.sin(i * 0.43 + waveformSeed * 0.07) * 0.5 +
      Math.sin(i * 1.1 + waveformSeed * 0.13) * 0.3 +
      Math.sin(i * 2.7 + waveformSeed * 0.03) * 0.2;
    return Math.max(0.08, Math.min(1, Math.abs(n)));
  });
  const PLAYED = 0.38;

  return (
    <Sheet open={open} onOpenChange={(v) => !v && onClose()}>
      <SheetContent
        side="right"
        className="w-[55vw]! max-w-[55vw]! sm:max-w-[55w]! p-0 flex flex-col bg-slate-50 [&>button.absolute]:hidden overflow-hidden"
      >
        <SheetTitle className="sr-only">
          {customerName
            ? `Command Center — ${customerName}`
            : "Call Command Center"}
        </SheetTitle>

        {/* ── Top Bar ── */}
        <div className="flex items-center gap-3 px-5 py-3 bg-white border-b border-slate-200 shrink-0 shadow-sm">
          <div
            className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0"
            style={{
              background: `hsl(${(customerName?.charCodeAt(0) ?? 180) % 360} 50% 46%)`,
            }}
          >
            {customerName ? customerName.substring(0, 2).toUpperCase() : "?"}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-slate-900 leading-tight truncate">
              {customerName}
            </p>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-xs text-slate-500 font-mono">
                {customerPhone}
              </span>
              <span className="text-slate-300">·</span>
              <span className="text-xs text-slate-500 flex items-center gap-1">
                {isLoadingHistory ? (
                  <Loader2 className="w-3 h-3 animate-spin" />
                ) : (
                  <>
                    {callCount} call{callCount !== 1 ? "s" : ""}
                  </>
                )}
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              if (dialPhone && canDial) dial(dialPhone, selectedCall?.id);
            }}
            disabled={!dialPhone || !canDial}
            className="flex items-center gap-1.5 h-8 px-3.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white text-xs font-semibold rounded-lg transition-colors"
          >
            <PhoneOutgoing className="w-3.5 h-3.5" />
            Call
          </button>
          {onCreateTicket && (
            <button
              type="button"
              onClick={onCreateTicket}
              className="flex items-center gap-1.5 h-8 px-3.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-lg transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              Escalate
            </button>
          )}
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* ── 3-Column Body ── */}
        <div className="flex-1 flex flex-row overflow-hidden min-h-0">
          {/* ═══ COL 1 (18%): Interaction Feed ═══ */}
          <div className="w-[18%] shrink-0 flex flex-col border-r border-slate-200 bg-slate-50 overflow-hidden">
            <div className="px-3 py-2.5 border-b border-slate-200 shrink-0">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                Interactions
              </p>
            </div>
            <div className="flex-1 overflow-y-auto [&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar-thumb]:bg-slate-200 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-track]:bg-transparent">
              {isLoadingHistory && allCalls.length === 0 ? (
                <div className="flex items-center justify-center py-10 gap-2 text-slate-400">
                  <Loader2 className="w-4 h-4 animate-spin" />
                </div>
              ) : allCalls.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-10 gap-2 text-slate-400">
                  <PhoneCall className="w-5 h-5 opacity-40" />
                  <span className="text-xs">No calls found</span>
                </div>
              ) : (
                allCalls.map((call) => (
                  <InteractionCard
                    key={call.id}
                    call={call}
                    isActive={call.id === activeCallId}
                    onClick={() => onSelectCall(call)}
                  />
                ))
              )}
            </div>
          </div>

          {/* ═══ COL 2 (flex): Communication Hub ═══ */}
          <div className="flex-1 flex flex-col min-w-0 overflow-hidden bg-white">
            {!selectedCall ? (
              <div className="flex-1 flex items-center justify-center text-slate-400">
                <div className="text-center">
                  <PhoneCall className="w-8 h-8 opacity-30 mx-auto mb-2" />
                  <p className="text-sm">Select a call to inspect</p>
                </div>
              </div>
            ) : (
              <div className="flex-1 flex flex-col overflow-hidden">
                {/* Scrollable hub content */}
                <div className="flex-1 overflow-y-auto p-4 space-y-3 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:bg-slate-200 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-track]:bg-transparent">
                  {/* ── Top Metadata Card ── */}
                  <div className="bg-slate-50 border border-slate-100 rounded-xl p-2.5 flex justify-between items-center">
                    {[
                      { label: "ID", value: `#${selectedCall.id}` },
                      {
                        label: "Date",
                        value: fmtDate(
                          selectedCall.callDate || selectedCall.createdAt,
                        ),
                      },
                      {
                        label: "Duration",
                        value:
                          durationSec != null
                            ? `${Math.floor(durationSec / 60)}:${String(durationSec % 60).padStart(2, "0")}`
                            : "—",
                      },
                      {
                        label: "Direction",
                        value: getDirectionText(
                          selectedCall.direction || "",
                          (selectedCall as any).originalDirection,
                          selectedCall.agentId,
                        ),
                      },
                    ].map((item, i) => (
                      <div
                        key={i}
                        className={`flex flex-col gap-0.5 ${i > 0 ? "border-l border-slate-200 pl-3" : ""}`}
                      >
                        <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                          {item.label}
                        </span>
                        <span className="text-xs font-bold text-slate-800 font-mono">
                          {item.value}
                        </span>
                      </div>
                    ))}
                  </div>

                  {/* ── Recording Player ── */}
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">
                      Recording
                    </p>
                    <div className="bg-slate-900 rounded-xl p-2.5 flex items-center gap-3 shadow-md">
                      <button
                        type="button"
                        className={cn(
                          "w-9 h-9 rounded-full flex items-center justify-center shrink-0 transition-colors shadow-sm",
                          recordingUrl
                            ? "bg-blue-600 hover:bg-blue-500"
                            : "bg-slate-700 cursor-default",
                        )}
                      >
                        {recordingUrl ? (
                          <svg
                            className="w-4 h-4 text-white ml-0.5"
                            viewBox="0 0 20 20"
                            fill="currentColor"
                          >
                            <path d="M6.3 2.841A1.5 1.5 0 0 0 4 4.11V15.89a1.5 1.5 0 0 0 2.3 1.269l9.344-5.89a1.5 1.5 0 0 0 0-2.538L6.3 2.84Z" />
                          </svg>
                        ) : (
                          <svg
                            className="w-4 h-4 text-slate-500"
                            fill="none"
                            viewBox="0 0 20 20"
                            stroke="currentColor"
                            strokeWidth="1.5"
                          >
                            <path d="M9 4a1 1 0 0 1 2 0v6a1 1 0 0 1-2 0V4ZM5.5 9a4.5 4.5 0 0 0 9 0M10 15v2" />
                          </svg>
                        )}
                      </button>
                      <div className="flex-1 min-w-0 space-y-1.5">
                        <svg
                          className="w-full"
                          height="28"
                          preserveAspectRatio="none"
                          viewBox={`0 0 ${waveHeights.length * 3.5} 28`}
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          {waveHeights.map((amp, i) => {
                            const x = i * 3.5 + 0.75;
                            const barH = Math.max(2, amp * 24);
                            const y = (28 - barH) / 2;
                            const played = i / waveHeights.length < PLAYED;
                            return (
                              <rect
                                key={i}
                                x={x}
                                y={y}
                                width={1.5}
                                height={barH}
                                rx={1}
                                fill={played ? "#60a5fa" : "#374151"}
                              />
                            );
                          })}
                        </svg>
                        <div className="relative h-[3px] bg-slate-700 rounded-full overflow-hidden">
                          <div
                            className="absolute inset-y-0 left-0 bg-blue-500 rounded-full"
                            style={{ width: `${PLAYED * 100}%` }}
                          />
                        </div>
                      </div>
                      <span className="text-[11px] text-slate-400 font-mono shrink-0 tabular-nums">
                        {durationSec != null
                          ? `${Math.floor(durationSec / 60)}:${String(durationSec % 60).padStart(2, "0")}`
                          : recordingUrl
                            ? "—:--"
                            : "No rec."}
                      </span>
                    </div>
                    {recordingUrl && (
                      <audio
                        src={recordingUrl}
                        className="hidden"
                        id="ctd-audio"
                      />
                    )}
                  </div>

                  {/* ── Activity Timeline ── */}
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">
                      Activity Timeline
                    </p>
                    <div className="relative space-y-0">
                      <div className="absolute left-3 top-0 bottom-0 w-px bg-slate-100 -z-0" />
                      {MOCK_TIMELINE.map((item) => {
                        const Icon = item.icon;
                        return (
                          <div key={item.id} className="flex gap-2.5 relative">
                            <div className="w-6 h-6 rounded-full flex items-center justify-center shrink-0 z-10 bg-white border border-slate-200 shadow-sm mt-1">
                              <Icon
                                className="w-3 h-3"
                                style={{ color: item.color }}
                              />
                            </div>
                            <div className="pb-2 flex-1 min-w-0">
                              <div className="bg-white border border-slate-200 rounded-lg px-3 py-1.5 shadow-sm">
                                <div className="flex items-center justify-between gap-2">
                                  <span className="text-xs font-semibold text-slate-800">
                                    {item.title}
                                  </span>
                                  <span className="text-[10px] text-slate-400 shrink-0">
                                    {item.time}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })}

                      {/* Notes entry */}
                      <div className="flex gap-2.5 relative">
                        <div className="w-6 h-6 rounded-full flex items-center justify-center shrink-0 bg-slate-100 z-10 ring-2 ring-white mt-1">
                          <StickyNote className="w-3 h-3 text-slate-400" />
                        </div>
                        <div className="flex-1 min-w-0 space-y-1.5">
                          <textarea
                            rows={2}
                            value={editFormData.notes || ""}
                            onChange={(e) =>
                              setEditFormData({
                                ...editFormData,
                                notes: e.target.value,
                              })
                            }
                            placeholder="Add an internal note…"
                            className="w-full text-xs text-slate-800 placeholder:text-slate-400 bg-white border border-slate-200 rounded-lg px-3 py-2 resize-none focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400 leading-relaxed shadow-sm"
                          />
                          <div className="flex justify-end">
                            <button
                              type="button"
                              onClick={onUpdate}
                              disabled={isUpdating}
                              className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs px-3 py-1.5 rounded-lg font-medium transition-colors disabled:opacity-50"
                            >
                              {isUpdating ? (
                                <Loader2 className="w-3 h-3 animate-spin" />
                              ) : (
                                <CheckCircle2 className="w-3 h-3" />
                              )}
                              {isUpdating ? "Saving…" : "Save Note"}
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* ── Technical Metadata + Timestamps (2-col) ── */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-slate-50 border border-slate-100 rounded-xl p-3">
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-2">
                        Technical
                      </p>
                      <div className="space-y-2">
                        {[
                          { label: "Aircall ID", value: aircallId },
                          {
                            label: "Direction",
                            value: fmtLabel(
                              (editFormData.direction || "—").toString(),
                            ),
                          },
                          { label: "Phone Line", value: phoneLine },
                          {
                            label: "Duration (s)",
                            value:
                              durationSec != null ? String(durationSec) : "—",
                          },
                        ].map((item) => (
                          <div key={item.label}>
                            <p className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold mb-0.5">
                              {item.label}
                            </p>
                            <p className="text-xs font-semibold text-slate-700 font-mono truncate">
                              {item.value}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className="bg-slate-50 border border-slate-100 rounded-xl p-3">
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-2">
                        Timestamps
                      </p>
                      <div className="space-y-2">
                        {[
                          {
                            label: "Started",
                            value: fmtDateTime(
                              raw?.startedAt || editFormData.startedAt,
                            ),
                          },
                          {
                            label: "Answered",
                            value: fmtDateTime(
                              raw?.answeredAt || editFormData.answeredAt,
                            ),
                          },
                          {
                            label: "Ended",
                            value: fmtDateTime(
                              raw?.endedAt || editFormData.endedAt,
                            ),
                          },
                        ].map((item) => (
                          <div key={item.label}>
                            <p className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold mb-0.5">
                              {item.label}
                            </p>
                            <p className="text-xs font-semibold text-slate-700 font-mono">
                              {item.value}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Customer notes banner */}
                  {((selectedCall.customer?.notes &&
                    selectedCall.customer.notes.length > 0) ||
                    selectedCall.customer?.note) && (
                    <div className="flex items-start gap-2 px-3 py-2 bg-amber-50 border border-amber-200 rounded-lg">
                      <StickyNote className="w-3.5 h-3.5 text-amber-500 mt-0.5 shrink-0" />
                      <div>
                        <p className="text-xs font-semibold text-amber-800">
                          Customer Notes
                        </p>
                        <p className="text-xs text-amber-700 mt-0.5 leading-relaxed">
                          {selectedCall.customer?.notes?.[0]?.content ||
                            selectedCall.customer?.note}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* ═══ COL 3 (22%): Entity Inspector ═══ */}
          <div className="w-[22%] shrink-0 flex flex-col border-l border-slate-200 bg-slate-50/50 overflow-hidden">
            <div className="px-4 py-2.5 border-b border-slate-200 shrink-0 bg-white">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                Entity Inspector
              </p>
            </div>

            <div className="flex-1 overflow-y-auto px-2.5 pb-3 pt-2.5 space-y-2 [&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar-thumb]:bg-slate-200 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-track]:bg-transparent">
              {/* ── CARD: CLASSIFICATION ── */}
              <div className="bg-white border border-slate-200 rounded-xl p-3 shadow-sm">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">
                  Classification
                </p>
                <div className="space-y-2">
                  <div>
                    <InspLabel>Status</InspLabel>
                    <InspectorSelect
                      value={editFormData.status || ""}
                      onChange={(v) =>
                        setEditFormData({
                          ...editFormData,
                          status: v as CallStatus,
                        })
                      }
                      placeholder="Status"
                    >
                      <SelectItem value="none">—</SelectItem>
                      {Object.values(CallStatus).map((s) => (
                        <SelectItem key={s} value={s}>
                          {fmtLabel(s)}
                        </SelectItem>
                      ))}
                    </InspectorSelect>
                  </div>
                  <div>
                    <InspLabel>Disposition</InspLabel>
                    <InspectorSelect
                      value={editFormData.disposition || ""}
                      onChange={(v) =>
                        setEditFormData({ ...editFormData, disposition: v })
                      }
                      placeholder="Disposition"
                    >
                      <SelectItem value="none">None</SelectItem>
                      {Object.values(CallDisposition).map((d) => (
                        <SelectItem key={d} value={d}>
                          {fmtLabel(d)}
                        </SelectItem>
                      ))}
                    </InspectorSelect>
                  </div>
                  <div>
                    <InspLabel>Yard</InspLabel>
                    <InspectorSelect
                      value={editFormData.yardId || ""}
                      onChange={(v) =>
                        setEditFormData({ ...editFormData, yardId: v })
                      }
                      placeholder="Yard"
                    >
                      <SelectItem value="none">None</SelectItem>
                      {yards.map((y) => (
                        <SelectItem key={y.id} value={y.id.toString()}>
                          {y.name}
                        </SelectItem>
                      ))}
                    </InspectorSelect>
                  </div>
                  <div>
                    <InspLabel>Campaign</InspLabel>
                    <InspectorSelect
                      value={editFormData.campaignId || ""}
                      onChange={(v) => {
                        const camp = campaigns.find(
                          (c) => c.id.toString() === v,
                        );
                        setEditFormData({
                          ...editFormData,
                          campaignId: v,
                          ...(camp?.yardaId
                            ? { yardId: camp.yardaId.toString() }
                            : {}),
                        });
                      }}
                      placeholder="Campaign"
                    >
                      <SelectItem value="none">None</SelectItem>
                      {campaigns.map((c) => (
                        <SelectItem key={c.id} value={c.id.toString()}>
                          {c.nombre}
                        </SelectItem>
                      ))}
                    </InspectorSelect>
                  </div>
                  {campaignOptionValues.length > 0 && (
                    <div>
                      <InspLabel>Campaign Option</InspLabel>
                      <InspectorSelect
                        value={editFormData.campaignOption || ""}
                        onChange={(v) =>
                          setEditFormData({
                            ...editFormData,
                            campaignOption: v,
                          })
                        }
                        placeholder="Option"
                      >
                        <SelectItem value="none">None</SelectItem>
                        {campaignOptionValues.map((v) => (
                          <SelectItem key={v} value={v}>
                            {fmtEnumLabel(v)}
                          </SelectItem>
                        ))}
                      </InspectorSelect>
                    </div>
                  )}
                </div>
              </div>

              {/* ── CARD: FOLLOW-UP ── */}
              <div className="bg-white border border-slate-200 rounded-xl p-3 shadow-sm">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">
                  Follow-up
                </p>
                <div className="space-y-2">
                  <div>
                    <InspLabel>Due Date</InspLabel>
                    <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
                      <PopoverTrigger asChild>
                        <button
                          type="button"
                          className="w-full h-7 flex items-center gap-2 px-2.5 text-xs bg-slate-50 border border-transparent hover:border-slate-300 focus:bg-white focus:ring-2 focus:ring-blue-100 rounded-lg transition-colors text-left"
                        >
                          <CalendarIcon className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span
                            className={
                              followUpDateDisplay
                                ? "text-slate-800 font-semibold"
                                : "text-slate-400 font-normal"
                            }
                          >
                            {followUpDateDisplay || "Pick date…"}
                          </span>
                        </button>
                      </PopoverTrigger>
                      <PopoverContent
                        className="w-auto p-0 shadow-xl border-slate-200"
                        align="end"
                      >
                        <Calendar
                          mode="single"
                          selected={
                            editFormData.followUpDueDate
                              ? new Date(editFormData.followUpDueDate)
                              : undefined
                          }
                          onSelect={(date) => {
                            setEditFormData({
                              ...editFormData,
                              followUpDueDate: date ? date.toISOString() : "",
                            });
                            setCalendarOpen(false);
                          }}
                          disabled={{ before: new Date() }}
                          initialFocus
                        />
                        {editFormData.followUpDueDate && (
                          <div className="px-3 pb-3 flex justify-end">
                            <button
                              type="button"
                              onClick={() => {
                                setEditFormData({
                                  ...editFormData,
                                  followUpDueDate: "",
                                });
                                setCalendarOpen(false);
                              }}
                              className="text-xs text-red-500 hover:text-red-600"
                            >
                              Clear
                            </button>
                          </div>
                        )}
                      </PopoverContent>
                    </Popover>
                  </div>
                  <div>
                    <InspLabel>Assignee</InspLabel>
                    <InspectorSelect
                      value={editFormData.followUpAssignedToId || ""}
                      onChange={(v) =>
                        setEditFormData({
                          ...editFormData,
                          followUpAssignedToId: v,
                        })
                      }
                      placeholder="Assign…"
                    >
                      <SelectItem value="none">Unassigned</SelectItem>
                      {agents.map((a) => (
                        <SelectItem key={a.id} value={a.id.toString()}>
                          {a.name}
                        </SelectItem>
                      ))}
                    </InspectorSelect>
                  </div>
                </div>
              </div>

              {/* ── Save Button ── */}
              <button
                type="button"
                onClick={onUpdate}
                disabled={isUpdating}
                className="w-full flex items-center justify-center gap-2 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl transition-colors disabled:opacity-50 shadow-sm"
              >
                {isUpdating ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <CheckCircle2 className="w-4 h-4" />
                )}
                {isUpdating ? "Saving…" : "Save Changes"}
              </button>
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
