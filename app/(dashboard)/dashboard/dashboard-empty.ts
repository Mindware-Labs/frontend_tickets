import {
  executiveMetricTemplates,
  marketingMetricTemplates,
  operationsMetricTemplates,
  scorecardTemplates,
} from "./dashboard-config";
import type { DashboardDataSet } from "./dashboard-types";
import type { Metric, ScorecardItem } from "./types";

function metricFromTemplate(
  template: Omit<Metric, "value" | "detail" | "trend">,
): Metric {
  return {
    ...template,
    value: "0",
    detail: "No data yet",
    trend: "Waiting for API",
  };
}

function scorecardFromTemplate(
  template: Pick<ScorecardItem, "metric" | "cadence" | "target">,
): ScorecardItem {
  return {
    ...template,
    actual: "—",
    score: 0,
  };
}

export function createEmptyDashboardData(): DashboardDataSet {
  return {
    operationsMetrics: operationsMetricTemplates.map(metricFromTemplate),
    executiveMetrics: executiveMetricTemplates.map(metricFromTemplate),
    marketingMetrics: marketingMetricTemplates.map(metricFromTemplate),
    operationsTrend: [],
    agentActivity: [],
    operationsInsights: [],
    linePerformance: [],
    followUpQueue: [],
    executiveCallKpis: scorecardTemplates.map(scorecardFromTemplate),
    ticketVsCallTrend: [],
    ticketRisk: [],
    heatmapHours: [],
    heatmapHourKeys: [],
    peakHourHeatmap: [],
    executiveCallIntentMix: {
      periodLabel: "Last 30 days",
      totalClassified: 0,
      topReason: null,
      rows: [],
    },
    liveSnapshot: {
      hasLive: false,
      active: 0,
      queued: 0,
      ringing: 0,
      longestWaitLabel: "—",
      available: 0,
      totalAgents: 0,
    },
    campaignRates: [],
    leadFunnel: [],
    arFunnel: [],
    smsTrend: [],
    dispositionBreakdown: [],
    yardVolume: [],
    marketingUseCases: [],
  };
}
