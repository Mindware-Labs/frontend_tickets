"use client";

import Link from "next/link";
import {
  Calendar,
  ExternalLink,
  Megaphone,
  Phone,
  Ticket as TicketIcon,
  User,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { buildContactCenterUrl } from "@/lib/contact-center-url";
import {
  InsightIssueBlock,
  InsightMetaRow,
  InsightPriorityPill,
  InsightStatusPill,
  formatInsightDateTime,
  formatInsightLabel,
} from "./yard-insight-ui";
import type { Ticket } from "./types";

type TicketDetailsModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  ticket: Ticket | null;
  yardId?: number | string;
  yardName: string;
  reportStartDate?: string;
  reportEndDate?: string;
};

const getOpenedAt = (ticket: Ticket) => ticket.createdAt || ticket.updatedAt;

export function TicketDetailsModal({
  open,
  onOpenChange,
  ticket,
  yardId,
  yardName,
  reportStartDate,
  reportEndDate,
}: TicketDetailsModalProps) {
  if (!ticket) return null;

  const phone =
    ticket.customerPhone?.trim() ||
    ticket.customer?.phone?.trim() ||
    ticket.phone?.trim();
  const resolvedYardId =
    yardId ?? ticket.yardId ?? ticket.yard?.id ?? undefined;

  const returnTo = (() => {
    const params = new URLSearchParams();
    if (resolvedYardId !== null && resolvedYardId !== undefined) {
      params.set("yardId", String(resolvedYardId));
    }
    if (reportStartDate) params.set("startDate", reportStartDate);
    if (reportEndDate) params.set("endDate", reportEndDate);
    const qs = params.toString();
    return qs ? `/reports/yards?${qs}` : "/reports/yards";
  })();

  const agentName =
    ticket.assignedTo?.name || ticket.agent?.name || "Unassigned";

  const campaignName = ticket.campaign?.nombre || "—";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-w-[560px] w-[calc(100vw-2rem)] gap-0 overflow-hidden rounded-2xl border border-slate-200 bg-[#f4f5f7] p-0 shadow-2xl dark:border-slate-800 dark:bg-slate-950 flex flex-col"
      >
        <div className="relative shrink-0 border-b border-slate-100 bg-white dark:border-slate-800 dark:bg-slate-950">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-sky-400 via-indigo-500 to-[#008f68]" />
          <DialogHeader className="space-y-0 px-5 py-4 pr-12 text-left sm:px-6">
            <DialogTitle className="flex items-center gap-2.5 text-[15px] font-semibold text-slate-900 dark:text-slate-100">
              <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-sky-50 text-sky-600 ring-1 ring-sky-200/70 dark:bg-sky-500/10 dark:text-sky-400">
                <TicketIcon className="size-4" />
              </span>
              Ticket Details #{ticket.id}
            </DialogTitle>
            <DialogDescription className="mt-1 text-xs text-slate-500">
              Detailed breakdown of the ticket history and metadata
            </DialogDescription>
          </DialogHeader>
        </div>

        <ScrollArea className="scrollbar-app max-h-[60vh] overflow-y-auto bg-[#f4f5f7] dark:bg-slate-950 p-4 sm:p-5">
          <div className="space-y-4">
            {/* Status & Priority Row */}
            <div className="flex items-center justify-between rounded-xl border border-slate-200/80 bg-white p-3 dark:border-slate-800 dark:bg-slate-900/60">
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-slate-500">Priority:</span>
                <InsightPriorityPill priority={ticket.priority} />
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-slate-500">Status:</span>
                <InsightStatusPill status={ticket.status} />
              </div>
            </div>

            {/* Metadata Info Panel */}
            <div className="rounded-xl border border-slate-200/80 bg-white p-4 dark:border-slate-800 dark:bg-slate-900/60 space-y-3">
              <h4 className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                General Information
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <InsightMetaRow
                  label="Customer"
                  value={
                    ticket.customer?.name?.trim() ||
                    (ticket.customerId != null
                      ? `Customer #${ticket.customerId}`
                      : "—")
                  }
                />
                <InsightMetaRow
                  label="Phone"
                  value={
                    phone ? (
                      <span className="inline-flex items-center gap-1 font-mono text-[10px]">
                        <Phone className="size-3 text-slate-400" />
                        {phone}
                      </span>
                    ) : (
                      "—"
                    )
                  }
                />
                <InsightMetaRow
                  label="Agent"
                  value={
                    <span className="inline-flex items-center gap-1">
                      <User className="size-3 text-slate-400" />
                      {agentName}
                    </span>
                  }
                />
                <InsightMetaRow
                  label="Campaign"
                  value={
                    <span className="inline-flex items-center gap-1">
                      <Megaphone className="size-3 text-slate-400" />
                      {campaignName}
                    </span>
                  }
                />
                <InsightMetaRow
                  label="Type"
                  value={formatInsightLabel(
                    ticket.ticketType ||
                      ticket.disposition ||
                      ticket.campaignOption,
                  )}
                />
                <InsightMetaRow
                  label="Opened Date"
                  value={
                    <span className="inline-flex items-center gap-1">
                      <Calendar className="size-3 text-slate-400" />
                      {formatInsightDateTime(getOpenedAt(ticket))}
                    </span>
                  }
                />
              </div>
            </div>

            {/* Issue Description */}
            <div className="rounded-xl border border-slate-200/80 bg-white p-4 dark:border-slate-800 dark:bg-slate-900/60 space-y-2">
              <h4 className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                Issue Description
              </h4>
              <InsightIssueBlock
                text={ticket.issueDetail}
                emptyLabel="No issue details specified"
              />
            </div>
          </div>
        </ScrollArea>

        <DialogFooter className="shrink-0 border-t border-slate-200 bg-slate-50/80 px-5 py-3 dark:border-slate-800 dark:bg-slate-900/60">
          <div className="flex w-full flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <Button
              asChild
              className="h-9 rounded-lg bg-[#008f68] text-xs hover:bg-[#007a5a] w-full sm:w-auto"
            >
              <Link
                href={buildContactCenterUrl({
                  tab: "tickets",
                  id: ticket.id,
                  fromReport: "yardDetailModal",
                  yardId: resolvedYardId != null ? String(resolvedYardId) : undefined,
                  reportYardName: yardName,
                  reportTicketId: String(ticket.id),
                  reportStartDate,
                  reportEndDate,
                  returnTo,
                })}
                onClick={() => onOpenChange(false)}
              >
                Go to Contact Center
                <ExternalLink className="ml-1.5 size-3.5 opacity-80" />
              </Link>
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="h-9 rounded-lg text-xs w-full sm:w-auto sm:min-w-[80px]"
            >
              Close
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
