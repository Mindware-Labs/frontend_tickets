import { cn } from "@/lib/utils";

import { dashboardSectionLabelClass, toneClasses } from "../dashboard-theme";
import type { Tone } from "../types";

export function FunnelBars({
  title,
  data,
  tone,
  compact,
}: {
  title: string;
  data: { stage: string; value: number; pct: number }[];
  tone: Tone;
  compact?: boolean;
}) {
  const toneClass = toneClasses[tone];
  const visible = data.filter((item) => item.value > 0 || !compact);

  return (
    <div className={cn("flex min-h-0 flex-col", compact && "h-full")}>
      <p className={cn("mb-2 shrink-0", dashboardSectionLabelClass)}>{title}</p>
      <div
        className={cn(
          "min-h-0 flex-1 space-y-2",
          compact && "overflow-y-auto pr-0.5",
        )}
      >
        {(compact ? visible : data).map((item) => (
          <div key={item.stage} className="space-y-1">
            <div className="flex items-center justify-between gap-2 text-[11px]">
              <span className="truncate text-slate-500 dark:text-slate-400">
                {item.stage}
              </span>
              <span className="shrink-0 font-semibold tabular-nums text-slate-800 dark:text-slate-100">
                {item.value.toLocaleString()}
                {item.value > 0 ? ` (${item.pct}%)` : ""}
              </span>
            </div>
            <div className="h-1.5 rounded-full bg-slate-100 dark:bg-slate-800">
              <div
                className={cn("h-1.5 rounded-full", toneClass.bg)}
                style={{ width: `${item.value > 0 ? item.pct : 0}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
