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
  headerAlign = "start",
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
  /** Centered header for chart cards (pie labels layout). */
  headerAlign?: "start" | "center";
}) {
  const centered = headerAlign === "center";

  return (
    <div
      className={cn(
        "flex flex-col",
        dashboardPanelClass,
        fill && "h-full min-h-0",
        className,
      )}
    >
      <div
        className={cn(
          dashboardPanelHeaderClass,
          centered && "flex-col items-center border-b-0 pb-0 pt-3 text-center",
        )}
      >
        <div
          className={cn(
            "flex min-w-0 flex-1 items-start gap-2",
            centered && "flex-col items-center",
          )}
        >
          {Icon ? (
            <div
              className={cn(
                "flex h-5 w-5 shrink-0 items-center justify-center rounded-md bg-slate-100 dark:bg-slate-800",
                centered && "h-7 w-7",
              )}
            >
              <Icon
                className={cn(
                  "h-3 w-3 text-slate-600 dark:text-slate-300",
                  centered && "h-3.5 w-3.5",
                )}
              />
            </div>
          ) : null}
          <div className={cn("min-w-0 flex-1", centered && "flex-1-none")}>
            <h3
              className={cn(
                "text-[12px] font-bold leading-tight text-slate-700 dark:text-slate-200",
                centered && "text-sm",
              )}
            >
              {title}
            </h3>
            {subtitle ? (
              <p
                className={cn(
                  "mt-0.5 line-clamp-2 text-[11px] leading-snug text-slate-500 dark:text-slate-400",
                  centered && "line-clamp-none",
                )}
              >
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
