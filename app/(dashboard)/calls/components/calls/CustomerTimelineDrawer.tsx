"use client";

const BACKEND_API_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

import { useEffect, useMemo, useRef, useState } from "react";
import useSWR from "swr";
import { cn } from "@/lib/utils";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import {
  X,
  PhoneCall,
  Loader2,
  PhoneOutgoing,
  StickyNote,
  CalendarIcon,
  CheckCircle2,
  Plus,
  AlertCircle,
  ExternalLink,
  Clock,
  Hash,
  ArrowDownLeft,
  Mic,
} from "lucide-react";
import { SelectItem } from "@/components/ui/select";
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
  formatEnumLabel,
  fmtDate,
  fmtRelative,
  getClientName,
  getClientPhone,
} from "../../utils/call-helpers";
import { InspLabel, InspectorSelect } from "../shared/InspectorHelpers";
import type { Filters } from "../../hooks/useCallFilters";
import { useAircall } from "@/components/providers/AircallProvider";

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

const fmtTime = (s: number) =>
  `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, "0")}`;

// ── Status map ────────────────────────────────────────────────────────────────

const STATUS_COLORS: Record<
  string,
  { text: string; bg: string; label: string }
> = {
  ACTIVE: { text: "#008f68", bg: "#e6f5f0", label: "Active" },
  COMPLETED: { text: "#64748b", bg: "#f1f5f9", label: "Done" },
  PENDING_FOLLOWUP: { text: "#c47a00", bg: "#fef3d6", label: "Pending" },
  OVERDUE: { text: "#c0392b", bg: "#fde8e6", label: "Overdue" },
};

// ── Direction ─────────────────────────────────────────────────────────────────

function dirStyle(dir: string, hasMissed: boolean) {
  const d = dir.toLowerCase();
  if (d === "missed" || hasMissed) return { color: "#c0392b", label: "Missed" };
  if (d === "outbound") return { color: "#2563eb", label: "Outbound" };
  return { color: "#008f68", label: "Inbound" };
}

// ── Timeline Card ─────────────────────────────────────────────────────────────

function TimelineCard({
  call,
  isActive,
  onClick,
  isLast,
}: {
  call: Ticket;
  isActive: boolean;
  onClick: () => void;
  isLast: boolean;
}) {
  const ref = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    if (isActive)
      ref.current?.scrollIntoView({ block: "nearest", behavior: "smooth" });
  }, [isActive]);

  const dateLabel = fmtRelative(call.callDate || call.createdAt);
  const { color, label } = dirStyle(
    (call.direction || "inbound").toString(),
    !!(call as any).missedCallReason,
  );
  const statusKey = (call.status || "")
    .toString()
    .toUpperCase()
    .replace(/ /g, "_");
  const sc = STATUS_COLORS[statusKey] || STATUS_COLORS.COMPLETED;
  const dur = (call as any).duration;

  return (
    <div className="relative flex gap-2 pl-3.5 pr-2.5">
      {/* Vertical connector */}
      {!isLast && (
        <div className="absolute left-5 top-5 bottom-0 w-px bg-slate-100" />
      )}

      {/* Dot */}
      <div className="relative z-10 mt-3 shrink-0">
        <span
          className={cn(
            "w-3 h-3 rounded-full border-2 block transition-all",
            isActive
              ? "bg-[#008f68] border-[#008f68] shadow-[0_0_0_3px_#008f6820]"
              : "bg-white border-slate-300",
          )}
        />
      </div>

      {/* Card */}
      <button
        ref={ref}
        type="button"
        onClick={onClick}
        className={cn(
          "flex-1 text-left mb-1.5 rounded-xl p-2.5 border transition-all",
          isActive
            ? "bg-[#008f68]/5 border-[#008f68]/20 shadow-sm"
            : "bg-white border-slate-100 hover:border-slate-200 hover:bg-slate-50/60",
        )}
      >
        {/* ID + date */}
        <div className="flex items-center justify-between mb-1.5">
          <span
            className={cn(
              "text-[11px] font-bold font-mono",
              isActive ? "text-[#008f68]" : "text-slate-700",
            )}
          >
            #{call.id}
          </span>
          <span className="text-[9.5px] text-slate-400 tabular-nums">
            {dateLabel}
          </span>
        </div>
        {/* Direction + Status chips */}
        <div className="flex items-center gap-1 flex-wrap mb-1.5">
          <span
            className="text-[9.5px] font-semibold px-1.5 py-0.5 rounded-md"
            style={{ color, background: color + "15" }}
          >
            {label}
          </span>
          <span
            className="text-[9.5px] font-semibold px-1.5 py-0.5 rounded-md"
            style={{ color: sc.text, background: sc.bg }}
          >
            {sc.label}
          </span>
        </div>
        {/* Duration */}
        {dur != null && (
          <p className="flex items-center gap-1 text-[9.5px] text-slate-400 font-mono">
            <Clock className="w-2.5 h-2.5 shrink-0" />
            {fmtTime(dur)}
          </p>
        )}
      </button>
    </div>
  );
}

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
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioCurrentTime, setAudioCurrentTime] = useState(0);
  const [audioDuration, setAudioDuration] = useState<number | null>(null);
  const [audioError, setAudioError] = useState(false);
  const [audioBlobUrl, setAudioBlobUrl] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    setIsPlaying(false);
    setAudioCurrentTime(0);
    setAudioDuration(null);
    setAudioError(false);
    // Revoke previous blob URL
    setAudioBlobUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return null;
    });
  }, [selectedCall?.id]);

  // Fetch recording via backend proxy (avoids CORS on direct Aircall URL)
  useEffect(() => {
    if (!selectedCall?.id) return;
    const id = selectedCall.id;
    let blobUrl: string | null = null;
    const token =
      (typeof document !== "undefined" &&
        document.cookie
          .split("; ")
          .find((r) => r.startsWith("auth-token="))
          ?.split("=")[1]) ||
      (typeof window !== "undefined" && localStorage.getItem("auth_token")) ||
      null;
    fetch(`${BACKEND_API_URL}/calls/${id}/recording`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    })
      .then((res) => {
        if (!res.ok) throw new Error(`upstream ${res.status}`);
        return res.blob();
      })
      .then((blob) => {
        blobUrl = URL.createObjectURL(blob);
        setAudioBlobUrl(blobUrl);
        setAudioError(false);
      })
      .catch(() => {
        setAudioError(true);
      });
    return () => {
      if (blobUrl) URL.revokeObjectURL(blobUrl);
    };
  }, [selectedCall?.id]);

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
    const sort = (arr: Ticket[]) =>
      [...arr].sort(
        (a, b) =>
          new Date(b.callDate || b.createdAt || 0).getTime() -
          new Date(a.callDate || a.createdAt || 0).getTime(),
      );
    if (historyData?.success && Array.isArray(historyData.data?.data))
      return sort(historyData.data.data);
    if (historyData?.success && Array.isArray(historyData.data))
      return sort(historyData.data);
    return group?.calls ?? [];
  }, [historyData, group?.calls]);

  const activeCallId = selectedCall?.id ?? group?.latestCall?.id;
  const customerName = group?.customerName ?? getClientName(selectedCall);
  const customerPhone = group?.customerPhone ?? getClientPhone(selectedCall);
  const callCount = allCalls.length || group?.calls.length || 0;

  const campaignOptionValues = useMemo(() => {
    if (!editFormData.campaignId) return [];
    const camp = campaigns.find(
      (c) => c.id.toString() === editFormData.campaignId,
    );
    const type = camp?.tipo?.toString().toUpperCase();
    if (type === ManagementType.ONBOARDING)
      return Object.values(OnboardingOption);
    if (type === ManagementType.AR) return Object.values(ArOption);
    return [];
  }, [campaigns, editFormData.campaignId]);

  const followUpDateDisplay = useMemo(
    () =>
      editFormData.followUpDueDate
        ? fmtDate(editFormData.followUpDueDate)
        : null,
    [editFormData.followUpDueDate],
  );

  const raw = selectedCall as any;
  const durationSec =
    raw?.duration ??
    (editFormData.duration ? parseInt(editFormData.duration) : null);
  const recordingUrl = raw?.recordingUrl || editFormData.recordingUrl;
  const phoneLine = raw?.phoneLine
    ? raw.phoneLine.label || raw.phoneLine.phoneNumber
    : editFormData.phoneLineId || "—";

  const waveHeights = useMemo(() => {
    const seed = typeof selectedCall?.id === "number" ? selectedCall.id : 1;
    return Array.from({ length: 60 }, (_, i) => {
      const n =
        Math.sin(i * 0.43 + seed * 0.07) * 0.5 +
        Math.sin(i * 1.1 + seed * 0.13) * 0.3 +
        Math.sin(i * 2.7 + seed * 0.03) * 0.2;
      return Math.max(0.08, Math.min(1, Math.abs(n)));
    });
  }, [selectedCall?.id]);

  const { effectiveDuration, played } = useMemo(() => {
    const eff = audioDuration ?? durationSec ?? null;
    return {
      effectiveDuration: eff,
      played: eff && eff > 0 ? audioCurrentTime / eff : 0,
    };
  }, [audioDuration, audioCurrentTime, durationSec]);

  const togglePlay = () => {
    const audio = audioRef.current;
    if (!audio || !recordingUrl) return;
    if (isPlaying) {
      audio.pause();
    } else {
      setAudioError(false);
      audio.play().catch(() => setAudioError(true));
    }
  };

  const seekTo = (ratio: number) => {
    const audio = audioRef.current;
    if (!audio || !effectiveDuration) return;
    audio.currentTime = ratio * effectiveDuration;
    setAudioCurrentTime(audio.currentTime);
  };

  const selectedDir = selectedCall
    ? dirStyle(
        (selectedCall.direction || "inbound").toString(),
        !!(selectedCall as any).missedCallReason,
      )
    : null;

  return (
    <Sheet open={open} onOpenChange={(v) => !v && onClose()}>
      <SheetContent
        side="right"
        className="w-svw sm:w-[92vw] p-0 flex flex-col bg-[#f4f5f7] [&>button.absolute]:hidden overflow-hidden border-l border-slate-200/80"
        style={{ maxWidth: "1100px" }}
      >
        <SheetTitle className="sr-only">
          {customerName ? `Call Center — ${customerName}` : "Call Center"}
        </SheetTitle>

        {/* ══ HEADER ══════════════════════════════════════════════════════════ */}
        <div className="shrink-0 bg-white border-b border-slate-100">
          {/* Row 1: avatar · name · phone · count · actions */}
          <div className="flex items-center gap-3 px-4 py-3">
            {/* Avatar */}
            <div
              className="w-10 h-10 rounded-2xl flex items-center justify-center text-[13px] font-extrabold text-white shrink-0 shadow-sm ring-2 ring-white"
              style={{
                background: `hsl(${(customerName?.charCodeAt(0) ?? 180) % 360} 50% 44%)`,
              }}
            >
              {customerName ? customerName.substring(0, 2).toUpperCase() : "?"}
            </div>

            {/* Name + phone */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <p className="text-[15px] font-bold text-slate-900 leading-none truncate">
                  {customerName || "Unknown"}
                </p>
                <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-[#008f68] bg-[#008f68]/8 px-2 py-0.5 rounded-full">
                  <PhoneCall className="w-2.5 h-2.5" />
                  {isLoadingHistory ? (
                    <Loader2 className="w-2.5 h-2.5 animate-spin" />
                  ) : (
                    `${callCount} call${callCount !== 1 ? "s" : ""}`
                  )}
                </span>
              </div>
              <p className="text-[11.5px] text-slate-400 font-mono mt-0.5 leading-none">
                {customerPhone}
              </p>
            </div>

            {/* Action buttons */}
            <div className="flex items-center gap-1.5 shrink-0">
              <button
                type="button"
                onClick={() => {
                  if (dialPhone && canDial) dial(dialPhone, selectedCall?.id);
                }}
                disabled={!dialPhone || !canDial}
                className="flex items-center gap-1.5 h-8 px-3.5 text-white text-[12px] font-semibold rounded-xl bg-[#008f68] hover:bg-[#007a5a] active:scale-95 disabled:opacity-40 transition-all shadow-sm"
              >
                <PhoneOutgoing className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Call</span>
              </button>
              {onCreateTicket && (
                <button
                  type="button"
                  onClick={onCreateTicket}
                  className="flex items-center gap-1.5 h-8 px-3.5 bg-slate-900 hover:bg-slate-700 active:scale-95 text-white text-[12px] font-semibold rounded-xl transition-all shadow-sm"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Escalate</span>
                </button>
              )}
              <button
                type="button"
                onClick={onClose}
                className="w-8 h-8 flex items-center justify-center rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
                aria-label="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Row 2: Metadata chips */}
          {selectedCall && (
            <div className="flex items-center gap-1.5 px-4 pb-3 flex-wrap">
              <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-slate-600 bg-slate-50 border border-slate-200 px-2.5 py-1 rounded-lg cursor-default">
                <Hash className="w-3 h-3 text-slate-400" />
                Call ID #{selectedCall.id}
              </span>
              <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-slate-600 bg-slate-50 border border-slate-200 px-2.5 py-1 rounded-lg cursor-default">
                <Clock className="w-3 h-3 text-slate-400" />
                {fmtDate(selectedCall.callDate || selectedCall.createdAt)}
              </span>
              {durationSec != null && (
                <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-slate-600 bg-slate-50 border border-slate-200 px-2.5 py-1 rounded-lg cursor-default">
                  <Mic className="w-3 h-3 text-slate-400" />
                  {fmtTime(durationSec)}
                </span>
              )}
              {selectedDir && (
                <span
                  className="inline-flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1 rounded-lg border cursor-default"
                  style={{
                    color: selectedDir.color,
                    background: selectedDir.color + "12",
                    borderColor: selectedDir.color + "30",
                  }}
                >
                  <ArrowDownLeft className="w-3 h-3" />
                  {selectedDir.label}
                </span>
              )}
            </div>
          )}
        </div>

        {/* ══ BODY ════════════════════════════════════════════════════════════ */}
        <div className="flex-1 overflow-hidden min-h-0 flex">
          {/* ── MAIN AREA (~70%) ─────────────────────────────────────────────── */}
          <main className="flex-1 overflow-hidden flex flex-col min-h-0">
            <div className="flex-1 overflow-y-auto [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:bg-slate-200 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-track]:bg-transparent">
              {!selectedCall ? (
                <div className="flex items-center justify-center h-full text-slate-300">
                  <div className="text-center">
                    <PhoneCall className="w-8 h-8 opacity-40 mx-auto mb-2" />
                    <p className="text-[13px]">
                      Select a call from the history
                    </p>
                  </div>
                </div>
              ) : (
                <div className="p-5 space-y-4">
                  {/* ── Combined Call Details & Properties card ── */}
                  <section className="bg-white rounded-2xl border border-slate-100 shadow-[0_1px_3px_rgba(0,0,0,0.06)] overflow-hidden">
                    <div className="flex items-center gap-2 px-5 pt-4 pb-4 border-b border-slate-50">
                      <div className="w-6 h-6 rounded-lg bg-slate-100 flex items-center justify-center shrink-0">
                        <Hash className="w-3 h-3 text-slate-500" />
                      </div>
                      <span className="text-[12px] font-bold text-slate-700">
                        Call Details &amp; Properties
                      </span>
                    </div>

                    <div className="p-5">
                      {/* Properties grid: editable fields */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-x-5 gap-y-4 mb-5">
                        {/* Status */}
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
                                {formatEnumLabel(s)}
                              </SelectItem>
                            ))}
                          </InspectorSelect>
                        </div>

                        {/* Disposition */}
                        <div>
                          <InspLabel>Disposition</InspLabel>
                          <InspectorSelect
                            value={editFormData.disposition || ""}
                            onChange={(v) =>
                              setEditFormData({
                                ...editFormData,
                                disposition: v,
                              })
                            }
                            placeholder="Disposition"
                          >
                            <SelectItem value="none">None</SelectItem>
                            {Object.values(CallDisposition).map((d) => (
                              <SelectItem key={d} value={d}>
                                {formatEnumLabel(d)}
                              </SelectItem>
                            ))}
                          </InspectorSelect>
                        </div>

                        {/* Yard */}
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

                        {/* Campaign */}
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

                        {/* Campaign Option (conditional) */}
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
                                  {formatEnumLabel(v)}
                                </SelectItem>
                              ))}
                            </InspectorSelect>
                          </div>
                        )}

                        {/* Follow-up Date */}
                        <div>
                          <InspLabel>Follow-up Date</InspLabel>
                          <Popover
                            open={calendarOpen}
                            onOpenChange={setCalendarOpen}
                          >
                            <PopoverTrigger asChild>
                              <button
                                type="button"
                                className="w-full h-8 flex items-center gap-2 px-2.5 text-xs bg-slate-50 border border-transparent hover:border-slate-200 focus:bg-white focus:ring-2 focus:ring-[#008f68]/20 rounded-lg transition-colors text-left"
                              >
                                <CalendarIcon className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                                <span
                                  className={
                                    followUpDateDisplay
                                      ? "text-slate-800 font-semibold text-xs"
                                      : "text-slate-400 text-xs"
                                  }
                                >
                                  {followUpDateDisplay || "Pick date…"}
                                </span>
                              </button>
                            </PopoverTrigger>
                            <PopoverContent
                              className="w-auto p-0 shadow-xl border-slate-200"
                              align="start"
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
                                    followUpDueDate: date
                                      ? date.toISOString()
                                      : "",
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

                        {/* Assignee */}
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

                        {/* Read-only: Aircall ID */}
                        <div>
                          <InspLabel>Aircall ID</InspLabel>
                          <div className="h-8 flex items-center px-2.5 bg-slate-50 rounded-lg">
                            <span className="text-[12px] font-mono text-slate-600 truncate">
                              {raw?.aircallId || "—"}
                            </span>
                          </div>
                        </div>

                        {/* Read-only: Phone Line */}
                        <div>
                          <InspLabel>Phone Line</InspLabel>
                          <div className="h-8 flex items-center px-2.5 bg-slate-50 rounded-lg">
                            <span className="text-[12px] text-slate-600 truncate">
                              {phoneLine}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Timestamps */}
                      <div className="border-t border-slate-100 pt-4">
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-1.5">
                          <span className="w-1 h-1 rounded-full bg-slate-300 inline-block" />
                          Timestamps
                        </p>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-x-5 gap-y-3">
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
                              <p className="text-[10px] text-slate-400 font-medium mb-1">
                                {item.label}
                              </p>
                              <p className="text-[12px] font-semibold text-slate-700 font-mono">
                                {item.value}
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </section>

                  {/* ── Recording card ── */}
                  <section className="bg-white rounded-2xl border border-slate-100 shadow-[0_1px_3px_rgba(0,0,0,0.06)] overflow-hidden">
                    <div className="flex items-center gap-2 px-5 pt-4 pb-3">
                      <div className="w-6 h-6 rounded-lg bg-[#008f68]/10 flex items-center justify-center shrink-0">
                        <Mic className="w-3 h-3 text-[#008f68]" />
                      </div>
                      <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wider flex-1">
                        Recording
                      </span>
                      {durationSec != null && (
                        <span className="text-[10px] font-mono text-slate-400">
                          {fmtTime(durationSec)}
                        </span>
                      )}
                    </div>

                    {recordingUrl ? (
                      audioError ? (
                        <div className="px-5 pb-5">
                          <div className="flex items-center gap-3 bg-red-50 border border-red-100 rounded-xl px-4 py-3">
                            <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
                            <div className="flex-1 min-w-0">
                              <p className="text-[12px] font-semibold text-slate-700">
                                Unable to play recording
                              </p>
                              <a
                                href={recordingUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#008f68] hover:underline mt-0.5"
                              >
                                <ExternalLink className="w-3 h-3" />
                                Open in browser
                              </a>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="px-5 pb-5">
                          <svg
                            className="w-full cursor-pointer mb-3"
                            height="40"
                            preserveAspectRatio="none"
                            viewBox={`0 0 ${waveHeights.length * 6} 40`}
                            onClick={(e) => {
                              const rect = (
                                e.currentTarget as SVGSVGElement
                              ).getBoundingClientRect();
                              seekTo((e.clientX - rect.left) / rect.width);
                            }}
                          >
                            {waveHeights.map((amp, i) => {
                              const x = i * 6 + 1.5;
                              const barH = Math.max(3, amp * 34);
                              const y = (40 - barH) / 2;
                              return (
                                <rect
                                  key={i}
                                  x={x}
                                  y={y}
                                  width={3}
                                  height={barH}
                                  rx={1.5}
                                  fill={
                                    i / waveHeights.length < played
                                      ? "#008f68"
                                      : "#e2e8f0"
                                  }
                                />
                              );
                            })}
                          </svg>

                          <div className="flex items-center gap-3">
                            <button
                              type="button"
                              onClick={togglePlay}
                              className="w-10 h-10 rounded-full bg-[#008f68] hover:bg-[#007a5a] active:scale-95 flex items-center justify-center shrink-0 transition-all text-white shadow-sm"
                              aria-label={isPlaying ? "Pause" : "Play"}
                            >
                              {isPlaying ? (
                                <svg
                                  className="w-4 h-4"
                                  viewBox="0 0 20 20"
                                  fill="currentColor"
                                >
                                  <path d="M5.75 3a.75.75 0 0 0-.75.75v12.5c0 .414.336.75.75.75h1.5a.75.75 0 0 0 .75-.75V3.75A.75.75 0 0 0 7.25 3h-1.5ZM12.75 3a.75.75 0 0 0-.75.75v12.5c0 .414.336.75.75.75h1.5a.75.75 0 0 0 .75-.75V3.75a.75.75 0 0 0-.75-.75h-1.5Z" />
                                </svg>
                              ) : (
                                <svg
                                  className="w-4 h-4 ml-0.5"
                                  viewBox="0 0 20 20"
                                  fill="currentColor"
                                >
                                  <path d="M6.3 2.841A1.5 1.5 0 0 0 4 4.11V15.89a1.5 1.5 0 0 0 2.3 1.269l9.344-5.89a1.5 1.5 0 0 0 0-2.538L6.3 2.84Z" />
                                </svg>
                              )}
                            </button>

                            <div className="flex-1">
                              <div
                                className="h-2 bg-slate-100 rounded-full overflow-hidden cursor-pointer mb-1.5"
                                onClick={(e) => {
                                  const rect = (
                                    e.currentTarget as HTMLDivElement
                                  ).getBoundingClientRect();
                                  seekTo((e.clientX - rect.left) / rect.width);
                                }}
                              >
                                <div
                                  className="h-full bg-[#008f68] rounded-full transition-all"
                                  style={{ width: `${played * 100}%` }}
                                />
                              </div>
                              <div className="flex justify-between">
                                <span className="text-[10px] font-mono text-slate-400 tabular-nums">
                                  {fmtTime(audioCurrentTime)}
                                </span>
                                <span className="text-[10px] font-mono text-slate-400 tabular-nums">
                                  {effectiveDuration != null
                                    ? fmtTime(effectiveDuration)
                                    : "—:--"}
                                </span>
                              </div>
                            </div>

                            <a
                              href={recordingUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="w-9 h-9 flex items-center justify-center rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
                              title="Open in browser"
                            >
                              <ExternalLink className="w-4 h-4" />
                            </a>
                          </div>
                        </div>
                      )
                    ) : (
                      <div className="mx-5 mb-5 flex items-center gap-3 bg-slate-50 border border-slate-100 rounded-xl px-4 py-3">
                        <div className="w-9 h-9 rounded-xl bg-slate-100 flex items-center justify-center shrink-0">
                          <Mic className="w-4 h-4 text-slate-300" />
                        </div>
                        <div>
                          <p className="text-[12px] font-semibold text-slate-500">
                            No recording available
                          </p>
                          <p className="text-[11px] text-slate-400">
                            {durationSec != null
                              ? `Lasted ${fmtTime(durationSec)}`
                              : "This call was not recorded"}
                          </p>
                        </div>
                      </div>
                    )}

                    <audio
                      ref={audioRef}
                      src={audioBlobUrl || undefined}
                      onPlay={() => setIsPlaying(true)}
                      onPause={() => setIsPlaying(false)}
                      onEnded={() => {
                        setIsPlaying(false);
                        setAudioCurrentTime(0);
                      }}
                      onTimeUpdate={(e) =>
                        setAudioCurrentTime(
                          (e.currentTarget as HTMLAudioElement).currentTime,
                        )
                      }
                      onLoadedMetadata={(e) =>
                        setAudioDuration(
                          (e.currentTarget as HTMLAudioElement).duration,
                        )
                      }
                      onError={() => {
                        setAudioError(true);
                        setIsPlaying(false);
                      }}
                      className="hidden"
                    />
                  </section>

                  {/* ── Customer note banner ── */}
                  {((selectedCall.customer?.notes &&
                    selectedCall.customer.notes.length > 0) ||
                    selectedCall.customer?.note) && (
                    <div className="flex items-start gap-2.5 px-4 py-3 bg-amber-50 border border-amber-200/60 rounded-2xl shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
                      <StickyNote className="w-3.5 h-3.5 text-amber-500 mt-0.5 shrink-0" />
                      <div>
                        <p className="text-[10px] font-bold text-amber-700 uppercase tracking-wider mb-0.5">
                          Customer Note
                        </p>
                        <p className="text-[12px] text-amber-800 leading-relaxed">
                          {selectedCall.customer?.notes?.[0]?.content ||
                            selectedCall.customer?.note}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* ── Internal Note card ── */}
                  <section className="bg-white rounded-2xl border border-slate-100 shadow-[0_1px_3px_rgba(0,0,0,0.06)] overflow-hidden">
                    <div className="flex items-center gap-2 px-5 pt-4 pb-3">
                      <div className="w-6 h-6 rounded-lg bg-amber-50 flex items-center justify-center shrink-0">
                        <StickyNote className="w-3 h-3 text-amber-500" />
                      </div>
                      <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                        Internal Note
                      </span>
                    </div>
                    <div className="px-5 pb-0">
                      <textarea
                        rows={3}
                        value={editFormData.notes || ""}
                        onChange={(e) =>
                          setEditFormData({
                            ...editFormData,
                            notes: e.target.value,
                          })
                        }
                        placeholder="Add a note about this call…"
                        className="w-full text-[13px] text-slate-800 placeholder:text-slate-300 bg-transparent border-0 resize-none focus:outline-none leading-relaxed"
                      />
                    </div>
                    <div className="px-4 pb-2.5 flex justify-end">
                      <span className="text-[10px] text-slate-400 font-mono tabular-nums">
                        {editFormData.notes?.length || 0} chars
                      </span>
                    </div>
                  </section>
                </div>
              )}
            </div>

            {/* ── Sticky Save Changes footer ── */}
            {selectedCall && (
              <div className="shrink-0 px-5 py-3 border-t border-slate-100 bg-white/95 backdrop-blur-sm">
                <button
                  type="button"
                  onClick={onUpdate}
                  disabled={isUpdating}
                  className="w-full flex items-center justify-center gap-2 py-2.5 text-white text-[13px] font-semibold rounded-xl transition-all active:scale-[0.98] disabled:opacity-50 bg-[#008f68] hover:bg-[#007a5a] shadow-sm"
                >
                  {isUpdating ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <CheckCircle2 className="w-4 h-4" />
                  )}
                  {isUpdating ? "Saving…" : "Save Changes"}
                </button>
              </div>
            )}
          </main>

          {/* ── ASIDE: Call History (~30%) ────────────────────────────────────── */}
          <aside className="hidden sm:flex w-72 xl:w-80 shrink-0 flex-col border-l border-slate-200/60 bg-white overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
              <div className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-[#008f68] shrink-0" />
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  Call History
                </p>
              </div>
              {isLoadingHistory ? (
                <Loader2 className="w-3 h-3 animate-spin text-slate-300" />
              ) : (
                <span className="text-[10px] font-semibold text-slate-400 tabular-nums">
                  {allCalls.length}
                </span>
              )}
            </div>
            <div className="flex-1 overflow-y-auto py-2 [&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar-thumb]:bg-slate-200 [&::-webkit-scrollbar-thumb]:rounded-full">
              {allCalls.length === 0 && !isLoadingHistory ? (
                <div className="flex flex-col items-center justify-center py-12 gap-2 text-slate-300">
                  <PhoneCall className="w-5 h-5" />
                  <span className="text-[11px]">No calls</span>
                </div>
              ) : (
                allCalls.map((call, idx) => (
                  <TimelineCard
                    key={call.id}
                    call={call}
                    isActive={call.id === activeCallId}
                    onClick={() => onSelectCall(call)}
                    isLast={idx === allCalls.length - 1}
                  />
                ))
              )}
            </div>
          </aside>
        </div>
      </SheetContent>
    </Sheet>
  );
}
