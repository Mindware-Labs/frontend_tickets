import { cn } from "@/lib/utils";

import { toneClasses } from "../dashboard-theme";
import type { Tone } from "../types";

export function DataRow({
  label,
  value,
  helper,
  tone,
}: {
  label: string;
  value: string;
  helper: string;
  tone: Tone;
}) {
  const toneClass = toneClasses[tone];

  return (
    <div className="grid gap-2 rounded-xl border border-border bg-muted/20 p-3 sm:grid-cols-[1fr_auto] sm:items-center">
      <div className="min-w-0">
        <p className="text-[13px] font-semibold text-foreground">{label}</p>
        <p className="mt-0.5 text-[12.5px] text-muted-foreground">{helper}</p>
      </div>
      <div className="flex items-center gap-2 sm:justify-end">
        <span className={cn("size-2 rounded-full", toneClass.bg)} />
        <span className="text-lg font-bold tabular-nums text-foreground">
          {value}
        </span>
      </div>
    </div>
  );
}
