export type DashboardFilterKey =
  | "campaign"
  | "yard"
  | "agent"
  | "line"
  | "disposition"
  | "callReason"
  | "day"
  | "hour";

export type DashboardFilters = Record<DashboardFilterKey, string | null>;

const DASHBOARD_TIME_ZONE = "America/Santo_Domingo";
const DASHBOARD_DATE_FORMATTER = new Intl.DateTimeFormat("en-US", {
  timeZone: DASHBOARD_TIME_ZONE,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

function getDashboardDateKey(date = new Date()): string {
  const parts = DASHBOARD_DATE_FORMATTER.formatToParts(date);
  const year = parts.find((part) => part.type === "year")?.value;
  const month = parts.find((part) => part.type === "month")?.value;
  const day = parts.find((part) => part.type === "day")?.value;

  if (!year || !month || !day) {
    return date.toISOString().split("T")[0];
  }

  return `${year}-${month}-${day}`;
}

export const emptyDashboardFilters = (): DashboardFilters => ({
  campaign: null,
  yard: null,
  agent: null,
  line: null,
  disposition: null,
  callReason: null,
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
  const params = buildDashboardPeriodQueryParams(period);
  if (filters.campaign) params.set("campaignName", filters.campaign);
  if (filters.yard) params.set("yardName", filters.yard);
  if (filters.agent) params.set("agentName", filters.agent);
  if (filters.line) params.set("lineName", filters.line);
  if (filters.disposition) params.set("disposition", filters.disposition);
  if (filters.callReason) params.set("callReason", filters.callReason);
  if (filters.day) params.set("dayLabel", filters.day);
  if (filters.hour) params.set("hour", filters.hour);
  return params.toString();
}

export function createCustomDashboardPeriod(start: string, end: string): string {
  return `custom:${start}:${end}`;
}

export function parseCustomDashboardPeriod(period: string):
  | { start: string; end: string }
  | null {
  const [, start, end] = period.split(":");
  if (!period.startsWith("custom:") || !start || !end) return null;
  return { start, end };
}

export function buildDashboardPeriodQueryParams(period: string): URLSearchParams {
  const customPeriod = parseCustomDashboardPeriod(period);
  if (customPeriod) {
    return new URLSearchParams(customPeriod);
  }

  if (period === "all") {
    const todayStr = getDashboardDateKey();
    return new URLSearchParams({ start: "2026-01-01", end: todayStr });
  }

  if (period === "today") {
    const todayStr = getDashboardDateKey();
    return new URLSearchParams({ start: todayStr, end: todayStr });
  }

  return new URLSearchParams({ period });
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
    case "callReason":
      return "Call reason";
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
