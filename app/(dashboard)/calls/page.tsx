"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import { useSearchParams, usePathname, useRouter } from "next/navigation";
import useSWR from "swr";
import dynamic from "next/dynamic";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent } from "@/components/ui/tabs";
import {
  CheckCircle2,
  CalendarIcon,
  Phone,
  Ticket as TicketIcon,
  ClipboardList,
  History,
  AlertTriangle,
} from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { Call } from "@/lib/mock-data";
import {
  CreateCallFormData,
  CallStatus,
  CallDirection,
  type CreateScheduleCallFormData,
  type ScheduleCall,
} from "./types";
const ViewCallModal = dynamic(
  () => import("./components/calls/ViewCallModal").then((m) => m.ViewCallModal),
  { ssr: false },
);
const ScheduleCallSheet = dynamic(
  () =>
    import("./components/calls/ScheduleCallSheet").then(
      (m) => m.ScheduleCallSheet,
    ),
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
  isCallbackDisposition,
  resolveCallCustomerId,
  resolveCallCustomerPreview,
  ensureCallEscalatedDisposition,
} from "./utils/call-helpers";
import { CallDisposition } from "./types";
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

const scheduleCallsFetcher = async (url: string) => {
  const response = await fetch(url);
  const result = await response.json();
  if (!result.success) {
    throw new Error(result.message || "Failed to load scheduled calls");
  }
  return result.data ?? [];
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

const resolveStatusForUpdate = (
  status?: string | null,
  disposition?: string | null,
): string => {
  if (isCallbackDisposition(disposition)) return "PENDING_FOLLOWUP";
  return normalizeCallStatusForApi(status);
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
  const legacyCallFilters = useCallFilters({
    currentAgentId: refData.currentAgent?.id,
    apiPath: "/api/calls/legacy",
    syncUrl: false,
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

  const {
    data: legacyCallsPageData,
    isLoading: isLoadingLegacyCalls,
  } = useSWR(
    legacyCallFilters.ticketsApiUrl,
    ticketsFetcher,
    {
      refreshInterval: 0,
      revalidateOnFocus: false,
      refreshWhenHidden: false,
      dedupingInterval: 30000,
      revalidateOnReconnect: true,
      shouldRetryOnError: false,
    },
  );

  const {
    data: scheduleCalls = [],
    mutate: mutateScheduleCalls,
  } = useSWR<ScheduleCall[]>(
    "/api/schedule-calls?status=PENDING&limit=100",
    scheduleCallsFetcher,
    {
      refreshInterval: 60_000,
      revalidateOnFocus: true,
      dedupingInterval: 15_000,
      shouldRetryOnError: false,
    },
  );

  const overdueScheduleCount = useMemo(
    () =>
      scheduleCalls.filter(
        (sc) =>
          sc.status === "PENDING" &&
          new Date(sc.scheduledAt).getTime() <= Date.now(),
      ).length,
    [scheduleCalls],
  );

  const tickets: Call[] = Array.isArray(ticketsPageData)
    ? ticketsPageData
    : ticketsPageData?.data || [];
  /** Customer groups when groupBy=customer; used for pagination by row. */
  const totalCustomerGroups =
    typeof ticketsPageData?.total === "number"
      ? ticketsPageData.total
      : tickets.length;
  /** Total calls matching filters (not group rows). */
  const totalMatchingCalls =
    typeof ticketsPageData?.totalCalls === "number"
      ? ticketsPageData.totalCalls
      : typeof ticketsPageData?.total === "number"
        ? ticketsPageData.total
        : tickets.length;
  const serverViewCounts = ticketsPageData?.viewCounts || null;
  const legacyCallCountByCustomer: Record<number, number> =
    ticketsPageData?.legacyCallCountByCustomer ?? {};
  const legacyCalls: Call[] = Array.isArray(legacyCallsPageData)
    ? legacyCallsPageData
    : legacyCallsPageData?.data || [];
  const legacyTotalCustomerGroups =
    typeof legacyCallsPageData?.total === "number"
      ? legacyCallsPageData.total
      : legacyCalls.length;
  const legacyTotalMatchingCalls =
    typeof legacyCallsPageData?.totalCalls === "number"
      ? legacyCallsPageData.totalCalls
      : typeof legacyCallsPageData?.total === "number"
        ? legacyCallsPageData.total
        : legacyCalls.length;
  const legacyServerViewCounts = legacyCallsPageData?.viewCounts || null;

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

      if (
        viewType === "all" &&
        typeof ticketsPageData?.totalCalls === "number"
      ) {
        return ticketsPageData.totalCalls;
      }

      if (viewType === ticketFilters.activeView) {
        return totalMatchingCalls;
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
        else if (viewType === "active")
          matchesView = status === "ACTIVE" && !isMissed;
        else if (viewType === "pending_followup")
          matchesView = status === "PENDING_FOLLOWUP" && !isMissed;
        else if (viewType === "overdue")
          matchesView = status === "OVERDUE" && !isMissed;
        else if (viewType === "complete")
          matchesView = status === "COMPLETED" && !isMissed;
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
    totalMatchingCalls,
    ticketsPageData?.totalCalls,
    refData.isTicketAssignedToCurrentUser,
  ]);

  const getLegacyCountForView = useMemo(() => {
    return (viewType: string): number => {
      if (
        legacyServerViewCounts &&
        typeof legacyServerViewCounts === "object" &&
        typeof (legacyServerViewCounts as any)[viewType] === "number"
      ) {
        return (legacyServerViewCounts as any)[viewType];
      }
      if (viewType === "all") return legacyTotalMatchingCalls;
      if (viewType === legacyCallFilters.activeView)
        return legacyTotalMatchingCalls;
      return 0;
    };
  }, [
    legacyServerViewCounts,
    legacyTotalMatchingCalls,
    legacyCallFilters.activeView,
  ]);

  // ---- Tab state ----
  const tabParam = searchParams.get("tab");
  const [activeTab, setActiveTab] = useState(
    tabParam &&
      ["calls", "legacy-calls", "tickets", "manual-records"].includes(tabParam)
      ? tabParam
      : "calls",
  );
  const [ticketCreateData, setTicketCreateData] = useState<Record<
    string,
    string
  > | null>(null);

  // ---- Modal state ----
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [isScheduleSubmitting, setIsScheduleSubmitting] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showTimelineDrawer, setShowTimelineDrawer] = useState(false);
  const [timelineReadOnly, setTimelineReadOnly] = useState(false);
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

  // ---- Call notification ----
  const previousTicketCountRef = useRef(0);
  const previousTicketQueryKeyRef = useRef<string | null>(null);

  useEffect(() => {
    if (previousTicketQueryKeyRef.current !== ticketFilters.ticketsApiUrl) {
      previousTicketQueryKeyRef.current = ticketFilters.ticketsApiUrl;
      if (totalMatchingCalls > 0)
        previousTicketCountRef.current = totalMatchingCalls;
      return;
    }
    if (totalMatchingCalls > 0) {
      if (
        previousTicketCountRef.current > 0 &&
        totalMatchingCalls > previousTicketCountRef.current
      ) {
        const newCount = totalMatchingCalls - previousTicketCountRef.current;
        toast({
          title: "New Call" + (newCount > 1 ? "s" : ""),
          description: `${newCount} new call${newCount > 1 ? "s" : ""} created`,
          duration: 3000,
        });
      }
      previousTicketCountRef.current = totalMatchingCalls;
    }
  }, [ticketFilters.ticketsApiUrl, totalMatchingCalls]);

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

      // The in-drawer `TimelineReturnBar` (driven by the `returnTo` param the
      // High & Emergency modal now encodes) takes the place of the previous
      // corner toast — same UX as the customer-timeline flow. Filter side
      // effects are still applied so the underlying ticket list reflects the
      // report context if the user closes the drawer.
      if (yardId) ticketFilters.setFilter("yard", yardId);
      if (status) ticketFilters.setFilter("status", status);
      if (view) ticketFilters.setActiveView(view);
    }
  }, [searchParams, router]);

  // ---- Handle URL deep-link params ----
  const processedCallIdRef = useRef<string | null>(null);
  const processedSupportTicketIdRef = useRef<string | null>(null);
  const processedManualRecordIdRef = useRef<string | null>(null);
  const isNavigatingBackRef = useRef(false);
  const entityIdParam = searchParams.get("id");
  const callIdParam =
    entityIdParam && (!tabParam || tabParam === "calls") ? entityIdParam : null;
  const supportTicketIdParam =
    tabParam === "tickets" && entityIdParam ? entityIdParam : null;
  const manualRecordIdParam =
    tabParam === "manual-records" && entityIdParam ? entityIdParam : null;
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
    isNavigatingBackRef.current = true;
    setShowTimelineDrawer(false);
    setShowViewModal(false);
    processedCallIdRef.current = null;
    processedSupportTicketIdRef.current = null;
    processedManualRecordIdRef.current = null;
    ticketFilters.leaveCallFocus(safeReturnPath);
  };

  const handleCloseCallDrawer = () => {
    setShowTimelineDrawer(false);
    setTimelineReadOnly(false);
    setDrawerSuccessToast(false);
    setDrawerErrorToast(false);
    if (callIdParam && !isNavigatingBackRef.current) {
      ticketFilters.clearFocusMode();
    }
    isNavigatingBackRef.current = false;
  };

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    const params = new URLSearchParams(searchParams.toString());
    params.set("tab", tab);
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  };

  useEffect(() => {
    if (
      tabParam &&
      ["calls", "legacy-calls", "tickets", "manual-records"].includes(tabParam)
    ) {
      setActiveTab(tabParam);
      return;
    }

    if (tabParam === "all") {
      setActiveTab("calls");
      const params = new URLSearchParams(searchParams.toString());
      params.set("tab", "calls");
      router.replace(`${pathname}?${params.toString()}`, { scroll: false });
      return;
    }

    if (callIdParam) {
      setActiveTab("calls");
    }
  }, [tabParam, callIdParam, pathname, router, searchParams]);

  useEffect(() => {
    if (!callIdParam) {
      processedCallIdRef.current = null;
      return;
    }

    if (processedCallIdRef.current === callIdParam) return;

    let cancelled = false;

    const openFromUrl = async () => {
      const fromList = tickets.find(
        (t: Call) => t.id.toString() === callIdParam,
      );
      if (fromList) {
        if (cancelled) return;
        processedCallIdRef.current = callIdParam;
        openTicketModal(fromList);
        return;
      }

      try {
        const response = await fetch(`/api/calls/${callIdParam}`);
        if (!response.ok || cancelled) return;
        const ticketData = await response.json();
        const resolvedTicket = ticketData?.data ?? ticketData;
        if (!resolvedTicket || cancelled) return;
        processedCallIdRef.current = callIdParam;
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
  }, [callIdParam, tickets]);

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
    setTimelineReadOnly(Boolean((ticket as any).isLegacy));
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
  const handleOpenTimeline = (group: CustomerCallGroup) => {
    const call = group.latestCall as Call;
    setTimelineReadOnly(false);
    // Open drawer immediately with available data
    populateEditFormFromCall(call);
    setTimelineGroup(group);
    setShowTimelineDrawer(true);
    // List endpoint doesn't include customer.notes relation, so fetch the
    // full call in the background and update the form when it arrives.
    fetch(`/api/calls/${call.id}`)
      .then((r) => r.json())
      .then((result) => {
        if (result.success && result.data) {
          populateEditFormFromCall({ ...call, ...result.data });
        }
      })
      .catch(() => {});
  };

  /** Called when user clicks a call in the timeline sidebar */
  const handleSelectCallInTimeline = (call: Call) => {
    setTimelineReadOnly(false);
    // Update form immediately with available data
    populateEditFormFromCall(call);
    // Fetch full data in background to get customer notes
    fetch(`/api/calls/${call.id}`)
      .then((r) => r.json())
      .then((result) => {
        if (result.success && result.data) {
          populateEditFormFromCall({ ...call, ...result.data });
        }
      })
      .catch(() => {});
  };

  const handleOpenLegacyTimeline = (group: CustomerCallGroup) => {
    const call = group.latestCall as Call;
    setTimelineReadOnly(true);
    populateEditFormFromCall({ ...call, isLegacy: true } as Call);
    setTimelineGroup(group);
    setShowTimelineDrawer(true);
  };

  const handleSelectLegacyCallInTimeline = (call: Call) => {
    setTimelineReadOnly(true);
    populateEditFormFromCall({ ...call, isLegacy: true } as Call);
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
        status: resolveStatusForUpdate(data.status, data.disposition),
        direction: data.direction?.toUpperCase(),
        disposition: data.disposition || null,
        followUpDueDate:
          isCallbackDisposition(data.disposition) && data.followUpDueDate
            ? new Date(data.followUpDueDate).toISOString()
            : null,
        followUpAssignedToId:
          isCallbackDisposition(data.disposition) && data.followUpAssignedToId
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
        status: isCallbackDisposition(createFormData.disposition)
          ? "PENDING_FOLLOWUP"
          : createFormData.status
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

  const handleScheduleCallSubmit = async (data: CreateScheduleCallFormData) => {
    setIsScheduleSubmitting(true);
    try {
      const payload: any = {
        customerId: Number(data.customerId),
        scheduledAt: new Date(data.scheduledAt).toISOString(),
      };
      if (data.notes) payload.notes = data.notes;

      const res = await fetch("/api/schedule-calls", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const result = await res.json();
      if (!result.success) throw new Error(result.message || "Failed to schedule call");
    } finally {
      setIsScheduleSubmitting(false);
    }
  };

  // ---- Create ticket from call (escalate) ----
  const handleCreateTicketFromCall = async () => {
    if (!selectedTicket) return;

    const customerId = resolveCallCustomerId(
      selectedTicket,
      editFormData.customerId,
      timelineGroup?.customerId,
    );

    const currentDisposition =
      editFormData.disposition?.trim() ||
      selectedTicket.disposition?.trim() ||
      "";

    if (!currentDisposition) {
      const updated = await ensureCallEscalatedDisposition(
        Number(selectedTicket.id),
        currentDisposition,
      );
      if (updated) {
        setEditFormData((prev) => ({
          ...prev,
          disposition: CallDisposition.ESCALATED,
        }));
        setSelectedTicket((prev) =>
          prev ? { ...prev, disposition: CallDisposition.ESCALATED } : prev,
        );
      }
    }

    const customerPreview = resolveCallCustomerPreview(
      selectedTicket,
      customerId,
      timelineGroup,
    );

    const data: Record<string, string> = {};
    if (selectedTicket.id) data.callId = String(selectedTicket.id);
    if (customerId) data.customerId = customerId;
    if (customerPreview?.name) data.customerName = customerPreview.name;
    if (customerPreview?.phone) data.customerPhone = customerPreview.phone;
    if (editFormData.yardId) data.yardId = String(editFormData.yardId);
    if (editFormData.campaignId)
      data.campaignId = String(editFormData.campaignId);
    if (editFormData.campaignOption)
      data.campaignOption = editFormData.campaignOption;
    if (editFormData.agentId) data.agentId = String(editFormData.agentId);
    if (editFormData.phoneLineId)
      data.phoneLineId = String(editFormData.phoneLineId);
    if (editFormData.notes?.trim())
      data.issueDetail = editFormData.notes.trim();

    setShowTimelineDrawer(false);
    setTicketCreateData(data);
    handleTabChange("tickets");
  };

  // ---- Computed ----
  const savedAttachments: string[] = (() => {
    const raw: unknown = selectedTicket?.attachments;
    if (Array.isArray(raw)) return raw as string[];
    if (typeof raw === "string" && raw.length > 0) {
      try { const p = JSON.parse(raw); return Array.isArray(p) ? p : []; } catch { return []; }
    }
    return [];
  })();

  // ---- Render ----
  return (
    <div className="h-screen flex flex-col px-4 pt-2 pb-4 gap-0">
      <Tabs
        value={activeTab}
        onValueChange={handleTabChange}
        className="flex-1 flex flex-col"
      >
        {/* ── Header ─────────────────────────────────────────────────── */}
        <div className="flex flex-col md:flex-row md:items-center justify-between w-full pt-2 pb-5 px-0.5 gap-3 border-b border-border">
          <div className="min-w-0">
            <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-neutral-50 leading-tight">
              {activeTab === "calls"
                ? "Call Management"
                : activeTab === "legacy-calls"
                  ? "Legacy Calls"
                : activeTab === "tickets"
                  ? "Tickets"
                  : "Manual Records"}
            </h2>
            <p className="text-sm text-slate-500 dark:text-neutral-400 mt-1">
              {activeTab === "calls"
                ? `${new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })} · ${refData.agents?.length || 14} Active Agents`
                : activeTab === "legacy-calls"
                  ? "Historical Aircall records, read-only"
                : activeTab === "tickets"
                  ? "Manage support tickets and escalations"
                  : "Track manual records and entries"}
            </p>
          </div>

          {/* Segmented Control (DESIGN_SYSTEM §7) */}
          <div className="w-full md:w-auto mt-1 md:mt-0">
            <div className="flex w-full items-center gap-0.5 rounded-lg border border-slate-200/80 dark:border-neutral-700/50 bg-slate-100 dark:bg-neutral-900/80 p-1 shadow-sm md:w-auto">
              {[
                { value: "calls", label: "Calls", icon: Phone },
                { value: "tickets", label: "Tickets", icon: TicketIcon },
                {
                  value: "manual-records",
                  label: "Manual Records",
                  icon: ClipboardList,
                },
                { value: "legacy-calls", label: "Legacy Calls", icon: History },
              ].map((tab) => {
                const isActive = activeTab === tab.value;
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.value}
                    type="button"
                    onClick={() => handleTabChange(tab.value)}
                    aria-pressed={isActive}
                    className={`relative inline-flex flex-1 items-center justify-center gap-1.5 whitespace-nowrap rounded-md px-3 py-1.5 text-xs font-semibold transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#008f68]/25 md:flex-none ${
                      isActive
                        ? "bg-white text-[#008f68] shadow-sm dark:bg-neutral-950 dark:text-emerald-400"
                        : "text-slate-500 hover:text-slate-800 dark:text-neutral-400 dark:hover:text-neutral-200"
                    }`}
                  >
                    <Icon
                      className={`size-3.5 shrink-0 ${
                        isActive
                          ? "text-[#008f68] dark:text-emerald-400"
                          : "text-slate-400"
                      }`}
                      strokeWidth={2}
                    />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <TabsContent value="calls" className="flex-1 flex flex-col gap-0 mt-0">
          <OverdueCallsBanner
            overdueCount={getFilteredCountForView("overdue") || 0}
            onViewOverdue={() => ticketFilters.handleViewChange("overdue")}
          />

          {!callIdParam ? (
            <div className="flex items-end border-b border-border">
              <div className="flex min-w-0 flex-1 items-end overflow-x-auto overflow-y-hidden [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
                <div className="flex px-0.5">
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
                      id: "missed",
                      label: "Missed",
                      count: getFilteredCountForView("missed") || 0,
                    },
                    {
                      id: "complete",
                      label: "Complete",
                      count: getFilteredCountForView("complete") || 0,
                    },
                  ].map((tab) => {
                    const isActive = ticketFilters.activeView === tab.id;
                    const isOverdueAlert = !!tab.isOverdue && tab.count > 0;
                    return (
                      <button
                        key={tab.id}
                        onClick={() => ticketFilters.handleViewChange(tab.id)}
                        className={`mr-2 flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-t-md border-b-2 px-3 py-2 text-[13px] transition-colors -mb-px ${
                          isOverdueAlert
                            ? isActive
                              ? "border-red-500 bg-red-50/80 font-semibold text-red-600 dark:bg-red-500/10 dark:text-red-400"
                              : "border-red-300 font-semibold text-red-600 hover:bg-red-50/70 dark:border-red-500/40 dark:text-red-400 dark:hover:bg-red-500/10"
                            : isActive
                              ? "border-[#008f68] bg-[#f0faf5] font-semibold text-[#008f68] dark:bg-emerald-500/10 dark:text-emerald-400"
                              : "border-transparent font-medium text-muted-foreground hover:bg-slate-50 hover:text-foreground dark:hover:bg-neutral-800/40"
                        }`}
                      >
                        {isOverdueAlert && (
                          <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
                        )}
                        {tab.label}
                        <span
                          className={`inline-flex items-center gap-1 rounded-full border px-1.5 py-px text-[11px] tabular-nums ${
                            isOverdueAlert
                              ? "border-red-500 bg-red-500 font-semibold text-white"
                              : isActive
                                ? "border-[#008f68] bg-[#008f68] font-semibold text-white"
                                : "border-border bg-muted/40 font-medium text-muted-foreground"
                          }`}
                        >
                          {isOverdueAlert && (
                            <span className="h-1.5 w-1.5 rounded-full bg-white/90 animate-pulse" />
                          )}
                          {tab.count}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowScheduleModal(true)}
                className={`relative mb-1 ml-2 flex h-[30px] shrink-0 items-center gap-1.5 rounded-full px-3.5 text-[12.5px] font-semibold text-white shadow-sm transition-all active:scale-95 ${
                  overdueScheduleCount > 0
                    ? "animate-pulse ring-2 ring-rose-300/80 ring-offset-2 ring-offset-white"
                    : ""
                }`}
                style={{ background: "#065f4a" }}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.background = "#008f68")
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.background = "#065f4a")
                }
              >
                <CalendarIcon className="w-3.5 h-3.5" />
                Schedule Call
                {overdueScheduleCount > 0 && (
                  <span className="absolute -right-1.5 -top-1.5 flex min-w-5 items-center justify-center rounded-full bg-rose-500 px-1.5 text-[10px] font-bold leading-5 text-white shadow-sm ring-2 ring-white">
                    {overdueScheduleCount > 9 ? "9+" : overdueScheduleCount}
                  </span>
                )}
              </button>
            </div>
          ) : null}

          <GroupedCallsTable
            tickets={tickets}
            isLoading={isLoading}
            focusCallId={callIdParam}
            legacyCalls={legacyCalls}
            legacyCallCountByCustomer={legacyCallCountByCustomer}
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
            totalCount={totalMatchingCalls}
            totalCustomers={totalCustomerGroups}
            totalPages={
              ticketsPageData?.totalPages ??
              Math.max(
                1,
                Math.ceil(totalCustomerGroups / ticketFilters.itemsPerPage),
              )
            }
            onClearFocus={ticketFilters.clearFocusMode}
          />

          <ScheduleCallSheet
            open={showScheduleModal}
            onOpenChange={setShowScheduleModal}
            customers={refData.customers}
            onSubmit={handleScheduleCallSubmit}
            isSubmitting={isScheduleSubmitting}
            onSchedulesChanged={() => mutateScheduleCalls()}
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
            open={showTimelineDrawer && !timelineReadOnly}
            onClose={handleCloseCallDrawer}
            returnToLabel={returnBackLabel ?? undefined}
            onBackToReturn={safeReturnPath ? handleBackToReturn : undefined}
            group={timelineGroup}
            activeFilters={ticketFilters.filters}
            selectedCall={selectedTicket}
            onSelectCall={
              timelineReadOnly
                ? handleSelectLegacyCallInTimeline
                : handleSelectCallInTimeline
            }
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
            readOnly={timelineReadOnly}
            historyApiPath={
              timelineReadOnly ? "/api/calls/legacy" : "/api/calls"
            }
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
            onCreateTicket={
              timelineReadOnly ? undefined : handleCreateTicketFromCall
            }
          />
        </TabsContent>

        <TabsContent
          value="legacy-calls"
          className="flex-1 flex flex-col gap-0 mt-0"
        >
          <div className="flex items-end border-b border-border">
            <div className="flex min-w-0 flex-1 items-end overflow-x-auto overflow-y-hidden [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
              <div className="flex px-0.5">
                {[
                  {
                    id: "all",
                    label: "All Legacy",
                    count: getLegacyCountForView("all") || 0,
                  },
                  {
                    id: "active",
                    label: "Active",
                    count: getLegacyCountForView("active") || 0,
                  },
                  {
                    id: "pending_followup",
                    label: "Pending Follow-up",
                    count: getLegacyCountForView("pending_followup") || 0,
                  },
                  {
                    id: "overdue",
                    label: "Overdue",
                    count: getLegacyCountForView("overdue") || 0,
                    isOverdue: true,
                  },
                  {
                    id: "missed",
                    label: "Missed",
                    count: getLegacyCountForView("missed") || 0,
                  },
                  {
                    id: "complete",
                    label: "Complete",
                    count: getLegacyCountForView("complete") || 0,
                  },
                ].map((tab) => {
                  const isActive = legacyCallFilters.activeView === tab.id;
                  const isOverdueAlert = !!tab.isOverdue && tab.count > 0;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => legacyCallFilters.handleViewChange(tab.id)}
                      className={`mr-4 flex shrink-0 items-center gap-1.5 whitespace-nowrap border-b-2 px-2 py-2.5 text-[13px] font-medium transition-colors -mb-px ${
                        isOverdueAlert
                          ? "border-red-300 font-semibold text-red-600 hover:text-red-700 dark:border-red-500/40 dark:text-red-400"
                          : isActive
                            ? "border-[#008f68] text-foreground"
                            : "border-transparent text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      {isOverdueAlert && (
                        <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
                      )}
                      {tab.label}
                      <span
                        className={`inline-flex items-center gap-1 rounded-full border px-1.5 py-px text-[11px] tabular-nums ${
                          isOverdueAlert
                            ? "border-red-500 bg-red-500 font-semibold text-white"
                            : isActive
                              ? "border-[#e2fae9] bg-[#e2fae9] font-semibold text-[#008f68]"
                              : "border-border bg-muted/40 font-medium text-muted-foreground"
                        }`}
                      >
                        {isOverdueAlert && (
                          <span className="h-1.5 w-1.5 rounded-full bg-white/90 animate-pulse" />
                        )}
                        {tab.count}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
            <div className="mb-1 ml-2 shrink-0 rounded-full border border-slate-200 dark:border-neutral-700 bg-slate-50 dark:bg-neutral-800 px-3 py-1 text-[11px] font-semibold text-slate-500 dark:text-neutral-400">
              View only
            </div>
          </div>

          <GroupedCallsTable
            tickets={legacyCalls}
            isLoading={isLoadingLegacyCalls}
            focusCallId={null}
            search={legacyCallFilters.search}
            onSearchChange={legacyCallFilters.setSearch}
            dateRange={legacyCallFilters.dateRange}
            onDateRangeChange={legacyCallFilters.setDateRange}
            filters={legacyCallFilters.filters}
            onFilterChange={legacyCallFilters.setFilter}
            yards={refData.yards}
            campaigns={refData.campaigns}
            agents={refData.agents}
            phoneLines={refData.phoneLines}
            onOpenTimeline={handleOpenLegacyTimeline}
            currentPage={legacyCallFilters.currentPage}
            onPageChange={legacyCallFilters.setCurrentPage}
            itemsPerPage={legacyCallFilters.itemsPerPage}
            onItemsPerPageChange={legacyCallFilters.setItemsPerPage}
            totalCount={legacyTotalMatchingCalls}
            totalCustomers={legacyTotalCustomerGroups}
            totalPages={
              legacyCallsPageData?.totalPages ??
              Math.max(
                1,
                Math.ceil(
                  legacyTotalCustomerGroups / legacyCallFilters.itemsPerPage,
                ),
              )
            }
            onClearFocus={legacyCallFilters.clearFocusMode}
          />

          <CustomerTimelineDrawer
            open={showTimelineDrawer && timelineReadOnly}
            onClose={handleCloseCallDrawer}
            group={timelineGroup}
            activeFilters={legacyCallFilters.filters}
            selectedCall={selectedTicket}
            onSelectCall={handleSelectLegacyCallInTimeline}
            editFormData={editFormData}
            setEditFormData={(next) =>
              setEditFormData((prev) => ({ ...prev, ...next }))
            }
            attachmentFiles={attachmentFiles}
            setAttachmentFiles={setAttachmentFiles}
            savedAttachments={savedAttachments}
            isUpdating={isUpdating}
            onUpdate={handleUpdateTicketFromModal}
            readOnly
            historyApiPath="/api/calls/legacy"
            customers={refData.customers}
            yards={refData.yards}
            agents={refData.agents}
            campaigns={refData.campaigns}
            getAttachmentLabel={getAttachmentLabel}
            getAttachmentUrl={(v: string) =>
              getAttachmentUrl(v, refData.apiBase)
            }
          />
        </TabsContent>

        <TabsContent value="tickets" className="flex-1 mt-0">
          <TicketsTab
            initialCreateData={ticketCreateData}
            onConsumeCreateData={() => setTicketCreateData(null)}
          />
        </TabsContent>

        <TabsContent value="manual-records" className="flex-1 mt-0">
          <ManualRecordsTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}
