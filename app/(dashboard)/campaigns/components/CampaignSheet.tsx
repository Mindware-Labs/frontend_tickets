"use client";

import {
  useEffect,
  useMemo,
  useState,
  type MouseEvent,
  type ReactNode,
} from "react";
import Link from "next/link";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { ManagementType } from "../../calls/types";
import { fetchFromBackend } from "@/lib/api-client";
import { useAircall } from "@/components/providers/AircallProvider";
import { ActivitiesIcon } from "@/components/icons/activities-icon";
import { useRole } from "@/components/providers/role-provider";
import { cn } from "@/lib/utils";
import {
  Ban,
  BarChart3,
  Building2,
  CheckCircle2,
  Clock,
  DollarSign,
  FileText,
  Loader2,
  MapPin,
  Megaphone,
  Pencil,
  RefreshCw,
  Tag,
  Trash2,
  X,
  XCircle,
  type LucideIcon,
} from "lucide-react";
import type { Campaign, YardSummary } from "../types";
import {
  CAMPAIGN_TYPE_LABELS,
  formatCampaignDate,
  getTypePillStyles,
  getYardLabel,
} from "../utils";
import { CampaignSheetYardView } from "./CampaignSheetYardView";

type CampaignTicket = {
  id: number;
  status?: string | null;
  createdAt?: string;
  customer?: { name?: string | null };
  customerPhone?: string | null;
  campaignId?: number | null;
  campaign?: { id?: number | null };
};

interface CampaignSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  campaign: Campaign | null;
  yards: YardSummary[];
  yardPanelId?: number | null;
  onOpenYardPanel: (yardId: number) => void;
  onCloseYardPanel: () => void;
  onEdit?: (campaign: Campaign) => void;
  onDelete?: (campaign: Campaign) => void;
}

function SectionLabel({ children }: { children: ReactNode }) {
  return (
    <p className="mb-3 text-[11px] font-bold uppercase tracking-[0.14em] text-slate-500 dark:text-slate-400">
      {children}
    </p>
  );
}

function normalizePhone(phone: string) {
  return (phone || "").replace(/\D/g, "");
}

function StatusPill({ active }: { active: boolean }) {
  return active ? (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-[3px] text-[11px] font-semibold text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-300">
      <span className="h-2 w-2 shrink-0 rounded-full bg-emerald-500" />
      Active
    </span>
  ) : (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-slate-100 px-2.5 py-[3px] text-[11px] font-semibold text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300">
      <span className="h-2 w-2 shrink-0 rounded-full bg-slate-400" />
      Inactive
    </span>
  );
}

function InfoLine({
  icon: Icon,
  label,
  value,
  className,
  wrap = false,
}: {
  icon: LucideIcon;
  label: string;
  value: string;
  className?: string;
  wrap?: boolean;
}) {
  return (
    <div className={cn("flex min-w-0 items-start gap-2", className)}>
      <Icon className="mt-0.5 h-3.5 w-3.5 shrink-0 text-slate-500" />
      <div className="min-w-0">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-300">
          {label}
        </p>
        <p
          className={cn(
            "text-sm font-medium text-slate-800 dark:text-slate-100",
            wrap ? "whitespace-normal break-words" : "truncate",
          )}
          title={value}
        >
          {value}
        </p>
      </div>
    </div>
  );
}

function MetricTile({
  icon: Icon,
  label,
  value,
  tone = "neutral",
}: {
  icon: LucideIcon;
  label: string;
  value: number;
  tone?: "success" | "danger" | "warning" | "neutral";
}) {
  const toneClass =
    tone === "success"
      ? "border-emerald-100 bg-emerald-50/50 text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-200"
      : tone === "danger"
        ? "border-red-100 bg-red-50/50 text-red-700 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-200"
        : tone === "warning"
          ? "border-yellow-100 bg-yellow-50/50 text-yellow-700 dark:border-yellow-500/30 dark:bg-yellow-500/10 dark:text-yellow-200"
          : "border-slate-100 bg-slate-50/60 text-slate-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200";

  return (
    <div className={cn("min-w-0 rounded-xl border px-3 pb-3 pt-3", toneClass)}>
      <p className="flex items-start gap-1 text-[9px] font-semibold uppercase leading-tight tracking-normal sm:gap-1.5">
        <Icon className="mt-px h-3 w-3 shrink-0" />
        <span className="min-w-0 whitespace-normal break-words">{label}</span>
      </p>
      <p className="mt-1.5 text-xl font-bold leading-none">{value}</p>
    </div>
  );
}

function getPercent(part: number, total: number) {
  if (total <= 0) return 0;
  return Math.round((part / total) * 100);
}

function getSegmentPercent(part: number, total: number) {
  if (total <= 0) return 0;
  return (part / total) * 100;
}

function getOutcomeSummary(campaign: Campaign) {
  if (campaign.tipo === ManagementType.ONBOARDING) {
    return {
      rateLabel: "Enrollment rate",
      positiveLabel: "Registered",
      negativeLabel: "Not registered",
      positiveValue: campaign.registeredCount ?? 0,
      negativeValue: campaign.notRegisteredCount ?? 0,
      PositiveIcon: CheckCircle2,
      NegativeIcon: XCircle,
    };
  }

  if (campaign.tipo === ManagementType.AR) {
    return {
      rateLabel: "Payment rate",
      positiveLabel: "Paid",
      negativeLabel: "Not paid",
      positiveValue: campaign.paidCount ?? 0,
      negativeValue: campaign.notPaidCount ?? 0,
      PositiveIcon: DollarSign,
      NegativeIcon: Ban,
    };
  }

  return null;
}

export function CampaignSheet({
  open,
  onOpenChange,
  campaign,
  yards,
  yardPanelId = null,
  onOpenYardPanel,
  onCloseYardPanel,
  onEdit,
  onDelete,
}: CampaignSheetProps) {
  const { role } = useRole();
  const isAgent = role?.toString().toLowerCase() === "agent";
  const { setSheetOpen } = useAircall();

  const [detail, setDetail] = useState<Campaign | null>(null);
  const [loading, setLoading] = useState(false);
  useEffect(() => {
    setSheetOpen(open);
    return () => setSheetOpen(false);
  }, [open, setSheetOpen]);

  useEffect(() => {
    if (!campaign?.id) {
      setDetail(null);
      return;
    }

    setDetail(campaign);
    let cancelled = false;

    const load = async () => {
      try {
        setLoading(true);
        const fetched = await fetchFromBackend(`/campaign/${campaign.id}`);
        if (!cancelled) setDetail(fetched);
      } catch {
        if (!cancelled) setDetail(campaign);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();
    return () => {
      cancelled = true;
    };
  }, [campaign]);

  const data = detail || campaign;

  const yardLabel = data ? getYardLabel(data, yards) : "";
  const linkedYardId = Number(data?.yardaId ?? data?.yarda?.id ?? 0) || null;
  const showYardPanel = Boolean(
    yardPanelId && linkedYardId && yardPanelId === linkedYardId,
  );
  const totalActivities = data?.ticketCount ?? 0;
  const outcome = data ? getOutcomeSummary(data) : null;
  const classifiedCount = outcome
    ? outcome.positiveValue + outcome.negativeValue
    : 0;
  const unclassifiedCount = outcome
    ? Math.max(totalActivities - classifiedCount, 0)
    : 0;
  const outcomeRate = outcome
    ? getPercent(outcome.positiveValue, classifiedCount)
    : 0;
  const coverageRate = outcome
    ? getPercent(classifiedCount, totalActivities)
    : 0;
  const classifiedWidth = outcome
    ? getSegmentPercent(classifiedCount, totalActivities)
    : 0;
  const unclassifiedWidth = outcome
    ? getSegmentPercent(unclassifiedCount, totalActivities)
    : 0;

  const handleOpenYard = (event: MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();
    if (!linkedYardId) return;
    onOpenYardPanel(linkedYardId);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        hideClose
        className={cn(
          "flex h-dvh w-full max-w-[560px] flex-col gap-0 overflow-hidden p-0 sm:w-[min(560px,calc(100vw-2rem))]",
          "border-l border-slate-200/80 bg-slate-50 text-slate-900 antialiased",
          "shadow-2xl shadow-slate-900/15 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-50",
        )}
      >
        {!data ? (
          <>
            <SheetHeader className="sr-only">
              <SheetTitle>Campaign details</SheetTitle>
              <SheetDescription>No campaign selected.</SheetDescription>
            </SheetHeader>
            <div className="flex min-h-0 flex-1 items-center justify-center p-8 text-center text-sm text-slate-500">
              Select a campaign from the grid.
            </div>
          </>
        ) : (
          <>
            <SheetHeader className="sr-only">
              <SheetTitle>{data.nombre}</SheetTitle>
              <SheetDescription>
                {showYardPanel
                  ? "Linked yard details."
                  : "Campaign profile and metrics."}
              </SheetDescription>
            </SheetHeader>

            {showYardPanel && yardPanelId ? (
              <CampaignSheetYardView
                yardId={yardPanelId}
                onBack={onCloseYardPanel}
              />
            ) : (
              <div className="flex h-full min-h-0 flex-col">
            <div className="relative shrink-0 border-b border-t-4 border-slate-200/70 border-t-emerald-600 bg-white dark:border-slate-800 dark:border-t-emerald-500 dark:bg-slate-950">
              <SheetClose
                aria-label="Close campaign details"
                className="absolute right-4 top-4 z-20 flex h-10 w-10 items-center justify-center rounded-full text-slate-400 transition-all hover:bg-slate-100 hover:text-slate-700 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#008f68]/35"
              >
                <X className="h-5 w-5" strokeWidth={2} />
              </SheetClose>

              <div className="px-5 pb-5 pt-5 sm:px-6">
                <div className="flex items-center gap-4 pr-12">
                  <div className="m-0 flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-slate-100 bg-slate-50 p-0 text-slate-600 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300">
                    <Megaphone className="h-5 w-5" strokeWidth={2} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded-full bg-slate-50 px-2 py-0.5 font-mono text-[11px] font-semibold text-slate-500 ring-1 ring-inset ring-slate-200/80 dark:bg-slate-900 dark:text-slate-400 dark:ring-slate-700">
                        #{data.id}
                      </span>
                      <span
                        className={cn(
                          "inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[11px] font-semibold",
                          getTypePillStyles(data.tipo),
                        )}
                      >
                        <Tag className="h-3 w-3" />
                        {CAMPAIGN_TYPE_LABELS[data.tipo]}
                      </span>
                      <StatusPill active={data.isActive} />
                      {loading ? (
                        <span className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-slate-50 px-2.5 py-0.5 text-[11px] font-semibold text-slate-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-400">
                          <RefreshCw className="h-3 w-3 animate-spin" />
                          Refreshing
                        </span>
                      ) : null}
                    </div>
                    <h2 className="mt-2 text-[22px] font-bold leading-tight text-slate-800 wrap-anywhere dark:text-white">
                      {data.nombre}
                    </h2>
                    <p className="hidden">
                      {CAMPAIGN_TYPE_LABELS[data.tipo]} · Created{" "}
                      {formatCampaignDate(data.createdAt)}
                    </p>
                  </div>
                </div>

                <div className="mt-6 grid grid-cols-2 gap-4">
                  {linkedYardId ? (
                    <button
                      type="button"
                      onClick={handleOpenYard}
                      className="col-span-2 flex min-w-0 items-start gap-2 rounded-xl border border-transparent p-0 text-left transition-colors hover:border-emerald-100 hover:bg-emerald-50/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#008f68]/30 dark:hover:border-emerald-500/20 dark:hover:bg-emerald-500/10"
                    >
                      <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-slate-500" />
                      <div className="min-w-0 flex-1">
                        <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-300">
                          Yard
                        </p>
                        <p className="whitespace-normal break-words text-sm font-medium text-slate-800 dark:text-slate-100">
                          {yardLabel}
                        </p>
                        <p className="mt-0.5 inline-flex items-center gap-1 text-[11px] font-medium text-emerald-700 dark:text-emerald-300">
                          View yard details
                          <Building2 className="h-3 w-3" />
                        </p>
                      </div>
                    </button>
                  ) : (
                    <InfoLine
                      icon={MapPin}
                      label="Yard"
                      value="No yard assigned"
                      className="col-span-2"
                      wrap
                    />
                  )}
                  <InfoLine
                    icon={Clock}
                    label="Duration"
                    value={data.duracion || "-"}
                  />
                  <InfoLine
                    icon={FileText}
                    label="Created"
                    value={formatCampaignDate(data.createdAt)}
                  />
                </div>
              </div>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
              <div className="space-y-6 px-5 py-5 pb-8 sm:px-6">
                <div>
                  <SectionLabel>Performance</SectionLabel>
                  <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-950">
                    <div className="flex items-end justify-between gap-3">
                      {outcome ? (
                        <>
                          <div>
                            <p className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                              <outcome.PositiveIcon className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                              {outcome.positiveLabel} (Conversions)
                            </p>
                            <p className="mt-1 text-3xl font-bold leading-none text-emerald-700 dark:text-emerald-300">
                              {outcome.positiveValue}
                            </p>
                          </div>

                          <div className="text-right">
                            <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                              {outcome.rateLabel}
                            </p>
                            <p className="mt-1 text-2xl font-bold leading-none text-slate-900 dark:text-slate-50">
                              {outcomeRate}%
                            </p>
                          </div>
                        </>
                      ) : (
                        <>
                          <div>
                            <p className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                              <Megaphone className="h-3.5 w-3.5 text-slate-400" />
                              Total Leads
                            </p>
                            <p className="mt-1 text-3xl font-bold leading-none text-slate-900 dark:text-slate-50">
                              {totalActivities}
                            </p>
                          </div>

                          <div className="flex items-center gap-2 text-right text-[12px] font-semibold text-slate-500">
                            <BarChart3 className="h-4 w-4" />
                            General tracking
                          </div>
                        </>
                      )}
                    </div>

                    {outcome ? (
                      <>
                        <div className="mt-3 flex h-2 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                          <div
                            className="h-full shrink-0 bg-emerald-600 transition-[width] duration-300"
                            style={{ width: `${classifiedWidth}%` }}
                          />
                          <div
                            className="h-full shrink-0 bg-orange-500 transition-[width] duration-300"
                            style={{ width: `${unclassifiedWidth}%` }}
                          />
                        </div>

                        <div className="mt-2 flex flex-wrap items-center justify-between gap-x-3 gap-y-1 text-xs font-medium">
                          <span className="inline-flex items-center gap-1.5 text-slate-600 dark:text-slate-300">
                            <span className="h-2 w-2 rounded-full bg-emerald-600" />
                            {classifiedCount} classified
                          </span>
                          <span className="inline-flex items-center gap-1.5 text-orange-600 dark:text-orange-300">
                            <span className="h-2 w-2 rounded-full bg-orange-500" />
                            {unclassifiedCount} unclassified
                          </span>
                          <span className="inline-flex items-center gap-1.5 text-slate-500 dark:text-slate-400">
                            <span className="h-2 w-2 rounded-full bg-slate-300 dark:bg-slate-600" />
                            {coverageRate}% coverage
                          </span>
                        </div>

                        <div className="mt-5 grid grid-cols-3 gap-3">
                          <MetricTile
                            icon={outcome.PositiveIcon}
                            label={outcome.positiveLabel}
                            value={outcome.positiveValue}
                            tone="success"
                          />
                          <MetricTile
                            icon={outcome.NegativeIcon}
                            label={outcome.negativeLabel}
                            value={outcome.negativeValue}
                            tone="danger"
                          />
                          <MetricTile
                            icon={BarChart3}
                            label="Unclassified"
                            value={unclassifiedCount}
                            tone={unclassifiedCount > 0 ? "warning" : "neutral"}
                          />
                        </div>
                      </>
                    ) : (
                      <p className="mt-3 text-[13px] leading-5 text-slate-500 dark:text-slate-400">
                        General campaign activity is grouped by yard and line for
                        operational reporting.
                      </p>
                    )}
                  </div>
                </div>

                <div className="hidden">
                  <SectionLabel>Campaign info</SectionLabel>
                  <div className="divide-y divide-slate-100 overflow-hidden rounded-xl border border-slate-200/70 bg-white shadow-sm dark:divide-slate-800 dark:border-slate-800 dark:bg-slate-950">
                    <div className="flex gap-3 px-4 py-3.5">
                      <Tag className="mt-0.5 h-4 w-4 text-slate-400" />
                      <div>
                        <p className="text-[11px] font-semibold uppercase text-slate-400">
                          Type
                        </p>
                        <p className="text-[13px] font-medium">{CAMPAIGN_TYPE_LABELS[data.tipo]}</p>
                      </div>
                    </div>
                    <div className="flex gap-3 px-4 py-3.5">
                      <Clock className="mt-0.5 h-4 w-4 text-slate-400" />
                      <div>
                        <p className="text-[11px] font-semibold uppercase text-slate-400">
                          Duration
                        </p>
                        <p className="text-[13px] font-medium">{data.duracion || "—"}</p>
                      </div>
                    </div>
                    {linkedYardId ? (
                      <button
                        type="button"
                        onClick={handleOpenYard}
                        className="flex w-full gap-3 px-4 py-3.5 text-left transition-colors hover:bg-[#f0faf5]/70 dark:hover:bg-emerald-500/5"
                      >
                        <MapPin className="mt-0.5 h-4 w-4 text-orange-600" />
                        <div className="min-w-0 flex-1">
                          <p className="text-[11px] font-semibold uppercase text-slate-400">
                            Yard
                          </p>
                          <p className="truncate text-[13px] font-semibold text-[#008f68]">
                            {yardLabel}
                          </p>
                          <p className="mt-0.5 text-[11px] font-medium text-slate-400">
                            Tap to view yard details
                          </p>
                        </div>
                        <Building2 className="mt-1 h-4 w-4 shrink-0 text-slate-300" />
                      </button>
                    ) : (
                      <div className="flex gap-3 px-4 py-3.5">
                        <MapPin className="mt-0.5 h-4 w-4 text-slate-300" />
                        <div className="min-w-0 flex-1">
                          <p className="text-[11px] font-semibold uppercase text-slate-400">
                            Yard
                          </p>
                          <p className="text-[13px] font-medium text-slate-400">
                            No yard assigned
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="hidden">
                  <SectionLabel>Metrics</SectionLabel>
                  {data.tipo === ManagementType.ONBOARDING ? (
                    <div className="grid grid-cols-2 gap-2">
                      <div className="rounded-xl border border-emerald-200/80 bg-emerald-50 p-3">
                        <p className="flex items-center gap-1 text-[10px] font-bold uppercase text-emerald-700">
                          <CheckCircle2 className="h-3.5 w-3.5" />
                          Registered
                        </p>
                        <p className="mt-1 text-2xl font-bold text-emerald-800">
                          {data.registeredCount ?? 0}
                        </p>
                      </div>
                      <div className="rounded-xl border border-red-200/80 bg-red-50 p-3">
                        <p className="flex items-center gap-1 text-[10px] font-bold uppercase text-red-700">
                          <XCircle className="h-3.5 w-3.5" />
                          Not registered
                        </p>
                        <p className="mt-1 text-2xl font-bold text-red-800">
                          {data.notRegisteredCount ?? 0}
                        </p>
                      </div>
                    </div>
                  ) : data.tipo === ManagementType.AR ? (
                    <div className="grid grid-cols-2 gap-2">
                      <div className="rounded-xl border border-emerald-200/80 bg-emerald-50 p-3">
                        <p className="flex items-center gap-1 text-[10px] font-bold uppercase text-emerald-700">
                          <DollarSign className="h-3.5 w-3.5" />
                          Paid
                        </p>
                        <p className="mt-1 text-2xl font-bold text-emerald-800">
                          {data.paidCount ?? 0}
                        </p>
                      </div>
                      <div className="rounded-xl border border-red-200/80 bg-red-50 p-3">
                        <p className="flex items-center gap-1 text-[10px] font-bold uppercase text-red-700">
                          <Ban className="h-3.5 w-3.5" />
                          Not paid
                        </p>
                        <p className="mt-1 text-2xl font-bold text-red-800">
                          {data.notPaidCount ?? 0}
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="rounded-xl border border-slate-200/70 bg-white p-4 shadow-sm">
                      <BarChart3 className="h-4 w-4 text-slate-400" />
                      <p className="mt-2 text-[13px] text-slate-500">
                        General campaign — track activities from the list below.
                      </p>
                    </div>
                  )}
                </div>

                <div>
                  <SectionLabel>Conversion Funnel</SectionLabel>
                  {outcome ? (
                    <div className="space-y-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-950">
                      {/* Step 1: Total Leads */}
                      <div className="relative flex items-center justify-between rounded-xl bg-slate-50/50 p-3 dark:bg-slate-900/40">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <span className="flex size-7 items-center justify-center rounded-lg bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400 text-[11px] font-bold">1</span>
                          <div className="min-w-0">
                            <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Total Leads</p>
                            <p className="text-xs font-semibold text-slate-700 dark:text-slate-200 truncate">Total campaign target size</p>
                          </div>
                        </div>
                        <span className="text-sm font-bold text-slate-800 dark:text-slate-100">{totalActivities}</span>
                      </div>

                      {/* Step 2: Contacted / Classified */}
                      <div className="relative flex items-center justify-between rounded-xl bg-slate-50/50 p-3 dark:bg-slate-900/40">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <span className="flex size-7 items-center justify-center rounded-lg bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400 text-[11px] font-bold">2</span>
                          <div className="min-w-0">
                            <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Contacted & Classified</p>
                            <p className="text-xs font-semibold text-slate-700 dark:text-slate-200 truncate">Leads reached with direct outcome</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-semibold text-amber-700 dark:bg-amber-500/15 dark:text-amber-300">
                            {coverageRate}% coverage
                          </span>
                          <span className="text-sm font-bold text-slate-800 dark:text-slate-100">{classifiedCount}</span>
                        </div>
                      </div>

                      {/* Step 3: Successful Conversions */}
                      <div className="relative flex items-center justify-between rounded-xl border border-emerald-100 bg-emerald-50/20 p-3 dark:border-emerald-500/20 dark:bg-emerald-500/5">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <span className="flex size-7 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400 text-[11px] font-bold">3</span>
                          <div className="min-w-0">
                            <p className="text-[10px] font-semibold uppercase tracking-wider text-emerald-800 dark:text-emerald-400">{outcome.positiveLabel} (Successes)</p>
                            <p className="text-xs font-semibold text-emerald-950 dark:text-emerald-200 truncate">Leads successfully converted</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-[#008f68] dark:bg-emerald-500/15 dark:text-emerald-300">
                            {outcomeRate}% success
                          </span>
                          <span className="text-sm font-bold text-emerald-800 dark:text-emerald-300">{outcome.positiveValue}</span>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-950 space-y-3">
                      <div className="relative flex items-center justify-between rounded-xl bg-slate-50/50 p-3 dark:bg-slate-900/40">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <span className="flex size-7 items-center justify-center rounded-lg bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400 text-[11px] font-bold">1</span>
                          <div className="min-w-0">
                            <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Total Leads</p>
                            <p className="text-xs font-semibold text-slate-700 dark:text-slate-200 truncate">Total campaign target size</p>
                          </div>
                        </div>
                        <span className="text-sm font-bold text-slate-800 dark:text-slate-100">{totalActivities}</span>
                      </div>
                      
                      <div className="relative flex items-center justify-between rounded-xl bg-slate-50/50 p-3 dark:bg-slate-900/40">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <span className="flex size-7 items-center justify-center rounded-lg bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400 text-[11px] font-bold">2</span>
                          <div className="min-w-0">
                            <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Campaign Status</p>
                            <p className="text-xs font-semibold text-slate-700 dark:text-slate-200 truncate">Current operational status</p>
                          </div>
                        </div>
                        <span className={cn(
                          "rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider",
                          data.isActive 
                            ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300"
                            : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300"
                        )}>
                          {data.isActive ? "Active" : "Inactive"}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="shrink-0 border-t border-slate-200/70 bg-white/95 px-5 py-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] shadow-[0_-10px_30px_rgba(15,23,42,0.08)] backdrop-blur dark:border-slate-800 dark:bg-slate-950/95 sm:px-6">
              <div
                className={cn(
                  "grid gap-2",
                  !isAgent && onEdit
                    ? "grid-cols-2 sm:grid-cols-3"
                    : "grid-cols-1",
                )}
              >
                {!isAgent ? (
                  <Link
                    href={`/reports/campaigns?campaignId=${data.id}`}
                    onClick={() => onOpenChange(false)}
                    className="flex min-h-11 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-2 text-[12px] font-semibold text-slate-700 transition-all hover:bg-slate-50 active:scale-[0.98] dark:border-slate-800 dark:bg-slate-950 dark:text-slate-200"
                  >
                    <FileText className="h-4 w-4 shrink-0" />
                    Report
                  </Link>
                ) : null}
                {linkedYardId ? (
                  <button
                    type="button"
                    onClick={handleOpenYard}
                    className="flex min-h-11 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-2 text-[12px] font-semibold text-slate-700 transition-all hover:border-[#008f68]/30 hover:bg-[#f0faf5] hover:text-[#006b4f] active:scale-[0.98] dark:border-slate-800 dark:bg-slate-950 dark:text-slate-200 dark:hover:bg-emerald-500/10"
                  >
                    <Building2 className="h-4 w-4 shrink-0" />
                    Yard
                  </button>
                ) : (
                  <span className="flex min-h-11 items-center justify-center rounded-xl border border-dashed border-slate-200 px-2 text-[11px] text-slate-400">
                    No yard
                  </span>
                )}
                {onEdit && !isAgent ? (
                  <button
                    type="button"
                    onClick={() => {
                      onOpenChange(false);
                      onEdit(data);
                    }}
                    className="flex min-h-11 items-center justify-center gap-2 rounded-xl border border-[#008f68] bg-[#008f68] px-2 text-[12px] font-semibold text-white shadow-sm hover:bg-[#007a5a] active:scale-[0.98]"
                  >
                    <Pencil className="h-4 w-4 shrink-0" />
                    Edit
                  </button>
                ) : null}
              </div>
              {onDelete && !isAgent ? (
                <button
                  type="button"
                  onClick={() => {
                    onOpenChange(false);
                    onDelete(data);
                  }}
                  className="mt-2 flex min-h-10 w-full items-center justify-center gap-2 rounded-xl border border-red-200 bg-red-50 text-[12px] font-semibold text-red-700 hover:bg-red-100/80 dark:border-red-900/40 dark:bg-red-950/30 dark:text-red-300"
                >
                  <Trash2 className="h-4 w-4" />
                  Delete campaign
                </button>
              ) : null}
            </div>
              </div>
            )}
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
