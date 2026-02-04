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
import { Separator } from "@/components/ui/separator";
import {
  Building,
  MapPin,
  Phone,
  Link as LinkIcon,
  User,
  ExternalLink,
  Copy,
  Check,
  Mail,
  Info,
  StickyNote, // <--- 1. Importamos el icono para las notas
} from "lucide-react";
import type { Yard } from "../types";
import { cn } from "@/lib/utils";

type YardDetailsModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  yard: Yard | null;
  showTicketsPanel?: boolean;
  showLandlordPanel: boolean;
  ticketsLoading?: boolean;
  tickets?: any[];
  onViewTickets?: () => void;
  onViewLandlord: () => void;
};

const getTypeLabel = (type: Yard["yardType"]) =>
  type === "SAAS" ? "SaaS" : "Full Service";

const InfoItem = ({
  icon: Icon,
  label,
  value,
  children,
  className,
}: {
  icon: any;
  label: string;
  value?: string | null;
  children?: React.ReactNode;
  className?: string;
}) => {
  if (!value && !children) return null;
  return (
    <div className={cn("flex flex-col space-y-1.5 min-w-0", className)}>
      <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground uppercase tracking-wider">
        <Icon className="h-3.5 w-3.5 shrink-0" />
        <span className="truncate">{label}</span>
      </div>
      <div className="text-sm font-medium text-foreground pl-1 truncate">
        {children || value || "N/A"}
      </div>
    </div>
  );
};

export function YardDetailsModal({
  open,
  onOpenChange,
  yard,
  showLandlordPanel,
  onViewLandlord,
}: YardDetailsModalProps) {
  const [copied, setCopied] = useState(false);

  const handleCopyId = () => {
    if (yard?.id) {
      navigator.clipboard.writeText(String(yard.id));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (!yard) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-3xl p-0 gap-0 overflow-hidden bg-background border-border shadow-xl">
        <DialogHeader className="p-6 pb-4 bg-muted/20 border-b border-border/50">
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
            <div className="flex items-start gap-4 flex-1 min-w-0">
              <div className="p-3 rounded-xl bg-primary/10 border border-primary/20 shadow-sm shrink-0">
                <Building className="h-6 w-6 text-primary" />
              </div>
              <div className="space-y-2 flex-1 min-w-0">
                <div>
                  <DialogTitle className="text-2xl font-bold tracking-tight truncate">
                    {yard.name || "Yard Details"}
                  </DialogTitle>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1 min-w-0">
                    {yard.name !== yard.commonName && yard.name && (
                      <span className="font-medium truncate">{yard.commonName}</span>
                    )}
                    {yard.commonName && yard.id && (
                      <span className="text-muted-foreground/50 shrink-0">•</span>
                    )}
                    <div
                      className="flex items-center gap-1.5 cursor-pointer hover:text-foreground transition-colors group shrink-0"
                      onClick={handleCopyId}
                      title="Copy ID"
                    >
                      <span className="font-mono text-xs">ID: {yard.id}</span>
                      {copied ? (
                        <Check className="h-3 w-3 text-emerald-500" />
                      ) : (
                        <Copy className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                      )}
                    </div>
                  </div>
                </div>

                <Badge
                  variant={yard.isActive ? "default" : "destructive"}
                  className={cn(
                    "w-fit px-3 py-1 text-xs font-semibold uppercase shadow-none border-0",
                    yard.isActive
                      ? "bg-emerald-500/15 text-emerald-700 hover:bg-emerald-500/25 dark:text-emerald-400 dark:bg-emerald-500/10"
                      : "bg-red-500/15 text-red-700 hover:bg-red-500/25 dark:text-red-400 dark:bg-red-500/10"
                  )}
                >
                  {yard.isActive ? "Active" : "Inactive"}
                </Badge>
              </div>
            </div>
          </div>
        </DialogHeader>

        <div className="p-6 overflow-y-auto max-h-[70vh]">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Columna Izquierda: Info Básica y Contacto */}
            <div className="space-y-6 min-w-0">
              <div className="space-y-4">
                <h4 className="text-sm font-semibold text-foreground flex items-center gap-2">
                  <Info className="h-4 w-4" /> Basic Information
                </h4>
                <div className="grid gap-4 p-4 rounded-lg border bg-card text-card-foreground shadow-sm">
                  <InfoItem
                    icon={Building}
                    label="Type"
                    value={getTypeLabel(yard.yardType)}
                  />
                  <Separator className="my-1" />
                  <InfoItem
                    icon={MapPin}
                    label="Address"
                    value={yard.propertyAddress}
                  />
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="text-sm font-semibold text-foreground flex items-center gap-2">
                  <Phone className="h-4 w-4" /> Contact Details
                </h4>
                <div className="grid gap-4 p-4 rounded-lg border bg-card text-card-foreground shadow-sm">
                  <InfoItem
                    icon={Phone}
                    label="Phone Number"
                    value={yard.contactInfo}
                  />

                  {yard.yardLink && (
                    <InfoItem icon={LinkIcon} label="Website">
                      <a
                        href={yard.yardLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 text-primary hover:text-primary/80 hover:underline transition-all group max-w-full"
                      >
                        <span className="truncate">
                          {yard.yardLink.replace(/^https?:\/\//, "")}
                        </span>
                        <ExternalLink className="h-3 w-3 shrink-0 group-hover:translate-x-0.5 transition-transform" />
                      </a>
                    </InfoItem>
                  )}
                </div>
              </div>
            </div>

            {/* Columna Derecha: Landlord */}
            <div className="flex flex-col h-full gap-6 min-w-0">
              <div className="flex items-center justify-between shrink-0">
                <h4 className="text-sm font-semibold text-foreground flex items-center gap-2">
                  <User className="h-4 w-4" /> Landlord Status
                </h4>
                {yard.landlord && !showLandlordPanel && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 text-xs shrink-0"
                    onClick={onViewLandlord}
                  >
                    Show Details
                  </Button>
                )}
              </div>

              <div className="flex-1 min-h-0 min-w-0">
                {yard.landlord ? (
                  <div
                    className={cn(
                      "rounded-lg border bg-card transition-all duration-300 shadow-sm overflow-hidden flex flex-col",
                      showLandlordPanel
                        ? "border-primary/40"
                        : "opacity-80 grayscale-[0.5]"
                    )}
                  >
                    <div className="p-4 flex items-center gap-3 bg-muted/30 shrink-0">
                      <div className="h-10 w-10 rounded-full bg-secondary flex items-center justify-center text-secondary-foreground font-bold text-lg shrink-0">
                        {yard.landlord.name?.charAt(0) || "L"}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold truncate">
                          {yard.landlord.name}
                        </p>
                        <p className="text-xs text-muted-foreground truncate">
                          {yard.landlord.email || "No email provided"}
                        </p>
                      </div>
                      {!showLandlordPanel && (
                        <Button
                          size="icon"
                          variant="secondary"
                          className="h-8 w-8 rounded-full shrink-0"
                          onClick={onViewLandlord}
                        >
                          <User className="h-4 w-4" />
                        </Button>
                      )}
                    </div>

                    {showLandlordPanel && (
                      <div className="p-4 pt-2 border-t space-y-3 bg-card animate-in slide-in-from-top-2 fade-in">
                        <div className="grid grid-cols-1 gap-3">
                          <InfoItem
                            icon={Mail}
                            label="Email"
                            value={yard.landlord.email}
                          />
                          <InfoItem
                            icon={Phone}
                            label="Phone"
                            value={yard.landlord.phone}
                          />
                          <InfoItem
                            icon={User}
                            label="Landlord ID"
                            value={
                              yard.landlord.id !== undefined &&
                              yard.landlord.id !== null
                                ? String(yard.landlord.id)
                                : yard.landlordId !== undefined &&
                                  yard.landlordId !== null
                                ? String(yard.landlordId)
                                : undefined
                            }
                            className="text-xs"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="h-full border border-dashed border-border/60 rounded-lg bg-muted/10 p-6 flex flex-col justify-center items-center text-muted-foreground gap-3">
                    <User className="h-8 w-8 opacity-60" />
                    <p className="text-sm font-medium">No landlord assigned</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* ------------------------------------------------
            2. NUEVA SECCIÓN: NOTES
            Se agrega debajo de la grilla de dos columnas.
            ------------------------------------------------
          */}
          {yard.notes && (
            <div className="mt-8 space-y-4 animate-in fade-in slide-in-from-bottom-2">
              <h4 className="text-sm font-semibold text-foreground flex items-center gap-2">
                <StickyNote className="h-4 w-4" /> Notes
              </h4>
              <div className="p-4 rounded-lg border bg-card text-card-foreground shadow-sm text-sm leading-relaxed whitespace-pre-wrap">
                {yard.notes}
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="p-4 bg-muted/20 border-t border-border/50">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}