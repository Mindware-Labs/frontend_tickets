"use client";

export const tableEmptyCell = (
  <span className="text-[11px] text-slate-400">—</span>
);

export function formatPillLabel(v: string) {
  return v
    .replace(/_/g, " ")
    .toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

export function normalizeEntityKey(value?: string | null) {
  return (value || "").toString().toUpperCase().replace(/\s+/g, "_");
}

export function normalizeSupportStatusKey(status?: string | null) {
  const key = normalizeEntityKey(status);
  if (key === "OPEN" || key === "IN_PROGRESS") return "ACTIVE";
  return key;
}

type PillColors = { dot: string; bg: string; fg: string };

const DISPOSITION_PILL: Record<string, PillColors> = {
  RESOLVED: { dot: "#008f68", bg: "#e6f5f0", fg: "#006d50" },
  CALLBACK_REQUIRED: { dot: "#d97706", bg: "#fef3c7", fg: "#b45309" },
  CALLBACK_SCHEDULED: { dot: "#2563eb", bg: "#eff6ff", fg: "#1d4ed8" },
  NO_ANSWER: { dot: "#94a3b8", bg: "#f1f5f9", fg: "#475569" },
  VOICEMAIL_LEFT: { dot: "#64748b", bg: "#f1f5f9", fg: "#475569" },
  NEW_LEAD: { dot: "#059669", bg: "#d1fae5", fg: "#047857" },
  PROMISE_TO_PAY: { dot: "#7c3aed", bg: "#ede9fe", fg: "#6d28d9" },
  DISPUTE: { dot: "#dc2626", bg: "#fee2e2", fg: "#b91c1c" },
  WRONG_NUMBER: { dot: "#f97316", bg: "#ffedd5", fg: "#c2410c" },
  ENROLLED: { dot: "#008f68", bg: "#e6f5f0", fg: "#006d50" },
  ESCALATED: { dot: "#dc2626", bg: "#fee2e2", fg: "#b91c1c" },
};

const DEFAULT_DISPOSITION: PillColors = {
  dot: "#94a3b8",
  bg: "#f1f5f9",
  fg: "#475569",
};

const SUPPORT_STATUS_PILL: Record<
  string,
  PillColors & { label: string }
> = {
  ACTIVE: { dot: "#008f68", bg: "#e6f5f0", fg: "#006d50", label: "Active" },
  OPEN: { dot: "#008f68", bg: "#e6f5f0", fg: "#006d50", label: "Active" },
  IN_PROGRESS: {
    dot: "#008f68",
    bg: "#e6f5f0",
    fg: "#006d50",
    label: "Active",
  },
  PENDING_FOLLOWUP: {
    dot: "#d97706",
    bg: "#fef3c7",
    fg: "#b45309",
    label: "Follow-up",
  },
  OVERDUE: { dot: "#dc2626", bg: "#fee2e2", fg: "#b91c1c", label: "Overdue" },
  RESOLVED: { dot: "#008f68", bg: "#e6f5f0", fg: "#006d50", label: "Resolved" },
  CLOSED: { dot: "#64748b", bg: "#f1f5f9", fg: "#475569", label: "Closed" },
};

const CALL_STATUS_PILL: Record<string, PillColors & { label: string }> = {
  ...SUPPORT_STATUS_PILL,
  COMPLETED: {
    dot: "#64748b",
    bg: "#f1f5f9",
    fg: "#475569",
    label: "Completed",
  },
  PENDING: {
    dot: "#d97706",
    bg: "#fef3c7",
    fg: "#b45309",
    label: "Pending",
  },
};

const PRIORITY_PILL: Record<string, PillColors> = {
  LOW: { dot: "#94a3b8", bg: "#f1f5f9", fg: "#475569" },
  MEDIUM: { dot: "#f59e0b", bg: "#fef3c7", fg: "#b45309" },
  HIGH: { dot: "#f97316", bg: "#ffedd5", fg: "#c2410c" },
  EMERGENCY: { dot: "#dc2626", bg: "#fee2e2", fg: "#b91c1c" },
};

const DEFAULT_PRIORITY: PillColors = PRIORITY_PILL.LOW;

function EntityPill({
  label,
  colors,
  bold = false,
}: {
  label: string;
  colors: PillColors;
  bold?: boolean;
}) {
  return (
    <span
      className={`inline-flex max-w-full items-center gap-1 rounded-full border px-2 py-0.5 text-[10.5px] leading-tight ${
        bold ? "font-bold leading-none" : "font-semibold"
      }`}
      style={{
        color: colors.fg,
        background: colors.bg,
        borderColor: colors.bg,
      }}
      title={label}
    >
      <span
        className="h-1.5 w-1.5 shrink-0 rounded-full"
        style={{ background: colors.dot }}
      />
      <span className="truncate">{label}</span>
    </span>
  );
}

export function TableDispositionPill({
  disposition,
}: {
  disposition?: string | null;
}) {
  const raw = disposition?.trim();
  if (!raw) return tableEmptyCell;

  const key = normalizeEntityKey(raw);
  const colors = DISPOSITION_PILL[key] || DEFAULT_DISPOSITION;

  return (
    <EntityPill label={formatPillLabel(raw)} colors={colors} />
  );
}

export function TableSupportStatusPill({
  status,
}: {
  status?: string | null;
}) {
  const key = normalizeSupportStatusKey(status);
  const sp = SUPPORT_STATUS_PILL[key] || SUPPORT_STATUS_PILL.CLOSED;

  return <EntityPill label={sp.label} colors={sp} bold />;
}

export function TableCallStatusPill({ status }: { status?: string | null }) {
  const key = normalizeEntityKey(status) || "ACTIVE";
  const sp = CALL_STATUS_PILL[key] || CALL_STATUS_PILL.COMPLETED;

  return <EntityPill label={sp.label} colors={sp} bold />;
}

export function TablePriorityPill({
  priority,
}: {
  priority?: string | null;
}) {
  const raw = priority?.trim();
  if (!raw) return tableEmptyCell;

  const key = normalizeEntityKey(raw);
  const colors = PRIORITY_PILL[key] || DEFAULT_PRIORITY;

  return <EntityPill label={formatPillLabel(raw)} colors={colors} bold />;
}
