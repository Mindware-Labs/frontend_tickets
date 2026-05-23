"use client";

import type { ReactElement } from "react";
import { ResponsiveContainer } from "recharts";

import { cn } from "@/lib/utils";

import {
  DASHBOARD_CHART_HEIGHT_CLASS,
  DASHBOARD_CHART_HEIGHT_SM_CLASS,
  dashboardChartSurfaceClass,
} from "../dashboard-theme";

export function DashboardChart({
  children,
  size = "md",
  fill = false,
  className,
}: {
  children: ReactElement;
  size?: "md" | "sm";
  /** Grow to fill a flex parent (paired dashboard panels). */
  fill?: boolean;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "w-full min-h-0",
        dashboardChartSurfaceClass,
        fill
          ? "min-h-[180px] flex-1"
          : size === "sm"
            ? DASHBOARD_CHART_HEIGHT_SM_CLASS
            : DASHBOARD_CHART_HEIGHT_CLASS,
        className,
      )}
    >
      <ResponsiveContainer width="100%" height="100%">
        {children}
      </ResponsiveContainer>
    </div>
  );
}
