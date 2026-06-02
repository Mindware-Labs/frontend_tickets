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
import { DataTablePagination } from "../shared/DataTablePagination";
import { TableLoadingRow } from "@/components/shared/entity-loading-state";
import {
  Search,
  AlertTriangle,
  X,
  Calendar,
  PhoneCall,
  Phone,
  PhoneOutgoing,
  PhoneIncoming,
  ChevronDown,
  Radio,
  MousePointerClick,
} from "lucide-react";
import {
  TableCampaignBadge,
  TableYardBadge,
} from "@/components/entity-table-badges";
import {
  TableCallStatusPill,
  TableDispositionPill,
} from "@/components/entity-table-pills";
import { cn } from "@/lib/utils";
import { useAircall } from "@/components/providers/AircallProvider";
import { useLiveCalls } from "@/components/providers/CallSocketProvider";
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
  getYardBadgeName,
  getCampaign,
  formatEnumLabel,
} from "../../utils/call-helpers";
import type { CustomerCallGroup } from "./CustomerTimelineDrawer";
import { InlineCallTimeline } from "./InlineCallTimeline";

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
      className={`inline-flex max-w-full items-center gap-1 font-medium ${cfg.textColor}`}
      title={label}
    >
      <span
        className={`inline-flex h-4 w-4 shrink-0 items-center justify-center rounded ${cfg.bgColor}`}
      >
        <Icon className={`h-2.5 w-2.5 ${cfg.iconColor}`} />
      </span>
      <span className="truncate text-[11px]">{label}</span>
    </span>
  );
}

interface GroupedCallsTableProps {
  tickets: Call[];
  isLoading: boolean;
  /** When set via ?id= deep link, table shows only this call */
  focusCallId?: string | null;
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
  onClearFocus?: () => void;
}

export function GroupedCallsTable({
  tickets,
  isLoading,
  focusCallId,
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
  onClearFocus,
}: GroupedCallsTableProps) {
  const [expandedKey, setExpandedKey] = useState<string | null>(null);
  const {
    dial,
    status: aircallStatus,
    isLoggedIn: aircallLoggedIn,
  } = useAircall();
  const canDial = aircallStatus === "ready" && aircallLoggedIn;
  const { liveCallIds } = useLiveCalls();
  const scopedTickets = useMemo(() => {
    if (!focusCallId?.trim()) return tickets;
    return tickets.filter((t) => String(t.id) === focusCallId.trim());
  }, [tickets, focusCallId]);

  const isFocusMode = Boolean(focusCallId?.trim());

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

    for (const ticket of scopedTickets) {
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
  }, [scopedTickets]);

  // ── Server-side pagination: tickets are already the current page ────────
  // Grouping happens on the current page of calls.
  const paginatedGroups = groups;

  return (
    <div className="flex-1 flex flex-col gap-1">
      {isFocusMode ? (
        <div className="mt-2 flex flex-wrap items-center justify-between gap-2 rounded-lg border border-[#008f68]/25 bg-[#f0faf5] px-3 py-2 text-[12px] text-slate-700">
          <p className="min-w-0 flex-1 leading-snug">
            Showing call{" "}
            <span className="font-mono font-bold text-[#008f68]">
              #{focusCallId}
            </span>{" "}
            only — use Clear to reset filters and see all calls, or use back in
            the call panel.
          </p>
          {onClearFocus ? (
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={onClearFocus}
              className="h-7 shrink-0 border-[#008f68]/30 bg-white px-2.5 text-[11px] font-semibold text-[#008f68] hover:bg-[#e8f8f1]"
            >
              <X className="mr-1 h-3 w-3" />
              Clear
            </Button>
          ) : null}
        </div>
      ) : null}
      {/* Search + Date + Filters ─────────────────────────────────────────────────────── */}
      <div className="my-2 flex flex-col items-stretch justify-between gap-2 sm:flex-row sm:items-center">
        <div className="flex min-w-0 flex-col gap-2 sm:flex-row sm:items-center">
          <div className="relative flex-1 max-w-[320px]">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-[14px] w-[14px] text-muted-foreground" />
            <Input
              placeholder="Search calls, numbers, or customers..."
              className="pl-[34px] pr-8 h-[30px] rounded-full text-[12.5px] bg-muted/30 border-border shadow-none focus-visible:ring-[#008f68]/30 focus-visible:border-[#008f68]/40"
              value={search}
              readOnly={isFocusMode}
              onChange={(e) => {
                if (!isFocusMode) onSearchChange(e.target.value);
              }}
            />
            <div className="absolute right-2.5 top-1/2 transform -translate-y-1/2 border border-border rounded px-1.5 py-[1px] text-[10px] text-muted-foreground font-mono bg-background">
              /
            </div>
          </div>

       
        </div>

        <div
          className={cn(
            "flex items-center gap-3",
            isFocusMode && "opacity-60 pointer-events-none",
          )}
        >
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
          <Table className="relative w-full table-fixed text-[12px]">
            <colgroup>
              <col className="w-[14%]" />
              <col className="w-[6%]" />
              <col className="w-[15%]" />
              <col className="w-[16%]" />
              <col className="w-[11%]" />
              <col className="w-[10%]" />
              <col className="w-[8%]" />
              <col className="w-[9%]" />
              <col className="w-[12%]" />
            </colgroup>
            <TableHeader className="sticky top-0 z-10 border-y border-slate-200 bg-slate-50 dark:bg-muted/40">
              <TableRow className="border-none hover:bg-transparent">
                <TableHead className="px-2 py-1.5 text-[10px] font-bold uppercase tracking-wide text-slate-500">
                  Customer
                </TableHead>
                <TableHead className="px-2 py-1 text-left text-[10px] font-bold uppercase tracking-wide text-slate-500">
                  Calls
                </TableHead>
                <TableHead className="px-2 py-1 text-[10px] font-bold uppercase tracking-wide text-slate-500">
                  Line
                </TableHead>
                <TableHead className="px-2 py-1 text-[10px] font-bold uppercase tracking-wide text-slate-500">
                  Yard
                </TableHead>
                <TableHead className="px-2 py-1 text-[10px] font-bold uppercase tracking-wide text-slate-500">
                  Campaign
                </TableHead>
                <TableHead className="px-2 py-1 text-[10px] font-bold uppercase tracking-wide text-slate-500">
                  Disposition
                </TableHead>
                <TableHead className="px-2 py-1 text-[10px] font-bold uppercase tracking-wide text-slate-500">
                  Status
                </TableHead>
                <TableHead className="px-2 py-1 text-[10px] font-bold uppercase tracking-wide text-slate-500">
                  Direction
                </TableHead>
                <TableHead className="px-2 py-1 text-[10px] font-bold uppercase tracking-wide text-slate-500">
                  Agent
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableLoadingRow colSpan={9} kind="calls" compact />
              ) : groups.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={9}
                    className="h-24 text-center text-muted-foreground"
                  >
                    No calls found.
                  </TableCell>
                </TableRow>
              ) : (
                paginatedGroups.map((group, i) => {
                  const t = group.latestCall;
                  const isLive = !!(t.isLive || liveCallIds.has(Number(t.id)));
                  const yardBadgeName = getYardBadgeName(t, yards);

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
                          isLive
                            ? "bg-emerald-50/40 dark:bg-emerald-500/5 border-l-2 border-l-emerald-400"
                            : i % 2 === 1
                              ? "bg-slate-50/60 dark:bg-muted/20"
                              : "bg-white dark:bg-card"
                        }`}
                        onClick={() => onOpenTimeline(group)}
                      >
                        {/* Customer */}
                        <TableCell className="px-2 py-1.5 align-middle">
                          <div className="flex min-w-0 items-center gap-1.5">
                            <Avatar className="h-6 w-6 shrink-0 rounded-full">
                              <AvatarFallback
                                className="rounded-full text-[10px] font-bold"
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
                              <div className="flex min-w-0 items-center gap-1">
                                <p
                                  className="truncate text-[12px] font-bold leading-tight text-foreground"
                                  title={group.customerName}
                                >
                                  {group.customerName || "Unknown"}
                                </p>
                                {isLive ? (
                                  <span className="inline-flex shrink-0 items-center rounded-full bg-emerald-500 px-1 py-px text-[8px] font-bold leading-none text-white">
                                    LIVE
                                  </span>
                                ) : null}
                              </div>
                              <p
                                className="truncate font-mono text-[10px] text-slate-500"
                                title={group.customerPhone}
                              >
                                {group.customerPhone || "—"}
                              </p>
                              <p className="truncate text-[10px] text-slate-400">
                                {dateLabel}
                              </p>
                            </div>
                          </div>
                        </TableCell>

                        {/* Calls chip */}
                        <TableCell className="px-2 py-1.5 text-left align-middle">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setExpandedKey((prev) =>
                                prev === group.key ? null : group.key,
                              );
                            }}
                            className={`inline-flex items-center justify-center gap-0.5 rounded-full border px-2 py-0.5 text-[10.5px] font-bold transition-colors ${
                              expandedKey === group.key
                                ? "border-[#86efac] bg-[#dcfce7] text-[#15803d]"
                                : "border-slate-200 bg-slate-100 text-slate-600 hover:border-[#86efac] hover:bg-[#dcfce7] hover:text-[#15803d]"
                            }`}
                            aria-label="Toggle call timeline"
                            title="View call timeline"
                          >
                            <Phone className="h-2.5 w-2.5" />
                            <span className="font-mono tabular-nums">
                              {group.calls.length}
                            </span>
                          </button>
                        </TableCell>

                        {/* Line */}
                        <TableCell
                          className="max-w-0 px-2 py-1.5 align-middle text-[11px] font-medium text-slate-600"
                          title={
                            (t as any).phoneLine?.label ||
                            (t as any).phoneLine?.phoneNumber ||
                            undefined
                          }
                        >
                          <span className="block truncate">
                            {(t as any).phoneLine?.label ||
                              (t as any).phoneLine?.phoneNumber ||
                              "—"}
                          </span>
                        </TableCell>

                        {/* Yard */}
                        <TableCell className="max-w-0 px-2 py-1.5 align-middle">
                          <TableYardBadge compact name={yardBadgeName} />
                        </TableCell>

                        {/* Campaign */}
                        <TableCell className="max-w-0 px-2 py-1.5 align-middle">
                          <TableCampaignBadge
                            compact
                            name={getCampaign(t, campaigns)}
                          />
                        </TableCell>

                        {/* Disposition */}
                        <TableCell className="px-2 py-1 align-middle">
                          <TableDispositionPill disposition={t.disposition} />
                        </TableCell>

                        {/* Status */}
                        <TableCell className="px-2 py-1 align-middle">
                          <TableCallStatusPill status={t.status} />
                        </TableCell>

                        {/* Direction */}
                        <TableCell className="px-1 py-1.5 align-middle">
                          <DirectionChip
                            direction={t.direction || "inbound"}
                            originalDirection={(t as any).originalDirection}
                            agentId={(t as any).agentId}
                          />
                        </TableCell>

                        {/* Agent */}
                        <TableCell
                          className="max-w-0 px-2 py-1.5 align-middle text-[11px] text-slate-600"
                          title={(t as any).agent?.name}
                        >
                          <span className="block truncate font-medium">
                            {(t as any).agent?.name || "—"}
                          </span>
                        </TableCell>
                      </TableRow>
                      {expandedKey === group.key && (
                        <TableRow
                          key={`${group.key}-timeline`}
                          className="bg-slate-50/50 hover:bg-slate-50/50 border-b relative"
                        >
                          <TableCell
                            colSpan={9}
                            className="border-t-0 py-1.5 px-0"
                          >
                            <InlineCallTimeline
                              group={group}
                              agents={agents}
                              onOpenTimeline={onOpenTimeline}
                            />
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

      <DataTablePagination
        currentPage={currentPage}
        totalPages={totalPages}
        totalCount={totalCount}
        onPageChange={onPageChange}
      />
    </div>
  );
}
