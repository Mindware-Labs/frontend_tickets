"use client";

import React, { useState, useMemo, useEffect, useRef } from "react";
import useSWR from "swr";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Plus,
  Search,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Paperclip,
  Upload,
  X,
  FileIcon,
  ChevronsUpDown,
  Check,
  CalendarIcon,
  PhoneOutgoing,
  PhoneIncoming,
  PhoneMissed,
  Phone,
  ChevronDown,
  Ticket,
} from "lucide-react";
import {
  TableCampaignBadge,
  TableYardBadge,
} from "@/components/entity-table-badges";
import { cn } from "@/lib/utils";
import { toast } from "@/hooks/use-toast";
import { useTicketFilters } from "../../hooks/useTicketFilters";
import { useAircall } from "@/components/providers/AircallProvider";
import { useReferenceData } from "../../hooks/useReferenceData";
import {
  InlineTicketTimeline,
  type CustomerTicketGroup,
} from "./InlineTicketTimeline";
import { EditTicketModal } from "./EditTicketModal";
import { TicketFiltersBar } from "./TicketFiltersBar";
import { CustomerTicketDrawer } from "../calls/CustomerTicketDrawer";
import {
  SupportTicketStatus,
  SupportTicketPriority,
  SupportTicketType,
  CampaignOptionEnum,
  type SupportTicketRecord,
  type CreateSupportTicketFormData,
} from "../../types";
import { format } from "date-fns";
import { Calendar } from "@/components/ui/calendar";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
const fetcher = async (url: string) => {
  const response = await fetch(url);
  const result = await response.json();
  if (!result.success) throw new Error(result.message || "Failed to load");
  return result.data;
};

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

const PRIORITY_PILL: Record<string, { dot: string; bg: string; fg: string }> = {
  LOW: { dot: "#94a3b8", bg: "#f1f5f9", fg: "#475569" },
  MEDIUM: { dot: "#f59e0b", bg: "#fef3c7", fg: "#b45309" },
  HIGH: { dot: "#f97316", bg: "#ffedd5", fg: "#c2410c" },
  EMERGENCY: { dot: "#dc2626", bg: "#fee2e2", fg: "#b91c1c" },
};

// Map status/priority to Tailwind classes for Badge styling
const statusColors: Record<string, string> = {
  ACTIVE: "bg-green-100 text-green-800 hover:bg-green-100",
  OPEN: "bg-green-100 text-green-800 hover:bg-green-100",
  IN_PROGRESS: "bg-green-100 text-green-800 hover:bg-green-100",
  PENDING_FOLLOWUP: "bg-yellow-100 text-yellow-800 hover:bg-yellow-100",
  OVERDUE: "bg-red-100 text-red-800 hover:bg-red-100",
  RESOLVED: "bg-green-100 text-green-800 hover:bg-green-100",
  CLOSED: "bg-gray-100 text-gray-800 hover:bg-gray-100",
};

const priorityColors: Record<string, string> = {
  LOW: "bg-slate-100 text-slate-800 hover:bg-slate-100",
  MEDIUM: "bg-amber-100 text-amber-800 hover:bg-amber-100",
  HIGH: "bg-orange-100 text-orange-800 hover:bg-orange-100",
  EMERGENCY: "bg-red-100 text-red-800 hover:bg-red-100",
};

const formatLabel = (v: string) =>
  v
    .replace(/_/g, " ")
    .toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase());

const normalizeStatusKey = (status?: string | null) => {
  const key = (status || "").toString().toUpperCase().replace(/\s+/g, "_");
  return key === "OPEN" || key === "IN_PROGRESS" ? "ACTIVE" : key;
};

const TICKET_STATUS_VIEW_TABS = [
  { key: "all", label: "All Tickets", countKey: "all" },
  { key: "active_status", label: "Active", countKey: "active_status" },
  {
    key: "pending_followup",
    label: "Pending Follow-up",
    countKey: "pending_followup",
  },
  { key: "overdue", label: "Overdue", countKey: "overdue", isOverdue: true },
  { key: "resolved", label: "Resolved", countKey: "resolved" },
  { key: "closed", label: "Closed", countKey: "closed" },
];

// ---------------------------------------------------------------------------
// Initial form data
// ---------------------------------------------------------------------------
const emptyForm: CreateSupportTicketFormData = {
  customerId: "",
  yardId: "",
  campaignId: "",
  campaignOption: "",
  agentId: "",
  phoneLineId: "",
  callId: "",
  status: SupportTicketStatus.ACTIVE,
  priority: SupportTicketPriority.MEDIUM,
  ticketType: "",
  disposition: "",
  issueDetail: "",
  followUpDueDate: "",
  followUpAssignedToId: "",
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
interface TicketsTabProps {
  initialCreateData?: Record<string, string> | null;
  onConsumeCreateData?: () => void;
}

export function TicketsTab({
  initialCreateData,
  onConsumeCreateData,
}: TicketsTabProps) {
  const refData = useReferenceData();
  const {
    dial,
    status: aircallStatus,
    isLoggedIn: aircallLoggedIn,
    setSheetOpen,
  } = useAircall();
  const canDial = aircallStatus === "ready" && aircallLoggedIn;
  const ticketFilters = useTicketFilters({
    currentAgentId: refData.currentAgent?.id,
  });

  // ---- SWR ----
  const {
    data: pageData,
    isLoading,
    mutate,
  } = useSWR(ticketFilters.ticketsApiUrl, fetcher, {
    refreshInterval: 0,
    revalidateOnFocus: false,
    dedupingInterval: 30000,
    shouldRetryOnError: false,
  });

  const tickets: SupportTicketRecord[] = useMemo(() => {
    const raw = Array.isArray(pageData) ? pageData : pageData?.data || [];
    return raw;
  }, [pageData]);

  const totalCount =
    typeof pageData?.total === "number" ? pageData.total : tickets.length;
  const totalPages =
    pageData?.totalPages ??
    Math.max(1, Math.ceil(totalCount / ticketFilters.itemsPerPage));

  const viewCounts = pageData?.viewCounts as Record<string, number> | undefined;

  // ---- Group tickets by customer ----
  const [expandedKey, setExpandedKey] = useState<string | null>(null);

  const ticketGroups = useMemo<CustomerTicketGroup[]>(() => {
    const map = new Map<
      string,
      {
        key: string;
        customerId?: number;
        customerName: string;
        customerPhone: string;
        tickets: SupportTicketRecord[];
        latestTicket: SupportTicketRecord;
      }
    >();

    for (const t of tickets) {
      const cid = t.customerId != null ? Number(t.customerId) : undefined;
      const phone = t.customer?.phone || "unknown";
      const name = t.customer?.name || (cid ? `Customer #${cid}` : "Unknown");
      const groupKey = cid != null ? `cid:${cid}` : `phone:${phone}`;

      const existing = map.get(groupKey);
      if (!existing) {
        map.set(groupKey, {
          key: groupKey,
          customerId: cid,
          customerName: name,
          customerPhone: phone,
          tickets: [t],
          latestTicket: t,
        });
      } else {
        existing.tickets.push(t);
        const existingDate = new Date(
          existing.latestTicket.createdAt || 0,
        ).getTime();
        const thisDate = new Date(t.createdAt || 0).getTime();
        if (thisDate > existingDate) {
          existing.latestTicket = t;
        }
      }
    }

    return Array.from(map.values()).sort(
      (a, b) =>
        new Date(b.latestTicket.createdAt || 0).getTime() -
        new Date(a.latestTicket.createdAt || 0).getTime(),
    );
  }, [tickets]);

  // ---- Modal state ----
  const [showCreate, setShowCreate] = useState(false);
  const [showView, setShowView] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [showDrawer, setShowDrawer] = useState(false);
  const [drawerGroup, setDrawerGroup] = useState<CustomerTicketGroup | null>(
    null,
  );
  const [selected, setSelected] = useState<SupportTicketRecord | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [form, setForm] = useState<CreateSupportTicketFormData>({
    ...emptyForm,
  });
  const [pendingFiles, setPendingFiles] = useState<File[]>([]);
  // Drawer-anchored toasts
  const [showDrawerSuccess, setShowDrawerSuccess] = useState(false);
  const [showDrawerError, setShowDrawerError] = useState(false);
  const [drawerErrorMessage, setDrawerErrorMessage] = useState("");

  useEffect(() => {
    setSheetOpen(showDrawer);
    return () => setSheetOpen(false);
  }, [showDrawer, setSheetOpen]);

  // ---- Handlers ----
  const resetForm = () => {
    setForm({ ...emptyForm });
    setPendingFiles([]);
  };

  // ---- Auto-open create from call ----
  useEffect(() => {
    if (initialCreateData) {
      setForm({
        ...emptyForm,
        ...initialCreateData,
        status: (initialCreateData.status
          ? normalizeStatusKey(initialCreateData.status)
          : emptyForm.status) as SupportTicketStatus,
      });
      setShowCreate(true);
      onConsumeCreateData?.();
    }
  }, [initialCreateData]); // eslint-disable-line react-hooks/exhaustive-deps

  const openCreate = () => {
    resetForm();
    setShowCreate(true);
  };

  const openView = (t: SupportTicketRecord) => {
    // Find the group this ticket belongs to
    const group =
      ticketGroups.find((g) => g.tickets.some((tk) => tk.id === t.id)) ?? null;
    setSelected(t);
    setDrawerGroup(group);
    // Populate form for editing inline in drawer
    setForm({
      customerId: t.customerId?.toString() || "",
      yardId: t.yardId?.toString() || "",
      campaignId: t.campaignId?.toString() || "",
      campaignOption: t.campaignOption || "",
      agentId: t.agentId?.toString() || "",
      phoneLineId: t.phoneLineId?.toString() || "",
      callId: t.callId?.toString() || "",
      status: normalizeStatusKey(t.status) as SupportTicketStatus,
      priority: t.priority,
      ticketType: t.ticketType || "",
      disposition: t.disposition || "",
      issueDetail: t.issueDetail || "",
      followUpDueDate: t.followUpDueDate
        ? new Date(t.followUpDueDate).toISOString().slice(0, 16)
        : "",
      followUpAssignedToId: t.followUpAssignedToId?.toString() || "",
    });
    setPendingFiles([]);
    setShowDrawer(true);
  };

  const handleSelectTicketInDrawer = (t: SupportTicketRecord) => {
    setSelected(t);
    setForm({
      customerId: t.customerId?.toString() || "",
      yardId: t.yardId?.toString() || "",
      campaignId: t.campaignId?.toString() || "",
      campaignOption: t.campaignOption || "",
      agentId: t.agentId?.toString() || "",
      phoneLineId: t.phoneLineId?.toString() || "",
      callId: t.callId?.toString() || "",
      status: normalizeStatusKey(t.status) as SupportTicketStatus,
      priority: t.priority,
      ticketType: t.ticketType || "",
      disposition: t.disposition || "",
      issueDetail: t.issueDetail || "",
      followUpDueDate: t.followUpDueDate
        ? new Date(t.followUpDueDate).toISOString().slice(0, 16)
        : "",
      followUpAssignedToId: t.followUpAssignedToId?.toString() || "",
    });
    setPendingFiles([]);
  };

  const openEdit = (t: SupportTicketRecord) => {
    setSelected(t);
    setForm({
      customerId: t.customerId?.toString() || "",
      yardId: t.yardId?.toString() || "",
      campaignId: t.campaignId?.toString() || "",
      campaignOption: t.campaignOption || "",
      agentId: t.agentId?.toString() || "",
      phoneLineId: t.phoneLineId?.toString() || "",
      callId: t.callId?.toString() || "",
      status: normalizeStatusKey(t.status) as SupportTicketStatus,
      priority: t.priority,
      ticketType: t.ticketType || "",
      disposition: t.disposition || "",
      issueDetail: t.issueDetail || "",
      followUpDueDate: t.followUpDueDate
        ? new Date(t.followUpDueDate).toISOString().slice(0, 16)
        : "",
      followUpAssignedToId: t.followUpAssignedToId?.toString() || "",
    });
    setPendingFiles([]);
    setShowEdit(true);
  };

  const handleCreate = async () => {
    if (!form.customerId) {
      toast({
        title: "Error",
        description: "Customer is required",
        variant: "destructive",
      });
      return;
    }
    try {
      setIsSubmitting(true);
      const payload: any = {
        customerId: Number(form.customerId),
        status: form.status,
        priority: form.priority,
      };
      if (form.yardId) payload.yardId = Number(form.yardId);
      if (form.campaignId) payload.campaignId = Number(form.campaignId);
      if (form.campaignOption) payload.campaignOption = form.campaignOption;
      if (form.agentId) payload.agentId = Number(form.agentId);
      if (form.phoneLineId) payload.phoneLineId = Number(form.phoneLineId);
      if (form.callId) payload.callId = Number(form.callId);
      if (form.ticketType) payload.ticketType = form.ticketType;
      if (form.issueDetail) payload.issueDetail = form.issueDetail;
      if (form.followUpDueDate)
        payload.followUpDueDate = new Date(form.followUpDueDate).toISOString();
      if (form.followUpAssignedToId)
        payload.followUpAssignedToId = Number(form.followUpAssignedToId);

      const res = await fetch("/api/tickets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const result = await res.json();
      if (result.success) {
        // Upload pending files if any
        const ticketId = result.data?.id;
        if (ticketId && pendingFiles.length > 0) {
          let uploadErrors = 0;
          for (const file of pendingFiles) {
            const fd = new FormData();
            fd.append("file", file);
            try {
              const upRes = await fetch(
                `/api/tickets/${ticketId}/attachments`,
                { method: "POST", body: fd },
              );
              const upResult = await upRes.json();
              if (!upResult.success) uploadErrors++;
            } catch {
              uploadErrors++;
            }
          }
          if (uploadErrors > 0) {
            toast({
              title: "Warning",
              description: `${uploadErrors} file(s) failed to upload`,
              variant: "destructive",
            });
          }
        }
        toast({ title: "Ticket created" });
        if (result.warning) {
          toast({
            title: "Warning",
            description: result.warning,
            variant: "destructive",
          });
        }
        setShowCreate(false);
        resetForm();
        await mutate();
      } else {
        toast({
          title: "Error",
          description: result.message,
          variant: "destructive",
        });
      }
    } catch {
      toast({
        title: "Error",
        description: "Failed to create ticket",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdate = async () => {
    if (!selected) return;
    try {
      setIsSubmitting(true);
      const payload: any = {
        status: form.status,
        priority: form.priority,
      };
      if (form.customerId) payload.customerId = Number(form.customerId);
      if (form.yardId) payload.yardId = Number(form.yardId);
      else payload.yardId = null;
      if (form.campaignId) payload.campaignId = Number(form.campaignId);
      else payload.campaignId = null;
      if (form.campaignOption) payload.campaignOption = form.campaignOption;
      else payload.campaignOption = null;
      if (form.agentId) payload.agentId = Number(form.agentId);
      else payload.agentId = null;
      if (form.phoneLineId) payload.phoneLineId = Number(form.phoneLineId);
      else payload.phoneLineId = null;
      if (form.ticketType) payload.ticketType = form.ticketType;
      else payload.ticketType = null;
      payload.issueDetail = form.issueDetail || null;
      if (form.followUpDueDate)
        payload.followUpDueDate = new Date(form.followUpDueDate).toISOString();
      else payload.followUpDueDate = null;
      if (form.followUpAssignedToId)
        payload.followUpAssignedToId = Number(form.followUpAssignedToId);
      else payload.followUpAssignedToId = null;

      const res = await fetch(`/api/tickets/${selected.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const result = await res.json();
      if (result.success) {
        // Upload pending files if any
        if (pendingFiles.length > 0) {
          let uploadErrors = 0;
          for (const file of pendingFiles) {
            const fd = new FormData();
            fd.append("file", file);
            try {
              const upRes = await fetch(
                `/api/tickets/${selected.id}/attachments`,
                { method: "POST", body: fd },
              );
              const upResult = await upRes.json();
              if (!upResult.success) uploadErrors++;
            } catch {
              uploadErrors++;
            }
          }
          if (uploadErrors > 0) {
            setDrawerErrorMessage(`${uploadErrors} file(s) failed to upload`);
            setShowDrawerError(true);
          }
        }
        setShowDrawerSuccess(true);
        setShowEdit(false);
        resetForm();
        await mutate();
      } else {
        setDrawerErrorMessage(result.message ?? "Failed to save changes");
        setShowDrawerError(true);
      }
    } catch {
      setDrawerErrorMessage("Failed to update ticket");
      setShowDrawerError(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  // ---- Helpers for display ----
  const customerName = (t: SupportTicketRecord) =>
    t.customer?.name || `Customer #${t.customerId}`;

  const agentName = (t: SupportTicketRecord) =>
    t.assignedTo
      ? t.assignedTo.name || `Agent #${t.agentId}`
      : t.agentId
        ? `Agent #${t.agentId}`
        : "—";

  const yardName = (t: SupportTicketRecord) =>
    t.yard?.name || (t.yardId ? `Yard #${t.yardId}` : "—");

  // ---- Render ----
  return (
    <div className="flex-1 flex flex-col gap-1">
      {/* View Tabs */}
      <div className="flex items-end border-b border-border">
        <div className="flex min-w-0 flex-1 items-end overflow-x-auto overflow-y-hidden [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
        <div className="flex px-0.5">
        {TICKET_STATUS_VIEW_TABS.map((tab) => {
          const isActive = ticketFilters.activeView === tab.key;
          const count = viewCounts?.[tab.countKey] ?? 0;
          return (
            <button
              key={tab.key}
              type="button"
              onClick={() => {
                ticketFilters.handleViewChange(tab.key);
                ticketFilters.setFilter("status", "all");
              }}
              className={`mr-4 flex shrink-0 items-center gap-2 whitespace-nowrap border-b-2 px-2 py-[10px] text-[13px] font-medium transition-colors -mb-px ${
                isActive
                  ? "border-[#008f68] text-foreground"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              {tab.label}
              <span
                className={`py-[1px] px-[7px] rounded-full text-[11px] border ${
                  isActive
                    ? "bg-[#e2fae9] text-[#008f68] font-semibold border-[#e2fae9]"
                    : "bg-muted/40 text-muted-foreground font-medium border-border"
                }`}
              >
                {count}
              </span>
              {tab.isOverdue && count > 0 && (
                <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse -ml-0.5" />
              )}
            </button>
          );
        })}
        </div>
        </div>
        <button
          type="button"
          onClick={openCreate}
          className="mb-1 ml-2 shrink-0 flex h-[30px] items-center gap-1.5 rounded-full px-3.5 text-[12.5px] font-semibold text-white shadow-sm transition-all active:scale-95"
          style={{ background: "#008f68" }}
          onMouseEnter={(e) => (e.currentTarget.style.background = "#007a5a")}
          onMouseLeave={(e) => (e.currentTarget.style.background = "#008f68")}
        >
          <Plus className="w-3.5 h-3.5" />
          New Ticket
        </button>
      </div>

      {/* Filters row */}
      <div className="space-y-2">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 my-3">
          <div className="relative flex-1 max-w-[320px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-[14px] w-[14px] text-muted-foreground" />
            <Input
              placeholder="Search tickets, customers, or issues..."
              value={ticketFilters.search}
              onChange={(e) => ticketFilters.setSearch(e.target.value)}
              className="pl-[34px] pr-8 h-[30px] rounded-full text-[12.5px] bg-muted/30 border-border shadow-none focus-visible:ring-[#008f68]/30 focus-visible:border-[#008f68]/40"
            />
            <div className="absolute right-2.5 top-1/2 -translate-y-1/2 border border-border rounded px-1.5 py-[1px] text-[10px] text-muted-foreground font-mono bg-background">
              /
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 sm:justify-end">
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "flex h-[30px] items-center rounded-full border-border px-3 text-[12.5px] font-medium shadow-none",
                    !ticketFilters.dateRange?.from && "text-muted-foreground",
                  )}
                >
                  <CalendarIcon className="mr-2 h-[14px] w-[14px] shrink-0" />
                  {ticketFilters.dateRange?.from ? (
                    ticketFilters.dateRange.to ? (
                      <span className="truncate">
                        {format(ticketFilters.dateRange.from, "MMM d")} -{" "}
                        {format(ticketFilters.dateRange.to, "MMM d, yyyy")}
                      </span>
                    ) : (
                      <span>
                        {format(ticketFilters.dateRange.from, "MMM d, yyyy")}
                      </span>
                    )
                  ) : (
                    <span>Select dates</span>
                  )}
                  <ChevronDown className="ml-2 h-3 w-3 text-muted-foreground" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="end">
                <div className="space-y-3 p-3">
                  <Calendar
                    initialFocus
                    mode="range"
                    selected={ticketFilters.dateRange}
                    onSelect={ticketFilters.setDateRange}
                    numberOfMonths={1}
                    disabled={{ after: new Date() }}
                    className="rounded-md"
                  />
                  {ticketFilters.dateRange?.from && (
                    <div className="flex justify-end px-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 text-xs"
                        onClick={() => ticketFilters.setDateRange(undefined)}
                      >
                        <X className="mr-1 h-3 w-3" />
                        Clear dates
                      </Button>
                    </div>
                  )}
                </div>
              </PopoverContent>
            </Popover>

            <TicketFiltersBar
              filters={ticketFilters.filters}
              onFilterChange={ticketFilters.setFilter}
              agents={refData.agents}
              campaigns={refData.campaigns}
              yards={refData.yards}
              phoneLines={refData.phoneLines}
            />
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-xl border border-border/80 overflow-hidden shadow-sm">
        <div className="max-h-[calc(100vh-12rem)] overflow-y-auto">
          <Table className="relative">
            <TableHeader className="bg-slate-50 sticky top-0 z-10 border-y border-slate-200 dark:bg-muted/40">
              <TableRow className="border-none hover:bg-transparent">
                <TableHead className="w-[76px] pl-4 font-bold text-[11px] tracking-wider uppercase text-slate-500 dark:text-slate-400">
                  ID
                </TableHead>
                <TableHead className="w-[250px] font-bold text-[11px] tracking-wider uppercase text-slate-500 dark:text-slate-400">
                  Customer
                </TableHead>
                <TableHead className="w-[88px] font-bold text-[11px] tracking-wider uppercase text-slate-500 dark:text-slate-400 text-center">
                  Tickets
                </TableHead>
                <TableHead className="w-[140px] font-bold text-[11px] tracking-wider uppercase text-slate-500 dark:text-slate-400">
                  Status
                </TableHead>
                <TableHead className="w-[130px] font-bold text-[11px] tracking-wider uppercase text-slate-500 dark:text-slate-400">
                  Priority
                </TableHead>
                <TableHead className="w-[130px] font-bold text-[11px] tracking-wider uppercase text-slate-500 dark:text-slate-400">
                  Type
                </TableHead>
                <TableHead className="w-[150px] font-bold text-[11px] tracking-wider uppercase text-slate-500 dark:text-slate-400">
                  Agent
                </TableHead>
                <TableHead className="w-[140px] font-bold text-[11px] tracking-wider uppercase text-slate-500 dark:text-slate-400">
                  Yard
                </TableHead>
                <TableHead className="w-[170px] font-bold text-[11px] tracking-wider uppercase text-slate-500 dark:text-slate-400">
                  Campaign
                </TableHead>
                <TableHead className="w-[130px] font-bold text-[11px] tracking-wider uppercase text-slate-500 dark:text-slate-400">
                  Created
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={10} className="h-24 text-center">
                    <Loader2 className="mx-auto h-5 w-5 animate-spin text-slate-400" />
                  </TableCell>
                </TableRow>
              ) : ticketGroups.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={10}
                    className="h-24 text-center text-slate-400 text-sm"
                  >
                    No tickets found
                  </TableCell>
                </TableRow>
              ) : (
                ticketGroups.map((group, i) => {
                  const t = group.latestTicket;
                  const initials = (t.customer?.name || "?")
                    .substring(0, 2)
                    .toUpperCase();
                  const statusKey = normalizeStatusKey(t.status);
                  const sp = STATUS_PILL[statusKey] || STATUS_PILL.CLOSED;
                  const pp = PRIORITY_PILL[t.priority] || PRIORITY_PILL.LOW;
                  return (
                    <React.Fragment key={group.key}>
                      <TableRow
                        className={cn(
                          "cursor-pointer group hover:bg-[#f0faf5]/60 dark:hover:bg-muted/50 border-b border-border/70 relative transition-all duration-150",
                          i % 2 === 1
                            ? "bg-slate-50/60 dark:bg-muted/20"
                            : "bg-white dark:bg-card",
                        )}
                        onClick={() => openView(t)}
                      >
                        <TableCell className="pl-4 py-3">
                          <span className="text-[12px] font-mono font-semibold text-slate-400">
                            #{t.id}
                          </span>
                          {t.callId && (
                            <div className="mt-0.5">
                              <Popover>
                                <PopoverTrigger asChild>
                                  <button
                                    type="button"
                                    onClick={(e) => e.stopPropagation()}
                                    className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-semibold bg-blue-50 text-blue-500 border border-blue-100 hover:bg-blue-100 transition-colors cursor-pointer"
                                  >
                                    {(t.call?.direction ?? "").toUpperCase() ===
                                    "INBOUND" ? (
                                      <PhoneIncoming className="w-2.5 h-2.5" />
                                    ) : (
                                        t.call?.direction ?? ""
                                      ).toUpperCase() === "OUTBOUND" ? (
                                      <PhoneOutgoing className="w-2.5 h-2.5" />
                                    ) : (
                                        t.call?.direction ?? ""
                                      ).toUpperCase() === "MISSED" ? (
                                      <PhoneMissed className="w-2.5 h-2.5" />
                                    ) : (
                                      <Phone className="w-2.5 h-2.5" />
                                    )}
                                    via call
                                  </button>
                                </PopoverTrigger>
                                <PopoverContent
                                  side="right"
                                  align="start"
                                  className="w-64 p-3 text-[12px]"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">
                                    Source Call #{t.callId}
                                  </p>
                                  <div className="space-y-1.5">
                                    {t.call?.direction && (
                                      <div className="flex justify-between">
                                        <span className="text-slate-500">
                                          Direction
                                        </span>
                                        <span className="font-semibold text-slate-700 capitalize">
                                          {t.call.direction.charAt(0) +
                                            t.call.direction
                                              .slice(1)
                                              .toLowerCase()}
                                        </span>
                                      </div>
                                    )}
                                    {t.call?.agent?.name && (
                                      <div className="flex justify-between">
                                        <span className="text-slate-500">
                                          Agent
                                        </span>
                                        <span className="font-semibold text-slate-700">
                                          {t.call.agent.name}
                                        </span>
                                      </div>
                                    )}
                                    {t.call?.startedAt && (
                                      <div className="flex justify-between">
                                        <span className="text-slate-500">
                                          Date
                                        </span>
                                        <span className="font-semibold text-slate-700 tabular-nums">
                                          {format(
                                            new Date(t.call.startedAt),
                                            "MMM d, yyyy HH:mm",
                                          )}
                                        </span>
                                      </div>
                                    )}
                                    {(t.call?.duration ?? 0) > 0 && (
                                      <div className="flex justify-between">
                                        <span className="text-slate-500">
                                          Duration
                                        </span>
                                        <span className="font-semibold text-slate-700 tabular-nums">
                                          {Math.floor(
                                            (t.call!.duration ?? 0) / 60,
                                          )}
                                          :
                                          {String(
                                            (t.call!.duration ?? 0) % 60,
                                          ).padStart(2, "0")}
                                        </span>
                                      </div>
                                    )}
                                    {t.call?.disposition && (
                                      <div className="flex justify-between">
                                        <span className="text-slate-500">
                                          Disposition
                                        </span>
                                        <span className="font-semibold text-slate-700 capitalize">
                                          {t.call.disposition
                                            .replace(/_/g, " ")
                                            .toLowerCase()}
                                        </span>
                                      </div>
                                    )}
                                  </div>
                                </PopoverContent>
                              </Popover>
                            </div>
                          )}
                        </TableCell>
                        <TableCell className="py-3">
                          <div className="flex items-center gap-2.5">
                            <div
                              className="w-8 h-8 rounded-full flex items-center justify-center text-[12px] font-bold shrink-0"
                              style={{
                                background: "transparent",
                                border: "1px solid #d1d5db",
                                color: "#111827",
                              }}
                            >
                              {initials}
                            </div>
                            <div className="min-w-0">
                              <p className="text-[14px] font-bold text-foreground leading-tight truncate">
                                {customerName(t)}
                              </p>
                              {t.customer?.phone && (
                                <div className="flex items-center gap-1">
                                  <span className="text-[11.5px] text-muted-foreground font-mono">
                                    {t.customer.phone}
                                  </span>
                                  <button
                                    type="button"
                                    className="w-5 h-5 flex items-center justify-center rounded-md hover:bg-[#e6f5f0] transition-colors disabled:opacity-40"
                                    style={{ color: "#008f68" }}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      dial(t.customer!.phone!, t.id);
                                    }}
                                    disabled={!canDial}
                                  >
                                    <PhoneOutgoing className="h-3 w-3" />
                                  </button>
                                </div>
                              )}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="text-center">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setExpandedKey((prev) =>
                                prev === group.key ? null : group.key,
                              );
                            }}
                            className={cn(
                              "inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-full border text-[12.5px] font-bold transition-all duration-150 shadow-sm",
                              expandedKey === group.key
                                ? "bg-[#dcfce7] text-[#15803d] border-[#86efac] shadow-[#86efac]/20"
                                : "bg-slate-100 text-slate-600 border-slate-200 hover:bg-[#dcfce7] hover:text-[#15803d] hover:border-[#86efac] dark:bg-slate-800 dark:text-slate-300 dark:border-slate-600",
                            )}
                            aria-label="Toggle ticket timeline"
                            title="View ticket timeline"
                          >
                            <ChevronRight
                              className={cn(
                                "h-3 w-3 transition-transform",
                                expandedKey === group.key && "rotate-90",
                              )}
                            />
                            <Ticket className="h-3 w-3" />
                            {group.tickets.length}
                          </button>
                        </TableCell>
                        <TableCell>
                          <span
                            className="inline-flex items-center gap-1.5 px-2.5 py-[3px] rounded-full text-[11px] font-semibold border"
                            style={{
                              color: sp.fg,
                              background: sp.bg,
                              borderColor: sp.bg,
                            }}
                          >
                            <span
                              className="w-1.5 h-1.5 rounded-full shrink-0"
                              style={{ background: sp.dot }}
                            />
                            {sp.label}
                          </span>
                        </TableCell>
                        <TableCell>
                          <span
                            className="inline-flex items-center gap-1.5 px-2.5 py-[3px] rounded-full text-[11px] font-semibold border"
                            style={{
                              color: pp.fg,
                              background: pp.bg,
                              borderColor: pp.bg,
                            }}
                          >
                            <span
                              className="w-1.5 h-1.5 rounded-full shrink-0"
                              style={{ background: pp.dot }}
                            />
                            {formatLabel(t.priority)}
                          </span>
                        </TableCell>
                        <TableCell className="py-3 text-[13.5px] text-slate-600 dark:text-slate-300 truncate font-medium">
                          {t.ticketType ? formatLabel(t.ticketType) : "—"}
                        </TableCell>
                        <TableCell className="py-3 text-[13px] text-slate-600 dark:text-slate-300 truncate">
                          {agentName(t)}
                        </TableCell>
                        <TableCell className="w-[200px] min-w-[180px] py-3 align-middle">
                          <TableYardBadge
                            name={t.yard?.commonName || t.yard?.name}
                          />
                        </TableCell>
                        <TableCell className="w-[180px] min-w-[150px] py-3 align-middle">
                          <TableCampaignBadge name={t.campaign?.nombre} />
                        </TableCell>
                        <TableCell className="py-3 text-[13px] text-slate-500 dark:text-slate-400 font-mono font-medium">
                          {t.createdAt
                            ? format(new Date(t.createdAt), "MMM d, yyyy")
                            : "—"}
                        </TableCell>
                      </TableRow>
                      {expandedKey === group.key && (
                        <TableRow
                          key={`${group.key}-timeline`}
                          className="bg-slate-50/50 hover:bg-slate-50/50"
                        >
                          <TableCell colSpan={10} className="p-0">
                            <InlineTicketTimeline
                              group={group}
                              agents={refData.agents}
                              onOpenView={openView}
                            />
                          </TableCell>
                        </TableRow>
                      )}
                    </React.Fragment>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-3">
          <span className="text-[11px] text-slate-500">
            Page{" "}
            <span className="font-semibold text-slate-700">
              {ticketFilters.currentPage}
            </span>{" "}
            of {totalPages} · {totalCount}{" "}
            {totalCount === 1 ? "ticket" : "tickets"}
          </span>
          <Select
            value={String(ticketFilters.itemsPerPage)}
            onValueChange={(v) => ticketFilters.setItemsPerPage(Number(v))}
          >
            <SelectTrigger className="h-7 w-20 text-[11px] border-slate-200 rounded-lg">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {[8, 10, 25, 50].map((n) => (
                <SelectItem key={n} value={String(n)}>
                  {n} / page
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center gap-1">
          <button
            type="button"
            className="w-7 h-7 flex items-center justify-center rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 disabled:opacity-40 transition-colors"
            disabled={ticketFilters.currentPage <= 1}
            onClick={() =>
              ticketFilters.setCurrentPage(ticketFilters.currentPage - 1)
            }
          >
            <ChevronLeft className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            className="w-7 h-7 flex items-center justify-center rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 disabled:opacity-40 transition-colors"
            disabled={ticketFilters.currentPage >= totalPages}
            onClick={() =>
              ticketFilters.setCurrentPage(ticketFilters.currentPage + 1)
            }
          >
            <ChevronRight className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* ── Create Modal ─────────────────────────────────────────────── */}
      <Dialog
        open={showCreate}
        onOpenChange={(o) => {
          setShowCreate(o);
          if (!o) resetForm();
        }}
      >
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>New Support Ticket</DialogTitle>
          </DialogHeader>
          <TicketForm
            form={form}
            setForm={setForm}
            customers={refData.customers}
            yards={refData.yards}
            agents={refData.agents}
            campaigns={refData.campaigns}
            phoneLines={refData.phoneLines}
            pendingFiles={pendingFiles}
            onFilesChange={setPendingFiles}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreate(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreate} disabled={isSubmitting}>
              {isSubmitting && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Create
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── View Modal ───────────────────────────────────────────────── */}
      <Dialog open={showView} onOpenChange={setShowView}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Ticket #{selected?.id}</DialogTitle>
          </DialogHeader>
          {selected && (
            <div className="grid gap-3 text-sm">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <span className="text-muted-foreground">Customer</span>
                  <div className="flex items-center gap-1.5">
                    <p className="font-medium">{customerName(selected)}</p>
                    {selected.customer?.phone && (
                      <>
                        <span className="text-xs text-muted-foreground">
                          {selected.customer.phone}
                        </span>
                        <Button
                          type="button"
                          size="icon"
                          variant="ghost"
                          className="h-6 w-6 shrink-0 text-primary hover:text-primary hover:bg-primary/10"
                          onClick={() =>
                            dial(selected.customer!.phone!, selected.id)
                          }
                          disabled={!canDial}
                          title={
                            canDial
                              ? `Call ${selected.customer.phone}`
                              : "Aircall is not connected"
                          }
                        >
                          <PhoneOutgoing className="h-3.5 w-3.5" />
                        </Button>
                      </>
                    )}
                  </div>
                </div>
                <div>
                  <span className="text-muted-foreground">Agent</span>
                  <p className="font-medium">{agentName(selected)}</p>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <span className="text-muted-foreground">Status</span>
                  <div>
                    <Badge
                      variant="secondary"
                      className={
                        statusColors[normalizeStatusKey(selected.status)] || ""
                      }
                    >
                      {formatLabel(normalizeStatusKey(selected.status))}
                    </Badge>
                  </div>
                </div>
                <div>
                  <span className="text-muted-foreground">Priority</span>
                  <div>
                    <Badge
                      variant="secondary"
                      className={priorityColors[selected.priority] || ""}
                    >
                      {formatLabel(selected.priority)}
                    </Badge>
                  </div>
                </div>
                <div>
                  <span className="text-muted-foreground">Type</span>
                  <p className="font-medium">
                    {selected.ticketType
                      ? formatLabel(selected.ticketType)
                      : "—"}
                  </p>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <span className="text-muted-foreground">Yard</span>
                  <p className="font-medium">{yardName(selected)}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Campaign</span>
                  <p className="font-medium">
                    {selected.campaign?.nombre ||
                      (selected.campaignId ? `#${selected.campaignId}` : "—")}
                  </p>
                </div>
                <div>
                  <span className="text-muted-foreground">Campaign Option</span>
                  <p className="font-medium">
                    {selected.campaignOption
                      ? formatLabel(selected.campaignOption)
                      : "—"}
                  </p>
                </div>
              </div>
              <div>
                <span className="text-muted-foreground">Phone Line</span>
                <div className="flex items-center gap-1.5">
                  <p className="font-medium">
                    {selected.phoneLine
                      ? `${selected.phoneLine.label || ""} ${selected.phoneLine.phoneNumber}`.trim()
                      : "—"}
                  </p>
                  {selected.phoneLine?.phoneNumber && (
                    <Button
                      type="button"
                      size="icon"
                      variant="ghost"
                      className="h-6 w-6 shrink-0 text-primary hover:text-primary hover:bg-primary/10"
                      onClick={() =>
                        dial(selected.phoneLine!.phoneNumber, selected.id)
                      }
                      disabled={!canDial}
                      title={
                        canDial
                          ? `Call ${selected.phoneLine.phoneNumber}`
                          : "Aircall is not connected"
                      }
                    >
                      <PhoneOutgoing className="h-3.5 w-3.5" />
                    </Button>
                  )}
                </div>
              </div>
              {selected.issueDetail && (
                <div>
                  <span className="text-muted-foreground">Issue Detail</span>
                  <p className="mt-1 whitespace-pre-wrap rounded bg-muted p-2">
                    {selected.issueDetail}
                  </p>
                </div>
              )}
              {selected.attachments && selected.attachments.length > 0 && (
                <div>
                  <span className="text-muted-foreground">Attachments</span>
                  <ul className="mt-1 space-y-1">
                    {selected.attachments.map((url, i) => (
                      <li key={i} className="flex items-center gap-1 text-xs">
                        <Paperclip className="h-3 w-3" />
                        <a
                          href={url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:underline truncate max-w-75"
                        >
                          {url.split("/").pop() || `Attachment ${i + 1}`}
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {selected.followUpDueDate && (
                <div>
                  <span className="text-muted-foreground">Follow-up Due</span>
                  <p className="font-medium">
                    {format(
                      new Date(selected.followUpDueDate),
                      "MMM d, yyyy HH:mm",
                    )}
                  </p>
                </div>
              )}
              <div className="grid grid-cols-2 gap-3 text-xs text-muted-foreground">
                <div>
                  Created:{" "}
                  {selected.createdAt
                    ? format(new Date(selected.createdAt), "MMM d, yyyy HH:mm")
                    : "—"}
                </div>
                <div>
                  Updated:{" "}
                  {selected.updatedAt
                    ? format(new Date(selected.updatedAt), "MMM d, yyyy HH:mm")
                    : "—"}
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowView(false)}>
              Close
            </Button>
            <Button
              onClick={() => {
                setShowView(false);
                if (selected) openEdit(selected);
              }}
            >
              Edit
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Edit Modal ───────────────────────────────────────────────── */}
      <EditTicketModal
        open={showEdit}
        onOpenChange={setShowEdit}
        ticket={selected}
        form={form}
        setForm={setForm}
        customers={refData.customers}
        yards={refData.yards}
        agents={refData.agents}
        campaigns={refData.campaigns}
        phoneLines={refData.phoneLines}
        pendingFiles={pendingFiles}
        onFilesChange={setPendingFiles}
        isSubmitting={isSubmitting}
        onSubmit={handleUpdate}
        onClose={() => setShowEdit(false)}
      />

      {/* ── Ticket Drawer (history + edit) ───────────────────────────── */}
      <CustomerTicketDrawer
        open={showDrawer}
        onClose={() => {
          setShowDrawer(false);
          resetForm();
        }}
        group={drawerGroup}
        selectedTicket={selected}
        onSelectTicket={handleSelectTicketInDrawer}
        editFormData={form}
        setEditFormData={setForm}
        pendingFiles={pendingFiles}
        onFilesChange={setPendingFiles}
        isUpdating={isSubmitting}
        onUpdate={handleUpdate}
        customers={refData.customers}
        yards={refData.yards}
        agents={refData.agents}
        campaigns={refData.campaigns}
        phoneLines={refData.phoneLines}
        showSuccessToast={showDrawerSuccess}
        onSuccessToastDismiss={() => setShowDrawerSuccess(false)}
        showErrorToast={showDrawerError}
        errorToastMessage={drawerErrorMessage}
        onErrorToastDismiss={() => setShowDrawerError(false)}
      />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Shared form used in Create and Edit modals
// ---------------------------------------------------------------------------
function TicketForm({
  form,
  setForm,
  customers,
  yards,
  agents,
  campaigns,
  phoneLines,
  pendingFiles,
  onFilesChange,
  existingAttachments,
}: {
  form: CreateSupportTicketFormData;
  setForm: React.Dispatch<React.SetStateAction<CreateSupportTicketFormData>>;
  customers: any[];
  yards: any[];
  agents: any[];
  campaigns: any[];
  phoneLines: { id: number; label: string | null; phoneNumber: string }[];
  pendingFiles?: File[];
  onFilesChange?: (files: File[]) => void;
  existingAttachments?: string[];
}) {
  const [customerSearch, setCustomerSearch] = useState("");
  const [customerOpen, setCustomerOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleCustomerOpenChange = (isOpen: boolean) => {
    setCustomerOpen(isOpen);
    if (!isOpen) setCustomerSearch("");
  };

  const normalizePhoneForSearch = (value?: string | null) => {
    if (!value) return "";
    return value.replace(/\D/g, "");
  };

  const stripUsCountryCode = (digits: string) => {
    if (digits.length > 10 && digits.startsWith("1")) {
      return digits.slice(1);
    }
    return digits;
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    if (onFilesChange && pendingFiles) {
      onFilesChange([...pendingFiles, ...files]);
    }
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const removePendingFile = (index: number) => {
    if (onFilesChange && pendingFiles) {
      onFilesChange(pendingFiles.filter((_, i) => i !== index));
    }
  };

  const filteredCustomers = useMemo(() => {
    if (!customerSearch.trim()) return customers;
    const searchLower = customerSearch.toLowerCase();
    const searchPhoneDigits = normalizePhoneForSearch(customerSearch);
    const searchPhoneDigitsWithoutCountryCode =
      stripUsCountryCode(searchPhoneDigits);
    return customers.filter((c) => {
      const customerPhone = c.phone ?? "";
      const customerPhoneDigits = normalizePhoneForSearch(customerPhone);
      const customerPhoneDigitsWithoutCountryCode =
        stripUsCountryCode(customerPhoneDigits);
      const matchesPhoneNormalized =
        !!searchPhoneDigits &&
        (customerPhoneDigits.includes(searchPhoneDigits) ||
          customerPhoneDigitsWithoutCountryCode.includes(searchPhoneDigits) ||
          customerPhoneDigits.includes(searchPhoneDigitsWithoutCountryCode) ||
          customerPhoneDigitsWithoutCountryCode.includes(
            searchPhoneDigitsWithoutCountryCode,
          ));
      return (
        c.name?.toLowerCase().includes(searchLower) ||
        customerPhone.toLowerCase().includes(searchLower) ||
        c.id.toString().includes(searchLower) ||
        c.email?.toLowerCase().includes(searchLower) ||
        matchesPhoneNormalized
      );
    });
  }, [customers, customerSearch]);

  return (
    <div className="grid gap-3">
      {/* Customer */}
      <div className="grid gap-1.5">
        <Label>Customer *</Label>
        <Popover open={customerOpen} onOpenChange={handleCustomerOpenChange}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              role="combobox"
              aria-expanded={customerOpen}
              className="w-full justify-between"
            >
              {form.customerId
                ? customers.find((c) => c.id.toString() === form.customerId)
                    ?.name || form.customerId
                : "Select customer..."}
              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-full p-0" align="start">
            <div className="flex flex-col">
              <div className="px-3 py-2 border-b">
                <Input
                  placeholder="Search customer..."
                  value={customerSearch}
                  onChange={(e) => setCustomerSearch(e.target.value)}
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
                    filteredCustomers.map((c) => (
                      <div
                        key={c.id}
                        className={cn(
                          "relative flex cursor-pointer select-none items-center rounded-sm px-2 py-2.5 text-sm outline-none hover:bg-accent hover:text-accent-foreground",
                          form.customerId === c.id.toString() && "bg-accent",
                        )}
                        onClick={() => {
                          setForm((f) => ({
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
                            form.customerId === c.id.toString()
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

      {/* Status + Priority */}
      <div className="grid grid-cols-2 gap-3">
        <div className="grid gap-1.5">
          <Label>Status</Label>
          <Select
            value={form.status}
            onValueChange={(v) =>
              setForm((f) => ({ ...f, status: v as SupportTicketStatus }))
            }
          >
            <SelectTrigger className="h-9">
              <SelectValue />
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
        <div className="grid gap-1.5">
          <Label>Priority</Label>
          <Select
            value={form.priority}
            onValueChange={(v) =>
              setForm((f) => ({ ...f, priority: v as SupportTicketPriority }))
            }
          >
            <SelectTrigger className="h-9">
              <SelectValue />
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
      </div>

      {/* Follow-up panel (shown when status is Pending Follow-up) */}
      {form.status === SupportTicketStatus.PENDING_FOLLOWUP && (
        <div className="grid grid-cols-2 gap-3 animate-in fade-in-0 slide-in-from-top-2 duration-200 rounded-xl p-3 bg-amber-50 border border-amber-200/70">
          <div className="grid gap-1.5">
            <div className="flex items-center gap-1.5">
              <Label className="text-[11px] font-semibold text-slate-600">
                Follow-up Date
              </Label>
              <span className="text-[8.5px] font-black text-amber-600 bg-amber-100 border border-amber-300/60 px-1.5 py-0.5 rounded-md uppercase tracking-wide">
                Follow-up
              </span>
            </div>
            <Input
              type="datetime-local"
              value={
                form.followUpDueDate
                  ? new Date(form.followUpDueDate).toISOString().slice(0, 16)
                  : ""
              }
              onChange={(e) =>
                setForm((f) => ({
                  ...f,
                  followUpDueDate: e.target.value
                    ? new Date(e.target.value).toISOString()
                    : "",
                }))
              }
              className="h-9 border-amber-300 focus-visible:ring-amber-300/40"
            />
          </div>
          <div className="grid gap-1.5">
            <Label className="text-[11px] font-semibold text-slate-600">
              Assignee
            </Label>
            <Select
              value={form.followUpAssignedToId || "none"}
              onValueChange={(v) =>
                setForm((f) => ({
                  ...f,
                  followUpAssignedToId: v === "none" ? "" : v,
                }))
              }
            >
              <SelectTrigger className="h-9 border-amber-300 focus:ring-amber-300/40">
                <SelectValue placeholder="Unassigned" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Unassigned</SelectItem>
                {agents.map((a) => (
                  <SelectItem key={a.id} value={a.id.toString()}>
                    {a.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      )}

      {/* Ticket Type */}
      <div className="grid gap-1.5">
        <Label>Ticket Type</Label>
        <Select
          value={form.ticketType || "none"}
          onValueChange={(v) =>
            setForm((f) => ({ ...f, ticketType: v === "none" ? "" : v }))
          }
        >
          <SelectTrigger className="h-9">
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

      {/* Yard + Campaign */}
      <div className="grid grid-cols-2 gap-3">
        <div className="grid gap-1.5">
          <Label>Yard</Label>
          <Select
            value={form.yardId || "none"}
            onValueChange={(v) =>
              setForm((f) => ({ ...f, yardId: v === "none" ? "" : v }))
            }
          >
            <SelectTrigger className="h-9">
              <SelectValue placeholder="Select yard" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">None</SelectItem>
              {yards.map((y) => (
                <SelectItem key={y.id} value={y.id.toString()}>
                  {y.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="grid gap-1.5">
          <Label>Campaign</Label>
          <Select
            value={form.campaignId || "none"}
            onValueChange={(v) => {
              const id = v === "none" ? "" : v;
              const camp = campaigns.find((c) => c.id.toString() === id);
              setForm((f) => ({
                ...f,
                campaignId: id,
                // auto-fill yard from campaign
                ...(camp?.yardaId ? { yardId: camp.yardaId.toString() } : {}),
              }));
            }}
          >
            <SelectTrigger className="h-9">
              <SelectValue placeholder="Select campaign" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">None</SelectItem>
              {campaigns.map((c) => (
                <SelectItem key={c.id} value={c.id.toString()}>
                  {c.nombre}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Campaign Option */}
      <div className="grid gap-1.5">
        <Label>Campaign Option</Label>
        <Select
          value={form.campaignOption || "none"}
          onValueChange={(v) =>
            setForm((f) => ({ ...f, campaignOption: v === "none" ? "" : v }))
          }
        >
          <SelectTrigger className="h-9">
            <SelectValue placeholder="Select option" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">None</SelectItem>
            {Object.values(CampaignOptionEnum).map((opt) => (
              <SelectItem key={opt} value={opt}>
                {formatLabel(opt)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Agent */}
      <div className="grid gap-1.5">
        <Label>Assigned Agent</Label>
        <Select
          value={form.agentId || "none"}
          onValueChange={(v) =>
            setForm((f) => ({ ...f, agentId: v === "none" ? "" : v }))
          }
        >
          <SelectTrigger className="h-9">
            <SelectValue placeholder="Select agent" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">None</SelectItem>
            {agents.map((a) => (
              <SelectItem key={a.id} value={a.id.toString()}>
                {a.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Phone Line */}
      <div className="grid gap-1.5">
        <Label>Phone Line</Label>
        <Select
          value={form.phoneLineId || "none"}
          onValueChange={(v) =>
            setForm((f) => ({ ...f, phoneLineId: v === "none" ? "" : v }))
          }
        >
          <SelectTrigger className="h-9">
            <SelectValue placeholder="Select phone line" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">None</SelectItem>
            {phoneLines.map((pl) => (
              <SelectItem key={pl.id} value={pl.id.toString()}>
                {pl.label ? `${pl.label} (${pl.phoneNumber})` : pl.phoneNumber}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Issue Detail */}
      <div className="grid gap-1.5">
        <Label>Issue Detail</Label>
        <Textarea
          value={form.issueDetail}
          onChange={(e) =>
            setForm((f) => ({ ...f, issueDetail: e.target.value }))
          }
          placeholder="Describe the issue..."
          rows={5}
        />
      </div>

      {/* Attachments */}
      <div className="grid gap-1.5">
        <Label>Attachments</Label>
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

        {/* Existing attachments (edit mode) */}
        {existingAttachments && existingAttachments.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-1">
            {existingAttachments.map((url, i) => (
              <a
                key={i}
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-xs text-blue-600 hover:underline bg-blue-50 px-2 py-1 rounded"
              >
                <Paperclip className="h-3 w-3" />
                {url.split("/").pop()}
              </a>
            ))}
          </div>
        )}

        {/* Pending files (create mode) */}
        {pendingFiles && pendingFiles.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-1">
            {pendingFiles.map((file, i) => (
              <div
                key={i}
                className="flex items-center gap-1 text-xs bg-muted px-2 py-1 rounded"
              >
                <FileIcon className="h-3 w-3" />
                <span className="max-w-37.5 truncate">{file.name}</span>
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
  );
}
