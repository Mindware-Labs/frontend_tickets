"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { format } from "date-fns";
import {
  AlertCircle,
  ArrowLeft,
  Calendar,
  CheckCircle2,
  CheckSquare,
  Download,
  FolderDown,
  Layers,
  Megaphone,
  Search,
  Square,
  X,
} from "lucide-react";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { EntityLoadingSpinner } from "@/components/shared/entity-loading-state";
import { Calendar as CalendarWidget } from "@/components/ui/calendar";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  EXCEL_MIME,
  FORMAT_META,
  type BulkExportEntity,
  type BulkExportFormat,
} from "@/components/reports/bulk-export-core";
import {
  BulkExportProgressDialog,
  type BulkExportPlan,
} from "@/components/reports/bulk-export-progress-dialog";
import { toast } from "@/hooks/use-toast";
import { useDialogCleanup } from "@/hooks/use-dialog-cleanup";
import { fetchFromBackend } from "@/lib/api-client";
import { cn } from "@/lib/utils";
import {
  YardContextChip,
  YardSegmentedTabs,
  yardDashboardToolbarClass,
} from "../../yards/components/yard-dashboard-chrome";

type Campaign = {
  id: number;
  nombre: string;
  yarda?: { name?: string | null } | null;
  isActive?: boolean;
  tipo?: string;
  createdAt?: string;
};

type CampaignTypeTab = "all" | "ONBOARDING" | "AR" | "OTHER";

const TYPE_BADGES: Record<
  string,
  { label: string; className: string; dotClassName: string }
> = {
  ONBOARDING: {
    label: "Onboarding",
    className:
      "border-sky-200 bg-sky-50 text-sky-700 dark:border-sky-500/30 dark:bg-sky-500/10 dark:text-sky-200",
    dotClassName: "bg-sky-500",
  },
  AR: {
    label: "AR",
    className:
      "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-200",
    dotClassName: "bg-amber-500",
  },
  OTHER: {
    label: "Other",
    className:
      "border-slate-200 bg-slate-50 text-slate-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300",
    dotClassName: "bg-slate-400",
  },
};

const panelClass =
  "overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-[0_1px_3px_rgba(0,0,0,0.06)] dark:border-slate-800 dark:bg-slate-950";

const sectionLabelClass =
  "text-[10px] font-semibold uppercase tracking-widest text-slate-400";

const fmtLocalDate = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

type DatePresetKey =
  | "allTime"
  | "last7"
  | "last30"
  | "thisMonth"
  | "lastMonth"
  | "ytd";

const DATE_PRESETS: {
  key: DatePresetKey;
  label: string;
  subtitle: string;
}[] = [
  { key: "allTime", label: "All time", subtitle: "Campaign history" },
  { key: "last7", label: "Last 7 days", subtitle: "Recent activity" },
  { key: "last30", label: "Last 30 days", subtitle: "Rolling month" },
  { key: "thisMonth", label: "This month", subtitle: "Month to date" },
  { key: "lastMonth", label: "Last month", subtitle: "Previous month" },
  { key: "ytd", label: "YTD", subtitle: "Year to date" },
];

function computePresetRange(
  key: DatePresetKey,
  earliestCampaignStart: Date | null,
): { start: Date; end: Date } {
  const today = new Date();
  switch (key) {
    case "allTime": {
      const start =
        earliestCampaignStart ?? new Date(today.getFullYear(), 0, 1);
      return { start, end: today };
    }
    case "last7": {
      const start = new Date();
      start.setDate(today.getDate() - 7);
      return { start, end: today };
    }
    case "last30": {
      const start = new Date();
      start.setDate(today.getDate() - 30);
      return { start, end: today };
    }
    case "thisMonth":
      return {
        start: new Date(today.getFullYear(), today.getMonth(), 1),
        end: today,
      };
    case "lastMonth":
      return {
        start: new Date(today.getFullYear(), today.getMonth() - 1, 1),
        end: new Date(today.getFullYear(), today.getMonth(), 0),
      };
    case "ytd":
      return { start: new Date(today.getFullYear(), 0, 1), end: today };
  }
}

const presetBtnClass = (active: boolean) =>
  cn(
    "flex w-full flex-col items-start rounded-xl border px-2.5 py-1.5 text-left transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#008f68]/25",
    active
      ? "border-emerald-300 bg-emerald-50 dark:border-emerald-600/50 dark:bg-emerald-500/10"
      : "border-slate-100 bg-slate-50/60 hover:border-slate-200 hover:bg-slate-100 dark:border-slate-800 dark:bg-slate-900/40 dark:hover:bg-slate-900/80",
  );

const formatCreatedAt = (value?: string) => {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
};

export default function CampaignBulkExportPage() {
  useDialogCleanup();

  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loadingCampaigns, setLoadingCampaigns] = useState(true);
  const [search, setSearch] = useState("");
  const [typeTab, setTypeTab] = useState<CampaignTypeTab>("all");
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [formats, setFormats] = useState<BulkExportFormat[]>([]);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [activePreset, setActivePreset] = useState<DatePresetKey | null>(null);
  const [startPopoverOpen, setStartPopoverOpen] = useState(false);
  const [endPopoverOpen, setEndPopoverOpen] = useState(false);
  const [progressOpen, setProgressOpen] = useState(false);
  const [plan, setPlan] = useState<BulkExportPlan | null>(null);

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

  const typeCounts = useMemo(() => {
    const counts: Record<CampaignTypeTab, number> = {
      all: campaigns.length,
      ONBOARDING: 0,
      AR: 0,
      OTHER: 0,
    };
    campaigns.forEach((campaign) => {
      const tipo = (campaign.tipo || "OTHER").toUpperCase();
      if (tipo === "ONBOARDING") counts.ONBOARDING += 1;
      else if (tipo === "AR") counts.AR += 1;
      else counts.OTHER += 1;
    });
    return counts;
  }, [campaigns]);

  const normalizedSearch = search.trim().toLowerCase();
  const filteredCampaigns = useMemo(() => {
    return campaigns.filter((campaign) => {
      if (typeTab !== "all") {
        const tipo = (campaign.tipo || "OTHER").toUpperCase();
        const bucket =
          tipo === "ONBOARDING" ? "ONBOARDING" : tipo === "AR" ? "AR" : "OTHER";
        if (bucket !== typeTab) return false;
      }
      if (!normalizedSearch) return true;
      return `${campaign.nombre} ${campaign.yarda?.name ?? ""}`
        .toLowerCase()
        .includes(normalizedSearch);
    });
  }, [campaigns, normalizedSearch, typeTab]);

  const selectedCampaigns = useMemo(
    () => campaigns.filter((campaign) => selectedIds.has(campaign.id)),
    [campaigns, selectedIds],
  );

  const allFilteredSelected =
    filteredCampaigns.length > 0 &&
    filteredCampaigns.every((campaign) => selectedIds.has(campaign.id));
  const someFilteredSelected = filteredCampaigns.some((campaign) =>
    selectedIds.has(campaign.id),
  );

  const toggleCampaign = (id: number) => {
    setSelectedIds((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleAllFiltered = () => {
    setSelectedIds((current) => {
      const next = new Set(current);
      if (allFilteredSelected) {
        filteredCampaigns.forEach((campaign) => next.delete(campaign.id));
      } else {
        filteredCampaigns.forEach((campaign) => next.add(campaign.id));
      }
      return next;
    });
  };

  const toggleFormat = (format: BulkExportFormat) => {
    setFormats((current) =>
      current.includes(format)
        ? current.filter((item) => item !== format)
        : [...current, format],
    );
  };

  const hasDates = Boolean(startDate && endDate);
  const isRangeValid = !hasDates || startDate <= endDate;
  const selectedCount = selectedIds.size;
  const totalFiles = selectedCount * formats.length;
  const canExport =
    selectedCount > 0 && formats.length > 0 && hasDates && isRangeValid;

  // Earliest createdAt among the selected campaigns (all of them while none
  // is selected) — drives the "All time" preset.
  const earliestCampaignStart = useMemo(() => {
    const pool = selectedCampaigns.length > 0 ? selectedCampaigns : campaigns;
    const timestamps = pool
      .map((campaign) =>
        campaign.createdAt ? new Date(campaign.createdAt).getTime() : NaN,
      )
      .filter((time) => Number.isFinite(time));
    if (timestamps.length === 0) return null;
    return new Date(Math.min(...timestamps));
  }, [campaigns, selectedCampaigns]);

  const applyPreset = (key: DatePresetKey) => {
    const range = computePresetRange(key, earliestCampaignStart);
    setStartDate(fmtLocalDate(range.start));
    setEndDate(fmtLocalDate(range.end));
    setActivePreset(key);
  };

  const presetTooltip = (key: DatePresetKey) => {
    if (key === "allTime") return "From the earliest campaign start → today";
    const range = computePresetRange(key, earliestCampaignStart);
    return `${format(range.start, "MMM d")} → ${format(range.end, "MMM d, yyyy")}`;
  };

  const startDateObj = startDate
    ? new Date(`${startDate}T12:00:00`)
    : undefined;
  const endDateObj = endDate ? new Date(`${endDate}T12:00:00`) : undefined;
  const formattedStartDate = startDateObj
    ? format(startDateObj, "MMM d, yyyy")
    : null;
  const formattedEndDate = endDateObj
    ? format(endDateObj, "MMM d, yyyy")
    : null;

  const handleStartSelect = (date: Date | undefined) => {
    setStartDate(date ? fmtLocalDate(date) : "");
    setStartPopoverOpen(false);
    setActivePreset(null);
  };

  const handleEndSelect = (date: Date | undefined) => {
    setEndDate(date ? fmtLocalDate(date) : "");
    setEndPopoverOpen(false);
    setActivePreset(null);
  };

  const buildBulkExportRequest = (
    item: BulkExportEntity,
    format: BulkExportFormat,
    start: string,
    end: string,
  ) => {
    const safeName = item.name.replace(/[^\w-]+/g, "_");
    if (format === "pdf") {
      const logoUrl =
        typeof window !== "undefined"
          ? `${window.location.origin}/images/logo.jpeg`
          : "/images/logo.jpeg";
      const params = new URLSearchParams({
        startDate: start,
        endDate: end,
        logoUrl,
      });
      return {
        endpoint: `/campaign/${item.id}/report/pdf?${params.toString()}`,
        fileName: `campaign_report_${safeName}_${start}_to_${end}.pdf`,
      };
    }
    const params = new URLSearchParams({ startDate: start, endDate: end });
    return {
      endpoint: `/campaign/${item.id}/report/excel?${params.toString()}`,
      fileName: `campaign_report_${safeName}_${start}_to_${end}.xlsx`,
      accept: EXCEL_MIME,
    };
  };

  const startExport = () => {
    if (!canExport) return;
    setPlan({
      items: selectedCampaigns.map((campaign) => ({
        id: String(campaign.id),
        name: campaign.nombre,
        subtitle: campaign.yarda?.name || undefined,
      })),
      formats: [...formats],
      startDate,
      endDate,
    });
    setProgressOpen(true);
  };

  const exportHint = !hasDates
    ? "Pick a date range to enable the export."
    : !isRangeValid
      ? "Start date must be before the end date."
      : formats.length === 0
        ? "Select at least one format."
        : selectedCount === 0
          ? "Select at least one campaign from the list."
          : `${selectedCount} campaign${selectedCount === 1 ? "" : "s"} × ${formats.length} format${formats.length === 1 ? "" : "s"} = ${totalFiles} file${totalFiles === 1 ? "" : "s"}.`;

  return (
    <div className="flex min-h-[calc(100dvh-4.25rem)] flex-col px-3 pb-4 pt-2 animate-in fade-in duration-500 lg:px-5 lg:pb-8">
      <div className="mx-auto flex w-full max-w-[1400px] flex-1 flex-col gap-2">
        <header className="shrink-0">
          <div className={yardDashboardToolbarClass}>
            <div className="flex min-w-0 flex-1 flex-wrap items-center gap-2 md:gap-3">
              <Link
                href="/reports/campaigns"
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-slate-200/80 bg-white text-slate-500 shadow-sm transition-colors hover:bg-slate-50 hover:text-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#008f68]/25 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-400"
                aria-label="Back to campaign reports"
              >
                <ArrowLeft className="size-4" aria-hidden />
              </Link>
              <Megaphone
                className="size-4 shrink-0 text-[#008f68] dark:text-emerald-400"
                aria-hidden
              />
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-slate-900 dark:text-slate-100">
                  Bulk export
                </p>
                <p className="text-[10px] font-medium uppercase tracking-wide text-slate-400">
                  Campaign reports
                </p>
              </div>

              <div className="flex min-w-0 flex-1 flex-wrap items-center gap-1.5">
                {hasDates && isRangeValid ? (
                  <YardContextChip
                    label="Range"
                    value={`${startDate} to ${endDate}`}
                  />
                ) : null}
                {selectedCount > 0 ? (
                  <YardContextChip
                    label="Selected"
                    value={`${selectedCount} campaign${selectedCount === 1 ? "" : "s"}`}
                  />
                ) : null}
              </div>
            </div>

            <div className="flex w-full flex-wrap items-center gap-1.5 rounded-lg border border-slate-200/80 bg-slate-100/80 p-0.5 sm:w-auto dark:border-slate-800 dark:bg-slate-900/80">
              <button
                type="button"
                onClick={startExport}
                disabled={!canExport}
                className={cn(
                  "flex h-8 items-center gap-1.5 rounded-lg px-3 text-xs font-medium shadow-sm transition-colors",
                  canExport
                    ? "bg-[#008f68] text-white hover:bg-[#007a5a]"
                    : "cursor-not-allowed bg-white text-slate-400 dark:bg-slate-950 dark:text-slate-600",
                )}
              >
                <Download className="size-3.5" aria-hidden />
                <span>
                  Export{totalFiles > 0 ? ` ${totalFiles} files` : ""}
                </span>
              </button>
            </div>
          </div>
        </header>

        <div className="grid min-h-0 flex-1 items-start gap-2 lg:grid-cols-[minmax(0,1fr)_340px]">
          {/* ── Campaign selection ─────────────────────────────────── */}
          <section className={panelClass}>
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 px-3.5 py-2.5 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-md bg-slate-100 dark:bg-slate-800">
                  <Megaphone className="h-3 w-3 text-slate-600 dark:text-slate-300" />
                </div>
                <div>
                  <p className="text-[12px] font-bold leading-tight text-slate-700 dark:text-slate-200">
                    Select campaigns
                  </p>
                  <p className={sectionLabelClass}>
                    {filteredCampaigns.length} shown · {campaigns.length} total
                  </p>
                </div>
              </div>
              <span
                className={cn(
                  "inline-flex items-center rounded-md border px-2 py-0.5 text-[10px] font-bold tabular-nums",
                  selectedCount > 0
                    ? "border-emerald-200/80 bg-emerald-50 text-emerald-800 dark:border-emerald-500/30 dark:bg-emerald-500/15 dark:text-emerald-100"
                    : "border-slate-200 bg-slate-50 text-slate-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-400",
                )}
              >
                {selectedCount} selected
              </span>
            </div>

            <div className="space-y-2.5 px-3.5 py-3">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                <div className="relative min-w-0 flex-1">
                  <Search className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-slate-400" />
                  <Input
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    placeholder="Search campaigns or yards..."
                    className="h-9 rounded-lg border-transparent bg-slate-50 pl-8 pr-3 text-xs shadow-none focus-visible:border-[#008f68] focus-visible:ring-[#008f68]/20 dark:bg-slate-900"
                  />
                </div>
                <YardSegmentedTabs<CampaignTypeTab>
                  tabs={[
                    { value: "all", label: "All", count: typeCounts.all },
                    {
                      value: "ONBOARDING",
                      label: "Onboarding",
                      count: typeCounts.ONBOARDING,
                    },
                    { value: "AR", label: "AR", count: typeCounts.AR },
                    { value: "OTHER", label: "Other", count: typeCounts.OTHER },
                  ]}
                  activeValue={typeTab}
                  onChange={setTypeTab}
                  ariaLabel="Campaign type filter"
                  className="w-full !min-w-0 sm:w-auto"
                />
              </div>

              {selectedCount > 0 ? (
                <div className="sticky top-0 z-10 rounded-xl border border-emerald-200/80 bg-emerald-50/95 px-3 py-2 shadow-sm backdrop-blur dark:border-emerald-500/30 dark:bg-emerald-950/80">
                  <div className="mb-1.5 flex items-center justify-between gap-2">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-emerald-800 dark:text-emerald-200">
                      Selected campaigns
                    </p>
                    <button
                      type="button"
                      onClick={() => setSelectedIds(new Set())}
                      className="rounded-md px-1.5 py-0.5 text-[10px] font-medium text-emerald-700 transition-colors hover:bg-emerald-100 hover:text-emerald-900 dark:text-emerald-200 dark:hover:bg-emerald-500/20"
                    >
                      Clear all
                    </button>
                  </div>
                  <ul className="scrollbar-app flex max-h-20 flex-wrap gap-1.5 overflow-y-auto">
                    {selectedCampaigns.map((campaign) => (
                      <li key={campaign.id}>
                        <button
                          type="button"
                          onClick={() => toggleCampaign(campaign.id)}
                          title={`Remove ${campaign.nombre}`}
                          className="inline-flex h-6 max-w-[240px] items-center gap-1 rounded-md border border-emerald-200 bg-white px-1.5 text-[11px] font-medium text-emerald-800 transition-colors hover:bg-emerald-100 dark:border-emerald-500/30 dark:bg-emerald-500/15 dark:text-emerald-100 dark:hover:bg-emerald-500/25"
                        >
                          <span className="truncate">{campaign.nombre}</span>
                          <X className="size-3 shrink-0" aria-hidden />
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}

              {loadingCampaigns ? (
                <div className="flex min-h-[280px] items-center justify-center rounded-xl bg-gradient-to-b from-[#f0faf5]/50 via-white to-white py-10 dark:from-[#008f68]/5 dark:via-slate-950 dark:to-slate-950">
                  <EntityLoadingSpinner kind="campaigns" />
                </div>
              ) : filteredCampaigns.length === 0 ? (
                <div className="rounded-xl border border-dashed border-slate-200 py-10 text-center text-xs font-medium text-slate-400 dark:border-slate-700">
                  {campaigns.length === 0
                    ? "No campaigns available."
                    : "No campaigns match the current search and type filter."}
                </div>
              ) : (
                <div className="overflow-hidden rounded-xl border border-slate-100 dark:border-slate-800">
                  <button
                    type="button"
                    onClick={toggleAllFiltered}
                    className="flex w-full items-center gap-2.5 border-b border-slate-100 bg-slate-50/80 px-3 py-2 text-left transition-colors hover:bg-slate-100/80 dark:border-slate-800 dark:bg-slate-900/80 dark:hover:bg-slate-900"
                  >
                    {allFilteredSelected ? (
                      <CheckSquare
                        className="size-4 shrink-0 text-[#008f68] dark:text-emerald-400"
                        aria-hidden
                      />
                    ) : (
                      <Square
                        className={cn(
                          "size-4 shrink-0",
                          someFilteredSelected
                            ? "text-[#008f68] dark:text-emerald-400"
                            : "text-slate-300",
                        )}
                        aria-hidden
                      />
                    )}
                    <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                      {allFilteredSelected
                        ? "Clear filtered selection"
                        : `Select the ${filteredCampaigns.length} filtered campaign${filteredCampaigns.length === 1 ? "" : "s"}`}
                    </span>
                  </button>

                  <ul className="scrollbar-app max-h-[52dvh] divide-y divide-slate-50 overflow-y-auto dark:divide-slate-800/60">
                    {filteredCampaigns.map((campaign) => {
                      const checked = selectedIds.has(campaign.id);
                      const tipo = (campaign.tipo || "OTHER").toUpperCase();
                      const badge =
                        TYPE_BADGES[tipo === "ONBOARDING" || tipo === "AR" ? tipo : "OTHER"];
                      return (
                        <li key={campaign.id}>
                          <label
                            className={cn(
                              "flex cursor-pointer items-center gap-2.5 px-3 py-2 transition-colors",
                              checked
                                ? "bg-emerald-50/50 dark:bg-emerald-500/10"
                                : "hover:bg-slate-50 dark:hover:bg-slate-900/60",
                            )}
                          >
                            <Checkbox
                              checked={checked}
                              onCheckedChange={() => toggleCampaign(campaign.id)}
                              className="data-[state=checked]:border-[#008f68] data-[state=checked]:bg-[#008f68]"
                              aria-label={`Select ${campaign.nombre}`}
                            />
                            <span className="min-w-0 flex-1">
                              <span className="block truncate text-xs font-medium text-slate-800 dark:text-slate-100">
                                {campaign.nombre}
                              </span>
                              <span className="block truncate text-[11px] text-slate-400">
                                {campaign.yarda?.name || "No yard"} · Created{" "}
                                {formatCreatedAt(campaign.createdAt)}
                              </span>
                            </span>
                            {campaign.isActive === false ? (
                              <span className="inline-flex shrink-0 items-center gap-1 rounded border border-slate-200 bg-slate-50 px-1.5 py-0.5 text-[10px] font-semibold text-slate-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-400">
                                <span className="size-1.5 rounded-full bg-slate-400" />
                                Inactive
                              </span>
                            ) : null}
                            <span
                              className={cn(
                                "inline-flex shrink-0 items-center gap-1 rounded border px-1.5 py-0.5 text-[10px] font-semibold",
                                badge.className,
                              )}
                            >
                              <span
                                className={cn(
                                  "size-1.5 rounded-full",
                                  badge.dotClassName,
                                )}
                              />
                              {badge.label}
                            </span>
                          </label>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              )}
            </div>
          </section>

          {/* ── Export setup rail ──────────────────────────────────── */}
          <aside className="flex flex-col gap-2 lg:sticky lg:top-20">
            <section className={panelClass}>
              <div className="flex items-center justify-between gap-3 border-b border-slate-100 px-3.5 py-2.5 dark:border-slate-800">
                <p className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-slate-400">
                  <Calendar
                    className="size-3.5 text-[#008f68] dark:text-emerald-400"
                    aria-hidden
                  />
                  Date range
                </p>
                {hasDates && isRangeValid ? (
                  <span className="rounded-full border border-emerald-200 bg-emerald-50/50 px-2.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-[#008f68] dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-300">
                    Selected
                  </span>
                ) : null}
              </div>
              <div className="flex flex-col gap-3 px-3.5 py-3">
                <TooltipProvider delayDuration={300}>
                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                    {DATE_PRESETS.map((preset) => {
                      const active = activePreset === preset.key;
                      return (
                        <Tooltip key={preset.key}>
                          <TooltipTrigger asChild>
                            <button
                              type="button"
                              onClick={() => applyPreset(preset.key)}
                              aria-pressed={active}
                              className={presetBtnClass(active)}
                            >
                              <span
                                className={cn(
                                  "text-[12px] font-semibold leading-tight",
                                  active
                                    ? "text-[#008f68] dark:text-emerald-400"
                                    : "text-slate-800 dark:text-slate-200",
                                )}
                              >
                                {preset.label}
                              </span>
                              <span className="mt-0.5 text-[8px] font-bold uppercase tracking-wider text-slate-400">
                                {preset.subtitle}
                              </span>
                            </button>
                          </TooltipTrigger>
                          <TooltipContent side="top" className="text-xs">
                            {presetTooltip(preset.key)}
                          </TooltipContent>
                        </Tooltip>
                      );
                    })}
                  </div>
                </TooltipProvider>

                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                      Start date
                    </label>
                    <Popover
                      open={startPopoverOpen}
                      onOpenChange={setStartPopoverOpen}
                    >
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn(
                            "h-9 w-full justify-start rounded-lg border-transparent bg-slate-50 px-2.5 text-left text-xs font-medium text-slate-900 shadow-none transition-colors hover:border-slate-300 hover:bg-white focus-visible:border-[#008f68] focus-visible:ring-[#008f68]/20 dark:bg-slate-900 dark:text-slate-100 dark:hover:border-slate-700",
                            !startDateObj && "text-slate-500",
                          )}
                        >
                          <Calendar
                            data-icon="inline-start"
                            className="text-slate-400"
                          />
                          {formattedStartDate ? (
                            <span className="truncate">
                              {formattedStartDate}
                            </span>
                          ) : (
                            <span>Pick a date</span>
                          )}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent
                        className="w-auto rounded-xl border-slate-200/80 p-0 shadow-xl dark:border-slate-800"
                        align="start"
                      >
                        <div className="flex flex-col gap-2 p-2">
                          <CalendarWidget
                            mode="single"
                            selected={startDateObj}
                            onSelect={handleStartSelect}
                            numberOfMonths={1}
                            disabled={{ after: new Date() }}
                            className="rounded-md"
                          />
                          {startDateObj ? (
                            <div className="border-t border-slate-200 pt-2 dark:border-slate-800">
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 w-full text-xs text-slate-500 hover:text-slate-900 dark:hover:text-slate-100"
                                onClick={() => handleStartSelect(undefined)}
                              >
                                <X data-icon="inline-start" />
                                Clear selection
                              </Button>
                            </div>
                          ) : null}
                        </div>
                      </PopoverContent>
                    </Popover>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                      End date
                    </label>
                    <Popover
                      open={endPopoverOpen}
                      onOpenChange={setEndPopoverOpen}
                    >
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn(
                            "h-9 w-full justify-start rounded-lg border-transparent bg-slate-50 px-2.5 text-left text-xs font-medium text-slate-900 shadow-none transition-colors hover:border-slate-300 hover:bg-white focus-visible:border-[#008f68] focus-visible:ring-[#008f68]/20 dark:bg-slate-900 dark:text-slate-100 dark:hover:border-slate-700",
                            !endDateObj && "text-slate-500",
                          )}
                        >
                          <Calendar
                            data-icon="inline-start"
                            className="text-slate-400"
                          />
                          {formattedEndDate ? (
                            <span className="truncate">{formattedEndDate}</span>
                          ) : (
                            <span>Pick a date</span>
                          )}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent
                        className="w-auto rounded-xl border-slate-200/80 p-0 shadow-xl dark:border-slate-800"
                        align="end"
                      >
                        <div className="flex flex-col gap-2 p-2">
                          <CalendarWidget
                            mode="single"
                            selected={endDateObj}
                            onSelect={handleEndSelect}
                            numberOfMonths={1}
                            disabled={{ after: new Date() }}
                            className="rounded-md"
                          />
                          {endDateObj ? (
                            <div className="border-t border-slate-200 pt-2 dark:border-slate-800">
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 w-full text-xs text-slate-500 hover:text-slate-900 dark:hover:text-slate-100"
                                onClick={() => handleEndSelect(undefined)}
                              >
                                <X data-icon="inline-start" />
                                Clear selection
                              </Button>
                            </div>
                          ) : null}
                        </div>
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>

                {hasDates && isRangeValid ? (
                  <div className="rounded-xl border border-slate-200/80 bg-slate-50/40 px-3.5 py-2.5 text-xs text-slate-700 dark:border-slate-800 dark:bg-slate-900/40 dark:text-slate-300">
                    <span className="font-bold text-slate-900 dark:text-slate-100">
                      Range:
                    </span>{" "}
                    {formattedStartDate} to {formattedEndDate}
                  </div>
                ) : null}

                {hasDates && !isRangeValid ? (
                  <Alert className="border-amber-200 bg-amber-50/70 text-amber-900 shadow-sm dark:border-amber-900/50 dark:bg-amber-950/20 dark:text-amber-200">
                    <AlertCircle className="size-4 text-amber-600 dark:text-amber-400" />
                    <AlertTitle className="text-xs font-semibold">
                      Invalid range
                    </AlertTitle>
                    <AlertDescription className="mt-1 text-xs">
                      Start date cannot be later than end date. Please adjust
                      the range.
                    </AlertDescription>
                  </Alert>
                ) : null}
              </div>
            </section>

            <section className={panelClass}>
              <div className="flex items-center gap-2 border-b border-slate-100 px-3.5 py-2.5 dark:border-slate-800">
                <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-md bg-slate-100 dark:bg-slate-800">
                  <Layers className="h-3 w-3 text-slate-600 dark:text-slate-300" />
                </div>
                <p className="text-[12px] font-bold leading-tight text-slate-700 dark:text-slate-200">
                  Formats
                </p>
              </div>
              <div className="space-y-1.5 px-3.5 py-3">
                {(Object.keys(FORMAT_META) as BulkExportFormat[]).map(
                  (format) => {
                    const meta = FORMAT_META[format];
                    const active = formats.includes(format);
                    const FormatIcon = meta.icon;
                    return (
                      <button
                        key={format}
                        type="button"
                        onClick={() => toggleFormat(format)}
                        aria-pressed={active}
                        className={cn(
                          "flex w-full items-center gap-2.5 rounded-xl border px-3 py-2 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#008f68]/25",
                          active
                            ? "border-emerald-300 bg-emerald-50/60 ring-1 ring-emerald-100 dark:border-emerald-500/40 dark:bg-emerald-500/10 dark:ring-emerald-500/20"
                            : "border-slate-200/80 bg-white hover:border-slate-300 dark:border-slate-800 dark:bg-slate-950",
                        )}
                      >
                        <span
                          className={cn(
                            "flex size-8 shrink-0 items-center justify-center rounded-lg",
                            active
                              ? "bg-[#008f68]/10 text-[#008f68] dark:bg-emerald-500/15 dark:text-emerald-400"
                              : "bg-slate-100 text-slate-400 dark:bg-slate-800",
                          )}
                        >
                          <FormatIcon className="size-4" aria-hidden />
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block text-xs font-semibold text-slate-800 dark:text-slate-100">
                            {meta.label}
                          </span>
                          <span className="block truncate text-[11px] text-slate-500 dark:text-slate-400">
                            {meta.hint}
                          </span>
                        </span>
                        {active ? (
                          <CheckCircle2
                            className="size-4 shrink-0 text-[#008f68] dark:text-emerald-400"
                            aria-hidden
                          />
                        ) : null}
                      </button>
                    );
                  },
                )}
              </div>
            </section>

            <section className={panelClass}>
              <div className="flex items-center justify-between gap-2 border-b border-slate-100 px-3.5 py-2.5 dark:border-slate-800">
                <div className="flex items-center gap-2">
                  <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-md bg-slate-100 dark:bg-slate-800">
                    <FolderDown className="h-3 w-3 text-slate-600 dark:text-slate-300" />
                  </div>
                  <p className="text-[12px] font-bold leading-tight text-slate-700 dark:text-slate-200">
                    Selection
                  </p>
                </div>
                {selectedCount > 0 ? (
                  <button
                    type="button"
                    onClick={() => setSelectedIds(new Set())}
                    className="rounded-md px-1.5 py-0.5 text-[10px] font-medium text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-700 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-200"
                  >
                    Clear all
                  </button>
                ) : null}
              </div>
              <div className="px-3.5 py-3">
                {selectedCount === 0 ? (
                  <p className="rounded-xl border border-dashed border-slate-200 px-3 py-4 text-center text-[11px] font-medium text-slate-400 dark:border-slate-700">
                    Selected campaigns will appear here.
                  </p>
                ) : (
                  <ul className="scrollbar-app flex max-h-[160px] flex-wrap gap-1.5 overflow-y-auto">
                    {selectedCampaigns.map((campaign) => (
                      <li key={campaign.id}>
                        <button
                          type="button"
                          onClick={() => toggleCampaign(campaign.id)}
                          title={`Remove ${campaign.nombre}`}
                          className="inline-flex h-6 max-w-[220px] items-center gap-1 rounded-md border border-emerald-200/80 bg-emerald-50 px-1.5 text-[11px] font-medium text-emerald-800 transition-colors hover:bg-emerald-100 dark:border-emerald-500/30 dark:bg-emerald-500/15 dark:text-emerald-100 dark:hover:bg-emerald-500/25"
                        >
                          <span className="truncate">{campaign.nombre}</span>
                          <X className="size-3 shrink-0" aria-hidden />
                        </button>
                      </li>
                    ))}
                  </ul>
                )}

                <div className="mt-3 border-t border-slate-100 pt-3 dark:border-slate-800">
                  <p
                    className={cn(
                      "mb-2 text-[11px] font-medium",
                      canExport
                        ? "text-slate-600 dark:text-slate-300"
                        : "text-slate-400",
                    )}
                    aria-live="polite"
                  >
                    {exportHint}
                  </p>
                  <Button
                    type="button"
                    onClick={startExport}
                    disabled={!canExport}
                    className="h-9 w-full rounded-lg bg-[#008f68] text-xs font-semibold text-white shadow-sm hover:bg-[#007a5a] disabled:opacity-50"
                  >
                    <Download className="mr-1.5 size-3.5" aria-hidden />
                    Export {totalFiles > 0 ? `${totalFiles} file${totalFiles === 1 ? "" : "s"}` : "reports"}
                  </Button>
                </div>
              </div>
            </section>
          </aside>
        </div>
      </div>

      <BulkExportProgressDialog
        open={progressOpen}
        onOpenChange={setProgressOpen}
        title="Exporting campaign reports"
        description="Each report is generated and downloaded one by one — progress is shown below."
        plan={plan}
        buildRequest={buildBulkExportRequest}
      />
    </div>
  );
}
