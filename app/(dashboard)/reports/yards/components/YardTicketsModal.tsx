"use client";

import { useEffect, useMemo, useState } from "react";
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
  Filter,
  ChevronDown
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { Ticket } from "./types";
import { cn } from "@/lib/utils";

type YardTicketsModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  yardName: string;
  reportStartDate?: string;
  reportEndDate?: string;
  tickets: Ticket[];
};

const normalizeDisposition = (value?: string | null) =>
  (value || "UNSPECIFIED").toUpperCase();

const formatLabel = (value?: string | null) =>
  (value || "Unspecified")
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

// Utilidades para colores semánticos en la tabla
const getStatusColor = (status?: string | null) => {
  const s = (status || "").toUpperCase();
  if (s === "OPEN" || s === "NEW")
    return "bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800";
  if (s === "IN_PROGRESS" || s === "PENDING")
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

export function YardTicketsModal({
  open,
  onOpenChange,
  yardName,
  reportStartDate,
  reportEndDate,
  tickets,
}: YardTicketsModalProps) {
  const [activeTab, setActiveTab] = useState("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearchFocused, setIsSearchFocused] = useState(false);

  const sortedTickets = useMemo(() => {
    return [...tickets].sort((left, right) => {
      const leftDate = new Date(
        left.createdAt || left.updatedAt || 0,
      ).getTime();
      const rightDate = new Date(
        right.createdAt || right.updatedAt || 0,
      ).getTime();
      return rightDate - leftDate;
    });
  }, [tickets]);

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

  const tabs = useMemo(
    () => ["ALL", ...dispositionGroups.map(([key]) => key)],
    [dispositionGroups],
  );

  // Filtrar tickets por búsqueda
  const filterTicketsBySearch = (ticketsToFilter: Ticket[]) => {
    if (!searchQuery.trim()) return ticketsToFilter;
    
    const query = searchQuery.toLowerCase();
    return ticketsToFilter.filter(ticket => 
      ticket.id.toString().includes(query) ||
      getCustomerLabel(ticket).toLowerCase().includes(query) ||
      getPhoneLabel(ticket).toLowerCase().includes(query) ||
      formatLabel(ticket.status).toLowerCase().includes(query) ||
      formatLabel(ticket.priority).toLowerCase().includes(query) ||
      formatLabel(ticket.direction).toLowerCase().includes(query) ||
      formatLabel(ticket.disposition).toLowerCase().includes(query) ||
      getAgentLabel(ticket).toLowerCase().includes(query) ||
      (ticket.issueDetail?.toLowerCase() || "").includes(query)
    );
  };

  const filteredTicketsByTab = useMemo(() => {
    if (activeTab === "ALL") {
      return filterTicketsBySearch(sortedTickets);
    }
    return filterTicketsBySearch(dispositionMap.get(activeTab) || []);
  }, [activeTab, sortedTickets, dispositionMap, searchQuery]);

  useEffect(() => {
    if (open) {
      setActiveTab("ALL");
      setSearchQuery("");
    }
  }, [open]);

  const periodLabel =
    reportStartDate && reportEndDate
      ? `${reportStartDate} to ${reportEndDate}`
      : "All available dates";

  const clearSearch = () => setSearchQuery("");

  return (
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
                {dispositionGroups.length} Categories
              </Badge>
              <Badge
                variant="outline"
                className="border-primary/30 bg-primary/5 px-4 py-1.5 text-sm text-primary ring-1 ring-primary/20"
              >
                <TicketIcon className="mr-2 h-4 w-4" />
                {tickets.length} Total Tickets
              </Badge>
            </div>
          </div>

          {/* Barra de búsqueda */}
          <div className="mt-4 ml-14 sm:ml-0">
            <div className={cn(
              "relative transition-all duration-200",
              isSearchFocused ? "sm:w-96" : "sm:w-80"
            )}>
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
                <ScrollArea className="w-full" type="scroll" scrollHideDelay={0}>
                  <TabsList className="inline-flex h-12 w-max min-w-full bg-transparent p-1 gap-1.5">
                    {tabs.map((tabKey) => {
                      const tabCount =
                        tabKey === "ALL"
                          ? sortedTickets.length
                          : (dispositionMap.get(tabKey) || []).length;

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
                            {tabKey === "ALL" ? "All Tickets" : formatLabel(tabKey)}
                          </span>
                          <span
                            className={cn(
                              "flex items-center justify-center rounded-full px-2.5 py-0.5 text-xs font-bold transition-all duration-200",
                              "bg-background/80 text-foreground shadow-sm ring-1 ring-border",
                              "data-[state=active]:bg-primary-foreground/20 data-[state=active]:text-primary-foreground data-[state=active]:shadow-inner"
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
          <TabsContent value={activeTab} className="min-h-0 flex-1 px-4 py-4 m-0">
            <div className="h-full overflow-hidden rounded-xl border bg-card shadow-lg transition-all duration-200 hover:shadow-xl">
              <ScrollArea className="h-full [&>[data-radix-scroll-area-viewport]]:max-h-full">
                {filteredTicketsByTab.length === 0 ? (
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
                          <TableHead className="w-[140px] text-xs font-bold uppercase tracking-wider text-muted-foreground/80 py-4">
                            Date
                          </TableHead>
                          <TableHead className="min-w-[300px] text-xs font-bold uppercase tracking-wider text-muted-foreground/80 py-4">
                            Issue Details
                          </TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody className="[&_tr:last-child]:border-0">
                        {filteredTicketsByTab.map((ticket, index) => (
                          <TableRow
                            key={`${activeTab}-${ticket.id}`}
                            className={cn(
                              "group transition-all duration-150 hover:bg-muted/30",
                              index % 2 === 0 ? "bg-background" : "bg-muted/5",
                            )}
                          >
                            <TableCell className="font-mono text-xs font-medium">
                              <span className="inline-flex items-center rounded-md bg-muted/50 px-2 py-1 text-muted-foreground ring-1 ring-border">
                                #{ticket.id}
                              </span>
                            </TableCell>
                            <TableCell className="max-w-[180px] font-semibold text-foreground truncate">
                              {getCustomerLabel(ticket)}
                            </TableCell>
                            <TableCell className="text-muted-foreground text-sm">
                              <span className="inline-flex items-center gap-1">
                                <Phone className="h-3 w-3 opacity-50" />
                                {getPhoneLabel(ticket)}
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
                                <span className="relative flex h-1.5 w-1.5 mr-1.5">
                                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-current opacity-75"></span>
                                  <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-current"></span>
                                </span>
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
                                <ArrowRight className={cn(
                                  "h-3.5 w-3.5",
                                  ticket.direction === "INBOUND" ? "text-emerald-500" : "text-amber-500"
                                )} />
                                {formatLabel(ticket.direction)}
                              </span>
                            </TableCell>
                            <TableCell className="text-sm">
                              <span className="inline-flex items-center rounded-full bg-muted/50 px-3 py-1 text-xs font-medium ring-1 ring-border">
                                {formatLabel(ticket.disposition)}
                              </span>
                            </TableCell>
                            <TableCell className="max-w-[160px] truncate text-sm">
                              <span className="inline-flex items-center gap-1.5 text-muted-foreground group-hover:text-foreground transition-colors">
                                <User className="h-3.5 w-3.5" />
                                {getAgentLabel(ticket)}
                              </span>
                            </TableCell>
                            <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                              <span className="inline-flex items-center gap-1.5">
                                <Calendar className="h-3.5 w-3.5" />
                                {formatDate(ticket.createdAt)}
                              </span>
                            </TableCell>
                            <TableCell className="whitespace-normal text-xs leading-relaxed">
                              <div className="max-w-[350px] group/issue">
                                <p className={cn(
                                  "text-muted-foreground transition-all duration-200",
                                  "group-hover/issue:text-foreground",
                                  "line-clamp-2 group-hover/issue:line-clamp-none"
                                )}>
                                  {ticket.issueDetail || (
                                    <span className="italic text-muted-foreground/50">
                                      No details provided
                                    </span>
                                  )}
                                </p>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
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
          {filteredTicketsByTab.length}
        </span>{" "}
        ticket{filteredTicketsByTab.length === 1 ? "" : "s"} 
        {searchQuery && " matching search"}
        {activeTab !== "ALL" && (
          <span> in <span className="relative font-semibold text-foreground">
            {formatLabel(activeTab)}
          </span></span>
        )}
      </p>
    </div>
    <div className="flex items-center gap-3">
     

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
  );
}