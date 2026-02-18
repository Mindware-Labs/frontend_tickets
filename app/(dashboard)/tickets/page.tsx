"use client";

import { useState, useMemo, useEffect, JSX, useRef } from "react";
import { useSearchParams, usePathname, useRouter } from "next/navigation";
import useSWR from "swr";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { fetchFromBackend } from "@/lib/api-client";
import { getCookie } from "@/lib/cookie-utils";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Label } from "@/components/ui/label";
import {
  Search,
  RefreshCw,
  Plus,
  AlertCircle,
  Inbox,
  User,
  Hash,
  Star,
  Archive,
  SlidersHorizontal,
  PhoneOutgoing,
  PhoneIncoming,
  MapPin,
  AlertTriangle,
  CheckCircle2,
  Loader2,
  Download,
  Upload,
  X,
  FileText,
  Edit2,
  Save,
  Calendar,
  Clock,
  CheckCircle,
  Tag,
  MessageCircle,
  Users,
  Sparkles,
  Building,
  Mail,
} from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { Ticket } from "@/lib/mock-data";
import {
  AgentOption,
  CallDirection,
  CampaignOption,
  CreateTicketFormData,
  CustomerOption,
  ManagementType,
  TicketStatus,
  TicketPriority,
  OnboardingOption,
  ArOption,
  TicketDisposition,
  YardOption,
} from "./types";
import { CreateTicketModal } from "./components/CreateTicketModal";
import { EditTicketModal } from "./components/EditTicketModal";
import { ViewTicketModal } from "./components/ViewTicketModal";
import { auth } from "@/lib/auth";
import { format, startOfDay, endOfDay, isWithinInterval } from "date-fns";
import { Calendar as CalendarWidget } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import type { DateRange } from "react-day-picker";

// Extend the Ticket type
declare module "@/lib/mock-data" {
  interface Ticket {
    issueDetail?: string;
    yardId?: string;
    yardType?: string;
    campaignId?: number;
    customerId?: number | string;
    customer?: { name: string; phone?: string; email?: string; id?: number };
    customerPhone?: string;
    disposition?: string;
    campaignOption?: string;
    onboardingOption?: string;
    attachments?: string[];
    updatedAt?: string;
    callDate?: string;
    agentId?: number | string;
  }
}

export default function TicketsPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [isTabActive, setIsTabActive] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [previousTicketCount, setPreviousTicketCount] = useState(0);
  const [search, setSearch] = useState("");
  const [urlTicketId, setUrlTicketId] = useState<string | null>(null);
  const [urlCustomerId, setUrlCustomerId] = useState<string | null>(null);
  const [activeView, setActiveView] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [directionFilter, setDirectionFilter] = useState("all");
  const [dispositionFilter, setDispositionFilter] = useState("all");
  const [campaignFilter, setCampaignFilter] = useState("all");
  const [yardFilter, setYardFilter] = useState("all");
  const [campaignFilterSearch, setCampaignFilterSearch] = useState("");
  const [yardFilterSearch, setYardFilterSearch] = useState("");
  const [agentFilter, setAgentFilter] = useState("all");
  const [agentFilterSearch, setAgentFilterSearch] = useState("");
  const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [showDetails, setShowDetails] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [selectedYardId, setSelectedYardId] = useState<string>("");
  const [isAssigningYard, setIsAssigningYard] = useState(false);
  const [isIssueDetailEditing, setIsIssueDetailEditing] = useState(false);
  const [wasIssueDetailFilled, setWasIssueDetailFilled] = useState(false);
  const [yardSearch, setYardSearch] = useState("");
  const [yardCategory, setYardCategory] = useState<string>("all");
  const [yards, setYards] = useState<YardOption[]>([]);
  const [customers, setCustomers] = useState<CustomerOption[]>([]);
  const [agents, setAgents] = useState<AgentOption[]>([]);
  const [campaigns, setCampaigns] = useState<CampaignOption[]>([]);
  const [attachmentFiles, setAttachmentFiles] = useState<File[]>([]);
  const [isUploadingAttachments, setIsUploadingAttachments] = useState(false);
  const apiBase = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";
  const [currentUser, setCurrentUser] = useState<{
    id: number;
    email?: string;
    name?: string;
    lastName?: string;
    role?: string;
  } | null>(null);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [createValidationErrors, setCreateValidationErrors] = useState<
    Record<string, string>
  >({});
  const [newAttachment, setNewAttachment] = useState("");
  const [createAttachmentFiles, setCreateAttachmentFiles] = useState<File[]>(
    [],
  );
  const processedTicketIdRef = useRef<string | null>(null);
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
    attachments: [] as string[],
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
    attachments: [] as string[],
  });

  // State for updating ticket
  const [isUpdating, setIsUpdating] = useState(false);

  // Add campaign to the edit state
  const [editData, setEditData] = useState<{
    disposition?: string;
    issueDetail?: string;
    campaignOption?: string;
    status?: string;
    priority?: string;
    attachments?: string[];
    campaignId?: string;
    agentId?: string;
  }>({});

  // Helper functions
  const getAssigneeName = (assignedTo: any) => {
    if (!assignedTo) return "Unassigned";
    if (typeof assignedTo === "string") return assignedTo;
    return assignedTo.name || "Unknown Agent";
  };

  const getAssigneeInitials = (assignedTo: any) => {
    const name = getAssigneeName(assignedTo);
    if (name === "Unassigned") return "NA";
    return name.substring(0, 2).toUpperCase();
  };

  const getClientName = (ticket: any) => {
    if (!ticket) return "Unknown Caller";
    if (ticket.clientName) return ticket.clientName;
    if (ticket.customer?.name) return ticket.customer.name;
    return "Unknown Caller";
  };

  const getClientPhone = (ticket: any) => {
    if (!ticket) return "-";
    if (ticket.phone) return ticket.phone;
    if (ticket.customerPhone) return ticket.customerPhone;
    if (ticket.customer?.phone) return ticket.customer.phone;
    return "-";
  };

  const getClientInitials = (ticket: any) => {
    if (!ticket) return "NA";
    const name = getClientName(ticket);
    return name.substring(0, 2).toUpperCase();
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case "Open":
      case "OPEN":
        return "border-emerald-500/20 bg-emerald-500/5 text-emerald-600";
      case "In Progress":
      case "IN_PROGRESS":
        return "border-amber-500/20 bg-amber-500/5 text-amber-600";
      case "Closed":
      case "CLOSED":
      default:
        return "";
    }
  };

  const getPriorityColor = (priority?: string) => {
    const p = priority?.toUpperCase();
    switch (p) {
      case "HIGH":
      case "EMERGENCY":
        return "text-rose-500 bg-rose-500/10 border-rose-500/20";
      case "MEDIUM":
        return "text-amber-500 bg-amber-500/10 border-amber-500/20";
      case "LOW":
        return "text-blue-500 bg-blue-500/10 border-blue-500/20";
      default:
        return "text-muted-foreground bg-secondary/50";
    }
  };

  const getDirectionIcon = (direction: string) => {
    const d = direction?.toString().toLowerCase();
    if (d === "missed") {
      return <AlertTriangle className="h-3 w-3 text-rose-500" />;
    }
    if (d === "outbound") {
      return <PhoneOutgoing className="h-3 w-3 text-blue-500" />;
    } else if (d === "text_message") {
      return <MessageCircle className="h-3 w-3 text-purple-500" />;
    } else {
      return <PhoneIncoming className="h-3 w-3 text-emerald-500" />;
    }
  };

  const getDirectionText = (
    direction: string,
    originalDirection?: string,
    agentId?: number | string,
  ) => {
    const d = direction?.toString().toLowerCase();
    if (d === "missed") {
      // Si hay originalDirection, usarlo directamente
      if (originalDirection) {
        // Formateamos la primera letra en mayúscula para que se vea bien
        const formatted =
          originalDirection.charAt(0).toUpperCase() +
          originalDirection.slice(1).toLowerCase();
        return `Missed (${formatted})`;
      }
      // Si no hay originalDirection pero hay un agente asignado,
      // es muy probable que sea una llamada outbound (el agente llamó al cliente)
      if (agentId) {
        return "Missed (Outbound)";
      }
      // Por defecto, asumir Inbound solo si no hay indicadores de Outbound
      return "Missed (Inbound)";
    }
    if (d === "text_message") {
      return "Text Message";
    }
    return d === "outbound" ? "Outbound" : "Inbound";
  };

  const isMissedCall = (ticket: Ticket) =>
    ticket.direction?.toString().toLowerCase() === "missed";

  const formatEnumLabel = (value?: string) => {
    if (!value) return "-";

    if (value === OnboardingOption.PAID_WITH_LL || value === "PAID_WITH_LL") {
      return "Paid with LL";
    }
    return value
      .toString()
      .replace(/_/g, " ")
      .toLowerCase()
      .replace(/\b\w/g, (char) => char.toUpperCase());
  };

  const normalizeEnumValue = (value?: string) => {
    if (!value) return "";
    return value.toString().trim().toUpperCase().replace(/\s+/g, "_");
  };

  const getCampaign = (ticket: Ticket): string | null => {
    if (
      ticket.campaign &&
      typeof ticket.campaign === "object" &&
      "nombre" in ticket.campaign
    ) {
      return (ticket.campaign as { nombre?: string }).nombre ?? null;
    }
    if (ticket.campaignId) {
      const campaign = campaigns.find((c) => c.id === ticket.campaignId);
      return campaign?.nombre ?? null;
    }
    return null;
  };

  const getYardTypeColor = (type?: string) => {
    const t = type?.toLowerCase();
    switch (t) {
      case "full_service":
        return "border-blue-500/20 bg-blue-500/5 text-blue-600 dark:border-blue-500/30 dark:bg-blue-500/10 dark:text-blue-400";
      case "saas":
        return "border-purple-500/20 bg-purple-500/5 text-purple-600 dark:border-purple-500/30 dark:bg-purple-500/10 dark:text-purple-400";
      default:
        return "border-gray-500/20 bg-gray-500/5 text-gray-600";
    }
  };

  const getYardTypeIcon = (type?: string) => {
    const t = type?.toLowerCase();
    switch (t) {
      case "full_service":
        return <Users className="h-3 w-3" />;
      case "saas":
        return <Sparkles className="h-3 w-3" />;
      default:
        return <Building className="h-3 w-3" />;
    }
  };

  const getYardDisplayName = (ticket: Ticket) => {
    if (ticket.yard && typeof ticket.yard === "object") {
      const y = ticket.yard as any;
      const name = y.name || "";
      const secondary = y.commonName || y.city || "";
      const location = y.propertyAddress || y.state || "";

      let display = name;
      if (secondary) display += ` - ${secondary}`;
      if (location && location !== secondary) display += ` (${location})`;

      return display || "Unknown Yard";
    }

    if (typeof ticket.yard === "string" && ticket.yard.trim() !== "") {
      return ticket.yard;
    }

    if (ticket.yardId) {
      const yard = yards.find(
        (y) => y.id.toString() === ticket.yardId?.toString(),
      );
      if (yard) return yard.commonName || yard.name;
    }

    return null;
  };

  const getAttachmentUrl = (value: string) => {
    if (!value) return "";
    if (value.startsWith("http")) return value;
    if (value.startsWith("s3://")) {
      return `${apiBase}/tickets/attachments/download?fileUrl=${encodeURIComponent(
        value,
      )}`;
    }
    const normalized = value.startsWith("/") ? value : `/${value}`;
    return `${apiBase}${normalized}`;
  };

  const getAttachmentLabel = (value: string) => {
    if (!value) return "Attachment";
    const parts = value.split("/");
    return parts[parts.length - 1] || value;
  };

  // Declarar currentUserFullName antes de cualquier uso
  const currentUserFullName = useMemo(() => {
    if (!currentUser) return "";
    return [currentUser.name, currentUser.lastName]
      .filter(Boolean)
      .join(" ")
      .trim()
      .toLowerCase();
  }, [currentUser]);

  const currentAgent = useMemo(() => {
    if (!currentUser) return null;
    const byUser = (agents as any[]).find(
      (agent) => (agent as any).userId === currentUser.id,
    );
    if (byUser) return byUser;

    const email = currentUser.email?.toLowerCase();
    if (email) {
      const byEmail = agents.find(
        (agent: any) => (agent.email || "").toLowerCase() === email,
      );
      if (byEmail) return byEmail;
    }

    return null;
  }, [agents, currentUser]);

  const isTicketAssignedToCurrentUser = (ticket: any) => {
    if (!currentUser) return false;
    const assigneeName = getAssigneeName(ticket.assignedTo);
    const assignedAgentId =
      (ticket as any).agentId ?? (ticket.assignedTo as any)?.id ?? undefined;
    const assignedEmail =
      ((ticket.assignedTo as any)?.email || "").toLowerCase?.() || "";

    return (
      (!!currentAgent?.id && assignedAgentId === currentAgent.id) ||
      (assignedEmail &&
        (currentUser.email || "").toLowerCase() === assignedEmail) ||
      (currentUserFullName &&
        assigneeName.toLowerCase() === currentUserFullName)
    );
  };

  // Fetcher para SWR
  const ticketsFetcher = async (url: string) => {
    const response = await fetch(url);
    const result = await response.json();
    if (!result.success) {
      throw new Error(result.message || "Failed to load tickets");
    }
    return result.data;
  };

  const {
    data: tickets = [],
    error: swrError,
    isLoading,
    mutate,
  } = useSWR("/api/tickets", ticketsFetcher, {
    refreshInterval: 0,
    revalidateOnFocus: true,
    refreshWhenHidden: false,
    dedupingInterval: 2000,
    revalidateOnReconnect: true,
    shouldRetryOnError: false,
    compare: (a, b) => {
      return JSON.stringify(a) === JSON.stringify(b);
    },
  });

  const myTicketsCount = useMemo(
    () =>
      tickets.filter((t: Ticket) => isTicketAssignedToCurrentUser(t)).length,
    [tickets, currentAgent, currentUser, currentUserFullName],
  );

  const fetchTickets = async () => {
    await mutate();
  };

  // Sincronizar error de SWR
  useEffect(() => {
    if (swrError) {
      setError(swrError.message || "Failed to load tickets");
    } else {
      setError(null);
    }
  }, [swrError]);

  const fetchYards = async () => {
    try {
      // Check if token is available before making request
      const token = typeof window !== "undefined" 
        ? (getCookie("auth-token") || localStorage.getItem("auth_token"))
        : null;
      
      if (!token) {
        if (process.env.NODE_ENV === "development") {
          console.warn("[tickets/page] fetchYards: No token available, skipping request");
        }
        return;
      }

      const data = await fetchFromBackend("/yards");
      // El backend puede devolver array directo o { data: [] }
      const yardsArray = Array.isArray(data) ? data : data?.data || [];
      setYards(yardsArray.filter((yard: any) => yard.isActive));
    } catch (err: any) {
      console.error("Failed to load yards", err);
      // Don't clear yards on 401 - let the auth system handle it
      if (err?.status !== 401) {
        setYards([]);
      }
    }
  };

  const fetchCustomers = async () => {
    try {
      const data = await fetchFromBackend("/customers?page=1&limit=100000");
      const items = Array.isArray(data) ? data : data?.data || [];
      setCustomers(items);
    } catch (err) {
      console.error("Failed to load customers", err);
      setCustomers([]);
    }
  };

  const fetchAgents = async () => {
    try {
      const response = await fetch("/api/agents");
      const result = await response.json();
      if (result?.success) {
        const list = result.data || [];
        setAgents(list.filter((agent: any) => agent.isActive !== false));
      } else {
        setAgents([]);
      }
    } catch (err) {
      console.error("Failed to load agents", err);
      setAgents([]);
    }
  };

  const fetchCampaigns = async () => {
    try {
      const data = await fetchFromBackend("/campaign?page=1&limit=200");
      const list = Array.isArray(data) ? data : data?.data || [];
      setCampaigns(list.filter((campaign: any) => campaign.isActive === true));
    } catch (err) {
      console.error("Failed to load campaigns", err);
      setCampaigns([]);
    }
  };

  // Detectar si el tab está activo para optimizar polling
  useEffect(() => {
    const handleVisibilityChange = () => {
      setIsTabActive(!document.hidden);
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, []);

  // Detectar nuevos tickets y mostrar notificación
  useEffect(() => {
    if (tickets.length > 0) {
      if (previousTicketCount > 0 && tickets.length > previousTicketCount) {
        const newCount = tickets.length - previousTicketCount;
        toast({
          title: "New Ticket" + (newCount > 1 ? "s" : ""),
          description: `${newCount} new ticket${
            newCount > 1 ? "s" : ""
          } created`,
          duration: 3000,
        });
      }
      setPreviousTicketCount(tickets.length);
    }
  }, [tickets.length, previousTicketCount]);

  useEffect(() => {
    const user = auth.getUser();
    if (user) {
      setCurrentUser(user);
    }
  }, []);

  useEffect(() => {
    // Wait for user to be authenticated before fetching data
    const user = auth.getUser();
    const token = typeof window !== "undefined" 
      ? (getCookie("auth-token") || localStorage.getItem("auth_token"))
      : null;
    
    if (user && token) {
      fetchYards();
      fetchCustomers();
      fetchAgents();
      fetchCampaigns();
    } else if (process.env.NODE_ENV === "development") {
      console.warn("[tickets/page] Skipping data fetch - user or token not available", {
        hasUser: !!user,
        hasToken: !!token,
      });
    }
  }, []);

  // Close all modals when route changes
  const pathname = usePathname();
  useEffect(() => {
    setShowCreateModal(false);
    setShowEditModal(false);
    setShowViewModal(false);
  }, [pathname]);

  // Handle "fromReport" parameter to show persistent toast with back button
  useEffect(() => {
    const fromReport = searchParams.get("fromReport");

    if (fromReport === "campaign") {
      const campaignId = searchParams.get("campaignId");
      const reportStartDate = searchParams.get("reportStartDate");
      const reportEndDate = searchParams.get("reportEndDate");

      // Apply campaign filter when coming from report
      if (campaignId) {
        setCampaignFilter(campaignId);
      }

      // Build the URL to return to the report with the same filters
      let reportUrl = "/reports/campaigns";
      if (campaignId && reportStartDate && reportEndDate) {
        reportUrl += `?campaignId=${campaignId}&startDate=${encodeURIComponent(
          reportStartDate,
        )}&endDate=${encodeURIComponent(reportEndDate)}`;
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
        duration: Infinity, // Toast without time limit
      });
    }
  }, [searchParams, router]);

  // Handle search parameter from URL - separate effect to ensure it runs immediately
  useEffect(() => {
    // Obtener el parámetro de búsqueda de la URL de dos formas para mayor robustez
    const searchParam = searchParams.get("search");
    let searchParamValue = searchParam ? decodeURIComponent(searchParam) : null;

    // También verificar directamente desde window.location como respaldo
    if (typeof window !== "undefined" && !searchParamValue) {
      const urlParams = new URLSearchParams(window.location.search);
      const urlSearchParam = urlParams.get("search");
      if (urlSearchParam) {
        searchParamValue = decodeURIComponent(urlSearchParam);
      }
    }

    // Get all search params for debugging
    const allParams: Record<string, string> = {};
    searchParams.forEach((value, key) => {
      allParams[key] = value;
    });

    console.log("🔍 [Tickets Page] Search effect triggered:", {
      searchParam,
      searchParamValue,
      allParams,
      searchParamsString: searchParams.toString(),
      currentSearch: search,
      windowLocation:
        typeof window !== "undefined" ? window.location.href : "N/A",
    });

    // Sincronizar el estado del search con el parámetro de la URL
    // Solo actualizar si el valor es diferente para evitar renders innecesarios
    if (searchParamValue !== null && searchParamValue.trim() !== "") {
      if (searchParamValue !== search) {
        console.log("🔍 [Tickets Page] Setting search from URL:", {
          searchParam,
          searchParamValue,
          currentSearch: search,
          willUpdate: true,
        });
        setSearch(searchParamValue);
        console.log("✅ [Tickets Page] Search updated to:", searchParamValue);
      }
    } else if (!searchParamValue && search) {
      // Si no hay parámetro de búsqueda en la URL y el search tiene valor, limpiarlo
      console.log("ℹ️ [Tickets Page] No search param in URL, clearing search");
      setSearch("");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  // Extract URL params as stable values for dependencies
  const ticketIdParam = searchParams.get("id");
  const customerIdParam = searchParams.get("customerId");
  const viewParam = searchParams.get("view");
  const ticketsLength = tickets.length;

  // Handle URL parameters for filtering
  useEffect(() => {
    console.log("🔵 [Tickets Page] URL params effect triggered:", {
      ticketIdParam,
      customerIdParam,
      viewParam,
      ticketsLength,
      processedTicketId: processedTicketIdRef.current,
    });

    // 1. Check for view param first
    if (viewParam) {
      setActiveView(viewParam);
    }

    if (!ticketsLength) {
      console.log("⏳ [Tickets Page] Waiting for tickets to load...");
      return;
    }

    if (ticketIdParam) {
      // Solo procesar si es un ticketId diferente al que ya procesamos
      if (processedTicketIdRef.current === ticketIdParam) {
        console.log("⏭️ [Tickets Page] Ticket already processed, skipping");
        return; // Ya procesamos este ticketId, no hacer nada
      }

      console.log("🔍 [Tickets Page] Looking for ticket:", ticketIdParam);
      // Filter and open specific ticket
      const ticket = tickets.find(
        (t: Ticket) => t.id.toString() === ticketIdParam,
      );
      if (ticket) {
        console.log("✅ [Tickets Page] Ticket found, opening modal:", {
          ticketId: ticket.id,
          hasYard: !!ticket.yardId,
        });
        processedTicketIdRef.current = ticketIdParam; // Marcar como procesado
        setUrlTicketId(ticketIdParam);
        setSelectedTicket(ticket);
        setShowDetails(true);
        // Open the appropriate modal based on whether ticket has a yard
        if (ticket.yardId) {
          setShowViewModal(true);
        } else {
          setShowEditModal(true);
        }
      } else {
        console.log("❌ [Tickets Page] Ticket not found:", ticketIdParam);
      }
    } else if (customerIdParam) {
      // Filter by customer ID
      setUrlCustomerId(customerIdParam);
      processedTicketIdRef.current = null; // Reset cuando no hay ticketId
    } else {
      // Si no hay ticketId ni customerId en la URL, resetear ambos
      processedTicketIdRef.current = null;
      if (urlCustomerId) {
        console.log(
          "🔄 [Tickets Page] Clearing customer filter - no customerId in URL",
        );
        setUrlCustomerId(null);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ticketIdParam, customerIdParam, viewParam, ticketsLength]);

  const selectedYard = useMemo(() => {
    return yards.find((y) => y.id.toString() === selectedYardId);
  }, [selectedYardId, yards]);

  const currentYard = useMemo(() => {
    if (!selectedTicket?.yardId) return null;
    return yards.find(
      (y) => y.id.toString() === selectedTicket.yardId?.toString(),
    );
  }, [selectedTicket?.yardId, yards]);

  const filteredYards = useMemo(() => {
    return yards.filter((yard) => {
      const matchesSearch =
        yardSearch === "" ||
        yard.name.toLowerCase().includes(yardSearch.toLowerCase()) ||
        yard.propertyAddress.toLowerCase().includes(yardSearch.toLowerCase());

      const matchesCategory =
        yardCategory === "all" || yard.yardType === yardCategory;

      return matchesSearch && matchesCategory;
    });
  }, [yardSearch, yardCategory, yards]);

  const filteredCampaignsEdit = useMemo(() => {
    const term = campaignSearchEdit.toLowerCase();
    return campaigns.filter((campaign) =>
      campaign.nombre.toLowerCase().includes(term),
    );
  }, [campaigns, campaignSearchEdit]);

  const filteredAgentsEdit = useMemo(() => {
    const term = agentSearchEdit.toLowerCase();
    return agents.filter(
      (agent) =>
        agent.name.toLowerCase().includes(term) ||
        (agent.email || "").toLowerCase().includes(term),
    );
  }, [agents, agentSearchEdit]);

  const filteredCampaignFilterOptions = useMemo(() => {
    const term = campaignFilterSearch.toLowerCase();
    return campaigns.filter((c) => c.nombre.toLowerCase().includes(term));
  }, [campaigns, campaignFilterSearch]);

  const filteredYardFilterOptions = useMemo(() => {
    const term = yardFilterSearch.toLowerCase();
    return yards.filter((y) => y.name.toLowerCase().includes(term));
  }, [yards, yardFilterSearch]);

  const filteredAgentFilterOptions = useMemo(() => {
    const term = agentFilterSearch.toLowerCase();
    return agents.filter(
      (a) =>
        a.name.toLowerCase().includes(term) ||
        (a.email || "").toLowerCase().includes(term),
    );
  }, [agents, agentFilterSearch]);

  // Función auxiliar para calcular tickets filtrados por vista
  const getFilteredCountForView = useMemo(() => {
    const currentCustomerIdParam = searchParams.get("customerId");

    return (viewType: string) => {
      return tickets.filter((ticket: Ticket) => {
        // Filtro por cliente (si existe en URL)
        if (currentCustomerIdParam) {
          const matchesCustomer =
            ticket.customerId &&
            ticket.customerId.toString() === currentCustomerIdParam;
          if (!matchesCustomer) return false;
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
        const isAssignedToMe = isTicketAssignedToCurrentUser(ticket);

        const searchLower = search ? search.toLowerCase().trim() : "";
        const searchTrimmed = search ? search.trim() : "";
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

        const matchesStatus =
          statusFilter === "all" || status === normalizeEnumValue(statusFilter);
        const matchesPriority =
          priorityFilter === "all" ||
          ticket.priority === priorityFilter ||
          priority === priorityFilter.toUpperCase();
        const directionFilterValue = directionFilter.toLowerCase();
        const ticketDirection = ticket.direction
          ? ticket.direction.toString().toLowerCase()
          : "";
        const matchesDirection =
          directionFilter === "all" ||
          ticket.direction === directionFilter ||
          ticketDirection === directionFilterValue;
        const ticketCampaignId =
          ticket.campaignId ??
          (ticket.campaign && typeof ticket.campaign === "object"
            ? (ticket.campaign as any).id
            : null);
        const matchesCampaign =
          campaignFilter === "all" ||
          (ticketCampaignId && ticketCampaignId.toString() === campaignFilter);

        const ticketYardId =
          ticket.yardId ??
          (ticket.yard && typeof ticket.yard === "object"
            ? (ticket.yard as any).id
            : null);
        const matchesYard =
          yardFilter === "all" ||
          (ticketYardId && ticketYardId.toString() === yardFilter);

        const ticketAgentId =
          ticket.agentId ??
          (ticket.assignedTo && typeof ticket.assignedTo === "object"
            ? (ticket.assignedTo as any).id
            : null);

        const matchesAgent =
          agentFilter === "all" ||
          (ticketAgentId && ticketAgentId.toString() === agentFilter);

        const matchesDisposition =
          dispositionFilter === "all" ||
          ticket.disposition === dispositionFilter;

        // Date range filter
        let matchesDate = true;
        if (dateRange?.from) {
          const ticketDate = new Date(ticket.createdAt);
          const from = startOfDay(dateRange.from);
          const to = dateRange.to
            ? endOfDay(dateRange.to)
            : endOfDay(dateRange.from);
          matchesDate = isWithinInterval(ticketDate, { start: from, end: to });
        }

        const isMissed = isMissedCall(ticket);

        // Aplicar filtro de vista específico
        let matchesView = true;
        if (viewType === "missed") {
          matchesView = isMissed;
        } else if (viewType === "assigned_me") {
          matchesView = isAssignedToMe && !isMissed;
        } else if (viewType === "unassigned") {
          matchesView = !ticket.assignedTo && !isMissed;
        } else if (viewType === "assigned") {
          matchesView = !!ticket.assignedTo && !isMissed;
        } else if (viewType === "high_priority") {
          matchesView = Boolean(
            !isMissed &&
            status !== "CLOSED" &&
            status !== "RESOLVED" &&
            (priority === "HIGH" ||
              (ticket.priority &&
                ticket.priority.toString().toUpperCase() === "HIGH") ||
              priority === "EMERGENCY" ||
              (ticket.priority &&
                ticket.priority.toString().toUpperCase() === "EMERGENCY")),
          );
        } else if (viewType === "all") {
          matchesView = !isMissed;
        }

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
    search,
    statusFilter,
    priorityFilter,
    directionFilter,
    dispositionFilter,
    campaignFilter,
    yardFilter,
    agentFilter,
    dateRange,
    searchParams,
    currentAgent,
    currentUser,
    currentUserFullName,
  ]);

  const filteredTickets = useMemo(() => {
    console.log("🔎 [Tickets Page] Filtering tickets with search:", {
      search,
      ticketsCount: tickets.length,
      searchLength: search.length,
    });

    // Verificar si customerId está en la URL actual
    const currentCustomerIdParam = searchParams.get("customerId");

    const filtered = tickets.filter((ticket: Ticket) => {
      // ⚠️ ELIMINADO EL FILTRO ESTRICTO POR ID AQUÍ
      // if (urlTicketId) { ... } -> Borrado para que se vea la lista completa

      // Primero verificar si el ticket pertenece al cliente (si hay customerId en la URL)
      // Pero NO hacer return temprano, continuar con los demás filtros
      if (currentCustomerIdParam) {
        const matchesCustomer =
          ticket.customerId &&
          ticket.customerId.toString() === currentCustomerIdParam;
        if (!matchesCustomer) {
          return false; // Si no coincide con el cliente, excluir el ticket
        }
        // Si coincide, continuar con los demás filtros
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
      const assigneeName = getAssigneeName(ticket.assignedTo);
      const isAssignedToMe = isTicketAssignedToCurrentUser(ticket);

      const searchLower = search ? search.toLowerCase().trim() : "";
      const searchTrimmed = search ? search.trim() : "";
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
        : true; // Si no hay search, mostrar todos

      const matchesStatus =
        statusFilter === "all" || status === normalizeEnumValue(statusFilter);
      const matchesPriority =
        priorityFilter === "all" ||
        ticket.priority === priorityFilter ||
        priority === priorityFilter.toUpperCase();
      const directionFilterValue = directionFilter.toLowerCase();
      const ticketDirection = ticket.direction
        ? ticket.direction.toString().toLowerCase()
        : "";
      const matchesDirection =
        directionFilter === "all" ||
        ticket.direction === directionFilter ||
        ticketDirection === directionFilterValue;
      const ticketCampaignId =
        ticket.campaignId ??
        (ticket.campaign && typeof ticket.campaign === "object"
          ? (ticket.campaign as any).id
          : null);
      const matchesCampaign =
        campaignFilter === "all" ||
        (ticketCampaignId && ticketCampaignId.toString() === campaignFilter);

      const ticketYardId =
        ticket.yardId ??
        (ticket.yard && typeof ticket.yard === "object"
          ? (ticket.yard as any).id
          : null);
      const matchesYard =
        yardFilter === "all" ||
        (ticketYardId && ticketYardId.toString() === yardFilter);

      // --- AGREGAR ESTO ---
      // Verificamos ticket.agentId o ticket.assignedTo.id
      const ticketAgentId =
        ticket.agentId ??
        (ticket.assignedTo && typeof ticket.assignedTo === "object"
          ? (ticket.assignedTo as any).id
          : null);

      const matchesAgent =
        agentFilter === "all" ||
        (ticketAgentId && ticketAgentId.toString() === agentFilter);
      // --------------------

      const matchesDisposition =
        dispositionFilter === "all" || ticket.disposition === dispositionFilter;

      // Date range filter
      let matchesDate = true;
      if (dateRange?.from) {
        const ticketDate = new Date(ticket.createdAt);
        const from = startOfDay(dateRange.from);
        const to = dateRange.to
          ? endOfDay(dateRange.to)
          : endOfDay(dateRange.from);
        matchesDate = isWithinInterval(ticketDate, { start: from, end: to });
      }

      const isMissed = isMissedCall(ticket);

      let matchesView = true;
      if (activeView === "missed" || directionFilterValue === "missed") {
        matchesView = isMissed;
      } else if (activeView === "assigned_me") {
        matchesView = isAssignedToMe;
      } else if (activeView === "unassigned") {
        matchesView = !ticket.assignedTo;
      } else if (activeView === "assigned") {
        matchesView = !!ticket.assignedTo;
      } else if (activeView === "high_priority") {
        matchesView =
          priority === "HIGH" ||
          (ticket.priority &&
            ticket.priority.toString().toUpperCase() === "HIGH") ||
          priority === "EMERGENCY" ||
          (ticket.priority &&
            ticket.priority.toString().toUpperCase() === "EMERGENCY") ||
          false;
      }

      if (activeView !== "missed" && directionFilterValue !== "missed") {
        matchesView = matchesView && !isMissed;
      }

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
    });

    console.log("✅ [Tickets Page] Filtered tickets result:", {
      originalCount: tickets.length,
      filteredCount: filtered.length,
      search,
      hasSearch: !!search,
    });

    if (activeView === "high_priority") {
      return filtered.sort((a: Ticket, b: Ticket) => {
        const statusA = normalizeEnumValue(a.status);
        const statusB = normalizeEnumValue(b.status);
        if (statusA === "CLOSED" && statusB !== "CLOSED") return 1;
        if (statusA !== "CLOSED" && statusB === "CLOSED") return -1;
        return 0;
      });
    }
    return filtered;
  }, [
    tickets,
    search,
    statusFilter,
    priorityFilter,
    directionFilter,
    dispositionFilter,
    activeView,
    campaignFilter,
    yardFilter,
    agentFilter,
    currentAgent,
    currentUser,
    currentUserFullName,
    campaigns,
    urlTicketId,
    searchParams,
    dateRange,
  ]);

  const totalPages = Math.ceil(filteredTickets.length / itemsPerPage);
  const paginatedTickets = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredTickets.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredTickets, currentPage, itemsPerPage]);

  // Helper para obtener tickets filtrados por cliente (si hay customerId en la URL)
  const getCustomerFilteredTickets = useMemo(() => {
    const currentCustomerIdParam = searchParams.get("customerId");
    if (!currentCustomerIdParam) {
      return tickets; // Si no hay customerId, devolver todos los tickets
    }
    return tickets.filter(
      (t: Ticket) =>
        t.customerId && t.customerId.toString() === currentCustomerIdParam,
    );
  }, [tickets, searchParams]);

  useEffect(() => {
    setCurrentPage(1);
  }, [
    search,
    statusFilter,
    priorityFilter,
    directionFilter,
    activeView,
    campaignFilter,
    yardFilter,
    agentFilter,
  ]);

  // Función para manejar el cambio de vista y limpiar el filtro de cliente si no está en la URL
  const handleViewChange = (view: string) => {
    const currentCustomerIdParam = searchParams.get("customerId");
    // Si el usuario cambia de vista manualmente y no hay customerId en la URL, limpiar el filtro
    if (!currentCustomerIdParam) {
      if (urlCustomerId) {
        console.log(
          "🔄 [Tickets Page] Clearing customer filter on view change",
        );
        setUrlCustomerId(null);
      }
      // También limpiar el parámetro de la URL si existe
      if (typeof window !== "undefined") {
        const currentUrl = new URL(window.location.href);
        if (currentUrl.searchParams.has("customerId")) {
          currentUrl.searchParams.delete("customerId");
          router.replace(currentUrl.pathname + currentUrl.search, {
            scroll: false,
          });
        }
      }
    }
    setActiveView(view);
  };

  const handleViewDetails = async (ticket: Ticket) => {
    // Obtener el ticket completo desde el backend para asegurar que tenga callHistory
    try {
      const response = await fetch(`/api/tickets/${ticket.id}`);
      if (response.ok) {
        const result = await response.json();
        if (result.success && result.data) {
          ticket = { ...ticket, ...result.data }; // Actualizar con datos completos del backend
        }
      }
    } catch (error) {
      console.error("Error fetching full ticket data:", error);
      // Continuar con el ticket de la lista si falla la petición
    }

    setSelectedTicket(ticket);
    setSelectedYardId(ticket.yardId || "");
    setAttachmentFiles([]);
    setWasIssueDetailFilled(Boolean(ticket.issueDetail?.trim()));
    setIsIssueDetailEditing(false);

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

    setEditData({
      disposition: ticket.disposition || "",
      issueDetail: ticket.issueDetail || "",
      campaignOption:
        (ticket as any).campaignOption ||
        (ticket as any).onboardingOption ||
        "",
      status: ticket.status?.toString().toUpperCase().replace(" ", "_") || "",
      priority: ticket.priority?.toString().toUpperCase() || "",
      attachments: ticket.attachments || [],
      agentId: ticketAgentId,
      campaignId: ticketCampaignId,
    });

    // Cargar datos en el formulario de edición
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

    // Si el ticket tiene yarda o está cerrado, abre ViewTicketModal; si no, abre EditTicketModal
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

    setYardSearch("");
    setYardCategory("all");
    setCampaignSearchEdit("");
    setAgentSearchEdit("");
    setCustomerSearchEdit("");
    setYardSearchEdit("");
  };

  const handleUpdateTicket = async () => {
    if (!selectedTicket) return;

    try {
      setIsUpdating(true);

      const updatePayload: any = {
        ...editData,
        yardId: selectedYardId ? parseInt(selectedYardId) : null,
        status: editData.status?.toUpperCase().replace(" ", "_"),
        priority: editData.priority?.toUpperCase(),
        disposition: editData.disposition || null,
        campaignOption: editData.campaignOption || null,
        issueDetail: editData.issueDetail || null,
        campaignId:
          editData.campaignId && editData.campaignId !== "none"
            ? Number(editData.campaignId)
            : undefined,
        agentId:
          editData.agentId && editData.agentId !== "none"
            ? Number(editData.agentId)
            : undefined,
      };

      const response = await fetch(`/api/tickets/${selectedTicket.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(updatePayload),
      });

      const result = await response.json();

      if (result.success) {
        const updatedTicket = { ...selectedTicket, ...result.data };

        mutate(
          (currentTickets: Ticket[]) =>
            currentTickets.map((t) =>
              t.id === updatedTicket.id ? updatedTicket : t,
            ),
          false,
        );

        setSelectedTicket(updatedTicket);

        if (attachmentFiles.length > 0) {
          await handleUploadAttachments(updatedTicket);
        }

        toast({
          title: "Success",
          description: (
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-green-500" />
              <span>Ticket updated successfully</span>
            </div>
          ),
        });

        setShowDetails(false);
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

      // Log para debug
      console.log("Update payload:", updatePayload);

      const response = await fetch(`/api/tickets/${selectedTicket.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
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
            {
              method: "POST",
              body: formData,
            },
          );
          const uploadResult = await uploadResponse.json();

          if (uploadResult?.success) {
            updatedTicket = { ...updatedTicket, ...uploadResult.data };
          }
        }

        mutate(
          (currentTickets: Ticket[]) =>
            currentTickets.map((t) =>
              t.id === updatedTicket.id ? updatedTicket : t,
            ),
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

  const handleUploadAttachments = async (ticketOverride?: Ticket) => {
    const targetTicket = ticketOverride || selectedTicket;
    if (!targetTicket || attachmentFiles.length === 0) return;

    try {
      setIsUploadingAttachments(true);
      const formData = new FormData();
      attachmentFiles.forEach((file) => formData.append("files", file));

      const response = await fetch(
        `/api/tickets/${targetTicket.id}/attachments`,
        {
          method: "POST",
          body: formData,
        },
      );
      const result = await response.json();

      if (result?.success) {
        const mergedTicket = {
          ...targetTicket,
          ...(result.data || {}),
          attachments:
            result.data?.attachments || targetTicket.attachments || [],
        };

        setSelectedTicket(mergedTicket);
        mutate(
          (currentTickets: Ticket[]) =>
            currentTickets.map((t) =>
              t.id === targetTicket.id ? mergedTicket : t,
            ),
          false,
        );
        setEditData((prev) => ({
          ...prev,
          attachments: mergedTicket.attachments || prev.attachments || [],
        }));
        setAttachmentFiles([]);
        toast({
          title: "Success",
          description: "Attachments uploaded successfully",
        });
      } else {
        toast({
          title: "Error",
          description: result?.message || "Failed to upload attachments",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Upload attachments error", error);
      toast({
        title: "Error",
        description: "An error occurred while uploading attachments",
        variant: "destructive",
      });
    } finally {
      setIsUploadingAttachments(false);
    }
  };

  const handleAssignYard = async () => {
    if (!selectedTicket || !selectedYardId) return;
    setIsAssigningYard(true);

    try {
      await new Promise((resolve) => setTimeout(resolve, 1000));

      if (selectedTicket && selectedYard) {
        const updatedYard = selectedYard.name;

        mutate(
          (currentTickets: Ticket[]) =>
            currentTickets.map((t) =>
              t.id === selectedTicket.id
                ? {
                    ...t,
                    yardId: selectedYardId,
                    yard: updatedYard,
                    yardType: selectedYard.yardType,
                  }
                : t,
            ),
          false,
        );

        setSelectedTicket((prev) =>
          prev
            ? {
                ...prev,
                yardId: selectedYardId,
                yard: updatedYard,
                yardType: selectedYard.yardType,
              }
            : null,
        );
      }
    } catch (err) {
      console.error("Assign yard error:", err);
    } finally {
      setIsAssigningYard(false);
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
    if (!createFormData.customerId) {
      errors.customerId = "Customer is required";
    }
    if (!createFormData.direction) {
      errors.direction = "Direction is required";
    }

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
        headers: {
          "Content-Type": "application/json",
        },
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
              {
                method: "POST",
                body: formData,
              },
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
          } catch (uploadError) {
            console.error("Upload attachments error:", uploadError);
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
        await mutate(); // Actualizar caché de SWR inmediatamente
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

  const hasIssueDetail = Boolean(editData.issueDetail?.trim());
  const isIssueDetailFilledForDisplay =
    hasIssueDetail && (wasIssueDetailFilled || !isIssueDetailEditing);
  const savedAttachments = selectedTicket?.attachments || [];
  const pendingAttachments = (editData.attachments || []).filter(
    (att) => !savedAttachments.includes(att),
  );
  const hasSavedAttachments = savedAttachments.length > 0;
  const hasPendingAttachments = pendingAttachments.length > 0;
  const hasYardAssigned = Boolean(selectedYardId || selectedTicket?.yardId);
  const selectedCampaignForEdit = (() => {
    if (editData.campaignId) {
      return campaigns.find(
        (campaign) => campaign.id.toString() === editData.campaignId,
      );
    }
    if (editData.campaignId) {
      return campaigns.find(
        (campaign) => campaign.id.toString() === editData.campaignId,
      );
    }
    if (
      selectedTicket?.campaign &&
      typeof selectedTicket.campaign === "object"
    ) {
      return selectedTicket.campaign;
    }
    if (selectedTicket?.campaignId) {
      return campaigns.find(
        (campaign) => campaign.id === selectedTicket.campaignId,
      );
    }
    return null;
  })();
  const selectedCampaignTypeForEdit = selectedCampaignForEdit?.tipo
    ?.toString()
    .toUpperCase();
  const isOnboardingCampaignForEdit =
    selectedCampaignTypeForEdit === ManagementType.ONBOARDING;
  const isArCampaignForEdit = selectedCampaignTypeForEdit === ManagementType.AR;
  const campaignOptionValuesForEdit = isOnboardingCampaignForEdit
    ? Object.values(OnboardingOption)
    : isArCampaignForEdit
      ? Object.values(ArOption)
      : [];

  const metadataFields = [
    {
      key: "status",
      filled: Boolean(editData.status),
      node: (
        <div className="space-y-1">
          <p className="text-sm font-medium text-muted-foreground">Status</p>
          <Select
            value={editData.status}
            onValueChange={(v) =>
              setEditData((prev) => ({ ...prev, status: v }))
            }
          >
            <SelectTrigger className="h-8">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.values(TicketStatus).map((s) => (
                <SelectItem key={s} value={s}>
                  {formatEnumLabel(s)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      ),
    },
    {
      key: "priority",
      filled: Boolean(editData.priority),
      node: (
        <div className="space-y-1">
          <p className="text-sm font-medium text-muted-foreground">Priority</p>
          <Select
            value={editData.priority}
            onValueChange={(v) =>
              setEditData((prev) => ({ ...prev, priority: v }))
            }
          >
            <SelectTrigger className="h-8">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.values(TicketPriority).map((p) => (
                <SelectItem key={p} value={p}>
                  {formatEnumLabel(p)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      ),
    },
    {
      key: "campaign",
      filled: Boolean(editData.campaignId && editData.campaignId !== "none"),
      node: (
        <div className="space-y-1">
          <p className="text-sm font-medium text-muted-foreground">Campaign</p>
          <Select
            value={editData.campaignId || "none"}
            onValueChange={(value) => {
              const selected =
                value === "none"
                  ? null
                  : campaigns.find(
                      (campaign) => campaign.id.toString() === value,
                    );
              const selectedType = selected?.tipo?.toString().toUpperCase();
              setEditData((prev) => ({
                ...prev,
                campaignId: value === "none" ? "none" : value,
                campaignOption:
                  selectedType === ManagementType.ONBOARDING ||
                  selectedType === ManagementType.AR
                    ? ""
                    : "",
              }));
            }}
          >
            <SelectTrigger className="h-8">
              <SelectValue placeholder="Select campaign" />
            </SelectTrigger>
            <SelectContent>
              <div className="p-2">
                <div className="relative">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search campaigns..."
                    className="pl-8"
                    value={campaignSearchEdit}
                    onChange={(e) => setCampaignSearchEdit(e.target.value)}
                    onClick={(e) => e.stopPropagation()}
                    onKeyDown={(e) => e.stopPropagation()}
                  />
                </div>
              </div>
              <ScrollArea className="h-64">
                <SelectItem value="none">No campaign</SelectItem>
                {filteredCampaignsEdit.length === 0 ? (
                  <div className="p-3 text-sm text-muted-foreground">
                    No campaigns found
                  </div>
                ) : (
                  filteredCampaignsEdit.map((campaign) => (
                    <SelectItem
                      key={campaign.id}
                      value={campaign.id.toString()}
                    >
                      {campaign.nombre}
                    </SelectItem>
                  ))
                )}
              </ScrollArea>
            </SelectContent>
          </Select>
        </div>
      ),
    },
    {
      key: "assignee",
      filled: Boolean(editData.agentId || selectedTicket?.assignedTo),
      node: (
        <div className="space-y-1">
          <p className="text-sm font-medium text-muted-foreground">Assignee</p>
          <Select
            value={editData.agentId || "none"}
            onValueChange={(value) =>
              setEditData((prev) => ({
                ...prev,
                agentId: value === "none" ? "" : value,
              }))
            }
          >
            <SelectTrigger className="h-8">
              <SelectValue
                placeholder={getAssigneeName(selectedTicket?.assignedTo)}
              />
            </SelectTrigger>
            <SelectContent>
              <div className="p-2">
                <div className="relative">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search agents..."
                    className="pl-8"
                    value={agentSearchEdit}
                    onChange={(e) => setAgentSearchEdit(e.target.value)}
                    onClick={(e) => e.stopPropagation()}
                  />
                </div>
              </div>
              <ScrollArea className="h-64">
                <SelectItem value="none">Unassigned</SelectItem>
                {filteredAgentsEdit.length === 0 ? (
                  <div className="p-3 text-sm text-muted-foreground">
                    No agents found
                  </div>
                ) : (
                  filteredAgentsEdit.map((agent) => (
                    <SelectItem key={agent.id} value={agent.id.toString()}>
                      <div className="flex flex-col">
                        <span className="text-sm font-medium">
                          {agent.name}
                        </span>
                        {agent.email && (
                          <span className="text-xs text-muted-foreground">
                            {agent.email}
                          </span>
                        )}
                      </div>
                    </SelectItem>
                  ))
                )}
              </ScrollArea>
            </SelectContent>
          </Select>
        </div>
      ),
    },
    {
      key: "direction",
      filled: true,
      node: (
        <div className="space-y-1">
          <p className="text-sm font-medium text-muted-foreground">Direction</p>
          <div className="flex items-center gap-2 h-8">
            {getDirectionIcon(selectedTicket?.direction || "inbound")}
            <span className="text-sm">
              {getDirectionText(
                selectedTicket?.direction || "inbound",
                (selectedTicket as any)?.originalDirection,
                selectedTicket?.agentId,
              )}
            </span>
          </div>
        </div>
      ),
    },
    {
      key: "disposition",
      filled: Boolean(editData.disposition),
      node: (
        <div className="space-y-1">
          <p className="text-sm font-medium text-muted-foreground">
            Disposition
          </p>
          <Select
            value={editData.disposition}
            onValueChange={(v) =>
              setEditData((prev) => ({ ...prev, disposition: v }))
            }
          >
            <SelectTrigger className="h-8">
              <SelectValue placeholder="Select disposition" />
            </SelectTrigger>
            <SelectContent>
              {Object.values(TicketDisposition).map((d) => (
                <SelectItem key={d} value={d}>
                  {formatEnumLabel(d)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      ),
    },
    campaignOptionValuesForEdit.length > 0
      ? {
          key: "campaignOption",
          filled: Boolean(editData.campaignOption),
          node: (
            <div className="space-y-1">
              <p className="text-sm font-medium text-muted-foreground">
                Campaign Option
              </p>
              <Select
                value={editData.campaignOption}
                onValueChange={(v) =>
                  setEditData((prev) => ({
                    ...prev,
                    campaignOption: v,
                  }))
                }
              >
                <SelectTrigger className="h-8">
                  <SelectValue placeholder="Select option" />
                </SelectTrigger>
                <SelectContent>
                  {campaignOptionValuesForEdit.map((o) => (
                    <SelectItem key={o} value={o}>
                      {formatEnumLabel(o)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          ),
        }
      : null,
  ].filter(Boolean) as { key: string; filled: boolean; node: JSX.Element }[];

  const baseFullFields = [
    {
      key: "customerInfo",
      filled: Boolean(
        selectedTicket?.customer || selectedTicket?.customerPhone,
      ),
      node: (
        <div className="space-y-2">
          <p className="text-sm font-medium text-muted-foreground">
            Customer Information
          </p>
          <div className="p-3 rounded-md border bg-muted/30 space-y-2">
            <div className="flex items-center gap-2">
              <User className="h-4 w-4 text-muted-foreground" />
              <span className="font-semibold">
                {getClientName(selectedTicket)}
              </span>
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <PhoneIncoming className="h-4 w-4" />
              <span>{getClientPhone(selectedTicket)}</span>
            </div>
            {selectedTicket?.customer?.email && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Mail className="h-4 w-4" />
                <span className="truncate">
                  {selectedTicket.customer.email}
                </span>
              </div>
            )}
          </div>
        </div>
      ),
    },
    {
      key: "yardAssignment",
      filled: hasYardAssigned,
      node: (
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              <p className="text-sm font-medium text-muted-foreground">
                Yard Assignment
              </p>
            </div>
            {!hasYardAssigned && (
              <Badge
                variant="outline"
                className="border-amber-500/30 text-amber-600"
              >
                Missing
              </Badge>
            )}
          </div>
          {!hasYardAssigned && (
            <div className="text-xs text-amber-600 flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" />
              <span>Action Required: No yard assigned</span>
            </div>
          )}
          {currentYard && (
            <div className="p-4 bg-emerald-50 dark:bg-emerald-500/10 rounded-lg border border-emerald-200 dark:border-emerald-500/20">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-emerald-100 dark:bg-emerald-900">
                    <Building className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                  </div>
                  <div>
                    <p className="font-medium">{currentYard.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {currentYard.propertyAddress ||
                        currentYard.propertyAddress}
                    </p>
                    <Badge variant="outline" className="mt-1">
                      {(currentYard.yardType || currentYard.yardType) ===
                        "SAAS" ||
                      (currentYard.yardType || currentYard.yardType) === "saas"
                        ? "SaaS"
                        : "Full Service"}
                    </Badge>
                  </div>
                </div>
                <CheckCircle2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
              </div>
            </div>
          )}

          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Select Yard</Label>
              <Select
                value={selectedYardId}
                onValueChange={(value) => setSelectedYardId(value)}
              >
                <SelectTrigger className="h-11 bg-muted/30 border-border/60">
                  <SelectValue placeholder="Select a yard...">
                    {selectedYard ? (
                      <div className="flex items-center gap-2">
                        <span className="truncate">{selectedYard.name}</span>
                        <Badge variant="outline" className="text-[10px]">
                          {(selectedYard.yardType || selectedYard.yardType) ===
                            "SAAS" ||
                          (selectedYard.yardType || selectedYard.yardType) ===
                            "saas"
                            ? "SaaS"
                            : "Full Service"}
                        </Badge>
                      </div>
                    ) : (
                      "Select a yard..."
                    )}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent className="p-0">
                  <div className="p-3 border-b border-border/60 bg-muted/20">
                    <div className="relative">
                      <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Search yards..."
                        className="pl-8 bg-background"
                        value={yardSearch}
                        onChange={(e) => setYardSearch(e.target.value)}
                        onClick={(e) => e.stopPropagation()}
                      />
                    </div>
                  </div>
                  <ScrollArea className="h-64">
                    {filteredYards.length === 0 ? (
                      <div className="p-4 text-center text-sm text-muted-foreground">
                        No yards found
                      </div>
                    ) : (
                      filteredYards.map((yard) => (
                        <SelectItem key={yard.id} value={yard.id.toString()}>
                          <div className="flex flex-col">
                            <span className="text-sm font-medium">
                              {yard.name}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              {yard.propertyAddress}
                            </span>
                          </div>
                        </SelectItem>
                      ))
                    )}
                  </ScrollArea>
                </SelectContent>
              </Select>
            </div>

            {selectedYard && (
              <div className="p-4 bg-blue-50 dark:bg-blue-500/10 rounded-lg border border-blue-200 dark:border-blue-500/20">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900">
                      <Building className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <p className="font-medium">{selectedYard.name}</p>
                        <Badge variant="outline">
                          {(selectedYard.yardType || selectedYard.yardType) ===
                            "SAAS" ||
                          (selectedYard.yardType || selectedYard.yardType) ===
                            "saas"
                            ? "SaaS"
                            : "Full Service"}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {selectedYard.propertyAddress ||
                          selectedYard.propertyAddress}
                      </p>

                      {(selectedYard.contactInfo ||
                        selectedYard.contactInfo) && (
                        <div className="flex items-center gap-2 mt-2 text-sm">
                          <span className="font-medium">Contact:</span>
                          <span>
                            {selectedYard.contactInfo ||
                              selectedYard.contactInfo}
                          </span>
                        </div>
                      )}

                      {selectedYard.notes && (
                        <div className="mt-2 p-2 bg-muted/30 rounded text-xs">
                          <span className="font-medium">Note: </span>
                          {selectedYard.notes}
                        </div>
                      )}
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => {
                      setSelectedYardId("");
                      setYardSearch("");
                    }}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      ),
    },
    {
      key: "issueDetail",
      filled: isIssueDetailFilledForDisplay,
      node: (
        <div className="space-y-2">
          <p className="text-sm font-medium text-muted-foreground">
            Issue Detail
          </p>
          <Textarea
            placeholder="Describe the issue..."
            value={editData.issueDetail || ""}
            onChange={(e) =>
              setEditData((prev) => ({
                ...prev,
                issueDetail: e.target.value,
              }))
            }
            onFocus={() => setIsIssueDetailEditing(true)}
            onBlur={() => setIsIssueDetailEditing(false)}
            onKeyDown={(event) => {
              if (event.key === "Tab") {
                event.preventDefault();
              }
            }}
            className="min-h-[100px] bg-muted/20"
          />
        </div>
      ),
    },
  ];

  const filledMetadataFields: Array<{ key: string; node: JSX.Element }> =
    metadataFields
      .filter((field) => field.filled)
      .map((field) => ({ key: field.key, node: field.node }));
  const missingMetadataFields: Array<{ key: string; node: JSX.Element }> =
    metadataFields
      .filter((field) => !field.filled)
      .map((field) => ({ key: field.key, node: field.node }));
  const filledFullFields: Array<{ key: string; node: JSX.Element }> =
    baseFullFields
      .filter((field) => field.filled)
      .map((field) => ({ key: field.key, node: field.node }));
  const missingFullFields: Array<{ key: string; node: JSX.Element }> =
    baseFullFields
      .filter((field) => !field.filled)
      .map((field) => ({ key: field.key, node: field.node }));

  const attachmentControlsNode = (
    <div className="space-y-2">
      <Label>Upload files</Label>
      <div className="flex flex-wrap items-center gap-3">
        <Input
          id="ticket-attachments-upload"
          type="file"
          multiple
          className="sr-only"
          onChange={(e) => {
            const files = Array.from(e.target.files || []);
            if (files.length === 0) return;
            setAttachmentFiles((prev) => [...prev, ...files]);
            e.currentTarget.value = "";
          }}
        />
        <Button asChild variant="outline" size="sm">
          <Label htmlFor="ticket-attachments-upload" className="cursor-pointer">
            Choose files
          </Label>
        </Button>
        <span className="text-xs text-muted-foreground">
          {attachmentFiles.length > 0
            ? `${attachmentFiles.length} file${
                attachmentFiles.length > 1 ? "s" : ""
              } selected`
            : ""}
        </span>
        <Button
          variant="secondary"
          size="sm"
          onClick={() => handleUploadAttachments()}
          disabled={attachmentFiles.length === 0 || isUploadingAttachments}
        >
          {isUploadingAttachments ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Uploading...
            </>
          ) : (
            <>
              <Upload className="mr-2 h-4 w-4" />
              Upload
            </>
          )}
        </Button>
      </div>
      <div className="flex flex-wrap gap-2">
        {attachmentFiles.map((file, idx) => (
          <Badge
            key={`${file.name}-${idx}`}
            variant="secondary"
            className="pl-3 pr-1 py-1 gap-2 group"
          >
            <span className="truncate max-w-[200px]">{file.name}</span>
            <Button
              variant="ghost"
              size="icon"
              className="h-4 w-4 hover:bg-transparent"
              onClick={() =>
                setAttachmentFiles((prev) => prev.filter((_, i) => i !== idx))
              }
            >
              <X className="h-3 w-3" />
            </Button>
          </Badge>
        ))}
        {attachmentFiles.length === 0 && (
          <p className="text-xs text-muted-foreground italic">
            No files selected
          </p>
        )}
      </div>

      {hasPendingAttachments && (
        <div className="flex flex-wrap gap-2 mt-2">
          {pendingAttachments.map((att, idx) => (
            <Badge
              key={`${att}-${idx}`}
              variant="secondary"
              className="pl-3 pr-1 py-1 gap-2 group"
            >
              <span className="truncate max-w-50">{att}</span>
              <Button
                variant="ghost"
                size="icon"
                className="h-4 w-4 hover:bg-transparent"
                onClick={() => {
                  setEditData((prev) => ({
                    ...prev,
                    attachments: (() => {
                      const next = [...(prev.attachments || [])];
                      const removeIndex = next.indexOf(att);
                      if (removeIndex >= 0) {
                        next.splice(removeIndex, 1);
                      }
                      return next;
                    })(),
                  }));
                }}
              >
                <X className="h-3 w-3" />
              </Button>
            </Badge>
          ))}
        </div>
      )}
    </div>
  );

  if (hasSavedAttachments) {
    filledFullFields.push({
      key: "attachmentsSaved",
      node: (
        <div className="space-y-4">
          <div className="space-y-2">
            {savedAttachments.map((att, idx) => (
              <div
                key={`${att}-${idx}`}
                className="flex items-center justify-between gap-2 rounded-md border border-border/60 bg-muted/20 px-3 py-2"
              >
                <span className="text-sm truncate">
                  {getAttachmentLabel(att)}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-2"
                  onClick={() => window.open(getAttachmentUrl(att), "_blank")}
                >
                  <Download className="h-4 w-4" />
                  Download
                </Button>
              </div>
            ))}
          </div>
          {attachmentControlsNode}
        </div>
      ),
    });
  } else {
    missingFullFields.push({
      key: "attachmentsPending",
      node: attachmentControlsNode,
    });
  }

  return (
    <div className="h-screen flex flex-col lg:flex-row gap-6 p-4">
      {/* Sidebar izquierdo */}
      <div className="w-full lg:w-48 flex-shrink-0 flex flex-col gap-4">
        {/* ... Sidebar content unchanged ... */}
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Ticketing</h2>
          <Button size="icon" variant="ghost">
            <SlidersHorizontal className="h-4 w-4" />
          </Button>
        </div>

        <Button
          onClick={() => setShowCreateModal(true)}
          className="w-full"
          size="sm"
        >
          <Plus className="mr-2 h-4 w-4" />
          New Ticket
        </Button>

        <div className="space-y-1">
          <Button
            variant={activeView === "all" ? "secondary" : "ghost"}
            className="w-full justify-start"
            onClick={() => handleViewChange("all")}
          >
            <RefreshCw
              className={`mr-2 h-4 w-4 ${isLoading ? "animate-spin" : ""}`}
            />
            All Tickets
            <span className="ml-auto text-xs">
              {getFilteredCountForView("all")}
            </span>
          </Button>
          <Button
            variant={activeView === "assigned" ? "secondary" : "ghost"}
            className="w-full justify-start"
            onClick={() => handleViewChange("assigned")}
          >
            <User className="mr-2 h-4 w-4" />
            Assigned
            <span className="ml-auto text-xs">
              {getFilteredCountForView("assigned")}
            </span>
          </Button>
          <Button
            variant={activeView === "assigned_me" ? "secondary" : "ghost"}
            className="w-full justify-start"
            onClick={() => handleViewChange("assigned_me")}
          >
            <User className="mr-2 h-4 w-4" />
            My Tickets
            <span className="ml-auto text-xs">
              {getFilteredCountForView("assigned_me")}
            </span>
          </Button>
          <Button
            variant={activeView === "unassigned" ? "secondary" : "ghost"}
            className="w-full justify-start"
            onClick={() => handleViewChange("unassigned")}
          >
            <Hash className="mr-2 h-4 w-4" />
            Unassigned
            <span className="ml-auto text-xs">
              {getFilteredCountForView("unassigned")}
            </span>
          </Button>
          <Button
            variant={activeView === "missed" ? "secondary" : "ghost"}
            className="w-full justify-start"
            onClick={() => handleViewChange("missed")}
          >
            <AlertTriangle className="mr-2 h-4 w-4" />
            Missed Calls
            <span className="ml-auto text-xs">
              {getFilteredCountForView("missed")}
            </span>
          </Button>
          <Button
            variant={activeView === "high_priority" ? "secondary" : "ghost"}
            className="w-full justify-start relative"
            onClick={() => handleViewChange("high_priority")}
          >
            <Star className="mr-2 h-4 w-4" />
            High Priority
            {(() => {
              const hasHighOpen = tickets.some((t: Ticket) => {
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
              });
              if (hasHighOpen) {
                return (
                  <span
                    className="ml-2 animate-pulse"
                    title="High/Emergency Priority Abierta"
                  >
                    <AlertTriangle className="h-4 w-4 text-amber-500" />
                  </span>
                );
              }
              return null;
            })()}
            <span className="ml-auto text-xs">
              {getFilteredCountForView("high_priority")}
            </span>
          </Button>
        </div>

        <div className="space-y-3">
          <h3 className="text-sm font-semibold">Filters</h3>
          <div className="space-y-2">
            <Label>Status</Label>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="All Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                {Object.values(TicketStatus).map((value) => (
                  <SelectItem key={value} value={value}>
                    {formatEnumLabel(value)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Priority</Label>
            <Select value={priorityFilter} onValueChange={setPriorityFilter}>
              <SelectTrigger>
                <SelectValue placeholder="All Priority" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Priority</SelectItem>
                <SelectItem value="High">High</SelectItem>
                <SelectItem value="Medium">Medium</SelectItem>
                <SelectItem value="Low">Low</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Agent</Label>
            <Select value={agentFilter} onValueChange={setAgentFilter}>
              <SelectTrigger>
                <SelectValue placeholder="All Agents" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Agents</SelectItem>
                {filteredAgentFilterOptions.map((agent) => (
                  <SelectItem key={agent.id} value={agent.id.toString()}>
                    {agent.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Direction</Label>
            <Select value={directionFilter} onValueChange={setDirectionFilter}>
              <SelectTrigger>
                <SelectValue placeholder="All Directions" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Directions</SelectItem>
                <SelectItem value="inbound">Inbound</SelectItem>
                <SelectItem value="outbound">Outbound</SelectItem>
                <SelectItem value="missed">Missed</SelectItem>
                <SelectItem value="text_message">Text Message</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Disposition</Label>
            <Select
              value={dispositionFilter}
              onValueChange={setDispositionFilter}
            >
              <SelectTrigger>
                <SelectValue placeholder="All Dispositions" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Dispositions</SelectItem>
                {Object.values(TicketDisposition).map((value) => (
                  <SelectItem key={value} value={value}>
                    {formatEnumLabel(value)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Campaign</Label>
            <Select value={campaignFilter} onValueChange={setCampaignFilter}>
              <SelectTrigger>
                <SelectValue placeholder="All Campaigns" />
              </SelectTrigger>
              <SelectContent>
                <div className="p-2">
                  <Input
                    placeholder="Search campaign..."
                    value={campaignFilterSearch}
                    onChange={(e) => setCampaignFilterSearch(e.target.value)}
                    className="h-8"
                  />
                </div>
                <SelectItem value="all">All Campaigns</SelectItem>
                {filteredCampaignFilterOptions.map((c) => (
                  <SelectItem key={c.id} value={c.id.toString()}>
                    {c.nombre}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Yard</Label>
            <Select value={yardFilter} onValueChange={setYardFilter}>
              <SelectTrigger>
                <SelectValue placeholder="All Yards" />
              </SelectTrigger>
              <SelectContent>
                <div className="p-2">
                  <Input
                    placeholder="Search yard..."
                    value={yardFilterSearch}
                    onChange={(e) => setYardFilterSearch(e.target.value)}
                    className="h-8"
                  />
                </div>
                <SelectItem value="all">All Yards</SelectItem>
                {filteredYardFilterOptions.map((y) => (
                  <SelectItem key={y.id} value={y.id.toString()}>
                    {y.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Main area */}
      <div className="flex-1 flex flex-col gap-4">
        {/* ... Main content search/table unchanged ... */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search tickets..."
              className="pl-9"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={`justify-start text-left font-normal h-9 px-3 text-sm whitespace-nowrap ${
                  !dateRange?.from ? "text-muted-foreground" : ""
                }`}
              >
                <Calendar className="mr-2 h-4 w-4 shrink-0" />
                {dateRange?.from ? (
                  dateRange.to ? (
                    <span className="truncate">
                      {format(dateRange.from, "MMM d")} –{" "}
                      {format(dateRange.to, "MMM d, yyyy")}
                    </span>
                  ) : (
                    <span>{format(dateRange.from, "MMM d, yyyy")}</span>
                  )
                ) : (
                  <span>Pick a date</span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="end">
              <div className="p-3 space-y-3">
                <CalendarWidget
                  mode="range"
                  selected={dateRange}
                  onSelect={setDateRange}
                  numberOfMonths={1}
                  disabled={{ after: new Date() }}
                  className="rounded-md"
                />
                {dateRange?.from && (
                  <div className="flex justify-end px-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 text-xs"
                      onClick={() => setDateRange(undefined)}
                    >
                      <X className="mr-1 h-3 w-3" />
                      Clear dates
                    </Button>
                  </div>
                )}
              </div>
            </PopoverContent>
          </Popover>
        </div>

        <div className="rounded-lg border overflow-hidden">
          <div className="max-h-[calc(100vh-12rem)] overflow-y-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[80px]">ID</TableHead>
                  <TableHead className="w-[150px]">Name</TableHead>
                  <TableHead className="w-[140px]">Yard</TableHead>
                  <TableHead className="w-[120px]">Number</TableHead>
                  <TableHead className="w-[120px]">Campaign</TableHead>
                  <TableHead className="w-[140px]">Assignee</TableHead>
                  <TableHead className="w-[100px]">Status</TableHead>
                  <TableHead className="w-[100px]">Priority</TableHead>
                  <TableHead className="w-[120px]">Created</TableHead>
                  <TableHead className="w-[100px]">Direction</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={10} className="h-24 text-center">
                      <div className="flex items-center justify-center">
                        <Loader2 className="h-6 w-6 animate-spin mr-2" />
                        Loading tickets...
                      </div>
                    </TableCell>
                  </TableRow>
                ) : filteredTickets.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={10}
                      className="h-24 text-center text-muted-foreground"
                    >
                      No tickets found.
                    </TableCell>
                  </TableRow>
                ) : (
                  paginatedTickets.map((ticket: Ticket) => {
                    const yardDisplayName = getYardDisplayName(ticket);
                    let yardType = ticket.yardType;

                    if (!yardType && ticket.yardId) {
                      const yardObj = yards.find(
                        (y) => y.id.toString() === ticket.yardId?.toString(),
                      );
                      if (yardObj) yardType = yardObj.yardType;
                    }

                    return (
                      <TableRow
                        key={ticket.id}
                        className="cursor-pointer hover:bg-muted/50"
                        onClick={() => handleViewDetails(ticket)}
                      >
                        <TableCell className="font-mono text-xs">
                          #{ticket.id}
                        </TableCell>
                        <TableCell>{getClientName(ticket)}</TableCell>
                        <TableCell>
                          {yardDisplayName ? (
                            <div className="flex flex-col gap-1">
                              <Badge
                                variant="outline"
                                className={`${getYardTypeColor(yardType)}`}
                              >
                                <div className="flex items-center gap-1">
                                  {getYardTypeIcon(yardType)}
                                  <span className="truncate max-w-[150px]">
                                    {yardDisplayName}
                                  </span>
                                </div>
                              </Badge>
                            </div>
                          ) : (
                            <div className="group relative inline-block">
                              <Badge
                                variant="outline"
                                className="border-amber-500/20 bg-amber-500/5 text-amber-600 animate-pulse"
                              >
                                <AlertTriangle className="mr-1 h-3 w-3" />
                                Pending
                              </Badge>
                              <div className="absolute z-10 hidden group-hover:block bg-white dark:bg-zinc-900 text-xs text-amber-700 dark:text-amber-300 border border-amber-400 rounded px-2 py-1 shadow-lg left-1/2 -translate-x-1/2 mt-2 whitespace-nowrap">
                                Yard pending assignment
                              </div>
                            </div>
                          )}
                        </TableCell>
                        <TableCell>{getClientPhone(ticket)}</TableCell>
                        <TableCell>
                          {getCampaign(ticket) ? (
                            <Badge variant="outline">
                              {getCampaign(ticket)}
                            </Badge>
                          ) : (
                            <Badge
                              variant="outline"
                              className="border-amber-500/20 bg-amber-500/5 text-amber-600 animate-pulse"
                            >
                              <AlertTriangle className="mr-1 h-3 w-3" />
                              Pending
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          {ticket.assignedTo ? (
                            <div className="flex items-center gap-2">
                              <Avatar className="h-6 w-6">
                                <AvatarFallback className="text-xs">
                                  {getAssigneeInitials(ticket.assignedTo)}
                                </AvatarFallback>
                              </Avatar>
                              <span className="text-sm">
                                {getAssigneeName(ticket.assignedTo)}
                              </span>
                            </div>
                          ) : (
                            <span className="text-sm text-muted-foreground">
                              Unassigned
                            </span>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant="outline"
                            className={getStatusBadgeColor(ticket.status)}
                          >
                            {formatEnumLabel(ticket.status)}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {ticket.priority ? (
                            <Badge
                              variant="outline"
                              className={getPriorityColor(ticket.priority)}
                            >
                              {formatEnumLabel(ticket.priority)}
                            </Badge>
                          ) : (
                            <span className="text-sm text-muted-foreground">
                              -
                            </span>
                          )}
                        </TableCell>
                        <TableCell>
                          {new Date(ticket.createdAt).toLocaleDateString(
                            "en-US",
                            {
                              month: "short",
                              day: "numeric",
                              year: "numeric",
                            },
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            {getDirectionIcon(ticket.direction || "inbound")}
                            <span className="text-xs">
                              {getDirectionText(
                                ticket.direction || "inbound",
                                (ticket as any).originalDirection,
                                ticket.agentId,
                              )}
                            </span>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </div>

        {/* Pagination */}
        {filteredTickets.length > 0 && (
          <div className="flex items-center justify-between px-2">
            <div className="flex items-center gap-2">
              <p className="text-sm text-muted-foreground">
                Showing {(currentPage - 1) * itemsPerPage + 1} to{" "}
                {Math.min(currentPage * itemsPerPage, filteredTickets.length)}{" "}
                of {filteredTickets.length} tickets
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Select
                value={itemsPerPage.toString()}
                onValueChange={(value) => {
                  setItemsPerPage(Number(value));
                  setCurrentPage(1);
                }}
              >
                <SelectTrigger className="h-8 w-[100px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="5">5 / page</SelectItem>
                  <SelectItem value="10">10 / page</SelectItem>
                  <SelectItem value="20">20 / page</SelectItem>
                  <SelectItem value="50">50 / page</SelectItem>
                </SelectContent>
              </Select>
              <div className="flex items-center gap-1">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(1)}
                  disabled={currentPage === 1}
                >
                  First
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    setCurrentPage((prev) => Math.max(prev - 1, 1))
                  }
                  disabled={currentPage === 1}
                >
                  Previous
                </Button>
                <span className="text-sm px-2">
                  Page {currentPage} of {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    setCurrentPage((prev) => Math.min(prev + 1, totalPages))
                  }
                  disabled={currentPage === totalPages}
                >
                  Next
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(totalPages)}
                  disabled={currentPage === totalPages}
                >
                  Last
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>

      <CreateTicketModal
        open={showCreateModal}
        onOpenChange={(open) => {
          setShowCreateModal(open);
          if (!open) resetCreateForm();
        }}
        customers={customers}
        yards={yards}
        agents={agents}
        campaigns={campaigns}
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
        getCampaign={getCampaign}
        getAttachmentUrl={getAttachmentUrl}
        getAttachmentLabel={getAttachmentLabel}
        getClientName={getClientName}
        getClientPhone={getClientPhone}
        getYardDisplayName={getYardDisplayName}
      />

      <EditTicketModal
        open={showEditModal}
        onOpenChange={setShowEditModal}
        ticket={selectedTicket}
        customers={customers}
        yards={yards}
        agents={agents}
        campaigns={campaigns}
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
        getAttachmentUrl={getAttachmentUrl}
      />
    </div>
  );
}
