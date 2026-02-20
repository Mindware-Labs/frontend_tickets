"use client";

import { useEffect, useMemo, useState } from "react";
import { ListFilter, Ticket as TicketIcon } from "lucide-react";
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

  const activeTickets = useMemo(() => {
    if (activeTab === "ALL") return sortedTickets;
    return dispositionMap.get(activeTab) || [];
  }, [activeTab, sortedTickets, dispositionMap]);

  useEffect(() => {
    if (open) {
      setActiveTab("ALL");
    }
  }, [open, tickets.length]);

  const periodLabel =
    reportStartDate && reportEndDate
      ? `${reportStartDate} to ${reportEndDate}`
      : "All available dates";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex h-[90vh] w-[calc(100vw-1rem)] max-w-[calc(100vw-1rem)] flex-col gap-0 overflow-hidden rounded-2xl p-0 shadow-2xl sm:max-w-[min(96vw,1400px)]">
        {/* Header Premium */}
        <DialogHeader className="border-b bg-card/80 px-6 py-6 backdrop-blur-sm z-20">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <DialogTitle className="flex items-center gap-2.5 text-2xl font-bold tracking-tight">
                <div className="rounded-xl bg-primary/10 p-2 text-primary">
                  <ListFilter className="h-6 w-6" />
                </div>
                Ticket Directory
              </DialogTitle>
              <DialogDescription className="ml-12 mt-1.5 text-base">
                Showing all registered tickets for{" "}
                <span className="font-semibold text-foreground underline decoration-primary/30 underline-offset-4">
                  {yardName}
                </span>
                <span className="ml-2 inline-flex items-center rounded-md bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
                  {periodLabel}
                </span>
              </DialogDescription>
            </div>

            <div className="ml-12 flex flex-wrap items-center gap-2 sm:ml-0">
              <Badge
                variant="outline"
                className="px-3 py-1.5 text-sm bg-background"
              >
                {dispositionGroups.length} Categories
              </Badge>
              <Badge
                variant="outline"
                className="border-primary/30 bg-primary/10 px-3 py-1.5 text-sm text-primary"
              >
                <TicketIcon className="mr-1.5 h-4 w-4" />
                {tickets.length} Total Tickets
              </Badge>
            </div>
          </div>
        </DialogHeader>

        <Tabs
          value={activeTab}
          onValueChange={setActiveTab}
          className="flex min-h-0 flex-1 flex-col bg-muted/10"
        >
          <div className="border-b bg-card px-4 py-2 shadow-sm z-10">
            <div className="w-full overflow-x-auto pb-1 scrollbar-thin">
              <TabsList className="h-12 w-max bg-transparent p-1 gap-1.5">
                {tabs.map((tabKey) => {
                  const tabCount =
                    tabKey === "ALL"
                      ? sortedTickets.length
                      : (dispositionMap.get(tabKey) || []).length;

                  const isActive = activeTab === tabKey;

                  return (
                    <TabsTrigger
                      key={tabKey}
                      value={tabKey}
                      className={cn(
                        "gap-2 rounded-full px-4 py-2 text-sm font-medium transition-all data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-md",
                        !isActive &&
                          "text-muted-foreground hover:bg-muted hover:text-foreground",
                      )}
                    >
                      {tabKey === "ALL" ? "All Tickets" : formatLabel(tabKey)}
                      <span
                        className={cn(
                          "flex items-center justify-center rounded-full px-2 py-0.5 text-xs font-bold transition-colors",
                          isActive
                            ? "bg-primary-foreground/20 text-primary-foreground"
                            : "bg-background shadow-sm text-foreground",
                        )}
                      >
                        {tabCount}
                      </span>
                    </TabsTrigger>
                  );
                })}
              </TabsList>
            </div>
          </div>

          {/* Tabla */}
          {tabs.map((tabKey) => {
            const tabTickets =
              tabKey === "ALL"
                ? sortedTickets
                : dispositionMap.get(tabKey) || [];

            return (
              <TabsContent
                key={tabKey}
                value={tabKey}
                className="min-h-0 flex-1 px-4 py-4 data-[state=inactive]:hidden m-0"
              >
                <div className="h-full overflow-hidden rounded-xl border bg-card shadow-sm">
                  <ScrollArea className="h-full">
                    {tabTickets.length === 0 ? (
                      <div className="flex h-64 flex-col items-center justify-center text-center">
                        <div className="rounded-full bg-muted p-4 mb-4">
                          <ListFilter className="h-8 w-8 text-muted-foreground/50" />
                        </div>
                        <p className="text-lg font-medium text-foreground">
                          No tickets found
                        </p>
                        <p className="text-sm text-muted-foreground">
                          There are no tickets in this disposition category.
                        </p>
                      </div>
                    ) : (
                      <Table>
                        <TableHeader className="sticky top-0 z-20 bg-muted/80 backdrop-blur-md">
                          <TableRow className="hover:bg-transparent">
                            <TableHead className="w-[80px] text-xs font-bold uppercase tracking-wider text-muted-foreground">
                              ID
                            </TableHead>
                            <TableHead className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                              Customer
                            </TableHead>
                            <TableHead className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                              Contact
                            </TableHead>
                            <TableHead className="w-[120px] text-xs font-bold uppercase tracking-wider text-muted-foreground">
                              Status
                            </TableHead>
                            <TableHead className="w-[120px] text-xs font-bold uppercase tracking-wider text-muted-foreground">
                              Priority
                            </TableHead>
                            <TableHead className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                              Direction
                            </TableHead>
                            <TableHead className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                              Disposition
                            </TableHead>
                            <TableHead className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                              Agent
                            </TableHead>
                            <TableHead className="w-[140px] text-xs font-bold uppercase tracking-wider text-muted-foreground">
                              Date
                            </TableHead>
                            <TableHead className="min-w-[280px] text-xs font-bold uppercase tracking-wider text-muted-foreground">
                              Issue Details
                            </TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody className="[&_tr:last-child]:border-0">
                          {tabTickets.map((ticket) => (
                            <TableRow
                              key={`${tabKey}-${ticket.id}`}
                              className="group transition-colors hover:bg-muted/40 even:bg-muted/10"
                            >
                              <TableCell className="font-mono text-xs font-medium text-muted-foreground">
                                #{ticket.id}
                              </TableCell>
                              <TableCell className="max-w-[180px] font-semibold text-foreground truncate">
                                {getCustomerLabel(ticket)}
                              </TableCell>
                              <TableCell className="text-muted-foreground text-sm">
                                {getPhoneLabel(ticket)}
                              </TableCell>
                              <TableCell>
                                <Badge
                                  variant="outline"
                                  className={cn(
                                    "font-semibold shadow-sm",
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
                                    "font-semibold shadow-sm",
                                    getPriorityColor(ticket.priority),
                                  )}
                                >
                                  {formatLabel(ticket.priority)}
                                </Badge>
                              </TableCell>
                              <TableCell className="text-sm font-medium">
                                {formatLabel(ticket.direction)}
                              </TableCell>
                              <TableCell className="text-sm">
                                {formatLabel(ticket.disposition)}
                              </TableCell>
                              <TableCell className="max-w-[160px] truncate text-sm text-muted-foreground font-medium group-hover:text-foreground transition-colors">
                                {getAgentLabel(ticket)}
                              </TableCell>
                              <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                                {formatDate(ticket.createdAt)}
                              </TableCell>
                              <TableCell className="whitespace-normal text-xs leading-relaxed text-muted-foreground">
                                <div className="line-clamp-2 group-hover:line-clamp-none transition-all duration-300">
                                  {ticket.issueDetail || (
                                    <span className="italic opacity-50">
                                      No details provided
                                    </span>
                                  )}
                                </div>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    )}
                  </ScrollArea>
                </div>
              </TabsContent>
            );
          })}
        </Tabs>

        {/* Footer */}
        <DialogFooter className="border-t bg-card/80 px-6 py-4 backdrop-blur-sm">
          <div className="flex w-full flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm font-medium text-muted-foreground">
              Showing{" "}
              <span className="text-foreground font-bold">
                {activeTickets.length}
              </span>{" "}
              ticket{activeTickets.length === 1 ? "" : "s"} in{" "}
              <span className="text-foreground font-semibold">
                {activeTab === "ALL"
                  ? "all categories"
                  : formatLabel(activeTab)}
              </span>
              .
            </p>
            <Button
              onClick={() => onOpenChange(false)}
              className="w-full sm:w-auto sm:min-w-[120px] shadow-sm"
            >
              Done
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
