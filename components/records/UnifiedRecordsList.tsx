"use client";

import { Fragment, useMemo, useState, type ReactNode } from "react";
import {
  Calendar,
  ChevronDown,
  FileText,
  Phone,
  Ticket,
  User,
} from "lucide-react";
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
import {
  RECORD_LIST_CONFIG,
  formatGroupPosition,
  formatGroupTotal,
  type RecordListConfig,
} from "./record-list-config";
import {
  RecordDirectionLabel,
  RecordDispositionPill,
  RecordIdChip,
  RecordPriorityBadge,
  RecordStatusBadge,
  recordTableCellClass,
  recordTableHeadClass,
} from "./record-table-ui";
import {
  agentLabel,
  customerLabel,
  detailText,
  formatDate,
  getCustomerGroupKey,
  getRecordDateMs,
  phoneLabel,
  recordDate,
  recordPrimaryLabel,
} from "./record-formatters";
import type {
  UnifiedRecord,
  UnifiedRecordLinkedTicket,
  UnifiedRecordType,
} from "./types";

const recordTypeColumnClass =
  "w-[72px] min-w-[72px] max-w-[72px] px-2 text-center";

const recordIdColumnClass =
  "w-[56px] min-w-[56px] max-w-[56px] border-r border-slate-100/80 px-2 text-center dark:border-slate-800/80";

const recordIssueColumnClass =
  "w-[76px] min-w-[76px] max-w-[76px] px-2 text-center";

function IssueAction({
  detail,
  title,
  onViewDetail,
}: {
  detail?: string;
  title: string;
  onViewDetail?: (detail: string, title: string) => void;
}) {
  const trimmed = detail?.trim();
  if (!trimmed || !onViewDetail) {
    return (
      <span className="inline-flex h-7 w-full items-center justify-center text-center text-[10px] italic text-slate-400">
        No detail
      </span>
    );
  }

  return (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      className="mx-auto h-7 min-w-[58px] justify-center gap-1 px-2 text-[11px] font-medium text-[#008f68] hover:bg-[#f0faf5] hover:text-[#007a5a] dark:text-emerald-400 dark:hover:bg-emerald-500/10"
      onClick={() => onViewDetail(trimmed, title)}
    >
      <FileText className="size-3" aria-hidden />
      View
    </Button>
  );
}

function CustomerCell({
  label,
  className,
}: {
  label: string;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "block max-w-[200px] truncate text-[11px] font-semibold text-slate-900 dark:text-slate-100",
        className,
      )}
      title={label}
    >
      {label}
    </span>
  );
}

function ContactCell({
  phone,
  muted = false,
}: {
  phone: string;
  muted?: boolean;
}) {
  return (
    <span
      className={cn(
        "inline-flex max-w-[160px] items-center gap-1 truncate text-[11px]",
        muted
          ? "text-slate-400 dark:text-slate-500"
          : "text-slate-500 dark:text-slate-400",
      )}
    >
      <Phone className="size-3 shrink-0 opacity-50" aria-hidden />
      {phone}
    </span>
  );
}

function AgentCell({ name }: { name: string }) {
  return (
    <span className="inline-flex max-w-[150px] items-center gap-1 truncate text-[11px] text-slate-500 dark:text-slate-400">
      <User className="size-3 shrink-0 opacity-60" aria-hidden />
      <span className="truncate" title={name}>
        {name}
      </span>
    </span>
  );
}

function DateCell({ value }: { value?: string | null }) {
  return (
    <span className="inline-flex items-center gap-1 whitespace-nowrap text-[11px] text-slate-500 dark:text-slate-400">
      <Calendar className="size-3 shrink-0 opacity-60" aria-hidden />
      {formatDate(value)}
    </span>
  );
}

function CallSourceLabel({ callId }: { callId?: number | string | null }) {
  if (!callId) {
    return <span className="text-[11px] text-slate-400">-</span>;
  }

  return (
    <span className="inline-flex items-center gap-1 rounded-md bg-emerald-50 px-1.5 py-0.5 text-[10px] font-semibold text-[#008f68] ring-1 ring-emerald-200/80 dark:bg-emerald-500/10 dark:text-emerald-300 dark:ring-emerald-500/30">
      <Phone className="size-3 shrink-0" aria-hidden />
      Call #{callId}
    </span>
  );
}

function RecordTypeBadge({
  type,
}: {
  type: "call" | "ticket";
}) {
  if (type === "call") {
    return (
      <span className="inline-flex h-5 min-w-[52px] items-center justify-center gap-1 rounded-md bg-emerald-50 px-1.5 text-[9px] font-semibold uppercase tracking-wide text-[#008f68] ring-1 ring-emerald-200/80 dark:bg-emerald-500/10 dark:text-emerald-300 dark:ring-emerald-500/30">
        <Phone className="size-2.5" aria-hidden />
        Call
      </span>
    );
  }

  return (
    <span className="inline-flex h-5 min-w-[58px] items-center justify-center gap-1 rounded-md bg-sky-50 px-1.5 text-[9px] font-semibold uppercase tracking-wide text-sky-700 ring-1 ring-sky-200/80 dark:bg-sky-500/10 dark:text-sky-300 dark:ring-sky-500/30">
      <Ticket className="size-2.5" aria-hidden />
      Ticket
    </span>
  );
}

function RecordTypeCell({
  type,
  linked = false,
}: {
  type?: "call" | "ticket";
  linked?: boolean;
}) {
  return (
    <div
      className={cn(
        "mx-auto flex w-full items-center justify-center",
        linked &&
          "border-l-2 border-sky-400/80 pl-1.5 dark:border-sky-500/50",
      )}
    >
      {type ? <RecordTypeBadge type={type} /> : null}
    </div>
  );
}

function RecordIdCell({
  id,
  outsidePeriod,
}: {
  id: number | string;
  outsidePeriod?: boolean;
}) {
  return (
    <div className="mx-auto flex w-full flex-col items-center gap-1">
      <RecordIdChip id={id} />
      {outsidePeriod ? (
        <span className="text-center text-[9px] font-medium leading-tight text-amber-600 dark:text-amber-400">
          Outside period
        </span>
      ) : null}
    </div>
  );
}

function LinkedTicketsCountLabel({ total }: { total: number }) {
  if (total <= 0) {
    return <span className="text-[10px] text-slate-400">—</span>;
  }

  return (
    <span className="inline-flex items-center gap-1 rounded-md bg-sky-50/80 px-1.5 py-0.5 text-[10px] font-medium text-sky-700 ring-1 ring-sky-200/70 dark:bg-sky-500/10 dark:text-sky-300 dark:ring-sky-500/25">
      <Ticket className="size-3 shrink-0" aria-hidden />
      {formatGroupTotal(total, "ticket", "tickets")}
    </span>
  );
}

function GroupCountBadge({
  total,
  singular,
  plural,
  expanded,
  onToggle,
}: {
  total: number;
  singular: string;
  plural: string;
  expanded: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      className="inline-flex items-center gap-0.5 rounded-md px-1.5 py-0.5 text-[10px] font-medium text-slate-600 ring-1 ring-slate-200/80 transition-colors hover:bg-slate-100 dark:text-slate-300 dark:ring-slate-700 dark:hover:bg-slate-800"
      onClick={onToggle}
    >
      {formatGroupTotal(total, singular, plural)}
      <ChevronDown
        className={cn("size-3 transition-transform", expanded && "rotate-180")}
        aria-hidden
      />
    </button>
  );
}

function LinkedTicketRow({
  callId,
  ticket,
  customer,
  phone,
  totalTickets,
  ticketIndex,
  showPriority,
  onViewDetail,
}: {
  callId: number | string;
  ticket: UnifiedRecordLinkedTicket;
  customer: string;
  phone: string;
  totalTickets: number;
  ticketIndex: number;
  showPriority: boolean;
  onViewDetail?: (detail: string, title: string) => void;
}) {
  const detail = ticket.issueDetail?.trim() || "";
  const agent = ticket.assignedTo?.name || "Unassigned";
  const statusPulse =
    (ticket.status || "").toUpperCase() === "ACTIVE" ||
    (ticket.status || "").toUpperCase() === "PENDING_FOLLOWUP";

  return (
    <TableRow className="border-slate-100/80 bg-sky-50/35 hover:bg-sky-50/55 dark:border-slate-800 dark:bg-sky-950/20 dark:hover:bg-sky-950/30">
      <TableCell className={cn(recordTableCellClass, recordTypeColumnClass)}>
        <RecordTypeCell type="ticket" linked />
      </TableCell>
      <TableCell className={cn(recordTableCellClass, recordIdColumnClass)}>
        <RecordIdCell id={ticket.id} />
      </TableCell>
      <TableCell className={recordTableCellClass}>
        <CustomerCell label={customer} className="font-medium text-slate-600" />
      </TableCell>
      <TableCell className={recordTableCellClass}>
        <ContactCell phone={phone} muted />
      </TableCell>
      <TableCell className={recordTableCellClass}>
        <RecordStatusBadge status={ticket.status} pulse={statusPulse} />
      </TableCell>
      {showPriority ? (
        <TableCell className={recordTableCellClass}>
          <RecordPriorityBadge priority={ticket.priority} />
        </TableCell>
      ) : null}
      <TableCell className={recordTableCellClass}>
        <CallSourceLabel callId={callId} />
      </TableCell>
      <TableCell className={recordTableCellClass}>
        <RecordDispositionPill
          value={ticket.ticketType || ticket.campaignOption}
        />
      </TableCell>
      <TableCell className={recordTableCellClass}>
        <AgentCell name={agent} />
      </TableCell>
      <TableCell className={recordTableCellClass}>
        <span className="inline-flex items-center rounded-md bg-white/80 px-1.5 py-0.5 text-[10px] font-medium text-slate-500 ring-1 ring-slate-200/80 dark:bg-slate-950 dark:ring-slate-700">
          {formatGroupPosition(
            ticketIndex + 1,
            totalTickets,
            "ticket",
            "tickets",
          )}
        </span>
      </TableCell>
      <TableCell className={recordTableCellClass}>
        <DateCell value={ticket.createdAt} />
      </TableCell>
      <TableCell className={cn(recordTableCellClass, recordIssueColumnClass)}>
        <IssueAction
          detail={detail}
          title={`Ticket #${ticket.id}`}
          onViewDetail={onViewDetail}
        />
      </TableCell>
    </TableRow>
  );
}

function RecordTableRow({
  record,
  customer,
  phone,
  config,
  customerMuted = false,
  rowClassName,
  groupColumnLabel,
  onViewDetail,
}: {
  record: UnifiedRecord;
  customer: string;
  phone: string;
  config: RecordListConfig;
  customerMuted?: boolean;
  rowClassName?: string;
  groupColumnLabel?: ReactNode;
  onViewDetail?: (detail: string, title: string) => void;
}) {
  const detail = detailText(record);
  const statusPulse =
    (record.status || "").toUpperCase() === "ACTIVE" ||
    (record.status || "").toUpperCase() === "PENDING_FOLLOWUP";
  const isManual = record.recordType === "manual_record";

  return (
    <TableRow
      className={cn(
        "border-slate-100/80 dark:border-slate-800",
        rowClassName,
      )}
    >
      <TableCell className={cn(recordTableCellClass, recordTypeColumnClass)}>
        <RecordTypeCell
          type={
            record.recordType === "call"
              ? "call"
              : record.recordType === "ticket"
                ? "ticket"
                : undefined
          }
        />
      </TableCell>
      <TableCell className={cn(recordTableCellClass, recordIdColumnClass)}>
        <RecordIdCell
          id={record.sourceId}
          outsidePeriod={record.callOutsidePeriod}
        />
      </TableCell>
      <TableCell className={recordTableCellClass}>
        <CustomerCell
          label={customer}
          className={customerMuted ? "font-medium text-slate-500" : undefined}
        />
      </TableCell>
      <TableCell className={recordTableCellClass}>
        <ContactCell phone={phone} muted={customerMuted} />
      </TableCell>
      <TableCell className={recordTableCellClass}>
        <RecordStatusBadge status={record.status} pulse={statusPulse} />
      </TableCell>
      {config.showPriority ? (
        <TableCell className={recordTableCellClass}>
          <RecordPriorityBadge priority={record.priority} />
        </TableCell>
      ) : null}
      <TableCell className={recordTableCellClass}>
        {record.recordType === "ticket" ? (
          <CallSourceLabel callId={record.callId} />
        ) : (
          <RecordDirectionLabel direction={record.direction} manual={isManual} />
        )}
      </TableCell>
      <TableCell className={recordTableCellClass}>
        <RecordDispositionPill value={record.disposition} />
      </TableCell>
      <TableCell className={recordTableCellClass}>
        <AgentCell name={agentLabel(record)} />
      </TableCell>
      <TableCell className={recordTableCellClass}>
        {groupColumnLabel ?? (
          <span className="text-[10px] text-slate-400">—</span>
        )}
      </TableCell>
      <TableCell className={recordTableCellClass}>
        <DateCell value={recordDate(record)} />
      </TableCell>
      <TableCell className={cn(recordTableCellClass, recordIssueColumnClass)}>
        <IssueAction
          detail={detail}
          title={recordPrimaryLabel(record)}
          onViewDetail={onViewDetail}
        />
      </TableCell>
    </TableRow>
  );
}

function LinkedTicketRows({
  callId,
  tickets,
  customer,
  phone,
  showPriority,
  onViewDetail,
}: {
  callId: string;
  tickets: UnifiedRecordLinkedTicket[];
  customer: string;
  phone: string;
  showPriority: boolean;
  onViewDetail?: (detail: string, title: string) => void;
}) {
  if (tickets.length === 0) return null;

  return (
    <>
      {tickets.map((ticket, index) => (
        <LinkedTicketRow
          key={`${callId}-ticket-${ticket.id}`}
          callId={callId}
          ticket={ticket}
          customer={customer}
          phone={phone}
          totalTickets={tickets.length}
          ticketIndex={index}
          showPriority={showPriority}
          onViewDetail={onViewDetail}
        />
      ))}
    </>
  );
}

function SingleCallWithLinkedTickets({
  record,
  config,
  onViewDetail,
}: {
  record: UnifiedRecord;
  config: RecordListConfig;
  onViewDetail?: (detail: string, title: string) => void;
}) {
  const linkedTickets = record.tickets || [];
  const customer = customerLabel(record);
  const phone = phoneLabel(record);

  return (
    <>
      <RecordTableRow
        record={record}
        customer={customer}
        phone={phone}
        config={config}
        rowClassName="hover:bg-slate-50/80 dark:hover:bg-slate-900/40"
        groupColumnLabel={<LinkedTicketsCountLabel total={linkedTickets.length} />}
        onViewDetail={onViewDetail}
      />
      <LinkedTicketRows
        callId={record.id}
        tickets={linkedTickets}
        customer={customer}
        phone={phone}
        showPriority={config.showPriority}
        onViewDetail={onViewDetail}
      />
    </>
  );
}

function CustomerRecordGroupRows({
  records,
  config,
  groupIndex,
  onViewDetail,
}: {
  records: UnifiedRecord[];
  config: RecordListConfig;
  groupIndex: number;
  onViewDetail?: (detail: string, title: string) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const latest = records[0];
  const older = records.slice(1);
  const customer = customerLabel(latest);
  const phone = phoneLabel(latest);
  const total = records.length;
  const parentTint =
    groupIndex % 2 === 0
      ? "bg-emerald-50/35 hover:bg-emerald-50/55 dark:bg-emerald-950/12 dark:hover:bg-emerald-950/20"
      : "bg-emerald-50/45 hover:bg-emerald-50/60 dark:bg-emerald-950/18 dark:hover:bg-emerald-950/25";
  const linkedTickets =
    latest.recordType === "call" ? latest.tickets || [] : [];
  const expandedCallRecords = older.filter(
    (record) => record.recordType === "call",
  );
  const expandedOtherRecords = older.filter(
    (record) => record.recordType !== "call",
  );
  const expandedCallsWithTickets = [latest, ...expandedCallRecords].filter(
    (record) =>
      record.recordType === "call" && (record.tickets?.length ?? 0) > 0,
  );

  return (
    <Fragment>
      <RecordTableRow
        record={latest}
        customer={customer}
        phone={phone}
        config={config}
        rowClassName={parentTint}
        groupColumnLabel={
          <GroupCountBadge
            total={total}
            singular={config.unitSingular}
            plural={config.unit}
            expanded={expanded}
            onToggle={() => setExpanded((value) => !value)}
          />
        }
        onViewDetail={onViewDetail}
      />
      {!expanded && latest.recordType === "call" ? (
        <LinkedTicketRows
          callId={latest.id}
          tickets={linkedTickets}
          customer={customer}
          phone={phone}
          showPriority={config.showPriority}
          onViewDetail={onViewDetail}
        />
      ) : null}
      {expanded ? (
        <>
          {expandedCallRecords.map((record, index) => (
            <Fragment key={`${record.id}-call-row`}>
              <RecordTableRow
                record={record}
                customer={customer}
                phone={phone}
                config={config}
                customerMuted
                rowClassName="bg-slate-50/90 hover:bg-slate-100/90 dark:bg-slate-900/35 dark:hover:bg-slate-900/50"
                groupColumnLabel={
                  record.recordType === "call" &&
                  (record.tickets?.length ?? 0) > 0 ? (
                    <LinkedTicketsCountLabel
                      total={record.tickets?.length ?? 0}
                    />
                  ) : (
                    <span className="inline-flex items-center rounded-md bg-white/80 px-1.5 py-0.5 text-[10px] font-medium text-slate-500 ring-1 ring-slate-200/80 dark:bg-slate-950 dark:ring-slate-700">
                      {formatGroupPosition(
                        index + 2,
                        total,
                        config.unitSingular,
                        config.unit,
                      )}
                    </span>
                  )
                }
                onViewDetail={onViewDetail}
              />
            </Fragment>
          ))}
          {expandedCallsWithTickets.map((record) => (
            <LinkedTicketRows
              key={`${record.id}-linked-tickets`}
              callId={record.id}
              tickets={record.tickets || []}
              customer={customer}
              phone={phone}
              showPriority={config.showPriority}
              onViewDetail={onViewDetail}
            />
          ))}
          {expandedOtherRecords.map((record) => {
            const originalIndex = older.findIndex((item) => item.id === record.id);

            return (
              <RecordTableRow
                key={`${record.id}-other-row`}
                record={record}
                customer={customer}
                phone={phone}
                config={config}
                customerMuted
                rowClassName="bg-slate-50/90 hover:bg-slate-100/90 dark:bg-slate-900/35 dark:hover:bg-slate-900/50"
                groupColumnLabel={
                  <span className="inline-flex items-center rounded-md bg-white/80 px-1.5 py-0.5 text-[10px] font-medium text-slate-500 ring-1 ring-slate-200/80 dark:bg-slate-950 dark:ring-slate-700">
                    {formatGroupPosition(
                      originalIndex + 2,
                      total,
                      config.unitSingular,
                      config.unit,
                    )}
                  </span>
                }
                onViewDetail={onViewDetail}
              />
            );
          })}
        </>
      ) : null}
    </Fragment>
  );
}

function SingleRecordRow({
  record,
  config,
  onViewDetail,
}: {
  record: UnifiedRecord;
  config: RecordListConfig;
  onViewDetail?: (detail: string, title: string) => void;
}) {
  if (record.recordType === "call") {
    return (
      <SingleCallWithLinkedTickets
        record={record}
        config={config}
        onViewDetail={onViewDetail}
      />
    );
  }

  const customer = customerLabel(record);
  const phone = phoneLabel(record);

  return (
    <RecordTableRow
      record={record}
      customer={customer}
      phone={phone}
      config={config}
      rowClassName="hover:bg-slate-50/80 dark:hover:bg-slate-900/40"
      groupColumnLabel={
        record.recordType === "ticket" && record.callId ? (
          <span className="text-[10px] font-medium text-slate-500">
            Call #{record.callId}
          </span>
        ) : (
          <span className="text-[10px] font-medium text-slate-500">
            {formatGroupTotal(1, config.unitSingular, config.unit)}
          </span>
        )
      }
      onViewDetail={onViewDetail}
    />
  );
}

type CustomerRecordGroup = {
  key: string;
  records: UnifiedRecord[];
};

type UnifiedRecordsListProps = {
  records: UnifiedRecord[];
  recordKind: UnifiedRecordType;
  onViewDetail?: (detail: string, title: string) => void;
  className?: string;
};

export function UnifiedRecordsList({
  records,
  recordKind,
  onViewDetail,
  className,
}: UnifiedRecordsListProps) {
  const config = RECORD_LIST_CONFIG[recordKind];

  const { customerGroups, singleRecords } = useMemo(() => {
    const groupsMap = new Map<string, UnifiedRecord[]>();

    records.forEach((record) => {
      const key = getCustomerGroupKey(record);
      const existing = groupsMap.get(key);
      if (existing) {
        existing.push(record);
      } else {
        groupsMap.set(key, [record]);
      }
    });

    const groups: CustomerRecordGroup[] = Array.from(groupsMap.entries())
      .map(([key, groupRecords]) => ({
        key,
        records: [...groupRecords].sort(
          (left, right) => getRecordDateMs(right) - getRecordDateMs(left),
        ),
      }))
      .sort(
        (left, right) =>
          getRecordDateMs(right.records[0]) - getRecordDateMs(left.records[0]),
      );

    const multi: CustomerRecordGroup[] = [];
    const single: UnifiedRecord[] = [];

    groups.forEach((group) => {
      if (group.records.length > 1) {
        multi.push(group);
      } else {
        single.push(group.records[0]);
      }
    });

    return { customerGroups: multi, singleRecords: single };
  }, [records]);

  return (
    <div
      className={cn(
        "overflow-hidden rounded-xl border border-slate-200/80 bg-white shadow-[0_1px_3px_rgba(0,0,0,0.06)] dark:border-slate-800 dark:bg-slate-950",
        className,
      )}
    >
      <Table
        className={cn(
          "table-fixed",
          config.showPriority ? "min-w-[1260px]" : "min-w-[1178px]",
        )}
      >
        <colgroup>
          <col className="w-[72px]" />
          <col className="w-[56px]" />
          <col className="w-[150px]" />
          <col className="w-[130px]" />
          <col className="w-[108px]" />
          {config.showPriority ? <col className="w-[82px]" /> : null}
          <col className="w-[112px]" />
          <col className="w-[120px]" />
          <col className="w-[130px]" />
          <col className="w-[90px]" />
          <col className="w-[158px]" />
          <col className="w-[76px]" />
        </colgroup>
        <TableHeader className="sticky top-0 z-20 border-b border-slate-200/80 bg-slate-50/95 backdrop-blur-sm dark:border-slate-800 dark:bg-slate-900/95">
          <TableRow className="hover:bg-transparent">
            <TableHead className={cn(recordTableHeadClass, recordTypeColumnClass)}>
              Type
            </TableHead>
            <TableHead className={cn(recordTableHeadClass, recordIdColumnClass)}>
              ID
            </TableHead>
            <TableHead className={cn(recordTableHeadClass, "min-w-[140px]")}>
              Customer
            </TableHead>
            <TableHead className={cn(recordTableHeadClass, "min-w-[130px]")}>
              Contact
            </TableHead>
            <TableHead className={cn(recordTableHeadClass, "w-[108px]")}>
              Status
            </TableHead>
            {config.showPriority ? (
              <TableHead className={cn(recordTableHeadClass, "w-[80px]")}>
                Priority
              </TableHead>
            ) : null}
            <TableHead className={cn(recordTableHeadClass, "min-w-[100px]")}>
              Direction
            </TableHead>
            <TableHead className={cn(recordTableHeadClass, "min-w-[100px]")}>
              Disposition
            </TableHead>
            <TableHead className={cn(recordTableHeadClass, "min-w-[120px]")}>
              Agent
            </TableHead>
            <TableHead className={cn(recordTableHeadClass, "w-[88px]")}>
              {config.groupColumnHeader}
            </TableHead>
            <TableHead className={cn(recordTableHeadClass, "min-w-[150px]")}>
              Date
            </TableHead>
            <TableHead className={cn(recordTableHeadClass, recordIssueColumnClass)}>
              Issue
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody className="[&_tr:last-child]:border-0">
          {customerGroups.map((group, groupIndex) => (
            <CustomerRecordGroupRows
              key={group.key}
              records={group.records}
              config={config}
              groupIndex={groupIndex}
              onViewDetail={onViewDetail}
            />
          ))}
          {singleRecords.map((record) => (
            <SingleRecordRow
              key={record.id}
              record={record}
              config={config}
              onViewDetail={onViewDetail}
            />
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
