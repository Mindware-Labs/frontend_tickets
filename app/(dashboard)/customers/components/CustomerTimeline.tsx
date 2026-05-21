"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  format,
  formatDistanceToNow,
  isToday,
  isYesterday,
} from "date-fns";
import { useRouter } from "next/navigation";
import {
  ChevronDown,
  FileText,
  Filter,
  Loader2,
  MessageSquare,
  PhoneIncoming,
  PhoneMissed,
  PhoneOutgoing,
  Play,
  RefreshCw,
  StickyNote,
  Ticket,
  Voicemail,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { fetchFromBackend } from "@/lib/api-client";
import { cn } from "@/lib/utils";
import type {
  AgentOption,
  PhoneLineOption,
  TimelineEntry,
  TimelineFilters,
} from "../types";

const DEFAULT_FILTERS: TimelineFilters = {
  type: "all",
  sort: "desc",
  from: "",
  to: "",
  lineId: "all",
  agentId: "all",
};

const TYPE_CHIPS: {
  value: TimelineFilters["type"];
  label: string;
  disabled?: boolean;
}[] = [
  { value: "all", label: "All" },
  { value: "call", label: "Calls" },
  { value: "ticket", label: "Tickets" },
  { value: "customer_note", label: "Notes" },
  { value: "sms", label: "SMS", disabled: true },
];

interface CustomerTimelineProps {
  customerId: number;
  canPlayRecordings: boolean;
  refreshKey?: number;
  /** Tighter layout for sheet popup */
  compact?: boolean;
  onNavigate?: () => void;
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

function hasActiveFilters(filters: TimelineFilters) {
  return (
    filters.type !== "all" ||
    filters.from !== "" ||
    filters.to !== "" ||
    filters.lineId !== "all" ||
    filters.agentId !== "all"
  );
}

export function CustomerTimeline({
  customerId,
  canPlayRecordings,
  refreshKey = 0,
  compact = false,
  onNavigate,
}: CustomerTimelineProps) {
  const router = useRouter();
  const [filters, setFilters] = useState<TimelineFilters>(DEFAULT_FILTERS);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [entries, setEntries] = useState<TimelineEntry[]>([]);
  const [total, setTotal] = useState(0);
  const [nextCursor, setNextCursor] = useState<string | undefined>();
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [phoneLines, setPhoneLines] = useState<PhoneLineOption[]>([]);
  const [agents, setAgents] = useState<AgentOption[]>([]);

  useEffect(() => {
    let cancelled = false;
    Promise.all([
      fetchFromBackend("/phone-lines").catch(() => []),
      fetchFromBackend("/agents?page=1&limit=200").catch(() => []),
    ]).then(([linesData, agentsData]) => {
      if (cancelled) return;
      setPhoneLines(normalizeArray<PhoneLineOption>(linesData));
      setAgents(normalizeArray<AgentOption>(agentsData));
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const loadTimeline = useCallback(
    async (cursor?: string) => {
      const isLoadMore = Boolean(cursor);
      if (isLoadMore) setLoadingMore(true);
      else setLoading(true);
      setError(null);

      try {
        const params = new URLSearchParams({ limit: "25", sort: filters.sort });
        if (filters.type !== "all") params.set("type", filters.type);
        if (filters.from) params.set("from", `${filters.from}T00:00:00`);
        if (filters.to) params.set("to", `${filters.to}T23:59:59.999`);
        if (filters.lineId !== "all") params.set("lineId", filters.lineId);
        if (filters.agentId !== "all") params.set("agentId", filters.agentId);
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

  const updateFilter = <K extends keyof TimelineFilters>(
    key: K,
    value: TimelineFilters[K],
  ) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const resetFilters = () => setFilters(DEFAULT_FILTERS);

  const navigateTo = (href: string) => {
    onNavigate?.();
    router.push(href);
  };

  const activeFilters = useMemo(() => hasActiveFilters(filters), [filters]);

  const lastEventAgo = useMemo(() => {
    const first = entries[0];
    if (!first?.occurredAt) return null;
    const d = new Date(first.occurredAt);
    if (Number.isNaN(d.getTime())) return null;
    return formatDistanceToNow(d, { addSuffix: true });
  }, [entries]);

  return (
    <div className={cn(compact ? "px-3 py-3" : "px-4 py-4 sm:px-5 sm:py-5")}>
      <div
        className={cn(
          "flex items-center justify-between gap-2",
          compact ? "mb-2" : "mb-3",
        )}
      >
        <div className="min-w-0 text-[11px] text-slate-500">
          <span className="font-semibold tabular-nums text-slate-700 dark:text-slate-300">
            {loading && entries.length === 0 ? "…" : total}
          </span>{" "}
          events
          {lastEventAgo ? (
            <span className="text-slate-400"> · {lastEventAgo}</span>
          ) : null}
        </div>
        <button
          type="button"
          onClick={() => loadTimeline()}
          disabled={loading}
          aria-label="Refresh timeline"
          className="flex h-7 w-7 items-center justify-center rounded-lg border border-slate-200 text-slate-500 transition-colors hover:bg-slate-50 disabled:opacity-50 dark:border-slate-700 dark:hover:bg-slate-800"
        >
          <RefreshCw
            className={cn("h-3.5 w-3.5", loading && "animate-spin")}
          />
        </button>
      </div>

      <div className={cn("space-y-2", compact ? "mb-3" : "mb-4")}>
        <div className="flex flex-wrap items-center gap-1.5">
          {TYPE_CHIPS.map((chip) => (
            <button
              key={chip.value}
              type="button"
              disabled={chip.disabled}
              onClick={() => !chip.disabled && updateFilter("type", chip.value)}
              className={cn(
                "rounded-full px-2 py-0.5 text-[10px] font-semibold transition-colors",
                chip.disabled && "cursor-not-allowed opacity-40",
                filters.type === chip.value
                  ? "bg-[#008f68] text-white"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300",
              )}
            >
              {chip.label}
            </button>
          ))}
          <button
            type="button"
            onClick={() =>
              updateFilter("sort", filters.sort === "desc" ? "asc" : "desc")
            }
            className="rounded-full border border-slate-200 bg-white px-2 py-0.5 text-[10px] font-semibold text-slate-600 dark:border-slate-700 dark:bg-slate-900"
          >
            {filters.sort === "desc" ? "Newest" : "Oldest"}
          </button>
          <button
            type="button"
            onClick={() => setFiltersOpen((v) => !v)}
            className={cn(
              "ml-auto inline-flex items-center gap-1 rounded-full border border-slate-200 bg-white px-2 py-0.5 text-[10px] font-semibold text-slate-600 dark:border-slate-700 dark:bg-slate-900",
              !compact && "lg:hidden",
            )}
          >
            <Filter className="h-3 w-3" />
            More
            {activeFilters ? (
              <span className="h-1.5 w-1.5 rounded-full bg-[#008f68]" />
            ) : null}
            <ChevronDown
              className={cn(
                "h-3 w-3 transition-transform",
                filtersOpen && "rotate-180",
              )}
            />
          </button>
        </div>

        <div
          className={cn(
            "grid gap-2 sm:grid-cols-2",
            compact ? "grid-cols-2" : "lg:grid-cols-4",
            compact
              ? filtersOpen
                ? "grid"
                : "hidden"
              : filtersOpen
                ? "grid"
                : "hidden lg:grid",
          )}
        >
          <Input
            type="date"
            value={filters.from}
            aria-label="From date"
            onChange={(e) => updateFilter("from", e.target.value)}
            className="h-8 text-xs"
          />
          <Input
            type="date"
            value={filters.to}
            aria-label="To date"
            onChange={(e) => updateFilter("to", e.target.value)}
            className="h-8 text-xs"
          />
          <Select
            value={filters.lineId}
            onValueChange={(value) => updateFilter("lineId", value)}
          >
            <SelectTrigger className="h-8 text-xs">
              <SelectValue placeholder="Line" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All lines</SelectItem>
              {phoneLines.map((line) => (
                <SelectItem key={line.id} value={String(line.id)}>
                  {line.label || line.phoneNumber}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select
            value={filters.agentId}
            onValueChange={(value) => updateFilter("agentId", value)}
          >
            <SelectTrigger className="h-8 text-xs">
              <SelectValue placeholder="Agent" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All agents</SelectItem>
              {agents.map((agent) => (
                <SelectItem key={agent.id} value={String(agent.id)}>
                  {agent.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

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
        <div className="relative">
          <div
            className={cn(
              "absolute top-0 bottom-0 w-px bg-slate-200 dark:bg-slate-700",
              compact ? "left-[5px]" : "left-[9px]",
            )}
          />
          <ol className={compact ? "space-y-3" : "space-y-4"}>
            {entries.map((entry) => {
              const dateLabel = formatShortDate(entry.occurredAt);
              const duration = formatDuration(entry.duration);
              const agentName = entry.agentName || entry.assignedAgentName;

              if (entry.type === "call") {
                const meta = callMeta(entry);
                const Icon = meta.Icon;
                return (
                  <li
                    key={entry.id}
                    className={cn("relative", compact ? "pl-5" : "pl-7")}
                  >
                    <span
                      className={cn(
                        "absolute left-0 top-0.5 flex items-center justify-center rounded-full border-2 bg-white dark:bg-slate-950",
                        compact ? "h-3 w-3" : "h-[18px] w-[18px]",
                        meta.ring,
                      )}
                    >
                      <Icon
                        className={cn(
                          compact ? "h-2 w-2" : "h-2.5 w-2.5",
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
                          compact ? "text-xs" : "text-sm",
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
                    <div className="mt-1.5 flex flex-wrap gap-2">
                      {entry.callId ? (
                        <button
                          type="button"
                          onClick={() => navigateTo(`/calls?id=${entry.callId}`)}
                          className="text-xs font-semibold text-[#008f68] hover:underline"
                        >
                          View call
                        </button>
                      ) : null}
                      {entry.callId && !entry.hasTicket ? (
                        <button
                          type="button"
                          onClick={() => navigateTo(`/calls?id=${entry.callId}`)}
                          className="text-xs font-semibold text-slate-500 hover:text-slate-800 hover:underline dark:hover:text-slate-200"
                        >
                          Create ticket
                        </button>
                      ) : null}
                      {entry.recordingUrl && entry.callId && canPlayRecordings ? (
                        <button
                          type="button"
                          onClick={() =>
                            window.open(
                              `/api/calls/${entry.callId}/recording`,
                              "_blank",
                              "noopener,noreferrer",
                            )
                          }
                          className="inline-flex items-center gap-1 text-xs font-semibold text-slate-500 hover:underline"
                        >
                          <Play className="h-3 w-3" />
                          Recording
                        </button>
                      ) : null}
                    </div>
                  </li>
                );
              }

              if (entry.type === "ticket") {
                const ring = ticketStatusRing(entry.ticketStatus);
                return (
                  <li
                    key={entry.id}
                    className={cn("relative", compact ? "pl-5" : "pl-7")}
                  >
                    <span
                      className={cn(
                        "absolute left-0 top-1 flex items-center justify-center rounded-full border-2 bg-white dark:bg-slate-950",
                        compact ? "h-3 w-3" : "h-[18px] w-[18px]",
                        ring,
                      )}
                    >
                      <Ticket
                        className={cn(
                          "text-blue-600",
                          compact ? "h-2 w-2" : "h-2.5 w-2.5",
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
                            navigateTo(`/calls?tab=tickets&id=${entry.ticketId}`)
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
                  </li>
                );
              }

              if (entry.type === "customer_note") {
                return (
                  <li
                    key={entry.id}
                    className={cn("relative", compact ? "pl-5" : "pl-7")}
                  >
                    <span
                      className={cn(
                        "absolute left-0 top-0.5 flex items-center justify-center rounded-full border-2 border-amber-500 bg-white dark:bg-slate-950",
                        compact ? "h-3 w-3" : "h-[18px] w-[18px]",
                      )}
                    >
                      <StickyNote
                        className={cn(
                          "text-amber-600",
                          compact ? "h-2 w-2" : "h-2.5 w-2.5",
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
                  </li>
                );
              }

              // SMS placeholder
              return (
                <li
                  key={entry.id}
                  className={cn("relative", compact ? "pl-5" : "pl-7")}
                >
                  <span
                    className={cn(
                      "absolute left-0 top-0.5 flex items-center justify-center rounded-full border-2 border-violet-500 bg-white dark:bg-slate-950",
                      compact ? "h-3 w-3" : "h-[18px] w-[18px]",
                    )}
                  >
                    <MessageSquare
                      className={cn(
                        "text-violet-600",
                        compact ? "h-2 w-2" : "h-2.5 w-2.5",
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
            "mt-3 h-7 w-full text-[11px]",
            compact && "mt-2",
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
    return entry.ticketType
      ? formatLabel(entry.ticketType)
      : "";
  }
  return "";
}
