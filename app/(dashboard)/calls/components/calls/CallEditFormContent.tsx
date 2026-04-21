"use client";

import { useMemo, useState } from "react";
import { useAircall } from "@/components/providers/AircallProvider";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";
import {
  User,
  Phone,
  MapPin,
  Briefcase,
  Megaphone,
  ArrowLeftRight,
  Activity,
  Calendar,
  AlertCircle,
  AlertTriangle,
  CheckCircle2,
  ChevronsUpDown,
  Check,
  StickyNote,
  Calendar as CalendarIcon,
  Headphones,
  PhoneOutgoing,
  PhoneIncoming,
  PhoneMissed,
  Voicemail,
  Clock,
  Ticket,
  X,
} from "lucide-react";
import {
  AgentOption,
  CallDirection,
  CallStatus,
  CampaignOption,
  CreateTicketFormData,
  CustomerOption,
  ManagementType,
  OnboardingOption,
  ArOption,
  TicketDisposition,
  TicketStatus,
  YardOption,
} from "../../types";
import type { Ticket as TicketType } from "@/lib/mock-data";
import { cn } from "@/lib/utils";
import { CallRecordingPlayer } from "./CallRecordingPlayer";

export type CallEditFormData = CreateTicketFormData;

interface CallEditFormContentProps {
  ticket: TicketType;
  customerCalls?: TicketType[];
  onSelectCall?: (call: TicketType) => void;
  customers: CustomerOption[];
  yards: YardOption[];
  agents: AgentOption[];
  campaigns: CampaignOption[];
  formData: CreateTicketFormData;
  setFormData: (next: CreateTicketFormData) => void;
  attachmentFiles?: File[];
  setAttachmentFiles?: (next: File[]) => void;
  savedAttachments?: string[];
  isUpdating: boolean;
  onSubmit: () => void;
  onCancel: () => void;
  onCreateTicket?: () => void;
  getAttachmentLabel?: (value: string) => string;
  getAttachmentUrl?: (value: string) => string;
  withScroll?: boolean;
}

/* ─── helpers ────────────────────────────────────────────── */

const formatEnumLabel = (value: string) => {
  if (value === OnboardingOption.PAID_WITH_LL) return "Paid with LL";
  return value
    .replace(/_/g, " ")
    .toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase());
};

function formatDuration(seconds?: number | null): string {
  if (!seconds) return "--:--";
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

function formatCallDate(dateStr?: string | null): string {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  const now = new Date();
  const isToday = d.toDateString() === now.toDateString();
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  if (isToday)
    return `Today ${d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`;
  if (d.toDateString() === yesterday.toDateString()) return "Yesterday";
  return d.toLocaleDateString([], { month: "short", day: "numeric" });
}

function DirectionIcon({ direction }: { direction?: string | null }) {
  switch (direction?.toUpperCase()) {
    case CallDirection.INBOUND:
      return <PhoneIncoming className="h-3.5 w-3.5 text-emerald-500" />;
    case CallDirection.OUTBOUND:
      return <PhoneOutgoing className="h-3.5 w-3.5 text-blue-500" />;
    case CallDirection.MISSED:
      return <PhoneMissed className="h-3.5 w-3.5 text-red-500" />;
    case CallDirection.VOICEMAIL:
      return <Voicemail className="h-3.5 w-3.5 text-purple-500" />;
    default:
      return <Phone className="h-3.5 w-3.5 text-slate-400" />;
  }
}

/* ─── Field label ────────────────────────────────────────── */

function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
      {children}
    </p>
  );
}

/* ─── Section heading ────────────────────────────────────── */

function SectionHeading({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest mb-4 pt-1">
      {children}
    </p>
  );
}

/* ─── Shared input className ─────────────────────────────── */
const inputCls =
  "border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-100 focus:border-blue-500 text-sm p-2.5 h-auto";

/* ─── Left panel: call history ───────────────────────────── */

function CallHistoryPanel({
  calls,
  activeCallId,
  onSelect,
}: {
  calls: TicketType[];
  activeCallId: number | string;
  onSelect?: (call: TicketType) => void;
}) {
  const customerName =
    (calls[0] as any)?.customer?.name ||
    (calls[0] as any)?.clientName ||
    "Unknown";
  const phone =
    (calls[0] as any)?.customer?.phone ||
    (calls[0] as any)?.customerPhone ||
    "";

  const sortedCalls = useMemo(() => {
    return [...calls].sort((a, b) => {
      const ad = new Date(a.callDate || a.createdAt || 0).getTime();
      const bd = new Date(b.callDate || b.createdAt || 0).getTime();
      return bd - ad;
    });
  }, [calls]);

  return (
    <div className="w-64 shrink-0 flex flex-col border-r border-slate-100 bg-slate-50/60">
      <div className="px-4 py-3 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-full bg-blue-50 border border-blue-100 flex items-center justify-center">
            <User className="h-4 w-4 text-blue-500" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-slate-800 truncate">
              {customerName}
            </p>
            {phone && (
              <p className="text-xs text-slate-400 truncate">{phone}</p>
            )}
          </div>
        </div>
        <p className="text-[11px] text-slate-400 mt-2 font-medium">
          {calls.length} call{calls.length !== 1 ? "s" : ""}
        </p>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-2 space-y-0.5">
          {sortedCalls.map((call) => {
            const isActive = call.id === activeCallId;
            const date = formatCallDate(call.callDate || call.createdAt);
            const duration = formatDuration(call.duration);

            return (
              <button
                key={call.id}
                onClick={() => onSelect?.(call)}
                className={cn(
                  "w-full text-left px-3 py-2.5 rounded-lg transition-colors",
                  isActive
                    ? "bg-blue-50 border-l-2 border-l-blue-500"
                    : "hover:bg-slate-100 border-l-2 border-l-transparent",
                )}
              >
                <div className="flex items-center gap-2">
                  <DirectionIcon direction={call.direction} />
                  <span className="text-xs font-mono text-slate-400">
                    #{call.id}
                  </span>
                </div>
                <div className="flex items-center gap-2 mt-1 text-xs text-slate-400">
                  <Clock className="h-3 w-3" />
                  <span>{date}</span>
                  {call.duration && (
                    <>
                      <span>·</span>
                      <span>{duration}</span>
                    </>
                  )}
                </div>
                {call.status && (
                  <Badge
                    variant="outline"
                    className="mt-1.5 text-[10px] px-1.5 py-0 h-4 border-slate-200 text-slate-500"
                  >
                    {formatEnumLabel(call.status)}
                  </Badge>
                )}
              </button>
            );
          })}
        </div>
      </ScrollArea>
    </div>
  );
}

/* ─── Main component ─────────────────────────────────────── */

export function CallEditFormContent({
  ticket,
  customerCalls,
  onSelectCall,
  customers,
  yards,
  agents,
  campaigns,
  formData,
  setFormData,
  isUpdating,
  onSubmit,
  onCancel,
  onCreateTicket,
  withScroll = true,
}: CallEditFormContentProps) {
  const [campaignOpen, setCampaignOpen] = useState(false);
  const [yardOpen, setYardOpen] = useState(false);
  const [customerOpen, setCustomerOpen] = useState(false);
  const [agentOpen, setAgentOpen] = useState(false);
  const [activeTicketWarning, setActiveTicketWarning] = useState<{
    count: number;
    statuses: string[];
  } | null>(null);

  const {
    dial,
    status: aircallStatus,
    isLoggedIn: aircallLoggedIn,
  } = useAircall();
  const canDial = aircallStatus === "ready" && aircallLoggedIn;
  const dialPhone =
    formData.customerPhone ||
    (ticket.customer as any)?.phone ||
    (ticket as any).customerPhone ||
    "";

  const handleCall = () => {
    if (!dialPhone || !canDial) return;
    dial(dialPhone, ticket.id);
  };

  const handleCreateTicketClick = async () => {
    if (!formData.customerId) {
      onCreateTicket?.();
      return;
    }
    try {
      const res = await fetch(
        `/api/tickets?mode=page&customerId=${formData.customerId}&limit=50`,
      );
      const result = await res.json();
      const raw = result.data;
      const data = Array.isArray(raw)
        ? raw
        : Array.isArray(raw?.data)
          ? raw.data
          : [];
      const active = data.filter(
        (t: any) => t.status !== "CLOSED" && t.status !== "RESOLVED",
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
    } catch {
      onCreateTicket?.();
    }
  };

  const selectedCampaign = useMemo(
    () =>
      formData.campaignId
        ? (campaigns.find((c) => c.id.toString() === formData.campaignId) ??
          null)
        : null,
    [campaigns, formData.campaignId],
  );

  const campaignType = selectedCampaign?.tipo?.toString().toUpperCase();
  const campaignOptionValues =
    campaignType === ManagementType.ONBOARDING
      ? Object.values(OnboardingOption)
      : campaignType === ManagementType.AR
        ? Object.values(ArOption)
        : [];

  const callList = useMemo(() => {
    if (customerCalls && customerCalls.length > 0) return customerCalls;
    return [ticket];
  }, [customerCalls, ticket]);

  const hasHistory = callList.length > 1;

  /* ── form body ── */
  const formBody = (
    <div className="p-6 space-y-6">
      {/* Customer Notes banner */}
      {((ticket.customer?.notes && ticket.customer.notes.length > 0) ||
        ticket.customer?.note) && (
        <Popover>
          <PopoverTrigger asChild>
            <button className="w-full flex items-center gap-3 p-3 rounded-xl border border-amber-200 bg-amber-50 hover:bg-amber-100/70 transition-colors cursor-pointer text-left">
              <div className="h-8 w-8 rounded-lg bg-amber-100 border border-amber-200 flex items-center justify-center shrink-0">
                <StickyNote className="h-4 w-4 text-amber-500" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-amber-800">
                  Customer Notes
                </p>
                <p className="text-[10px] text-amber-600/70 mt-0.5">
                  {ticket.customer?.notes && ticket.customer.notes.length > 0
                    ? `${ticket.customer.notes.length} note${ticket.customer.notes.length !== 1 ? "s" : ""}`
                    : "1 note"}{" "}
                  · Click to view
                </p>
              </div>
              <Badge className="text-[10px] font-mono bg-amber-200 text-amber-800 border-0">
                {ticket.customer?.notes && ticket.customer.notes.length > 0
                  ? ticket.customer.notes.length
                  : 1}
              </Badge>
            </button>
          </PopoverTrigger>
          <PopoverContent
            align="start"
            className="w-80 p-0 shadow-xl border-slate-200"
          >
            <div className="px-4 py-3 border-b border-slate-100">
              <h4 className="text-sm font-semibold flex items-center gap-2 text-slate-800">
                <StickyNote className="h-4 w-4 text-amber-500" /> Notes
              </h4>
            </div>
            <div className="max-h-[280px] overflow-y-auto p-2 space-y-2">
              {ticket.customer?.notes && ticket.customer.notes.length > 0 ? (
                ticket.customer.notes.map((n: any) => (
                  <div
                    key={n.id}
                    className="bg-slate-50 border border-slate-100 rounded-lg p-3 text-sm"
                  >
                    <p className="text-slate-700 whitespace-pre-wrap break-words leading-relaxed">
                      {n.content}
                    </p>
                    {n.createdAt && (
                      <div className="mt-2 flex items-center justify-between gap-2">
                        {n.createdBy && (
                          <span className="text-[10px] font-semibold text-amber-600 uppercase tracking-wider truncate">
                            {n.createdBy}
                          </span>
                        )}
                        <div className="flex items-center gap-1 text-[10px] text-slate-400 ml-auto">
                          <CalendarIcon className="h-3 w-3" />
                          {new Date(n.createdAt).toLocaleDateString(undefined, {
                            day: "2-digit",
                            month: "short",
                            year: "numeric",
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                ))
              ) : (
                <div className="bg-slate-50 border border-slate-100 rounded-lg p-3 text-sm">
                  <p className="text-slate-700 whitespace-pre-wrap break-words leading-relaxed">
                    {ticket.customer!.note}
                  </p>
                </div>
              )}
            </div>
          </PopoverContent>
        </Popover>
      )}

      {/* ── SECTION 1: CAMPAIGN & LOCATION ── */}
      <div>
        <SectionHeading>Campaign &amp; Location</SectionHeading>
        <div className="grid grid-cols-2 gap-x-6 gap-y-5">
          {/* Campaign */}
          <div>
            <FieldLabel>Campaign</FieldLabel>
            <Popover open={campaignOpen} onOpenChange={setCampaignOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  className={cn("w-full justify-between font-normal", inputCls)}
                >
                  <span className="truncate">
                    {formData.campaignId
                      ? (campaigns.find(
                          (c) => c.id.toString() === formData.campaignId,
                        )?.nombre ?? formData.campaignId)
                      : "Select campaign..."}
                  </span>
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-40" />
                </Button>
              </PopoverTrigger>
              <PopoverContent
                className="w-72 p-0 shadow-xl border-slate-200"
                align="start"
              >
                <Command>
                  <CommandInput
                    placeholder="Search campaign..."
                    className="text-sm"
                  />
                  <CommandList>
                    <CommandEmpty>No campaign found.</CommandEmpty>
                    <CommandGroup>
                      <CommandItem
                        value="no-campaign"
                        onSelect={() => {
                          setFormData({
                            ...formData,
                            campaignId: "",
                            campaignOption: "",
                            yardId: "",
                          });
                          setCampaignOpen(false);
                        }}
                      >
                        <Check
                          className={cn(
                            "mr-2 h-4 w-4",
                            !formData.campaignId ? "opacity-100" : "opacity-0",
                          )}
                        />
                        No Campaign
                      </CommandItem>
                      {campaigns.map((c) => (
                        <CommandItem
                          key={c.id}
                          value={c.nombre}
                          onSelect={() => {
                            setFormData({
                              ...formData,
                              campaignId: c.id.toString(),
                              yardId: c.yardaId ? c.yardaId.toString() : "",
                              campaignOption:
                                c.tipo === ManagementType.ONBOARDING ||
                                c.tipo === ManagementType.AR
                                  ? formData.campaignOption
                                  : "",
                            });
                            setCampaignOpen(false);
                          }}
                        >
                          <Check
                            className={cn(
                              "mr-2 h-4 w-4",
                              formData.campaignId === c.id.toString()
                                ? "opacity-100"
                                : "opacity-0",
                            )}
                          />
                          {c.nombre}
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
          </div>

          {/* Yard */}
          <div>
            <FieldLabel>Yard</FieldLabel>
            <Popover open={yardOpen} onOpenChange={setYardOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  className={cn("w-full justify-between font-normal", inputCls)}
                >
                  <span className="truncate">
                    {formData.yardId
                      ? (yards.find((y) => y.id.toString() === formData.yardId)
                          ?.name ?? formData.yardId)
                      : "Select yard..."}
                  </span>
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-40" />
                </Button>
              </PopoverTrigger>
              <PopoverContent
                className="w-72 p-0 shadow-xl border-slate-200"
                align="start"
              >
                <Command>
                  <CommandInput
                    placeholder="Search yard..."
                    className="text-sm"
                  />
                  <CommandList>
                    <CommandEmpty>No yard found.</CommandEmpty>
                    <CommandGroup>
                      <CommandItem
                        value="no-yard"
                        onSelect={() => {
                          setFormData({ ...formData, yardId: "" });
                          setYardOpen(false);
                        }}
                      >
                        <Check
                          className={cn(
                            "mr-2 h-4 w-4",
                            !formData.yardId ? "opacity-100" : "opacity-0",
                          )}
                        />
                        No Yard
                      </CommandItem>
                      {yards.map((y) => (
                        <CommandItem
                          key={y.id}
                          value={y.name}
                          onSelect={() => {
                            setFormData({
                              ...formData,
                              yardId: y.id.toString(),
                            });
                            setYardOpen(false);
                          }}
                        >
                          <Check
                            className={cn(
                              "mr-2 h-4 w-4",
                              formData.yardId === y.id.toString()
                                ? "opacity-100"
                                : "opacity-0",
                            )}
                          />
                          {y.name}
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
          </div>

          {campaignOptionValues.length > 0 && (
            <div className="col-span-2 animate-in fade-in slide-in-from-left-2">
              <FieldLabel>Campaign Option</FieldLabel>
              <Select
                value={formData.campaignOption || "none"}
                onValueChange={(value) =>
                  setFormData({
                    ...formData,
                    campaignOption: value === "none" ? "" : value,
                  })
                }
              >
                <SelectTrigger className={inputCls}>
                  <SelectValue placeholder="Select option" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No option</SelectItem>
                  {campaignOptionValues.map((v) => (
                    <SelectItem key={v} value={v}>
                      {formatEnumLabel(v)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </div>
      </div>

      {/* ── SECTION 2: CUSTOMER INFORMATION ── */}
      <div>
        <SectionHeading>Customer Information</SectionHeading>
        <div className="grid grid-cols-2 gap-x-6 gap-y-5">
          {/* Customer Name */}
          <div>
            <FieldLabel>
              Customer Name <span className="text-red-400">*</span>
            </FieldLabel>
            <Popover open={customerOpen} onOpenChange={setCustomerOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  className={cn("w-full justify-between font-normal", inputCls)}
                >
                  <span className="truncate">
                    {formData.customerId
                      ? (customers.find(
                          (c) => c.id.toString() === formData.customerId,
                        )?.name ?? formData.customerId)
                      : "Select customer..."}
                  </span>
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-40" />
                </Button>
              </PopoverTrigger>
              <PopoverContent
                className="w-72 p-0 shadow-xl border-slate-200"
                align="start"
              >
                <Command>
                  <CommandInput
                    placeholder="Search customer..."
                    className="text-sm"
                  />
                  <CommandList>
                    <CommandEmpty>No customer found.</CommandEmpty>
                    <CommandGroup>
                      {customers.map((c) => (
                        <CommandItem
                          key={c.id}
                          value={`${c.id} ${c.name} ${c.phone ?? ""}`}
                          onSelect={() => {
                            setFormData({
                              ...formData,
                              customerId: c.id.toString(),
                              customerPhone: c.phone ?? "",
                            });
                            setCustomerOpen(false);
                          }}
                        >
                          <Check
                            className={cn(
                              "mr-2 h-4 w-4",
                              formData.customerId === c.id.toString()
                                ? "opacity-100"
                                : "opacity-0",
                            )}
                          />
                          <div className="flex flex-col">
                            <span className="text-sm">{c.name}</span>
                            {c.phone && (
                              <span className="text-xs text-slate-400">
                                {c.phone}
                              </span>
                            )}
                          </div>
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
          </div>

          {/* Phone — read-only */}
          <div>
            <FieldLabel>Phone</FieldLabel>
            <Input
              value={formData.customerPhone || ""}
              readOnly
              placeholder="Auto-filled from customer"
              tabIndex={-1}
              className={cn(
                inputCls,
                "bg-slate-50 text-slate-500 border-slate-200 cursor-not-allowed focus:ring-0 focus:border-slate-200",
              )}
            />
          </div>

          {/* Assign Agent — spans full row */}
          <div className="col-span-2">
            <FieldLabel>Assign Agent</FieldLabel>
            <Popover open={agentOpen} onOpenChange={setAgentOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  className={cn("w-full justify-between font-normal", inputCls)}
                >
                  <span className="truncate">
                    {formData.agentId
                      ? (agents.find(
                          (a) => a.id.toString() === formData.agentId,
                        )?.name ??
                        (ticket as any)?.agent?.name ??
                        "Unassigned")
                      : "Unassigned"}
                  </span>
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-40" />
                </Button>
              </PopoverTrigger>
              <PopoverContent
                className="w-full p-0 shadow-xl border-slate-200"
                align="start"
              >
                <Command>
                  <CommandInput
                    placeholder="Search agent..."
                    className="text-sm"
                  />
                  <CommandList>
                    <CommandEmpty>No agent found.</CommandEmpty>
                    <CommandGroup>
                      <CommandItem
                        value="unassigned"
                        onSelect={() => {
                          setFormData({ ...formData, agentId: "" });
                          setAgentOpen(false);
                        }}
                      >
                        <Check
                          className={cn(
                            "mr-2 h-4 w-4",
                            !formData.agentId ? "opacity-100" : "opacity-0",
                          )}
                        />
                        Unassigned
                      </CommandItem>
                      {agents.map((a) => (
                        <CommandItem
                          key={a.id}
                          value={a.name}
                          onSelect={() => {
                            setFormData({
                              ...formData,
                              agentId: a.id.toString(),
                            });
                            setAgentOpen(false);
                          }}
                        >
                          <Check
                            className={cn(
                              "mr-2 h-4 w-4",
                              formData.agentId === a.id.toString()
                                ? "opacity-100"
                                : "opacity-0",
                            )}
                          />
                          {a.name}
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
          </div>
        </div>
      </div>

      {/* ── SECTION 3: CALL DETAILS ── */}
      <div>
        <SectionHeading>Call Details</SectionHeading>
        <div className="grid grid-cols-2 gap-x-6 gap-y-5">
          {/* Direction */}
          <div>
            <FieldLabel>Direction</FieldLabel>
            <Select
              value={formData.direction}
              onValueChange={(value) =>
                setFormData({ ...formData, direction: value as CallDirection })
              }
            >
              <SelectTrigger className={inputCls}>
                <SelectValue placeholder="Select direction" />
              </SelectTrigger>
              <SelectContent>
                {Object.values(CallDirection).map((v) => (
                  <SelectItem key={v} value={v}>
                    {formatEnumLabel(v)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Status */}
          <div>
            <FieldLabel>Status</FieldLabel>
            <Select
              value={formData.status}
              onValueChange={(value) =>
                setFormData({ ...formData, status: value as CallStatus })
              }
            >
              <SelectTrigger className={inputCls}>
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                {Object.values(TicketStatus).map((v) => (
                  <SelectItem key={v} value={v}>
                    {formatEnumLabel(v)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Date & Time */}
          <div className="col-span-2">
            <FieldLabel>Date &amp; Time</FieldLabel>
            <Input
              type="datetime-local"
              className={cn("w-full", inputCls)}
              value={formData.startedAt || ""}
              onChange={(e) =>
                setFormData({ ...formData, startedAt: e.target.value })
              }
            />
          </div>
        </div>
      </div>

      {/* ── CALL RECORDING ── */}
      {(ticket as any).recordingUrl && (ticket as any).id && (
        <div>
          <SectionHeading>Call Recording</SectionHeading>
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
            <CallRecordingPlayer callId={(ticket as any).id} />
          </div>
        </div>
      )}

      {/* ── SECTION 4: DETAILS & RESOLUTION ── */}
      <div>
        <SectionHeading>Details &amp; Resolution</SectionHeading>
        <div className="grid grid-cols-2 gap-x-6 gap-y-5">
          {/* Disposition */}
          <div className="col-span-2">
            <FieldLabel>Disposition</FieldLabel>
            <Select
              value={formData.disposition || "none"}
              onValueChange={(value) => {
                const newDisposition = value === "none" ? "" : value;
                const isCallback =
                  newDisposition === "CALLBACK_REQUIRED" ||
                  newDisposition === "CALLBACK_SCHEDULED";
                setFormData({
                  ...formData,
                  disposition: newDisposition,
                  ...(isCallback && { status: CallStatus.PENDING_FOLLOWUP }),
                });
              }}
            >
              <SelectTrigger className={inputCls}>
                <SelectValue placeholder="Select disposition..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">No disposition</SelectItem>
                {Object.values(TicketDisposition).map((v) => (
                  <SelectItem key={v} value={v}>
                    {formatEnumLabel(v)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Follow-up fields */}
          {(formData.disposition === TicketDisposition.CALLBACK_REQUIRED ||
            formData.disposition === TicketDisposition.CALLBACK_SCHEDULED) && (
            <>
              <div className="animate-in fade-in-0 slide-in-from-top-2 duration-200">
                <FieldLabel>Follow-up Date</FieldLabel>
                <Input
                  type="datetime-local"
                  className={inputCls}
                  value={formData.followUpDueDate || ""}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      followUpDueDate: e.target.value,
                    })
                  }
                />
              </div>
              <div className="animate-in fade-in-0 slide-in-from-top-2 duration-200">
                <FieldLabel>Follow-up Assigned To</FieldLabel>
                <Select
                  value={formData.followUpAssignedToId || "none"}
                  onValueChange={(value) =>
                    setFormData({
                      ...formData,
                      followUpAssignedToId: value === "none" ? "" : value,
                    })
                  }
                >
                  <SelectTrigger className={inputCls}>
                    <SelectValue placeholder="Select agent" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Not assigned</SelectItem>
                    {agents.map((a) => (
                      <SelectItem key={a.id} value={a.id.toString()}>
                        {a.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </>
          )}
        </div>

        <div className="mt-5">
          <FieldLabel>Notes</FieldLabel>
          <Textarea
            placeholder="Enter call notes..."
            value={formData.notes || ""}
            onChange={(e) =>
              setFormData({ ...formData, notes: e.target.value })
            }
            className={cn(
              "min-h-[110px] resize-y border-slate-200 rounded-lg text-sm p-2.5",
              "focus:ring-2 focus:ring-blue-100 focus:border-blue-500 shadow-inner",
            )}
          />
        </div>
      </div>
    </div>
  );

  /* ─── Footer ─────────────────────────────────────────────── */
  const footer = (
    <div className="bg-slate-50 border-t border-slate-100 px-6 py-4 rounded-b-2xl flex items-center justify-between shrink-0">
      {/* Left: secondary actions */}
      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={handleCall}
          disabled={!dialPhone || !canDial}
          title={
            !dialPhone
              ? "No phone number on file"
              : !canDial
                ? "Aircall is not connected"
                : `Call ${dialPhone}`
          }
          className="text-slate-600 hover:text-slate-900 hover:bg-slate-100 gap-1.5"
        >
          <PhoneOutgoing className="h-4 w-4" />
          Call
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={handleCreateTicketClick}
          className="border-slate-300 bg-white text-slate-700 hover:bg-slate-50 gap-1.5"
        >
          <Ticket className="h-4 w-4" />
          Create Ticket
        </Button>
      </div>

      {/* Right: primary actions */}
      <div className="flex items-center gap-3">
        <button
          onClick={onCancel}
          disabled={isUpdating}
          className="text-sm text-slate-500 hover:text-slate-700 transition-colors"
        >
          Cancel
        </button>
        <Button
          onClick={onSubmit}
          disabled={isUpdating}
          className="bg-blue-600 hover:bg-blue-700 text-white rounded-lg px-5 py-2 font-medium text-sm"
        >
          {isUpdating ? "Saving..." : "Save Changes"}
        </Button>
      </div>
    </div>
  );

  /* ─── Warning banner ─────────────────────────────────────── */
  const warningBanner = activeTicketWarning && (
    <div className="mx-4 mb-3 flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
      <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" />
      <div className="flex-1">
        <p className="font-medium">
          This customer already has {activeTicketWarning.count} active{" "}
          {activeTicketWarning.count === 1 ? "ticket" : "tickets"}
        </p>
        <p className="text-xs mt-0.5 text-amber-700">
          Status: {activeTicketWarning.statuses.join(", ")}
        </p>
        <div className="mt-2 flex gap-2">
          <Button
            size="sm"
            variant="outline"
            className="h-7 text-xs border-amber-300 hover:bg-amber-100"
            onClick={() => {
              setActiveTicketWarning(null);
              onCreateTicket?.();
            }}
          >
            Create Anyway
          </Button>
          <Button
            size="sm"
            variant="ghost"
            className="h-7 text-xs text-slate-600"
            onClick={() => setActiveTicketWarning(null)}
          >
            Dismiss
          </Button>
        </div>
      </div>
      <button
        onClick={() => setActiveTicketWarning(null)}
        className="text-amber-400 hover:text-amber-600"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );

  /* ─── withScroll = false ─────────────────────────────────── */
  if (!withScroll) {
    return (
      <>
        {formBody}
        {warningBanner}
        {footer}
      </>
    );
  }

  /* ─── withScroll = true: split-panel layout ─────────────── */
  return (
    <div className="flex h-full">
      {hasHistory && (
        <CallHistoryPanel
          calls={callList}
          activeCallId={ticket.id}
          onSelect={onSelectCall}
        />
      )}

      <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
        <ScrollArea className="flex-1">{formBody}</ScrollArea>
        {warningBanner}
        {footer}
      </div>
    </div>
  );
}
