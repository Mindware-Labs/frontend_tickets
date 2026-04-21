"use client";

import React, { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar as CalendarWidget } from "@/components/ui/calendar";
import {
  Search,
  AlertTriangle,
  Loader2,
  X,
  Calendar,
  PhoneCall,
  Phone,
  PhoneOutgoing,
  PhoneIncoming,
  ChevronDown,
  ChevronRight,
} from "lucide-react";
import { useAircall } from "@/components/providers/AircallProvider";
import { format } from "date-fns";
import type { DateRange } from "react-day-picker";
import type { Call } from "@/lib/mock-data";
import type { AgentOption, CampaignOption, YardOption } from "../../types";
import type { Filters, FilterKey } from "../../hooks/useCallFilters";
import { CallFiltersBar } from "./CallFiltersBar";
import {
  getClientName,
  getClientPhone,
  getClientInitials,
  getAssigneeName,
  getAssigneeInitials,
  getTicketAssignee,
  getStatusBadgeColor,
  getDirectionIcon,
  getDirectionText,
  getYardTypeColor,
  getYardTypeIcon,
  getYardDisplayName,
  getCampaign,
  formatEnumLabel,
} from "../../utils/call-helpers";
import type { CustomerCallGroup } from "./CustomerTimelineDrawer";
import { InlineCallTimeline } from "./InlineCallTimeline";

const STATUS_CONFIG: Record<
  string,
  {
    label: string;
    dotColor: string;
    bgColor: string;
    textColor: string;
    borderColor: string;
  }
> = {
  ACTIVE: {
    label: "Active",
    dotColor: "bg-[#22c55e]",
    bgColor: "bg-[#dcfce7] dark:bg-emerald-500/15",
    textColor: "text-[#15803d] dark:text-emerald-400",
    borderColor: "border-[#bbf7d0] dark:border-emerald-500/30",
  },
  OPEN: {
    label: "Active",
    dotColor: "bg-[#22c55e]",
    bgColor: "bg-[#dcfce7] dark:bg-emerald-500/15",
    textColor: "text-[#15803d] dark:text-emerald-400",
    borderColor: "border-[#bbf7d0] dark:border-emerald-500/30",
  },
  IN_PROGRESS: {
    label: "Active",
    dotColor: "bg-[#22c55e]",
    bgColor: "bg-[#dcfce7] dark:bg-emerald-500/15",
    textColor: "text-[#15803d] dark:text-emerald-400",
    borderColor: "border-[#bbf7d0] dark:border-emerald-500/30",
  },
  PENDING_FOLLOWUP: {
    label: "Pending",
    dotColor: "bg-[#f59e0b]",
    bgColor: "bg-[#fef3c7] dark:bg-amber-500/15",
    textColor: "text-[#b45309] dark:text-amber-400",
    borderColor: "border-[#fde68a] dark:border-amber-500/30",
  },
  PENDING: {
    label: "Pending",
    dotColor: "bg-[#f59e0b]",
    bgColor: "bg-[#fef3c7] dark:bg-amber-500/15",
    textColor: "text-[#b45309] dark:text-amber-400",
    borderColor: "border-[#fde68a] dark:border-amber-500/30",
  },
  OVERDUE: {
    label: "Overdue",
    dotColor: "bg-[#ef4444]",
    bgColor: "bg-[#fee2e2] dark:bg-red-500/15",
    textColor: "text-[#b91c1c] dark:text-red-400",
    borderColor: "border-[#fecaca] dark:border-red-500/30",
  },
  COMPLETED: {
    label: "Closed",
    dotColor: "bg-[#94a3b8]",
    bgColor: "bg-[#f1f5f9] dark:bg-slate-500/15",
    textColor: "text-[#475569] dark:text-slate-400",
    borderColor: "border-[#e2e8f0] dark:border-slate-500/30",
  },
  CLOSED: {
    label: "Closed",
    dotColor: "bg-[#94a3b8]",
    bgColor: "bg-[#f1f5f9] dark:bg-slate-500/15",
    textColor: "text-[#475569] dark:text-slate-400",
    borderColor: "border-[#e2e8f0] dark:border-slate-500/30",
  },
  RESOLVED: {
    label: "Closed",
    dotColor: "bg-[#94a3b8]",
    bgColor: "bg-[#f1f5f9] dark:bg-slate-500/15",
    textColor: "text-[#475569] dark:text-slate-400",
    borderColor: "border-[#e2e8f0] dark:border-slate-500/30",
  },
};

function StatusPill({ status }: { status: string }) {
  const key = status?.toString().toUpperCase().replace(/\s+/g, "_") || "ACTIVE";
  const cfg = STATUS_CONFIG[key] || STATUS_CONFIG.CLOSED;
  return (
    <span
      className={`inline-flex items-center gap-2 px-3 py-[5px] rounded-full text-[12.5px] font-bold leading-none border ${cfg.bgColor} ${cfg.textColor} ${cfg.borderColor}`}
    >
      <span
        className={`w-[7px] h-[7px] rounded-full ${cfg.dotColor} shrink-0`}
      />
      {cfg.label}
    </span>
  );
}

/* ── Direction Chip (matches mockup design) ────────────────────────────── */
const DIRECTION_CONFIG: Record<
  string,
  {
    label: string;
    iconColor: string;
    textColor: string;
    bgColor: string;
    Icon: React.ElementType;
  }
> = {
  inbound: {
    label: "Inbound",
    iconColor: "text-emerald-500",
    textColor: "text-emerald-600 dark:text-emerald-400",
    bgColor: "bg-emerald-50 dark:bg-emerald-500/10",
    Icon: PhoneIncoming,
  },
  outbound: {
    label: "Outbound",
    iconColor: "text-blue-500",
    textColor: "text-blue-600 dark:text-blue-400",
    bgColor: "bg-blue-50 dark:bg-blue-500/10",
    Icon: PhoneOutgoing,
  },
  missed: {
    label: "Missed",
    iconColor: "text-red-500",
    textColor: "text-red-600 dark:text-red-400",
    bgColor: "bg-red-50 dark:bg-red-500/10",
    Icon: AlertTriangle,
  },
  voicemail: {
    label: "Voicemail",
    iconColor: "text-slate-500",
    textColor: "text-slate-600 dark:text-slate-400",
    bgColor: "bg-slate-50 dark:bg-slate-500/10",
    Icon: PhoneIncoming,
  },
};

function DirectionChip({
  direction,
  originalDirection,
  agentId,
}: {
  direction: string;
  originalDirection?: string;
  agentId?: number | string;
}) {
  const d = direction?.toString().toLowerCase() || "inbound";
  const cfg = DIRECTION_CONFIG[d] || DIRECTION_CONFIG.inbound;
  const { Icon } = cfg;

  // Build label with original direction context for missed calls
  let label = cfg.label;
  if (d === "missed" && originalDirection) {
    const formatted =
      originalDirection.charAt(0).toUpperCase() +
      originalDirection.slice(1).toLowerCase();
    label = `Missed`;
  }

  return (
    <span
      className={`inline-flex items-center gap-1.5 font-medium ${cfg.textColor}`}
    >
      <span
        className={`inline-flex items-center justify-center w-5 h-5 rounded-md ${cfg.bgColor}`}
      >
        <Icon className={`h-[13px] w-[13px] ${cfg.iconColor}`} />
      </span>
      <span className="text-[13px]">{label}</span>
    </span>
  );
}

interface GroupedCallsTableProps {
  tickets: Call[];
  isLoading: boolean;
  search: string;
  onSearchChange: (value: string) => void;
  dateRange: DateRange | undefined;
  onDateRangeChange: (range: DateRange | undefined) => void;
  filters: Filters;
  onFilterChange: (key: FilterKey, value: string) => void;
  yards: YardOption[];
  campaigns: CampaignOption[];
  agents: AgentOption[];
  phoneLines: { id: number; label: string | null; phoneNumber: string }[];
  onOpenTimeline: (group: CustomerCallGroup) => void;
  currentPage: number;
  onPageChange: (page: number) => void;
  itemsPerPage: number;
  onItemsPerPageChange: (n: number) => void;
  totalCount: number;
  totalCustomers?: number;
  totalPages: number;
}

export function GroupedCallsTable({
  tickets,
  isLoading,
  search,
  onSearchChange,
  dateRange,
  onDateRangeChange,
  filters,
  onFilterChange,
  yards,
  campaigns,
  agents,
  phoneLines,
  onOpenTimeline,
  currentPage,
  onPageChange,
  itemsPerPage,
  onItemsPerPageChange,
  totalCount,
  totalCustomers,
  totalPages,
}: GroupedCallsTableProps) {
  const [expandedKey, setExpandedKey] = useState<string | null>(null);
  const {
    dial,
    status: aircallStatus,
    isLoggedIn: aircallLoggedIn,
  } = useAircall();
  const canDial = aircallStatus === "ready" && aircallLoggedIn;
  // ── Client-side grouping ─────────────────────────────────────────────────────
  const groups = useMemo<CustomerCallGroup[]>(() => {
    const map = new Map<
      string,
      {
        key: string;
        customerId?: number;
        customerName: string;
        customerPhone: string;
        calls: Call[];
        latestCall: Call;
      }
    >();

    for (const ticket of tickets) {
      const phone = getClientPhone(ticket);
      const name = getClientName(ticket);
      const cid =
        ticket.customerId != null ? Number(ticket.customerId) : undefined;

      // Group by customerId if available, otherwise by phone
      const groupKey = cid != null ? `cid:${cid}` : `phone:${phone}`;

      const existing = map.get(groupKey);
      if (!existing) {
        map.set(groupKey, {
          key: groupKey,
          customerId: cid,
          customerName: name,
          customerPhone: phone,
          calls: [ticket],
          latestCall: ticket,
        });
      } else {
        existing.calls.push(ticket);
        const existingDate = new Date(
          existing.latestCall.callDate || existing.latestCall.createdAt || 0,
        ).getTime();
        const thisDate = new Date(
          ticket.callDate || ticket.createdAt || 0,
        ).getTime();
        if (thisDate > existingDate) {
          existing.latestCall = ticket;
        }
      }
    }

    // Sort groups: most recent call first
    return Array.from(map.values()).sort(
      (a, b) =>
        new Date(
          b.latestCall.callDate || b.latestCall.createdAt || 0,
        ).getTime() -
        new Date(
          a.latestCall.callDate || a.latestCall.createdAt || 0,
        ).getTime(),
    );
  }, [tickets]);

  // ── Server-side pagination: tickets are already the current page ────────
  // Grouping happens on the current page of calls.
  const paginatedGroups = groups;

  return (
    <div className="flex-1 flex flex-col gap-1">
      {/* Search + Date + Filters ─────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 my-3">
        <div className="relative flex-1 max-w-[320px]">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-[14px] w-[14px] text-muted-foreground" />
          <Input
            placeholder="Search calls, numbers, or contacts..."
            className="pl-[34px] pr-8 h-[30px] rounded-full text-[12.5px] bg-muted/30 border-border shadow-none focus-visible:ring-[#008f68]/30 focus-visible:border-[#008f68]/40"
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
          />
          <div className="absolute right-2.5 top-1/2 transform -translate-y-1/2 border border-border rounded px-1.5 py-[1px] text-[10px] text-muted-foreground font-mono bg-background">
            /
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={`flex items-center h-[30px] rounded-full px-3 text-[12.5px] font-medium border-border shadow-none ${
                  !dateRange?.from ? "text-muted-foreground" : ""
                }`}
              >
                <Calendar className="mr-2 h-[14px] w-[14px] shrink-0" />
                {dateRange?.from ? (
                  dateRange.to ? (
                    <span className="truncate">
                      {format(dateRange.from, "MMM d")} –{" "}
                      {format(dateRange.to, "MMM d, yyyy")}
                    </span>
                  ) : (
                    <span>{format(dateRange.from, "MMM d, yyyy")}</span>
                  )
                ) : (
                  <span>Select dates</span>
                )}
                <ChevronDown className="ml-2 h-3 w-3 text-muted-foreground" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="end">
              <div className="p-3 space-y-3">
                <CalendarWidget
                  mode="range"
                  selected={dateRange}
                  onSelect={onDateRangeChange}
                  numberOfMonths={1}
                  disabled={{ after: new Date() }}
                  className="rounded-md"
                />
                {dateRange?.from && (
                  <div className="flex justify-end px-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 text-xs"
                      onClick={() => onDateRangeChange(undefined)}
                    >
                      <X className="mr-1 h-3 w-3" />
                      Clear dates
                    </Button>
                  </div>
                )}
              </div>
            </PopoverContent>
          </Popover>

          {/* Filters ──────────────────────────────────────────────────────────── */}
          <CallFiltersBar
            filters={filters}
            onFilterChange={onFilterChange}
            agents={agents}
            campaigns={campaigns}
            yards={yards}
            phoneLines={phoneLines}
          />
        </div>
      </div>

      {/* Table ─────────────────────────────────────────────────────────────── */}
      <div className="rounded-xl border border-border/80 overflow-hidden shadow-sm">
        <div className="max-h-[calc(100vh-12rem)] overflow-y-auto">
          <Table className="relative">
            <TableHeader className="bg-slate-50 sticky top-0 z-10 border-y border-slate-200 dark:bg-muted/40">
              <TableRow className="border-none hover:bg-transparent">
                <TableHead className="w-[240px] pl-4 font-bold text-[11px] tracking-wider uppercase text-slate-500 dark:text-slate-400">
                  Customer
                </TableHead>
                <TableHead className="w-[170px] font-bold text-[11px] tracking-wider uppercase text-slate-500 dark:text-slate-400">
                  Number
                </TableHead>
                <TableHead className="w-[80px] font-bold text-[11px] tracking-wider uppercase text-slate-500 dark:text-slate-400">
                  Calls
                </TableHead>
                <TableHead className="w-[150px] font-bold text-[11px] tracking-wider uppercase text-slate-500 dark:text-slate-400">
                  Line
                </TableHead>
                <TableHead className="w-[130px] font-bold text-[11px] tracking-wider uppercase text-slate-500 dark:text-slate-400">
                  Yard
                </TableHead>
                <TableHead className="w-[170px] font-bold text-[11px] tracking-wider uppercase text-slate-500 dark:text-slate-400">
                  Campaign
                </TableHead>
                <TableHead className="w-[160px] font-bold text-[11px] tracking-wider uppercase text-slate-500 dark:text-slate-400">
                  Disposition
                </TableHead>
                <TableHead className="w-[110px] font-bold text-[11px] tracking-wider uppercase text-slate-500 dark:text-slate-400">
                  Status
                </TableHead>
                <TableHead className="w-[130px] font-bold text-[11px] tracking-wider uppercase text-slate-500 dark:text-slate-400">
                  Direction
                </TableHead>
                <TableHead className="w-[140px] font-bold text-[11px] tracking-wider uppercase text-slate-500 dark:text-slate-400">
                  Agent
                </TableHead>
                <TableHead className="w-[140px] font-bold text-[11px] tracking-wider uppercase text-slate-500 dark:text-slate-400">
                  Date
                </TableHead>
                <TableHead className="w-[44px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={14} className="h-24 text-center">
                    <div className="flex items-center justify-center">
                      <Loader2 className="h-6 w-6 animate-spin mr-2" />
                      Loading calls...
                    </div>
                  </TableCell>
                </TableRow>
              ) : groups.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={14}
                    className="h-24 text-center text-muted-foreground"
                  >
                    No calls found.
                  </TableCell>
                </TableRow>
              ) : (
                paginatedGroups.map((group, i) => {
                  const t = group.latestCall;
                  const yardDisplayName = getYardDisplayName(t, yards);
                  let yardType = (t as any).yardType;
                  if (!yardType && t.yardId) {
                    const yardObj = yards.find(
                      (y) => y.id.toString() === t.yardId?.toString(),
                    );
                    if (yardObj) yardType = yardObj.yardType;
                  }

                  const latestDate = new Date(t.callDate || t.createdAt || "");
                  const isToday =
                    latestDate.toDateString() === new Date().toDateString();
                  const timeStr = latestDate.toLocaleTimeString("en-US", {
                    hour: "numeric",
                    minute: "2-digit",
                  });
                  const dateLabel = isNaN(latestDate.getTime())
                    ? "-"
                    : isToday
                      ? timeStr
                      : latestDate.toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                        }) +
                        ", " +
                        timeStr;

                  return (
                    <React.Fragment key={group.key}>
                      <TableRow
                        className={`cursor-pointer group hover:bg-[#f0faf5]/60 dark:hover:bg-muted/50 border-b border-border/70 relative transition-all duration-150 ${
                          i % 2 === 1
                            ? "bg-slate-50/60 dark:bg-muted/20"
                            : "bg-white dark:bg-card"
                        }`}
                        onClick={() => onOpenTimeline(group)}
                      >
                        {/* Customer */}
                        <TableCell className="w-[240px] pl-4 py-3">
                          <div className="flex items-center gap-2.5">
                            <Avatar className="h-8 w-8 shrink-0 rounded-full">
                              <AvatarFallback
                                className="text-[12px] font-bold rounded-full"
                                style={{
                                  background: "transparent",
                                  border: "1px solid #d1d5db",
                                  color: "#111827",
                                }}
                              >
                                {group.customerName
                                  ? group.customerName
                                      .substring(0, 2)
                                      .toUpperCase()
                                  : "?"}
                              </AvatarFallback>
                            </Avatar>
                            <div className="min-w-0">
                              <div className="font-bold text-[14px] leading-tight truncate text-foreground">
                                {group.customerName}
                              </div>
                              <div className="text-[11.5px] text-muted-foreground mt-[2px] truncate">
                                last {dateLabel}
                              </div>
                            </div>
                          </div>
                        </TableCell>

                        {/* Number */}
                        <TableCell className="w-[170px] py-3 font-mono text-[13.5px] text-slate-600 dark:text-slate-300 font-medium">
                          {group.customerPhone}
                        </TableCell>

                        {/* Calls chip */}
                        <TableCell className="w-[80px] py-3">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setExpandedKey((prev) =>
                                prev === group.key ? null : group.key,
                              );
                            }}
                            className={`inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-full border text-[12.5px] font-bold transition-all duration-150 shadow-sm ${
                              expandedKey === group.key
                                ? "bg-[#dcfce7] text-[#15803d] border-[#86efac] shadow-[#86efac]/20"
                                : "bg-slate-100 text-slate-600 border-slate-200 hover:bg-[#dcfce7] hover:text-[#15803d] hover:border-[#86efac] dark:bg-slate-800 dark:text-slate-300 dark:border-slate-600"
                            }`}
                            aria-label="Toggle call timeline"
                            title="View call timeline"
                          >
                            <Phone className="h-[12px] w-[12px]" />
                            <span className="font-mono">
                              {group.calls.length}
                            </span>
                          </button>
                        </TableCell>

                        {/* Line */}
                        <TableCell className="w-[150px] py-3 text-[13.5px] text-slate-600 dark:text-slate-300 truncate font-medium">
                          {(t as any).phoneLine?.label ||
                            (t as any).phoneLine?.phoneNumber ||
                            "-"}
                        </TableCell>

                        {/* Yard */}
                        <TableCell className="w-[130px] py-3 text-[13.5px] text-slate-600 dark:text-slate-300 truncate font-medium">
                          {yardDisplayName ? (
                            yardDisplayName.split(" — ")[0]
                          ) : (
                            <span className="inline-flex items-center px-2 py-px rounded-full bg-amber-100 text-amber-700 border border-amber-200 text-[11.5px] font-medium">
                              Unassigned
                            </span>
                          )}
                        </TableCell>

                        {/* Campaign */}
                        <TableCell className="w-[170px] py-3 text-[13.5px] text-slate-600 dark:text-slate-300 truncate font-medium">
                          {getCampaign(t, campaigns) || (
                            <span className="inline-flex items-center px-2 py-px rounded-full bg-amber-100 text-amber-700 border border-amber-200 text-[11.5px] font-medium">
                              Unassigned
                            </span>
                          )}
                        </TableCell>

                        {/* Disposition */}
                        <TableCell className="w-[160px] py-3">
                          {t.disposition ? (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-[12px] font-medium border border-slate-200 dark:border-slate-700 truncate max-w-[145px]">
                              {formatEnumLabel(t.disposition)}
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2 py-px rounded-full bg-amber-100 text-amber-700 border border-amber-200 text-[11.5px] font-medium">
                              Unassigned
                            </span>
                          )}
                        </TableCell>

                        {/* Status */}
                        <TableCell className="w-[120px] py-3">
                          <StatusPill status={t.status} />
                        </TableCell>

                        {/* Direction */}
                        <TableCell className="w-[130px] py-3">
                          <DirectionChip
                            direction={t.direction || "inbound"}
                            originalDirection={(t as any).originalDirection}
                            agentId={(t as any).agentId}
                          />
                        </TableCell>

                        {/* Agent */}
                        <TableCell className="w-[140px] py-3 text-[13px] text-slate-600 dark:text-slate-300 truncate">
                          {(t as any).agent?.name ? (
                            <span className="font-medium">
                              {(t as any).agent.name}
                            </span>
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </TableCell>

                        {/* Date */}
                        <TableCell className="w-[140px] py-3 font-mono text-[13px] text-slate-500 dark:text-slate-400 font-medium">
                          {dateLabel}
                        </TableCell>

                        {/* Hover Actions */}
                        <TableCell className="w-[44px] p-0 align-middle">
                          <div className="flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                            <Button
                              variant="outline"
                              size="icon"
                              className="h-[30px] w-[30px] text-muted-foreground bg-muted/50 border-border"
                              title="Open details"
                            >
                              <ChevronRight className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                      {expandedKey === group.key && (
                        <TableRow
                          key={`${group.key}-timeline`}
                          className="bg-accent/10 hover:bg-accent/10 border-b relative"
                        >
                          <TableCell colSpan={13} className="p-0 border-t-0">
                            <InlineCallTimeline group={group} agents={agents} />
                          </TableCell>
                        </TableRow>
                      )}
                    </React.Fragment>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Pagination ────────────────────────────────────────────────────────── */}
      {totalCount > 0 && (
        <div className="flex items-center justify-between pt-4 pb-2 px-1">
          <Button
            variant="outline"
            className="h-[36px] px-3.5 rounded-[10px] text-[13px] font-medium text-muted-foreground shadow-sm hover:text-foreground border-border"
            onClick={() => onPageChange(Math.max(currentPage - 1, 1))}
            disabled={currentPage === 1}
          >
            <svg
              className="mr-2 h-3.5 w-3.5"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M19 12H5M12 19l-7-7 7-7" />
            </svg>
            Previous
          </Button>

          <div className="hidden md:flex items-center justify-center gap-1.5">
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              let pageNum = i + 1;
              if (totalPages > 5 && currentPage > 3) {
                pageNum = currentPage - 2 + i;
                if (pageNum > totalPages) pageNum = totalPages - 4 + i;
              }
              if (pageNum <= 0 || pageNum > totalPages) return null;

              const active = pageNum === currentPage;
              return (
                <button
                  key={pageNum}
                  onClick={() => onPageChange(pageNum)}
                  className={`flex h-[36px] w-[36px] items-center justify-center rounded-[10px] text-[13px] transition-colors ${
                    active
                      ? "bg-[#e2fae9] text-[#008f68] border border-[#a6f0c3] font-semibold"
                      : "text-muted-foreground font-medium hover:bg-muted/50 border border-transparent"
                  }`}
                >
                  {pageNum}
                </button>
              );
            })}
          </div>

          <Button
            variant="outline"
            className="h-[36px] px-3.5 rounded-[10px] text-[13px] font-medium text-muted-foreground shadow-sm hover:text-foreground border-border"
            onClick={() => onPageChange(Math.min(currentPage + 1, totalPages))}
            disabled={currentPage >= totalPages}
          >
            Next
            <svg
              className="ml-2 h-3.5 w-3.5"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M5 12h14M12 5l7 7-7 7" />
            </svg>
          </Button>
        </div>
      )}
    </div>
  );
}
