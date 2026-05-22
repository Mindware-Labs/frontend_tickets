import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

import { toneClasses } from "../dashboard-theme";
import type { Tone } from "../types";

export function StatusBadge({ children, tone }: { children: ReactNode; tone: Tone }) {
  const toneClass = toneClasses[tone];

  return (
    <span
      className={cn(
        "inline-flex min-h-6 items-center rounded-[6px] border px-2 text-xs font-medium",
        toneClass.iconWrap,
        toneClass.border,
        toneClass.text,
      )}
    >
      {children}
    </span>
  );
}
