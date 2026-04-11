"use client";

import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  RefreshCw,
  Plus,
  User,
  Hash,
  Star,
  AlertTriangle,
  SlidersHorizontal,
} from "lucide-react";
import {
  TicketStatus,
  TicketDisposition,
  type AgentOption,
  type CampaignOption,
  type YardOption,
} from "../types";
import { formatEnumLabel } from "../utils/ticket-helpers";
import type { Filters, FilterKey } from "../hooks/useTicketFilters";

interface TicketsSidebarProps {
  activeView: string;
  onViewChange: (view: string) => void;
  isLoading: boolean;
  getViewCount: (view: string) => number;
  hasHighPriorityOpen: boolean;
  filters: Filters;
  onFilterChange: (key: FilterKey, value: string) => void;
  agents: AgentOption[];
  campaigns: CampaignOption[];
  yards: YardOption[];
  phoneLines: { id: number; label: string | null; phoneNumber: string }[];
  onCreateTicket: () => void;
}

export function TicketsSidebar({
  activeView,
  onViewChange,
  isLoading,
  getViewCount,
  hasHighPriorityOpen,
  filters,
  onFilterChange,
  agents,
  campaigns,
  yards,
  phoneLines,
  onCreateTicket,
}: TicketsSidebarProps) {
  const [campaignSearch, setCampaignSearch] = useState("");
  const [yardSearch, setYardSearch] = useState("");
  const [agentSearch, setAgentSearch] = useState("");
  const [phoneLineSearch, setPhoneLineSearch] = useState("");

  const filteredCampaigns = useMemo(() => {
    const term = campaignSearch.toLowerCase();
    return campaigns.filter((c) => c.nombre.toLowerCase().includes(term));
  }, [campaigns, campaignSearch]);

  const filteredYards = useMemo(() => {
    const term = yardSearch.toLowerCase();
    return yards.filter((y) => y.name.toLowerCase().includes(term));
  }, [yards, yardSearch]);

  const filteredAgents = useMemo(() => {
    const term = agentSearch.toLowerCase();
    return agents.filter(
      (a) =>
        a.name.toLowerCase().includes(term) ||
        (a.email || "").toLowerCase().includes(term),
    );
  }, [agents, agentSearch]);

  const filteredPhoneLines = useMemo(() => {
    const term = phoneLineSearch.toLowerCase();
    return phoneLines.filter(
      (l) =>
        (l.label || "").toLowerCase().includes(term) ||
        l.phoneNumber.includes(term),
    );
  }, [phoneLines, phoneLineSearch]);

  return (
    <div className="w-full lg:w-48 shrink-0 flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Ticketing</h2>
        <Button size="icon" variant="ghost">
          <SlidersHorizontal className="h-4 w-4" />
        </Button>
      </div>

      <Button onClick={onCreateTicket} className="w-full" size="sm">
        <Plus className="mr-2 h-4 w-4" />
        New Ticket
      </Button>

      <div className="space-y-1">
        <Button
          variant={activeView === "all" ? "secondary" : "ghost"}
          className="w-full justify-start"
          onClick={() => onViewChange("all")}
        >
          <RefreshCw
            className={`mr-2 h-4 w-4 ${isLoading ? "animate-spin" : ""}`}
          />
          All Tickets
          <span className="ml-auto text-xs">{getViewCount("all")}</span>
        </Button>
        <Button
          variant={activeView === "assigned" ? "secondary" : "ghost"}
          className="w-full justify-start"
          onClick={() => onViewChange("assigned")}
        >
          <User className="mr-2 h-4 w-4" />
          Assigned
          <span className="ml-auto text-xs">{getViewCount("assigned")}</span>
        </Button>
        <Button
          variant={activeView === "assigned_me" ? "secondary" : "ghost"}
          className="w-full justify-start"
          onClick={() => onViewChange("assigned_me")}
        >
          <User className="mr-2 h-4 w-4" />
          My Tickets
          <span className="ml-auto text-xs">{getViewCount("assigned_me")}</span>
        </Button>
        <Button
          variant={activeView === "unassigned" ? "secondary" : "ghost"}
          className="w-full justify-start"
          onClick={() => onViewChange("unassigned")}
        >
          <Hash className="mr-2 h-4 w-4" />
          Unassigned
          <span className="ml-auto text-xs">{getViewCount("unassigned")}</span>
        </Button>
        <Button
          variant={activeView === "missed" ? "secondary" : "ghost"}
          className="w-full justify-start"
          onClick={() => onViewChange("missed")}
        >
          <AlertTriangle className="mr-2 h-4 w-4" />
          Missed Calls
          <span className="ml-auto text-xs">{getViewCount("missed")}</span>
        </Button>
        <Button
          variant={activeView === "high_priority" ? "secondary" : "ghost"}
          className="w-full justify-start relative"
          onClick={() => onViewChange("high_priority")}
        >
          <Star className="mr-2 h-4 w-4" />
          High Priority
          {hasHighPriorityOpen && (
            <span
              className="ml-2 animate-pulse"
              title="High/Emergency Priority Abierta"
            >
              <AlertTriangle className="h-4 w-4 text-amber-500" />
            </span>
          )}
          <span className="ml-auto text-xs">
            {getViewCount("high_priority")}
          </span>
        </Button>
      </div>

      <div className="space-y-3">
        <h3 className="text-sm font-semibold">Filters</h3>
        <div className="space-y-2">
          <Label>Status</Label>
          <Select
            value={filters.status}
            onValueChange={(v) => onFilterChange("status", v)}
          >
            <SelectTrigger>
              <SelectValue placeholder="All Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              {Object.values(TicketStatus).map((value) => (
                <SelectItem key={value} value={value}>
                  {formatEnumLabel(value)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Priority</Label>
          <Select
            value={filters.priority}
            onValueChange={(v) => onFilterChange("priority", v)}
          >
            <SelectTrigger>
              <SelectValue placeholder="All Priority" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Priority</SelectItem>
              <SelectItem value="High">High</SelectItem>
              <SelectItem value="Medium">Medium</SelectItem>
              <SelectItem value="Low">Low</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Agent</Label>
          <Select
            value={filters.agent}
            onValueChange={(v) => onFilterChange("agent", v)}
          >
            <SelectTrigger>
              <SelectValue placeholder="All Agents" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Agents</SelectItem>
              {filteredAgents.map((agent) => (
                <SelectItem key={agent.id} value={agent.id.toString()}>
                  {agent.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Direction</Label>
          <Select
            value={filters.direction}
            onValueChange={(v) => onFilterChange("direction", v)}
          >
            <SelectTrigger>
              <SelectValue placeholder="All Directions" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Directions</SelectItem>
              <SelectItem value="inbound">Inbound</SelectItem>
              <SelectItem value="outbound">Outbound</SelectItem>
              <SelectItem value="missed">Missed</SelectItem>
              <SelectItem value="text_message">Text Message</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Disposition</Label>
          <Select
            value={filters.disposition}
            onValueChange={(v) => onFilterChange("disposition", v)}
          >
            <SelectTrigger>
              <SelectValue placeholder="All Dispositions" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Dispositions</SelectItem>
              {Object.values(TicketDisposition).map((value) => (
                <SelectItem key={value} value={value}>
                  {formatEnumLabel(value)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Campaign</Label>
          <Select
            value={filters.campaign}
            onValueChange={(v) => onFilterChange("campaign", v)}
          >
            <SelectTrigger>
              <SelectValue placeholder="All Campaigns" />
            </SelectTrigger>
            <SelectContent>
              <div className="p-2">
                <Input
                  placeholder="Search campaign..."
                  value={campaignSearch}
                  onChange={(e) => setCampaignSearch(e.target.value)}
                  onClick={(e) => e.stopPropagation()}
                  onKeyDown={(e) => e.stopPropagation()}
                  className="h-8"
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

        <div className="space-y-2">
          <Label>Yard</Label>
          <Select
            value={filters.yard}
            onValueChange={(v) => onFilterChange("yard", v)}
          >
            <SelectTrigger>
              <SelectValue placeholder="All Yards" />
            </SelectTrigger>
            <SelectContent>
              <div className="p-2">
                <Input
                  placeholder="Search yard..."
                  value={yardSearch}
                  onChange={(e) => setYardSearch(e.target.value)}
                  onClick={(e) => e.stopPropagation()}
                  onKeyDown={(e) => e.stopPropagation()}
                  className="h-8"
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

        <div className="space-y-2">
          <Label>Line</Label>
          <Select
            value={filters.phoneLine}
            onValueChange={(v) => onFilterChange("phoneLine", v)}
          >
            <SelectTrigger>
              <SelectValue placeholder="All Lines" />
            </SelectTrigger>
            <SelectContent>
              <div className="p-2">
                <Input
                  placeholder="Search line..."
                  value={phoneLineSearch}
                  onChange={(e) => setPhoneLineSearch(e.target.value)}
                  onClick={(e) => e.stopPropagation()}
                  onKeyDown={(e) => e.stopPropagation()}
                  className="h-8"
                />
              </div>
              <SelectItem value="all">All Lines</SelectItem>
              {filteredPhoneLines.map((l) => (
                <SelectItem key={l.id} value={l.id.toString()}>
                  {l.label || l.phoneNumber}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
}
