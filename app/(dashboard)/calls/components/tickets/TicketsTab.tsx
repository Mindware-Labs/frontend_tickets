"use client";

import React, {
  useState,
  useMemo,
  useEffect,
  useRef,
  useCallback,
} from "react";
import { useReturnToTimeline } from "../../hooks/useReturnToTimeline";
import { DeepLinkFocusBanner } from "../shared/DeepLinkFocusBanner";
import useSWR from "swr";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
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
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Plus,
  Search,
  Loader2,
  Paperclip,
  X,
  CalendarIcon,
  PhoneOutgoing,
  ChevronDown,
  Ticket as TicketIcon,
  RotateCcw,
  MousePointerClick,
} from "lucide-react";
import type { ReactNode } from "react";
import {
  TableCampaignBadge,
  TableYardBadge,
} from "@/components/entity-table-badges";
import {
  TablePriorityPill,
  TableSupportStatusPill,
  normalizeSupportStatusKey,
} from "@/components/entity-table-pills";
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
import { ScheduleCallSheet } from "../calls/ScheduleCallSheet";
import { CreateTicketForm } from "./CreateTicketForm";
import type { CustomerSearchOption } from "../shared/AsyncCustomerCombobox";
import { DataTablePagination } from "../shared/DataTablePagination";
import { TableLoadingRow } from "@/components/shared/entity-loading-state";
import { SourceCallViaCallBadge } from "../calls/SourceCallViaCallModal";
import {
  SupportTicketStatus,
  SupportTicketPriority,
  SupportTicketType,
  type SupportTicketRecord,
  type CreateSupportTicketFormData,
  type CreateScheduleCallFormData,
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

const ticketPhoneLineLabel = (ticket: SupportTicketRecord) => {
  const line = ticket.phoneLine;
  if (!line) return "";
  return line.label ? `${line.label} (${line.phoneNumber})` : line.phoneNumber;
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
  originalIssueDetail: "",
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
  const returnTo = useReturnToTimeline(refData.customers);
  const isNavigatingBackRef = useRef(false);
  const ticketFilters = useTicketFilters({
    currentAgentId: refData.currentAgent?.id,
  });
  const focusTicketId = ticketFilters.focusTicketId;
  const isFocusMode = Boolean(focusTicketId?.trim());

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
  const [showSchedule, setShowSchedule] = useState(false);
  const [isScheduleSubmitting, setIsScheduleSubmitting] = useState(false);
  const [drawerGroup, setDrawerGroup] = useState<CustomerTicketGroup | null>(
    null,
  );
  const [selected, setSelected] = useState<SupportTicketRecord | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [form, setForm] = useState<CreateSupportTicketFormData>({
    ...emptyForm,
  });
  const [pendingFiles, setPendingFiles] = useState<File[]>([]);
  const [createFormCustomer, setCreateFormCustomer] =
    useState<CustomerSearchOption | null>(null);
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
    setCreateFormCustomer(null);
  };

  // ---- Auto-open create from call ----
  useEffect(() => {
    if (initialCreateData) {
      const { customerName, customerPhone, ...formSeed } = initialCreateData;
      setForm({
        ...emptyForm,
        ...formSeed,
        status: (formSeed.status
          ? normalizeSupportStatusKey(formSeed.status)
          : emptyForm.status) as SupportTicketStatus,
      });
      if (formSeed.customerId) {
        setCreateFormCustomer({
          id: Number(formSeed.customerId),
          name: customerName?.trim() || `Customer #${formSeed.customerId}`,
          phone: customerPhone?.trim() || null,
        });
      } else {
        setCreateFormCustomer(null);
      }
      setShowCreate(true);
      onConsumeCreateData?.();
    }
  }, [initialCreateData]); // eslint-disable-line react-hooks/exhaustive-deps

  const openCreate = () => {
    resetForm();
    setShowCreate(true);
  };

  const openView = useCallback(
    (t: SupportTicketRecord) => {
      // Find the group this ticket belongs to
      const group =
        ticketGroups.find((g) => g.tickets.some((tk) => tk.id === t.id)) ??
        null;
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
        status: normalizeSupportStatusKey(t.status) as SupportTicketStatus,
        priority: t.priority,
        ticketType: t.ticketType || "",
        disposition: t.disposition || "",
        issueDetail: t.issueDetail || "",
        originalIssueDetail: t.originalIssueDetail ?? t.issueDetail ?? "",
        followUpDueDate: t.followUpDueDate
          ? new Date(t.followUpDueDate).toISOString().slice(0, 16)
          : "",
        followUpAssignedToId: t.followUpAssignedToId?.toString() || "",
      });
      setPendingFiles([]);
      setShowDrawer(true);
    },
    [ticketGroups],
  );

  const processedFocusTicketIdRef = useRef<string | null>(null);

  const handleBackToTimeline = () => {
    if (!returnTo.safeReturnPath) return;
    isNavigatingBackRef.current = true;
    setShowDrawer(false);
    setShowDrawerSuccess(false);
    setShowDrawerError(false);
    processedFocusTicketIdRef.current = null;
    ticketFilters.leaveTicketFocus(returnTo.safeReturnPath);
  };

  const handleCloseDrawer = () => {
    setShowDrawer(false);
    setShowDrawerSuccess(false);
    setShowDrawerError(false);
    resetForm();
    if (focusTicketId && !isNavigatingBackRef.current) {
      ticketFilters.clearTicketFocus();
    }
    isNavigatingBackRef.current = false;
  };

  useEffect(() => {
    if (!focusTicketId) {
      processedFocusTicketIdRef.current = null;
      return;
    }
    if (processedFocusTicketIdRef.current === focusTicketId) return;

    let cancelled = false;

    const openFromUrl = async () => {
      const fromList = tickets.find((t) => t.id.toString() === focusTicketId);
      if (fromList) {
        if (cancelled) return;
        processedFocusTicketIdRef.current = focusTicketId;
        openView(fromList);
        return;
      }

      try {
        const response = await fetch(`/api/tickets/${focusTicketId}`);
        if (!response.ok || cancelled) return;
        const payload = await response.json();
        const resolved = payload?.data ?? payload;
        if (!resolved || cancelled) return;
        processedFocusTicketIdRef.current = focusTicketId;
        openView(resolved as SupportTicketRecord);
      } catch {
        // ignore
      }
    };

    void openFromUrl();

    return () => {
      cancelled = true;
    };
  }, [focusTicketId, tickets, openView]);

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
      status: normalizeSupportStatusKey(t.status) as SupportTicketStatus,
      priority: t.priority,
      ticketType: t.ticketType || "",
      disposition: t.disposition || "",
      issueDetail: t.issueDetail || "",
      originalIssueDetail: t.originalIssueDetail ?? t.issueDetail ?? "",
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
      status: normalizeSupportStatusKey(t.status) as SupportTicketStatus,
      priority: t.priority,
      ticketType: t.ticketType || "",
      disposition: t.disposition || "",
      issueDetail: t.issueDetail || "",
      originalIssueDetail: t.originalIssueDetail ?? t.issueDetail ?? "",
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
      if (form.originalIssueDetail)
        payload.originalIssueDetail = form.originalIssueDetail;
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

  const handleScheduleCall = async (data: CreateScheduleCallFormData) => {
    try {
      setIsScheduleSubmitting(true);
      const payload: any = {
        customerId: Number(data.customerId),
        scheduledAt: new Date(data.scheduledAt).toISOString(),
      };
      if (data.agentId) payload.agentId = Number(data.agentId);
      if (data.notes) payload.notes = data.notes;

      const res = await fetch("/api/schedule-calls", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const result = await res.json();
      if (result.success) {
        toast({ title: "Call scheduled" });
        setShowSchedule(false);
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
        description: "Failed to schedule call",
        variant: "destructive",
      });
    } finally {
      setIsScheduleSubmitting(false);
    }
  };

  const uploadPendingAttachments = async (ticketId: number) => {
    if (pendingFiles.length === 0) return 0;
    let uploadErrors = 0;
    for (const file of pendingFiles) {
      const fd = new FormData();
      fd.append("file", file);
      try {
        const upRes = await fetch(`/api/tickets/${ticketId}/attachments`, {
          method: "POST",
          body: fd,
        });
        const upResult = await upRes.json();
        if (!upResult.success) uploadErrors++;
      } catch {
        uploadErrors++;
      }
    }
    return uploadErrors;
  };

  const buildPropertiesPayload = (includeStatusAndFollowUp: boolean) => {
    const payload: Record<string, unknown> = {
      priority: form.priority,
    };
    if (includeStatusAndFollowUp) {
      payload.status = form.status;
    }
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
    payload.originalIssueDetail = form.originalIssueDetail || null;
    if (includeStatusAndFollowUp) {
      if (form.followUpDueDate) {
        payload.followUpDueDate = new Date(form.followUpDueDate).toISOString();
      } else payload.followUpDueDate = null;
      if (form.followUpAssignedToId) {
        payload.followUpAssignedToId = Number(form.followUpAssignedToId);
      } else payload.followUpAssignedToId = null;
    }
    return payload;
  };

  const syncFormFromTicket = (t: SupportTicketRecord) => {
    setForm({
      customerId: t.customerId?.toString() || "",
      yardId: t.yardId?.toString() || "",
      campaignId: t.campaignId?.toString() || "",
      campaignOption: t.campaignOption || "",
      agentId: t.agentId?.toString() || "",
      phoneLineId: t.phoneLineId?.toString() || "",
      callId: t.callId?.toString() || "",
      status: normalizeSupportStatusKey(t.status) as SupportTicketStatus,
      priority: t.priority,
      ticketType: t.ticketType || "",
      disposition: t.disposition || "",
      issueDetail: t.issueDetail || "",
      originalIssueDetail: t.originalIssueDetail ?? t.issueDetail ?? "",
      followUpDueDate: t.followUpDueDate
        ? new Date(t.followUpDueDate).toISOString().slice(0, 16)
        : "",
      followUpAssignedToId: t.followUpAssignedToId?.toString() || "",
    });
  };

  const handleSaveDrawerProperties = async () => {
    if (!selected) return;
    try {
      setIsSubmitting(true);
      const res = await fetch(`/api/tickets/${selected.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(buildPropertiesPayload(false)),
      });
      const result = await res.json();
      if (result.success) {
        const uploadErrors = await uploadPendingAttachments(selected.id);
        if (uploadErrors > 0) {
          setDrawerErrorMessage(`${uploadErrors} file(s) failed to upload`);
          setShowDrawerError(true);
        }
        setSelected(result.data);
        syncFormFromTicket(result.data);
        setPendingFiles([]);
        setShowDrawerSuccess(true);
        await mutate();
      } else {
        setDrawerErrorMessage(result.message ?? "Failed to save properties");
        setShowDrawerError(true);
      }
    } catch {
      setDrawerErrorMessage("Failed to save properties");
      setShowDrawerError(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleActivityLogged = (ticket: SupportTicketRecord) => {
    setSelected(ticket);
    syncFormFromTicket(ticket);
    setShowDrawerSuccess(true);
    void mutate();
  };

  const handleUpdate = async () => {
    if (!selected) return;
    try {
      setIsSubmitting(true);
      const res = await fetch(`/api/tickets/${selected.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(buildPropertiesPayload(true)),
      });
      const result = await res.json();
      if (result.success) {
        const uploadErrors = await uploadPendingAttachments(selected.id);
        if (uploadErrors > 0) {
          setDrawerErrorMessage(`${uploadErrors} file(s) failed to upload`);
          setShowDrawerError(true);
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
        <button
          type="button"
          onClick={() => setShowSchedule(true)}
          className="mb-1 ml-2 shrink-0 flex h-[30px] items-center gap-1.5 rounded-full px-3.5 text-[12.5px] font-semibold text-white shadow-sm transition-all active:scale-95"
          style={{ background: "#065f4a" }}
          onMouseEnter={(e) => (e.currentTarget.style.background = "#008f68")}
          onMouseLeave={(e) => (e.currentTarget.style.background = "#065f4a")}
        >
          <CalendarIcon className="w-3.5 h-3.5" />
          Schedule Call
        </button>
      </div>

      {isFocusMode && focusTicketId ? (
        <DeepLinkFocusBanner
          entityLabel="ticket"
          entityId={focusTicketId}
          onClear={() => ticketFilters.clearTicketFocus()}
        />
      ) : null}

      {/* Filters row */}
      <div className="space-y-2">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 my-3">
          <div className="flex min-w-0 flex-col gap-2 sm:flex-row sm:items-center">
            <div className="relative flex-1 max-w-[320px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-[14px] w-[14px] text-muted-foreground" />
              <Input
                placeholder="Search tickets, customers, or issues..."
                value={ticketFilters.search}
                readOnly={isFocusMode}
                onChange={(e) => {
                  if (!isFocusMode) ticketFilters.setSearch(e.target.value);
                }}
                className="pl-[34px] pr-8 h-[30px] rounded-full text-[12.5px] bg-muted/30 border-border shadow-none focus-visible:ring-[#008f68]/30 focus-visible:border-[#008f68]/40"
              />
              <div className="absolute right-2.5 top-1/2 -translate-y-1/2 border border-border rounded px-1.5 py-[1px] text-[10px] text-muted-foreground font-mono bg-background">
                /
              </div>
            </div>
          </div>

          <div
            className={cn(
              "flex flex-wrap items-center gap-3 sm:justify-end",
              isFocusMode && "pointer-events-none opacity-60",
            )}
          >
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
          <Table className="relative w-full table-fixed text-[12px]">
            <colgroup>
              <col className="w-[5%]" />
              <col className="w-[17%]" />
              <col className="w-[5%]" />
              <col className="w-[8%]" />
              <col className="w-[8%]" />
              <col className="w-[9%]" />
              <col className="w-[11%]" />
              <col className="w-[10%]" />
              <col className="w-[9%]" />
              <col className="w-[11%]" />
              <col className="w-[7%]" />
            </colgroup>
            <TableHeader className="sticky top-0 z-10 border-y border-slate-200 bg-slate-50 dark:bg-muted/40">
              <TableRow className="border-none hover:bg-transparent">
                <TableHead className="px-2 py-1.5 text-[10px] font-bold uppercase tracking-wide text-slate-500">
                  ID
                </TableHead>
                <TableHead className="px-2 py-1.5 text-[10px] font-bold uppercase tracking-wide text-slate-500">
                  Customer
                </TableHead>
                <TableHead className="px-2 py-1.5 text-[10px] font-bold uppercase tracking-wide text-slate-500">
                  Tickets
                </TableHead>
                <TableHead className="px-2 py-1.5 text-[10px] font-bold uppercase tracking-wide text-slate-500">
                  Status
                </TableHead>
                <TableHead className="px-2 py-1.5 text-[10px] font-bold uppercase tracking-wide text-slate-500">
                  Priority
                </TableHead>
                <TableHead className="px-2 py-1.5 text-[10px] font-bold uppercase tracking-wide text-slate-500">
                  Type
                </TableHead>
                <TableHead className="px-2 py-1.5 text-[10px] font-bold uppercase tracking-wide text-slate-500">
                  Agent
                </TableHead>
                <TableHead className="px-2 py-1.5 text-[10px] font-bold uppercase tracking-wide text-slate-500">
                  Yard
                </TableHead>
                <TableHead className="px-2 py-1.5 text-[10px] font-bold uppercase tracking-wide text-slate-500">
                  Campaign
                </TableHead>
                <TableHead className="px-2 py-1.5 text-[10px] font-bold uppercase tracking-wide text-slate-500">
                  Line
                </TableHead>
                <TableHead className="px-2 py-1.5 text-[10px] font-bold uppercase tracking-wide text-slate-500">
                  Created
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableLoadingRow colSpan={11} kind="tickets" compact />
              ) : ticketGroups.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={11}
                    className="h-24 text-center text-slate-400 text-sm"
                  >
                    No tickets found
                  </TableCell>
                </TableRow>
              ) : (
                ticketGroups.map((group, i) => {
                  const t = group.latestTicket;
                  const initials = (
                    group.customerName ||
                    t.customer?.name ||
                    "?"
                  )
                    .substring(0, 2)
                    .toUpperCase();
                  const createdDate = new Date(t.createdAt || "");
                  const createdLabel = isNaN(createdDate.getTime())
                    ? "—"
                    : createdDate.toDateString() === new Date().toDateString()
                      ? format(createdDate, "HH:mm")
                      : format(createdDate, "MMM d");
                  const lineLabel = ticketPhoneLineLabel(t);
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
                        <TableCell className="px-2 py-1 align-top ">
                          <span className="text-[10px] font-bold text-slate-700 tabular-nums">
                            #{t.id}
                          </span>
                        </TableCell>
                        <TableCell className="px-2 py-1 align-middle">
                          <div className="flex min-w-0 items-center gap-1.5">
                            <Avatar className="h-6 w-6 shrink-0 rounded-full">
                              <AvatarFallback
                                className="rounded-full text-[10px] font-bold"
                                style={{
                                  background: "transparent",
                                  border: "1px solid #d1d5db",
                                  color: "#111827",
                                }}
                              >
                                {initials}
                              </AvatarFallback>
                            </Avatar>
                            <div className="min-w-0">
                              <p
                                className="truncate text-[12px] font-bold leading-tight text-foreground"
                                title={customerName(t)}
                              >
                                {customerName(t)}
                              </p>
                              {(group.customerPhone || t.customer?.phone) && (
                                <div className="flex min-w-0 items-center gap-0.5">
                                  <p
                                    className="truncate font-mono text-[10px] text-slate-500 tabular-nums"
                                    title={
                                      group.customerPhone || t.customer?.phone
                                    }
                                  >
                                    {group.customerPhone || t.customer?.phone}
                                  </p>
                                  <button
                                    type="button"
                                    className="shrink-0 w-5 h-5 flex items-center justify-center rounded hover:bg-[#e6f5f0] transition-colors disabled:opacity-40"
                                    style={{ color: "#008f68" }}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      dial(
                                        group.customerPhone ||
                                          t.customer!.phone!,
                                        t.callId ?? t.id,
                                      );
                                    }}
                                    disabled={!canDial}
                                    aria-label="Call customer"
                                  ></button>
                                </div>
                              )}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="px-2 py-1 text-center align-middle">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setExpandedKey((prev) =>
                                prev === group.key ? null : group.key,
                              );
                            }}
                            className={cn(
                              "inline-flex items-center justify-center gap-0.5 rounded-full border px-2 py-0.5 text-[10.5px] font-bold transition-colors",
                              expandedKey === group.key
                                ? "border-[#86efac] bg-[#dcfce7] text-[#15803d]"
                                : "border-slate-200 bg-slate-100 text-slate-600 hover:border-[#86efac] hover:bg-[#dcfce7] hover:text-[#15803d]",
                            )}
                            aria-label="Toggle ticket timeline"
                            title="View ticket timeline"
                          >
                            <TicketIcon className="h-2.5 w-2.5" />
                            <span className="font-mono tabular-nums">
                              {group.tickets.length}
                            </span>
                          </button>
                        </TableCell>
                        <TableCell className="px-2 py-1 align-middle">
                          <TableSupportStatusPill status={t.status} />
                        </TableCell>
                        <TableCell className="px-2 py-1 align-middle">
                          <TablePriorityPill priority={t.priority} />
                        </TableCell>
                        <TableCell
                          className="max-w-0 px-2 py-1 align-middle text-[11px] font-medium text-slate-600"
                          title={
                            t.ticketType ? formatLabel(t.ticketType) : undefined
                          }
                        >
                          <span className="block truncate">
                            {t.ticketType ? formatLabel(t.ticketType) : "—"}
                          </span>
                        </TableCell>
                        <TableCell
                          className="max-w-0 px-2 py-1 align-middle text-[11px] text-slate-600"
                          title={agentName(t)}
                        >
                          <span className="block truncate font-medium">
                            {agentName(t)}
                          </span>
                        </TableCell>
                        <TableCell className="px-2 py-1 align-middle">
                          <TableYardBadge
                            compact
                            name={t.yard?.commonName || t.yard?.name}
                          />
                        </TableCell>
                        <TableCell className="px-2 py-1 align-middle">
                          <TableCampaignBadge
                            compact
                            name={t.campaign?.nombre}
                          />
                        </TableCell>
                        <TableCell
                          className="max-w-0 px-2 py-1 align-middle text-[11px] font-medium text-slate-600"
                          title={lineLabel || undefined}
                        >
                          <span
                            className={cn(
                              "block truncate",
                              !lineLabel && "text-slate-400",
                            )}
                          >
                            {lineLabel || "—"}
                          </span>
                        </TableCell>
                        <TableCell className="whitespace-nowrap px-2 py-1 text-right align-middle font-mono text-[10.5px] tabular-nums text-slate-500">
                          {createdLabel}
                        </TableCell>
                      </TableRow>
                      {expandedKey === group.key && (
                        <TableRow
                          key={`${group.key}-timeline`}
                          className="bg-slate-50/50 hover:bg-slate-50/50"
                        >
                          <TableCell
                            colSpan={11}
                            className="border-t-0 py-1.5 px-0"
                          >
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

      <DataTablePagination
        currentPage={ticketFilters.currentPage}
        totalPages={totalPages}
        totalCount={totalCount}
        onPageChange={ticketFilters.setCurrentPage}
      />

      {/* ── Create Modal ─────────────────────────────────────────────── */}
      <Dialog
        open={showCreate}
        onOpenChange={(o) => {
          setShowCreate(o);
          if (!o) resetForm();
        }}
      >
        <DialogContent className="max-h-[calc(100dvh-2rem)] max-w-[calc(100%-1.5rem)] gap-0 overflow-hidden rounded-2xl border-slate-200 bg-white p-0 shadow-2xl sm:max-w-[760px] dark:border-slate-800 dark:bg-slate-950">
          <DialogHeader className="border-b border-slate-100 px-5 py-4 pr-12 text-left sm:px-6 dark:border-slate-800">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-dashed border-slate-200 bg-slate-50 text-[#008f68] dark:border-slate-700 dark:bg-slate-900">
                <TicketIcon className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <DialogTitle className="text-[15px] font-semibold leading-5 text-slate-950 dark:text-slate-50">
                  New Support Ticket
                </DialogTitle>
                <DialogDescription className="mt-1 text-[13px] leading-5 text-slate-500 dark:text-slate-400">
                  Fill in the details to create a manual support ticket.
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <div className="max-h-[68dvh] overflow-y-auto bg-[#f4f5f7] px-3 py-2 sm:px-3.5 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-slate-200 [&::-webkit-scrollbar-track]:bg-transparent">
            <CreateTicketForm
              form={form}
              setForm={setForm}
              customers={[]}
              yards={refData.yards}
              agents={refData.agents}
              campaigns={refData.campaigns}
              pendingFiles={pendingFiles}
              onFilesChange={setPendingFiles}
              initialSelectedCustomer={createFormCustomer}
            />
          </div>

          <div className="flex flex-col gap-3 border-t border-slate-100 bg-slate-50/80 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6 dark:border-slate-800 dark:bg-slate-900/60">
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowCreate(false)}
              disabled={isSubmitting}
              className="h-11 rounded-lg border-slate-200 bg-white px-5 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200 dark:hover:bg-slate-900"
            >
              Cancel
            </Button>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <Button
                type="button"
                variant="outline"
                onClick={resetForm}
                disabled={isSubmitting}
                className="h-11 rounded-lg border-slate-200 bg-white px-5 text-sm font-semibold text-slate-400 shadow-sm hover:bg-white hover:text-slate-600 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-500 dark:hover:text-slate-300"
              >
                <RotateCcw className="mr-2 h-4 w-4" />
                Reset
              </Button>
              <Button
                type="button"
                onClick={handleCreate}
                disabled={isSubmitting}
                className="h-11 rounded-lg bg-[#008f68] px-6 text-sm font-semibold text-white shadow-sm hover:bg-[#007a5a] disabled:opacity-60 dark:bg-[#008f68] dark:hover:bg-[#007a5a]"
              >
                {isSubmitting && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                {isSubmitting ? "Creating..." : "Create Ticket"}
              </Button>
            </div>
          </div>
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
                        statusColors[
                          normalizeSupportStatusKey(selected.status)
                        ] || ""
                      }
                    >
                      {formatLabel(normalizeSupportStatusKey(selected.status))}
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

      {/* ── Schedule Call Modal ──────────────────────────────────────── */}
      <ScheduleCallSheet
        open={showSchedule}
        onOpenChange={setShowSchedule}
        customers={refData.customers}
        agents={refData.agents}
        onSubmit={handleScheduleCall}
        isSubmitting={isScheduleSubmitting}
      />

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
        onClose={handleCloseDrawer}
        returnToLabel={returnTo.returnBackLabel ?? undefined}
        onBackToTimeline={
          returnTo.safeReturnPath ? handleBackToTimeline : undefined
        }
        group={drawerGroup}
        selectedTicket={selected}
        onSelectTicket={handleSelectTicketInDrawer}
        editFormData={form}
        setEditFormData={setForm}
        pendingFiles={pendingFiles}
        onFilesChange={setPendingFiles}
        isUpdating={isSubmitting}
        onSaveProperties={handleSaveDrawerProperties}
        onActivityLogged={handleActivityLogged}
        onActivityError={(msg) => {
          setDrawerErrorMessage(msg);
          setShowDrawerError(true);
        }}
        currentAgentId={refData.currentAgent?.id ?? null}
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
