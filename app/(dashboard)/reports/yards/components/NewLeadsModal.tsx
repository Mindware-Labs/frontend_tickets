"use client";

import Link from "next/link";
import { useMemo } from "react";
import {
  ArrowDownLeft,
  ArrowUpRight,
  Calendar,
  ExternalLink,
  Phone,
  Ticket as TicketIcon,
  User,
  UserPlus,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { buildContactCenterUrl } from "@/lib/contact-center-url";
import { cn } from "@/lib/utils";
import { YardContextChip } from "./yard-dashboard-chrome";
import {
  InsightEmptyState,
  InsightIssueBlock,
  InsightKpiStrip,
  InsightMetaRow,
  InsightRecordPanel,
  InsightSheetAccent,
  InsightStatusPill,
  InsightSummaryBadge,
  formatInsightDateTime,
  formatInsightLabel,
  getInsightCardsGridClass,
  getInsightSheetMaxWidthClass,
  insightCardClass,
  insightSheetHeaderClass,
  useInsightSheetChrome,
} from "./yard-insight-ui";
import type { Ticket, YardStats } from "./types";

type NewLeadCustomer = YardStats["ticketsByNewLead"][number];

type NewLeadsModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  side?: "left" | "right";
  yardId: number | string;
  yardName: string;
  reportStartDate?: string;
  reportEndDate?: string;
  customersByNewLead: NewLeadCustomer[];
  yardTickets?: Ticket[];
};

function formatPhoneLabel(value?: string | null) {
  if (!value) return "—";
  return value.replace(/\s+/g, "\u00a0");
}

function DirectionChip({ direction }: { direction?: string | null }) {
  const normalized = (direction || "").toUpperCase();
  const isInbound =
    normalized === "INBOUND" || normalized === "INCOMING";
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

export function NewLeadsModal({
  open,
  onOpenChange,
  side = "right",
  yardId,
  yardName,
  reportStartDate,
  reportEndDate,
  customersByNewLead,
  yardTickets = [],
}: NewLeadsModalProps) {
  const leads = useMemo(
    () =>
      [...customersByNewLead].sort((left, right) => {
        if (right.count !== left.count) return right.count - left.count;
        return left.customerName.localeCompare(right.customerName);
      }),
    [customersByNewLead],
  );

  const totalLeadCalls = useMemo(
    () => leads.reduce((sum, lead) => sum + lead.count, 0),
    [leads],
  );

  const ticketsByCustomerId = useMemo(() => {
    const map = new Map<string, Ticket[]>();
    yardTickets.forEach((ticket) => {
      const key =
        ticket.customerId !== null && ticket.customerId !== undefined
          ? String(ticket.customerId)
          : null;
      if (!key) return;
      const existing = map.get(key) || [];
      existing.push(ticket);
      map.set(key, existing);
    });
    return map;
  }, [yardTickets]);

  const periodLabel =
    reportStartDate && reportEndDate
      ? `${reportStartDate} → ${reportEndDate}`
      : "All dates";

  useInsightSheetChrome(open);

  const sheetWidthClass = getInsightSheetMaxWidthClass(leads.length);
  const cardsGridClass = getInsightCardsGridClass(leads.length);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side={side}
        className={cn(
          "flex h-full w-[calc(100vw-1rem)] max-w-[calc(100vw-1rem)] flex-col gap-0 overflow-hidden border-slate-200/80 bg-[#f4f5f7] p-0 shadow-2xl dark:border-slate-800 dark:bg-slate-950",
          sheetWidthClass,
        )}
      >
        <div className="relative shrink-0 border-b border-slate-200/80 bg-white dark:border-slate-800 dark:bg-slate-950">
          <InsightSheetAccent />
          <SheetHeader className={insightSheetHeaderClass}>
            <div className="flex flex-col gap-2 lg:flex-row lg:items-start lg:justify-between">
              <div className="min-w-0 flex-1 pr-1">
                <SheetTitle className="flex items-center gap-2.5 text-[15px] font-semibold text-slate-900 dark:text-slate-100">
                  <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-[#f0faf5] text-[#008f68] ring-1 ring-[#008f68]/15 dark:bg-emerald-500/10 dark:text-emerald-400">
                    <UserPlus className="size-3.5" aria-hidden />
                  </span>
                  New Lead Customers
                </SheetTitle>
                <SheetDescription className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                  Customers with{" "}
                  <span className="font-semibold text-slate-800 dark:text-slate-100">
                    new lead
                  </span>{" "}
                  calls in{" "}
                  <span className="font-semibold text-slate-800 dark:text-slate-100">
                    {yardName}
                  </span>
                </SheetDescription>
              </div>
              <div className="flex min-w-0 max-w-full flex-wrap items-center justify-start gap-1.5 lg:max-w-[min(100%,22rem)] lg:justify-end">
                <YardContextChip label="Range" value={periodLabel} />
                <InsightSummaryBadge
                  icon={UserPlus}
                  label={`${leads.length} ${leads.length === 1 ? "customer" : "customers"}`}
                />
                <InsightSummaryBadge
                  icon={Phone}
                  label={`${totalLeadCalls} lead ${totalLeadCalls === 1 ? "call" : "calls"}`}
                  tone="brand"
                />
              </div>
            </div>
          </SheetHeader>
        </div>

        <ScrollArea className="min-h-0 flex-1 scrollbar-app">
          <div className="p-3 sm:p-4">
            {leads.length === 0 ? (
              <InsightEmptyState
                icon={UserPlus}
                title="No new leads"
                description="No new lead customers were found in this date range."
              />
            ) : (
              <div className={cn("grid gap-3", cardsGridClass)}>
                {leads.map((lead, index) => {
                  const customerKey =
                    lead.customerId !== null
                      ? String(lead.customerId)
                      : null;
                  const relatedTickets = customerKey
                    ? ticketsByCustomerId.get(customerKey) || []
                    : [];
                  const sortedCalls = [...lead.issueDetails].sort(
                    (left, right) =>
                      new Date(right.createdAt || 0).getTime() -
                      new Date(left.createdAt || 0).getTime(),
                  );
                  const displayName =
                    lead.phone?.trim() || lead.customerName;
                  const callsUrl = buildContactCenterUrl({
                    tab: "calls",
                    fromReport: "newLead",
                    yardId: String(yardId),
                    customerId:
                      lead.customerId !== null
                        ? String(lead.customerId)
                        : undefined,
                    search:
                      lead.customerId === null
                        ? lead.customerName
                        : undefined,
                    reportStartDate,
                    reportEndDate,
                    reportYardName: yardName,
                    reportLeadName: lead.customerName,
                  });
                  const ticketsUrl = buildContactCenterUrl({
                    tab: "tickets",
                    fromReport: "newLead",
                    yardId: String(yardId),
                    customerId:
                      lead.customerId !== null
                        ? String(lead.customerId)
                        : undefined,
                    search:
                      lead.customerId === null
                        ? lead.customerName
                        : undefined,
                    reportStartDate,
                    reportEndDate,
                    reportYardName: yardName,
                    reportLeadName: lead.customerName,
                  });

                  return (
                    <article
                      key={`${lead.customerId ?? lead.customerName}-${index}`}
                      className={cn(insightCardClass, "hover:border-[#008f68]/35")}
                    >
                      <div className="border-b border-slate-100/80 px-3 py-2.5 dark:border-slate-800">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0 flex-1">
                            <p
                              className="truncate text-[13px] font-bold tracking-tight text-slate-900 dark:text-slate-100"
                              title={displayName}
                            >
                              {displayName}
                            </p>
                            <p className="mt-0.5 font-mono text-[10px] text-slate-400">
                              {lead.customerId !== null
                                ? `Customer ID ${lead.customerId}`
                                : "Customer ID N/A"}
                            </p>
                          </div>
                          <span className="inline-flex h-5 items-center rounded-md border border-emerald-200/80 bg-emerald-50 px-1.5 text-[10px] font-semibold text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300">
                            #{index + 1}
                          </span>
                        </div>
                        <div className="mt-2 grid grid-cols-2 gap-2">
                          <InsightKpiStrip
                            label="Lead calls"
                            value={lead.count}
                            tone="brand"
                          />
                          <InsightKpiStrip
                            label="Tickets"
                            value={relatedTickets.length}
                            tone="sky"
                          />
                        </div>
                        <div className="mt-2 flex items-center gap-1.5 text-[11px] text-slate-600 dark:text-slate-300">
                          <Phone className="size-3.5 shrink-0 text-slate-400" />
                          <span className="truncate font-medium">
                            {lead.phone
                              ? formatPhoneLabel(lead.phone)
                              : "No phone on file"}
                          </span>
                        </div>
                      </div>

                      <div className="flex min-h-0 flex-1 flex-col gap-2 p-2.5">
                        <InsightRecordPanel
                          title={`Lead calls (${sortedCalls.length})`}
                          badge={
                            <span className="rounded-md bg-emerald-50 px-1.5 py-0.5 text-[9px] font-semibold uppercase text-[#008f68] ring-1 ring-emerald-200/70 dark:bg-emerald-950/40 dark:text-emerald-300">
                              New lead
                            </span>
                          }
                        >
                          {sortedCalls.length === 0 ? (
                            <p className="text-[11px] text-slate-500">
                              No call rows returned for this customer.
                            </p>
                          ) : (
                            sortedCalls.map((call, callIndex) => {
                              const callId = call.callId ?? call.ticketId;
                              return (
                                <div
                                  key={`${callId}-${callIndex}`}
                                  className="rounded-lg border border-slate-200/80 bg-white p-2 dark:border-slate-700 dark:bg-slate-950"
                                >
                                  <div className="mb-1.5 flex flex-wrap items-center justify-between gap-1">
                                    <span className="inline-flex items-center gap-1 rounded-md bg-emerald-50 px-1.5 py-0.5 text-[10px] font-semibold text-[#008f68] ring-1 ring-emerald-200/70 dark:bg-emerald-950/40 dark:text-emerald-300">
                                      <Phone className="size-3" aria-hidden />
                                      Call #{callId}
                                    </span>
                                    <InsightStatusPill status={call.status} />
                                  </div>
                                  <div className="space-y-1">
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
                                      value={
                                        <DirectionChip direction={call.direction} />
                                      }
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
                                      value={formatInsightLabel(
                                        call.disposition || "NEW_LEAD",
                                      )}
                                    />
                                  </div>
                                  <div className="mt-2">
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
                            })
                          )}
                        </InsightRecordPanel>

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
                            <p className="text-[11px] text-slate-500">
                              No tickets linked to this customer in the
                              selected range.
                            </p>
                          ) : (
                            relatedTickets
                              .slice()
                              .sort(
                                (left, right) =>
                                  new Date(right.createdAt || 0).getTime() -
                                  new Date(left.createdAt || 0).getTime(),
                              )
                              .map((ticket) => (
                                <div
                                  key={ticket.id}
                                  className="rounded-lg border border-sky-200/70 border-l-2 border-l-sky-400 bg-sky-50/35 p-2 dark:border-sky-800 dark:border-l-sky-500 dark:bg-sky-950/20"
                                >
                                  <div className="mb-1.5 flex flex-wrap items-center justify-between gap-1">
                                    <span className="inline-flex items-center gap-1 rounded-md bg-sky-100/80 px-1.5 py-0.5 text-[10px] font-semibold text-sky-800 ring-1 ring-sky-200/80 dark:bg-sky-900/40 dark:text-sky-200">
                                      <TicketIcon className="size-3" aria-hidden />
                                      Ticket #{ticket.id}
                                    </span>
                                    <InsightStatusPill status={ticket.status} />
                                  </div>
                                  <div className="space-y-1">
                                    <InsightMetaRow
                                      label="Priority"
                                      value={
                                        <span className="uppercase text-[10px]">
                                          {ticket.priority || "—"}
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
                                      label="Agent"
                                      value={
                                        ticket.assignedTo?.name ||
                                        ticket.agent?.name ||
                                        "Unassigned"
                                      }
                                    />
                                    <InsightMetaRow
                                      label="Opened"
                                      value={formatInsightDateTime(
                                        ticket.createdAt,
                                      )}
                                    />
                                  </div>
                                  <div className="mt-2">
                                    <p className="mb-1 text-[9px] font-semibold uppercase tracking-wide text-slate-400">
                                      Issue
                                    </p>
                                    <InsightIssueBlock
                                      text={ticket.issueDetail}
                                      emptyLabel="No issue detail"
                                    />
                                  </div>
                                  <Button
                                    asChild
                                    variant="outline"
                                    size="sm"
                                    className="mt-2 h-7 w-full rounded-lg text-[11px]"
                                  >
                                    <Link
                                      href={buildContactCenterUrl({
                                        tab: "tickets",
                                        id: ticket.id,
                                        yardId: String(yardId),
                                        fromReport: "newLead",
                                        reportYardName: yardName,
                                      })}
                                      onClick={() => onOpenChange(false)}
                                    >
                                      Open ticket
                                      <ExternalLink className="ml-1 size-3 opacity-70" />
                                    </Link>
                                  </Button>
                                </div>
                              ))
                          )}
                        </InsightRecordPanel>
                      </div>

                      <div className="mt-auto flex gap-2 border-t border-slate-100 p-2.5 dark:border-slate-800">
                        <Button
                          asChild
                          variant="outline"
                          className="h-8 flex-1 rounded-lg text-[11px]"
                        >
                          <Link href={callsUrl} onClick={() => onOpenChange(false)}>
                            <Phone className="mr-1.5 size-3.5" />
                            Calls
                          </Link>
                        </Button>
                        <Button
                          asChild
                          className="h-8 flex-1 rounded-lg bg-[#008f68] text-[11px] hover:bg-[#007a5a]"
                        >
                          <Link
                            href={ticketsUrl}
                            onClick={() => onOpenChange(false)}
                          >
                            <TicketIcon className="mr-1.5 size-3.5" />
                            All tickets
                          </Link>
                        </Button>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </div>
        </ScrollArea>

        <SheetFooter className="shrink-0 border-t border-slate-200/80 bg-white px-4 py-3 dark:border-slate-800 dark:bg-slate-950">
          <div className="flex w-full flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-[11px] text-slate-500">
              Ranked by lead call volume · full notes and tickets on each card
            </p>
            <Button
              type="button"
              onClick={() => onOpenChange(false)}
              className="h-8 rounded-lg bg-[#008f68] text-xs hover:bg-[#007a5a] sm:min-w-[96px]"
            >
              Done
            </Button>
          </div>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
