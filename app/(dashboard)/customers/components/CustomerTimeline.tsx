"use client";

import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import {
  format,
  formatDistanceToNow,
  isToday,
  isYesterday,
} from "date-fns";
import { useRouter } from "next/navigation";
import {
  Clock3,
  FileText,
  Loader2,
  MapPin,
  MessageSquare,
  PhoneIncoming,
  PhoneMissed,
  PhoneOutgoing,
  RefreshCw,
  ClipboardList,
  StickyNote,
  Tag,
  Ticket,
  UserRound,
  Voicemail,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { CallRecordingPlayer } from "@/app/(dashboard)/calls/components/calls/CallRecordingPlayer";
import { fetchFromBackend } from "@/lib/api-client";
import { cn } from "@/lib/utils";
import type {
  CampaignOption,
  PhoneLineOption,
  TimelineEntry,
  TimelineEntryTypeFilter,
  TimelineFilters,
  YardOption,
} from "../types";

export const DEFAULT_TIMELINE_FILTERS: TimelineFilters = {
  entryType: "all",
  lineId: "all",
  yardId: "all",
  campaignId: "all",
  disposition: "all",
};

const ENTRY_TYPE_OPTIONS: {
  value: TimelineEntryTypeFilter;
  label: string;
}[] = [
  { value: "all", label: "All" },
  { value: "call", label: "Calls" },
  { value: "ticket", label: "Tickets" },
  { value: "manual_record", label: "Manual records" },
  { value: "customer_note", label: "Notes" },
];

const CALL_DISPOSITIONS = [
  "RESOLVED",
  "CALLBACK_REQUIRED",
  "CALLBACK_SCHEDULED",
  "VOICEMAIL_LEFT",
  "NO_ANSWER",
  "PROMISE_TO_PAY",
  "DISPUTE",
  "WRONG_NUMBER",
  "ENROLLED",
  "ESCALATED",
];

export function hasActiveTimelineFilters(filters: TimelineFilters) {
  return (
    filters.entryType !== "all" ||
    filters.lineId !== "all" ||
    filters.yardId !== "all" ||
    filters.campaignId !== "all" ||
    filters.disposition !== "all"
  );
}

function EntryTypeFilter({
  value,
  onChange,
}: {
  value: TimelineEntryTypeFilter;
  onChange: (value: TimelineEntryTypeFilter) => void;
}) {
  return (
    <div
      className="flex w-full justify-center"
      role="tablist"
      aria-label="Activity type"
    >
      <div className="flex w-full flex-wrap justify-center gap-1 rounded-xl bg-slate-100/90 p-1 dark:bg-slate-900/70">
        {ENTRY_TYPE_OPTIONS.map((option) => {
          const active = value === option.value;
          return (
            <button
              key={option.value}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => onChange(option.value)}
              className={cn(
                "min-h-10 min-w-[4.75rem] flex-1 rounded-lg px-3 py-2.5 text-center text-[13px] font-semibold leading-tight transition-colors sm:min-w-[5.5rem] sm:text-sm",
                active
                  ? "bg-[#008f68] text-white shadow-sm"
                  : "text-slate-600 hover:bg-white/80 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white",
              )}
            >
              {option.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export interface CustomerTimelineToolbarProps {
  filters: TimelineFilters;
  onFiltersChange: (filters: TimelineFilters) => void;
  total: number;
  lastEventAgo: string | null;
  loading: boolean;
  onRefresh: () => void;
  variant?: "panel" | "inline";
}

function FilterField({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <div className="flex min-w-0 flex-col gap-1">
      <span className="px-1 text-[9px] font-bold uppercase tracking-[0.12em] text-slate-400">
        {label}
      </span>
      {children}
    </div>
  );
}

function FilterSelect({
  value,
  onValueChange,
  placeholder,
  children,
}: {
  value: string;
  onValueChange: (value: string) => void;
  placeholder: string;
  children: ReactNode;
}) {
  return (
    <Select value={value} onValueChange={onValueChange}>
      <SelectTrigger className="h-9 w-full min-w-0 rounded-xl border-border bg-background px-3 text-[13px] font-medium shadow-sm shadow-slate-200/40 focus:ring-[#008f68]/20 dark:shadow-none">
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>{children}</SelectContent>
    </Select>
  );
}

export function CustomerTimelineToolbar({
  filters,
  onFiltersChange,
  total,
  lastEventAgo,
  loading,
  onRefresh,
  variant = "inline",
}: CustomerTimelineToolbarProps) {
  const [phoneLines, setPhoneLines] = useState<PhoneLineOption[]>([]);
  const [yards, setYards] = useState<YardOption[]>([]);
  const [campaigns, setCampaigns] = useState<CampaignOption[]>([]);
  const isPanel = variant === "panel";
  const activeFilters = hasActiveTimelineFilters(filters);

  useEffect(() => {
    let cancelled = false;
    Promise.all([
      fetchFromBackend("/phone-lines").catch(() => []),
      fetchFromBackend("/yards?page=1&limit=200").catch(() => []),
      fetchFromBackend("/campaign?page=1&limit=200").catch(() => []),
    ]).then(([linesData, yardsData, campaignsData]) => {
      if (cancelled) return;
      setPhoneLines(normalizeArray<PhoneLineOption>(linesData));
      setYards(normalizeArray<YardOption>(yardsData));
      setCampaigns(normalizeArray<CampaignOption>(campaignsData));
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const updateFilter = <K extends keyof TimelineFilters>(
    key: K,
    value: TimelineFilters[K],
  ) => {
    onFiltersChange({ ...filters, [key]: value });
  };

  const resetFilters = () => onFiltersChange(DEFAULT_TIMELINE_FILTERS);

  const showLineFilter =
    filters.entryType === "all" || filters.entryType === "call";
  const showDispositionFilter =
    showLineFilter || filters.entryType === "manual_record";

  const filterGrid = (
    <div className="grid w-full grid-cols-1 gap-2 sm:grid-cols-2 xl:grid-cols-4">
      {showDispositionFilter ? (
        <FilterField label="Disposition">
          <FilterSelect
            value={filters.disposition}
            onValueChange={(value) => updateFilter("disposition", value)}
            placeholder="Disposition"
          >
            <SelectItem value="all">Any disposition</SelectItem>
            {CALL_DISPOSITIONS.map((disposition) => (
              <SelectItem key={disposition} value={disposition}>
                {formatLabel(disposition)}
              </SelectItem>
            ))}
          </FilterSelect>
        </FilterField>
      ) : null}

      {showLineFilter ? (
        <FilterField label="Line">
          <FilterSelect
            value={filters.lineId}
            onValueChange={(value) => updateFilter("lineId", value)}
            placeholder="Line"
          >
            <SelectItem value="all">All lines</SelectItem>
            {phoneLines.map((line) => (
              <SelectItem key={line.id} value={String(line.id)}>
                {line.label || line.phoneNumber}
              </SelectItem>
            ))}
          </FilterSelect>
        </FilterField>
      ) : null}

      <FilterField label="Yard">
        <FilterSelect
          value={filters.yardId}
          onValueChange={(value) => updateFilter("yardId", value)}
          placeholder="Yard"
        >
          <SelectItem value="all">All yards</SelectItem>
          {yards.map((yard) => (
            <SelectItem key={yard.id} value={String(yard.id)}>
              {yard.name}
            </SelectItem>
          ))}
        </FilterSelect>
      </FilterField>

      <FilterField label="Campaign">
        <FilterSelect
          value={filters.campaignId}
          onValueChange={(value) => updateFilter("campaignId", value)}
          placeholder="Campaign"
        >
          <SelectItem value="all">All campaigns</SelectItem>
          {campaigns.map((campaign) => (
            <SelectItem key={campaign.id} value={String(campaign.id)}>
              {campaign.nombre}
            </SelectItem>
          ))}
        </FilterSelect>
      </FilterField>
    </div>
  );

  const filtersBox = (
    <div className="flex flex-col gap-2 rounded-xl border border-slate-200/70 bg-slate-50/70 p-2 dark:border-slate-800 dark:bg-slate-950/40">
      <div className="flex flex-col items-center gap-1.5">
        <span className="text-[10px] font-bold uppercase tracking-[0.12em] text-slate-400">
          Show
        </span>
        <EntryTypeFilter
          value={filters.entryType}
          onChange={(value) => updateFilter("entryType", value)}
        />
      </div>
      {filterGrid}
      {activeFilters ? (
        <div className="flex justify-end">
          <button
            type="button"
            onClick={resetFilters}
            className="text-[11px] font-semibold text-slate-400 transition-colors hover:text-[#008f68]"
          >
            Clear filters
          </button>
        </div>
      ) : null}
    </div>
  );

  if (isPanel) {
    return (
      <div className="shrink-0 border-b border-slate-200/60 bg-white/90 px-3 py-2 sm:px-4 dark:border-slate-800 dark:bg-slate-900/40">
        {filtersBox}
      </div>
    );
  }

  return (
    <div className="mb-4 flex flex-col gap-2">
      <div className="flex items-center justify-between gap-2">
        <div className="min-w-0 text-[13px] text-slate-500">
          <span className="font-semibold tabular-nums text-slate-700 dark:text-slate-300">
            {loading && total === 0 ? "…" : total}
          </span>{" "}
          events
          {lastEventAgo ? (
            <span className="text-slate-400"> · {lastEventAgo}</span>
          ) : null}
        </div>
        <button
          type="button"
          onClick={onRefresh}
          disabled={loading}
          aria-label="Refresh timeline"
          className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-500 transition-colors hover:bg-slate-50 disabled:opacity-50 dark:border-slate-700 dark:hover:bg-slate-800"
        >
          <RefreshCw
            className={cn("h-4 w-4", loading && "animate-spin")}
          />
        </button>
      </div>

      {filtersBox}

      {activeFilters ? (
        <button
          type="button"
          onClick={resetFilters}
          className="text-[11px] font-medium text-slate-400 underline-offset-4 hover:text-[#008f68] hover:underline"
        >
          Clear filters
        </button>
      ) : null}
    </div>
  );
}

function normalizeArray<T>(data: unknown): T[] {
  if (Array.isArray(data)) return data as T[];
  const wrapped = data as { data?: unknown };
  if (Array.isArray(wrapped?.data)) return wrapped.data as T[];
  if (
    wrapped?.data &&
    typeof wrapped.data === "object" &&
    Array.isArray((wrapped.data as { data?: unknown }).data)
  ) {
    return (wrapped.data as { data: T[] }).data;
  }
  return [];
}

function formatShortDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  if (isToday(date)) return `Today ${format(date, "HH:mm")}`;
  if (isYesterday(date)) return `Yesterday ${format(date, "HH:mm")}`;
  return format(date, "MMM d, HH:mm");
}

function formatDuration(seconds?: number) {
  if (!seconds || seconds <= 0) return null;
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

function formatLabel(value?: string | null) {
  if (!value) return "";
  return value
    .replace(/_/g, " ")
    .toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function callMeta(entry: TimelineEntry) {
  const d = (entry.direction || "").toUpperCase();
  if (d === "OUTBOUND") {
    return {
      label: "Outbound",
      color: "text-blue-600",
      ring: "border-blue-500",
      Icon: PhoneOutgoing,
    };
  }
  if (d === "MISSED") {
    return {
      label: "Missed",
      color: "text-rose-600",
      ring: "border-rose-500",
      Icon: PhoneMissed,
    };
  }
  if (d === "VOICEMAIL") {
    return {
      label: "Voicemail",
      color: "text-amber-600",
      ring: "border-amber-500",
      Icon: Voicemail,
    };
  }
  return {
    label: "Inbound",
    color: "text-emerald-600",
    ring: "border-emerald-500",
    Icon: PhoneIncoming,
  };
}

function ticketStatusRing(status?: string) {
  const key = (status || "").toUpperCase();
  if (key === "OVERDUE") return "border-red-500";
  if (key === "PENDING_FOLLOWUP") return "border-amber-500";
  if (key === "RESOLVED" || key === "CLOSED") return "border-slate-400";
  if (key === "IN_PROGRESS" || key === "OPEN") return "border-green-500";
  return "border-blue-500";
}

function ticketStatusBadge(status?: string) {
  const key = (status || "").toUpperCase();
  if (key === "OVERDUE")
    return "bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300";
  if (key === "PENDING_FOLLOWUP")
    return "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300";
  if (key === "RESOLVED" || key === "CLOSED")
    return "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300";
  return "bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-300";
}

function ticketPriorityBadge(priority?: string) {
  const key = (priority || "").toUpperCase();
  if (key === "EMERGENCY")
    return "bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300";
  if (key === "HIGH")
    return "bg-orange-100 text-orange-800 dark:bg-orange-950 dark:text-orange-300";
  if (key === "LOW")
    return "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300";
  return "bg-yellow-100 text-yellow-800 dark:bg-yellow-950 dark:text-yellow-300";
}

function hasContent(value?: string | null): value is string {
  return Boolean(value?.trim());
}

function formatOptionalDate(value?: string | null) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return format(date, "MMM d, HH:mm");
}

function joinDetailValues(values: Array<string | null | undefined>) {
  return values.filter(hasContent).join(" / ");
}

type DetailItem = {
  label: string;
  value?: string | null;
  icon?: ReactNode;
  tone?: "default" | "green" | "blue" | "amber" | "red";
  mono?: boolean;
};

function DetailPills({ items }: { items: DetailItem[] }) {
  const visibleItems = items.filter((item) => hasContent(item.value));
  if (visibleItems.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-1.5">
      {visibleItems.map((item) => (
        <span
          key={`${item.label}-${item.value}`}
          className={cn(
            "inline-flex min-h-7 max-w-full items-center gap-1.5 rounded-lg border px-2 py-1 text-[11px] font-semibold leading-none",
            item.mono && "font-mono tabular-nums",
            item.tone === "green"
              ? "border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950/30 dark:text-emerald-300"
              : item.tone === "blue"
                ? "border-blue-200 bg-blue-50 text-blue-800 dark:border-blue-900 dark:bg-blue-950/30 dark:text-blue-300"
                : item.tone === "amber"
                  ? "border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-300"
                  : item.tone === "red"
                    ? "border-red-200 bg-red-50 text-red-800 dark:border-red-900 dark:bg-red-950/30 dark:text-red-300"
                    : "border-slate-200 bg-slate-50 text-slate-600 dark:border-slate-800 dark:bg-slate-900/60 dark:text-slate-300",
          )}
          title={`${item.label}: ${item.value}`}
        >
          {item.icon ? (
            <span className="shrink-0 text-current opacity-70">{item.icon}</span>
          ) : null}
          <span className="text-[9px] uppercase tracking-[0.08em] opacity-60">
            {item.label}
          </span>
          <span className="truncate">{item.value}</span>
        </span>
      ))}
    </div>
  );
}

function NotePreview({
  label,
  value,
  tone = "slate",
}: {
  label: string;
  value?: string | null;
  tone?: "slate" | "amber";
}) {
  if (!hasContent(value)) return null;

  return (
    <div
      className={cn(
        "rounded-lg border px-2.5 py-2",
        tone === "amber"
          ? "border-amber-200 bg-amber-50/70 text-amber-950 dark:border-amber-900/60 dark:bg-amber-950/20 dark:text-amber-100"
          : "border-slate-200 bg-slate-50/80 text-slate-700 dark:border-slate-800 dark:bg-slate-900/50 dark:text-slate-200",
      )}
    >
      <div className="mb-1 flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.12em] text-slate-400">
        <FileText className="h-3 w-3" />
        {label}
      </div>
      <p className="whitespace-pre-wrap text-[12px] leading-relaxed [overflow-wrap:anywhere]">
        {value.trim()}
      </p>
    </div>
  );
}

function TimelineAction({
  children,
  onClick,
  muted,
}: {
  children: ReactNode;
  onClick: () => void;
  muted?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "inline-flex h-8 items-center justify-center rounded-lg px-2.5 text-[12px] font-bold transition-colors",
        muted
          ? "bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300"
          : "bg-[#e8f8f1] text-[#008f68] hover:bg-[#d8f4e8] dark:bg-emerald-950/40 dark:text-emerald-300",
      )}
    >
      {children}
    </button>
  );
}

export interface CustomerTimelineMeta {
  total: number;
  lastEventAgo: string | null;
  loading: boolean;
}

interface CustomerTimelineProps {
  customerId: number;
  canPlayRecordings: boolean;
  refreshKey?: number;
  compact?: boolean;
  expanded?: boolean;
  hideToolbar?: boolean;
  filters?: TimelineFilters;
  onFiltersChange?: (filters: TimelineFilters) => void;
  onMetaChange?: (meta: CustomerTimelineMeta) => void;
  onNavigate?: () => void;
  onViewCall?: (callId: number) => void;
  onViewTicket?: (ticketId: number) => void;
}

export function CustomerTimeline({
  customerId,
  canPlayRecordings,
  refreshKey = 0,
  compact = false,
  expanded = false,
  hideToolbar = false,
  filters: controlledFilters,
  onFiltersChange,
  onMetaChange,
  onNavigate,
  onViewCall,
  onViewTicket,
}: CustomerTimelineProps) {
  const isCompact = compact && !expanded;
  const isPanelEmbed = hideToolbar && expanded;
  const router = useRouter();
  const [internalFilters, setInternalFilters] = useState<TimelineFilters>(
    DEFAULT_TIMELINE_FILTERS,
  );
  const filters = controlledFilters ?? internalFilters;
  const applyFilters = useCallback(
    (next: TimelineFilters) => {
      if (onFiltersChange) onFiltersChange(next);
      else setInternalFilters(next);
    },
    [onFiltersChange],
  );
  const [entries, setEntries] = useState<TimelineEntry[]>([]);
  const [total, setTotal] = useState(0);
  const [nextCursor, setNextCursor] = useState<string | undefined>();
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadTimeline = useCallback(
    async (cursor?: string) => {
      const isLoadMore = Boolean(cursor);
      if (isLoadMore) setLoadingMore(true);
      else setLoading(true);
      setError(null);

      try {
        const params = new URLSearchParams({ limit: "25", sort: "desc" });
        if (filters.entryType !== "all") {
          params.set("type", filters.entryType);
        }
        if (filters.lineId !== "all") params.set("lineId", filters.lineId);
        if (filters.yardId !== "all") params.set("yardId", filters.yardId);
        if (filters.campaignId !== "all") {
          params.set("campaignId", filters.campaignId);
        }
        if (filters.disposition !== "all") {
          params.set("disposition", filters.disposition);
        }
        if (cursor) params.set("cursor", cursor);

        const data = await fetchFromBackend(
          `/customers/${customerId}/timeline?${params.toString()}`,
        );
        const payload = data as {
          entries?: TimelineEntry[];
          total?: number;
          nextCursor?: string;
        };

        setEntries((prev) =>
          isLoadMore
            ? [...prev, ...(payload.entries ?? [])]
            : (payload.entries ?? []),
        );
        setTotal(payload.total ?? 0);
        setNextCursor(payload.nextCursor);
      } catch (err: unknown) {
        const message =
          err instanceof Error ? err.message : "Failed to load timeline";
        setError(message);
        if (!isLoadMore) setEntries([]);
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    [customerId, filters],
  );

  useEffect(() => {
    loadTimeline();
  }, [loadTimeline, refreshKey]);

  const navigateTo = (href: string) => {
    onNavigate?.();
    router.push(href);
  };

  const openCall = (callId: number) => {
    if (onViewCall) {
      onViewCall(callId);
      return;
    }
    navigateTo(`/calls?id=${callId}`);
  };

  const openTicket = (ticketId: number) => {
    if (onViewTicket) {
      onViewTicket(ticketId);
      return;
    }
    navigateTo(`/calls?tab=tickets&id=${ticketId}`);
  };

  const lastEventAgo = useMemo(() => {
    const first = entries[0];
    if (!first?.occurredAt) return null;
    const d = new Date(first.occurredAt);
    if (Number.isNaN(d.getTime())) return null;
    return formatDistanceToNow(d, { addSuffix: true });
  }, [entries]);

  useEffect(() => {
    onMetaChange?.({ total, lastEventAgo, loading });
  }, [total, lastEventAgo, loading, onMetaChange]);

  return (
    <div
      className={cn(
        isPanelEmbed
          ? "px-3 py-2.5 sm:px-4"
          : expanded
            ? "px-5 py-5"
            : isCompact
              ? "px-3 py-3"
              : "px-4 py-4 sm:px-5 sm:py-5",
      )}
    >
      {!hideToolbar ? (
        <CustomerTimelineToolbar
          filters={filters}
          onFiltersChange={applyFilters}
          total={total}
          lastEventAgo={lastEventAgo}
          loading={loading}
          onRefresh={() => loadTimeline()}
          variant="inline"
        />
      ) : null}

      {/* Timeline body — vertical rail like calls/tickets */}
      {loading && entries.length === 0 ? (
        <div className="space-y-4 py-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex gap-3 pl-7">
              <Skeleton className="h-4 w-4 shrink-0 rounded-full" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-3 w-32" />
                <Skeleton className="h-3 w-full" />
              </div>
            </div>
          ))}
        </div>
      ) : error ? (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-5 text-center text-sm text-red-700">
          <p>{error}</p>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="mt-3 bg-white"
            onClick={() => loadTimeline()}
          >
            Retry
          </Button>
        </div>
      ) : entries.length === 0 ? (
        <p className="py-8 text-center text-sm text-slate-500">No activity found.</p>
      ) : (
        <div className={cn(!expanded && "relative")}>
          {!expanded ? (
            <div
              className={cn(
                "absolute top-0 bottom-0 w-px bg-slate-200 dark:bg-slate-700",
                isCompact ? "left-[5px]" : "left-[9px]",
              )}
            />
          ) : null}
          <ol
            className={cn(
              isPanelEmbed
                ? "space-y-2.5"
                : expanded
                  ? "space-y-4"
                  : isCompact
                    ? "space-y-3"
                    : "space-y-4",
            )}
          >
            {entries.map((entry) => {
              const dateLabel = formatShortDate(entry.occurredAt);
              const duration = formatDuration(entry.duration);
              const agentName = entry.agentName || entry.assignedAgentName;
              const entryShell = isPanelEmbed
                ? "rounded-xl border border-slate-200/70 bg-white p-2.5 shadow-[0_6px_18px_rgba(15,23,42,0.06)] transition-colors hover:border-slate-300 dark:border-slate-800 dark:bg-slate-950 dark:hover:border-slate-700"
                : expanded
                  ? "rounded-xl border border-slate-200/80 bg-white p-3 shadow-sm dark:border-slate-800 dark:bg-slate-900/40"
                  : cn("relative", isCompact ? "pl-5" : "pl-7");

              if (entry.type === "call") {
                const meta = callMeta(entry);
                const Icon = meta.Icon;
                const hasRecording =
                  Boolean(entry.recordingUrl && entry.callId) &&
                  canPlayRecordings;

                return (
                  <li key={entry.id} className={entryShell}>
                    {expanded ? (
                      <div className="flex items-start gap-2.5">
                        <span
                          className={cn(
                            "flex shrink-0 items-center justify-center rounded-xl border bg-white shadow-sm dark:bg-slate-950",
                            isPanelEmbed
                              ? "h-8 w-8 border-slate-100"
                              : "h-9 w-9 border-2",
                            meta.ring,
                          )}
                        >
                          <Icon
                            className={cn(
                              isPanelEmbed ? "h-3.5 w-3.5" : "h-4 w-4",
                              meta.color,
                            )}
                          />
                        </span>
                        <div className="min-w-0 flex-1 space-y-2">
                          <div className="flex flex-wrap items-start justify-between gap-2">
                            <div className="min-w-0">
                              <div className="flex flex-wrap items-center gap-1.5">
                                <span
                                  className={cn(
                                    "font-bold",
                                    isPanelEmbed ? "text-[13px]" : "text-[14px]",
                                    meta.color,
                                  )}
                                >
                                  {meta.label} call
                                </span>
                                {entry.disposition ? (
                                  <Badge
                                    variant="secondary"
                                    className="h-5 rounded-md bg-slate-100 px-1.5 text-[10px] font-bold text-slate-700 dark:bg-slate-800 dark:text-slate-200"
                                  >
                                    {formatLabel(entry.disposition)}
                                  </Badge>
                                ) : null}
                                {entry.callStatus ? (
                                  <Badge
                                    variant="secondary"
                                    className="h-5 rounded-md bg-white px-1.5 text-[10px] font-bold text-slate-500 ring-1 ring-slate-200 dark:bg-slate-950 dark:ring-slate-800"
                                  >
                                    {formatLabel(entry.callStatus)}
                                  </Badge>
                                ) : null}
                              </div>
                              <p className="mt-0.5 text-[11px] font-semibold tabular-nums text-slate-500">
                                {dateLabel}
                              </p>
                            </div>
                            {duration ? (
                              <span className="rounded-md bg-slate-100 px-2 py-1 font-mono text-[11px] font-bold tabular-nums text-slate-600 ring-1 ring-slate-200 dark:bg-slate-900 dark:ring-slate-800">
                                {duration}
                              </span>
                            ) : null}
                          </div>
                          <DetailPills
                            items={[
                              {
                                label: "Agent",
                                value: agentName,
                                icon: <UserRound className="h-3 w-3" />,
                              },
                              {
                                label: "Line",
                                value: entry.phoneLineLabel,
                                icon: <PhoneOutgoing className="h-3 w-3" />,
                                tone: "blue",
                              },
                              {
                                label: "Yard",
                                value: entry.yardName,
                                icon: <MapPin className="h-3 w-3" />,
                                tone: "amber",
                              },
                              {
                                label: "Campaign",
                                value: joinDetailValues([
                                  entry.campaignName || entry.lastLineOrigin,
                                  formatLabel(entry.campaignOption),
                                ]),
                                icon: <Tag className="h-3 w-3" />,
                              },
                              {
                                label: "Reason",
                                value: entry.missedCallReason,
                                tone: "red",
                              },
                              {
                                label: "Started",
                                value: formatOptionalDate(entry.startedAt),
                                icon: <Clock3 className="h-3 w-3" />,
                                mono: true,
                              },
                              {
                                label: "Answered",
                                value: formatOptionalDate(entry.answeredAt),
                                mono: true,
                              },
                              {
                                label: "Ended",
                                value: formatOptionalDate(entry.endedAt),
                                mono: true,
                              },
                            ]}
                          />
                          <NotePreview label="Call notes" value={entry.callNotes} />
                          {hasRecording ? (
                            <CallRecordingPlayer
                              callId={entry.callId!}
                              durationSec={entry.duration}
                              variant="compact"
                            />
                          ) : null}
                          <div className="flex flex-wrap gap-2 pt-0.5">
                            {entry.callId ? (
                              <TimelineAction onClick={() => openCall(entry.callId!)}>
                                View call
                              </TimelineAction>
                            ) : null}
                            {entry.callId && !entry.hasTicket ? (
                              <TimelineAction
                                muted
                                onClick={() => openCall(entry.callId!)}
                              >
                                Create ticket
                              </TimelineAction>
                            ) : null}
                            {entry.ticketId ? (
                              <TimelineAction
                                muted
                                onClick={() => openTicket(entry.ticketId!)}
                              >
                                View ticket
                              </TimelineAction>
                            ) : null}
                          </div>
                        </div>
                      </div>
                    ) : (
                      <>
                        <span
                          className={cn(
                            "absolute left-0 top-0.5 flex items-center justify-center rounded-full border-2 bg-white dark:bg-slate-950",
                            isCompact ? "h-3 w-3" : "h-[18px] w-[18px]",
                            meta.ring,
                          )}
                        >
                          <Icon
                            className={cn(
                              isCompact ? "h-2 w-2" : "h-2.5 w-2.5",
                              meta.color,
                            )}
                          />
                        </span>
                        <div className="flex flex-wrap items-center gap-x-1.5 gap-y-0.5">
                          <span className="text-[11px] font-normal tabular-nums text-slate-500">
                            {dateLabel}
                          </span>
                          <span
                            className={cn(
                              isCompact ? "text-xs" : "text-sm",
                              "font-semibold",
                              meta.color,
                            )}
                          >
                            {meta.label}
                          </span>
                          {entry.disposition ? (
                            <>
                              <span className="select-none text-gray-300">·</span>
                              <span className="text-xs text-slate-600">
                                {formatLabel(entry.disposition)}
                              </span>
                            </>
                          ) : null}
                          {duration ? (
                            <span className="text-xs tabular-nums text-gray-400">
                              {duration}
                            </span>
                          ) : null}
                          {agentName ? (
                            <>
                              <span className="select-none text-gray-300">·</span>
                              <span className="text-xs text-gray-700 dark:text-slate-300">
                                {agentName}
                              </span>
                            </>
                          ) : null}
                          {entry.phoneLineLabel ? (
                            <>
                              <span className="select-none text-gray-300">·</span>
                              <span className="text-xs text-slate-500">
                                {entry.phoneLineLabel}
                              </span>
                            </>
                          ) : null}
                        </div>
                        {entry.yardName ? (
                          <p className="mt-0.5 text-[11px] font-medium text-orange-600/90">
                            {entry.yardName}
                          </p>
                        ) : null}
                        {entry.callNotes ? (
                          <p className="mt-1 line-clamp-2 text-xs leading-snug text-gray-600 dark:text-slate-400">
                            {entry.callNotes}
                          </p>
                        ) : null}
                        {entry.campaignName || entry.missedCallReason ? (
                          <p className="mt-1 text-[11px] text-slate-500">
                            {[entry.campaignName, entry.missedCallReason]
                              .filter(Boolean)
                              .join(" / ")}
                          </p>
                        ) : null}
                        <div className="mt-1.5 flex flex-wrap gap-2">
                          {entry.callId ? (
                            <button
                              type="button"
                              onClick={() =>
                                openCall(entry.callId!)
                              }
                              className="text-xs font-semibold text-[#008f68] hover:underline"
                            >
                              View call
                            </button>
                          ) : null}
                          {entry.callId && !entry.hasTicket ? (
                            <button
                              type="button"
                              onClick={() =>
                                openCall(entry.callId!)
                              }
                              className="text-xs font-semibold text-slate-500 hover:underline"
                            >
                              Create ticket
                            </button>
                          ) : null}
                        </div>
                      </>
                    )}
                  </li>
                );
              }

              if (entry.type === "ticket") {
                const ring = ticketStatusRing(entry.ticketStatus);
                return (
                  <li key={entry.id} className={entryShell}>
                    {expanded ? (
                      <div className="flex items-start gap-2.5">
                        <span
                          className={cn(
                            "flex shrink-0 items-center justify-center rounded-xl border bg-white shadow-sm dark:bg-slate-950",
                            isPanelEmbed ? "h-8 w-8" : "h-9 w-9 border-2",
                            ring,
                          )}
                        >
                          <Ticket
                            className={cn(
                              "text-blue-600",
                              isPanelEmbed ? "h-3.5 w-3.5" : "h-4 w-4",
                            )}
                          />
                        </span>
                        <div className="min-w-0 flex-1 space-y-2">
                          <div className="flex flex-wrap items-start justify-between gap-2">
                            <div className="min-w-0">
                              <div className="flex flex-wrap items-center gap-1.5">
                                {entry.ticketId ? (
                                  <button
                                    type="button"
                                    onClick={() => openTicket(entry.ticketId!)}
                                    className="font-mono text-[13px] font-bold text-[#008f68] hover:underline"
                                  >
                                    Ticket #{entry.ticketId}
                                  </button>
                                ) : (
                                  <span className="text-[13px] font-bold text-blue-700">
                                    Ticket
                                  </span>
                                )}
                                {entry.ticketStatus ? (
                                  <Badge
                                    variant="secondary"
                                    className={cn(
                                      "h-5 rounded-md px-1.5 text-[10px] font-bold",
                                      ticketStatusBadge(entry.ticketStatus),
                                    )}
                                  >
                                    {formatLabel(entry.ticketStatus)}
                                  </Badge>
                                ) : null}
                                {entry.ticketPriority ? (
                                  <Badge
                                    variant="secondary"
                                    className={cn(
                                      "h-5 rounded-md px-1.5 text-[10px] font-bold",
                                      ticketPriorityBadge(entry.ticketPriority),
                                    )}
                                  >
                                    {formatLabel(entry.ticketPriority)}
                                  </Badge>
                                ) : null}
                              </div>
                              <p className="mt-0.5 text-[11px] font-semibold tabular-nums text-slate-500">
                                {dateLabel}
                              </p>
                            </div>
                          </div>
                          <DetailPills
                            items={[
                              {
                                label: "Type",
                                value: formatLabel(entry.ticketType),
                                icon: <Ticket className="h-3 w-3" />,
                                tone: "blue",
                              },
                              {
                                label: "Agent",
                                value: agentName,
                                icon: <UserRound className="h-3 w-3" />,
                              },
                              {
                                label: "Line",
                                value: entry.phoneLineLabel,
                                icon: <PhoneOutgoing className="h-3 w-3" />,
                                tone: "blue",
                              },
                              {
                                label: "Yard",
                                value: entry.yardName,
                                icon: <MapPin className="h-3 w-3" />,
                                tone: "amber",
                              },
                              {
                                label: "Campaign",
                                value: joinDetailValues([
                                  entry.campaignName,
                                  formatLabel(entry.campaignOption),
                                ]),
                                icon: <Tag className="h-3 w-3" />,
                              },
                              {
                                label: "Follow-up",
                                value: formatOptionalDate(entry.followUpDueDate),
                                icon: <Clock3 className="h-3 w-3" />,
                                tone: "amber",
                                mono: true,
                              },
                              {
                                label: "Resolved",
                                value: formatOptionalDate(entry.resolvedAt),
                                tone: "green",
                                mono: true,
                              },
                              {
                                label: "Call",
                                value: entry.callId ? `#${entry.callId}` : "",
                                mono: true,
                              },
                            ]}
                          />
                          <NotePreview
                            label="Ticket notes"
                            value={entry.ticketNotes}
                            tone="amber"
                          />
                          <div className="flex flex-wrap gap-2 pt-0.5">
                            {entry.ticketId ? (
                              <TimelineAction
                                onClick={() => openTicket(entry.ticketId!)}
                              >
                                View ticket
                              </TimelineAction>
                            ) : null}
                            {entry.callId ? (
                              <TimelineAction
                                muted
                                onClick={() => openCall(entry.callId!)}
                              >
                                View call
                              </TimelineAction>
                            ) : null}
                          </div>
                        </div>
                      </div>
                    ) : (
                      <>
                    <span
                      className={cn(
                        "absolute left-0 top-1 flex items-center justify-center rounded-full border-2 bg-white dark:bg-slate-950",
                        isCompact ? "h-3 w-3" : "h-[18px] w-[18px]",
                        ring,
                      )}
                    >
                      <Ticket
                        className={cn(
                          "text-blue-600",
                          isCompact ? "h-2 w-2" : "h-2.5 w-2.5",
                        )}
                      />
                    </span>
                    <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                      <span className="font-mono text-xs text-muted-foreground">
                        {dateLabel}
                      </span>
                      {entry.ticketStatus ? (
                        <Badge
                          variant="secondary"
                          className={cn(
                            "h-5 px-1.5 text-[10px]",
                            ticketStatusBadge(entry.ticketStatus),
                          )}
                        >
                          {formatLabel(entry.ticketStatus)}
                        </Badge>
                      ) : null}
                      {entry.ticketPriority ? (
                        <Badge
                          variant="secondary"
                          className={cn(
                            "h-5 px-1.5 text-[10px]",
                            ticketPriorityBadge(entry.ticketPriority),
                          )}
                        >
                          {formatLabel(entry.ticketPriority)}
                        </Badge>
                      ) : null}
                      {entry.ticketType ? (
                        <>
                          <span className="text-muted-foreground">·</span>
                          <span className="text-xs text-foreground">
                            {formatLabel(entry.ticketType)}
                          </span>
                        </>
                      ) : null}
                      {agentName ? (
                        <>
                          <span className="text-muted-foreground">·</span>
                          <span className="text-xs text-foreground">{agentName}</span>
                        </>
                      ) : null}
                      {entry.ticketId ? (
                        <button
                          type="button"
                          onClick={() =>
                            openTicket(entry.ticketId!)
                          }
                          className="text-xs font-semibold text-[#008f68] hover:underline"
                        >
                          #{entry.ticketId}
                        </button>
                      ) : null}
                    </div>
                    {entrySummaryText(entry) ? (
                      <p className="mt-1 line-clamp-2 text-xs leading-snug text-gray-600 dark:text-slate-400">
                        {entrySummaryText(entry)}
                      </p>
                    ) : null}
                    {entry.phoneLineLabel || entry.yardName ? (
                      <p className="mt-1 text-[11px] text-slate-500">
                        {[entry.phoneLineLabel, entry.yardName]
                          .filter(Boolean)
                          .join(" · ")}
                      </p>
                    ) : null}
                      </>
                    )}
                  </li>
                );
              }

              if (entry.type === "manual_record") {
                return (
                  <li key={entry.id} className={entryShell}>
                    {expanded ? (
                      <div className="flex items-start gap-2.5">
                        <span
                          className={cn(
                            "flex shrink-0 items-center justify-center rounded-xl border border-violet-200 bg-violet-50 shadow-sm dark:border-violet-900 dark:bg-violet-950/40",
                            isPanelEmbed ? "h-8 w-8" : "h-9 w-9",
                          )}
                        >
                          <ClipboardList className="h-3.5 w-3.5 text-violet-600" />
                        </span>
                        <div className="min-w-0 flex-1 space-y-2">
                          <div className="flex flex-wrap items-start justify-between gap-2">
                            <div className="min-w-0">
                              <div className="flex flex-wrap items-center gap-1.5">
                                <span className="text-[13px] font-bold text-violet-700 dark:text-violet-400">
                                  Manual record
                                </span>
                                {entry.disposition ? (
                                  <Badge
                                    variant="secondary"
                                    className="h-5 rounded-md bg-violet-50 px-1.5 text-[10px] font-bold text-violet-700 ring-1 ring-violet-100 dark:bg-violet-950/50 dark:text-violet-300 dark:ring-violet-900"
                                  >
                                    {formatLabel(entry.disposition)}
                                  </Badge>
                                ) : null}
                              </div>
                              <p className="mt-0.5 text-[11px] font-semibold tabular-nums text-slate-500">
                                {dateLabel}
                              </p>
                            </div>
                          </div>
                          <DetailPills
                            items={[
                              {
                                label: "Yard",
                                value: entry.yardName,
                                icon: <MapPin className="h-3 w-3" />,
                                tone: "amber",
                              },
                              {
                                label: "Campaign",
                                value: joinDetailValues([
                                  entry.campaignName,
                                  formatLabel(entry.campaignOption),
                                ]),
                                icon: <Tag className="h-3 w-3" />,
                              },
                            ]}
                          />
                          <NotePreview
                            label="Record notes"
                            value={entry.manualRecordNotes}
                            tone="amber"
                          />
                          {entry.manualRecordId ? (
                            <div className="flex flex-wrap gap-2 pt-0.5">
                              <TimelineAction
                                onClick={() =>
                                  navigateTo("/calls?tab=manual-records")
                                }
                              >
                                View manual records
                              </TimelineAction>
                            </div>
                          ) : null}
                        </div>
                      </div>
                    ) : (
                      <>
                        <span
                          className={cn(
                            "absolute left-0 top-0.5 flex items-center justify-center rounded-full border-2 border-violet-400 bg-white dark:bg-slate-950",
                            isCompact ? "h-3 w-3" : "h-[18px] w-[18px]",
                          )}
                        >
                          <ClipboardList
                            className={cn(
                              "text-violet-600",
                              isCompact ? "h-2 w-2" : "h-2.5 w-2.5",
                            )}
                          />
                        </span>
                        <div className="flex flex-wrap items-center gap-x-1.5 gap-y-0.5">
                          <span className="text-[11px] font-normal tabular-nums text-slate-500">
                            {dateLabel}
                          </span>
                          <span className="text-xs font-semibold text-violet-700 dark:text-violet-400">
                            Manual record
                          </span>
                          {entry.disposition ? (
                            <>
                              <span className="select-none text-gray-300">·</span>
                              <span className="text-xs text-slate-600">
                                {formatLabel(entry.disposition)}
                              </span>
                            </>
                          ) : null}
                        </div>
                        {entry.manualRecordNotes ? (
                          <p className="mt-1 line-clamp-2 text-xs leading-snug text-gray-600 dark:text-slate-400">
                            {entry.manualRecordNotes}
                          </p>
                        ) : null}
                        {entry.yardName || entry.campaignName ? (
                          <p className="mt-1 text-[11px] text-slate-500">
                            {[entry.yardName, entry.campaignName]
                              .filter(Boolean)
                              .join(" · ")}
                          </p>
                        ) : null}
                      </>
                    )}
                  </li>
                );
              }

              if (entry.type === "customer_note") {
                return (
                  <li key={entry.id} className={entryShell}>
                    {expanded ? (
                      <div className="flex items-start gap-2.5">
                        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border border-amber-300 bg-amber-50 shadow-sm dark:border-amber-900 dark:bg-amber-950/40">
                          <StickyNote className="h-3.5 w-3.5 text-amber-600" />
                        </span>
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-1.5">
                            <span className="text-[13px] font-bold text-amber-700 dark:text-amber-400">
                              Audit note
                            </span>
                            {entry.noteAuthor ? (
                              <span className="text-[12px] font-semibold text-slate-600">
                                {entry.noteAuthor}
                              </span>
                            ) : null}
                            <span className="text-[11px] font-semibold tabular-nums text-slate-500">
                              {dateLabel}
                            </span>
                          </div>
                          {entry.noteContent ? (
                            <div className="mt-2">
                              <NotePreview
                                label="Audit note"
                                value={entry.noteContent}
                                tone="amber"
                              />
                            </div>
                          ) : null}
                        </div>
                      </div>
                    ) : (
                      <>
                    <span
                      className={cn(
                        "absolute left-0 top-0.5 flex items-center justify-center rounded-full border-2 border-amber-500 bg-white dark:bg-slate-950",
                        isCompact ? "h-3 w-3" : "h-[18px] w-[18px]",
                      )}
                    >
                      <StickyNote
                        className={cn(
                          "text-amber-600",
                          isCompact ? "h-2 w-2" : "h-2.5 w-2.5",
                        )}
                      />
                    </span>
                    <div className="flex flex-wrap items-center gap-x-1.5 gap-y-0.5">
                      <span className="text-[11px] tabular-nums text-slate-500">
                        {dateLabel}
                      </span>
                      <span className="text-xs font-semibold text-amber-700 dark:text-amber-400">
                        Note
                      </span>
                      {entry.noteAuthor ? (
                        <>
                          <span className="text-gray-300">·</span>
                          <span className="text-xs text-slate-600">
                            {entry.noteAuthor}
                          </span>
                        </>
                      ) : null}
                    </div>
                    {entry.noteContent ? (
                      <p className="mt-1 line-clamp-3 text-xs leading-snug text-gray-600 dark:text-slate-400">
                        {entry.noteContent}
                      </p>
                    ) : null}
                      </>
                    )}
                  </li>
                );
              }

              // SMS placeholder
              return (
                <li key={entry.id} className={entryShell}>
                  {expanded ? (
                    <div className="flex items-start gap-3">
                      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border-2 border-violet-500 bg-white dark:bg-slate-950">
                        <MessageSquare className="h-5 w-5 text-violet-600" />
                      </span>
                      <div>
                        <p className="text-[13px] text-slate-500">{dateLabel}</p>
                        <p className="text-[15px] font-bold text-violet-700">
                          {entry.smsDirection === "received"
                            ? "SMS received"
                            : "SMS sent"}
                        </p>
                        {entry.smsBody ? (
                          <p className="mt-2 text-[14px] text-slate-600">
                            {entry.smsBody}
                          </p>
                        ) : null}
                      </div>
                    </div>
                  ) : (
                    <>
                  <span
                    className={cn(
                      "absolute left-0 top-0.5 flex items-center justify-center rounded-full border-2 border-violet-500 bg-white dark:bg-slate-950",
                      isCompact ? "h-3 w-3" : "h-[18px] w-[18px]",
                    )}
                  >
                    <MessageSquare
                      className={cn(
                        "text-violet-600",
                        isCompact ? "h-2 w-2" : "h-2.5 w-2.5",
                      )}
                    />
                  </span>
                  <div className="flex flex-wrap items-center gap-x-1.5">
                    <span className="text-[11px] text-slate-500">{dateLabel}</span>
                    <span className="text-xs font-semibold text-violet-700">
                      {entry.smsDirection === "received"
                        ? "SMS received"
                        : "SMS sent"}
                    </span>
                  </div>
                  {entry.smsBody ? (
                    <p className="mt-1 line-clamp-2 text-xs text-gray-600">
                      {entry.smsBody}
                    </p>
                  ) : null}
                    </>
                  )}
                </li>
              );
            })}
          </ol>
        </div>
      )}

      {nextCursor && !loading ? (
        <Button
          type="button"
          variant="outline"
          size="sm"
          className={cn(
            "w-full",
            expanded ? "mt-4 h-10 text-sm" : "mt-3 h-7 text-[11px]",
            isCompact && "mt-2",
          )}
          onClick={() => loadTimeline(nextCursor)}
          disabled={loadingMore}
        >
          {loadingMore ? (
            <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
          ) : null}
          Load more
        </Button>
      ) : null}
    </div>
  );
}

function entrySummaryText(entry: TimelineEntry) {
  if (entry.type === "ticket") {
    return (
      entry.ticketNotes ||
      (entry.ticketType ? formatLabel(entry.ticketType) : "") ||
      ""
    );
  }
  if (entry.type === "call") {
    return entry.callNotes || entry.missedCallReason || "";
  }
  if (entry.type === "manual_record") {
    return entry.manualRecordNotes || "";
  }
  return "";
}
