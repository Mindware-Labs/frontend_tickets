"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  PhoneIncoming,
  PhoneOutgoing,
  PhoneMissed,
  Ticket,
  Search,
  ChevronDown,
  ChevronRight,
  FileText,
  CheckCircle2,
  XCircle,
  Ban,
  PhoneOff,
  BadgeDollarSign,
  ReceiptText,
  MoveRight,
  Clock,
  ClipboardList,
  User,
  AlertCircle,
  History,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";

// ═══════════════════════════════════════════════════════════════════════════════
// TYPES (matching backend CampaignFullReport)
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

const STATUS_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  Paid: { bg: "bg-green-50", text: "text-green-700", border: "border-green-200" },
  "Not Paid": { bg: "bg-red-50", text: "text-red-700", border: "border-red-200" },
  "Offline Payment": { bg: "bg-amber-50", text: "text-amber-700", border: "border-amber-200" },
  "Not Paid Check": { bg: "bg-amber-50", text: "text-amber-700", border: "border-amber-200" },
  "Moved Out": { bg: "bg-orange-50", text: "text-orange-700", border: "border-orange-200" },
  Canceled: { bg: "bg-rose-50", text: "text-rose-700", border: "border-rose-200" },
  "Balance 0": { bg: "bg-teal-50", text: "text-teal-700", border: "border-teal-200" },
  "Do Not Call": { bg: "bg-red-50", text: "text-red-700", border: "border-red-200" },
  Registered: { bg: "bg-green-50", text: "text-green-700", border: "border-green-200" },
  "Not Registered": { bg: "bg-red-50", text: "text-red-700", border: "border-red-200" },
  "Paid with LL": { bg: "bg-cyan-50", text: "text-cyan-700", border: "border-cyan-200" },
  Unknown: { bg: "bg-slate-50", text: "text-slate-600", border: "border-slate-200" },
  Unspecified: { bg: "bg-slate-50", text: "text-slate-600", border: "border-slate-200" },
};

const DIRECTION_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  Inbound: { bg: "bg-blue-50", text: "text-blue-700", border: "border-blue-200" },
  Outbound: { bg: "bg-emerald-50", text: "text-emerald-700", border: "border-emerald-200" },
  Missed: { bg: "bg-red-50", text: "text-red-700", border: "border-red-200" },
  Voicemail: { bg: "bg-amber-50", text: "text-amber-700", border: "border-amber-200" },
};

const STATUS_ORDER = [
  "Paid", "Not Paid", "Offline Payment", "Not Paid Check",
  "Moved Out", "Canceled", "Balance 0", "Do Not Call",
  "Registered", "Not Registered", "Paid with LL", "Unknown", "Unspecified",
];

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

const formatDateTime = (iso: string | null | undefined): string => {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
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
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════

interface CampaignReportViewProps {
  report: CampaignFullReport;
  startDate: string;
  endDate: string;
  campaignId: number | null;
}

export function CampaignReportView({
  report,
  startDate,
  endDate,
  campaignId,
}: CampaignReportViewProps) {
  const { campaign, callsStats, ticketsStats, manualRecordsStats, statusBreakdown, tables, totals, isAr } = report;

  const formatDateRange = (dateStr: string) => {
    if (!dateStr) return "";
    const d = new Date(dateStr);
    return d.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const dateRangeText = `${formatDateRange(startDate)} – ${formatDateRange(endDate)}`;

  // Ordenar tablas según orden predefinido
  const orderedTables = useMemo(() => {
    return [...tables].sort((a, b) => {
      const indexA = STATUS_ORDER.findIndex((s) => s === a.title);
      const indexB = STATUS_ORDER.findIndex((s) => s === b.title);
      if (indexA === -1 && indexB === -1) return 0;
      if (indexA === -1) return 1;
      if (indexB === -1) return -1;
      return indexA - indexB;
    });
  }, [tables]);

  // Filtrar outcomes con valor > 0
  const outcomeSummary = useMemo(() => {
    return STATUS_ORDER
      .map((statusKey) => {
        const found = statusBreakdown.find((s) => s.label === statusKey);
        return { label: statusKey, value: found?.count || 0 };
      })
      .filter((item) => item.value > 0);
  }, [statusBreakdown]);

  return (
    <>
      {/* Estilos de impresión */}
      <style jsx global>{`
        @media print {
          body {
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          .break-inside-avoid {
            break-inside: avoid;
            page-break-inside: avoid;
          }
          .page-break-before {
            page-break-before: always;
            break-before: page;
          }
        }
      `}</style>

      {/* Marca de agua diagonal */}
      <div className="fixed inset-0 flex items-center justify-center pointer-events-none select-none z-0">
        <div className="absolute transform -rotate-45 text-[8rem] font-black text-slate-900/3 whitespace-nowrap tracking-widest">
          CONFIDENTIAL
        </div>
      </div>

      <div className="relative z-10 w-full space-y-10">
        {/* ===== CABECERA EJECUTIVA ===== */}
        <div className="flex flex-col sm:flex-row justify-between items-start gap-4 pb-6 border-b border-slate-200">
          <div>
            <div className="flex items-baseline gap-2">
              <span className="text-[10px] font-bold uppercase tracking-[0.25em] text-slate-400">
                Campaign Report
              </span>
              <Badge variant="secondary" className="text-[9px]">
                {campaign.tipo?.toUpperCase() || "CAMPAIGN"}
              </Badge>
            </div>
            <h1 className="text-3xl font-bold text-slate-900 mt-1">
              {campaign?.nombre || "Unnamed Campaign"}
            </h1>
            {campaign?.yardaName && (
              <p className="text-sm text-slate-500 mt-0.5">
                Yard: {campaign.yardaName}
              </p>
            )}
          </div>
          <div className="text-right">
            <p className="text-[10px] font-medium uppercase tracking-wider text-slate-400 mb-1">
              Report Range
            </p>
            <p className="text-sm font-semibold text-slate-800">
              {dateRangeText}
            </p>
            <p className="text-[10px] text-slate-400 mt-1">
              Generated: {new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
            </p>
          </div>
        </div>

        {/* ===== KPIs GLOBALES ===== */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <KpiCard
            label="Customers"
            value={totals.customers}
            icon={<User className="h-5 w-5" />}
            color="text-blue-600"
            bgColor="bg-blue-50"
          />
          <KpiCard
            label="Total Calls"
            value={totals.calls}
            icon={<PhoneIncoming className="h-5 w-5" />}
            color="text-blue-600"
            bgColor="bg-blue-50"
            subtitle={`${callsStats.answered} answered · ${callsStats.missed} missed`}
          />
          <KpiCard
            label="Tickets"
            value={totals.tickets}
            icon={<Ticket className="h-5 w-5" />}
            color="text-emerald-600"
            bgColor="bg-emerald-50"
            subtitle={`${ticketsStats.open} open · ${ticketsStats.closed} closed`}
          />
          <KpiCard
            label="Manual Records"
            value={totals.manualRecords}
            icon={<ClipboardList className="h-5 w-5" />}
            color="text-purple-600"
            bgColor="bg-purple-50"
          />
        </div>

        {/* ===== MÉTRICAS DETALLADAS POR MÓDULO ===== */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Calls Module */}
          <ModuleDetailCard
            title="Calls"
            icon={<PhoneIncoming className="h-4 w-4" />}
            accentColor="border-blue-500"
            headerBg="bg-blue-50/50"
            stats={[
              { label: "Inbound", value: callsStats.inbound, color: "text-blue-600" },
              { label: "Outbound", value: callsStats.outbound, color: "text-emerald-600" },
              { label: "Missed", value: callsStats.missed, color: "text-red-600" },
              { label: "Voicemail", value: callsStats.voicemail, color: "text-amber-600" },
              { label: "Avg Duration", value: formatDuration(callsStats.avgDurationSec), color: "text-slate-600" },
              { label: "Total Talk", value: formatDuration(callsStats.totalDurationSec), color: "text-slate-600" },
              { label: "With Notes", value: callsStats.withNotes, color: "text-slate-600" },
              { label: "With Follow-up", value: callsStats.withFollowUp, color: "text-slate-600" },
              { label: "Top Agent", value: callsStats.topAgent, color: "text-slate-600" },
            ]}
          />

          {/* Tickets Module */}
          <ModuleDetailCard
            title="Tickets"
            icon={<Ticket className="h-4 w-4" />}
            accentColor="border-emerald-500"
            headerBg="bg-emerald-50/50"
            stats={[
              { label: "Open", value: ticketsStats.open, color: "text-blue-600" },
              { label: "Closed/Resolved", value: ticketsStats.closed, color: "text-green-600" },
              { label: "Pending/In Progress", value: ticketsStats.pendingFollowUp, color: "text-amber-600" },
              { label: "Overdue", value: ticketsStats.overdue, color: "text-red-600" },
              { label: "High Priority", value: ticketsStats.highPriority, color: "text-red-600" },
              { label: "Medium Priority", value: ticketsStats.mediumPriority, color: "text-amber-600" },
              { label: "Low Priority", value: ticketsStats.lowPriority, color: "text-green-600" },
              { label: "With Follow-up", value: ticketsStats.withFollowUp, color: "text-slate-600" },
              { label: "Top Assignee", value: ticketsStats.topAssignee, color: "text-slate-600" },
            ]}
          />

          {/* Manual Records Module */}
          <ModuleDetailCard
            title="Manual Records"
            icon={<ClipboardList className="h-4 w-4" />}
            accentColor="border-purple-500"
            headerBg="bg-purple-50/50"
            stats={[
              { label: "Total", value: manualRecordsStats.total, color: "text-slate-600" },
              { label: "With Notes", value: manualRecordsStats.withNotes, color: "text-slate-600" },
              { label: "With Disposition", value: manualRecordsStats.withDisposition, color: "text-slate-600" },
              { label: "With Camp. Option", value: manualRecordsStats.withCampaignOption, color: "text-slate-600" },
            ]}
            extraBreakdown={manualRecordsStats.dispositionBreakdown.slice(0, 5)}
            extraTitle="Top Dispositions"
          />
        </div>

        {/* ===== RESUMEN DE OUTCOMES ===== */}
        {outcomeSummary.length > 0 && (
          <div>
            <h3 className="text-[11px] font-bold uppercase tracking-widest text-slate-500 mb-4">
              Campaign Outcomes
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3">
              {outcomeSummary.map((item) => {
                const colors = STATUS_COLORS[item.label] || STATUS_COLORS["Unknown"];
                const pct = totals.customers > 0
                  ? Math.round((item.value / totals.customers) * 100)
                  : 0;
                return (
                  <div
                    key={item.label}
                    className={cn(
                      "rounded-lg border px-4 py-3 shadow-sm",
                      colors.bg,
                      colors.border,
                    )}
                  >
                    <p className={cn("text-[10px] font-semibold uppercase tracking-wider", colors.text)}>
                      {item.label}
                    </p>
                    <p className={cn("text-xl font-bold mt-0.5", colors.text)}>
                      {item.value}
                    </p>
                    <p className="text-[10px] text-slate-400 mt-0.5">
                      {pct}% of customers
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ===== TABLAS AGRUPADAS POR CATEGORÍA ===== */}
        <div>
          <div className="border-b border-slate-200 pb-3 mb-6">
            <h2 className="text-xl font-bold text-slate-900">Customer Details</h2>
            <p className="text-sm text-slate-500">Calls · Tickets · Manual Records</p>
          </div>
          <div className="space-y-8">
            {orderedTables.map((table) => (
              <CategoryTableSection
                key={table.title}
                title={table.title}
                rows={table.rows}
                campaignId={campaignId}
              />
            ))}
            {orderedTables.length === 0 && (
              <div className="text-center py-12 text-slate-500">
                No customer data available for the selected period.
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// SUBCOMPONENTS
// ═══════════════════════════════════════════════════════════════════════════════

function KpiCard({
  label,
  value,
  icon,
  color,
  bgColor,
  subtitle,
}: {
  label: string;
  value: number;
  icon: React.ReactNode;
  color: string;
  bgColor: string;
  subtitle?: string;
}) {
  return (
    <div className={cn("border border-slate-200 rounded-xl p-5 flex items-center justify-between", bgColor)}>
      <div>
        <p className="text-[10px] font-medium uppercase tracking-widest text-slate-500">
          {label}
        </p>
        <p className={cn("text-2xl font-bold mt-1", color)}>{value}</p>
        {subtitle && (
          <p className="text-[10px] text-slate-400 mt-1">{subtitle}</p>
        )}
      </div>
      <div className={color}>{icon}</div>
    </div>
  );
}

function ModuleDetailCard({
  title,
  icon,
  accentColor,
  headerBg,
  stats,
  extraBreakdown,
  extraTitle,
}: {
  title: string;
  icon: React.ReactNode;
  accentColor: string;
  headerBg: string;
  stats: { label: string; value: string | number; color: string }[];
  extraBreakdown?: KvPair[];
  extraTitle?: string;
}) {
  return (
    <div className={cn("rounded-xl border border-slate-200 bg-white overflow-hidden border-t-2", accentColor)}>
      <div className={cn("px-5 py-3 flex items-center gap-2", headerBg)}>
        {icon}
        <h4 className="text-sm font-bold text-slate-800">{title}</h4>
      </div>
      <div className="px-5 py-3 space-y-2">
        {stats.map((stat, idx) => (
          <div key={idx} className="flex justify-between items-center text-xs">
            <span className="text-slate-500">{stat.label}</span>
            <span className={cn("font-semibold", stat.color)}>{stat.value}</span>
          </div>
        ))}
        {extraBreakdown && extraBreakdown.length > 0 && (
          <div className="border-t border-slate-100 pt-2 mt-2">
            <p className="text-[10px] font-semibold uppercase text-slate-400 mb-1">
              {extraTitle || "Breakdown"}
            </p>
            {extraBreakdown.map((item, idx) => (
              <div key={idx} className="flex justify-between items-center text-xs">
                <span className="text-slate-500 truncate max-w-[120px]">
                  {item.label.replace(/_/g, " ")}
                </span>
                <span className="font-semibold text-slate-700">{item.count}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function CategoryTableSection({
  title,
  rows,
  campaignId,
}: {
  title: string;
  rows: MatrixCustomerRow[];
  campaignId: number | null;
}) {
  const [collapsed, setCollapsed] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedRow, setSelectedRow] = useState<MatrixCustomerRow | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const router = useRouter();

  const statusStyle = STATUS_COLORS[title] || STATUS_COLORS["Unknown"];

  const filteredRows = useMemo(() => {
    if (!searchTerm.trim()) return rows;
    const term = searchTerm.toLowerCase();
    return rows.filter((row) => {
      const searchable = [
        row.name,
        row.phone,
        row.finalStatus,
        row.calls?.lastDirection,
        row.calls?.lastDisposition,
        row.calls?.lastAgentName,
        row.customerId?.toString(),
        ...row.tickets.map((t) => `${t.ticketLabel} ${t.status} ${t.agentName} ${t.issueSnippet}`),
        ...row.manualRecords.map((m) => `${m.disposition} ${m.notes}`),
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return searchable.includes(term);
    });
  }, [rows, searchTerm]);

  const handleRowClick = (row: MatrixCustomerRow) => {
    setSelectedRow(row);
    setModalOpen(true);
  };

  const navigateToTickets = (row: MatrixCustomerRow) => {
    if (!row.customerId || !campaignId) {
      toast({
        title: "Cannot navigate",
        description: "Missing customer or campaign information.",
        variant: "destructive",
      });
      return;
    }
    const params = new URLSearchParams();
    params.set("customerId", row.customerId.toString());
    params.set("campaignId", campaignId.toString());
    params.set("fromReport", "campaign");
    const searchParams = new URLSearchParams(window.location.search);
    const startDate = searchParams.get("startDate") || "";
    const endDate = searchParams.get("endDate") || "";
    if (startDate) params.set("reportStartDate", startDate);
    if (endDate) params.set("reportEndDate", endDate);
    router.push(`/calls?tab=tickets&${params.toString()}`);
  };

  if (rows.length === 0) return null;

  const totalCalls = rows.reduce((sum, r) => sum + (r.calls?.callCount || 0), 0);
  const totalTickets = rows.reduce((sum, r) => sum + r.tickets.length, 0);
  const totalManual = rows.reduce((sum, r) => sum + r.manualRecords.length, 0);

  return (
    <div className="break-inside-avoid rounded-xl border border-slate-200 bg-white overflow-hidden">
      {/* Encabezado de categoría */}
      <div
        className={cn(
          "px-5 py-3 flex items-center justify-between cursor-pointer border-l-4",
          statusStyle.bg,
          statusStyle.border,
        )}
        onClick={() => setCollapsed(!collapsed)}
      >
        <div className="flex items-center gap-3">
          <button className="p-1 rounded hover:bg-white/50 transition-colors">
            {collapsed ? (
              <ChevronRight className="h-4 w-4 text-slate-500" />
            ) : (
              <ChevronDown className="h-4 w-4 text-slate-500" />
            )}
          </button>
          <div>
            <h4 className={cn("text-sm font-bold uppercase", statusStyle.text)}>
              {title}
            </h4>
            <p className="text-[10px] text-slate-500 mt-0.5">
              {rows.length} {rows.length === 1 ? "customer" : "customers"}
              {" · "}
              {totalCalls} calls · {totalTickets} tickets · {totalManual} records
            </p>
          </div>
        </div>
        {!collapsed && (
          <div className="relative w-64" onClick={(e) => e.stopPropagation()}>
            <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
            <Input
              placeholder="Filter..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="h-8 pl-8 text-xs border-slate-200 bg-white"
            />
          </div>
        )}
      </div>

      {/* Contenido de la tabla */}
      {!collapsed && (
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/50">
                <th className="px-5 py-2 text-[10px] font-semibold uppercase tracking-widest text-slate-500 w-[18%]">
                  Customer
                </th>
                <th className="px-4 py-2 text-[10px] font-semibold uppercase tracking-widest text-slate-500 w-[22%]">
                  Calls
                </th>
                <th className="px-4 py-2 text-[10px] font-semibold uppercase tracking-widest text-slate-500 w-[17%]">
                  Last Call
                </th>
                <th className="px-4 py-2 text-[10px] font-semibold uppercase tracking-widest text-slate-500 w-[22%]">
                  Tickets
                </th>
                <th className="px-4 py-2 text-[10px] font-semibold uppercase tracking-widest text-slate-500 w-[21%]">
                  Manual Records
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredRows.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-5 py-8 text-center text-sm text-slate-500">
                    No matching customers in this table.
                  </td>
                </tr>
              ) : (
                filteredRows.map((row, idx) => (
                  <TableRow
                    key={`${title}-${row.customerId || row.phone}-${idx}`}
                    row={row}
                    onClick={() => handleRowClick(row)}
                  />
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal de detalles */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <User className="h-5 w-5 text-slate-600" />
              {selectedRow?.name}
            </DialogTitle>
            <DialogDescription>
              {selectedRow?.phone} • Status: {selectedRow?.finalStatus}
            </DialogDescription>
          </DialogHeader>
          <ScrollArea className="flex-1 -mx-6 px-6">
            <div className="space-y-6 py-2">
              {/* Calls Summary */}
              {selectedRow?.calls && selectedRow.calls.callCount > 0 && (
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2 flex items-center gap-2">
                    <PhoneIncoming className="h-3 w-3" /> Calls
                  </h4>
                  <div className="bg-slate-50 rounded-lg p-4 space-y-2 text-sm">
                    <div className="grid grid-cols-3 gap-2">
                      <div><span className="text-slate-500">Total:</span> <strong>{selectedRow.calls.callCount}</strong></div>
                      <div><span className="text-slate-500">In/Out:</span> <strong>{selectedRow.calls.inbound}/{selectedRow.calls.outbound}</strong></div>
                      <div><span className="text-slate-500">Missed:</span> <strong>{selectedRow.calls.missed}</strong></div>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div><span className="text-slate-500">Duration:</span> <strong>{formatDuration(selectedRow.calls.totalDurationSec)}</strong></div>
                      <div><span className="text-slate-500">Last:</span> <strong>{formatDate(selectedRow.calls.lastCallDate)}</strong></div>
                    </div>
                    {selectedRow.calls.lastDisposition && (
                      <div><span className="text-slate-500">Disposition:</span> <Badge variant="outline">{selectedRow.calls.lastDisposition.replace(/_/g, " ")}</Badge></div>
                    )}
                    {selectedRow.calls.lastNotes && (
                      <div>
                        <span className="text-slate-500">Notes:</span>
                        <p className="text-xs mt-1 text-slate-600">{selectedRow.calls.lastNotes}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Tickets */}
              {selectedRow?.tickets && selectedRow.tickets.length > 0 && (
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2 flex items-center gap-2">
                    <Ticket className="h-3 w-3" /> Tickets ({selectedRow.tickets.length})
                  </h4>
                  <div className="space-y-2">
                    {selectedRow.tickets.map((ticket) => (
                      <div key={ticket.ticketId} className="bg-slate-50 rounded-lg p-3 text-sm">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <Badge variant="outline" className="font-mono text-xs">
                            {ticket.ticketLabel}
                          </Badge>
                          <Badge variant="secondary" className="text-xs">
                            {ticket.status.replace(/_/g, " ")}
                          </Badge>
                          {ticket.priority && (
                            <Badge variant="secondary" className="text-xs">
                              {ticket.priority}
                            </Badge>
                          )}
                        </div>
                        {ticket.issueSnippet && (
                          <p className="text-xs text-slate-600 mt-1">{ticket.issueSnippet}</p>
                        )}
                        <div className="flex justify-between items-center mt-1">
                          <span className="text-[10px] text-slate-400">
                            {ticket.agentName} · {formatDate(ticket.createdAt)}
                          </span>
                          {ticket.hasFollowUp && (
                            <Badge variant="outline" className="text-[10px] text-amber-600 border-amber-200">
                              Follow-up
                            </Badge>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Manual Records */}
              {selectedRow?.manualRecords && selectedRow.manualRecords.length > 0 && (
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2 flex items-center gap-2">
                    <ClipboardList className="h-3 w-3" /> Manual Records ({selectedRow.manualRecords.length})
                  </h4>
                  <div className="space-y-2">
                    {selectedRow.manualRecords.map((record) => (
                      <div key={record.id} className="bg-slate-50 rounded-lg p-3 text-sm">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          {record.disposition && (
                            <Badge variant="secondary" className="text-xs">
                              {record.disposition.replace(/_/g, " ")}
                            </Badge>
                          )}
                          {record.campaignOption && (
                            <Badge variant="outline" className="text-xs text-purple-600">
                              {record.campaignOption.replace(/_/g, " ")}
                            </Badge>
                          )}
                        </div>
                        {record.notes && (
                          <p className="text-xs text-slate-600 mt-1">{record.notes}</p>
                        )}
                        <p className="text-[10px] text-slate-400 mt-1">
                          {formatDateTime(record.createdAt)}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Last Activity */}
              {selectedRow?.lastActivityDate && (
                <div className="flex items-center gap-2 text-xs text-slate-400">
                  <Clock className="h-3 w-3" />
                  Last activity: {formatDateTime(selectedRow.lastActivityDate)}
                </div>
              )}
            </div>
          </ScrollArea>
          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={() => setModalOpen(false)}>
              Close
            </Button>
            <Button
              onClick={() => {
                if (selectedRow) navigateToTickets(selectedRow);
                setModalOpen(false);
              }}
            >
              <History className="h-4 w-4 mr-2" />
              View Tickets
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function TableRow({ row, onClick }: { row: MatrixCustomerRow; onClick: () => void }) {
  const directionStyle = DIRECTION_COLORS[row.calls?.lastDirection] || DIRECTION_COLORS["Missed"];

  return (
    <tr
      className="border-b border-slate-100 last:border-0 hover:bg-slate-50/50 transition-colors cursor-pointer"
      onClick={onClick}
    >
      {/* Customer */}
      <td className="px-5 py-3">
        <div className="font-medium text-slate-900 text-sm">{row.name || "—"}</div>
        <div className="text-slate-500 font-mono text-xs mt-0.5">
          {row.phone || "—"}
        </div>
        {row.lastActivityDate && (
          <div className="text-[10px] text-slate-400 mt-0.5 flex items-center gap-1">
            <Clock className="h-3 w-3" />
            {formatDate(row.lastActivityDate)}
          </div>
        )}
      </td>

      {/* Calls */}
      <td className="px-4 py-3 align-middle">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-1.5">
            <span className="inline-flex items-center justify-center rounded-full bg-blue-100 px-2 py-0.5 text-xs font-bold text-blue-700">
              {row.calls?.callCount || 0}c
            </span>
          </div>
          <div className="flex gap-1 text-[10px]">
            {row.calls?.inbound > 0 && (
              <span className="text-blue-600 font-medium">In:{row.calls.inbound}</span>
            )}
            {row.calls?.outbound > 0 && (
              <span className="text-emerald-600 font-medium">Out:{row.calls.outbound}</span>
            )}
            {row.calls?.missed > 0 && (
              <span className="text-red-600 font-medium">Miss:{row.calls.missed}</span>
            )}
          </div>
          {row.calls?.totalDurationSec > 0 && (
            <span className="text-[10px] text-slate-400">
              {formatDuration(row.calls.totalDurationSec)}
            </span>
          )}
          {row.calls?.hasFollowUp && (
            <span className="text-[10px] text-amber-600 font-medium">
              Follow-up: {formatDate(row.calls.followUpDate)}
            </span>
          )}
        </div>
      </td>

      {/* Last Call */}
      <td className="px-4 py-3 align-middle">
        <div className="flex flex-col gap-1">
          <span
            className={cn(
              "inline-flex items-center gap-1 rounded-md border px-2 py-1 text-[10px] font-semibold w-fit",
              directionStyle.bg,
              directionStyle.text,
              directionStyle.border,
            )}
          >
            {row.calls?.lastDirection || "—"}
          </span>
          {row.calls?.lastCallDate && (
            <span className="text-[10px] text-slate-400">
              {formatDate(row.calls.lastCallDate)}
            </span>
          )}
          {row.calls?.lastDisposition && (
            <span className="text-[10px] text-slate-500">
              {row.calls.lastDisposition.replace(/_/g, " ")}
            </span>
          )}
        </div>
      </td>

      {/* Tickets */}
      <td className="px-4 py-3 align-middle">
        {row.tickets.length === 0 ? (
          <span className="text-xs text-slate-400 italic">No tickets</span>
        ) : (
          <div className="flex flex-col gap-1">
            {row.tickets.slice(0, 2).map((ticket) => (
              <div key={ticket.ticketId} className="flex items-center gap-1 flex-wrap">
                <Badge variant="outline" className="font-mono text-[10px] px-1.5 py-0">
                  {ticket.ticketLabel}
                </Badge>
                <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                  {ticket.status.replace(/_/g, " ")}
                </Badge>
              </div>
            ))}
            {row.tickets.length > 2 && (
              <span className="text-[10px] text-slate-400">+{row.tickets.length - 2} more</span>
            )}
          </div>
        )}
      </td>

      {/* Manual Records */}
      <td className="px-4 py-3 align-middle">
        {row.manualRecords.length === 0 ? (
          <span className="text-xs text-slate-400 italic">No records</span>
        ) : (
          <div className="flex flex-col gap-1">
            {row.manualRecords.slice(0, 2).map((record) => (
              <div key={record.id} className="text-[10px]">
                {record.disposition && (
                  <Badge variant="secondary" className="text-[10px] px-1.5 py-0 mr-1">
                    {record.disposition.replace(/_/g, " ")}
                  </Badge>
                )}
                {record.notes && (
                  <span className="text-slate-500 truncate block max-w-[180px]">
                    {record.notes.slice(0, 50)}
                  </span>
                )}
              </div>
            ))}
            {row.manualRecords.length > 2 && (
              <span className="text-[10px] text-slate-400">+{row.manualRecords.length - 2} more</span>
            )}
          </div>
        )}
      </td>
    </tr>
  );
}