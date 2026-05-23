export type DashboardFilterKey =
  | "campaign"
  | "yard"
  | "agent"
  | "line"
  | "disposition"
  | "day"
  | "hour";

export type DashboardFilters = Record<DashboardFilterKey, string | null>;

export const emptyDashboardFilters = (): DashboardFilters => ({
  campaign: null,
  yard: null,
  agent: null,
  line: null,
  disposition: null,
  day: null,
  hour: null,
});

export function hasActiveDashboardFilters(filters: DashboardFilters): boolean {
  return Object.values(filters).some(Boolean);
}

/** @deprecated Use hasActiveDashboardFilters */
export function hasPerformanceDashboardFilters(filters: DashboardFilters): boolean {
  return hasActiveDashboardFilters(filters);
}

export function buildPerformanceFilterQuery(
  filters: DashboardFilters,
  period = "30d",
): string {
  const params = new URLSearchParams({ period });
  if (filters.campaign) params.set("campaignName", filters.campaign);
  if (filters.yard) params.set("yardName", filters.yard);
  if (filters.agent) params.set("agentName", filters.agent);
  if (filters.line) params.set("lineName", filters.line);
  if (filters.disposition) params.set("disposition", filters.disposition);
  if (filters.day) params.set("dayLabel", filters.day);
  if (filters.hour) params.set("hour", filters.hour);
  return params.toString();
}

export function formatHeatmapHourLabel(hourKey: string): string {
  const numeric = Number(hourKey);
  if (!Number.isFinite(numeric)) return hourKey;
  if (numeric === 0) return "12a";
  if (numeric < 12) return `${numeric}a`;
  if (numeric === 12) return "12p";
  return `${numeric - 12}p`;
}

export function filterLabel(key: DashboardFilterKey): string {
  switch (key) {
    case "campaign":
      return "Campaign";
    case "yard":
      return "Yard";
    case "agent":
      return "Agent";
    case "line":
      return "Line";
    case "disposition":
      return "Disposition";
    case "day":
      return "Day";
    case "hour":
      return "Hour";
    default:
      return key;
  }
}

export function filterDisplayValue(
  key: DashboardFilterKey,
  value: string,
): string {
  if (key === "hour") return formatHeatmapHourLabel(value);
  return value;
}
