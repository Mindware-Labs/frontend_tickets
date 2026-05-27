import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { dashboardPanelClass } from "@/app/(dashboard)/dashboard/dashboard-theme";

const TONES = {
  emerald:
    "border-[#008f68]/20 bg-[#f0faf5] text-[#006b4f] dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-300",
  amber:
    "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-300",
  rose:
    "border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-300",
  sky:
    "border-sky-200 bg-sky-50 text-sky-700 dark:border-sky-500/30 dark:bg-sky-500/10 dark:text-sky-300",
  slate:
    "border-slate-200 bg-slate-50 text-slate-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300",
} as const;

type AgentMetricCardProps = {
  label: string;
  value: number | string;
  detail: string;
  icon: LucideIcon;
  tone?: keyof typeof TONES;
  active?: boolean;
};

export function AgentMetricCard({
  label,
  value,
  detail,
  icon: Icon,
  tone = "slate",
  active = false,
}: AgentMetricCardProps) {
  return (
    <div
      className={cn(
        dashboardPanelClass,
        "flex min-h-[74px] items-center gap-2.5 px-3 py-2.5",
        active && "border-rose-200 bg-rose-50/60 dark:bg-rose-500/10",
      )}
    >
      <span
        className={cn(
          "inline-flex size-9 shrink-0 items-center justify-center rounded-lg border",
          TONES[tone],
        )}
      >
        <Icon className="size-4" aria-hidden strokeWidth={2.25} />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-[9px] font-semibold uppercase tracking-widest text-slate-400 dark:text-slate-500">
          {label}
        </span>
        <span className="block text-xl font-bold leading-tight text-slate-900 dark:text-slate-100 tabular-nums">
          {typeof value === "number" ? value.toLocaleString() : value}
        </span>
        <span className="block truncate text-[11px] font-medium text-slate-500 dark:text-slate-400">
          {detail}
        </span>
      </span>
    </div>
  );
}
