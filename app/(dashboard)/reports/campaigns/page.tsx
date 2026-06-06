"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { ReactNode } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  AlertCircle,
  ArrowRight,
  BarChart3,
  CalendarDays,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  ClipboardList,
  Clock,
  Download,
  FileText,
  FileSpreadsheet,
  Filter,
  Layers,
  ListFilter,
  Loader2,
  Megaphone,
  Phone,
  Search,
  SlidersHorizontal,
  Target,
  Ticket,
  TrendingUp,
  User,
  UserRound,
  Users,
  X,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { MetricCard } from "@/app/(dashboard)/dashboard/components/metric-card";
import { EntityGridLoading } from "@/components/shared/entity-loading-state";
import { PanelCard } from "@/app/(dashboard)/dashboard/components/panel-card";
import { DashboardChart } from "@/app/(dashboard)/dashboard/components/dashboard-chart";
import { DashboardEmptyState } from "@/app/(dashboard)/dashboard/components/dashboard-empty-state";
import {
  chartAxisTickStyle,
  chartGridStroke,
  chartLegendStyle,
  dashboardCanvasClass,
  dashboardRowClass,
  dashboardShellClass,
  toneClasses,
  tooltipStyle,
} from "@/app/(dashboard)/dashboard/dashboard-theme";
import type { Metric, Tone } from "@/app/(dashboard)/dashboard/types";
import { Button } from "@/components/ui/button";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { Input } from "@/components/ui/input";
import { useAircall } from "@/components/providers/AircallProvider";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { toast } from "@/hooks/use-toast";
import { useDialogCleanup } from "@/hooks/use-dialog-cleanup";
import { useReportSession } from "@/hooks/use-report-session";
import { fetchBlobFromBackend, fetchFromBackend } from "@/lib/api-client";
import { cn } from "@/lib/utils";
import { CampaignFiltersSheet } from "./Components/CampaignFiltersSheet";
import { CampaignReportSetupEmptyState } from "./Components/CampaignReportSetupEmptyState";
import {
  ActivityHeatmap,
  buildCoverageDetail,
  FunnelChart,
  TouchpointsHistogram,
  formatDuration,
  type CoverageStats,
  type FunnelStats,
  type HeatmapStats,
  type TimeMetricsStats,
  type TouchpointStats,
} from "./Components/AdvancedMetrics";
import {
  YardContextChip,
  YardSegmentedTabs,
  yardDashboardToolbarClass,
} from "../yards/components/yard-dashboard-chrome";

type Campaign = {
  id: number;
  nombre: string;
  yarda?: { name?: string | null } | null;
  isActive?: boolean;
  tipo?: string;
  createdAt?: string;
};

type KvPair = {
  label: string;
  count: number;
};

type CallsModuleStats = {
  total: number;
  inbound: number;
  outbound: number;
  missed: number;
  voicemail: number;
  answered: number;
  avgDurationSec: number;
  totalDurationSec: number;
  withNotes: number;
  withFollowUp: number;
  withRecording: number;
  withVoicemail: number;
  dispositionBreakdown: KvPair[];
  campaignOptionBreakdown: KvPair[];
  topAgent: string;
  agentBreakdown: KvPair[];
};

type TicketsModuleStats = {
  total: number;
  open: number;
  closed: number;
  pendingFollowUp: number;
  overdue: number;
  highPriority: number;
  mediumPriority: number;
  lowPriority: number;
  withFollowUp: number;
  withCampaignOption: number;
  withAttachments: number;
  withIssueDetail: number;
  campaignOptionBreakdown: KvPair[];
  priorityBreakdown: KvPair[];
  statusBreakdown: KvPair[];
  topAssignee: string;
  agentBreakdown: KvPair[];
};

type ManualRecordsModuleStats = {
  total: number;
  withNotes: number;
  withDisposition: number;
  withCampaignOption: number;
  campaignOptionBreakdown: KvPair[];
  dispositionBreakdown: KvPair[];
};

type CustomerCallEntry = {
  callId: number;
  aircallId: string;
  direction: string;
  line: string;
  yardName: string;
  disposition: string;
  status: string;
  campaignOption: string;
  agentName: string;
  createdAt: string;
  durationSec: number;
  notes: string;
  hasFollowUp: boolean;
  followUpDate: string;
  hasRecording: boolean;
};

type CustomerCallSummary = {
  callCount: number;
  inbound: number;
  outbound: number;
  missed: number;
  totalDurationSec: number;
  avgDurationSec: number;
  lastCallDate: string;
  lastDirection: string;
  lastAgentName: string;
  lastDisposition: string;
  campaignOption?: string;
  lastNotes?: string;
  hasFollowUp: boolean;
  followUpDate?: string;
  hasRecording: boolean;
  entries?: CustomerCallEntry[];
};

type CustomerTicketEntry = {
  ticketId: number;
  ticketLabel: string;
  status: string;
  priority: string;
  ticketType?: string;
  campaignOption: string;
  campaignName?: string;
  yardName?: string;
  phoneLine?: string;
  callId?: number | null;
  issueSnippet: string;
  agentName: string;
  createdAt: string;
  updatedAt?: string;
  hasFollowUp: boolean;
};

type CustomerManualEntry = {
  id: number;
  campaignOption: string;
  campaignName?: string;
  yardName?: string;
  disposition: string;
  status?: string;
  agentName?: string;
  notes: string;
  createdAt: string;
};

type MatrixCustomerRow = {
  customerId?: number;
  name: string;
  phone: string;
  finalStatus: string;
  calls: CustomerCallSummary;
  tickets: CustomerTicketEntry[];
  manualRecords: CustomerManualEntry[];
  lastActivityDate: string;
};

type CampaignFullReport = {
  campaign: {
    id: number;
    nombre: string;
    yardaName: string | null;
    tipo: string;
  };
  range: { startDate: string; endDate: string };
  isAr: boolean;
  callsStats: CallsModuleStats;
  ticketsStats: TicketsModuleStats;
  manualRecordsStats: ManualRecordsModuleStats;
  statusBreakdown: KvPair[];
  tables: { title: string; rows: MatrixCustomerRow[] }[];
  totals: {
    customers: number;
    calls: number;
    tickets: number;
    manualRecords: number;
  };
  coverage?: CoverageStats;
  funnel?: FunnelStats;
  touchpoints?: TouchpointStats;
  timeMetrics?: TimeMetricsStats;
  heatmap?: HeatmapStats;
};

type FilterKey =
  | "status"
  | "option"
  | "agent"
  | "day"
  | "module"
  | "funnel"
  | "touchpoints"
  | "heatmap"
  | "disposition";
type CampaignFilters = Record<FilterKey, string[]>;
type ChartDatum = { key: string; name: string; value: number; fill?: string };
type DayDatum = {
  key: string;
  day: string;
  calls: number;
  tickets: number;
  manual: number;
};
type CampaignReportTab = "dashboard" | "records";
type RecordModule = "calls" | "tickets" | "manual";
type CampaignRecordItem = {
  id: string;
  module: RecordModule;
  option: string;
  customer: MatrixCustomerRow & { bucket: string };
  title: string;
  status: string;
  owner: string;
  date: string;
  summary: string;
  meta: string;
  call?: CustomerCallEntry;
  calls?: CustomerCallEntry[];
  ticket?: CustomerTicketEntry;
  manual?: CustomerManualEntry;
};

const emptyFilters = (): CampaignFilters => ({
  status: [],
  option: [],
  agent: [],
  day: [],
  module: [],
  funnel: [],
  touchpoints: [],
  heatmap: [],
  disposition: [],
});

const FILTER_LABELS: Record<FilterKey, string> = {
  status: "Status",
  option: "Option",
  agent: "Agent",
  day: "Day",
  module: "Module",
  funnel: "Stage",
  touchpoints: "Touches",
  heatmap: "When",
  disposition: "Disposition",
};

const FUNNEL_STAGE_LABELS: Record<string, string> = {
  contacted: "Contacted",
  engaged: "Engaged",
  converted: "Converted",
};

const WEEKDAY_SHORT = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function formatHour12(hour: number): string {
  const suffix = hour < 12 ? "am" : "pm";
  const hr = hour % 12 === 0 ? 12 : hour % 12;
  return `${hr}${suffix}`;
}

/**
 * Human-friendly label for an active-filter chip.
 * Heatmap values are stored as `"day_hour"` (e.g. `"1_14"`), funnel/touchpoints
 * use machine-friendly slugs; this normalises them for display.
 */
function formatFilterValue(key: FilterKey, value: string): string {
  if (key === "heatmap") {
    const [dayStr, hourStr] = value.split("_");
    const day = Number(dayStr);
    const hour = Number(hourStr);
    const dayLabel = WEEKDAY_SHORT[day] ?? value;
    return `${dayLabel} ${formatHour12(hour)}`;
  }
  if (key === "funnel") return FUNNEL_STAGE_LABELS[value] ?? value;
  if (key === "touchpoints")
    return `${value} touch${value === "1" ? "" : "es"}`;
  return value;
}

const STATUS_COLORS: Record<string, string> = {
  Paid: "#16a34a",
  Registered: "#16a34a",
  "Balance 0": "#008f68",
  "Paid with LL": "#0284c7",
  "Offline Payment": "#d97706",
  "Not Paid Check": "#d97706",
  "Moved Out": "#ea580c",
  "Not Paid": "#e11d48",
  Canceled: "#e11d48",
  "Do Not Call": "#991b1b",
  "Not Registered": "#e11d48",
  Unknown: "#64748b",
  Unspecified: "#64748b",
  // Call Dispositions
  Answered: "#008f68",
  Connected: "#008f68",
  "Left Voicemail": "#d97706",
  Voicemail: "#d97706",
  Busy: "#4f46e5",
  "No Answer": "#64748b",
  "Wrong Number": "#e11d48",
  "Invalid Number": "#e11d48",
  Refused: "#991b1b",
};

const MODULE_COLORS: Record<string, string> = {
  Calls: toneClasses.sky.chart,
  Tickets: toneClasses.emerald.chart,
  Manual: toneClasses.indigo.chart,
};

const RECORD_MODULE_LABELS: Record<RecordModule, string> = {
  calls: "Calls",
  tickets: "Tickets",
  manual: "Manual Records",
};

const normalizeLabel = (value?: string | null) => {
  const trimmed = value?.trim();
  return trimmed ? trimmed.replace(/_/g, " ") : "Unspecified";
};

const formatDate = (value?: string | null) => {
  if (!value) return "N/A";
  return new Date(value).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
};

const formatDateTime = (value?: string | null) => {
  if (!value) return "N/A";
  return new Date(value).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const formatDay = (value?: string | null) => {
  if (!value) return "Unspecified";
  return new Date(value).toISOString().slice(0, 10);
};

const unique = (values: string[]) =>
  Array.from(new Set(values.filter(Boolean))).sort((a, b) =>
    a.localeCompare(b),
  );

function flattenRows(report: CampaignFullReport | null) {
  if (!report) return [];
  return report.tables.flatMap((table) =>
    table.rows.map((row) => ({ ...row, bucket: table.title })),
  );
}

function getRowOptions(row: MatrixCustomerRow) {
  return unique(
    [
      normalizeLabel(row.calls.campaignOption),
      ...(row.calls.entries ?? []).map((call) =>
        normalizeLabel(call.campaignOption),
      ),
      ...row.tickets.map((ticket) => normalizeLabel(ticket.campaignOption)),
      ...row.manualRecords.map((record) =>
        normalizeLabel(record.campaignOption),
      ),
    ].filter((option) => option !== "Unspecified"),
  );
}

function getPrimaryOption(row: MatrixCustomerRow) {
  return getRowOptions(row)[0] || normalizeLabel(row.finalStatus);
}

function buildCampaignRecordItems(
  rows: Array<MatrixCustomerRow & { bucket: string }>,
): CampaignRecordItem[] {
  return rows.flatMap((row) => {
    const baseOption = getPrimaryOption(row);
    const items: CampaignRecordItem[] = [];

    const callEntries = row.calls.entries?.length
      ? row.calls.entries
      : row.calls.callCount > 0
        ? [
            {
              callId: row.customerId ?? 0,
              aircallId: "",
              direction: row.calls.lastDirection,
              line: row.phone,
              yardName: "",
              disposition: row.calls.lastDisposition,
              status: "",
              campaignOption: row.calls.campaignOption || "",
              agentName: row.calls.lastAgentName,
              createdAt: row.calls.lastCallDate || row.lastActivityDate,
              durationSec: row.calls.avgDurationSec,
              notes: row.calls.lastNotes || "",
              hasFollowUp: row.calls.hasFollowUp,
              followUpDate: row.calls.followUpDate || "",
              hasRecording: row.calls.hasRecording,
            },
          ]
        : [];

    const callGroups = new Map<string, CustomerCallEntry[]>();
    callEntries.forEach((call) => {
      const callOption = normalizeLabel(call.campaignOption);
      const option = callOption !== "Unspecified" ? callOption : baseOption;
      const groupKey = `${row.customerId ?? row.phone}-${option}`;
      const current = callGroups.get(groupKey) ?? [];
      current.push(call);
      callGroups.set(groupKey, current);
    });

    Array.from(callGroups.entries()).forEach(([groupKey, calls]) => {
      const latestCall = calls
        .slice()
        .sort((a, b) =>
          (b.createdAt || "").localeCompare(a.createdAt || ""),
        )[0];
      const option =
        normalizeLabel(latestCall.campaignOption) !== "Unspecified"
          ? normalizeLabel(latestCall.campaignOption)
          : baseOption;
      const directions = unique(
        calls.map((call) => normalizeLabel(call.direction)),
      );
      const agents = unique(
        calls
          .map((call) => normalizeLabel(call.agentName))
          .filter((agent) => agent !== "Unspecified"),
      );

      items.push({
        id: `calls-${groupKey}`,
        module: "calls",
        option,
        customer: row,
        title: row.name || "Unknown customer",
        status: normalizeLabel(latestCall.disposition || row.finalStatus),
        owner:
          agents.length > 1
            ? `${agents[0]} +${agents.length - 1}`
            : normalizeLabel(latestCall.agentName),
        date: latestCall.createdAt || row.lastActivityDate,
        summary: `${calls.length} call${calls.length === 1 ? "" : "s"} for ${option}`,
        meta:
          directions.length > 1
            ? "Mixed"
            : normalizeLabel(latestCall.direction),
        call: latestCall,
        calls,
      });
    });

    if (row.calls.callCount > 0 && !callEntries.length) {
      items.push({
        id: `calls-${row.customerId ?? row.phone}`,
        module: "calls",
        option: baseOption,
        customer: row,
        title: row.name || "Unknown customer",
        status: normalizeLabel(row.calls.lastDisposition || row.finalStatus),
        owner: normalizeLabel(row.calls.lastAgentName),
        date: row.calls.lastCallDate || row.lastActivityDate,
        summary:
          row.calls.lastNotes ||
          `${row.calls.callCount} calls: ${row.calls.inbound} inbound, ${row.calls.outbound} outbound, ${row.calls.missed} missed`,
        meta: normalizeLabel(row.calls.lastDirection),
      });
    }

    row.tickets.forEach((ticket) => {
      const option = normalizeLabel(ticket.campaignOption) || baseOption;
      items.push({
        id: `ticket-${ticket.ticketId}`,
        module: "tickets",
        option,
        customer: row,
        title: ticket.ticketLabel || `Ticket #${ticket.ticketId}`,
        status: normalizeLabel(ticket.status),
        owner: normalizeLabel(ticket.agentName),
        date: ticket.createdAt || row.lastActivityDate,
        summary: ticket.issueSnippet || "No issue detail.",
        meta: normalizeLabel(ticket.priority),
        ticket,
      });
    });

    row.manualRecords.forEach((manual) => {
      const option = normalizeLabel(manual.campaignOption) || baseOption;
      items.push({
        id: `manual-${manual.id}`,
        module: "manual",
        option,
        customer: row,
        title: normalizeLabel(manual.disposition),
        status: normalizeLabel(manual.status || manual.disposition),
        owner: normalizeLabel(manual.agentName || "Manual record"),
        date: manual.createdAt || row.lastActivityDate,
        summary: manual.notes || "No notes.",
        meta: option,
        manual,
      });
    });

    return items;
  });
}

function getRowAgents(row: MatrixCustomerRow) {
  return unique(
    [
      normalizeLabel(row.calls.lastAgentName),
      ...(row.calls.entries ?? []).map((call) =>
        normalizeLabel(call.agentName),
      ),
      ...row.tickets.map((ticket) => normalizeLabel(ticket.agentName)),
    ].filter((agent) => agent !== "Unspecified"),
  );
}

function getRowDays(row: MatrixCustomerRow) {
  return unique(
    [
      formatDay(row.calls.lastCallDate),
      ...(row.calls.entries ?? []).map((call) => formatDay(call.createdAt)),
      ...row.tickets.map((ticket) => formatDay(ticket.createdAt)),
      ...row.manualRecords.map((record) => formatDay(record.createdAt)),
    ].filter((day) => day !== "Unspecified"),
  );
}

function getRowModules(row: MatrixCustomerRow) {
  return [
    row.calls.callCount > 0 ? "Calls" : null,
    row.tickets.length > 0 ? "Tickets" : null,
    row.manualRecords.length > 0 ? "Manual" : null,
  ].filter(Boolean) as string[];
}

const AR_POSITIVE_OUTCOMES = new Set(["Paid", "Offline Payment", "Balance 0"]);
const ONBOARDING_POSITIVE_OUTCOMES = new Set(["Registered", "Paid with LL"]);

function getRowTouchpointBucket(row: MatrixCustomerRow): string {
  const count =
    (row.calls.callCount ?? 0) +
    (row.tickets?.length ?? 0) +
    (row.manualRecords?.length ?? 0);
  if (count <= 0) return "0";
  if (count >= 4) return "4+";
  return String(count);
}

function getRowFunnelStages(
  row: MatrixCustomerRow,
  isAr: boolean,
): string[] {
  const stages: string[] = ["contacted"];
  const hasProductiveCall = (row.calls.entries ?? []).some(
    (entry) =>
      entry.direction !== "Missed" &&
      entry.direction !== "Voicemail" &&
      (entry.durationSec ?? 0) > 0,
  );
  if (hasProductiveCall || row.tickets.length > 0 || row.manualRecords.length > 0)
    stages.push("engaged");
  const positiveSet = isAr ? AR_POSITIVE_OUTCOMES : ONBOARDING_POSITIVE_OUTCOMES;
  if (positiveSet.has(row.finalStatus)) stages.push("converted");
  return stages;
}

function getRowHeatmapKeys(row: MatrixCustomerRow): string[] {
  const keys = new Set<string>();
  const collect = (iso?: string | null) => {
    if (!iso) return;
    const date = new Date(iso);
    if (Number.isNaN(date.getTime())) return;
    keys.add(`${date.getDay()}_${date.getHours()}`);
  };
  (row.calls.entries ?? []).forEach((entry) => collect(entry.createdAt));
  row.tickets.forEach((ticket) => collect(ticket.createdAt));
  row.manualRecords.forEach((record) => collect(record.createdAt));
  return [...keys];
}

function matchesFilters(
  row: MatrixCustomerRow,
  filters: CampaignFilters,
  isAr: boolean,
) {
  const status = normalizeLabel(row.finalStatus);
  if (filters.status.length && !filters.status.includes(status)) return false;
  if (
    filters.option.length &&
    !getRowOptions(row).some((item) => filters.option.includes(item))
  )
    return false;
  if (
    filters.agent.length &&
    !getRowAgents(row).some((item) => filters.agent.includes(item))
  )
    return false;
  if (
    filters.day.length &&
    !getRowDays(row).some((item) => filters.day.includes(item))
  )
    return false;
  if (
    filters.module.length &&
    !getRowModules(row).some((item) => filters.module.includes(item))
  )
    return false;
  if (filters.funnel.length) {
    const stages = getRowFunnelStages(row, isAr);
    if (!filters.funnel.some((stage) => stages.includes(stage))) return false;
  }
  if (filters.touchpoints.length) {
    const bucket = getRowTouchpointBucket(row);
    if (!filters.touchpoints.includes(bucket)) return false;
  }
  if (filters.heatmap.length) {
    const keys = getRowHeatmapKeys(row);
    if (!filters.heatmap.some((key) => keys.includes(key))) return false;
  }
  if (filters.disposition?.length) {
    const rowDispositions = (row.calls.entries ?? []).length
      ? (row.calls.entries ?? []).map((c) => normalizeLabel(c.disposition))
      : row.calls.callCount > 0
      ? [normalizeLabel(row.calls.lastDisposition)]
      : [];
    if (!filters.disposition.some((disp) => rowDispositions.includes(disp)))
      return false;
  }
  return true;
}

function countBy(values: string[]) {
  const map = new Map<string, number>();
  values.forEach((value) => map.set(value, (map.get(value) ?? 0) + 1));
  return Array.from(map.entries())
    .map(([key, value]) => ({ key, name: key, value }))
    .sort((a, b) => b.value - a.value);
}

function getRecordStatusLabel(record: CampaignRecordItem) {
  if (record.module === "calls") {
    return normalizeLabel(record.call?.status || "Active");
  }
  return normalizeLabel(record.status);
}

function buildDayData(rows: MatrixCustomerRow[]): DayDatum[] {
  const map = new Map<string, DayDatum>();
  const ensure = (day: string) => {
    const current = map.get(day) ?? {
      key: day,
      day: formatDate(day),
      calls: 0,
      tickets: 0,
      manual: 0,
    };
    map.set(day, current);
    return current;
  };

  rows.forEach((row) => {
    if (row.calls.callCount > 0) {
      ensure(formatDay(row.calls.lastCallDate)).calls += row.calls.callCount;
    }
    row.tickets.forEach((ticket) => {
      ensure(formatDay(ticket.createdAt)).tickets += 1;
    });
    row.manualRecords.forEach((record) => {
      ensure(formatDay(record.createdAt)).manual += 1;
    });
  });

  return Array.from(map.values())
    .filter((day) => day.key !== "Unspecified")
    .sort((a, b) => a.key.localeCompare(b.key));
}

function toggleFilter(filters: CampaignFilters, key: FilterKey, value: string) {
  const current = filters[key];
  const nextValues = current.includes(value)
    ? current.filter((item) => item !== value)
    : [...current, value];
  return { ...filters, [key]: nextValues };
}

function CampaignReportHeader({
  report,
  selectedCampaign,
  startDate,
  endDate,
  crossFilters,
  canExport,
  activeTab,
  recordsCount,
  onTabChange,
  onOpenFilters,
  onRemoveFilter,
  onClearFilters,
  onExportPDF,
  onExportExcel,
  isExportingPdf = false,
  isExportingExcel = false,
}: {
  report: CampaignFullReport | null;
  selectedCampaign: Campaign | null;
  startDate: string;
  endDate: string;
  crossFilters: CampaignFilters;
  canExport: boolean;
  activeTab: CampaignReportTab;
  recordsCount: number;
  onTabChange: (tab: CampaignReportTab) => void;
  onOpenFilters: () => void;
  onRemoveFilter: (key: FilterKey, value: string) => void;
  onClearFilters: () => void;
  onExportPDF: () => void;
  onExportExcel: () => void;
  isExportingPdf?: boolean;
  isExportingExcel?: boolean;
}) {
  const title =
    report?.campaign.nombre || selectedCampaign?.nombre || "Campaign report";
  const hasDateRange = Boolean(startDate && endDate);
  const filterChips = (Object.keys(crossFilters) as FilterKey[]).flatMap(
    (key) => crossFilters[key].map((value) => ({ key, value })),
  );
  const hasFilters = filterChips.length > 0;

  return (
    <header className="shrink-0">
      <div className={yardDashboardToolbarClass}>
        <div className="flex min-w-0 flex-1 flex-wrap items-center gap-2 md:gap-3">
          <Megaphone
            className="size-4 shrink-0 text-[#008f68] dark:text-emerald-400"
            aria-hidden
          />
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-slate-900 dark:text-slate-100">
              {title}
            </p>
            <p className="text-[10px] font-medium uppercase tracking-wide text-slate-400">
              Campaign performance
            </p>
          </div>

          {hasDateRange ? (
            <div className="flex min-w-0 flex-1 flex-wrap items-center gap-1.5">
              <YardContextChip
                label="Range"
                value={`${startDate} to ${endDate}`}
              />
              {report?.campaign.yardaName ? (
                <YardContextChip
                  label="Yard"
                  value={report.campaign.yardaName}
                />
              ) : null}
              {hasFilters ? (
                <>
                  {filterChips.map((chip) => {
                    const display = formatFilterValue(chip.key, chip.value);
                    return (
                      <button
                        key={`${chip.key}:${chip.value}`}
                        type="button"
                        onClick={() => onRemoveFilter(chip.key, chip.value)}
                        title={`Remove filter ${FILTER_LABELS[chip.key]}: ${display}`}
                        className="inline-flex h-6 max-w-[220px] items-center gap-1 rounded-md border border-emerald-200/80 bg-emerald-50 px-1.5 text-[11px] font-medium text-emerald-800 transition-colors hover:bg-emerald-100 dark:border-emerald-500/30 dark:bg-emerald-500/15 dark:text-emerald-100 dark:hover:bg-emerald-500/25"
                      >
                        <span className="text-[9px] font-semibold uppercase tracking-wide text-[#008f68] dark:text-emerald-300">
                          {FILTER_LABELS[chip.key]}
                        </span>
                        <span className="truncate">{display}</span>
                        <X className="size-3 shrink-0" aria-hidden />
                      </button>
                    );
                  })}
                  <button
                    type="button"
                    onClick={onClearFilters}
                    className="inline-flex h-6 items-center rounded-md px-1.5 text-[10px] font-medium text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-700 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-200"
                    title="Clear all filters"
                  >
                    Clear all
                  </button>
                </>
              ) : null}
            </div>
          ) : null}
        </div>

        {report ? (
          <YardSegmentedTabs<CampaignReportTab>
            tabs={[
              { value: "dashboard", label: "Dashboard", icon: BarChart3 },
              {
                value: "records",
                label: "Records",
                icon: ListFilter,
                count: recordsCount,
              },
            ]}
            activeValue={activeTab}
            onChange={onTabChange}
            ariaLabel="Campaign report view"
            className="order-last w-full sm:order-none sm:w-auto"
          />
        ) : null}

        <div className="flex w-full flex-wrap items-center gap-1.5 rounded-lg border border-slate-200/80 bg-slate-100/80 p-0.5 sm:w-auto dark:border-slate-800 dark:bg-slate-900/80">
          <button
            type="button"
            onClick={onOpenFilters}
            className={cn(
              "flex h-8 items-center gap-1.5 rounded-lg px-3 text-xs font-medium shadow-sm transition-colors",
              hasDateRange
                ? "bg-[#008f68] text-white hover:bg-[#007a5a]"
                : "bg-white text-slate-600 hover:bg-slate-50 dark:bg-slate-950 dark:text-slate-300",
            )}
          >
            <Filter className="size-3.5" aria-hidden />
            <span>Configure</span>
          </button>
          {canExport ? (
            <>
              <button
                type="button"
                onClick={onExportPDF}
                disabled={isExportingPdf}
                aria-busy={isExportingPdf}
                className={cn(
                  "flex h-8 items-center gap-1.5 rounded-lg bg-white px-3 text-xs font-medium text-slate-600 shadow-sm transition-colors hover:bg-slate-50 dark:bg-slate-950 dark:text-slate-300",
                  isExportingPdf && "cursor-not-allowed opacity-70",
                )}
              >
                {isExportingPdf ? (
                  <Loader2 className="size-3.5 animate-spin" aria-hidden />
                ) : (
                  <Download className="size-3.5" aria-hidden />
                )}
                <span>{isExportingPdf ? "Preparing…" : "PDF"}</span>
              </button>
              <button
                type="button"
                onClick={onExportExcel}
                disabled={isExportingExcel}
                aria-busy={isExportingExcel}
                className={cn(
                  "flex h-8 items-center gap-1.5 rounded-lg bg-white px-3 text-xs font-medium text-slate-600 shadow-sm transition-colors hover:bg-slate-50 dark:bg-slate-950 dark:text-slate-300",
                  isExportingExcel && "cursor-not-allowed opacity-70",
                )}
              >
                {isExportingExcel ? (
                  <Loader2 className="size-3.5 animate-spin" aria-hidden />
                ) : (
                  <FileSpreadsheet className="size-3.5" aria-hidden />
                )}
                <span>{isExportingExcel ? "Preparing…" : "Excel"}</span>
              </button>
            </>
          ) : null}
        </div>
      </div>
    </header>
  );
}

function BreakdownChart({
  title,
  subtitle,
  data,
  filterKey,
  filters,
  onToggle,
  icon,
}: {
  title: string;
  subtitle: string;
  data: ChartDatum[];
  filterKey: FilterKey;
  filters: CampaignFilters;
  onToggle: (key: FilterKey, value: string) => void;
  icon: LucideIcon;
}) {
  const activeValues = filters[filterKey];
  const hasDimensionFilter = activeValues.length > 0;
  const rows = data.slice(0, 8);
  const height = Math.max(140, rows.length * 30 + 20);

  return (
    <PanelCard
      fill
      title={title}
      subtitle={`${subtitle} - Click a bar to filter`}
      icon={icon}
      bodyClassName="!py-2"
    >
      {rows.length === 0 ? (
        <DashboardEmptyState message="No data recorded" compact />
      ) : (
        <div className="w-full min-h-0" style={{ height }}>
          <DashboardChart size="sm" fill className="!h-full min-h-0">
            <BarChart
              data={rows}
              layout="vertical"
              margin={{ left: 4, right: 12, top: 0, bottom: 0 }}
            >
              <XAxis type="number" hide />
              <YAxis
                type="category"
                dataKey="name"
                tickLine={false}
                axisLine={false}
                width={92}
                tick={chartAxisTickStyle}
              />
              <Tooltip
                contentStyle={tooltipStyle}
                formatter={(value) => [value, "Count"]}
              />
              <Bar
                dataKey="value"
                radius={[0, 4, 4, 0]}
                maxBarSize={18}
                cursor="pointer"
                onClick={(bar) => {
                  const row = bar as ChartDatum;
                  onToggle(filterKey, row.key);
                }}
              >
                {rows.map((row) => {
                  const isActive = activeValues.includes(row.key);
                  return (
                    <Cell
                      key={row.key}
                      fill={
                        row.fill ||
                        STATUS_COLORS[row.key] ||
                        toneClasses.emerald.chart
                      }
                      fillOpacity={!hasDimensionFilter || isActive ? 1 : 0.28}
                    />
                  );
                })}
              </Bar>
            </BarChart>
          </DashboardChart>
        </div>
      )}
    </PanelCard>
  );
}

function ActivityChart({
  data,
  filters,
  onToggle,
}: {
  data: DayDatum[];
  filters: CampaignFilters;
  onToggle: (key: FilterKey, value: string) => void;
}) {
  const hasDayFilter = filters.day.length > 0;
  return (
    <PanelCard
      fill
      title="Campaign activity"
      subtitle="Calls, tickets and manual records by day - Click a day to filter"
      icon={BarChart3}
    >
      {data.length === 0 ? (
        <DashboardEmptyState message="No activity in period." compact />
      ) : (
        <DashboardChart size="sm">
          <BarChart
            data={data}
            margin={{ left: -12, right: 4, top: 4, bottom: 0 }}
          >
            <CartesianGrid
              strokeDasharray="3 3"
              stroke={chartGridStroke}
              vertical={false}
            />
            <XAxis
              dataKey="day"
              tickLine={false}
              axisLine={false}
              tick={chartAxisTickStyle}
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              tick={chartAxisTickStyle}
              width={28}
              allowDecimals={false}
            />
            <Tooltip contentStyle={tooltipStyle} />
            <Legend wrapperStyle={chartLegendStyle} />
            {[
              ["calls", "Calls", toneClasses.sky.chart],
              ["tickets", "Tickets", toneClasses.emerald.chart],
              ["manual", "Manual", toneClasses.indigo.chart],
            ].map(([key, label, color]) => (
              <Bar
                key={key}
                dataKey={key}
                name={label}
                fill={color}
                radius={[3, 3, 0, 0]}
                maxBarSize={24}
                cursor="pointer"
                onClick={(bar) => {
                  const row = bar as DayDatum;
                  onToggle("day", row.key);
                }}
              >
                {data.map((row) => (
                  <Cell
                    key={`${key}-${row.key}`}
                    fillOpacity={
                      !hasDayFilter || filters.day.includes(row.key) ? 1 : 0.28
                    }
                  />
                ))}
              </Bar>
            ))}
          </BarChart>
        </DashboardChart>
      )}
    </PanelCard>
  );
}

function ModulePanel({
  title,
  value,
  detail,
  tone,
  icon: Icon,
  filterValue,
  active,
  onToggle,
}: {
  title: string;
  value: number;
  detail: string;
  tone: Tone;
  icon: LucideIcon;
  filterValue: string;
  active: boolean;
  onToggle: (key: FilterKey, value: string) => void;
}) {
  const toneClass = toneClasses[tone];
  return (
    <button
      type="button"
      onClick={() => onToggle("module", filterValue)}
      className={cn(
        "flex min-h-[76px] items-center gap-3 rounded-2xl border bg-white px-3 py-2 text-left shadow-[0_1px_3px_rgba(0,0,0,0.06)] transition-colors dark:bg-slate-950",
        active
          ? "border-emerald-300 ring-2 ring-emerald-100 dark:ring-emerald-500/20"
          : "border-slate-200/80 hover:border-slate-300 dark:border-slate-800",
      )}
    >
      <span
        className={cn(
          "flex size-9 shrink-0 items-center justify-center rounded-lg",
          toneClass.iconWrap,
        )}
      >
        <Icon className={cn("size-4", toneClass.icon)} aria-hidden />
      </span>
      <span className="min-w-0">
        <span className="block text-[10px] font-semibold uppercase tracking-widest text-slate-400">
          {title}
        </span>
        <span className="mt-0.5 block text-xl font-bold tabular-nums text-slate-900 dark:text-slate-100">
          {value}
        </span>
        <span className="block truncate text-[11px] text-slate-500 dark:text-slate-400">
          {detail}
        </span>
      </span>
    </button>
  );
}

function RecordsTab({
  rows,
  filters,
  onToggleFilter,
}: {
  rows: Array<MatrixCustomerRow & { bucket: string }>;
  filters: CampaignFilters;
  onToggleFilter: (key: FilterKey, value: string) => void;
}) {
  const [search, setSearch] = useState("");
  const [recordModule, setRecordModule] = useState<RecordModule>("calls");
  const [recordStatusFilters, setRecordStatusFilters] = useState<string[]>([]);
  const [expandedCallRows, setExpandedCallRows] = useState<string[]>([]);
  const [selectedRecord, setSelectedRecord] =
    useState<CampaignRecordItem | null>(null);

  const records = useMemo(() => buildCampaignRecordItems(rows), [rows]);
  const normalizedSearch = search.trim().toLowerCase();
  useEffect(() => {
    setRecordStatusFilters([]);
    setExpandedCallRows([]);
  }, [recordModule]);

  const moduleRecords = useMemo(
    () => records.filter((record) => record.module === recordModule),
    [recordModule, records],
  );
  const searchedRecords = useMemo(() => {
    const statusScopedRecords = recordStatusFilters.length
      ? moduleRecords.filter((record) =>
          recordStatusFilters.includes(getRecordStatusLabel(record)),
        )
      : moduleRecords;

    if (!normalizedSearch) return statusScopedRecords;

    return statusScopedRecords.filter((record) => {
      const row = record.customer;
      const searchable = [
        record.title,
        record.status,
        record.owner,
        record.option,
        record.summary,
        record.meta,
        row.name,
        row.phone,
        row.finalStatus,
        row.bucket,
        row.calls.lastAgentName,
        row.calls.lastDirection,
        row.calls.lastDisposition,
        row.calls.lastNotes,
        ...getRowOptions(row),
        ...getRowModules(row),
        ...row.tickets.flatMap((ticket) => [
          ticket.ticketLabel,
          ticket.status,
          ticket.priority,
          ticket.agentName,
          ticket.issueSnippet,
          ticket.campaignOption,
        ]),
        ...row.manualRecords.flatMap((record) => [
          record.disposition,
          record.campaignOption,
          record.notes,
        ]),
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return searchable.includes(normalizedSearch);
    });
  }, [moduleRecords, normalizedSearch, recordStatusFilters]);

  const groupedRecords = useMemo(() => {
    const groups = new Map<string, CampaignRecordItem[]>();
    searchedRecords.forEach((record) => {
      const current = groups.get(record.option) ?? [];
      current.push(record);
      groups.set(record.option, current);
    });
    return Array.from(groups.entries())
      .map(([option, items]) => ({ option, items }))
      .sort(
        (a, b) =>
          b.items.length - a.items.length || a.option.localeCompare(b.option),
      );
  }, [searchedRecords]);

  const optionFilters = countBy(
    moduleRecords.map((record) => record.option),
  ).slice(0, 8);
  const statusFilters = countBy(moduleRecords.map(getRecordStatusLabel)).slice(
    0,
    6,
  );
  const agentFilters = countBy(
    moduleRecords
      .map((record) => record.owner)
      .filter((owner) => owner !== "Unspecified" && owner !== "Manual record"),
  ).slice(0, 6);
  const moduleCounts = {
    calls: records.filter((record) => record.module === "calls").length,
    tickets: records.filter((record) => record.module === "tickets").length,
    manual: records.filter((record) => record.module === "manual").length,
  };
  const moduleLabel = RECORD_MODULE_LABELS[recordModule];

  return (
    <>
      <PanelCard
        title="Campaign records"
        subtitle={`${searchedRecords.length} ${moduleLabel.toLowerCase()} grouped by campaign option`}
        icon={ListFilter}
        bodyClassName="!p-0"
        action={
          <div className="relative w-full min-w-[240px] sm:w-[320px] sm:max-w-[42vw]">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-slate-400" />
            <Input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder={`Search ${moduleLabel.toLowerCase()}...`}
              className="h-9 rounded-lg border-transparent bg-slate-50 pl-8 pr-3 text-xs shadow-none focus-visible:border-[#008f68] focus-visible:ring-[#008f68]/20 dark:bg-slate-900"
            />
          </div>
        }
      >
        <div className="flex flex-col gap-3 px-3 py-3">
          <YardSegmentedTabs<RecordModule>
            tabs={[
              {
                value: "calls",
                label: "Calls",
                icon: Phone,
                count: moduleCounts.calls,
              },
              {
                value: "tickets",
                label: "Tickets",
                icon: Ticket,
                count: moduleCounts.tickets,
              },
              {
                value: "manual",
                label: "Manual Records",
                icon: ClipboardList,
                count: moduleCounts.manual,
              },
            ]}
            activeValue={recordModule}
            onChange={setRecordModule}
            ariaLabel="Record module"
            className="w-full !min-w-0"
          />

          <div className="grid items-stretch gap-2 md:grid-cols-2 xl:grid-cols-3">
            <FilterGroup label="Option">
              {optionFilters.map((option) => (
                <FilterPill
                  key={`option-${option.key}`}
                  label={option.name}
                  count={option.value}
                  active={filters.option.includes(option.key)}
                  onClick={() => onToggleFilter("option", option.key)}
                />
              ))}
            </FilterGroup>
            <FilterGroup label="Status">
              {statusFilters.map((status) => (
                <FilterPill
                  key={`status-${status.key}`}
                  label={status.name}
                  count={status.value}
                  active={recordStatusFilters.includes(status.key)}
                  onClick={() => {
                    setRecordStatusFilters((current) =>
                      current.includes(status.key)
                        ? current.filter((item) => item !== status.key)
                        : [...current, status.key],
                    );
                  }}
                />
              ))}
            </FilterGroup>
            <FilterGroup label="Agent">
              {agentFilters.length > 0 ? (
                agentFilters.map((agent) => (
                  <FilterPill
                    key={`agent-${agent.key}`}
                    label={agent.name}
                    count={agent.value}
                    active={filters.agent.includes(agent.key)}
                    onClick={() => onToggleFilter("agent", agent.key)}
                  />
                ))
              ) : (
                <span className="flex h-8 items-center justify-center rounded-lg border border-dashed border-slate-200 bg-white/70 px-2 text-xs font-medium text-slate-400 dark:border-slate-700 dark:bg-slate-950/60">
                  No agents
                </span>
              )}
            </FilterGroup>
          </div>
        </div>
      </PanelCard>

      {searchedRecords.length === 0 ? (
        <div className="rounded-2xl bg-white px-3 py-8 shadow-[0_1px_3px_rgba(0,0,0,0.06)] dark:bg-slate-950">
          <DashboardEmptyState
            message="No records match the selected filters."
            compact
          />
        </div>
      ) : (
        <div className="overflow-x-auto">
          {groupedRecords.map((group) => (
            <section
              key={group.option}
              className="border-b border-slate-100 last:border-b-0 dark:border-slate-800"
            >
              <div className="sticky top-0 z-10 flex items-center justify-between gap-3 border-b border-slate-100 bg-slate-50/95 px-3 py-2 backdrop-blur dark:border-slate-800 dark:bg-slate-900/95">
                <div className="min-w-0">
                  <h3 className="truncate text-xs font-bold text-slate-800 dark:text-slate-100">
                    {group.option}
                  </h3>
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                    Campaign option
                  </p>
                </div>
                <span className="rounded-md border border-slate-200 bg-white px-2 py-0.5 text-[10px] font-bold tabular-nums text-slate-600 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-300">
                  {group.items.length}
                </span>
              </div>

              <RecordsTable
                module={recordModule}
                records={group.items}
                onSelect={setSelectedRecord}
                expandedCallRows={expandedCallRows}
                onToggleCallRow={(recordId) => {
                  setExpandedCallRows((current) =>
                    current.includes(recordId)
                      ? current.filter((item) => item !== recordId)
                      : [...current, recordId],
                  );
                }}
              />
            </section>
          ))}
        </div>
      )}

      <RecordDetailSheet
        record={selectedRecord}
        open={Boolean(selectedRecord)}
        onOpenChange={(open) => {
          if (!open) setSelectedRecord(null);
        }}
      />
    </>
  );
}

function RecordsTable({
  module,
  records,
  onSelect,
  expandedCallRows,
  onToggleCallRow,
}: {
  module: RecordModule;
  records: CampaignRecordItem[];
  onSelect: (record: CampaignRecordItem) => void;
  expandedCallRows: string[];
  onToggleCallRow: (recordId: string) => void;
}) {
  if (module !== "calls") {
    return (
      <TicketLikeRecordsTable
        module={module}
        records={records}
        onSelect={onSelect}
      />
    );
  }

  const headers = [
    "ID",
    "Customer",
    "Contact",
    "Status",
    "Direction",
    "Disposition",
    "Agent",
    "Calls",
    "Date",
    "Issue",
  ];

  return (
    <table className="w-full min-w-[1450px] table-fixed border-collapse bg-white text-sm dark:bg-slate-950">
      <colgroup>
        <col className="w-[70px]" />
        <col className="w-[16%]" />
        <col className="w-[17%]" />
        <col className="w-[13%]" />
        <col className="w-[13%]" />
        <col className="w-[13%]" />
        <col className="w-[13%]" />
        <col className="w-[8%]" />
        <col className="w-[16%]" />
        <col className="w-[8%]" />
      </colgroup>
      <thead className="border-b border-slate-200 bg-slate-50/80 dark:border-slate-800 dark:bg-slate-900/80">
        <tr>
          {headers.map((header, index) => (
            <th
              key={header}
              className={cn(
                "h-12 px-3 text-left text-[11px] font-bold uppercase tracking-[0.16em] text-slate-400",
                index === 0 && "w-[70px] pl-4",
                header === "Issue" && "text-right pr-4",
              )}
            >
              {header}
            </th>
          ))}
        </tr>
      </thead>
      <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
        {records.map((record) => (
          <RecordRows
            key={record.id}
            record={record}
            onSelect={onSelect}
            expanded={expandedCallRows.includes(record.id)}
            onToggleCallRow={onToggleCallRow}
          />
        ))}
      </tbody>
    </table>
  );
}

function TicketLikeRecordsTable({
  module,
  records,
  onSelect,
}: {
  module: Exclude<RecordModule, "calls">;
  records: CampaignRecordItem[];
  onSelect: (record: CampaignRecordItem) => void;
}) {
  const includeLine = module === "tickets";
  const headers = [
    "ID",
    "Customer",
    module === "tickets" ? "Tickets" : "Records",
    "Status",
    "Priority",
    "Type",
    "Agent",
    "Yard",
    ...(includeLine ? ["Line"] : []),
    "Created",
  ];

  return (
    <table className="w-full min-w-[1450px] table-fixed border-collapse bg-white text-sm dark:bg-slate-950">
      <colgroup>
        {includeLine ? (
          <>
            <col className="w-[5%]" />
            <col className="w-[15%]" />
            <col className="w-[11%]" />
            <col className="w-[9%]" />
            <col className="w-[8%]" />
            <col className="w-[9%]" />
            <col className="w-[11%]" />
            <col className="w-[9%]" />
            <col className="w-[7%]" />
            <col className="w-[16%]" />
          </>
        ) : (
          <>
            <col className="w-[5%]" />
            <col className="w-[17%]" />
            <col className="w-[11%]" />
            <col className="w-[9%]" />
            <col className="w-[8%]" />
            <col className="w-[10%]" />
            <col className="w-[11%]" />
            <col className="w-[10%]" />
            <col className="w-[19%]" />
          </>
        )}
      </colgroup>
      <thead className="border-b border-slate-200 bg-slate-50/80 dark:border-slate-800 dark:bg-slate-900/80">
        <tr>
          {headers.map((header, index) => (
            <th
              key={header}
              className={cn(
                "h-12 px-3 text-left text-[11px] font-bold uppercase tracking-[0.16em] text-slate-400",
                index === 0 && "pl-4",
                header === "Created" && "text-right pr-4",
              )}
            >
              {header}
            </th>
          ))}
        </tr>
      </thead>
      <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
        {records.map((record, index) => {
          const ticketIndex = record.ticket
            ? record.customer.tickets.findIndex(
                (ticket) => ticket.ticketId === record.ticket?.ticketId,
              ) + 1
            : 0;
          const row =
            record.module === "tickets"
              ? {
                  id: record.ticket?.ticketId,
                  count: `${ticketIndex || 1} of ${record.customer.tickets.length} ticket${record.customer.tickets.length === 1 ? "" : "s"}`,
                  status: normalizeLabel(record.ticket?.status),
                  priority: normalizeLabel(record.ticket?.priority),
                  type: normalizeLabel(record.ticket?.ticketType),
                  agent: normalizeLabel(record.ticket?.agentName),
                  yard: normalizeLabel(record.ticket?.yardName),
                  campaign: normalizeLabel(record.ticket?.campaignName),
                  line: normalizeLabel(record.ticket?.phoneLine),
                  created: record.ticket?.createdAt || record.date,
                  issue: Boolean(record.ticket?.issueSnippet),
                }
              : {
                  id: record.manual?.id,
                  count: `${index + 1} of ${records.length} record${records.length === 1 ? "" : "s"}`,
                  status: normalizeLabel(
                    record.manual?.status || record.status,
                  ),
                  priority: "Manual",
                  type: "Manual record",
                  agent: normalizeLabel(
                    record.manual?.agentName || record.owner,
                  ),
                  yard: normalizeLabel(record.manual?.yardName),
                  campaign: normalizeLabel(record.manual?.campaignName),
                  line: "—",
                  created: record.manual?.createdAt || record.date,
                  issue: Boolean(record.manual?.notes),
                };

          return (
            <tr
              key={record.id}
              className="cursor-pointer border-b border-slate-100 bg-white transition-colors hover:bg-[#f8fbfa] dark:border-slate-800 dark:bg-slate-950 dark:hover:bg-slate-900/70"
              onClick={() => onSelect(record)}
            >
              <td className="px-3 py-3 pl-4 align-middle">
                <span className="inline-flex h-7 min-w-11 items-center justify-center rounded-full border border-slate-200 bg-slate-100/80 px-2 text-xs font-semibold tabular-nums text-slate-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300">
                  #{row.id || "N/A"}
                </span>
              </td>
              <td className="px-3 py-3 align-middle">
                <div className="max-w-full truncate font-bold text-slate-900 dark:text-slate-100">
                  {record.customer.name || "Unknown customer"}
                </div>
                <div className="mt-0.5 max-w-full truncate text-[11px] font-medium text-slate-400">
                  {record.customer.phone || "No phone"}
                </div>
              </td>
              <td className="px-3 py-3 align-middle">
                <div className="max-w-full truncate">
                  <CallsBadge label={row.count} module={record.module} />
                </div>
              </td>
              <td className="px-3 py-3 align-middle">
                <RecordStatusBadge label={row.status} />
              </td>
              <td className="px-3 py-3 align-middle">
                <SoftPill label={row.priority} />
              </td>
              <td className="px-3 py-3 align-middle">
                <span
                  className="block truncate text-xs font-semibold text-slate-600 dark:text-slate-300"
                  title={row.type}
                >
                  {row.type}
                </span>
              </td>
              <td className="px-3 py-3 align-middle">
                <span className="inline-flex max-w-full items-center gap-1.5 truncate font-medium text-slate-500 dark:text-slate-400">
                  <User
                    className="size-3.5 shrink-0 text-slate-300"
                    aria-hidden
                  />
                  <span className="truncate">{row.agent}</span>
                </span>
              </td>
              <td className="px-3 py-3 align-middle">
                <span
                  className="block truncate text-xs font-semibold text-slate-600 dark:text-slate-300"
                  title={row.yard}
                >
                  {row.yard}
                </span>
              </td>
              {includeLine ? (
                <td className="px-3 py-3 align-middle">
                  <span
                    className="block truncate text-xs font-semibold text-slate-600 dark:text-slate-300"
                    title={row.line}
                  >
                    {row.line}
                  </span>
                </td>
              ) : null}
              <td className="px-3 py-3 pr-4 text-right align-middle">
                <span className="inline-flex items-center gap-3 whitespace-nowrap">
                  <span className="text-xs font-semibold text-slate-500">
                    {formatDateTime(row.created)}
                  </span>
                  {row.issue ? (
                    <button
                      type="button"
                      className="inline-flex items-center gap-1.5 text-xs font-bold text-[#008f68] hover:text-[#007a59]"
                      onClick={(event) => {
                        event.stopPropagation();
                        onSelect(record);
                      }}
                    >
                      <FileText className="size-3.5" aria-hidden />
                      View
                    </button>
                  ) : null}
                </span>
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}

function RecordRows({
  record,
  onSelect,
  expanded,
  onToggleCallRow,
}: {
  record: CampaignRecordItem;
  onSelect: (record: CampaignRecordItem) => void;
  expanded: boolean;
  onToggleCallRow: (recordId: string) => void;
}) {
  const callRows = record.calls?.length
    ? record.calls
    : record.call
      ? [record.call]
      : [];
  const primaryCall = callRows[0] ?? record.call;
  const secondaryCalls = callRows.slice(1);
  const idLabel =
    record.module === "calls"
      ? primaryCall?.callId
      : record.module === "tickets"
        ? record.ticket?.ticketId
        : record.manual?.id;
  const direction =
    record.module === "calls"
      ? normalizeLabel(primaryCall?.direction || record.meta)
      : record.module === "tickets"
        ? `Ticket ${record.title}`
        : "Manual";
  const callsLabel =
    record.module === "calls"
      ? `${record.calls?.length ?? 1} call${(record.calls?.length ?? 1) === 1 ? "" : "s"}`
      : record.module === "tickets"
        ? `${record.customer.tickets.findIndex((ticket) => ticket.ticketId === record.ticket?.ticketId) + 1 || 1} of ${record.customer.tickets.length} ticket${record.customer.tickets.length === 1 ? "" : "s"}`
        : record.customer.calls.callCount > 0
          ? `${record.customer.calls.callCount} call${record.customer.calls.callCount === 1 ? "" : "s"}`
          : "-";
  const hasIssue =
    record.module === "tickets"
      ? Boolean(record.ticket?.issueSnippet)
      : record.module === "manual"
        ? Boolean(record.manual?.notes)
        : Boolean(
            record.calls?.some((call) => call.notes) ||
            record.call?.notes ||
            record.customer.calls.lastNotes,
          );
  const canOpenCalls =
    record.module === "calls" && (record.calls?.length ?? 0) > 1;
  const displayStatus =
    record.module === "calls"
      ? normalizeLabel(primaryCall?.status || "Active")
      : record.status;
  const displayDisposition =
    record.module === "calls"
      ? normalizeLabel(primaryCall?.disposition || record.status)
      : record.module === "tickets"
        ? record.meta
        : record.status;
  const displayOwner =
    record.module === "calls"
      ? normalizeLabel(primaryCall?.agentName || record.owner)
      : record.owner;
  const displayDate =
    record.module === "calls"
      ? primaryCall?.createdAt || record.date
      : record.date;

  return (
    <>
      <RecordTableRow
        idLabel={idLabel ? `#${idLabel}` : "#N/A"}
        customerName={record.customer.name || "Unknown customer"}
        contact={record.customer.phone || "No phone"}
        status={displayStatus}
        direction={direction}
        disposition={displayDisposition}
        owner={displayOwner}
        callsLabel={callsLabel}
        callsModule={record.module}
        date={displayDate}
        hasIssue={hasIssue}
        expanded={expanded}
        expandable={canOpenCalls}
        onSelect={() => onSelect(record)}
        onToggle={canOpenCalls ? () => onToggleCallRow(record.id) : undefined}
      />
      {expanded
        ? secondaryCalls.map((call, index) => (
            <RecordTableRow
              key={`${record.id}-call-${call.callId}`}
              idLabel={`#${call.callId || "N/A"}`}
              customerName={record.customer.name || "Unknown customer"}
              contact={record.customer.phone || "No phone"}
              status={normalizeLabel(call.status || "Active")}
              direction={normalizeLabel(call.direction)}
              disposition={normalizeLabel(call.disposition || record.status)}
              owner={normalizeLabel(call.agentName)}
              callsLabel={`${index + 2} of ${callRows.length} calls`}
              callsModule={record.module}
              date={call.createdAt || record.date}
              hasIssue={Boolean(call.notes)}
              child
              onSelect={() => onSelect(record)}
            />
          ))
        : null}
    </>
  );
}

function RecordTableRow({
  idLabel,
  customerName,
  contact,
  status,
  direction,
  disposition,
  owner,
  callsLabel,
  callsModule,
  date,
  hasIssue,
  expanded,
  expandable,
  child,
  onSelect,
  onToggle,
}: {
  idLabel: string;
  customerName: string;
  contact: string;
  status: string;
  direction: string;
  disposition: string;
  owner: string;
  callsLabel: string;
  callsModule: RecordModule;
  date?: string;
  hasIssue: boolean;
  expanded?: boolean;
  expandable?: boolean;
  child?: boolean;
  onSelect: () => void;
  onToggle?: () => void;
}) {
  return (
    <tr
      className={cn(
        "cursor-pointer border-b border-slate-100 bg-white transition-colors hover:bg-[#f8fbfa] dark:border-slate-800 dark:bg-slate-950 dark:hover:bg-slate-900/70",
        child && "bg-slate-50/70 dark:bg-slate-900/40",
      )}
      onClick={onSelect}
    >
      <td className="px-3 py-3 pl-4 align-middle">
        <span
          className={cn(
            "inline-flex h-7 min-w-11 items-center justify-center rounded-full border px-2 text-xs font-semibold tabular-nums",
            child
              ? "border-slate-200 bg-white text-slate-400 dark:border-slate-700 dark:bg-slate-950"
              : "border-slate-200 bg-slate-100/80 text-slate-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300",
          )}
        >
          {idLabel}
        </span>
      </td>
      <td className="px-3 py-3 align-middle">
        <div className="max-w-[210px] truncate font-bold text-slate-900 dark:text-slate-100">
          {customerName}
        </div>
      </td>
      <td className="px-3 py-3 align-middle">
        <span className="inline-flex max-w-[190px] items-center gap-1.5 truncate font-medium text-slate-500 dark:text-slate-400">
          <Phone className="size-3.5 shrink-0 text-slate-300" aria-hidden />
          <span className="truncate">{contact}</span>
        </span>
      </td>
      <td className="px-3 py-3 align-middle">
        <div className="max-w-full truncate">
          <RecordStatusBadge label={status} />
        </div>
      </td>
      <td className="px-3 py-3 align-middle">
        <div className="max-w-full truncate">
          <DirectionBadge label={direction} module={callsModule} />
        </div>
      </td>
      <td className="px-3 py-3 align-middle">
        <div className="max-w-full truncate">
          <SoftPill label={disposition} />
        </div>
      </td>
      <td className="px-3 py-3 align-middle">
        <span className="inline-flex max-w-[180px] items-center gap-1.5 truncate font-medium text-slate-500 dark:text-slate-400">
          <User className="size-3.5 shrink-0 text-slate-300" aria-hidden />
          <span className="truncate">{owner}</span>
        </span>
      </td>
      <td className="px-3 py-3 align-middle">
        <div className="max-w-full truncate">
          <CallsBadge
            label={callsLabel}
            module={callsModule}
            expanded={expanded}
            expandable={expandable}
            onClick={onToggle}
          />
        </div>
      </td>
      <td className="px-3 py-3 align-middle">
        <span className="inline-flex items-center gap-1.5 whitespace-nowrap font-medium text-slate-500 dark:text-slate-400">
          <CalendarDays className="size-3.5 text-slate-400" aria-hidden />
          {formatDateTime(date)}
        </span>
      </td>
      <td className="px-3 py-3 pr-4 text-right align-middle">
        {hasIssue ? (
          <button
            type="button"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-[#008f68] hover:text-[#007a59]"
            onClick={(event) => {
              event.stopPropagation();
              onSelect();
            }}
          >
            <FileText className="size-3.5" aria-hidden />
            View
          </button>
        ) : (
          <span className="text-xs font-semibold italic text-slate-400">
            No detail
          </span>
        )}
      </td>
    </tr>
  );
}

function RecordStatusBadge({ label }: { label: string }) {
  const normalized = normalizeLabel(label);
  const isResolved = /resolved|completed|closed|done/i.test(normalized);
  const tone = isResolved
    ? "border-emerald-200 bg-emerald-50 text-[#008f68] dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-300"
    : "border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-500/30 dark:bg-blue-500/10 dark:text-blue-300";

  return (
    <span
      className={cn(
        "inline-flex h-7 items-center gap-1.5 rounded-full border px-2.5 text-xs font-bold",
        tone,
      )}
    >
      <span className="size-2 rounded-full bg-current" aria-hidden />
      <span className="max-w-[120px] truncate">{normalized}</span>
    </span>
  );
}

function DirectionBadge({
  label,
  module,
}: {
  label: string;
  module: RecordModule;
}) {
  const normalized = normalizeLabel(label);
  const isInbound = /inbound|call #/i.test(normalized);
  const isOutbound = /outbound/i.test(normalized);
  const tone = isInbound
    ? "border-emerald-200 bg-emerald-50 text-[#008f68] dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-300"
    : isOutbound
      ? "border-orange-200 bg-orange-50 text-orange-600 dark:border-orange-500/30 dark:bg-orange-500/10 dark:text-orange-300"
      : "border-slate-200 bg-slate-50 text-slate-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300";

  return (
    <span
      className={cn(
        "inline-flex h-7 max-w-[180px] items-center gap-1.5 rounded-full border px-2.5 text-xs font-bold",
        tone,
      )}
    >
      {module === "calls" ? (
        <ArrowRight className="size-3.5 shrink-0" aria-hidden />
      ) : null}
      <span className="truncate">{normalized}</span>
    </span>
  );
}

function SoftPill({ label }: { label: string }) {
  return (
    <span className="inline-flex h-7 max-w-[160px] items-center rounded-full border border-slate-200 bg-slate-100/70 px-2.5 text-xs font-medium text-slate-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200">
      <span className="truncate">{normalizeLabel(label)}</span>
    </span>
  );
}

function CallsBadge({
  label,
  module,
  expanded,
  expandable,
  onClick,
}: {
  label: string;
  module: RecordModule;
  expanded?: boolean;
  expandable?: boolean;
  onClick?: () => void;
}) {
  const highlighted = module === "tickets" || module === "manual";
  const className = cn(
    "inline-flex h-7 items-center rounded-full border px-2.5 text-xs font-semibold transition-colors",
    onClick &&
      "cursor-pointer hover:border-[#008f68]/40 hover:bg-[#f0faf5] hover:text-[#008f68]",
    highlighted
      ? "border-sky-200 bg-sky-50 text-sky-700 dark:border-sky-500/30 dark:bg-sky-500/10 dark:text-sky-300"
      : "border-slate-200 bg-white text-slate-600 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-300",
  );

  if (onClick) {
    return (
      <button
        type="button"
        className={className}
        onClick={(event) => {
          event.stopPropagation();
          onClick();
        }}
        title="View grouped call records"
      >
        {label}
        {expandable ? (
          expanded ? (
            <ChevronUp className="ml-1 size-3" aria-hidden />
          ) : (
            <ChevronDown className="ml-1 size-3" aria-hidden />
          )
        ) : null}
      </button>
    );
  }

  return <span className={className}>{label}</span>;
}

function RecordDetailSheet({
  record,
  open,
  onOpenChange,
}: {
  record: CampaignRecordItem | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const row = record?.customer ?? null;
  const recordCalls = record?.calls ?? row?.calls.entries ?? [];
  const { setSheetOpen } = useAircall();
  const statusLabel = record ? getRecordStatusLabel(record) : "Unspecified";
  const callDetails = recordCalls.length
    ? recordCalls
    : record?.call
      ? [record.call]
      : [];
  const Icon =
    record?.module === "tickets"
      ? Ticket
      : record?.module === "manual"
        ? ClipboardList
        : Phone;

  useEffect(() => {
    setSheetOpen(open);
    return () => setSheetOpen(false);
  }, [open, setSheetOpen]);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="flex h-full w-full flex-col gap-0 overflow-hidden border-slate-200/80 bg-[#f4f5f7] p-0 shadow-2xl sm:max-w-[680px] dark:border-slate-800 dark:bg-slate-950"
      >
        <SheetHeader className="relative border-b border-slate-200/80 bg-white px-4 py-4 pr-14 dark:border-slate-800 dark:bg-slate-950">
          <span
            className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#008f68]/45 to-transparent"
            aria-hidden
          />
          <div className="flex min-w-0 items-start gap-3">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-[#f0faf5] text-[#008f68] ring-1 ring-[#008f68]/15 dark:bg-emerald-500/10 dark:text-emerald-400 dark:ring-emerald-500/30">
              <Icon className="size-5" aria-hidden strokeWidth={2.25} />
            </span>
            <div className="min-w-0 flex-1">
              <div className="flex min-w-0 flex-wrap items-center gap-2">
                <SheetTitle className="min-w-0 truncate text-[16px] font-bold tracking-tight text-slate-900 dark:text-slate-100">
                  {record?.title || "Record detail"}
                </SheetTitle>
                {record ? (
                  <SheetChip
                    label={RECORD_MODULE_LABELS[record.module]}
                    tone="teal"
                  />
                ) : null}
              </div>
              <SheetDescription className="mt-1 text-xs font-medium text-slate-500">
                {row?.name || "Unknown customer"} - {row?.phone || "No phone"}
              </SheetDescription>
              {record ? (
                <div className="mt-3 flex flex-wrap gap-1.5">
                  <SheetChip label={record.option} />
                  <SheetChip label={statusLabel} tone="blue" />
                  <SheetChip
                    label={`${recordCalls.length || row?.calls.callCount || 0} calls`}
                  />
                </div>
              ) : null}
            </div>
          </div>
        </SheetHeader>

        {record && row ? (
          <div className="scrollbar-app flex-1 space-y-3 overflow-y-auto px-3 py-3">
            <DetailBlock title="Overview">
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                <DetailStat label="Option" value={record.option} />
                <DetailStat label="Status" value={statusLabel} />
                <DetailStat label="Owner" value={record.owner} />
                <DetailStat label="Date" value={formatDate(record.date)} />
              </div>
            </DetailBlock>

            <DetailBlock title="Customer">
              <div className="grid gap-2 sm:grid-cols-2">
                <DetailLine
                  label="Name"
                  value={row.name || "Unknown customer"}
                />
                <DetailLine label="Phone" value={row.phone || "No phone"} />
                <DetailLine
                  label="Campaign outcome"
                  value={normalizeLabel(row.finalStatus)}
                />
                <DetailLine label="Outcome bucket" value={row.bucket} />
                <DetailLine
                  label="Last activity"
                  value={formatDate(row.lastActivityDate)}
                />
                <DetailLine
                  label="Customer ID"
                  value={row.customerId ? String(row.customerId) : "N/A"}
                />
              </div>
            </DetailBlock>

            {record.module === "calls" ? (
              <CallDetailsBlock
                calls={callDetails}
                fallback={row.calls}
                option={record.option}
              />
            ) : null}

            {record.module === "calls" ? (
              <RecordCallsBlock
                title={`Record calls (${recordCalls.length || row.calls.callCount})`}
                calls={recordCalls}
              />
            ) : null}

            {record.module === "tickets" && record.ticket ? (
              <DetailBlock title="Ticket detail">
                <DetailLine
                  label="Ticket"
                  value={
                    record.ticket.ticketLabel ||
                    `Ticket #${record.ticket.ticketId}`
                  }
                />
                <DetailLine
                  label="Status"
                  value={normalizeLabel(record.ticket.status)}
                />
                <DetailLine
                  label="Priority"
                  value={normalizeLabel(record.ticket.priority)}
                />
                <DetailLine
                  label="Assignee"
                  value={normalizeLabel(record.ticket.agentName)}
                />
                <DetailLine
                  label="Created"
                  value={formatDate(record.ticket.createdAt)}
                />
                <DetailLine
                  label="Follow-up"
                  value={record.ticket.hasFollowUp ? "Yes" : "No"}
                />
                <DetailNote
                  text={record.ticket.issueSnippet || "No issue detail."}
                />
              </DetailBlock>
            ) : null}

            {record.module === "manual" && record.manual ? (
              <DetailBlock title="Manual record detail">
                <DetailLine
                  label="Disposition"
                  value={normalizeLabel(record.manual.disposition)}
                />
                <DetailLine
                  label="Campaign option"
                  value={normalizeLabel(record.manual.campaignOption)}
                />
                <DetailLine
                  label="Created"
                  value={formatDate(record.manual.createdAt)}
                />
                <DetailNote text={record.manual.notes || "No notes."} />
              </DetailBlock>
            ) : null}

            {record.module !== "calls" ? (
              <RecordCallsBlock
                title={`All customer calls (${recordCalls.length || row.calls.callCount})`}
                calls={recordCalls}
              />
            ) : null}

            <DetailBlock title={`All customer tickets (${row.tickets.length})`}>
              {row.tickets.length === 0 ? (
                <p className="text-xs text-slate-500">
                  No tickets for this customer.
                </p>
              ) : (
                row.tickets.map((ticket) => (
                  <div
                    key={ticket.ticketId}
                    className="rounded-xl border border-slate-100 bg-slate-50 px-3 py-2 dark:border-slate-800 dark:bg-slate-900"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <p className="truncate text-xs font-bold text-slate-800 dark:text-slate-100">
                        {ticket.ticketLabel || `Ticket #${ticket.ticketId}`}
                      </p>
                      <span className="rounded border border-slate-200 bg-white px-2 py-0.5 text-[10px] font-semibold text-slate-600 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-300">
                        {normalizeLabel(ticket.status)}
                      </span>
                    </div>
                    <p className="mt-1 text-[11px] text-slate-500">
                      {normalizeLabel(ticket.priority)} -{" "}
                      {normalizeLabel(ticket.agentName)} -{" "}
                      {formatDate(ticket.createdAt)}
                    </p>
                    <p className="mt-1 text-xs leading-5 text-slate-600 dark:text-slate-300">
                      {ticket.issueSnippet || "No issue detail."}
                    </p>
                  </div>
                ))
              )}
            </DetailBlock>

            <DetailBlock
              title={`All customer manual records (${row.manualRecords.length})`}
            >
              {row.manualRecords.length === 0 ? (
                <p className="text-xs text-slate-500">
                  No manual records for this customer.
                </p>
              ) : (
                row.manualRecords.map((record) => (
                  <div
                    key={record.id}
                    className="rounded-xl border border-slate-100 bg-slate-50 px-3 py-2 dark:border-slate-800 dark:bg-slate-900"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <p className="truncate text-xs font-bold text-slate-800 dark:text-slate-100">
                        {normalizeLabel(record.disposition)}
                      </p>
                      <span className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                        {formatDate(record.createdAt)}
                      </span>
                    </div>
                    <p className="mt-1 text-[11px] text-slate-500">
                      {normalizeLabel(record.campaignOption)}
                    </p>
                    <p className="mt-1 text-xs leading-5 text-slate-600 dark:text-slate-300">
                      {record.notes || "No notes."}
                    </p>
                  </div>
                ))
              )}
            </DetailBlock>
          </div>
        ) : null}
      </SheetContent>
    </Sheet>
  );
}

function FilterPill({
  label,
  count,
  active,
  onClick,
}: {
  label: string;
  count: number;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "inline-grid h-7 max-w-full grid-cols-[minmax(0,1fr)_auto] items-center gap-1 rounded-lg border px-2 text-xs font-medium leading-none transition-colors",
        active
          ? "border-emerald-200 bg-emerald-50 text-[#008f68] dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-300"
          : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-300",
      )}
      title={label}
    >
      <span className="truncate">{label}</span>
      <span
        className={cn(
          "flex h-3.5 min-w-3.5 items-center justify-center rounded px-1 text-[10px] font-bold leading-none tabular-nums",
          active
            ? "bg-white/80 text-[#008f68] dark:bg-emerald-500/20"
            : "bg-slate-100 text-slate-500 dark:bg-slate-800",
        )}
      >
        {count}
      </span>
    </button>
  );
}

function FilterGroup({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <div className="grid grid-rows-[auto_1fr] gap-1.5 rounded-lg border border-slate-200/80 bg-slate-50/60 px-2.5 py-2 shadow-[0_1px_2px_rgba(15,23,42,0.03)] dark:border-slate-800 dark:bg-slate-900/40">
      <span className="flex h-4 items-center text-[10px] font-semibold uppercase tracking-widest text-slate-400">
        {label}
      </span>
      <div className="flex min-w-0 flex-wrap content-start items-start gap-1.5">
        {children}
      </div>
    </div>
  );
}

function RecordCallsBlock({
  title,
  calls,
}: {
  title: string;
  calls: CustomerCallEntry[];
}) {
  return (
    <DetailBlock title={title}>
      {calls.length ? (
        calls.map((call) => (
          <div
            key={call.callId}
            className="rounded-xl border border-slate-200/70 bg-slate-50 px-3 py-2.5 dark:border-slate-800 dark:bg-slate-900"
          >
            <div className="flex items-center justify-between gap-3">
              <p className="truncate text-xs font-bold text-slate-900 dark:text-slate-100">
                {normalizeLabel(call.direction)} -{" "}
                {normalizeLabel(call.disposition)}
              </p>
              <span className="shrink-0 text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                {formatDate(call.createdAt)}
              </span>
            </div>
            <p className="mt-1 text-[11px] text-slate-500">
              {normalizeLabel(call.agentName)} -{" "}
              {normalizeLabel(call.campaignOption)} -{" "}
              {normalizeLabel(call.line)}
            </p>
            {call.notes ? (
              <p className="mt-1 text-xs leading-5 text-slate-600 dark:text-slate-300">
                {call.notes}
              </p>
            ) : null}
          </div>
        ))
      ) : (
        <p className="text-xs text-slate-500">
          No call details for this customer.
        </p>
      )}
    </DetailBlock>
  );
}

function CallDetailsBlock({
  calls,
  fallback,
  option,
}: {
  calls: CustomerCallEntry[];
  fallback: CustomerCallSummary;
  option: string;
}) {
  const firstKey = calls[0]?.callId ? String(calls[0].callId) : "summary";
  const [expandedCallKeys, setExpandedCallKeys] = useState<string[]>([
    firstKey,
  ]);

  useEffect(() => {
    setExpandedCallKeys([firstKey]);
  }, [firstKey]);

  const toggle = (key: string) => {
    setExpandedCallKeys((current) =>
      current.includes(key)
        ? current.filter((item) => item !== key)
        : [...current, key],
    );
  };

  return (
    <DetailBlock
      title={`Call detail${calls.length > 1 ? ` (${calls.length})` : ""}`}
    >
      {calls.length ? (
        calls.map((call, index) => {
          const key = call.callId ? String(call.callId) : `call-${index}`;
          const expanded = expandedCallKeys.includes(key);

          return (
            <div
              key={key}
              className="overflow-hidden rounded-xl border border-slate-200/80 bg-slate-50 dark:border-slate-800 dark:bg-slate-900"
            >
              <button
                type="button"
                onClick={() => toggle(key)}
                className="flex w-full items-center justify-between gap-3 px-3 py-2 text-left transition-colors hover:bg-white/70 dark:hover:bg-slate-950/40"
              >
                <span className="min-w-0">
                  <span className="block truncate text-xs font-bold text-slate-900 dark:text-slate-100">
                    {call.callId ? `Call #${call.callId}` : `Call ${index + 1}`}{" "}
                    - {normalizeLabel(call.direction)}
                  </span>
                  <span className="mt-0.5 block truncate text-[11px] font-medium text-slate-500">
                    {normalizeLabel(call.disposition)} -{" "}
                    {formatDate(call.createdAt)}
                  </span>
                </span>
                <span className="flex size-7 shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-300">
                  {expanded ? (
                    <ChevronUp className="size-3.5" aria-hidden />
                  ) : (
                    <ChevronDown className="size-3.5" aria-hidden />
                  )}
                </span>
              </button>

              {expanded ? (
                <div className="space-y-2 border-t border-slate-200/80 bg-white px-3 py-3 dark:border-slate-800 dark:bg-slate-950">
                  <div className="grid gap-2 sm:grid-cols-2">
                    <DetailLine
                      label="Call"
                      value={call.callId ? `#${call.callId}` : "Summary"}
                    />
                    <DetailLine
                      label="Direction"
                      value={normalizeLabel(
                        call.direction || fallback.lastDirection,
                      )}
                    />
                    <DetailLine
                      label="Line"
                      value={normalizeLabel(call.line)}
                    />
                    <DetailLine
                      label="Yard"
                      value={normalizeLabel(call.yardName)}
                    />
                    <DetailLine label="Campaign option" value={option} />
                    <DetailLine
                      label="Date"
                      value={formatDate(
                        call.createdAt || fallback.lastCallDate,
                      )}
                    />
                    <DetailLine
                      label="Agent"
                      value={normalizeLabel(
                        call.agentName || fallback.lastAgentName,
                      )}
                    />
                    <DetailLine
                      label="Disposition"
                      value={normalizeLabel(
                        call.disposition || fallback.lastDisposition,
                      )}
                    />
                    <DetailLine
                      label="Status"
                      value={normalizeLabel(call.status)}
                    />
                    <DetailLine
                      label="Follow-up"
                      value={
                        call.hasFollowUp ? formatDate(call.followUpDate) : "No"
                      }
                    />
                    <DetailLine
                      label="Recording"
                      value={call.hasRecording ? "Yes" : "No"}
                    />
                  </div>
                  {call.notes ? <DetailNote text={call.notes} /> : null}
                </div>
              ) : null}
            </div>
          );
        })
      ) : (
        <div className="grid gap-2 sm:grid-cols-2">
          <DetailLine label="Call" value="Summary" />
          <DetailLine
            label="Direction"
            value={normalizeLabel(fallback.lastDirection)}
          />
          <DetailLine label="Campaign option" value={option} />
          <DetailLine label="Date" value={formatDate(fallback.lastCallDate)} />
          <DetailLine
            label="Agent"
            value={normalizeLabel(fallback.lastAgentName)}
          />
          <DetailLine
            label="Disposition"
            value={normalizeLabel(fallback.lastDisposition)}
          />
          <DetailLine
            label="Follow-up"
            value={
              fallback.hasFollowUp ? formatDate(fallback.followUpDate) : "No"
            }
          />
          <DetailLine
            label="Recording"
            value={fallback.hasRecording ? "Yes" : "No"}
          />
        </div>
      )}
    </DetailBlock>
  );
}

function SheetChip({
  label,
  tone = "slate",
}: {
  label: string;
  tone?: "slate" | "teal" | "blue";
}) {
  return (
    <span
      className={cn(
        "inline-flex h-6 max-w-full items-center rounded-md border px-2 text-[10px] font-bold uppercase tracking-wide",
        tone === "teal"
          ? "border-[#008f68]/20 bg-[#f0faf5] text-[#008f68] dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-300"
          : tone === "blue"
            ? "border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-500/30 dark:bg-blue-500/10 dark:text-blue-300"
            : "border-slate-200 bg-slate-50 text-slate-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300",
      )}
      title={label}
    >
      <span className="truncate">{label}</span>
    </span>
  );
}

function DetailStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-slate-200/70 bg-slate-50 px-3 py-2 dark:border-slate-800 dark:bg-slate-900">
      <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-400">
        {label}
      </p>
      <p
        className="mt-1 truncate text-xs font-bold text-slate-900 dark:text-slate-100"
        title={value}
      >
        {value}
      </p>
    </div>
  );
}

function DetailBlock({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <section className="space-y-3 rounded-2xl border border-slate-200/80 bg-white px-3.5 py-3 shadow-[0_1px_3px_rgba(0,0,0,0.06)] dark:border-slate-800 dark:bg-slate-950">
      <div className="flex items-center gap-2">
        <span className="h-4 w-0.5 rounded-full bg-[#008f68]" aria-hidden />
        <h3 className="text-[10px] font-semibold uppercase tracking-widest text-slate-400">
          {title}
        </h3>
      </div>
      <div className="space-y-2">{children}</div>
    </section>
  );
}

function DetailLine({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex min-h-8 items-center justify-between gap-3 rounded-lg border border-slate-100 bg-slate-50/60 px-2.5 py-1.5 text-xs dark:border-slate-800 dark:bg-slate-900/60">
      <span className="font-medium text-slate-500">{label}</span>
      <span
        className="max-w-[62%] truncate text-right font-bold text-slate-900 dark:text-slate-100"
        title={value}
      >
        {value}
      </span>
    </div>
  );
}

function DetailNote({ text }: { text: string }) {
  return (
    <div className="rounded-xl border border-amber-200/80 bg-amber-50 px-3 py-2 text-xs leading-5 text-amber-900 dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-100">
      {text}
    </div>
  );
}

export default function CampaignReportsPage() {
  useDialogCleanup();
  const searchParams = useSearchParams();
  const router = useRouter();
  const { setSheetOpen } = useAircall();

  const campaignIdParam = searchParams.get("campaignId");
  const startDateParam = searchParams.get("startDate");
  const endDateParam = searchParams.get("endDate");

  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loadingCampaigns, setLoadingCampaigns] = useState(false);
  const [selectedCampaignId, setSelectedCampaignId] = useState(
    campaignIdParam || "",
  );
  const [campaignOpen, setCampaignOpen] = useState(false);
  const [startDate, setStartDate] = useState(startDateParam || "");
  const [endDate, setEndDate] = useState(endDateParam || "");
  const [filtersOpen, setFiltersOpen] = useState(false);
  const hasAutoOpenedFiltersRef = useRef(false);
  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState<CampaignFullReport | null>(null);
  const [crossFilters, setCrossFilters] =
    useState<CampaignFilters>(emptyFilters);
  const [activeTab, setActiveTab] = useState<CampaignReportTab>("dashboard");
  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const [isExportingExcel, setIsExportingExcel] = useState(false);

  const isDateRangeValid = useMemo(() => {
    if (!startDate || !endDate) return true;
    return new Date(startDate) <= new Date(endDate);
  }, [startDate, endDate]);

  const selectedCampaign = useMemo(
    () =>
      campaigns.find(
        (campaign) => campaign.id.toString() === selectedCampaignId,
      ) || null,
    [campaigns, selectedCampaignId],
  );

  // Auto-open filters sheet when arriving with a campaignId but no dates set
  useEffect(() => {
    if (
      !hasAutoOpenedFiltersRef.current &&
      campaignIdParam &&
      !startDateParam &&
      !endDateParam
    ) {
      hasAutoOpenedFiltersRef.current = true;
      setFiltersOpen(true);
    }
  }, [campaignIdParam, startDateParam, endDateParam]);

  // Auto-fill date range from campaign createdAt → today when arriving with
  // a campaignId but no dates (e.g. navigating here from /campaigns)
  const hasAutoFilledDatesRef = useRef(false);
  useEffect(() => {
    if (
      hasAutoFilledDatesRef.current ||
      !campaignIdParam ||
      startDateParam ||
      endDateParam ||
      campaigns.length === 0
    ) {
      return;
    }
    const campaign = campaigns.find((c) => c.id.toString() === campaignIdParam);
    if (!campaign?.createdAt) return;
    const createdDate = new Date(campaign.createdAt);
    if (isNaN(createdDate.getTime())) return;
    hasAutoFilledDatesRef.current = true;
    const fmt = (d: Date) => d.toISOString().slice(0, 10);
    setStartDate(fmt(createdDate));
    setEndDate(fmt(new Date()));
  }, [campaignIdParam, startDateParam, endDateParam, campaigns]);

  // Move Aircall phone out of the way when the filters sheet is open
  useEffect(() => {
    setSheetOpen(filtersOpen);
    return () => setSheetOpen(false);
  }, [filtersOpen, setSheetOpen]);

  useEffect(() => {
    const fetchCampaigns = async () => {
      try {
        setLoadingCampaigns(true);
        const data = await fetchFromBackend("/campaign?page=1&limit=500");
        const items: Campaign[] = Array.isArray(data) ? data : data?.data || [];
        setCampaigns(items);
      } catch (error: any) {
        toast({
          title: "Error",
          description: error?.message || "Failed to load campaigns",
          variant: "destructive",
        });
      } finally {
        setLoadingCampaigns(false);
      }
    };
    fetchCampaigns();
  }, []);

  useEffect(() => {
    if (campaignIdParam) setSelectedCampaignId(campaignIdParam);
  }, [campaignIdParam]);

  useEffect(() => {
    if (startDateParam) setStartDate(decodeURIComponent(startDateParam));
  }, [startDateParam]);

  useEffect(() => {
    if (endDateParam) setEndDate(decodeURIComponent(endDateParam));
  }, [endDateParam]);

  const reportSessionSearch = useMemo(() => {
    const params = new URLSearchParams();
    if (selectedCampaignId) params.set("campaignId", selectedCampaignId);
    if (startDate) params.set("startDate", startDate);
    if (endDate) params.set("endDate", endDate);
    return params.toString();
  }, [selectedCampaignId, startDate, endDate]);

  useReportSession<{ crossFilters: CampaignFilters }>({
    scope: "reports/campaigns",
    isUrlBare: !campaignIdParam && !startDateParam && !endDateParam,
    searchString: reportSessionSearch,
    state: { crossFilters },
    onRestoreState: (saved) => {
      if (saved?.crossFilters) {
        setCrossFilters({ ...emptyFilters(), ...saved.crossFilters });
      }
    },
  });

  useEffect(() => {
    if (!campaignIdParam || !startDateParam || !endDateParam) {
      setReport(null);
      return;
    }

    let cancelled = false;

    const fetchReport = async () => {
      try {
        setLoading(true);
        setReport(null);
        setCrossFilters(emptyFilters());
        const params = new URLSearchParams({
          startDate: decodeURIComponent(startDateParam),
          endDate: decodeURIComponent(endDateParam),
        });
        const response = await fetchFromBackend(
          `/campaign/${campaignIdParam}/report?${params.toString()}`,
        );
        if (!cancelled) setReport(response as CampaignFullReport);
      } catch (error: any) {
        if (!cancelled) {
          toast({
            title: "Error",
            description: error?.message || "Failed to generate report.",
            variant: "destructive",
          });
          setReport(null);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchReport();
    return () => {
      cancelled = true;
    };
  }, [campaignIdParam, startDateParam, endDateParam]);

  const applyFilters = (start?: string, end?: string) => {
    if (!selectedCampaignId) {
      toast({
        title: "Select a campaign",
        description: "You must select a campaign.",
        variant: "destructive",
      });
      setFiltersOpen(true);
      return;
    }
    const finalStart = start !== undefined ? start : startDate;
    const finalEnd = end !== undefined ? end : endDate;
    if (!finalStart || !finalEnd) {
      toast({
        title: "Date range required",
        description: "Select start and end date before applying filters.",
        variant: "destructive",
      });
      setFiltersOpen(true);
      return;
    }

    setStartDate(finalStart);
    setEndDate(finalEnd);

    const params = new URLSearchParams();
    params.set("campaignId", selectedCampaignId);
    params.set("startDate", finalStart);
    params.set("endDate", finalEnd);
    router.push(`/reports/campaigns?${params.toString()}`);
    setFiltersOpen(false);
  };

  const exportPdfBackend = async () => {
    if (!report || !campaignIdParam || !startDateParam || !endDateParam) return;
    if (isExportingPdf) return;

    setIsExportingPdf(true);
    const pendingToast = toast({
      variant: "loading",
      title: "Preparing PDF",
      description: `Generating the campaign report for ${report.campaign.nombre || "campaign"}…`,
    });

    try {
      const logoUrl =
        typeof window !== "undefined"
          ? `${window.location.origin}/images/logo.jpeg`
          : "/images/logo.jpeg";
      const params = new URLSearchParams({
        startDate: decodeURIComponent(startDateParam),
        endDate: decodeURIComponent(endDateParam),
        logoUrl,
      });
      const blob = await fetchBlobFromBackend(
        `/campaign/${campaignIdParam}/report/pdf?${params.toString()}`,
        { method: "GET" },
      );
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `campaign_report_${campaignIdParam}_${startDateParam}_to_${endDateParam}.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      pendingToast.dismiss();
      toast({
        title: "PDF ready",
        description: "Your campaign report download has started.",
      });
    } catch (error: any) {
      pendingToast.dismiss();
      toast({
        title: "Error",
        description: error?.message || "Failed to download PDF",
        variant: "destructive",
      });
    } finally {
      setIsExportingPdf(false);
    }
  };

  const exportExcelBackend = async () => {
    if (!report || !campaignIdParam || !startDateParam || !endDateParam) return;
    if (isExportingExcel) return;

    setIsExportingExcel(true);
    const pendingToast = toast({
      variant: "loading",
      title: "Preparing Excel",
      description: `Generating the campaign spreadsheet for ${report.campaign.nombre || "campaign"}…`,
    });

    try {
      const start = decodeURIComponent(startDateParam);
      const end = decodeURIComponent(endDateParam);
      const params = new URLSearchParams({ startDate: start, endDate: end });
      const blob = await fetchBlobFromBackend(
        `/campaign/${campaignIdParam}/report/excel?${params.toString()}`,
        {
          method: "GET",
          headers: {
            Accept:
              "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
          },
        },
      );
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `campaign_report_${campaignIdParam}_${start}_to_${end}.xlsx`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      pendingToast.dismiss();
      toast({
        title: "Excel ready",
        description: "Your spreadsheet download has started.",
      });
    } catch (error: any) {
      pendingToast.dismiss();
      toast({
        title: "Error",
        description: error?.message || "Failed to download Excel file",
        variant: "destructive",
      });
    } finally {
      setIsExportingExcel(false);
    }
  };

  const allRows = useMemo(() => flattenRows(report), [report]);
  const filteredRows = useMemo(
    () =>
      allRows.filter((row) =>
        matchesFilters(row, crossFilters, Boolean(report?.isAr)),
      ),
    [allRows, crossFilters, report?.isAr],
  );
  const filteredRecordCount = useMemo(
    () => buildCampaignRecordItems(filteredRows).length,
    [filteredRows],
  );

  const filteredTotals = useMemo(
    () => ({
      customers: filteredRows.length,
      calls: filteredRows.reduce((sum, row) => sum + row.calls.callCount, 0),
      tickets: filteredRows.reduce((sum, row) => sum + row.tickets.length, 0),
      manualRecords: filteredRows.reduce(
        (sum, row) => sum + row.manualRecords.length,
        0,
      ),
    }),
    [filteredRows],
  );

  const chartData = useMemo(() => {
    const statuses = countBy(
      filteredRows.map((row) => normalizeLabel(row.finalStatus)),
    ).map((row) => ({
      ...row,
      fill: STATUS_COLORS[row.key] || toneClasses.slate.chart,
    }));
    const options = countBy(filteredRows.flatMap(getRowOptions));
    const agents = countBy(filteredRows.flatMap(getRowAgents));
    const modules = countBy(filteredRows.flatMap(getRowModules)).map((row) => ({
      ...row,
      fill: MODULE_COLORS[row.key] || toneClasses.slate.chart,
    }));
    const dispositions = countBy(
      filteredRows.flatMap((row) => {
        const entries = row.calls.entries?.length
          ? row.calls.entries
          : row.calls.callCount > 0
          ? [{ disposition: row.calls.lastDisposition }]
          : [];
        return entries.map((entry) => normalizeLabel(entry.disposition));
      })
    ).map((row) => ({
      ...row,
      fill: STATUS_COLORS[row.key] || toneClasses.slate.chart,
    }));
    return {
      statuses,
      options,
      agents,
      modules,
      dispositions,
      days: buildDayData(filteredRows),
    };
  }, [filteredRows]);

  /**
   * KPI metrics computed from filteredRows so they react to cross-filters.
   * Falls back to the backend `report.*` aggregates when the row matrix is empty.
   * Definitions are kept in sync with the backend (`computeFunnel`,
   * `computeTouchpoints`, `computeTimeMetrics`).
   */
  const filteredMetrics = useMemo(() => {
    if (!report) return null;
    const isAr = Boolean(report.isAr);
    const rows = filteredRows;

    // Coverage — totalAssigned is global (not filterable from frontend).
    const totalAssigned = report.coverage?.totalAssigned ?? 0;
    const contactedInRange = rows.length;
    const universe = Math.max(totalAssigned, contactedInRange);
    const coveragePct =
      universe > 0
        ? Math.round((contactedInRange / universe) * 1000) / 10
        : 0;
    const ghostCustomers = Math.max(0, totalAssigned - contactedInRange);

    let engaged = 0;
    let converted = 0;
    let totalTouchpoints = 0;
    let convertedTouchpoints = 0;
    let notConvertedTouchpoints = 0;
    let convertedCount = 0;
    let notConvertedCount = 0;
    const resolutionDeltas: number[] = [];

    for (const row of rows) {
      const stages = getRowFunnelStages(row, isAr);
      if (stages.includes("engaged")) engaged += 1;
      const isConverted = stages.includes("converted");
      if (isConverted) converted += 1;

      const touchpoints =
        (row.calls.callCount ?? 0) +
        (row.tickets?.length ?? 0) +
        (row.manualRecords?.length ?? 0);
      if (touchpoints > 0) {
        totalTouchpoints += touchpoints;
        if (isConverted) {
          convertedCount += 1;
          convertedTouchpoints += touchpoints;
        } else {
          notConvertedCount += 1;
          notConvertedTouchpoints += touchpoints;
        }
      }

      for (const ticket of row.tickets) {
        const isClosed =
          ticket.status === "CLOSED" || ticket.status === "RESOLVED";
        if (!isClosed) continue;
        if (!ticket.createdAt || !ticket.updatedAt) continue;
        const createdMs = new Date(ticket.createdAt).getTime();
        const updatedMs = new Date(ticket.updatedAt).getTime();
        if (Number.isNaN(createdMs) || Number.isNaN(updatedMs)) continue;
        const delta = updatedMs - createdMs;
        if (delta >= 0) resolutionDeltas.push(delta);
      }
    }

    const pct = (a: number, b: number) =>
      b > 0 ? Math.round((a / b) * 1000) / 10 : 0;
    const round1 = (n: number) => Math.round(n * 10) / 10;

    const sortedDeltas = [...resolutionDeltas].sort((a, b) => a - b);
    const percentile = (p: number) => {
      if (!sortedDeltas.length) return 0;
      const idx = Math.min(
        sortedDeltas.length - 1,
        Math.floor((p / 100) * sortedDeltas.length),
      );
      return sortedDeltas[idx];
    };

    return {
      coverage: {
        totalAssigned,
        contactedInRange,
        coveragePct,
        ghostCustomers,
      },
      funnel: {
        total: universe,
        contacted: contactedInRange,
        engaged,
        converted,
        convertedPct: pct(converted, universe),
        conversionRateOfContacted: pct(converted, contactedInRange),
      },
      touchpoints: {
        avgAll: contactedInRange > 0 ? round1(totalTouchpoints / contactedInRange) : 0,
        avgConverted:
          convertedCount > 0
            ? round1(convertedTouchpoints / convertedCount)
            : 0,
        avgNotConverted:
          notConvertedCount > 0
            ? round1(notConvertedTouchpoints / notConvertedCount)
            : 0,
      },
      timeMetrics: {
        avgTimeToResolutionMs:
          resolutionDeltas.length > 0
            ? Math.round(
                resolutionDeltas.reduce((a, b) => a + b, 0) /
                  resolutionDeltas.length,
              )
            : 0,
        p95TimeToResolutionMs: percentile(95),
        ticketsResolved: resolutionDeltas.length,
      },
    };
  }, [filteredRows, report]);

  const metrics: Metric[] = useMemo(() => {
    const fm = filteredMetrics;
    const coverage = fm?.coverage;
    const funnel = fm?.funnel;
    const touchpoints = fm?.touchpoints;
    const timeMetrics = fm?.timeMetrics;

    // ── KPI 1: Customers reached (filterable) ──
    const coverageDetail = coverage
      ? buildCoverageDetail({
          totalAssigned: coverage.totalAssigned,
          totalUniverse: Math.max(
            coverage.totalAssigned,
            coverage.contactedInRange,
          ),
          contactedInRange: coverage.contactedInRange,
          coveragePct: coverage.coveragePct,
          ghostCustomers: coverage.ghostCustomers,
        })
      : {
          detail: `${filteredTotals.customers} customers in scope`,
          trend: `${chartData.days.length} active days`,
        };
    const customersValue = String(
      coverage?.contactedInRange ?? filteredTotals.customers,
    );

    // ── KPI 2: Conversion rate ──
    const convertedPct = funnel?.convertedPct ?? 0;
    const conversionTone: Metric["tone"] =
      convertedPct >= 50 ? "emerald" : convertedPct >= 20 ? "amber" : "rose";

    // ── KPI 3: Touches to convert ──
    const avgConvertedTouches = touchpoints?.avgConverted ?? 0;
    const avgNotConvertedTouches = touchpoints?.avgNotConverted ?? 0;
    const touchEfficiencyTone: Metric["tone"] =
      avgConvertedTouches > 0 &&
      avgConvertedTouches <= avgNotConvertedTouches
        ? "indigo"
        : "amber";

    // ── KPI 4: Avg resolution ──
    const avgResolutionMs = timeMetrics?.avgTimeToResolutionMs ?? 0;
    const ticketsResolved = timeMetrics?.ticketsResolved ?? 0;
    const resolutionTone: Metric["tone"] =
      ticketsResolved === 0 ? "slate" : "amber";

    return [
      {
        label: "Customers reached",
        value: customersValue,
        detail: coverageDetail.detail,
        trend: coverage
          ? `${coverage.coveragePct}% coverage`
          : coverageDetail.trend,
        tone: "emerald",
        icon: Users,
      },
      {
        label: "Conversion rate",
        value: `${convertedPct}%`,
        detail: `${funnel?.converted ?? 0} converted of ${funnel?.total ?? filteredTotals.customers}`,
        trend: `${funnel?.conversionRateOfContacted ?? 0}% of contacted`,
        tone: conversionTone,
        icon: TrendingUp,
      },
      {
        label: "Touches to convert",
        value: avgConvertedTouches.toFixed(1),
        detail: `vs ${avgNotConvertedTouches.toFixed(1)} for not converted`,
        trend:
          touchpoints?.avgAll
            ? `${touchpoints.avgAll.toFixed(1)} avg overall`
            : "—",
        tone: touchEfficiencyTone,
        icon: Layers,
      },
      {
        label: "Avg resolution",
        value: avgResolutionMs > 0 ? formatDuration(avgResolutionMs) : "—",
        detail:
          ticketsResolved > 0
            ? `${ticketsResolved} tickets closed`
            : "No resolved tickets",
        trend:
          timeMetrics?.p95TimeToResolutionMs
            ? `P95 ${formatDuration(timeMetrics.p95TimeToResolutionMs)}`
            : "—",
        tone: resolutionTone,
        icon: Clock,
      },
    ];
  }, [chartData.days.length, filteredMetrics, filteredTotals]);

  const handleToggleFilter = (key: FilterKey, value: string) => {
    setCrossFilters((current) => toggleFilter(current, key, value));
  };

  const hasParams = Boolean(campaignIdParam && startDateParam && endDateParam);

  return (
    <div className="flex min-h-[calc(100dvh-4.25rem)] min-h-0 flex-col px-3 pb-4 pt-2 animate-in fade-in duration-500 lg:px-5 lg:pb-8">
      <div className="mx-auto flex w-full max-w-[1600px] min-h-0 flex-1 flex-col gap-2">
        <CampaignReportHeader
          report={report}
          selectedCampaign={selectedCampaign}
          startDate={startDate}
          endDate={endDate}
          crossFilters={crossFilters}
          canExport={Boolean(report) && isDateRangeValid}
          activeTab={activeTab}
          recordsCount={filteredRecordCount}
          onTabChange={setActiveTab}
          onOpenFilters={() => setFiltersOpen(true)}
          onRemoveFilter={handleToggleFilter}
          onClearFilters={() => setCrossFilters(emptyFilters())}
          onExportPDF={exportPdfBackend}
          onExportExcel={exportExcelBackend}
          isExportingPdf={isExportingPdf}
          isExportingExcel={isExportingExcel}
        />

        <CampaignFiltersSheet
          open={filtersOpen}
          onOpenChange={setFiltersOpen}
          campaignOpen={campaignOpen}
          onCampaignOpenChange={setCampaignOpen}
          campaigns={campaigns}
          selectedCampaignId={selectedCampaignId}
          loadingCampaigns={loadingCampaigns}
          startDate={startDate}
          endDate={endDate}
          canExport={Boolean(report)}
          onCampaignSelect={(campaignId) => setSelectedCampaignId(campaignId)}
          onStartDateChange={setStartDate}
          onEndDateChange={setEndDate}
          onExportPDF={exportPdfBackend}
          onExportExcel={exportExcelBackend}
          onApplyFilters={applyFilters}
          isExportingPdf={isExportingPdf}
          isExportingExcel={isExportingExcel}
        />

        {!hasParams && !campaignIdParam ? (
          <CampaignReportSetupEmptyState
            mode="no-campaign"
            onConfigure={() => setFiltersOpen(true)}
          />
        ) : !hasParams && campaignIdParam ? (
          <CampaignReportSetupEmptyState
            mode="no-dates"
            onConfigure={() => setFiltersOpen(true)}
          />
        ) : !isDateRangeValid ? (
          <CampaignReportSetupEmptyState
            mode="invalid-range"
            startDate={startDate}
            endDate={endDate}
            onConfigure={() => setFiltersOpen(true)}
          />
        ) : loading ? (
          <EntityGridLoading kind="dashboard" className="my-12" />
        ) : report ? (
          <div
            className={`relative min-h-0 flex-1 overflow-hidden ${dashboardCanvasClass}`}
          >
            <div className="scrollbar-app-hover h-full overflow-y-auto pb-2">
              <div className={dashboardShellClass}>
                {activeTab === "dashboard" ? (
                  <>
                    <div className="grid grid-cols-2 gap-2 xl:grid-cols-4">
                      {metrics.map((metric) => (
                        <MetricCard key={metric.label} metric={metric} />
                      ))}
                    </div>

                    <div
                      className={`${dashboardRowClass} lg:grid-cols-3 lg:[&>*]:min-h-[76px]`}
                    >
                      <ModulePanel
                        title="Calls"
                        value={filteredTotals.calls}
                        detail={`${report.callsStats.inbound} inbound total - ${report.callsStats.missed} missed`}
                        tone="sky"
                        icon={Phone}
                        filterValue="Calls"
                        active={crossFilters.module.includes("Calls")}
                        onToggle={handleToggleFilter}
                      />
                      <ModulePanel
                        title="Tickets"
                        value={filteredTotals.tickets}
                        detail={`${report.ticketsStats.highPriority} high priority total`}
                        tone="emerald"
                        icon={Ticket}
                        filterValue="Tickets"
                        active={crossFilters.module.includes("Tickets")}
                        onToggle={handleToggleFilter}
                      />
                      <ModulePanel
                        title="Manual records"
                        value={filteredTotals.manualRecords}
                        detail={`${report.manualRecordsStats.withDisposition} with disposition total`}
                        tone="indigo"
                        icon={ClipboardList}
                        filterValue="Manual"
                        active={crossFilters.module.includes("Manual")}
                        onToggle={handleToggleFilter}
                      />
                    </div>

                    <div
                      className={`${dashboardRowClass} xl:grid-cols-2 xl:[&>*]:min-h-[246px]`}
                    >
                      <ActivityChart
                        data={chartData.days}
                        filters={crossFilters}
                        onToggle={handleToggleFilter}
                      />
                      {report.funnel ? (
                        <FunnelChart
                          funnel={report.funnel}
                          selectedStages={crossFilters.funnel}
                          onToggleStage={(stage) =>
                            handleToggleFilter("funnel", stage)
                          }
                        />
                      ) : (
                        <BreakdownChart
                          title="Campaign outcome"
                          subtitle="Final status distribution"
                          icon={Target}
                          data={chartData.statuses}
                          filterKey="status"
                          filters={crossFilters}
                          onToggle={handleToggleFilter}
                        />
                      )}
                    </div>

                    <div
                      className={`${dashboardRowClass} lg:grid-cols-2 lg:[&>*]:min-h-[218px]`}
                    >
                      <BreakdownChart
                        title="Call dispositions"
                        subtitle="Call outcomes distribution"
                        icon={Phone}
                        data={chartData.dispositions}
                        filterKey="disposition"
                        filters={crossFilters}
                        onToggle={handleToggleFilter}
                      />
                      <BreakdownChart
                        title="Agents"
                        subtitle="Agents attached to calls and tickets"
                        icon={UserRound}
                        data={chartData.agents}
                        filterKey="agent"
                        filters={crossFilters}
                        onToggle={handleToggleFilter}
                      />
                    </div>

                    <div
                      className={`${dashboardRowClass} xl:grid-cols-2 xl:[&>*]:min-h-[230px]`}
                    >
                      {report.touchpoints ? (
                        <TouchpointsHistogram
                          touchpoints={report.touchpoints}
                          selectedBuckets={crossFilters.touchpoints}
                          onToggleBucket={(bucket) =>
                            handleToggleFilter("touchpoints", bucket)
                          }
                        />
                      ) : null}
                      <BreakdownChart
                        title="Campaign options"
                        subtitle="Options from tickets and manual records"
                        icon={CheckCircle2}
                        data={chartData.options}
                        filterKey="option"
                        filters={crossFilters}
                        onToggle={handleToggleFilter}
                      />
                    </div>

                    {report.heatmap ? (
                      <ActivityHeatmap
                        heatmap={report.heatmap}
                        selectedCells={crossFilters.heatmap}
                        onToggleCell={(cellKey) =>
                          handleToggleFilter("heatmap", cellKey)
                        }
                      />
                    ) : null}
                  </>
                ) : (
                  <RecordsTab
                    rows={filteredRows}
                    filters={crossFilters}
                    onToggleFilter={handleToggleFilter}
                  />
                )}
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
