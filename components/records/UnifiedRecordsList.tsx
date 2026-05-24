"use client";

import Link from "next/link";
import {
  Calendar,
  ChevronRight,
  ClipboardList,
  FileText,
  Link2,
  Phone,
  Ticket,
  User,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { buildContactCenterUrl } from "@/lib/contact-center-url";
import {
  agentLabel,
  customerLabel,
  detailText,
  formatDate,
  formatLabel,
  linkedTicketLabel,
  phoneLabel,
  recordDate,
  recordPrimaryLabel,
} from "./record-formatters";
import type {
  UnifiedRecord,
  UnifiedRecordLinkedTicket,
  UnifiedRecordType,
} from "./types";

const statusBadgeVariant = (status?: string | null) => {
  const normalized = (status || "").toUpperCase();
  if (normalized === "OVERDUE") return "destructive" as const;
  if (normalized === "RESOLVED" || normalized === "CLOSED") {
    return "secondary" as const;
  }
  return "outline" as const;
};

function RecordTypeBadge({ recordType }: { recordType: UnifiedRecordType }) {
  if (recordType === "call") {
    return (
      <Badge variant="outline" className="gap-1">
        <Phone className="size-3" />
        Call
      </Badge>
    );
  }

  if (recordType === "ticket") {
    return (
      <Badge variant="outline" className="gap-1">
        <Ticket className="size-3" />
        Ticket
      </Badge>
    );
  }

  return (
    <Badge variant="outline" className="gap-1">
      <ClipboardList className="size-3" />
      Manual
    </Badge>
  );
}

function RecordOpenLink({
  recordType,
  sourceId,
  className,
}: {
  recordType: UnifiedRecordType;
  sourceId: number;
  className?: string;
}) {
  const tab =
    recordType === "call"
      ? "calls"
      : recordType === "ticket"
        ? "tickets"
        : "manual-records";

  return (
    <Link
      href={buildContactCenterUrl({ tab, id: sourceId })}
      className={cn(
        "inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline",
        className,
      )}
    >
      Open
      <ChevronRight className="size-3" />
    </Link>
  );
}

function LinkedTicketRow({
  ticket,
  callId,
  onViewDetail,
}: {
  ticket: UnifiedRecordLinkedTicket;
  callId: number;
  onViewDetail?: (detail: string, title: string) => void;
}) {
  const detail = ticket.issueDetail?.trim() || "";

  return (
    <TableRow className="bg-muted/25 hover:bg-muted/40">
      <TableCell className="py-2 pl-10">
        <div className="flex items-start gap-2 border-l-2 border-primary/30 pl-3">
          <Ticket className="mt-0.5 size-3.5 shrink-0 text-muted-foreground" />
          <div className="flex min-w-0 flex-col gap-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-mono text-xs font-medium">
                {linkedTicketLabel(ticket)}
              </span>
              <Badge variant="outline" className="gap-1 text-[10px]">
                <Link2 className="size-2.5" />
                Call #{callId}
              </Badge>
            </div>
          </div>
        </div>
      </TableCell>
      <TableCell className="text-sm text-muted-foreground">—</TableCell>
      <TableCell className="text-sm text-muted-foreground">—</TableCell>
      <TableCell>
        <div className="flex flex-wrap gap-1.5">
          <Badge variant={statusBadgeVariant(ticket.status)} className="text-[10px]">
            {formatLabel(ticket.status)}
          </Badge>
          {ticket.priority ? (
            <Badge variant="outline" className="text-[10px]">
              {formatLabel(ticket.priority)}
            </Badge>
          ) : null}
        </div>
      </TableCell>
      <TableCell className="text-sm text-muted-foreground">
        {formatLabel(ticket.ticketType || ticket.campaignOption)}
      </TableCell>
      <TableCell className="text-sm text-muted-foreground">
        {ticket.assignedTo?.name || "Unassigned"}
      </TableCell>
      <TableCell className="whitespace-nowrap text-sm text-muted-foreground">
        {formatDate(ticket.createdAt)}
      </TableCell>
      <TableCell>
        <div className="flex items-center gap-2">
          {detail && onViewDetail ? (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => onViewDetail(detail, linkedTicketLabel(ticket))}
            >
              <FileText data-icon="inline-start" />
              View
            </Button>
          ) : (
            <span className="text-sm text-muted-foreground">-</span>
          )}
          <RecordOpenLink recordType="ticket" sourceId={ticket.id} />
        </div>
      </TableCell>
    </TableRow>
  );
}

function CallGroupRows({
  record,
  onViewDetail,
}: {
  record: UnifiedRecord;
  onViewDetail?: (detail: string, title: string) => void;
}) {
  const detail = detailText(record);
  const linkedTickets = record.tickets || [];

  return (
    <>
      <TableRow className="align-top">
        <TableCell>
          <div className="flex flex-col gap-1">
            <RecordTypeBadge recordType="call" />
            <span className="font-mono text-xs text-muted-foreground">
              {recordPrimaryLabel(record)}
            </span>
            {record.callOutsidePeriod ? (
              <Badge variant="secondary" className="w-fit text-[10px]">
                Call outside report period
              </Badge>
            ) : null}
            {record.aircallId ? (
              <span className="font-mono text-[11px] text-muted-foreground">
                Aircall {record.aircallId}
              </span>
            ) : null}
          </div>
        </TableCell>
        <TableCell>
          <div className="flex min-w-0 flex-col gap-1">
            <span className="truncate font-medium">{customerLabel(record)}</span>
            <span className="truncate text-xs text-muted-foreground">
              {phoneLabel(record)}
            </span>
          </div>
        </TableCell>
        <TableCell>
          {linkedTickets.length > 0 ? (
            <span className="text-sm text-muted-foreground">
              {linkedTickets.length} linked ticket
              {linkedTickets.length === 1 ? "" : "s"}
            </span>
          ) : (
            <span className="text-sm text-muted-foreground">No ticket linked</span>
          )}
        </TableCell>
        <TableCell>
          <Badge variant={statusBadgeVariant(record.status)}>
            {formatLabel(record.status)}
          </Badge>
        </TableCell>
        <TableCell>
          <div className="flex flex-col gap-1 text-sm">
            {record.direction ? <span>{formatLabel(record.direction)}</span> : null}
            <span
              className={cn(!record.direction && "text-muted-foreground")}
            >
              {formatLabel(record.disposition)}
            </span>
          </div>
        </TableCell>
        <TableCell>
          <span className="inline-flex max-w-[150px] items-center gap-1 truncate text-sm text-muted-foreground">
            <User className="size-3.5 shrink-0" />
            {agentLabel(record)}
          </span>
        </TableCell>
        <TableCell className="whitespace-nowrap text-sm text-muted-foreground">
          <span className="inline-flex items-center gap-1">
            <Calendar className="size-3.5" />
            {formatDate(recordDate(record))}
          </span>
        </TableCell>
        <TableCell>
          <div className="flex items-center gap-2">
            {detail && onViewDetail ? (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => onViewDetail(detail, recordPrimaryLabel(record))}
              >
                <FileText data-icon="inline-start" />
                View
              </Button>
            ) : (
              <span className="text-sm text-muted-foreground">-</span>
            )}
            <RecordOpenLink recordType="call" sourceId={record.sourceId} />
          </div>
        </TableCell>
      </TableRow>
      {linkedTickets.map((ticket) => (
        <LinkedTicketRow
          key={`${record.id}-ticket-${ticket.id}`}
          ticket={ticket}
          callId={record.sourceId}
          onViewDetail={onViewDetail}
        />
      ))}
    </>
  );
}

function StandaloneRecordRow({
  record,
  onViewDetail,
}: {
  record: UnifiedRecord;
  onViewDetail?: (detail: string, title: string) => void;
}) {
  const detail = detailText(record);

  return (
    <TableRow>
      <TableCell>
        <div className="flex flex-col gap-1">
          <RecordTypeBadge recordType={record.recordType} />
          <span className="font-mono text-xs text-muted-foreground">
            {recordPrimaryLabel(record)}
          </span>
          {record.recordType === "ticket" && record.callId ? (
            <Badge variant="outline" className="w-fit gap-1 text-[10px]">
              <Link2 className="size-2.5" />
              Call #{record.callId}
            </Badge>
          ) : null}
        </div>
      </TableCell>
      <TableCell>
        <div className="flex min-w-0 flex-col gap-1">
          <span className="truncate font-medium">{customerLabel(record)}</span>
          <span className="truncate text-xs text-muted-foreground">
            {phoneLabel(record)}
          </span>
        </div>
      </TableCell>
      <TableCell>
        <span className="text-sm text-muted-foreground">
          {record.recordType === "manual_record"
            ? "Manual entry"
            : "Standalone ticket"}
        </span>
      </TableCell>
      <TableCell>
        <div className="flex flex-wrap gap-1.5">
          <Badge variant={statusBadgeVariant(record.status)}>
            {formatLabel(record.status)}
          </Badge>
          {record.priority ? (
            <Badge variant="outline">{formatLabel(record.priority)}</Badge>
          ) : null}
        </div>
      </TableCell>
      <TableCell>
        <div className="flex flex-col gap-1 text-sm">
          {record.direction ? <span>{formatLabel(record.direction)}</span> : null}
          <span className={cn(!record.direction && "text-muted-foreground")}>
            {formatLabel(record.disposition)}
          </span>
        </div>
      </TableCell>
      <TableCell>
        <span className="inline-flex max-w-[150px] items-center gap-1 truncate text-sm text-muted-foreground">
          <User className="size-3.5 shrink-0" />
          {agentLabel(record)}
        </span>
      </TableCell>
      <TableCell className="whitespace-nowrap text-sm text-muted-foreground">
        <span className="inline-flex items-center gap-1">
          <Calendar className="size-3.5" />
          {formatDate(recordDate(record))}
        </span>
      </TableCell>
      <TableCell>
        <div className="flex items-center gap-2">
          {detail && onViewDetail ? (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => onViewDetail(detail, recordPrimaryLabel(record))}
            >
              <FileText data-icon="inline-start" />
              View
            </Button>
          ) : (
            <span className="text-sm text-muted-foreground">-</span>
          )}
          <RecordOpenLink
            recordType={record.recordType}
            sourceId={record.sourceId}
          />
        </div>
      </TableCell>
    </TableRow>
  );
}

type UnifiedRecordsListProps = {
  records: UnifiedRecord[];
  onViewDetail?: (detail: string, title: string) => void;
  showOpenLinks?: boolean;
};

export function UnifiedRecordsList({
  records,
  onViewDetail,
}: UnifiedRecordsListProps) {
  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-[0_1px_3px_rgba(0,0,0,0.06)] dark:border-slate-800 dark:bg-slate-950">
      <Table>
        <TableHeader className="sticky top-0 z-10 bg-slate-50 dark:bg-slate-900">
          <TableRow className="hover:bg-transparent">
            <TableHead className="min-w-[170px] py-2 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
              Record
            </TableHead>
            <TableHead className="min-w-[180px] py-2 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
              Customer
            </TableHead>
            <TableHead className="min-w-[160px] py-2 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
              Relation
            </TableHead>
            <TableHead className="min-w-[130px] py-2 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
              Status
            </TableHead>
            <TableHead className="min-w-[150px] py-2 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
              Outcome
            </TableHead>
            <TableHead className="min-w-[140px] py-2 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
              Owner
            </TableHead>
            <TableHead className="min-w-[150px] py-2 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
              Date
            </TableHead>
            <TableHead className="w-[120px] py-2 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
              Actions
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {records.map((record) =>
            record.recordType === "call" ? (
              <CallGroupRows
                key={record.id}
                record={record}
                onViewDetail={onViewDetail}
              />
            ) : (
              <StandaloneRecordRow
                key={record.id}
                record={record}
                onViewDetail={onViewDetail}
              />
            ),
          )}
        </TableBody>
      </Table>
    </div>
  );
}
