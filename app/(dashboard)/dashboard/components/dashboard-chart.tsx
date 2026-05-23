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
  className,
}: {
  children: ReactElement;
  size?: "md" | "sm";
  className?: string;
}) {
  return (
    <div
      className={cn(
        "w-full min-h-0",
        dashboardChartSurfaceClass,
        size === "sm" ? DASHBOARD_CHART_HEIGHT_SM_CLASS : DASHBOARD_CHART_HEIGHT_CLASS,
        className,
      )}
    >
      <ResponsiveContainer width="100%" height="100%">
        {children}
      </ResponsiveContainer>
    </div>
  );
}
