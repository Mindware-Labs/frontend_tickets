"use client";

import { useState, useMemo, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useAircall } from "@/components/providers/AircallProvider";
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
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetClose,
} from "@/components/ui/sheet";
import { SlidersHorizontal, X } from "lucide-react";
import {
  CallStatus,
  CallDirection,
  type AgentOption,
  type CampaignOption,
  type YardOption,
} from "../../types";
import { formatEnumLabel } from "../../utils/call-helpers";
import type { Filters, FilterKey } from "../../hooks/useCallFilters";
import { useConfigurations } from "@/hooks/useConfigurations";

interface CallFiltersBarProps {
  filters: Filters;
  onFilterChange: (key: FilterKey, value: string) => void;
  agents: AgentOption[];
  campaigns: CampaignOption[];
  yards: YardOption[];
  phoneLines: { id: number; label: string | null; phoneNumber: string }[];
}

const CALL_STATUS_FILTER_OPTIONS = [
  { value: "all", label: "All" },
  { value: CallStatus.ACTIVE, label: "Active" },
  { value: CallStatus.PENDING_FOLLOWUP, label: "Follow-up" },
  { value: CallStatus.OVERDUE, label: "Overdue" },
  { value: CallStatus.COMPLETED, label: "Complete" },
] as const;

export function CallFiltersBar({
  filters,
  onFilterChange,
  agents,
  campaigns,
  yards,
  phoneLines,
}: CallFiltersBarProps) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<Filters>({ ...filters });
  const [campaignSearch, setCampaignSearch] = useState("");
  const [yardSearch, setYardSearch] = useState("");

  const { setSheetOpen } = useAircall();
  const { dispositions, getOptionsForCampaignType } = useConfigurations(true);

  // Sync draft when drawer opens
  useEffect(() => {
    if (open) setDraft({ ...filters });
  }, [open]); // eslint-disable-line react-hooks/exhaustive-deps

  // Notify AircallProvider so the FAB moves to the bottom edge
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

  const setDraftKey = (key: FilterKey, value: string) =>
    setDraft((prev) => ({ ...prev, [key]: value }));

  const handleApply = () => {
    (Object.keys(draft) as FilterKey[]).forEach((k) =>
      onFilterChange(k, draft[k]),
    );
    setOpen(false);
  };

  const handleClear = () => {
    const cleared = { ...draft };
    (Object.keys(cleared) as FilterKey[]).forEach((k) => {
      cleared[k] = "all";
    });
    setDraft(cleared);
  };

  const clearAll = () => {
    const keys: FilterKey[] = [
      "status",
      "direction",
      "disposition",
      "campaign",
      "campaignOption",
      "yard",
      "agent",
      "phoneLine",
    ];
    keys.forEach((k) => onFilterChange(k, "all"));
  };

  const filteredCampaigns = useMemo(() => {
    const term = campaignSearch.toLowerCase();
    return campaigns.filter((c) => c.nombre.toLowerCase().includes(term));
  }, [campaigns, campaignSearch]);

  const selectedCampaignTipo = useMemo(() => {
    if (draft.campaign === "all") return null;
    const found = campaigns.find((c) => c.id.toString() === draft.campaign);
    return found?.tipo ?? null;
  }, [draft.campaign, campaigns]);

  const availableCampaignOptions = useMemo(() => {
    if (!selectedCampaignTipo) return [];
    return getOptionsForCampaignType(selectedCampaignTipo);
  }, [selectedCampaignTipo, getOptionsForCampaignType]);

  const filteredYards = useMemo(() => {
    const term = yardSearch.toLowerCase();
    return yards.filter((y) => y.name.toLowerCase().includes(term));
  }, [yards, yardSearch]);

  const activeChips = useMemo(() => {
    const labelMap: Record<FilterKey, string> = {
      status: "Status",
      direction: "Direction",
      disposition: "Disposition",
      campaign: "Campaign",
      campaignOption: "Campaign Option",
      yard: "Yard",
      agent: "Agent",
      phoneLine: "Phone Line",
    };
    const chips: { key: FilterKey; label: string; value: string }[] = [];
    (Object.entries(filters) as [FilterKey, string][]).forEach(([key, val]) => {
      if (val === "all") return;
      let displayValue = val;
      if (key === "campaign") {
        const found = campaigns.find((c) => c.id.toString() === val);
        displayValue = found?.nombre ?? val;
      } else if (key === "yard") {
        const found = yards.find((y) => y.id.toString() === val);
        displayValue = found?.name ?? val;
      } else if (key === "agent") {
        const found = agents.find((a) => a.id.toString() === val);
        displayValue = found?.name ?? val;
      } else if (key === "phoneLine") {
        const found = phoneLines.find((l) => l.id.toString() === val);
        displayValue = found ? found.label || found.phoneNumber : val;
      } else {
        displayValue = formatEnumLabel(val);
      }
      chips.push({ key, label: labelMap[key], value: displayValue });
    });
    return chips;
  }, [filters, agents, campaigns, yards, phoneLines]);

  const FilterLabel = ({ children }: { children: React.ReactNode }) => (
    <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide">
      {children}
    </span>
  );

  return (
    <>
      {/* Trigger row + inline chips */}
      <div className="flex flex-wrap items-center gap-2">
        <Button
          variant={activeCount > 0 ? "secondary" : "outline"}
          size="sm"
          className="h-7.5 rounded-full px-3 text-[12.5px] font-medium border-border shadow-none"
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
                className="inline-flex items-center gap-1 h-7.5 rounded-full border border-border bg-slate-50 dark:bg-slate-800 px-3 text-[12.5px]"
              >
                <span className="font-normal text-muted-foreground">
                  {chip.label}:
                </span>
                <span className="font-medium text-slate-700 dark:text-slate-200">
                  {chip.value}
                </span>
              </span>
            ))}
            <button
              type="button"
              onClick={clearAll}
              className="cursor-pointer text-[12.5px] text-slate-500 underline-offset-4 transition-colors hover:text-slate-800 hover:underline dark:text-slate-400 dark:hover:text-slate-200"
            >
              Clear all
            </button>
          </>
        )}
      </div>

      {/* Right Side Drawer */}
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent
          side="right"
          hideClose
          className="flex flex-col w-full sm:w-100 p-0 gap-0"
        >
          {/* Header */}
          <SheetHeader className="flex flex-row items-center justify-between px-5 py-4 border-b shrink-0">
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

          {/* Scrollable body */}
          <div className="flex-1 overflow-y-auto px-5 py-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Status */}
              <div className="space-y-1.5 sm:col-span-2">
                <FilterLabel>Status</FilterLabel>
                <div className="grid grid-cols-3 gap-1.5 sm:grid-cols-5">
                  {CALL_STATUS_FILTER_OPTIONS.map((option) => {
                    const isActive = draft.status === option.value;
                    return (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() => setDraftKey("status", option.value)}
                        className={
                          isActive
                            ? "h-8 rounded-lg border border-[#008f68]/35 bg-[#e6f5f0] px-2 text-[10px] font-semibold leading-tight text-[#008f68] shadow-sm transition-colors"
                            : "h-8 rounded-lg border border-slate-200 bg-white px-2 text-[10px] font-semibold leading-tight text-slate-500 transition-colors hover:border-slate-300 hover:bg-slate-50"
                        }
                      >
                        {option.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Direction */}
              <div className="space-y-1.5">
                <FilterLabel>Direction</FilterLabel>
                <Select
                  value={draft.direction}
                  onValueChange={(v) => setDraftKey("direction", v)}
                >
                  <SelectTrigger className={filterSelectTriggerClassName}>
                    <SelectValue placeholder="All" />
                  </SelectTrigger>
                  <SelectContent className={filterSelectContentClassName}>
                    <SelectItem className={filterSelectItemClassName} value="all">All Directions</SelectItem>
                    {Object.values(CallDirection).map((value) => (
                      <SelectItem className={filterSelectItemClassName} key={value} value={value}>
                        {formatEnumLabel(value)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Disposition */}
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

              {/* Agent */}
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

              {/* Campaign */}
              <div className="space-y-1.5">
                <FilterLabel>Campaign</FilterLabel>
                <Select
                  value={draft.campaign}
                  onValueChange={(v) => {
                    setDraftKey("campaign", v);
                    const newCampaign = campaigns.find(
                      (c) => c.id.toString() === v,
                    );
                    const newTipo =
                      v === "all" ? null : (newCampaign?.tipo ?? null);
                    const newOptions = newTipo ? getOptionsForCampaignType(newTipo) : [];
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
                        placeholder="Search..."
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

              {/* Campaign Option */}
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

              {/* Yard */}
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
                        placeholder="Search..."
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

              {/* Phone Line */}
              <div className="space-y-1.5">
                <FilterLabel>Phone Line</FilterLabel>
                <Select
                  value={draft.phoneLine}
                  onValueChange={(v) => setDraftKey("phoneLine", v)}
                >
                  <SelectTrigger className={filterSelectTriggerClassName}>
                    <SelectValue placeholder="All" />
                  </SelectTrigger>
                  <SelectContent className={filterSelectContentClassName}>
                    <SelectItem className={filterSelectItemClassName} value="all">All Lines</SelectItem>
                    {phoneLines.map((l) => (
                      <SelectItem className={filterSelectItemClassName} key={l.id} value={l.id.toString()}>
                        {l.label || l.phoneNumber}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Sticky footer */}
          <div className="shrink-0 border-t px-5 py-3 flex items-center gap-2">
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
              className="ml-auto rounded-full text-[12.5px] font-medium px-5 bg-emerald-600 text-white hover:bg-emerald-700"
              onClick={handleApply}
            >
              Apply
              {draftActiveCount > 0 && (
                <Badge
                  variant="secondary"
                  className="ml-1.5 h-4 min-w-4 px-1 text-[10px] leading-none bg-background/20 text-background"
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
