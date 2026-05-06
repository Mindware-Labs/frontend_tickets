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
  PhoneIncoming,
  PhoneMissed,
  Phone,
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
  ExternalLink,
  CloudUpload,
  Download,
  AlertCircle,
  Clock,
  ChevronDown,
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
import {
  formatEnumLabel,
  fmtDate,
  fmtRelative,
} from "../../utils/call-helpers";
import {
  InspLabel,
  InspectorSelect,
  InspectorCombobox,
} from "../shared/InspectorHelpers";
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
              : "bg-white border-slate-300",
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
              : "bg-white border-slate-100 hover:border-slate-200 hover:bg-slate-50/60",
          )}
        >
          <div className="flex items-center justify-between gap-1 mb-1.5">
            <span
              className={cn(
                "text-[11px] font-bold font-mono",
                isActive ? "text-[#008f68]" : "text-slate-700",
              )}
            >
              #{ticket.id}
            </span>
            <span className="text-[9.5px] text-slate-400 tabular-nums">
              {dateLabel}
            </span>
          </div>
          {ticket.ticketType && (
            <p className="text-[11px] text-slate-500 mb-1.5 truncate">
              {formatEnumLabel(ticket.ticketType)}
            </p>
          )}
          <div className="flex flex-wrap items-center gap-1">
            <span
              className="inline-flex items-center gap-1 text-[9.5px] font-semibold px-1.5 py-0.5 rounded-md"
              style={{ color: sp.fg, background: sp.bg }}
            >
              <span
                className="w-1.5 h-1.5 rounded-full shrink-0"
                style={{ background: sp.dot }}
              />
              {sp.label}
            </span>
            <span
              className="inline-flex items-center gap-1 text-[9.5px] font-semibold px-1.5 py-0.5 rounded-md"
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
      </div>
    </div>
  );
}

// ── Props ──────────────────────────────────────────────────────────────────────

function SectionHeading({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest mb-4 pt-1">
      {children}
    </p>
  );
}

function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
      {children}
    </p>
  );
}

function TicketPropertiesCard({
  editFormData,
  setEditFormData,
  customers,
  yards,
  agents,
  campaigns,
  phoneLines,
  campaignOptionValues,
  followUpDateDisplay,
  mainCustomerOpen,
  setMainCustomerOpen,
  mainCustomerSearch,
  setMainCustomerSearch,
  mainFilteredCustomers,
  mainCalendarOpen,
  setMainCalendarOpen,
}: {
  editFormData: CreateSupportTicketFormData;
  setEditFormData: React.Dispatch<
    React.SetStateAction<CreateSupportTicketFormData>
  >;
  customers: any[];
  yards: any[];
  agents: any[];
  campaigns: any[];
  phoneLines: { id: number; label: string | null; phoneNumber: string }[];
  campaignOptionValues: string[];
  followUpDateDisplay: string | null;
  mainCustomerOpen: boolean;
  setMainCustomerOpen: (open: boolean) => void;
  mainCustomerSearch: string;
  setMainCustomerSearch: (search: string) => void;
  mainFilteredCustomers: any[];
  mainCalendarOpen: boolean;
  setMainCalendarOpen: (open: boolean) => void;
}) {
  const [timeHourInput, setTimeHourInput] = useState("12");
  const [timeMinuteInput, setTimeMinuteInput] = useState("00");
  const [timePeriod, setTimePeriod] = useState<"AM" | "PM">("AM");

  useEffect(() => {
    if (editFormData.followUpDueDate) {
      const d = new Date(editFormData.followUpDueDate);
      const h24 = d.getHours();
      const h12 = h24 === 0 ? 12 : h24 > 12 ? h24 - 12 : h24;
      setTimeHourInput(String(h12).padStart(2, "0"));
      setTimeMinuteInput(String(d.getMinutes()).padStart(2, "0"));
      setTimePeriod(h24 < 12 ? "AM" : "PM");
    } else {
      setTimeHourInput("12");
      setTimeMinuteInput("00");
      setTimePeriod("AM");
    }
  }, [editFormData.followUpDueDate]);

  return (
    <section className="bg-white rounded-2xl border border-slate-100 shadow-[0_1px_3px_rgba(0,0,0,0.06)] overflow-hidden">
      <div className="flex items-center gap-2 px-5 pt-3 pb-3 border-b border-slate-50">
        <div className="w-6 h-6 rounded-lg bg-slate-100 flex items-center justify-center shrink-0">
          <TicketIcon className="w-3 h-3 text-slate-500" />
        </div>
        <span className="text-[12px] font-bold text-slate-700">
          Ticket Details &amp; Properties
        </span>
      </div>

      <div className="p-6 space-y-6">
        {/* SECTION 1: CAMPAIGN & LOCATION */}
        <div>
          <SectionHeading>Campaign &amp; Location</SectionHeading>
          <div className="grid grid-cols-2 gap-x-6 gap-y-5">
            {/* Campaign */}
            <div>
              <FieldLabel>Campaign</FieldLabel>
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
                searchPlaceholder="Search campaign..."
                noneLabel="None"
                items={campaigns.map((c: any) => ({
                  value: c.id.toString(),
                  label: c.nombre,
                }))}
              />
            </div>

            {/* Yard */}
            <div>
              <FieldLabel>Yard</FieldLabel>
              <InspectorCombobox
                value={editFormData.yardId || ""}
                onChange={(v) => setEditFormData((f) => ({ ...f, yardId: v }))}
                placeholder="Yard"
                searchPlaceholder="Search yard..."
                noneLabel="None"
                items={yards.map((y: any) => ({
                  value: y.id.toString(),
                  label: y.name,
                }))}
              />
            </div>

            {campaignOptionValues.length > 0 && (
              <div className="col-span-2 animate-in fade-in slide-in-from-left-2">
                <FieldLabel>Campaign Option</FieldLabel>
                <InspectorSelect
                  value={editFormData.campaignOption || ""}
                  onChange={(v) =>
                    setEditFormData((f) => ({
                      ...f,
                      campaignOption: v === "none" ? "" : v,
                    }))
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
          </div>
        </div>

        {/* SECTION 2: CUSTOMER INFORMATION */}
        <div>
          <SectionHeading>Customer Information</SectionHeading>
          <div className="grid grid-cols-2 gap-x-6 gap-y-5">
            {/* Customer */}
            <div>
              <FieldLabel>
                Customer <span className="text-red-400 normal-case">*</span>
              </FieldLabel>
              <Popover
                open={mainCustomerOpen}
                onOpenChange={(isOpen) => {
                  setMainCustomerOpen(isOpen);
                  if (!isOpen) setMainCustomerSearch("");
                }}
              >
                <PopoverTrigger asChild>
                  <button
                    type="button"
                    className="w-full h-8 flex items-center justify-between gap-1 px-2.5 text-xs bg-slate-50 border border-transparent hover:border-slate-300 rounded-lg transition-colors text-left"
                  >
                    <span className="truncate text-slate-800 font-medium">
                      {editFormData.customerId
                        ? customers.find(
                            (c: any) =>
                              c.id.toString() === editFormData.customerId,
                          )?.name || editFormData.customerId
                        : "Select customer..."}
                    </span>
                    <ChevronsUpDown className="w-3 h-3 text-slate-400 shrink-0" />
                  </button>
                </PopoverTrigger>
                <PopoverContent className="w-72 p-0" align="start">
                  <div className="flex flex-col">
                    <div className="px-3 py-2 border-b">
                      <Input
                        placeholder="Search customer..."
                        value={mainCustomerSearch}
                        onChange={(e) => setMainCustomerSearch(e.target.value)}
                        className="h-8 text-xs"
                      />
                    </div>
                    <div className="max-h-52 overflow-y-auto p-1">
                      {mainFilteredCustomers.length === 0 ? (
                        <div className="py-4 text-center text-xs text-slate-400">
                          No customer found.
                        </div>
                      ) : (
                        mainFilteredCustomers.map((c: any) => (
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
                              setMainCustomerSearch("");
                              setMainCustomerOpen(false);
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
                              <p className="font-medium truncate">{c.name}</p>
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

            {/* Phone Line */}
            <div>
              <FieldLabel>Phone Line</FieldLabel>
              <InspectorSelect
                value={editFormData.phoneLineId || ""}
                onChange={(v) =>
                  setEditFormData((f) => ({
                    ...f,
                    phoneLineId: v === "none" ? "" : v,
                  }))
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

            {/* Assign Agent — spans full row */}
            <div className="col-span-2">
              <FieldLabel>Assign Agent</FieldLabel>
              <InspectorCombobox
                value={editFormData.agentId || ""}
                onChange={(v) => setEditFormData((f) => ({ ...f, agentId: v }))}
                placeholder="Unassigned"
                searchPlaceholder="Search agent..."
                noneLabel="Unassigned"
                items={agents.map((a: any) => ({
                  value: a.id.toString(),
                  label: a.name,
                }))}
              />
            </div>
          </div>
        </div>

        {/* SECTION 3: TICKET STATUS & CLASSIFICATION */}
        <div>
          <SectionHeading>Status &amp; Classification</SectionHeading>
          <div className="grid grid-cols-2 gap-x-6 gap-y-5">
            {/* Status */}
            <div>
              <FieldLabel>Status</FieldLabel>
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
                {Object.values(SupportTicketStatus).map((s) => (
                  <SelectItem key={s} value={s}>
                    {formatEnumLabel(s)}
                  </SelectItem>
                ))}
              </InspectorSelect>
            </div>

            {/* Priority */}
            <div>
              <FieldLabel>Priority</FieldLabel>
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
                {Object.values(SupportTicketPriority).map((p) => (
                  <SelectItem key={p} value={p}>
                    {formatEnumLabel(p)}
                  </SelectItem>
                ))}
              </InspectorSelect>
            </div>

            {/* Type */}
            <div className="col-span-2">
              <FieldLabel>Type</FieldLabel>
              <InspectorSelect
                value={editFormData.ticketType || ""}
                onChange={(v) =>
                  setEditFormData((f) => ({
                    ...f,
                    ticketType: v === "none" ? "" : v,
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
        </div>

        {/* SECTION 4: FOLLOW-UP (conditional on PENDING_FOLLOWUP status) */}
        {editFormData.status === SupportTicketStatus.PENDING_FOLLOWUP && (
          <div className="animate-in fade-in-0 slide-in-from-top-2 duration-200">
            <div className="grid grid-cols-2 gap-3 rounded-xl p-3 bg-amber-50 border border-amber-200/70">
              {/* Follow-up Due Date */}
              <div>
                <div className="flex items-center gap-1.5 mb-1.5">
                  <FieldLabel>Follow-up Date</FieldLabel>
                  <span className="text-[8.5px] font-black text-amber-600 bg-amber-100 border border-amber-300/60 px-1.5 py-0.5 rounded-md uppercase tracking-wide">
                    Follow-up
                  </span>
                </div>
                <Popover
                  open={mainCalendarOpen}
                  onOpenChange={setMainCalendarOpen}
                >
                  <PopoverTrigger asChild>
                    <button
                      type="button"
                      className="w-full h-8 flex items-center gap-2 px-2.5 text-xs rounded-lg border bg-white border-amber-300 hover:border-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-300/30 transition-colors text-left"
                    >
                      <CalendarIcon className="w-3.5 h-3.5 shrink-0 text-amber-500" />
                      <span
                        className={
                          followUpDateDisplay
                            ? "text-slate-800 font-semibold text-xs"
                            : "text-amber-400 text-xs"
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
                        if (!date) return;
                        const h = parseInt(timeHourInput) || 12;
                        const m = parseInt(timeMinuteInput) || 0;
                        const h24 =
                          timePeriod === "AM"
                            ? h === 12
                              ? 0
                              : h
                            : h === 12
                              ? 12
                              : h + 12;
                        const d = new Date(date);
                        d.setHours(h24, m, 0, 0);
                        setEditFormData((f) => ({
                          ...f,
                          followUpDueDate: d.toISOString(),
                        }));
                      }}
                      disabled={{ before: new Date() }}
                      initialFocus
                    />
                    {/* Time picker */}
                    <div className="px-3 pb-3 border-t border-slate-100 pt-3">
                      <div className="flex items-center gap-2">
                        <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <div className="flex items-center gap-1">
                          <input
                            type="text"
                            maxLength={2}
                            value={timeHourInput}
                            onChange={(e) => {
                              const v = e.target.value.replace(/\D/g, "");
                              setTimeHourInput(v);
                            }}
                            onBlur={() => {
                              const h = Math.min(
                                12,
                                Math.max(1, parseInt(timeHourInput) || 12),
                              );
                              setTimeHourInput(String(h).padStart(2, "0"));
                            }}
                            className="w-9 h-7 text-center text-xs font-semibold border border-slate-200 rounded-md focus:outline-none focus:ring-1 focus:ring-amber-400"
                          />
                          <span className="text-slate-500 text-xs font-bold">
                            :
                          </span>
                          <input
                            type="text"
                            maxLength={2}
                            value={timeMinuteInput}
                            onChange={(e) => {
                              const v = e.target.value.replace(/\D/g, "");
                              setTimeMinuteInput(v);
                            }}
                            onBlur={() => {
                              const m = Math.min(
                                59,
                                Math.max(0, parseInt(timeMinuteInput) || 0),
                              );
                              setTimeMinuteInput(String(m).padStart(2, "0"));
                            }}
                            className="w-9 h-7 text-center text-xs font-semibold border border-slate-200 rounded-md focus:outline-none focus:ring-1 focus:ring-amber-400"
                          />
                        </div>
                        {/* AM/PM toggle */}
                        <div className="flex rounded-md border border-slate-200 overflow-hidden">
                          {(["AM", "PM"] as const).map((p) => (
                            <button
                              key={p}
                              type="button"
                              onClick={() => setTimePeriod(p)}
                              className={cn(
                                "px-2 h-7 text-[10px] font-bold transition-colors",
                                timePeriod === p
                                  ? "bg-amber-500 text-white"
                                  : "bg-white text-slate-500 hover:bg-slate-50",
                              )}
                            >
                              {p}
                            </button>
                          ))}
                        </div>
                        {/* Apply time button */}
                        {editFormData.followUpDueDate && (
                          <button
                            type="button"
                            onClick={() => {
                              const d = editFormData.followUpDueDate
                                ? new Date(editFormData.followUpDueDate)
                                : new Date();
                              const h = parseInt(timeHourInput) || 12;
                              const m = parseInt(timeMinuteInput) || 0;
                              const h24 =
                                timePeriod === "AM"
                                  ? h === 12
                                    ? 0
                                    : h
                                  : h === 12
                                    ? 12
                                    : h + 12;
                              d.setHours(h24, m, 0, 0);
                              setEditFormData((f) => ({
                                ...f,
                                followUpDueDate: d.toISOString(),
                              }));
                              setMainCalendarOpen(false);
                            }}
                            className="ml-auto text-[10px] font-semibold text-amber-600 hover:text-amber-700 bg-amber-50 border border-amber-200 px-2 py-1 rounded-md"
                          >
                            Done
                          </button>
                        )}
                      </div>
                      {editFormData.followUpDueDate && (
                        <div className="mt-2 flex justify-end">
                          <button
                            type="button"
                            onClick={() => {
                              setEditFormData((f) => ({
                                ...f,
                                followUpDueDate: "",
                              }));
                              setMainCalendarOpen(false);
                            }}
                            className="text-xs text-red-500 hover:text-red-600"
                          >
                            Clear
                          </button>
                        </div>
                      )}
                    </div>
                  </PopoverContent>
                </Popover>
              </div>

              {/* Follow-up Assignee */}
              <div>
                <FieldLabel>Assignee</FieldLabel>
                <InspectorSelect
                  value={editFormData.followUpAssignedToId || ""}
                  onChange={(v) =>
                    setEditFormData((f) => ({
                      ...f,
                      followUpAssignedToId: v === "none" ? "" : v,
                    }))
                  }
                  placeholder="Assign…"
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
        )}
      </div>
    </section>
  );
}

// ── Source Call Section ────────────────────────────────────────────────────────

type CallSnippet = SupportTicketRecord["call"];

function formatCallDuration(seconds?: number | null): string {
  if (!seconds || seconds <= 0) return "—";
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

function CallDirIcon({ direction }: { direction?: string | null }) {
  const d = (direction ?? "").toUpperCase();
  if (d === "INBOUND") return <PhoneIncoming className="w-3 h-3" />;
  if (d === "OUTBOUND") return <PhoneOutgoing className="w-3 h-3" />;
  if (d === "MISSED") return <PhoneMissed className="w-3 h-3" />;
  return <Phone className="w-3 h-3" />;
}

function SourceCallSection({
  call,
  callId,
}: {
  call: CallSnippet;
  callId: number;
}) {
  const [open, setOpen] = useState(true);

  const direction = (call?.direction ?? "").toUpperCase();
  const dirLabel =
    direction === "INBOUND"
      ? "Inbound"
      : direction === "OUTBOUND"
        ? "Outbound"
        : direction === "MISSED"
          ? "Missed"
          : call?.direction || "—";

  const dirColor =
    direction === "INBOUND"
      ? { bg: "#eff6ff", fg: "#1d4ed8", border: "#bfdbfe" }
      : direction === "OUTBOUND"
        ? { bg: "#f0fdf4", fg: "#15803d", border: "#bbf7d0" }
        : direction === "MISSED"
          ? { bg: "#fef2f2", fg: "#b91c1c", border: "#fecaca" }
          : { bg: "#f1f5f9", fg: "#475569", border: "#e2e8f0" };

  return (
    <section className="bg-white rounded-2xl border border-blue-100 shadow-[0_1px_3px_rgba(0,0,0,0.06)] overflow-hidden">
      {/* Header */}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center gap-2 px-5 pt-3 pb-3 border-b border-slate-50 hover:bg-slate-50/60 transition-colors"
      >
        <div className="w-6 h-6 rounded-lg bg-blue-50 flex items-center justify-center shrink-0">
          <Phone className="w-3 h-3 text-blue-500" />
        </div>
        <span className="text-[12px] font-bold text-slate-700 flex-1 text-left">
          Source Call
        </span>
        <span className="text-[10px] font-mono text-slate-400 mr-1">
          #{callId}
        </span>
        <ChevronDown
          className={cn(
            "w-3.5 h-3.5 text-slate-400 transition-transform duration-200",
            open ? "rotate-180" : "",
          )}
        />
      </button>

      {/* Body */}
      {open && (
        <div className="px-5 py-4 space-y-3">
          {/* Direction + Agent row */}
          <div className="flex flex-wrap gap-2">
            <span
              className="inline-flex items-center gap-1.5 text-[11px] font-semibold px-2 py-1 rounded-lg border"
              style={{
                color: dirColor.fg,
                background: dirColor.bg,
                borderColor: dirColor.border,
              }}
            >
              <CallDirIcon direction={call?.direction} />
              {dirLabel}
            </span>
            {call?.agent?.name && (
              <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-slate-600 bg-slate-50 border border-slate-200 px-2 py-1 rounded-lg">
                <span className="w-4 h-4 rounded-full bg-slate-200 flex items-center justify-center text-[8px] font-bold text-slate-500 shrink-0">
                  {call.agent.name.charAt(0).toUpperCase()}
                </span>
                {call.agent.name}
              </span>
            )}
          </div>

          {/* Date + Duration row */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
                Date
              </p>
              <p className="text-[12px] text-slate-700 font-medium">
                {call?.startedAt ? fmtDate(call.startedAt) : "—"}
              </p>
            </div>
            <div>
              <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
                Duration
              </p>
              <p className="text-[12px] text-slate-700 font-medium tabular-nums">
                {formatCallDuration(call?.duration)}
              </p>
            </div>
          </div>

          {/* Disposition */}
          {call?.disposition && (
            <div>
              <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
                Disposition
              </p>
              <p className="text-[12px] text-slate-700 font-medium">
                {formatEnumLabel(call.disposition)}
              </p>
            </div>
          )}
        </div>
      )}
    </section>
  );
}

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
  showSuccessToast,
  onSuccessToastDismiss,
  showErrorToast,
  errorToastMessage,
  onErrorToastDismiss,
}: CustomerTicketDrawerProps) {
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [mainCalendarOpen, setMainCalendarOpen] = useState(false);
  const [customerOpen, setCustomerOpen] = useState(false);
  const [mainCustomerOpen, setMainCustomerOpen] = useState(false);
  const [customerSearch, setCustomerSearch] = useState("");
  const [mainCustomerSearch, setMainCustomerSearch] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ── Sheet-anchored success toast ──────────────────────────────────────────
  const [toastActive, setToastActive] = useState(false);
  const [toastVisible, setToastVisible] = useState(false);

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

  // Campaign options derived in one memo
  const campaignOptionValues = useMemo(() => {
    if (!editFormData.campaignId) return [];
    const camp = campaigns.find(
      (c: any) => c.id.toString() === editFormData.campaignId,
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

  const mainFilteredCustomers = useMemo(() => {
    if (!mainCustomerSearch.trim()) return customers;
    const s = mainCustomerSearch.toLowerCase();
    const sd = normalizePhone(mainCustomerSearch);
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
  }, [customers, mainCustomerSearch]);

  // Status/priority pills for selected ticket
  const sp = STATUS_PILL[normalizeStatusKey(selectedTicket?.status)] || null;
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
    <>
      {/* ── Sheet-anchored error toast ───────────────────────────────────────── */}
      {errorToastActive && (
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
            onClick={() => {
              setErrorToastVisible(false);
              setTimeout(() => {
                setErrorToastActive(false);
                onErrorToastDismiss?.();
              }, 300);
            }}
            className="shrink-0 w-5 h-5 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <X className="w-3 h-3" />
          </button>
        </div>
      )}

      {/* ── Sheet-anchored success toast ─────────────────────────────────────── */}
      {toastActive && (
        <div
          role="alert"
          aria-live="polite"
          className={cn(
            "fixed z-50 flex items-center gap-3",
            "bg-white rounded-xl border border-slate-200/80",
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
            <p className="text-[13px] font-semibold text-slate-800 leading-tight">
              Saved
            </p>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Ticket updated successfully
            </p>
          </div>
          <button
            type="button"
            aria-label="Dismiss notification"
            onClick={() => {
              setToastVisible(false);
              setTimeout(() => {
                setToastActive(false);
                onSuccessToastDismiss?.();
              }, 300);
            }}
            className="shrink-0 w-5 h-5 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <X className="w-3 h-3" />
          </button>
        </div>
      )}

      <Sheet open={open} onOpenChange={(v) => !v && onClose()}>
        <SheetContent
          side="right"
          className="w-svw sm:w-[80vw] p-0 flex flex-col bg-[#f4f5f7] [&>button.absolute]:hidden overflow-hidden border-l border-slate-200/80"
          style={{ maxWidth: "1100px" }}
          onPointerDownOutside={(e) => {
            const originalTarget = e.detail?.originalEvent
              ?.target as HTMLElement | null;
            if (
              originalTarget?.closest?.("[data-aircall-fab='true']") ||
              originalTarget?.closest?.("[data-aircall-panel='true']")
            ) {
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
          <div className="shrink-0 bg-white border-b border-slate-100">
            <div className="flex items-center gap-3 px-4 py-3">
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
                  <p className="text-[15px] font-bold text-slate-900 leading-none truncate">
                    {customerName || "Unknown"}
                  </p>
                  <button
                    type="button"
                    title="Edit contact"
                    className="w-5 h-5 flex items-center justify-center rounded hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors shrink-0"
                  >
                    <Pencil className="w-3 h-3" />
                  </button>
                </div>
                <p className="text-[11.5px] text-slate-400 font-mono mt-0.5 leading-none">
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
              <div className="flex-1" />
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
                <button
                  type="button"
                  onClick={onClose}
                  className="w-8 h-8 flex items-center justify-center rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-600 active:scale-95 transition-all"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {selectedTicket && (
              <div className="flex items-center gap-1.5 px-4 pb-3 flex-wrap">
                <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-slate-600 bg-slate-50 border border-slate-200 px-2.5 py-1 rounded-lg cursor-default">
                  <TicketIcon className="w-3 h-3 text-slate-400" />
                  Ticket #{selectedTicket.id}
                </span>
                <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-slate-600 bg-slate-50 border border-slate-200 px-2.5 py-1 rounded-lg cursor-default">
                  <CalendarIcon className="w-3 h-3 text-slate-400" />
                  {fmtDate(selectedTicket.createdAt)}
                </span>
                {sp && (
                  <span
                    className="inline-flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1 rounded-lg border cursor-default"
                    style={{
                      color: sp.fg,
                      background: sp.bg,
                      borderColor: `${sp.dot}30`,
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
                      color: pp.fg,
                      background: pp.bg,
                      borderColor: `${pp.dot}30`,
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
                  <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-slate-600 bg-slate-50 border border-slate-200 px-2.5 py-1 rounded-lg cursor-default">
                    <Activity className="w-3 h-3 text-slate-400" />
                    {formatEnumLabel(selectedTicket.ticketType)}
                  </span>
                )}
              </div>
            )}
          </div>

          {/* ── 3-Column Body ── */}
          <div className="flex-1 overflow-hidden min-h-0 flex">
            {/* ═══ COL 1 (18%): Ticket Feed ═══ */}
            <div className="hidden sm:flex w-72 xl:w-80 order-last shrink-0 flex-col border-l border-slate-200/60 bg-white overflow-hidden">
              <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 shrink-0">
                <div className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#008f68] shrink-0" />
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                    Ticket History
                  </p>
                </div>
                {isLoadingHistory ? (
                  <Loader2 className="w-3 h-3 animate-spin text-slate-300" />
                ) : (
                  <span className="text-[10px] font-semibold text-slate-400 tabular-nums">
                    {allTickets.length}
                  </span>
                )}
              </div>
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
            </div>

            {/* ═══ COL 2 (flex): Hub ═══ */}
            <main className="flex-1 overflow-hidden flex flex-col min-h-0 bg-[#f4f5f7]">
              {!selectedTicket ? (
                <div className="flex-1 flex items-center justify-center text-slate-400">
                  <div className="text-center">
                    <TicketIcon className="w-8 h-8 opacity-30 mx-auto mb-2" />
                    <p className="text-sm">Select a ticket to inspect</p>
                  </div>
                </div>
              ) : (
                <div className="flex-1 overflow-y-auto px-4 space-y-2 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:bg-slate-200 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-track]:bg-transparent">
                  {/* ── Issue Detail ── */}
                  <TicketPropertiesCard
                    editFormData={editFormData}
                    setEditFormData={setEditFormData}
                    customers={customers}
                    yards={yards}
                    agents={agents}
                    campaigns={campaigns}
                    phoneLines={phoneLines}
                    campaignOptionValues={campaignOptionValues}
                    followUpDateDisplay={followUpDateDisplay}
                    mainCustomerOpen={mainCustomerOpen}
                    setMainCustomerOpen={setMainCustomerOpen}
                    mainCustomerSearch={mainCustomerSearch}
                    setMainCustomerSearch={setMainCustomerSearch}
                    mainFilteredCustomers={mainFilteredCustomers}
                    mainCalendarOpen={mainCalendarOpen}
                    setMainCalendarOpen={setMainCalendarOpen}
                  />

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
                      <div className="hidden">
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
                                className="flex items-center gap-2 px-2.5 py-1.5 bg-white hover:bg-slate-50/70 transition-colors"
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
                                    className="flex items-center gap-2 px-2.5 py-1.5 bg-white hover:bg-slate-50/70 transition-colors"
                                  >
                                    <span
                                      className={`text-[9px] font-bold tracking-wider rounded-[5px] px-1.5 py-0.5 uppercase shrink-0 ${badge}`}
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
                                      <a
                                        href={url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        aria-label={`Open ${filename}`}
                                        className="p-1 rounded-md text-blue-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                                      >
                                        <ExternalLink className="w-3 h-3" />
                                      </a>
                                    </div>
                                  </div>
                                );
                              },
                            )}
                          </div>
                        )}
                    </div>
                  </section>

                  {/* ── Source Call ── */}
                  {selectedTicket.callId && (
                    <SourceCallSection
                      call={selectedTicket.call ?? null}
                      callId={selectedTicket.callId}
                    />
                  )}

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
                </div>
              )}
              {selectedTicket && (
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
                    {isUpdating ? "Saving..." : "Save Changes"}
                  </button>
                </div>
              )}
            </main>

            {/* ═══ COL 3 (22%): Entity Inspector ═══ */}
            <div className="hidden w-72 shrink-0 flex-col border-l border-slate-200/60 bg-white overflow-hidden">
              <div className="px-4 py-3 border-b border-slate-100 shrink-0 bg-white">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
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
                <div className="bg-white border border-slate-200 rounded-xl p-3 shadow-sm">
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
    </>
  );
}
