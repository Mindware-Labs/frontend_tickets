"use client";

import { useEffect, useMemo, useState } from "react";
import {
  ClipboardList,
  FilePenLine,
  FileText,
  Inbox,
  Layers,
  Loader2,
  Phone,
  Search,
  Ticket,
  X,
  XCircle,
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
import { cn } from "@/lib/utils";
import { dashboardPanelClass } from "@/app/(dashboard)/dashboard/dashboard-theme";
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

function RecordsEmptyState({
  icon: Icon,
  title,
  description,
  spinIcon = false,
}: {
  icon: typeof Inbox;
  title: string;
  description: string;
  spinIcon?: boolean;
}) {
  return (
    <div className="flex min-h-[360px] flex-col items-center justify-center px-6 py-10 text-center">
      <div className="mb-4 rounded-xl bg-[#f0faf5] p-4 text-[#008f68] ring-8 ring-[#f0faf5]/60 dark:bg-emerald-500/10 dark:text-emerald-400 dark:ring-emerald-500/5">
        <Icon
          className={cn("size-10 opacity-80", spinIcon && "animate-spin")}
          aria-hidden
        />
      </div>
      <p className="text-[15px] font-semibold text-slate-900 dark:text-slate-100">
        {title}
      </p>
      <p className="mt-1 max-w-[320px] text-xs leading-5 text-slate-500 dark:text-slate-400">
        {description}
      </p>
    </div>
  );
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
  const [isSearchFocused, setIsSearchFocused] = useState(false);
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

  const activeTabLabel =
    recordTabs.find((tab) => tab.value === activeTab)?.label ?? "Records";

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="flex h-[90dvh] w-[calc(100vw-2rem)] max-w-[calc(100vw-2rem)] flex-col gap-0 overflow-hidden rounded-2xl border border-slate-200/80 bg-[#f4f5f7] p-0 shadow-2xl sm:max-w-[min(96vw,1400px)] dark:border-slate-800 dark:bg-slate-950">
          <div className="relative shrink-0 border-b border-slate-200/80 bg-white dark:border-slate-800 dark:bg-slate-950">
            <div
              className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#008f68]/45 to-transparent"
              aria-hidden
            />
            <DialogHeader className="space-y-0 px-4 pb-2.5 pt-3.5 text-left sm:px-5">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="flex min-w-0 items-start gap-2.5">
                  <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-[#f0faf5] text-[#008f68] ring-1 ring-[#008f68]/15 dark:bg-emerald-500/10 dark:text-emerald-400">
                    <ClipboardList className="size-4" aria-hidden />
                  </span>
                  <div className="min-w-0 space-y-1">
                    <DialogTitle className="text-[15px] font-semibold leading-tight text-slate-900 dark:text-slate-100">
                      Record Directory
                    </DialogTitle>
                    <DialogDescription className="text-xs leading-5 text-slate-500 dark:text-slate-400">
                      Unified calls, tickets, and manual records for{" "}
                      <span className="font-semibold text-slate-800 dark:text-slate-100">
                        {yardName}
                      </span>
                    </DialogDescription>
                    <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                      <YardContextChip label="Range" value={periodLabel} />
                      {counts.linkedTickets > 0 ? (
                        <YardContextChip
                          label="Linked"
                          value={`${counts.linkedTickets} tickets on calls`}
                        />
                      ) : null}
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2 sm:justify-end">
                  <span className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-slate-200/80 bg-slate-50 px-3 text-xs font-semibold text-slate-700 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200">
                    <Layers className="size-3.5 text-slate-400" aria-hidden />
                    {recordTabs.length} types
                  </span>
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
                    <span className="inline-flex h-8 items-center rounded-lg border border-slate-200/70 bg-slate-100 px-2.5 font-mono text-xs font-medium text-slate-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-400">
                      {lastLoadedAt}
                    </span>
                  ) : null}
                </div>
              </div>

              <div className="pt-2">
                <div
                  className={cn(
                    "relative max-w-full transition-[width] duration-200 sm:max-w-[360px]",
                    isSearchFocused && "sm:max-w-[420px]",
                  )}
                >
                  <Search
                    className="pointer-events-none absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-slate-400"
                    aria-hidden
                  />
                  <Input
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    onFocus={() => setIsSearchFocused(true)}
                    onBlur={() => setIsSearchFocused(false)}
                    placeholder="Search by customer, phone, ID, agent..."
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
            </DialogHeader>

            <div className="border-t border-slate-200/80 bg-[#f4f5f7] px-4 py-2 dark:border-slate-800 dark:bg-slate-950 sm:px-5">
              <div className="relative min-w-0">
                <div
                  className="pointer-events-none absolute inset-y-0 left-0 z-10 w-6 bg-gradient-to-r from-[#f4f5f7] to-transparent dark:from-slate-950"
                  aria-hidden
                />
                <div
                  className="pointer-events-none absolute inset-y-0 right-0 z-10 w-6 bg-gradient-to-l from-[#f4f5f7] to-transparent dark:from-slate-950"
                  aria-hidden
                />
                <ScrollArea className="w-full" type="scroll">
                  <YardSegmentedTabs
                    tabs={segmentedTabs}
                    activeValue={activeTab}
                    onChange={setActiveTab}
                    ariaLabel="Record types"
                    className="w-max min-w-full"
                  />
                </ScrollArea>
              </div>
            </div>
          </div>

          <div className="min-h-0 flex-1 px-3 py-3 dark:bg-slate-950 sm:px-4">
            <div
              className={cn(
                dashboardPanelClass,
                "flex h-full min-h-0 flex-col overflow-hidden",
              )}
            >
              <ScrollArea className="h-full flex-1 scrollbar-app-hover [&>[data-radix-scroll-area-viewport]]:max-h-full">
                {loading ? (
                  <RecordsEmptyState
                    icon={Loader2}
                    spinIcon
                    title="Loading records..."
                    description={`Fetching page ${page} of ${Math.max(totalPages, 1)}${activeTab !== "all" ? ` (${activeTabLabel})` : ""}.`}
                  />
                ) : error ? (
                  <div className="flex min-h-[360px] flex-col items-center justify-center px-6 py-10 text-center">
                    <div className="mb-4 rounded-xl bg-rose-50 p-4 text-rose-600 ring-8 ring-rose-50/80 dark:bg-rose-500/10 dark:text-rose-400 dark:ring-rose-500/5">
                      <XCircle className="size-10" aria-hidden />
                    </div>
                    <p className="text-[15px] font-semibold text-slate-900 dark:text-slate-100">
                      Records could not be loaded
                    </p>
                    <p className="mt-1 max-w-[360px] text-xs text-slate-500 dark:text-slate-400">
                      {error}
                    </p>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="mt-4 h-8 rounded-lg text-xs"
                      onClick={() => setPage((current) => current)}
                    >
                      Retry
                    </Button>
                  </div>
                ) : records.length === 0 ? (
                  <RecordsEmptyState
                    icon={search ? Search : Inbox}
                    title={search ? "No matching records" : "No records found"}
                    description={
                      search
                        ? "Try another search term or clear the filter."
                        : `No ${activeTab === "all" ? "" : `${activeTabLabel.toLowerCase()} `}records in this date range.`
                    }
                  />
                ) : (
                  <div className="p-2">
                    <UnifiedRecordsList
                      records={records}
                      className="rounded-xl border-0 shadow-none"
                      onViewDetail={(body, title) => setDetail({ body, title })}
                    />
                  </div>
                )}
              </ScrollArea>
            </div>
          </div>

          <DialogFooter className="shrink-0 border-t border-slate-200/80 bg-white px-4 py-3 dark:border-slate-800 dark:bg-slate-950 sm:px-5">
            <div className="flex w-full flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-xs text-slate-500 dark:text-slate-400">
                <span className="font-semibold text-slate-800 dark:text-slate-100">
                  {total}
                </span>{" "}
                record{total === 1 ? "" : "s"}
                {activeTab !== "all" ? (
                  <>
                    {" "}
                    in{" "}
                    <span className="font-semibold text-slate-800 dark:text-slate-100">
                      {activeTabLabel}
                    </span>
                  </>
                ) : null}
                {search ? " matching search" : null}
                <span className="mx-1.5 text-slate-300 dark:text-slate-700">
                  |
                </span>
                Page{" "}
                <span className="font-semibold text-slate-800 dark:text-slate-100">
                  {page}
                </span>{" "}
                of{" "}
                <span className="font-semibold text-slate-800 dark:text-slate-100">
                  {Math.max(totalPages, 1)}
                </span>
              </p>
              <div className="flex flex-wrap items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-8 rounded-lg border-slate-200 bg-white text-xs shadow-sm dark:border-slate-800 dark:bg-slate-950"
                  disabled={loading || page <= 1}
                  onClick={() => setPage((current) => Math.max(1, current - 1))}
                >
                  Prev
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-8 rounded-lg border-slate-200 bg-white text-xs shadow-sm dark:border-slate-800 dark:bg-slate-950"
                  disabled={loading || page >= Math.max(totalPages, 1)}
                  onClick={() =>
                    setPage((current) =>
                      Math.min(Math.max(totalPages, 1), current + 1),
                    )
                  }
                >
                  Next
                </Button>
                <Button
                  type="button"
                  size="sm"
                  className="h-8 min-w-[100px] rounded-lg bg-[#008f68] text-xs font-semibold hover:bg-[#007a5a]"
                  onClick={() => onOpenChange(false)}
                >
                  Done
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
        <DialogContent className="max-h-[82dvh] overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-0 shadow-2xl sm:max-w-[min(92vw,560px)] dark:border-slate-800 dark:bg-slate-950">
          <DialogHeader className="border-b border-slate-200/80 px-4 py-3 dark:border-slate-800">
            <DialogTitle className="flex items-center gap-2 text-[15px] font-semibold text-slate-900 dark:text-slate-100">
              <FileText className="size-4 text-[#008f68] dark:text-emerald-400" />
              Record detail
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              {detail?.title}
            </DialogDescription>
          </DialogHeader>
          <ScrollArea className="max-h-[58dvh] bg-[#f4f5f7] scrollbar-app dark:bg-slate-950">
            <div className="p-3">
              {detail?.body?.trim() ? (
                <div className="rounded-xl border border-slate-200/80 bg-white px-3 py-2.5 shadow-[0_1px_3px_rgba(0,0,0,0.06)] dark:border-slate-800 dark:bg-slate-950">
                  <p className="whitespace-pre-wrap break-words text-xs leading-5 text-slate-700 dark:text-slate-300">
                    {detail.body.trim()}
                  </p>
                </div>
              ) : (
                <div className="rounded-xl border border-dashed border-slate-200/80 bg-white/80 px-4 py-6 text-center text-xs text-slate-500 dark:border-slate-800 dark:bg-slate-950/80">
                  No detail available for this record.
                </div>
              )}
            </div>
          </ScrollArea>
          <DialogFooter className="border-t border-slate-200/80 bg-slate-50/80 px-4 py-2.5 dark:border-slate-800 dark:bg-slate-900/40">
            <Button
              type="button"
              size="sm"
              className="h-9 rounded-lg bg-[#008f68] text-xs hover:bg-[#007a5a] sm:min-w-[100px]"
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
