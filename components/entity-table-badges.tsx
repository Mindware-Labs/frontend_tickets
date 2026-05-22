"use client";

import { MapPin } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const emptyCell = (
  <span className="text-[11px] text-slate-400">—</span>
);

export interface TableBadgeItem {
  id?: number | string;
  name: string;
}

export function TableYardBadge({
  name,
  className,
  compact = false,
}: {
  name?: string | null;
  className?: string;
  compact?: boolean;
}) {
  const label = name?.trim();
  if (!label) return emptyCell;

  return (
    <Badge
      variant="outline"
      className={cn(
        compact
          ? "inline-flex h-auto w-fit max-w-full items-center shadow-none"
          : "inline-flex h-auto max-w-full items-center shadow-none",
        compact
          ? "gap-0.5 rounded-full border-slate-200 px-1.5 py-0.5 text-[10.5px] font-medium leading-tight"
          : "gap-1.5 rounded-full border-slate-200 px-2.5 py-1 text-[12px] font-semibold leading-snug",
        className,
      )}
      title={label}
    >
      <MapPin
        className={cn(
          "shrink-0 text-slate-500",
          compact ? "h-3 w-3" : "h-3.5 w-3.5",
        )}
      />
      <span className={cn("min-w-0", compact ? "truncate" : "break-words")}>
        {label}
      </span>
    </Badge>
  );
}

export function TableYardBadges({
  yards,
  max = 2,
  compact = false,
}: {
  yards: TableBadgeItem[];
  max?: number;
  compact?: boolean;
}) {
  if (yards.length === 0) return emptyCell;

  return (
    <div
      className="flex min-w-0 flex-wrap gap-1"
      title={yards.map((yard) => yard.name).join(", ")}
    >
      {yards.slice(0, max).map((yard) => (
        <TableYardBadge
          key={yard.id ?? yard.name}
          name={yard.name}
          compact={compact}
        />
      ))}
      {yards.length > max ? (
        <Badge
          variant="outline"
          className="rounded-full px-1.5 py-0 text-[10px]"
        >
          +{yards.length - max}
        </Badge>
      ) : null}
    </div>
  );
}

export function TableCampaignBadge({
  name,
  className,
  compact = false,
}: {
  name?: string | null;
  className?: string;
  compact?: boolean;
}) {
  const label = name?.trim();
  if (!label) return emptyCell;

  return (
    <Badge
      variant="secondary"
      className={cn(
        compact
          ? "inline-flex h-auto w-fit max-w-full shadow-none hover:bg-[#e2fae9]"
          : "inline-flex h-auto max-w-full shadow-none hover:bg-[#e2fae9]",
        compact
          ? "rounded-full bg-[#e2fae9] px-1.5 py-0.5 text-[10.5px] font-medium leading-tight text-[#006d50]"
          : "rounded-full bg-[#e2fae9] px-2.5 py-1 text-[12px] font-semibold leading-snug text-[#006d50]",
        className,
      )}
      title={label}
    >
      <span className={cn("min-w-0", compact ? "truncate" : "break-words")}>
        {label}
      </span>
    </Badge>
  );
}

export function TableCampaignBadges({
  campaigns,
  max = 2,
  compact = false,
}: {
  campaigns: TableBadgeItem[];
  max?: number;
  compact?: boolean;
}) {
  if (campaigns.length === 0) return emptyCell;

  return (
    <div className="flex min-w-0 flex-wrap gap-1">
      {campaigns.slice(0, max).map((campaign) => (
        <TableCampaignBadge
          key={campaign.id ?? campaign.name}
          name={campaign.name}
          compact={compact}
        />
      ))}
      {campaigns.length > max ? (
        <Badge
          variant="outline"
          className="rounded-full px-1.5 py-0 text-[10px]"
        >
          +{campaigns.length - max}
        </Badge>
      ) : null}
    </div>
  );
}
