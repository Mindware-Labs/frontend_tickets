import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

export function PanelCard({
  title,
  subtitle,
  children,
  className,
  action,
}: {
  title: string;
  subtitle?: string;
  children: ReactNode;
  className?: string;
  action?: ReactNode;
}) {
  return (
    <div
      className={cn(
        "overflow-hidden rounded-xl border border-border bg-card shadow-sm",
        className,
      )}
    >
      <div className="grid gap-1 border-b border-border px-4 py-3.5 sm:grid-cols-[1fr_auto] sm:items-start">
        <div className="min-w-0">
          <h3 className="text-[13px] font-semibold text-foreground">{title}</h3>
          {subtitle ? (
            <p className="mt-0.5 text-[12.5px] text-muted-foreground">{subtitle}</p>
          ) : null}
        </div>
        {action ? <div className="mt-2 sm:mt-0">{action}</div> : null}
      </div>
      <div className="px-4 py-4">{children}</div>
    </div>
  );
}
