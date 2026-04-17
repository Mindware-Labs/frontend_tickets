"use client";

import { useEffect, useMemo, useState, useRef } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Check, ChevronsUpDown } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { fetchFromBackend, fetchBlobFromBackend } from "@/lib/api-client";
import { CallDirection } from "@/app/(dashboard)/calls/types";
import {
  FileText,
  Download,
  Users,
  PhoneMissed,
  CheckCircle2,
  CreditCard,
  Search,
  CalendarDays,
  Filter,
  XCircle,
  Ban,
  PhoneOff,
  BadgeDollarSign,
  ReceiptText,
  MoveRight,
  FileSpreadsheet,
  History,
} from "lucide-react";
import { cn } from "@/lib/utils";
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

type Campaign = {
  id: number;
  nombre: string;
  yarda?: { name?: string | null } | null;
  isActive?: boolean;
  tipo?: string;
  createdAt?: string;
};

type Ticket = {
  id: number;
  customerId?: number | null;
  customer?: { name?: string | null; phone?: string | null } | null;
  customerPhone?: string | null;
  campaignId?: number | null;
  campaign?: { id?: number | null } | null;
  campaingOption?: string | null;
  campaignOption?: string | null;
  onboardingOption?: string | null;
  issueDetail?: string | null;
  direction?: CallDirection | null;
  originalDirection?: CallDirection | null;
  createdAt?: string | null;
  updatedAt?: string | null;
};

type CustomerCallHistory = {
  ticketId: number;
  status: string;
  note: string;
  direction: string;
  createdAt: string;
  agentName: string;
  issueDetail?: string;
};

type CustomerRow = {
  ticketId?: number;
  customerId?: number;
  name: string;
  phone: string;
  direction?: string;
  status: string;
  note: string;
  callCount?: number;
  callHistory?: CustomerCallHistory[];
};

type ReportMetric = {
  title: string;
  value: number;
  icon?: React.ReactNode;
  color?: string;
};

type ReportTable = {
  title: string;
  rows: CustomerRow[];
};

type ReportData = {
  campaign: Campaign | null;
  metrics: ReportMetric[];
  totalCustomers: number;
  reportLines: string[];
  tables: ReportTable[];
};

// --- Constants & Helpers ---
const ONBOARDING = {
  REGISTERED: "REGISTERED",
  NOT_REGISTERED: "NOT_REGISTERED",
  PAID_WITH_LL: "PAID_WITH_LL",
  CANCELED: "CANCELED",
};

const AR_LABELS: Record<string, string> = {
  PAID: "Paid",
  NOT_PAID: "Not Paid",
  OFFLINE_PAYMENT: "Offline Payment",
  NOT_PAID_CHECK: "Not Paid Check",
  MOVED_OUT: "Moved Out",
  CANCELED: "Canceled",
  BALANCE_0: "Balance 0",
  DO_NOT_CALL: "Do Not Call",
};

const AR_ICONS: Record<string, React.ReactNode> = {
  PAID: <CheckCircle2 className="h-4 w-4 text-green-600" />,
  NOT_PAID: <XCircle className="h-4 w-4 text-red-600" />,
  OFFLINE_PAYMENT: <ReceiptText className="h-4 w-4 text-amber-600" />,
  NOT_PAID_CHECK: <FileText className="h-4 w-4 text-amber-700" />,
  MOVED_OUT: <MoveRight className="h-4 w-4 text-orange-600" />,
  CANCELED: <Ban className="h-4 w-4 text-rose-600" />,
  BALANCE_0: <BadgeDollarSign className="h-4 w-4 text-teal-600" />,
  DO_NOT_CALL: <PhoneOff className="h-4 w-4 text-red-600" />,
};

const PDF_COLOR_MAP: Record<string, [number, number, number]> = {
  "text-blue-600": [37, 99, 235],
  "text-green-600": [22, 163, 74],
  "text-amber-600": [217, 119, 6],
  "text-emerald-600": [5, 150, 105],
  "text-purple-600": [124, 58, 237],
  "text-slate-600": [71, 85, 105],
  "text-orange-600": [234, 88, 12],
  "text-rose-600": [225, 29, 72],
  "text-cyan-600": [8, 145, 178],
  "text-red-600": [220, 38, 38],
  "text-teal-600": [13, 148, 136],
};

const getRgbColor = (className?: string): [number, number, number] => {
  if (className && PDF_COLOR_MAP[className]) return PDF_COLOR_MAP[className];
  return [55, 65, 81];
};

type ImageSize = { width: number; height: number };

const categorizeIssueDetail = (detail: string) => {
  const text = detail.toLowerCase();
  const tags: string[] = [];
  if (
    /(not parked|no longer parked|not parking|not at the location)/i.test(text)
  )
    tags.push("not_parked");
  if (
    /(out of service|blocked|disconnected|wrong number|no number)/i.test(text)
  )
    tags.push("unreachable");
  if (/(no further contact|do not contact|police)/i.test(text))
    tags.push("no_contact");
  if (/(rate discrepancy|pricing|price|rate)/i.test(text))
    tags.push("rate_discrepancy");
  if (/(declined|refused)/i.test(text)) tags.push("declined");
  if (/(handling internally|handled internally|company handling)/i.test(text))
    tags.push("handled_internally");
  if (/(paid by check|check)/i.test(text)) tags.push("paid_by_check");
  if (/(unresponsive|no response|no reply)/i.test(text))
    tags.push("unresponsive");
  return tags;
};

const getCustomerLabel = (ticket: Ticket) => {
  if (ticket.customer?.name) return ticket.customer.name;
  if (ticket.customerPhone) return ticket.customerPhone;
  if (ticket.customer?.phone) return ticket.customer.phone;
  if (ticket.customerId) return `Customer #${ticket.customerId}`;
  return "Unknown";
};

const parseDate = (value?: string | null) => {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
};

const inRange = (date: Date | null, start: Date | null, end: Date | null) => {
  if (!date) return false;
  if (start && date < start) return false;
  if (end && date > end) return false;
  return true;
};

// --- Subcomponents ---

const MetricCard = ({ metric }: { metric: ReportMetric }) => (
  <div className="relative overflow-hidden rounded-xl border bg-card p-6 shadow-sm transition-all hover:shadow-md">
    <div className="flex items-center justify-between space-y-0 pb-2">
      <p className="text-sm font-medium text-muted-foreground">
        {metric.title}
      </p>
      {metric.icon && (
        <div className={cn("rounded-full p-2 bg-opacity-10", metric.color)}>
          {metric.icon}
        </div>
      )}
    </div>
    <div className="flex items-baseline gap-2">
      <div className="text-3xl font-bold tracking-tight">{metric.value}</div>
    </div>
    {/* Decorative background shape */}
    <div
      className={cn(
        "absolute -right-6 -top-6 h-24 w-24 rounded-full opacity-5",
        metric.color?.replace("text-", "bg-"),
      )}
    />
  </div>
);

const CustomerTable = ({
  title,
  rows,
  campaignId,
  startDate,
  endDate,
  expectedCalls,
}: {
  title: string;
  rows: CustomerRow[];
  campaignId: number | null;
  startDate: string;
  endDate: string;
  expectedCalls?: number;
}) => {
  const router = useRouter();
  const [tableSearch, setTableSearch] = useState("");
  const [showIssueDetailModal, setShowIssueDetailModal] = useState(false);
  const [selectedRowForIssueDetail, setSelectedRowForIssueDetail] =
    useState<CustomerRow | null>(null);
  const totalCalls = rows.reduce(
    (sum, row) =>
      sum + (row.callCount && row.callCount > 0 ? row.callCount : 1),
    0,
  );
  // Siempre mostrar el total de llamadas sumadas desde callCount
  const callsToShow = totalCalls;
  const normalizedTableSearch = tableSearch.trim().toLowerCase();
  const compactSearchDigits = normalizedTableSearch.replace(/\D/g, "");

  const filteredRows = useMemo(() => {
    if (!normalizedTableSearch) return rows;

    const matchesValue = (value: unknown) => {
      const text = String(value || "").toLowerCase();
      const normalizedText = text.replace(/[_-]+/g, " ");
      if (
        text.includes(normalizedTableSearch) ||
        normalizedText.includes(normalizedTableSearch)
      ) {
        return true;
      }

      if (compactSearchDigits.length >= 2) {
        const compactValueDigits = text.replace(/\D/g, "");
        if (compactValueDigits.includes(compactSearchDigits)) return true;
      }

      return false;
    };

    return rows.filter((row) => {
      if (matchesValue(title)) return true;

      const baseValues = [
        row.name,
        row.phone,
        row.status,
        row.note,
        row.direction,
        row.customerId?.toString(),
        row.ticketId?.toString(),
      ];

      const baseMatch = baseValues.some((value) => matchesValue(value));

      if (baseMatch) return true;

      return (row.callHistory || []).some((call) =>
        [
          call.ticketId?.toString(),
          call.status,
          call.note,
          call.direction,
          call.agentName,
          call.createdAt,
        ].some((value) => matchesValue(value)),
      );
    });
  }, [rows, normalizedTableSearch, compactSearchDigits, title]);

  const filteredCallsToShow = useMemo(
    () =>
      filteredRows.reduce(
        (sum, row) =>
          sum + (row.callCount && row.callCount > 0 ? row.callCount : 1),
        0,
      ),
    [filteredRows],
  );

  const handleRowClick = async (row: CustomerRow, index: number) => {
    // Función helper para redirigir a tickets con filtros de campaña y cliente
    const navigateToTickets = async (row: CustomerRow) => {
      // Si tenemos customerId directamente, usarlo
      if (row.customerId && campaignId) {
        // Verificar si es llamada perdida
        const isMissed =
          row.direction && row.direction.toLowerCase().includes("missed");
        const viewParam = isMissed ? "&view=missed" : "";

        const ticketsUrl = `/tickets?customerId=${
          row.customerId
        }&campaignId=${campaignId}&fromReport=campaign&reportStartDate=${encodeURIComponent(
          startDate,
        )}&reportEndDate=${encodeURIComponent(endDate)}${viewParam}`;
        router.push(ticketsUrl);
        return;
      }

      // Si no tenemos customerId, buscar por nombre/teléfono
      try {
        const customers = await fetchFromBackend("/customers?page=1&limit=500");
        const customerList = Array.isArray(customers)
          ? customers
          : customers?.data || [];

        // Buscar el cliente que coincida con el nombre o teléfono
        const customer = customerList.find(
          (c: any) =>
            (c.name && c.name.toLowerCase() === row.name.toLowerCase()) ||
            (c.phone && c.phone === row.phone),
        );

        if (customer && customer.id && campaignId) {
          // Verificar si es llamada perdida
          const isMissed =
            row.direction && row.direction.toLowerCase().includes("missed");
          const viewParam = isMissed ? "&view=missed" : "";

          // Redirigir a tickets con el customerId y campaignId
          const ticketsUrl = `/tickets?customerId=${
            customer.id
          }&campaignId=${campaignId}&fromReport=campaign&reportStartDate=${encodeURIComponent(
            startDate,
          )}&reportEndDate=${encodeURIComponent(endDate)}${viewParam}`;
          router.push(ticketsUrl);
        } else {
          toast({
            title: "Cliente no encontrado",
            description: "No se pudo encontrar el cliente en la base de datos.",
            variant: "destructive",
          });
        }
      } catch (error) {
        toast({
          title: "Error",
          description: "No se pudo buscar el cliente.",
          variant: "destructive",
        });
      }
    };

    // Redirigir a tickets con filtros de campaña
    await navigateToTickets(row);
  };

  return (
    <div className="flex flex-col gap-3 rounded-xl border bg-card text-card-foreground shadow-sm">
      <div className="border-b px-6 py-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0">
            <h3 className="font-semibold leading-none tracking-tight">
              {title}
            </h3>
            <p className="text-sm text-muted-foreground mt-1">
              {filteredCallsToShow}{" "}
              {filteredCallsToShow === 1 ? "call" : "calls"} found (
              {filteredRows.length}{" "}
              {filteredRows.length === 1 ? "customer" : "customers"})
              {normalizedTableSearch && (
                <span>
                  {" "}
                  · filtered from {callsToShow}{" "}
                  {callsToShow === 1 ? "call" : "calls"}
                </span>
              )}
            </p>
            <p className="text-xs text-blue-600 dark:text-blue-400 mt-2 flex items-center gap-1">
              💡 Click on any row to view customer details in Customer
              Management
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

      {/* Container with horizontal scroll for mobile responsiveness */}
      <div className="w-full overflow-x-auto">
        <div className="min-w-200 align-middle">
          <div className="grid grid-cols-13 bg-muted/50 text-xs font-semibold uppercase tracking-wider text-muted-foreground border-y">
            <div className="col-span-2 px-6 py-3">Customer</div>
            <div className="col-span-2 px-6 py-3">Phone</div>
            <div className="col-span-1 px-6 py-3">Calls</div>
            <div className="col-span-2 px-6 py-3">Direction</div>
            <div className="col-span-2 px-6 py-3">Status</div>
            <div className="col-span-2 px-6 py-3">Notes</div>
            <div className="col-span-2 px-6 py-3">Contact Date</div>
          </div>
          <div className="divide-y">
            {filteredRows.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center text-sm text-muted-foreground">
                <Users className="h-8 w-8 mb-2 opacity-20" />
                {normalizedTableSearch
                  ? "No matching customers in this table."
                  : "No customer data available for this section."}
              </div>
            ) : (
              filteredRows.map((row, index) => {
                const callCount = row.callCount || 1;
                const hasHistory =
                  row.callHistory && row.callHistory.length > 1;

                return (
                  <div
                    key={`${title}-${index}`}
                    className="grid grid-cols-13 text-sm hover:bg-muted/30 transition-colors cursor-pointer"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setSelectedRowForIssueDetail(row);
                      setShowIssueDetailModal(true);
                    }}
                  >
                    <div
                      className="col-span-2 px-6 py-3 font-medium truncate"
                      title={row.name}
                    >
                      {row.name}
                    </div>
                    <div className="col-span-2 px-6 py-3 text-muted-foreground truncate">
                      {row.phone || "—"}
                    </div>
                    <div className="col-span-1 px-6 py-3">
                      <span className="inline-flex items-center justify-center rounded-full border px-2.5 py-0.5 text-xs font-bold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 border-transparent bg-blue-500/10 text-blue-700 dark:text-blue-400">
                        {callCount}x
                      </span>
                    </div>
                    <div className="col-span-2 px-6 py-3">
                      {(() => {
                        const direction = (row.direction || "Unknown")
                          .toString()
                          .toLowerCase();
                        const isMissed = direction.includes("missed");
                        const isTextMessage =
                          direction.includes("text") ||
                          direction.includes("message");

                        // Determinar la dirección original si es missed
                        let originalDirection = null;
                        if (
                          isMissed &&
                          row.callHistory &&
                          row.callHistory.length > 0
                        ) {
                          // Buscar en el historial la dirección original (inbound o outbound)
                          for (const call of row.callHistory) {
                            const callDir = (call.direction || "")
                              .toString()
                              .toLowerCase();
                            if (
                              callDir.includes("inbound") &&
                              !callDir.includes("missed")
                            ) {
                              originalDirection = "inbound";
                              break;
                            } else if (
                              callDir.includes("outbound") &&
                              !callDir.includes("missed")
                            ) {
                              originalDirection = "outbound";
                              break;
                            }
                          }
                        }

                        // Si no encontramos en callHistory, intentar inferir desde el direction actual
                        if (isMissed && !originalDirection) {
                          if (direction.includes("inbound")) {
                            originalDirection = "inbound";
                          } else if (direction.includes("outbound")) {
                            originalDirection = "outbound";
                          }
                        }

                        let bgColor = "bg-slate-100 dark:bg-slate-800";
                        let textColor = "text-slate-700 dark:text-slate-300";
                        let borderColor =
                          "border-slate-200 dark:border-slate-700";
                        let icon = null;
                        let displayText = row.direction || "Unknown";

                        if (isMissed) {
                          // Siempre rojo para missed
                          bgColor = "bg-red-50 dark:bg-red-950/30";
                          textColor = "text-red-700 dark:text-red-400";
                          borderColor = "border-red-200 dark:border-red-800";
                          icon = <PhoneOff className="h-3 w-3" />;

                          // Formatear el texto como "Inbound (Missed)" o "Outbound (Missed)"
                          if (originalDirection === "inbound") {
                            displayText = "Inbound (Missed)";
                          } else if (originalDirection === "outbound") {
                            displayText = "Outbound (Missed)";
                          } else {
                            displayText = "Missed";
                          }
                        } else if (direction.includes("inbound")) {
                          bgColor = "bg-blue-50 dark:bg-blue-950/30";
                          textColor = "text-blue-700 dark:text-blue-400";
                          borderColor = "border-blue-200 dark:border-blue-800";
                          icon = <PhoneMissed className="h-3 w-3 rotate-180" />;
                          displayText = "Inbound";
                        } else if (direction.includes("outbound")) {
                          bgColor = "bg-emerald-50 dark:bg-emerald-950/30";
                          textColor = "text-emerald-700 dark:text-emerald-400";
                          borderColor =
                            "border-emerald-200 dark:border-emerald-800";
                          icon = <PhoneMissed className="h-3 w-3" />;
                          displayText = "Outbound";
                        } else if (isTextMessage) {
                          bgColor = "bg-purple-50 dark:bg-purple-950/30";
                          textColor = "text-purple-700 dark:text-purple-400";
                          borderColor =
                            "border-purple-200 dark:border-purple-800";
                          icon = <ReceiptText className="h-3 w-3" />;
                        }

                        return (
                          <div
                            className={cn(
                              "inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-semibold transition-all hover:shadow-sm",
                              bgColor,
                              textColor,
                              borderColor,
                            )}
                          >
                            {icon && (
                              <span className="flex-shrink-0">{icon}</span>
                            )}
                            <span>{displayText}</span>
                          </div>
                        );
                      })()}
                    </div>
                    <div className="col-span-2 px-6 py-3">
                      {(() => {
                        const status = (row.status || "")
                          .toString()
                          .toUpperCase();
                        const isPaid =
                          status.includes("PAID") && !status.includes("NOT");
                        const isNotPaid =
                          status.includes("NOT_PAID") ||
                          (status.includes("NOT") && status.includes("PAID"));
                        const isOfflinePayment =
                          status.includes("OFFLINE_PAYMENT");
                        const isNotPaidCheck =
                          status.includes("NOT_PAID_CHECK") ||
                          status.includes("PAID_CHECK");
                        const isMovedOut = status.includes("MOVED_OUT");
                        const isCanceled =
                          status.includes("CANCELED") ||
                          status.includes("CANCELLED");
                        const isBalance0 =
                          status.includes("BALANCE_0") ||
                          status.includes("BALANCE 0");
                        const isDoNotCall =
                          status.includes("DO_NOT_CALL") ||
                          status.includes("DON'T_CALL");

                        let bgColor = "bg-slate-100 dark:bg-slate-800";
                        let textColor = "text-slate-700 dark:text-slate-300";
                        let borderColor =
                          "border-slate-200 dark:border-slate-700";
                        let icon = null;

                        if (isPaid) {
                          bgColor = "bg-green-50 dark:bg-green-950/30";
                          textColor = "text-green-700 dark:text-green-400";
                          borderColor =
                            "border-green-200 dark:border-green-800";
                          icon = <CheckCircle2 className="h-3 w-3" />;
                        } else if (isNotPaid) {
                          bgColor = "bg-red-50 dark:bg-red-950/30";
                          textColor = "text-red-700 dark:text-red-400";
                          borderColor = "border-red-200 dark:border-red-800";
                          icon = <XCircle className="h-3 w-3" />;
                        } else if (isOfflinePayment) {
                          bgColor = "bg-amber-50 dark:bg-amber-950/30";
                          textColor = "text-amber-700 dark:text-amber-400";
                          borderColor =
                            "border-amber-200 dark:border-amber-800";
                          icon = <ReceiptText className="h-3 w-3" />;
                        } else if (isNotPaidCheck) {
                          bgColor = "bg-amber-50 dark:bg-amber-950/30";
                          textColor = "text-amber-700 dark:text-amber-400";
                          borderColor =
                            "border-amber-200 dark:border-amber-800";
                          icon = <FileText className="h-3 w-3" />;
                        } else if (isMovedOut) {
                          bgColor = "bg-orange-50 dark:bg-orange-950/30";
                          textColor = "text-orange-700 dark:text-orange-400";
                          borderColor =
                            "border-orange-200 dark:border-orange-800";
                          icon = <MoveRight className="h-3 w-3" />;
                        } else if (isCanceled) {
                          bgColor = "bg-rose-50 dark:bg-rose-950/30";
                          textColor = "text-rose-700 dark:text-rose-400";
                          borderColor = "border-rose-200 dark:border-rose-800";
                          icon = <Ban className="h-3 w-3" />;
                        } else if (isBalance0) {
                          bgColor = "bg-teal-50 dark:bg-teal-950/30";
                          textColor = "text-teal-700 dark:text-teal-400";
                          borderColor = "border-teal-200 dark:border-teal-800";
                          icon = <BadgeDollarSign className="h-3 w-3" />;
                        } else if (isDoNotCall) {
                          bgColor = "bg-red-50 dark:bg-red-950/30";
                          textColor = "text-red-700 dark:text-red-400";
                          borderColor = "border-red-200 dark:border-red-800";
                          icon = <PhoneOff className="h-3 w-3" />;
                        }

                        return (
                          <div
                            className={cn(
                              "inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-semibold transition-all hover:shadow-sm",
                              bgColor,
                              textColor,
                              borderColor,
                            )}
                          >
                            {icon && (
                              <span className="flex-shrink-0">{icon}</span>
                            )}
                            <span className="capitalize">
                              {row.status || "Unknown"}
                            </span>
                          </div>
                        );
                      })()}
                    </div>
                    <div className="col-span-2 px-6 py-3 text-muted-foreground wrap-break-word text-xs">
                      <div className="space-y-1">
                        <div className="font-medium">{row.note || "—"}</div>
                      </div>
                    </div>
                    <div className="col-span-2 px-6 py-3">
                      {row.callHistory && row.callHistory.length > 0 ? (
                        <div className="space-y-1.5">
                          {row.callHistory.map((call, idx) => {
                            const date = new Date(call.createdAt);
                            const formattedDate = date.toLocaleDateString(
                              "en-US",
                              {
                                month: "short",
                                day: "numeric",
                                year: "numeric",
                              },
                            );
                            const formattedTime = date.toLocaleTimeString(
                              "en-US",
                              {
                                hour: "2-digit",
                                minute: "2-digit",
                                hour12: true,
                              },
                            );
                            const isToday =
                              date.toDateString() === new Date().toDateString();
                            const isYesterday =
                              date.toDateString() ===
                              new Date(Date.now() - 86400000).toDateString();

                            return (
                              <div
                                key={idx}
                                className="flex items-start gap-2 p-1.5 rounded bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800"
                              >
                                <span className="flex-shrink-0 text-[10px] font-semibold text-primary w-4 text-center pt-0.5">
                                  {idx + 1}.
                                </span>
                                <div className="flex-1 min-w-0 flex flex-col">
                                  <div className="text-xs font-medium text-foreground leading-tight">
                                    {isToday
                                      ? "Today"
                                      : isYesterday
                                        ? "Yesterday"
                                        : formattedDate}
                                  </div>
                                  <div className="text-[11px] text-muted-foreground leading-tight mt-0.5">
                                    {formattedTime}
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <div className="text-center py-1">
                          <span className="text-xs text-muted-foreground">
                            —
                          </span>
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

      {/* Issue Detail Modal */}
      <Dialog
        open={showIssueDetailModal}
        onOpenChange={setShowIssueDetailModal}
      >
        <DialogContent className="flex flex-col gap-0 w-[calc(100vw-1rem)] max-h-[82vh] overflow-hidden rounded-2xl p-0 sm:size-[min(520px,calc(100vh-2rem))] sm:max-w-none sm:max-h-none">
          <DialogHeader className="border-b bg-card/60 px-5 py-4">
            <DialogTitle className="flex items-center gap-2 text-lg font-bold">
              <FileText className="h-5 w-5 text-primary" />
              Issue Detail
            </DialogTitle>
            <DialogDescription className="text-sm">
              {selectedRowForIssueDetail?.phone ||
                selectedRowForIssueDetail?.name ||
                "Customer"}{" "}
              - {selectedRowForIssueDetail?.callHistory?.length || 0} detail
              {selectedRowForIssueDetail?.callHistory?.length === 1 ? "" : "s"}
            </DialogDescription>
          </DialogHeader>

          <ScrollArea className="min-h-0 flex-1 bg-muted/10">
            <div className="space-y-3 p-4">
              {selectedRowForIssueDetail?.callHistory &&
              selectedRowForIssueDetail.callHistory.length > 0 ? (
                [...selectedRowForIssueDetail.callHistory]
                  .sort(
                    (a, b) =>
                      new Date(b.createdAt).getTime() -
                      new Date(a.createdAt).getTime(),
                  )
                  .map((call, index) => {
                    const formatDate = (date: string | Date) => {
                      const d = new Date(date);
                      return d.toLocaleString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      });
                    };

                    return (
                      <div
                        key={`${call.ticketId}-${index}`}
                        className="rounded-xl border bg-card p-3.5 shadow-sm"
                      >
                        <div className="mb-2 flex items-center justify-between gap-2 flex-wrap">
                          <Badge variant="outline" className="font-mono">
                            Ticket #{call.ticketId}
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            {formatDate(call.createdAt)}
                          </span>
                        </div>
                        {call.note || call.issueDetail ? (
                          <p className="text-sm leading-relaxed text-foreground whitespace-pre-wrap break-words">
                            {call.note || call.issueDetail}
                          </p>
                        ) : (
                          <p className="text-sm text-muted-foreground italic">
                            No note available
                          </p>
                        )}
                      </div>
                    );
                  })
              ) : (
                <div className="rounded-xl border border-dashed bg-card/60 p-6 text-center text-sm text-muted-foreground">
                  No Issue Detail available for this customer.
                </div>
              )}
            </div>
          </ScrollArea>

          <DialogFooter className="border-t bg-card/60 px-5 py-3">
            <div className="flex gap-2 w-full sm:w-auto">
              <Button
                type="button"
                variant="outline"
                className="flex-1 sm:flex-none"
                onClick={() => {
                  if (selectedRowForIssueDetail) {
                    const params = new URLSearchParams();
                    if (selectedRowForIssueDetail.customerId) {
                      params.set(
                        "customerId",
                        selectedRowForIssueDetail.customerId.toString(),
                      );
                    }
                    if (campaignId) {
                      params.set("campaignId", campaignId.toString());
                    }
                    params.set("fromReport", "campaign");
                    params.set("reportStartDate", startDate);
                    params.set("reportEndDate", endDate);

                    const ticketsUrl = `/tickets?${params.toString()}`;
                    router.push(ticketsUrl);
                  }
                }}
              >
                <History className="h-4 w-4 mr-2" />
                View Tickets
              </Button>
              <Button
                type="button"
                variant="default"
                className="flex-1 sm:flex-none"
                onClick={() => setShowIssueDetailModal(false)}
              >
                Close
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default function CampaignReportsPage() {
  const searchParams = useSearchParams();
  const campaignIdParam = searchParams.get("campaignId");

  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [selectedCampaignId, setSelectedCampaignId] = useState<string>("");
  const [campaignOpen, setCampaignOpen] = useState(false);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState<ReportData | null>(null);
  const [logoDataUrl, setLogoDataUrl] = useState<string | null>(null);
  const [logoFormat, setLogoFormat] = useState<"PNG" | "JPEG">("JPEG");
  const [logoSize, setLogoSize] = useState<ImageSize | null>(null);
  const urlParamsLoaded = useRef(false);

  const getLogoUrl = () =>
    typeof window !== "undefined"
      ? `${window.location.origin}/images/logo.jpeg`
      : "/images/logo.jpeg";

  useEffect(() => {
    const fetchCampaigns = async () => {
      try {
        const data = await fetchFromBackend("/campaign?page=1&limit=500");
        const items = Array.isArray(data) ? data : data?.data || [];
        setCampaigns(items);
      } catch (error: any) {
        console.error("Error fetching campaigns:", error);

        // Determinar el tipo de error y mostrar un mensaje apropiado
        let errorMessage = "Failed to load campaigns";
        if (
          error?.message?.includes("fetch failed") ||
          error?.message?.includes("Failed to fetch")
        ) {
          errorMessage =
            "Cannot connect to backend server. Please check if the backend is running.";
        } else if (error?.status === 401) {
          errorMessage = "Session expired. Please login again.";
        } else if (error?.message) {
          errorMessage = error.message;
        }

        toast({
          title: "Error",
          description: errorMessage,
          variant: "destructive",
        });
      }
    };
    fetchCampaigns();
  }, []);

  useEffect(() => {
    if (campaignIdParam) setSelectedCampaignId(campaignIdParam);
  }, [campaignIdParam]);

  // Load startDate and endDate from URL params (only once on mount)
  useEffect(() => {
    if (urlParamsLoaded.current) return;

    const startDateParam = searchParams.get("startDate");
    const endDateParam = searchParams.get("endDate");

    if (startDateParam) {
      setStartDate(decodeURIComponent(startDateParam));
    }
    if (endDateParam) {
      setEndDate(decodeURIComponent(endDateParam));
    }

    urlParamsLoaded.current = true;
  }, [searchParams]);

  // Auto-populate date range when campaign is selected
  useEffect(() => {
    if (selectedCampaignId && campaigns.length > 0) {
      const campaign = campaigns.find(
        (c) => c.id.toString() === selectedCampaignId,
      );
      if (campaign?.createdAt) {
        // Set start date to campaign creation date
        const createdDate = new Date(campaign.createdAt);
        const formattedStartDate = createdDate.toISOString().split("T")[0];

        // Set end date to today
        const today = new Date();
        const formattedEndDate = today.toISOString().split("T")[0];

        // Update dates and clear previous report
        setStartDate(formattedStartDate);
        setEndDate(formattedEndDate);
        setReport(null);
      }
    }
  }, [selectedCampaignId, campaigns]);

  useEffect(() => {
    const loadLogo = async () => {
      try {
        const response = await fetch("/images/logo.jpeg");
        if (!response.ok) throw new Error("Logo not found");
        const blob = await response.blob();
        const format =
          blob.type.includes("jpeg") || blob.type.includes("jpg")
            ? "JPEG"
            : "PNG";
        setLogoFormat(format);
        const reader = new FileReader();
        reader.onloadend = () => {
          if (reader.result && typeof reader.result === "string") {
            setLogoDataUrl(reader.result);
            const img = new Image();
            img.onload = () =>
              setLogoSize({ width: img.width, height: img.height });
            img.src = reader.result;
          }
        };
        reader.readAsDataURL(blob);
      } catch (error) {
        console.error("Error loading logo", error);
      }
    };
    loadLogo();
  }, []);

  // Auto-generate report when all parameters are loaded from URL
  useEffect(() => {
    const autoGenerateReport = async () => {
      // Check if we have all required params and no report yet
      if (
        selectedCampaignId &&
        startDate &&
        endDate &&
        !report &&
        !loading &&
        campaigns.length > 0
      ) {
        await buildReport();
      }
    };
    autoGenerateReport();
  }, [selectedCampaignId, startDate, endDate, campaigns]);
  // Note: buildReport and report are intentionally not in dependencies to avoid infinite loop

  const selectedCampaign = useMemo(() => {
    return (
      campaigns.find((c) => c.id.toString() === selectedCampaignId) || null
    );
  }, [campaigns, selectedCampaignId]);

  const metricValueByTitle = useMemo(() => {
    const map = new Map<string, number>();
    if (!report?.metrics) return map;
    report.metrics.forEach((metric) => {
      map.set(metric.title, Number(metric.value || 0));
    });
    return map;
  }, [report]);

  const buildReport = async () => {
    if (!selectedCampaignId || !startDate || !endDate) {
      toast({
        title: "Select campaign and dates",
        description: "You must select a campaign and date range.",
        variant: "destructive",
      });
      return;
    }
    try {
      setLoading(true);
      const params = new URLSearchParams({
        startDate,
        endDate,
      });

      const response = await fetchFromBackend(
        `/campaign/${selectedCampaignId}/report?${params.toString()}`,
      );

      if (!response) throw new Error("No data from backend");

      // El backend ya entrega los datos correctos: cuenta clientes únicos, no tickets individuales
      setReport({
        campaign: response.campaign || null,
        metrics: response.metrics || [],
        totalCustomers: response.totals?.total || 0,
        reportLines: [],
        tables: response.tables || [],
      });
    } catch (error: any) {
      console.error(error);
      toast({
        title: "Error",
        description: error.message || "Failed to generate report.",
        variant: "destructive",
      });
      setReport(null);
    } finally {
      setLoading(false);
    }
  };

  const exportPdfBackend = async () => {
    if (!report) return;
    if (!startDate || !endDate) {
      toast({
        title: "Select dates",
        description: "Start and end date are required to export the PDF.",
        variant: "destructive",
      });
      return;
    }
    try {
      const params = new URLSearchParams({
        startDate,
        endDate,
        logoUrl: getLogoUrl(),
      });
      const blob = await fetchBlobFromBackend(
        `/campaign/${selectedCampaignId}/report/pdf?${params.toString()}`,
        { method: "GET" },
      );
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `campaign_report_${selectedCampaignId}.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to download PDF",
        variant: "destructive",
      });
    }
  };

  const exportExcelBackend = async () => {
    if (!report) return;
    if (!startDate || !endDate) {
      toast({
        title: "Select dates",
        description: "Start and end date are required to export the Excel.",
        variant: "destructive",
      });
      return;
    }

    try {
      const params = new URLSearchParams({
        startDate,
        endDate,
      });
      const blob = await fetchBlobFromBackend(
        `/campaign/${selectedCampaignId}/report/excel?${params.toString()}`,
        { method: "GET" },
      );
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `campaign_report_${selectedCampaignId}_${startDate}_to_${endDate}.xlsx`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      toast({
        title: "Success",
        description: "Excel file downloaded successfully.",
      });
    } catch (error: any) {
      console.error("Excel export error:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to download Excel file",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-50 via-white to-slate-100 p-4 md:p-8 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 animate-in fade-in duration-500">
      <div className="mx-auto max-w-7xl space-y-10">
        {/* Header Section */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-foreground drop-shadow-sm">
              Campaign Reports
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Analyze performance and generate customer lists for campaigns.
            </p>
          </div>
          <div className="flex items-center gap-2">
            {/* Botón PDF */}
            <Button
              variant="outline"
              onClick={exportPdfBackend}
              disabled={!report}
              className="gap-2"
            >
              <Download className="h-4 w-4" />
              <span className="hidden sm:inline">Export PDF</span>
            </Button>

            {/* --- 3. NUEVO BOTÓN EXCEL --- */}
            <Button
              variant="outline"
              onClick={exportExcelBackend}
              disabled={!report}
              className="gap-2 bg-green-50 hover:bg-green-100 border-green-200 "
            >
              <FileSpreadsheet className="h-4 w-4" />
              <span className="hidden sm:inline">Export Excel</span>
            </Button>

            {/* Botón Generar */}
            <Button
              onClick={buildReport}
              disabled={loading}
              className="gap-2 min-w-35"
            >
              {loading ? (
                <>Generating...</>
              ) : (
                <>
                  <FileText className="h-4 w-4" /> Generate Report
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Filters Section */}
        <div className="rounded-2xl border bg-card/80 backdrop-blur-sm p-4 shadow-lg shadow-slate-200/60 dark:shadow-slate-950/40 md:p-6">
          <div className="flex items-center gap-2 mb-4 text-sm font-semibold text-muted-foreground">
            <Filter className="w-4 h-4" /> Report Configuration
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <label className="text-xs font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                Campaign
              </label>
              <Popover open={campaignOpen} onOpenChange={setCampaignOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={campaignOpen}
                    className="w-full justify-between"
                  >
                    {selectedCampaignId
                      ? campaigns.find(
                          (c) => c.id.toString() === selectedCampaignId,
                        )?.nombre
                      : "Select a campaign..."}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-full p-0" align="start">
                  <Command>
                    <CommandInput placeholder="Search campaign..." />
                    <CommandList>
                      <CommandEmpty>No campaign found.</CommandEmpty>
                      <CommandGroup>
                        {campaigns.map((c) => (
                          <CommandItem
                            key={c.id}
                            value={c.nombre}
                            onSelect={() => {
                              setSelectedCampaignId(c.id.toString());
                              setCampaignOpen(false);
                            }}
                          >
                            <Check
                              className={cn(
                                "mr-2 h-4 w-4",
                                selectedCampaignId === c.id.toString()
                                  ? "opacity-100"
                                  : "opacity-0",
                              )}
                            />
                            {c.nombre}
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-medium leading-none">
                Start Date
              </label>
              <div className="relative">
                <CalendarDays className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  type="date"
                  className="pl-9"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-medium leading-none">
                End Date
              </label>
              <div className="relative">
                <CalendarDays className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  type="date"
                  className="pl-9"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Results Section */}
        {!report ? (
          <div className="flex min-h-100 flex-col items-center justify-center rounded-xl border border-dashed bg-muted/10 p-8 text-center animate-in zoom-in-95 duration-300">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-muted">
              <Search className="h-6 w-6 text-muted-foreground" />
            </div>
            <h3 className="mt-4 text-lg font-semibold">No report generated</h3>
            <p className="mb-4 mt-2 text-sm text-muted-foreground max-w-sm">
              Select a campaign and date range above, then click "Generate
              Report" to view the data.
            </p>
          </div>
        ) : (
          <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-500">
            {/* Metrics Grid */}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {report.metrics.map((metric, idx) => (
                <MetricCard key={idx} metric={metric} />
              ))}
            </div>

            {/* Report Summary/Notes */}
            {report.reportLines.length > 0 && (
              <div className="rounded-lg border bg-blue-50/50 p-4 text-sm text-blue-900 dark:bg-blue-950/20 dark:text-blue-100">
                <h4 className="font-semibold flex items-center gap-2 mb-2">
                  <FileText className="h-4 w-4" /> Report Summary
                </h4>
                <div className="space-y-1 pl-6 border-l-2 border-blue-200 dark:border-blue-800">
                  {report.reportLines.map((line, i) => (
                    <p key={i}>{line}</p>
                  ))}
                </div>
              </div>
            )}

            {/* Tables */}
            <div className="space-y-8">
              {report.tables.map((table) => (
                <CustomerTable
                  key={table.title}
                  title={table.title}
                  rows={table.rows}
                  campaignId={
                    selectedCampaignId ? parseInt(selectedCampaignId) : null
                  }
                  startDate={startDate}
                  endDate={endDate}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
