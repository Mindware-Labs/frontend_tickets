import {
  AlertTriangle,
  BarChart3,
  CheckCircle2,
  ClipboardList,
  Clock3,
  MapPin,
  MessageSquare,
  PhoneCall,
  Radio,
  Target,
  Timer,
  TrendingUp,
} from "lucide-react";

import type { Metric, ScorecardItem } from "./types";

/** Labels and icons only — values always come from API builders. */
export const operationsMetricTemplates: Omit<Metric, "value" | "detail" | "trend">[] = [
  { label: "Calls answered", tone: "emerald", icon: PhoneCall },
  { label: "Avg queue wait", tone: "sky", icon: Clock3 },
  { label: "Avg handle time", tone: "amber", icon: Timer },
  { label: "Follow-ups due", tone: "rose", icon: AlertTriangle },
];

export const executiveMetricTemplates: Omit<Metric, "value" | "detail" | "trend">[] = [
  { label: "Call volume", tone: "emerald", icon: Radio },
  { label: "Open tickets", tone: "rose", icon: ClipboardList },
  { label: "Ticket / call ratio", tone: "indigo", icon: BarChart3 },
  { label: "Resolution rate", tone: "sky", icon: CheckCircle2 },
];

export const marketingMetricTemplates: Omit<Metric, "value" | "detail" | "trend">[] = [
  { label: "Contact rate", tone: "emerald", icon: Target },
  { label: "PTP + enrollment outcomes", tone: "indigo", icon: TrendingUp },
  { label: "SMS messages", tone: "amber", icon: MessageSquare },
  { label: "Calls per yard", tone: "sky", icon: MapPin },
];

export const scorecardTemplates: Pick<ScorecardItem, "metric" | "cadence" | "target">[] = [
  { metric: "Call response time", cadence: "Daily", target: "< 1m 30s" },
  { metric: "Average handle time by line", cadence: "Weekly", target: "< 6m" },
  { metric: "Agent utilization rate", cadence: "Weekly", target: "80-88%" },
  { metric: "Callback promise kept rate", cadence: "Weekly", target: "90%+" },
  { metric: "Ticket response time", cadence: "Daily", target: "< 20m" },
  { metric: "Resolution rate by line", cadence: "Monthly", target: "86%" },
];

export const EMPTY_LIVE_WALLBOARD = [
  { label: "Active calls", detail: "No live data", tone: "emerald" as const },
  { label: "Queued callbacks", detail: "No live data", tone: "amber" as const },
  { label: "Agents available", detail: "No live data", tone: "sky" as const },
  { label: "Missed (period)", detail: "No live data", tone: "rose" as const },
] as const;
