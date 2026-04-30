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
  SlidersHorizontal,
  PhoneOutgoing,
  ChevronDown,
  Ticket,
} from "lucide-react";
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
import { CustomerTicketDrawer } from "../calls/CustomerTicketDrawer";
import {
  SupportTicketStatus,
  SupportTicketPriority,
  SupportTicketType,
  CampaignOptionEnum,
  ManagementType,
  OnboardingOption,
  ArOption,
  type SupportTicketRecord,
  type CreateSupportTicketFormData,
  type CampaignOption,
} from "../../types";
import { format } from "date-fns";
import { Calendar } from "@/components/ui/calendar";
import type { DateRange } from "react-day-picker";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
const fetcher = async (url: string) => {
  const response = await fetch(url);
  const result = await response.json();
  if (!result.success) throw new Error(result.message || "Failed to load");
  return result.data;
};

const STATUS_PILL: Record<string, { dot: string; bg: string; fg: string; label: string }> = {
  ACTIVE:           { dot: "#008f68", bg: "#e6f5f0", fg: "#006d50", label: "Active" },
  OPEN:             { dot: "#008f68", bg: "#e6f5f0", fg: "#006d50", label: "Active" },
  IN_PROGRESS:      { dot: "#008f68", bg: "#e6f5f0", fg: "#006d50", label: "Active" },
  PENDING_FOLLOWUP: { dot: "#d97706", bg: "#fef3c7", fg: "#b45309", label: "Follow-up" },
  OVERDUE:          { dot: "#dc2626", bg: "#fee2e2", fg: "#b91c1c", label: "Overdue" },
  RESOLVED:         { dot: "#008f68", bg: "#e6f5f0", fg: "#006d50", label: "Resolved" },
  CLOSED:           { dot: "#64748b", bg: "#f1f5f9", fg: "#475569", label: "Closed" },
};

const PRIORITY_PILL: Record<string, { dot: string; bg: string; fg: string }> = {
  LOW:       { dot: "#94a3b8", bg: "#f1f5f9", fg: "#475569" },
  MEDIUM:    { dot: "#f59e0b", bg: "#fef3c7", fg: "#b45309" },
  HIGH:      { dot: "#f97316", bg: "#ffedd5", fg: "#c2410c" },
  EMERGENCY: { dot: "#dc2626", bg: "#fee2e2", fg: "#b91c1c" },
};

// Map status/priority to Tailwind classes for Badge styling
const statusColors: Record<string, string> = {
  ACTIVE:           "bg-green-100 text-green-800 hover:bg-green-100",
  OPEN:             "bg-green-100 text-green-800 hover:bg-green-100",
  IN_PROGRESS:      "bg-green-100 text-green-800 hover:bg-green-100",
  PENDING_FOLLOWUP: "bg-yellow-100 text-yellow-800 hover:bg-yellow-100",
  OVERDUE:          "bg-red-100 text-red-800 hover:bg-red-100",
  RESOLVED:         "bg-green-100 text-green-800 hover:bg-green-100",
  CLOSED:           "bg-gray-100 text-gray-800 hover:bg-gray-100",
};

const priorityColors: Record<string, string> = {
  LOW:       "bg-slate-100 text-slate-800 hover:bg-slate-100",
  MEDIUM:    "bg-amber-100 text-amber-800 hover:bg-amber-100",
  HIGH:      "bg-orange-100 text-orange-800 hover:bg-orange-100",
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
  } = useAircall();
  const canDial = aircallStatus === "ready" && aircallLoggedIn;
  const ticketFilters = useTicketFilters({
    currentAgentId: refData.currentAgent?.id,
  });

  // ---- Filter bar state ----
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [campaignSearch, setCampaignSearch] = useState("");

  const activeFilterCount = useMemo(() => {
    let count = Object.values(ticketFilters.filters).filter(
      (v) => v !== "all",
    ).length;
    if (ticketFilters.dateRange?.from) count++;
    return count;
  }, [ticketFilters.filters, ticketFilters.dateRange]);

  const filteredCampaigns = useMemo(() => {
    const term = campaignSearch.toLowerCase();
    return refData.campaigns.filter((c) =>
      c.nombre.toLowerCase().includes(term),
    );
  }, [refData.campaigns, campaignSearch]);

  const selectedCampaignTipo = useMemo(() => {
    if (ticketFilters.filters.campaign === "all") return null;
    const found = refData.campaigns.find(
      (c) => c.id.toString() === ticketFilters.filters.campaign,
    );
    return found?.tipo ?? null;
  }, [ticketFilters.filters.campaign, refData.campaigns]);

  const availableCampaignOptions: string[] = useMemo(() => {
    if (selectedCampaignTipo === ManagementType.ONBOARDING)
      return Object.values(OnboardingOption);
    if (selectedCampaignTipo === ManagementType.AR)
      return Object.values(ArOption);
    return Object.values(CampaignOptionEnum);
  }, [selectedCampaignTipo]);

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

  // ---- Status options filtered by active tab ----
  const ACTIVE_STATUSES = [
    SupportTicketStatus.ACTIVE,
    SupportTicketStatus.PENDING_FOLLOWUP,
    SupportTicketStatus.OVERDUE,
  ];
  const CLOSED_STATUSES = [
    SupportTicketStatus.RESOLVED,
    SupportTicketStatus.CLOSED,
  ];

  const filteredStatusOptions = useMemo(() => {
    const view = ticketFilters.activeView;
    if (view === "active") return ACTIVE_STATUSES;
    if (view === "inactive") return CLOSED_STATUSES;
    return Object.values(SupportTicketStatus);
  }, [ticketFilters.activeView]);

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
            toast({
              title: "Warning",
              description: `${uploadErrors} file(s) failed to upload`,
              variant: "destructive",
            });
          }
        }
        toast({ title: "Ticket updated" });
        setShowEdit(false);
        setShowDrawer(false);
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
        description: "Failed to update ticket",
        variant: "destructive",
      });
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
      <div className="flex items-center gap-2 border-b border-border/80 overflow-x-auto no-scrollbar px-0.5">
        {[
          { key: "active",   label: "Active",  countKey: "active" },
          { key: "inactive", label: "Closed",  countKey: "inactive" },
          { key: "all",      label: "All",     countKey: "all" },
        ].map((tab) => {
          const isActive = ticketFilters.activeView === tab.key;
          const count = viewCounts?.[tab.countKey];
          return (
            <button
              key={tab.key}
              type="button"
              onClick={() => { ticketFilters.handleViewChange(tab.key); ticketFilters.setFilter("status", "all"); }}
              className={`px-2 py-[10px] text-[13px] font-medium border-b-2 mr-4 flex items-center gap-2 transition-colors -mb-px ${
                isActive ? "border-[#008f68] text-foreground" : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              {tab.label}
              {count != null && (
                <span className={`py-[1px] px-[7px] rounded-full text-[11px] border ${
                  isActive ? "bg-[#e2fae9] text-[#008f68] font-semibold border-[#e2fae9]" : "bg-muted/40 text-muted-foreground font-medium border-border"
                }`}>
                  {count}
                </span>
              )}
            </button>
          );
        })}
        <div className="flex-1" />
        <button
          type="button"
          onClick={openCreate}
          className="mb-1 flex items-center gap-1.5 h-8 px-3.5 text-white text-xs font-semibold rounded-xl transition-all active:scale-95 shadow-sm self-center"
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

          <div className="flex flex-wrap items-center gap-2 sm:justify-end">
          <Select
            value={ticketFilters.filters.status}
            onValueChange={(v) => ticketFilters.setFilter("status", v)}
          >
            <SelectTrigger className="w-36 h-[30px] rounded-full text-[12.5px] border-border shadow-none">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              {filteredStatusOptions.map((s) => (
                <SelectItem key={s} value={s}>
                  {formatLabel(s)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={ticketFilters.filters.priority}
            onValueChange={(v) => ticketFilters.setFilter("priority", v)}
          >
            <SelectTrigger className="w-34 h-[30px] rounded-full text-[12.5px] border-border shadow-none">
              <SelectValue placeholder="Priority" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Priority</SelectItem>
              {Object.values(SupportTicketPriority).map((p) => (
                <SelectItem key={p} value={p}>
                  {formatLabel(p)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={ticketFilters.filters.ticketType}
            onValueChange={(v) => ticketFilters.setFilter("ticketType", v)}
          >
            <SelectTrigger className="w-38 h-[30px] rounded-full text-[12.5px] border-border shadow-none">
              <SelectValue placeholder="Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              {Object.values(SupportTicketType).map((t) => (
                <SelectItem key={t} value={t}>
                  {formatLabel(t)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Button
            variant={
              filtersOpen || activeFilterCount > 0 ? "secondary" : "outline"
            }
            size="sm"
            className="h-[30px] rounded-full px-3 text-[12.5px] font-medium border-border shadow-none"
            onClick={() => setFiltersOpen(!filtersOpen)}
          >
            <SlidersHorizontal className="mr-1.5 h-3.5 w-3.5" />
            More Filters
            {activeFilterCount > 0 && (
              <Badge
                variant="default"
                className="ml-1.5 h-4 min-w-4 px-1 text-[10px] leading-none"
              >
                {activeFilterCount}
              </Badge>
            )}
          </Button>

          {activeFilterCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="h-[30px] rounded-full px-3 text-[12.5px] text-muted-foreground"
              onClick={ticketFilters.clearAllFilters}
            >
              <X className="mr-1 h-3 w-3" />
              Clear all
            </Button>
          )}
          </div>
        </div>

        {/* Expanded filter dropdowns */}
        {filtersOpen && (
          <div className="flex flex-wrap items-end gap-3 rounded-xl border border-border/80 bg-slate-50/80 p-3 shadow-sm dark:bg-muted/30">
            {/* Yard */}
            <div className="min-w-35 space-y-1">
              <span className="text-[11px] font-medium text-muted-foreground">
                Yard
              </span>
              <Select
                value={ticketFilters.filters.yard}
                onValueChange={(v) => ticketFilters.setFilter("yard", v)}
              >
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue placeholder="All" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Yards</SelectItem>
                  {refData.yards.map((y) => (
                    <SelectItem key={y.id} value={y.id.toString()}>
                      {y.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Agent */}
            <div className="min-w-35 space-y-1">
              <span className="text-[11px] font-medium text-muted-foreground">
                Agent
              </span>
              <Select
                value={ticketFilters.filters.agent}
                onValueChange={(v) => ticketFilters.setFilter("agent", v)}
              >
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue placeholder="All" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Agents</SelectItem>
                  {refData.agents.map((a) => (
                    <SelectItem key={a.id} value={a.id.toString()}>
                      {a.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Campaign */}
            <div className="min-w-40 space-y-1">
              <span className="text-[11px] font-medium text-muted-foreground">
                Campaign
              </span>
              <Select
                value={ticketFilters.filters.campaign}
                onValueChange={(v) => {
                  ticketFilters.setFilter("campaign", v);
                  if (ticketFilters.filters.campaignOption !== "all") {
                    const newCampaign = refData.campaigns.find(
                      (c) => c.id.toString() === v,
                    );
                    const newTipo =
                      v === "all" ? null : (newCampaign?.tipo ?? null);
                    const newOptions: string[] =
                      newTipo === ManagementType.ONBOARDING
                        ? Object.values(OnboardingOption)
                        : newTipo === ManagementType.AR
                          ? Object.values(ArOption)
                          : Object.values(CampaignOptionEnum);
                    if (
                      !newOptions.includes(ticketFilters.filters.campaignOption)
                    ) {
                      ticketFilters.setFilter("campaignOption", "all");
                    }
                  }
                }}
              >
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue placeholder="All" />
                </SelectTrigger>
                <SelectContent>
                  <div className="p-2">
                    <Input
                      placeholder="Search..."
                      value={campaignSearch}
                      onChange={(e) => setCampaignSearch(e.target.value)}
                      onClick={(e) => e.stopPropagation()}
                      onKeyDown={(e) => e.stopPropagation()}
                      className="h-7 text-xs"
                    />
                  </div>
                  <SelectItem value="all">All Campaigns</SelectItem>
                  {filteredCampaigns.map((c) => (
                    <SelectItem key={c.id} value={c.id.toString()}>
                      {c.nombre}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Campaign Option */}
            <div className="min-w-40 space-y-1">
              <span className="text-[11px] font-medium text-muted-foreground">
                Campaign Option
              </span>
              <Select
                value={
                  ticketFilters.filters.campaignOption !== "all" &&
                  !availableCampaignOptions.includes(
                    ticketFilters.filters.campaignOption,
                  )
                    ? "all"
                    : ticketFilters.filters.campaignOption
                }
                onValueChange={(v) =>
                  ticketFilters.setFilter("campaignOption", v)
                }
              >
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue placeholder="All" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Options</SelectItem>
                  {availableCampaignOptions.map((value) => (
                    <SelectItem key={value} value={value}>
                      {formatLabel(value)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Phone Line */}
            <div className="min-w-35 space-y-1">
              <span className="text-[11px] font-medium text-muted-foreground">
                Phone Line
              </span>
              <Select
                value={ticketFilters.filters.phoneLine}
                onValueChange={(v) => ticketFilters.setFilter("phoneLine", v)}
              >
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue placeholder="All" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Lines</SelectItem>
                  {refData.phoneLines.map((l) => (
                    <SelectItem key={l.id} value={l.id.toString()}>
                      {l.label || l.phoneNumber}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Date Range */}
            <div className="min-w-55 space-y-1">
              <span className="text-[11px] font-medium text-muted-foreground">
                Date Range
              </span>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "h-8 w-full justify-start text-left text-xs font-normal",
                      !ticketFilters.dateRange && "text-muted-foreground",
                    )}
                  >
                    <CalendarIcon className="mr-2 h-3.5 w-3.5" />
                    {ticketFilters.dateRange?.from ? (
                      ticketFilters.dateRange.to ? (
                        <>
                          {format(ticketFilters.dateRange.from, "LLL dd, y")} –{" "}
                          {format(ticketFilters.dateRange.to, "LLL dd, y")}
                        </>
                      ) : (
                        format(ticketFilters.dateRange.from, "LLL dd, y")
                      )
                    ) : (
                      "Pick a date range"
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    initialFocus
                    mode="range"
                    defaultMonth={ticketFilters.dateRange?.from}
                    selected={ticketFilters.dateRange}
                    onSelect={ticketFilters.setDateRange}
                    numberOfMonths={2}
                  />
                  {ticketFilters.dateRange?.from && (
                    <div className="border-t p-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 w-full text-xs"
                        onClick={() => ticketFilters.setDateRange(undefined)}
                      >
                        Clear dates
                      </Button>
                    </div>
                  )}
                </PopoverContent>
              </Popover>
            </div>
          </div>
        )}
      </div>

      {/* Table */}
      <div className="rounded-xl border border-border/80 overflow-hidden shadow-sm">
        <div className="max-h-[calc(100vh-12rem)] overflow-y-auto">
          <Table className="relative">
            <TableHeader className="bg-slate-50 sticky top-0 z-10 border-y border-slate-200 dark:bg-muted/40">
              <TableRow className="border-none hover:bg-transparent">
                <TableHead className="w-[76px] pl-4 font-bold text-[11px] tracking-wider uppercase text-slate-500 dark:text-slate-400">ID</TableHead>
                <TableHead className="w-[250px] font-bold text-[11px] tracking-wider uppercase text-slate-500 dark:text-slate-400">Customer</TableHead>
                <TableHead className="w-[88px] font-bold text-[11px] tracking-wider uppercase text-slate-500 dark:text-slate-400 text-center">Tickets</TableHead>
                <TableHead className="w-[140px] font-bold text-[11px] tracking-wider uppercase text-slate-500 dark:text-slate-400">Status</TableHead>
                <TableHead className="w-[130px] font-bold text-[11px] tracking-wider uppercase text-slate-500 dark:text-slate-400">Priority</TableHead>
                <TableHead className="w-[130px] font-bold text-[11px] tracking-wider uppercase text-slate-500 dark:text-slate-400">Type</TableHead>
                <TableHead className="w-[150px] font-bold text-[11px] tracking-wider uppercase text-slate-500 dark:text-slate-400">Agent</TableHead>
                <TableHead className="w-[140px] font-bold text-[11px] tracking-wider uppercase text-slate-500 dark:text-slate-400">Yard</TableHead>
                <TableHead className="w-[170px] font-bold text-[11px] tracking-wider uppercase text-slate-500 dark:text-slate-400">Campaign</TableHead>
                <TableHead className="w-[130px] font-bold text-[11px] tracking-wider uppercase text-slate-500 dark:text-slate-400">Created</TableHead>
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
                <TableCell colSpan={10} className="h-24 text-center text-slate-400 text-sm">
                  No tickets found
                </TableCell>
              </TableRow>
            ) : (
              ticketGroups.map((group, i) => {
                const t = group.latestTicket;
                const initials = (t.customer?.name || "?").substring(0, 2).toUpperCase();
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
                      <TableCell className="pl-4 py-3 text-[12px] font-mono font-semibold text-slate-400">#{t.id}</TableCell>
                      <TableCell className="py-3">
                        <div className="flex items-center gap-2.5">
                          <div
                            className="w-8 h-8 rounded-full flex items-center justify-center text-[12px] font-bold shrink-0"
                            style={{ background: "transparent", border: "1px solid #d1d5db", color: "#111827" }}
                          >
                            {initials}
                          </div>
                          <div className="min-w-0">
                            <p className="text-[14px] font-bold text-foreground leading-tight truncate">{customerName(t)}</p>
                            {t.customer?.phone && (
                              <div className="flex items-center gap-1">
                                <span className="text-[11.5px] text-muted-foreground font-mono">{t.customer.phone}</span>
                                <button
                                  type="button"
                                  className="w-5 h-5 flex items-center justify-center rounded-md hover:bg-[#e6f5f0] transition-colors disabled:opacity-40"
                                  style={{ color: "#008f68" }}
                                  onClick={(e) => { e.stopPropagation(); dial(t.customer!.phone!, t.id); }}
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
                          onClick={(e) => { e.stopPropagation(); setExpandedKey((prev) => prev === group.key ? null : group.key); }}
                          className={cn(
                            "inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-full border text-[12.5px] font-bold transition-all duration-150 shadow-sm",
                            expandedKey === group.key
                              ? "bg-[#dcfce7] text-[#15803d] border-[#86efac] shadow-[#86efac]/20"
                              : "bg-slate-100 text-slate-600 border-slate-200 hover:bg-[#dcfce7] hover:text-[#15803d] hover:border-[#86efac] dark:bg-slate-800 dark:text-slate-300 dark:border-slate-600",
                          )}
                          aria-label="Toggle ticket timeline"
                          title="View ticket timeline"
                        >
                          <ChevronRight className={cn("h-3 w-3 transition-transform", expandedKey === group.key && "rotate-90")} />
                          <Ticket className="h-3 w-3" />
                          {group.tickets.length}
                        </button>
                      </TableCell>
                      <TableCell>
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-[3px] rounded-full text-[11px] font-semibold border"
                          style={{ color: sp.fg, background: sp.bg, borderColor: sp.bg }}>
                          <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: sp.dot }} />
                          {sp.label}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-[3px] rounded-full text-[11px] font-semibold border"
                          style={{ color: pp.fg, background: pp.bg, borderColor: pp.bg }}>
                          <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: pp.dot }} />
                          {formatLabel(t.priority)}
                        </span>
                      </TableCell>
                      <TableCell className="py-3 text-[13.5px] text-slate-600 dark:text-slate-300 truncate font-medium">{t.ticketType ? formatLabel(t.ticketType) : "—"}</TableCell>
                      <TableCell className="py-3 text-[13px] text-slate-600 dark:text-slate-300 truncate">{agentName(t)}</TableCell>
                      <TableCell className="py-3 text-[13.5px] text-slate-600 dark:text-slate-300 truncate font-medium">{yardName(t)}</TableCell>
                      <TableCell className="py-3 text-[13.5px] text-slate-600 dark:text-slate-300 truncate font-medium">{t.campaign?.nombre || "—"}</TableCell>
                      <TableCell className="py-3 text-[13px] text-slate-500 dark:text-slate-400 font-mono font-medium">
                        {t.createdAt ? format(new Date(t.createdAt), "MMM d, yyyy") : "—"}
                      </TableCell>
                    </TableRow>
                    {expandedKey === group.key && (
                      <TableRow key={`${group.key}-timeline`} className="bg-slate-50/50 hover:bg-slate-50/50">
                        <TableCell colSpan={10} className="p-0">
                          <InlineTicketTimeline group={group} agents={refData.agents} onOpenView={openView} />
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
            Page <span className="font-semibold text-slate-700">{ticketFilters.currentPage}</span> of {totalPages} · {totalCount} {totalCount === 1 ? "ticket" : "tickets"}
          </span>
          <Select value={String(ticketFilters.itemsPerPage)} onValueChange={(v) => ticketFilters.setItemsPerPage(Number(v))}>
            <SelectTrigger className="h-7 w-20 text-[11px] border-slate-200 rounded-lg">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {[8, 10, 25, 50].map((n) => (
                <SelectItem key={n} value={String(n)}>{n} / page</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center gap-1">
          <button
            type="button"
            className="w-7 h-7 flex items-center justify-center rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 disabled:opacity-40 transition-colors"
            disabled={ticketFilters.currentPage <= 1}
            onClick={() => ticketFilters.setCurrentPage(ticketFilters.currentPage - 1)}
          >
            <ChevronLeft className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            className="w-7 h-7 flex items-center justify-center rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 disabled:opacity-40 transition-colors"
            disabled={ticketFilters.currentPage >= totalPages}
            onClick={() => ticketFilters.setCurrentPage(ticketFilters.currentPage + 1)}
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
                      className={statusColors[normalizeStatusKey(selected.status)] || ""}
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

      {/* Type */}
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

      {/* Follow-up */}
      <div className="grid grid-cols-2 gap-3">
        <div className="grid gap-1.5">
          <Label>Follow-up Due</Label>
          <Input
            type="datetime-local"
            value={form.followUpDueDate}
            onChange={(e) =>
              setForm((f) => ({ ...f, followUpDueDate: e.target.value }))
            }
            className="h-9"
          />
        </div>
        <div className="grid gap-1.5">
          <Label>Follow-up Agent</Label>
          <Select
            value={form.followUpAssignedToId || "none"}
            onValueChange={(v) =>
              setForm((f) => ({
                ...f,
                followUpAssignedToId: v === "none" ? "" : v,
              }))
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
      </div>
    </div>
  );
}
