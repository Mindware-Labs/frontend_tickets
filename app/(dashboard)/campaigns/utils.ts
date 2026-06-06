import { ManagementType } from "../calls/types";
import type { Campaign, YardSummary } from "./types";

export const CAMPAIGN_TYPE_LABELS: Record<string, string> = {
  [ManagementType.ONBOARDING]: "Onboarding",
  [ManagementType.AR]: "AR",
  [ManagementType.OTHER]: "Other",
};

export function getCampaignTypeLabel(tipo: string): string {
  return CAMPAIGN_TYPE_LABELS[tipo] ?? tipo.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

export function getYardLabel(
  campaign: Campaign,
  yards: YardSummary[] = [],
): string {
  return (
    campaign.yarda?.name ||
    yards.find((y) => y.id === campaign.yardaId)?.name ||
    "No yard assigned"
  );
}

export function formatCampaignDate(value?: string | null) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function getTypePillStyles(tipo: ManagementType) {
  switch (tipo) {
    case ManagementType.ONBOARDING:
      return "border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-500/30 dark:bg-blue-500/10 dark:text-blue-300";
    case ManagementType.AR:
      return "border-violet-200 bg-violet-50 text-violet-700 dark:border-violet-500/30 dark:bg-violet-500/10 dark:text-violet-300";
    default:
      return "border-slate-200 bg-slate-100 text-slate-600 dark:border-slate-600 dark:bg-slate-500/15 dark:text-slate-400";
  }
}
