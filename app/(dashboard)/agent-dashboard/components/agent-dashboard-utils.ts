export function formatDuration(seconds?: number | null): string {
  if (!seconds || seconds <= 0) return "0s";
  const minutes = Math.floor(seconds / 60);
  const remainder = seconds % 60;
  if (minutes === 0) return `${remainder}s`;
  if (minutes < 60) return `${minutes}m ${remainder}s`;
  return `${Math.floor(minutes / 60)}h ${minutes % 60}m`;
}

export function formatRelativeDate(value?: string | null): string {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";

  const diffMs = Date.now() - date.getTime();
  const minutes = Math.floor(diffMs / 60_000);
  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;

  return date.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
}

export function formatTime(value?: string | null): string {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleTimeString(undefined, {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function statusTone(status?: string | null): string {
  const normalized = (status || "").toLowerCase();
  if (normalized.includes("overdue")) {
    return "border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-300";
  }
  if (normalized.includes("follow") || normalized.includes("progress")) {
    return "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-300";
  }
  if (normalized.includes("resolved") || normalized.includes("closed")) {
    return "border-[#008f68]/20 bg-[#f0faf5] text-[#006b4f] dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-300";
  }
  if (normalized.includes("open")) {
    return "border-sky-200 bg-sky-50 text-sky-700 dark:border-sky-500/30 dark:bg-sky-500/10 dark:text-sky-300";
  }
  return "border-slate-200 bg-slate-50 text-slate-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300";
}

export function statusLabel(status?: string | null): string {
  const value = status || "Open";
  return value
    .replace(/_/g, " ")
    .toLowerCase()
    .replace(/\b\w/g, (char) => char.toUpperCase());
}
