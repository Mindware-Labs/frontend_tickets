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
  /** Health 0–100 (drives bar color). */
  score: number;
  /** Bar fill 0–100; when omitted, uses `score`. */
  progress?: number;
};
