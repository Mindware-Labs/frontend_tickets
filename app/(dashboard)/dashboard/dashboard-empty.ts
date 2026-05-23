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
    executiveLiveSnapshot: {
      periodLabel: "Last 30 days",
      calls: { active: 0, queued: 0, ringing: 0 },
      wait: { avgLabel: "—", longestLabel: "—" },
      agents: { available: 0, unavailable: 0, offline: 0, total: 0 },
      tickets: { open: 0, overdue: 0, pending: 0 },
      lineAlerts: [],
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
