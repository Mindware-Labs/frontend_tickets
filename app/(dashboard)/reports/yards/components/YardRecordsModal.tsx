"use client";

import { useEffect, useMemo, useState } from "react";
import {
  ClipboardList,
  FilePenLine,
  FileText,
  Inbox,
  Layers,
  Phone,
  Search,
  SlidersHorizontal,
  Ticket,
  X,
  XCircle,
} from "lucide-react";

import { UnifiedRecordsList } from "@/components/records/UnifiedRecordsList";
import {
  EntityLoadingSpinner,
  type EntityLoadingKind,
} from "@/components/shared/entity-loading-state";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  filterPillActiveClassName,
  filterPillIdleClassName,
  filterPillTriggerClassName,
  filterSelectContentClassName,
  filterSelectItemClassName,
} from "@/components/filters/filter-select-styles";
import { fetchFromBackend } from "@/lib/api-client";
import { cn } from "@/lib/utils";
import { dashboardPanelClass } from "@/app/(dashboard)/dashboard/dashboard-theme";
import {
  YardContextChip,
  YardSegmentedTabs,
  YardStatusBadge,
} from "./yard-dashboard-chrome";
import type { YardRecord, YardRecordType } from "./types";
import {
  emptyYardDashboardFilters,
  yardFilterLabel,
  type YardDashboardFilters,
  type YardDashboardFilterKey,
} from "./yard-dashboard-filters";

type RecordTab = YardRecordType;

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
  /**
   * Filters chosen on the yard dashboard (clicking on a chart segment, day,
   * agent row, etc.). Applied on top of the modal's own filter selects when
   * the records modal is opened.
   */
  inheritedFilters?: YardDashboardFilters;
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

const recordFilterOptions = {
  status: [
    { value: "all", label: "All statuses" },
    { value: "ACTIVE", label: "Active" },
    { value: "PENDING_FOLLOWUP", label: "Follow-up" },
    { value: "OVERDUE", label: "Overdue" },
    { value: "COMPLETED", label: "Completed" },
    { value: "RESOLVED", label: "Resolved" },
    { value: "CLOSED", label: "Closed" },
  ],
  disposition: [
    { value: "all", label: "All dispositions" },
    { value: "RESOLVED", label: "Resolved" },
    { value: "NEW_LEAD", label: "New lead" },
    { value: "PROMISE_TO_PAY", label: "Promise to pay" },
    { value: "NO_ANSWER", label: "No answer" },
    { value: "DISPUTE", label: "Dispute" },
    { value: "WRONG_NUMBER", label: "Wrong number" },
    { value: "ESCALATED", label: "Escalated" },
    { value: "BILLING", label: "Billing" },
    { value: "SUPPORT", label: "Support" },
    { value: "COMPLAINT", label: "Complaint" },
    { value: "UNSPECIFIED", label: "Unspecified" },
  ],
  direction: [
    { value: "all", label: "All directions" },
    { value: "INBOUND", label: "Inbound" },
    { value: "OUTBOUND", label: "Outbound" },
    { value: "MISSED", label: "Missed" },
  ],
  priority: [
    { value: "all", label: "All priorities" },
    { value: "LOW", label: "Low" },
    { value: "MEDIUM", label: "Medium" },
    { value: "HIGH", label: "High" },
    { value: "EMERGENCY", label: "Emergency" },
  ],
} as const;

function recordTabLoadingKind(tab: RecordTab): EntityLoadingKind {
  if (tab === "call") return "calls";
  if (tab === "ticket") return "tickets";
  return "manual-records";
}

function RecordsEmptyState({
  icon: Icon,
  title,
  description,
}: {
  icon: typeof Inbox;
  title: string;
  description: string;
}) {
  return (
    <div className="flex min-h-[360px] flex-col items-center justify-center px-6 py-10 text-center">
      <div className="mb-4 rounded-xl bg-[#f0faf5] p-4 text-[#008f68] ring-8 ring-[#f0faf5]/60 dark:bg-emerald-500/10 dark:text-emerald-400 dark:ring-emerald-500/5">
        <Icon className="size-10 opacity-80" aria-hidden />
      </div>
      <p className="text-[15px] font-semibold text-slate-900 dark:text-neutral-100">
        {title}
      </p>
      <p className="mt-1 max-w-[320px] text-xs leading-5 text-slate-500 dark:text-neutral-400">
        {description}
      </p>
    </div>
  );
}

type RecordFilterKey = keyof typeof recordFilterOptions;

/**
 * The yard dashboard stores filter values as formatted human labels
 * (e.g. `"New Lead"`, `"Inbound"`, `"High"`) produced by `formatMetricLabel`,
 * but the modal's `<Select>` options use enum values (`"NEW_LEAD"`, etc.).
 * This converts a yard label back into the closest enum candidate.
 */
const yardLabelToEnumCandidate = (value: string | null | undefined): string => {
  if (!value) return "";
  return value.trim().toUpperCase().replace(/\s+/g, "_");
};

/**
 * Try to map an inherited yard filter value to a known modal `<Select>`
 * option. Returns the option value (e.g. `"NEW_LEAD"`) when it matches an
 * available choice, or `null` when the inherited value should remain as a
 * "From yard report" chip instead.
 */
const matchYardFilterToSelectOption = (
  key: RecordFilterKey,
  value: string | null | undefined,
): string | null => {
  if (!value) return null;
  const candidate = yardLabelToEnumCandidate(value);
  if (!candidate) return null;
  const found = recordFilterOptions[key].find(
    (option) => option.value !== "all" && option.value === candidate,
  );
  return found ? found.value : null;
};

function DirectoryFilterSelect({
  value,
  onValueChange,
  options,
  active,
  ariaLabel,
  triggerClassName,
}: {
  value: string;
  onValueChange: (value: string) => void;
  options: readonly { value: string; label: string }[];
  active: boolean;
  ariaLabel: string;
  triggerClassName?: string;
}) {
  return (
    <Select value={value} onValueChange={onValueChange}>
      <SelectTrigger
        aria-label={ariaLabel}
        className={cn(
          filterPillTriggerClassName,
          active ? filterPillActiveClassName : filterPillIdleClassName,
          triggerClassName,
        )}
      >
        <SelectValue />
      </SelectTrigger>
      <SelectContent className={filterSelectContentClassName}>
        {options.map((option) => (
          <SelectItem
            key={option.value}
            value={option.value}
            className={filterSelectItemClassName}
          >
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

const normalizeRecordFilterValue = (value?: string | number | null) =>
  String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[\s-]+/g, "_");

function recordMatchesFilter(
  record: YardRecord,
  filterKey: RecordFilterKey,
  filterValue: string,
) {
  const filter = normalizeRecordFilterValue(filterValue);
  if (!filter || filter === "all") return true;

  const linkedTickets = record.tickets || [];
  const values =
    filterKey === "status"
      ? [
          record.status,
          record.call?.status,
          ...linkedTickets.map((ticket) => ticket.status),
        ]
      : filterKey === "disposition"
        ? [
            record.disposition,
            record.call?.disposition,
            ...linkedTickets.flatMap((ticket) => [
              ticket.ticketType,
              ticket.campaignOption,
            ]),
          ]
        : filterKey === "direction"
          ? [record.direction, record.call?.direction]
          : [
              record.priority,
              ...linkedTickets.map((ticket) => ticket.priority),
            ];

  return values.some((value) => normalizeRecordFilterValue(value) === filter);
}

function recordMatchesFilters(
  record: YardRecord,
  filters: Record<RecordFilterKey, string>,
) {
  return (Object.entries(filters) as [RecordFilterKey, string][]).every(
    ([key, value]) => recordMatchesFilter(record, key, value),
  );
}

export function YardRecordsModal({
  open,
  onOpenChange,
  yardName,
  yardId,
  reportStartDate,
  reportEndDate,
  inheritedFilters,
}: YardRecordsModalProps) {
  const [activeTab, setActiveTab] = useState<RecordTab>("call");
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [recordFilters, setRecordFilters] = useState<
    Record<RecordFilterKey, string>
  >({
    status: "all",
    disposition: "all",
    direction: "all",
    priority: "all",
  });
  const [appliedYardFilters, setAppliedYardFilters] =
    useState<YardDashboardFilters>(emptyYardDashboardFilters);
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
    setActiveTab("call");
    setSearch("");
    setDebouncedSearch("");

    // Each yard filter for which we own a `<Select>` (disposition / direction
    // / priority) is migrated into `recordFilters` whenever its label maps to
    // a known option, so the trigger displays a proper label instead of going
    // blank. Anything else stays in `appliedYardFilters` and surfaces as a
    // "From yard report" chip.
    const inherited = inheritedFilters ?? emptyYardDashboardFilters();
    const dispositionMatch = matchYardFilterToSelectOption(
      "disposition",
      inherited.disposition,
    );
    const directionMatch = matchYardFilterToSelectOption(
      "direction",
      inherited.direction,
    );
    const priorityMatch = matchYardFilterToSelectOption(
      "priority",
      inherited.priority,
    );

    setRecordFilters({
      status: "all",
      disposition: dispositionMatch ?? "all",
      direction: directionMatch ?? "all",
      priority: priorityMatch ?? "all",
    });
    setAppliedYardFilters({
      ...inherited,
      disposition: dispositionMatch ? null : inherited.disposition,
      direction: directionMatch ? null : inherited.direction,
      priority: priorityMatch ? null : inherited.priority,
    });

    setPage(1);
    setDetail(null);
    setLastLoadedAt(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  useEffect(() => {
    setPage(1);
  }, [activeTab, debouncedSearch, recordFilters, appliedYardFilters]);

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

        // For keys we own as a `<Select>`, the user-picked value wins; if the
        // user kept the select at "all" but the yard chart contributed a
        // value (e.g. an unmatched label), fall back to that so it is still
        // applied server-side.
        const resolveFilterParam = (
          selectValue: string,
          inheritedValue?: string | null,
        ): string | null => {
          if (selectValue && selectValue !== "all") return selectValue;
          if (inheritedValue) return inheritedValue;
          return null;
        };

        const statusParam = resolveFilterParam(recordFilters.status);
        if (statusParam) params.set("status", statusParam);

        const dispositionParam = resolveFilterParam(
          recordFilters.disposition,
          appliedYardFilters.disposition,
        );
        if (dispositionParam) params.set("disposition", dispositionParam);

        const directionParam = resolveFilterParam(
          recordFilters.direction,
          appliedYardFilters.direction,
        );
        if (directionParam) params.set("direction", directionParam);

        const priorityParam = resolveFilterParam(
          recordFilters.priority,
          appliedYardFilters.priority,
        );
        if (priorityParam) params.set("priority", priorityParam);

        if (appliedYardFilters.agent) {
          params.set("agentName", appliedYardFilters.agent);
        }
        if (appliedYardFilters.customer) {
          params.set("customerName", appliedYardFilters.customer);
        }
        if (appliedYardFilters.campaign) {
          params.set("campaignName", appliedYardFilters.campaign);
        }
        if (appliedYardFilters.day) {
          params.set("activityDate", appliedYardFilters.day);
        }

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
    appliedYardFilters,
    canFetch,
    debouncedSearch,
    page,
    recordFilters,
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
  const activeFilterCount = Object.values(recordFilters).filter(
    (value) => value !== "all",
  ).length;
  const inheritedActive = useMemo(() => {
    return (
      Object.entries(appliedYardFilters) as [
        YardDashboardFilterKey,
        string | null,
      ][]
    ).filter(([, value]) => Boolean(value));
  }, [appliedYardFilters]);
  const inheritedActiveCount = inheritedActive.length;
  const totalActiveFilters = activeFilterCount + inheritedActiveCount;
  const visibleRecords = useMemo(
    () =>
      activeFilterCount > 0
        ? records.filter((record) => recordMatchesFilters(record, recordFilters))
        : records,
    [activeFilterCount, recordFilters, records],
  );
  const visibleTotal = activeFilterCount > 0 ? visibleRecords.length : total;
  const clearRecordFilters = () => {
    setRecordFilters({
      status: "all",
      disposition: "all",
      direction: "all",
      priority: "all",
    });
    setAppliedYardFilters(emptyYardDashboardFilters());
  };
  const clearInheritedFilter = (key: YardDashboardFilterKey) => {
    setAppliedYardFilters((current) => ({ ...current, [key]: null }));
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent
          showCloseButton={false}
          className="flex h-[90dvh] w-[calc(100vw-2rem)] max-w-[calc(100vw-2rem)] flex-col gap-0 overflow-hidden rounded-2xl border border-slate-200/80 bg-[#f4f5f7] p-0 shadow-2xl sm:max-w-[min(96vw,1400px)] dark:border-neutral-800 dark:bg-neutral-950"
        >
          <div className="relative shrink-0 border-b border-slate-200/80 bg-white dark:border-neutral-800 dark:bg-neutral-950">
            <div
              className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#008f68]/45 to-transparent"
              aria-hidden
            />
            <DialogClose className="absolute right-3 top-3 z-30 flex size-7 items-center justify-center rounded-lg text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#008f68]/25 dark:text-neutral-400 dark:hover:bg-neutral-900 dark:hover:text-neutral-200">
              <X className="size-4" aria-hidden />
              <span className="sr-only">Close</span>
            </DialogClose>

            <DialogHeader className="space-y-0 px-4 pb-2 pt-2.5 pr-12 text-left sm:px-5 sm:pr-14">
              <div className="flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
                <div className="flex min-w-0 items-center gap-2.5">
                  <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-[#f0faf5] text-[#008f68] ring-1 ring-[#008f68]/15 dark:bg-emerald-500/10 dark:text-emerald-400">
                    <ClipboardList className="size-3.5" aria-hidden />
                  </span>
                  <div className="min-w-0">
                    <DialogTitle className="text-[15px] font-semibold leading-tight text-slate-900 dark:text-neutral-100">
                      Record Directory
                    </DialogTitle>
                    <DialogDescription className="mt-0.5 truncate text-xs leading-4 text-slate-500 dark:text-neutral-400">
                      Unified calls, tickets, and manual records for{" "}
                      <span className="font-semibold text-slate-800 dark:text-neutral-100">
                        {yardName}
                      </span>
                    </DialogDescription>
                  </div>
                </div>

                <div className="flex min-w-0 flex-wrap items-center gap-1.5 lg:justify-end">
                  <YardContextChip label="Range" value={periodLabel} />
                  {counts.linkedTickets > 0 ? (
                    <YardContextChip
                      label="Linked"
                      value={`${counts.linkedTickets} tickets on calls`}
                    />
                  ) : null}
                  <span className="inline-flex h-7 items-center gap-1.5 rounded-lg border border-slate-200/80 bg-slate-50 px-2.5 text-[11px] font-semibold text-slate-700 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-200">
                    <Layers className="size-3.5 text-slate-400" aria-hidden />
                    {recordTabs.length} types
                  </span>
                  <YardStatusBadge
                    label={
                      loading
                        ? "Loading"
                        : error
                    ? "Error"
                    : `${visibleTotal} records`
                    }
                    tone={loading ? "loading" : error ? "muted" : "ready"}
                  />
                  {lastLoadedAt ? (
                    <span className="inline-flex h-7 items-center rounded-lg border border-slate-200/70 bg-slate-100 px-2.5 font-mono text-[11px] font-medium text-slate-500 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-400">
                      {lastLoadedAt}
                    </span>
                  ) : null}
                </div>
              </div>
            </DialogHeader>

            <div className="flex flex-col gap-2 border-t border-slate-200/80 bg-[#f4f5f7] px-4 py-2 dark:border-neutral-800 dark:bg-neutral-950 sm:px-5">
              {/* Row 1 — Search + Segmented tabs */}
              <div className="flex flex-col gap-2 lg:flex-row lg:items-center">
                <div
                  className={cn(
                    "relative w-full transition-[width] duration-200 lg:max-w-[360px] lg:shrink-0",
                    isSearchFocused && "lg:max-w-[420px]",
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
                    className="h-8 rounded-lg border-slate-200/80 bg-white pl-8 pr-8 text-xs shadow-sm hover:border-slate-300 focus:border-[#008f68] focus:bg-white focus:ring-2 focus:ring-[#008f68]/20 dark:border-neutral-800 dark:bg-neutral-900 dark:hover:border-neutral-700"
                  />
                  {search ? (
                    <button
                      type="button"
                      className="absolute right-1 top-1/2 flex size-6 -translate-y-1/2 items-center justify-center rounded-md text-slate-500 hover:bg-slate-100 dark:hover:bg-neutral-800"
                      aria-label="Clear search"
                      onClick={() => setSearch("")}
                    >
                      <X className="size-3.5" />
                    </button>
                  ) : null}
                </div>
                <div className="relative min-w-0 lg:flex-1">
                  <div
                    className="pointer-events-none absolute inset-y-0 left-0 z-10 w-6 bg-gradient-to-r from-[#f4f5f7] to-transparent dark:from-neutral-950"
                    aria-hidden
                  />
                  <div
                    className="pointer-events-none absolute inset-y-0 right-0 z-10 w-6 bg-gradient-to-l from-[#f4f5f7] to-transparent dark:from-neutral-950"
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

              {/* Row 2.0 — Inherited yard-dashboard filters */}
              {inheritedActiveCount > 0 ? (
                <div className="flex min-w-0 flex-wrap items-center gap-1.5 rounded-lg border border-[#008f68]/25 bg-[#f0faf5]/70 px-2 py-1.5 dark:border-emerald-400/25 dark:bg-emerald-500/5">
                  <span className="inline-flex items-center gap-1.5 text-[10.5px] font-bold uppercase tracking-wider text-[#006b4f] dark:text-emerald-300">
                    <svg
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth={2}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="size-3.5"
                      aria-hidden
                    >
                      <path d="M22 12c0 5.523-4.477 10-10 10S2 17.523 2 12 6.477 2 12 2s10 4.477 10 10z" />
                      <path d="M9 12l2 2 4-4" />
                    </svg>
                    From yard report
                  </span>
                  <span
                    className="hidden h-4 w-px bg-[#008f68]/25 dark:bg-emerald-400/25 sm:inline-block"
                    aria-hidden
                  />
                  <div className="flex min-w-0 flex-wrap items-center gap-1.5">
                    {inheritedActive.map(([key, value]) => (
                      <span
                        key={key}
                        className="inline-flex items-center gap-1 rounded-full border border-[#008f68]/30 bg-white px-2 py-0.5 text-[11px] font-semibold text-[#006b4f] shadow-[0_1px_1px_rgba(15,23,42,0.04)] dark:border-emerald-400/35 dark:bg-neutral-950/40 dark:text-emerald-300"
                      >
                        <span className="text-[9.5px] font-bold uppercase tracking-wider text-[#008f68]/70 dark:text-emerald-300/80">
                          {yardFilterLabel(key)}
                        </span>
                        <span className="max-w-[160px] truncate">{value}</span>
                        <button
                          type="button"
                          onClick={() => clearInheritedFilter(key)}
                          aria-label={`Remove ${yardFilterLabel(key)} filter`}
                          className="ml-0.5 inline-flex size-4 items-center justify-center rounded-full text-[#006b4f]/60 transition-colors hover:bg-[#008f68]/10 hover:text-[#006b4f] dark:text-emerald-300/60 dark:hover:bg-emerald-400/15 dark:hover:text-emerald-200"
                        >
                          <X className="size-2.5" aria-hidden />
                        </button>
                      </span>
                    ))}
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      setAppliedYardFilters(emptyYardDashboardFilters())
                    }
                    className="ml-auto inline-flex items-center gap-1 rounded-md border border-[#008f68]/25 bg-white/80 px-2 py-0.5 text-[10.5px] font-semibold text-[#006b4f] transition-colors hover:bg-[#f0faf5] dark:border-emerald-400/25 dark:bg-neutral-950/40 dark:text-emerald-300 dark:hover:bg-emerald-500/10"
                  >
                    Drop yard filters
                  </button>
                </div>
              ) : null}

              {/* Row 2 — Filters toolbar (filters expand to fill the row) */}
              <div className="flex min-w-0 flex-col gap-1.5 rounded-lg border border-slate-200/70 bg-white/80 px-2 py-1.5 shadow-[0_1px_2px_rgba(15,23,42,0.04)] dark:border-neutral-800 dark:bg-neutral-900/60 sm:flex-row sm:items-center sm:gap-2">
                <div className="flex shrink-0 items-center gap-2">
                  <span className="inline-flex items-center gap-1.5 pl-1 text-[10.5px] font-bold uppercase tracking-wider text-slate-500 dark:text-neutral-400">
                    <SlidersHorizontal
                      className="size-3.5 text-slate-400"
                      aria-hidden
                    />
                    Filters
                  </span>
                  <span
                    className="hidden h-4 w-px bg-slate-200 dark:bg-neutral-700 sm:inline-block"
                    aria-hidden
                  />
                </div>
                <div className="grid min-w-0 flex-1 grid-cols-2 gap-1.5 lg:grid-cols-4">
                  <DirectoryFilterSelect
                    ariaLabel="Filter by status"
                    value={recordFilters.status}
                    onValueChange={(value) =>
                      setRecordFilters((current) => ({
                        ...current,
                        status: value,
                      }))
                    }
                    options={recordFilterOptions.status}
                    active={recordFilters.status !== "all"}
                    triggerClassName="w-full max-w-none"
                  />
                  <DirectoryFilterSelect
                    ariaLabel="Filter by disposition"
                    value={recordFilters.disposition}
                    onValueChange={(value) =>
                      setRecordFilters((current) => ({
                        ...current,
                        disposition: value,
                      }))
                    }
                    options={recordFilterOptions.disposition}
                    active={recordFilters.disposition !== "all"}
                    triggerClassName="w-full max-w-none"
                  />
                  <DirectoryFilterSelect
                    ariaLabel="Filter by direction"
                    value={recordFilters.direction}
                    onValueChange={(value) =>
                      setRecordFilters((current) => ({
                        ...current,
                        direction: value,
                      }))
                    }
                    options={recordFilterOptions.direction}
                    active={recordFilters.direction !== "all"}
                    triggerClassName="w-full max-w-none"
                  />
                  <DirectoryFilterSelect
                    ariaLabel="Filter by priority"
                    value={recordFilters.priority}
                    onValueChange={(value) =>
                      setRecordFilters((current) => ({
                        ...current,
                        priority: value,
                      }))
                    }
                    options={recordFilterOptions.priority}
                    active={recordFilters.priority !== "all"}
                    triggerClassName="w-full max-w-none"
                  />
                </div>
                <div className="flex shrink-0 items-center justify-end gap-2 sm:ml-1">
                  <span
                    className={cn(
                      "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10.5px] font-semibold ring-1 transition-colors",
                      totalActiveFilters > 0
                        ? "bg-[#f0faf5] text-[#008f68] ring-[#008f68]/15 dark:bg-emerald-500/10 dark:text-emerald-400 dark:ring-emerald-400/30"
                        : "bg-slate-50 text-slate-400 ring-slate-200/70 dark:bg-neutral-800/60 dark:text-neutral-500 dark:ring-neutral-700",
                    )}
                  >
                    <span
                      className={cn(
                        "size-1.5 rounded-full",
                        totalActiveFilters > 0
                          ? "bg-[#008f68] dark:bg-emerald-400"
                          : "bg-slate-300 dark:bg-neutral-600",
                      )}
                    />
                    {totalActiveFilters > 0
                      ? `${totalActiveFilters} active`
                      : "No filters"}
                  </span>
                  {totalActiveFilters > 0 ? (
                    <button
                      type="button"
                      onClick={clearRecordFilters}
                      className="inline-flex items-center gap-1 rounded-md border border-slate-200/80 bg-white px-2 py-1 text-[11px] font-medium text-slate-500 transition-colors hover:border-slate-300 hover:bg-slate-50 hover:text-slate-700 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-400 dark:hover:bg-neutral-800"
                    >
                      <X className="size-3" aria-hidden />
                      Clear all
                    </button>
                  ) : null}
                </div>
              </div>
            </div>
          </div>

          <div className="min-h-0 flex-1 px-3 py-3 dark:bg-neutral-950 sm:px-4">
            <div
              className={cn(
                dashboardPanelClass,
                "flex h-full min-h-0 flex-col overflow-hidden",
              )}
            >
              <ScrollArea className="h-full flex-1 scrollbar-app-hover [&>[data-radix-scroll-area-viewport]]:max-h-full">
                {loading ? (
                  <div
                    className={cn(
                      "flex min-h-[360px] items-center justify-center py-10",
                      "bg-gradient-to-b from-[#f0faf5]/50 via-white to-white",
                      "dark:from-[#008f68]/5 dark:via-neutral-950 dark:to-neutral-950",
                    )}
                  >
                    <EntityLoadingSpinner
                      kind={recordTabLoadingKind(activeTab)}
                      size="md"
                      label={`Loading ${activeTabLabel.toLowerCase()} · page ${page} of ${Math.max(totalPages, 1)}`}
                    />
                  </div>
                ) : error ? (
                  <div className="flex min-h-[360px] flex-col items-center justify-center px-6 py-10 text-center">
                    <div className="mb-4 rounded-xl bg-rose-50 p-4 text-rose-600 ring-8 ring-rose-50/80 dark:bg-rose-500/10 dark:text-rose-400 dark:ring-rose-500/5">
                      <XCircle className="size-10" aria-hidden />
                    </div>
                    <p className="text-[15px] font-semibold text-slate-900 dark:text-neutral-100">
                      Records could not be loaded
                    </p>
                    <p className="mt-1 max-w-[360px] text-xs text-slate-500 dark:text-neutral-400">
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
                ) : visibleRecords.length === 0 ? (
                  <RecordsEmptyState
                    icon={search || activeFilterCount > 0 ? Search : Inbox}
                    title={
                      search || activeFilterCount > 0
                        ? "No matching records"
                        : "No records found"
                    }
                    description={
                      search || activeFilterCount > 0
                        ? "Try another search term or clear the filter."
                        : `No ${activeTabLabel.toLowerCase()} records in this date range.`
                    }
                  />
                ) : (
                  <div className="p-2">
                    <UnifiedRecordsList
                      records={visibleRecords}
                      recordKind={activeTab}
                      className="rounded-xl border-0 shadow-none"
                      onViewDetail={(body, title) => setDetail({ body, title })}
                    />
                  </div>
                )}
              </ScrollArea>
            </div>
          </div>

          <DialogFooter className="shrink-0 border-t border-slate-200/80 bg-white px-4 py-3 dark:border-neutral-800 dark:bg-neutral-950 sm:px-5">
            <div className="flex w-full flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-xs text-slate-500 dark:text-neutral-400">
                <span className="font-semibold text-slate-800 dark:text-neutral-100">
                  {visibleTotal}
                </span>{" "}
                record{total === 1 ? "" : "s"} in{" "}
                <span className="font-semibold text-slate-800 dark:text-neutral-100">
                  {activeTabLabel}
                </span>
                {search || activeFilterCount > 0
                  ? " matching current filters"
                  : null}
                <span className="mx-1.5 text-slate-300 dark:text-neutral-700">
                  |
                </span>
                Page{" "}
                <span className="font-semibold text-slate-800 dark:text-neutral-100">
                  {page}
                </span>{" "}
                of{" "}
                <span className="font-semibold text-slate-800 dark:text-neutral-100">
                  {Math.max(totalPages, 1)}
                </span>
              </p>
              <div className="flex flex-wrap items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-8 rounded-lg border-slate-200 bg-white text-xs shadow-sm dark:border-neutral-800 dark:bg-neutral-950"
                  disabled={loading || page <= 1}
                  onClick={() => setPage((current) => Math.max(1, current - 1))}
                >
                  Prev
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-8 rounded-lg border-slate-200 bg-white text-xs shadow-sm dark:border-neutral-800 dark:bg-neutral-950"
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
        <DialogContent className="max-h-[82dvh] overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-0 shadow-2xl sm:max-w-[min(92vw,560px)] dark:border-neutral-800 dark:bg-neutral-950">
          <DialogHeader className="border-b border-slate-200/80 px-4 py-3 dark:border-neutral-800">
            <DialogTitle className="flex items-center gap-2 text-[15px] font-semibold text-slate-900 dark:text-neutral-100">
              <FileText className="size-4 text-[#008f68] dark:text-emerald-400" />
              Record detail
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              {detail?.title}
            </DialogDescription>
          </DialogHeader>
          <ScrollArea className="max-h-[58dvh] bg-[#f4f5f7] scrollbar-app dark:bg-neutral-950">
            <div className="p-3">
              {detail?.body?.trim() ? (
                <div className="rounded-xl border border-slate-200/80 bg-white px-3 py-2.5 shadow-[0_1px_3px_rgba(0,0,0,0.06)] dark:border-neutral-800 dark:bg-neutral-950">
                  <p className="whitespace-pre-wrap break-words text-xs leading-5 text-slate-700 dark:text-neutral-300">
                    {detail.body.trim()}
                  </p>
                </div>
              ) : (
                <div className="rounded-xl border border-dashed border-slate-200/80 bg-white/80 px-4 py-6 text-center text-xs text-slate-500 dark:border-neutral-800 dark:bg-neutral-950/80">
                  No detail available for this record.
                </div>
              )}
            </div>
          </ScrollArea>
          <DialogFooter className="border-t border-slate-200/80 bg-slate-50/80 px-4 py-2.5 dark:border-neutral-800 dark:bg-neutral-900/40">
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
