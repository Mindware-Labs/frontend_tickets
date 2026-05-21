"use client";

import Link from "next/link";
import {
  Ban,
  BarChart3,
  CalendarClock,
  CheckCircle2,
  Clock3,
  DollarSign,
  FileText,
  MapPin,
  Megaphone,
  Pencil,
  Tag,
  Trash2,
  XCircle,
  type LucideIcon,
} from "lucide-react";
import { ActivitiesIcon } from "@/components/icons/activities-icon";
import { Button } from "@/components/ui/button";
import { ManagementType } from "../../calls/types";
import { cn } from "@/lib/utils";
import type { Campaign, YardSummary } from "../types";
import {
  CAMPAIGN_TYPE_LABELS,
  formatCampaignDate,
  getTypePillStyles,
  getYardLabel,
} from "../utils";

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

function MetricChip({
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
    <div className={cn("min-w-0 rounded-lg border px-3 pb-3 pt-3", toneClass)}>
      <p className="flex items-start gap-1 text-[9px] font-semibold uppercase leading-tight tracking-normal sm:gap-1.5">
        <Icon className="mt-px h-3 w-3 shrink-0" />
        <span className="min-w-0 whitespace-normal break-words">{label}</span>
      </p>
      <p className="mt-1.5 text-lg font-bold leading-none">{value}</p>
    </div>
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

interface CampaignCardProps {
  campaign: Campaign;
  yards: YardSummary[];
  onOpen: (campaign: Campaign) => void;
  onEdit?: (campaign: Campaign) => void;
  onDelete?: (campaign: Campaign) => void;
}

export function CampaignCard({
  campaign,
  yards,
  onOpen,
  onEdit,
  onDelete,
}: CampaignCardProps) {
  const showActions = Boolean(onEdit || onDelete);
  const showReportLink = Boolean(onEdit || onDelete);
  const yardLabel = getYardLabel(campaign, yards);
  const totalActivities = campaign.ticketCount ?? 0;
  const outcome = getOutcomeSummary(campaign);
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

  return (
    <article
      role="button"
      tabIndex={0}
      onClick={() => onOpen(campaign)}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onOpen(campaign);
        }
      }}
      className={cn(
        "group flex flex-col rounded-2xl border border-t-4 border-slate-200 border-t-emerald-600 bg-white p-5 text-left shadow-sm transition-all duration-200",
        "hover:border-slate-300 hover:border-t-emerald-600 hover:shadow-md",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#008f68]/40 focus-visible:ring-offset-2",
        "dark:border-slate-800 dark:bg-slate-950",
      )}
    >
      <div className="flex flex-1 flex-col">
        <div className="flex items-center gap-4">
          <div className="m-0 flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-slate-100 bg-slate-50 p-0 text-slate-600 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300">
            <Megaphone className="h-5 w-5" strokeWidth={2} />
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-slate-50 px-2 py-0.5 font-mono text-[11px] font-semibold text-slate-500 ring-1 ring-inset ring-slate-200/80 dark:bg-slate-900 dark:text-slate-400 dark:ring-slate-700">
                #{campaign.id}
              </span>
              <span
                className={cn(
                  "inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[11px] font-semibold",
                  getTypePillStyles(campaign.tipo),
                )}
              >
                <Tag className="h-3 w-3" />
                {CAMPAIGN_TYPE_LABELS[campaign.tipo]}
              </span>
              <StatusPill active={campaign.isActive} />
            </div>

            <h3
              className="mt-2 truncate text-lg font-bold leading-tight text-slate-800 dark:text-slate-50"
              title={campaign.nombre}
            >
              {campaign.nombre}
            </h3>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-2 gap-4">
          <InfoLine
            icon={MapPin}
            label="Yard"
            value={yardLabel}
            className="col-span-2"
            wrap
          />
          <InfoLine
            icon={Clock3}
            label="Duration"
            value={campaign.duracion || "-"}
          />
          <InfoLine
            icon={CalendarClock}
            label="Created"
            value={formatCampaignDate(campaign.createdAt)}
          />
        </div>

        <div className="my-5 border-t border-slate-100 dark:border-slate-800" />

        <div>
          <div className="flex items-end justify-between gap-3">
            <div>
              <p className="flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                <ActivitiesIcon className="h-3.5 w-3.5" />
                Activities
              </p>
              <p className="mt-1 text-3xl font-bold leading-none text-emerald-700 dark:text-emerald-300">
                {totalActivities}
              </p>
            </div>

            {outcome ? (
              <div className="text-right">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  {outcome.rateLabel}
                </p>
                <p className="mt-1 text-2xl font-bold leading-none text-slate-900 dark:text-slate-50">
                  {outcomeRate}%
                </p>
              </div>
            ) : (
              <div className="flex items-center gap-2 text-right text-[12px] font-semibold text-slate-500">
                <BarChart3 className="h-4 w-4" />
                General tracking
              </div>
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
                <MetricChip
                  icon={outcome.PositiveIcon}
                  label={outcome.positiveLabel}
                  value={outcome.positiveValue}
                  tone="success"
                />
                <MetricChip
                  icon={outcome.NegativeIcon}
                  label={outcome.negativeLabel}
                  value={outcome.negativeValue}
                  tone="danger"
                />
                <MetricChip
                  icon={BarChart3}
                  label="Unclassified"
                  value={unclassifiedCount}
                  tone={unclassifiedCount > 0 ? "warning" : "neutral"}
                />
              </div>
            </>
          ) : (
            <p className="mt-3 text-[12px] leading-5 text-slate-500 dark:text-slate-400">
              General campaign activity is grouped by yard and line for operational
              reporting.
            </p>
          )}
        </div>
      </div>

      <div
        className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-4 dark:border-slate-800"
        onClick={(e) => e.stopPropagation()}
        onKeyDown={(e) => e.stopPropagation()}
      >
        <div className="flex min-w-0 flex-wrap items-center gap-2">
          <Button
            asChild
            variant="outline"
            size="sm"
            className="h-8 px-3 text-sm"
          >
            <Link href={`/calls?campaignId=${campaign.id}`}>
              <ActivitiesIcon className="h-3.5 w-3.5" />
              Activities
            </Link>
          </Button>
          {showReportLink ? (
            <Button
              asChild
              variant="secondary"
              size="sm"
              className="h-8 px-3 text-sm"
            >
              <Link href={`/reports/campaigns?campaignId=${campaign.id}`}>
                <FileText className="h-3.5 w-3.5" />
                Report
              </Link>
            </Button>
          ) : null}
        </div>

        {showActions ? (
          <div className="flex items-center justify-end gap-1">
            {onEdit ? (
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                title="Edit campaign"
                aria-label="Edit campaign"
                onClick={() => onEdit(campaign)}
                className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-100"
              >
                <Pencil className="h-4 w-4" strokeWidth={2} />
              </Button>
            ) : null}
            {onDelete ? (
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                title="Delete campaign"
                aria-label="Delete campaign"
                onClick={() => onDelete(campaign)}
                className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-100"
              >
                <Trash2 className="h-4 w-4" strokeWidth={2} />
              </Button>
            ) : null}
          </div>
        ) : null}
      </div>
    </article>
  );
}
