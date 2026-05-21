"use client";

import { Loader2, Megaphone, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Campaign, YardSummary } from "../types";
import { CampaignCard } from "./CampaignCard";

interface CampaignsGridProps {
  loading: boolean;
  campaigns: Campaign[];
  yards: YardSummary[];
  totalFiltered: number;
  search: string;
  canManage?: boolean;
  onCreate: () => void;
  onOpen: (campaign: Campaign) => void;
  onEdit?: (campaign: Campaign) => void;
  onDelete?: (campaign: Campaign) => void;
}

export function CampaignsGrid({
  loading,
  campaigns,
  yards,
  totalFiltered,
  search,
  canManage = true,
  onCreate,
  onOpen,
  onEdit,
  onDelete,
}: CampaignsGridProps) {
  if (loading) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-3 py-16 text-slate-500">
        <Loader2 className="h-8 w-8 animate-spin text-[#008f68]" />
        <p className="text-sm font-medium">Loading campaigns...</p>
      </div>
    );
  }

  if (totalFiltered === 0) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-white px-6 py-16 text-center dark:border-slate-800 dark:bg-slate-950">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-[#008f68]/15 bg-[#f0faf5] text-[#008f68]">
          <Megaphone className="h-6 w-6" strokeWidth={1.75} />
        </div>
        <h3 className="mt-4 text-[17px] font-bold text-slate-900 dark:text-slate-50">
          No campaigns found
        </h3>
        <p className="mt-1 max-w-sm text-[13px] text-slate-500">
          {search
            ? "Try a different search or clear your filters."
            : "Create your first campaign to start tracking tickets."}
        </p>
        {!search && canManage !== false ? (
          <Button
            type="button"
            onClick={onCreate}
            className="mt-5 h-9 rounded-full bg-[#008f68] px-5 text-[13px] font-semibold text-white hover:bg-[#007a5a]"
          >
            <Plus className="mr-1.5 h-4 w-4" />
            New campaign
          </Button>
        ) : null}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
      {campaigns.map((campaign) => (
        <CampaignCard
          key={campaign.id}
          campaign={campaign}
          yards={yards}
          onOpen={onOpen}
          onEdit={onEdit}
          onDelete={onDelete}
        />
      ))}
    </div>
  );
}
