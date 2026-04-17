"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import Link from "next/link";
import {
  Tag,
  Clock,
  Building,
  Ticket,
  FileText,
  ExternalLink,
  Copy,
  Check,
  Info,
  CalendarDays,
  BarChart3,
  CheckCircle2, // Nuevo icono
  XCircle, // Nuevo icono
  DollarSign, // Nuevo icono
  Ban, // Nuevo icono
} from "lucide-react";
import type { Campaign } from "../types";
// Importamos el Enum
import { ManagementType } from "../../calls/types";
import { useRole } from "@/components/providers/role-provider";
import { cn } from "@/lib/utils";

type CampaignDetailsModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  campaign: Campaign | null;
  campaignTypeLabels: Record<string, string>;
  getStatusColor: (isActive: boolean) => string;
  getYardLabel: (campaign: Campaign) => string;
  showTicketsPanel: boolean;
  ticketsLoading: boolean;
  tickets: any[];
  ticketSearch: string;
  setTicketSearch: (value: string) => void;
  onViewTickets: () => void;
};

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

export function CampaignDetailsModal({
  open,
  onOpenChange,
  campaign,
  campaignTypeLabels,
  getStatusColor,
  getYardLabel,
  showTicketsPanel,
  ticketsLoading,
  tickets,
  ticketSearch,
  setTicketSearch,
  onViewTickets,
}: CampaignDetailsModalProps) {
  const { role } = useRole();
  const isAgent = role?.toString().toLowerCase() === "agent";
  const [copied, setCopied] = useState(false);

  const handleCopyId = () => {
    if (campaign?.id) {
      navigator.clipboard.writeText(String(campaign.id));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (!campaign) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-3xl p-0 gap-0 overflow-hidden bg-background border-border shadow-xl">
        {/* Header */}
        <DialogHeader className="p-6 pb-4 bg-muted/20 border-b border-border/50">
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
            <div className="flex items-start gap-4">
              <div className="p-3 rounded-xl bg-primary/10 border border-primary/20 shadow-sm">
                <Tag className="h-6 w-6 text-primary" />
              </div>
              <div className="space-y-2">
                <div>
                  <DialogTitle className="text-2xl font-bold tracking-tight">
                    {campaign.nombre || "Campaign Details"}
                  </DialogTitle>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                    <div className="flex items-center gap-1.5 bg-background/50 px-2 py-0.5 rounded-md border border-border/50">
                      <CalendarDays className="h-3 w-3" />
                      <span className="text-xs font-medium">Campaign</span>
                    </div>
                    {campaign.id && (
                      <>
                        <span className="text-muted-foreground/50">•</span>
                        <div
                          className="flex items-center gap-1.5 cursor-pointer hover:text-foreground transition-colors group"
                          onClick={handleCopyId}
                          title="Copy ID"
                        >
                          <span className="font-mono text-xs">
                            ID: {campaign.id}
                          </span>
                          {copied ? (
                            <Check className="h-3 w-3 text-emerald-500" />
                          ) : (
                            <Copy className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                          )}
                        </div>
                      </>
                    )}
                  </div>
                </div>

                <Badge
                  variant="secondary"
                  className={cn(
                    "w-fit px-3 py-1 text-xs font-semibold uppercase shadow-none border-0",
                    getStatusColor(campaign.isActive),
                  )}
                >
                  {campaign.isActive ? "Active" : "Inactive"}
                </Badge>
              </div>
            </div>
          </div>
        </DialogHeader>

        {/* Scrollable Content */}
        <ScrollArea className="max-h-[70vh]">
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 h-full">
              {/* Left Column: General Info */}
              <div className="space-y-6">
                <div className="space-y-4">
                  <h4 className="text-sm font-semibold text-foreground flex items-center gap-2">
                    <Info className="h-4 w-4" /> General Information
                  </h4>
                  <div className="grid gap-5 p-5 rounded-lg border bg-card text-card-foreground shadow-sm">
                    <InfoItem
                      icon={Tag}
                      label="Campaign Type"
                      value={campaignTypeLabels[campaign.tipo] || "N/A"}
                    />
                    <div className="h-px bg-border/50" />
                    <InfoItem
                      icon={Clock}
                      label="Duration / Frequency"
                      value={campaign.duracion || "N/A"}
                    />
                    <div className="h-px bg-border/50" />
                    <InfoItem
                      icon={Building}
                      label="Assigned Yard"
                      value={getYardLabel(campaign)}
                    />
                  </div>
                </div>
              </div>

              {/* Right Column: Stats & Actions */}
              <div className="space-y-6 flex flex-col h-full">
                {/* Stats Card */}
                <div className="space-y-4">
                  <h4 className="text-sm font-semibold text-foreground flex items-center gap-2">
                    <BarChart3 className="h-4 w-4" /> Metrics
                  </h4>

                  {/* Total Tickets */}
                  <div className="p-5 rounded-lg border bg-gradient-to-br from-card to-muted/20 shadow-sm flex items-center justify-between mb-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                        <Ticket className="h-3.5 w-3.5" />
                        Total Tickets
                      </div>
                      <p className="text-3xl font-bold text-primary">
                        {campaign.ticketCount ?? tickets.length ?? 0}
                      </p>
                    </div>
                    <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                      <Ticket className="h-6 w-6 text-primary" />
                    </div>
                  </div>

                  {/* NUEVA LÓGICA DE CONTADORES */}
                  {campaign.tipo === ManagementType.ONBOARDING ? (
                    <div className="grid grid-cols-2 gap-3">
                      <div className="p-4 rounded-lg border bg-emerald-500/5 border-emerald-200/20">
                        <div className="flex items-center gap-1.5 text-xs font-medium text-emerald-600 uppercase tracking-wider mb-2">
                          <CheckCircle2 className="h-3.5 w-3.5" /> Registered
                        </div>
                        <p className="text-2xl font-bold text-emerald-700">
                          {campaign.registeredCount ?? 0}
                        </p>
                      </div>
                      <div className="p-4 rounded-lg border bg-card">
                        <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">
                          <XCircle className="h-3.5 w-3.5" /> Not Registered
                        </div>
                        <p className="text-2xl font-bold text-foreground">
                          {campaign.notRegisteredCount ?? 0}
                        </p>
                      </div>
                    </div>
                  ) : campaign.tipo === ManagementType.AR ? (
                    <div className="grid grid-cols-2 gap-3">
                      <div className="p-4 rounded-lg border bg-emerald-500/5 border-emerald-200/20">
                        <div className="flex items-center gap-1.5 text-xs font-medium text-emerald-600 uppercase tracking-wider mb-2">
                          <DollarSign className="h-3.5 w-3.5" /> Paid
                        </div>
                        <p className="text-2xl font-bold text-emerald-700">
                          {campaign.paidCount ?? 0}
                        </p>
                      </div>
                      <div className="p-4 rounded-lg border bg-card">
                        <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">
                          <Ban className="h-3.5 w-3.5" /> Not Paid
                        </div>
                        <p className="text-2xl font-bold text-foreground">
                          {campaign.notPaidCount ?? 0}
                        </p>
                      </div>
                    </div>
                  ) : null}
                </div>

                {/* Actions Section */}
                {!isAgent && campaign.id && (
                  <div className="space-y-4 mt-auto">
                    <div className="rounded-lg border bg-primary/5 p-4 flex flex-col gap-3">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-background rounded-md border shadow-sm">
                          <FileText className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <h4 className="text-sm font-semibold">
                            Campaign Report
                          </h4>
                          <p className="text-xs text-muted-foreground">
                            Analyze performance details
                          </p>
                        </div>
                      </div>
                      <Button asChild className="w-full" variant="secondary">
                        <Link
                          href={`/reports/campaigns?campaignId=${campaign.id}`}
                        >
                          Open Report <ExternalLink className="ml-2 h-3 w-3" />
                        </Link>
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </ScrollArea>

        {/* Footer */}
        <DialogFooter className="p-4 bg-muted/20 border-t border-border/50">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
