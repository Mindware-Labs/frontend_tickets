"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  ChevronDown,
  Loader2,
  MessagesSquare,
  PenSquare,
  RefreshCw,
  Search,
  X,
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
  applySmsFilters,
  buildSmsConversations,
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

type ThreadTab = "all" | "pending" | "failed";

interface ApiEnvelope<T> {
  success: boolean;
  data?: T;
  message?: string;
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
  const [search, setSearch] = useState("");
  const [serverSearch, setServerSearch] = useState("");

  const [messages, setMessages] = useState<SmsMessageRecord[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [loadingList, setLoadingList] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  const [mobileChatOpen, setMobileChatOpen] = useState(false);

  // Sidebar-local UX state — search query and tab filter sit alongside the
  // global page filters and refine which conversations the rail shows.
  const [sidebarSearch, setSidebarSearch] = useState("");
  const [threadTab, setThreadTab] = useState<ThreadTab>("all");
  const sidebarSearchRef = useRef<HTMLInputElement | null>(null);

  const fetchTokenRef = useRef(0);

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
  const filteredMessages = useMemo(
    () => applySmsFilters(messages, { direction, status, search }),
    [messages, direction, status, search],
  );

  const conversations: SmsConversation[] = useMemo(
    () => buildSmsConversations(filteredMessages),
    [filteredMessages],
  );

  // Counts that drive the sidebar tab badges.
  const tabCounts = useMemo(() => {
    let pending = 0;
    let failed = 0;
    for (const c of conversations) {
      if (c.lastMessage.direction === "RECEIVED") pending += 1;
      if (c.failedCount > 0) failed += 1;
    }
    return { all: conversations.length, pending, failed };
  }, [conversations]);

  // Apply sidebar-local filters: tab + free-text search.
  const visibleConversations = useMemo(() => {
    let list = conversations;

    if (threadTab === "pending") {
      list = list.filter((c) => c.lastMessage.direction === "RECEIVED");
    } else if (threadTab === "failed") {
      list = list.filter((c) => c.failedCount > 0);
    }

    const q = sidebarSearch.trim().toLowerCase();
    if (q) {
      list = list.filter((c) => {
        const haystack = [
          c.displayName,
          c.customer?.name,
          c.customer?.phone,
          c.externalNumber,
          c.lastMessage.body,
        ]
          .filter(Boolean)
          .map((s) => String(s).toLowerCase())
          .join(" \u0001 ");
        return haystack.includes(q);
      });
    }

    return list;
  }, [conversations, threadTab, sidebarSearch]);

  const selectedConversation = useMemo(
    () => conversations.find((c) => c.key === selectedKey) ?? null,
    [conversations, selectedKey],
  );

  // Auto-select the first visible conversation when nothing is selected (or
  // when the prior selection no longer matches the active filters).
  useEffect(() => {
    if (visibleConversations.length === 0) {
      if (selectedKey !== null) setSelectedKey(null);
      return;
    }
    if (!visibleConversations.some((c) => c.key === selectedKey)) {
      setSelectedKey(visibleConversations[0]!.key);
    }
  }, [visibleConversations, selectedKey]);

  const hasActiveFilters =
    direction !== "all" || status !== "all" || search.trim() !== "";

  const canLoadMore = page < totalPages;

  // ──────────────────────────────────────────────────────────────────
  // Keyboard shortcut: "/" focuses the sidebar search.
  // ──────────────────────────────────────────────────────────────────
  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.defaultPrevented) return;
      const target = event.target as HTMLElement | null;
      const isEditable =
        !!target &&
        (target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.isContentEditable);

      if (event.key === "/" && !isEditable) {
        event.preventDefault();
        sidebarSearchRef.current?.focus();
        sidebarSearchRef.current?.select();
        return;
      }
      if (
        event.key === "Escape" &&
        document.activeElement === sidebarSearchRef.current
      ) {
        sidebarSearchRef.current?.blur();
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

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
    setSearch("");
    setServerSearch("");
  }, []);

  const handleRefresh = useCallback(() => {
    void fetchList(1, period, false);
  }, [fetchList, period]);

  const handleLoadMore = useCallback(() => {
    if (canLoadMore && !loadingMore && !loadingList) {
      void fetchList(page + 1, period, true);
    }
  }, [canLoadMore, loadingMore, loadingList, page, period, fetchList]);

  // ──────────────────────────────────────────────────────────────────
  // Render
  // ──────────────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col gap-3">
      <PageHeader
        total={total}
        loading={loadingList}
        onRefresh={handleRefresh}
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
          "flex h-[calc(100dvh-9rem)] min-h-[560px] flex-col",
        )}
      >
        {/* Filter strip — lives inside the same modal as the chat */}
        <div className="relative shrink-0 border-b border-slate-200/80 bg-white px-3 py-2 dark:border-slate-800 dark:bg-slate-950 sm:px-4">
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
            <SidebarHeader visibleCount={visibleConversations.length} />
            <SidebarSearch
              inputRef={sidebarSearchRef}
              value={sidebarSearch}
              onChange={setSidebarSearch}
            />
            <SidebarTabs
              tab={threadTab}
              onChange={setThreadTab}
              counts={tabCounts}
            />

            <div className="flex-1 overflow-y-auto">
              <SmsConversationList
                conversations={visibleConversations}
                selectedKey={selectedKey}
                onSelect={handleSelect}
                loading={loadingList}
                emptyHint={emptyHintForTab(
                  threadTab,
                  sidebarSearch.trim() !== "",
                )}
              />

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
            <SmsChatPane conversation={selectedConversation} />
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
          <SmsChatPane conversation={selectedConversation} />
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

function SidebarSearch({
  inputRef,
  value,
  onChange,
}: {
  inputRef: React.RefObject<HTMLInputElement | null>;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div className="shrink-0 border-b border-slate-200/80 bg-white px-3 py-2 dark:border-slate-800 dark:bg-slate-950">
      <div className="group/search relative flex items-center gap-1.5 rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 transition-colors focus-within:border-[#008f68] focus-within:bg-white focus-within:ring-2 focus-within:ring-[#008f68]/15 dark:border-slate-800 dark:bg-slate-900 dark:focus-within:bg-slate-950">
        <Search
          className="size-3.5 shrink-0 text-slate-400"
          aria-hidden
          strokeWidth={2.25}
        />
        <input
          ref={inputRef}
          type="search"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Search conversations…"
          className="flex-1 bg-transparent text-[12.5px] font-medium text-slate-700 placeholder:text-slate-400 focus:outline-none dark:text-slate-200 dark:placeholder:text-slate-500"
          aria-label="Search SMS conversations"
        />
        {value ? (
          <button
            type="button"
            onClick={() => onChange("")}
            className="inline-flex size-5 shrink-0 items-center justify-center rounded-full text-slate-400 hover:bg-slate-200 hover:text-slate-600 dark:hover:bg-slate-800"
            aria-label="Clear search"
          >
            <X className="size-3" aria-hidden />
          </button>
        ) : (
          <kbd
            aria-hidden
            className="hidden h-[18px] shrink-0 items-center rounded-md border border-slate-200 bg-white px-1.5 font-mono text-[10px] font-semibold leading-none text-slate-400 shadow-sm sm:inline-flex dark:border-slate-700 dark:bg-slate-900 dark:text-slate-500"
          >
            /
          </kbd>
        )}
      </div>
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
  loading,
  onRefresh,
}: {
  total: number;
  loading: boolean;
  onRefresh: () => void;
}) {
  return (
    <div
      className={cn(
        dashboardPanelClass,
        "relative flex flex-wrap items-center justify-between gap-2 px-3 py-2.5 sm:px-4",
      )}
    >
      <span
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#008f68]/45 to-transparent"
      />
      <div className="flex min-w-0 items-center gap-2.5">
        <span className="h-7 w-0.5 shrink-0 rounded-full bg-[#008f68]" />
        <span className="inline-flex size-8 shrink-0 items-center justify-center rounded-lg bg-[#f0faf5] text-[#008f68] ring-1 ring-[#008f68]/15 dark:bg-emerald-500/10 dark:text-emerald-300 dark:ring-emerald-500/30">
          <MessagesSquare
            className="size-4"
            aria-hidden
            strokeWidth={2.25}
          />
        </span>
        <div className="min-w-0">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-400 dark:text-slate-500">
            Audit · SMS
          </p>
          <p className="truncate text-[14px] font-bold leading-tight text-slate-900 dark:text-slate-100">
            Message audit trail
            <span className="ml-2 text-[11px] font-medium text-slate-500 dark:text-slate-400 tabular-nums">
              {total > 0 ? `${total.toLocaleString()} loaded` : ""}
            </span>
          </p>
        </div>
      </div>

      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={onRefresh}
        disabled={loading}
        className="h-8 gap-1.5 rounded-full px-2.5 text-[11px] font-semibold uppercase tracking-wider text-slate-500 hover:bg-slate-100 hover:text-slate-700 disabled:opacity-50 dark:hover:bg-slate-800"
      >
        <RefreshCw
          className={cn("size-3", loading && "animate-spin")}
          aria-hidden
        />
        Refresh
      </Button>
    </div>
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
