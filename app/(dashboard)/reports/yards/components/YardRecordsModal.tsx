"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Calendar,
  ClipboardList,
  FileText,
  Inbox,
  Link2,
  Loader2,
  Phone,
  Search,
  Ticket,
  User,
  X,
} from "lucide-react";
import { fetchFromBackend } from "@/lib/api-client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import type { YardRecord, YardRecordType } from "./types";

type RecordTab = "all" | YardRecordType;

type YardRecordCounts = {
  all: number;
  calls: number;
  tickets: number;
  linkedTickets: number;
  standaloneTickets: number;
  manualRecords: number;
};

type YardRecordsModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  yardName: string;
  yardId?: number | string | null;
  reportStartDate?: string;
  reportEndDate?: string;
};

const emptyCounts: YardRecordCounts = {
  all: 0,
  calls: 0,
  tickets: 0,
  linkedTickets: 0,
  standaloneTickets: 0,
  manualRecords: 0,
};

const tabs: Array<{
  value: RecordTab;
  label: string;
  countKey: keyof YardRecordCounts;
}> = [
  { value: "all", label: "All Records", countKey: "all" },
  { value: "call", label: "Calls", countKey: "calls" },
  { value: "ticket", label: "Tickets", countKey: "tickets" },
  { value: "manual_record", label: "Manual Records", countKey: "manualRecords" },
];

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

const customerLabel = (record: YardRecord) =>
  record.customer?.name ||
  record.customerPhone ||
  record.customer?.phone ||
  (record.customerId ? `Customer #${record.customerId}` : "Unknown");

const phoneLabel = (record: YardRecord) =>
  record.customer?.phone || record.customerPhone || "-";

const agentLabel = (record: YardRecord) =>
  record.agent?.name || (record.recordType === "manual_record" ? "Manual" : "Unassigned");

const recordDate = (record: YardRecord) =>
  record.occurredAt || record.updatedAt || null;

const detailText = (record: YardRecord) =>
  record.issueDetail?.trim() || record.notes?.trim() || "";

const statusBadgeVariant = (status?: string | null) => {
  const normalized = (status || "").toUpperCase();
  if (normalized === "OVERDUE") return "destructive" as const;
  if (normalized === "RESOLVED" || normalized === "CLOSED") {
    return "secondary" as const;
  }
  return "outline" as const;
};

function RecordTypeBadge({ record }: { record: YardRecord }) {
  if (record.recordType === "call") {
    return (
      <Badge variant="outline" className="gap-1">
        <Phone className="size-3" />
        Call
      </Badge>
    );
  }

  if (record.recordType === "ticket") {
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

function RelationshipCell({ record }: { record: YardRecord }) {
  if (record.recordType === "call") {
    const tickets = record.tickets || [];
    if (tickets.length === 0) {
      return <span className="text-muted-foreground">No ticket linked</span>;
    }

    return (
      <div className="flex flex-wrap gap-1.5">
        {tickets.slice(0, 2).map((ticket) => (
          <Badge key={ticket.id} variant="secondary" className="gap-1">
            <Ticket className="size-3" />
            #{ticket.id}
            <span className="text-muted-foreground">
              {formatLabel(ticket.status)}
            </span>
          </Badge>
        ))}
        {tickets.length > 2 ? (
          <Badge variant="outline">+{tickets.length - 2}</Badge>
        ) : null}
      </div>
    );
  }

  if (record.recordType === "ticket") {
    return record.callId ? (
      <Badge variant="outline" className="gap-1">
        <Link2 className="size-3" />
        Call #{record.callId}
      </Badge>
    ) : (
      <span className="text-muted-foreground">Standalone ticket</span>
    );
  }

  return <span className="text-muted-foreground">Manual entry</span>;
}

function recordPrimaryLabel(record: YardRecord) {
  if (record.recordType === "call") return `Call #${record.sourceId}`;
  if (record.recordType === "ticket") return `Ticket #${record.sourceId}`;
  return `Manual #${record.sourceId}`;
}

export function YardRecordsModal({
  open,
  onOpenChange,
  yardName,
  yardId,
  reportStartDate,
  reportEndDate,
}: YardRecordsModalProps) {
  const [activeTab, setActiveTab] = useState<RecordTab>("all");
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [records, setRecords] = useState<YardRecord[]>([]);
  const [counts, setCounts] = useState<YardRecordCounts>(emptyCounts);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [detailRecord, setDetailRecord] = useState<YardRecord | null>(null);

  const canFetch = Boolean(open && yardId && reportStartDate && reportEndDate);
  const pageSize = 100;

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      setDebouncedSearch(search.trim());
    }, 250);

    return () => window.clearTimeout(timeout);
  }, [search]);

  useEffect(() => {
    if (!open) return;
    setActiveTab("all");
    setSearch("");
    setDebouncedSearch("");
    setPage(1);
    setDetailRecord(null);
  }, [open]);

  useEffect(() => {
    setPage(1);
  }, [activeTab, debouncedSearch]);

  useEffect(() => {
    if (!canFetch) {
      setRecords([]);
      setCounts(emptyCounts);
      setTotal(0);
      setTotalPages(1);
      setLoading(false);
      setError(null);
      return;
    }

    let cancelled = false;

    const fetchRecords = async () => {
      try {
        setLoading(true);
        setError(null);

        const params = new URLSearchParams({
          page: String(page),
          limit: String(pageSize),
          recordType: activeTab,
          sortBy: "createdAt",
          order: "DESC",
          start: reportStartDate || "",
          end: reportEndDate || "",
        });

        if (debouncedSearch) params.set("search", debouncedSearch);

        const response = await fetchFromBackend(
          `/yards/${yardId}/records?${params.toString()}`,
        );
        if (cancelled) return;

        const nextRecords: YardRecord[] = Array.isArray(response)
          ? response
          : response?.data || [];
        const nextTotal = Array.isArray(response)
          ? nextRecords.length
          : Number(response?.total) || 0;
        const nextTotalPages = Array.isArray(response)
          ? 1
          : Math.max(1, Number(response?.totalPages) || 1);

        setRecords(nextRecords);
        setCounts(response?.counts || emptyCounts);
        setTotal(nextTotal);
        setTotalPages(nextTotalPages);

        if (page > nextTotalPages) {
          setPage(nextTotalPages);
        }
      } catch (fetchError: any) {
        if (cancelled) return;
        setRecords([]);
        setTotal(0);
        setTotalPages(1);
        setError(fetchError?.message || "Failed to load records");
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    fetchRecords();
    return () => {
      cancelled = true;
    };
  }, [
    activeTab,
    canFetch,
    debouncedSearch,
    page,
    reportEndDate,
    reportStartDate,
    yardId,
  ]);

  const periodLabel = useMemo(() => {
    if (!reportStartDate || !reportEndDate) return "All dates";
    return `${reportStartDate} to ${reportEndDate}`;
  }, [reportStartDate, reportEndDate]);

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="flex h-[90vh] w-[calc(100vw-2rem)] max-w-[calc(100vw-2rem)] flex-col gap-0 overflow-hidden rounded-lg p-0 sm:max-w-[min(96vw,1320px)]">
          <DialogHeader className="border-b px-5 py-4">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
              <div className="flex min-w-0 flex-col gap-1">
                <DialogTitle className="flex items-center gap-2 text-xl font-semibold">
                  <ClipboardList className="size-5 text-primary" />
                  Yard Records
                </DialogTitle>
                <DialogDescription className="text-sm">
                  {yardName} - {periodLabel}
                </DialogDescription>
              </div>

              <div className="flex flex-wrap gap-2">
                <Badge variant="outline">{counts.calls} calls</Badge>
                <Badge variant="outline">{counts.tickets} tickets</Badge>
                <Badge variant="outline">
                  {counts.manualRecords} manual
                </Badge>
                {counts.linkedTickets > 0 ? (
                  <Badge variant="secondary">
                    {counts.linkedTickets} linked
                  </Badge>
                ) : null}
              </div>
            </div>

            <div className="flex flex-col gap-3 pt-2 lg:flex-row lg:items-center lg:justify-between">
              <Tabs
                value={activeTab}
                onValueChange={(value) => setActiveTab(value as RecordTab)}
                className="w-full lg:w-auto"
              >
                <TabsList className="grid h-auto w-full grid-cols-2 gap-1 p-1 sm:grid-cols-4 lg:w-auto">
                  {tabs.map((tab) => (
                    <TabsTrigger
                      key={tab.value}
                      value={tab.value}
                      className="gap-2"
                    >
                      <span>{tab.label}</span>
                      <Badge variant="secondary" className="px-1.5">
                        {counts[tab.countKey]}
                      </Badge>
                    </TabsTrigger>
                  ))}
                </TabsList>
              </Tabs>

              <div className="relative w-full lg:w-80">
                <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search records"
                  className="h-9 pl-9 pr-10"
                />
                {search ? (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    className="absolute right-1 top-1/2 -translate-y-1/2"
                    aria-label="Clear search"
                    onClick={() => setSearch("")}
                  >
                    <X data-icon="inline-start" />
                  </Button>
                ) : null}
              </div>
            </div>
          </DialogHeader>

          <div className="min-h-0 flex-1">
            <ScrollArea className="h-full">
              {loading ? (
                <div className="flex h-64 items-center justify-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="size-4 animate-spin" />
                  Loading records...
                </div>
              ) : error ? (
                <div className="flex h-64 flex-col items-center justify-center gap-2 px-6 text-center">
                  <p className="font-medium text-foreground">
                    Records could not be loaded
                  </p>
                  <p className="max-w-md text-sm text-muted-foreground">
                    {error}
                  </p>
                </div>
              ) : records.length === 0 ? (
                <div className="flex h-64 flex-col items-center justify-center gap-3 px-6 text-center">
                  <div className="rounded-full bg-muted p-4">
                    <Inbox className="size-8 text-muted-foreground" />
                  </div>
                  <div className="flex flex-col gap-1">
                    <p className="font-medium text-foreground">No records</p>
                    <p className="text-sm text-muted-foreground">
                      {search ? "No matches for this search." : "No records in this period."}
                    </p>
                  </div>
                </div>
              ) : (
                <Table>
                  <TableHeader className="sticky top-0 z-10 bg-background">
                    <TableRow>
                      <TableHead className="min-w-[150px]">Record</TableHead>
                      <TableHead className="min-w-[180px]">Customer</TableHead>
                      <TableHead className="min-w-[220px]">Relation</TableHead>
                      <TableHead className="min-w-[150px]">Status</TableHead>
                      <TableHead className="min-w-[170px]">Outcome</TableHead>
                      <TableHead className="min-w-[160px]">Owner</TableHead>
                      <TableHead className="min-w-[160px]">Date</TableHead>
                      <TableHead className="w-[90px]">Detail</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {records.map((record) => {
                      const detail = detailText(record);
                      return (
                        <TableRow key={record.id}>
                          <TableCell>
                            <div className="flex flex-col gap-1">
                              <RecordTypeBadge record={record} />
                              <span className="font-mono text-xs text-muted-foreground">
                                {recordPrimaryLabel(record)}
                              </span>
                              {record.aircallId ? (
                                <span className="font-mono text-[11px] text-muted-foreground">
                                  Aircall {record.aircallId}
                                </span>
                              ) : null}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex min-w-0 flex-col gap-1">
                              <span className="truncate font-medium">
                                {customerLabel(record)}
                              </span>
                              <span className="truncate text-xs text-muted-foreground">
                                {phoneLabel(record)}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <RelationshipCell record={record} />
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-wrap gap-1.5">
                              <Badge
                                variant={statusBadgeVariant(record.status)}
                              >
                                {formatLabel(record.status)}
                              </Badge>
                              {record.priority ? (
                                <Badge variant="outline">
                                  {formatLabel(record.priority)}
                                </Badge>
                              ) : null}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-col gap-1 text-sm">
                              {record.direction ? (
                                <span>{formatLabel(record.direction)}</span>
                              ) : null}
                              <span
                                className={cn(
                                  !record.direction && "text-muted-foreground",
                                )}
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
                            {detail ? (
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => setDetailRecord(record)}
                              >
                                <FileText data-icon="inline-start" />
                                View
                              </Button>
                            ) : (
                              <span className="text-sm text-muted-foreground">
                                -
                              </span>
                            )}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              )}
            </ScrollArea>
          </div>

          <DialogFooter className="border-t px-5 py-3">
            <div className="flex w-full flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm text-muted-foreground">
                <span className="font-medium text-foreground">{total}</span>{" "}
                record{total === 1 ? "" : "s"}
                <span className="mx-1">|</span>
                Page{" "}
                <span className="font-medium text-foreground">{page}</span> of{" "}
                <span className="font-medium text-foreground">
                  {Math.max(totalPages, 1)}
                </span>
              </p>
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={loading || page <= 1}
                  onClick={() => setPage((current) => Math.max(1, current - 1))}
                >
                  Prev
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={loading || page >= Math.max(totalPages, 1)}
                  onClick={() =>
                    setPage((current) =>
                      Math.min(Math.max(totalPages, 1), current + 1),
                    )
                  }
                >
                  Next
                </Button>
                <Button type="button" onClick={() => onOpenChange(false)}>
                  Done
                </Button>
              </div>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={Boolean(detailRecord)}
        onOpenChange={(nextOpen) => {
          if (!nextOpen) setDetailRecord(null);
        }}
      >
        <DialogContent className="max-h-[82vh] overflow-hidden rounded-lg p-0 sm:max-w-[560px]">
          <DialogHeader className="border-b px-5 py-4">
            <DialogTitle className="flex items-center gap-2 text-base font-semibold">
              <FileText className="size-4 text-primary" />
              Record Detail
            </DialogTitle>
            <DialogDescription>
              {detailRecord ? recordPrimaryLabel(detailRecord) : "Selected record"}
            </DialogDescription>
          </DialogHeader>
          <ScrollArea className="max-h-[58vh]">
            <div className="p-5">
              <p className="whitespace-pre-wrap break-words text-sm leading-6 text-foreground">
                {detailRecord ? detailText(detailRecord) : ""}
              </p>
            </div>
          </ScrollArea>
          <DialogFooter className="border-t px-5 py-3">
            <Button type="button" onClick={() => setDetailRecord(null)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
