"use client";

import { Calendar, Phone, Ticket as TicketIcon, User, ArrowDownLeft, ArrowUpRight } from "lucide-react";
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
import { cn } from "@/lib/utils";
import {
  InsightIssueBlock,
  InsightMetaRow,
  InsightRecordPanel,
  InsightStatusPill,
  formatInsightDateTime,
  formatInsightLabel,
} from "./yard-insight-ui";
import type { Ticket, YardStats } from "./types";

type NewLeadCustomer = YardStats["ticketsByNewLead"][number];

type LeadDetailsModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  lead: NewLeadCustomer | null;
  relatedTickets: Ticket[];
  onOpenTicket: (ticket: Ticket) => void;
  yardName: string;
};

function DirectionChip({ direction }: { direction?: string | null }) {
  const normalized = (direction || "").toUpperCase();
  const isInbound = normalized === "INBOUND" || normalized === "INCOMING";
  const Icon = isInbound ? ArrowDownLeft : ArrowUpRight;
  const color = isInbound
    ? "text-sky-600 dark:text-sky-400"
    : "text-amber-600 dark:text-amber-400";

  return (
    <span className={cn("inline-flex items-center gap-0.5 text-[10px] font-medium capitalize", color)}>
      <Icon className="size-3" aria-hidden />
      {formatInsightLabel(direction)}
    </span>
  );
}

export function LeadDetailsModal({
  open,
  onOpenChange,
  lead,
  relatedTickets,
  onOpenTicket,
  yardName,
}: LeadDetailsModalProps) {
  if (!lead) return null;

  const displayName = lead.phone?.trim() || lead.customerName;
  const sortedCalls = [...lead.issueDetails].sort(
    (left, right) =>
      new Date(right.createdAt || 0).getTime() - new Date(left.createdAt || 0).getTime()
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-w-[640px] w-[calc(100vw-2rem)] gap-0 overflow-hidden rounded-2xl border border-slate-200 bg-[#f4f5f7] p-0 shadow-2xl dark:border-neutral-800 dark:bg-neutral-950 flex flex-col"
      >
        <div className="relative shrink-0 border-b border-slate-100 bg-white dark:border-neutral-800 dark:bg-neutral-950">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-400 via-[#008f68] to-emerald-600" />
          <DialogHeader className="space-y-0 px-5 py-4 pr-12 text-left sm:px-6">
            <DialogTitle className="flex items-center gap-2.5 text-[15px] font-semibold text-slate-900 dark:text-neutral-100">
              <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-[#f0faf5] text-[#008f68] ring-1 ring-[#008f68]/15 dark:bg-emerald-500/10 dark:text-emerald-400">
                <User className="size-4" />
              </span>
              Lead Customer: {displayName}
            </DialogTitle>
            <DialogDescription className="mt-1 text-xs text-slate-500">
              History of lead calls and linked tickets in {yardName}
            </DialogDescription>
          </DialogHeader>
        </div>

        <ScrollArea className="scrollbar-app max-h-[60vh] overflow-y-auto bg-[#f4f5f7] dark:bg-neutral-950 p-4 sm:p-5">
          <div className="space-y-4">
            {/* General Info summary */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 rounded-xl border border-slate-200/80 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-900/60">
              <InsightMetaRow
                label="Customer Name"
                value={lead.customerName || "—"}
              />
              <InsightMetaRow
                label="Phone"
                value={
                  lead.phone ? (
                    <span className="inline-flex items-center gap-1 font-mono text-[10px]">
                      <Phone className="size-3 text-slate-400" />
                      {lead.phone}
                    </span>
                  ) : (
                    "—"
                  )
                }
              />
              <InsightMetaRow
                label="Customer ID"
                value={lead.customerId !== null ? String(lead.customerId) : "N/A"}
              />
              <InsightMetaRow
                label="Total Activity"
                value={`${sortedCalls.length} calls · ${relatedTickets.length} tickets`}
              />
            </div>

            {/* Lead Calls list */}
            <InsightRecordPanel
              title={`Lead calls (${sortedCalls.length})`}
              badge={
                <span className="rounded-md bg-emerald-50 px-1.5 py-0.5 text-[9px] font-semibold uppercase text-[#008f68] ring-1 ring-emerald-200/70 dark:bg-emerald-950/40 dark:text-emerald-300">
                  New lead
                </span>
              }
            >
              {sortedCalls.length === 0 ? (
                <p className="text-[11px] text-slate-500 py-2">
                  No call rows returned for this customer.
                </p>
              ) : (
                <div className="space-y-3">
                  {sortedCalls.map((call, callIndex) => {
                    const callId = call.callId ?? call.ticketId;
                    return (
                      <div
                        key={`${callId}-${callIndex}`}
                        className="rounded-lg border border-slate-200/80 bg-white p-3 dark:border-neutral-700 dark:bg-neutral-950 space-y-2"
                      >
                        <div className="flex flex-wrap items-center justify-between gap-1">
                          <span className="inline-flex items-center gap-1 rounded-md bg-emerald-50 px-1.5 py-0.5 text-[10px] font-semibold text-[#008f68] ring-1 ring-emerald-200/70 dark:bg-emerald-950/40 dark:text-emerald-300">
                            <Phone className="size-3" aria-hidden />
                            Call #{callId}
                          </span>
                          <InsightStatusPill status={call.status} />
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
                          <InsightMetaRow
                            label="When"
                            value={
                              <span className="inline-flex items-center gap-1">
                                <Calendar className="size-3 text-slate-400" />
                                {formatInsightDateTime(call.createdAt)}
                              </span>
                            }
                          />
                          <InsightMetaRow
                            label="Direction"
                            value={<DirectionChip direction={call.direction} />}
                          />
                          <InsightMetaRow
                            label="Agent"
                            value={
                              <span className="inline-flex items-center gap-1">
                                <User className="size-3 text-slate-400" />
                                {call.agentName || "Unassigned"}
                              </span>
                            }
                          />
                          <InsightMetaRow
                            label="Disposition"
                            value={formatInsightLabel(call.disposition || "NEW_LEAD")}
                          />
                        </div>
                        <div>
                          <p className="mb-1 text-[9px] font-semibold uppercase tracking-wide text-slate-400">
                            Notes
                          </p>
                          <InsightIssueBlock
                            text={call.issueDetail}
                            emptyLabel="No call notes"
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </InsightRecordPanel>

            {/* Linked Tickets list */}
            <InsightRecordPanel
              title={`Tickets (${relatedTickets.length})`}
              badge={
                <span className="inline-flex items-center gap-0.5 rounded-md bg-sky-50 px-1.5 py-0.5 text-[9px] font-semibold uppercase text-sky-700 ring-1 ring-sky-200/70 dark:bg-sky-950/40 dark:text-sky-300">
                  <TicketIcon className="size-2.5" aria-hidden />
                  Ticket
                </span>
              }
            >
              {relatedTickets.length === 0 ? (
                <p className="text-[11px] text-slate-500 py-2">
                  No tickets linked to this customer in the selected range.
                </p>
              ) : (
                <div className="space-y-3">
                  {relatedTickets
                    .slice()
                    .sort(
                      (left, right) =>
                        new Date(right.createdAt || 0).getTime() -
                        new Date(left.createdAt || 0).getTime()
                    )
                    .map((ticket) => (
                      <div
                        key={ticket.id}
                        className="rounded-lg border border-sky-200/70 border-l-2 border-l-sky-400 bg-sky-50/35 p-3 dark:border-sky-800 dark:border-l-sky-500 dark:bg-sky-950/20 space-y-2"
                      >
                        <div className="flex flex-wrap items-center justify-between gap-1">
                          <span className="inline-flex items-center gap-1 rounded-md bg-sky-100/80 px-1.5 py-0.5 text-[10px] font-semibold text-sky-800 ring-1 ring-sky-200/80 dark:bg-sky-900/40 dark:text-sky-200">
                            <TicketIcon className="size-3" aria-hidden />
                            Ticket #{ticket.id}
                          </span>
                          <InsightStatusPill status={ticket.status} />
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
                          <InsightMetaRow
                            label="Priority"
                            value={
                              <span className="uppercase text-[10px] font-semibold">
                                {ticket.priority || "—"}
                              </span>
                            }
                          />
                          <InsightMetaRow
                            label="Type"
                            value={formatInsightLabel(
                              ticket.ticketType || ticket.disposition || ticket.campaignOption
                            )}
                          />
                          <InsightMetaRow
                            label="Agent"
                            value={ticket.assignedTo?.name || ticket.agent?.name || "Unassigned"}
                          />
                          <InsightMetaRow
                            label="Opened"
                            value={formatInsightDateTime(ticket.createdAt)}
                          />
                        </div>
                        <div>
                          <p className="mb-1 text-[9px] font-semibold uppercase tracking-wide text-slate-400">
                            Issue
                          </p>
                          <InsightIssueBlock
                            text={ticket.issueDetail}
                            emptyLabel="No issue detail"
                          />
                        </div>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => onOpenTicket(ticket)}
                          className="h-7 w-full rounded-lg text-[11px] bg-white hover:bg-slate-50 dark:bg-neutral-900 dark:hover:bg-neutral-800"
                        >
                          View ticket details
                          <TicketIcon className="ml-1 size-3 opacity-70" />
                        </Button>
                      </div>
                    ))}
                </div>
              )}
            </InsightRecordPanel>
          </div>
        </ScrollArea>

        <DialogFooter className="shrink-0 border-t border-slate-200 bg-slate-50/80 px-5 py-3 dark:border-neutral-800 dark:bg-neutral-900/60">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="h-9 rounded-lg text-xs w-full sm:w-auto sm:min-w-[80px]"
          >
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
