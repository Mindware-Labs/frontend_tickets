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
    bg: "bg-emerald-600",
    chart: "#059669",
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
  border: "1px solid hsl(var(--border))",
  borderRadius: 8,
  color: "hsl(var(--foreground))",
  boxShadow: "0 10px 30px rgba(15, 23, 42, 0.12)",
};
