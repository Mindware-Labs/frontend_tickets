import { cn } from "@/lib/utils";

import { toneClasses } from "../dashboard-theme";
import type { Tone } from "../types";

export function FunnelBars({
  title,
  data,
  tone,
}: {
  title: string;
  data: { stage: string; value: number; pct: number }[];
  tone: Tone;
}) {
  const toneClass = toneClasses[tone];

  return (
    <div className="space-y-3">
      <p className="text-sm font-semibold text-slate-950 dark:text-slate-50">
        {title}
      </p>
      {data.map((item) => (
        <div key={item.stage} className="space-y-1">
          <div className="flex items-center justify-between gap-3 text-sm">
            <span className="text-slate-700 dark:text-slate-300">
              {item.stage}
            </span>
            <span className="font-semibold tabular-nums text-slate-950 dark:text-slate-50">
              {item.value.toLocaleString()} ({item.pct}%)
            </span>
          </div>
          <div className="h-2 rounded-full bg-slate-100 dark:bg-slate-900">
            <div
              className={cn("h-2 rounded-full", toneClass.bg)}
              style={{ width: `${item.pct}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}
