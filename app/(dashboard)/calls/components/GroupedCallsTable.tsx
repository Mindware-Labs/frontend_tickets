"use client";

import { useMemo, useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
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
  Clock,
  Timer,
} from "lucide-react";
import { format } from "date-fns";
import type { DateRange } from "react-day-picker";
import type { Call } from "@/lib/mock-data";
import type { AgentOption, CampaignOption, YardOption } from "../types";
import type { Filters, FilterKey } from "../hooks/useTicketFilters";
import { CallFiltersBar } from "./CallFiltersBar";
import {
  getClientName,
  getClientPhone,
  getClientInitials,
  getAssigneeName,
  getAssigneeInitials,
  getStatusBadgeColor,
  getDirectionIcon,
  getDirectionText,
  getYardTypeColor,
  getYardTypeIcon,
  getYardDisplayName,
  getCampaign,
  formatEnumLabel,
} from "../utils/ticket-helpers";
import type { CustomerCallGroup } from "./CustomerTimelineDrawer";

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
}: GroupedCallsTableProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

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

  // ── Client-side pagination on groups ────────────────────────────────────────
  const totalCount = tickets.length;
  const totalPages = Math.max(1, Math.ceil(groups.length / itemsPerPage));
  const paginatedGroups = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return groups.slice(start, start + itemsPerPage);
  }, [groups, currentPage, itemsPerPage]);

  // Reset page when groups change (e.g. new filter) and current page is out of range
  useEffect(() => {
    setCurrentPage((prev) =>
      Math.min(prev, Math.max(1, Math.ceil(groups.length / itemsPerPage))),
    );
  }, [groups.length, itemsPerPage]);

  return (
    <div className="flex-1 flex flex-col gap-4">
      {/* Search + Date ─────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search calls..."
            className="pl-9"
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
          />
        </div>
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className={`justify-start text-left font-normal h-9 px-3 text-sm whitespace-nowrap ${
                !dateRange?.from ? "text-muted-foreground" : ""
              }`}
            >
              <Calendar className="mr-2 h-4 w-4 shrink-0" />
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
                <span>Pick a date</span>
              )}
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
      </div>

      {/* Filters ──────────────────────────────────────────────────────────── */}
      <CallFiltersBar
        filters={filters}
        onFilterChange={onFilterChange}
        agents={agents}
        campaigns={campaigns}
        yards={yards}
        phoneLines={phoneLines}
      />

      {/* Table ─────────────────────────────────────────────────────────────── */}
      <div className="rounded-lg border overflow-hidden">
        <div className="max-h-[calc(100vh-12rem)] overflow-y-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-20">Call ID</TableHead>
                <TableHead className="w-28">Aircall ID</TableHead>
                <TableHead className="w-52">Customer</TableHead>
                <TableHead className="w-36">Phone</TableHead>
                <TableHead className="w-20 text-center">Calls</TableHead>
                <TableHead className="w-40">Yard</TableHead>
                <TableHead className="w-36">Campaign</TableHead>
                <TableHead className="w-36">Assignee</TableHead>
                <TableHead className="w-28">Status</TableHead>
                <TableHead className="w-36">Line</TableHead>
                <TableHead className="w-24">Duration</TableHead>
                <TableHead className="w-24">Ring</TableHead>
                <TableHead className="w-36">Last Call</TableHead>
                <TableHead className="w-28">Direction</TableHead>
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
                paginatedGroups.map((group) => {
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
                  const dateLabel = isNaN(latestDate.getTime())
                    ? "-"
                    : latestDate.toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      });

                  return (
                    <TableRow
                      key={group.key}
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => onOpenTimeline(group)}
                    >
                      {/* Call ID */}
                      <TableCell className="text-sm font-mono text-muted-foreground">
                        #{t.id}
                      </TableCell>

                      {/* Aircall ID */}
                      <TableCell className="text-sm font-mono text-muted-foreground">
                        {(t as any).aircallId || "-"}
                      </TableCell>

                      {/* Customer */}
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Avatar className="h-7 w-7 shrink-0">
                            <AvatarFallback className="text-xs bg-primary/10 text-primary font-semibold">
                              {group.customerName
                                ? group.customerName
                                    .substring(0, 2)
                                    .toUpperCase()
                                : "?"}
                            </AvatarFallback>
                          </Avatar>
                          <span className="font-medium text-sm truncate max-w-36">
                            {group.customerName}
                          </span>
                        </div>
                      </TableCell>

                      {/* Phone */}
                      <TableCell className="text-sm text-muted-foreground">
                        {group.customerPhone}
                      </TableCell>

                      {/* Call count */}
                      <TableCell className="text-center">
                        <Badge
                          variant="secondary"
                          className="gap-1 font-mono text-xs px-2"
                        >
                          <PhoneCall className="h-3 w-3" />
                          {group.calls.length}
                        </Badge>
                      </TableCell>

                      {/* Yard */}
                      <TableCell>
                        {yardDisplayName ? (
                          <Badge
                            variant="outline"
                            className={getYardTypeColor(yardType)}
                          >
                            <div className="flex items-center gap-1">
                              {getYardTypeIcon(yardType)}
                              <span className="truncate max-w-28">
                                {yardDisplayName}
                              </span>
                            </div>
                          </Badge>
                        ) : (
                          <div className="group relative inline-block">
                            <Badge
                              variant="outline"
                              className="border-amber-500/20 bg-amber-500/5 text-amber-600 animate-pulse"
                            >
                              <AlertTriangle className="mr-1 h-3 w-3" />
                              Pending
                            </Badge>
                            <div className="absolute z-10 hidden group-hover:block bg-white dark:bg-zinc-900 text-xs text-amber-700 dark:text-amber-300 border border-amber-400 rounded px-2 py-1 shadow-lg left-1/2 -translate-x-1/2 mt-2 whitespace-nowrap">
                              Yard pending assignment
                            </div>
                          </div>
                        )}
                      </TableCell>

                      {/* Campaign */}
                      <TableCell>
                        {getCampaign(t, campaigns) ? (
                          <Badge variant="outline">
                            {getCampaign(t, campaigns)}
                          </Badge>
                        ) : (
                          <Badge
                            variant="outline"
                            className="border-amber-500/20 bg-amber-500/5 text-amber-600 animate-pulse"
                          >
                            <AlertTriangle className="mr-1 h-3 w-3" />
                            Pending
                          </Badge>
                        )}
                      </TableCell>

                      {/* Assignee */}
                      <TableCell>
                        {(() => {
                          // Try to resolve agent name from agents list
                          const agentId = (t as any).agentId;
                          const agentObj = agentId
                            ? agents.find(
                                (a) => a.id.toString() === agentId.toString(),
                              )
                            : undefined;
                          if (t.assignedTo) {
                            return (
                              <div className="flex items-center gap-2">
                                <Avatar className="h-6 w-6">
                                  <AvatarFallback className="text-xs">
                                    {getAssigneeInitials(t.assignedTo)}
                                  </AvatarFallback>
                                </Avatar>
                                <span className="text-sm">
                                  {getAssigneeName(t.assignedTo)}
                                </span>
                              </div>
                            );
                          } else if (agentObj) {
                            return (
                              <div className="flex items-center gap-2">
                                <Avatar className="h-6 w-6">
                                  <AvatarFallback className="text-xs">
                                    {agentObj.name
                                      .substring(0, 2)
                                      .toUpperCase()}
                                  </AvatarFallback>
                                </Avatar>
                                <span className="text-sm">{agentObj.name}</span>
                              </div>
                            );
                          } else {
                            return (
                              <span className="text-sm text-muted-foreground">
                                Unassigned
                              </span>
                            );
                          }
                        })()}
                      </TableCell>

                      {/* Status */}
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={getStatusBadgeColor(t.status)}
                        >
                          {formatEnumLabel(t.status)}
                        </Badge>
                      </TableCell>

                      {/* Line */}
                      <TableCell>
                        {(t as any).phoneLine ? (
                          <div className="flex items-center gap-1">
                            <Phone className="h-3 w-3 text-muted-foreground shrink-0" />
                            <span className="text-sm truncate max-w-32">
                              {(t as any).phoneLine.label ||
                                (t as any).phoneLine.phoneNumber}
                            </span>
                          </div>
                        ) : (
                          <span className="text-sm text-muted-foreground">
                            -
                          </span>
                        )}
                      </TableCell>

                      {/* Duration */}
                      <TableCell>
                        {t.duration ? (
                          <div className="flex items-center gap-1">
                            <Clock className="h-3 w-3 text-muted-foreground shrink-0" />
                            <span className="text-sm">
                              {Math.floor(t.duration / 60)}:
                              {String(t.duration % 60).padStart(2, "0")}
                            </span>
                          </div>
                        ) : (
                          <span className="text-sm text-muted-foreground">
                            -
                          </span>
                        )}
                      </TableCell>

                      {/* Ring Time */}
                      <TableCell>
                        {(() => {
                          const started = (t as any).startedAt;
                          const answered = (t as any).answeredAt;
                          if (started && answered) {
                            const ringSec = Math.round(
                              (new Date(answered).getTime() -
                                new Date(started).getTime()) /
                                1000,
                            );
                            if (ringSec >= 0) {
                              return (
                                <div className="flex items-center gap-1">
                                  <Timer className="h-3 w-3 text-muted-foreground shrink-0" />
                                  <span className="text-sm">{ringSec}s</span>
                                </div>
                              );
                            }
                          }
                          return (
                            <span className="text-sm text-muted-foreground">
                              -
                            </span>
                          );
                        })()}
                      </TableCell>

                      {/* Last Call */}
                      <TableCell className="text-sm">{dateLabel}</TableCell>

                      {/* Direction */}
                      <TableCell>
                        <div className="flex items-center gap-1">
                          {getDirectionIcon(t.direction || "inbound")}
                          <span className="text-xs">
                            {getDirectionText(
                              t.direction || "inbound",
                              (t as any).originalDirection,
                              (t as any).agentId,
                            )}
                          </span>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Pagination ────────────────────────────────────────────────────────── */}
      {totalCount > 0 && (
        <div className="flex items-center justify-between px-2">
          <div className="flex items-center gap-2">
            <p className="text-sm text-muted-foreground">
              {groups.length} customer{groups.length !== 1 ? "s" : ""} ·{" "}
              {totalCount} call{totalCount !== 1 ? "s" : ""} total
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Select
              value={itemsPerPage.toString()}
              onValueChange={(value) => {
                setItemsPerPage(Number(value));
                setCurrentPage(1);
              }}
            >
              <SelectTrigger className="h-8 w-25">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="5">5 / page</SelectItem>
                <SelectItem value="10">10 / page</SelectItem>
                <SelectItem value="20">20 / page</SelectItem>
                <SelectItem value="50">50 / page</SelectItem>
              </SelectContent>
            </Select>
            <div className="flex items-center gap-1">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(1)}
                disabled={currentPage === 1}
              >
                First
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(Math.max(currentPage - 1, 1))}
                disabled={currentPage === 1}
              >
                Previous
              </Button>
              <span className="text-sm px-2">
                Page {currentPage} of {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  setCurrentPage(Math.min(currentPage + 1, totalPages))
                }
                disabled={currentPage === totalPages}
              >
                Next
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(totalPages)}
                disabled={currentPage === totalPages}
              >
                Last
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
