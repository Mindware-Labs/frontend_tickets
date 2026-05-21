"use client";

import {
  Ban,
  BarChart3,
  CheckCircle2,
  DollarSign,
  MapPin,
  Pencil,
  Tag,
  Trash2,
  XCircle,
} from "lucide-react";
import { ActivitiesIcon } from "@/components/icons/activities-icon";
import { ManagementType } from "../../calls/types";
import { cn } from "@/lib/utils";
import type { Campaign, YardSummary } from "../types";
import {
  CAMPAIGN_TYPE_LABELS,
  formatCampaignDate,
  getTypePillStyles,
  getYardLabel,
} from "../utils";
import { CampaignMark } from "./CampaignMark";

function StatusPill({ active }: { active: boolean }) {
  return active ? (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-[#bbf7d0] bg-[#dcfce7] px-2.5 py-[3px] text-[11px] font-semibold text-[#15803d]">
      <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-500" />
      Active
    </span>
  ) : (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-slate-100 px-2.5 py-[3px] text-[11px] font-semibold text-slate-600">
      <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-slate-400" />
      Inactive
    </span>
  );
}

function MetricChip({
  label,
  value,
  tone = "neutral",
}: {
  label: string;
  value: number;
  tone?: "success" | "danger" | "neutral";
}) {
  const toneClass =
    tone === "success"
      ? "border-emerald-200/80 bg-emerald-50/80 text-emerald-800"
      : tone === "danger"
        ? "border-red-200/80 bg-red-50/80 text-red-800"
        : "border-slate-200/80 bg-white text-slate-700";

  return (
    <div className={cn("rounded-lg border px-2.5 py-2", toneClass)}>
      <p className="text-[9px] font-bold uppercase tracking-[0.1em] opacity-70">
        {label}
      </p>
      <p className="mt-0.5 text-[15px] font-bold leading-none">{value}</p>
    </div>
  );
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
  const yardLabel = getYardLabel(campaign, yards);

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
        "group relative flex flex-col overflow-hidden rounded-2xl border bg-white text-left shadow-sm transition-all duration-200",
        "border-slate-200/80 hover:border-[#008f68]/35 hover:shadow-[0_12px_32px_rgba(0,111,80,0.12)]",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#008f68]/40 focus-visible:ring-offset-2",
        "dark:border-slate-800 dark:bg-slate-950",
      )}
    >
      <div
        className={cn(
          "absolute inset-x-0 top-0 h-1",
          campaign.isActive
            ? "bg-gradient-to-r from-[#008f68] via-[#00a67a] to-[#007a5a]"
            : "bg-gradient-to-r from-slate-300 via-slate-400 to-slate-500",
        )}
      />

      <div className="flex flex-1 flex-col p-4 pt-5">
        <div className="flex items-start gap-3">
          <CampaignMark className="h-12 w-12" iconClassName="h-5 w-5" />

          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="rounded-md bg-slate-100 px-1.5 py-0.5 font-mono text-[10px] font-semibold text-slate-500">
                #{campaign.id}
              </span>
              <span
                className={cn(
                  "inline-flex items-center gap-1 rounded-full border px-2 py-[2px] text-[10px] font-semibold",
                  getTypePillStyles(campaign.tipo),
                )}
              >
                <Tag className="h-3 w-3" />
                {CAMPAIGN_TYPE_LABELS[campaign.tipo]}
              </span>
            </div>

            <h3
              className="mt-1.5 truncate text-[16px] font-bold leading-tight text-slate-900 dark:text-slate-50"
              title={campaign.nombre}
            >
              {campaign.nombre}
            </h3>

            <div className="mt-2 flex flex-wrap items-center gap-2">
              <StatusPill active={campaign.isActive} />
              <span className="text-[11px] text-slate-400">
                {formatCampaignDate(campaign.createdAt)}
              </span>
            </div>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-3 gap-2 rounded-xl border border-slate-200/70 bg-slate-50/80 p-2.5 dark:border-slate-800 dark:bg-slate-900/50">
          <div className="col-span-1 flex flex-col justify-center border-r border-slate-200/70 pr-2 dark:border-slate-800">
            <p className="flex items-center gap-1 text-[9px] font-bold uppercase tracking-[0.1em] text-slate-400">
              <ActivitiesIcon className="h-3 w-3" />
              Activities
            </p>
            <p className="mt-1 text-[22px] font-bold leading-none text-[#008f68]">
              {campaign.ticketCount ?? 0}
            </p>
          </div>

          <div className="col-span-2 grid grid-cols-2 gap-1.5">
            {campaign.tipo === ManagementType.ONBOARDING ? (
              <>
                <MetricChip
                  label="Registered"
                  value={campaign.registeredCount ?? 0}
                  tone="success"
                />
                <MetricChip
                  label="Not reg."
                  value={campaign.notRegisteredCount ?? 0}
                  tone="danger"
                />
              </>
            ) : campaign.tipo === ManagementType.AR ? (
              <>
                <MetricChip
                  label="Paid"
                  value={campaign.paidCount ?? 0}
                  tone="success"
                />
                <MetricChip
                  label="Not paid"
                  value={campaign.notPaidCount ?? 0}
                  tone="danger"
                />
              </>
            ) : (
              <div className="col-span-2 flex items-center gap-2 rounded-lg border border-slate-200/80 bg-white px-2.5 py-2">
                <BarChart3 className="h-4 w-4 text-slate-400" />
                <div className="min-w-0">
                  <p className="text-[9px] font-bold uppercase tracking-[0.1em] text-slate-400">
                    Duration
                  </p>
                  <p className="truncate text-[13px] font-semibold text-slate-700">
                    {campaign.duracion || "—"}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="mt-3 flex items-center gap-2 rounded-xl border border-slate-200/70 bg-white px-3 py-2.5 shadow-sm dark:border-slate-800 dark:bg-slate-950">
          <MapPin className="h-3.5 w-3.5 shrink-0 text-orange-600" strokeWidth={2} />
          <div className="min-w-0 flex-1">
            <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-slate-400">
              Yard
            </p>
            <p className="truncate text-[12px] font-medium text-slate-700 dark:text-slate-200" title={yardLabel}>
              {yardLabel}
            </p>
          </div>
        </div>
      </div>

      {showActions ? (
        <div
          className="flex items-center justify-end gap-1 border-t border-slate-100 bg-slate-50/60 px-3 py-2.5 dark:border-slate-800 dark:bg-slate-900/40"
          onClick={(e) => e.stopPropagation()}
          onKeyDown={(e) => e.stopPropagation()}
        >
          {onEdit ? (
            <button
              type="button"
              title="Edit campaign"
              aria-label="Edit campaign"
              onClick={() => onEdit(campaign)}
              className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-amber-50 hover:text-amber-600"
            >
              <Pencil className="h-4 w-4" strokeWidth={2} />
            </button>
          ) : null}
          {onDelete ? (
            <button
              type="button"
              title="Delete campaign"
              aria-label="Delete campaign"
              onClick={() => onDelete(campaign)}
              className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-red-50 hover:text-red-600"
            >
              <Trash2 className="h-4 w-4" strokeWidth={2} />
            </button>
          ) : null}
        </div>
      ) : null}
    </article>
  );
}
