"use client";

import type { CSSProperties } from "react";
import type { LucideIcon } from "lucide-react";
import {
  Activity,
  ArrowDown,
  ChevronRight,
  Clock,
  Flame,
  Layers,
  TrendingUp,
  Zap,
} from "lucide-react";
import { Bar, BarChart, Cell, Legend, Tooltip, XAxis, YAxis } from "recharts";

import { DashboardChart } from "@/app/(dashboard)/dashboard/components/dashboard-chart";
import { PanelCard } from "@/app/(dashboard)/dashboard/components/panel-card";
import {
  CHART_ANIMATION_DURATION,
  chartAxisTickStyle,
  chartBarCursor,
  chartLegendStyle,
  toneClasses,
  tooltipStyle,
} from "@/app/(dashboard)/dashboard/dashboard-theme";
import { cn } from "@/lib/utils";

// ═══════════════════════════════════════════════════════════════════════════════
// SHARED TYPES (mirror of backend CampaignFullReport extras)
// ═══════════════════════════════════════════════════════════════════════════════

export type CoverageStats = {
  totalAssigned: number;
  totalUniverse: number;
  contactedInRange: number;
  coveragePct: number;
  ghostCustomers: number;
};

export type FunnelStats = {
  total: number;
  contacted: number;
  engaged: number;
  converted: number;
  contactedPct: number;
  engagedPct: number;
  convertedPct: number;
  conversionRateOfContacted: number;
};

export type TouchpointStats = {
  avgAll: number;
  avgConverted: number;
  avgNotConverted: number;
  distribution: {
    bucket: string;
    customers: number;
    converted: number;
  }[];
};

export type TimeMetricsStats = {
  avgTimeToFirstContactMs: number;
  p50TimeToFirstContactMs: number;
  p95TimeToFirstContactMs: number;
  avgTimeToResolutionMs: number;
  p50TimeToResolutionMs: number;
  p95TimeToResolutionMs: number;
  customersMeasured: number;
  ticketsResolved: number;
};

export type HeatmapCell = {
  day: number;
  hour: number;
  count: number;
};

export type HeatmapStats = {
  cells: HeatmapCell[];
  totalActivities: number;
  peakDay: number;
  peakHour: number;
  peakCount: number;
};

// ═══════════════════════════════════════════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Human-friendly duration formatter for milliseconds.
 * Picks the largest meaningful unit so a card never overflows.
 */
export function formatDuration(ms: number): string {
  if (!ms || ms < 0) return "—";
  const seconds = Math.round(ms / 1000);
  if (seconds < 60) return `${seconds}s`;
  const minutes = Math.round(seconds / 60);
  if (minutes < 60) return `${minutes}m`;
  const hours = minutes / 60;
  if (hours < 24) {
    const h = Math.floor(hours);
    const m = Math.round((hours - h) * 60);
    return m > 0 ? `${h}h ${m}m` : `${h}h`;
  }
  const days = hours / 24;
  if (days < 30) {
    const d = Math.floor(days);
    const h = Math.round((days - d) * 24);
    return h > 0 ? `${d}d ${h}h` : `${d}d`;
  }
  const months = Math.round(days / 30);
  return `${months}mo`;
}

const DAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"] as const;

// ═══════════════════════════════════════════════════════════════════════════════
// FUNNEL CHART (4 stages: Total → Contacted → Engaged → Converted)
// ═══════════════════════════════════════════════════════════════════════════════

type FunnelStageId = "universe" | "contacted" | "engaged" | "converted";

const FUNNEL_TONES: {
  id: FunnelStageId;
  tone: "slate" | "sky" | "indigo" | "emerald";
  label: string;
  description: string;
}[] = [
  {
    id: "universe",
    tone: "slate",
    label: "Universe",
    description: "Total customers",
  },
  {
    id: "contacted",
    tone: "sky",
    label: "Contacted",
    description: "≥1 activity",
  },
  {
    id: "engaged",
    tone: "indigo",
    label: "Engaged",
    description: "Productive touch",
  },
  {
    id: "converted",
    tone: "emerald",
    label: "Converted",
    description: "Positive outcome",
  },
];

export function FunnelChart({
  funnel,
  selectedStages = [],
  onToggleStage,
}: {
  funnel: FunnelStats;
  /** Currently active funnel filters (e.g. `['engaged']`). */
  selectedStages?: string[];
  /** Toggles a stage; "universe" is not filterable (no-op). */
  onToggleStage?: (stageId: string) => void;
}) {
  const stages = [
    {
      ...FUNNEL_TONES[0],
      value: funnel.total,
      pct: 100,
      dropFromPrevious: 0,
    },
    {
      ...FUNNEL_TONES[1],
      value: funnel.contacted,
      pct: funnel.contactedPct,
      dropFromPrevious:
        funnel.total > 0
          ? Math.round(((funnel.total - funnel.contacted) / funnel.total) * 1000) /
            10
          : 0,
    },
    {
      ...FUNNEL_TONES[2],
      value: funnel.engaged,
      pct: funnel.contacted > 0
        ? Math.round((funnel.engaged / funnel.contacted) * 1000) / 10
        : 0,
      dropFromPrevious:
        funnel.contacted > 0
          ? Math.round(
              ((funnel.contacted - funnel.engaged) / funnel.contacted) * 1000,
            ) / 10
          : 0,
    },
    {
      ...FUNNEL_TONES[3],
      value: funnel.converted,
      pct: funnel.engaged > 0
        ? Math.round((funnel.converted / funnel.engaged) * 1000) / 10
        : 0,
      dropFromPrevious:
        funnel.engaged > 0
          ? Math.round(
              ((funnel.engaged - funnel.converted) / funnel.engaged) * 1000,
            ) / 10
          : 0,
    },
  ];

  const max = Math.max(funnel.total, 1);
  const isFiltered = selectedStages.length > 0;

  return (
    <PanelCard
      fill
      title="Conversion funnel"
      subtitle="Click a stage to filter. Universe → Contacted → Engaged → Converted (drop-off vs previous stage)"
      icon={TrendingUp}
    >
      <div className="flex flex-col gap-2 py-1.5">
        {stages.map((stage, idx) => {
          const tone = toneClasses[stage.tone];
          const widthPct = max > 0 ? (stage.value / max) * 100 : 0;
          const isFirst = idx === 0;
          const isLast = idx === stages.length - 1;
          const isClickable = stage.id !== "universe" && Boolean(onToggleStage);
          const isActive = selectedStages.includes(stage.id);
          const isDimmed = isFiltered && !isActive && stage.id !== "universe";

          return (
            <button
              key={stage.label}
              type="button"
              onClick={
                isClickable ? () => onToggleStage?.(stage.id) : undefined
              }
              disabled={!isClickable}
              aria-pressed={isActive}
              className={cn(
                "w-full space-y-0.5 rounded-lg border px-1.5 py-1 text-left transition",
                isActive
                  ? cn(tone.border, "bg-slate-50 dark:bg-neutral-900/60")
                  : "border-transparent",
                isDimmed && "opacity-50",
                isClickable
                  ? "cursor-pointer hover:border-slate-200 hover:bg-slate-50/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/40 dark:hover:border-neutral-700 dark:hover:bg-neutral-900/40"
                  : "cursor-default",
              )}
            >
              <div className="flex items-center justify-between gap-2">
                <div className="flex min-w-0 items-center gap-2">
                  <span
                    className={cn(
                      "inline-flex size-5 shrink-0 items-center justify-center rounded-md text-[10px] font-bold",
                      tone.iconWrap,
                      tone.text,
                    )}
                  >
                    {idx + 1}
                  </span>
                  <span className="text-[11px] font-semibold text-slate-800 dark:text-neutral-200">
                    {stage.label}
                  </span>
                  <span className="hidden text-[10px] text-slate-400 sm:inline">
                    · {stage.description}
                  </span>
                  {isActive ? (
                    <span className="rounded-md bg-emerald-100 px-1.5 py-px text-[9px] font-bold uppercase tracking-wide text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300">
                      Filter on
                    </span>
                  ) : null}
                </div>
                <div className="flex shrink-0 items-baseline gap-1.5">
                  <span className="text-sm font-bold tabular-nums text-slate-900 dark:text-neutral-100">
                    {stage.value.toLocaleString()}
                  </span>
                  {!isFirst ? (
                    <span className="text-[10px] font-medium text-slate-400">
                      ({stage.pct}% of prev)
                    </span>
                  ) : (
                    <span className="text-[10px] font-medium text-slate-400">
                      (100%)
                    </span>
                  )}
                </div>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-neutral-800">
                <div
                  className="h-full rounded-full transition-all"
                  style={{
                    width: `${widthPct}%`,
                    backgroundColor: tone.chart,
                  }}
                />
              </div>
              {!isLast && stage.dropFromPrevious > 0 ? (
                <div className="flex items-center gap-1 pl-7 text-[10px] text-rose-500 dark:text-rose-400">
                  <ArrowDown className="size-2.5" aria-hidden />
                  <span className="font-medium">
                    {stages[idx + 1].dropFromPrevious}% drop-off
                  </span>
                </div>
              ) : null}
            </button>
          );
        })}
        <div className="mt-1 grid grid-cols-2 gap-2 border-t border-slate-100 pt-2 dark:border-neutral-800">
          <FunnelStat
            label="Overall conversion"
            value={`${funnel.convertedPct}%`}
            hint="Converted / Universe"
            tone="emerald"
          />
          <FunnelStat
            label="Agent efficiency"
            value={`${funnel.conversionRateOfContacted}%`}
            hint="Converted / Contacted"
            tone="indigo"
          />
        </div>
      </div>
    </PanelCard>
  );
}

function FunnelStat({
  label,
  value,
  hint,
  tone,
}: {
  label: string;
  value: string;
  hint: string;
  tone: "emerald" | "indigo";
}) {
  const t = toneClasses[tone];
  return (
    <div
      className={cn(
        "rounded-lg border px-2.5 py-1.5",
        t.border,
        "bg-slate-50/50 dark:bg-neutral-900/40",
      )}
    >
      <p className="text-[9px] font-semibold uppercase tracking-wide text-slate-500 dark:text-neutral-400">
        {label}
      </p>
      <p
        className={cn(
          "mt-0.5 text-base font-bold leading-none tabular-nums",
          t.text,
        )}
      >
        {value}
      </p>
      <p className="mt-0.5 text-[10px] text-slate-400">{hint}</p>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// TOUCHPOINTS HISTOGRAM
// ═══════════════════════════════════════════════════════════════════════════════

export function TouchpointsHistogram({
  touchpoints,
  selectedBuckets = [],
  onToggleBucket,
}: {
  touchpoints: TouchpointStats;
  /** Selected bucket labels (e.g. `['1', '4+']`). */
  selectedBuckets?: string[];
  /** Toggles a touchpoint bucket filter. */
  onToggleBucket?: (bucket: string) => void;
}) {
  const data = touchpoints.distribution.map((d) => ({
    bucket: `${d.bucket} touch${d.bucket === "1" ? "" : "es"}`,
    bucketKey: d.bucket,
    customers: d.customers,
    converted: d.converted,
    notConverted: Math.max(0, d.customers - d.converted),
  }));

  const totalCustomers = data.reduce((s, d) => s + d.customers, 0);
  const hasData = totalCustomers > 0;
  const efficiencyDelta = touchpoints.avgConverted - touchpoints.avgNotConverted;
  const isFiltered = selectedBuckets.length > 0;

  const handleBarClick = (datum: unknown) => {
    if (!onToggleBucket) return;
    const point = datum as { bucketKey?: string } | undefined;
    if (point?.bucketKey) onToggleBucket(point.bucketKey);
  };

  return (
    <PanelCard
      fill
      title="Touchpoint efficiency"
      subtitle="Click a bar to filter. How many touches each customer needed (converted vs not)"
      icon={Layers}
    >
      <div className="flex flex-col gap-2">
        <div className="grid grid-cols-3 gap-2">
          <MiniStat
            label="Avg / customer"
            value={touchpoints.avgAll}
            tone="slate"
          />
          <MiniStat
            label="Converted avg"
            value={touchpoints.avgConverted}
            tone="emerald"
          />
          <MiniStat
            label="Not converted"
            value={touchpoints.avgNotConverted}
            tone="rose"
          />
        </div>
        {hasData ? (
          <DashboardChart size="sm">
            <BarChart
              data={data}
              margin={{ top: 8, right: 8, left: 0, bottom: 0 }}
            >
              <XAxis
                dataKey="bucket"
                tick={chartAxisTickStyle}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={chartAxisTickStyle}
                width={28}
                axisLine={false}
                tickLine={false}
                allowDecimals={false}
              />
              <Tooltip contentStyle={tooltipStyle} cursor={chartBarCursor} />
              <Legend wrapperStyle={chartLegendStyle} iconType="circle" />
              <Bar
                dataKey="converted"
                stackId="touch"
                name="Converted"
                fill={toneClasses.emerald.chart}
                radius={[0, 0, 0, 0]}
                maxBarSize={48}
                animationDuration={CHART_ANIMATION_DURATION}
                onClick={onToggleBucket ? handleBarClick : undefined}
                style={onToggleBucket ? { cursor: "pointer" } : undefined}
              >
                {data.map((entry) => {
                  const active = selectedBuckets.includes(entry.bucketKey);
                  return (
                    <Cell
                      key={`conv_${entry.bucketKey}`}
                      fillOpacity={isFiltered && !active ? 0.35 : 1}
                      stroke={active ? toneClasses.emerald.chart : undefined}
                      strokeWidth={active ? 1.5 : 0}
                    />
                  );
                })}
              </Bar>
              <Bar
                dataKey="notConverted"
                stackId="touch"
                name="Not converted"
                fill={toneClasses.slate.chart}
                radius={[3, 3, 0, 0]}
                maxBarSize={48}
                animationDuration={CHART_ANIMATION_DURATION}
                onClick={onToggleBucket ? handleBarClick : undefined}
                style={onToggleBucket ? { cursor: "pointer" } : undefined}
              >
                {data.map((entry) => {
                  const active = selectedBuckets.includes(entry.bucketKey);
                  return (
                    <Cell
                      key={`nc_${entry.bucketKey}`}
                      fillOpacity={isFiltered && !active ? 0.35 : 1}
                      stroke={active ? toneClasses.slate.chart : undefined}
                      strokeWidth={active ? 1.5 : 0}
                    />
                  );
                })}
              </Bar>
            </BarChart>
          </DashboardChart>
        ) : (
          <EmptyChart label="No touchpoint data in range" />
        )}
        {hasData && efficiencyDelta !== 0 ? (
          <p className="rounded-md bg-slate-50 px-2 py-1 text-[10px] text-slate-500 dark:bg-neutral-900 dark:text-neutral-400">
            {efficiencyDelta < 0 ? (
              <>
                <Zap className="mr-1 inline size-2.5 text-emerald-500" />
                Converted customers needed{" "}
                <span className="font-semibold text-emerald-600">
                  {Math.abs(efficiencyDelta).toFixed(1)} fewer touches
                </span>{" "}
                on average.
              </>
            ) : (
              <>
                <Activity className="mr-1 inline size-2.5 text-amber-500" />
                Converted customers needed{" "}
                <span className="font-semibold text-amber-600">
                  {efficiencyDelta.toFixed(1)} more touches
                </span>{" "}
                — review qualification.
              </>
            )}
          </p>
        ) : null}
      </div>
    </PanelCard>
  );
}

function MiniStat({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone: "emerald" | "rose" | "slate";
}) {
  const t = toneClasses[tone];
  return (
    <div
      className={cn(
        "rounded-lg border px-2 py-1.5",
        t.border,
        "bg-white dark:bg-neutral-950",
      )}
    >
      <p className="text-[9px] font-semibold uppercase tracking-wide text-slate-400">
        {label}
      </p>
      <p className={cn("mt-0.5 text-sm font-bold tabular-nums", t.text)}>
        {value.toFixed(1)}
      </p>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// TIME METRICS CARD
// ═══════════════════════════════════════════════════════════════════════════════

export function TimeMetricsCard({
  timeMetrics,
}: {
  timeMetrics: TimeMetricsStats;
}) {
  const items: {
    icon: LucideIcon;
    label: string;
    avg: number;
    p50: number;
    p95: number;
    sample: string;
  }[] = [
    {
      icon: Clock,
      label: "Time to first contact",
      avg: timeMetrics.avgTimeToFirstContactMs,
      p50: timeMetrics.p50TimeToFirstContactMs,
      p95: timeMetrics.p95TimeToFirstContactMs,
      sample: `${timeMetrics.customersMeasured} customers`,
    },
    {
      icon: TrendingUp,
      label: "Time to resolution",
      avg: timeMetrics.avgTimeToResolutionMs,
      p50: timeMetrics.p50TimeToResolutionMs,
      p95: timeMetrics.p95TimeToResolutionMs,
      sample: `${timeMetrics.ticketsResolved} tickets`,
    },
  ];

  return (
    <PanelCard
      fill
      title="Response & resolution timing"
      subtitle="From customer creation to first contact, and ticket lifecycle"
      icon={Clock}
    >
      <div className="flex flex-col gap-2">
        {items.map((item) => {
          const Icon = item.icon;
          const hasData = item.avg > 0;
          return (
            <div
              key={item.label}
              className="rounded-xl border border-slate-200/70 bg-slate-50/50 p-2 dark:border-neutral-800 dark:bg-neutral-900/40"
            >
              <div className="flex items-center justify-between gap-2">
                <div className="flex min-w-0 items-center gap-2">
                  <span className="inline-flex size-5 shrink-0 items-center justify-center rounded-md bg-white shadow-sm dark:bg-neutral-950">
                    <Icon
                      className="size-3 text-slate-500"
                      aria-hidden
                    />
                  </span>
                  <p className="text-[11px] font-semibold text-slate-700 dark:text-neutral-200">
                    {item.label}
                  </p>
                </div>
                <span className="text-[10px] text-slate-400">{item.sample}</span>
              </div>
              <div className="mt-1.5 grid grid-cols-3 gap-1.5">
                <TimeStat label="Avg" value={item.avg} hasData={hasData} bold />
                <TimeStat label="P50" value={item.p50} hasData={hasData} />
                <TimeStat label="P95" value={item.p95} hasData={hasData} />
              </div>
            </div>
          );
        })}
      </div>
    </PanelCard>
  );
}

function TimeStat({
  label,
  value,
  hasData,
  bold,
}: {
  label: string;
  value: number;
  hasData: boolean;
  bold?: boolean;
}) {
  return (
    <div className="rounded-md bg-white px-2 py-1.5 dark:bg-neutral-950">
      <p className="text-[9px] font-semibold uppercase tracking-wide text-slate-400">
        {label}
      </p>
      <p
        className={cn(
          "mt-0.5 text-xs tabular-nums leading-none text-slate-900 dark:text-neutral-100",
          bold ? "font-bold" : "font-semibold",
        )}
      >
        {hasData ? formatDuration(value) : "—"}
      </p>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// HEATMAP (day-of-week × hour-of-day)
// ═══════════════════════════════════════════════════════════════════════════════

export function ActivityHeatmap({
  heatmap,
  selectedCells = [],
  onToggleCell,
}: {
  heatmap: HeatmapStats;
  /** Selected cell keys in `"day_hour"` format. */
  selectedCells?: string[];
  /** Toggles a cell filter — receives the `"day_hour"` key. */
  onToggleCell?: (cellKey: string) => void;
}) {
  const grid = new Map<string, number>();
  for (const cell of heatmap.cells) {
    grid.set(`${cell.day}_${cell.hour}`, cell.count);
  }
  const max = heatmap.peakCount || 1;
  const total = heatmap.totalActivities;
  const selectedSet = new Set(selectedCells);
  const isFiltered = selectedSet.size > 0;

  const HOURS = Array.from({ length: 24 }, (_, h) => h);

  return (
    <PanelCard
      fill
      title="Activity heatmap"
      subtitle="Click a cell to filter. When the campaign is active — day of week × hour of day"
      icon={Flame}
      action={
        total > 0 ? (
          <div className="hidden items-center gap-1.5 rounded-md bg-amber-50 px-2 py-1 text-[10px] font-semibold text-amber-700 sm:inline-flex dark:bg-amber-950/40 dark:text-amber-300">
            <Flame className="size-3" aria-hidden />
            Peak: {DAY_LABELS[heatmap.peakDay]} @ {formatHour(heatmap.peakHour)} ·{" "}
            {heatmap.peakCount}
          </div>
        ) : null
      }
    >
      {total === 0 ? (
        <EmptyChart label="No activity in range" />
      ) : (
        <div className="flex flex-col gap-1.5">
          <div className="overflow-x-auto pb-1">
            <div className="inline-block min-w-full">
              <div
                className="grid gap-[2px]"
                style={{
                  gridTemplateColumns: "auto repeat(24, minmax(14px, 1fr))",
                }}
              >
                <span />
                {HOURS.map((h) => (
                  <span
                    key={`hh_${h}`}
                    className="text-center text-[8px] font-medium text-slate-400"
                  >
                    {h % 3 === 0 ? h : ""}
                  </span>
                ))}
                {DAY_LABELS.map((dayLabel, dayIdx) => (
                  <HeatmapRow
                    key={dayLabel}
                    label={dayLabel}
                    dayIdx={dayIdx}
                    grid={grid}
                    max={max}
                    selectedSet={selectedSet}
                    isFiltered={isFiltered}
                    onToggleCell={onToggleCell}
                  />
                ))}
              </div>
            </div>
          </div>
          <HeatmapLegend max={max} />
        </div>
      )}
    </PanelCard>
  );
}

function HeatmapRow({
  label,
  dayIdx,
  grid,
  max,
  selectedSet,
  isFiltered,
  onToggleCell,
}: {
  label: string;
  dayIdx: number;
  grid: Map<string, number>;
  max: number;
  selectedSet: Set<string>;
  isFiltered: boolean;
  onToggleCell?: (cellKey: string) => void;
}) {
  return (
    <>
      <span className="pr-1 text-right text-[9px] font-semibold uppercase text-slate-500">
        {label}
      </span>
      {Array.from({ length: 24 }, (_, h) => {
        const key = `${dayIdx}_${h}`;
        const count = grid.get(key) ?? 0;
        const intensity = count > 0 ? count / max : 0;
        return (
          <HeatmapCellComponent
            key={key}
            cellKey={key}
            count={count}
            intensity={intensity}
            day={label}
            hour={h}
            isSelected={selectedSet.has(key)}
            isDimmed={isFiltered && !selectedSet.has(key)}
            onToggleCell={onToggleCell}
          />
        );
      })}
    </>
  );
}

function HeatmapCellComponent({
  cellKey,
  count,
  intensity,
  day,
  hour,
  isSelected,
  isDimmed,
  onToggleCell,
}: {
  cellKey: string;
  count: number;
  intensity: number;
  day: string;
  hour: number;
  isSelected: boolean;
  isDimmed: boolean;
  onToggleCell?: (cellKey: string) => void;
}) {
  const interactive = Boolean(onToggleCell) && count > 0;
  const baseTitle =
    count === 0
      ? `${day} ${formatHour(hour)} — no activity`
      : `${day} ${formatHour(hour)} — ${count} activit${count === 1 ? "y" : "ies"}${
          interactive ? " (click to filter)" : ""
        }`;
  if (count === 0) {
    return (
      <div
        className={cn(
          "h-3.5 rounded-sm bg-slate-100 dark:bg-neutral-900",
          isDimmed && "opacity-40",
        )}
        title={baseTitle}
        aria-label={baseTitle}
      />
    );
  }
  const alpha = Math.max(0.15, intensity);
  const sharedStyle: CSSProperties = {
    backgroundColor: `rgba(0, 143, 104, ${alpha.toFixed(2)})`,
  };
  if (!interactive) {
    return (
      <div
        className={cn(
          "h-3.5 rounded-sm transition-transform",
          isDimmed && "opacity-40",
        )}
        style={sharedStyle}
        title={baseTitle}
        aria-label={baseTitle}
      />
    );
  }
  return (
    <button
      type="button"
      aria-pressed={isSelected}
      onClick={() => onToggleCell?.(cellKey)}
      className={cn(
        "h-3.5 rounded-sm transition-all hover:scale-125 hover:ring-1 hover:ring-emerald-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500",
        isSelected &&
          "ring-1 ring-emerald-600 ring-offset-1 ring-offset-white dark:ring-offset-slate-950",
        isDimmed && "opacity-40 hover:opacity-100",
      )}
      style={sharedStyle}
      title={baseTitle}
      aria-label={baseTitle}
    />
  );
}

function HeatmapLegend({ max }: { max: number }) {
  const steps = [0, 0.25, 0.5, 0.75, 1];
  return (
    <div className="flex items-center gap-2 px-1 text-[9px] font-medium text-slate-400">
      <span>Less</span>
      <div className="flex items-center gap-[2px]">
        {steps.map((s) => (
          <span
            key={s}
            className="size-3 rounded-sm"
            style={{
              backgroundColor:
                s === 0
                  ? undefined
                  : `rgba(0, 143, 104, ${Math.max(0.15, s).toFixed(2)})`,
            }}
            // Empty step keeps the slate background to match empty cells
            data-empty={s === 0 ? "true" : undefined}
          />
        ))}
      </div>
      <span>More (peak {max})</span>
    </div>
  );
}

function formatHour(h: number): string {
  const suffix = h < 12 ? "am" : "pm";
  const hr = h % 12 === 0 ? 12 : h % 12;
  return `${hr}${suffix}`;
}

// ═══════════════════════════════════════════════════════════════════════════════
// SHARED EMPTY STATE
// ═══════════════════════════════════════════════════════════════════════════════

function EmptyChart({ label }: { label: string }) {
  return (
    <div className="flex h-[140px] flex-col items-center justify-center gap-1.5 rounded-lg border border-dashed border-slate-200 bg-slate-50/50 text-center dark:border-neutral-800 dark:bg-neutral-900/40">
      <ChevronRight className="size-4 text-slate-300" aria-hidden />
      <p className="text-[11px] text-slate-400">{label}</p>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// COVERAGE DETAIL (small inline component used in KPI tile detail)
// ═══════════════════════════════════════════════════════════════════════════════

export function buildCoverageDetail(coverage: CoverageStats): {
  detail: string;
  trend: string;
} {
  if (coverage.totalAssigned === 0) {
    return {
      detail: `${coverage.contactedInRange} contacted (no roster set)`,
      trend: "Assign customers to track coverage",
    };
  }
  return {
    detail: `${coverage.contactedInRange} of ${coverage.totalAssigned} reached`,
    trend:
      coverage.ghostCustomers > 0
        ? `${coverage.ghostCustomers} ghost customers`
        : `Full coverage`,
  };
}
