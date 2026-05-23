import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

import {
  dashboardPanelBodyClass,
  dashboardPanelClass,
  dashboardPanelHeaderClass,
} from "../dashboard-theme";

export function PanelCard({
  title,
  subtitle,
  icon: Icon,
  children,
  className,
  bodyClassName,
  action,
  fill,
}: {
  title: string;
  subtitle?: string;
  icon?: LucideIcon;
  children: ReactNode;
  className?: string;
  bodyClassName?: string;
  action?: ReactNode;
  /** Stretch to match sibling height in a grid row. */
  fill?: boolean;
}) {
  return (
    <div
      className={cn(
        "flex flex-col",
        dashboardPanelClass,
        fill && "h-full min-h-0",
        className,
      )}
    >
      <div className={dashboardPanelHeaderClass}>
        <div className="flex min-w-0 flex-1 items-start gap-2">
          {Icon ? (
            <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-md bg-slate-100 dark:bg-slate-800">
              <Icon className="h-3 w-3 text-slate-600 dark:text-slate-300" />
            </div>
          ) : null}
          <div className="min-w-0 flex-1">
            <h3 className="text-[12px] font-bold leading-tight text-slate-700 dark:text-slate-200">
              {title}
            </h3>
            {subtitle ? (
              <p className="mt-0.5 line-clamp-1 text-[11px] leading-snug text-slate-500 dark:text-slate-400">
                {subtitle}
              </p>
            ) : null}
          </div>
        </div>
        {action ? <div className="shrink-0">{action}</div> : null}
      </div>
      <div className={cn(dashboardPanelBodyClass, bodyClassName)}>{children}</div>
    </div>
  );
}
