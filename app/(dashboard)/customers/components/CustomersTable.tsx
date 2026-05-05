// components/customers/CustomersTable.tsx
"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Checkbox } from "@/components/ui/checkbox";
import { Eye, Pencil, Trash2, Loader2 } from "lucide-react";
import { Customer } from "../types";
import { cn } from "@/lib/utils";

interface CustomersTableProps {
  loading: boolean;
  customers: Customer[];
  totalFiltered: number;
  selectedCustomers: number[];
  onSelectionChange: (ids: number[]) => void;
  onEdit?: (customer: Customer) => void;
  onDelete?: (customer: Customer) => void;
  onDetails?: (customer: Customer) => void;
  canManage?: boolean;
  search?: string;
  onSearchChange?: (value: string) => void;
  currentPage?: number;
  onPageChange?: (page: number) => void;
  itemsPerPage?: number;
  onItemsPerPageChange?: (n: number) => void;
  totalPages?: number;
}

const STATUS_CONFIG: Record<
  string,
  { label: string; dotColor: string; bgColor: string; textColor: string; borderColor: string }
> = {
  vip: {
    label: "VIP",
    dotColor: "bg-amber-400",
    bgColor: "bg-amber-50",
    textColor: "text-amber-700",
    borderColor: "border-amber-200",
  },
  active: {
    label: "Active",
    dotColor: "bg-emerald-500",
    bgColor: "bg-[#dcfce7]",
    textColor: "text-[#15803d]",
    borderColor: "border-[#bbf7d0]",
  },
  open_ticket: {
    label: "Open Ticket",
    dotColor: "bg-orange-400",
    bgColor: "bg-orange-50",
    textColor: "text-orange-700",
    borderColor: "border-orange-200",
  },
  lead: {
    label: "Lead",
    dotColor: "bg-slate-400",
    bgColor: "bg-slate-100",
    textColor: "text-slate-600",
    borderColor: "border-slate-200",
  },
};

function StatusPill({ customer }: { customer: Customer }) {
  const hasRecentActivity =
    customer.lastContactAt &&
    new Date(customer.lastContactAt) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const hasOpenTickets = (customer.ticketCount ?? 0) > 0;

  let key = "lead";
  if (customer.tags?.includes("vip")) key = "vip";
  else if (hasRecentActivity) key = "active";
  else if (hasOpenTickets) key = "open_ticket";

  const cfg = STATUS_CONFIG[key];
  return (
    <span
      className={`inline-flex items-center gap-2 px-3 py-[5px] rounded-full text-[12.5px] font-bold leading-none border ${cfg.bgColor} ${cfg.textColor} ${cfg.borderColor}`}
    >
      <span className={`w-[7px] h-[7px] rounded-full ${cfg.dotColor} shrink-0`} />
      {cfg.label}
    </span>
  );
}

export function CustomersTable({
  loading,
  customers,
  totalFiltered,
  selectedCustomers,
  onSelectionChange,
  onEdit,
  onDelete,
  onDetails,
  canManage = true,
  currentPage = 1,
  onPageChange,
  itemsPerPage = 10,
  totalPages = 1,
}: CustomersTableProps) {
  const getInitials = (name: string | null | undefined): string => {
    if (!name) return "?";
    return name.split(" ").map((n) => n[0]).join("").substring(0, 2).toUpperCase();
  };

  const handleSelectAll = () => {
    if (selectedCustomers.length === customers.length) {
      onSelectionChange([]);
    } else {
      onSelectionChange(customers.map((c) => c.id));
    }
  };

  const handleSelectOne = (customerId: number) => {
    if (selectedCustomers.includes(customerId)) {
      onSelectionChange(selectedCustomers.filter((id) => id !== customerId));
    } else {
      onSelectionChange([...selectedCustomers, customerId]);
    }
  };

  const allSelected = customers.length > 0 && selectedCustomers.length === customers.length;

  return (
    <div className="flex-1 flex flex-col gap-3">
      <div className="rounded-xl border border-border/80 overflow-hidden shadow-sm">
        <div className="max-h-[calc(100vh-12rem)] overflow-y-auto">
          <Table className="relative w-full table-fixed">
            <colgroup>
              <col className="w-[4%]" />
              <col className="w-[24%]" />
              <col className="w-[13%]" />
              <col className="w-[17%]" />
              <col className="w-[22%]" />
              <col className="w-[12%]" />
              <col className="w-[8%]" />
            </colgroup>

            <TableHeader className="bg-slate-50 sticky top-0 z-10 border-y border-slate-200 dark:bg-muted/40">
              <TableRow className="border-none hover:bg-transparent">
                <TableHead className="pl-4 h-11">
                  <Checkbox
                    checked={allSelected}
                    onCheckedChange={handleSelectAll}
                    className="border-slate-300 data-[state=checked]:bg-[#008f68] data-[state=checked]:border-[#008f68]"
                  />
                </TableHead>
                <TableHead className="pl-3 h-11 font-bold text-[11px] tracking-wider uppercase text-slate-500 dark:text-slate-400">
                  Customer
                </TableHead>
                <TableHead className="h-11 font-bold text-[11px] tracking-wider uppercase text-slate-500 dark:text-slate-400">
                  Status
                </TableHead>
                <TableHead className="h-11 font-bold text-[11px] tracking-wider uppercase text-slate-500 dark:text-slate-400">
                  Phone
                </TableHead>
                <TableHead className="h-11 font-bold text-[11px] tracking-wider uppercase text-slate-500 dark:text-slate-400">
                  Campaigns
                </TableHead>
                <TableHead className="h-11 font-bold text-[11px] tracking-wider uppercase text-slate-500 dark:text-slate-400">
                  Date
                </TableHead>
                <TableHead className="h-11 font-bold text-[11px] tracking-wider uppercase text-slate-500 dark:text-slate-400 text-right pr-4">
                  Actions
                </TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={7} className="h-24 text-center">
                    <div className="flex items-center justify-center gap-2 text-slate-500 text-sm">
                      <Loader2 className="h-5 w-5 animate-spin" />
                      Loading customers...
                    </div>
                  </TableCell>
                </TableRow>
              ) : customers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="h-24 text-center text-sm text-muted-foreground">
                    No customers found.
                  </TableCell>
                </TableRow>
              ) : (
                customers.map((customer, i) => (
                  <TableRow
                    key={customer.id}
                    className={cn(
                      "cursor-pointer group hover:bg-[#f0faf5]/60 dark:hover:bg-muted/50 border-b border-border/70 transition-all duration-150",
                      i % 2 === 1 ? "bg-slate-50/60 dark:bg-muted/20" : "bg-white dark:bg-card"
                    )}
                    onClick={() => onDetails?.(customer)}
                  >
                    <TableCell className="pl-4 py-3" onClick={(e) => e.stopPropagation()}>
                      <Checkbox
                        checked={selectedCustomers.includes(customer.id)}
                        onCheckedChange={() => handleSelectOne(customer.id)}
                        className="border-slate-300 data-[state=checked]:bg-[#008f68] data-[state=checked]:border-[#008f68]"
                      />
                    </TableCell>

                    <TableCell className="pl-3 py-3">
                      <div className="flex items-center gap-2.5">
                        <Avatar className="h-8 w-8 shrink-0 rounded-full">
                          <AvatarFallback
                            className="text-[12px] font-bold rounded-full"
                            style={{ background: "transparent", border: "1px solid #d1d5db", color: "#111827" }}
                          >
                            {getInitials(customer.name)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="min-w-0">
                          <div className="font-bold text-[14px] leading-tight truncate text-foreground">
                            {customer.name || "Unknown"}
                          </div>
                        </div>
                      </div>
                    </TableCell>

                    <TableCell className="py-3">
                      <StatusPill customer={customer} />
                    </TableCell>

                    <TableCell className="py-3">
                      {customer.phone ? (
                        <span className="font-mono text-[13.5px] text-slate-600 dark:text-slate-300 font-medium">
                          {customer.phone}
                        </span>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </TableCell>

                    <TableCell className="py-3">
                      {customer.campaigns && customer.campaigns.length > 0 ? (
                        <div className="flex flex-wrap gap-1.5">
                          {customer.campaigns.slice(0, 2).map((campaign) => (
                            <span
                              key={campaign.id}
                              className="inline-flex items-center px-2 py-px rounded-full bg-amber-100 text-amber-700 border border-amber-200 text-[11.5px] font-medium"
                            >
                              {campaign.nombre}
                            </span>
                          ))}
                          {customer.campaigns.length > 2 && (
                            <span className="inline-flex items-center px-2 py-px rounded-full bg-slate-100 text-slate-500 border border-slate-200 text-[11.5px] font-medium">
                              +{customer.campaigns.length - 2}
                            </span>
                          )}
                        </div>
                      ) : (
                        <span className="inline-flex items-center px-2 py-px rounded-full bg-amber-100 text-amber-700 border border-amber-200 text-[11.5px] font-medium">
                          Unassigned
                        </span>
                      )}
                    </TableCell>

                    <TableCell className="py-3">
                      {customer.createdAt ? (
                        <span className="font-mono text-[13px] text-slate-500 dark:text-slate-400 font-medium">
                          {new Date(customer.createdAt).toLocaleDateString()}
                        </span>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </TableCell>

                    <TableCell className="py-3 text-right pr-4" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground hover:bg-[#f0faf5] hover:text-[#008f68]"
                          title="View details"
                          onClick={() => onDetails?.(customer)}
                        >
                          <Eye className="h-4 w-4 pointer-events-none" />
                        </Button>
                        {canManage && onEdit && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-muted-foreground hover:bg-amber-50 hover:text-amber-600"
                            title="Edit customer"
                            onClick={() => onEdit(customer)}
                          >
                            <Pencil className="h-4 w-4 pointer-events-none" />
                          </Button>
                        )}
                        {canManage && onDelete && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-muted-foreground hover:bg-red-50 hover:text-red-600"
                            title="Delete customer"
                            onClick={() => onDelete(customer)}
                          >
                            <Trash2 className="h-4 w-4 pointer-events-none" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {totalFiltered > 0 && onPageChange && (
        <div className="flex items-center justify-between pt-4 pb-2 px-1">
          <Button
            variant="outline"
            className="h-[36px] px-3.5 rounded-[10px] text-[13px] font-medium text-muted-foreground shadow-sm hover:text-foreground border-border"
            onClick={(e) => { e.stopPropagation(); onPageChange(Math.max(currentPage - 1, 1)); }}
            disabled={currentPage === 1}
          >
            <svg className="mr-2 h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
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
                  onClick={(e) => { e.stopPropagation(); onPageChange(pageNum); }}
                  className={cn(
                    "flex h-[36px] w-[36px] items-center justify-center rounded-[10px] text-[13px] transition-colors",
                    active
                      ? "bg-[#e2fae9] text-[#008f68] border border-[#a6f0c3] font-semibold"
                      : "text-muted-foreground font-medium hover:bg-muted/50 border border-transparent"
                  )}
                >
                  {pageNum}
                </button>
              );
            })}
          </div>

          <Button
            variant="outline"
            className="h-[36px] px-3.5 rounded-[10px] text-[13px] font-medium text-muted-foreground shadow-sm hover:text-foreground border-border"
            onClick={(e) => { e.stopPropagation(); onPageChange(Math.min(currentPage + 1, totalPages)); }}
            disabled={currentPage >= totalPages}
          >
            Next
            <svg className="ml-2 h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M5 12h14M12 5l7 7-7 7" />
            </svg>
          </Button>
        </div>
      )}
    </div>
  );
}
