"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import { useSearchParams, usePathname, useRouter } from "next/navigation";
import useSWR from "swr";
import dynamic from "next/dynamic";
import { Button } from "@/components/ui/button";
import { CheckCircle2 } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { Ticket } from "@/lib/mock-data";
import {
  CreateTicketFormData,
  TicketStatus,
  TicketPriority,
  CallDirection,
} from "./types";
const CreateTicketModal = dynamic(
  () =>
    import("./components/CreateTicketModal").then((m) => m.CreateTicketModal),
  { ssr: false },
);
const EditTicketModal = dynamic(
  () => import("./components/EditTicketModal").then((m) => m.EditTicketModal),
  { ssr: false },
);
const ViewTicketModal = dynamic(
  () => import("./components/ViewTicketModal").then((m) => m.ViewTicketModal),
  { ssr: false },
);
import { TicketsSidebar } from "./components/TicketsSidebar";
import { TicketsTable } from "./components/TicketsTable";
import { useReferenceData } from "./hooks/useReferenceData";
import { useTicketFilters } from "./hooks/useTicketFilters";
import {
  formatEnumLabel,
  getStatusBadgeColor,
  getPriorityColor,
  getDirectionIcon,
  getDirectionText,
  getCampaign,
  getAttachmentUrl,
  getAttachmentLabel,
  getClientName,
  getClientPhone,
  getYardDisplayName,
  normalizeEnumValue,
  isMissedCall,
} from "./utils/ticket-helpers";
import { startOfDay, endOfDay, isWithinInterval } from "date-fns";

// ---------------------------------------------------------------------------
// SWR fetcher
// ---------------------------------------------------------------------------
const ticketsFetcher = async (url: string) => {
  const response = await fetch(url);
  const result = await response.json();
  if (!result.success) {
    throw new Error(result.message || "Failed to load tickets");
  }
  return result.data;
};

// ---------------------------------------------------------------------------
// Page component
// ---------------------------------------------------------------------------
export default function TicketsPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  // ---- Hooks ----
  const refData = useReferenceData();
  const ticketFilters = useTicketFilters({
    currentAgentId: refData.currentAgent?.id,
  });

  // ---- SWR ----
  const {
    data: ticketsPageData,
    isLoading,
    mutate,
  } = useSWR(ticketFilters.ticketsApiUrl, ticketsFetcher, {
    refreshInterval: 0,
    revalidateOnFocus: false,
    refreshWhenHidden: false,
    dedupingInterval: 30000,
    revalidateOnReconnect: true,
    shouldRetryOnError: false,
  });

  const tickets: Ticket[] = Array.isArray(ticketsPageData)
    ? ticketsPageData
    : ticketsPageData?.data || [];
  const totalMatchingTickets =
    typeof ticketsPageData?.total === "number"
      ? ticketsPageData.total
      : tickets.length;
  const serverViewCounts = ticketsPageData?.viewCounts || null;
  const serverTotalPages = Math.max(
    1,
    Number(ticketsPageData?.totalPages) || 1,
  );

  // ---- View counts ----
  const getFilteredCountForView = useMemo(() => {
    const currentCustomerIdParam = searchParams.get("customerId");

    return (viewType: string): number => {
      if (
        serverViewCounts &&
        typeof serverViewCounts === "object" &&
        typeof (serverViewCounts as any)[viewType] === "number"
      ) {
        return (serverViewCounts as any)[viewType];
      }

      if (viewType === ticketFilters.activeView) {
        return totalMatchingTickets;
      }

      return tickets.filter((ticket: Ticket) => {
        if (currentCustomerIdParam) {
          if (
            !ticket.customerId ||
            ticket.customerId.toString() !== currentCustomerIdParam
          )
            return false;
        }

        const yardName =
          typeof ticket.yard === "string"
            ? ticket.yard
            : (ticket.yard as any)?.name || "";
        const clientName =
          ticket.clientName || (ticket.customer as any)?.name || "";
        const phone =
          ticket.phone ||
          (ticket.customer as any)?.phone ||
          ticket.customerPhone ||
          "";
        const status = normalizeEnumValue(ticket.status as any);
        const priority = (ticket.priority as any)?.toString().toUpperCase();
        const isAssignedToMe = refData.isTicketAssignedToCurrentUser(ticket);

        const searchLower = ticketFilters.search
          ? ticketFilters.search.toLowerCase().trim()
          : "";
        const searchTrimmed = ticketFilters.search
          ? ticketFilters.search.trim()
          : "";
        const phoneDigitsOnly = phone.replace(/[^0-9]/g, "");
        const searchDigitsOnly = searchTrimmed.replace(/[^0-9]/g, "");

        const matchesSearch = searchLower
          ? clientName.toLowerCase().includes(searchLower) ||
            yardName.toLowerCase().includes(searchLower) ||
            ticket.id.toString().includes(searchTrimmed) ||
            phone.toLowerCase().includes(searchLower) ||
            (phoneDigitsOnly &&
              searchDigitsOnly &&
              phoneDigitsOnly.includes(searchDigitsOnly))
          : true;

        const { filters } = ticketFilters;
        const matchesStatus =
          filters.status === "all" ||
          status === normalizeEnumValue(filters.status);
        const matchesPriority =
          filters.priority === "all" ||
          ticket.priority === filters.priority ||
          priority === filters.priority.toUpperCase();
        const dirFilterValue = filters.direction.toLowerCase();
        const ticketDirection = ticket.direction
          ? ticket.direction.toString().toLowerCase()
          : "";
        const matchesDirection =
          filters.direction === "all" ||
          ticket.direction === filters.direction ||
          ticketDirection === dirFilterValue;

        const ticketCampaignId =
          ticket.campaignId ??
          (ticket.campaign && typeof ticket.campaign === "object"
            ? (ticket.campaign as any).id
            : null);
        const matchesCampaign =
          filters.campaign === "all" ||
          (ticketCampaignId &&
            ticketCampaignId.toString() === filters.campaign);

        const ticketYardId =
          ticket.yardId ??
          (ticket.yard && typeof ticket.yard === "object"
            ? (ticket.yard as any).id
            : null);
        const matchesYard =
          filters.yard === "all" ||
          (ticketYardId && ticketYardId.toString() === filters.yard);

        const ticketAgentId =
          ticket.agentId ??
          (ticket.assignedTo && typeof ticket.assignedTo === "object"
            ? (ticket.assignedTo as any).id
            : null);
        const matchesAgent =
          filters.agent === "all" ||
          (ticketAgentId && ticketAgentId.toString() === filters.agent);

        const matchesDisposition =
          filters.disposition === "all" ||
          ticket.disposition === filters.disposition;

        let matchesDate = true;
        if (ticketFilters.dateRange?.from) {
          const ticketDate = new Date(ticket.createdAt);
          const from = startOfDay(ticketFilters.dateRange.from);
          const to = ticketFilters.dateRange.to
            ? endOfDay(ticketFilters.dateRange.to)
            : endOfDay(ticketFilters.dateRange.from);
          matchesDate = isWithinInterval(ticketDate, { start: from, end: to });
        }

        const isMissed = isMissedCall(ticket);

        let matchesView = true;
        if (viewType === "missed") matchesView = isMissed;
        else if (viewType === "assigned_me")
          matchesView = isAssignedToMe && !isMissed;
        else if (viewType === "unassigned")
          matchesView = !ticket.assignedTo && !isMissed;
        else if (viewType === "assigned")
          matchesView = !!ticket.assignedTo && !isMissed;
        else if (viewType === "high_priority")
          matchesView = Boolean(
            !isMissed &&
            status !== "CLOSED" &&
            status !== "RESOLVED" &&
            (priority === "HIGH" || priority === "EMERGENCY"),
          );
        else if (viewType === "all") matchesView = !isMissed;

        return (
          matchesSearch &&
          matchesStatus &&
          matchesPriority &&
          matchesDirection &&
          matchesDisposition &&
          matchesCampaign &&
          matchesYard &&
          matchesAgent &&
          matchesDate &&
          matchesView
        );
      }).length;
    };
  }, [
    tickets,
    ticketFilters.search,
    ticketFilters.filters,
    ticketFilters.dateRange,
    ticketFilters.activeView,
    searchParams,
    serverViewCounts,
    totalMatchingTickets,
    refData.isTicketAssignedToCurrentUser,
  ]);

  const hasHighPriorityOpen = useMemo(
    () =>
      tickets.some((t: Ticket) => {
        if (isMissedCall(t)) return false;
        const priority = (t.priority || "").toString().toUpperCase();
        const status = (t.status || "")
          .toString()
          .toUpperCase()
          .replace(/\s+/g, "_");
        return (
          (priority === "HIGH" || priority === "EMERGENCY") &&
          (status === "OPEN" || status === "IN_PROGRESS")
        );
      }),
    [tickets],
  );

  // ---- Page bounds ----
  useEffect(() => {
    if (
      typeof ticketsPageData?.totalPages === "number" &&
      ticketFilters.currentPage > serverTotalPages
    ) {
      ticketFilters.setCurrentPage(serverTotalPages);
    }
  }, [ticketFilters.currentPage, serverTotalPages]);

  // ---- Modal state ----
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [attachmentFiles, setAttachmentFiles] = useState<File[]>([]);
  const [createAttachmentFiles, setCreateAttachmentFiles] = useState<File[]>(
    [],
  );
  const [createValidationErrors, setCreateValidationErrors] = useState<
    Record<string, string>
  >({});
  const [newAttachment, setNewAttachment] = useState("");

  // Search states for modals
  const [customerSearchCreate, setCustomerSearchCreate] = useState("");
  const [yardSearchCreate, setYardSearchCreate] = useState("");
  const [agentSearchCreate, setAgentSearchCreate] = useState("");
  const [campaignSearchCreate, setCampaignSearchCreate] = useState("");
  const [campaignSearchEdit, setCampaignSearchEdit] = useState("");
  const [agentSearchEdit, setAgentSearchEdit] = useState("");
  const [customerSearchEdit, setCustomerSearchEdit] = useState("");
  const [yardSearchEdit, setYardSearchEdit] = useState("");

  const [createFormData, setCreateFormData] = useState<CreateTicketFormData>({
    customerId: "",
    customerPhone: "",
    yardId: "",
    campaignId: "",
    campaignOption: "",
    agentId: "",
    status: TicketStatus.IN_PROGRESS,
    priority: TicketPriority.LOW,
    direction: CallDirection.INBOUND,
    callDate: "",
    disposition: "",
    issueDetail: "",
    attachments: [],
  });

  const [editFormData, setEditFormData] = useState<CreateTicketFormData>({
    customerId: "",
    customerPhone: "",
    yardId: "",
    campaignId: "",
    campaignOption: "",
    agentId: "",
    status: TicketStatus.IN_PROGRESS,
    priority: TicketPriority.LOW,
    direction: CallDirection.INBOUND,
    callDate: "",
    disposition: "",
    issueDetail: "",
    attachments: [],
  });

  // ---- Ticket notification ----
  const previousTicketCountRef = useRef(0);
  const previousTicketQueryKeyRef = useRef<string | null>(null);

  useEffect(() => {
    if (previousTicketQueryKeyRef.current !== ticketFilters.ticketsApiUrl) {
      previousTicketQueryKeyRef.current = ticketFilters.ticketsApiUrl;
      if (totalMatchingTickets > 0)
        previousTicketCountRef.current = totalMatchingTickets;
      return;
    }
    if (totalMatchingTickets > 0) {
      if (
        previousTicketCountRef.current > 0 &&
        totalMatchingTickets > previousTicketCountRef.current
      ) {
        const newCount = totalMatchingTickets - previousTicketCountRef.current;
        toast({
          title: "New Ticket" + (newCount > 1 ? "s" : ""),
          description: `${newCount} new ticket${newCount > 1 ? "s" : ""} created`,
          duration: 3000,
        });
      }
      previousTicketCountRef.current = totalMatchingTickets;
    }
  }, [ticketFilters.ticketsApiUrl, totalMatchingTickets]);

  // ---- Close modals on route change ----
  useEffect(() => {
    setShowCreateModal(false);
    setShowEditModal(false);
    setShowViewModal(false);
  }, [pathname]);

  // ---- Handle fromReport parameter ----
  useEffect(() => {
    const fromReport = searchParams.get("fromReport");
    const reportStartDate = searchParams.get("reportStartDate");
    const reportEndDate = searchParams.get("reportEndDate");

    const parseReportDate = (value?: string | null) => {
      if (!value) return null;
      const parsed = value.includes("T")
        ? new Date(value)
        : new Date(`${value}T12:00:00`);
      return Number.isNaN(parsed.getTime()) ? null : parsed;
    };

    if (reportStartDate && reportEndDate) {
      const from = parseReportDate(reportStartDate);
      const to = parseReportDate(reportEndDate);
      if (from && to) ticketFilters.setDateRange({ from, to });
    }

    if (fromReport === "campaign") {
      const campaignId = searchParams.get("campaignId");
      if (campaignId) ticketFilters.setFilter("campaign", campaignId);

      let reportUrl = "/reports/campaigns";
      if (campaignId && reportStartDate && reportEndDate) {
        reportUrl += `?campaignId=${campaignId}&startDate=${encodeURIComponent(reportStartDate)}&endDate=${encodeURIComponent(reportEndDate)}`;
      }

      const { dismiss } = toast({
        title: "Viewing filtered tickets",
        description: (
          <div className="flex flex-col gap-2">
            <p>You are viewing tickets filtered from the campaign report.</p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                dismiss();
                router.push(reportUrl);
              }}
              className="w-fit"
            >
              Back to Report
            </Button>
          </div>
        ),
        duration: Infinity,
      });
      return;
    }

    if (fromReport === "newLead") {
      const yardId = searchParams.get("yardId");
      const reportYardName = searchParams.get("reportYardName");
      const reportLeadName = searchParams.get("reportLeadName");
      if (yardId) ticketFilters.setFilter("yard", yardId);

      const params = new URLSearchParams();
      if (yardId) params.set("yardId", yardId);
      if (reportStartDate) params.set("startDate", reportStartDate);
      if (reportEndDate) params.set("endDate", reportEndDate);
      const reportUrl = params.toString()
        ? `/reports/yards?${params.toString()}`
        : "/reports/yards";

      const contextLabel = reportYardName
        ? `${reportYardName}${reportLeadName ? ` - ${reportLeadName}` : ""}`
        : reportLeadName || "the yard report";

      const { dismiss } = toast({
        title: "Viewing filtered tickets",
        description: (
          <div className="flex flex-col gap-2">
            <p>
              You are viewing tickets filtered from New Lead Customers in{" "}
              {contextLabel}.
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                dismiss();
                router.push(reportUrl);
              }}
              className="w-fit"
            >
              Back to Report
            </Button>
          </div>
        ),
        duration: Infinity,
      });
      return;
    }

    if (fromReport === "highPriorityPending") {
      const yardId = searchParams.get("yardId");
      const status = searchParams.get("status");
      const view = searchParams.get("view");
      const reportYardName = searchParams.get("reportYardName");
      const reportTicketId = searchParams.get("reportTicketId");
      const reportSection = searchParams.get("reportSection");

      if (yardId) ticketFilters.setFilter("yard", yardId);
      if (status) ticketFilters.setFilter("status", status);
      if (view) ticketFilters.setActiveView(view);

      const params = new URLSearchParams();
      if (yardId) params.set("yardId", yardId);
      if (reportStartDate) params.set("startDate", reportStartDate);
      if (reportEndDate) params.set("endDate", reportEndDate);
      const reportUrl = params.toString()
        ? `/reports/yards?${params.toString()}`
        : "/reports/yards";

      const sectionLabel =
        reportSection === "closed" ? "Closed / Resolved" : "Pending";
      const contextLabel = reportYardName || "the yard report";

      const { dismiss } = toast({
        title: "Viewing filtered tickets",
        description: (
          <div className="flex flex-col gap-2">
            <p>
              You are viewing ticket
              {reportTicketId ? ` #${reportTicketId}` : ""} from High Priority{" "}
              {sectionLabel} in {contextLabel}.
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                dismiss();
                router.push(reportUrl);
              }}
              className="w-fit"
            >
              Back to Report
            </Button>
          </div>
        ),
        duration: Infinity,
      });
    }
  }, [searchParams, router]);

  // ---- Handle URL ticket/customer params ----
  const processedTicketIdRef = useRef<string | null>(null);
  const ticketIdParam = searchParams.get("id");
  const customerIdParam = searchParams.get("customerId");

  useEffect(() => {
    if (!tickets.length && !ticketIdParam) return;

    if (ticketIdParam) {
      if (processedTicketIdRef.current === ticketIdParam) return;

      const ticket = tickets.find(
        (t: Ticket) => t.id.toString() === ticketIdParam,
      );
      if (ticket) {
        processedTicketIdRef.current = ticketIdParam;
        openTicketModal(ticket);
      } else {
        fetch(`/api/tickets/${ticketIdParam}`)
          .then(async (response) => {
            if (!response.ok) throw new Error("Not found");
            return response.json();
          })
          .then((ticketData) => {
            const resolvedTicket = ticketData?.data ?? ticketData;
            if (!resolvedTicket) return;
            processedTicketIdRef.current = ticketIdParam;
            openTicketModal(resolvedTicket);
          })
          .catch(() => {});
      }
    } else {
      processedTicketIdRef.current = null;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ticketIdParam, customerIdParam, tickets.length]);

  // ---- Handlers ----
  const openTicketModal = (ticket: Ticket) => {
    setSelectedTicket(ticket);
    const ticketStatus = ticket.status
      ?.toString()
      .toUpperCase()
      .replace(/\s+/g, "_");
    const isClosed = ticketStatus === "CLOSED" || ticketStatus === "RESOLVED";
    if (ticket.yardId || isClosed) {
      setShowViewModal(true);
    } else {
      setShowEditModal(true);
    }
  };

  const handleViewDetails = async (ticket: Ticket) => {
    try {
      const response = await fetch(`/api/tickets/${ticket.id}`);
      if (response.ok) {
        const result = await response.json();
        if (result.success && result.data) {
          ticket = { ...ticket, ...result.data };
        }
      }
    } catch {
      // Continue with the ticket from the list
    }

    setSelectedTicket(ticket);
    setAttachmentFiles([]);

    const ticketAgentId =
      (ticket as any).agentId?.toString() ||
      (ticket.assignedTo &&
      typeof ticket.assignedTo === "object" &&
      "id" in ticket.assignedTo
        ? ((ticket.assignedTo as { id?: number }).id || "").toString()
        : "");

    const ticketCustomerId = ticket.customerId
      ? ticket.customerId.toString()
      : ticket.customer &&
          typeof ticket.customer === "object" &&
          "id" in ticket.customer
        ? (ticket.customer as { id: string | number }).id.toString()
        : "";

    const ticketCustomerPhone =
      ticket.customerPhone ||
      (ticket.customer &&
      typeof ticket.customer === "object" &&
      "phone" in ticket.customer
        ? (ticket.customer as { phone?: string }).phone || ""
        : "");

    const ticketCampaignId = ticket.campaignId
      ? ticket.campaignId.toString()
      : ticket.campaign &&
          typeof ticket.campaign === "object" &&
          "id" in ticket.campaign
        ? (ticket.campaign as { id: string | number }).id.toString()
        : "";

    setEditFormData({
      customerId: ticketCustomerId,
      customerPhone: ticketCustomerPhone,
      yardId: ticket.yardId ? ticket.yardId.toString() : "",
      campaignId: ticketCampaignId,
      campaignOption:
        (ticket as any).campaignOption ||
        (ticket as any).onboardingOption ||
        "",
      agentId: ticketAgentId,
      status: (ticket.status?.toString().toUpperCase().replace(" ", "_") ||
        TicketStatus.IN_PROGRESS) as TicketStatus,
      priority: (ticket.priority?.toString().toUpperCase() ||
        TicketPriority.LOW) as TicketPriority,
      direction: (ticket.direction || CallDirection.INBOUND) as CallDirection,
      callDate:
        ticket.callDate || ticket.createdAt
          ? (() => {
              const date = new Date(ticket.callDate || ticket.createdAt);
              const year = date.getFullYear();
              const month = String(date.getMonth() + 1).padStart(2, "0");
              const day = String(date.getDate()).padStart(2, "0");
              const hours = String(date.getHours()).padStart(2, "0");
              const minutes = String(date.getMinutes()).padStart(2, "0");
              return `${year}-${month}-${day}T${hours}:${minutes}`;
            })()
          : "",
      disposition: ticket.disposition || "",
      issueDetail: ticket.issueDetail || "",
      attachments: ticket.attachments || [],
    });

    setCampaignSearchEdit("");
    setAgentSearchEdit("");
    setCustomerSearchEdit("");
    setYardSearchEdit("");

    openTicketModal(ticket);
  };

  const handleUpdateTicketFromModal = async () => {
    if (!selectedTicket) return;
    try {
      setIsUpdating(true);

      const updatePayload: any = {
        customerId: editFormData.customerId
          ? Number(editFormData.customerId)
          : undefined,
        yardId: editFormData.yardId ? parseInt(editFormData.yardId) : null,
        campaignId:
          editFormData.campaignId && editFormData.campaignId !== "none"
            ? Number(editFormData.campaignId)
            : null,
        campaignOption: editFormData.campaignOption || null,
        agentId:
          editFormData.agentId && editFormData.agentId !== "none"
            ? Number(editFormData.agentId)
            : undefined,
        status: editFormData.status?.toUpperCase().replace(" ", "_"),
        priority: editFormData.priority?.toUpperCase(),
        direction: editFormData.direction?.toUpperCase(),
        disposition: editFormData.disposition || null,
        issueDetail: editFormData.issueDetail || null,
        callDate: editFormData.callDate || null,
      };

      const response = await fetch(`/api/tickets/${selectedTicket.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatePayload),
      });
      const result = await response.json();

      if (result.success) {
        let updatedTicket = { ...selectedTicket, ...result.data };

        if (attachmentFiles.length > 0) {
          const formData = new FormData();
          attachmentFiles.forEach((file) => formData.append("files", file));
          const uploadResponse = await fetch(
            `/api/tickets/${updatedTicket.id}/attachments`,
            { method: "POST", body: formData },
          );
          const uploadResult = await uploadResponse.json();
          if (uploadResult?.success) {
            updatedTicket = { ...updatedTicket, ...uploadResult.data };
          }
        }

        mutate(
          (currentTickets: any) =>
            currentTickets
              ? {
                  ...currentTickets,
                  data: (currentTickets.data || []).map((t: Ticket) =>
                    t.id === updatedTicket.id ? updatedTicket : t,
                  ),
                }
              : currentTickets,
          false,
        );

        setSelectedTicket(updatedTicket);
        setAttachmentFiles([]);

        toast({
          title: "Success",
          description: (
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-green-500" />
              <span>Ticket updated successfully</span>
            </div>
          ),
        });
        setShowEditModal(false);
      } else {
        toast({
          title: "Error",
          description: result.message || "Failed to update ticket",
          variant: "destructive",
        });
      }
    } catch (err) {
      console.error("Update error:", err);
      toast({
        title: "Error",
        description: "An error occurred while updating the ticket",
        variant: "destructive",
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const resetCreateForm = () => {
    setCreateFormData({
      customerId: "",
      customerPhone: "",
      yardId: "",
      campaignId: "",
      campaignOption: "",
      agentId: "",
      status: TicketStatus.IN_PROGRESS,
      priority: TicketPriority.LOW,
      direction: CallDirection.INBOUND,
      callDate: "",
      disposition: "",
      issueDetail: "",
      attachments: [],
    });
    setNewAttachment("");
    setCreateAttachmentFiles([]);
    setCustomerSearchCreate("");
    setYardSearchCreate("");
    setAgentSearchCreate("");
    setCreateValidationErrors({});
  };

  const handleCreateTicket = async () => {
    const errors: Record<string, string> = {};
    if (!createFormData.customerId) errors.customerId = "Customer is required";
    if (!createFormData.direction) errors.direction = "Direction is required";

    if (Object.keys(errors).length > 0) {
      setCreateValidationErrors(errors);
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsCreating(true);
      const payload = {
        customerId: Number(createFormData.customerId),
        direction: createFormData.direction,
        yardId: createFormData.yardId
          ? Number(createFormData.yardId)
          : undefined,
        customerPhone: createFormData.customerPhone || undefined,
        campaignId: createFormData.campaignId
          ? Number(createFormData.campaignId)
          : undefined,
        campaignOption: createFormData.campaignOption || undefined,
        agentId: createFormData.agentId
          ? Number(createFormData.agentId)
          : undefined,
        status: createFormData.status || undefined,
        priority: createFormData.priority || undefined,
        disposition: createFormData.disposition || undefined,
        issueDetail: createFormData.issueDetail?.trim() || undefined,
        attachments: createFormData.attachments.length
          ? createFormData.attachments
          : undefined,
      };

      const response = await fetch("/api/tickets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const result = await response.json();
      if (result.success) {
        let createdTicket = result.data;
        if (createAttachmentFiles.length > 0 && createdTicket?.id) {
          try {
            const formData = new FormData();
            createAttachmentFiles.forEach((file) =>
              formData.append("files", file),
            );
            const uploadResponse = await fetch(
              `/api/tickets/${createdTicket.id}/attachments`,
              { method: "POST", body: formData },
            );
            const uploadResult = await uploadResponse.json();
            if (uploadResult?.success) {
              createdTicket = uploadResult.data;
            } else {
              toast({
                title: "Warning",
                description:
                  uploadResult?.message ||
                  "Ticket created, but attachments failed to upload",
                variant: "destructive",
              });
            }
          } catch {
            toast({
              title: "Warning",
              description: "Ticket created, but attachments failed to upload",
              variant: "destructive",
            });
          }
        }
        toast({
          title: "Success",
          description: (
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-green-500" />
              <span>Ticket created successfully</span>
            </div>
          ),
        });
        setShowCreateModal(false);
        resetCreateForm();
        await mutate();
      } else {
        toast({
          title: "Error",
          description: result.message || "Failed to create ticket",
          variant: "destructive",
        });
      }
    } catch (err) {
      console.error("Create ticket error:", err);
      toast({
        title: "Error",
        description: "An error occurred while creating the ticket",
        variant: "destructive",
      });
    } finally {
      setIsCreating(false);
    }
  };

  // ---- Computed ----
  const savedAttachments = selectedTicket?.attachments || [];

  // ---- Render ----
  return (
    <div className="h-screen flex flex-col lg:flex-row gap-6 p-4">
      <TicketsSidebar
        activeView={ticketFilters.activeView}
        onViewChange={ticketFilters.handleViewChange}
        isLoading={isLoading}
        getViewCount={getFilteredCountForView}
        hasHighPriorityOpen={hasHighPriorityOpen}
        filters={ticketFilters.filters}
        onFilterChange={ticketFilters.setFilter}
        agents={refData.agents}
        campaigns={refData.campaigns}
        yards={refData.yards}
        phoneLines={refData.phoneLines}
        onCreateTicket={() => setShowCreateModal(true)}
      />

      <TicketsTable
        tickets={tickets}
        isLoading={isLoading}
        search={ticketFilters.search}
        onSearchChange={ticketFilters.setSearch}
        dateRange={ticketFilters.dateRange}
        onDateRangeChange={ticketFilters.setDateRange}
        currentPage={ticketFilters.currentPage}
        totalPages={serverTotalPages}
        totalCount={totalMatchingTickets}
        itemsPerPage={ticketFilters.itemsPerPage}
        onPageChange={ticketFilters.setCurrentPage}
        onItemsPerPageChange={ticketFilters.setItemsPerPage}
        yards={refData.yards}
        campaigns={refData.campaigns}
        onViewDetails={handleViewDetails}
      />

      <CreateTicketModal
        open={showCreateModal}
        onOpenChange={(open) => {
          setShowCreateModal(open);
          if (!open) resetCreateForm();
        }}
        customers={refData.customers}
        yards={refData.yards}
        agents={refData.agents}
        campaigns={refData.campaigns}
        createFormData={createFormData}
        setCreateFormData={setCreateFormData}
        createValidationErrors={createValidationErrors}
        setCreateValidationErrors={setCreateValidationErrors}
        customerSearchCreate={customerSearchCreate}
        setCustomerSearchCreate={setCustomerSearchCreate}
        yardSearchCreate={yardSearchCreate}
        setYardSearchCreate={setYardSearchCreate}
        agentSearchCreate={agentSearchCreate}
        setAgentSearchCreate={setAgentSearchCreate}
        campaignSearchCreate={campaignSearchCreate}
        setCampaignSearchCreate={setCampaignSearchCreate}
        newAttachment={newAttachment}
        setNewAttachment={setNewAttachment}
        attachmentFiles={createAttachmentFiles}
        setAttachmentFiles={setCreateAttachmentFiles}
        isCreating={isCreating}
        onSubmit={handleCreateTicket}
      />

      <ViewTicketModal
        open={showViewModal}
        onOpenChange={setShowViewModal}
        ticket={selectedTicket}
        savedAttachments={savedAttachments}
        onEdit={() => {
          setShowViewModal(false);
          setShowEditModal(true);
        }}
        formatEnumLabel={formatEnumLabel}
        getStatusBadgeColor={getStatusBadgeColor}
        getPriorityColor={getPriorityColor}
        getDirectionIcon={getDirectionIcon}
        getDirectionText={getDirectionText}
        getCampaign={(t: Ticket) => getCampaign(t, refData.campaigns)}
        getAttachmentUrl={(v: string) => getAttachmentUrl(v, refData.apiBase)}
        getAttachmentLabel={getAttachmentLabel}
        getClientName={getClientName}
        getClientPhone={getClientPhone}
        getYardDisplayName={(t: Ticket) => getYardDisplayName(t, refData.yards)}
      />

      <EditTicketModal
        open={showEditModal}
        onOpenChange={setShowEditModal}
        ticket={selectedTicket}
        customers={refData.customers}
        yards={refData.yards}
        agents={refData.agents}
        campaigns={refData.campaigns}
        editFormData={editFormData}
        setEditFormData={setEditFormData}
        customerSearchEdit={customerSearchEdit}
        setCustomerSearchEdit={setCustomerSearchEdit}
        yardSearchEdit={yardSearchEdit}
        setYardSearchEdit={setYardSearchEdit}
        agentSearchEdit={agentSearchEdit}
        setAgentSearchEdit={setAgentSearchEdit}
        campaignSearchEdit={campaignSearchEdit}
        setCampaignSearchEdit={setCampaignSearchEdit}
        attachmentFiles={attachmentFiles}
        setAttachmentFiles={setAttachmentFiles}
        savedAttachments={savedAttachments}
        isUpdating={isUpdating}
        onSubmit={handleUpdateTicketFromModal}
        getAttachmentLabel={getAttachmentLabel}
        getAttachmentUrl={(v: string) => getAttachmentUrl(v, refData.apiBase)}
      />
    </div>
  );
}
