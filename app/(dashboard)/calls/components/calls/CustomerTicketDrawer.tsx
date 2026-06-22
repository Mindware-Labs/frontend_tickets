"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useConfigurations } from "@/hooks/useConfigurations";
import useSWR from "swr";
import { cn } from "@/lib/utils";
import { chipColors, chipBorder } from "@/lib/chip-colors";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Input } from "@/components/ui/input";
import { SelectItem } from "@/components/ui/select";
import {
  X,
  PhoneOutgoing,
  Loader2,
  Activity,
  CalendarIcon,
  CheckCircle2,
  Pencil,
  Link2,
  Ticket as TicketIcon,
  Paperclip,
  Check,
  ChevronsUpDown,
  CloudUpload,
  Download,
  AlertCircle,
} from "lucide-react";
import {
  SupportTicketStatus,
  SupportTicketPriority,
  SupportTicketType,
  type SupportTicketRecord,
  type CreateSupportTicketFormData,
} from "../../types";
import type { CustomerTicketGroup } from "../tickets/InlineTicketTimeline";
import {
  formatEnumLabel,
  fmtDate,
  fmtRelative,
} from "../../utils/call-helpers";
import { TicketPropertiesCard } from "../tickets/TicketPropertiesCard";
import { TicketUpdatePeekPanel } from "../tickets/TicketUpdatePeekPanel";
import { TicketSheetActivitySection } from "../tickets/TicketSheetActivitySection";
import type { TicketUpdateRecord } from "../../types";
import {
  InspLabel,
  InspectorSelect,
  InspectorCombobox,
} from "../shared/InspectorHelpers";
import { TicketStatusToggle } from "../tickets/TicketStatusToggle";
import { CallPeekPanel } from "./CallPeekPanel";
import { SourceCallPreviewTrigger } from "./SourceCallPreviewTrigger";
import type { Ticket } from "@/lib/mock-data";
import { useAircall } from "@/components/providers/AircallProvider";
import { useTicketPeekAircallExclusion } from "@/hooks/use-ticket-peek-aircall-exclusion";
import { shouldIgnoreTicketSheetOutsideEvent } from "@/lib/ticket-sheet-outside-interaction";
import { TimelineReturnBar } from "../shared/TimelineReturnBar";
import { CustomerNotesAlert } from "../shared/CustomerNotesAlert";

// ── Helpers ────────────────────────────────────────────────────────────────────

const fetcher = (url: string) => fetch(url).then((r) => r.json());

// Pure phone helpers — module-level to avoid recreation on each render
const normalizePhone = (v?: string | null) => (v ? v.replace(/\D/g, "") : "");
const stripUsCode = (d: string) =>
  d.length > 10 && d.startsWith("1") ? d.slice(1) : d;

// ── Pill maps ─────────────────────────────────────────────────────────────────

const STATUS_PILL: Record<
  string,
  { dot: string; bg: string; fg: string; label: string }
> = {
  ACTIVE: { dot: "#008f68", bg: "#e6f5f0", fg: "#006d50", label: "Active" },
  OPEN: { dot: "#008f68", bg: "#e6f5f0", fg: "#006d50", label: "Active" },
  IN_PROGRESS: {
    dot: "#008f68",
    bg: "#e6f5f0",
    fg: "#006d50",
    label: "Active",
  },
  PENDING_FOLLOWUP: {
    dot: "#d97706",
    bg: "#fef3c7",
    fg: "#b45309",
    label: "Follow-up",
  },
  OVERDUE: { dot: "#dc2626", bg: "#fee2e2", fg: "#b91c1c", label: "Overdue" },
  RESOLVED: { dot: "#008f68", bg: "#e6f5f0", fg: "#006d50", label: "Resolved" },
  CLOSED: { dot: "#64748b", bg: "#f1f5f9", fg: "#475569", label: "Closed" },
};

const normalizeStatusKey = (status?: string | null) => {
  const key = (status || "").toString().toUpperCase().replace(/\s+/g, "_");
  return key === "OPEN" || key === "IN_PROGRESS" ? "ACTIVE" : key;
};

const PRIORITY_PILL: Record<
  string,
  { dot: string; bg: string; fg: string; label: string }
> = {
  LOW: { dot: "#94a3b8", bg: "#f1f5f9", fg: "#475569", label: "Low" },
  MEDIUM: { dot: "#f59e0b", bg: "#fef3c7", fg: "#b45309", label: "Medium" },
  HIGH: { dot: "#f97316", bg: "#ffedd5", fg: "#c2410c", label: "High" },
  EMERGENCY: {
    dot: "#dc2626",
    bg: "#fee2e2",
    fg: "#b91c1c",
    label: "Emergency",
  },
};

// ── Ticket Card (COL1) ────────────────────────────────────────────────────────

function TicketCard({
  ticket,
  isActive,
  onClick,
}: {
  ticket: SupportTicketRecord;
  isActive: boolean;
  onClick: () => void;
}) {
  const ref = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    if (isActive)
      ref.current?.scrollIntoView({ block: "nearest", behavior: "smooth" });
  }, [isActive]);

  const dateLabel = fmtRelative(ticket.createdAt);
  const sp =
    STATUS_PILL[normalizeStatusKey(ticket.status)] || STATUS_PILL.CLOSED;
  const pp = PRIORITY_PILL[ticket.priority || ""] || PRIORITY_PILL.LOW;

  return (
    <div className="relative flex gap-2 pl-3.5 pr-2.5">
      <div className="relative z-10 mt-3 shrink-0">
        <span
          className={cn(
            "w-3 h-3 rounded-full border-2 block transition-all",
            isActive
              ? "bg-[#008f68] border-[#008f68] shadow-[0_0_0_3px_#008f6820]"
              : "bg-white dark:bg-neutral-800 border-slate-300 dark:border-neutral-600",
          )}
        />
      </div>

      <div className="flex-1 min-w-0">
        <button
          ref={ref}
          type="button"
          onClick={onClick}
          className={cn(
            "w-full text-left mb-1 rounded-xl p-2.5 border transition-all",
            isActive
              ? "bg-[#008f68]/5 border-[#008f68]/20 shadow-sm"
              : "bg-white dark:bg-neutral-900 border-slate-100 dark:border-neutral-700 hover:border-slate-200 dark:hover:border-neutral-600 hover:bg-slate-50/60 dark:hover:bg-neutral-800/60",
          )}
        >
          <div className="flex items-center justify-between gap-1 mb-1.5">
            <span
              className={cn(
                "text-[11px] font-bold font-mono",
                isActive ? "text-[#008f68]" : "text-slate-700 dark:text-neutral-300",
              )}
            >
              #{ticket.id}
            </span>
            <span className="text-[9.5px] text-slate-400 dark:text-neutral-500 tabular-nums">
              {dateLabel}
            </span>
          </div>
          {ticket.ticketType && (
            <p className="text-[11px] text-slate-500 dark:text-neutral-400 mb-1.5 truncate">
              {formatEnumLabel(ticket.ticketType)}
            </p>
          )}
          <div className="flex flex-wrap items-center gap-1">
            <span
              className="inline-flex items-center gap-1 text-[9.5px] font-semibold px-1.5 py-0.5 rounded-md"
              style={chipColors(sp.dot, sp.bg, sp.fg)}
            >
              <span
                className="w-1.5 h-1.5 rounded-full shrink-0"
                style={{ background: sp.dot }}
              />
              {sp.label}
            </span>
            <span
              className="inline-flex items-center gap-1 text-[9.5px] font-semibold px-1.5 py-0.5 rounded-md"
              style={chipColors(pp.dot, pp.bg, pp.fg)}
            >
              <span
                className="w-1.5 h-1.5 rounded-full shrink-0"
                style={{ background: pp.dot }}
              />
              {pp.label}
            </span>
          </div>
        </button>
      </div>
    </div>
  );
}

interface CustomerTicketDrawerProps {
  open: boolean;
  onClose: () => void;
  returnToLabel?: string;
  onBackToTimeline?: () => void;
  group: CustomerTicketGroup | null;
  selectedTicket: SupportTicketRecord | null;
  onSelectTicket: (ticket: SupportTicketRecord) => void;
  editFormData: CreateSupportTicketFormData;
  setEditFormData: React.Dispatch<
    React.SetStateAction<CreateSupportTicketFormData>
  >;
  pendingFiles: File[];
  onFilesChange: (files: File[]) => void;
  isUpdating: boolean;
  onSaveProperties: () => void;
  onActivityLogged?: (ticket: SupportTicketRecord) => void;
  onActivityError?: (message: string) => void;
  currentAgentId?: number | null;
  customers: any[];
  yards: any[];
  agents: any[];
  campaigns: any[];
  phoneLines: { id: number; label: string | null; phoneNumber: string }[];
  /** Muestra el toast de éxito anclado al sheet */
  showSuccessToast?: boolean;
  /** Callback cuando el toast de éxito termina su animación de salida */
  onSuccessToastDismiss?: () => void;
  /** Muestra el toast de error anclado al sheet */
  showErrorToast?: boolean;
  /** Mensaje a mostrar en el toast de error */
  errorToastMessage?: string;
  /** Callback cuando el toast de error termina su animación de salida */
  onErrorToastDismiss?: () => void;
}

// ── Main Drawer ────────────────────────────────────────────────────────────────

export function CustomerTicketDrawer({
  open,
  onClose,
  returnToLabel,
  onBackToTimeline,
  group,
  selectedTicket,
  onSelectTicket,
  editFormData,
  setEditFormData,
  pendingFiles,
  onFilesChange,
  isUpdating,
  onSaveProperties,
  onActivityLogged,
  onActivityError,
  currentAgentId,
  customers,
  yards,
  agents,
  campaigns,
  phoneLines,
  showSuccessToast,
  onSuccessToastDismiss,
  showErrorToast,
  errorToastMessage,
  onErrorToastDismiss,
}: CustomerTicketDrawerProps) {
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [customerOpen, setCustomerOpen] = useState(false);
  const [mainCustomerOpen, setMainCustomerOpen] = useState(false);
  const [customerSearch, setCustomerSearch] = useState("");
  const [mainCustomerSearch, setMainCustomerSearch] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ── Source call peek (CallPeekPanel) ───────────────────────────────────────
  const [sourcePeekCallId, setSourcePeekCallId] = useState<number | null>(null);
  const [showUpdatePeek, setShowUpdatePeek] = useState(false);
  const [railTab, setRailTab] = useState<"activity" | "tickets">("activity");
  const { data: sourcePeekData, isLoading: isSourcePeekLoading } = useSWR(
    sourcePeekCallId ? `/api/calls/${sourcePeekCallId}` : null,
    fetcher,
    { revalidateOnFocus: false },
  );
  const sourcePeekCall: Ticket | null =
    sourcePeekData?.success && sourcePeekData.data
      ? (sourcePeekData.data as Ticket)
      : null;

  useEffect(() => {
    setSourcePeekCallId(null);
    setShowUpdatePeek(false);
  }, [selectedTicket?.id]);

  const suppressSheetDismissRef = useRef(false);

  const closeLogUpdatePeek = useCallback(() => {
    suppressSheetDismissRef.current = true;
    setShowUpdatePeek(false);
    window.setTimeout(() => {
      suppressSheetDismissRef.current = false;
    }, 150);
  }, []);

  const closeTicketPeeks = useCallback(() => {
    setSourcePeekCallId(null);
    setShowUpdatePeek(false);
  }, []);

  const ticketPeekOpen =
    sourcePeekCallId !== null || showUpdatePeek;

  useTicketPeekAircallExclusion(ticketPeekOpen, closeTicketPeeks);

  const updatesUrl = useMemo(
    () =>
      open && selectedTicket?.id
        ? `/api/tickets/${selectedTicket.id}/updates`
        : null,
    [open, selectedTicket?.id],
  );

  const {
    data: updatesData,
    isLoading: isLoadingUpdates,
    mutate: mutateUpdates,
  } = useSWR(updatesUrl, fetcher, { revalidateOnFocus: false });

  const ticketUpdates = useMemo<TicketUpdateRecord[]>(() => {
    if (updatesData?.success && Array.isArray(updatesData.data)) {
      return updatesData.data as TicketUpdateRecord[];
    }
    return [];
  }, [updatesData]);

  const handleActivityLogged = (result: {
    ticket: SupportTicketRecord;
    updates: TicketUpdateRecord[];
  }) => {
    void mutateUpdates();
    closeLogUpdatePeek();
    if (result.ticket) {
      onActivityLogged?.(result.ticket);
    }
  };

  // ── Sheet-anchored success toast ──────────────────────────────────────────
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
      setToastVisible(false);
      const unmount = setTimeout(() => setToastActive(false), 300);
      return () => clearTimeout(unmount);
    }
    setToastActive(true);
    setToastVisible(false);
    const raf = requestAnimationFrame(() =>
      requestAnimationFrame(() => setToastVisible(true)),
    );
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
      closeTicketPeeks();
    }
    prevOpenRef.current = open;
  }, [open, dismissSheetToasts, closeTicketPeeks]);

  const {
    dial,
    status: aircallStatus,
    isLoggedIn: aircallLoggedIn,
  } = useAircall();
  const canDial = aircallStatus === "ready" && aircallLoggedIn;
  const dialPhone =
    selectedTicket?.customer?.phone || group?.customerPhone || "";

  // Fetch full ticket history
  const historyUrl = useMemo(() => {
    if (!open || !group?.customerId) return null;
    const params = new URLSearchParams();
    params.set("mode", "page");
    params.set("customerId", String(group.customerId));
    params.set("limit", "200");
    return `/api/tickets?${params.toString()}`;
  }, [open, group?.customerId]);

  const { data: historyData, isLoading: isLoadingHistory } = useSWR(
    historyUrl,
    fetcher,
    { revalidateOnFocus: false },
  );

  const allTickets = useMemo<SupportTicketRecord[]>(() => {
    if (historyData?.success && Array.isArray(historyData.data?.data)) {
      return [...historyData.data.data].sort(
        (a: SupportTicketRecord, b: SupportTicketRecord) =>
          new Date(b.createdAt || 0).getTime() -
          new Date(a.createdAt || 0).getTime(),
      );
    }
    if (historyData?.success && Array.isArray(historyData.data)) {
      return [...historyData.data].sort(
        (a: SupportTicketRecord, b: SupportTicketRecord) =>
          new Date(b.createdAt || 0).getTime() -
          new Date(a.createdAt || 0).getTime(),
      );
    }
    return group?.tickets ?? [];
  }, [historyData, group?.tickets]);

  const activeTicketId = selectedTicket?.id ?? group?.latestTicket?.id;
  const customerName =
    group?.customerName ?? selectedTicket?.customer?.name ?? "Unknown";
  const customerPhone =
    group?.customerPhone ?? selectedTicket?.customer?.phone ?? "";
  const ticketCount = allTickets.length || group?.tickets.length || 0;
  const customersForTicketSheet = useMemo(() => {
    const map = new Map<string, any>();
    customers.forEach((customer) => {
      if (customer?.id != null) map.set(String(customer.id), customer);
    });

    const selectedCustomerId =
      selectedTicket?.customer?.id ?? selectedTicket?.customerId;
    if (selectedCustomerId != null && !map.has(String(selectedCustomerId))) {
      map.set(String(selectedCustomerId), {
        id: selectedCustomerId,
        name:
          selectedTicket?.customer?.name ||
          group?.customerName ||
          `Customer #${selectedCustomerId}`,
        phone: selectedTicket?.customer?.phone || group?.customerPhone || null,
        email: selectedTicket?.customer?.email || null,
      });
    }

    return Array.from(map.values());
  }, [
    customers,
    group?.customerName,
    group?.customerPhone,
    selectedTicket?.customer,
    selectedTicket?.customerId,
  ]);

  const { getOptionsForCampaignType } = useConfigurations(true);

  // Campaign options derived in one memo
  const campaignOptionValues = useMemo(() => {
    if (!editFormData.campaignId) return [];
    const camp = campaigns.find(
      (c: any) => c.id.toString() === editFormData.campaignId,
    );
    if (!camp?.tipo) return [];
    return getOptionsForCampaignType(camp.tipo.toString().toUpperCase());
  }, [campaigns, editFormData.campaignId, getOptionsForCampaignType]);

  const phoneLineLabel = useMemo(() => {
    const selectedPhoneLine = phoneLines.find(
      (line) => line.id.toString() === editFormData.phoneLineId,
    );

    if (selectedPhoneLine) {
      return selectedPhoneLine.label
        ? `${selectedPhoneLine.label} (${selectedPhoneLine.phoneNumber})`
        : selectedPhoneLine.phoneNumber;
    }

    return editFormData.phoneLineId
      ? `Line #${editFormData.phoneLineId}`
      : "No line";
  }, [editFormData.phoneLineId, phoneLines]);

  const followUpDateDisplay = useMemo(
    () =>
      editFormData.followUpDueDate
        ? fmtDate(editFormData.followUpDueDate)
        : null,
    [editFormData.followUpDueDate],
  );

  const filteredCustomers = useMemo(() => {
    if (!customerSearch.trim()) return customersForTicketSheet;
    const s = customerSearch.toLowerCase();
    const sd = normalizePhone(customerSearch);
    const sds = stripUsCode(sd);
    return customersForTicketSheet.filter((c: any) => {
      const cpd = normalizePhone(c.phone);
      const cpds = stripUsCode(cpd);
      const phoneMatch =
        !!sd &&
        (cpd.includes(sd) ||
          cpds.includes(sd) ||
          cpd.includes(sds) ||
          cpds.includes(sds));
      return (
        c.name?.toLowerCase().includes(s) ||
        (c.phone ?? "").toLowerCase().includes(s) ||
        c.id.toString().includes(s) ||
        c.email?.toLowerCase().includes(s) ||
        phoneMatch
      );
    });
  }, [customersForTicketSheet, customerSearch]);

  const mainFilteredCustomers = useMemo(() => {
    if (!mainCustomerSearch.trim()) return customersForTicketSheet;
    const s = mainCustomerSearch.toLowerCase();
    const sd = normalizePhone(mainCustomerSearch);
    const sds = stripUsCode(sd);
    return customersForTicketSheet.filter((c: any) => {
      const cpd = normalizePhone(c.phone);
      const cpds = stripUsCode(cpd);
      const phoneMatch =
        !!sd &&
        (cpd.includes(sd) ||
          cpds.includes(sd) ||
          cpd.includes(sds) ||
          cpds.includes(sds));
      return (
        c.name?.toLowerCase().includes(s) ||
        (c.phone ?? "").toLowerCase().includes(s) ||
        c.id.toString().includes(s) ||
        c.email?.toLowerCase().includes(s) ||
        phoneMatch
      );
    });
  }, [customersForTicketSheet, mainCustomerSearch]);

  const sp = STATUS_PILL[normalizeStatusKey(selectedTicket?.status)] || null;
  const pp = PRIORITY_PILL[selectedTicket?.priority || ""] || null;

  // Attachment download — proxied signed URL, same as calls
  const handleDownloadAttachment = async (url: string, filename: string) => {
    try {
      const res = await fetch(
        `/api/tickets/attachments/download?fileUrl=${encodeURIComponent(url)}`,
        { credentials: "include" },
      );
      if (!res.ok) throw new Error(`Download failed: ${res.status}`);
      const { signedUrl } = await res.json();
      const link = document.createElement("a");
      link.href = signedUrl;
      link.download = filename;
      link.target = "_blank";
      link.click();
    } catch (err) {
      console.error("[CustomerTicketDrawer] Download error:", err);
      alert("Failed to download file. Please try again.");
    }
  };

  // File handling
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    onFilesChange([...pendingFiles, ...files]);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };
  const removePendingFile = (i: number) =>
    onFilesChange(pendingFiles.filter((_, idx) => idx !== i));

  return (
    <>
      <CallPeekPanel
        call={sourcePeekCall}
        isLoading={sourcePeekCallId !== null && isSourcePeekLoading}
        onClose={() => setSourcePeekCallId(null)}
      />

      <TicketUpdatePeekPanel
        open={showUpdatePeek && !!selectedTicket}
        ticket={selectedTicket}
        agents={agents.map((a: { id: number; name: string }) => ({
          id: a.id,
          name: a.name,
        }))}
        actorAgentId={currentAgentId}
        onClose={closeLogUpdatePeek}
        onLogged={handleActivityLogged}
        onError={onActivityError}
      />

      {/* ── Sheet-anchored error toast ───────────────────────────────────────── */}
      {open && errorToastActive && (
        <div
          role="alert"
          aria-live="assertive"
          className={cn(
            "fixed z-50 flex items-center gap-3",
            "bg-white dark:bg-neutral-900 rounded-xl border border-slate-200/80 dark:border-neutral-700",
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
            <p className="text-[13px] font-semibold text-slate-800 dark:text-neutral-200 leading-tight">
              Error
            </p>
            <p className="text-[11px] text-slate-500 dark:text-neutral-400 mt-0.5">
              {errorToastMessage ?? "Failed to save changes"}
            </p>
          </div>
          <button
            type="button"
            aria-label="Dismiss notification"
            onClick={dismissErrorToast}
            className="shrink-0 w-5 h-5 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-600 dark:hover:text-neutral-200 hover:bg-slate-100 dark:hover:bg-neutral-700 transition-colors"
          >
            <X className="w-3 h-3" />
          </button>
        </div>
      )}

      {/* ── Sheet-anchored success toast ─────────────────────────────────────── */}
      {open && toastActive && (
        <div
          role="alert"
          aria-live="polite"
          className={cn(
            "fixed z-50 flex items-center gap-3",
            "bg-white dark:bg-neutral-900 rounded-xl border border-slate-200/80 dark:border-neutral-700",
            "shadow-[0_10px_15px_-3px_rgba(0,0,0,0.10),0_4px_6px_-4px_rgba(0,0,0,0.10),inset_4px_0_0_0_#22c55e]",
            "px-4 py-3 min-w-65 max-w-80",
            "transition-all duration-300 ease-out",
            toastVisible
              ? "translate-x-0 opacity-100"
              : "translate-x-4 opacity-0",
          )}
          style={{
            right: "calc(min(80svw, 1100px) + 1rem)",
            bottom: "1rem",
          }}
        >
          <div className="w-7 h-7 rounded-full bg-green-100 flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-3.5 h-3.5 text-green-600" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[13px] font-semibold text-slate-800 dark:text-neutral-200 leading-tight">
              Saved
            </p>
            <p className="text-[11px] text-slate-500 dark:text-neutral-400 mt-0.5">
              Ticket updated successfully
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
            if (suppressSheetDismissRef.current) return;
            onClose();
          }
        }}
        modal={false}
      >
        <SheetContent
          side="right"
          hideClose
          className="w-svw sm:w-[80vw] p-0 gap-0 flex flex-col bg-white dark:bg-neutral-900 overflow-hidden border-l border-slate-200/80 dark:border-neutral-700"
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
            {customerName
              ? `Ticket Command Center — ${customerName}`
              : "Ticket Command Center"}
          </SheetTitle>

          {/* ── Top Bar ── */}
          <div className="shrink-0 bg-white dark:bg-neutral-900 border-b border-slate-100 dark:border-neutral-800">
            {onBackToTimeline && returnToLabel ? (
              <TimelineReturnBar
                label={returnToLabel}
                onBack={onBackToTimeline}
              />
            ) : null}
            <div className="flex items-center gap-3 px-4 py-2">
              <div
                className="w-10 h-10 rounded-2xl flex items-center justify-center text-[13px] font-extrabold text-white shrink-0 shadow-sm ring-2 ring-white"
                style={{
                  background: `hsl(${(customerName?.charCodeAt(0) ?? 200) % 360} 50% 44%)`,
                }}
              >
                {customerName
                  ? customerName.substring(0, 2).toUpperCase()
                  : "?"}
              </div>
              <div className="min-w-0 shrink">
                <div className="flex items-center gap-1.5 min-w-0">
                  <p className="text-[15px] font-bold text-slate-900 dark:text-neutral-100 leading-none truncate">
                    {customerName || "Unknown"}
                  </p>
                  <button
                    type="button"
                    title="Edit contact"
                    className="w-5 h-5 flex items-center justify-center rounded hover:bg-slate-100 dark:hover:bg-neutral-800 text-slate-400 hover:text-slate-600 dark:hover:text-neutral-300 transition-colors shrink-0"
                  >
                    <Pencil className="w-3 h-3" />
                  </button>
                </div>
                <p className="text-[11.5px] text-slate-400 dark:text-neutral-500 font-mono mt-0.5 leading-none">
                  {customerPhone || "—"}
                </p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-[#008f68] bg-[#008f68]/8 px-2 py-0.5 rounded-full">
                  <TicketIcon className="w-2.5 h-2.5" />
                  {isLoadingHistory ? (
                    <Loader2 className="w-2.5 h-2.5 animate-spin" />
                  ) : (
                    `${ticketCount} ticket${ticketCount !== 1 ? "s" : ""}`
                  )}
                </span>
              </div>
              {/* Customer notes alert — fills the gap between customer info and actions */}
              <div className="flex-1 min-w-0 mx-1">
                <CustomerNotesAlert
                  customer={selectedTicket?.customer}
                  compact
                  inline
                />
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  type="button"
                  onClick={() => {
                    if (dialPhone && canDial)
                      dial(dialPhone, selectedTicket?.id);
                  }}
                  disabled={!dialPhone || !canDial}
                  className="flex items-center gap-1.5 h-8 px-3.5 text-white text-[12px] font-semibold rounded-xl bg-[#008f68] hover:bg-[#007a5a] active:scale-95 disabled:opacity-40 transition-all shadow-sm"
                >
                  <PhoneOutgoing className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Call</span>
                </button>
              </div>
            </div>

            {selectedTicket && (
              <div className="flex items-center gap-1.5 px-4 pb-2 flex-wrap">
                <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-slate-600 dark:text-neutral-300 bg-slate-50 dark:bg-neutral-800 border border-slate-200 dark:border-neutral-700 px-2.5 py-1 rounded-lg cursor-default">
                  <TicketIcon className="w-3 h-3 text-slate-400" />
                  Ticket #{selectedTicket.id}
                </span>
                <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-slate-600 dark:text-neutral-300 bg-slate-50 dark:bg-neutral-800 border border-slate-200 dark:border-neutral-700 px-2.5 py-1 rounded-lg cursor-default">
                  <CalendarIcon className="w-3 h-3 text-slate-400" />
                  {fmtDate(selectedTicket.createdAt)}
                </span>
                <span
                  className="inline-flex max-w-[260px] items-center gap-1.5 rounded-lg border border-slate-200 dark:border-neutral-700 bg-slate-50 dark:bg-neutral-800 px-2.5 py-1 text-[11px] font-semibold text-slate-600 dark:text-neutral-300 cursor-default"
                  title={phoneLineLabel}
                >
                  <Link2 className="w-3 h-3 shrink-0 text-slate-400" />
                  <span className="truncate">{phoneLineLabel}</span>
                </span>
                {sp && (
                  <span
                    className="inline-flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1 rounded-lg border cursor-default"
                    style={{
                      ...chipColors(sp.dot, sp.bg, sp.fg),
                      borderColor: chipBorder(sp.dot),
                    }}
                  >
                    <span
                      className="w-1.5 h-1.5 rounded-full"
                      style={{ background: sp.dot }}
                    />
                    {sp.label}
                  </span>
                )}
                {pp && (
                  <span
                    className="inline-flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1 rounded-lg border cursor-default"
                    style={{
                      ...chipColors(pp.dot, pp.bg, pp.fg),
                      borderColor: chipBorder(pp.dot),
                    }}
                  >
                    <span
                      className="w-1.5 h-1.5 rounded-full"
                      style={{ background: pp.dot }}
                    />
                    {pp.label}
                  </span>
                )}
                {selectedTicket.ticketType && (
                  <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-slate-600 dark:text-neutral-300 bg-slate-50 dark:bg-neutral-800 border border-slate-200 dark:border-neutral-700 px-2.5 py-1 rounded-lg cursor-default">
                    <Activity className="w-3 h-3 text-slate-400" />
                    {formatEnumLabel(selectedTicket.ticketType)}
                  </span>
                )}
              </div>
            )}

          </div>

          {/* ── 3-Column Body ── */}
          <div className="flex-1 overflow-hidden min-h-0 flex">
            {/* ═══ COL 1 (right rail): Activity + Other tickets tabs ═══ */}
            <aside className="hidden sm:flex w-72 xl:w-80 order-last shrink-0 flex-col border-l border-slate-200/60 dark:border-neutral-700 bg-white dark:bg-neutral-900 overflow-hidden">
              <div className="flex shrink-0 border-b border-slate-100 dark:border-neutral-800 bg-white dark:bg-neutral-900">
                <button
                  type="button"
                  onClick={() => setRailTab("activity")}
                  aria-pressed={railTab === "activity"}
                  className={cn(
                    "relative flex-1 flex items-center justify-center gap-1.5 px-3 py-2.5 text-[11px] font-semibold transition-colors",
                    railTab === "activity"
                      ? "text-violet-700 bg-violet-50/70"
                      : "text-slate-500 hover:text-slate-700 dark:hover:text-neutral-200 hover:bg-slate-50 dark:hover:bg-neutral-800",
                  )}
                >
                  <Activity className="w-3.5 h-3.5" />
                  <span>Activity</span>
                  {ticketUpdates.length > 0 ? (
                    <span
                      className={cn(
                        "rounded-full px-1.5 py-0.5 text-[9px] font-bold tabular-nums leading-none",
                        railTab === "activity"
                          ? "bg-violet-200/80 text-violet-800"
                          : "bg-slate-100 text-slate-500",
                      )}
                    >
                      {ticketUpdates.length}
                    </span>
                  ) : null}
                  {railTab === "activity" ? (
                    <span className="absolute inset-x-0 bottom-0 h-0.5 bg-violet-500" />
                  ) : null}
                </button>
                <button
                  type="button"
                  onClick={() => setRailTab("tickets")}
                  aria-pressed={railTab === "tickets"}
                  className={cn(
                    "relative flex-1 flex items-center justify-center gap-1.5 px-3 py-2.5 text-[11px] font-semibold transition-colors",
                    railTab === "tickets"
                      ? "text-[#008f68] bg-[#f0faf5]"
                      : "text-slate-500 hover:text-slate-700 dark:hover:text-neutral-200 hover:bg-slate-50 dark:hover:bg-neutral-800",
                  )}
                >
                  <TicketIcon className="w-3.5 h-3.5" />
                  <span>Tickets</span>
                  <span
                    className={cn(
                      "rounded-full px-1.5 py-0.5 text-[9px] font-bold tabular-nums leading-none",
                      railTab === "tickets"
                        ? "bg-[#008f68]/15 text-[#006d50]"
                        : "bg-slate-100 text-slate-500",
                    )}
                  >
                    {isLoadingHistory ? "…" : allTickets.length}
                  </span>
                  {railTab === "tickets" ? (
                    <span className="absolute inset-x-0 bottom-0 h-0.5 bg-[#008f68]" />
                  ) : null}
                </button>
              </div>

              {railTab === "activity" ? (
                selectedTicket ? (
                  <TicketSheetActivitySection
                    ticket={selectedTicket}
                    updates={ticketUpdates}
                    isLoading={isLoadingUpdates}
                    currentStatus={editFormData.status}
                    className="flex-1 min-h-0 rounded-none border-0 shadow-none"
                  />
                ) : (
                  <div className="flex flex-1 flex-col items-center justify-center gap-2 text-slate-400 py-10">
                    <Activity className="w-5 h-5 opacity-40" />
                    <span className="text-xs">Select a ticket to see activity</span>
                  </div>
                )
              ) : (
                <div className="flex-1 overflow-y-auto py-2 [&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar-thumb]:bg-slate-200 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-track]:bg-transparent">
                  {isLoadingHistory && allTickets.length === 0 ? (
                    <div className="flex items-center justify-center py-10 gap-2 text-slate-400">
                      <Loader2 className="w-4 h-4 animate-spin" />
                    </div>
                  ) : allTickets.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-10 gap-2 text-slate-400">
                      <TicketIcon className="w-5 h-5 opacity-40" />
                      <span className="text-xs">No tickets</span>
                    </div>
                  ) : (
                    allTickets.map((t) => (
                      <TicketCard
                        key={t.id}
                        ticket={t}
                        isActive={t.id === activeTicketId}
                        onClick={() => onSelectTicket(t)}
                      />
                    ))
                  )}
                </div>
              )}
            </aside>

            {/* ═══ COL 2 (flex): Hub ═══ */}
            <main className="flex-1 overflow-hidden flex flex-col min-h-0 bg-slate-50/80 dark:bg-neutral-800/50 border-t border-slate-100 dark:border-neutral-800">
              {!selectedTicket ? (
                <div className="flex-1 flex items-center justify-center text-slate-400">
                  <div className="text-center">
                    <TicketIcon className="w-8 h-8 opacity-30 mx-auto mb-2" />
                    <p className="text-sm">Select a ticket to inspect</p>
                  </div>
                </div>
              ) : (
                <div className="flex-1 overflow-y-auto px-3 pt-1.5 pb-2 space-y-1.5 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:bg-slate-200 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-track]:bg-transparent">
                  {selectedTicket.callId && (
                    <SourceCallPreviewTrigger
                      callId={selectedTicket.callId}
                      call={selectedTicket.call ?? null}
                      isActive={sourcePeekCallId === selectedTicket.callId}
                      onClick={() => {
                        const id = selectedTicket.callId!;
                        setShowUpdatePeek(false);
                        setSourcePeekCallId(
                          sourcePeekCallId === id ? null : id,
                        );
                      }}
                    />
                  )}

                  <TicketPropertiesCard
                    editFormData={editFormData}
                    setEditFormData={setEditFormData}
                    customers={customersForTicketSheet}
                    yards={yards}
                    agents={agents}
                    campaigns={campaigns}
                    phoneLines={phoneLines}
                    campaignOptionValues={campaignOptionValues}
                    mainCustomerOpen={mainCustomerOpen}
                    setMainCustomerOpen={setMainCustomerOpen}
                    mainCustomerSearch={mainCustomerSearch}
                    setMainCustomerSearch={setMainCustomerSearch}
                    mainFilteredCustomers={mainFilteredCustomers}
                    showPhoneLine={false}
                    activityMode
                  />

                  <TicketSheetActivitySection
                    ticket={selectedTicket}
                    updates={ticketUpdates}
                    isLoading={isLoadingUpdates}
                    currentStatus={editFormData.status}
                    className="sm:hidden"
                  />

                  <div className="space-y-3">
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <p className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">
                          Original report
                        </p>
                        <span className="inline-flex items-center gap-1 text-[9px] font-semibold text-slate-500 uppercase tracking-wider bg-slate-100 border border-slate-200 rounded-full px-1.5 py-0.5">
                          Editable record
                        </span>
                      </div>
                      <textarea
                        rows={4}
                        value={editFormData.originalIssueDetail || ""}
                        onChange={(e) =>
                          setEditFormData((f) => ({
                            ...f,
                            originalIssueDetail: e.target.value,
                          }))
                        }
                        placeholder="Original issue reported by the customer..."
                        className="w-full field-sizing-content text-xs text-slate-800 dark:text-neutral-200 placeholder:text-slate-400 dark:placeholder:text-neutral-600 bg-white dark:bg-neutral-900 border border-slate-200 dark:border-neutral-700 rounded-lg px-3 py-2 resize-none focus:outline-none focus:ring-2 focus:ring-slate-200 dark:focus:ring-slate-700 focus:border-slate-300 dark:focus:border-neutral-600 leading-relaxed shadow-sm"
                      />
                      <p className="text-[10px] text-slate-400 mt-1 leading-snug">
                        Official intake summary. Changes here do not modify
                        the latest activity update below.
                      </p>
                    </div>
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <p className="text-[11px] font-bold text-emerald-600 uppercase tracking-widest">
                          Latest activity update
                        </p>
                        <span className="inline-flex items-center gap-1 text-[9px] font-semibold text-emerald-600/80 uppercase tracking-wider bg-emerald-50 border border-emerald-100 rounded-full px-1.5 py-0.5">
                          <Activity className="w-2.5 h-2.5" />
                          Activity log
                        </span>
                      </div>
                      <textarea
                        rows={4}
                        value={selectedTicket.issueDetail || ""}
                        readOnly
                        placeholder="No activity update has been recorded yet"
                        className="w-full field-sizing-content text-xs text-slate-700 placeholder:text-slate-400 bg-emerald-50/40 border border-dashed border-emerald-200 rounded-lg px-3 py-2 resize-none focus:outline-none leading-relaxed cursor-default"
                      />
                      <p className="text-[10px] text-slate-400 mt-1 leading-snug">
                        Maintained through{" "}
                        <span className="font-semibold text-violet-700">
                          Log update
                        </span>
                        . This field is read-only in this section.
                      </p>
                    </div>
                    <div className="hidden">
                      <button
                        type="button"
                        onClick={onSaveProperties}
                        disabled={isUpdating}
                        className="flex items-center gap-1.5 text-white text-xs px-3 py-1.5 rounded-lg font-medium transition-colors disabled:opacity-50"
                        style={{ background: "#008f68" }}
                        onMouseEnter={(e) =>
                          (e.currentTarget.style.background = "#007a5a")
                        }
                        onMouseLeave={(e) =>
                          (e.currentTarget.style.background = "#008f68")
                        }
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

                  {/* ── Attachments ── */}
                  <section className="bg-white dark:bg-neutral-900 rounded-2xl border border-slate-100 dark:border-neutral-700 shadow-[0_1px_3px_rgba(0,0,0,0.06)] overflow-hidden">
                    {/* Header */}
                    <div className="flex items-center gap-2 px-5 pt-4 pb-3">
                      <div className="w-6 h-6 rounded-lg bg-blue-50 flex items-center justify-center shrink-0">
                        <Paperclip className="w-3 h-3 text-blue-500" />
                      </div>
                      <span className="text-[11px] font-bold text-slate-700 dark:text-neutral-300 uppercase tracking-wider">
                        Attachments
                      </span>
                      {pendingFiles.length +
                        (selectedTicket.attachments?.length ?? 0) >
                        0 && (
                        <span className="ml-auto text-[10px] font-semibold text-slate-400 bg-slate-100 rounded-full px-1.5 py-0.5 tabular-nums leading-none">
                          {pendingFiles.length +
                            (selectedTicket.attachments?.length ?? 0)}
                        </span>
                      )}
                    </div>

                    <div className="px-4 pb-4 space-y-2">
                      {/* ── Dropzone ── */}
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
                          const dropped = Array.from(e.dataTransfer.files);
                          if (dropped.length > 0)
                            onFilesChange([...pendingFiles, ...dropped]);
                        }}
                        className="group"
                      >
                        <input
                          ref={fileInputRef}
                          type="file"
                          id="ticket-file-upload"
                          multiple
                          onChange={handleFileSelect}
                          className="hidden"
                          accept=".svg,.png,.jpg,.jpeg,.pdf,.mp3,.wav,.m4a"
                        />
                        <label
                          htmlFor="ticket-file-upload"
                          className="flex items-center gap-2.5 w-full px-3 py-2.5 rounded-xl border border-dashed border-slate-200 bg-linear-to-r from-slate-50/90 to-sky-50/30 cursor-pointer transition-all duration-150 hover:border-blue-300 hover:from-sky-50/70 hover:to-blue-50/40"
                        >
                          <div className="flex items-center justify-center w-7 h-7 rounded-lg bg-white dark:bg-neutral-800 shadow-sm border border-slate-100/80 dark:border-neutral-700 shrink-0">
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

                      {/* ── Archivos pendientes ── */}
                      {pendingFiles.length > 0 && (
                        <div className="rounded-xl border border-slate-100 overflow-hidden divide-y divide-slate-50/80">
                          {pendingFiles.map((file, i) => {
                            const ext =
                              file.name.split(".").pop()?.toUpperCase() || "?";
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
                                key={i}
                                className="flex items-center gap-2 px-2.5 py-1.5 bg-white dark:bg-neutral-900 hover:bg-slate-50/70 dark:hover:bg-neutral-800 transition-colors"
                              >
                                <span
                                  className={`text-[9px] font-bold tracking-wider rounded-[5px] px-1.5 py-0.5 uppercase shrink-0 ${badge}`}
                                >
                                  {ext.slice(0, 4)}
                                </span>
                                <div className="flex-1 min-w-0">
                                  <p
                                    className="text-[11.5px] font-medium text-slate-700 truncate leading-tight"
                                    title={file.name}
                                  >
                                    {file.name}
                                  </p>
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
                                    onClick={() => removePendingFile(i)}
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

                      {/* ── Archivos guardados ── */}
                      {selectedTicket.attachments &&
                        selectedTicket.attachments.length > 0 && (
                          <div className="rounded-xl border border-slate-100 overflow-hidden divide-y divide-slate-50/80">
                            {selectedTicket.attachments.map(
                              (url: string, i: number) => {
                                const raw = url.split("/").pop() || "file";
                                const filename =
                                  raw.replace(/^\d+-\d+-/, "") || raw;
                                const ext =
                                  filename.split(".").pop()?.toUpperCase() ||
                                  "?";
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
                                    key={i}
                                    className="flex items-center gap-2 px-2.5 py-1.5 bg-white dark:bg-neutral-900 hover:bg-slate-50/70 dark:hover:bg-neutral-800 transition-colors"
                                  >
                                    <span
                                      className={`text-[9px] font-bold tracking-wider rounded-[5px] px-1.5 py-0.5 uppercase shrink-0 ${badge}`}
                                    >
                                      {ext.slice(0, 4)}
                                    </span>
                                    <div className="flex-1 min-w-0">
                                      <p
                                        className="text-[11.5px] font-medium text-slate-700 dark:text-neutral-300 truncate leading-tight"
                                        title={filename}
                                      >
                                        {filename}
                                      </p>
                                    </div>
                                    <div className="flex items-center gap-0.5 shrink-0">
                                      <button
                                        type="button"
                                        onClick={() => handleDownloadAttachment(url, filename)}
                                        aria-label={`Download ${filename}`}
                                        className="p-1 rounded-md text-blue-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                                      >
                                        <Download className="w-3 h-3" />
                                      </button>
                                    </div>
                                  </div>
                                );
                              },
                            )}
                          </div>
                        )}
                    </div>
                  </section>

                </div>
              )}
              {selectedTicket && (
                <div className="shrink-0 px-4 py-3 border-t border-slate-100 dark:border-neutral-800 bg-white/95 dark:bg-neutral-900/95 backdrop-blur-sm">
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={onSaveProperties}
                      disabled={isUpdating}
                      className="flex-1 flex items-center justify-center gap-2 py-2.5 text-white text-[13px] font-semibold rounded-xl transition-all active:scale-[0.98] disabled:opacity-50 bg-[#008f68] hover:bg-[#007a5a] shadow-sm"
                    >
                      {isUpdating ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <CheckCircle2 className="w-4 h-4" />
                      )}
                      {isUpdating ? "Saving..." : "Save properties"}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setSourcePeekCallId(null);
                        setShowUpdatePeek(true);
                      }}
                      className={cn(
                        "flex-1 flex items-center justify-center gap-2 py-2.5 text-[13px] font-semibold rounded-xl border transition-all active:scale-[0.98]",
                        showUpdatePeek
                          ? "border-violet-300 bg-violet-50 text-violet-800 ring-2 ring-violet-100"
                          : "border-violet-200 bg-white text-violet-700 hover:bg-violet-50 hover:border-violet-300",
                      )}
                    >
                      <Activity className="w-4 h-4" />
                      Log update
                    </button>
                  </div>
                </div>
              )}
            </main>

            {/* ═══ COL 3 (22%): Entity Inspector ═══ */}
            <div className="hidden w-72 shrink-0 flex-col border-l border-slate-200/60 dark:border-neutral-700 bg-white dark:bg-neutral-900 overflow-hidden">
              <div className="px-4 py-3 border-b border-slate-100 dark:border-neutral-800 shrink-0 bg-white dark:bg-neutral-900">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  Entity Inspector
                </p>
              </div>

              <div className="flex-1 overflow-y-auto px-2.5 pb-3 pt-2.5 space-y-2 [&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar-thumb]:bg-slate-200 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-track]:bg-transparent">
                {/* ── CARD: CLASSIFICATION ── */}
                <div className="bg-white dark:bg-neutral-900 border border-slate-200 dark:border-neutral-700 rounded-xl p-3 shadow-sm">
                  <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-2">
                    Classification
                  </p>
                  <div className="space-y-2">
                    <div>
                      <InspLabel>Status</InspLabel>
                      <TicketStatusToggle
                        value={editFormData.status || ""}
                        onChange={(v) =>
                          setEditFormData((f) => ({
                            ...f,
                            status: v as SupportTicketStatus,
                          }))
                        }
                        className="mt-1"
                        compact
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <InspLabel>Priority</InspLabel>
                        <InspectorSelect
                          value={editFormData.priority || ""}
                          onChange={(v) =>
                            setEditFormData((f) => ({
                              ...f,
                              priority: v as SupportTicketPriority,
                            }))
                          }
                          placeholder="Priority"
                        >
                          <SelectItem value="none">—</SelectItem>
                          {Object.values(SupportTicketPriority).map((p) => (
                            <SelectItem key={p} value={p}>
                              {formatEnumLabel(p)}
                            </SelectItem>
                          ))}
                        </InspectorSelect>
                      </div>
                      <div>
                        <InspLabel>Type</InspLabel>
                        <InspectorSelect
                          value={editFormData.ticketType || ""}
                          onChange={(v) =>
                            setEditFormData((f) => ({
                              ...f,
                              ticketType: v,
                            }))
                          }
                          placeholder="Type"
                        >
                          <SelectItem value="none">None</SelectItem>
                          {Object.values(SupportTicketType).map((t) => (
                            <SelectItem key={t} value={t}>
                              {formatEnumLabel(t)}
                            </SelectItem>
                          ))}
                        </InspectorSelect>
                      </div>
                    </div>
                    <div>
                      <InspLabel>Yard</InspLabel>
                      <InspectorCombobox
                        value={editFormData.yardId || ""}
                        onChange={(v) =>
                          setEditFormData((f) => ({ ...f, yardId: v }))
                        }
                        placeholder="Yard"
                        searchPlaceholder="Search yard…"
                        noneLabel="None"
                        items={yards.map((y: any) => ({
                          value: y.id.toString(),
                          label: y.name,
                        }))}
                      />
                    </div>
                    <div>
                      <InspLabel>Campaign</InspLabel>
                      <InspectorCombobox
                        value={editFormData.campaignId || ""}
                        onChange={(v) => {
                          const camp = campaigns.find(
                            (c: any) => c.id.toString() === v,
                          );
                          setEditFormData((f) => ({
                            ...f,
                            campaignId: v,
                            ...(camp?.yardaId
                              ? { yardId: camp.yardaId.toString() }
                              : {}),
                          }));
                        }}
                        placeholder="Campaign"
                        searchPlaceholder="Search campaign…"
                        noneLabel="None"
                        items={campaigns.map((c: any) => ({
                          value: c.id.toString(),
                          label: c.nombre,
                        }))}
                      />
                    </div>
                    {campaignOptionValues.length > 0 && (
                      <div>
                        <InspLabel>Campaign Option</InspLabel>
                        <InspectorSelect
                          value={editFormData.campaignOption || ""}
                          onChange={(v) =>
                            setEditFormData((f) => ({
                              ...f,
                              campaignOption: v,
                            }))
                          }
                          placeholder="Option"
                        >
                          <SelectItem value="none">None</SelectItem>
                          {campaignOptionValues.map((opt) => (
                            <SelectItem key={opt.value} value={opt.value}>
                              {opt.label}
                            </SelectItem>
                          ))}
                        </InspectorSelect>
                      </div>
                    )}
                    <div>
                      <InspLabel>Agent</InspLabel>
                      <InspectorCombobox
                        value={editFormData.agentId || ""}
                        onChange={(v) =>
                          setEditFormData((f) => ({ ...f, agentId: v }))
                        }
                        placeholder="Unassigned"
                        searchPlaceholder="Search agent…"
                        noneLabel="Unassigned"
                        items={agents.map((a: any) => ({
                          value: a.id.toString(),
                          label: a.name,
                        }))}
                      />
                    </div>
                  </div>
                </div>

                {/* ── CARD: FOLLOW-UP ── */}
                <div className="bg-white dark:bg-neutral-900 border border-slate-200 dark:border-neutral-700 rounded-xl p-3 shadow-sm">
                  <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-2">
                    Follow-up
                  </p>
                  <div className="space-y-2">
                    <div>
                      <InspLabel>Due Date</InspLabel>
                      <Popover
                        open={calendarOpen}
                        onOpenChange={setCalendarOpen}
                      >
                        <PopoverTrigger asChild>
                          <button
                            type="button"
                            className="w-full h-7 flex items-center gap-2 px-2.5 text-xs bg-slate-50 dark:bg-neutral-800 border border-transparent hover:border-slate-300 dark:hover:border-neutral-600 focus:bg-white dark:focus:bg-neutral-900 focus:ring-2 focus:ring-[#008f68]/20 rounded-lg transition-colors text-left"
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
                              setEditFormData((f) => ({
                                ...f,
                                followUpDueDate: date ? date.toISOString() : "",
                              }));
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
                                  setEditFormData((f) => ({
                                    ...f,
                                    followUpDueDate: "",
                                  }));
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
                          setEditFormData((f) => ({
                            ...f,
                            followUpAssignedToId: v,
                          }))
                        }
                        placeholder="Assign…"
                      >
                        <SelectItem value="none">Not assigned</SelectItem>
                        {agents.map((a: any) => (
                          <SelectItem key={a.id} value={a.id.toString()}>
                            {a.name}
                          </SelectItem>
                        ))}
                      </InspectorSelect>
                    </div>
                  </div>
                </div>

                {/* ── CARD: CUSTOMER ── */}
                <div className="bg-white dark:bg-neutral-900 border border-slate-200 dark:border-neutral-700 rounded-xl p-3 shadow-sm">
                  <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-2">
                    Customer
                  </p>
                  <div className="space-y-2">
                    <div>
                      <InspLabel>
                        Name <span className="text-red-400 normal-case">*</span>
                      </InspLabel>
                      <Popover
                        open={customerOpen}
                        onOpenChange={(isOpen) => {
                          setCustomerOpen(isOpen);
                          if (!isOpen) setCustomerSearch("");
                        }}
                      >
                        <PopoverTrigger asChild>
                          <button
                            type="button"
                            className="w-full h-7 flex items-center justify-between gap-1 px-2.5 text-xs bg-slate-50 dark:bg-neutral-800 border border-transparent hover:border-slate-300 dark:hover:border-neutral-600 rounded-lg transition-colors text-left"
                          >
                            <span className="truncate text-slate-800 font-medium">
                              {editFormData.customerId
                                ? customersForTicketSheet.find(
                                    (c: any) =>
                                      c.id.toString() ===
                                      editFormData.customerId,
                                  )?.name || editFormData.customerId
                                : "Select customer…"}
                            </span>
                            <ChevronsUpDown className="w-3 h-3 text-slate-400 shrink-0" />
                          </button>
                        </PopoverTrigger>
                        <PopoverContent className="w-64 p-0" align="end">
                          <div className="flex flex-col">
                            <div className="px-3 py-2 border-b">
                              <Input
                                placeholder="Search customer…"
                                value={customerSearch}
                                onChange={(e) =>
                                  setCustomerSearch(e.target.value)
                                }
                                className="h-8 text-xs"
                              />
                            </div>
                            <div className="max-h-48 overflow-y-auto p-1">
                              {filteredCustomers.length === 0 ? (
                                <div className="py-4 text-center text-xs text-slate-400">
                                  No customer found.
                                </div>
                              ) : (
                                filteredCustomers.map((c: any) => (
                                  <div
                                    key={c.id}
                                    className={cn(
                                      "flex cursor-pointer items-center gap-2 rounded px-2 py-2 text-xs hover:bg-slate-100",
                                      editFormData.customerId ===
                                        c.id.toString() && "bg-slate-100",
                                    )}
                                    onClick={() => {
                                      setEditFormData((f) => ({
                                        ...f,
                                        customerId: c.id.toString(),
                                      }));
                                      setCustomerSearch("");
                                      setCustomerOpen(false);
                                    }}
                                  >
                                    <Check
                                      className={cn(
                                        "w-3.5 h-3.5 shrink-0",
                                        editFormData.customerId ===
                                          c.id.toString()
                                          ? "opacity-100 text-[#008f68]"
                                          : "opacity-0",
                                      )}
                                    />
                                    <div className="flex-1 min-w-0">
                                      <p className="font-medium truncate">
                                        {c.name}
                                      </p>
                                      {c.phone && (
                                        <p className="text-slate-400 truncate">
                                          {c.phone}
                                        </p>
                                      )}
                                    </div>
                                  </div>
                                ))
                              )}
                            </div>
                          </div>
                        </PopoverContent>
                      </Popover>
                    </div>
                    <div>
                      <InspLabel>Phone</InspLabel>
                      <div className="h-7 flex items-center px-2.5 text-xs bg-slate-50 dark:bg-neutral-800 rounded-lg text-slate-500 dark:text-neutral-400 font-mono">
                        {customersForTicketSheet.find(
                          (c: any) =>
                            c.id.toString() === editFormData.customerId,
                        )?.phone || "Auto-filled"}
                      </div>
                    </div>
                  </div>
                </div>

                {/* ── Save Button ── */}
                <button
                  type="button"
                  onClick={onSaveProperties}
                  disabled={isUpdating}
                  className="w-full flex items-center justify-center gap-2 py-2.5 text-white text-sm font-semibold rounded-xl transition-colors disabled:opacity-50 shadow-sm"
                  style={{ background: "#008f68" }}
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.background = "#007a5a")
                  }
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.background = "#008f68")
                  }
                >
                  {isUpdating ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <CheckCircle2 className="w-4 h-4" />
                  )}
                  {isUpdating ? "Saving…" : "Save properties"}
                </button>
              </div>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
