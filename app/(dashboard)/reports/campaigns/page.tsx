"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CampaignReportView } from "./Components/CampaignReportView";
import { CampaignFiltersSheet } from "./Components/CampaignFiltersSheet";
import { toast } from "@/hooks/use-toast";
import { fetchFromBackend, fetchBlobFromBackend } from "@/lib/api-client";
import {
  FileText,
  Download,
  Users,
  PhoneMissed,
  CheckCircle2,
  CreditCard,
  Search,
  Filter,
  XCircle,
  Ban,
  PhoneOff,
  BadgeDollarSign,
  ReceiptText,
  MoveRight,
  FileSpreadsheet,
  Phone,
  Ticket,
  ClipboardList,
  Clock,
  AlertCircle,
  SlidersHorizontal,
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

// ═══════════════════════════════════════════════════════════════════════════════
// TYPES - Aligned with backend CampaignFullReport
// ═══════════════════════════════════════════════════════════════════════════════

type Campaign = {
  id: number;
  nombre: string;
  yarda?: { name?: string | null } | null;
  isActive?: boolean;
  tipo?: string;
  createdAt?: string;
};

type KvPair = {
  label: string;
  count: number;
};

type CallsModuleStats = {
  total: number;
  inbound: number;
  outbound: number;
  missed: number;
  voicemail: number;
  answered: number;
  avgDurationSec: number;
  totalDurationSec: number;
  withNotes: number;
  withFollowUp: number;
  withRecording: number;
  withVoicemail: number;
  dispositionBreakdown: KvPair[];
  campaignOptionBreakdown: KvPair[];
  topAgent: string;
  agentBreakdown: KvPair[];
};

type TicketsModuleStats = {
  total: number;
  open: number;
  closed: number;
  pendingFollowUp: number;
  overdue: number;
  highPriority: number;
  mediumPriority: number;
  lowPriority: number;
  withFollowUp: number;
  withCampaignOption: number;
  withAttachments: number;
  withIssueDetail: number;
  campaignOptionBreakdown: KvPair[];
  priorityBreakdown: KvPair[];
  statusBreakdown: KvPair[];
  topAssignee: string;
  agentBreakdown: KvPair[];
};

type ManualRecordsModuleStats = {
  total: number;
  withNotes: number;
  withDisposition: number;
  withCampaignOption: number;
  campaignOptionBreakdown: KvPair[];
  dispositionBreakdown: KvPair[];
};

type CustomerCallSummary = {
  callCount: number;
  inbound: number;
  outbound: number;
  missed: number;
  totalDurationSec: number;
  avgDurationSec: number;
  lastCallDate: string;
  lastDirection: string;
  lastAgentName: string;
  lastDisposition: string;
  lastNotes: string;
  hasFollowUp: boolean;
  followUpDate: string;
  hasRecording: boolean;
};

type CustomerTicketEntry = {
  ticketId: number;
  ticketLabel: string;
  status: string;
  priority: string;
  campaignOption: string;
  issueSnippet: string;
  agentName: string;
  createdAt: string;
  hasFollowUp: boolean;
};

type CustomerManualEntry = {
  id: number;
  campaignOption: string;
  disposition: string;
  notes: string;
  createdAt: string;
};

type MatrixCustomerRow = {
  customerId?: number;
  name: string;
  phone: string;
  finalStatus: string;
  calls: CustomerCallSummary;
  tickets: CustomerTicketEntry[];
  manualRecords: CustomerManualEntry[];
  lastActivityDate: string;
};

type CampaignFullReport = {
  campaign: {
    id: number;
    nombre: string;
    yardaName: string | null;
    tipo: string;
  };
  range: { startDate: string; endDate: string };
  isAr: boolean;
  callsStats: CallsModuleStats;
  ticketsStats: TicketsModuleStats;
  manualRecordsStats: ManualRecordsModuleStats;
  statusBreakdown: KvPair[];
  tables: { title: string; rows: MatrixCustomerRow[] }[];
  totals: { customers: number; calls: number; tickets: number; manualRecords: number };
};

// ═══════════════════════════════════════════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════════════════════════════════════════

const STATUS_COLORS: Record<string, { bg: string; text: string; border: string; icon: React.ReactNode }> = {
  Paid: { bg: "bg-green-50 dark:bg-green-950/30", text: "text-green-700 dark:text-green-400", border: "border-green-200 dark:border-green-800", icon: <CheckCircle2 className="h-3 w-3" /> },
  "Not Paid": { bg: "bg-red-50 dark:bg-red-950/30", text: "text-red-700 dark:text-red-400", border: "border-red-200 dark:border-red-800", icon: <XCircle className="h-3 w-3" /> },
  "Offline Payment": { bg: "bg-amber-50 dark:bg-amber-950/30", text: "text-amber-700 dark:text-amber-400", border: "border-amber-200 dark:border-amber-800", icon: <ReceiptText className="h-3 w-3" /> },
  "Not Paid Check": { bg: "bg-amber-50 dark:bg-amber-950/30", text: "text-amber-700 dark:text-amber-400", border: "border-amber-200 dark:border-amber-800", icon: <FileText className="h-3 w-3" /> },
  "Moved Out": { bg: "bg-orange-50 dark:bg-orange-950/30", text: "text-orange-700 dark:text-orange-400", border: "border-orange-200 dark:border-orange-800", icon: <MoveRight className="h-3 w-3" /> },
  Canceled: { bg: "bg-rose-50 dark:bg-rose-950/30", text: "text-rose-700 dark:text-rose-400", border: "border-rose-200 dark:border-rose-800", icon: <Ban className="h-3 w-3" /> },
  "Balance 0": { bg: "bg-teal-50 dark:bg-teal-950/30", text: "text-teal-700 dark:text-teal-400", border: "border-teal-200 dark:border-teal-800", icon: <BadgeDollarSign className="h-3 w-3" /> },
  "Do Not Call": { bg: "bg-red-50 dark:bg-red-950/30", text: "text-red-700 dark:text-red-400", border: "border-red-200 dark:border-red-800", icon: <PhoneOff className="h-3 w-3" /> },
  Registered: { bg: "bg-green-50 dark:bg-green-950/30", text: "text-green-700 dark:text-green-400", border: "border-green-200 dark:border-green-800", icon: <CheckCircle2 className="h-3 w-3" /> },
  "Not Registered": { bg: "bg-red-50 dark:bg-red-950/30", text: "text-red-700 dark:text-red-400", border: "border-red-200 dark:border-red-800", icon: <XCircle className="h-3 w-3" /> },
  "Paid with LL": { bg: "bg-cyan-50 dark:bg-cyan-950/30", text: "text-cyan-700 dark:text-cyan-400", border: "border-cyan-200 dark:border-cyan-800", icon: <CreditCard className="h-3 w-3" /> },
  Unknown: { bg: "bg-slate-100 dark:bg-slate-800", text: "text-slate-700 dark:text-slate-300", border: "border-slate-200 dark:border-slate-700", icon: <AlertCircle className="h-3 w-3" /> },
  Unspecified: { bg: "bg-slate-100 dark:bg-slate-800", text: "text-slate-700 dark:text-slate-300", border: "border-slate-200 dark:border-slate-700", icon: <AlertCircle className="h-3 w-3" /> },
};

const DIRECTION_COLORS: Record<string, { bg: string; text: string; border: string; icon: React.ReactNode; label: string }> = {
  Inbound: { bg: "bg-blue-50 dark:bg-blue-950/30", text: "text-blue-700 dark:text-blue-400", border: "border-blue-200 dark:border-blue-800", icon: <PhoneMissed className="h-3 w-3 rotate-180" />, label: "Inbound" },
  Outbound: { bg: "bg-emerald-50 dark:bg-emerald-950/30", text: "text-emerald-700 dark:text-emerald-400", border: "border-emerald-200 dark:border-emerald-800", icon: <PhoneMissed className="h-3 w-3" />, label: "Outbound" },
  Missed: { bg: "bg-red-50 dark:bg-red-950/30", text: "text-red-700 dark:text-red-400", border: "border-red-200 dark:border-red-800", icon: <PhoneOff className="h-3 w-3" />, label: "Missed" },
  Voicemail: { bg: "bg-amber-50 dark:bg-amber-950/30", text: "text-amber-700 dark:text-amber-400", border: "border-amber-200 dark:border-amber-800", icon: <Phone className="h-3 w-3" />, label: "Voicemail" },
};

const TICKET_STATUS_COLORS: Record<string, { bg: string; text: string }> = {
  OPEN: { bg: "bg-blue-100 dark:bg-blue-900/30", text: "text-blue-700 dark:text-blue-400" },
  IN_PROGRESS: { bg: "bg-sky-100 dark:bg-sky-900/30", text: "text-sky-700 dark:text-sky-400" },
  PENDING_FOLLOWUP: { bg: "bg-amber-100 dark:bg-amber-900/30", text: "text-amber-700 dark:text-amber-400" },
  OVERDUE: { bg: "bg-red-100 dark:bg-red-900/30", text: "text-red-700 dark:text-red-400" },
  RESOLVED: { bg: "bg-green-100 dark:bg-green-900/30", text: "text-green-700 dark:text-green-400" },
  CLOSED: { bg: "bg-green-50 dark:bg-green-900/20", text: "text-green-600 dark:text-green-400" },
};

const PRIORITY_COLORS: Record<string, { bg: string; text: string }> = {
  HIGH: { bg: "bg-red-100 dark:bg-red-900/30", text: "text-red-700 dark:text-red-400" },
  MEDIUM: { bg: "bg-amber-100 dark:bg-amber-900/30", text: "text-amber-700 dark:text-amber-400" },
  LOW: { bg: "bg-green-100 dark:bg-green-900/30", text: "text-green-700 dark:text-green-400" },
  EMERGENCY: { bg: "bg-pink-100 dark:bg-pink-900/30", text: "text-pink-700 dark:text-pink-400" },
};

// ═══════════════════════════════════════════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════════════════════════════════════════

const formatDate = (iso: string | null | undefined): string => {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  } catch {
    return iso;
  }
};

const formatDuration = (seconds: number): string => {
  if (!seconds || seconds <= 0) return "—";
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) return `${h}h ${m}m ${s}s`;
  if (m > 0) return `${m}m ${s}s`;
  return `${s}s`;
};

// ═══════════════════════════════════════════════════════════════════════════════
// METRIC CARD
// ═══════════════════════════════════════════════════════════════════════════════

const MetricCard = ({
  title,
  value,
  icon,
  color,
  subtitle,
}: {
  title: string;
  value: number;
  icon?: React.ReactNode;
  color?: string;
  subtitle?: string;
}) => (
  <div className="relative overflow-hidden rounded-xl border bg-card p-6 shadow-sm transition-all hover:shadow-md">
    <div className="flex items-center justify-between space-y-0 pb-2">
      <p className="text-sm font-medium text-muted-foreground">{title}</p>
      {icon && (
        <div className={cn("rounded-full p-2 bg-opacity-10", color)}>{icon}</div>
      )}
    </div>
    <div className="flex items-baseline gap-2">
      <div className="text-3xl font-bold tracking-tight text-black dark:text-white">{value}</div>
      {subtitle && (
        <span className="text-xs text-muted-foreground">{subtitle}</span>
      )}
    </div>
  </div>
);

// ═══════════════════════════════════════════════════════════════════════════════
// CUSTOMER TABLE
// ═══════════════════════════════════════════════════════════════════════════════

const CustomerTable = ({
  title,
  rows,
  campaignId,
  startDate,
  endDate,
}: {
  title: string;
  rows: MatrixCustomerRow[];
  campaignId: number | null;
  startDate: string;
  endDate: string;
}) => {
  const router = useRouter();
  const [tableSearch, setTableSearch] = useState("");
  const [expandedRow, setExpandedRow] = useState<string | null>(null);

  const statusStyle = STATUS_COLORS[title] || STATUS_COLORS["Unknown"];
  const normalizedSearch = tableSearch.trim().toLowerCase();

  const filteredRows = useMemo(() => {
    if (!normalizedSearch) return rows;
    return rows.filter((row) => {
      const searchable = [
        row.name,
        row.phone,
        row.finalStatus,
        row.calls?.lastDirection,
        row.calls?.lastDisposition,
        row.calls?.lastAgentName,
        row.customerId?.toString(),
        ...row.tickets.map((t) => `${t.ticketLabel} ${t.status} ${t.agentName}`),
        ...row.manualRecords.map((m) => `${m.disposition} ${m.notes}`),
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return searchable.includes(normalizedSearch);
    });
  }, [rows, normalizedSearch]);

  const buildBaseUrl = (customerId: number, tab: string) => {
    const params = new URLSearchParams({
      customerId: customerId.toString(),
      tab,
      fromReport: "campaign",
    });
    if (campaignId) params.set("campaignId", campaignId.toString());
    if (startDate) params.set("reportStartDate", startDate);
    if (endDate) params.set("reportEndDate", endDate);
    return `/calls?${params.toString()}`;
  };

  const handleCallClick = (e: React.MouseEvent, row: MatrixCustomerRow) => {
    e.stopPropagation();
    if (!row.customerId) return;
    router.push(buildBaseUrl(row.customerId, "calls"));
  };

  const handleTicketClick = (e: React.MouseEvent, ticketId: number) => {
    e.stopPropagation();
    router.push(`/calls?id=${ticketId}&fromReport=campaign&tab=tickets`);
  };

  const handleManualRecordClick = (e: React.MouseEvent, row: MatrixCustomerRow) => {
    e.stopPropagation();
    if (!row.customerId) return;
    router.push(buildBaseUrl(row.customerId, "manual-records"));
  };

  return (
    <div className="flex flex-col gap-3 rounded-xl border bg-card text-card-foreground shadow-sm">
      <div className="border-b px-6 py-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <h3 className="font-semibold leading-none tracking-tight flex items-center gap-2">
              <span className={statusStyle.text}>{statusStyle.icon}</span>
              {title}
            </h3>
            <p className="text-sm text-muted-foreground mt-1">
              {rows.length} {rows.length === 1 ? "customer" : "customers"}
              {normalizedSearch && (
                <span className="ml-1">· {filteredRows.length} filtered</span>
              )}
            </p>
          </div>
          <div className="relative w-full lg:w-80 lg:shrink-0">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={tableSearch}
              onChange={(e) => setTableSearch(e.target.value)}
              placeholder={`Search ${title.toLowerCase()}...`}
              className="h-9 pl-9"
            />
          </div>
        </div>
      </div>

      <div className="w-full overflow-x-auto">
        <div className="min-w-[800px] align-middle">
          <div className="grid grid-cols-12 bg-muted/50 text-xs font-semibold uppercase tracking-wider text-muted-foreground border-y">
            <div className="col-span-2 px-4 py-3">Customer</div>
            <div className="col-span-2 px-4 py-3">Calls</div>
            <div className="col-span-1 px-4 py-3">Last Call</div>
            <div className="col-span-3 px-4 py-3">Tickets</div>
            <div className="col-span-2 px-4 py-3">Manual Records</div>
            <div className="col-span-2 px-4 py-3">Last Activity</div>
          </div>

          <div className="divide-y">
            {filteredRows.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center text-sm text-muted-foreground">
                <Users className="h-8 w-8 mb-2 opacity-20" />
                {normalizedSearch
                  ? "No matching customers in this table."
                  : "No customer data available for this section."}
              </div>
            ) : (
              filteredRows.map((row, index) => {
                const directionStyle = DIRECTION_COLORS[row.calls?.lastDirection] || DIRECTION_COLORS["Missed"];
                const rowKey = `${title}-${row.customerId || row.phone}-${index}`;

                return (
                  <div key={rowKey} className="grid grid-cols-12 text-sm divide-x">
                    <div className="col-span-2 px-4 py-3">
                      <div className="font-medium truncate" title={row.name}>{row.name}</div>
                      <div className="text-xs text-muted-foreground truncate">{row.phone || "—"}</div>
                    </div>

                    <div
                      className="col-span-2 px-4 py-3 hover:bg-blue-50/60 dark:hover:bg-blue-950/20 transition-colors cursor-pointer group"
                      onClick={(e) => handleCallClick(e, row)}
                    >
                      <div className="flex items-center gap-2">
                        <span className="inline-flex items-center justify-center rounded-full border px-2.5 py-0.5 text-xs font-bold bg-blue-500/10 text-blue-700 group-hover:bg-blue-500/20">
                          {row.calls?.callCount || 0}x
                        </span>
                        {row.calls?.inbound > 0 && <span className="text-xs text-blue-600">In:{row.calls.inbound}</span>}
                        {row.calls?.outbound > 0 && <span className="text-xs text-emerald-600">Out:{row.calls.outbound}</span>}
                        {row.calls?.missed > 0 && <span className="text-xs text-red-600">Miss:{row.calls.missed}</span>}
                      </div>
                      {row.calls?.totalDurationSec > 0 && (
                        <div className="text-xs text-muted-foreground mt-1">Talk: {formatDuration(row.calls.totalDurationSec)}</div>
                      )}
                    </div>

                    <div
                      className="col-span-1 px-4 py-3 hover:bg-blue-50/60 dark:hover:bg-blue-950/20 transition-colors cursor-pointer"
                      onClick={(e) => handleCallClick(e, row)}
                    >
                      <span className={cn("inline-flex items-center gap-1 rounded-md border px-2 py-1 text-xs font-semibold", directionStyle.bg, directionStyle.text, directionStyle.border)}>
                        {directionStyle.icon}
                        {directionStyle.label}
                      </span>
                      {row.calls?.lastCallDate && (
                        <div className="text-xs text-muted-foreground mt-1">{formatDate(row.calls.lastCallDate)}</div>
                      )}
                    </div>

                    <div className="col-span-3 px-4 py-3">
                      {row.tickets.length === 0 ? (
                        <span className="text-xs text-muted-foreground italic">No tickets</span>
                      ) : (
                        <div className="space-y-1.5 max-h-24 overflow-y-auto">
                          {row.tickets.slice(0, 3).map((ticket) => {
                            const tStatusStyle = TICKET_STATUS_COLORS[ticket.status] || { bg: "bg-slate-100", text: "text-slate-700" };
                            const tPriorityStyle = PRIORITY_COLORS[ticket.priority] || { bg: "bg-slate-100", text: "text-slate-700" };
                            return (
                              <div
                                key={ticket.ticketId}
                                className="flex items-center gap-1.5 flex-wrap cursor-pointer hover:opacity-80 transition-opacity"
                                onClick={(e) => handleTicketClick(e, ticket.ticketId)}
                              >
                                <Badge variant="outline" className="font-mono text-xs hover:bg-slate-100">{ticket.ticketLabel}</Badge>
                                <span className={cn("text-xs px-1.5 py-0.5 rounded font-medium", tStatusStyle.bg, tStatusStyle.text)}>
                                  {ticket.status.replace(/_/g, " ")}
                                </span>
                                {ticket.priority && (
                                  <span className={cn("text-xs px-1.5 py-0.5 rounded font-medium", tPriorityStyle.bg, tPriorityStyle.text)}>
                                    {ticket.priority}
                                  </span>
                                )}
                              </div>
                            );
                          })}
                          {row.tickets.length > 3 && (
                            <div className="text-xs text-muted-foreground">+{row.tickets.length - 3} more</div>
                          )}
                        </div>
                      )}
                    </div>

                    <div
                      className="col-span-2 px-4 py-3 hover:bg-purple-50/60 dark:hover:bg-purple-950/20 transition-colors cursor-pointer"
                      onClick={(e) => handleManualRecordClick(e, row)}
                    >
                      {row.manualRecords.length === 0 ? (
                        <span className="text-xs text-muted-foreground italic">No records</span>
                      ) : (
                        <div className="space-y-1.5 max-h-24 overflow-y-auto">
                          {row.manualRecords.slice(0, 2).map((record) => (
                            <div key={record.id} className="text-xs">
                              {record.disposition && (
                                <Badge variant="secondary" className="text-xs mr-1">
                                  {record.disposition.replace(/_/g, " ")}
                                </Badge>
                              )}
                              {record.notes && (
                                <span className="text-muted-foreground truncate block">{record.notes.slice(0, 60)}</span>
                              )}
                              <span className="text-muted-foreground">{formatDate(record.createdAt)}</span>
                            </div>
                          ))}
                          {row.manualRecords.length > 2 && (
                            <div className="text-xs text-muted-foreground">+{row.manualRecords.length - 2} more</div>
                          )}
                        </div>
                      )}
                    </div>

                    <div className="col-span-2 px-4 py-3">
                      <div className="text-xs flex items-center gap-1">
                        <Clock className="h-3 w-3 text-muted-foreground" />
                        {formatDate(row.lastActivityDate)}
                      </div>
                      {row.calls?.hasFollowUp && (
                        <div className="text-xs text-amber-600 font-medium mt-1">
                          Follow-up: {formatDate(row.calls.followUpDate)}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// MODULE PANELS
// ═══════════════════════════════════════════════════════════════════════════════

const ModulePanels = ({ report }: { report: CampaignFullReport }) => {
  const { callsStats, ticketsStats, manualRecordsStats } = report;

  return (
    <div className="grid gap-4 md:grid-cols-3">
      <div className="rounded-xl border bg-card shadow-sm">
        <div className="border-b px-6 py-4 bg-blue-50/50 dark:bg-blue-950/20">
          <h3 className="font-semibold text-blue-700 dark:text-blue-400 flex items-center gap-2">
            <Phone className="h-4 w-4" />
            Calls
          </h3>
          <p className="text-2xl font-bold mt-1">{callsStats.total}</p>
        </div>
        <div className="p-4 space-y-3">
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-blue-500"></span><span>Inbound: <strong>{callsStats.inbound}</strong></span></div>
            <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-emerald-500"></span><span>Outbound: <strong>{callsStats.outbound}</strong></span></div>
            <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-red-500"></span><span>Missed: <strong>{callsStats.missed}</strong></span></div>
            <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-amber-500"></span><span>Voicemail: <strong>{callsStats.voicemail}</strong></span></div>
          </div>
          <div className="text-xs text-muted-foreground border-t pt-2">
            <p>Avg Duration: {formatDuration(callsStats.avgDurationSec)}</p>
            <p>Total Talk: {formatDuration(callsStats.totalDurationSec)}</p>
            <p>With Notes: {callsStats.withNotes} · Follow-up: {callsStats.withFollowUp}</p>
            <p>Top Agent: {callsStats.topAgent}</p>
          </div>
        </div>
      </div>

      <div className="rounded-xl border bg-card shadow-sm">
        <div className="border-b px-6 py-4 bg-emerald-50/50 dark:bg-emerald-950/20">
          <h3 className="font-semibold text-emerald-700 dark:text-emerald-400 flex items-center gap-2">
            <Ticket className="h-4 w-4" />
            Tickets
          </h3>
          <p className="text-2xl font-bold mt-1">{ticketsStats.total}</p>
        </div>
        <div className="p-4 space-y-3">
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div><span className="text-blue-600">●</span> Open: <strong>{ticketsStats.open}</strong></div>
            <div><span className="text-green-600">●</span> Closed: <strong>{ticketsStats.closed}</strong></div>
            <div><span className="text-amber-600">●</span> Pending: <strong>{ticketsStats.pendingFollowUp}</strong></div>
            <div><span className="text-red-600">●</span> Overdue: <strong>{ticketsStats.overdue}</strong></div>
          </div>
          <div className="text-xs text-muted-foreground border-t pt-2">
            <p>High Priority: {ticketsStats.highPriority} · Medium: {ticketsStats.mediumPriority} · Low: {ticketsStats.lowPriority}</p>
            <p>With Follow-up: {ticketsStats.withFollowUp} · Attachments: {ticketsStats.withAttachments}</p>
            <p>Top Assignee: {ticketsStats.topAssignee}</p>
          </div>
        </div>
      </div>

      <div className="rounded-xl border bg-card shadow-sm">
        <div className="border-b px-6 py-4 bg-purple-50/50 dark:bg-purple-950/20">
          <h3 className="font-semibold text-purple-700 dark:text-purple-400 flex items-center gap-2">
            <ClipboardList className="h-4 w-4" />
            Manual Records
          </h3>
          <p className="text-2xl font-bold mt-1">{manualRecordsStats.total}</p>
        </div>
        <div className="p-4 space-y-3">
          <div className="text-sm space-y-1">
            <p>With Notes: <strong>{manualRecordsStats.withNotes}</strong></p>
            <p>With Disposition: <strong>{manualRecordsStats.withDisposition}</strong></p>
            <p>With Campaign Option: <strong>{manualRecordsStats.withCampaignOption}</strong></p>
          </div>
          {manualRecordsStats.dispositionBreakdown.length > 0 && (
            <div className="text-xs text-muted-foreground border-t pt-2">
              <p className="font-medium mb-1">Top Dispositions:</p>
              {manualRecordsStats.dispositionBreakdown.slice(0, 3).map((d) => (
                <p key={d.label}>{d.label.replace(/_/g, " ")}: {d.count}</p>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// OUTCOME SECTION
// ═══════════════════════════════════════════════════════════════════════════════

const OutcomeSection = ({ statusBreakdown, totals }: { statusBreakdown: KvPair[]; totals: CampaignFullReport["totals"] }) => {
  const items = statusBreakdown.filter((s) => s.count > 0);
  if (items.length === 0) return null;

  return (
    <div className="rounded-xl border bg-card shadow-sm">
      <div className="border-b px-6 py-4">
        <h3 className="font-semibold flex items-center gap-2">
          <CreditCard className="h-4 w-4" />
          Campaign Outcome
        </h3>
        <p className="text-sm text-muted-foreground mt-1">{totals.customers} customers resolved</p>
      </div>
      <div className="p-4">
        <div className="flex flex-wrap gap-3">
          {items.map((item) => {
            const style = STATUS_COLORS[item.label] || STATUS_COLORS["Unknown"];
            const pct = totals.customers > 0 ? Math.round((item.count / totals.customers) * 100) : 0;
            return (
              <div key={item.label} className={cn("flex items-center gap-2 rounded-lg border px-4 py-3", style.bg, style.border)}>
                <span className={style.text}>{style.icon}</span>
                <div>
                  <div className={cn("text-lg font-bold", style.text)}>{item.count}</div>
                  <div className="text-xs text-muted-foreground">{item.label} ({pct}%)</div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN PAGE
// ═══════════════════════════════════════════════════════════════════════════════

export default function CampaignReportsPage() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const campaignIdParam = searchParams.get("campaignId");
  const startDateParam = searchParams.get("startDate");
  const endDateParam = searchParams.get("endDate");

  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loadingCampaigns, setLoadingCampaigns] = useState(false);
  const [selectedCampaignId, setSelectedCampaignId] = useState<string>(campaignIdParam || "");
  const [campaignOpen, setCampaignOpen] = useState(false);
  const [startDate, setStartDate] = useState(startDateParam || "");
  const [endDate, setEndDate] = useState(endDateParam || "");
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState<CampaignFullReport | null>(null);

  const isDateRangeValid = useMemo(() => {
    if (!startDate || !endDate) return true;
    return new Date(startDate) <= new Date(endDate);
  }, [startDate, endDate]);

  const selectedCampaign = useMemo(
    () => campaigns.find((c) => c.id.toString() === selectedCampaignId) || null,
    [campaigns, selectedCampaignId],
  );

  // Fetch campaigns list
  useEffect(() => {
    const fetchCampaigns = async () => {
      try {
        setLoadingCampaigns(true);
        const data = await fetchFromBackend("/campaign?page=1&limit=500");
        const items = Array.isArray(data) ? data : data?.data || [];
        setCampaigns(items);
      } catch (error: any) {
        let errorMessage = "Failed to load campaigns";
        if (error?.message?.includes("fetch failed") || error?.message?.includes("Failed to fetch")) {
          errorMessage = "Cannot connect to backend server.";
        } else if (error?.status === 401) {
          errorMessage = "Session expired. Please login again.";
        } else if (error?.message) {
          errorMessage = error.message;
        }
        toast({ title: "Error", description: errorMessage, variant: "destructive" });
      } finally {
        setLoadingCampaigns(false);
      }
    };
    fetchCampaigns();
  }, []);

  // Sync URL params → local state
  useEffect(() => {
    if (campaignIdParam) setSelectedCampaignId(campaignIdParam);
  }, [campaignIdParam]);

  useEffect(() => {
    if (startDateParam) setStartDate(decodeURIComponent(startDateParam));
  }, [startDateParam]);

  useEffect(() => {
    if (endDateParam) setEndDate(decodeURIComponent(endDateParam));
  }, [endDateParam]);

  // Fetch report when URL params change
  useEffect(() => {
    if (!campaignIdParam || !startDateParam || !endDateParam) {
      setReport(null);
      return;
    }

    let cancelled = false;

    const fetchReport = async () => {
      try {
        setLoading(true);
        setReport(null);
        const params = new URLSearchParams({
          startDate: decodeURIComponent(startDateParam),
          endDate: decodeURIComponent(endDateParam),
        });
        const response: CampaignFullReport = await fetchFromBackend(
          `/campaign/${campaignIdParam}/report?${params.toString()}`,
        );
        if (cancelled) return;
        if (!response) throw new Error("No data from backend");
        setReport(response);
      } catch (error: any) {
        if (cancelled) return;
        toast({
          title: "Error",
          description: error.message || "Failed to generate report.",
          variant: "destructive",
        });
        setReport(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchReport();
    return () => { cancelled = true; };
  }, [campaignIdParam, startDateParam, endDateParam]);

  const handleCampaignSelect = (campaignId: string) => {
    setSelectedCampaignId(campaignId);
    setCampaignOpen(false);
  };

  const applyFilters = () => {
    if (!selectedCampaignId) {
      toast({ title: "Select a campaign", description: "You must select a campaign.", variant: "destructive" });
      setFiltersOpen(true);
      return;
    }
    if (!startDate || !endDate) {
      toast({ title: "Date range required", description: "Select start and end date before applying filters.", variant: "destructive" });
      setFiltersOpen(true);
      return;
    }
    if (!isDateRangeValid) {
      toast({ title: "Invalid date range", description: "Start date cannot be later than end date.", variant: "destructive" });
      setFiltersOpen(true);
      return;
    }

    const params = new URLSearchParams();
    params.set("campaignId", selectedCampaignId);
    params.set("startDate", startDate);
    params.set("endDate", endDate);
    router.push(`/reports/campaigns?${params.toString()}`);
    setFiltersOpen(false);
  };

  const exportPdfBackend = async () => {
    if (!report || !campaignIdParam || !startDateParam || !endDateParam) return;
    try {
      const logoUrl = typeof window !== "undefined"
        ? `${window.location.origin}/images/logo.jpeg`
        : "/images/logo.jpeg";
      const params = new URLSearchParams({
        startDate: decodeURIComponent(startDateParam),
        endDate: decodeURIComponent(endDateParam),
        logoUrl,
      });
      const blob = await fetchBlobFromBackend(
        `/campaign/${campaignIdParam}/report/pdf?${params.toString()}`,
        { method: "GET" },
      );
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `campaign_report_${campaignIdParam}.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error: any) {
      toast({ title: "Error", description: error.message || "Failed to download PDF", variant: "destructive" });
    }
  };

  const exportExcelBackend = async () => {
    if (!report || !campaignIdParam || !startDateParam || !endDateParam) return;
    try {
      const start = decodeURIComponent(startDateParam);
      const end = decodeURIComponent(endDateParam);
      const params = new URLSearchParams({ startDate: start, endDate: end });
      const blob = await fetchBlobFromBackend(
        `/campaign/${campaignIdParam}/report/excel?${params.toString()}`,
        { method: "GET" },
      );
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `campaign_report_${campaignIdParam}_${start}_to_${end}.xlsx`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      toast({ title: "Success", description: "Excel file downloaded successfully." });
    } catch (error: any) {
      toast({ title: "Error", description: error.message || "Failed to download Excel file", variant: "destructive" });
    }
  };

  const hasParams = Boolean(campaignIdParam && startDateParam && endDateParam);

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-50 via-white to-slate-100 p-4 md:p-8 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 animate-in fade-in duration-500">
      <div className="mx-auto max-w-7xl space-y-10">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between pb-5 border-b">
          <div className="space-y-1.5">
            <h1 className="text-3xl font-bold tracking-tight text-foreground drop-shadow-sm">
              Campaign Reports
            </h1>
            <p className="text-sm text-muted-foreground">
              {selectedCampaign && startDateParam && endDateParam
                ? `${selectedCampaign.nombre} · ${decodeURIComponent(startDateParam)} to ${decodeURIComponent(endDateParam)}`
                : "Select a campaign and date range to view analytics"}
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Button
              variant="default"
              onClick={() => setFiltersOpen(true)}
              className="gap-2 shadow-sm"
            >
              <SlidersHorizontal className="h-4 w-4" />
              Configure Report
            </Button>

            {report && (
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={exportPdfBackend}
                  className="gap-2 hover:bg-rose-50 hover:text-rose-600 hover:border-rose-200 dark:hover:bg-rose-950/30 dark:hover:text-rose-400 transition-colors"
                >
                  <Download className="h-4 w-4" />
                  <span className="hidden sm:inline">PDF</span>
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={exportExcelBackend}
                  className="gap-2 hover:bg-emerald-50 hover:text-emerald-600 hover:border-emerald-200 dark:hover:bg-emerald-950/30 dark:hover:text-emerald-400 transition-colors"
                >
                  <FileSpreadsheet className="h-4 w-4" />
                  <span className="hidden sm:inline">Excel</span>
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* Filters Sheet */}
        <CampaignFiltersSheet
          open={filtersOpen}
          onOpenChange={setFiltersOpen}
          campaignOpen={campaignOpen}
          onCampaignOpenChange={setCampaignOpen}
          campaigns={campaigns}
          selectedCampaignId={selectedCampaignId}
          loadingCampaigns={loadingCampaigns}
          startDate={startDate}
          endDate={endDate}
          canExport={Boolean(report)}
          onCampaignSelect={handleCampaignSelect}
          onStartDateChange={setStartDate}
          onEndDateChange={setEndDate}
          onExportPDF={exportPdfBackend}
          onExportExcel={exportExcelBackend}
          onApplyFilters={applyFilters}
        />

        {/* Content */}
        {!hasParams ? (
          <div className="flex min-h-[420px] flex-col items-center justify-center rounded-2xl border-2 border-dashed bg-gradient-to-br from-muted/30 to-muted/10 p-8 text-center animate-in zoom-in-95 duration-300">
            <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-primary/10 ring-8 ring-primary/5">
              <Filter className="h-10 w-10 text-primary" />
            </div>
            <h3 className="text-xl font-bold">Configure report to view campaigns</h3>
            <p className="mb-6 mt-3 max-w-md text-sm text-muted-foreground">
              Select a campaign and date range to load the dashboard and detailed analytics.
            </p>
            <Button onClick={() => setFiltersOpen(true)} className="gap-2" size="lg">
              <SlidersHorizontal className="h-4 w-4" />
              Configure Report
            </Button>
          </div>
        ) : loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            <span className="ml-2 text-muted-foreground">Loading report...</span>
          </div>
        ) : report ? (
          <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-500">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <MetricCard title="Customers" value={report.totals.customers} icon={<Users className="h-4 w-4" />} color="text-blue-600" />
              <MetricCard title="Total Calls" value={report.totals.calls} icon={<Phone className="h-4 w-4" />} color="text-blue-600" subtitle={`${report.callsStats.answered} answered`} />
              <MetricCard title="Tickets" value={report.totals.tickets} icon={<Ticket className="h-4 w-4" />} color="text-emerald-600" subtitle={`${report.ticketsStats.open} open`} />
              <MetricCard title="Manual Records" value={report.totals.manualRecords} icon={<ClipboardList className="h-4 w-4" />} color="text-purple-600" />
            </div>

            <ModulePanels report={report} />
            <OutcomeSection statusBreakdown={report.statusBreakdown} totals={report.totals} />

            <div className="border-b pb-3">
              <h2 className="text-xl font-bold">Customer Details</h2>
              <p className="text-sm text-muted-foreground">Calls · Tickets · Manual Records</p>
            </div>

            <div className="space-y-8">
              {report.tables
                .filter((t) => t.rows.length > 0)
                .map((table) => (
                  <CustomerTable
                    key={table.title}
                    title={table.title}
                    rows={table.rows}
                    campaignId={campaignIdParam ? parseInt(campaignIdParam) : null}
                    startDate={startDateParam ? decodeURIComponent(startDateParam) : ""}
                    endDate={endDateParam ? decodeURIComponent(endDateParam) : ""}
                  />
                ))}
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
