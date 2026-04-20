"use client";

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
import { Input } from "@/components/ui/input";
import { SelectItem } from "@/components/ui/select";
import {
  X,
  PhoneOutgoing,
  Loader2,
  StickyNote,
  Activity,
  CalendarIcon,
  CheckCircle2,
  Pencil,
  Link2,
  Ticket as TicketIcon,
  Paperclip,
  FileIcon,
  Upload,
  Check,
  ChevronsUpDown,
} from "lucide-react";
import {
  SupportTicketStatus,
  SupportTicketPriority,
  SupportTicketType,
  ManagementType,
  OnboardingOption,
  ArOption,
  type SupportTicketRecord,
  type CreateSupportTicketFormData,
} from "../../types";
import type { CustomerTicketGroup } from "../tickets/InlineTicketTimeline";
import { formatEnumLabel, fmtDate, fmtRelative } from "../../utils/call-helpers";
import { InspLabel, InspectorSelect } from "../shared/InspectorHelpers";
import { useAircall } from "@/components/providers/AircallProvider";

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
  OPEN: { dot: "#008f68", bg: "#e6f5f0", fg: "#006d50", label: "Open" },
  IN_PROGRESS: {
    dot: "#2563eb",
    bg: "#eff6ff",
    fg: "#1d4ed8",
    label: "In Progress",
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

// ── Mock timeline entries ─────────────────────────────────────────────────────

const MOCK_TIMELINE = [
  {
    id: 1,
    icon: TicketIcon,
    color: "#008f68",
    title: "Ticket created",
    time: "Auto-generated",
  },
  {
    id: 2,
    icon: StickyNote,
    color: "#c47a00",
    title: "Note added",
    time: "by Agent",
  },
  {
    id: 3,
    icon: Activity,
    color: "#7c3aed",
    title: "Status updated",
    time: "via form",
  },
];

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
  const sp = STATUS_PILL[ticket.status || ""] || STATUS_PILL.CLOSED;
  const pp = PRIORITY_PILL[ticket.priority || ""] || PRIORITY_PILL.LOW;

  return (
    <button
      ref={ref}
      type="button"
      onClick={onClick}
      className={cn(
        "w-full text-left px-3 py-3 border-b border-slate-100 transition-all last:border-0",
        isActive
          ? "bg-white border-l-[4px] border-l-[#008f68] shadow-sm pl-2.5"
          : "border-l-[4px] border-l-transparent hover:bg-slate-100",
      )}
    >
      <div className="flex items-center justify-between gap-1 mb-1">
        <span className="text-[11px] font-bold text-slate-700 font-mono">
          #{ticket.id}
        </span>
        <span className="text-[11px] text-slate-400">{dateLabel}</span>
      </div>
      {ticket.ticketType && (
        <p className="text-[11px] text-slate-500 mb-1.5 truncate">
          {formatEnumLabel(ticket.ticketType)}
        </p>
      )}
      <div className="flex flex-wrap items-center gap-1">
        <span
          className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full"
          style={{ color: sp.fg, background: sp.bg }}
        >
          <span
            className="w-1.5 h-1.5 rounded-full shrink-0"
            style={{ background: sp.dot }}
          />
          {sp.label}
        </span>
        <span
          className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full"
          style={{ color: pp.fg, background: pp.bg }}
        >
          <span
            className="w-1.5 h-1.5 rounded-full shrink-0"
            style={{ background: pp.dot }}
          />
          {pp.label}
        </span>
      </div>
    </button>
  );
}

// ── Props ──────────────────────────────────────────────────────────────────────

interface CustomerTicketDrawerProps {
  open: boolean;
  onClose: () => void;
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
  onUpdate: () => void;
  customers: any[];
  yards: any[];
  agents: any[];
  campaigns: any[];
  phoneLines: { id: number; label: string | null; phoneNumber: string }[];
}

// ── Main Drawer ────────────────────────────────────────────────────────────────

export function CustomerTicketDrawer({
  open,
  onClose,
  group,
  selectedTicket,
  onSelectTicket,
  editFormData,
  setEditFormData,
  pendingFiles,
  onFilesChange,
  isUpdating,
  onUpdate,
  customers,
  yards,
  agents,
  campaigns,
  phoneLines,
}: CustomerTicketDrawerProps) {
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [customerOpen, setCustomerOpen] = useState(false);
  const [customerSearch, setCustomerSearch] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const {
    dial,
    status: aircallStatus,
    isLoggedIn: aircallLoggedIn,
  } = useAircall();
  const canDial = aircallStatus === "ready" && aircallLoggedIn;
  const dialPhone = selectedTicket?.customer?.phone || group?.customerPhone || "";

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

  // Campaign options derived in one memo
  const campaignOptionValues = useMemo(() => {
    if (!editFormData.campaignId) return [];
    const camp = campaigns.find(
      (c: any) => c.id.toString() === editFormData.campaignId,
    );
    const type = camp?.tipo?.toString().toUpperCase();
    if (type === ManagementType.ONBOARDING) return Object.values(OnboardingOption);
    if (type === ManagementType.AR) return Object.values(ArOption);
    return [];
  }, [campaigns, editFormData.campaignId]);

  const followUpDateDisplay = useMemo(
    () => (editFormData.followUpDueDate ? fmtDate(editFormData.followUpDueDate) : null),
    [editFormData.followUpDueDate],
  );

  const filteredCustomers = useMemo(() => {
    if (!customerSearch.trim()) return customers;
    const s = customerSearch.toLowerCase();
    const sd = normalizePhone(customerSearch);
    const sds = stripUsCode(sd);
    return customers.filter((c: any) => {
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
  }, [customers, customerSearch]);

  // Status/priority pills for selected ticket
  const sp = STATUS_PILL[selectedTicket?.status || ""] || null;
  const pp = PRIORITY_PILL[selectedTicket?.priority || ""] || null;

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
    <Sheet open={open} onOpenChange={(v) => !v && onClose()}>
      <SheetContent
        side="right"
        className="w-[55vw]! max-w-[55vw]! sm:max-w-[55vw]! p-0 flex flex-col bg-slate-50 [&>button.absolute]:hidden overflow-hidden"
      >
        <SheetTitle className="sr-only">
          {customerName
            ? `Ticket Command Center — ${customerName}`
            : "Ticket Command Center"}
        </SheetTitle>

        {/* ── Top Bar ── */}
        <div className="flex items-center gap-3 px-5 py-3 bg-white border-b border-slate-200 shrink-0 shadow-sm">
          <div
            className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0"
            style={{
              background: `hsl(${(customerName?.charCodeAt(0) ?? 200) % 360} 50% 46%)`,
            }}
          >
            {customerName ? customerName.substring(0, 2).toUpperCase() : "?"}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5">
              <p className="text-[13px] font-bold text-slate-900 leading-tight truncate">
                {customerName}
              </p>
              <button
                type="button"
                title="Edit contact"
                className="w-5 h-5 flex items-center justify-center rounded hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors shrink-0"
              >
                <Pencil className="w-3 h-3" />
              </button>
            </div>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-xs text-slate-500 font-mono">
                {customerPhone || "—"}
              </span>
              <span className="text-slate-300">·</span>
              <span className="text-xs text-slate-500 flex items-center gap-1">
                {isLoadingHistory ? (
                  <Loader2 className="w-3 h-3 animate-spin" />
                ) : (
                  <>
                    {ticketCount} ticket{ticketCount !== 1 ? "s" : ""}
                  </>
                )}
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              if (dialPhone && canDial) dial(dialPhone, selectedTicket?.id);
            }}
            disabled={!dialPhone || !canDial}
            className="flex items-center gap-1.5 h-8 px-3.5 disabled:opacity-40 text-white text-xs font-semibold rounded-lg transition-colors"
            style={{ background: "#008f68" }}
            onMouseEnter={(e) =>
              (e.currentTarget.style.background = "#007a5a")
            }
            onMouseLeave={(e) =>
              (e.currentTarget.style.background = "#008f68")
            }
          >
            <PhoneOutgoing className="w-3.5 h-3.5" />
            Call
          </button>
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
          {/* ═══ COL 1 (18%): Ticket Feed ═══ */}
          <div className="w-[18%] shrink-0 flex flex-col border-r border-slate-200 bg-slate-50 overflow-hidden">
            <div className="px-3 py-2.5 border-b border-slate-200 shrink-0">
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">
                Ticket History
              </p>
            </div>
            <div className="flex-1 overflow-y-auto [&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar-thumb]:bg-slate-200 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-track]:bg-transparent">
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
          </div>

          {/* ═══ COL 2 (flex): Hub ═══ */}
          <div className="flex-1 flex flex-col min-w-0 overflow-hidden bg-white">
            {!selectedTicket ? (
              <div className="flex-1 flex items-center justify-center text-slate-400">
                <div className="text-center">
                  <TicketIcon className="w-8 h-8 opacity-30 mx-auto mb-2" />
                  <p className="text-sm">Select a ticket to inspect</p>
                </div>
              </div>
            ) : (
              <div className="flex-1 overflow-y-auto p-4 space-y-3 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:bg-slate-200 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-track]:bg-transparent">
                {/* ── Metadata Strip ── */}
                <div className="bg-slate-50 border border-slate-100 rounded-xl p-2.5 flex justify-between items-center gap-2">
                  {[
                    { label: "ID", value: `#${selectedTicket.id}` },
                    {
                      label: "Created",
                      value: fmtDate(selectedTicket.createdAt),
                    },
                    {
                      label: "Status",
                      value: sp ? (
                        <span
                          className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full"
                          style={{ color: sp.fg, background: sp.bg }}
                        >
                          <span
                            className="w-1.5 h-1.5 rounded-full"
                            style={{ background: sp.dot }}
                          />
                          {sp.label}
                        </span>
                      ) : (
                        "—"
                      ),
                    },
                    {
                      label: "Priority",
                      value: pp ? (
                        <span
                          className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full"
                          style={{ color: pp.fg, background: pp.bg }}
                        >
                          <span
                            className="w-1.5 h-1.5 rounded-full"
                            style={{ background: pp.dot }}
                          />
                          {pp.label}
                        </span>
                      ) : (
                        "—"
                      ),
                    },
                    {
                      label: "Type",
                      value: selectedTicket.ticketType
                        ? formatEnumLabel(selectedTicket.ticketType)
                        : "—",
                    },
                  ].map((item, i) => (
                    <div
                      key={i}
                      className={`flex flex-col gap-0.5 ${i > 0 ? "border-l border-slate-200 pl-3" : ""}`}
                    >
                      <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                        {item.label}
                      </span>
                      {typeof item.value === "string" ? (
                        <span className="text-[12px] font-bold text-slate-800 font-mono">
                          {item.value}
                        </span>
                      ) : (
                        item.value
                      )}
                    </div>
                  ))}
                </div>

                {/* ── Issue Detail ── */}
                <div>
                  <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">
                    Issue Detail
                  </p>
                  <div className="space-y-1.5">
                    <textarea
                      rows={4}
                      value={editFormData.issueDetail || ""}
                      onChange={(e) =>
                        setEditFormData((f) => ({
                          ...f,
                          issueDetail: e.target.value,
                        }))
                      }
                      placeholder="Describe the issue…"
                      className="w-full text-xs text-slate-800 placeholder:text-slate-400 bg-white border border-slate-200 rounded-lg px-3 py-2 resize-none focus:outline-none focus:ring-2 focus:ring-[#008f68]/20 focus:border-[#008f68] leading-relaxed shadow-sm"
                    />
                    <div className="flex justify-end">
                      <button
                        type="button"
                        onClick={onUpdate}
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
                </div>

                {/* ── Activity Timeline ── */}
                <div>
                  <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-2">
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
                                <span className="text-[12px] font-semibold text-slate-800">
                                  {item.title}
                                </span>
                                <span className="text-[11px] text-slate-400 shrink-0">
                                  {item.time}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* ── Attachments ── */}
                <div>
                  <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">
                    Attachments
                  </p>
                  <div className="bg-slate-50 border border-slate-100 rounded-xl p-3 space-y-2">
                    <input
                      ref={fileInputRef}
                      type="file"
                      multiple
                      className="hidden"
                      onChange={handleFileSelect}
                    />
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="flex items-center gap-1.5 h-7 px-3 rounded-lg border border-slate-200 bg-white text-slate-600 text-[11px] font-semibold hover:bg-slate-50 transition-colors"
                    >
                      <Upload className="w-3 h-3" />
                      Add Files
                    </button>

                    {selectedTicket.attachments &&
                      selectedTicket.attachments.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                          {selectedTicket.attachments.map(
                            (url: string, i: number) => (
                              <a
                                key={i}
                                href={url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-1 text-[11px] font-medium px-2 py-1 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 transition-colors"
                              >
                                <Paperclip className="w-3 h-3" />
                                {url.split("/").pop()}
                              </a>
                            ),
                          )}
                        </div>
                      )}

                    {pendingFiles.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {pendingFiles.map((file, i) => (
                          <div
                            key={i}
                            className="flex items-center gap-1 text-[11px] bg-white border border-slate-200 px-2 py-1 rounded-lg"
                          >
                            <FileIcon className="w-3 h-3 text-slate-400" />
                            <span className="max-w-[120px] truncate text-slate-700">
                              {file.name}
                            </span>
                            <button
                              type="button"
                              onClick={() => removePendingFile(i)}
                              className="ml-1 text-slate-400 hover:text-red-500 transition-colors"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* ── Customer Notes banner ── */}
                {((selectedTicket.customer?.notes &&
                  selectedTicket.customer.notes.length > 0) ||
                  selectedTicket.customer?.note) && (
                  <div className="flex items-start gap-2 px-3 py-2 bg-amber-50 border border-amber-200 rounded-lg">
                    <StickyNote className="w-3.5 h-3.5 text-amber-500 mt-0.5 shrink-0" />
                    <div>
                      <p className="text-xs font-semibold text-amber-800">
                        Customer Notes
                      </p>
                      <p className="text-xs text-amber-700 mt-0.5 leading-relaxed">
                        {selectedTicket.customer?.notes?.[0]?.content ||
                          selectedTicket.customer?.note}
                      </p>
                    </div>
                  </div>
                )}

                {/* ── Timestamps grid ── */}
                <div className="bg-slate-50 border border-slate-100 rounded-xl p-3">
                  <p className="text-[11px] text-slate-400 font-bold uppercase tracking-wider mb-2">
                    Timestamps
                  </p>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { label: "Created", value: fmtDate(selectedTicket.createdAt) },
                      { label: "Updated", value: fmtDate((selectedTicket as any).updatedAt) },
                      { label: "Follow-up", value: fmtDate(editFormData.followUpDueDate) },
                    ].map((item) => (
                      <div key={item.label}>
                        <p className="text-[11px] text-slate-400 uppercase tracking-wider font-semibold mb-0.5">
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
            )}
          </div>

          {/* ═══ COL 3 (22%): Entity Inspector ═══ */}
          <div className="w-[22%] shrink-0 flex flex-col border-l border-slate-200 bg-slate-50/50 overflow-hidden">
            <div className="px-4 py-2.5 border-b border-slate-200 shrink-0 bg-white">
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">
                Entity Inspector
              </p>
            </div>

            <div className="flex-1 overflow-y-auto px-2.5 pb-3 pt-2.5 space-y-2 [&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar-thumb]:bg-slate-200 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-track]:bg-transparent">
              {/* ── CARD: CLASSIFICATION ── */}
              <div className="bg-white border border-slate-200 rounded-xl p-3 shadow-sm">
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-2">
                  Classification
                </p>
                <div className="space-y-2">
                  <div>
                    <InspLabel>Status</InspLabel>
                    <InspectorSelect
                      value={editFormData.status || ""}
                      onChange={(v) =>
                        setEditFormData((f) => ({
                          ...f,
                          status: v as SupportTicketStatus,
                        }))
                      }
                      placeholder="Status"
                    >
                      <SelectItem value="none">—</SelectItem>
                      {Object.values(SupportTicketStatus).map((s) => (
                        <SelectItem key={s} value={s}>
                          {formatEnumLabel(s)}
                        </SelectItem>
                      ))}
                    </InspectorSelect>
                  </div>
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
                  <div>
                    <InspLabel>Yard</InspLabel>
                    <InspectorSelect
                      value={editFormData.yardId || ""}
                      onChange={(v) =>
                        setEditFormData((f) => ({ ...f, yardId: v }))
                      }
                      placeholder="Yard"
                    >
                      <SelectItem value="none">None</SelectItem>
                      {yards.map((y: any) => (
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
                    >
                      <SelectItem value="none">None</SelectItem>
                      {campaigns.map((c: any) => (
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
                          setEditFormData((f) => ({ ...f, campaignOption: v }))
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
                  <div>
                    <InspLabel>Agent</InspLabel>
                    <InspectorSelect
                      value={editFormData.agentId || ""}
                      onChange={(v) =>
                        setEditFormData((f) => ({ ...f, agentId: v }))
                      }
                      placeholder="Unassigned"
                    >
                      <SelectItem value="none">Unassigned</SelectItem>
                      {agents.map((a: any) => (
                        <SelectItem key={a.id} value={a.id.toString()}>
                          {a.name}
                        </SelectItem>
                      ))}
                    </InspectorSelect>
                  </div>
                </div>
              </div>

              {/* ── CARD: FOLLOW-UP ── */}
              <div className="bg-white border border-slate-200 rounded-xl p-3 shadow-sm">
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-2">
                  Follow-up
                </p>
                <div className="space-y-2">
                  <div>
                    <InspLabel>Due Date</InspLabel>
                    <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
                      <PopoverTrigger asChild>
                        <button
                          type="button"
                          className="w-full h-7 flex items-center gap-2 px-2.5 text-xs bg-slate-50 border border-transparent hover:border-slate-300 focus:bg-white focus:ring-2 focus:ring-[#008f68]/20 rounded-lg transition-colors text-left"
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
              <div className="bg-white border border-slate-200 rounded-xl p-3 shadow-sm">
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
                          className="w-full h-7 flex items-center justify-between gap-1 px-2.5 text-xs bg-slate-50 border border-transparent hover:border-slate-300 rounded-lg transition-colors text-left"
                        >
                          <span className="truncate text-slate-800 font-medium">
                            {editFormData.customerId
                              ? customers.find(
                                  (c: any) =>
                                    c.id.toString() === editFormData.customerId,
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
                                    editFormData.customerId === c.id.toString() &&
                                      "bg-slate-100",
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
                                      editFormData.customerId === c.id.toString()
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
                    <div className="h-7 flex items-center px-2.5 text-xs bg-slate-50 rounded-lg text-slate-500 font-mono">
                      {customers.find(
                        (c: any) =>
                          c.id.toString() === editFormData.customerId,
                      )?.phone || "Auto-filled"}
                    </div>
                  </div>
                  <div>
                    <InspLabel>Phone Line</InspLabel>
                    <InspectorSelect
                      value={editFormData.phoneLineId || ""}
                      onChange={(v) =>
                        setEditFormData((f) => ({ ...f, phoneLineId: v }))
                      }
                      placeholder="Select line"
                    >
                      <SelectItem value="none">None</SelectItem>
                      {phoneLines.map((pl) => (
                        <SelectItem key={pl.id} value={pl.id.toString()}>
                          {pl.label
                            ? `${pl.label} (${pl.phoneNumber})`
                            : pl.phoneNumber}
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
                {isUpdating ? "Saving…" : "Save Changes"}
              </button>
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
