export const DISPOSITION_LABEL_COLORS: Record<string, string> = {
  NEW_LEAD: "#008f68",
  BOOKING: "#0284c7",
  GENERAL_INFO: "#4f46e5",
  BILLING: "#d97706",
  SUPPORT: "#0f766e",
  COMPLAINT: "oklch(0.65 0.22 25)",
  TECHNICAL_ISSUE: "oklch(0.68 0.18 180)",
  SPAM: "oklch(0.60 0.10 220)",
  RESOLVED: "oklch(0.65 0.18 160)",
  CALLBACK_REQUIRED: "oklch(0.75 0.18 85)",
  CALLBACK_SCHEDULED: "oklch(0.72 0.16 250)",
  VOICEMAIL_LEFT: "oklch(0.70 0.20 300)",
  NO_ANSWER: "oklch(0.66 0.20 60)",
  PROMISE_TO_PAY: "oklch(0.68 0.18 180)",
  DISPUTE: "oklch(0.65 0.22 25)",
  WRONG_NUMBER: "oklch(0.60 0.10 220)",
  ENROLLED: "oklch(0.65 0.18 160)",
  ESCALATED: "oklch(0.65 0.22 10)",
  UNSPECIFIED: "oklch(0.66 0.20 60)",
  UNKNOWN: "oklch(0.66 0.20 60)",
};

export const DISPOSITION_COLORS = [
  "#008f68",
  "#0284c7",
  "#4f46e5",
  "#d97706",
  "#e11d48",
  "#0f766e",
  "#7c3aed",
  "#64748b",
];

export const STATUS_COLORS: Record<string, string> = {
  OPEN: "oklch(0.72 0.16 250)",
  IN_PROGRESS: "oklch(0.75 0.18 85)",
  PENDING_FOLLOWUP: "oklch(0.65 0.22 25)",
  OVERDUE: "oklch(0.65 0.22 10)",
  RESOLVED: "oklch(0.65 0.18 160)",
  CLOSED: "oklch(0.60 0.10 220)",
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
