"use client";

import { useState, useMemo } from "react";
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
import { SlidersHorizontal, X } from "lucide-react";
import {
  CallStatus,
  CallDirection,
  CallDisposition,
  CampaignOptionEnum,
  OnboardingOption,
  ArOption,
  ManagementType,
  type AgentOption,
  type CampaignOption,
  type YardOption,
} from "../types";
import { formatEnumLabel } from "../utils/call-helpers";
import type { Filters, FilterKey } from "../hooks/useCallFilters";

interface CallFiltersBarProps {
  filters: Filters;
  onFilterChange: (key: FilterKey, value: string) => void;
  agents: AgentOption[];
  campaigns: CampaignOption[];
  yards: YardOption[];
  phoneLines: { id: number; label: string | null; phoneNumber: string }[];
}

export function CallFiltersBar({
  filters,
  onFilterChange,
  agents,
  campaigns,
  yards,
  phoneLines,
}: CallFiltersBarProps) {
  const [open, setOpen] = useState(false);
  const [campaignSearch, setCampaignSearch] = useState("");
  const [yardSearch, setYardSearch] = useState("");

  const activeCount = useMemo(() => {
    return Object.values(filters).filter((v) => v !== "all").length;
  }, [filters]);

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

  // Derive the selected campaign's type to scope the Campaign Option dropdown
  const selectedCampaignTipo = useMemo(() => {
    if (filters.campaign === "all") return null;
    const found = campaigns.find((c) => c.id.toString() === filters.campaign);
    return found?.tipo ?? null;
  }, [filters.campaign, campaigns]);

  const availableCampaignOptions: string[] = useMemo(() => {
    if (selectedCampaignTipo === ManagementType.ONBOARDING)
      return Object.values(OnboardingOption);
    if (selectedCampaignTipo === ManagementType.AR)
      return Object.values(ArOption);
    // No campaign selected or OTHER → show all
    return Object.values(CampaignOptionEnum);
  }, [selectedCampaignTipo]);

  const filteredYards = useMemo(() => {
    const term = yardSearch.toLowerCase();
    return yards.filter((y) => y.name.toLowerCase().includes(term));
  }, [yards, yardSearch]);

  return (
    <div className="space-y-2">
      {/* Toggle button */}
      <div className="flex items-center gap-2">
        <Button
          variant={open || activeCount > 0 ? "secondary" : "outline"}
          size="sm"
          className="h-8 text-xs"
          onClick={() => setOpen(!open)}
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
          <Button
            variant="ghost"
            size="sm"
            className="h-8 text-xs text-muted-foreground"
            onClick={clearAll}
          >
            <X className="mr-1 h-3 w-3" />
            Clear all
          </Button>
        )}
      </div>

      {/* Filter dropdowns row */}
      {open && (
        <div className="flex flex-wrap items-end gap-3 rounded-lg border bg-muted/30 p-3">
          {/* Status */}
          <div className="min-w-35 space-y-1">
            <span className="text-[11px] font-medium text-muted-foreground">
              Status
            </span>
            <Select
              value={filters.status}
              onValueChange={(v) => onFilterChange("status", v)}
            >
              <SelectTrigger className="h-8 text-xs">
                <SelectValue placeholder="All" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                {Object.values(CallStatus).map((value) => (
                  <SelectItem key={value} value={value}>
                    {formatEnumLabel(value)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Direction */}
          <div className="min-w-35 space-y-1">
            <span className="text-[11px] font-medium text-muted-foreground">
              Direction
            </span>
            <Select
              value={filters.direction}
              onValueChange={(v) => onFilterChange("direction", v)}
            >
              <SelectTrigger className="h-8 text-xs">
                <SelectValue placeholder="All" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Directions</SelectItem>
                {Object.values(CallDirection).map((value) => (
                  <SelectItem key={value} value={value}>
                    {formatEnumLabel(value)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Disposition */}
          <div className="min-w-38 space-y-1">
            <span className="text-[11px] font-medium text-muted-foreground">
              Disposition
            </span>
            <Select
              value={filters.disposition}
              onValueChange={(v) => onFilterChange("disposition", v)}
            >
              <SelectTrigger className="h-8 text-xs">
                <SelectValue placeholder="All" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Dispositions</SelectItem>
                {Object.values(CallDisposition).map((value) => (
                  <SelectItem key={value} value={value}>
                    {formatEnumLabel(value)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Agent */}
          <div className="min-w-38 space-y-1">
            <span className="text-[11px] font-medium text-muted-foreground">
              Agent
            </span>
            <Select
              value={filters.agent}
              onValueChange={(v) => onFilterChange("agent", v)}
            >
              <SelectTrigger className="h-8 text-xs">
                <SelectValue placeholder="All" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Agents</SelectItem>
                {agents.map((a) => (
                  <SelectItem key={a.id} value={a.id.toString()}>
                    {a.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Campaign */}
          <div className="min-w-40 space-y-1">
            <span className="text-[11px] font-medium text-muted-foreground">
              Campaign
            </span>
            <Select
              value={filters.campaign}
              onValueChange={(v) => {
                onFilterChange("campaign", v);
                // Reset campaign option when campaign changes
                if (filters.campaignOption !== "all") {
                  const newCampaign = campaigns.find(
                    (c) => c.id.toString() === v,
                  );
                  const newTipo =
                    v === "all" ? null : (newCampaign?.tipo ?? null);
                  const newOptions: string[] =
                    newTipo === ManagementType.ONBOARDING
                      ? Object.values(OnboardingOption)
                      : newTipo === ManagementType.AR
                        ? Object.values(ArOption)
                        : Object.values(CampaignOptionEnum);
                  if (!newOptions.includes(filters.campaignOption)) {
                    onFilterChange("campaignOption", "all");
                  }
                }
              }}
            >
              <SelectTrigger className="h-8 text-xs">
                <SelectValue placeholder="All" />
              </SelectTrigger>
              <SelectContent>
                <div className="p-2">
                  <Input
                    placeholder="Search..."
                    value={campaignSearch}
                    onChange={(e) => setCampaignSearch(e.target.value)}
                    onClick={(e) => e.stopPropagation()}
                    onKeyDown={(e) => e.stopPropagation()}
                    className="h-7 text-xs"
                  />
                </div>
                <SelectItem value="all">All Campaigns</SelectItem>
                {filteredCampaigns.map((c) => (
                  <SelectItem key={c.id} value={c.id.toString()}>
                    {c.nombre}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Campaign Option */}
          <div className="min-w-40 space-y-1">
            <span className="text-[11px] font-medium text-muted-foreground">
              Campaign Option
            </span>
            <Select
              value={
                filters.campaignOption !== "all" &&
                !availableCampaignOptions.includes(filters.campaignOption)
                  ? "all"
                  : filters.campaignOption
              }
              onValueChange={(v) => onFilterChange("campaignOption", v)}
            >
              <SelectTrigger className="h-8 text-xs">
                <SelectValue placeholder="All" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Options</SelectItem>
                {availableCampaignOptions.map((value) => (
                  <SelectItem key={value} value={value}>
                    {formatEnumLabel(value)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Yard */}
          <div className="min-w-40 space-y-1">
            <span className="text-[11px] font-medium text-muted-foreground">
              Yard
            </span>
            <Select
              value={filters.yard}
              onValueChange={(v) => onFilterChange("yard", v)}
            >
              <SelectTrigger className="h-8 text-xs">
                <SelectValue placeholder="All" />
              </SelectTrigger>
              <SelectContent>
                <div className="p-2">
                  <Input
                    placeholder="Search..."
                    value={yardSearch}
                    onChange={(e) => setYardSearch(e.target.value)}
                    onClick={(e) => e.stopPropagation()}
                    onKeyDown={(e) => e.stopPropagation()}
                    className="h-7 text-xs"
                  />
                </div>
                <SelectItem value="all">All Yards</SelectItem>
                {filteredYards.map((y) => (
                  <SelectItem key={y.id} value={y.id.toString()}>
                    {y.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Phone Line */}
          <div className="min-w-38 space-y-1">
            <span className="text-[11px] font-medium text-muted-foreground">
              Phone Line
            </span>
            <Select
              value={filters.phoneLine}
              onValueChange={(v) => onFilterChange("phoneLine", v)}
            >
              <SelectTrigger className="h-8 text-xs">
                <SelectValue placeholder="All" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Lines</SelectItem>
                {phoneLines.map((l) => (
                  <SelectItem key={l.id} value={l.id.toString()}>
                    {l.label || l.phoneNumber}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      )}
    </div>
  );
}
