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
  Sheet,
  SheetClose,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { useAircall } from "@/components/providers/AircallProvider";
import { SlidersHorizontal, X } from "lucide-react";
import {
  ArOption,
  CampaignOptionEnum,
  ManagementType,
  OnboardingOption,
  SupportTicketPriority,
  SupportTicketType,
  type AgentOption,
  type CampaignOption,
  type YardOption,
} from "../../types";
import { TicketStatusToggle } from "./TicketStatusToggle";
import type {
  TicketFilterKey,
  TicketFilters,
} from "../../hooks/useTicketFilters";

interface TicketFiltersBarProps {
  filters: TicketFilters;
  onFilterChange: (key: TicketFilterKey, value: string) => void;
  agents: AgentOption[];
  campaigns: CampaignOption[];
  yards: YardOption[];
  phoneLines: { id: number; label: string | null; phoneNumber: string }[];
}

const formatLabel = (value: string) =>
  value
    .replace(/_/g, " ")
    .toLowerCase()
    .replace(/\b\w/g, (char) => char.toUpperCase());

export function TicketFiltersBar({
  filters,
  onFilterChange,
  agents,
  campaigns,
  yards,
  phoneLines,
}: TicketFiltersBarProps) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<TicketFilters>({ ...filters });
  const [campaignSearch, setCampaignSearch] = useState("");
  const [yardSearch, setYardSearch] = useState("");

  const { setSheetOpen } = useAircall();

  useEffect(() => {
    if (open) setDraft({ ...filters });
  }, [open, filters]);

  useEffect(() => {
    setSheetOpen(open);
  }, [open, setSheetOpen]);

  const activeCount = useMemo(
    () => Object.values(filters).filter((value) => value !== "all").length,
    [filters],
  );

  const draftActiveCount = useMemo(
    () => Object.values(draft).filter((value) => value !== "all").length,
    [draft],
  );

  const setDraftKey = (key: TicketFilterKey, value: string) =>
    setDraft((prev) => ({ ...prev, [key]: value }));

  const handleApply = () => {
    (Object.keys(draft) as TicketFilterKey[]).forEach((key) =>
      onFilterChange(key, draft[key]),
    );
    setOpen(false);
  };

  const handleClear = () => {
    const cleared = { ...draft };
    (Object.keys(cleared) as TicketFilterKey[]).forEach((key) => {
      cleared[key] = "all";
    });
    setDraft(cleared);
  };

  const clearAll = () => {
    (Object.keys(filters) as TicketFilterKey[]).forEach((key) =>
      onFilterChange(key, "all"),
    );
  };

  const filteredCampaigns = useMemo(() => {
    const term = campaignSearch.toLowerCase();
    return campaigns.filter((campaign) =>
      campaign.nombre.toLowerCase().includes(term),
    );
  }, [campaigns, campaignSearch]);

  const filteredYards = useMemo(() => {
    const term = yardSearch.toLowerCase();
    return yards.filter((yard) => yard.name.toLowerCase().includes(term));
  }, [yards, yardSearch]);

  const selectedCampaignTipo = useMemo(() => {
    if (draft.campaign === "all") return null;
    const found = campaigns.find(
      (campaign) => campaign.id.toString() === draft.campaign,
    );
    return found?.tipo ?? null;
  }, [draft.campaign, campaigns]);

  const availableCampaignOptions: string[] = useMemo(() => {
    if (selectedCampaignTipo === ManagementType.ONBOARDING)
      return Object.values(OnboardingOption);
    if (selectedCampaignTipo === ManagementType.AR)
      return Object.values(ArOption);
    return Object.values(CampaignOptionEnum);
  }, [selectedCampaignTipo]);

  const activeChips = useMemo(() => {
    const labelMap: Record<TicketFilterKey, string> = {
      status: "Status",
      priority: "Priority",
      ticketType: "Type",
      campaign: "Campaign",
      campaignOption: "Campaign Option",
      yard: "Yard",
      agent: "Agent",
      phoneLine: "Phone Line",
    };
    const chips: { key: TicketFilterKey; label: string; value: string }[] = [];

    (Object.entries(filters) as [TicketFilterKey, string][]).forEach(
      ([key, value]) => {
        if (value === "all") return;

        let displayValue = value;
        if (key === "campaign") {
          const found = campaigns.find(
            (campaign) => campaign.id.toString() === value,
          );
          displayValue = found?.nombre ?? value;
        } else if (key === "yard") {
          const found = yards.find((yard) => yard.id.toString() === value);
          displayValue = found?.name ?? value;
        } else if (key === "agent") {
          const found = agents.find((agent) => agent.id.toString() === value);
          displayValue = found?.name ?? value;
        } else if (key === "phoneLine") {
          const found = phoneLines.find(
            (line) => line.id.toString() === value,
          );
          displayValue = found ? found.label || found.phoneNumber : value;
        } else {
          displayValue = formatLabel(value);
        }

        chips.push({ key, label: labelMap[key], value: displayValue });
      },
    );

    return chips;
  }, [filters, agents, campaigns, yards, phoneLines]);

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
          className="h-[30px] rounded-full px-3 text-[12.5px] font-medium border-border shadow-none"
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
                className="inline-flex h-[30px] items-center gap-1 rounded-full border border-border bg-slate-50 px-3 text-[12.5px] dark:bg-slate-800"
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

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent
          side="right"
          hideClose
          className="flex flex-col w-full sm:w-100 p-0 gap-0"
        >
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

          <div className="flex-1 overflow-y-auto px-5 py-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5 sm:col-span-2">
                <FilterLabel>Status</FilterLabel>
                <TicketStatusToggle
                  value={draft.status || "all"}
                  onChange={(value) => setDraftKey("status", value)}
                  includeAll
                />
              </div>

              <div className="space-y-1.5">
                <FilterLabel>Priority</FilterLabel>
                <Select
                  value={draft.priority}
                  onValueChange={(value) => setDraftKey("priority", value)}
                >
                  <SelectTrigger className="border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-100 focus:border-blue-500 text-sm p-2.5 h-auto">
                    <SelectValue placeholder="All" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Priority</SelectItem>
                    {Object.values(SupportTicketPriority).map((priority) => (
                      <SelectItem key={priority} value={priority}>
                        {formatLabel(priority)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <FilterLabel>Ticket Type</FilterLabel>
                <Select
                  value={draft.ticketType}
                  onValueChange={(value) => setDraftKey("ticketType", value)}
                >
                  <SelectTrigger className="border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-100 focus:border-blue-500 text-sm p-2.5 h-auto">
                    <SelectValue placeholder="All" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    {Object.values(SupportTicketType).map((type) => (
                      <SelectItem key={type} value={type}>
                        {formatLabel(type)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <FilterLabel>Agent</FilterLabel>
                <Select
                  value={draft.agent}
                  onValueChange={(value) => setDraftKey("agent", value)}
                >
                  <SelectTrigger className="border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-100 focus:border-blue-500 text-sm p-2.5 h-auto">
                    <SelectValue placeholder="All" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Agents</SelectItem>
                    {agents.map((agent) => (
                      <SelectItem key={agent.id} value={agent.id.toString()}>
                        {agent.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <FilterLabel>Campaign</FilterLabel>
                <Select
                  value={draft.campaign}
                  onValueChange={(value) => {
                    setDraftKey("campaign", value);
                    const newCampaign = campaigns.find(
                      (campaign) => campaign.id.toString() === value,
                    );
                    const newTipo =
                      value === "all" ? null : (newCampaign?.tipo ?? null);
                    const newOptions: string[] =
                      newTipo === ManagementType.ONBOARDING
                        ? Object.values(OnboardingOption)
                        : newTipo === ManagementType.AR
                          ? Object.values(ArOption)
                          : Object.values(CampaignOptionEnum);
                    if (!newOptions.includes(draft.campaignOption)) {
                      setDraftKey("campaignOption", "all");
                    }
                  }}
                >
                  <SelectTrigger className="border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-100 focus:border-blue-500 text-sm p-2.5 h-auto">
                    <SelectValue placeholder="All" />
                  </SelectTrigger>
                  <SelectContent>
                    <div className="p-2">
                      <Input
                        placeholder="Search..."
                        value={campaignSearch}
                        onChange={(event) =>
                          setCampaignSearch(event.target.value)
                        }
                        onClick={(event) => event.stopPropagation()}
                        onKeyDown={(event) => event.stopPropagation()}
                        className="h-7 text-xs"
                      />
                    </div>
                    <SelectItem value="all">All Campaigns</SelectItem>
                    {filteredCampaigns.map((campaign) => (
                      <SelectItem
                        key={campaign.id}
                        value={campaign.id.toString()}
                      >
                        {campaign.nombre}
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
                    !availableCampaignOptions.includes(draft.campaignOption)
                      ? "all"
                      : draft.campaignOption
                  }
                  onValueChange={(value) =>
                    setDraftKey("campaignOption", value)
                  }
                >
                  <SelectTrigger className="border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-100 focus:border-blue-500 text-sm p-2.5 h-auto">
                    <SelectValue placeholder="All" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Options</SelectItem>
                    {availableCampaignOptions.map((option) => (
                      <SelectItem key={option} value={option}>
                        {formatLabel(option)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <FilterLabel>Yard</FilterLabel>
                <Select
                  value={draft.yard}
                  onValueChange={(value) => setDraftKey("yard", value)}
                >
                  <SelectTrigger className="border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-100 focus:border-blue-500 text-sm p-2.5 h-auto">
                    <SelectValue placeholder="All" />
                  </SelectTrigger>
                  <SelectContent>
                    <div className="p-2">
                      <Input
                        placeholder="Search..."
                        value={yardSearch}
                        onChange={(event) => setYardSearch(event.target.value)}
                        onClick={(event) => event.stopPropagation()}
                        onKeyDown={(event) => event.stopPropagation()}
                        className="h-7 text-xs"
                      />
                    </div>
                    <SelectItem value="all">All Yards</SelectItem>
                    {filteredYards.map((yard) => (
                      <SelectItem key={yard.id} value={yard.id.toString()}>
                        {yard.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <FilterLabel>Phone Line</FilterLabel>
                <Select
                  value={draft.phoneLine}
                  onValueChange={(value) => setDraftKey("phoneLine", value)}
                >
                  <SelectTrigger className="border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-100 focus:border-blue-500 text-sm p-2.5 h-auto">
                    <SelectValue placeholder="All" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Lines</SelectItem>
                    {phoneLines.map((line) => (
                      <SelectItem key={line.id} value={line.id.toString()}>
                        {line.label || line.phoneNumber}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

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
