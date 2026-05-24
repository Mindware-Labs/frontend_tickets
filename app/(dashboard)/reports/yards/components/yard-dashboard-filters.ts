export type YardDashboardFilterKey =
  | "disposition"
  | "direction"
  | "priority"
  | "agent"
  | "campaign"
  | "day";

export type YardDashboardFilters = Record<YardDashboardFilterKey, string | null>;

export const emptyYardDashboardFilters = (): YardDashboardFilters => ({
  disposition: null,
  direction: null,
  priority: null,
  agent: null,
  campaign: null,
  day: null,
});

export function hasActiveYardDashboardFilters(
  filters: YardDashboardFilters,
): boolean {
  return Object.values(filters).some(Boolean);
}

export function buildYardFilterQuery(
  filters: YardDashboardFilters,
  start: string,
  end: string,
): string {
  const params = new URLSearchParams({ start, end });
  if (filters.disposition) params.set("disposition", filters.disposition);
  if (filters.direction) params.set("direction", filters.direction);
  if (filters.priority) params.set("priority", filters.priority);
  if (filters.agent) params.set("agentName", filters.agent);
  if (filters.campaign) params.set("campaignName", filters.campaign);
  if (filters.day) params.set("activityDate", filters.day);
  return params.toString();
}

export function yardFilterLabel(key: YardDashboardFilterKey): string {
  switch (key) {
    case "disposition":
      return "Disposition";
    case "direction":
      return "Direction";
    case "priority":
      return "Priority";
    case "agent":
      return "Agent";
    case "campaign":
      return "Campaign";
    case "day":
      return "Day";
    default:
      return key;
  }
}
