import { ArrowRight } from "lucide-react";

import { cn } from "@/lib/utils";
import { formatLabel } from "./record-formatters";

export const recordTableHeadClass =
  "py-2 pr-2 text-[10px] font-semibold uppercase tracking-wider text-slate-400 dark:text-neutral-500";

export const recordTableCellClass = "py-1.5 pr-2 align-middle";

export function getRecordStatusClass(status?: string | null) {
  const normalized = (status || "").toUpperCase();
  if (
    normalized === "OPEN" ||
    normalized === "ACTIVE" ||
    normalized === "NEW"
  ) {
    return "border-blue-200/80 bg-blue-50 text-blue-700 dark:border-blue-800 dark:bg-blue-950/40 dark:text-blue-300";
  }
  if (
    normalized === "IN_PROGRESS" ||
    normalized === "PENDING" ||
    normalized === "PENDING_FOLLOWUP"
  ) {
    return "border-amber-200/80 bg-amber-50 text-amber-800 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-300";
  }
  if (
    normalized === "CLOSED" ||
    normalized === "RESOLVED" ||
    normalized === "COMPLETED"
  ) {
    return "border-emerald-200/80 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300";
  }
  if (normalized === "OVERDUE") {
    return "border-rose-200/80 bg-rose-50 text-rose-700 dark:border-rose-800 dark:bg-rose-950/40 dark:text-rose-300";
  }
  return "border-slate-200/80 bg-slate-50 text-slate-600 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-400";
}

export function getRecordPriorityClass(priority?: string | null) {
  const normalized = (priority || "").toUpperCase();
  if (normalized === "HIGH" || normalized === "URGENT") {
    return "border-rose-200/80 bg-rose-50 text-rose-700 dark:border-rose-800 dark:bg-rose-950/40 dark:text-rose-300";
  }
  if (normalized === "MEDIUM" || normalized === "NORMAL") {
    return "border-orange-200/80 bg-orange-50 text-orange-800 dark:border-orange-800 dark:bg-orange-950/40 dark:text-orange-300";
  }
  if (normalized === "LOW") {
    return "border-slate-200/80 bg-slate-50 text-slate-600 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-400";
  }
  return "border-slate-200/80 bg-slate-50/80 text-slate-500 dark:border-neutral-700 dark:bg-neutral-900/60 dark:text-neutral-400";
}

export function RecordIdChip({ id }: { id: number | string }) {
  return (
    <span className="inline-flex h-5 min-w-[34px] items-center justify-center rounded-md bg-slate-100/90 px-1.5 font-mono text-[10px] font-medium text-slate-500 ring-1 ring-slate-200/80 dark:bg-neutral-900 dark:text-neutral-400 dark:ring-neutral-700">
      #{id}
    </span>
  );
}

export function RecordStatusBadge({
  status,
  pulse = false,
}: {
  status?: string | null;
  pulse?: boolean;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-semibold",
        getRecordStatusClass(status),
      )}
    >
      {pulse ? (
        <span className="relative flex size-1.5">
          <span className="absolute inline-flex size-full animate-ping rounded-full bg-current opacity-60" />
          <span className="relative inline-flex size-1.5 rounded-full bg-current" />
        </span>
      ) : (
        <span className="size-1.5 rounded-full bg-current opacity-80" />
      )}
      {formatLabel(status)}
    </span>
  );
}

export function RecordPriorityBadge({ priority }: { priority?: string | null }) {
  if (!priority) {
    return <span className="text-[11px] text-slate-400 dark:text-neutral-500">—</span>;
  }

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-medium",
        getRecordPriorityClass(priority),
      )}
    >
      {formatLabel(priority)}
    </span>
  );
}

export function RecordDispositionPill({
  value,
}: {
  value?: string | null;
}) {
  return (
    <span className="inline-flex max-w-[140px] truncate rounded-full bg-slate-100/90 px-2 py-0.5 text-[10px] font-medium text-slate-700 ring-1 ring-slate-200/80 dark:bg-neutral-900 dark:text-neutral-300 dark:ring-neutral-700">
      {formatLabel(value)}
    </span>
  );
}

export function RecordDirectionLabel({
  direction,
  manual = false,
}: {
  direction?: string | null;
  manual?: boolean;
}) {
  if (manual) {
    return (
      <span className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-700 dark:text-neutral-200">
        <ArrowRight className="size-3 text-amber-500" aria-hidden />
        Manual entry
      </span>
    );
  }

  const normalized = (direction || "").toUpperCase();
  if (!normalized) {
    return <span className="text-[11px] text-slate-400 dark:text-neutral-500">—</span>;
  }

  const inbound =
    normalized === "INBOUND" || normalized === "MISSED_INBOUND";
  const outbound =
    normalized === "OUTBOUND" || normalized === "MISSED_OUTBOUND";

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 text-[11px] font-medium",
        inbound && "text-emerald-600 dark:text-emerald-400",
        outbound && "text-amber-600 dark:text-amber-400",
        !inbound && !outbound && "text-slate-600 dark:text-neutral-300",
      )}
    >
      <ArrowRight
        className={cn(
          "size-3 shrink-0",
          inbound && "text-emerald-500",
          outbound && "text-amber-500",
        )}
        aria-hidden
      />
      {formatLabel(direction)}
    </span>
  );
}
