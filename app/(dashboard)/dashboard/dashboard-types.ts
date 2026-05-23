import type { Tone } from "./types";
import type { Metric, ScorecardItem } from "./types";

export type OperationsInsightItem = {
  label: string;
  value: string;
  detail: string;
  tone: Tone;
};

export type MarketingUseCaseRow = {
  campaign: string;
  measures: string;
  source: string;
};

export type LeadershipCadenceRow = {
  group: string;
  metric: string;
  cadence: string;
  source: string;
};

export type DashboardDataSet = {
  operationsMetrics: Metric[];
  executiveMetrics: Metric[];
  marketingMetrics: Metric[];
  operationsTrend: {
    day: string;
    inbound: number;
    outbound: number;
    missed: number;
    tickets: number;
  }[];
  agentActivity: {
    agent: string;
    calls: number;
    talk: number;
    resolution: number;
  }[];
  operationsInsights: OperationsInsightItem[];
  linePerformance: {
    line: string;
    calls: string;
    response: string;
    contact: string;
    aht: string;
    missed: string;
  }[];
  followUpQueue: {
    id: string;
    customer: string;
    owner: string;
    status: string;
    due: string;
    tone: Tone;
  }[];
  executiveCallKpis: ScorecardItem[];
  ticketVsCallTrend: {
    week: string;
    calls: number;
    tickets: number;
    resolved: number;
  }[];
  ticketRisk: {
    yard: string;
    line: string;
    open: number;
    overdue: number;
    response: string;
    resolution: string;
    rate: string;
  }[];
  heatmapHours: string[];
  /** Raw hour keys (00–23) aligned with heatmapHours display labels. */
  heatmapHourKeys: string[];
  peakHourHeatmap: { day: string; values: number[] }[];
  leadershipCadence: LeadershipCadenceRow[];
  campaignRates: {
    campaign: string;
    /** Share of named-campaign call volume in the period (0–100). */
    volume: number;
    contact: number;
    conversion: number;
    sms: number;
    roi: number;
  }[];
  leadFunnel: { stage: string; value: number; pct: number }[];
  arFunnel: { stage: string; value: number; pct: number }[];
  smsTrend: {
    week: string;
    sent: number;
    replies: number;
    rate: number;
  }[];
  dispositionBreakdown: { name: string; value: number; color: string }[];
  yardVolume: { yard: string; calls: number; outcomes: number }[];
  marketingUseCases: MarketingUseCaseRow[];
};
