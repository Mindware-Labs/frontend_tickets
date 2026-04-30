"use client";

import { Fragment, useEffect, useMemo, useState } from "react";
import { fetchFromBackend } from "@/lib/api-client";
import {
  ListFilter,
  Ticket as TicketIcon,
  FolderOpen,
  Phone,
  User,
  Calendar,
  ArrowRight,
  Inbox,
  Search,
  X,
  XCircle,
  ChevronDown,
  FileText,
  Loader2,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { Ticket } from "./types";
import { cn } from "@/lib/utils";

type YardCallsModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  yardName: string;
  yardId?: number | string | null;
  reportStartDate?: string;
  reportEndDate?: string;
  tickets?: Ticket[];
  dispositionCounts?: { disposition: string; count: number }[];
};

type CustomerTicketGroup = {
  key: string;
  customerLabel: string;
  phoneLabel: string;
  tickets: Ticket[];
  latestTicket: Ticket;
  latestDateMs: number;
};

const normalizeDisposition = (value?: string | null) =>
  (value || "UNSPECIFIED").toUpperCase();

const normalizeStatusLabelValue = (value?: string | null) => {
  const key = (value || "").toUpperCase().replace(/\s+/g, "_");
  return key === "OPEN" || key === "IN_PROGRESS" ? "ACTIVE" : value;
};

const formatLabel = (value?: string | null) =>
  (normalizeStatusLabelValue(value) || "Unspecified")
    .toLowerCase()
    .replace(/_/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());

const formatDate = (value?: string | null) => {
  if (!value) return "-";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "-";
  return parsed.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const getCustomerLabel = (ticket: Ticket) => {
  if (ticket.customer?.name) return ticket.customer.name;
  if (ticket.customerPhone) return ticket.customerPhone;
  if (ticket.customer?.phone) return ticket.customer.phone;
  if (ticket.customerId) return `Customer #${ticket.customerId}`;
  return "Unknown";
};

const getPhoneLabel = (ticket: Ticket) =>
  ticket.customer?.phone || ticket.customerPhone || ticket.phone || "-";

const getAgentLabel = (ticket: Ticket) =>
  ticket.assignedTo?.name || ticket.agent?.name || "Unassigned";

const getTicketDateMs = (ticket: Ticket) =>
  new Date(ticket.createdAt || ticket.updatedAt || 0).getTime();

const getCustomerGroupKey = (ticket: Ticket) => {
  const rawCustomerId = ticket.customer?.id ?? ticket.customerId;
  if (rawCustomerId !== null && rawCustomerId !== undefined) {
    return `id:${rawCustomerId}`;
  }

  const normalizedPhone = (getPhoneLabel(ticket) || "")
    .toLowerCase()
    .replace(/\s+/g, "");
  if (normalizedPhone && normalizedPhone !== "-") {
    return `phone:${normalizedPhone}`;
  }

  const normalizedName = (getCustomerLabel(ticket) || "").toLowerCase().trim();
  if (normalizedName && normalizedName !== "unknown") {
    return `name:${normalizedName}`;
  }

  return `ticket:${ticket.id}`;
};

// Utilidades para colores semánticos en la tabla
const getStatusColor = (status?: string | null) => {
  const s = (status || "").toUpperCase();
  if (s === "ACTIVE" || s === "OPEN" || s === "IN_PROGRESS" || s === "NEW")
    return "bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-800";
  if (s === "PENDING")
    return "bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-800";
  if (s === "CLOSED" || s === "RESOLVED")
    return "bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-800";
  return "bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700";
};

const getPriorityColor = (priority?: string | null) => {
  const p = (priority || "").toUpperCase();
  if (p === "HIGH" || p === "URGENT")
    return "bg-rose-100 text-rose-700 border-rose-200 dark:bg-rose-900/30 dark:text-rose-400 dark:border-rose-800";
  if (p === "MEDIUM" || p === "NORMAL")
    return "bg-orange-100 text-orange-700 border-orange-200 dark:bg-orange-900/30 dark:text-orange-400 dark:border-orange-800";
  if (p === "LOW")
    return "bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700";
  return "bg-muted text-muted-foreground border-border";
};

export function YardCallsModal({
  open,
  onOpenChange,
  yardName,
  yardId,
  reportStartDate,
  reportEndDate,
  tickets = [],
  dispositionCounts = [],
}: YardCallsModalProps) {
  const [activeTab, setActiveTab] = useState("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState("");
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [expandedCustomerGroups, setExpandedCustomerGroups] = useState<
    Record<string, boolean>
  >({});
  const [selectedIssueTicket, setSelectedIssueTicket] = useState<Ticket | null>(
    null,
  );
  const [showIssueDetailDialog, setShowIssueDetailDialog] = useState(false);
  const [serverTickets, setServerTickets] = useState<Ticket[]>([]);
  const [serverLoading, setServerLoading] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalTickets, setTotalTickets] = useState(0);

  const isServerMode = Boolean(yardId);
  const pageSize = 100;

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      setDebouncedSearchQuery(searchQuery.trim());
    }, 250);

    return () => window.clearTimeout(timeout);
  }, [searchQuery]);

  useEffect(() => {
    if (!open) return;
    setCurrentPage(1);
  }, [activeTab, debouncedSearchQuery, open]);

  useEffect(() => {
    if (!open) {
      return;
    }
    if (!isServerMode || !yardId) {
      setServerTickets([]);
      setServerLoading(false);
      setServerError(null);
      setTotalPages(1);
      setTotalTickets(tickets.length);
      return;
    }

    let cancelled = false;

    const fetchPage = async () => {
      try {
        setServerLoading(true);
        setServerError(null);

        const params = new URLSearchParams({
          page: String(currentPage),
          limit: String(pageSize),
          sortBy: "createdAt",
          order: "DESC",
        });

        if (reportStartDate) params.set("start", reportStartDate);
        if (reportEndDate) params.set("end", reportEndDate);
        if (debouncedSearchQuery) params.set("search", debouncedSearchQuery);
        if (activeTab !== "ALL") params.set("disposition", activeTab);

        const response = await fetchFromBackend(
          `/yards/${yardId}/tickets?${params.toString()}`,
        );
        if (cancelled) return;

        const pageTickets: Ticket[] = Array.isArray(response)
          ? response
          : response?.data || [];
        const responseTotal = Array.isArray(response)
          ? pageTickets.length
          : Number(response?.total) || 0;
        const responseTotalPages = Array.isArray(response)
          ? 1
          : Math.max(1, Number(response?.totalPages) || 1);

        setServerTickets(pageTickets);
        setTotalTickets(responseTotal);
        setTotalPages(responseTotalPages);

        if (currentPage > responseTotalPages) {
          setCurrentPage(responseTotalPages);
        }
      } catch (error: any) {
        if (cancelled) return;
        console.error("Error loading yard tickets page:", error);
        setServerTickets([]);
        setTotalTickets(0);
        setTotalPages(1);
        setServerError(error?.message || "Failed to load tickets");
      } finally {
        if (!cancelled) {
          setServerLoading(false);
        }
      }
    };

    fetchPage();
    return () => {
      cancelled = true;
    };
  }, [
    open,
    isServerMode,
    yardId,
    reportStartDate,
    reportEndDate,
    currentPage,
    debouncedSearchQuery,
    activeTab,
    tickets.length,
  ]);

  const sourceTickets = useMemo(
    () => (isServerMode ? serverTickets : tickets),
    [isServerMode, serverTickets, tickets],
  );

  const sortedTickets = useMemo(() => {
    return [...sourceTickets].sort((left, right) => {
      const leftDate = new Date(
        left.createdAt || left.updatedAt || 0,
      ).getTime();
      const rightDate = new Date(
        right.createdAt || right.updatedAt || 0,
      ).getTime();
      return rightDate - leftDate;
    });
  }, [sourceTickets]);

  const dispositionGroups = useMemo(() => {
    const groups = new Map<string, Ticket[]>();

    sortedTickets.forEach((ticket) => {
      const key = normalizeDisposition(ticket.disposition);
      const existing = groups.get(key);
      if (existing) {
        existing.push(ticket);
      } else {
        groups.set(key, [ticket]);
      }
    });

    return Array.from(groups.entries()).sort((left, right) => {
      if (right[1].length !== left[1].length)
        return right[1].length - left[1].length;
      return left[0].localeCompare(right[0]);
    });
  }, [sortedTickets]);

  const dispositionMap = useMemo(
    () => new Map<string, Ticket[]>(dispositionGroups),
    [dispositionGroups],
  );

  const tabs = useMemo(() => {
    if (
      isServerMode &&
      dispositionCounts.length > 0 &&
      !debouncedSearchQuery
    ) {
      const keys = dispositionCounts
        .filter((item) => item.count > 0)
        .map((item) => normalizeDisposition(item.disposition));
      return ["ALL", ...keys];
    }

    return ["ALL", ...dispositionGroups.map(([key]) => key)];
  }, [isServerMode, dispositionCounts, debouncedSearchQuery, dispositionGroups]);

  const tabCounts = useMemo(() => {
    if (isServerMode && !debouncedSearchQuery && dispositionCounts.length > 0) {
      const counts = new Map<string, number>();
      counts.set("ALL", totalTickets);
      dispositionCounts.forEach((item) => {
        counts.set(normalizeDisposition(item.disposition), item.count);
      });
      return counts;
    }

    const counts = new Map<string, number>();
    counts.set("ALL", isServerMode ? totalTickets : sortedTickets.length);

    dispositionGroups.forEach(([key, groupTickets]) => {
      counts.set(
        key,
        new Set(groupTickets.map((ticket) => getCustomerGroupKey(ticket))).size,
      );
    });

    return counts;
  }, [dispositionGroups, sortedTickets]);

  // Filtrar tickets por búsqueda
  const filterTicketsBySearch = (ticketsToFilter: Ticket[]) => {
    if (isServerMode) return ticketsToFilter;
    if (!searchQuery.trim()) return ticketsToFilter;

    const query = searchQuery.toLowerCase();
    return ticketsToFilter.filter(
      (ticket) =>
        ticket.id.toString().includes(query) ||
        getCustomerLabel(ticket).toLowerCase().includes(query) ||
        getPhoneLabel(ticket).toLowerCase().includes(query) ||
        formatLabel(ticket.status).toLowerCase().includes(query) ||
        formatLabel(ticket.priority).toLowerCase().includes(query) ||
        formatLabel(ticket.direction).toLowerCase().includes(query) ||
        formatLabel(ticket.disposition).toLowerCase().includes(query) ||
        getAgentLabel(ticket).toLowerCase().includes(query) ||
        (ticket.issueDetail?.toLowerCase() || "").includes(query),
    );
  };

  const filteredTicketsByTab = useMemo(() => {
    if (isServerMode) {
      return activeTab === "ALL" ? sortedTickets : dispositionMap.get(activeTab) || [];
    }
    if (activeTab === "ALL") {
      return filterTicketsBySearch(sortedTickets);
    }
    return filterTicketsBySearch(dispositionMap.get(activeTab) || []);
  }, [isServerMode, activeTab, sortedTickets, dispositionMap, searchQuery]);

  const groupedCustomerTickets = useMemo(() => {
    const groups = new Map<string, CustomerTicketGroup>();

    filteredTicketsByTab.forEach((ticket) => {
      const key = getCustomerGroupKey(ticket);
      const ticketDateMs = getTicketDateMs(ticket);
      const existingGroup = groups.get(key);

      if (existingGroup) {
        existingGroup.tickets.push(ticket);
        if (ticketDateMs > existingGroup.latestDateMs) {
          existingGroup.latestTicket = ticket;
          existingGroup.latestDateMs = ticketDateMs;
        }
      } else {
        groups.set(key, {
          key,
          customerLabel: getCustomerLabel(ticket),
          phoneLabel: getPhoneLabel(ticket),
          tickets: [ticket],
          latestTicket: ticket,
          latestDateMs: ticketDateMs,
        });
      }
    });

    return Array.from(groups.values())
      .map((group) => ({
        ...group,
        tickets: [...group.tickets].sort(
          (left, right) => getTicketDateMs(right) - getTicketDateMs(left),
        ),
      }))
      .sort((left, right) => {
        if (right.latestDateMs !== left.latestDateMs) {
          return right.latestDateMs - left.latestDateMs;
        }
        if (right.tickets.length !== left.tickets.length) {
          return right.tickets.length - left.tickets.length;
        }
        return left.customerLabel.localeCompare(right.customerLabel);
      });
  }, [filteredTicketsByTab]);

  useEffect(() => {
    if (open) {
      setActiveTab("ALL");
      setSearchQuery("");
      setDebouncedSearchQuery("");
      setCurrentPage(1);
      setExpandedCustomerGroups({});
    }
  }, [open]);

  useEffect(() => {
    if (!open) {
      setShowIssueDetailDialog(false);
      setSelectedIssueTicket(null);
    }
  }, [open]);

  useEffect(() => {
    setExpandedCustomerGroups({});
  }, [activeTab, searchQuery, currentPage]);

  const periodLabel =
    reportStartDate && reportEndDate
      ? `${reportStartDate} to ${reportEndDate}`
      : "All available dates";

  const clearSearch = () => setSearchQuery("");
  const openIssueDetail = (ticket: Ticket) => {
    if (!ticket.issueDetail?.trim()) return;
    setSelectedIssueTicket(ticket);
    setShowIssueDetailDialog(true);
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="flex h-[90vh] w-[calc(100vw-2rem)] max-w-[calc(100vw-2rem)] flex-col gap-0 overflow-hidden rounded-2xl p-0 shadow-2xl sm:max-w-[min(96vw,1400px)]">
        {/* Header Premium con gradiente sutil */}
        <DialogHeader className="border-b bg-gradient-to-r from-card via-card to-muted/20 px-6 py-6 backdrop-blur-sm z-20">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="space-y-1.5">
              <DialogTitle className="flex items-center gap-3 text-2xl font-bold tracking-tight">
                <div className="rounded-xl bg-primary/10 p-2.5 text-primary ring-1 ring-primary/20 shadow-sm">
                  <ListFilter className="h-5 w-5" />
                </div>
                <span>Ticket Directory</span>
              </DialogTitle>
              <DialogDescription className="ml-14 text-base text-muted-foreground/90">
                Showing all registered tickets for{" "}
                <span className="relative font-semibold text-foreground">
                  {yardName}
                  <span className="absolute -bottom-0.5 left-0 right-0 h-0.5 bg-primary/30 rounded-full" />
                </span>
                <span className="ml-3 inline-flex items-center rounded-full bg-muted/80 px-3 py-0.5 text-xs font-medium text-muted-foreground ring-1 ring-border">
                  {periodLabel}
                </span>
              </DialogDescription>
            </div>

            <div className="ml-14 flex flex-wrap items-center gap-2 sm:ml-0">
              <Badge
                variant="outline"
                className="px-4 py-1.5 text-sm bg-background/50 backdrop-blur-sm border-muted-foreground/20"
              >
                <FolderOpen className="mr-2 h-3.5 w-3.5 text-muted-foreground" />
                {Math.max(tabs.length - 1, 0)} Categories
              </Badge>
              <Badge
                variant="outline"
                className="border-primary/30 bg-primary/5 px-4 py-1.5 text-sm text-primary ring-1 ring-primary/20"
              >
                <TicketIcon className="mr-2 h-4 w-4" />
                {isServerMode ? totalTickets : tickets.length} Total Tickets
              </Badge>
            </div>
          </div>

          {/* Barra de búsqueda */}
          <div className="mt-4 ml-14 sm:ml-0">
            <div
              className={cn(
                "relative transition-all duration-200",
                isSearchFocused ? "sm:w-96" : "sm:w-80",
              )}
            >
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search tickets by ID, Customer..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => setIsSearchFocused(true)}
                onBlur={() => setIsSearchFocused(false)}
                className="pl-9 pr-9 h-10 bg-background/50 backdrop-blur-sm border-muted-foreground/20 focus:bg-background"
              />
              {searchQuery && (
                <button
                  onClick={clearSearch}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>
        </DialogHeader>

        <Tabs
          value={activeTab}
          onValueChange={setActiveTab}
          className="flex min-h-0 flex-1 flex-col bg-gradient-to-b from-muted/5 to-background"
        >
          {/* Tabs con TabsList de shadcn */}
          <div className="border-b bg-card/80 px-4 py-3 shadow-sm backdrop-blur-sm z-10">
            <div className="flex items-center justify-between gap-4">
              <div className="relative flex-1 min-w-0">
                <div className="absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-card to-transparent pointer-events-none z-10" />
                <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-card to-transparent pointer-events-none z-10" />
                <ScrollArea
                  className="w-full"
                  type="scroll"
                  scrollHideDelay={0}
                >
                  <TabsList className="inline-flex h-12 w-max min-w-full bg-transparent p-1 gap-1.5">
                    {tabs.map((tabKey) => {
                      const tabCount = tabCounts.get(tabKey) ?? 0;

                      return (
                        <TabsTrigger
                          key={tabKey}
                          value={tabKey}
                          className={cn(
                            "relative gap-2 rounded-full px-5 py-2 text-sm font-medium transition-all duration-200",
                            "data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-lg data-[state=active]:shadow-primary/25",
                            "data-[state=inactive]:text-muted-foreground data-[state=inactive]:hover:bg-muted/80 data-[state=inactive]:hover:text-foreground",
                          )}
                        >
                          <span className="relative">
                            {tabKey === "ALL"
                              ? "All Tickets"
                              : formatLabel(tabKey)}
                          </span>
                          <span
                            className={cn(
                              "flex items-center justify-center rounded-full px-2.5 py-0.5 text-xs font-bold transition-all duration-200",
                              "bg-background/80 text-foreground shadow-sm ring-1 ring-border",
                              "data-[state=active]:bg-primary-foreground/20 data-[state=active]:text-primary-foreground data-[state=active]:shadow-inner",
                            )}
                          >
                            {tabCount}
                          </span>
                        </TabsTrigger>
                      );
                    })}
                  </TabsList>
                </ScrollArea>
              </div>
            </div>
          </div>

          {/* Contenido de tabs */}
          <TabsContent
            value={activeTab}
            className="min-h-0 flex-1 px-4 py-4 m-0"
          >
            <div className="h-full overflow-hidden rounded-xl border bg-card shadow-lg transition-all duration-200 hover:shadow-xl">
              <ScrollArea className="h-full [&>[data-radix-scroll-area-viewport]]:max-h-full">
                {serverLoading ? (
                  <div className="flex h-[400px] flex-col items-center justify-center text-center p-8">
                    <div className="rounded-full bg-muted/50 p-6 mb-4 ring-8 ring-muted/20">
                      <Loader2 className="h-12 w-12 animate-spin text-muted-foreground/60" />
                    </div>
                    <p className="text-xl font-semibold text-foreground">
                      Loading tickets...
                    </p>
                    <p className="text-sm text-muted-foreground max-w-[320px] mt-1">
                      Fetching page {currentPage} of {Math.max(totalPages, 1)}
                      {activeTab !== "ALL" ? ` (${formatLabel(activeTab)})` : ""}.
                    </p>
                  </div>
                ) : serverError ? (
                  <div className="flex h-[400px] flex-col items-center justify-center text-center p-8">
                    <div className="rounded-full bg-destructive/10 p-6 mb-4 ring-8 ring-destructive/5">
                      <XCircle className="h-12 w-12 text-destructive/70" />
                    </div>
                    <p className="text-xl font-semibold text-foreground">
                      Failed to load tickets
                    </p>
                    <p className="text-sm text-muted-foreground max-w-[360px] mt-1">
                      {serverError}
                    </p>
                    <Button
                      type="button"
                      variant="outline"
                      className="mt-4"
                      onClick={() => setCurrentPage((page) => page)}
                    >
                      Retry
                    </Button>
                  </div>
                ) : groupedCustomerTickets.length === 0 ? (
                  <div className="flex h-[400px] flex-col items-center justify-center text-center p-8">
                    <div className="rounded-full bg-muted/50 p-6 mb-4 ring-8 ring-muted/20">
                      {searchQuery ? (
                        <Search className="h-12 w-12 text-muted-foreground/40" />
                      ) : (
                        <Inbox className="h-12 w-12 text-muted-foreground/40" />
                      )}
                    </div>
                    <p className="text-xl font-semibold text-foreground">
                      {searchQuery ? "No matching tickets" : "No tickets found"}
                    </p>
                    <p className="text-sm text-muted-foreground max-w-[300px] mt-1">
                      {searchQuery
                        ? "Try adjusting your search query or clear filters"
                        : "There are no tickets in this disposition category."}
                    </p>
                  </div>
                ) : (
                  <div className="relative">
                    <Table>
                      <TableHeader className="sticky top-0 z-20 bg-gradient-to-b from-muted/90 to-muted/80 backdrop-blur-md shadow-sm">
                        <TableRow className="hover:bg-transparent border-b border-muted-foreground/10">
                          <TableHead className="w-[80px] text-xs font-bold uppercase tracking-wider text-muted-foreground/80 py-4">
                            ID
                          </TableHead>
                          <TableHead className="text-xs font-bold uppercase tracking-wider text-muted-foreground/80 py-4">
                            Customer
                          </TableHead>
                          <TableHead className="text-xs font-bold uppercase tracking-wider text-muted-foreground/80 py-4">
                            Contact
                          </TableHead>
                          <TableHead className="w-[120px] text-xs font-bold uppercase tracking-wider text-muted-foreground/80 py-4">
                            Status
                          </TableHead>
                          <TableHead className="w-[120px] text-xs font-bold uppercase tracking-wider text-muted-foreground/80 py-4">
                            Priority
                          </TableHead>
                          <TableHead className="text-xs font-bold uppercase tracking-wider text-muted-foreground/80 py-4">
                            Direction
                          </TableHead>
                          <TableHead className="text-xs font-bold uppercase tracking-wider text-muted-foreground/80 py-4">
                            Disposition
                          </TableHead>
                          <TableHead className="text-xs font-bold uppercase tracking-wider text-muted-foreground/80 py-4">
                            Agent
                          </TableHead>
                          <TableHead className="w-[120px] text-xs font-bold uppercase tracking-wider text-muted-foreground/80 py-4">
                            Tickets
                          </TableHead>
                          <TableHead className="w-[140px] text-xs font-bold uppercase tracking-wider text-muted-foreground/80 py-4">
                            Date
                          </TableHead>
                          <TableHead className="w-[120px] text-xs font-bold uppercase tracking-wider text-muted-foreground/80 py-4">
                            Issue
                          </TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody className="[&_tr:last-child]:border-0">
                        {groupedCustomerTickets.map((group, groupIndex) => {
                          const latestTicket = group.tickets[0];
                          const olderTickets = group.tickets.slice(1);
                          const isExpanded = Boolean(
                            expandedCustomerGroups[group.key],
                          );
                          const totalGroupTickets = group.tickets.length;
                          const hasMoreTickets = totalGroupTickets > 1;

                          return (
                            <Fragment key={`${activeTab}-${group.key}`}>
                              <TableRow
                                className={cn(
                                  "group transition-all duration-150 hover:bg-emerald-50/60 dark:hover:bg-emerald-950/25",
                                  groupIndex % 2 === 0
                                    ? "bg-emerald-50/30 dark:bg-emerald-950/10"
                                    : "bg-emerald-50/40 dark:bg-emerald-950/15",
                                )}
                              >
                                <TableCell className="font-mono text-xs font-medium">
                                  <span className="inline-flex items-center rounded-md bg-muted/50 px-2 py-1 text-muted-foreground ring-1 ring-border">
                                    #{latestTicket.id}
                                  </span>
                                </TableCell>
                                <TableCell className="max-w-[220px] font-semibold text-foreground truncate">
                                  {group.customerLabel}
                                </TableCell>
                                <TableCell className="text-muted-foreground text-sm">
                                  <span className="inline-flex items-center gap-1">
                                    <Phone className="h-3 w-3 opacity-50" />
                                    {group.phoneLabel}
                                  </span>
                                </TableCell>
                                <TableCell>
                                  <Badge
                                    variant="outline"
                                    className={cn(
                                      "font-semibold shadow-sm px-3 py-1 border-2",
                                      getStatusColor(latestTicket.status),
                                    )}
                                  >
                                    <span className="relative flex h-1.5 w-1.5 mr-1.5">
                                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-current opacity-75"></span>
                                      <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-current"></span>
                                    </span>
                                    {formatLabel(latestTicket.status)}
                                  </Badge>
                                </TableCell>
                                <TableCell>
                                  <Badge
                                    variant="outline"
                                    className={cn(
                                      "font-semibold shadow-sm px-3 py-1",
                                      getPriorityColor(latestTicket.priority),
                                    )}
                                  >
                                    {formatLabel(latestTicket.priority)}
                                  </Badge>
                                </TableCell>
                                <TableCell className="text-sm font-medium">
                                  <span className="inline-flex items-center gap-1.5">
                                    <ArrowRight
                                      className={cn(
                                        "h-3.5 w-3.5",
                                        latestTicket.direction === "INBOUND"
                                          ? "text-emerald-500"
                                          : "text-amber-500",
                                      )}
                                    />
                                    {formatLabel(latestTicket.direction)}
                                  </span>
                                </TableCell>
                                <TableCell className="text-sm">
                                  <span className="inline-flex items-center rounded-full bg-muted/50 px-3 py-1 text-xs font-medium ring-1 ring-border">
                                    {formatLabel(latestTicket.disposition)}
                                  </span>
                                </TableCell>
                                <TableCell className="max-w-[160px] truncate text-sm">
                                  <span className="inline-flex items-center gap-1.5 text-muted-foreground group-hover:text-foreground transition-colors">
                                    <User className="h-3.5 w-3.5" />
                                    {getAgentLabel(latestTicket)}
                                  </span>
                                </TableCell>
                                <TableCell className="text-xs text-muted-foreground">
                                  {hasMoreTickets ? (
                                    <button
                                      type="button"
                                      className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-[11px] font-medium text-muted-foreground ring-1 ring-border transition-colors hover:bg-muted/60 hover:text-foreground"
                                      onClick={() =>
                                        setExpandedCustomerGroups(
                                          (current) => ({
                                            ...current,
                                            [group.key]: !isExpanded,
                                          }),
                                        )
                                      }
                                    >
                                      <span>{totalGroupTickets} total</span>
                                      <ChevronDown
                                        className={cn(
                                          "h-3 w-3 transition-transform",
                                          isExpanded && "rotate-180",
                                        )}
                                      />
                                    </button>
                                  ) : (
                                    <span className="inline-flex items-center rounded-md bg-muted/40 px-2 py-1 text-xs font-semibold text-muted-foreground ring-1 ring-border">
                                      1 ticket
                                    </span>
                                  )}
                                </TableCell>
                                <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                                  <span className="inline-flex items-center gap-1.5">
                                    <Calendar className="h-3.5 w-3.5" />
                                    {formatDate(latestTicket.createdAt)}
                                  </span>
                                </TableCell>
                                <TableCell className="text-xs">
                                  {latestTicket.issueDetail?.trim() ? (
                                    <Button
                                      type="button"
                                      variant="ghost"
                                      size="sm"
                                      className="h-7 px-2 text-xs text-primary hover:text-primary/80"
                                      onClick={() => openIssueDetail(latestTicket)}
                                    >
                                      <FileText className="mr-1.5 h-3.5 w-3.5" />
                                      View
                                    </Button>
                                  ) : (
                                    <span className="text-xs italic text-muted-foreground/50">
                                      No detail
                                    </span>
                                  )}
                                </TableCell>
                              </TableRow>

                              {isExpanded &&
                                olderTickets.map((ticket, olderIndex) => (
                                  <TableRow
                                    key={`${group.key}-${ticket.id}-${olderIndex}`}
                                    className="bg-slate-100/75 hover:bg-slate-100 dark:bg-slate-900/30 dark:hover:bg-slate-900/45"
                                  >
                                    <TableCell className="font-mono text-xs">
                                      <span className="inline-flex items-center rounded-md bg-background/80 px-2 py-1 text-muted-foreground ring-1 ring-border">
                                        #{ticket.id}
                                      </span>
                                    </TableCell>
                                    <TableCell className="max-w-[220px] text-sm text-muted-foreground truncate">
                                      {group.customerLabel}
                                    </TableCell>
                                    <TableCell className="text-muted-foreground text-sm">
                                      <span className="inline-flex items-center gap-1">
                                        <Phone className="h-3 w-3 opacity-50" />
                                        {group.phoneLabel}
                                      </span>
                                    </TableCell>
                                    <TableCell>
                                      <Badge
                                        variant="outline"
                                        className={cn(
                                          "font-semibold shadow-sm px-3 py-1 border-2",
                                          getStatusColor(ticket.status),
                                        )}
                                      >
                                        {formatLabel(ticket.status)}
                                      </Badge>
                                    </TableCell>
                                    <TableCell>
                                      <Badge
                                        variant="outline"
                                        className={cn(
                                          "font-semibold shadow-sm px-3 py-1",
                                          getPriorityColor(ticket.priority),
                                        )}
                                      >
                                        {formatLabel(ticket.priority)}
                                      </Badge>
                                    </TableCell>
                                    <TableCell className="text-sm font-medium">
                                      <span className="inline-flex items-center gap-1.5">
                                        <ArrowRight
                                          className={cn(
                                            "h-3.5 w-3.5",
                                            ticket.direction === "INBOUND"
                                              ? "text-emerald-500"
                                              : "text-amber-500",
                                          )}
                                        />
                                        {formatLabel(ticket.direction)}
                                      </span>
                                    </TableCell>
                                    <TableCell className="text-sm">
                                      <span className="inline-flex items-center rounded-full bg-muted/50 px-3 py-1 text-xs font-medium ring-1 ring-border">
                                        {formatLabel(ticket.disposition)}
                                      </span>
                                    </TableCell>
                                    <TableCell className="max-w-[160px] truncate text-sm">
                                      <span className="inline-flex items-center gap-1.5 text-muted-foreground">
                                        <User className="h-3.5 w-3.5" />
                                        {getAgentLabel(ticket)}
                                      </span>
                                    </TableCell>
                                    <TableCell className="text-xs text-muted-foreground">
                                      <span className="inline-flex items-center rounded-md bg-background/80 px-2 py-1 text-[11px] font-medium text-muted-foreground ring-1 ring-border">
                                        {olderIndex + 2} of {totalGroupTickets}
                                      </span>
                                    </TableCell>
                                    <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                                      <span className="inline-flex items-center gap-1.5">
                                        <Calendar className="h-3.5 w-3.5" />
                                        {formatDate(ticket.createdAt)}
                                      </span>
                                    </TableCell>
                                    <TableCell className="text-xs">
                                      {ticket.issueDetail?.trim() ? (
                                        <Button
                                          type="button"
                                          variant="ghost"
                                          size="sm"
                                          className="h-7 px-2 text-xs text-primary hover:text-primary/80"
                                          onClick={() => openIssueDetail(ticket)}
                                        >
                                          <FileText className="mr-1.5 h-3.5 w-3.5" />
                                          View
                                        </Button>
                                      ) : (
                                        <span className="text-xs italic text-muted-foreground/50">
                                          No detail
                                        </span>
                                      )}
                                    </TableCell>
                                  </TableRow>
                                ))}
                            </Fragment>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </ScrollArea>
            </div>
          </TabsContent>
        </Tabs>

        {/* Footer mejorado */}
        <DialogFooter className="border-t bg-gradient-to-r from-card via-card to-muted/20 px-6 py-4 backdrop-blur-sm">
          <div className="flex w-full flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2 text-sm">
              <p className="text-muted-foreground">
                Showing{" "}
                <span className="text-foreground font-bold">
                  {groupedCustomerTickets.length}
                </span>{" "}
                customer{groupedCustomerTickets.length === 1 ? "" : "s"}
                <span className="mx-1 text-muted-foreground/60">|</span>
                <span className="text-foreground font-bold">
                  {filteredTicketsByTab.length}
                </span>{" "}
                ticket{filteredTicketsByTab.length === 1 ? "" : "s"}
                {searchQuery && " matching search"}
                {activeTab !== "ALL" && (
                  <span>
                    {" "}
                    in{" "}
                    <span className="relative font-semibold text-foreground">
                      {formatLabel(activeTab)}
                    </span>
                  </span>
                )}
                {isServerMode && (
                  <span>
                    <span className="mx-1 text-muted-foreground/60">|</span>
                    Page{" "}
                    <span className="text-foreground font-bold">
                      {currentPage}
                    </span>{" "}
                    of{" "}
                    <span className="text-foreground font-bold">
                      {Math.max(totalPages, 1)}
                    </span>
                  </span>
                )}
              </p>
            </div>
            <div className="flex items-center gap-3">
              {isServerMode && (
                <>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      setCurrentPage((page) => Math.max(1, page - 1))
                    }
                    disabled={serverLoading || currentPage <= 1}
                  >
                    Prev
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      setCurrentPage((page) =>
                        Math.min(Math.max(totalPages, 1), page + 1),
                      )
                    }
                    disabled={
                      serverLoading || currentPage >= Math.max(totalPages, 1)
                    }
                  >
                    Next
                  </Button>
                </>
              )}
              <Button
                onClick={() => onOpenChange(false)}
                className="min-w-[120px] shadow-lg hover:shadow-xl transition-all duration-200 bg-primary hover:bg-primary/90"
              >
                <span>Done</span>
              </Button>
            </div>
          </div>
        </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showIssueDetailDialog} onOpenChange={setShowIssueDetailDialog}>
        <DialogContent className="w-[calc(100vw-1rem)] max-h-[82vh] overflow-hidden rounded-2xl p-0 sm:max-w-[min(92vw,560px)]">
          <DialogHeader className="border-b bg-card/60 px-5 py-4">
            <DialogTitle className="flex items-center gap-2 text-lg font-bold">
              <FileText className="h-5 w-5 text-primary" />
              Issue Detail
            </DialogTitle>
            <DialogDescription className="text-sm">
              {selectedIssueTicket
                ? `Ticket #${selectedIssueTicket.id}`
                : "Selected ticket"}
            </DialogDescription>
          </DialogHeader>

          <ScrollArea className="max-h-[60vh] bg-muted/10">
            <div className="space-y-3 p-4">
              {selectedIssueTicket?.issueDetail?.trim() ? (
                <div className="rounded-xl border bg-card p-3.5 shadow-sm">
                  <div className="mb-2 flex items-center justify-between gap-2">
                    <Badge variant="outline" className="font-mono">
                      Ticket #{selectedIssueTicket.id}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      {formatDate(
                        selectedIssueTicket.createdAt ||
                          selectedIssueTicket.updatedAt,
                      )}
                    </span>
                  </div>
                  <p className="text-sm leading-relaxed text-foreground whitespace-pre-wrap break-words">
                    {selectedIssueTicket.issueDetail.trim()}
                  </p>
                </div>
              ) : (
                <div className="rounded-xl border border-dashed bg-card/60 p-6 text-center text-sm text-muted-foreground">
                  No Issue Detail available for this ticket.
                </div>
              )}
            </div>
          </ScrollArea>

          <DialogFooter className="border-t bg-card/60 px-5 py-3">
            <Button
              type="button"
              variant="default"
              className="w-full sm:w-auto"
              onClick={() => setShowIssueDetailDialog(false)}
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
