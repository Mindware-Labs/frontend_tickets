"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  AlertTriangle,
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
  InsightExpandableDetails,
  InsightIssueBlock,
  InsightMetaRow,
  InsightPriorityPill,
  InsightRecordPanel,
  InsightSheetAccent,
  InsightStatusPill,
  InsightSummaryBadge,
  formatInsightDateTime,
  formatInsightLabel,
  getInsightCardsGridClass,
  getInsightSheetMaxWidthClass,
  insightCardClass,
  insightCardExpandedClass,
  insightSheetHeaderClass,
  useInsightSheetChrome,
} from "./yard-insight-ui";
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

const getPriorityRank = (priority?: string | null) => {
  const normalized = (priority || "").toUpperCase();
  if (normalized === "EMERGENCY") return 2;
  if (normalized === "HIGH") return 1;
  return 0;
};

const isClosedStatus = (status?: string | null) => {
  const normalized = (status || "").toUpperCase();
  return (
    normalized === "COMPLETED" ||
    normalized === "CLOSED" ||
    normalized === "RESOLVED"
  );
};

const getAgentLabel = (ticket: Ticket) =>
  ticket.assignedTo?.name?.trim() ||
  ticket.agent?.name?.trim() ||
  "Unassigned";

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

function CriticalTicketCard({
  ticket,
  section,
  yardId,
  yardName,
  reportStartDate,
  reportEndDate,
  detailsOpen,
  onDetailsOpenChange,
  onClose,
}: {
  ticket: Ticket;
  section: "pending" | "closed";
  yardId?: number | string;
  yardName: string;
  reportStartDate?: string;
  reportEndDate?: string;
  detailsOpen: boolean;
  onDetailsOpenChange: (open: boolean) => void;
  onClose: () => void;
}) {
  const resolvedYardId =
    yardId ?? ticket.yardId ?? ticket.yard?.id ?? undefined;
  const ticketsUrl = buildContactCenterUrl({
    tab: "tickets",
    id: ticket.id,
    fromReport: "highPriorityPending",
    view: section === "pending" ? "high_priority" : "all",
    reportSection: section,
    reportTicketId: String(ticket.id),
    reportYardName: yardName,
    yardId:
      resolvedYardId !== null && resolvedYardId !== undefined
        ? String(resolvedYardId)
        : undefined,
    status: ticket.status || undefined,
    reportStartDate,
    reportEndDate,
  });
  const isEmergency =
    (ticket.priority || "").toUpperCase() === "EMERGENCY";
  const phone =
    ticket.customerPhone?.trim() ||
    ticket.customer?.phone?.trim() ||
    ticket.phone?.trim();

  return (
    <article
      className={cn(
        insightCardClass,
        isEmergency
          ? "border-rose-300/80 hover:border-rose-400 dark:border-rose-800"
          : "hover:border-orange-300 dark:hover:border-orange-800",
        detailsOpen && insightCardExpandedClass,
      )}
    >
      <div
        className={cn(
          "border-b px-3 py-2.5",
          isEmergency
            ? "border-rose-100/80 bg-rose-50/50 dark:border-rose-900/40 dark:bg-rose-950/25"
            : "border-orange-100/80 bg-orange-50/40 dark:border-orange-900/30 dark:bg-orange-950/20",
        )}
      >
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div>
            <p className="flex items-center gap-1.5 text-[13px] font-bold text-slate-900 dark:text-slate-100">
              <TicketIcon className="size-3.5 text-sky-600 dark:text-sky-400" />
              Ticket #{ticket.id}
            </p>
            <p className="mt-0.5 text-[10px] text-slate-500">
              Opened {formatInsightDateTime(getOpenedAt(ticket))}
            </p>
          </div>
          <InsightPriorityPill priority={ticket.priority} />
        </div>
      </div>

      <div className="p-2.5">
        <InsightExpandableDetails
          open={detailsOpen}
          onOpenChange={onDetailsOpenChange}
        >
        <div className="space-y-2">
        <div className="grid grid-cols-2 gap-x-3 gap-y-1 rounded-lg border border-slate-200/80 bg-slate-50/50 p-2 dark:border-slate-800 dark:bg-slate-900/40">
          <InsightMetaRow
            label="Status"
            value={<InsightStatusPill status={ticket.status} />}
          />
          <InsightMetaRow
            label="Type"
            value={formatInsightLabel(
              ticket.ticketType || ticket.disposition || ticket.campaignOption,
            )}
          />
          <InsightMetaRow label="Customer" value={getCustomerLabel(ticket)} />
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
                {getAgentLabel(ticket)}
              </span>
            }
          />
          <InsightMetaRow
            label="Campaign"
            value={
              <span className="inline-flex items-center gap-1">
                <Megaphone className="size-3 text-slate-400" />
                {getCampaignLabel(ticket)}
              </span>
            }
          />
          {ticket.call ? (
            <>
              <InsightMetaRow
                label="Linked call"
                value={`#${ticket.call.id}`}
              />
              <InsightMetaRow
                label="Call dir."
                value={formatInsightLabel(ticket.call.direction)}
              />
            </>
          ) : null}
          {ticket.followUpDueDate ? (
            <InsightMetaRow
              label="Follow-up"
              value={
                <span className="inline-flex items-center gap-1 text-amber-700 dark:text-amber-300">
                  <Calendar className="size-3" />
                  {formatInsightDateTime(ticket.followUpDueDate)}
                </span>
              }
            />
          ) : null}
        </div>

        <InsightRecordPanel title="Issue detail">
          <InsightIssueBlock
            text={ticket.issueDetail}
            emptyLabel="No issue detail on this ticket"
          />
        </InsightRecordPanel>

        {ticket.notes?.trim() ? (
          <InsightRecordPanel title="Internal notes">
            <InsightIssueBlock text={ticket.notes} />
          </InsightRecordPanel>
        ) : null}
        </div>
        </InsightExpandableDetails>
      </div>

      <div className="mt-auto border-t border-slate-100 p-2.5 dark:border-slate-800">
        <Button
          asChild
          className={cn(
            "h-8 w-full rounded-lg text-[11px]",
            isEmergency
              ? "bg-rose-600 hover:bg-rose-700"
              : "bg-[#008f68] hover:bg-[#007a5a]",
          )}
        >
          <Link href={ticketsUrl} onClick={onClose}>
            Open in Contact Center
            <ExternalLink className="ml-1.5 size-3.5 opacity-80" />
          </Link>
        </Button>
      </div>
    </article>
  );
}

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
  const { pendingCriticalTickets, closedCriticalTickets } = useMemo(() => {
    const criticalTickets = tickets
      .filter((ticket) => {
        const priority = (ticket.priority || "").toUpperCase();
        return priority === "HIGH" || priority === "EMERGENCY";
      })
      .sort((left, right) => {
        const byPriority =
          getPriorityRank(right.priority) - getPriorityRank(left.priority);
        if (byPriority !== 0) return byPriority;
        return (
          new Date(getOpenedAt(left) || 0).getTime() -
          new Date(getOpenedAt(right) || 0).getTime()
        );
      });

    return {
      pendingCriticalTickets: criticalTickets.filter(
        (ticket) => !isClosedStatus(ticket.status),
      ),
      closedCriticalTickets: criticalTickets.filter((ticket) =>
        isClosedStatus(ticket.status),
      ),
    };
  }, [tickets]);

  const pendingEmergencyCount = pendingCriticalTickets.filter(
    (ticket) => (ticket.priority || "").toUpperCase() === "EMERGENCY",
  ).length;
  const pendingHighCount =
    pendingCriticalTickets.length - pendingEmergencyCount;
  const hasNoCriticalTickets =
    pendingCriticalTickets.length === 0 && closedCriticalTickets.length === 0;
  const maxSectionCardCount = Math.max(
    pendingCriticalTickets.length,
    closedCriticalTickets.length,
  );
  const sheetWidthClass = getInsightSheetMaxWidthClass(maxSectionCardCount);
  const periodLabel =
    reportStartDate && reportEndDate
      ? `${reportStartDate} → ${reportEndDate}`
      : "All dates";

  useInsightSheetChrome(open);
  const [expandedTicketId, setExpandedTicketId] = useState<number | null>(null);

  const renderSection = (
    title: string,
    subtitle: string,
    sectionTickets: Ticket[],
    section: "pending" | "closed",
    tone: "danger" | "neutral",
  ) => (
    <section className="space-y-2.5">
      <div className="flex items-center justify-between gap-3 rounded-xl border border-slate-200/80 bg-white px-3 py-2 shadow-[0_1px_3px_rgba(0,0,0,0.04)] dark:border-slate-800 dark:bg-slate-950">
        <div>
          <h3 className="text-[13px] font-semibold text-slate-900 dark:text-slate-100">
            {title}
          </h3>
          <p className="text-[11px] text-slate-500">{subtitle}</p>
        </div>
        <span
          className={cn(
            "inline-flex h-6 min-w-[28px] items-center justify-center rounded-md px-2 text-[11px] font-bold tabular-nums",
            tone === "danger"
              ? "bg-rose-50 text-rose-700 ring-1 ring-rose-200/80 dark:bg-rose-950/40 dark:text-rose-300"
              : "bg-slate-100 text-slate-700 ring-1 ring-slate-200/80 dark:bg-slate-900 dark:text-slate-300",
          )}
        >
          {sectionTickets.length}
        </span>
      </div>
      {sectionTickets.length > 0 ? (
        <div
          className={cn(
            "grid gap-3",
            getInsightCardsGridClass(sectionTickets.length),
          )}
        >
          {sectionTickets.map((ticket) => (
            <CriticalTicketCard
              key={ticket.id}
              ticket={ticket}
              section={section}
              yardId={yardId}
              yardName={yardName}
              reportStartDate={reportStartDate}
              reportEndDate={reportEndDate}
              detailsOpen={expandedTicketId === ticket.id}
              onDetailsOpenChange={(open) =>
                setExpandedTicketId(open ? ticket.id : null)
              }
              onClose={() => onOpenChange(false)}
            />
          ))}
        </div>
      ) : (
        <div className="rounded-xl border border-dashed border-slate-200/80 bg-white/80 px-3 py-4 text-[11px] text-slate-500 dark:border-slate-800 dark:bg-slate-950/70">
          No tickets in this section for the selected range.
        </div>
      )}
    </section>
  );

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
                  <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-rose-50 text-rose-600 ring-1 ring-rose-200/70 dark:bg-rose-500/10 dark:text-rose-400">
                    <AlertTriangle className="size-3.5" aria-hidden />
                  </span>
                  High & Emergency
                </SheetTitle>
                <SheetDescription className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                  Full ticket context for HIGH and EMERGENCY work in{" "}
                  <span className="font-semibold text-slate-800 dark:text-slate-100">
                    {yardName}
                  </span>
                </SheetDescription>
              </div>
              <div className="flex min-w-0 max-w-full flex-wrap items-center justify-start gap-1.5 lg:max-w-[min(100%,22rem)] lg:justify-end">
                <YardContextChip label="Range" value={periodLabel} />
                <InsightSummaryBadge
                  icon={AlertTriangle}
                  label={`${pendingCriticalTickets.length} pending`}
                  tone="danger"
                />
                <InsightSummaryBadge
                  icon={TicketIcon}
                  label={`${pendingEmergencyCount} emergency · ${pendingHighCount} high`}
                  tone="warning"
                />
              </div>
            </div>
          </SheetHeader>
        </div>

        <ScrollArea className="min-h-0 flex-1 scrollbar-app">
          <div className="space-y-4 p-3 sm:p-4">
            {hasNoCriticalTickets ? (
              <InsightEmptyState
                icon={AlertTriangle}
                title="No high-priority tickets"
                description="No HIGH or EMERGENCY tickets were found in this range."
              />
            ) : (
              <>
                {renderSection(
                  "Pending",
                  "Still open — sorted emergency first, oldest first",
                  pendingCriticalTickets,
                  "pending",
                  "danger",
                )}
                {renderSection(
                  "Closed / resolved",
                  "Already closed in this period",
                  closedCriticalTickets,
                  "closed",
                  "neutral",
                )}
              </>
            )}
          </div>
        </ScrollArea>

        <SheetFooter className="shrink-0 border-t border-slate-200/80 bg-white px-4 py-3 dark:border-slate-800 dark:bg-slate-950">
          <div className="flex w-full flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-[11px] text-slate-500">
              Expand a ticket to see full context · open in Contact Center below
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
