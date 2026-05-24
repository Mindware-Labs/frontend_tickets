"use client";

import Link from "next/link";
import { useMemo } from "react";
import {
  ClipboardList,
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
  insightSheetHeaderClass,
  useInsightSheetChrome,
} from "./yard-insight-ui";
import type { Ticket } from "./types";

type OpenTicketsModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  side?: "left" | "right";
  yardId?: number | string;
  yardName: string;
  reportStartDate?: string;
  reportEndDate?: string;
  tickets: Ticket[];
};

const isClosedStatus = (status?: string | null) => {
  const normalized = (status || "").toUpperCase();
  return (
    normalized === "COMPLETED" ||
    normalized === "CLOSED" ||
    normalized === "RESOLVED"
  );
};

const getPriorityRank = (priority?: string | null) => {
  const normalized = (priority || "").toUpperCase();
  if (normalized === "EMERGENCY") return 4;
  if (normalized === "HIGH" || normalized === "URGENT") return 3;
  if (normalized === "MEDIUM" || normalized === "NORMAL") return 2;
  if (normalized === "LOW") return 1;
  return 0;
};

const getOpenedAt = (ticket: Ticket) => ticket.createdAt || ticket.updatedAt;

export function OpenTicketsModal({
  open,
  onOpenChange,
  side = "right",
  yardId,
  yardName,
  reportStartDate,
  reportEndDate,
  tickets,
}: OpenTicketsModalProps) {
  const { openTickets, inProgressTickets } = useMemo(() => {
    const active = tickets
      .filter((ticket) => !isClosedStatus(ticket.status))
      .sort((left, right) => {
        const byPriority =
          getPriorityRank(right.priority) - getPriorityRank(left.priority);
        if (byPriority !== 0) return byPriority;
        return (
          new Date(getOpenedAt(left) || 0).getTime() -
          new Date(getOpenedAt(right) || 0).getTime()
        );
      });

    const inProgress = active.filter((ticket) => {
      const status = (ticket.status || "").toUpperCase();
      return status === "IN_PROGRESS" || status === "PENDING_FOLLOWUP";
    });
    const openOnly = active.filter((ticket) => {
      const status = (ticket.status || "").toUpperCase();
      return status !== "IN_PROGRESS" && status !== "PENDING_FOLLOWUP";
    });

    return { openTickets: openOnly, inProgressTickets: inProgress };
  }, [tickets]);

  const allActive = useMemo(
    () => [...openTickets, ...inProgressTickets],
    [openTickets, inProgressTickets],
  );

  const sheetWidthClass = getInsightSheetMaxWidthClass(allActive.length);
  const periodLabel =
    reportStartDate && reportEndDate
      ? `${reportStartDate} → ${reportEndDate}`
      : "All dates";

  useInsightSheetChrome(open);

  const renderTicket = (ticket: Ticket) => {
    const phone =
      ticket.customerPhone?.trim() ||
      ticket.customer?.phone?.trim() ||
      ticket.phone?.trim();
    const resolvedYardId =
      yardId ?? ticket.yardId ?? ticket.yard?.id ?? undefined;

    return (
      <article key={ticket.id} className={insightCardClass}>
        <div className="border-b border-slate-100/80 px-3 py-2.5 dark:border-slate-800">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div>
              <p className="flex items-center gap-1.5 text-[13px] font-bold text-slate-900 dark:text-slate-100">
                <TicketIcon className="size-3.5 text-sky-600" />
                Ticket #{ticket.id}
              </p>
              <p className="mt-0.5 text-[10px] text-slate-500">
                Opened {formatInsightDateTime(getOpenedAt(ticket))}
              </p>
            </div>
            <div className="flex flex-col items-end gap-1">
              <InsightPriorityPill priority={ticket.priority} />
              <InsightStatusPill status={ticket.status} />
            </div>
          </div>
        </div>
        <div className="space-y-2 p-2.5">
          <div className="grid grid-cols-2 gap-x-3 gap-y-1 rounded-lg border border-slate-200/80 bg-slate-50/50 p-2 dark:border-slate-800 dark:bg-slate-900/40">
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
                  {ticket.assignedTo?.name ||
                    ticket.agent?.name ||
                    "Unassigned"}
                </span>
              }
            />
            <InsightMetaRow
              label="Campaign"
              value={
                <span className="inline-flex items-center gap-1">
                  <Megaphone className="size-3 text-slate-400" />
                  {ticket.campaign?.nombre || "—"}
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
          </div>
          <InsightRecordPanel title="Issue">
            <InsightIssueBlock
              text={ticket.issueDetail}
              emptyLabel="No issue detail"
            />
          </InsightRecordPanel>
        </div>
        <div className="mt-auto border-t border-slate-100 p-2.5 dark:border-slate-800">
          <Button
            asChild
            className="h-8 w-full rounded-lg bg-[#008f68] text-[11px] hover:bg-[#007a5a]"
          >
            <Link
              href={buildContactCenterUrl({
                tab: "tickets",
                id: ticket.id,
                fromReport: "openWorkload",
                yardId:
                  resolvedYardId != null
                    ? String(resolvedYardId)
                    : undefined,
                reportYardName: yardName,
                reportStartDate,
                reportEndDate,
              })}
              onClick={() => onOpenChange(false)}
            >
              Open ticket
              <ExternalLink className="ml-1.5 size-3.5 opacity-80" />
            </Link>
          </Button>
        </div>
      </article>
    );
  };

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
                  <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-sky-50 text-sky-600 ring-1 ring-sky-200/70 dark:bg-sky-500/10 dark:text-sky-400">
                    <ClipboardList className="size-3.5" />
                  </span>
                  Open workload
                </SheetTitle>
                <SheetDescription className="mt-1 text-xs text-slate-500">
                  Active tickets still needing work in{" "}
                  <span className="font-semibold text-slate-800 dark:text-slate-100">
                    {yardName}
                  </span>
                </SheetDescription>
              </div>
              <div className="flex min-w-0 max-w-full flex-wrap items-center justify-start gap-1.5 lg:max-w-[min(100%,22rem)] lg:justify-end">
                <YardContextChip label="Range" value={periodLabel} />
                <InsightSummaryBadge
                  icon={TicketIcon}
                  label={`${allActive.length} active`}
                  tone="brand"
                />
                <InsightSummaryBadge
                  icon={ClipboardList}
                  label={`${openTickets.length} open · ${inProgressTickets.length} in progress`}
                />
              </div>
            </div>
          </SheetHeader>
        </div>

        <ScrollArea className="min-h-0 flex-1 scrollbar-app">
          <div className="space-y-4 p-3 sm:p-4">
            {allActive.length === 0 ? (
              <InsightEmptyState
                icon={ClipboardList}
                title="No open tickets"
                description="All tickets in this range are closed or resolved."
              />
            ) : (
              <>
                {openTickets.length > 0 ? (
                  <section className="space-y-2">
                    <h3 className="text-[12px] font-semibold uppercase tracking-wider text-slate-500">
                      Open ({openTickets.length})
                    </h3>
                    <div
                      className={cn(
                        "grid gap-3",
                        getInsightCardsGridClass(openTickets.length),
                      )}
                    >
                      {openTickets.map(renderTicket)}
                    </div>
                  </section>
                ) : null}
                {inProgressTickets.length > 0 ? (
                  <section className="space-y-2">
                    <h3 className="text-[12px] font-semibold uppercase tracking-wider text-slate-500">
                      In progress ({inProgressTickets.length})
                    </h3>
                    <div
                      className={cn(
                        "grid gap-3",
                        getInsightCardsGridClass(inProgressTickets.length),
                      )}
                    >
                      {inProgressTickets.map(renderTicket)}
                    </div>
                  </section>
                ) : null}
              </>
            )}
          </div>
        </ScrollArea>

        <SheetFooter className="shrink-0 border-t border-slate-200/80 bg-white px-4 py-3 dark:border-slate-800 dark:bg-slate-950">
          <div className="flex w-full flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-[11px] text-slate-500">
              Sorted by priority, then oldest open first
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
