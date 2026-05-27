"use client";

const BACKEND_API_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import useSWR from "swr";
import { cn } from "@/lib/utils";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
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
  ArrowLeft,
  Mic,
  Phone,
  Timer,
  Link2,
  Check,
  Pencil,
  CloudUpload,
  Paperclip,
  FileIcon,
  Trash2,
  Download,
  Eye,
} from "lucide-react";
import { CallPeekPanel } from "./CallPeekPanel";
import { FollowUpDateTimePicker } from "./FollowUpDateTimePicker";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import {
  InspLabel,
  InspectorSelect,
  InspectorCombobox,
} from "../shared/InspectorHelpers";
import { CustomerNotesAlert } from "../shared/CustomerNotesAlert";
import type { Filters } from "../../hooks/useCallFilters";
import { useAircall } from "@/components/providers/AircallProvider";
import { useTicketPeekAircallExclusion } from "@/hooks/use-ticket-peek-aircall-exclusion";
import { shouldIgnoreTicketSheetOutsideEvent } from "@/lib/ticket-sheet-outside-interaction";

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
  /** Descriptive label, e.g. "Back to Fredrick Allen timeline" */
  returnToLabel?: string;
  onBackToReturn?: () => void;
  group: CustomerCallGroup | null;
  selectedCall: Ticket | null;
  onSelectCall: (call: Ticket) => void;
  editFormData: CreateTicketFormData;
  setEditFormData: (next: CreateTicketFormData) => void;
  attachmentFiles: File[];
  setAttachmentFiles: (next: File[]) => void;
  savedAttachments: string[];
  onAttachmentsChange?: (attachments: string[]) => void;
  isUpdating: boolean;
  onUpdate: (
    overrideRelatedCallId?: string | null,
    overrideFormData?: Partial<CreateTicketFormData>,
  ) => void;
  customers: CustomerOption[];
  yards: YardOption[];
  agents: AgentOption[];
  campaigns: CampaignOption[];
  getAttachmentLabel: (value: string) => string;
  getAttachmentUrl: (value: string) => string;
  onCreateTicket?: () => void;
  activeFilters?: Filters;
  /** When true, shows an animated success toast anchored to the left edge of the sheet */
  showSuccessToast?: boolean;
  /** Called when the toast finishes its exit animation so the parent can reset the flag */
  onSuccessToastDismiss?: () => void;
  /** When true, shows an animated error toast anchored to the left edge of the sheet */
  showErrorToast?: boolean;
  /** Message to display inside the error toast */
  errorToastMessage?: string;
  /** Called when the error toast finishes its exit animation so the parent can reset the flag */
  onErrorToastDismiss?: () => void;
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
  COMPLETED: { text: "#64748b", bg: "#f1f5f9", label: "Completed" },
  PENDING_FOLLOWUP: {
    text: "#c47a00",
    bg: "#fef3d6",
    label: "Pending Followup",
  },
  OVERDUE: { text: "#c0392b", bg: "#fde8e6", label: "Overdue" },
};

// ── Disposition map ──────────────────────────────────────────────────────────

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

// ── Direction ─────────────────────────────────────────────────────────────────

function dirStyle(dir: string, hasMissed: boolean) {
  const d = dir.toLowerCase();
  if (d === "voicemail") return { color: "#7c3aed", label: "Voicemail" };
  if (d === "missed" || hasMissed) return { color: "#c0392b", label: "Missed" };
  if (d === "outbound") return { color: "#2563eb", label: "Outbound" };
  return { color: "#008f68", label: "Inbound" };
}

// ── Timeline Card ─────────────────────────────────────────────────────────────

function TimelineCard({
  call,
  isActive,
  onClick,
  onPeek,
  isLast,
  linkedFromId,
}: {
  call: Ticket;
  isActive: boolean;
  onClick: () => void;
  onPeek?: () => void;
  isLast: boolean;
  linkedFromId?: number;
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
  const dispositionKey = ((call as any).disposition || "")
    .toString()
    .toUpperCase()
    .replace(/ /g, "_");
  const dc = dispositionKey ? DISPOSITION_COLORS[dispositionKey] : null;
  const agentName =
    (call as any).agent?.name ||
    (call as any).agentName ||
    (call as any).assignedTo ||
    null;
  const campaignOpt = (call as any).campaignOption
    ? formatEnumLabel((call as any).campaignOption)
    : null;
  const noteText = (call as any).notes || (call as any).issueDetail || null;
  const followUp = (call as any).followUpDueDate || null;

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

      {/* Card wrapper — stack: main card button + peek action row */}
      <div className="flex-1 min-w-0">
        <button
          ref={ref}
          type="button"
          onClick={onClick}
          className={cn(
            "w-full text-left mb-1 rounded-xl p-2.5 border transition-all",
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

          {/* Direction + Status + Disposition chips */}
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
            {dc && (
              <span
                className="text-[9.5px] font-semibold px-1.5 py-0.5 rounded-md"
                style={{ color: dc.text, background: dc.bg }}
              >
                {dc.label}
              </span>
            )}
          </div>

          {/* Agent + Campaign option */}
          {(agentName || campaignOpt) && (
            <div className="flex items-center gap-2 flex-wrap mb-1.5">
              {agentName && (
                <span className="text-[9.5px] text-slate-500 flex items-center gap-0.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-300 inline-block" />
                  {agentName}
                </span>
              )}
              {campaignOpt && (
                <span className="text-[9.5px] text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded-md">
                  {campaignOpt}
                </span>
              )}
            </div>
          )}

          {/* Notes preview */}
          {noteText && (
            <p className="text-[9.5px] text-slate-500 leading-tight line-clamp-2 mb-1.5 italic border-l border-slate-200 pl-1.5">
              {noteText}
            </p>
          )}

          {/* Duration + Follow-up */}
          <div className="flex items-center gap-2 flex-wrap">
            {dur != null && (
              <span className="flex items-center gap-1 text-[9.5px] text-slate-400 font-mono">
                <Clock className="w-2.5 h-2.5 shrink-0" />
                {fmtTime(dur)}
              </span>
            )}
            {followUp && (
              <span className="flex items-center gap-1 text-[9.5px] text-amber-600 font-medium">
                <CalendarIcon className="w-2.5 h-2.5 shrink-0" />
                {fmtDate(followUp)}
              </span>
            )}
          </div>

          {/* Linked-call badges */}
          {((call as any).relatedCallId || linkedFromId) && (
            <div className="flex items-center gap-1 flex-wrap mt-1.5">
              {(call as any).relatedCallId && (
                <span className="inline-flex items-center gap-0.5 text-[10.5px] font-semibold px-1.5 py-0.5 rounded-md bg-violet-50 text-violet-600">
                  <Link2 className="w-3 h-3 shrink-0" />
                  Linked to #{(call as any).relatedCallId}
                </span>
              )}
              {linkedFromId && (
                <span className="inline-flex items-center gap-0.5 text-[10.5px] font-semibold px-1.5 py-0.5 rounded-md bg-violet-50 text-violet-500">
                  <Link2 className="w-3 h-3 shrink-0" />← from #{linkedFromId}
                </span>
              )}
            </div>
          )}
        </button>

        {/* Peek action row — always visible on non-active cards, below the card */}
        {!isActive && onPeek && (
          <button
            type="button"
            onClick={onPeek}
            className="w-full flex items-center justify-center gap-1.5 mb-1.5 h-6 rounded-lg border border-slate-100 bg-slate-50 hover:bg-green-50 hover:border-[#008f68]/30 hover:text-[#008f68] text-slate-400 text-[9.5px] font-medium transition-all"
          >
            <Eye className="w-3 h-3" />
            Preview
          </button>
        )}
      </div>
    </div>
  );
}

// ── Main Drawer ───────────────────────────────────────────────────────────────

export function CustomerTimelineDrawer({
  open,
  onClose,
  returnToLabel,
  onBackToReturn,
  group,
  selectedCall,
  onSelectCall,
  editFormData,
  setEditFormData,
  attachmentFiles,
  setAttachmentFiles,
  savedAttachments,
  onAttachmentsChange,
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
  showSuccessToast,
  onSuccessToastDismiss,
  showErrorToast,
  errorToastMessage,
  onErrorToastDismiss,
}: CustomerTimelineDrawerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioCurrentTime, setAudioCurrentTime] = useState(0);
  const [audioDuration, setAudioDuration] = useState<number | null>(null);
  const [audioError, setAudioError] = useState(false);
  const [audioBlobUrl, setAudioBlobUrl] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  // ── Call Linking states ───────────────────────────────────────────────────
  const [showCallLinker, setShowCallLinker] = useState(false);
  const [customerCallsCache, setCustomerCallsCache] = useState<Ticket[]>([]);
  const [loadingCustomerCalls, setLoadingCustomerCalls] = useState(false);
  const [selectedLinkCall, setSelectedLinkCall] = useState<Ticket | null>(null);
  const [importChecklist, setImportChecklist] = useState({
    notes: false,
    campaign: false,
    yard: false,
    disposition: false,
    status: false,
    agent: false,
  });

  // ── Active ticket warning states ──────────────────────────────────────────
  const [activeTicketWarning, setActiveTicketWarning] = useState<{
    count: number;
    statuses: string[];
  } | null>(null);
  const [isClosingTicketWarning, setIsClosingTicketWarning] = useState(false);
  const [checkingTickets, setCheckingTickets] = useState(false);
  const [deleteConfirmUrl, setDeleteConfirmUrl] = useState<string | null>(null);

  // ── Call Peek Panel ───────────────────────────────────────────────────────
  const [peekCallId, setPeekCallId] = useState<number | null>(null);
  const { data: peekData, isLoading: isPeekLoading } = useSWR(
    peekCallId ? `/api/calls/${peekCallId}` : null,
    fetcher,
    { revalidateOnFocus: false },
  );
  const peekCall: Ticket | null =
    peekData?.success && peekData.data ? (peekData.data as Ticket) : null;

  const closeCallPeek = useCallback(() => setPeekCallId(null), []);
  useTicketPeekAircallExclusion(peekCallId !== null, closeCallPeek);

  // ── Sheet-anchored success toast ──────────────────────────────────────────
  // toastActive  → controls whether the element is in the DOM
  // toastVisible → controls the CSS transition (translate + opacity)
  const [toastActive, setToastActive] = useState(false);
  const [toastVisible, setToastVisible] = useState(false);
  const toastUnmountRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const dismissSuccessToast = useCallback(() => {
    setToastVisible(false);
    if (toastUnmountRef.current) clearTimeout(toastUnmountRef.current);
    toastUnmountRef.current = setTimeout(() => {
      setToastActive(false);
      onSuccessToastDismiss?.();
      toastUnmountRef.current = null;
    }, 300);
  }, [onSuccessToastDismiss]);

  useEffect(() => {
    if (!showSuccessToast) {
      // Trigger exit animation then unmount
      setToastVisible(false);
      const unmount = setTimeout(() => setToastActive(false), 300);
      return () => clearTimeout(unmount);
    }

    // Mount first (invisible), then animate in on the next two frames so the
    // browser has painted the initial translate-x-full / opacity-0 state.
    setToastActive(true);
    setToastVisible(false);
    const raf = requestAnimationFrame(() =>
      requestAnimationFrame(() => setToastVisible(true)),
    );

    // Auto-dismiss after 3 s
    const dismiss = setTimeout(() => {
      setToastVisible(false);
      setTimeout(() => {
        setToastActive(false);
        onSuccessToastDismiss?.();
      }, 300);
    }, 3000);

    return () => {
      cancelAnimationFrame(raf);
      clearTimeout(dismiss);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showSuccessToast]);

  // ── Sheet-anchored error toast ────────────────────────────────────────────
  const [errorToastActive, setErrorToastActive] = useState(false);
  const [errorToastVisible, setErrorToastVisible] = useState(false);
  const errorToastUnmountRef = useRef<ReturnType<typeof setTimeout> | null>(
    null,
  );

  const dismissErrorToast = useCallback(() => {
    setErrorToastVisible(false);
    if (errorToastUnmountRef.current) clearTimeout(errorToastUnmountRef.current);
    errorToastUnmountRef.current = setTimeout(() => {
      setErrorToastActive(false);
      onErrorToastDismiss?.();
      errorToastUnmountRef.current = null;
    }, 300);
  }, [onErrorToastDismiss]);

  const dismissSheetToasts = useCallback(() => {
    setToastVisible(false);
    setErrorToastVisible(false);
    if (toastUnmountRef.current) clearTimeout(toastUnmountRef.current);
    if (errorToastUnmountRef.current) clearTimeout(errorToastUnmountRef.current);
    const unmount = setTimeout(() => {
      setToastActive(false);
      setErrorToastActive(false);
      onSuccessToastDismiss?.();
      onErrorToastDismiss?.();
      toastUnmountRef.current = null;
      errorToastUnmountRef.current = null;
    }, 300);
    toastUnmountRef.current = unmount;
    errorToastUnmountRef.current = unmount;
  }, [onSuccessToastDismiss, onErrorToastDismiss]);

  const prevOpenRef = useRef(open);
  useEffect(() => {
    if (prevOpenRef.current && !open) {
      dismissSheetToasts();
    }
    prevOpenRef.current = open;
  }, [open, dismissSheetToasts]);

  useEffect(() => {
    if (!showErrorToast) {
      setErrorToastVisible(false);
      const unmount = setTimeout(() => setErrorToastActive(false), 300);
      return () => clearTimeout(unmount);
    }

    setErrorToastActive(true);
    setErrorToastVisible(false);
    const raf = requestAnimationFrame(() =>
      requestAnimationFrame(() => setErrorToastVisible(true)),
    );

    const dismiss = setTimeout(() => {
      setErrorToastVisible(false);
      setTimeout(() => {
        setErrorToastActive(false);
        onErrorToastDismiss?.();
      }, 300);
    }, 4000);

    return () => {
      cancelAnimationFrame(raf);
      clearTimeout(dismiss);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showErrorToast]);

  // Effect to handle exit animation for ticket warning
  useEffect(() => {
    if (isClosingTicketWarning) {
      const timer = setTimeout(() => {
        setActiveTicketWarning(null);
        setIsClosingTicketWarning(false);
      }, 200); // Match animation duration
      return () => clearTimeout(timer);
    }
  }, [isClosingTicketWarning]);

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
    // Reset linker state and scroll to top when switching calls
    setShowCallLinker(false);
    setSelectedLinkCall(null);
    setCustomerCallsCache([]);
    scrollRef.current?.scrollTo({ top: 0 });
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

  const customerAllCallsUrl = useMemo(() => {
    if (!open || !group?.customerId) return null;
    const params = new URLSearchParams({
      mode: "page",
      customerId: String(group.customerId),
      limit: "200",
    });
    return `/api/calls?${params.toString()}`;
  }, [open, group?.customerId]);

  const { data: customerAllCallsData } = useSWR(customerAllCallsUrl, fetcher, {
    revalidateOnFocus: false,
  });

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

  const customerTotalCalls = useMemo(() => {
    if (customerAllCallsData?.success && Array.isArray(customerAllCallsData.data?.data)) {
      return customerAllCallsData.data.data.length;
    }
    if (customerAllCallsData?.success && Array.isArray(customerAllCallsData.data)) {
      return customerAllCallsData.data.length;
    }
    if (group?.customerId) return 0;
    return allCalls.length || group?.calls.length || 0;
  }, [customerAllCallsData, group?.customerId, allCalls.length, group?.calls?.length]);

  const canLinkCalls = customerTotalCalls > 1;
  const linkCallsDisabledReason =
    "This customer only has one call — linking is not available.";

  // Overdue calls from this customer that could be linked to the current call
  const overdueCallsSuggestions = useMemo(
    () =>
      allCalls.filter(
        (c) =>
          c.id !== selectedCall?.id &&
          (c as any).status?.toString().toUpperCase() === CallStatus.OVERDUE,
      ),
    [allCalls, selectedCall?.id],
  );

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

  const isCallbackDisposition =
    editFormData.disposition === CallDisposition.CALLBACK_REQUIRED ||
    editFormData.disposition === CallDisposition.CALLBACK_SCHEDULED;

  const raw = selectedCall as any;
  const durationSec =
    raw?.duration ??
    (editFormData.duration ? parseInt(editFormData.duration) : null);
  const recordingUrl = raw?.recordingUrl || editFormData.recordingUrl;
  const voicemailUrl = raw?.voicemailUrl || editFormData.voicemailUrl;
  // A call is treated as a voicemail when the direction says so OR there's
  // only a voicemail asset (no real recording). Drives both the section
  // label ("Voicemail" vs "Recording") and the "Open in browser" link.
  const isVoicemailCall =
    String(raw?.direction || "").toUpperCase() === "VOICEMAIL" ||
    (!recordingUrl && !!voicemailUrl);
  const audioUrl = isVoicemailCall
    ? voicemailUrl || recordingUrl
    : recordingUrl || voicemailUrl;
  const audioOpenUrl = isVoicemailCall
    ? voicemailUrl || recordingUrl
    : recordingUrl || voicemailUrl;
  const audioSectionLabel = isVoicemailCall ? "Voicemail" : "Recording";
  const audioMissingTitle = isVoicemailCall
    ? "No voicemail available"
    : "No recording available";
  const audioErrorTitle = isVoicemailCall
    ? "Unable to play voicemail"
    : "Unable to play recording";
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
    if (!audio || !audioUrl) return;
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

  useEffect(() => {
    if (!canLinkCalls && showCallLinker) {
      setShowCallLinker(false);
      setSelectedLinkCall(null);
    }
  }, [canLinkCalls, showCallLinker]);

  // ── Call Linking helpers ──────────────────────────────────────────────────
  const handleOpenCallLinker = () => {
    if (!canLinkCalls) return;
    setShowCallLinker(true);
    setSelectedLinkCall(null);
    scrollRef.current?.scrollTo({ top: 0, behavior: "smooth" });
    // Use already-loaded call history (from SWR or group.calls fallback)
    setCustomerCallsCache(allCalls.filter((c) => c.id !== selectedCall?.id));
  };

  const handleRemoveLink = () => {
    const orig = selectedCall as any;
    setEditFormData({
      ...editFormData,
      relatedCallId: "",
      notes: orig?.notes || "",
      campaignId: orig?.campaignId ? String(orig.campaignId) : "",
      campaignOption: orig?.campaignOption || "",
      yardId: orig?.yardId ? String(orig.yardId) : "",
      disposition: orig?.disposition || "",
      status: orig?.status || "",
      agentId: orig?.agentId ? String(orig.agentId) : "",
      followUpDueDate: orig?.followUpDueDate || "",
      followUpAssignedToId: orig?.followUpAssignedToId
        ? String(orig.followUpAssignedToId)
        : "",
      phoneLineId: orig?.phoneLineId ? String(orig.phoneLineId) : "",
      direction: orig?.direction || "inbound",
      originalDirection: orig?.originalDirection || "",
    });
    onUpdate("");
  };

  const handleLinkCall = () => {
    if (!selectedLinkCall) return;
    const target = selectedLinkCall as any;
    const newFormData: CreateTicketFormData = {
      ...editFormData,
      relatedCallId: String(target.id),
      ...(importChecklist.notes && target.notes ? { notes: target.notes } : {}),
      ...(importChecklist.campaign && target.campaignId
        ? {
            campaignId: String(target.campaignId),
            campaignOption: target.campaignOption || "",
          }
        : {}),
      ...(importChecklist.yard && target.yardId
        ? { yardId: String(target.yardId) }
        : {}),
      ...(importChecklist.disposition && target.disposition
        ? { disposition: target.disposition }
        : {}),
      ...(importChecklist.status && target.status
        ? { status: target.status }
        : {}),
      ...(importChecklist.agent && target.agentId
        ? { agentId: String(target.agentId) }
        : {}),
    };
    setEditFormData(newFormData);
    setShowCallLinker(false);
    setSelectedLinkCall(null);
    setImportChecklist({
      notes: false,
      campaign: false,
      yard: false,
      disposition: false,
      status: false,
      agent: false,
    });
    onUpdate(String(target.id), newFormData);
  };

  const handleEscalateClick = async () => {
    const customerIdForCheck =
      editFormData.customerId?.trim() ||
      (group?.customerId != null ? String(group.customerId) : "") ||
      (selectedCall?.customerId != null ? String(selectedCall.customerId) : "") ||
      (selectedCall?.customer &&
      typeof selectedCall.customer === "object" &&
      "id" in selectedCall.customer
        ? String((selectedCall.customer as { id: number | string }).id)
        : "");

    if (!customerIdForCheck) {
      onCreateTicket?.();
      return;
    }
    try {
      setCheckingTickets(true);
      const res = await fetch(
        `/api/tickets?mode=page&customerId=${customerIdForCheck}&limit=50`,
      );

      // ✅ Validar respuesta HTTP
      if (!res.ok) {
        console.error(
          `[CustomerTimelineDrawer] API error fetching tickets: ${res.status} ${res.statusText}`,
        );
        onCreateTicket?.();
        return;
      }

      const result = await res.json();

      if (!result.success) {
        console.error(
          `[CustomerTimelineDrawer] API returned failure:`,
          result.message,
        );
        onCreateTicket?.();
        return;
      }

      const raw = result.data;
      const tickets = Array.isArray(raw) ? raw : (raw?.data ?? []);

      console.log(
        `[CustomerTimelineDrawer] Found ${tickets.length} tickets for customer ${customerIdForCheck}`,
      );

      const active = tickets.filter(
        (t: any) => t.status !== "CLOSED" && t.status !== "RESOLVED",
      );

      console.log(
        `[CustomerTimelineDrawer] Found ${active.length} active tickets with statuses:`,
        active.map((t: any) => t.status),
      );

      if (active.length > 0) {
        const fmtLabel = (v: string) =>
          v
            .replace(/_/g, " ")
            .toLowerCase()
            .replace(/\b\w/g, (c) => c.toUpperCase());
        const statuses = [
          ...new Set(active.map((t: any) => fmtLabel(t.status))),
        ] as string[];
        setActiveTicketWarning({ count: active.length, statuses });
      } else {
        onCreateTicket?.();
      }
    } catch (error) {
      console.error(
        `[CustomerTimelineDrawer] Error checking active tickets:`,
        error,
      );
      onCreateTicket?.();
    } finally {
      setCheckingTickets(false);
    }
  };

  // ── File Upload Handlers ─────────────────────────────────────────────────────

  const handleFileSelect = async (file: File) => {
    // Validate file size (max 10MB)
    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      alert("File size exceeds 10MB limit");
      return;
    }

    // Validate file type
    const validTypes = [
      "image/svg+xml",
      "image/png",
      "image/jpeg",
      "application/pdf",
    ];
    if (!validTypes.includes(file.type)) {
      alert("Invalid file type. Please upload SVG, PNG, JPG, or PDF");
      return;
    }

    // Add to local state
    const currentFiles = attachmentFiles || [];
    setAttachmentFiles([...currentFiles, file]);

    // Upload to backend if we have a call ID
    if (selectedCall?.id) {
      try {
        const formData = new FormData();
        formData.append("file", file);

        const token =
          (typeof document !== "undefined" &&
            document.cookie
              .split("; ")
              .find((r) => r.startsWith("auth-token="))
              ?.split("=")[1]) ||
          (typeof window !== "undefined" &&
            localStorage.getItem("auth_token")) ||
          null;

        const res = await fetch(
          `${BACKEND_API_URL}/calls/${selectedCall.id}/attachments`,
          {
            method: "POST",
            body: formData,
            headers: token ? { Authorization: `Bearer ${token}` } : {},
          },
        );

        if (!res.ok) {
          throw new Error(`Upload failed: ${res.status}`);
        }

        const result = await res.json();
        console.log("[CustomerTimelineDrawer] File uploaded:", result);
        // Sync savedAttachments so the new file appears in the list immediately
        // and is preserved if the user subsequently deletes another attachment.
        onAttachmentsChange?.(result.attachments ?? []);
      } catch (error) {
        console.error("[CustomerTimelineDrawer] File upload error:", error);
        alert("Failed to upload file. Please try again.");
        // Remove from local state on error
        setAttachmentFiles(currentFiles.filter((_, idx) => _ !== file));
      }
    }
  };

  const removeFile = (index: number) => {
    const currentFiles = attachmentFiles || [];
    setAttachmentFiles(currentFiles.filter((_, idx) => idx !== index));
  };

  const removeSavedAttachment = (url: string) => {
    setDeleteConfirmUrl(url);
  };

  const executeDeleteAttachment = async (url: string) => {
    if (!selectedCall?.id) return;

    try {
      const token =
        (typeof document !== "undefined" &&
          document.cookie
            .split("; ")
            .find((r) => r.startsWith("auth-token="))
            ?.split("=")[1]) ||
        (typeof window !== "undefined" && localStorage.getItem("auth_token")) ||
        null;

      const encodedUrl = encodeURIComponent(url);
      const res = await fetch(
        `${BACKEND_API_URL}/calls/${selectedCall.id}/attachments/${encodedUrl}`,
        {
          method: "DELETE",
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        },
      );

      if (!res.ok) throw new Error(`Delete failed: ${res.status}`);

      const data = await res.json();
      onAttachmentsChange?.(data.attachments ?? []);
    } catch (error) {
      console.error("[CustomerTimelineDrawer] Delete error:", error);
      alert("Failed to delete attachment. Please try again.");
    }
  };

  const handleDownloadSavedAttachment = async (
    url: string,
    filename: string,
  ) => {
    if (!selectedCall?.id) {
      alert("Call ID is missing");
      return;
    }

    try {
      const token =
        (typeof document !== "undefined" &&
          document.cookie
            .split("; ")
            .find((r) => r.startsWith("auth-token="))
            ?.split("=")[1]) ||
        (typeof window !== "undefined" && localStorage.getItem("auth_token")) ||
        null;

      // Ask backend for a presigned S3 URL, then open it directly (no CORS issue)
      const encodedUrl = encodeURIComponent(url);
      const proxyUrl = `${BACKEND_API_URL}/calls/${selectedCall.id}/attachments/download/${encodedUrl}`;

      const res = await fetch(proxyUrl, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });

      if (!res.ok) {
        throw new Error(`Download failed: ${res.status}`);
      }

      const { signedUrl } = await res.json();

      // Open presigned URL directly — browser handles the download
      const link = document.createElement("a");
      link.href = signedUrl;
      link.download = filename;
      link.target = "_blank";
      link.click();

      console.log("[CustomerTimelineDrawer] File downloaded:", filename);
    } catch (error) {
      console.error("[CustomerTimelineDrawer] Download error:", error);
      alert("Failed to download file. Please try again.");
    }
  };

  return (
    <>
      {/* ── Call Peek Panel ───────────────────────────────────────────────────
          Read-only view of another call from the same customer's history.
          Renders in the gap to the left of the Side Sheet.
      ── */}
      <CallPeekPanel
        call={peekCall}
        isLoading={peekCallId !== null && isPeekLoading}
        onClose={() => setPeekCallId(null)}
        onLink={
          canLinkCalls &&
          peekCall &&
          selectedCall &&
          peekCall.id !== selectedCall.id
            ? () => {
                setCustomerCallsCache(
                  allCalls.filter((c) => c.id !== selectedCall?.id),
                );
                setSelectedLinkCall(peekCall as Ticket);
                setShowCallLinker(true);
                scrollRef.current?.scrollTo({ top: 0, behavior: "smooth" });
                setPeekCallId(null);
              }
            : undefined
        }
      />

      {/* ── Sheet-anchored error toast ───────────────────────────────────── */}
      {open && errorToastActive && (
        <div
          role="alert"
          aria-live="assertive"
          className={cn(
            "fixed z-50 flex items-center gap-3",
            "bg-white rounded-xl border border-slate-200/80",
            "shadow-[0_10px_15px_-3px_rgba(0,0,0,0.10),0_4px_6px_-4px_rgba(0,0,0,0.10),inset_4px_0_0_0_#ef4444]",
            "px-4 py-3 min-w-65 max-w-80",
            "transition-all duration-300 ease-out",
            errorToastVisible
              ? "translate-x-0 opacity-100"
              : "translate-x-4 opacity-0",
          )}
          style={{
            right: "calc(min(80svw, 1100px) + 1rem)",
            bottom: "4.5rem",
          }}
        >
          <div className="w-7 h-7 rounded-full bg-red-100 flex items-center justify-center shrink-0">
            <AlertCircle className="w-3.5 h-3.5 text-red-600" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[13px] font-semibold text-slate-800 leading-tight">
              Error
            </p>
            <p className="text-[11px] text-slate-500 mt-0.5">
              {errorToastMessage ?? "Failed to save changes"}
            </p>
          </div>
          <button
            type="button"
            aria-label="Dismiss notification"
            onClick={dismissErrorToast}
            className="shrink-0 w-5 h-5 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <X className="w-3 h-3" />
          </button>
        </div>
      )}

      {/* ── Sheet-anchored success toast ─────────────────────────────────────
          Positioned just outside the left edge of the Sheet panel so it never
          overlaps the "Save Changes" button.  z-40 keeps it below z-50 of the
          Sheet, giving the illusion that it slides out from behind the panel.
      ── */}
      {open && toastActive && (
        <div
          role="alert"
          aria-live="polite"
          className={cn(
            // fixed, same z-level as the Sheet so it sits above page content
            "fixed z-50 flex items-center gap-3",
            "bg-white rounded-xl border border-slate-200/80",
            // Combined shadow: shadow-lg drop + 4 px inset green accent bar
            "shadow-[0_10px_15px_-3px_rgba(0,0,0,0.10),0_4px_6px_-4px_rgba(0,0,0,0.10),inset_4px_0_0_0_#22c55e]",
            "px-4 py-3 min-w-65 max-w-80",
            "transition-all duration-300 ease-out",
            // Subtle slide: appears to emerge from the sheet's left edge
            toastVisible
              ? "translate-x-0 opacity-100"
              : "translate-x-4 opacity-0",
          )}
          style={{
            // right-full equivalent: sheet width + mr-4 (1 rem gap)
            right: "calc(min(80svw, 1100px) + 1rem)",
            // bottom-4: visually aligns with the Save Changes footer
            bottom: "1rem",
          }}
        >
          <div className="w-7 h-7 rounded-full bg-green-100 flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-3.5 h-3.5 text-green-600" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[13px] font-semibold text-slate-800 leading-tight">
              Saved
            </p>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Call updated successfully
            </p>
          </div>
          <button
            type="button"
            aria-label="Dismiss notification"
            onClick={dismissSuccessToast}
            className="shrink-0 w-5 h-5 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <X className="w-3 h-3" />
          </button>
        </div>
      )}

      <Sheet
        open={open}
        onOpenChange={(v) => {
          if (!v) {
            dismissSheetToasts();
            setAttachmentFiles([]);
            onClose();
          }
        }}
      >
        <SheetContent
          side="right"
          className="w-svw sm:w-[80vw] p-0 flex flex-col bg-[#f4f5f7] [&>button.absolute]:hidden overflow-hidden border-l border-slate-200/80"
          style={{ maxWidth: "1100px" }}
          onPointerDownOutside={(e) => {
            if (shouldIgnoreTicketSheetOutsideEvent(e)) {
              e.preventDefault();
            }
          }}
          onFocusOutside={(e) => {
            if (shouldIgnoreTicketSheetOutsideEvent(e)) {
              e.preventDefault();
            }
          }}
          onInteractOutside={(e) => {
            if (shouldIgnoreTicketSheetOutsideEvent(e)) {
              e.preventDefault();
            }
          }}
        >
          <SheetTitle className="sr-only">
            {customerName ? `Call Center — ${customerName}` : "Call Center"}
          </SheetTitle>

          {/* ══ HEADER ══════════════════════════════════════════════════════════ */}
          <div className="shrink-0 bg-white border-b border-slate-100">
            {onBackToReturn && returnToLabel ? (
              <div className="border-b border-[#008f68]/15 bg-[#f0faf5] px-4 py-2.5">
                <button
                  type="button"
                  onClick={onBackToReturn}
                  className="inline-flex max-w-full items-center gap-2 rounded-lg border border-[#008f68]/25 bg-white px-3 py-2 text-left text-[12px] font-semibold text-[#008f68] shadow-sm transition-colors hover:border-[#008f68]/45 hover:bg-[#e8faf0]"
                >
                  <ArrowLeft className="h-4 w-4 shrink-0" strokeWidth={2.25} />
                  <span className="truncate">{returnToLabel}</span>
                </button>
              </div>
            ) : null}
            {/* Row 1: avatar · name+phone · note-trigger · call-count · actions */}
            <div className="flex items-center gap-3 px-4 py-2">
              {/* 1. Avatar */}
              <div
                className="w-10 h-10 rounded-2xl flex items-center justify-center text-[13px] font-extrabold text-white shrink-0 shadow-sm ring-2 ring-white"
                style={{
                  background: `hsl(${(customerName?.charCodeAt(0) ?? 180) % 360} 50% 44%)`,
                }}
              >
                {customerName
                  ? customerName.substring(0, 2).toUpperCase()
                  : "?"}
              </div>

              {/* 2. Text block: name (top) + phone (bottom) */}
              <div className="min-w-0 shrink">
                <p className="text-[15px] font-bold text-slate-900 leading-none truncate">
                  {customerName || "Unknown"}
                </p>
                <p className="text-[11.5px] text-slate-400 font-mono mt-0.5 leading-none">
                  {customerPhone}
                </p>
              </div>

              {/* Context indicators: note trigger + call count */}
              <div className="flex items-center gap-2 shrink-0">
                {/* Call count badge */}
                <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-[#008f68] bg-[#008f68]/8 px-2 py-0.5 rounded-full">
                  <PhoneCall className="w-2.5 h-2.5" />
                  {isLoadingHistory ? (
                    <Loader2 className="w-2.5 h-2.5 animate-spin" />
                  ) : (
                    `${callCount} call${callCount !== 1 ? "s" : ""}`
                  )}
                </span>
              </div>

              {/* Action buttons */}
              <div className="ml-auto flex items-center gap-1.5 shrink-0">
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
                {selectedCall && (
                  <button
                    type="button"
                    onClick={handleOpenCallLinker}
                    disabled={!canLinkCalls}
                    title={!canLinkCalls ? linkCallsDisabledReason : undefined}
                    className={`flex items-center gap-1.5 h-8 px-3.5 text-[12px] font-semibold rounded-xl border transition-all shadow-sm active:scale-95 disabled:cursor-not-allowed disabled:opacity-45 disabled:hover:bg-white disabled:hover:text-slate-600 disabled:hover:border-slate-200 ${
                      showCallLinker || !!editFormData.relatedCallId
                        ? "bg-[#008f68]/10 text-[#008f68] border-[#008f68]/50 hover:bg-[#008f68]/20 hover:border-[#008f68]/70"
                        : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50 hover:text-[#008f68] hover:border-[#008f68]/40"
                    }`}
                  >
                    <Link2 className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">
                      {editFormData.relatedCallId ? "Linked" : "Link"}
                    </span>
                  </button>
                )}
                {onCreateTicket && (
                  <button
                    type="button"
                    onClick={handleEscalateClick}
                    disabled={checkingTickets}
                    className="flex items-center gap-1.5 h-8 px-3.5 bg-slate-900 hover:bg-slate-700 active:scale-95 disabled:opacity-50 text-white text-[12px] font-semibold rounded-xl transition-all shadow-sm"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">
                      {checkingTickets ? "Checking..." : "Escalate"}
                    </span>
                  </button>
                )}
              </div>
            </div>

            {/* Row 2: Unified metadata bar — badges + technical details */}
            {selectedCall &&
              (() => {
                const startTime = raw?.startedAt || editFormData.startedAt;
                const answeredTime = raw?.answeredAt || editFormData.answeredAt;
                let ringDisplay: string | null = null;
                if (startTime && answeredTime) {
                  const secs = Math.round(
                    (new Date(answeredTime).getTime() -
                      new Date(startTime).getTime()) /
                      1000,
                  );
                  if (secs > 0)
                    ringDisplay =
                      secs < 60
                        ? `${secs}s`
                        : `${Math.floor(secs / 60)}:${String(secs % 60).padStart(2, "0")}`;
                }

                const techItems: Array<{
                  key: string;
                  icon: React.ReactNode;
                  label: string;
                  value: string;
                  mono?: boolean;
                }> = [
                  ...(raw?.aircallId
                    ? [
                        {
                          key: "aircall",
                          icon: (
                            <Hash className="w-3 h-3 text-gray-400 shrink-0" />
                          ),
                          label: "Aircall ID",
                          value: String(raw.aircallId),
                          mono: true,
                        },
                      ]
                    : []),
                  ...(phoneLine !== "—"
                    ? [
                        {
                          key: "line",
                          icon: (
                            <Phone className="w-3 h-3 text-gray-400 shrink-0" />
                          ),
                          label: "Line",
                          value: phoneLine,
                          mono: false,
                        },
                      ]
                    : []),
                  ...(ringDisplay
                    ? [
                        {
                          key: "ring",
                          icon: (
                            <Timer className="w-3 h-3 text-gray-400 shrink-0" />
                          ),
                          label: "Ring Time",
                          value: ringDisplay,
                          mono: true,
                        },
                      ]
                    : []),
                ];

                return (
                  <div className="flex items-center gap-1.5 px-4 pb-2 flex-wrap">
                    {/* — Badges group — */}
                    <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-slate-600 bg-slate-50 border border-slate-200 px-2.5 py-1 rounded-lg cursor-default">
                      <Hash className="w-3 h-3 text-slate-400" />
                      Call ID #{selectedCall.id}
                    </span>
                    <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-slate-600 bg-slate-50 border border-slate-200 px-2.5 py-1 rounded-lg cursor-default">
                      <Clock className="w-3 h-3 text-slate-400" />
                      {fmtDateTime(
                        selectedCall.callDate || selectedCall.createdAt,
                      )}
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

                    {/* — Separator — */}
                    {techItems.length > 0 && (
                      <span className="border-l border-slate-200 h-4 mx-1 shrink-0" />
                    )}

                    {/* — Technical details group — */}
                    {techItems.map((item, i) => (
                      <span key={item.key} className="inline-flex items-center">
                        {i > 0 && (
                          <span className="border-l border-gray-200 h-3.5 mx-2 shrink-0" />
                        )}
                        <span className="flex items-center gap-1">
                          {item.icon}
                          <span className="text-[11px] font-medium text-gray-400">
                            {item.label}:
                          </span>
                          <span
                            className={`text-[11px] text-gray-600 ${
                              item.mono ? "font-mono" : ""
                            }`}
                          >
                            {item.value}
                          </span>
                        </span>
                      </span>
                    ))}
                  </div>
                );
              })()}
          </div>

          {/* ══ BODY ════════════════════════════════════════════════════════════ */}
          <div className="flex-1 overflow-hidden min-h-0 flex">
            {/* ── MAIN AREA (~70%) ─────────────────────────────────────────────── */}
            <main className="flex-1 overflow-hidden flex flex-col min-h-0">
              <div
                ref={scrollRef}
                className="flex-1 overflow-y-auto [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:bg-slate-200 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-track]:bg-transparent"
              >
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
                  <div className="pt-1 px-4 pb-4 space-y-3">
                    {/* ── Active ticket warning — full-width banner ── */}
                    {activeTicketWarning && (
                      <div
                        className={`w-full flex flex-row items-center justify-between px-5 py-3 bg-white rounded-2xl border border-amber-300 shadow-sm ${
                          isClosingTicketWarning
                            ? "animate-out fade-out slide-out-to-top-2 duration-200"
                            : "animate-in fade-in slide-in-from-top-2 duration-200"
                        }`}
                      >
                        {/* Left block: Information */}
                        <div className="flex flex-col gap-1">
                          {/* Title with icon */}
                          <div className="flex items-center gap-2">
                            <div className="w-5 h-5 rounded-lg bg-amber-100 flex items-center justify-center shrink-0">
                              <AlertCircle className="w-3 h-3 text-amber-600" />
                            </div>
                            <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                              Active Ticket Alert
                            </span>
                          </div>
                          {/* Main message */}
                          <p className="text-[12px] font-semibold text-slate-800">
                            This customer has {activeTicketWarning.count}{" "}
                            {activeTicketWarning.count === 1
                              ? "active ticket"
                              : "active tickets"}
                          </p>
                          {/* Status */}
                          <p className="text-[11px] text-slate-600">
                            Status:{" "}
                            <span className="font-medium text-slate-700">
                              {activeTicketWarning.statuses.join(", ")}
                            </span>
                          </p>
                        </div>

                        {/* Right block: Actions */}
                        <div className="flex gap-3 shrink-0">
                          <button
                            type="button"
                            onClick={() => {
                              setIsClosingTicketWarning(true);
                              onCreateTicket?.();
                            }}
                            className="px-3 py-2 text-[11px] font-semibold bg-amber-600 hover:bg-amber-700 text-white rounded-lg transition-colors shadow-xs whitespace-nowrap"
                          >
                            Create Anyway
                          </button>
                          <button
                            type="button"
                            onClick={() => setIsClosingTicketWarning(true)}
                            className="px-3 py-2 text-[11px] font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors whitespace-nowrap"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    )}

                    {/* ── Overdue Call Link Recommendation ── */}
                    {canLinkCalls &&
                      overdueCallsSuggestions.length > 0 &&
                      !editFormData.relatedCallId &&
                      !showCallLinker && (
                        <div className="flex items-start gap-3 px-4 py-3 bg-red-50 border border-red-200/70 rounded-2xl animate-in fade-in slide-in-from-top-2 duration-200">
                          <div className="w-6 h-6 rounded-lg bg-red-100 flex items-center justify-center shrink-0 mt-0.5">
                            <AlertCircle className="w-3.5 h-3.5 text-red-500" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-[11px] font-bold text-red-700 uppercase tracking-wider mb-0.5">
                              Overdue Callback Detected
                            </p>
                            <p className="text-[11px] text-red-600 leading-snug">
                              This customer has{" "}
                              {overdueCallsSuggestions.length === 1
                                ? `1 overdue call (Call #${overdueCallsSuggestions[0].id})`
                                : `${overdueCallsSuggestions.length} overdue calls`}{" "}
                              pending. Consider linking this call to the
                              previous overdue callback.
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedLinkCall(overdueCallsSuggestions[0]);
                              handleOpenCallLinker();
                            }}
                            className="shrink-0 px-3 py-1.5 text-[11px] font-semibold bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors whitespace-nowrap active:scale-[0.97]"
                          >
                            Link Now
                          </button>
                        </div>
                      )}

                    {/* ── Call Linker (inline panel) ── */}
                    {showCallLinker && (
                      <div className="bg-white rounded-2xl border border-slate-100 shadow-[0_1px_3px_rgba(0,0,0,0.06)] overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                        <div className="flex items-center gap-2 px-4 pt-3 pb-2.5 border-b border-slate-100">
                          <div className="w-6 h-6 rounded-lg bg-[#008f68]/10 flex items-center justify-center shrink-0">
                            <Link2 className="w-3.5 h-3.5 text-[#008f68]" />
                          </div>
                          <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wider flex-1">
                            Link Related Call
                          </span>
                          <button
                            type="button"
                            onClick={() => {
                              setShowCallLinker(false);
                              setSelectedLinkCall(null);
                            }}
                            className="w-6 h-6 flex items-center justify-center rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                        <div className="max-h-52 overflow-y-auto">
                          {isLoadingHistory ? (
                            <div className="flex items-center justify-center py-6">
                              <Loader2 className="w-4 h-4 animate-spin text-slate-300" />
                            </div>
                          ) : customerCallsCache.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-6 gap-1.5 text-slate-300">
                              <PhoneCall className="w-5 h-5" />
                              <span className="text-[11px]">
                                No other calls found
                              </span>
                            </div>
                          ) : (
                            customerCallsCache.map((call) => {
                              const isSelected =
                                selectedLinkCall?.id === call.id;
                              const dir = dirStyle(
                                (call.direction || "inbound").toString(),
                                !!(call as any).missedCallReason,
                              );
                              return (
                                <button
                                  key={call.id}
                                  type="button"
                                  onClick={() =>
                                    setSelectedLinkCall(
                                      isSelected ? null : call,
                                    )
                                  }
                                  className={`w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors ${
                                    isSelected
                                      ? "bg-[#008f68]/5 border-l-2 border-[#008f68]"
                                      : "hover:bg-slate-50 border-l-2 border-transparent"
                                  }`}
                                >
                                  <div
                                    className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
                                    style={{ background: dir.color + "15" }}
                                  >
                                    {(call.direction || "inbound")
                                      .toString()
                                      .toLowerCase() === "outbound" ? (
                                      <PhoneOutgoing
                                        className="w-3.5 h-3.5"
                                        style={{ color: dir.color }}
                                      />
                                    ) : (
                                      <PhoneCall
                                        className="w-3.5 h-3.5"
                                        style={{ color: dir.color }}
                                      />
                                    )}
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <p className="text-[12px] font-semibold text-slate-700 truncate">
                                      Call #{call.id}
                                    </p>
                                    <p className="text-[10px] text-slate-400 font-mono">
                                      {fmtDateTime(
                                        call.callDate || call.createdAt,
                                      )}
                                    </p>
                                  </div>
                                  {isSelected && (
                                    <Check className="w-3.5 h-3.5 text-[#008f68] shrink-0" />
                                  )}
                                </button>
                              );
                            })
                          )}
                        </div>
                        {selectedLinkCall && (
                          <div className="px-4 py-3 border-t border-slate-100 space-y-2">
                            <div className="flex items-center justify-between">
                              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                                Import from linked call
                              </p>
                              <button
                                type="button"
                                onClick={() => {
                                  const allSelected =
                                    Object.values(importChecklist).every(
                                      Boolean,
                                    );
                                  const next = {
                                    notes: !allSelected,
                                    campaign: !allSelected,
                                    yard: !allSelected,
                                    disposition: !allSelected,
                                    status: !allSelected,
                                    agent: !allSelected,
                                  };
                                  setImportChecklist(next);
                                }}
                                className="text-[9.5px] font-semibold text-[#008f68] hover:underline"
                              >
                                {Object.values(importChecklist).every(Boolean)
                                  ? "Deselect all"
                                  : "Select all"}
                              </button>
                            </div>
                            <div className="flex items-center gap-1.5 flex-wrap justify-center">
                              {(
                                [
                                  { key: "notes" as const, label: "Notes" },
                                  {
                                    key: "campaign" as const,
                                    label: "Campaign",
                                  },
                                  { key: "yard" as const, label: "Yard" },
                                  {
                                    key: "disposition" as const,
                                    label: "Disposition",
                                  },
                                  { key: "status" as const, label: "Status" },
                                  { key: "agent" as const, label: "Agent" },
                                ] as const
                              ).map(({ key, label }) => (
                                <button
                                  key={key}
                                  type="button"
                                  onClick={() =>
                                    setImportChecklist((p) => ({
                                      ...p,
                                      [key]: !p[key],
                                    }))
                                  }
                                  className={`flex items-center gap-1.5 px-2 py-0.5 rounded-lg text-[10.5px] font-semibold border transition-colors ${
                                    importChecklist[key]
                                      ? "bg-[#008f68]/8 border-[#008f68]/30 text-[#008f68]"
                                      : "bg-white border-slate-200 text-slate-500 hover:border-slate-300"
                                  }`}
                                >
                                  <div
                                    className={`w-3 h-3 rounded flex items-center justify-center border transition-colors ${
                                      importChecklist[key]
                                        ? "bg-[#008f68] border-[#008f68]"
                                        : "bg-white border-slate-300"
                                    }`}
                                  >
                                    {importChecklist[key] && (
                                      <Check className="w-2 h-2 text-white" />
                                    )}
                                  </div>
                                  {label}
                                </button>
                              ))}
                            </div>
                            <div className="flex gap-2 pt-1">
                              <button
                                type="button"
                                onClick={handleLinkCall}
                                className="flex-1 h-8 flex items-center justify-center gap-1.5 bg-[#008f68] hover:bg-[#007a5a] text-white text-[12px] font-semibold rounded-xl transition-all active:scale-[0.98]"
                              >
                                <Link2 className="w-3.5 h-3.5" />
                                Import &amp; Link
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  setShowCallLinker(false);
                                  setSelectedLinkCall(null);
                                }}
                                className="h-8 px-4 flex items-center justify-center text-[12px] font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition-all active:scale-[0.98]"
                              >
                                Cancel
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Linked Call Card — shown when relatedCallId is set and linker closed */}
                    {editFormData.relatedCallId && !showCallLinker && (
                      <div className="flex items-center gap-3 px-4 py-3 bg-white rounded-2xl border border-slate-100 shadow-[0_1px_3px_rgba(0,0,0,0.06)]">
                        <div className="w-8 h-8 rounded-xl bg-[#008f68]/10 flex items-center justify-center shrink-0">
                          <Link2 className="w-4 h-4 text-[#008f68]" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider leading-none mb-0.5">
                            Linked Call
                          </p>
                          <p className="text-[12px] font-semibold text-slate-700">
                            Call #{editFormData.relatedCallId}
                          </p>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={handleOpenCallLinker}
                            disabled={!canLinkCalls}
                            className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors disabled:cursor-not-allowed disabled:opacity-40"
                            title={
                              !canLinkCalls
                                ? linkCallsDisabledReason
                                : "Change linked call"
                            }
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={handleRemoveLink}
                            className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-500 transition-colors"
                            title="Remove link"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    )}

                    {/* ── Combined Call Details & Properties card ── */}
                    <section className="bg-white rounded-2xl border border-slate-100 shadow-[0_1px_3px_rgba(0,0,0,0.06)] overflow-hidden">
                      <div className="flex items-center gap-2 px-5 pt-3 pb-3 border-b border-slate-50">
                        <div className="w-6 h-6 rounded-lg bg-slate-100 flex items-center justify-center shrink-0">
                          <Hash className="w-3 h-3 text-slate-500" />
                        </div>
                        <span className="text-[12px] font-bold text-slate-700">
                          Call Details &amp; Properties
                        </span>
                      </div>

                      <div className="p-4">
                        {/* Row 1: Campaign + Yard — priority controls */}
                        <div className="grid grid-cols-2 gap-3 mb-3">
                          {/* Campaign */}
                          <div>
                            <InspLabel>Campaign</InspLabel>
                            <InspectorCombobox
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
                              searchPlaceholder="Search campaign…"
                              noneLabel="None"
                              items={campaigns.map((c) => ({
                                value: c.id.toString(),
                                label: c.nombre,
                              }))}
                            />
                          </div>

                          {/* Yard */}
                          <div>
                            <InspLabel>Yard</InspLabel>
                            <InspectorCombobox
                              value={editFormData.yardId || ""}
                              onChange={(v) =>
                                setEditFormData({ ...editFormData, yardId: v })
                              }
                              placeholder="Yard"
                              searchPlaceholder="Search yard…"
                              noneLabel="None"
                              items={yards.map((y) => ({
                                value: y.id.toString(),
                                label: y.name,
                              }))}
                            />
                          </div>
                        </div>

                        {/* Campaign Option (conditional) */}
                        {campaignOptionValues.length > 0 && (
                          <div className="mb-3">
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

                        {/* Disposition — BEFORE Status, colored pill trigger */}
                        <div className="mb-3">
                          <InspLabel>Disposition</InspLabel>
                          {(() => {
                            const dispKey = (editFormData.disposition || "")
                              .toString()
                              .toUpperCase();
                            const dispCfg = DISPOSITION_COLORS[dispKey] ?? null;
                            return (
                              <Select
                                value={editFormData.disposition || "none"}
                                onValueChange={(v) => {
                                  const newDisposition =
                                    v === "none" ? "" : v;
                                  setEditFormData({
                                    ...editFormData,
                                    disposition: newDisposition,
                                    ...(newDisposition ===
                                      CallDisposition.CALLBACK_REQUIRED ||
                                    newDisposition ===
                                      CallDisposition.CALLBACK_SCHEDULED
                                      ? {
                                          status:
                                            CallStatus.PENDING_FOLLOWUP,
                                        }
                                      : {}),
                                  });
                                }}
                              >
                                <SelectTrigger className="h-7 bg-slate-50 border-transparent hover:border-slate-300 focus:bg-white focus:ring-2 focus:ring-[#008f68]/20 focus:border-[#008f68] rounded-lg w-full transition-colors text-xs">
                                  {dispCfg ? (
                                    <span
                                      className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[11px] font-semibold"
                                      style={{
                                        background: dispCfg.bg,
                                        color: dispCfg.text,
                                      }}
                                    >
                                      <span
                                        className="w-1.5 h-1.5 rounded-full shrink-0"
                                        style={{ background: dispCfg.text }}
                                      />
                                      {dispCfg.label}
                                    </span>
                                  ) : (
                                    <SelectValue placeholder="Disposition" />
                                  )}
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="none">None</SelectItem>
                                  {Object.entries(DISPOSITION_COLORS).map(
                                    ([key, cfg]) => (
                                      <SelectItem key={key} value={key}>
                                        <span className="inline-flex items-center gap-1.5">
                                          <span
                                            className="w-2 h-2 rounded-full shrink-0"
                                            style={{ background: cfg.text }}
                                          />
                                          {cfg.label}
                                        </span>
                                      </SelectItem>
                                    ),
                                  )}
                                </SelectContent>
                              </Select>
                            );
                          })()}
                        </div>

                        {/* Status — toggle pill group */}
                        <div className="mb-3">
                          <InspLabel>Status</InspLabel>
                          <div className="grid grid-cols-4 gap-1.5 mt-1">
                            {Object.entries(STATUS_COLORS).map(([key, cfg]) => {
                              const isActive =
                                (editFormData.status || "")
                                  .toString()
                                  .toUpperCase() === key;
                              return (
                                <button
                                  key={key}
                                  type="button"
                                  onClick={() =>
                                    setEditFormData({
                                      ...editFormData,
                                      status: key as CallStatus,
                                    })
                                  }
                                  className={`h-8 text-[10px] font-semibold rounded-lg border transition-all leading-tight px-1 ${
                                    isActive
                                      ? "shadow-sm"
                                      : "bg-white border-slate-200 text-slate-500 hover:border-slate-300 hover:bg-slate-50"
                                  }`}
                                  style={
                                    isActive
                                      ? {
                                          background: cfg.bg,
                                          color: cfg.text,
                                          borderColor: cfg.text + "40",
                                        }
                                      : {}
                                  }
                                >
                                  {cfg.label}
                                </button>
                              );
                            })}
                          </div>
                        </div>

                        {/* Follow-up Date + Assignee — only visible when disposition = callback */}
                        {isCallbackDisposition && (
                          <div className="mb-3 grid grid-cols-2 gap-2.5 rounded-lg border border-amber-200/60 bg-amber-50/50 p-2.5">
                            <div>
                              <div className="mb-1 flex items-center gap-1.5">
                                <InspLabel>Follow-up</InspLabel>
                                <span className="rounded bg-amber-100 px-1 py-px text-[8px] font-bold uppercase tracking-wide text-amber-700">
                                  Callback
                                </span>
                              </div>
                              <FollowUpDateTimePicker
                                value={editFormData.followUpDueDate}
                                onChange={(iso) =>
                                  setEditFormData({
                                    ...editFormData,
                                    followUpDueDate: iso,
                                  })
                                }
                                placeholder="Date & time"
                              />
                            </div>

                            <div>
                              <InspLabel>Assignee</InspLabel>
                              <InspectorSelect
                                value={
                                  editFormData.followUpAssignedToId != null &&
                                  editFormData.followUpAssignedToId !== ""
                                    ? String(editFormData.followUpAssignedToId)
                                    : ""
                                }
                                onChange={(v) =>
                                  setEditFormData({
                                    ...editFormData,
                                    followUpAssignedToId: v,
                                  })
                                }
                                placeholder="Assign…"
                              >
                                <SelectItem value="none">Unassigned</SelectItem>
                                {(() => {
                                  const curId =
                                    editFormData.followUpAssignedToId != null &&
                                    editFormData.followUpAssignedToId !== ""
                                      ? String(
                                          editFormData.followUpAssignedToId,
                                        )
                                      : "";
                                  const inList = agents.some(
                                    (a) => a.id.toString() === curId,
                                  );
                                  const ghost =
                                    !inList &&
                                    curId &&
                                    (selectedCall as any)?.followUpAssignedTo
                                      ? (selectedCall as any).followUpAssignedTo
                                      : null;
                                  return (
                                    <>
                                      {ghost && (
                                        <SelectItem
                                          key={ghost.id}
                                          value={ghost.id.toString()}
                                        >
                                          {ghost.name}
                                        </SelectItem>
                                      )}
                                      {agents.map((a) => (
                                        <SelectItem
                                          key={a.id}
                                          value={a.id.toString()}
                                        >
                                          {a.name}
                                        </SelectItem>
                                      ))}
                                    </>
                                  );
                                })()}
                              </InspectorSelect>
                            </div>
                          </div>
                        )}

                        {/* Agent */}
                        <div>
                          <InspLabel>Agent</InspLabel>
                          {(() => {
                            const curId =
                              editFormData.agentId != null &&
                              editFormData.agentId !== ""
                                ? String(editFormData.agentId)
                                : "";
                            const inList = agents.some(
                              (a) => a.id.toString() === curId,
                            );
                            const ghost =
                              !inList && curId && (selectedCall as any)?.agent
                                ? (selectedCall as any).agent
                                : null;
                            const agentItems = [
                              ...(ghost
                                ? [
                                    {
                                      value: ghost.id.toString(),
                                      label: ghost.name,
                                    },
                                  ]
                                : []),
                              ...agents.map((a) => ({
                                value: a.id.toString(),
                                label: a.name,
                              })),
                            ];
                            return (
                              <InspectorCombobox
                                value={curId}
                                onChange={(v) =>
                                  setEditFormData({
                                    ...editFormData,
                                    agentId: v,
                                  })
                                }
                                placeholder="Unassigned"
                                searchPlaceholder="Search agent…"
                                noneLabel="Unassigned"
                                items={agentItems}
                              />
                            );
                          })()}
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
                          {audioSectionLabel}
                        </span>
                        {durationSec != null && (
                          <span className="text-[10px] font-mono text-slate-400">
                            {fmtTime(durationSec)}
                          </span>
                        )}
                      </div>

                      {audioUrl ? (
                        audioError ? (
                          <div className="px-5 pb-5">
                            <div className="flex items-center gap-3 bg-red-50 border border-red-100 rounded-xl px-4 py-3">
                              <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
                              <div className="flex-1 min-w-0">
                                <p className="text-[12px] font-semibold text-slate-700">
                                  {audioErrorTitle}
                                </p>
                                <a
                                  href={audioOpenUrl}
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
                                    seekTo(
                                      (e.clientX - rect.left) / rect.width,
                                    );
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
                                href={audioOpenUrl}
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
                              {audioMissingTitle}
                            </p>
                            <p className="text-[11px] text-slate-400">
                              {durationSec != null
                                ? `Lasted ${fmtTime(durationSec)}`
                                : isVoicemailCall
                                  ? "No voicemail asset attached"
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

                    {/* ── Attachments ── */}
                    <section className="bg-white rounded-2xl border border-slate-100 shadow-[0_1px_3px_rgba(0,0,0,0.06)] overflow-hidden">
                      {/* Header */}
                      <div className="flex items-center gap-2 px-5 pt-4 pb-3">
                        <div className="w-6 h-6 rounded-lg bg-blue-50 flex items-center justify-center shrink-0">
                          <Paperclip className="w-3 h-3 text-blue-500" />
                        </div>
                        <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                          Attachments
                        </span>
                        {attachmentFiles.length + savedAttachments.length >
                          0 && (
                          <span className="ml-auto text-[10px] font-semibold text-slate-400 bg-slate-100 rounded-full px-1.5 py-0.5 tabular-nums leading-none">
                            {attachmentFiles.length + savedAttachments.length}
                          </span>
                        )}
                      </div>

                      <div className="px-4 pb-4 space-y-2">
                        {/* ── Dropzone ultra-compacto ── */}
                        <div
                          onDragOver={(e) => {
                            e.preventDefault();
                            e.currentTarget.classList.add(
                              "!border-blue-400",
                              "!from-sky-50",
                              "!to-blue-50/60",
                            );
                          }}
                          onDragLeave={(e) => {
                            e.currentTarget.classList.remove(
                              "!border-blue-400",
                              "!from-sky-50",
                              "!to-blue-50/60",
                            );
                          }}
                          onDrop={(e) => {
                            e.preventDefault();
                            e.currentTarget.classList.remove(
                              "!border-blue-400",
                              "!from-sky-50",
                              "!to-blue-50/60",
                            );
                            const files = e.dataTransfer.files;
                            if (files.length > 0) handleFileSelect(files[0]);
                          }}
                          className="group"
                        >
                          <input
                            type="file"
                            id="file-upload"
                            onChange={(e) => {
                              if (e.target.files?.length)
                                handleFileSelect(e.target.files[0]);
                            }}
                            className="hidden"
                            accept=".svg,.png,.jpg,.jpeg,.pdf,.mp3,.wav,.m4a"
                          />
                          <label
                            htmlFor="file-upload"
                            className="flex items-center gap-2.5 w-full px-3 py-2.5 rounded-xl border border-dashed border-slate-200 bg-linear-to-r from-slate-50/90 to-sky-50/30 cursor-pointer transition-all duration-150 hover:border-blue-300 hover:from-sky-50/70 hover:to-blue-50/40"
                          >
                            <div className="flex items-center justify-center w-7 h-7 rounded-lg bg-white shadow-sm border border-slate-100/80 shrink-0">
                              <CloudUpload className="w-3.5 h-3.5 text-slate-400 group-hover:text-blue-400 transition-colors duration-150" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-[12px] leading-snug">
                                <span className="font-semibold text-emerald-600">
                                  Click to upload
                                </span>
                                <span className="text-slate-400">
                                  {" "}
                                  or drag &amp; drop
                                </span>
                              </p>
                              <p className="text-[10px] text-slate-400/80 mt-0.5 font-normal tracking-tight">
                                SVG · PNG · JPG · PDF · MP3 — max 10 MB
                              </p>
                            </div>
                          </label>
                        </div>

                        {/* ── Archivos pendientes (no guardados aún) ── */}
                        {attachmentFiles.length > 0 && (
                          <div className="rounded-xl border border-slate-100 overflow-hidden divide-y divide-slate-50/80">
                            {attachmentFiles.map((file, idx) => {
                              const ext =
                                file.name.split(".").pop()?.toUpperCase() ||
                                "?";
                              const isPdf = file.type === "application/pdf";
                              const isImage = file.type.startsWith("image/");
                              const isAudio = file.type.startsWith("audio/");
                              const badge = isPdf
                                ? "bg-red-50 text-red-500 ring-1 ring-red-100"
                                : isImage
                                  ? "bg-blue-50 text-blue-500 ring-1 ring-blue-100"
                                  : isAudio
                                    ? "bg-violet-50 text-violet-500 ring-1 ring-violet-100"
                                    : "bg-slate-100 text-slate-500";
                              return (
                                <div
                                  key={idx}
                                  className="flex items-center gap-2 px-2.5 py-1.5 bg-white hover:bg-slate-50/70 transition-colors"
                                >
                                  <span
                                    className={`text-[9px] font-bold tracking-wider rounded-[5px] px-1.25 py-0.75 uppercase shrink-0 ${badge}`}
                                  >
                                    {ext.slice(0, 4)}
                                  </span>
                                  <div className="flex-1 min-w-0">
                                    <p className="text-[11.5px] font-medium text-slate-700 truncate leading-tight"></p>
                                    <p className="text-[9.5px] text-slate-400 tabular-nums">
                                      {(file.size / 1024 / 1024).toFixed(2)} MB
                                    </p>
                                  </div>
                                  <div className="flex items-center gap-0.5 shrink-0">
                                    <button
                                      type="button"
                                      onClick={() => {
                                        const url = URL.createObjectURL(file);
                                        const a = document.createElement("a");
                                        a.href = url;
                                        a.download = file.name;
                                        a.click();
                                        URL.revokeObjectURL(url);
                                      }}
                                      className="p-1 rounded-md text-blue-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                                      aria-label="Download file"
                                    >
                                      <Download className="w-3 h-3" />
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => removeFile(idx)}
                                      className="p-1 rounded-md text-red-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                                      aria-label="Remove file"
                                    >
                                      <X className="w-3 h-3" />
                                    </button>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}

                        {/* ── Archivos guardados en S3 ── */}
                        {savedAttachments.length > 0 && (
                          <div className="rounded-xl border border-slate-100 overflow-hidden divide-y divide-slate-50/80">
                            {savedAttachments.map((url, idx) => {
                              const raw = url.split("/").pop() || "file";
                              // Limpia prefijo timestamp: 1776878402962-874305298-filename.pdf
                              const filename =
                                raw.replace(/^\d+-\d+-/, "") || raw;
                              const ext =
                                filename.split(".").pop()?.toUpperCase() || "?";
                              const isPdf = filename
                                .toLowerCase()
                                .endsWith(".pdf");
                              const isImage = Boolean(
                                filename
                                  .toLowerCase()
                                  .match(/\.(svg|png|jpg|jpeg|webp)$/),
                              );
                              const isAudio = Boolean(
                                filename
                                  .toLowerCase()
                                  .match(/\.(mp3|wav|m4a|ogg)$/),
                              );
                              const badge = isPdf
                                ? "bg-red-50 text-red-500 ring-1 ring-red-100"
                                : isImage
                                  ? "bg-blue-50 text-blue-500 ring-1 ring-blue-100"
                                  : isAudio
                                    ? "bg-violet-50 text-violet-500 ring-1 ring-violet-100"
                                    : "bg-slate-100 text-slate-500";
                              return (
                                <div
                                  key={idx}
                                  className="flex items-center gap-2 px-2.5 py-1.5 bg-white hover:bg-slate-50/70 transition-colors"
                                >
                                  <span
                                    className={`text-[9px] font-bold tracking-wider rounded-[5px] px-1.25 py-0.75 uppercase shrink-0 ${badge}`}
                                  >
                                    {ext.slice(0, 4)}
                                  </span>
                                  <div className="flex-1 min-w-0">
                                    <p
                                      className="text-[11.5px] font-medium text-slate-700 truncate leading-tight"
                                      title={filename}
                                    >
                                      {filename}
                                    </p>
                                  </div>
                                  <div className="flex items-center gap-0.5 shrink-0">
                                    <button
                                      type="button"
                                      onClick={() =>
                                        handleDownloadSavedAttachment(
                                          url,
                                          filename,
                                        )
                                      }
                                      className="p-1 rounded-md text-blue-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                                      aria-label="Download"
                                    >
                                      <Download className="w-3 h-3" />
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => removeSavedAttachment(url)}
                                      className="p-1 rounded-md text-red-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                                      aria-label="Remove"
                                    >
                                      <X className="w-3 h-3" />
                                    </button>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}
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
                    onClick={() => onUpdate()}
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
                  allCalls.map((call, idx) => {
                    const linkedFromId = allCalls.find(
                      (c) =>
                        (c as any).relatedCallId &&
                        Number((c as any).relatedCallId) === Number(call.id),
                    )?.id as number | undefined;
                    return (
                      <TimelineCard
                        key={call.id}
                        call={call}
                        isActive={call.id === activeCallId}
                        onClick={() => {
                          setPeekCallId(null);
                          onSelectCall(call);
                        }}
                        onPeek={() => {
                          const numId = Number(call.id);
                          setPeekCallId(peekCallId === numId ? null : numId);
                        }}
                        isLast={idx === allCalls.length - 1}
                        linkedFromId={
                          linkedFromId !== undefined
                            ? Number(linkedFromId)
                            : undefined
                        }
                      />
                    );
                  })
                )}
              </div>
            </aside>
          </div>
        </SheetContent>
      </Sheet>

      <AlertDialog
        open={deleteConfirmUrl !== null}
        onOpenChange={(open) => {
          if (!open) setDeleteConfirmUrl(null);
        }}
      >
        <AlertDialogContent className="max-w-sm rounded-2xl border border-slate-100 shadow-xl p-0 overflow-hidden">
          <div className="bg-linear-to-br from-red-50 to-rose-50/60 px-6 pt-6 pb-4">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-9 h-9 rounded-xl bg-red-100 flex items-center justify-center shrink-0">
                <Trash2 className="w-4 h-4 text-red-500" />
              </div>
              <AlertDialogHeader className="p-0 space-y-0">
                <AlertDialogTitle className="text-[15px] font-semibold text-slate-800 leading-tight">
                  Delete attachment
                </AlertDialogTitle>
                <AlertDialogDescription className="text-[12px] text-slate-500 mt-0.5">
                  This file will be permanently removed from S3. This action
                  cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
            </div>
            {deleteConfirmUrl && (
              <div className="flex items-center gap-2 bg-white/80 border border-slate-100 rounded-lg px-3 py-2 mt-1">
                <Paperclip className="w-3 h-3 text-slate-400 shrink-0" />
                <span className="text-[11px] text-slate-600 truncate font-medium">
                  {(deleteConfirmUrl.split("/").pop() || "").replace(
                    /^\d+-\d+-/,
                    "",
                  )}
                </span>
              </div>
            )}
          </div>
          <AlertDialogFooter className="flex gap-2 px-6 py-4 bg-white border-t border-slate-100">
            <AlertDialogCancel
              onClick={() => setDeleteConfirmUrl(null)}
              className="flex-1 h-9 rounded-xl border border-slate-200 bg-white text-slate-600 text-[13px] font-medium hover:bg-slate-50 transition-colors"
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (deleteConfirmUrl) executeDeleteAttachment(deleteConfirmUrl);
                setDeleteConfirmUrl(null);
              }}
              className="flex-1 h-9 rounded-xl bg-red-500 hover:bg-red-600 text-white text-[13px] font-semibold transition-colors shadow-sm"
            >
              Delete file
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
