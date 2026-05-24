import type { Tone } from "./types";

export const toneClasses: Record<
  Tone,
  {
    icon: string;
    iconWrap: string;
    border: string;
    text: string;
    bg: string;
    chart: string;
  }
> = {
  emerald: {
    icon: "text-emerald-700 dark:text-emerald-300",
    iconWrap: "bg-emerald-50 dark:bg-emerald-950/40",
    border: "border-emerald-200 dark:border-emerald-900",
    text: "text-emerald-700 dark:text-emerald-300",
    bg: "bg-[#008f68]",
    chart: "#008f68",
  },
  sky: {
    icon: "text-sky-700 dark:text-sky-300",
    iconWrap: "bg-sky-50 dark:bg-sky-950/40",
    border: "border-sky-200 dark:border-sky-900",
    text: "text-sky-700 dark:text-sky-300",
    bg: "bg-sky-600",
    chart: "#0284c7",
  },
  amber: {
    icon: "text-amber-700 dark:text-amber-300",
    iconWrap: "bg-amber-50 dark:bg-amber-950/40",
    border: "border-amber-200 dark:border-amber-900",
    text: "text-amber-700 dark:text-amber-300",
    bg: "bg-amber-500",
    chart: "#d97706",
  },
  rose: {
    icon: "text-rose-700 dark:text-rose-300",
    iconWrap: "bg-rose-50 dark:bg-rose-950/40",
    border: "border-rose-200 dark:border-rose-900",
    text: "text-rose-700 dark:text-rose-300",
    bg: "bg-rose-600",
    chart: "#e11d48",
  },
  indigo: {
    icon: "text-indigo-700 dark:text-indigo-300",
    iconWrap: "bg-indigo-50 dark:bg-indigo-950/40",
    border: "border-indigo-200 dark:border-indigo-900",
    text: "text-indigo-700 dark:text-indigo-300",
    bg: "bg-indigo-600",
    chart: "#4f46e5",
  },
  slate: {
    icon: "text-slate-700 dark:text-slate-300",
    iconWrap: "bg-slate-100 dark:bg-slate-900",
    border: "border-slate-200 dark:border-slate-800",
    text: "text-slate-700 dark:text-slate-300",
    bg: "bg-slate-500",
    chart: "#64748b",
  },
};

export const tooltipStyle = {
  background: "hsl(var(--card))",
  border: "1px solid #e2e8f0",
  borderRadius: 8,
  color: "#334155",
  boxShadow: "0 4px 12px rgba(15, 23, 42, 0.08)",
  fontSize: 12,
  padding: "8px 10px",
};

export const chartGridStroke = "#e2e8f0";
export const chartAxisTickStyle = { fontSize: 10, fill: "#94a3b8" } as const;
export const chartLegendStyle = { fontSize: 11, color: "#64748b" } as const;

/** Matches entity-form scroll body — soft canvas behind dashboard panels. */
export const dashboardCanvasClass =
  "rounded-xl bg-[#f4f5f7] p-2 dark:bg-slate-900/50";

export const dashboardPanelClass =
  "overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-[0_1px_3px_rgba(0,0,0,0.06)] dark:border-slate-800 dark:bg-slate-950";

export const dashboardPanelHeaderClass =
  "flex shrink-0 items-start justify-between gap-2 border-b border-slate-100 px-3.5 py-2 dark:border-slate-800";

export const dashboardPanelBodyClass = "min-h-0 flex-1 px-3 py-2.5";

export const dashboardChartSurfaceClass =
  "rounded-xl border border-slate-200/70 bg-slate-50/50 p-1.5 dark:border-slate-800/80 dark:bg-slate-900/40";

export const dashboardSectionLabelClass =
  "text-[10px] font-semibold uppercase tracking-widest text-slate-400";

export const dashboardMetricTileClass =
  "min-w-0 rounded-xl border px-2.5 shadow-[0_1px_2px_rgba(15,23,42,0.04)] transition-colors";

/** Fixed chart height so paired panels align without empty space below KPI grids. */
export const DASHBOARD_CHART_HEIGHT = 220;
export const DASHBOARD_CHART_HEIGHT_CLASS = "h-[220px]";
export const DASHBOARD_CHART_HEIGHT_SM = 200;
export const DASHBOARD_CHART_HEIGHT_SM_CLASS = "h-[200px]";

export const dashboardShellClass = "flex flex-col gap-2";
export const dashboardRowClass = "grid gap-2";
/** Paired chart + side panel rows — equal height, no dead space below charts. */
export const dashboardPairedRowClass =
  "grid gap-2 xl:grid-cols-2 xl:items-stretch [&>*]:min-h-0";
export const dashboardTableHeadClass =
  "py-2 pr-3 text-left text-[10px] font-semibold uppercase tracking-wider text-slate-400";
export const dashboardTableCellClass =
  "py-2 pr-3 text-xs text-slate-600 dark:text-slate-300";
export const dashboardTableCellStrongClass =
  "py-2 pr-3 text-xs font-semibold text-slate-800 dark:text-slate-100";
export const dashboardListItemClass =
  "rounded-xl border border-slate-100 bg-white px-3 py-2 shadow-[0_1px_2px_rgba(0,0,0,0.04)] dark:border-slate-800 dark:bg-slate-950";
