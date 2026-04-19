"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import useSWR from "swr";
import { cn } from "@/lib/utils";
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
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  ArrowLeft,
  Phone,
  User,
  Calendar,
  Loader2,
  Ticket,
  Activity,
  AlertCircle,
  Megaphone,
  MapPin,
  Briefcase,
  ChevronsUpDown,
  Check,
  StickyNote,
  PhoneOutgoing,
  Upload,
  Paperclip,
  FileIcon,
  X,
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
import { useAircall } from "@/components/providers/AircallProvider";

// ── Helpers ────────────────────────────────────────────────────────────────────

const formatLabel = (v: string) =>
  v
    .replace(/_/g, " ")
    .toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase());

const formatEnumLabel = (value: string) => {
  if (value === OnboardingOption.PAID_WITH_LL) return "Paid with LL";
  return formatLabel(value);
};

const priorityColors: Record<string, string> = {
  LOW: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
  MEDIUM:
    "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300",
  HIGH: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300",
  EMERGENCY: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300",
};

const statusColors: Record<string, string> = {
  OPEN: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
  IN_PROGRESS:
    "bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-300",
  PENDING_FOLLOWUP:
    "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-300",
  OVERDUE: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300",
  RESOLVED: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
  CLOSED: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300",
};

const fetcher = (url: string) => fetch(url).then((r) => r.json());

// ── Ticket History Item ────────────────────────────────────────────────────────

function TicketHistoryItem({
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
    if (isActive) {
      ref.current?.scrollIntoView({ block: "nearest", behavior: "smooth" });
    }
  }, [isActive]);

  const dateLabel = useMemo(() => {
    const d = new Date(ticket.createdAt || "");
    if (isNaN(d.getTime())) return "-";
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    if (diffDays === 0) {
      return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    }
    if (diffDays < 7) {
      return d.toLocaleDateString([], {
        weekday: "short",
        month: "short",
        day: "numeric",
      });
    }
    return d.toLocaleDateString([], {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  }, [ticket.createdAt]);

  return (
    <button
      ref={ref}
      onClick={onClick}
      className={cn(
        "w-full text-left px-3 py-3 border-b border-border/40 hover:bg-muted/60 transition-colors focus:outline-none",
        isActive
          ? "bg-primary/8 border-l-2 border-l-primary pl-2.5"
          : "border-l-2 border-l-transparent",
      )}
    >
      <div className="flex items-start gap-2.5">
        <div
          className={cn(
            "mt-0.5 h-6 w-6 rounded-full flex items-center justify-center shrink-0",
            ticket.status === "OPEN" || ticket.status === "IN_PROGRESS"
              ? "bg-blue-500/10"
              : ticket.status === "OVERDUE"
                ? "bg-rose-500/10"
                : "bg-muted",
          )}
        >
          <Ticket className="h-3 w-3" />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-1">
            <span className="text-xs font-semibold truncate">#{ticket.id}</span>
            <span className="text-[10px] text-muted-foreground shrink-0">
              {dateLabel}
            </span>
          </div>
          <p className="text-[11px] text-muted-foreground mt-0.5 truncate">
            {ticket.ticketType ? formatLabel(ticket.ticketType) : "Ticket"}
          </p>
          <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
            {ticket.status && (
              <Badge
                variant="outline"
                className={cn(
                  "text-[9px] font-medium px-1.5 py-0 h-4",
                  statusColors[ticket.status] || "",
                )}
              >
                {formatLabel(ticket.status)}
              </Badge>
            )}
            {ticket.priority && (
              <Badge
                variant="outline"
                className={cn(
                  "text-[9px] font-medium px-1.5 py-0 h-4",
                  priorityColors[ticket.priority] || "",
                )}
              >
                {formatLabel(ticket.priority)}
              </Badge>
            )}
          </div>
        </div>
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
  // Fetch complete ticket history for the customer
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

  // ---- Form states ----
  const [customerOpen, setCustomerOpen] = useState(false);
  const [customerSearch, setCustomerSearch] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const {
    dial,
    status: aircallStatus,
    isLoggedIn: aircallLoggedIn,
  } = useAircall();
  const canDial = aircallStatus === "ready" && aircallLoggedIn;
  const dialPhone = selectedTicket?.customer?.phone || customerPhone || "";

  // ---- Campaign logic ----
  const selectedCampaign = useMemo(() => {
    if (!editFormData.campaignId) return null;
    return campaigns.find(
      (c: any) => c.id.toString() === editFormData.campaignId,
    );
  }, [campaigns, editFormData.campaignId]);

  const selectedCampaignType = selectedCampaign?.tipo?.toString().toUpperCase();
  const isOnboardingCampaign =
    selectedCampaignType === ManagementType.ONBOARDING;
  const isArCampaign = selectedCampaignType === ManagementType.AR;
  const campaignOptionValues = isOnboardingCampaign
    ? Object.values(OnboardingOption)
    : isArCampaign
      ? Object.values(ArOption)
      : [];

  // ---- Customer search ----
  const normalizePhone = (v?: string | null) => (v ? v.replace(/\D/g, "") : "");
  const stripUsCode = (d: string) =>
    d.length > 10 && d.startsWith("1") ? d.slice(1) : d;

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

  // ---- File handling ----
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
        className="w-[85vw]! max-w-[85vw]! sm:max-w-[85vw]! p-0 flex flex-col [&>button.absolute]:hidden"
      >
        <SheetTitle className="sr-only">
          {customerName ? `Ticket History — ${customerName}` : "Ticket History"}
        </SheetTitle>

        {/* ── Header ─────────────────────────────────────────────────────── */}
        <SheetHeader className="px-4 py-3 border-b bg-muted/30 flex-row items-center gap-3 shrink-0 space-y-0">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 shrink-0"
            onClick={onClose}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>

          <div className="h-8 w-8 rounded-full bg-primary/15 flex items-center justify-center shrink-0 border border-primary/20">
            <User className="h-4 w-4 text-primary" />
          </div>

          <div className="flex-1 min-w-0">
            <h2 className="font-semibold text-sm leading-tight truncate">
              {customerName}
            </h2>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-xs text-muted-foreground flex items-center gap-1">
                <Phone className="h-3 w-3" />
                {customerPhone || "—"}
              </span>
              <span className="text-muted-foreground/40">·</span>
              <span className="text-xs text-muted-foreground flex items-center gap-1">
                <Ticket className="h-3 w-3" />
                {isLoadingHistory ? (
                  <Loader2 className="h-3 w-3 animate-spin" />
                ) : (
                  <>
                    {ticketCount} ticket{ticketCount !== 1 ? "s" : ""}
                  </>
                )}
              </span>
            </div>
          </div>
        </SheetHeader>

        {/* ── Body ───────────────────────────────────────────────────────── */}
        <div className="flex flex-1 min-h-0 overflow-hidden">
          {/* LEFT: Ticket history sidebar */}
          <div className="w-65 shrink-0 flex flex-col border-r bg-muted/10 overflow-hidden">
            <div className="px-3 py-2 border-b bg-background/50">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <Calendar className="h-3 w-3" />
                Ticket History
              </p>
            </div>

            <ScrollArea className="flex-1">
              {isLoadingHistory && allTickets.length === 0 ? (
                <div className="flex items-center justify-center py-10 gap-2 text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span className="text-sm">Loading...</span>
                </div>
              ) : allTickets.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-10 gap-2 text-muted-foreground">
                  <Ticket className="h-5 w-5 opacity-40" />
                  <span className="text-sm">No tickets found</span>
                </div>
              ) : (
                allTickets.map((t) => (
                  <TicketHistoryItem
                    key={t.id}
                    ticket={t}
                    isActive={t.id === activeTicketId}
                    onClick={() => onSelectTicket(t)}
                  />
                ))
              )}
            </ScrollArea>
          </div>

          {/* RIGHT: Edit form for selected ticket */}
          <div className="flex-1 flex flex-col min-h-0 overflow-hidden bg-background">
            {selectedTicket ? (
              <>
                {/* Ticket identifier bar */}
                <div className="px-6 py-3 border-b bg-muted/20 flex items-center gap-3 shrink-0">
                  <div className="flex items-center gap-2">
                    <Ticket className="h-4 w-4" />
                    <span className="text-sm font-semibold">
                      Ticket #{selectedTicket.id}
                    </span>
                  </div>
                  {selectedTicket.status && (
                    <>
                      <span className="text-muted-foreground/40">·</span>
                      <Badge
                        variant="outline"
                        className={cn(
                          "text-[10px] font-medium",
                          statusColors[selectedTicket.status] || "",
                        )}
                      >
                        {formatLabel(selectedTicket.status)}
                      </Badge>
                    </>
                  )}
                  {selectedTicket.priority && (
                    <>
                      <span className="text-muted-foreground/40">·</span>
                      <Badge
                        variant="outline"
                        className={cn(
                          "text-[10px] font-medium",
                          priorityColors[selectedTicket.priority] || "",
                        )}
                      >
                        {formatLabel(selectedTicket.priority)}
                      </Badge>
                    </>
                  )}
                  {selectedTicket.ticketType && (
                    <>
                      <span className="text-muted-foreground/40">·</span>
                      <span className="text-xs text-muted-foreground">
                        {formatLabel(selectedTicket.ticketType)}
                      </span>
                    </>
                  )}
                </div>

                {/* Customer Notes Popover */}
                {((selectedTicket.customer?.notes &&
                  selectedTicket.customer.notes.length > 0) ||
                  selectedTicket.customer?.note) && (
                  <div className="px-6 py-3 border-b shrink-0">
                    <Popover>
                      <PopoverTrigger asChild>
                        <button className="w-full flex items-center gap-3 p-3.5 rounded-lg border border-amber-400/40 bg-amber-400/10 hover:bg-amber-400/15 transition-colors cursor-pointer text-left shadow-sm">
                          <div className="h-9 w-9 rounded-md bg-amber-500/10 flex items-center justify-center shrink-0 border border-amber-500/20">
                            <StickyNote className="h-4 w-4 text-amber-500" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-amber-700 dark:text-amber-300">
                              Customer Notes
                            </p>
                            <p className="text-[10px] text-amber-600/70 dark:text-amber-400/70 mt-0.5">
                              {selectedTicket.customer?.notes &&
                              selectedTicket.customer.notes.length > 0
                                ? `${selectedTicket.customer.notes.length} note${selectedTicket.customer.notes.length !== 1 ? "s" : ""}`
                                : "1 note"}
                            </p>
                          </div>
                          <Badge
                            variant="secondary"
                            className="text-[10px] font-mono bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/20"
                          >
                            {selectedTicket.customer?.notes &&
                            selectedTicket.customer.notes.length > 0
                              ? selectedTicket.customer.notes.length
                              : 1}
                          </Badge>
                        </button>
                      </PopoverTrigger>
                      <PopoverContent align="start" className="w-80 p-0">
                        <div className="px-4 py-3 border-b border-border/50">
                          <h4 className="text-sm font-semibold flex items-center gap-2">
                            <StickyNote className="h-4 w-4 text-amber-500" />
                            Notes
                          </h4>
                        </div>
                        <div className="max-h-70 overflow-y-auto p-2 space-y-2 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-border/50">
                          {selectedTicket.customer?.notes &&
                          selectedTicket.customer.notes.length > 0 ? (
                            selectedTicket.customer.notes.map((n: any) => (
                              <div
                                key={n.id}
                                className="bg-muted/30 border border-border/50 rounded-lg p-3 text-sm"
                              >
                                <p className="text-foreground/90 whitespace-pre-wrap wrap-break-word leading-relaxed">
                                  {n.content}
                                </p>
                                {n.createdAt && (
                                  <div className="mt-2 flex items-center justify-between gap-2">
                                    <div className="flex items-center gap-1.5 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider ml-auto">
                                      <Calendar className="h-3 w-3 opacity-70" />
                                      {new Date(n.createdAt).toLocaleDateString(
                                        undefined,
                                        {
                                          day: "2-digit",
                                          month: "short",
                                          year: "numeric",
                                          hour: "2-digit",
                                          minute: "2-digit",
                                        },
                                      )}
                                    </div>
                                  </div>
                                )}
                              </div>
                            ))
                          ) : (
                            <div className="bg-muted/30 border border-border/50 rounded-lg p-3 text-sm">
                              <p className="text-foreground/90 whitespace-pre-wrap wrap-break-word leading-relaxed">
                                {selectedTicket.customer!.note}
                              </p>
                            </div>
                          )}
                        </div>
                      </PopoverContent>
                    </Popover>
                  </div>
                )}

                {/* Scrollable edit form */}
                <div className="flex-1 min-h-0 overflow-y-auto">
                  <div className="p-6 space-y-8">
                    {/* SECTION 1: CAMPAIGN & LOCATION */}
                    <div className="space-y-4">
                      <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                        <Megaphone className="w-4 h-4" /> Campaign & Location
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        <div className="space-y-2">
                          <Label className="text-xs font-semibold flex items-center gap-1.5">
                            <Megaphone className="w-3.5 h-3.5 text-muted-foreground" />{" "}
                            Campaign
                          </Label>
                          <Select
                            value={editFormData.campaignId || "none"}
                            onValueChange={(v) => {
                              const id = v === "none" ? "" : v;
                              const camp = campaigns.find(
                                (c: any) => c.id.toString() === id,
                              );
                              setEditFormData((f) => ({
                                ...f,
                                campaignId: id,
                                ...(camp?.yardaId
                                  ? { yardId: camp.yardaId.toString() }
                                  : {}),
                              }));
                            }}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select campaign..." />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="none">No Campaign</SelectItem>
                              {campaigns.map((c: any) => (
                                <SelectItem key={c.id} value={c.id.toString()}>
                                  {c.nombre}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-2">
                          <Label className="text-xs font-semibold flex items-center gap-1.5">
                            <MapPin className="w-3.5 h-3.5 text-muted-foreground" />{" "}
                            Yard
                          </Label>
                          <Select
                            value={editFormData.yardId || "none"}
                            onValueChange={(v) =>
                              setEditFormData((f) => ({
                                ...f,
                                yardId: v === "none" ? "" : v,
                              }))
                            }
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select yard..." />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="none">No Yard</SelectItem>
                              {yards.map((y: any) => (
                                <SelectItem key={y.id} value={y.id.toString()}>
                                  {y.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        {campaignOptionValues.length > 0 && (
                          <div className="md:col-span-2 space-y-2 animate-in fade-in slide-in-from-left-2">
                            <Label className="text-xs font-semibold">
                              Campaign Option
                            </Label>
                            <Select
                              value={editFormData.campaignOption || "none"}
                              onValueChange={(v) =>
                                setEditFormData((f) => ({
                                  ...f,
                                  campaignOption: v === "none" ? "" : v,
                                }))
                              }
                            >
                              <SelectTrigger>
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

                    <Separator />

                    {/* SECTION 2: CUSTOMER INFORMATION */}
                    <div className="space-y-4">
                      <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                        <User className="w-4 h-4" /> Customer Information
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        <div className="space-y-2">
                          <Label className="text-xs font-semibold">
                            Customer Name{" "}
                            <span className="text-red-500">*</span>
                          </Label>
                          <Popover
                            open={customerOpen}
                            onOpenChange={(isOpen) => {
                              setCustomerOpen(isOpen);
                              if (!isOpen) setCustomerSearch("");
                            }}
                          >
                            <PopoverTrigger asChild>
                              <Button
                                variant="outline"
                                role="combobox"
                                aria-expanded={customerOpen}
                                className="w-full justify-between"
                              >
                                {editFormData.customerId
                                  ? customers.find(
                                      (c: any) =>
                                        c.id.toString() ===
                                        editFormData.customerId,
                                    )?.name || editFormData.customerId
                                  : "Select customer..."}
                                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent
                              className="w-full p-0"
                              align="start"
                            >
                              <div className="flex flex-col">
                                <div className="px-3 py-2 border-b">
                                  <Input
                                    placeholder="Search customer..."
                                    value={customerSearch}
                                    onChange={(e) =>
                                      setCustomerSearch(e.target.value)
                                    }
                                    className="h-9"
                                  />
                                </div>
                                <ScrollArea className="h-75">
                                  <div className="p-1">
                                    {filteredCustomers.length === 0 ? (
                                      <div className="py-6 text-center text-sm text-muted-foreground">
                                        No customer found.
                                      </div>
                                    ) : (
                                      filteredCustomers.map((c: any) => (
                                        <div
                                          key={c.id}
                                          className={cn(
                                            "relative flex cursor-pointer select-none items-center rounded-sm px-2 py-2.5 text-sm outline-none hover:bg-accent hover:text-accent-foreground",
                                            editFormData.customerId ===
                                              c.id.toString() && "bg-accent",
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
                                              "mr-2 h-4 w-4",
                                              editFormData.customerId ===
                                                c.id.toString()
                                                ? "opacity-100"
                                                : "opacity-0",
                                            )}
                                          />
                                          <div className="flex flex-col flex-1">
                                            <span>{c.name}</span>
                                            {c.phone && (
                                              <span className="text-xs text-muted-foreground">
                                                {c.phone}
                                              </span>
                                            )}
                                          </div>
                                        </div>
                                      ))
                                    )}
                                  </div>
                                </ScrollArea>
                              </div>
                            </PopoverContent>
                          </Popover>
                        </div>

                        <div className="space-y-2">
                          <Label className="text-xs font-semibold flex items-center gap-1.5">
                            <Phone className="w-3.5 h-3.5 text-muted-foreground" />{" "}
                            Phone
                          </Label>
                          <Input
                            value={
                              customers.find(
                                (c: any) =>
                                  c.id.toString() === editFormData.customerId,
                              )?.phone || ""
                            }
                            readOnly
                            placeholder="Auto-filled"
                            className="bg-muted/40 border-dashed text-muted-foreground focus-visible:ring-0 cursor-not-allowed"
                            tabIndex={-1}
                          />
                        </div>

                        <div className="space-y-2">
                          <Label className="text-xs font-semibold flex items-center gap-1.5">
                            <Briefcase className="w-3.5 h-3.5 text-muted-foreground" />{" "}
                            Assigned Agent
                          </Label>
                          <Select
                            value={editFormData.agentId || "none"}
                            onValueChange={(v) =>
                              setEditFormData((f) => ({
                                ...f,
                                agentId: v === "none" ? "" : v,
                              }))
                            }
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Unassigned" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="none">Unassigned</SelectItem>
                              {agents.map((a: any) => (
                                <SelectItem key={a.id} value={a.id.toString()}>
                                  {a.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-2">
                          <Label className="text-xs font-semibold flex items-center gap-1.5">
                            <Phone className="w-3.5 h-3.5 text-muted-foreground" />{" "}
                            Phone Line
                          </Label>
                          <Select
                            value={editFormData.phoneLineId || "none"}
                            onValueChange={(v) =>
                              setEditFormData((f) => ({
                                ...f,
                                phoneLineId: v === "none" ? "" : v,
                              }))
                            }
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select phone line" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="none">None</SelectItem>
                              {phoneLines.map((pl) => (
                                <SelectItem
                                  key={pl.id}
                                  value={pl.id.toString()}
                                >
                                  {pl.label
                                    ? `${pl.label} (${pl.phoneNumber})`
                                    : pl.phoneNumber}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </div>

                    <Separator />

                    {/* SECTION 3: TICKET DETAILS */}
                    <div className="space-y-4">
                      <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                        <Activity className="w-4 h-4" /> Ticket Details
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        <div className="space-y-2">
                          <Label className="text-xs font-semibold flex items-center gap-1.5">
                            <Activity className="w-3.5 h-3.5 text-muted-foreground" />{" "}
                            Status
                          </Label>
                          <Select
                            value={editFormData.status}
                            onValueChange={(v) =>
                              setEditFormData((f) => ({
                                ...f,
                                status: v as SupportTicketStatus,
                              }))
                            }
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select status" />
                            </SelectTrigger>
                            <SelectContent>
                              {Object.values(SupportTicketStatus).map((s) => (
                                <SelectItem key={s} value={s}>
                                  {formatLabel(s)}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-2">
                          <Label className="text-xs font-semibold flex items-center gap-1.5">
                            <AlertCircle className="w-3.5 h-3.5 text-muted-foreground" />{" "}
                            Priority
                          </Label>
                          <Select
                            value={editFormData.priority}
                            onValueChange={(v) =>
                              setEditFormData((f) => ({
                                ...f,
                                priority: v as SupportTicketPriority,
                              }))
                            }
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select priority" />
                            </SelectTrigger>
                            <SelectContent>
                              {Object.values(SupportTicketPriority).map((p) => (
                                <SelectItem key={p} value={p}>
                                  {formatLabel(p)}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-2">
                          <Label className="text-xs font-semibold">
                            Ticket Type
                          </Label>
                          <Select
                            value={editFormData.ticketType || "none"}
                            onValueChange={(v) =>
                              setEditFormData((f) => ({
                                ...f,
                                ticketType: v === "none" ? "" : v,
                              }))
                            }
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select type" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="none">None</SelectItem>
                              {Object.values(SupportTicketType).map((t) => (
                                <SelectItem key={t} value={t}>
                                  {formatLabel(t)}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </div>

                    <Separator />

                    {/* SECTION 4: DETAILS & FOLLOW-UP */}
                    <div className="space-y-4">
                      <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                        <AlertCircle className="w-4 h-4" /> Details & Follow-up
                      </h3>

                      <div className="space-y-2">
                        <Label className="text-xs font-semibold">
                          Issue Detail
                        </Label>
                        <Textarea
                          placeholder="Describe the issue..."
                          value={editFormData.issueDetail}
                          onChange={(e) =>
                            setEditFormData((f) => ({
                              ...f,
                              issueDetail: e.target.value,
                            }))
                          }
                          className="min-h-30 resize-y"
                        />
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        <div className="space-y-2">
                          <Label className="text-xs font-semibold flex items-center gap-1.5">
                            <Calendar className="w-3.5 h-3.5 text-muted-foreground" />{" "}
                            Follow-up Due
                          </Label>
                          <Input
                            type="datetime-local"
                            value={editFormData.followUpDueDate}
                            onChange={(e) =>
                              setEditFormData((f) => ({
                                ...f,
                                followUpDueDate: e.target.value,
                              }))
                            }
                          />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-xs font-semibold flex items-center gap-1.5">
                            <User className="w-3.5 h-3.5 text-muted-foreground" />{" "}
                            Follow-up Assigned To
                          </Label>
                          <Select
                            value={editFormData.followUpAssignedToId || "none"}
                            onValueChange={(v) =>
                              setEditFormData((f) => ({
                                ...f,
                                followUpAssignedToId: v === "none" ? "" : v,
                              }))
                            }
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select agent" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="none">Not assigned</SelectItem>
                              {agents.map((a: any) => (
                                <SelectItem key={a.id} value={a.id.toString()}>
                                  {a.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      {/* Attachments */}
                      <div className="space-y-2 pt-2">
                        <Label className="text-xs font-semibold flex items-center gap-1.5">
                          <Paperclip className="w-3.5 h-3.5 text-muted-foreground" />{" "}
                          Attachments
                        </Label>
                        <input
                          ref={fileInputRef}
                          type="file"
                          multiple
                          className="hidden"
                          onChange={handleFileSelect}
                        />
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="w-fit"
                          onClick={() => fileInputRef.current?.click()}
                        >
                          <Upload className="h-4 w-4 mr-2" />
                          Add Files
                        </Button>

                        {selectedTicket.attachments &&
                          selectedTicket.attachments.length > 0 && (
                            <div className="flex flex-wrap gap-2 mt-1">
                              {selectedTicket.attachments.map(
                                (url: string, i: number) => (
                                  <a
                                    key={i}
                                    href={url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center gap-1 text-xs text-blue-600 hover:underline bg-blue-50 dark:bg-blue-950/30 px-2 py-1 rounded"
                                  >
                                    <Paperclip className="h-3 w-3" />
                                    {url.split("/").pop()}
                                  </a>
                                ),
                              )}
                            </div>
                          )}

                        {pendingFiles.length > 0 && (
                          <div className="flex flex-wrap gap-2 mt-1">
                            {pendingFiles.map((file, i) => (
                              <div
                                key={i}
                                className="flex items-center gap-1 text-xs bg-muted px-2 py-1 rounded"
                              >
                                <FileIcon className="h-3 w-3" />
                                <span className="max-w-37.5 truncate">
                                  {file.name}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => removePendingFile(i)}
                                  className="ml-1 hover:text-destructive"
                                >
                                  <X className="h-3 w-3" />
                                </button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Sticky footer */}
                <div className="px-6 py-4 border-t bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60 flex items-center justify-end gap-2 shrink-0">
                  <Button
                    variant="outline"
                    onClick={() => {
                      if (dialPhone) dial(dialPhone, selectedTicket.id);
                    }}
                    disabled={!dialPhone || !canDial}
                    title={
                      !dialPhone
                        ? "No phone number on file"
                        : !canDial
                          ? "Aircall is not connected"
                          : `Call ${dialPhone}`
                    }
                  >
                    <PhoneOutgoing className="h-4 w-4 mr-2" />
                    Call
                  </Button>
                  <Button
                    variant="ghost"
                    onClick={onClose}
                    disabled={isUpdating}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={onUpdate}
                    disabled={isUpdating}
                    className="px-8"
                  >
                    {isUpdating && (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    )}
                    {isUpdating ? "Updating..." : "Update Ticket"}
                  </Button>
                </div>
              </>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center gap-3 text-muted-foreground">
                <Ticket className="h-8 w-8 opacity-30" />
                <p className="text-sm">Select a ticket from the history</p>
              </div>
            )}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
