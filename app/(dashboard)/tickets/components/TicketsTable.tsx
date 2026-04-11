"use client";

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
import { Search, AlertTriangle, Loader2, X, Calendar } from "lucide-react";
import { format } from "date-fns";
import type { DateRange } from "react-day-picker";
import type { Ticket } from "@/lib/mock-data";
import type { CampaignOption, YardOption } from "../types";
import {
  getClientName,
  getClientPhone,
  getAssigneeName,
  getAssigneeInitials,
  getStatusBadgeColor,
  getPriorityColor,
  getDirectionIcon,
  getDirectionText,
  getYardTypeColor,
  getYardTypeIcon,
  getYardDisplayName,
  getCampaign,
  formatEnumLabel,
} from "../utils/ticket-helpers";

interface TicketsTableProps {
  tickets: Ticket[];
  isLoading: boolean;
  search: string;
  onSearchChange: (value: string) => void;
  dateRange: DateRange | undefined;
  onDateRangeChange: (range: DateRange | undefined) => void;
  currentPage: number;
  totalPages: number;
  totalCount: number;
  itemsPerPage: number;
  onPageChange: (page: number) => void;
  onItemsPerPageChange: (n: number) => void;
  yards: YardOption[];
  campaigns: CampaignOption[];
  onViewDetails: (ticket: Ticket) => void;
}

export function TicketsTable({
  tickets,
  isLoading,
  search,
  onSearchChange,
  dateRange,
  onDateRangeChange,
  currentPage,
  totalPages,
  totalCount,
  itemsPerPage,
  onPageChange,
  onItemsPerPageChange,
  yards,
  campaigns,
  onViewDetails,
}: TicketsTableProps) {
  return (
    <div className="flex-1 flex flex-col gap-4">
      {/* Search + Date */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search tickets..."
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

      {/* Table */}
      <div className="rounded-lg border overflow-hidden">
        <div className="max-h-[calc(100vh-12rem)] overflow-y-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-20">ID</TableHead>
                <TableHead className="w-37.5">Name</TableHead>
                <TableHead className="w-35">Yard</TableHead>
                <TableHead className="w-30">Number</TableHead>
                <TableHead className="w-30">Campaign</TableHead>
                <TableHead className="w-35">Assignee</TableHead>
                <TableHead className="w-25">Status</TableHead>
                <TableHead className="w-25">Priority</TableHead>
                <TableHead className="w-30">Created</TableHead>
                <TableHead className="w-25">Direction</TableHead>
                <TableHead>Line</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={11} className="h-24 text-center">
                    <div className="flex items-center justify-center">
                      <Loader2 className="h-6 w-6 animate-spin mr-2" />
                      Loading tickets...
                    </div>
                  </TableCell>
                </TableRow>
              ) : tickets.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={11}
                    className="h-24 text-center text-muted-foreground"
                  >
                    No tickets found.
                  </TableCell>
                </TableRow>
              ) : (
                tickets.map((ticket: Ticket) => {
                  const yardDisplayName = getYardDisplayName(ticket, yards);
                  let yardType = ticket.yardType;

                  if (!yardType && ticket.yardId) {
                    const yardObj = yards.find(
                      (y) => y.id.toString() === ticket.yardId?.toString(),
                    );
                    if (yardObj) yardType = yardObj.yardType;
                  }

                  return (
                    <TableRow
                      key={ticket.id}
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => onViewDetails(ticket)}
                    >
                      <TableCell className="font-mono text-xs">
                        #{ticket.id}
                      </TableCell>
                      <TableCell>{getClientName(ticket)}</TableCell>
                      <TableCell>
                        {yardDisplayName ? (
                          <div className="flex flex-col gap-1">
                            <Badge
                              variant="outline"
                              className={getYardTypeColor(yardType)}
                            >
                              <div className="flex items-center gap-1">
                                {getYardTypeIcon(yardType)}
                                <span className="truncate max-w-37.5">
                                  {yardDisplayName}
                                </span>
                              </div>
                            </Badge>
                          </div>
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
                      <TableCell>{getClientPhone(ticket)}</TableCell>
                      <TableCell>
                        {getCampaign(ticket, campaigns) ? (
                          <Badge variant="outline">
                            {getCampaign(ticket, campaigns)}
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
                      <TableCell>
                        {ticket.assignedTo ? (
                          <div className="flex items-center gap-2">
                            <Avatar className="h-6 w-6">
                              <AvatarFallback className="text-xs">
                                {getAssigneeInitials(ticket.assignedTo)}
                              </AvatarFallback>
                            </Avatar>
                            <span className="text-sm">
                              {getAssigneeName(ticket.assignedTo)}
                            </span>
                          </div>
                        ) : (
                          <span className="text-sm text-muted-foreground">
                            Unassigned
                          </span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={getStatusBadgeColor(ticket.status)}
                        >
                          {formatEnumLabel(ticket.status)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {ticket.priority ? (
                          <Badge
                            variant="outline"
                            className={getPriorityColor(ticket.priority)}
                          >
                            {formatEnumLabel(ticket.priority)}
                          </Badge>
                        ) : (
                          <span className="text-sm text-muted-foreground">
                            -
                          </span>
                        )}
                      </TableCell>
                      <TableCell>
                        {new Date(ticket.createdAt).toLocaleDateString(
                          "en-US",
                          {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          },
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          {getDirectionIcon(ticket.direction || "inbound")}
                          <span className="text-xs">
                            {getDirectionText(
                              ticket.direction || "inbound",
                              (ticket as any).originalDirection,
                              ticket.agentId,
                            )}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        {ticket.phoneLine?.label ? (
                          <Badge
                            variant="outline"
                            className="text-xs font-normal whitespace-nowrap"
                          >
                            {ticket.phoneLine.label}
                          </Badge>
                        ) : (
                          <span className="text-muted-foreground text-xs">
                            —
                          </span>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Pagination */}
      {totalCount > 0 && (
        <div className="flex items-center justify-between px-2">
          <div className="flex items-center gap-2">
            <p className="text-sm text-muted-foreground">
              Showing{" "}
              {tickets.length ? (currentPage - 1) * itemsPerPage + 1 : 0} to{" "}
              {tickets.length
                ? (currentPage - 1) * itemsPerPage + tickets.length
                : 0}{" "}
              of {totalCount} tickets
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Select
              value={itemsPerPage.toString()}
              onValueChange={(value) => {
                onItemsPerPageChange(Number(value));
                onPageChange(1);
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
                onClick={() => onPageChange(1)}
                disabled={currentPage === 1}
              >
                First
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onPageChange(Math.max(currentPage - 1, 1))}
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
                  onPageChange(Math.min(currentPage + 1, totalPages))
                }
                disabled={currentPage === totalPages}
              >
                Next
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onPageChange(totalPages)}
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
