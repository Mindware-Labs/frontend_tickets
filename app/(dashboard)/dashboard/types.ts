import type { LucideIcon } from "lucide-react";

export type Tone = "emerald" | "sky" | "amber" | "rose" | "indigo" | "slate";

export type Metric = {
  label: string;
  value: string;
  detail: string;
  trend: string;
  tone: Tone;
  icon: LucideIcon;
};

export type ScorecardItem = {
  metric: string;
  cadence: string;
  actual: string;
  target: string;
  score: number;
};
