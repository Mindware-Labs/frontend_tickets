"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  AlertCircle,
  CheckCheck,
  ChevronDown,
  Download,
  Loader2,
  MessagesSquare,
  PenSquare,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetTitle,
} from "@/components/ui/sheet";
import { dashboardPanelClass } from "@/app/(dashboard)/dashboard/dashboard-theme";
import { cn } from "@/lib/utils";
import { SmsChatPane } from "./components/SmsChatPane";
import { SmsConversationList } from "./components/SmsConversationList";
import { SmsFiltersBar } from "./components/SmsFiltersBar";
import {
  agentDisplayName,
  applySmsFilters,
  buildSmsConversations,
  classifySmsStatus,
  conversationHasAgent,
  formatPhone,
} from "./components/sms-helpers";
import {
  type SmsConversation,
  type SmsDirectionFilter,
  type SmsListResponse,
  type SmsMessageRecord,
  type SmsPeriodKey,
  type SmsStatusFilter,
} from "./components/sms-types";

const PAGE_LIMIT = 100;
const DEFAULT_PERIOD: SmsPeriodKey = "7d";
const INITIAL_CONVERSATION_LIMIT = 10;

type ThreadTab = "all" | "pending" | "failed";
type MetricIntent = "all" | "pending" | "failed" | "delivered";

interface ApiEnvelope<T> {
  success: boolean;
  data?: T;
  message?: string;
}

interface AgentDirectoryItem {
  id: number;
  name?: string | null;
  email?: string | null;
  firstName?: string | null;
  first_name?: string | null;
  lastName?: string | null;
  last_name?: string | null;
  fullName?: string | null;
  full_name?: string | null;
}

function periodToParams(period: SmsPeriodKey): URLSearchParams {
  const params = new URLSearchParams();
  if (period === "1d") {
    const today = new Date();
    const start = new Date(today);
    start.setHours(0, 0, 0, 0);
    params.set("start", start.toISOString());
    params.set("end", today.toISOString());
  } else if (period === "7d" || period === "30d" || period === "90d") {
    params.set("period", period);
  }
  return params;
}

export default function SmsAuditPage() {
  const [period, setPeriod] = useState<SmsPeriodKey>(DEFAULT_PERIOD);
  const [direction, setDirection] = useState<SmsDirectionFilter>("all");
  const [status, setStatus] = useState<SmsStatusFilter>("all");
  const [agentFilter, setAgentFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [serverSearch, setServerSearch] = useState("");

  const [messages, setMessages] = useState<SmsMessageRecord[]>([]);
  const [agentDirectory, setAgentDirectory] = useState<
    Record<number, { name?: string | null; email?: string | null }>
  >({});
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [loadingList, setLoadingList] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  const [mobileChatOpen, setMobileChatOpen] = useState(false);
  const [now, setNow] = useState<number | null>(null);

  // Sidebar-local tab filter narrows the recent conversation rail. Full text
  // search stays in the main filter bar so it can hit the API instead of
  // forcing this rail to render every thread.
  const [threadTab, setThreadTab] = useState<ThreadTab>("all");

  const fetchTokenRef = useRef(0);

  useEffect(() => {
    const update = () => setNow(Date.now());
    update();
    const timer = window.setInterval(update, 60_000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function loadAgents() {
      try {
        const response = await fetch("/api/agents", {
          credentials: "include",
        });
        const json: ApiEnvelope<AgentDirectoryItem[]> & {
          data?: AgentDirectoryItem[];
        } = await response.json();
        if (cancelled || !response.ok || !json.success) return;

        const directory: Record<
          number,
          { name?: string | null; email?: string | null }
        > = {};
        const agents = Array.isArray(json.data) ? json.data : [];
        for (const agent of agents) {
          const id = Number(agent.id);
          if (!Number.isFinite(id)) continue;
          const name =
            agent.name?.trim() ||
            agent.fullName?.trim() ||
            agent.full_name?.trim() ||
            [agent.firstName ?? agent.first_name, agent.lastName ?? agent.last_name]
              .filter(Boolean)
              .join(" ")
              .trim() ||
            null;
          directory[id] = { name, email: agent.email ?? null };
        }
        setAgentDirectory(directory);
      } catch {
        if (!cancelled) setAgentDirectory({});
      }
    }

    void loadAgents();
    return () => {
      cancelled = true;
    };
  }, []);

  // ──────────────────────────────────────────────────────────────────
  // Data fetching
  // ──────────────────────────────────────────────────────────────────
  const fetchList = useCallback(
    async (
      pageToLoad: number,
      currentPeriod: SmsPeriodKey,
      append: boolean,
    ) => {
      const token = ++fetchTokenRef.current;
      const params = periodToParams(currentPeriod);
      params.set("page", String(pageToLoad));
      params.set("limit", String(PAGE_LIMIT));
      if (direction !== "all") params.set("direction", direction);
      if (status !== "all") params.set("status", status);
      if (serverSearch.trim()) params.set("search", serverSearch.trim());

      if (append) setLoadingMore(true);
      else setLoadingList(true);
      setError(null);

      try {
        const res = await fetch(`/api/aircall-analytics/sms?${params.toString()}`, {
          credentials: "include",
        });
        const json: ApiEnvelope<SmsListResponse> = await res.json();
        if (token !== fetchTokenRef.current) return; // stale

        if (!res.ok || !json.success || !json.data) {
          throw new Error(json.message || `Request failed (${res.status})`);
        }

        const payload = json.data;
        setMessages((prev) =>
          append ? mergeMessages(prev, payload.data) : payload.data,
        );
        setPage(payload.page);
        setTotalPages(payload.totalPages);
        setTotal(payload.total);
      } catch (err) {
        if (token !== fetchTokenRef.current) return;
        setError(
          err instanceof Error ? err.message : "Failed to load SMS messages",
        );
        if (!append) setMessages([]);
      } finally {
        if (token !== fetchTokenRef.current) return;
        setLoadingList(false);
        setLoadingMore(false);
      }
    },
    [direction, status, serverSearch],
  );

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setServerSearch(search.trim());
    }, 300);
    return () => window.clearTimeout(timer);
  }, [search]);

  // Refetch the message list whenever the server-side filters change.
  useEffect(() => {
    void fetchList(1, period, false);
  }, [period, direction, status, serverSearch, fetchList]);

  // ──────────────────────────────────────────────────────────────────
  // Derived state
  // ──────────────────────────────────────────────────────────────────
  const messagesWithAgentNames = useMemo(
    () =>
      messages.map((message) => {
        if (!message.agent?.id) return message;
        const directoryAgent = agentDirectory[message.agent.id];
        if (!directoryAgent) return message;
        return {
          ...message,
          agent: {
            ...message.agent,
            name: message.agent.name ?? directoryAgent.name ?? null,
            email: message.agent.email ?? directoryAgent.email ?? null,
          },
        };
      }),
    [agentDirectory, messages],
  );

  const filteredMessages = useMemo(
    () =>
      applySmsFilters(messagesWithAgentNames, { direction, status, search }),
    [messagesWithAgentNames, direction, status, search],
  );

  const conversations: SmsConversation[] = useMemo(
    () => buildSmsConversations(filteredMessages),
    [filteredMessages],
  );

  const agentOptions = useMemo(() => {
    const byId = new Map<string, string>();
    let hasUnassigned = false;

    for (const conversation of conversations) {
      if (conversation.agents.length === 0) {
        hasUnassigned = true;
        continue;
      }
      for (const agent of conversation.agents) {
        byId.set(String(agent.id), agentDisplayName(agent));
      }
    }

    return [
      { value: "all", label: "All agents" },
      ...(hasUnassigned ? [{ value: "unassigned", label: "Sin agente" }] : []),
      ...Array.from(byId.entries())
        .sort((a, b) => a[1].localeCompare(b[1]))
        .map(([value, label]) => ({ value, label })),
    ];
  }, [conversations]);

  const agentFilteredConversations = useMemo(
    () =>
      conversations.filter((conversation) =>
        conversationHasAgent(conversation, agentFilter),
      ),
    [agentFilter, conversations],
  );

  const agentFilteredMessages = useMemo(
    () =>
      agentFilteredConversations.flatMap(
        (conversation) => conversation.messages,
      ),
    [agentFilteredConversations],
  );

  // Counts that drive the sidebar tab badges.
  const tabCounts = useMemo(() => {
    let pending = 0;
    let failed = 0;
    for (const c of agentFilteredConversations) {
      if (c.lastMessage.direction === "RECEIVED") pending += 1;
      if (c.failedCount > 0) failed += 1;
    }
    return { all: agentFilteredConversations.length, pending, failed };
  }, [agentFilteredConversations]);

  const auditMetrics = useMemo(() => {
    let inbound = 0;
    let outbound = 0;
    let failed = 0;
    let delivered = 0;

    for (const message of agentFilteredMessages) {
      if (message.direction === "RECEIVED") inbound += 1;
      else outbound += 1;

      const bucket = classifySmsStatus(message);
      if (bucket === "failed") failed += 1;
      if (bucket === "delivered") delivered += 1;
    }

    const pending = agentFilteredConversations.filter(
      (c) => c.lastMessage.direction === "RECEIVED",
    ).length;
    const deliveryRate =
      outbound > 0 ? Math.round((delivered / outbound) * 100) : null;

    return {
      conversations: agentFilteredConversations.length,
      inbound,
      outbound,
      pending,
      failed,
      delivered,
      deliveryRate,
    };
  }, [agentFilteredMessages, agentFilteredConversations]);

  // Apply sidebar-local filters: tab + free-text search.
  const visibleConversations = useMemo(() => {
    let list = agentFilteredConversations;

    if (threadTab === "pending") {
      list = list.filter((c) => c.lastMessage.direction === "RECEIVED");
    } else if (threadTab === "failed") {
      list = list.filter((c) => c.failedCount > 0);
    }

    return list;
  }, [agentFilteredConversations, threadTab]);

  const displayedConversations = useMemo(
    () => visibleConversations.slice(0, INITIAL_CONVERSATION_LIMIT),
    [visibleConversations],
  );

  const hiddenConversationCount = Math.max(
    visibleConversations.length - displayedConversations.length,
    0,
  );

  const exportMessages = agentFilteredMessages;

  const selectedConversation = useMemo(
    () => agentFilteredConversations.find((c) => c.key === selectedKey) ?? null,
    [agentFilteredConversations, selectedKey],
  );

  // Auto-select the first visible conversation when nothing is selected (or
  // when the prior selection no longer matches the active filters).
  useEffect(() => {
    if (displayedConversations.length === 0) {
      if (selectedKey !== null) setSelectedKey(null);
      return;
    }
    if (!displayedConversations.some((c) => c.key === selectedKey)) {
      setSelectedKey(displayedConversations[0]!.key);
    }
  }, [displayedConversations, selectedKey]);

  const hasActiveFilters =
    direction !== "all" ||
    status !== "all" ||
    agentFilter !== "all" ||
    search.trim() !== "";

  const canLoadMore = page < totalPages;

  // ──────────────────────────────────────────────────────────────────
  // Handlers
  // ──────────────────────────────────────────────────────────────────
  const handleSelect = useCallback((convo: SmsConversation) => {
    setSelectedKey(convo.key);
    if (typeof window !== "undefined" && window.innerWidth < 1024) {
      setMobileChatOpen(true);
    }
  }, []);

  const handleClearAll = useCallback(() => {
    setDirection("all");
    setStatus("all");
    setAgentFilter("all");
    setSearch("");
    setServerSearch("");
  }, []);

  const handleMetricClick = useCallback((intent: MetricIntent) => {
    if (intent === "all") {
      setThreadTab("all");
      setStatus("all");
      setDirection("all");
      return;
    }
    if (intent === "pending") {
      setThreadTab("pending");
      setDirection("all");
      setStatus("all");
      return;
    }
    if (intent === "failed") {
      setThreadTab("failed");
      setDirection("all");
      setStatus("failed");
      return;
    }
    setThreadTab("all");
    setDirection("SENT");
    setStatus("delivered");
  }, []);

  const handleExportCsv = useCallback(() => {
    if (exportMessages.length === 0) return;

      const headers = [
        "id",
        "aircallMessageId",
        "conversationId",
        "direction",
        "status",
        "customer",
        "agent",
        "phoneLine",
        "campaign",
        "from",
        "to",
        "externalNumber",
        "timestamp",
        "body",
        "mediaCount",
      ];
      const rows = exportMessages.map((message) => {
        const timestamp =
          (message.direction === "RECEIVED"
            ? message.receivedAt
            : message.sentAt) ||
          message.sentAt ||
          message.receivedAt ||
          message.createdAt;
        return [
          message.id,
          message.aircallMessageId,
          message.aircallConversationId,
          message.direction,
          message.status,
          message.customer?.name || message.customer?.phone,
          message.agent?.name || message.agent?.email || "Sin agente",
          message.phoneLine?.name || message.phoneLine?.number,
          message.campaign?.nombre,
          message.fromNumber ? formatPhone(message.fromNumber) : "",
          message.toNumber ? formatPhone(message.toNumber) : "",
          message.externalNumber ? formatPhone(message.externalNumber) : "",
          timestamp,
          message.body,
          message.mediaUrls?.length ?? 0,
        ];
      });

      const csv = [headers, ...rows]
        .map((row) => row.map(csvCell).join(","))
        .join("\n");
      const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `sms-audit-${period}-${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
  }, [exportMessages, period]);

  const handleExportThread = useCallback((conversation: SmsConversation) => {
    if (conversation.messages.length === 0) return;

    const headers = [
      "id",
      "aircallMessageId",
      "conversationId",
      "direction",
      "status",
      "customer",
      "agent",
      "phoneLine",
      "campaign",
      "from",
      "to",
      "externalNumber",
      "timestamp",
      "body",
      "mediaCount",
    ];
    const rows = conversation.messages.map((message) => {
      const timestamp =
        (message.direction === "RECEIVED"
          ? message.receivedAt
          : message.sentAt) ||
        message.sentAt ||
        message.receivedAt ||
        message.createdAt;
      return [
        message.id,
        message.aircallMessageId,
        message.aircallConversationId,
        message.direction,
        message.status,
        message.customer?.name || message.customer?.phone,
        message.agent?.name || message.agent?.email || "Sin agente",
        message.phoneLine?.name || message.phoneLine?.number,
        message.campaign?.nombre,
        message.fromNumber ? formatPhone(message.fromNumber) : "",
        message.toNumber ? formatPhone(message.toNumber) : "",
        message.externalNumber ? formatPhone(message.externalNumber) : "",
        timestamp,
        message.body,
        message.mediaUrls?.length ?? 0,
      ];
    });

    const csv = [headers, ...rows]
      .map((row) => row.map(csvCell).join(","))
      .join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const safeKey = conversation.key.replace(/[^a-z0-9_-]+/gi, "-");
    const link = document.createElement("a");
    link.href = url;
    link.download = `sms-thread-${safeKey}-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  }, []);

  const handleLoadMore = useCallback(() => {
    if (canLoadMore && !loadingMore && !loadingList) {
      void fetchList(page + 1, period, true);
    }
  }, [canLoadMore, loadingMore, loadingList, page, period, fetchList]);

  // ──────────────────────────────────────────────────────────────────
  // Render
  // ──────────────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col gap-2">
      <PageHeader
        total={total}
        onExport={handleExportCsv}
        exportDisabled={exportMessages.length === 0}
        exportCountLabel={String(exportMessages.length)}
      />

      <AuditMetricStrip
        metrics={auditMetrics}
        activeIntent={metricIntentFromFilters(threadTab, direction, status)}
        onMetricClick={handleMetricClick}
      />

      {error && (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 px-3 py-2 text-[12.5px] font-medium text-rose-700 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-300">
          {error}
        </div>
      )}

      {/* Main messenger panel — filter strip + sidebar/chat split */}
      <div
        className={cn(
          dashboardPanelClass,
          "flex h-[calc(100dvh-14rem)] min-h-[420px] flex-col",
        )}
      >
        {/* Filter strip — lives inside the same modal as the chat */}
        <div className="relative shrink-0 border-b border-slate-200/80 bg-white px-3 py-1.5 dark:border-slate-800 dark:bg-slate-950 sm:px-4">
          <span
            aria-hidden
            className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#008f68]/45 to-transparent"
          />
          <SmsFiltersBar
            period={period}
            onPeriodChange={setPeriod}
            direction={direction}
            onDirectionChange={setDirection}
            status={status}
            onStatusChange={setStatus}
            agentFilter={agentFilter}
            onAgentFilterChange={setAgentFilter}
            agentOptions={agentOptions}
            search={search}
            onSearchChange={setSearch}
            onClearAll={handleClearAll}
            hasActiveFilters={hasActiveFilters}
            loading={loadingList && messages.length > 0}
          />
        </div>

        <div className="grid min-h-0 flex-1 grid-cols-1 lg:grid-cols-[minmax(280px,360px)_1fr]">
          {/* Left rail — messenger-style sidebar */}
          <aside className="flex h-full min-h-0 flex-col border-slate-200/80 dark:border-slate-800 lg:border-r">
            <SidebarHeader visibleCount={displayedConversations.length} />
            <SidebarTabs
              tab={threadTab}
              onChange={setThreadTab}
              counts={tabCounts}
            />

            <div className="flex-1 overflow-y-auto">
              <SmsConversationList
                conversations={displayedConversations}
                selectedKey={selectedKey}
                onSelect={handleSelect}
                loading={loadingList}
                now={now ?? 0}
                emptyHint={emptyHintForTab(
                  threadTab,
                  search.trim() !== "",
                )}
              />

              {hiddenConversationCount > 0 && (
                <div className="border-t border-slate-100 bg-slate-50/60 px-3 py-2 text-center text-[11px] font-medium text-slate-500 dark:border-slate-800 dark:bg-slate-950/40 dark:text-slate-400">
                  Showing the 10 most recent. Use search above to find older
                  threads.
                </div>
              )}

              {canLoadMore && (
                <div className="flex justify-center border-t border-slate-100 bg-slate-50/40 p-2 dark:border-slate-800 dark:bg-slate-950/40">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={handleLoadMore}
                    disabled={loadingMore}
                    className="h-7 gap-1.5 rounded-full px-3 text-[11px] font-semibold uppercase tracking-wider text-slate-500 hover:bg-white hover:text-[#006b4f] dark:hover:bg-slate-900"
                  >
                    {loadingMore ? (
                      <Loader2 className="size-3 animate-spin" aria-hidden />
                    ) : (
                      <ChevronDown className="size-3" aria-hidden />
                    )}
                    Load older messages
                  </Button>
                </div>
              )}
            </div>
          </aside>

          {/* Right pane (desktop) */}
          <section className="hidden h-full min-h-0 flex-col lg:flex">
            <SmsChatPane
              conversation={selectedConversation}
              now={now ?? 0}
              onExportThread={handleExportThread}
            />
          </section>
        </div>
      </div>

      {/* Mobile chat sheet */}
      <Sheet
        open={mobileChatOpen && !!selectedConversation}
        onOpenChange={(open) => {
          if (!open) setMobileChatOpen(false);
        }}
      >
        <SheetContent
          side="right"
          className="flex h-dvh w-full max-w-full flex-col gap-0 p-0 sm:max-w-md"
        >
          <SheetTitle className="sr-only">SMS conversation</SheetTitle>
          <SmsChatPane
            conversation={selectedConversation}
            now={now ?? 0}
            onExportThread={handleExportThread}
          />
        </SheetContent>
      </Sheet>
    </div>
  );
}

// ──────────────────────────────────────────────────────────────────
// Sidebar pieces
// ──────────────────────────────────────────────────────────────────
function SidebarHeader({ visibleCount }: { visibleCount: number }) {
  return (
    <div className="relative flex shrink-0 items-center justify-between gap-2 border-b border-slate-200/80 bg-white px-3 py-2 dark:border-slate-800 dark:bg-slate-950">
      <span
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#008f68]/45 to-transparent"
      />
      <div className="flex min-w-0 items-center gap-2">
        <span
          aria-hidden
          className="h-6 w-0.5 shrink-0 rounded-full bg-[#008f68]"
        />
        <span className="inline-flex size-7 shrink-0 items-center justify-center rounded-lg bg-[#f0faf5] text-[#008f68] ring-1 ring-[#008f68]/15 dark:bg-emerald-500/10 dark:text-emerald-300 dark:ring-emerald-500/30">
          <MessagesSquare className="size-3.5" aria-hidden strokeWidth={2.25} />
        </span>
        <div className="min-w-0">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-400 dark:text-slate-500">
            Conversations
          </p>
          <p className="truncate text-[13px] font-bold leading-tight text-slate-900 dark:text-slate-100 tabular-nums">
            {visibleCount}
            <span className="ml-1 text-[11px] font-medium text-slate-500 dark:text-slate-400">
              {visibleCount === 1 ? "thread" : "threads"}
            </span>
          </p>
        </div>
      </div>

      <button
        type="button"
        disabled
        aria-label="New conversation (read-only audit)"
        title="Read-only audit view"
        className="inline-flex size-7 shrink-0 items-center justify-center rounded-full text-slate-400 transition-colors disabled:cursor-not-allowed disabled:opacity-60"
      >
        <PenSquare className="size-3.5" aria-hidden />
      </button>
    </div>
  );
}

const TAB_LABELS: Record<ThreadTab, string> = {
  all: "All",
  pending: "Pending",
  failed: "Failed",
};

function SidebarTabs({
  tab,
  onChange,
  counts,
}: {
  tab: ThreadTab;
  onChange: (tab: ThreadTab) => void;
  counts: Record<ThreadTab, number>;
}) {
  const tabs: ThreadTab[] = ["all", "pending", "failed"];
  return (
    <div className="shrink-0 border-b border-slate-200/80 bg-white px-3 py-2 dark:border-slate-800 dark:bg-slate-950">
      <div className="flex flex-wrap items-center gap-1.5">
        {tabs.map((t) => {
          const active = tab === t;
          const count = counts[t];
          return (
            <button
              key={t}
              type="button"
              onClick={() => onChange(t)}
              className={cn(
                "inline-flex h-[26px] items-center gap-1.5 rounded-full border px-2.5 text-[11px] font-semibold transition-colors",
                active
                  ? "border-[#008f68] bg-gradient-to-br from-[#008f68] to-[#006b4f] text-white shadow-sm shadow-emerald-500/20"
                  : "border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-900/70",
              )}
              aria-pressed={active}
            >
              <span>{TAB_LABELS[t]}</span>
              <span
                className={cn(
                  "inline-flex h-[16px] min-w-[18px] items-center justify-center rounded-full px-1 text-[9.5px] font-bold tabular-nums",
                  active
                    ? "bg-white/20 text-white"
                    : "bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400",
                )}
              >
                {count > 99 ? "99+" : count}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function emptyHintForTab(tab: ThreadTab, hasSearch: boolean): string {
  if (hasSearch) {
    return "No conversations match your search. Try a different name, number, or keyword.";
  }
  if (tab === "pending") {
    return "All caught up — no inbound messages awaiting a reply.";
  }
  if (tab === "failed") {
    return "No failed messages in the selected period.";
  }
  return "Adjust the period or clear filters to see SMS activity here.";
}

// ──────────────────────────────────────────────────────────────────
// Page header
// ──────────────────────────────────────────────────────────────────
function PageHeader({
  total,
  onExport,
  exportDisabled,
  exportCountLabel,
}: {
  total: number;
  onExport: () => void;
  exportDisabled: boolean;
  exportCountLabel: string;
}) {
  return (
    <div
      className={cn(
        dashboardPanelClass,
        "relative flex flex-wrap items-center justify-between gap-2 px-3 py-1.5 sm:px-4",
      )}
    >
      <span
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#008f68]/45 to-transparent"
      />
      <div className="flex min-w-0 items-center gap-2.5">
        <span className="h-7 w-0.5 shrink-0 rounded-full bg-[#008f68]" />
        <span className="inline-flex size-7 shrink-0 items-center justify-center rounded-lg bg-[#f0faf5] text-[#008f68] ring-1 ring-[#008f68]/15 dark:bg-emerald-500/10 dark:text-emerald-300 dark:ring-emerald-500/30">
          <MessagesSquare
            className="size-3.5"
            aria-hidden
            strokeWidth={2.25}
          />
        </span>
        <div className="min-w-0">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-400 dark:text-slate-500">
            Audit · SMS
          </p>
          <p className="truncate text-[13px] font-bold leading-tight text-slate-900 dark:text-slate-100">
            Message audit trail
            <span className="ml-2 text-[11px] font-medium text-slate-500 dark:text-slate-400 tabular-nums">
              {total > 0 ? `${total.toLocaleString()} loaded` : ""}
            </span>
          </p>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-end gap-1.5">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={onExport}
          disabled={exportDisabled}
          className="h-7 gap-1.5 rounded-lg px-2.5 text-[10.5px] font-semibold uppercase tracking-wider text-slate-500 hover:bg-[#f0faf5] hover:text-[#006b4f] disabled:opacity-50 dark:hover:bg-emerald-500/10"
        >
          <Download className="size-3" aria-hidden />
          Export CSV
         
        </Button>
      </div>
    </div>
  );
}

function AuditMetricStrip({
  metrics,
  activeIntent,
  onMetricClick,
}: {
  metrics: {
    conversations: number;
    inbound: number;
    outbound: number;
    pending: number;
    failed: number;
    delivered: number;
    deliveryRate: number | null;
  };
  activeIntent: MetricIntent;
  onMetricClick: (intent: MetricIntent) => void;
}) {
  const cards = [
    {
      intent: "all" as const,
      label: "Threads",
      value: metrics.conversations,
      detail: `${metrics.inbound} in / ${metrics.outbound} out`,
      icon: MessagesSquare,
      tone: "emerald" as const,
    },
    {
      intent: "pending" as const,
      label: "Needs reply",
      value: metrics.pending,
      detail: "Last message inbound",
      icon: PenSquare,
      tone: "amber" as const,
    },
    {
      intent: "failed" as const,
      label: "Failed",
      value: metrics.failed,
      detail: "Delivery issues",
      icon: AlertCircle,
      tone: "rose" as const,
    },
    {
      intent: "delivered" as const,
      label: "Delivery",
      value: metrics.deliveryRate == null ? "--" : `${metrics.deliveryRate}%`,
      detail: `${metrics.delivered} delivered`,
      icon: CheckCheck,
      tone: "sky" as const,
    },
  ];

  return (
    <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
      {cards.map((card) => (
        <MetricButton
          key={card.intent}
          {...card}
          active={activeIntent === card.intent}
          onClick={() => onMetricClick(card.intent)}
        />
      ))}
    </div>
  );
}

const METRIC_TONES = {
  emerald:
    "text-[#006b4f] bg-[#f0faf5] ring-[#008f68]/15 dark:bg-emerald-500/10 dark:text-emerald-300 dark:ring-emerald-500/30",
  amber:
    "text-amber-700 bg-amber-50 ring-amber-200 dark:bg-amber-500/10 dark:text-amber-300 dark:ring-amber-500/30",
  rose:
    "text-rose-700 bg-rose-50 ring-rose-200 dark:bg-rose-500/10 dark:text-rose-300 dark:ring-rose-500/30",
  sky:
    "text-sky-700 bg-sky-50 ring-sky-200 dark:bg-sky-500/10 dark:text-sky-300 dark:ring-sky-500/30",
} as const;

function MetricButton({
  label,
  value,
  detail,
  icon: Icon,
  tone,
  active,
  onClick,
}: {
  label: string;
  value: number | string;
  detail: string;
  icon: typeof MessagesSquare;
  tone: keyof typeof METRIC_TONES;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        dashboardPanelClass,
        "group flex min-h-[58px] items-center gap-2 px-2.5 py-1.5 text-left transition-colors hover:border-[#008f68]/30 hover:bg-[#fbfefd] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#008f68]/25 dark:hover:bg-emerald-500/5",
        active && "border-[#008f68]/40 bg-[#f0faf5] dark:bg-emerald-500/10",
      )}
      aria-pressed={active}
    >
      <span
        className={cn(
          "inline-flex size-7 shrink-0 items-center justify-center rounded-lg ring-1",
          METRIC_TONES[tone],
        )}
      >
        <Icon className="size-3.5" aria-hidden strokeWidth={2.25} />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-[9px] font-semibold uppercase tracking-widest text-slate-400 dark:text-slate-500">
          {label}
        </span>
        <span className="block text-[15px] font-bold leading-tight text-slate-900 dark:text-slate-100 tabular-nums">
          {typeof value === "number" ? value.toLocaleString() : value}
        </span>
        <span className="block truncate text-[10.5px] font-medium text-slate-500 dark:text-slate-400">
          {detail}
        </span>
      </span>
    </button>
  );
}

// ──────────────────────────────────────────────────────────────────
// Helpers
// ──────────────────────────────────────────────────────────────────
function mergeMessages(
  prev: SmsMessageRecord[],
  next: SmsMessageRecord[],
): SmsMessageRecord[] {
  const seen = new Set(prev.map((m) => m.id));
  const additions = next.filter((m) => !seen.has(m.id));
  return prev.concat(additions);
}

function metricIntentFromFilters(
  threadTab: ThreadTab,
  direction: SmsDirectionFilter,
  status: SmsStatusFilter,
): MetricIntent {
  if (threadTab === "pending") return "pending";
  if (threadTab === "failed" || status === "failed") return "failed";
  if (direction === "SENT" && status === "delivered") return "delivered";
  return "all";
}

function csvCell(value: unknown): string {
  if (value == null) return "";
  const text = String(value).replace(/\r?\n/g, " ");
  return `"${text.replace(/"/g, '""')}"`;
}
