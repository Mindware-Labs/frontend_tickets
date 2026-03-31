"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Phone,
  User,
  Calendar,
  Ticket,
  Hash,
  Copy,
  Check,
  Info,
  History,
  Megaphone,
  Target,
  CheckCircle2,
  Circle,
  Timer,
  XCircle,
  HelpCircle,
  ExternalLink,
  List,
  StickyNote,
} from "lucide-react";
import type { Customer } from "../types";
import { cn } from "@/lib/utils";

interface CallHistoryItem {
  aircallId?: string;
  direction: string;
  originalDirection?: string;
  isMissed: boolean;
  duration?: number;
  agentId?: number;
  agentName?: string;
  createdAt: string;
  issueDetail?: string;
  campaignOption?: string;
  status?: string;
}

interface TicketSummary {
  id: number;
  status?: string | null;
  createdAt?: string | null;
  campaignOption?: string | null;
  callHistory?: CallHistoryItem[];
  direction?: string;
  originalDirection?: string;
}

interface CustomerDetailsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  customer: Customer | null;
  tickets: TicketSummary[];
  ticketsLoading?: boolean;
}

const InfoItem = ({
  icon: Icon,
  label,
  value,
  className,
  children,
}: {
  icon: any;
  label: string;
  value?: string | number | null;
  className?: string;
  children?: React.ReactNode;
}) => {
  if (!value && !children) return null;
  return (
    <div className={cn("flex flex-col space-y-1.5", className)}>
      <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground uppercase tracking-wider">
        <Icon className="h-3.5 w-3.5" />
        {label}
      </div>
      <div className="text-sm font-medium text-foreground pl-1 break-words">
        {children || value}
      </div>
    </div>
  );
};

// Helper para configurar el estilo del estado
const getStatusConfig = (status: string | null | undefined) => {
  const s = status?.toLowerCase() || "";

  if (s.includes("closed") || s.includes("resolved")) {
    return {
      color:
        "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/25",
      icon: CheckCircle2,
      label: status,
    };
  }
  if (s.includes("progress") || s.includes("working")) {
    return {
      color:
        "bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/20 hover:bg-amber-500/25",
      icon: Timer,
      label: "In Progress", // Normalizamos el texto si quieres
    };
  }
  if (s.includes("open") || s.includes("new")) {
    return {
      color:
        "bg-blue-500/15 text-blue-700 dark:text-blue-400 border-blue-500/20 hover:bg-blue-500/25",
      icon: Circle,
      label: "Open",
    };
  }
  if (s.includes("cancel")) {
    return {
      color:
        "bg-red-500/15 text-red-700 dark:text-red-400 border-red-500/20 hover:bg-red-500/25",
      icon: XCircle,
      label: status,
    };
  }

  return {
    color:
      "bg-slate-500/15 text-slate-700 dark:text-slate-400 border-slate-500/20 hover:bg-slate-500/25",
    icon: HelpCircle,
    label: status || "Unknown",
  };
};

export function CustomerDetailsModal({
  open,
  onOpenChange,
  customer,
  tickets,
  ticketsLoading = false,
}: CustomerDetailsModalProps) {
  const [copied, setCopied] = useState(false);
  const router = useRouter();

  if (!customer) return null;

  const handleCopyPhone = () => {
    if (customer.phone) {
      navigator.clipboard.writeText(customer.phone);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const createdDate = customer.createdAt
    ? new Date(customer.createdAt).toLocaleDateString(undefined, {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : "N/A";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-3xl p-0 gap-0 overflow-hidden bg-background border-border shadow-xl">
        {/* Header */}
        <DialogHeader className="p-6 pb-4 bg-muted/20 border-b border-border/50">
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
            <div className="flex items-start gap-4">
              <div className="h-14 w-14 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-primary font-bold text-xl shadow-sm">
                {(customer.name || customer.phone || "C")
                  .slice(0, 2)
                  .toUpperCase()}
              </div>
              <div className="space-y-1 mt-0.5">
                <DialogTitle className="text-2xl font-bold tracking-tight">
                  {customer.name || "Unknown Customer"}
                </DialogTitle>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1.5 bg-background/50 px-2 py-0.5 rounded-md border border-border/50">
                    <User className="h-3 w-3" />
                    <span className="text-xs font-medium">Customer</span>
                  </div>
                  {customer.id && (
                    <span className="text-muted-foreground/50 text-xs">
                      ID: {customer.id}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </DialogHeader>

        {/* Scrollable Content */}
        <ScrollArea className="max-h-[70vh]">
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
              {/* Left Column: Customer Info & Campaigns (5 cols) */}
              <div className="md:col-span-5 space-y-6">
                {/* Contact Info Card */}
                <div className="space-y-4">
                  <h4 className="text-sm font-semibold text-foreground flex items-center gap-2">
                    <Info className="h-4 w-4" /> Contact & Info
                  </h4>
                  <div className="grid gap-5 p-5 rounded-lg border bg-card text-card-foreground shadow-sm">
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                        <Phone className="h-3.5 w-3.5" />
                        Phone Number
                      </div>
                      <div
                        className="flex items-center gap-2 group cursor-pointer"
                        onClick={handleCopyPhone}
                        title="Click to copy"
                      >
                        <span className="text-lg font-semibold tracking-tight">
                          {customer.phone || "N/A"}
                        </span>
                        {customer.phone &&
                          (copied ? (
                            <Check className="h-3.5 w-3.5 text-emerald-500" />
                          ) : (
                            <Copy className="h-3.5 w-3.5 opacity-0 group-hover:opacity-100 text-muted-foreground transition-opacity" />
                          ))}
                      </div>
                    </div>

                    <div className="h-px bg-border/50" />

                    <InfoItem
                      icon={Calendar}
                      label="Customer Since"
                      value={createdDate}
                    />
                  </div>
                </div>

                {/* Notes Popover */}
                {customer.notes && customer.notes.length > 0 && (
                  <Popover>
                    <PopoverTrigger asChild>
                      <button className="w-full flex items-center gap-3 p-3.5 rounded-lg border bg-card hover:bg-muted/30 transition-colors cursor-pointer text-left shadow-sm">
                        <div className="h-9 w-9 rounded-md bg-amber-500/10 flex items-center justify-center shrink-0 border border-amber-500/20">
                          <StickyNote className="h-4 w-4 text-amber-500" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium">Notes</p>
                          <p className="text-[10px] text-muted-foreground mt-0.5">
                            {customer.notes.length} note
                            {customer.notes.length !== 1 ? "s" : ""}
                          </p>
                        </div>
                        <Badge
                          variant="secondary"
                          className="text-[10px] font-mono"
                        >
                          {customer.notes.length}
                        </Badge>
                      </button>
                    </PopoverTrigger>
                    <PopoverContent align="start" className="w-80 p-0">
                      <div className="px-4 py-3 border-b border-border/50">
                        <h4 className="text-sm font-semibold flex items-center gap-2">
                          <StickyNote className="h-4 w-4 text-amber-500" />
                          Notes
                        </h4>
                      </div>
                      <div className="max-h-[280px] overflow-y-auto p-2 space-y-2 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-border/50">
                        {customer.notes.map((note) => (
                          <div
                            key={note.id}
                            className="bg-muted/30 border border-border/50 rounded-lg p-3 text-sm"
                          >
                            <p className="text-foreground/90 whitespace-pre-wrap break-words leading-relaxed">
                              {note.content}
                            </p>
                            <div className="mt-2 flex items-center gap-1.5 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                              <Calendar className="h-3 w-3 opacity-70" />
                              {new Date(note.createdAt).toLocaleDateString(
                                undefined,
                                {
                                  day: "2-digit",
                                  month: "short",
                                  year: "numeric",
                                  hour: "2-digit",
                                  minute: "2-digit",
                                },
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </PopoverContent>
                  </Popover>
                )}

                {/* Campaigns Section */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-semibold text-foreground flex items-center gap-2">
                      <Target className="h-4 w-4" /> Active Campaigns
                    </h4>
                    {customer.campaigns && customer.campaigns.length > 0 && (
                      <span className="text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded-sm">
                        {customer.campaigns.length}
                      </span>
                    )}
                  </div>

                  {customer.campaigns && customer.campaigns.length > 0 ? (
                    <div className="max-h-[250px] overflow-y-auto pr-1 -mr-1">
                      <div className="grid grid-cols-1 gap-2">
                        {customer.campaigns.map((campaign) => (
                          <div
                            key={campaign.id}
                            className="flex items-center gap-3 p-2.5 rounded-lg border bg-card/50 hover:bg-card hover:border-primary/20 transition-all group"
                          >
                            <div className="h-9 w-9 rounded-md bg-amber-500/10 flex items-center justify-center shrink-0 border border-amber-500/20 group-hover:bg-amber-500/20 transition-colors">
                              <Megaphone className="h-4 w-4 text-amber-600 dark:text-amber-500" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p
                                className="text-sm font-medium truncate leading-tight"
                                title={campaign.nombre}
                              >
                                {campaign.nombre}
                              </p>
                              <p className="text-[10px] text-muted-foreground mt-0.5">
                                Campaign ID: {campaign.id}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center p-6 rounded-lg border border-dashed bg-muted/5 text-muted-foreground gap-2">
                      <Megaphone className="h-8 w-8 opacity-20" />
                      <p className="text-xs">No active campaigns</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Right Column: Ticket History (7 cols) */}
              <div className="md:col-span-7 flex flex-col gap-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-semibold text-foreground flex items-center gap-2">
                    <History className="h-4 w-4" /> Ticket History
                  </h4>
                  <Badge variant="outline" className="text-xs font-mono">
                    {tickets.length} Records
                  </Badge>
                </div>

                {/* Ticket List Container */}
                <div className="rounded-lg border bg-card text-card-foreground shadow-sm overflow-hidden flex flex-col h-[450px]">
                  {ticketsLoading ? (
                    <div className="flex-1 flex items-center justify-center p-8 text-sm text-muted-foreground h-full">
                      Loading tickets...
                    </div>
                  ) : tickets.length === 0 ? (
                    <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground gap-3 p-8 h-full">
                      <div className="p-3 bg-muted/20 rounded-full">
                        <Ticket className="h-8 w-8 opacity-40" />
                      </div>
                      <p className="text-sm font-medium">
                        No tickets found for this customer.
                      </p>
                    </div>
                  ) : (
                    <ScrollArea className="flex-1 h-full">
                      <div className="divide-y divide-border/50">
                        {tickets.map((ticket) => {
                          const statusConfig = getStatusConfig(ticket.status);
                          const StatusIcon = statusConfig.icon;
                          const callHistory = ticket.callHistory || [];
                          const hasHistory = callHistory.length > 0;

                          return (
                            <div key={ticket.id} className="group">
                              <div
                                className="p-4 flex items-center justify-between gap-4 hover:bg-muted/30 transition-colors cursor-pointer"
                                onClick={() => {
                                  router.push(`/tickets?id=${ticket.id}`);
                                  onOpenChange(false);
                                }}
                              >
                                <div className="flex items-start gap-3 min-w-0 flex-1">
                                  <div className="mt-0.5 h-8 w-8 rounded-md bg-primary/10 flex items-center justify-center shrink-0 text-primary">
                                    <Hash className="h-4 w-4" />
                                  </div>
                                  <div className="min-w-0 space-y-0.5 flex-1">
                                    <p className="text-sm font-semibold truncate flex items-center gap-2">
                                      Ticket #{ticket.id}
                                      <ExternalLink className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                                    </p>
                                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                      <span className="flex items-center gap-1">
                                        <Calendar className="h-3 w-3" />
                                        {ticket.createdAt
                                          ? new Date(
                                              ticket.createdAt,
                                            ).toLocaleDateString()
                                          : "No date"}
                                      </span>
                                      {ticket.campaignOption && (
                                        <>
                                          <span className="text-muted-foreground/30">
                                            •
                                          </span>
                                          <span
                                            className="truncate max-w-[150px]"
                                            title={ticket.campaignOption}
                                          >
                                            {ticket.campaignOption}
                                          </span>
                                        </>
                                      )}
                                      {hasHistory && (
                                        <>
                                          <span className="text-muted-foreground/30">
                                            •
                                          </span>
                                          <span className="text-blue-600 dark:text-blue-400">
                                            {callHistory.length} llamada
                                            {callHistory.length !== 1
                                              ? "s"
                                              : ""}
                                          </span>
                                        </>
                                      )}
                                    </div>
                                  </div>
                                </div>

                                <Badge
                                  variant="outline"
                                  className={cn(
                                    "flex items-center gap-1.5 px-2.5 py-0.5 text-[10px] uppercase tracking-wider font-bold shadow-none shrink-0 transition-colors",
                                    statusConfig.color,
                                  )}
                                >
                                  <StatusIcon className="h-3 w-3" />
                                  {(statusConfig.label || "Unknown").replace(
                                    /_/g,
                                    " ",
                                  )}
                                </Badge>
                              </div>

                              {/* Call History */}
                              {hasHistory && (
                                <div className="px-4 pb-4 border-t border-border/50 bg-muted/5">
                                  <details className="mt-2">
                                    <summary className="cursor-pointer text-xs text-blue-600 dark:text-blue-400 hover:underline select-none flex items-center gap-1 py-1">
                                      <svg
                                        className="w-3 h-3 transition-transform group-open:rotate-90"
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                      >
                                        <path
                                          strokeLinecap="round"
                                          strokeLinejoin="round"
                                          strokeWidth={2}
                                          d="M9 5l7 7-7 7"
                                        />
                                      </svg>
                                      Ver historial de llamadas (
                                      {callHistory.length})
                                    </summary>
                                    <div className="mt-2 space-y-2 pl-4 border-l-2 border-muted max-h-40 overflow-y-auto">
                                      {callHistory
                                        .slice()
                                        .reverse()
                                        .map((call, idx) => {
                                          const directionText = call.isMissed
                                            ? `Missed (${call.originalDirection || call.direction})`
                                            : call.direction;
                                          const directionColor = call.isMissed
                                            ? "text-red-600 dark:text-red-400"
                                            : call.direction === "INBOUND"
                                              ? "text-green-600 dark:text-green-400"
                                              : "text-blue-600 dark:text-blue-400";

                                          return (
                                            <div
                                              key={idx}
                                              className="text-[10px] space-y-1 py-1"
                                            >
                                              <div className="flex items-center gap-2 flex-wrap">
                                                <span className="font-semibold">
                                                  {new Date(
                                                    call.createdAt,
                                                  ).toLocaleString()}
                                                </span>
                                                <Badge
                                                  variant="outline"
                                                  className={`text-[9px] px-1 py-0 ${directionColor}`}
                                                >
                                                  {directionText}
                                                </Badge>
                                                {call.agentName && (
                                                  <span className="text-muted-foreground">
                                                    {call.agentName}
                                                  </span>
                                                )}
                                                {call.duration && (
                                                  <span className="text-muted-foreground">
                                                    {Math.floor(
                                                      call.duration / 60,
                                                    )}
                                                    m {call.duration % 60}s
                                                  </span>
                                                )}
                                              </div>
                                              {call.issueDetail && (
                                                <div className="text-muted-foreground italic">
                                                  {call.issueDetail}
                                                </div>
                                              )}
                                            </div>
                                          );
                                        })}
                                    </div>
                                  </details>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </ScrollArea>
                  )}
                </div>
              </div>
            </div>
          </div>
        </ScrollArea>

        <DialogFooter className="p-4 bg-muted/20 border-t border-border/50 flex justify-between">
          <Button
            variant="default"
            onClick={() => {
              router.push(`/tickets?customerId=${customer.id}`);
              onOpenChange(false);
            }}
            className="gap-2"
          >
            <List className="h-4 w-4" />
            View All Tickets
          </Button>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
