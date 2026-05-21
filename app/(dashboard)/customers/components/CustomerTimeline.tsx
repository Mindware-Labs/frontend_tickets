"use client";

import { useCallback, useEffect, useState } from "react";
import { format, formatDistanceToNow } from "date-fns";
import { useRouter } from "next/navigation";
import {
  CheckCircle2,
  Clock,
  FileText,
  Loader2,
  MessageSquare,
  PhoneIncoming,
  PhoneMissed,
  PhoneOutgoing,
  Play,
  RefreshCw,
  StickyNote,
  Ticket,
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

interface CustomerTimelineProps {
  customerId: number;
  canPlayRecordings: boolean;
  refreshKey?: number;
  onNavigate?: () => void;
}

function normalizeArray<T>(data: unknown): T[] {
  if (Array.isArray(data)) return data as T[];
  const wrapped = data as { data?: unknown; success?: boolean };
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

function formatRelative(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return formatDistanceToNow(date, { addSuffix: true });
}

function formatAbsolute(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return format(date, "MMM d, yyyy h:mm a");
}

function formatDuration(seconds?: number) {
  if (!seconds) return undefined;
  const minutes = Math.floor(seconds / 60);
  const rest = seconds % 60;
  return minutes > 0 ? `${minutes}m ${rest}s` : `${rest}s`;
}

function entryIcon(entry: TimelineEntry) {
  if (entry.type === "ticket") return Ticket;
  if (entry.type === "sms") return MessageSquare;
  if (entry.type === "customer_note") return StickyNote;
  if (entry.direction === "OUTBOUND") return PhoneOutgoing;
  if (entry.direction === "MISSED") return PhoneMissed;
  return PhoneIncoming;
}

function entryTone(entry: TimelineEntry) {
  if (entry.type === "ticket" && entry.ticketStatus === "OVERDUE") {
    return "border-red-200 bg-red-50 text-red-700";
  }
  if (entry.type === "call" && entry.direction === "MISSED") {
    return "border-red-200 bg-red-50 text-red-700";
  }
  if (entry.type === "ticket") return "border-blue-200 bg-blue-50 text-blue-700";
  if (entry.type === "customer_note") {
    return "border-amber-200 bg-amber-50 text-amber-700";
  }
  if (entry.type === "sms") return "border-violet-200 bg-violet-50 text-violet-700";
  return "border-emerald-200 bg-emerald-50 text-emerald-700";
}

function entryTitle(entry: TimelineEntry) {
  if (entry.type === "ticket") {
    return `Ticket #${entry.ticketId} ${entry.ticketStatus || ""}`.trim();
  }
  if (entry.type === "sms") {
    return `${entry.smsDirection || "SMS"} message`;
  }
  if (entry.type === "customer_note") return "Customer note";
  return `${entry.direction?.toLowerCase() || "call"} call`;
}

function entrySummary(entry: TimelineEntry) {
  if (entry.type === "ticket") {
    return [entry.ticketType, entry.ticketPriority].filter(Boolean).join(" - ");
  }
  if (entry.type === "sms") return entry.smsBody || "SMS coming soon";
  if (entry.type === "customer_note") return entry.noteContent || "Note";
  return entry.disposition || entry.lastLineOrigin || "Call activity";
}

export function CustomerTimeline({
  customerId,
  canPlayRecordings,
  refreshKey = 0,
  onNavigate,
}: CustomerTimelineProps) {
  const router = useRouter();
  const [filters, setFilters] = useState<TimelineFilters>(DEFAULT_FILTERS);
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
          isLoadMore ? [...prev, ...(payload.entries ?? [])] : payload.entries ?? [],
        );
        setTotal(payload.total ?? 0);
        setNextCursor(payload.nextCursor);
      } catch (err: unknown) {
        const message =
          err instanceof Error ? err.message : "Failed to load timeline";
        setError(message);
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

  const updateFilter = (key: keyof TimelineFilters, value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value }) as TimelineFilters);
  };

  const resetFilters = () => setFilters(DEFAULT_FILTERS);

  const navigateTo = (href: string) => {
    onNavigate?.();
    router.push(href);
  };

  return (
    <section className="flex flex-col gap-3">
      <div className="flex items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-bold text-slate-950 dark:text-slate-50">
              Activity Timeline
            </h3>
            <Badge variant="secondary" className="rounded-full">
              {total}
            </Badge>
          </div>
          <p className="mt-0.5 text-[12px] text-slate-500">
            Calls, tickets, SMS, and customer notes.
          </p>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => loadTimeline()}
          disabled={loading}
          className="h-8"
        >
          <RefreshCw className={cn("mr-2 h-3.5 w-3.5", loading && "animate-spin")} />
          Refresh
        </Button>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <Select value={filters.type} onValueChange={(value) => updateFilter("type", value)}>
          <SelectTrigger className="h-9 text-xs">
            <SelectValue placeholder="Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All activity</SelectItem>
            <SelectItem value="call">Calls</SelectItem>
            <SelectItem value="ticket">Tickets</SelectItem>
            <SelectItem value="sms" disabled>
              SMS coming soon
            </SelectItem>
            <SelectItem value="customer_note">Notes</SelectItem>
          </SelectContent>
        </Select>

        <Select value={filters.sort} onValueChange={(value) => updateFilter("sort", value)}>
          <SelectTrigger className="h-9 text-xs">
            <SelectValue placeholder="Order" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="desc">Newest first</SelectItem>
            <SelectItem value="asc">Oldest first</SelectItem>
          </SelectContent>
        </Select>

        <Input
          type="date"
          value={filters.from}
          aria-label="Timeline date from"
          onChange={(event) => updateFilter("from", event.target.value)}
          className="h-9 text-xs"
        />
        <Input
          type="date"
          value={filters.to}
          aria-label="Timeline date to"
          onChange={(event) => updateFilter("to", event.target.value)}
          className="h-9 text-xs"
        />

        <Select
          value={filters.lineId}
          onValueChange={(value) => updateFilter("lineId", value)}
        >
          <SelectTrigger className="h-9 text-xs">
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
          <SelectTrigger className="h-9 text-xs">
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

      <div className="flex justify-end">
        <button
          type="button"
          onClick={resetFilters}
          className="text-[12px] font-medium text-slate-400 underline-offset-4 hover:text-slate-700 hover:underline dark:hover:text-slate-200"
        >
          Clear timeline filters
        </button>
      </div>

      <div className="flex flex-col gap-2">
        {loading ? (
          Array.from({ length: 4 }).map((_, index) => (
            <div
              key={index}
              className="rounded-xl border border-slate-200 bg-white p-3.5 dark:border-slate-800 dark:bg-slate-950"
            >
              <Skeleton className="h-4 w-32" />
              <Skeleton className="mt-2 h-3 w-full" />
              <Skeleton className="mt-2 h-3 w-2/3" />
            </div>
          ))
        ) : error ? (
          <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-center text-sm text-red-700">
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
          <div className="rounded-xl border border-dashed border-slate-200 bg-white p-6 text-center text-sm text-slate-500 dark:border-slate-800 dark:bg-slate-950">
            No activity found.
          </div>
        ) : (
          entries.map((entry) => {
            const Icon = entryIcon(entry);
            const duration = formatDuration(entry.duration);
            const isResolved =
              entry.ticketStatus === "RESOLVED" || entry.ticketStatus === "CLOSED";

            return (
              <article
                key={entry.id}
                className="rounded-xl border border-slate-200 bg-white p-3.5 shadow-sm dark:border-slate-800 dark:bg-slate-950"
              >
                <div className="flex items-start gap-3">
                  <div
                    className={cn(
                      "flex h-9 w-9 shrink-0 items-center justify-center rounded-full border",
                      entryTone(entry),
                    )}
                  >
                    <Icon className="h-4 w-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-[13px] font-bold text-slate-900 dark:text-slate-50">
                        {entryTitle(entry)}
                      </p>
                      {isResolved ? (
                        <Badge variant="outline" className="gap-1 rounded-full text-[10px]">
                          <CheckCircle2 className="h-3 w-3" />
                          Resolved
                        </Badge>
                      ) : null}
                    </div>
                    <p
                      className="mt-1 line-clamp-2 text-[13px] leading-relaxed text-slate-600 dark:text-slate-300"
                      title={entrySummary(entry)}
                    >
                      {entrySummary(entry)}
                    </p>
                    <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] font-medium text-slate-500">
                      <span title={formatAbsolute(entry.occurredAt)}>
                        {formatRelative(entry.occurredAt)}
                      </span>
                      {entry.agentName || entry.assignedAgentName ? (
                        <span>{entry.agentName || entry.assignedAgentName}</span>
                      ) : null}
                      {entry.phoneLineLabel ? <span>{entry.phoneLineLabel}</span> : null}
                      {entry.yardName ? <span>{entry.yardName}</span> : null}
                      {duration ? (
                        <span className="inline-flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {duration}
                        </span>
                      ) : null}
                    </div>

                    <div className="mt-3 flex flex-wrap gap-2">
                      {entry.type === "call" && entry.callId ? (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="h-8"
                          onClick={() => navigateTo(`/calls?id=${entry.callId}`)}
                        >
                          <FileText className="mr-2 h-3.5 w-3.5" />
                          View call
                        </Button>
                      ) : null}
                      {entry.type === "call" && entry.callId && !entry.hasTicket ? (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="h-8"
                          onClick={() => navigateTo(`/calls?id=${entry.callId}`)}
                        >
                          Create ticket
                        </Button>
                      ) : null}
                      {entry.type === "ticket" && entry.ticketId ? (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="h-8"
                          onClick={() =>
                            navigateTo(`/calls?tab=tickets&id=${entry.ticketId}`)
                          }
                        >
                          <Ticket className="mr-2 h-3.5 w-3.5" />
                          View ticket
                        </Button>
                      ) : null}
                      {entry.recordingUrl && entry.callId && canPlayRecordings ? (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="h-8"
                          onClick={() =>
                            window.open(
                              `/api/calls/${entry.callId}/recording`,
                              "_blank",
                              "noopener,noreferrer",
                            )
                          }
                        >
                          <Play className="mr-2 h-3.5 w-3.5" />
                          Recording
                        </Button>
                      ) : null}
                    </div>
                  </div>
                </div>
              </article>
            );
          })
        )}
      </div>

      {nextCursor && !loading ? (
        <Button
          type="button"
          variant="outline"
          onClick={() => loadTimeline(nextCursor)}
          disabled={loadingMore}
          className="h-9"
        >
          {loadingMore ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : null}
          Load more
        </Button>
      ) : null}
    </section>
  );
}
