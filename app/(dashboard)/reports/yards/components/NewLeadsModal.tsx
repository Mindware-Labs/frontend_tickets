"use client";

import { useEffect, useMemo, useState, type CSSProperties } from "react";
import Link from "next/link";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import {
  ExternalLink,
  Phone,
  UserPlus,
  XCircle,
  Ticket,
  FileText,
} from "lucide-react";

type NewLeadCustomer = {
  customerId: number | null;
  customerName: string;
  count: number;
  phone?: string | null;
  issueDetails: {
    ticketId: number;
    issueDetail: string;
    createdAt?: string | null;
  }[];
};

type NewLeadsModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  side?: "left" | "right";
  yardId: number | string;
  yardName: string;
  reportStartDate?: string;
  reportEndDate?: string;
  customersByNewLead: NewLeadCustomer[];
};

const getRankBadgeClass = () => {
  return "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-800/50";
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

export function NewLeadsModal({
  open,
  onOpenChange,
  side = "right",
  yardId,
  yardName,
  reportStartDate,
  reportEndDate,
  customersByNewLead,
}: NewLeadsModalProps) {
  const leads = useMemo(
    () =>
      [...customersByNewLead].sort((left, right) => {
        if (right.count !== left.count) return right.count - left.count;
        return left.customerName.localeCompare(right.customerName);
      }),
    [customersByNewLead],
  );

  const totalLeadTickets = useMemo(
    () => leads.reduce((sum, lead) => sum + lead.count, 0),
    [leads],
  );
  const [selectedLeadForIssues, setSelectedLeadForIssues] =
    useState<NewLeadCustomer | null>(null);
  const [showIssueDetailsModal, setShowIssueDetailsModal] = useState(false);
  const sheetWidthClass = getSheetMaxWidthClass(leads.length);
  const cardsGridClass = getCardsGridClass(leads.length);
  const issueDialogSheetMaxWidth = getSheetMaxWidthExpression(leads.length);

  useEffect(() => {
    if (!open) {
      setShowIssueDetailsModal(false);
      setSelectedLeadForIssues(null);
    }
  }, [open]);

  const issueDetailsDialogPositionClass =
    side === "right"
      ? "2xl:left-[max(1rem,calc((100vw-var(--sheet-max-width)-var(--issue-dialog-width))/2))] 2xl:right-auto 2xl:translate-x-0"
      : "2xl:right-[max(1rem,calc((100vw-var(--sheet-max-width)-var(--issue-dialog-width))/2))] 2xl:left-auto 2xl:translate-x-0";
  const issueDetailsDialogStyle = {
    "--sheet-max-width": issueDialogSheetMaxWidth,
    "--issue-dialog-width": "520px",
  } as CSSProperties;

  const openIssueDetails = (lead: NewLeadCustomer) => {
    setSelectedLeadForIssues(lead);
    setShowIssueDetailsModal(true);
  };

  const formatIssueDate = (value?: string | null) => {
    if (!value) return "Unknown date";
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) return "Unknown date";
    return parsed.toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side={side}
        className={`flex h-full w-[calc(100vw-1rem)] max-w-[calc(100vw-1rem)] flex-col gap-0 overflow-hidden border-slate-200/80 bg-[#f4f5f7] p-0 shadow-2xl dark:border-slate-800 dark:bg-slate-950 ${sheetWidthClass}`}
      >
        {/* Header */}
        <SheetHeader className="z-10 border-b border-slate-200/80 bg-white px-4 py-3 dark:border-slate-800 dark:bg-slate-950">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <SheetTitle className="flex items-center gap-2.5 text-[15px] font-semibold text-slate-900 dark:text-slate-100">
                <div className="flex size-8 items-center justify-center rounded-lg bg-[#f0faf5] text-[#008f68] ring-1 ring-[#008f68]/15 dark:bg-emerald-500/10 dark:text-emerald-400">
                  <UserPlus className="size-3.5" />
                </div>
                New Lead Customers
              </SheetTitle>
              <SheetDescription className="ml-10 mt-1 text-xs text-slate-500 dark:text-slate-400">
                Customers marked as{" "}
                <span className="font-semibold text-foreground">new lead</span>{" "}
                in{" "}
                <span className="font-semibold text-foreground underline decoration-primary/30 underline-offset-4">
                  {yardName}
                </span>
              </SheetDescription>
            </div>

            {/* Badges de Resumen */}
            <div className="ml-10 flex flex-wrap items-center gap-1.5 sm:ml-0">
              <div className="flex h-7 items-center gap-1.5 rounded-lg border border-slate-200/80 bg-slate-50 px-2.5 text-slate-700 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200">
                <UserPlus className="size-3.5 text-slate-400" />
                <span className="text-[11px] font-semibold">
                  {leads.length} {leads.length === 1 ? "Customer" : "Customers"}
                </span>
              </div>
              <div className="flex h-7 items-center gap-1.5 rounded-lg border border-emerald-200 bg-emerald-50 px-2.5 text-[#008f68] dark:border-emerald-800/60 dark:bg-emerald-900/20 dark:text-emerald-400">
                <Ticket className="size-3.5" />
                <span className="text-[11px] font-semibold">
                  {totalLeadTickets} Tickets
                </span>
              </div>
            </div>
          </div>
        </SheetHeader>

        {/* Contenido Principal */}
        <ScrollArea className="min-h-0 flex-1 bg-[#f4f5f7] scrollbar-app dark:bg-slate-950">
          <div className="p-3 sm:p-4">
            {leads.length === 0 ? (
              <div className="mx-auto flex w-full max-w-md flex-col items-center justify-center py-16 text-center">
                <div className="mb-4 rounded-xl bg-white p-4 ring-1 ring-slate-200/80 dark:bg-slate-950 dark:ring-slate-800">
                  <XCircle className="size-10 text-slate-400" />
                </div>
                <h3 className="text-[15px] font-semibold text-slate-900 dark:text-slate-100">
                  No new leads
                </h3>
                <p className="mt-1 text-xs text-slate-500">
                  No new lead customers were found in this date range.
                </p>
              </div>
            ) : (
              <div className={`grid gap-3 ${cardsGridClass}`}>
                {leads.map((lead, index) => {
                  const rankClass = getRankBadgeClass();

                  // URL params building
                  const params = new URLSearchParams({
                    fromReport: "newLead",
                    yardId: yardId.toString(),
                    reportLeadName: lead.customerName,
                    reportYardName: yardName,
                  });
                  if (lead.customerId !== null) {
                    params.set("customerId", lead.customerId.toString());
                  } else {
                    params.set("search", lead.customerName);
                  }
                  if (reportStartDate) {
                    params.set("reportStartDate", reportStartDate);
                  }
                  if (reportEndDate) {
                    params.set("reportEndDate", reportEndDate);
                  }
                  const ticketsUrl = `/calls?tab=calls&${params.toString()}`;

                  return (
                    <div
                      key={`${lead.customerId ?? lead.customerName}-${index}`}
                      className="group flex h-full flex-col rounded-xl border border-slate-200/80 bg-white p-3 shadow-[0_1px_3px_rgba(0,0,0,0.06)] transition-colors hover:border-[#008f68]/35 dark:border-slate-800 dark:bg-slate-950"
                    >
                      {/* Top Tarjeta */}
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0 flex-1">
                          <p
                            className="truncate text-[13px] font-semibold leading-tight text-slate-900 dark:text-slate-100"
                            title={lead.customerName}
                          >
                            {lead.customerName}
                          </p>
                          <p className="mt-1 font-mono text-[10px] font-medium text-slate-400">
                            {lead.customerId !== null
                              ? `ID: ${lead.customerId}`
                              : "ID: N/A"}
                          </p>
                        </div>
                        <Badge
                          variant="outline"
                          className={`shrink-0 px-2 py-0.5 text-[10px] font-semibold shadow-sm ${rankClass}`}
                        >
                          #{index + 1}
                        </Badge>
                      </div>

                      {/* Info & Tickets (Empujado al fondo para alinear botones) */}
                      <div className="mt-auto space-y-3 pt-3">
                        {/* Box de Tickets Destacado */}
                        <div className="flex items-center justify-between rounded-lg border border-emerald-100 bg-[#f0faf5] px-3 py-2 dark:border-emerald-900/30 dark:bg-emerald-950/20">
                          <p className="text-[10px] font-semibold uppercase tracking-wider text-[#008f68] dark:text-emerald-400">
                            Lead Tickets
                          </p>
                          <p className="text-xl font-bold leading-none text-[#008f68] dark:text-emerald-300">
                            {lead.count}
                          </p>
                        </div>

                        {/* Contacto */}
                        <div className="flex items-center gap-2 px-1 text-xs text-slate-500">
                          <Phone className="size-3.5 shrink-0 text-slate-400" />
                          {lead.phone ? (
                            <span className="truncate font-medium text-slate-700 dark:text-slate-200">
                              {lead.phone}
                            </span>
                          ) : (
                            <span className="italic opacity-60">
                              No phone provided
                            </span>
                          )}
                        </div>

                        {/* Botón Acción */}
                        <div className="border-t border-slate-100 pt-3 dark:border-slate-800">
                          <div className="flex flex-col gap-2">
                            <Button
                              type="button"
                              variant="outline"
                              className="h-8 w-full rounded-lg text-xs"
                              onClick={() => openIssueDetails(lead)}
                              disabled={lead.issueDetails.length === 0}
                            >
                              <FileText className="mr-2 h-3.5 w-3.5" />
                              {lead.issueDetails.length > 0
                                ? `View Issue Detail${
                                    lead.issueDetails.length > 1 ? "s" : ""
                                  } (${lead.issueDetails.length})`
                                : "No Issue Detail"}
                            </Button>

                            <Button
                              asChild
                              variant="secondary"
                              className="h-8 w-full rounded-lg bg-slate-100 text-xs hover:bg-slate-200 dark:bg-slate-900 dark:hover:bg-slate-800"
                            >
                              <Link
                                href={ticketsUrl}
                                onClick={() => onOpenChange(false)}
                              >
                                View tickets
                                <ExternalLink className="ml-2 h-3.5 w-3.5 opacity-70" />
                              </Link>
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </ScrollArea>

        {/* Footer */}
        <SheetFooter className="border-t border-slate-200/80 bg-white px-4 py-3 dark:border-slate-800 dark:bg-slate-950">
          <div className="flex w-full flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs font-medium text-slate-500">
              Ranked descending by ticket volume
            </p>
            <Button
              variant="default"
              onClick={() => onOpenChange(false)}
              className="h-8 w-full rounded-lg bg-[#008f68] text-xs shadow-sm hover:bg-[#007a5a] sm:w-auto sm:min-w-[96px]"
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
              <FileText className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
              Issue Detail
            </DialogTitle>
            <DialogDescription className="text-sm">
              {selectedLeadForIssues?.customerName || "Lead"} -{" "}
              {selectedLeadForIssues?.issueDetails.length || 0} detail
              {selectedLeadForIssues?.issueDetails.length === 1 ? "" : "s"}
            </DialogDescription>
          </DialogHeader>

          <ScrollArea className="min-h-0 flex-1 bg-muted/10">
            <div className="space-y-3 p-4">
              {selectedLeadForIssues?.issueDetails?.length ? (
                selectedLeadForIssues.issueDetails.map((item, index) => (
                  <div
                    key={`${item.ticketId}-${index}`}
                    className="rounded-xl border bg-card p-3.5 shadow-sm"
                  >
                    <div className="mb-2 flex items-center justify-between gap-2">
                      <Badge variant="outline" className="font-mono">
                        Ticket #{item.ticketId}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {formatIssueDate(item.createdAt)}
                      </span>
                    </div>
                    <p className="text-sm leading-relaxed text-foreground whitespace-pre-wrap break-words">
                      {item.issueDetail}
                    </p>
                  </div>
                ))
              ) : (
                <div className="rounded-xl border border-dashed bg-card/60 p-6 text-center text-sm text-muted-foreground">
                  No Issue Detail available for this lead.
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
