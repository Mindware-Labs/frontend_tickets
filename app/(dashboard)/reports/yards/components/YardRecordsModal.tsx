"use client";

import { useEffect, useMemo, useState } from "react";
import {
  ClipboardList,
  FilePenLine,
  Inbox,
  Layers,
  Loader2,
  Phone,
  Search,
  Ticket,
  X,
} from "lucide-react";
import { fetchFromBackend } from "@/lib/api-client";
import { UnifiedRecordsList } from "@/components/records/UnifiedRecordsList";
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
  YardContextChip,
  YardSegmentedTabs,
  YardStatusBadge,
  yardDashboardToolbarClass,
} from "./yard-dashboard-chrome";
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

const recordTabs: Array<{
  value: RecordTab;
  label: string;
  countKey: keyof YardRecordCounts;
  icon: typeof Layers;
}> = [
  { value: "all", label: "All", countKey: "all", icon: Layers },
  { value: "call", label: "Calls", countKey: "calls", icon: Phone },
  { value: "ticket", label: "Tickets", countKey: "tickets", icon: Ticket },
  {
    value: "manual_record",
    label: "Manual",
    countKey: "manualRecords",
    icon: FilePenLine,
  },
];

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
  const [lastLoadedAt, setLastLoadedAt] = useState<string | null>(null);
  const [detail, setDetail] = useState<{ title: string; body: string } | null>(
    null,
  );

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
    setDetail(null);
    setLastLoadedAt(null);
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
        setLastLoadedAt(
          new Date().toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          }),
        );

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
    return `${reportStartDate} → ${reportEndDate}`;
  }, [reportStartDate, reportEndDate]);

  const segmentedTabs = useMemo(
    () =>
      recordTabs.map((tab) => ({
        value: tab.value,
        label: tab.label,
        icon: tab.icon,
        count: counts[tab.countKey],
      })),
    [counts],
  );

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="flex h-[90vh] w-[calc(100vw-2rem)] max-w-[calc(100vw-2rem)] flex-col gap-0 overflow-hidden rounded-xl border border-slate-200/80 p-0 shadow-lg sm:max-w-[min(96vw,1320px)]">
          <DialogHeader className="sr-only">
            <DialogTitle>Yard Records — {yardName}</DialogTitle>
            <DialogDescription>
              Unified calls, tickets, and manual records for the selected period.
            </DialogDescription>
          </DialogHeader>

          <div className="shrink-0 border-b border-slate-100 bg-[#f4f5f7]/80 px-3 py-3 dark:border-slate-800 dark:bg-slate-900/50">
            <div className={yardDashboardToolbarClass}>
              <div className="flex min-w-0 flex-1 flex-col gap-3 lg:flex-row lg:items-center lg:gap-4">
                <YardSegmentedTabs
                  tabs={segmentedTabs}
                  activeValue={activeTab}
                  onChange={setActiveTab}
                  ariaLabel="Record types"
                  layout="grid"
                  className="w-full min-w-0 sm:min-w-[360px]"
                />

                <div className="flex min-w-0 flex-wrap items-center gap-1.5">
                  <YardContextChip label="Yard" value={yardName} />
                  <YardContextChip label="Range" value={periodLabel} />
                  {counts.linkedTickets > 0 ? (
                    <YardContextChip
                      label="Linked"
                      value={`${counts.linkedTickets} tickets`}
                    />
                  ) : null}
                </div>
              </div>

              <div className="flex w-full flex-col gap-3 border-t border-slate-100 pt-2 sm:flex-row sm:items-center sm:justify-between md:border-t-0 md:pt-0">
                <div className="relative w-full sm:max-w-xs">
                  <Search
                    className="pointer-events-none absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-slate-400"
                    aria-hidden
                  />
                  <Input
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    placeholder="Search records"
                    className="h-8 rounded-lg border-slate-200 bg-white pl-9 pr-9 text-xs shadow-sm dark:border-slate-700 dark:bg-slate-950"
                  />
                  {search ? (
                    <button
                      type="button"
                      className="absolute right-1 top-1/2 flex size-6 -translate-y-1/2 items-center justify-center rounded-md text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
                      aria-label="Clear search"
                      onClick={() => setSearch("")}
                    >
                      <X className="size-3.5" />
                    </button>
                  ) : null}
                </div>

                <div className="flex items-center justify-between gap-3 sm:justify-end">
                  <div
                    className="hidden h-4 w-px shrink-0 bg-slate-200 sm:block dark:bg-slate-700"
                    aria-hidden
                  />

                  <div className="flex items-center gap-2 text-slate-400">
                    <YardStatusBadge
                      label={
                        loading
                          ? "Loading"
                          : error
                            ? "Error"
                            : `${total} records`
                      }
                      tone={loading ? "loading" : error ? "muted" : "ready"}
                    />
                    {lastLoadedAt ? (
                      <span className="rounded border border-slate-200/40 bg-slate-100 px-2 py-0.5 font-mono text-xs font-medium text-slate-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-400">
                        {lastLoadedAt}
                      </span>
                    ) : null}
                    <button
                      type="button"
                      onClick={() => onOpenChange(false)}
                      className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 shadow-sm transition-colors hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-300"
                    >
                      <ClipboardList className="size-3.5" aria-hidden />
                      Close
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="min-h-0 flex-1 bg-white dark:bg-slate-950">
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
                      {search
                        ? "No matches for this search."
                        : "No records in this period."}
                    </p>
                  </div>
                </div>
              ) : (
                <UnifiedRecordsList
                  records={records}
                  onViewDetail={(body, title) => setDetail({ body, title })}
                />
              )}
            </ScrollArea>
          </div>

          <DialogFooter className="shrink-0 border-t border-slate-100 bg-slate-50/80 px-4 py-2.5 dark:border-slate-800 dark:bg-slate-900/40">
            <div className="flex w-full flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-xs text-slate-500 dark:text-slate-400">
                <span className="font-semibold text-slate-800 dark:text-slate-100">
                  {total}
                </span>{" "}
                top-level record{total === 1 ? "" : "s"}
                <span className="mx-1.5 text-slate-300">|</span>
                Page{" "}
                <span className="font-semibold text-slate-800 dark:text-slate-100">
                  {page}
                </span>{" "}
                of{" "}
                <span className="font-semibold text-slate-800 dark:text-slate-100">
                  {Math.max(totalPages, 1)}
                </span>
              </p>
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-8 rounded-lg border-slate-200 text-xs"
                  disabled={loading || page <= 1}
                  onClick={() => setPage((current) => Math.max(1, current - 1))}
                >
                  Prev
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-8 rounded-lg border-slate-200 text-xs"
                  disabled={loading || page >= Math.max(totalPages, 1)}
                  onClick={() =>
                    setPage((current) =>
                      Math.min(Math.max(totalPages, 1), current + 1),
                    )
                  }
                >
                  Next
                </Button>
              </div>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={Boolean(detail)}
        onOpenChange={(nextOpen) => {
          if (!nextOpen) setDetail(null);
        }}
      >
        <DialogContent className="max-h-[82vh] overflow-hidden rounded-xl border border-slate-200/80 p-0 sm:max-w-[560px]">
          <DialogHeader className="border-b border-slate-100 px-4 py-3 dark:border-slate-800">
            <DialogTitle className="text-sm font-bold text-slate-800 dark:text-slate-100">
              {detail?.title}
            </DialogTitle>
            <DialogDescription className="text-[11px]">
              Record detail
            </DialogDescription>
          </DialogHeader>
          <ScrollArea className="max-h-[58vh]">
            <div className="p-5">
              <p className="whitespace-pre-wrap break-words text-sm leading-6 text-foreground">
                {detail?.body}
              </p>
            </div>
          </ScrollArea>
          <DialogFooter className="border-t border-slate-100 px-4 py-2.5 dark:border-slate-800">
            <Button
              type="button"
              size="sm"
              className="h-8 rounded-lg text-xs"
              onClick={() => setDetail(null)}
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
