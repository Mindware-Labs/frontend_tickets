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
  subtitleAction,
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
  /** Renders on the same row as the subtitle, aligned to the right. */
  subtitleAction?: ReactNode;
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
                "flex size-5 shrink-0 items-center justify-center rounded-md bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-300",
                centered && "size-7",
              )}
            >
              <Icon
                className={cn(
                  "size-3",
                  centered && "size-3.5",
                )}
                aria-hidden
              />
            </div>
          ) : null}
          <div className={cn("min-w-0 flex-1", centered && "flex-1-none")}>
            <h3
              className={cn(
                "text-[12px] font-bold leading-tight text-slate-800 dark:text-slate-100",
                centered && "text-sm",
              )}
            >
              {title}
            </h3>
            {subtitle || subtitleAction ? (
              <div
                className={cn(
                  "mt-0.5 flex items-center justify-between gap-3",
                  centered && "justify-center",
                )}
              >
                {subtitle ? (
                  <p
                    className={cn(
                      "min-w-0 flex-1 text-[11px] leading-snug text-slate-500 dark:text-slate-400",
                      centered && "text-center",
                      !subtitleAction && "line-clamp-2",
                    )}
                  >
                    {subtitle}
                  </p>
                ) : (
                  <span className="flex-1" />
                )}
                {subtitleAction ? (
                  <div className="shrink-0">{subtitleAction}</div>
                ) : null}
              </div>
            ) : null}
          </div>
        </div>
        {action ? <div className="shrink-0">{action}</div> : null}
      </div>
      <div className={cn(dashboardPanelBodyClass, bodyClassName)}>{children}</div>
    </div>
  );
}
