export const DISPOSITION_COLORS = [
  "oklch(0.65 0.18 160)",
  "oklch(0.75 0.18 85)",
  "var(--color-primary)",
  "oklch(0.65 0.22 25)",
  "oklch(0.72 0.16 250)",
  "oklch(0.70 0.20 300)",
  "oklch(0.68 0.18 180)",
  "oklch(0.66 0.20 60)",
];

export const STATUS_COLORS: Record<string, string> = {
  OPEN: "oklch(0.65 0.22 25)",
  IN_PROGRESS: "oklch(0.75 0.18 85)",
  CLOSED: "oklch(0.65 0.18 160)",
};

export const DIRECTION_COLORS: Record<string, string> = {
  INBOUND: "oklch(0.72 0.16 250)",
  OUTBOUND: "oklch(0.65 0.18 160)",
  MISSED: "oklch(0.65 0.22 25)",
  TEXT_MESSAGE: "oklch(0.70 0.20 300)",
};

export const PRIORITY_COLORS: Record<string, string> = {
  LOW: "oklch(0.75 0.18 85)",
  MEDIUM: "oklch(0.72 0.16 250)",
  HIGH: "oklch(0.68 0.18 180)",
  EMERGENCY: "oklch(0.65 0.22 25)",
};
