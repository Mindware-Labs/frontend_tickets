"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import { useSearchParams, usePathname, useRouter } from "next/navigation";
import useSWR from "swr";
import dynamic from "next/dynamic";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { CheckCircle2, Plus } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { Call } from "@/lib/mock-data";
import { CreateCallFormData, CallStatus, CallDirection } from "./types";
const CreateCallModal = dynamic(
  () =>
    import("./components/calls/CreateCallModal").then((m) => m.CreateCallModal),
  { ssr: false },
);
const ViewCallModal = dynamic(
  () => import("./components/calls/ViewCallModal").then((m) => m.ViewCallModal),
  { ssr: false },
);
import { GroupedCallsTable } from "./components/calls/GroupedCallsTable";
import type { CustomerCallGroup } from "./components/calls/CustomerTimelineDrawer";
const CustomerTimelineDrawer = dynamic(
  () =>
    import("./components/calls/CustomerTimelineDrawer").then(
      (m) => m.CustomerTimelineDrawer,
    ),
  { ssr: false },
);
import { useReferenceData } from "./hooks/useReferenceData";
import { useCallFilters } from "./hooks/useCallFilters";
import { OverdueCallsBanner } from "./components/calls/OverdueCallsBanner";
const TicketsTab = dynamic(
  () => import("./components/tickets/TicketsTab").then((m) => m.TicketsTab),
  { ssr: false },
);
const ManualRecordsTab = dynamic(
  () =>
    import("./components/manual-records/ManualRecordsTab").then(
      (m) => m.ManualRecordsTab,
    ),
  { ssr: false },
);
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
} from "./utils/call-helpers";
import { startOfDay, endOfDay, isWithinInterval } from "date-fns";
import { useAircall } from "@/components/providers/AircallProvider";

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
// Helpers
// ---------------------------------------------------------------------------
const normalizeCallStatusForApi = (status?: string | null): string => {
  const normalized = (status || "")
    .toString()
    .toUpperCase()
    .replace(/\s+/g, "_");
  if (normalized === "ACTIVE" || normalized === "COMPLETED") return normalized;
  if (normalized === "PENDING_FOLLOWUP" || normalized === "OVERDUE")
    return normalized;
  if (normalized === "CLOSED" || normalized === "RESOLVED") return "COMPLETED";
  if (normalized === "OPEN" || normalized === "IN_PROGRESS") return "ACTIVE";
  return "ACTIVE";
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
  const ticketFilters = useCallFilters({
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

  const tickets: Call[] = Array.isArray(ticketsPageData)
    ? ticketsPageData
    : ticketsPageData?.data || [];
  const totalMatchingTickets =
    typeof ticketsPageData?.total === "number"
      ? ticketsPageData.total
      : tickets.length;
  const serverViewCounts = ticketsPageData?.viewCounts || null;

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

      return tickets.filter((ticket: Call) => {
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
            : null) ??
          ((ticket as any).agent && typeof (ticket as any).agent === "object"
            ? (ticket as any).agent.id
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
        const hasAssignee =
          !!ticket.assignedTo ||
          !!(ticket as any).agent ||
          ticket.agentId != null;
        if (viewType === "missed") matchesView = isMissed;
        else if (viewType === "assigned_me")
          matchesView = isAssignedToMe && !isMissed;
        else if (viewType === "unassigned")
          matchesView = !hasAssignee && !isMissed;
        else if (viewType === "assigned")
          matchesView = hasAssignee && !isMissed;
        else if (viewType === "all") matchesView = true;

        return (
          matchesSearch &&
          matchesStatus &&
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

  // ---- Tab state ----
  const tabParam = searchParams.get("tab");
  const [activeTab, setActiveTab] = useState(
    tabParam && ["calls", "tickets", "manual-records"].includes(tabParam)
      ? tabParam
      : "calls"
  );
  const [ticketCreateData, setTicketCreateData] = useState<Record<
    string,
    string
  > | null>(null);

  // ---- Modal state ----
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showTimelineDrawer, setShowTimelineDrawer] = useState(false);
  const [drawerSuccessToast, setDrawerSuccessToast] = useState(false);
  const [drawerErrorToast, setDrawerErrorToast] = useState(false);
  const [drawerErrorMessage, setDrawerErrorMessage] = useState<string>();

  // Move the floating Aircall FAB to the bottom edge when the drawer is open
  const { setSheetOpen } = useAircall();
  useEffect(() => {
    setSheetOpen(showTimelineDrawer);
  }, [showTimelineDrawer, setSheetOpen]);
  const [timelineGroup, setTimelineGroup] = useState<CustomerCallGroup | null>(
    null,
  );
  const [selectedTicket, setSelectedTicket] = useState<Call | null>(null);
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

  const [createFormData, setCreateFormData] = useState<CreateCallFormData>({
    customerId: "",
    customerPhone: "",
    yardId: "",
    campaignId: "",
    campaignOption: "",
    agentId: "",
    status: CallStatus.ACTIVE,
    direction: CallDirection.INBOUND,
    originalDirection: "",
    aircallId: "",
    phoneLineId: "",
    duration: "",
    startedAt: "",
    answeredAt: "",
    endedAt: "",
    recordingUrl: "",
    voicemailUrl: "",
    missedCallReason: "",
    notes: "",
    followUpDueDate: "",
    followUpAssignedToId: "",
    disposition: "",
  });

  const [editFormData, setEditFormData] = useState<CreateCallFormData>({
    customerId: "",
    customerPhone: "",
    yardId: "",
    campaignId: "",
    campaignOption: "",
    agentId: "",
    status: CallStatus.ACTIVE,
    direction: CallDirection.INBOUND,
    originalDirection: "",
    aircallId: "",
    phoneLineId: "",
    duration: "",
    startedAt: "",
    answeredAt: "",
    endedAt: "",
    recordingUrl: "",
    voicemailUrl: "",
    missedCallReason: "",
    notes: "",
    followUpDueDate: "",
    followUpAssignedToId: "",
    disposition: "",
    relatedCallId: "",
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
    setShowViewModal(false);
    setShowTimelineDrawer(false);
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
  const returnToParam = searchParams.get("returnTo");

  const safeReturnPath = useMemo(() => {
    if (!returnToParam) return null;
    try {
      const decoded = decodeURIComponent(returnToParam);
      if (decoded.startsWith("/customers") || decoded.startsWith("/calls")) {
        return decoded;
      }
    } catch {
      return null;
    }
    return null;
  }, [returnToParam]);

  const returnBackLabel = useMemo(() => {
    if (!safeReturnPath) return null;
    try {
      const url = new URL(safeReturnPath, "http://localhost");
      if (url.searchParams.get("timeline") === "1") {
        const customerId = url.searchParams.get("customerId");
        const match = refData.customers.find(
          (c) => String(c.id) === customerId,
        );
        if (match?.name?.trim()) {
          return `Back to ${match.name.trim()} timeline`;
        }
        return "Back to customer timeline";
      }
      return "Back to customers";
    } catch {
      return "Back to previous page";
    }
  }, [safeReturnPath, refData.customers]);

  const handleBackToReturn = () => {
    if (!safeReturnPath) return;
    setShowTimelineDrawer(false);
    processedTicketIdRef.current = null;
    router.push(safeReturnPath);
  };

  useEffect(() => {
    const tab = searchParams.get("tab");
    if (tab && ["calls", "tickets", "manual-records"].includes(tab)) {
      setActiveTab(tab);
    }
    if (ticketIdParam) {
      setActiveTab("calls");
    }
  }, [searchParams, ticketIdParam]);

  useEffect(() => {
    if (!ticketIdParam) {
      processedTicketIdRef.current = null;
      return;
    }

    if (processedTicketIdRef.current === ticketIdParam) return;

    let cancelled = false;

    const openFromUrl = async () => {
      const fromList = tickets.find(
        (t: Call) => t.id.toString() === ticketIdParam,
      );
      if (fromList) {
        if (cancelled) return;
        processedTicketIdRef.current = ticketIdParam;
        openTicketModal(fromList);
        return;
      }

      try {
        const response = await fetch(`/api/calls/${ticketIdParam}`);
        if (!response.ok || cancelled) return;
        const ticketData = await response.json();
        const resolvedTicket = ticketData?.data ?? ticketData;
        if (!resolvedTicket || cancelled) return;
        processedTicketIdRef.current = ticketIdParam;
        openTicketModal(resolvedTicket);
      } catch {
        // ignore — call may not exist or user lacks access
      }
    };

    void openFromUrl();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ticketIdParam, tickets]);

  // ---- Helpers ----
  /** Build a minimal CustomerCallGroup from a single Call so the timeline drawer can open */
  const buildGroupFromCall = (ticket: Call): CustomerCallGroup => {
    const customerName =
      getClientName(ticket) ||
      (ticket.customer &&
      typeof ticket.customer === "object" &&
      "name" in ticket.customer
        ? (ticket.customer as { name?: string }).name || "Unknown"
        : "Unknown");
    const customerPhone =
      getClientPhone(ticket) ||
      (ticket.customer &&
      typeof ticket.customer === "object" &&
      "phone" in ticket.customer
        ? (ticket.customer as { phone?: string }).phone || ""
        : "");
    const customerId = ticket.customerId
      ? Number(ticket.customerId)
      : ticket.customer &&
          typeof ticket.customer === "object" &&
          "id" in ticket.customer
        ? Number((ticket.customer as { id: string | number }).id)
        : undefined;
    return {
      key: `customer-${customerId ?? ticket.id}`,
      customerId,
      customerName,
      customerPhone,
      calls: [ticket as any],
      latestCall: ticket as any,
    };
  };

  // ---- Handlers ----
  const openTicketModal = (ticket: Call) => {
    populateEditFormFromCall(ticket);
    setTimelineGroup(buildGroupFromCall(ticket));
    setShowTimelineDrawer(true);
  };

  const handleViewDetails = async (ticket: Call) => {
    try {
      const response = await fetch(`/api/calls/${ticket.id}`);
      if (response.ok) {
        const result = await response.json();
        if (result.success && result.data) {
          ticket = { ...ticket, ...result.data };
        }
      }
    } catch {
      // Continue with the ticket from the list
    }

    populateEditFormFromCall(ticket);
    openTicketModal(ticket);
  };

  /** Shared form-population logic reused by handleViewDetails, timeline, etc. */
  const populateEditFormFromCall = (ticket: Call) => {
    setSelectedTicket(ticket);
    setAttachmentFiles([]);

    const ticketAgentId =
      (ticket as any).agentId?.toString() ||
      (ticket.assignedTo &&
      typeof ticket.assignedTo === "object" &&
      "id" in ticket.assignedTo
        ? ((ticket.assignedTo as { id?: number }).id || "").toString()
        : "") ||
      ((ticket as any).agent &&
      typeof (ticket as any).agent === "object" &&
      "id" in (ticket as any).agent
        ? ((ticket as any).agent.id || "").toString()
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

    const formatDateLocal = (d: string | undefined | null) => {
      if (!d) return "";
      const date = new Date(d);
      const y = date.getFullYear();
      const mo = String(date.getMonth() + 1).padStart(2, "0");
      const da = String(date.getDate()).padStart(2, "0");
      const h = String(date.getHours()).padStart(2, "0");
      const mi = String(date.getMinutes()).padStart(2, "0");
      return `${y}-${mo}-${da}T${h}:${mi}`;
    };

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
        CallStatus.ACTIVE) as CallStatus,
      direction: (ticket.direction || CallDirection.INBOUND) as CallDirection,
      originalDirection: ((ticket as any).originalDirection || "") as
        | CallDirection
        | "",
      aircallId: (ticket as any).aircallId?.toString() || "",
      phoneLineId: (ticket as any).phoneLineId?.toString() || "",
      duration: ticket.duration != null ? ticket.duration.toString() : "",
      startedAt: formatDateLocal(ticket.startedAt || ticket.createdAt),
      answeredAt: formatDateLocal((ticket as any).answeredAt),
      endedAt: formatDateLocal((ticket as any).endedAt),
      recordingUrl: (ticket as any).recordingUrl || "",
      voicemailUrl: (ticket as any).voicemailUrl || "",
      missedCallReason: (ticket as any).missedCallReason || "",
      disposition: ticket.disposition || "",
      notes: ticket.notes || "",
      followUpDueDate: formatDateLocal((ticket as any).followUpDueDate),
      followUpAssignedToId:
        (ticket as any).followUpAssignedToId?.toString() || "",
      relatedCallId: (ticket as any).relatedCallId
        ? String((ticket as any).relatedCallId)
        : "",
    });

    setCampaignSearchEdit("");
    setAgentSearchEdit("");
    setCustomerSearchEdit("");
    setYardSearchEdit("");
  };

  /** Open the customer timeline drawer (grouped view) */
  const handleOpenTimeline = async (group: CustomerCallGroup) => {
    let call = group.latestCall as Call;
    // List endpoint doesn't include customer.notes relation, so fetch the
    // full call so the right-hand edit form shows customer notes on first open.
    try {
      const response = await fetch(`/api/calls/${call.id}`);
      if (response.ok) {
        const result = await response.json();
        if (result.success && result.data) {
          call = { ...call, ...result.data };
        }
      }
    } catch {
      // use call as-is
    }
    populateEditFormFromCall(call);
    setTimelineGroup(group);
    setShowTimelineDrawer(true);
  };

  /** Called when user clicks a call in the timeline sidebar */
  const handleSelectCallInTimeline = async (call: Call) => {
    try {
      const response = await fetch(`/api/calls/${call.id}`);
      if (response.ok) {
        const result = await response.json();
        if (result.success && result.data) {
          call = { ...call, ...result.data };
        }
      }
    } catch {
      // use call as-is
    }
    populateEditFormFromCall(call);
  };

  const handleUpdateTicketFromModal = async (
    overrideRelatedCallId?: string | null,
    overrideFormData?: Partial<CreateCallFormData>,
  ) => {
    if (!selectedTicket) return;
    try {
      setIsUpdating(true);

      // Merge overrideFormData to avoid stale closure issues (e.g. when linking)
      const data = overrideFormData
        ? { ...editFormData, ...overrideFormData }
        : editFormData;

      // When called with an override (from link/unlink actions), use it directly
      // to avoid stale closure issues with editFormData
      const resolvedRelatedCallId =
        overrideRelatedCallId !== undefined
          ? overrideRelatedCallId
          : data.relatedCallId;

      const updatePayload: any = {
        customerId: data.customerId ? Number(data.customerId) : undefined,
        yardId: data.yardId ? parseInt(data.yardId) : null,
        campaignId:
          data.campaignId && data.campaignId !== "none"
            ? Number(data.campaignId)
            : null,
        campaignOption: data.campaignOption || null,
        agentId:
          data.agentId && data.agentId !== "none"
            ? Number(data.agentId)
            : undefined,
        status: normalizeCallStatusForApi(data.status),
        direction: data.direction?.toUpperCase(),
        disposition: data.disposition || null,
        followUpDueDate:
          (data.disposition === "CALLBACK_REQUIRED" ||
            data.disposition === "CALLBACK_SCHEDULED") &&
          data.followUpDueDate
            ? new Date(data.followUpDueDate).toISOString()
            : null,
        followUpAssignedToId:
          (data.disposition === "CALLBACK_REQUIRED" ||
            data.disposition === "CALLBACK_SCHEDULED") &&
          data.followUpAssignedToId
            ? Number(data.followUpAssignedToId)
            : null,
        notes: data.notes || null,
        relatedCallId:
          resolvedRelatedCallId && resolvedRelatedCallId !== ""
            ? Number(resolvedRelatedCallId)
            : null,
      };

      const response = await fetch(`/api/calls/${selectedTicket.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatePayload),
      });
      const result = await response.json();

      if (result.success) {
        // Preserve locally-managed attachments — they are updated via dedicated
        // POST/DELETE /calls/:id/attachments endpoints and kept in sync through
        // onAttachmentsChange. The PATCH response may carry stale data if the
        // WebSocket-triggered SWR revalidation races the save.
        let updatedTicket = {
          ...selectedTicket,
          ...result.data,
          attachments: selectedTicket.attachments,
        };

        mutate(
          (currentTickets: any) =>
            currentTickets
              ? {
                  ...currentTickets,
                  data: (currentTickets.data || []).map((t: Call) =>
                    t.id === updatedTicket.id ? updatedTicket : t,
                  ),
                }
              : currentTickets,
          false,
        );

        setSelectedTicket(updatedTicket);
        setAttachmentFiles([]);

        // Show the sheet-anchored toast instead of the global fixed one
        setDrawerSuccessToast(true);
        setShowViewModal(false);
        setShowTimelineDrawer(true);
      } else {
        setDrawerErrorMessage(result.message || "Failed to update call");
        setDrawerErrorToast(true);
      }
    } catch (err) {
      console.error("Update error:", err);
      setDrawerErrorMessage("An error occurred while updating the call");
      setDrawerErrorToast(true);
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
      status: CallStatus.ACTIVE,
      direction: CallDirection.INBOUND,
      originalDirection: "",
      aircallId: "",
      phoneLineId: "",
      duration: "",
      startedAt: "",
      answeredAt: "",
      endedAt: "",
      recordingUrl: "",
      voicemailUrl: "",
      missedCallReason: "",
      notes: "",
      followUpDueDate: "",
      followUpAssignedToId: "",
      disposition: "",
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
        status: createFormData.status
          ? normalizeCallStatusForApi(createFormData.status)
          : undefined,
        disposition: createFormData.disposition || undefined,
        notes: createFormData.notes?.trim() || undefined,
      };

      const response = await fetch("/api/calls", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const result = await response.json();
      if (result.success) {
        let createdTicket = result.data;
        toast({
          title: "Success",
          description: (
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-green-500" />
              <span>Call created successfully</span>
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

  // ---- Create ticket from call ----
  const handleCreateTicketFromCall = () => {
    if (!selectedTicket) return;
    const data: Record<string, string> = {};
    if (selectedTicket.id) data.callId = String(selectedTicket.id);
    if (editFormData.customerId)
      data.customerId = String(editFormData.customerId);
    if (editFormData.yardId) data.yardId = String(editFormData.yardId);
    if (editFormData.campaignId)
      data.campaignId = String(editFormData.campaignId);
    if (editFormData.campaignOption)
      data.campaignOption = editFormData.campaignOption;
    if (editFormData.agentId) data.agentId = String(editFormData.agentId);
    if (editFormData.phoneLineId)
      data.phoneLineId = String(editFormData.phoneLineId);
    setShowTimelineDrawer(false);
    setTicketCreateData(data);
    setActiveTab("tickets");
  };

  // ---- Computed ----
  const savedAttachments = selectedTicket?.attachments || [];

  // ---- Render ----
  return (
    <div className="h-screen flex flex-col px-4 pt-2 pb-4 gap-0">
      <Tabs
        value={activeTab}
        onValueChange={setActiveTab}
        className="flex-1 flex flex-col"
      >
        {/* ── Header ─────────────────────────────────────────────────── */}
        <div className="flex flex-col md:flex-row md:items-center justify-between w-full pt-2 pb-5 px-0.5 gap-3 border-b border-border">
          <div className="min-w-0">
            <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-50 leading-tight">
              {activeTab === "calls"
                ? "Call Management"
                : activeTab === "tickets"
                  ? "Tickets"
                  : "Manual Records"}
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              {activeTab === "calls"
                ? `${new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })} · ${refData.agents?.length || 14} Active Agents`
                : activeTab === "tickets"
                  ? "Manage support tickets and escalations"
                  : "Track manual records and entries"}
            </p>
          </div>

          {/* Segmented Control */}
          <div className="w-full md:w-auto mt-1 md:mt-0">
            <div className="flex items-center w-full md:w-auto rounded-lg bg-slate-100 dark:bg-slate-800/60 p-1 border border-slate-200/80 dark:border-slate-700/50 shadow-sm">
              {[
                { value: "calls", label: "Calls" },
                { value: "tickets", label: "Tickets" },
                { value: "manual-records", label: "Manual Records" },
              ].map((tab) => {
                const isActive = activeTab === tab.value;
                return (
                  <button
                    key={tab.value}
                    onClick={() => setActiveTab(tab.value)}
                    className={`flex-1 md:flex-none relative inline-flex items-center justify-center gap-1.5 px-3.5 py-1.5 rounded-md text-[12.5px] font-semibold transition-all duration-200 whitespace-nowrap ${
                      isActive
                        ? "bg-white dark:bg-slate-900 text-[#008f68] shadow-sm border border-[#d1e7dd] dark:border-[#008f68]/30"
                        : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 border border-transparent"
                    }`}
                  >
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <TabsContent value="calls" className="flex-1 flex flex-col gap-0 mt-0">
          <OverdueCallsBanner />

          {!ticketIdParam ? (
          <div className="flex border-b border-border overflow-x-auto no-scrollbar px-0.5">
            {[
              {
                id: "all",
                label: "All Calls",
                count: getFilteredCountForView("all") || 0,
              },
              {
                id: "active",
                label: "Active",
                count: getFilteredCountForView("active") || 0,
              },
              {
                id: "pending_followup",
                label: "Pending Follow-up",
                count: getFilteredCountForView("pending_followup") || 0,
              },
              {
                id: "overdue",
                label: "Overdue",
                count: getFilteredCountForView("overdue") || 0,
                isOverdue: true,
              },
              {
                id: "complete",
                label: "Complete",
                count: getFilteredCountForView("complete") || 0,
              },
            ].map((tab) => {
              const isActive = ticketFilters.activeView === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => ticketFilters.handleViewChange(tab.id)}
                  className={`px-2 py-2.5 text-[13px] font-medium border-b-2 mr-4 flex items-center gap-2 transition-colors -mb-px ${
                    isActive
                      ? "border-[#008f68] text-foreground"
                      : "border-transparent text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {tab.label}
                  <span
                    className={`py-px px-1.5 rounded-full text-[11px] border ${
                      isActive
                        ? "bg-[#e2fae9] text-[#008f68] font-semibold border-[#e2fae9]"
                        : "bg-muted/40 text-muted-foreground font-medium border-border"
                    }`}
                  >
                    {tab.count}
                  </span>
                  {tab.isOverdue && tab.count > 0 && (
                    <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse -ml-0.5"></div>
                  )}
                </button>
              );
            })}
          </div>
          ) : null}

          <GroupedCallsTable
            tickets={tickets}
            isLoading={isLoading}
            focusCallId={ticketIdParam}
            search={ticketFilters.search}
            onSearchChange={ticketFilters.setSearch}
            dateRange={ticketFilters.dateRange}
            onDateRangeChange={ticketFilters.setDateRange}
            filters={ticketFilters.filters}
            onFilterChange={ticketFilters.setFilter}
            yards={refData.yards}
            campaigns={refData.campaigns}
            agents={refData.agents}
            phoneLines={refData.phoneLines}
            onOpenTimeline={handleOpenTimeline}
            currentPage={ticketFilters.currentPage}
            onPageChange={ticketFilters.setCurrentPage}
            itemsPerPage={ticketFilters.itemsPerPage}
            onItemsPerPageChange={ticketFilters.setItemsPerPage}
            totalCount={
              typeof ticketsPageData?.totalCalls === "number"
                ? ticketsPageData.totalCalls
                : totalMatchingTickets
            }
            totalCustomers={totalMatchingTickets}
            totalPages={
              ticketsPageData?.totalPages ??
              Math.max(
                1,
                Math.ceil(totalMatchingTickets / ticketFilters.itemsPerPage),
              )
            }
          />

          <CreateCallModal
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

          <ViewCallModal
            open={showViewModal}
            onOpenChange={setShowViewModal}
            ticket={selectedTicket}
            savedAttachments={savedAttachments}
            onEdit={() => {
              setShowViewModal(false);
              setSelectedTicket((prev) => {
                if (prev) {
                  setTimelineGroup(buildGroupFromCall(prev));
                  setShowTimelineDrawer(true);
                }
                return prev;
              });
            }}
            formatEnumLabel={formatEnumLabel}
            getStatusBadgeColor={getStatusBadgeColor}
            getPriorityColor={getPriorityColor}
            getDirectionIcon={getDirectionIcon}
            getDirectionText={getDirectionText}
            getCampaign={(t: Call) => getCampaign(t, refData.campaigns)}
            getAttachmentUrl={(v: string) =>
              getAttachmentUrl(v, refData.apiBase)
            }
            getAttachmentLabel={getAttachmentLabel}
            getClientName={getClientName}
            getClientPhone={getClientPhone}
            getYardDisplayName={(t: Call) =>
              getYardDisplayName(t, refData.yards)
            }
          />

          <CustomerTimelineDrawer
            open={showTimelineDrawer}
            onClose={() => setShowTimelineDrawer(false)}
            returnToLabel={returnBackLabel ?? undefined}
            onBackToReturn={
              safeReturnPath ? handleBackToReturn : undefined
            }
            group={timelineGroup}
            activeFilters={ticketFilters.filters}
            selectedCall={selectedTicket}
            onSelectCall={handleSelectCallInTimeline}
            editFormData={editFormData}
            setEditFormData={(next) =>
              setEditFormData((prev) => ({ ...prev, ...next }))
            }
            attachmentFiles={attachmentFiles}
            setAttachmentFiles={setAttachmentFiles}
            savedAttachments={savedAttachments}
            onAttachmentsChange={(attachments) =>
              setSelectedTicket((prev) =>
                prev ? { ...prev, attachments } : prev,
              )
            }
            isUpdating={isUpdating}
            onUpdate={handleUpdateTicketFromModal}
            showSuccessToast={drawerSuccessToast}
            onSuccessToastDismiss={() => setDrawerSuccessToast(false)}
            showErrorToast={drawerErrorToast}
            errorToastMessage={drawerErrorMessage}
            onErrorToastDismiss={() => setDrawerErrorToast(false)}
            customers={refData.customers}
            yards={refData.yards}
            agents={refData.agents}
            campaigns={refData.campaigns}
            getAttachmentLabel={getAttachmentLabel}
            getAttachmentUrl={(v: string) =>
              getAttachmentUrl(v, refData.apiBase)
            }
            onCreateTicket={handleCreateTicketFromCall}
          />
        </TabsContent>

        <TabsContent value="tickets" className="flex-1 mt-0">
          <TicketsTab
            initialCreateData={ticketCreateData}
            onConsumeCreateData={() => setTicketCreateData(null)}
          />
        </TabsContent>

        <TabsContent value="manual-records" className="flex-1 mt-2">
          <ManualRecordsTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}
