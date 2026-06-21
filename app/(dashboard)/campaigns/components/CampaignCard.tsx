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
  RotateCcw,
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
  return (
    <span
      className={cn(
        "inline-flex h-5 items-center gap-1 rounded-full border px-2 text-[10px] font-semibold",
        active
          ? "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-300"
          : "border-slate-200 bg-slate-100 text-slate-600 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-300",
      )}
    >
      <span
        className={cn(
          "h-1.5 w-1.5 rounded-full",
          active ? "bg-emerald-500" : "bg-slate-400",
        )}
      />
      {active ? "Active" : "Inactive"}
    </span>
  );
}

function StatTile({
  icon: Icon,
  label,
  value,
  helper,
  tone = "neutral",
}: {
  icon: LucideIcon;
  label: string;
  value: string | number;
  helper?: string;
  tone?: "success" | "danger" | "warning" | "neutral" | "brand";
}) {
  const toneClass =
    tone === "brand"
      ? "border-emerald-100 bg-[#f0faf5] text-[#008f68] dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-300"
      : tone === "success"
        ? "border-emerald-100 bg-emerald-50/60 text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-200"
        : tone === "danger"
          ? "border-red-100 bg-red-50/60 text-red-700 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-200"
          : tone === "warning"
            ? "border-amber-100 bg-amber-50/70 text-amber-700 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-200"
            : "border-slate-100 bg-slate-50/70 text-slate-700 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-200";

  return (
    <div className={cn("min-w-0 rounded-lg border px-2.5 py-2", toneClass)}>
      <div className="flex min-w-0 items-center gap-1.5">
        <Icon className="h-3 w-3 shrink-0" strokeWidth={2} />
        <p className="truncate text-[9px] font-semibold uppercase tracking-wide">
          {label}
        </p>
      </div>
      <p className="mt-1 text-xl font-bold leading-none tabular-nums">
        {value}
      </p>
      {helper ? (
        <p className="mt-1 truncate text-[10px] font-medium opacity-75">
          {helper}
        </p>
      ) : null}
    </div>
  );
}

function MetaItem({
  icon: Icon,
  label,
  value,
  className,
}: {
  icon: LucideIcon;
  label: string;
  value: string;
  className?: string;
}) {
  return (
    <div className={cn("flex min-w-0 items-start gap-1.5", className)}>
      <Icon className="mt-0.5 h-3.5 w-3.5 shrink-0 text-slate-400" />
      <div className="min-w-0">
        <p className="text-[9px] font-semibold uppercase tracking-wider text-slate-400">
          {label}
        </p>
        <p
          className="mt-0.5 truncate text-[12px] font-semibold text-slate-800 dark:text-neutral-100"
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
      rateLabel: "Enrollment",
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
      rateLabel: "Payment",
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
  onRestore?: (campaign: Campaign) => void;
}

export function CampaignCard({
  campaign,
  yards,
  onOpen,
  onEdit,
  onDelete,
  onRestore,
}: CampaignCardProps) {
  const showActions = Boolean(onEdit || onDelete || onRestore);
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
  const positiveWidth = outcome
    ? getSegmentPercent(outcome.positiveValue, totalActivities)
    : 0;
  const negativeWidth = outcome
    ? getSegmentPercent(outcome.negativeValue, totalActivities)
    : 0;
  const unclassifiedWidth = outcome
    ? getSegmentPercent(unclassifiedCount, totalActivities)
    : 0;

  return (
    <article
      role="button"
      tabIndex={0}
      onClick={() => onOpen(campaign)}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          onOpen(campaign);
        }
      }}
      className={cn(
        "group relative flex min-h-[350px] flex-col overflow-hidden rounded-2xl border border-slate-200/80 bg-white text-left shadow-[0_1px_3px_rgba(15,23,42,0.08)] transition-all duration-200",
        "hover:border-slate-300 hover:shadow-[0_10px_24px_rgba(15,23,42,0.10)]",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#008f68]/30 focus-visible:ring-offset-2",
        "dark:border-neutral-800 dark:bg-neutral-950",
      )}
    >
      <div className="h-1 bg-gradient-to-r from-[#008f68] via-emerald-400 to-transparent" />

      <div className="flex flex-1 flex-col p-3.5">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-slate-100 bg-slate-50 text-slate-500 shadow-sm dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-300">
            <Megaphone className="h-4 w-4" strokeWidth={2} />
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="inline-flex h-5 items-center rounded-full bg-slate-50 px-2 font-mono text-[9px] font-semibold text-slate-500 ring-1 ring-inset ring-slate-200/80 dark:bg-neutral-900 dark:text-neutral-400 dark:ring-neutral-700">
                #{campaign.id}
              </span>
              <span
                className={cn(
                  "inline-flex h-5 items-center gap-1 rounded-full border px-2 text-[9px] font-semibold",
                  getTypePillStyles(campaign.tipo),
                )}
              >
                <Tag className="h-2.5 w-2.5" />
                {CAMPAIGN_TYPE_LABELS[campaign.tipo]}
              </span>
              <StatusPill active={campaign.isActive} />
            </div>

            <h3
              className="mt-1.5 line-clamp-2 text-[15px] font-bold leading-tight text-slate-900 dark:text-neutral-50"
              title={campaign.nombre}
            >
              {campaign.nombre}
            </h3>
          </div>
        </div>

        <div className="mt-3 rounded-xl border border-slate-100 bg-slate-50/60 p-2.5 dark:border-neutral-800 dark:bg-neutral-900/70">
          <div className="grid grid-cols-2 gap-x-3 gap-y-2">
            <MetaItem
              icon={MapPin}
              label="Yard"
              value={yardLabel}
              className="col-span-2"
            />
            <MetaItem
              icon={Clock3}
              label="Duration"
              value={campaign.duracion || "-"}
            />
            <MetaItem
              icon={CalendarClock}
              label="Created"
              value={formatCampaignDate(campaign.createdAt)}
            />
          </div>
        </div>

        <div className="mt-3 grid grid-cols-3 gap-2">
          <StatTile
            icon={ActivitiesIcon}
            label="Activities"
            value={totalActivities}
            helper={`${classifiedCount} classified`}
            tone="brand"
          />
          <StatTile
            icon={BarChart3}
            label="Coverage"
            value={`${coverageRate}%`}
            helper={`${unclassifiedCount} open`}
            tone={coverageRate === 100 ? "success" : "warning"}
          />
          <StatTile
            icon={outcome?.PositiveIcon ?? BarChart3}
            label={outcome?.rateLabel ?? "Tracked"}
            value={outcome ? `${outcomeRate}%` : totalActivities}
            helper={outcome ? `${outcome.positiveValue} positive` : "General"}
            tone={outcomeRate > 0 ? "success" : "neutral"}
          />
        </div>

        {outcome ? (
          <div className="mt-3 rounded-xl border border-slate-100 bg-white p-2.5 dark:border-neutral-800 dark:bg-neutral-950">
            <div className="flex items-center justify-between gap-3">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                Classification
              </p>
              <p className="text-[11px] font-semibold text-slate-500 dark:text-neutral-400">
                {classifiedCount}/{totalActivities} covered
              </p>
            </div>

            <div className="mt-2 flex h-2 overflow-hidden rounded-full bg-slate-100 dark:bg-neutral-800">
              <div
                className="h-full shrink-0 bg-[#008f68]"
                style={{ width: `${positiveWidth}%` }}
              />
              <div
                className="h-full shrink-0 bg-red-500"
                style={{ width: `${negativeWidth}%` }}
              />
              <div
                className="h-full shrink-0 bg-amber-400"
                style={{ width: `${unclassifiedWidth}%` }}
              />
            </div>

            <div className="mt-2 grid grid-cols-3 gap-1.5">
              <MiniLegend
                color="bg-[#008f68]"
                label={outcome.positiveLabel}
                value={outcome.positiveValue}
              />
              <MiniLegend
                color="bg-red-500"
                label={outcome.negativeLabel}
                value={outcome.negativeValue}
              />
              <MiniLegend
                color="bg-amber-400"
                label="Unclassified"
                value={unclassifiedCount}
              />
            </div>
          </div>
        ) : (
          <div className="mt-3 rounded-xl border border-slate-100 bg-slate-50/70 p-2.5 text-[11px] font-medium leading-4 text-slate-500 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-400">
            General campaign activity is grouped by yard and line for operational
            reporting.
          </div>
        )}
      </div>

      <div
        className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 bg-slate-50/70 px-3.5 py-2.5 dark:border-neutral-800 dark:bg-neutral-900/70"
        onClick={(event) => event.stopPropagation()}
        onKeyDown={(event) => event.stopPropagation()}
      >
        <div className="flex min-w-0 flex-wrap items-center gap-1.5">
          {showReportLink ? (
            <Button
              asChild
              variant="secondary"
              size="sm"
              className="h-8 rounded-lg px-2.5 text-[11px] font-semibold"
            >
              <Link href={`/reports/campaigns?campaignId=${campaign.id}`}>
                <FileText className="h-3.5 w-3.5" />
                Report
              </Link>
            </Button>
          ) : null}
        </div>

        {showActions ? (
          <div className="flex items-center justify-end gap-0.5">
            {onEdit ? (
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                title="Edit campaign"
                aria-label="Edit campaign"
                onClick={() => onEdit(campaign)}
                className="h-8 w-8 rounded-lg text-slate-400 hover:bg-white hover:text-slate-700 dark:hover:bg-neutral-950 dark:hover:text-neutral-100"
              >
                <Pencil className="h-3.5 w-3.5" strokeWidth={2} />
              </Button>
            ) : null}
            {onDelete ? (
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                title="Archive campaign"
                aria-label="Archive campaign"
                onClick={() => onDelete(campaign)}
                className="h-8 w-8 rounded-lg text-slate-400 hover:bg-white hover:text-red-600 dark:hover:bg-neutral-950"
              >
                <Trash2 className="h-3.5 w-3.5" strokeWidth={2} />
              </Button>
            ) : null}
            {onRestore ? (
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                title="Restore campaign"
                aria-label="Restore campaign"
                onClick={() => onRestore(campaign)}
                className="h-8 w-8 rounded-lg text-slate-400 hover:bg-white hover:text-[#008f68] dark:hover:bg-neutral-950"
              >
                <RotateCcw className="h-3.5 w-3.5" strokeWidth={2} />
              </Button>
            ) : null}
          </div>
        ) : null}
      </div>
    </article>
  );
}

function MiniLegend({
  color,
  label,
  value,
}: {
  color: string;
  label: string;
  value: number;
}) {
  return (
    <div className="min-w-0 rounded-lg border border-slate-100 bg-slate-50 px-2 py-1.5 dark:border-neutral-800 dark:bg-neutral-900">
      <div className="flex min-w-0 items-center gap-1">
        <span className={cn("h-1.5 w-1.5 shrink-0 rounded-full", color)} />
        <p className="truncate text-[8px] font-semibold uppercase tracking-wide text-slate-500">
          {label}
        </p>
      </div>
      <p className="mt-0.5 text-sm font-bold leading-none text-slate-900 tabular-nums dark:text-neutral-50">
        {value}
      </p>
    </div>
  );
}
