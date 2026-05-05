"use client";

import Link from "next/link";
import { useEffect, useMemo, useState, type CSSProperties } from "react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  AlertTriangle,
  ExternalLink,
  FileText,
  Megaphone,
  User,
  XCircle,
} from "lucide-react";
import type { Ticket } from "./types";

type HighPriorityPendingModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  side?: "left" | "right";
  yardId?: number | string;
  yardName: string;
  reportStartDate?: string;
  reportEndDate?: string;
  tickets: Ticket[];
};

const getSheetMaxWidthClass = (cardCount: number) => {
  if (cardCount <= 1) {
    return "sm:max-w-[min(92vw,480px)]";
  }
  if (cardCount === 2) {
    return "sm:max-w-[min(92vw,840px)]";
  }
  return "sm:max-w-[min(92vw,1200px)]";
};

const getSheetMaxWidthExpression = (cardCount: number) => {
  if (cardCount <= 1) return "min(92vw,480px)";
  if (cardCount === 2) return "min(92vw,840px)";
  return "min(92vw,1200px)";
};

const getCardsGridClass = (cardCount: number) => {
  if (cardCount <= 1) {
    return "grid-cols-1";
  }
  if (cardCount === 2) {
    return "grid-cols-1 sm:grid-cols-2";
  }
  return "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3";
};

const getPriorityRank = (priority?: string | null) => {
  const normalized = (priority || "").toUpperCase();
  if (normalized === "EMERGENCY") return 2;
  if (normalized === "HIGH") return 1;
  return 0;
};

const isClosedStatus = (status?: string | null) => {
  const normalized = (status || "").toUpperCase();
  return normalized === "COMPLETED" || normalized === "CLOSED" || normalized === "RESOLVED";
};

const getAgentLabel = (ticket: Ticket) =>
  ticket.assignedTo?.name?.trim() || ticket.agent?.name?.trim() || "Unassigned";

const getCustomerLabel = (ticket: Ticket) =>
  ticket.customer?.name?.trim() ||
  ticket.customerPhone?.trim() ||
  ticket.customer?.phone?.trim() ||
  ticket.phone?.trim() ||
  (ticket.customerId !== null && ticket.customerId !== undefined
    ? `Customer #${ticket.customerId}`
    : "Unknown customer");

const getCampaignLabel = (ticket: Ticket) =>
  ticket.campaign?.nombre?.trim() ||
  (ticket.campaignId !== null && ticket.campaignId !== undefined
    ? `Campaign #${ticket.campaignId}`
    : "No campaign");

const getOpenedAt = (ticket: Ticket) => ticket.createdAt || ticket.updatedAt;

const formatDateTime = (value?: string | null) => {
  if (!value) return "Unknown";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "Unknown";
  return parsed.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const formatStatusLabel = (value?: string | null) =>
  (value || "Unknown").replace(/_/g, " ").toLowerCase();

const getPriorityBadgeClass = (priority?: string | null) => {
  const normalized = (priority || "").toUpperCase();
  if (normalized === "EMERGENCY") {
    return "border-rose-300 bg-rose-100 text-rose-800 dark:border-rose-800 dark:bg-rose-900/40 dark:text-rose-300";
  }
  return "border-orange-300 bg-orange-100 text-orange-800 dark:border-orange-800 dark:bg-orange-900/40 dark:text-orange-300";
};

export function HighPriorityPendingModal({
  open,
  onOpenChange,
  side = "right",
  yardId,
  yardName,
  reportStartDate,
  reportEndDate,
  tickets,
}: HighPriorityPendingModalProps) {
  const [selectedTicketForIssue, setSelectedTicketForIssue] =
    useState<Ticket | null>(null);
  const [showIssueDetailsModal, setShowIssueDetailsModal] = useState(false);

  const { pendingCriticalTickets, closedCriticalTickets } = useMemo(
    () => {
      const criticalTickets = tickets
        .filter((ticket) => {
          const priority = (ticket.priority || "").toUpperCase();
          return priority === "HIGH" || priority === "EMERGENCY";
        })
        .sort((left, right) => {
          const byPriority =
            getPriorityRank(right.priority) - getPriorityRank(left.priority);
          if (byPriority !== 0) return byPriority;

          const leftOpened = new Date(getOpenedAt(left) || 0).getTime();
          const rightOpened = new Date(getOpenedAt(right) || 0).getTime();
          return leftOpened - rightOpened;
        });

      return {
        pendingCriticalTickets: criticalTickets.filter(
          (ticket) => !isClosedStatus(ticket.status),
        ),
        closedCriticalTickets: criticalTickets.filter((ticket) =>
          isClosedStatus(ticket.status),
        ),
      };
    },
    [tickets],
  );

  const pendingEmergencyCount = pendingCriticalTickets.filter(
    (ticket) => (ticket.priority || "").toUpperCase() === "EMERGENCY",
  ).length;
  const pendingHighCount = pendingCriticalTickets.length - pendingEmergencyCount;
  const closedEmergencyCount = closedCriticalTickets.filter(
    (ticket) => (ticket.priority || "").toUpperCase() === "EMERGENCY",
  ).length;
  const closedHighCount = closedCriticalTickets.length - closedEmergencyCount;
  const hasNoCriticalTickets =
    pendingCriticalTickets.length === 0 && closedCriticalTickets.length === 0;
  const maxSectionCardCount = Math.max(
    pendingCriticalTickets.length,
    closedCriticalTickets.length,
  );
  const sheetWidthClass = getSheetMaxWidthClass(maxSectionCardCount);
  const issueDialogSheetMaxWidth = getSheetMaxWidthExpression(
    maxSectionCardCount,
  );
  const issueDetailsDialogPositionClass =
    side === "right"
      ? "2xl:left-[max(1rem,calc((100vw-var(--sheet-max-width)-var(--issue-dialog-width))/2))] 2xl:right-auto 2xl:translate-x-0"
      : "2xl:right-[max(1rem,calc((100vw-var(--sheet-max-width)-var(--issue-dialog-width))/2))] 2xl:left-auto 2xl:translate-x-0";
  const issueDetailsDialogStyle = {
    "--sheet-max-width": issueDialogSheetMaxWidth,
    "--issue-dialog-width": "520px",
  } as CSSProperties;

  useEffect(() => {
    if (!open) {
      setShowIssueDetailsModal(false);
      setSelectedTicketForIssue(null);
    }
  }, [open]);

  const openIssueDetails = (ticket: Ticket) => {
    setSelectedTicketForIssue(ticket);
    setShowIssueDetailsModal(true);
  };

  const renderTicketGrid = (
    sectionTickets: Ticket[],
    section: "pending" | "closed",
  ) => (
    <div
      className={`mx-auto grid w-full gap-5 ${getCardsGridClass(
        sectionTickets.length,
      )}`}
    >
      {sectionTickets.map((ticket) => {
        const openedAt = getOpenedAt(ticket);
        const issueDetail = ticket.issueDetail?.trim();
        const params = new URLSearchParams({
          fromReport: "highPriorityPending",
          id: ticket.id.toString(),
          view: section === "pending" ? "high_priority" : "all",
          reportSection: section,
          reportTicketId: ticket.id.toString(),
          reportYardName: yardName,
        });
        if (ticket.status) {
          params.set("status", ticket.status.toString());
        }
        const resolvedYardId =
          yardId ?? ticket.yardId ?? ticket.yard?.id ?? undefined;
        if (resolvedYardId !== null && resolvedYardId !== undefined) {
          params.set("yardId", resolvedYardId.toString());
        }
        if (reportStartDate) {
          params.set("reportStartDate", reportStartDate);
        }
        if (reportEndDate) {
          params.set("reportEndDate", reportEndDate);
        }
        const ticketsUrl = `/tickets?${params.toString()}`;

        return (
          <div
            key={ticket.id}
            className="group flex h-full flex-col rounded-2xl border bg-card p-5 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-rose-300 hover:shadow-lg dark:hover:border-rose-800"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-lg font-bold text-foreground">
                  Ticket #{ticket.id}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Opened: {formatDateTime(openedAt)}
                </p>
              </div>
              <Badge
                variant="outline"
                className={`font-semibold ${getPriorityBadgeClass(
                  ticket.priority,
                )}`}
              >
                {(ticket.priority || "HIGH").replace("_", " ")}
              </Badge>
            </div>

            <div className="mt-4 space-y-3 border-t pt-4">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Status</span>
                <span className="font-semibold capitalize text-foreground">
                  {formatStatusLabel(ticket.status)}
                </span>
              </div>

              <div className="flex items-center justify-between gap-3 text-sm">
                <span className="text-muted-foreground">Customer</span>
                <span
                  className="max-w-[65%] truncate text-right font-medium text-foreground"
                  title={getCustomerLabel(ticket)}
                >
                  {getCustomerLabel(ticket)}
                </span>
              </div>

              <div className="flex items-center gap-2 text-sm">
                <User className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">Agent:</span>
                <span className="ml-auto truncate font-medium text-foreground">
                  {getAgentLabel(ticket)}
                </span>
              </div>

              <div className="flex items-center gap-2 text-sm">
                <Megaphone className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">Campaign:</span>
                <span className="ml-auto line-clamp-1 text-right font-medium text-foreground">
                  {getCampaignLabel(ticket)}
                </span>
              </div>
            </div>

            <div className="mt-auto border-t pt-4">
              <div className="flex flex-col gap-2">
                <Button
                  type="button"
                  variant="outline"
                  className="w-full"
                  onClick={() => openIssueDetails(ticket)}
                  disabled={!issueDetail}
                >
                  <FileText className="mr-2 h-3.5 w-3.5" />
                  {issueDetail ? "View Issue Detail" : "No Issue Detail"}
                </Button>

                <Button
                  asChild
                  variant="secondary"
                  className="w-full bg-secondary/60 hover:bg-secondary"
                >
                  <Link href={ticketsUrl} onClick={() => onOpenChange(false)}>
                    View tickets
                    <ExternalLink className="ml-2 h-3.5 w-3.5 opacity-70" />
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent
          side={side}
          className={`flex h-full w-[calc(100vw-1rem)] max-w-[calc(100vw-1rem)] flex-col gap-0 overflow-hidden rounded-none p-0 shadow-2xl ${sheetWidthClass}`}
        >
          <SheetHeader className="border-b bg-card/50 px-6 py-6 backdrop-blur-sm">
            <div>
              <div>
                <SheetTitle className="flex items-center gap-2.5 text-2xl font-bold tracking-tight">
                  <div className="rounded-xl bg-rose-100 p-2.5 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300">
                    <AlertTriangle className="h-6 w-6" />
                  </div>
                  High Priority Pending
                </SheetTitle>
                <SheetDescription className="ml-14 mt-1.5 text-base">
                  {hasNoCriticalTickets
                    ? "No high-priority tickets found in the selected range."
                    : "High-priority tickets in the selected range, divided by status."}
                </SheetDescription>
                <div className="ml-14 mt-2 space-y-1 text-sm">
                  <p className="text-muted-foreground">
                    <span className="font-medium text-foreground">
                      {pendingCriticalTickets.length} Pending
                    </span>
                    {" - "}
                    <span className="text-rose-600 dark:text-rose-400">
                      {pendingEmergencyCount} Emergency
                    </span>
                    {" / "}
                    <span>{pendingHighCount} High</span>
                  </p>
                  <p className="text-muted-foreground">
                    <span className="font-medium text-foreground">
                      {closedCriticalTickets.length} Closed / Resolved
                    </span>
                    {" - "}
                    <span className="text-rose-600 dark:text-rose-400">
                      {closedEmergencyCount} Emergency
                    </span>
                    {" / "}
                    <span>{closedHighCount} High</span>
                  </p>
                </div>
              </div>
            </div>
          </SheetHeader>

          <ScrollArea className="min-h-0 flex-1 bg-muted/10">
            <div className="p-5 sm:p-6 lg:p-8">
              {hasNoCriticalTickets ? (
                <div className="mx-auto flex w-full max-w-md flex-col items-center justify-center py-24 text-center">
                  <div className="mb-5 rounded-full bg-muted/50 p-5 ring-1 ring-border">
                    <XCircle className="h-12 w-12 text-muted-foreground/60" />
                  </div>
                  <h3 className="text-xl font-semibold text-foreground">
                    No high-priority tickets
                  </h3>
                  <p className="mt-2 text-muted-foreground">
                    No HIGH or EMERGENCY tickets were found in this range.
                  </p>
                </div>
              ) : (
                <div className="space-y-8">
                  <section className="space-y-4">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <h3 className="text-base font-semibold text-foreground">
                          Pending
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          High-priority tickets still open.
                        </p>
                      </div>
                      <Badge
                        variant="outline"
                        className="font-semibold border-rose-200 text-rose-700 dark:border-rose-800 dark:text-rose-400"
                      >
                        {pendingCriticalTickets.length}
                      </Badge>
                    </div>
                    {pendingCriticalTickets.length > 0 ? (
                      renderTicketGrid(pendingCriticalTickets, "pending")
                    ) : (
                      <div className="rounded-xl border border-dashed bg-card/60 p-4 text-sm text-muted-foreground">
                        No pending HIGH or EMERGENCY tickets in this range.
                      </div>
                    )}
                  </section>

                  <section className="space-y-4">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <h3 className="text-base font-semibold text-foreground">
                          Closed / Resolved
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          High-priority tickets already closed in this range.
                        </p>
                      </div>
                      <Badge variant="outline" className="font-semibold">
                        {closedCriticalTickets.length}
                      </Badge>
                    </div>
                    {closedCriticalTickets.length > 0 ? (
                      renderTicketGrid(closedCriticalTickets, "closed")
                    ) : (
                      <div className="rounded-xl border border-dashed bg-card/60 p-4 text-sm text-muted-foreground">
                        No closed HIGH or EMERGENCY tickets in this range.
                      </div>
                    )}
                  </section>
                </div>
              )}
            </div>
          </ScrollArea>

          <SheetFooter className="border-t bg-card/50 px-6 py-4 backdrop-blur-sm">
            <div className="flex w-full flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm font-medium text-muted-foreground">
                Each section is sorted by priority and oldest open first
              </p>
              <Button
                variant="default"
                onClick={() => onOpenChange(false)}
                className="h-10 w-full shadow-sm sm:w-auto sm:min-w-[120px]"
              >
                Done
              </Button>
            </div>
          </SheetFooter>
        </SheetContent>
      </Sheet>

      <Dialog
        open={showIssueDetailsModal}
        onOpenChange={setShowIssueDetailsModal}
      >
        <DialogContent
          className={`flex flex-col gap-0 w-[calc(100vw-1rem)] max-h-[82vh] overflow-hidden rounded-2xl p-0 sm:size-[min(520px,calc(100vh-2rem))] sm:max-w-none sm:max-h-none ${issueDetailsDialogPositionClass}`}
          style={issueDetailsDialogStyle}
        >
          <DialogHeader className="border-b bg-card/60 px-5 py-4">
            <DialogTitle className="flex items-center gap-2 text-lg font-bold">
              <FileText className="h-5 w-5 text-rose-600 dark:text-rose-400" />
              Issue Detail
            </DialogTitle>
            <DialogDescription className="text-sm">
              {selectedTicketForIssue
                ? `Ticket #${selectedTicketForIssue.id}`
                : "Selected ticket"}
            </DialogDescription>
          </DialogHeader>

          <ScrollArea className="min-h-0 flex-1 bg-muted/10">
            <div className="space-y-3 p-4">
              {selectedTicketForIssue?.issueDetail?.trim() ? (
                <div className="rounded-xl border bg-card p-3.5 shadow-sm">
                  <div className="mb-2 flex items-center justify-between gap-2">
                    <Badge variant="outline" className="font-mono">
                      Ticket #{selectedTicketForIssue.id}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      {formatDateTime(getOpenedAt(selectedTicketForIssue))}
                    </span>
                  </div>
                  <p className="text-sm leading-relaxed text-foreground whitespace-pre-wrap break-words">
                    {selectedTicketForIssue.issueDetail.trim()}
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
              onClick={() => setShowIssueDetailsModal(false)}
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
