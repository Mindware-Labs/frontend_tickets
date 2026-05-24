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
import { fetchFromBackend } from "@/lib/api-client";
import {
  YardContextChip,
  YardSegmentedTabs,
  YardStatusBadge,
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
  const [activeTab, setActiveTab] = useState<RecordTab>("call");
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
    setActiveTab("call");
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
    return `${reportStartDate} -> ${reportEndDate}`;
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
        <DialogContent className="flex h-[90dvh] w-[calc(100vw-2rem)] max-w-[calc(100vw-2rem)] flex-col gap-0 overflow-hidden rounded-2xl border border-slate-200/80 bg-[#f4f5f7] p-0 shadow-2xl sm:max-w-[min(96vw,1320px)] dark:border-slate-800 dark:bg-slate-950">
          <div className="shrink-0 border-b border-slate-200/80 bg-white pr-10 dark:border-slate-800 dark:bg-slate-950">
            <DialogHeader className="flex flex-row items-start justify-between gap-4 px-4 pb-2.5 pt-3 text-left">
              <div className="flex min-w-0 items-start gap-2.5">
                <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-[#f0faf5] text-[#008f68] dark:bg-emerald-500/10 dark:text-emerald-400">
                  <ClipboardList className="size-4" aria-hidden />
                </span>
                <div className="min-w-0">
                  <DialogTitle className="text-[15px] font-semibold leading-tight text-slate-900 dark:text-slate-100">
                    Record Directory
                  </DialogTitle>
                  <DialogDescription className="mt-1 flex flex-wrap items-center gap-1.5 text-xs leading-5 text-slate-500">
                    <span>Showing records for</span>
                    <span className="font-semibold text-slate-800 dark:text-slate-100">
                      {yardName}
                    </span>
                    <span className="rounded-md border border-slate-200/80 bg-slate-50 px-2 py-0.5 font-mono text-[10px] text-slate-500 dark:border-slate-800 dark:bg-slate-900">
                      {periodLabel}
                    </span>
                  </DialogDescription>
                </div>
              </div>

              <div className="flex shrink-0 flex-wrap justify-end gap-2">
                <span className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-slate-200/80 bg-white px-3 text-xs font-semibold text-slate-700 shadow-sm dark:border-slate-800 dark:bg-slate-950 dark:text-slate-200">
                  <Layers className="size-3.5 text-slate-400" aria-hidden />
                  {recordTabs.length} Categories
                </span>
                <YardStatusBadge
                  label={
                    loading ? "Loading" : error ? "Error" : `${total} records`
                  }
                  tone={loading ? "loading" : error ? "muted" : "ready"}
                />
                {lastLoadedAt ? (
                  <span className="inline-flex h-8 items-center rounded-lg border border-slate-200/70 bg-slate-100 px-2.5 font-mono text-xs font-medium text-slate-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-400">
                    {lastLoadedAt}
                  </span>
                ) : null}
              </div>
            </DialogHeader>

            <div className="px-4 pb-3">
              <div className="relative w-full max-w-[360px]">
                <Search
                  className="pointer-events-none absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-slate-400"
                  aria-hidden
                />
                <Input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search records"
                  className="h-9 rounded-lg border-slate-200/80 bg-slate-50 pl-9 pr-9 text-xs shadow-sm hover:border-slate-300 focus:border-[#008f68] focus:bg-white focus:ring-2 focus:ring-[#008f68]/20 dark:border-slate-800 dark:bg-slate-900 dark:hover:border-slate-700"
                />
                {search ? (
                  <button
                    type="button"
                    className="absolute right-1 top-1/2 flex size-7 -translate-y-1/2 items-center justify-center rounded-md text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
                    aria-label="Clear search"
                    onClick={() => setSearch("")}
                  >
                    <X className="size-3.5" />
                  </button>
                ) : null}
              </div>
            </div>

            <div className="border-t border-slate-200/80 bg-[#f4f5f7] px-4 py-2 dark:border-slate-800 dark:bg-slate-950">
              <div className="flex flex-wrap items-center gap-2">
                <YardSegmentedTabs
                  tabs={segmentedTabs}
                  activeValue={activeTab}
                  onChange={setActiveTab}
                  ariaLabel="Record types"
                  className="w-auto min-w-0"
                />
                {counts.linkedTickets > 0 ? (
                  <YardContextChip
                    label="Linked"
                    value={`${counts.linkedTickets} tickets`}
                  />
                ) : null}
              </div>
            </div>
          </div>

          <div className="min-h-0 flex-1 bg-[#f4f5f7] px-3 dark:bg-slate-950">
            <ScrollArea className="h-full">
              {loading ? (
                <div className="flex h-64 items-center justify-center gap-2 text-xs text-slate-500">
                  <Loader2 className="size-4 animate-spin" />
                  Loading records...
                </div>
              ) : error ? (
                <div className="flex h-64 flex-col items-center justify-center gap-2 px-6 text-center">
                  <p className="text-[15px] font-semibold text-slate-900 dark:text-slate-100">
                    Records could not be loaded
                  </p>
                  <p className="max-w-md text-xs text-slate-500 dark:text-slate-400">
                    {error}
                  </p>
                </div>
              ) : records.length === 0 ? (
                <div className="flex h-64 flex-col items-center justify-center gap-3 px-6 text-center">
                  <div className="rounded-lg bg-[#f0faf5] p-3 text-[#008f68]">
                    <Inbox className="size-6" />
                  </div>
                  <div className="flex flex-col gap-1">
                    <p className="text-[15px] font-semibold text-slate-900 dark:text-slate-100">
                      No records
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      {search
                        ? "No matches for this search."
                        : "No records in this period."}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="py-3">
                  <UnifiedRecordsList
                    records={records}
                    onViewDetail={(body, title) => setDetail({ body, title })}
                  />
                </div>
              )}
            </ScrollArea>
          </div>

          <DialogFooter className="shrink-0 border-t border-slate-200/80 bg-white px-4 py-2.5 dark:border-slate-800 dark:bg-slate-950">
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
                  className="h-8 rounded-lg border-slate-200 bg-white text-xs shadow-sm"
                  disabled={loading || page <= 1}
                  onClick={() => setPage((current) => Math.max(1, current - 1))}
                >
                  Prev
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-8 rounded-lg border-slate-200 bg-white text-xs shadow-sm"
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
        <DialogContent className="max-h-[82vh] overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-0 shadow-2xl sm:max-w-[560px] dark:border-slate-800 dark:bg-slate-950">
          <DialogHeader className="border-b border-slate-200/80 px-4 py-3 dark:border-slate-800">
            <DialogTitle className="text-[15px] font-semibold text-slate-900 dark:text-slate-100">
              {detail?.title}
            </DialogTitle>
            <DialogDescription className="text-xs">
              Record detail
            </DialogDescription>
          </DialogHeader>
          <ScrollArea className="max-h-[58vh]">
            <div className="bg-[#f4f5f7] p-3 dark:bg-slate-950">
              <p className="whitespace-pre-wrap break-words rounded-xl border border-slate-200/80 bg-white px-3 py-2.5 text-xs leading-5 text-slate-700 shadow-[0_1px_3px_rgba(0,0,0,0.06)] dark:border-slate-800 dark:bg-slate-950 dark:text-slate-300">
                {detail?.body}
              </p>
            </div>
          </ScrollArea>
          <DialogFooter className="border-t border-slate-200/80 px-4 py-2.5 dark:border-slate-800">
            <Button
              type="button"
              size="sm"
              className="h-8 rounded-lg bg-[#008f68] text-xs hover:bg-[#007a5a]"
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
