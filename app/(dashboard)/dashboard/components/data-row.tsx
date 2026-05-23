import { cn } from "@/lib/utils";

import { toneClasses } from "../dashboard-theme";
import type { Tone } from "../types";

export function DataRow({
  label,
  value,
  helper,
  tone,
  fill,
}: {
  label: string;
  value: string;
  helper: string;
  tone: Tone;
  fill?: boolean;
}) {
  const toneClass = toneClasses[tone];

  return (
    <div
      className={cn(
        "flex flex-col justify-between gap-1.5 rounded-xl border border-slate-100 bg-slate-50/80 px-3 py-2.5 dark:border-slate-800 dark:bg-slate-900/50",
        fill && "h-full min-h-0",
      )}
    >
      <div className="min-w-0">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
          {label}
        </p>
        <p className="mt-0.5 line-clamp-2 text-[10px] leading-snug text-slate-400 dark:text-slate-500">
          {helper}
        </p>
      </div>
      <div className="flex items-center gap-1.5">
        <span className={cn("size-1.5 shrink-0 rounded-full", toneClass.bg)} />
        <span className="text-lg font-bold leading-none tabular-nums text-slate-800 dark:text-slate-100">
          {value}
        </span>
      </div>
    </div>
  );
}
