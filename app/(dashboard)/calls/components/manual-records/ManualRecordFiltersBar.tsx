"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  filterSelectContentClassName,
  filterSelectItemClassName,
  filterSelectSearchInputClassName,
  filterSelectTriggerClassName,
} from "@/components/filters/filter-select-styles";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { useAircall } from "@/components/providers/AircallProvider";
import { SlidersHorizontal, X } from "lucide-react";
import {
  type AgentOption,
  type CampaignOption,
} from "../../types";
import { useConfigurations } from "@/hooks/useConfigurations";
import { TicketStatusToggle } from "../tickets/TicketStatusToggle";
import type {
  ManualRecordFilterKey,
  ManualRecordFilters,
} from "../../hooks/useManualRecordFilters";

interface ManualRecordFiltersBarProps {
  filters: ManualRecordFilters;
  onFilterChange: (key: ManualRecordFilterKey, value: string) => void;
  agents: AgentOption[];
  campaigns: CampaignOption[];
  yards: { id: number; name: string }[];
}

const formatLabel = (value: string) =>
  value
    .replace(/_/g, " ")
    .toLowerCase()
    .replace(/\b\w/g, (char) => char.toUpperCase());

export function ManualRecordFiltersBar({
  filters,
  onFilterChange,
  agents,
  campaigns,
  yards,
}: ManualRecordFiltersBarProps) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<ManualRecordFilters>({ ...filters });
  const [campaignSearch, setCampaignSearch] = useState("");
  const [yardSearch, setYardSearch] = useState("");
  const { setSheetOpen } = useAircall();
  const { dispositions, getOptionsForCampaignType } = useConfigurations(true);

  useEffect(() => {
    if (open) setDraft({ ...filters });
  }, [open, filters]);

  useEffect(() => {
    setSheetOpen(open);
  }, [open, setSheetOpen]);

  const activeCount = useMemo(
    () => Object.values(filters).filter((v) => v !== "all").length,
    [filters],
  );

  const draftActiveCount = useMemo(
    () => Object.values(draft).filter((v) => v !== "all").length,
    [draft],
  );

  const setDraftKey = (key: ManualRecordFilterKey, value: string) =>
    setDraft((prev) => ({ ...prev, [key]: value }));

  const handleApply = () => {
    (Object.keys(draft) as ManualRecordFilterKey[]).forEach((key) =>
      onFilterChange(key, draft[key]),
    );
    setOpen(false);
  };

  const handleClear = () => {
    const cleared = { ...draft };
    (Object.keys(cleared) as ManualRecordFilterKey[]).forEach((key) => {
      cleared[key] = "all";
    });
    setDraft(cleared);
  };

  const clearAll = () => {
    (Object.keys(filters) as ManualRecordFilterKey[]).forEach((key) =>
      onFilterChange(key, "all"),
    );
  };

  const filteredCampaigns = useMemo(() => {
    const term = campaignSearch.toLowerCase();
    return campaigns.filter((c) => c.nombre.toLowerCase().includes(term));
  }, [campaigns, campaignSearch]);

  const filteredYards = useMemo(() => {
    const term = yardSearch.toLowerCase();
    return yards.filter((y) => y.name.toLowerCase().includes(term));
  }, [yards, yardSearch]);

  const selectedCampaignTipo = useMemo(() => {
    if (draft.campaign === "all") return null;
    const found = campaigns.find((c) => c.id.toString() === draft.campaign);
    return found?.tipo ?? null;
  }, [draft.campaign, campaigns]);

  const availableCampaignOptions = useMemo(() => {
    if (!selectedCampaignTipo) return [];
    return getOptionsForCampaignType(selectedCampaignTipo);
  }, [selectedCampaignTipo, getOptionsForCampaignType]);

  const activeChips = useMemo(() => {
    const labelMap: Record<ManualRecordFilterKey, string> = {
      status: "Status",
      campaign: "Campaign",
      yard: "Yard",
      campaignOption: "Campaign Option",
      disposition: "Disposition",
      agent: "Agent",
    };
    const chips: { key: ManualRecordFilterKey; label: string; value: string }[] =
      [];

    (Object.entries(filters) as [ManualRecordFilterKey, string][]).forEach(
      ([key, value]) => {
        if (value === "all") return;
        let displayValue = value;
        if (key === "campaign") {
          const found = campaigns.find((c) => c.id.toString() === value);
          displayValue = found?.nombre ?? value;
        } else if (key === "yard") {
          const found = yards.find((y) => y.id.toString() === value);
          displayValue = found?.name ?? value;
        } else if (key === "agent") {
          const found = agents.find((a) => a.id.toString() === value);
          displayValue = found?.name ?? value;
        } else {
          displayValue = formatLabel(value);
        }
        chips.push({ key, label: labelMap[key], value: displayValue });
      },
    );
    return chips;
  }, [filters, campaigns, yards, agents]);

  const FilterLabel = ({ children }: { children: ReactNode }) => (
    <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide">
      {children}
    </span>
  );

  return (
    <>
      <div className="flex flex-wrap items-center gap-2">
        <Button
          variant={activeCount > 0 ? "secondary" : "outline"}
          size="sm"
          className="h-[30px] rounded-full border-border px-3 text-[12.5px] font-medium shadow-none"
          onClick={() => setOpen(true)}
        >
          <SlidersHorizontal className="mr-1.5 h-3.5 w-3.5" />
          Filters
          {activeCount > 0 && (
            <Badge
              variant="default"
              className="ml-1.5 h-4 min-w-4 px-1 text-[10px] leading-none"
            >
              {activeCount}
            </Badge>
          )}
        </Button>

        {activeCount > 0 && (
          <>
            <span className="h-4 w-px bg-border" aria-hidden />
            {activeChips.map((chip) => (
              <span
                key={chip.key}
                className="inline-flex h-[30px] items-center gap-1 rounded-full border border-border bg-slate-50 px-3 text-[12.5px] dark:bg-neutral-800"
              >
                <span className="font-normal text-muted-foreground">
                  {chip.label}:
                </span>
                <span className="font-medium text-slate-700 dark:text-neutral-200">
                  {chip.value}
                </span>
              </span>
            ))}
            <button
              type="button"
              onClick={clearAll}
              className="cursor-pointer text-[12.5px] text-slate-500 dark:text-neutral-400 underline-offset-4 transition-colors hover:text-slate-800 dark:hover:text-neutral-200 hover:underline"
            >
              Clear all
            </button>
          </>
        )}
      </div>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent
          side="right"
          hideClose
          className="flex w-full flex-col gap-0 p-0 sm:w-100"
        >
          <SheetHeader className="flex shrink-0 flex-row items-center justify-between border-b px-5 py-4">
            <SheetTitle className="text-sm font-semibold">Filters</SheetTitle>
            <SheetClose asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 rounded-full text-muted-foreground hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </Button>
            </SheetClose>
          </SheetHeader>

          <div className="flex-1 overflow-y-auto px-5 py-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-1.5 sm:col-span-2">
                <FilterLabel>Status</FilterLabel>
                <TicketStatusToggle
                  value={draft.status || "all"}
                  onChange={(value) => setDraftKey("status", value)}
                  includeAll
                />
              </div>

              <div className="space-y-1.5">
                <FilterLabel>Agent</FilterLabel>
                <Select
                  value={draft.agent}
                  onValueChange={(v) => setDraftKey("agent", v)}
                >
                  <SelectTrigger className={filterSelectTriggerClassName}>
                    <SelectValue placeholder="All" />
                  </SelectTrigger>
                  <SelectContent className={filterSelectContentClassName}>
                    <SelectItem className={filterSelectItemClassName} value="all">All Agents</SelectItem>
                    {agents.map((a) => (
                      <SelectItem className={filterSelectItemClassName} key={a.id} value={a.id.toString()}>
                        {a.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <FilterLabel>Yard</FilterLabel>
                <Select
                  value={draft.yard}
                  onValueChange={(v) => setDraftKey("yard", v)}
                >
                  <SelectTrigger className={filterSelectTriggerClassName}>
                    <SelectValue placeholder="All" />
                  </SelectTrigger>
                  <SelectContent className={filterSelectContentClassName}>
                    <div className="p-2">
                      <Input
                        placeholder="Search yard..."
                        value={yardSearch}
                        onChange={(e) => setYardSearch(e.target.value)}
                        onClick={(e) => e.stopPropagation()}
                        onKeyDown={(e) => e.stopPropagation()}
                        className={filterSelectSearchInputClassName}
                      />
                    </div>
                    <SelectItem className={filterSelectItemClassName} value="all">All Yards</SelectItem>
                    {filteredYards.map((y) => (
                      <SelectItem className={filterSelectItemClassName} key={y.id} value={y.id.toString()}>
                        {y.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <FilterLabel>Campaign</FilterLabel>
                <Select
                  value={draft.campaign}
                  onValueChange={(v) => {
                    const newCampaign = campaigns.find(
                      (c) => c.id.toString() === v,
                    );
                    const newTipo =
                      v === "all" ? null : (newCampaign?.tipo ?? null);
                    const newOptions = newTipo ? getOptionsForCampaignType(newTipo) : [];
                    setDraftKey("campaign", v);
                    if (!newOptions.some((o) => o.value === draft.campaignOption)) {
                      setDraftKey("campaignOption", "all");
                    }
                  }}
                >
                  <SelectTrigger className={filterSelectTriggerClassName}>
                    <SelectValue placeholder="All" />
                  </SelectTrigger>
                  <SelectContent className={filterSelectContentClassName}>
                    <div className="p-2">
                      <Input
                        placeholder="Search campaign..."
                        value={campaignSearch}
                        onChange={(e) => setCampaignSearch(e.target.value)}
                        onClick={(e) => e.stopPropagation()}
                        onKeyDown={(e) => e.stopPropagation()}
                        className={filterSelectSearchInputClassName}
                      />
                    </div>
                    <SelectItem className={filterSelectItemClassName} value="all">All Campaigns</SelectItem>
                    {filteredCampaigns.map((c) => (
                      <SelectItem className={filterSelectItemClassName} key={c.id} value={c.id.toString()}>
                        {c.nombre}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <FilterLabel>Campaign Option</FilterLabel>
                <Select
                  value={
                    draft.campaignOption !== "all" &&
                    !availableCampaignOptions.some((o) => o.value === draft.campaignOption)
                      ? "all"
                      : draft.campaignOption
                  }
                  onValueChange={(v) => setDraftKey("campaignOption", v)}
                >
                  <SelectTrigger className={filterSelectTriggerClassName}>
                    <SelectValue placeholder="All" />
                  </SelectTrigger>
                  <SelectContent className={filterSelectContentClassName}>
                    <SelectItem className={filterSelectItemClassName} value="all">All Options</SelectItem>
                    {availableCampaignOptions.map((opt) => (
                      <SelectItem className={filterSelectItemClassName} key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <FilterLabel>Disposition</FilterLabel>
                <Select
                  value={draft.disposition}
                  onValueChange={(v) => setDraftKey("disposition", v)}
                >
                  <SelectTrigger className={filterSelectTriggerClassName}>
                    <SelectValue placeholder="All" />
                  </SelectTrigger>
                  <SelectContent className={filterSelectContentClassName}>
                    <SelectItem className={filterSelectItemClassName} value="all">All Dispositions</SelectItem>
                    {dispositions.map((d) => (
                      <SelectItem className={filterSelectItemClassName} key={d.value} value={d.value}>
                        {d.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-2 border-t px-5 py-3">
            <Button
              variant="outline"
              size="sm"
              className="rounded-full text-[12.5px] font-medium"
              onClick={handleClear}
              disabled={draftActiveCount === 0}
            >
              Clear filters
            </Button>
            <Button
              size="sm"
              className="ml-auto rounded-full bg-emerald-600 px-5 text-[12.5px] font-medium text-white hover:bg-emerald-700"
              onClick={handleApply}
            >
              Apply
              {draftActiveCount > 0 && (
                <Badge
                  variant="secondary"
                  className="ml-1.5 h-4 min-w-4 bg-background/20 px-1 text-[10px] leading-none text-background"
                >
                  {draftActiveCount}
                </Badge>
              )}
            </Button>
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
