"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Building,
  Mail,
  Phone,
  User,
  Copy,
  Check,
  Info,
  ArrowUpRight,
} from "lucide-react";
import Link from "next/link";
import type { Landlord, YardOption } from "../types";
import { useRole } from "@/components/providers/role-provider";
import { cn } from "@/lib/utils";

interface LandlordDetailsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  landlord: Landlord | null;
  yards: YardOption[];
}

const getYards = (landlord: Landlord | null, yards: YardOption[]) => {
  if (!landlord) return [];
  const fromRelation =
    landlord.yards?.map((yard) => ({ id: yard.id, name: yard.name })) || [];
  if (fromRelation.length > 0) return fromRelation;
  return yards
    .filter((yard) => yard.landlord?.id === landlord.id)
    .map((yard) => ({ id: yard.id, name: yard.name }));
};

const InfoItem = ({
  icon: Icon,
  label,
  value,
  className,
}: {
  icon: any;
  label: string;
  value?: string | null;
  className?: string;
}) => {
  if (!value) return null;
  return (
    <div className={cn("flex flex-col space-y-1.5", className)}>
      <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground uppercase tracking-wider">
        <Icon className="h-3.5 w-3.5" />
        {label}
      </div>
      <div className="text-sm font-medium text-foreground pl-1 break-all">
        {value}
      </div>
    </div>
  );
};

export function LandlordDetailsModal({
  open,
  onOpenChange,
  landlord,
  yards,
}: LandlordDetailsModalProps) {
  const { role } = useRole();
  const isAgent = role?.toString().toLowerCase() === "agent";
  const yardItems = getYards(landlord, yards);
  const [copied, setCopied] = useState(false);

  const handleCopyId = () => {
    if (landlord?.id) {
      navigator.clipboard.writeText(String(landlord.id));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (!landlord) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-4xl p-0 gap-0 overflow-hidden bg-background border-border shadow-xl">
        <DialogHeader className="p-6 pb-4 bg-muted/20 border-b border-border/50">
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
            <div className="flex items-start gap-4">
              <div className="h-16 w-16 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-primary font-bold text-2xl shadow-sm">
                {landlord.name?.charAt(0).toUpperCase() || "L"}
              </div>
              <div className="space-y-1 mt-1">
                <DialogTitle className="text-2xl font-bold tracking-tight">
                  {landlord.name || "Unknown Landlord"}
                </DialogTitle>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1.5 bg-background/50 px-2 py-0.5 rounded-md border border-border/50">
                    <User className="h-3 w-3" />
                    <span className="text-xs font-medium">Landlord</span>
                  </div>
                  {landlord.id && (
                    <>
                      <span className="text-muted-foreground/50">•</span>
                      <div
                        className="flex items-center gap-1.5 cursor-pointer hover:text-foreground transition-colors group"
                        onClick={handleCopyId}
                        title="Copy ID"
                      >
                        <span className="font-mono text-xs">
                          ID: {landlord.id}
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
            </div>
          </div>
        </DialogHeader>

        <div className="p-6 overflow-y-auto max-h-[70vh]">
          {/* Se añade h-full al grid para que las columnas ocupen todo el alto */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-8 h-full">
            {/* Left Column: Contact & Actions (4 columns) */}
            <div className="md:col-span-5 space-y-6">
              <div className="space-y-4">
                <h4 className="text-sm font-semibold text-foreground flex items-center gap-2">
                  <Info className="h-4 w-4" /> Contact Information
                </h4>
                <div className="grid gap-5 p-5 rounded-lg border bg-card text-card-foreground shadow-sm">
                  <InfoItem
                    icon={Mail}
                    label="Email Address"
                    value={landlord.email}
                  />
                  <Separator />
                  <InfoItem
                    icon={Phone}
                    label="Phone Number"
                    value={landlord.phone}
                  />
                </div>
              </div>

            </div>

            {/* Right Column: Properties/Yards (8 columns) */}
            {/* Usamos flex flex-col h-full para controlar la altura */}
            <div className="md:col-span-7 flex flex-col h-full gap-4">
              <div className="flex items-center justify-between shrink-0">
                <h4 className="text-sm font-semibold text-foreground flex items-center gap-2">
                  <Building className="h-4 w-4" /> Associated Yards
                </h4>
                <Badge
                  variant="secondary"
                  className="px-2 py-0.5 text-xs font-mono"
                >
                  {yardItems.length} Total
                </Badge>
              </div>

              {/* Contenedor flexible con flex-1 para ocupar el espacio restante */}
              <div className="flex-1 min-h-[300px] max-h-[311px] rounded-lg border bg-card text-card-foreground shadow-sm overflow-hidden flex flex-col">
                {yardItems.length === 0 ? (
                  <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground gap-3 p-8 border-2 border-dashed border-transparent m-1 rounded-md bg-muted/5">
                    <div className="p-3 bg-muted/20 rounded-full">
                      <Building className="h-8 w-8 opacity-40" />
                    </div>
                    <p className="text-sm font-medium">
                      No yards linked to this landlord.
                    </p>
                  </div>
                ) : (
                  <div className="flex-1 overflow-y-auto p-4">
                    {/* Grid Layout para las Yardas: Más visual y ordenado */}
                    <div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {yardItems.map((yard) => (
                          <Link
                            key={yard.id ?? yard.name}
                            href={
                              yard.id ? `/yards?yardId=${yard.id}` : "/yards"
                            }
                            className="group flex items-center gap-3 p-3 rounded-md border border-border/60 bg-background hover:bg-muted/50 hover:border-primary/30 transition-all duration-200"
                          >
                            <div className="h-8 w-8 rounded-md bg-primary/10 flex items-center justify-center shrink-0 group-hover:bg-primary/20 transition-colors">
                              <Building className="h-4 w-4 text-primary" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium truncate leading-none">
                                {yard.name}
                              </p>
                              <p className="text-[10px] text-muted-foreground mt-1">
                                View yard
                              </p>
                            </div>
                            <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                              <ArrowUpRight className="h-3 w-3 text-muted-foreground" />
                            </div>
                          </Link>
                        ))}
                      </div>
                      {yardItems.length > 8 && (
                        <div className="mt-3 flex justify-end">
                          <Link
                            href={`/yards?landlordId=${landlord.id}`}
                            className="text-xs text-primary hover:underline inline-flex items-center gap-1"
                          >
                            View all yards
                            <ArrowUpRight className="h-3 w-3" />
                          </Link>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
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
