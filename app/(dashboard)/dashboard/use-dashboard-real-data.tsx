"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";

import { useDashboardRealtime } from "@/components/providers/CallSocketProvider";

import {
  executiveMetricTemplates,
  marketingMetricTemplates,
  operationsMetricTemplates,
  scorecardTemplates,
} from "./dashboard-config";
import { createEmptyDashboardData } from "./dashboard-empty";
import {
  formatDuration,
  formatLiveQueueTrend,
  sanitizeLiveQueueWaitSeconds,
} from "./dashboard-format";
import type {
  DashboardDataSet,
  ExecutiveCallIntentMix,
  LiveSnapshot,
} from "./dashboard-types";
import {
  buildPerformanceFilterQuery,
  emptyDashboardFilters,
  hasActiveDashboardFilters,
  type DashboardFilterKey,
  type DashboardFilters,
} from "./dashboard-filters";
import { toneClasses } from "./dashboard-theme";
import type { Metric, ScorecardItem, Tone } from "./types";

type ApiEnvelope<T> = {
  success?: boolean;
  data?: T;
  message?: string;
};

type DashboardStats = {
  generatedAt?: string;
  kpis?: {
    totalCalls?: number;
    totalTickets?: number;
    activeTickets?: number;
    openTickets?: number;
    inProgressTickets?: number;
    closedTickets?: number;
    pendingActions?: number;
    resolutionRate?: number;
    callsLast7Days?: number;
  };
  charts?: {
    callsByDay?: { day: string; calls: number }[];
    ticketsByCampaign?: { name: string; count: number }[];
    ticketsByDisposition?: { name: string; count: number }[];
  };
  recentTickets?: {
    id: number;
    clientName: string;
    campaign: string;
    status: string;
    createdAt: string;
  }[];
};

type PerformanceReport = {
  period?: { label?: string; start?: string; end?: string };
  kpis?: {
    totalCalls?: number;
    closedTickets?: number;
    openTickets?: number;
    missedInboundCalls?: number;
    resolutionRate?: number;
    avgDurationSeconds?: number;
    activeAgents?: number;
  };
  summary?: {
    totalCalls?: number;
    totalAnsweredCalls?: number;
    totalMissedCalls?: number;
    totalInboundCalls?: number;
    totalOutboundCalls?: number;
    totalVoicemailCalls?: number;
    totalTickets?: number;
    openTickets?: number;
    closedTickets?: number;
    pendingTickets?: number;
    overdueTickets?: number;
    totalManualRecords?: number;
    activeAgents?: number;
    avgCallDurationSec?: number;
    overallResolutionRate?: number;
  };
  callsByDay?: {
    date?: string;
    day?: string;
    total?: number;
    answered?: number;
    missed?: number;
    closed?: number;
  }[];
  dispositionBreakdown?: { name?: string; label?: string; value?: number; count?: number }[];
  campaignBreakdown?: { name?: string; label?: string; value?: number; count?: number }[];
  callCampaignOptionBreakdown?: {
    name?: string;
    value?: number;
    count?: number;
  }[];
  agentPerformance?: {
    agentName?: string;
    totalCalls?: number;
    answeredCalls?: number;
    resolvedCalls?: number;
    totalCallDurationSec?: number;
    avgCallDurationSec?: number;
    totalTickets?: number;
    closedTickets?: number;
    resolutionRate?: number;
    callResolutionRate?: number;
    combinedResolutionRate?: number;
  }[];
  peakHourHeatmap?: { day: string; hours: Record<string, number> }[];
  linePerformance?: {
    line?: string;
    total?: number;
    active?: number;
    missed?: number;
    avgWaitSeconds?: number;
  }[];
  yardVolume?: { yard: string; calls: number; outcomes: number }[];
  ticketsByDay?: { day: string; count: number }[];
  ticketRisk?: DashboardDataSet["ticketRisk"];
};

type WallboardReport = {
  generatedAt?: string;
  period?: { label?: string };
  live?: {
    activeCalls?: number;
    queuedCalls?: number;
    ringingCalls?: number;
    missedCalls?: number;
    voicemailCalls?: number;
    avgWaitSeconds?: number;
    longestCurrentWaitSeconds?: number;
  };
  agents?: {
    totalTracked?: number;
    available?: number;
    unavailable?: number;
    offline?: number;
  };
  linePerformance?: {
    line?: string;
    total?: number;
    active?: number;
    missed?: number;
    avgWaitSeconds?: number;
  }[];
  peakHourHeatmap?: { day: string; hours: Record<string, number> }[];
};

type SmsSummary = {
  totals?: {
    sent?: number;
    received?: number;
    delivered?: number;
    failed?: number;
    total?: number;
    replyRate?: number;
    deliveryRate?: number;
  };
  byDay?: {
    day: string;
    sent: number;
    received: number;
    delivered?: number;
    failed?: number;
    replyRate?: number;
  }[];
  byLine?: { line: string; sent: number; received: number; replyRate: number }[];
};

type YardsReport = {
  data?: {
    yard?: { id?: number; name?: string; commonName?: string | null };
    totalTickets?: number;
    openTickets?: number;
    inProgressTickets?: number;
    closedTickets?: number;
  }[];
};

type DashboardSources = {
  stats?: DashboardStats | null;
  performance?: PerformanceReport | null;
  wallboard?: WallboardReport | null;
  sms?: SmsSummary | null;
  yards?: YardsReport | null;
};

type DashboardDataContextValue = {
  data: DashboardDataSet;
  isLoading: boolean;
  isFilterLoading: boolean;
  error: string | null;
  generatedAt: string | null;
  isRealtimeConnected: boolean;
  isRealtimeSyncing: boolean;
  lastRealtimeEventAt: string | null;
  filters: DashboardFilters;
  setFilter: (key: DashboardFilterKey, value: string | null) => void;
  toggleFilter: (key: DashboardFilterKey, value: string) => void;
  toggleHeatmapSlot: (day: string, hourKey: string) => void;
  clearFilters: () => void;
  isFilterActive: (key: DashboardFilterKey, value: string) => boolean;
  isHeatmapSlotActive: (day: string, hourKey: string) => boolean;
  refresh: () => Promise<void>;
};

const DashboardDataContext = createContext<DashboardDataContextValue | null>(
  null,
);

const PERIOD = "30d";
const REALTIME_REFRESH_DEBOUNCE_MS = 700;
const LIVE_ACTIVITY_REFRESH_MS = 5000;
const SOCKET_FALLBACK_REFRESH_MS = 10000;
const IDLE_REFRESH_MS = 30000;
const chartPalette = [
  toneClasses.emerald.chart,
  toneClasses.sky.chart,
  toneClasses.amber.chart,
  toneClasses.rose.chart,
  toneClasses.indigo.chart,
  toneClasses.slate.chart,
];

async function fetchDashboardEndpoint<T>(endpoint: string): Promise<T> {
  const response = await fetch(endpoint, { cache: "no-store" });
  const payload = (await response.json()) as ApiEnvelope<T>;

  if (!response.ok || payload.success === false) {
    throw new Error(payload.message || `Failed to load ${endpoint}`);
  }

  return payload.data as T;
}

function settledValue<T>(result: PromiseSettledResult<T>) {
  return result.status === "fulfilled" ? result.value : null;
}

function settledError(result: PromiseSettledResult<unknown>) {
  return result.status === "rejected"
    ? result.reason?.message || "Dashboard data source failed"
    : null;
}

function numberValue(value: unknown, fallback = 0) {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : fallback;
}

function formatNumber(value: number) {
  return new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 }).format(
    Math.round(value),
  );
}

function percent(numerator: number, denominator: number) {
  if (!denominator) return 0;
  return Math.min(100, Math.round((numerator / denominator) * 100));
}

const SCORECARD_CALL_RESPONSE_TARGET_SEC = 90;
const SCORECARD_AHT_TARGET_SEC = 360;
const SCORECARD_TICKET_BACKLOG_TARGET = 20;
const SCORECARD_RESOLUTION_TARGET_PCT = 86;
const SCORECARD_CALLBACK_TARGET_PCT = 90;
const SCORECARD_UTILIZATION_MIN_PCT = 80;
const SCORECARD_UTILIZATION_MAX_PCT = 88;

/** Lower actual is better. Bar = % of time budget used; score = health vs target. */
function scoreLowerIsBetter(
  actual: number,
  target: number,
): { score: number; progress: number } {
  if (!target || target <= 0) return { score: 0, progress: 0 };
  if (!actual || actual <= 0) return { score: 100, progress: 0 };

  const progress = Math.min(100, Math.round((actual / target) * 100));
  const score =
    actual <= target
      ? 100
      : Math.max(0, 100 - Math.round(((actual - target) / target) * 100));

  return { score, progress };
}

/** Higher actual is better (vs a minimum target). */
function scoreAtLeast(
  actual: number,
  target: number,
): { score: number; progress: number } {
  if (!target || target <= 0) return { score: 0, progress: 0 };
  const progress = Math.min(100, Math.round((actual / target) * 100));
  const score = actual >= target ? 100 : progress;
  return { score, progress };
}

/** Lower count is better (open backlog). */
function scoreAtMost(
  actual: number,
  target: number,
): { score: number; progress: number } {
  if (!target || target <= 0) return { score: 0, progress: 0 };
  if (!actual || actual <= 0) return { score: 100, progress: 0 };

  const progress = Math.min(100, Math.round((actual / target) * 100));
  const score =
    actual <= target
      ? 100
      : Math.max(0, 100 - Math.round(((actual - target) / target) * 100));

  return { score, progress };
}

/** Value should fall inside [min, max] (e.g. utilization band). */
function scoreInRange(
  actual: number,
  min: number,
  max: number,
): { score: number; progress: number } {
  if (!actual || actual <= 0) return { score: 0, progress: 0 };
  if (actual >= min && actual <= max) {
    const bandPosition = (actual - min) / Math.max(max - min, 1);
    return {
      score: 100,
      progress: 60 + Math.round(bandPosition * 40),
    };
  }
  if (actual < min) {
    const progress = Math.round((actual / min) * 60);
    return { score: progress, progress };
  }
  const progress = Math.min(100, Math.round((actual / max) * 100));
  const score = Math.max(0, 100 - Math.round(((actual - max) / max) * 100));
  return { score, progress };
}

function buildCallbackKeptRate(performance?: PerformanceReport | null): {
  actual: string;
  score: number;
  progress: number;
} {
  const dispositions = (performance?.dispositionBreakdown || []).map(
    breakdownValue,
  );
  const promised = dispositions
    .filter((item) => /callback required|callback scheduled/i.test(item.name))
    .reduce((sum, item) => sum + item.value, 0);

  if (!promised) {
    return { actual: "No callbacks in period", score: 0, progress: 0 };
  }

  const overdue = Math.min(
    promised,
    numberValue(performance?.summary?.overdueTickets),
  );
  const kept = Math.max(0, promised - overdue);
  const rate = percent(kept, promised);
  const scored = scoreAtLeast(rate, SCORECARD_CALLBACK_TARGET_PCT);

  return {
    actual: `${rate}% (${formatNumber(kept)}/${formatNumber(promised)} kept)`,
    ...scored,
  };
}

function labelFromDate(value?: string) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

function relativeAge(value?: string) {
  if (!value) return "Recent";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Recent";

  const minutes = Math.max(
    0,
    Math.round((Date.now() - date.getTime()) / 60_000),
  );
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.round(hours / 24)}d ago`;
}

function statusTone(status: string): Tone {
  const normalized = status.toLowerCase();
  if (normalized.includes("overdue") || normalized.includes("urgent")) {
    return "rose";
  }
  if (normalized.includes("progress") || normalized.includes("pending")) {
    return "amber";
  }
  if (normalized.includes("closed") || normalized.includes("resolved")) {
    return "emerald";
  }
  return "sky";
}

function breakdownValue(item: {
  name?: string;
  label?: string;
  value?: number;
  count?: number;
}) {
  return {
    name: item.name || item.label || "Unspecified",
    value: numberValue(item.value ?? item.count),
  };
}

/** Exclude empty / placeholder buckets from campaign-line tables and charts. */
function isUnspecifiedLabel(name?: string | null): boolean {
  const normalized = (name || "").trim().toLowerCase();
  return (
    !normalized ||
    normalized === "unspecified" ||
    normalized === "unassigned" ||
    normalized === "unknown" ||
    normalized === "n/a"
  );
}

function filterNamedCampaigns<T extends { name: string; value: number }>(
  items: T[],
): T[] {
  return items.filter(
    (item) => item.value > 0 && !isUnspecifiedLabel(item.name),
  );
}

function buildMetric(
  template: Omit<Metric, "value" | "detail" | "trend">,
  updates: Partial<Omit<Metric, "icon" | "tone">> & { tone?: Tone },
): Metric {
  return {
    ...template,
    value: updates.value ?? "0",
    detail: updates.detail ?? "No data",
    trend: updates.trend ?? "",
    tone: updates.tone ?? template.tone,
    icon: template.icon,
  };
}

function buildScorecard(
  template: Pick<ScorecardItem, "metric" | "cadence" | "target">,
  updates: Partial<ScorecardItem>,
): ScorecardItem {
  const score = updates.score ?? 0;
  return {
    ...template,
    actual: updates.actual ?? "—",
    score,
    progress: updates.progress ?? score,
    ...updates,
  };
}

function buildOperationsMetrics({
  stats,
  performance,
  wallboard,
}: DashboardSources) {
  const summary = performance?.summary;
  const totalCalls = numberValue(
    summary?.totalAnsweredCalls ?? performance?.kpis?.totalCalls ?? stats?.kpis?.totalCalls,
  );
  const inbound = numberValue(summary?.totalInboundCalls);
  const outbound = numberValue(summary?.totalOutboundCalls);
  const avgWait = numberValue(wallboard?.live?.avgWaitSeconds);
  const queuedCount = numberValue(wallboard?.live?.queuedCalls);
  const longestQueue = sanitizeLiveQueueWaitSeconds(
    wallboard?.live?.longestCurrentWaitSeconds,
  );
  const avgDuration = numberValue(
    summary?.avgCallDurationSec ?? performance?.kpis?.avgDurationSeconds,
  );
  const followUps =
    numberValue(summary?.pendingTickets) +
    numberValue(summary?.overdueTickets) +
    numberValue(stats?.kpis?.pendingActions);
  const periodLabel = performance?.period?.label || "Last 30 days";

  return [
    buildMetric(operationsMetricTemplates[0], {
      value: formatNumber(totalCalls),
      detail: `${formatNumber(inbound)} inbound, ${formatNumber(outbound)} outbound`,
      trend: periodLabel,
      tone: "emerald",
    }),
    buildMetric(operationsMetricTemplates[1], {
      value: formatDuration(avgWait),
      detail: "Average time to answer",
      trend: formatLiveQueueTrend(queuedCount, longestQueue),
      tone: avgWait <= 90 ? "sky" : "amber",
    }),
    buildMetric(operationsMetricTemplates[2], {
      value: formatDuration(avgDuration),
      detail: "Talk time per call",
      trend: avgDuration <= 360 ? "Within handle-time goal" : "Above handle-time goal",
      tone: avgDuration <= 360 ? "emerald" : "amber",
    }),
    buildMetric(operationsMetricTemplates[3], {
      value: formatNumber(followUps),
      detail: `${formatNumber(numberValue(summary?.overdueTickets))} overdue`,
      trend: "Pending and overdue ticket work",
      tone: followUps ? "rose" : "emerald",
    }),
  ];
}

function buildExecutiveMetrics({
  stats,
  performance,
  yards,
}: DashboardSources) {
  const summary = performance?.summary;
  const totalCalls = numberValue(summary?.totalCalls ?? stats?.kpis?.totalCalls);
  const totalTickets = numberValue(
    summary?.totalTickets ?? stats?.kpis?.totalTickets,
  );
  const openTickets =
    numberValue(summary?.openTickets ?? stats?.kpis?.openTickets) +
    numberValue(summary?.pendingTickets) +
    numberValue(summary?.overdueTickets);
  const closedTickets = numberValue(
    summary?.closedTickets ?? stats?.kpis?.closedTickets,
  );
  const yardCount = yards?.data?.length || 0;
  const resolutionRate = numberValue(
    summary?.overallResolutionRate ?? stats?.kpis?.resolutionRate,
  );

  return [
    buildMetric(executiveMetricTemplates[0], {
      value: formatNumber(totalCalls),
      detail: yardCount ? `${yardCount} yards reporting` : "All yards",
      trend: performance?.period?.label || "last 30 days",
      tone: "emerald",
    }),
    buildMetric(executiveMetricTemplates[1], {
      value: formatNumber(openTickets),
      detail: `${formatNumber(numberValue(summary?.overdueTickets))} overdue`,
      trend: "All statuses ",
      tone: openTickets ? "rose" : "emerald",
    }),
    buildMetric(executiveMetricTemplates[2], {
      value: `${percent(totalTickets, totalCalls)}%`,
      detail: `${formatNumber(totalTickets)} tickets / ${formatNumber(totalCalls)} calls`,
      trend: performance?.period?.label || "Last 30 days",
      tone: "indigo",
    }),
    buildMetric(executiveMetricTemplates[3], {
      value: `${resolutionRate}%`,
      detail: `${formatNumber(closedTickets)} closed`,
      trend: "Closed vs total tickets",
      tone: resolutionRate >= 80 ? "sky" : "amber",
    }),
  ];
}

function buildMarketingMetrics({
  performance,
  sms,
  yards,
}: DashboardSources) {
  const summary = performance?.summary;
  const totalCalls = numberValue(summary?.totalCalls);
  const totalAnswered = numberValue(summary?.totalAnsweredCalls);
  const dispositions = performance?.dispositionBreakdown?.map(breakdownValue) || [];
  const outcomeTotal = dispositions
    .filter((item) => /promise|ptp|enroll|paid|resolved/i.test(item.name))
    .reduce((sum, item) => sum + item.value, 0);
  const callsPerYard = yards?.data?.length
    ? Math.round(totalCalls / yards.data.length)
    : 0;

  return [
    buildMetric(marketingMetricTemplates[0], {
      value: `${percent(totalAnswered, totalCalls)}%`,
      detail: `${formatNumber(totalAnswered)} connected / ${formatNumber(totalCalls)} calls`,
      trend: performance?.period?.label || "Last 30 days",
      tone: "emerald",
    }),
    buildMetric(marketingMetricTemplates[1], {
      value: formatNumber(outcomeTotal),
      detail: "PTP, paid, enrolled ...",
      trend: "From call dispositions",
      tone: "indigo",
    }),
    buildMetric(marketingMetricTemplates[2], {
      value: formatNumber(numberValue(sms?.totals?.total)),
      detail: `${formatNumber(numberValue(sms?.totals?.sent))} sent · ${formatNumber(numberValue(sms?.totals?.received))} received`,
      trend: `${numberValue(sms?.totals?.replyRate)}% reply rate`,
      tone: "amber",
    }),
    buildMetric(marketingMetricTemplates[3], {
      value: formatNumber(callsPerYard),
      detail: `In total`,
      trend: `${yards?.data?.length || 0} yards`,
      tone: "sky",
    }),
  ];
}

function buildOperationsTrend({
  stats,
  performance,
}: DashboardSources): DashboardDataSet["operationsTrend"] {
  const ticketByDay = new Map(
    (performance?.ticketsByDay || stats?.charts?.callsByDay || []).map((item) => [
      item.day,
      "count" in item ? item.count : item.calls,
    ]),
  );
  const trend = (performance?.callsByDay || []).map((item) => {
    const day = item.day || labelFromDate(item.date) || "Day";
    const missed = numberValue(item.missed);
    const answered = numberValue(item.answered);
    const total = numberValue(item.total, answered + missed);
    return {
      day,
      inbound: answered,
      outbound: Math.max(total - answered - missed, 0),
      missed,
      tickets: ticketByDay.get(day) || numberValue(item.closed),
    };
  });

  return trend;
}

function buildAgentActivity(
  performance?: PerformanceReport | null,
): DashboardDataSet["agentActivity"] {
  const rows = (performance?.agentPerformance || [])
    .slice(0, 8)
    .map((agent) => {
      const calls = numberValue(agent.totalCalls);
      const callsResolved = Math.min(calls, numberValue(agent.resolvedCalls));
      const totalTickets = numberValue(agent.totalTickets);
      const resolved = Math.min(totalTickets, numberValue(agent.closedTickets));
      const denominator = calls + totalTickets;
      const fallbackCombined = denominator
        ? Math.round(((callsResolved + resolved) / denominator) * 100)
        : 0;
      const fallbackCallResolution = calls
        ? Math.round((callsResolved / calls) * 100)
        : 0;
      return {
        agent: agent.agentName || "Unassigned",
        calls,
        callsResolved,
        callsUnresolved: Math.max(0, calls - callsResolved),
        talk: Math.round(numberValue(agent.totalCallDurationSec) / 60),
        resolved,
        totalTickets,
        ticketsUnresolved: Math.max(0, totalTickets - resolved),
        resolution: numberValue(agent.resolutionRate),
        callResolution:
          numberValue(agent.callResolutionRate) || fallbackCallResolution,
        combinedResolution:
          numberValue(agent.combinedResolutionRate) || fallbackCombined,
      };
    })
    .filter(
      (agent) =>
        agent.calls > 0 ||
        agent.totalTickets > 0 ||
        agent.resolved > 0 ||
        agent.callsResolved > 0,
    );

  return rows;
}

function buildOperationsCallInsights(
  performance?: PerformanceReport | null,
  operationsTrend: DashboardDataSet["operationsTrend"] = [],
): DashboardDataSet["operationsInsights"] {
  const summary = performance?.summary;
  const totalCalls = numberValue(summary?.totalCalls);
  const answered = numberValue(summary?.totalAnsweredCalls);
  const missed = numberValue(summary?.totalMissedCalls);
  const voicemail = numberValue(summary?.totalVoicemailCalls);
  const inbound = numberValue(summary?.totalInboundCalls);
  const outbound = numberValue(summary?.totalOutboundCalls);

  const contactRate = percent(answered, totalCalls);
  const missedRate = percent(missed, totalCalls);

  const peakMissedDay = operationsTrend.reduce(
    (best, row) => (row.missed > best.missed ? row : best),
    { day: "—", missed: 0, inbound: 0, outbound: 0, tickets: 0 },
  );

  const periodLabel = performance?.period?.label || "selected period";

  return [
    {
      label: "Contact rate",
      value: totalCalls ? `${contactRate}%` : "—",
      detail: `${formatNumber(answered)} answered of ${formatNumber(totalCalls)} calls`,
      tone: contactRate >= 80 ? "emerald" : contactRate >= 60 ? "amber" : "rose",
    },
    {
      label: "Missed call rate",
      value: totalCalls ? `${missedRate}%` : "—",
      detail: `${formatNumber(missed)} missed · ${periodLabel}`,
      tone: missedRate <= 10 ? "emerald" : missedRate <= 20 ? "amber" : "rose",
    },
    {
      label: "Peak missed window",
      value: peakMissedDay.missed > 0 ? peakMissedDay.day : "—",
      detail:
        peakMissedDay.missed > 0
          ? `${formatNumber(peakMissedDay.missed)} missed that day`
          : "No missed-call spikes in daily trend",
      tone: peakMissedDay.missed > 0 ? "amber" : "sky",
    },
    {
      label: "Voicemail volume",
      value: formatNumber(voicemail),
      detail: `${formatNumber(inbound)} inbound · ${formatNumber(outbound)} outbound`,
      tone: voicemail > 0 ? "rose" : "emerald",
    },
  ];
}

function isOpaqueAircallLineKey(line: string): boolean {
  const trimmed = line.trim();
  return /^\d{5,}$/.test(trimmed);
}

function buildLinePerformance({
  performance,
  wallboard,
}: DashboardSources): DashboardDataSet["linePerformance"] {
  const avgDuration = numberValue(
    performance?.summary?.avgCallDurationSec ?? performance?.kpis?.avgDurationSeconds,
  );

  if (performance?.linePerformance?.length) {
    return performance.linePerformance
      .filter((line) => {
        const label = (line.line || "").trim();
        return label && !isOpaqueAircallLineKey(label);
      })
      .map((line) => {
        const total = numberValue(line.total);
        const missed = numberValue(line.missed);
        return {
          line: line.line || "Unassigned",
          calls: formatNumber(total),
          response: formatDuration(line.avgWaitSeconds),
          contact: `${percent(total - missed, total)}%`,
          aht: avgDuration ? formatDuration(avgDuration) : "n/a",
          missed: `${percent(missed, total)}%`,
        };
      });
  }

  const rows = (wallboard?.linePerformance || [])
    .filter((line) => {
      const label = (line.line || "").trim();
      return label && !isOpaqueAircallLineKey(label);
    })
    .slice(0, 8)
    .map((line) => {
      const total = numberValue(line.total);
      const missed = numberValue(line.missed);
      return {
        line: line.line || "Unassigned",
        calls: formatNumber(total),
        response: formatDuration(line.avgWaitSeconds),
        contact: `${percent(total - missed, total)}%`,
        aht: avgDuration ? formatDuration(avgDuration) : "n/a",
        missed: `${percent(missed, total)}%`,
      };
    });

  return rows;
}

function buildFollowUpQueue(
  stats?: DashboardStats | null,
): DashboardDataSet["followUpQueue"] {
  const rows = (stats?.recentTickets || []).slice(0, 6).map((ticket) => ({
    id: `TCK-${ticket.id}`,
    customer: ticket.clientName || "Unassigned",
    owner: ticket.campaign || "Unassigned",
    status: ticket.status || "Open",
    due: relativeAge(ticket.createdAt),
    tone: statusTone(ticket.status || "Open"),
  }));

  return rows;
}

function buildScorecards({
  stats,
  performance,
  wallboard,
}: DashboardSources): ScorecardItem[] {
  const summary = performance?.summary;
  const avgWait = numberValue(wallboard?.live?.avgWaitSeconds);
  const avgDuration = numberValue(summary?.avgCallDurationSec);
  const available = numberValue(wallboard?.agents?.available);
  const tracked = numberValue(wallboard?.agents?.totalTracked);
  const activeInPeriod = numberValue(summary?.activeAgents);
  const resolutionRate = numberValue(
    summary?.overallResolutionRate ?? stats?.kpis?.resolutionRate,
  );
  const openTickets =
    numberValue(summary?.openTickets) +
    numberValue(summary?.pendingTickets) +
    numberValue(summary?.overdueTickets);
  const totalTickets = numberValue(summary?.totalTickets);
  const totalAnswered = numberValue(summary?.totalAnsweredCalls);

  const callResponseScored =
    totalAnswered > 0 || avgWait > 0
      ? scoreLowerIsBetter(avgWait, SCORECARD_CALL_RESPONSE_TARGET_SEC)
      : { score: 0, progress: 0 };

  const ahtScored =
    totalAnswered > 0 || avgDuration > 0
      ? scoreLowerIsBetter(avgDuration, SCORECARD_AHT_TARGET_SEC)
      : { score: 0, progress: 0 };

  const utilizationPct = tracked
    ? percent(activeInPeriod, tracked)
    : activeInPeriod > 0
      ? 100
      : 0;
  const utilizationScored = tracked
    ? scoreInRange(
        utilizationPct,
        SCORECARD_UTILIZATION_MIN_PCT,
        SCORECARD_UTILIZATION_MAX_PCT,
      )
    : { score: 0, progress: 0 };

  const callbackScored = buildCallbackKeptRate(performance);
  const backlogScored = scoreAtMost(openTickets, SCORECARD_TICKET_BACKLOG_TARGET);
  const resolutionScored = totalTickets
    ? scoreAtLeast(resolutionRate, SCORECARD_RESOLUTION_TARGET_PCT)
    : { score: 0, progress: 0 };

  return [
    buildScorecard(scorecardTemplates[0], {
      actual:
        totalAnswered > 0 || avgWait > 0
          ? formatDuration(avgWait)
          : "—",
      score: callResponseScored.score,
      progress: callResponseScored.progress,
    }),
    buildScorecard(scorecardTemplates[1], {
      actual:
        totalAnswered > 0 || avgDuration > 0
          ? formatDuration(avgDuration)
          : "—",
      score: ahtScored.score,
      progress: ahtScored.progress,
    }),
    buildScorecard(scorecardTemplates[2], {
      actual: tracked
        ? `${utilizationPct}% (${formatNumber(activeInPeriod)}/${formatNumber(tracked)} active)`
        : "—",
      score: utilizationScored.score,
      progress: utilizationScored.progress,
    }),
    buildScorecard(scorecardTemplates[3], {
      actual: callbackScored.actual,
      score: callbackScored.score,
      progress: callbackScored.progress,
    }),
    buildScorecard(scorecardTemplates[4], {
      actual: `${formatNumber(openTickets)} open`,
      score: backlogScored.score,
      progress: backlogScored.progress,
    }),
    buildScorecard(scorecardTemplates[5], {
      actual: totalTickets ? `${resolutionRate}%` : "—",
      score: resolutionScored.score,
      progress: resolutionScored.progress,
    }),
  ];
}

function buildExecutiveTrend({
  performance,
  stats,
}: DashboardSources): DashboardDataSet["ticketVsCallTrend"] {
  const ticketByDay = new Map(
    (stats?.charts?.callsByDay || []).map((item) => [item.day, item.calls]),
  );
  const rows = (performance?.callsByDay || []).map((item) => {
    const week = item.day || labelFromDate(item.date) || "Day";
    const calls = numberValue(item.total);
    const tickets = ticketByDay.get(week) || numberValue(item.closed);
    return {
      week,
      calls,
      tickets,
      resolved: Math.min(tickets, numberValue(performance?.summary?.closedTickets)),
    };
  });

  return rows;
}

function buildTicketRisk({
  performance,
  yards,
}: DashboardSources): DashboardDataSet["ticketRisk"] {
  if (performance?.ticketRisk?.length) {
    return performance.ticketRisk;
  }

  const rows = (yards?.data || []).slice(0, 8).map((row) => {
    const total = numberValue(row.totalTickets);
    const open =
      numberValue(row.openTickets) + numberValue(row.inProgressTickets);
    const closed = numberValue(row.closedTickets);
    return {
      yard: row.yard?.commonName || row.yard?.name || "Unassigned",
      line: "All lines",
      open,
      overdue: 0,
      response: "n/a",
      resolution: total ? `${formatNumber(closed)} closed` : "No cases",
      rate: `${percent(closed, total)}%`,
    };
  });

  return rows;
}

function buildHeatmap({
  performance,
  wallboard,
}: DashboardSources): Pick<
  DashboardDataSet,
  "heatmapHours" | "heatmapHourKeys" | "peakHourHeatmap"
> {
  const source =
    performance?.peakHourHeatmap?.length
      ? performance.peakHourHeatmap
      : wallboard?.peakHourHeatmap || [];
  const hourSet = new Set<string>();
  source.forEach((row) => {
    Object.keys(row.hours || {}).forEach((hour) => hourSet.add(hour));
  });
  const rawHours = [...hourSet].sort((a, b) => Number(a) - Number(b));

  if (!source.length || !rawHours.length) {
    return {
      heatmapHours: [],
      heatmapHourKeys: [],
      peakHourHeatmap: [],
    };
  }

  const heatmapHours = rawHours.map((hour) => {
    const numeric = Number(hour);
    if (!Number.isFinite(numeric)) return hour;
    if (numeric === 0) return "12a";
    if (numeric < 12) return `${numeric}a`;
    if (numeric === 12) return "12p";
    return `${numeric - 12}p`;
  });

  return {
    heatmapHours,
    heatmapHourKeys: rawHours,
    peakHourHeatmap: source.map((row) => ({
      day: row.day,
      values: rawHours.map((hour) => numberValue(row.hours?.[hour])),
    })),
  };
}

function buildCampaignRates({
  performance,
}: DashboardSources): DashboardDataSet["campaignRates"] {
  const campaigns = filterNamedCampaigns(
    (performance?.campaignBreakdown || []).map(breakdownValue),
  );
  const total = campaigns.reduce((sum, item) => sum + item.value, 0);

  return campaigns.slice(0, 8).map((item) => ({
    campaign: item.name,
    volume: percent(item.value, total),
    contact: 0,
    conversion: 0,
    sms: 0,
    roi: 0,
  }));
}

type CampaignOptionStage = { stage: string; value: number; pct: number };

const ONBOARDING_OPTION_STAGES: { pattern: RegExp; label: string }[] = [
  { pattern: /not registered/i, label: "Not Registered" },
  { pattern: /^registered$/i, label: "Registered" },
  { pattern: /paid with/i, label: "Paid With LL" },
  { pattern: /canceled/i, label: "Canceled" },
];

const AR_OPTION_STAGES: { pattern: RegExp; label: string }[] = [
  { pattern: /^not paid$/i, label: "Not Paid" },
  { pattern: /not paid check/i, label: "Not Paid Check" },
  { pattern: /offline payment/i, label: "Offline Payment" },
  { pattern: /^paid$/i, label: "Paid" },
  { pattern: /balance/i, label: "Balance 0" },
  { pattern: /moved out/i, label: "Moved Out" },
  { pattern: /do not call/i, label: "Do Not Call" },
];

function funnelStage(
  stage: string,
  value: number,
  base: number,
): CampaignOptionStage {
  const safeBase = Math.max(base, 1);
  return {
    stage,
    value,
    pct: percent(value, safeBase),
  };
}

function buildCampaignOptionFunnel(
  options: { name: string; value: number }[],
  orderedStages: { pattern: RegExp; label: string }[],
): CampaignOptionStage[] {
  const namedOptions = filterNamedCampaigns(options);
  if (!namedOptions.length) return [];

  const total = namedOptions.reduce((sum, item) => sum + item.value, 0);
  const consumed = new Set<string>();
  const rows: CampaignOptionStage[] = [];

  for (const { pattern, label } of orderedStages) {
    const match = namedOptions.find(
      (item) => pattern.test(item.name) && !consumed.has(item.name),
    );
    if (match) consumed.add(match.name);
    rows.push(funnelStage(label, match?.value ?? 0, total));
  }

  namedOptions
    .filter((item) => !consumed.has(item.name) && item.value > 0)
    .forEach((item) => {
      rows.push(funnelStage(item.name, item.value, total));
    });

  return rows;
}

function isOnboardingCampaignOption(name: string): boolean {
  return /not registered|^registered$|paid with|canceled/i.test(name);
}

function isArCampaignOption(name: string): boolean {
  return /not paid|offline payment|^paid$|balance|moved out|do not call/i.test(
    name,
  );
}

function buildFunnels(
  performance?: PerformanceReport | null,
): Pick<DashboardDataSet, "leadFunnel" | "arFunnel"> {
  const campaignOptions = filterNamedCampaigns(
    performance?.callCampaignOptionBreakdown?.map(breakdownValue) || [],
  );

  const onboardingOptions = campaignOptions.filter((item) =>
    isOnboardingCampaignOption(item.name),
  );
  const arOptions = campaignOptions.filter(
    (item) =>
      isArCampaignOption(item.name) && !isOnboardingCampaignOption(item.name),
  );

  return {
    leadFunnel: buildCampaignOptionFunnel(
      onboardingOptions,
      ONBOARDING_OPTION_STAGES,
    ),
    arFunnel: buildCampaignOptionFunnel(arOptions, AR_OPTION_STAGES),
  };
}

function buildSmsTrend(sms?: SmsSummary | null): DashboardDataSet["smsTrend"] {
  const rows = (sms?.byDay || []).map((item) => ({
    week: labelFromDate(item.day) || item.day,
    sent: numberValue(item.sent),
    replies: numberValue(item.received),
    rate:
      item.replyRate ??
      percent(numberValue(item.received), numberValue(item.sent)),
  }));

  return rows;
}

function buildDispositionBreakdown(
  performance?: PerformanceReport | null,
): DashboardDataSet["dispositionBreakdown"] {
  const rows = (performance?.dispositionBreakdown || [])
    .map(breakdownValue)
    .filter((item) => item.value > 0 && !isUnspecifiedLabel(item.name))
    .map((item, index) => ({
      name: item.name,
      value: item.value,
      color: chartPalette[index % chartPalette.length],
    }));

  return rows;
}

function buildYardVolume({
  performance,
  yards,
}: DashboardSources): DashboardDataSet["yardVolume"] {
  const rows = (
    performance?.yardVolume?.length
      ? performance.yardVolume
      : (yards?.data || []).map((row) => ({
          yard: row.yard?.commonName || row.yard?.name || "Unassigned",
          calls: numberValue(row.totalTickets),
          outcomes: numberValue(row.closedTickets),
        }))
  ).filter((row) => row.calls > 0 && !isUnspecifiedLabel(row.yard));

  return rows.slice(0, 8);
}

function buildExecutiveCallIntentMix(
  performance?: PerformanceReport | null,
): ExecutiveCallIntentMix {
  const periodLabel = performance?.period?.label || "Last 30 days";
  const items = (performance?.callCampaignOptionBreakdown || []).map(
    breakdownValue,
  );
  const totalClassified = items.reduce((sum, item) => sum + item.value, 0);
  const rows = items
    .sort((a, b) => b.value - a.value)
    .slice(0, 8)
    .map((item) => ({
      reason: item.name,
      calls: item.value,
      share: totalClassified
        ? Math.round((item.value / totalClassified) * 100)
        : 0,
    }));

  return {
    periodLabel,
    totalClassified,
    topReason: rows[0]?.reason ?? null,
    rows,
  };
}

function buildLiveSnapshot(wallboard?: WallboardReport | null): LiveSnapshot {
  const live = wallboard?.live;
  const agents = wallboard?.agents;
  const active = numberValue(live?.activeCalls);
  const queued = numberValue(live?.queuedCalls);
  const ringing = numberValue(live?.ringingCalls);
  const longestWaitSec = sanitizeLiveQueueWaitSeconds(
    live?.longestCurrentWaitSeconds,
  );
  return {
    hasLive: active + queued + ringing > 0,
    active,
    queued,
    ringing,
    longestWaitLabel: queued ? formatDuration(longestWaitSec) : "—",
    available: numberValue(agents?.available),
    totalAgents: numberValue(agents?.totalTracked),
  };
}

function buildMarketingUseCases(
  performance?: PerformanceReport | null,
): DashboardDataSet["marketingUseCases"] {
  return filterNamedCampaigns(
    (performance?.campaignBreakdown || []).map(breakdownValue),
  ).map((item) => ({
    campaign: item.name,
    measures: `${formatNumber(item.value)} calls in period`,
    source: "Campaign call volume",
  }));
}

function matchesRecordDayHour(
  createdAt: string | undefined,
  filters: DashboardFilters,
): boolean {
  if (!createdAt) return !filters.day && !filters.hour;
  const date = new Date(createdAt);
  if (Number.isNaN(date.getTime())) return false;
  const day = date.toLocaleDateString("en-US", {
    weekday: "short",
    timeZone: "America/Santo_Domingo",
  });
  const hour = date
    .toLocaleTimeString("en-US", {
      hour: "numeric",
      hour12: false,
      timeZone: "America/Santo_Domingo",
    })
    .padStart(2, "0");
  if (filters.day && day !== filters.day) return false;
  if (filters.hour && hour !== filters.hour) return false;
  return true;
}

function applyClientDashboardFilters(
  sources: DashboardSources,
  filters: DashboardFilters,
): DashboardSources {
  let next = sources;

  if (filters.campaign && next.stats?.recentTickets?.length) {
    next = {
      ...next,
      stats: {
        ...next.stats!,
        recentTickets: next.stats!.recentTickets!.filter(
          (ticket) => ticket.campaign === filters.campaign,
        ),
      },
    };
  }

  if (filters.yard && next.yards?.data?.length) {
    const yard = filters.yard;
    next = {
      ...next,
      yards: {
        data: next.yards!.data!.filter(
          (row) => row.yard?.commonName === yard || row.yard?.name === yard,
        ),
      },
    };
  }

  if (next.stats?.recentTickets?.length && (filters.day || filters.hour)) {
    next = {
      ...next,
      stats: {
        ...next.stats!,
        recentTickets: next.stats!.recentTickets!.filter((ticket) =>
          matchesRecordDayHour(ticket.createdAt, filters),
        ),
      },
    };
  }

  if (filters.day && next.sms?.byDay?.length) {
    next = {
      ...next,
      sms: {
        ...next.sms!,
        byDay: next.sms!.byDay!.filter(
          (row) =>
            labelFromDate(row.day) === filters.day || row.day === filters.day,
        ),
      },
    };
  }

  return next;
}

function buildDashboardData(sources: DashboardSources): DashboardDataSet {
  const heatmap = buildHeatmap(sources);
  const funnels = buildFunnels(sources.performance);
  const executiveCallKpis = buildScorecards(sources);
  const operationsTrend = buildOperationsTrend(sources);

  return {
    operationsMetrics: buildOperationsMetrics(sources),
    executiveMetrics: buildExecutiveMetrics(sources),
    marketingMetrics: buildMarketingMetrics(sources),
    operationsTrend,
    operationsInsights: buildOperationsCallInsights(
      sources.performance,
      operationsTrend,
    ),
    agentActivity: buildAgentActivity(sources.performance),
    linePerformance: buildLinePerformance(sources),
    followUpQueue: buildFollowUpQueue(sources.stats),
    executiveCallKpis,
    ticketVsCallTrend: buildExecutiveTrend(sources),
    ticketRisk: buildTicketRisk(sources),
    heatmapHours: heatmap.heatmapHours,
    peakHourHeatmap: heatmap.peakHourHeatmap,
    executiveCallIntentMix: buildExecutiveCallIntentMix(sources.performance),
    liveSnapshot: buildLiveSnapshot(sources.wallboard),
    campaignRates: buildCampaignRates(sources),
    leadFunnel: funnels.leadFunnel,
    arFunnel: funnels.arFunnel,
    smsTrend: buildSmsTrend(sources.sms),
    dispositionBreakdown: buildDispositionBreakdown(sources.performance),
    yardVolume: buildYardVolume(sources),
    marketingUseCases: buildMarketingUseCases(sources.performance),
    heatmapHourKeys: heatmap.heatmapHourKeys,
  };
}

export function DashboardDataProvider({ children }: { children: ReactNode }) {
  const realtime = useDashboardRealtime();
  const [baseSources, setBaseSources] = useState<DashboardSources>({});
  const [filteredPerformance, setFilteredPerformance] =
    useState<PerformanceReport | null>(null);
  const [filters, setFilters] = useState<DashboardFilters>(emptyDashboardFilters);
  const [isLoading, setIsLoading] = useState(true);
  const [isFilterLoading, setIsFilterLoading] = useState(false);
  const [isRealtimeSyncing, setIsRealtimeSyncing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [generatedAt, setGeneratedAt] = useState<string | null>(null);
  const realtimeRefreshTimerRef = useRef<ReturnType<typeof setTimeout> | null>(
    null,
  );
  const lastRealtimeVersionRef = useRef(0);

  const loadDashboardSources = useCallback(
    async ({
      resetFilters = false,
      showLoading = false,
      realtimeSync = false,
    }: {
      resetFilters?: boolean;
      showLoading?: boolean;
      realtimeSync?: boolean;
    } = {}) => {
      if (showLoading) setIsLoading(true);
      if (realtimeSync) setIsRealtimeSyncing(true);
      setError(null);

      if (resetFilters) {
        setFilters(emptyDashboardFilters());
        setFilteredPerformance(null);
      }

      try {
        const [
          statsResult,
          performanceResult,
          wallboardResult,
          smsResult,
          yardsResult,
        ] = await Promise.allSettled([
          fetchDashboardEndpoint<DashboardStats>("/api/dashboard/stats"),
          fetchDashboardEndpoint<PerformanceReport>(
            `/api/reports/performance?period=${PERIOD}`,
          ),
          fetchDashboardEndpoint<WallboardReport>(
            `/api/aircall-analytics/wallboard?period=${PERIOD}`,
          ),
          fetchDashboardEndpoint<SmsSummary>(
            `/api/aircall-analytics/sms/summary?period=${PERIOD}`,
          ),
          fetchDashboardEndpoint<YardsReport>(
            `/api/reports/yards?period=${PERIOD}`,
          ),
        ]);

        const sources: DashboardSources = {
          stats: settledValue(statsResult),
          performance: settledValue(performanceResult),
          wallboard: settledValue(wallboardResult),
          sms: settledValue(smsResult),
          yards: settledValue(yardsResult),
        };
        const errors = [
          statsResult,
          performanceResult,
          wallboardResult,
          smsResult,
          yardsResult,
        ]
          .map(settledError)
          .filter((message): message is string => !!message);

        setBaseSources(sources);
        setGeneratedAt(
          sources.wallboard?.generatedAt ||
            sources.stats?.generatedAt ||
            new Date().toISOString(),
        );
        setError(errors.length ? errors[0] : null);
      } finally {
        if (showLoading) setIsLoading(false);
        if (realtimeSync) setIsRealtimeSyncing(false);
      }
    },
    [],
  );

  const refresh = useCallback(
    () => loadDashboardSources({ resetFilters: true, showLoading: true }),
    [loadDashboardSources],
  );

  useEffect(() => {
    void refresh();
  }, [refresh]);

  useEffect(() => {
    if (!realtime.version) return;
    if (lastRealtimeVersionRef.current === realtime.version) return;

    lastRealtimeVersionRef.current = realtime.version;

    if (realtimeRefreshTimerRef.current) {
      clearTimeout(realtimeRefreshTimerRef.current);
    }

    realtimeRefreshTimerRef.current = setTimeout(() => {
      void loadDashboardSources({ realtimeSync: true });
    }, REALTIME_REFRESH_DEBOUNCE_MS);

    return () => {
      if (realtimeRefreshTimerRef.current) {
        clearTimeout(realtimeRefreshTimerRef.current);
      }
    };
  }, [loadDashboardSources, realtime.version]);

  const hasLiveActivity = useMemo(() => {
    const live = baseSources.wallboard?.live;
    return (
      numberValue(live?.activeCalls) +
        numberValue(live?.queuedCalls) +
        numberValue(live?.ringingCalls) >
      0
    );
  }, [
    baseSources.wallboard?.live?.activeCalls,
    baseSources.wallboard?.live?.queuedCalls,
    baseSources.wallboard?.live?.ringingCalls,
  ]);

  useEffect(() => {
    if (isLoading) return;

    const intervalMs = realtime.connected
      ? hasLiveActivity
        ? LIVE_ACTIVITY_REFRESH_MS
        : IDLE_REFRESH_MS
      : SOCKET_FALLBACK_REFRESH_MS;

    const intervalId = setInterval(() => {
      void loadDashboardSources({ realtimeSync: true });
    }, intervalMs);

    return () => clearInterval(intervalId);
  }, [hasLiveActivity, isLoading, loadDashboardSources, realtime.connected]);

  useEffect(() => {
    if (!baseSources.performance) return;

    if (!hasActiveDashboardFilters(filters)) {
      setFilteredPerformance(null);
      setIsFilterLoading(false);
      return;
    }

    let cancelled = false;
    setIsFilterLoading(true);

    const query = buildPerformanceFilterQuery(filters, PERIOD);
    fetchDashboardEndpoint<PerformanceReport>(`/api/reports/performance?${query}`)
      .then((performance) => {
        if (!cancelled) setFilteredPerformance(performance);
      })
      .catch(() => {
        if (!cancelled) setFilteredPerformance(null);
      })
      .finally(() => {
        if (!cancelled) setIsFilterLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [filters, baseSources.performance]);

  const mergedSources = useMemo(() => {
    const sources: DashboardSources = {
      ...baseSources,
      performance: filteredPerformance ?? baseSources.performance,
    };
    return applyClientDashboardFilters(sources, filters);
  }, [baseSources, filteredPerformance, filters]);

  const data = useMemo(() => buildDashboardData(mergedSources), [mergedSources]);

  const setFilter = useCallback((key: DashboardFilterKey, value: string | null) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  }, []);

  const toggleFilter = useCallback((key: DashboardFilterKey, value: string) => {
    setFilters((prev) => ({
      ...prev,
      [key]: prev[key] === value ? null : value,
    }));
  }, []);

  const clearFilters = useCallback(() => {
    setFilters(emptyDashboardFilters());
  }, []);

  const toggleHeatmapSlot = useCallback((day: string, hourKey: string) => {
    setFilters((prev) => {
      if (prev.day === day && prev.hour === hourKey) {
        return { ...prev, day: null, hour: null };
      }
      return { ...prev, day, hour: hourKey };
    });
  }, []);

  const isFilterActive = useCallback(
    (key: DashboardFilterKey, value: string) => filters[key] === value,
    [filters],
  );

  const isHeatmapSlotActive = useCallback(
    (day: string, hourKey: string) =>
      filters.day === day && filters.hour === hourKey,
    [filters],
  );

  const value = useMemo(
    () => ({
      data,
      isLoading,
      isFilterLoading,
      error,
      generatedAt,
      isRealtimeConnected: realtime.connected,
      isRealtimeSyncing,
      lastRealtimeEventAt: realtime.lastEvent?.timestamp ?? null,
      filters,
      setFilter,
      toggleFilter,
      toggleHeatmapSlot,
      clearFilters,
      isFilterActive,
      isHeatmapSlotActive,
      refresh,
    }),
    [
      clearFilters,
      data,
      error,
      filters,
      generatedAt,
      isFilterActive,
      isHeatmapSlotActive,
      isFilterLoading,
      isLoading,
      isRealtimeSyncing,
      refresh,
      realtime.connected,
      realtime.lastEvent?.timestamp,
      setFilter,
      toggleFilter,
      toggleHeatmapSlot,
    ],
  );

  return (
    <DashboardDataContext.Provider value={value}>
      {children}
    </DashboardDataContext.Provider>
  );
}

export function useSupportDashboardData() {
  const context = useContext(DashboardDataContext);
  if (!context) {
    throw new Error(
      "useSupportDashboardData must be used inside DashboardDataProvider",
    );
  }
  return context;
}
