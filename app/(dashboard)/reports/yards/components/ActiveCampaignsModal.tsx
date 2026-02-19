"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Loader2,
  TrendingUp,
  Users,
  CheckCircle2,
  XCircle,
  Tag,
  Clock,
} from "lucide-react";
import { fetchFromBackend } from "@/lib/api-client";
import { useToast } from "@/hooks/use-toast";

interface Campaign {
  id: number | string;
  nombre: string;
  tipo: string;
  isActive: boolean;
  yardaId?: number | null;
  yardId?: number | null;
  duracion?: string | null;
  ticketCount?: number;
  registeredCount?: number;
  notRegisteredCount?: number;
  paidCount?: number;
  notPaidCount?: number;
  yarda?: {
    id: number;
    name: string;
  } | null;
  yard?: {
    id: number;
    name?: string;
  } | null;
}

interface ActiveCampaignsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  yardId: number;
  yardName: string;
  campaignsByTickets: {
    campaignId: number | string;
    campaignName: string;
    count: number;
  }[];
}

const campaignTypeLabels: Record<string, string> = {
  ONBOARDING: "Onboarding",
  AR: "Accounts Receivable",
  OTHER: "Other",
};

// Colores más modernos y consistentes para los tipos de campaña
const getCampaignTypeColor = (tipo: string) => {
  switch (tipo) {
    case "ONBOARDING":
      return "bg-blue-100 text-blue-800 border-blue-200 hover:bg-blue-200 dark:bg-blue-900/40 dark:text-blue-300 dark:border-blue-800";
    case "AR":
      return "bg-violet-100 text-violet-800 border-violet-200 hover:bg-violet-200 dark:bg-violet-900/40 dark:text-violet-300 dark:border-violet-800";
    case "OTHER":
    default:
      return "bg-slate-100 text-slate-800 border-slate-200 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700";
  }
};

// Añadimos colores de fondo y bordes para las métricas secundarias
const getSecondaryMetrics = (campaign: Campaign) => {
  if (campaign.tipo === "ONBOARDING") {
    return [
      {
        label: "Registered",
        value: campaign.registeredCount ?? 0,
        textClass: "text-emerald-700 dark:text-emerald-400",
        bgClass:
          "bg-emerald-50 border-emerald-100 dark:bg-emerald-950/30 dark:border-emerald-900/50",
      },
      {
        label: "Not Registered",
        value: campaign.notRegisteredCount ?? 0,
        textClass: "text-amber-700 dark:text-amber-400",
        bgClass:
          "bg-amber-50 border-amber-100 dark:bg-amber-950/30 dark:border-amber-900/50",
      },
    ];
  }

  if (campaign.tipo === "AR") {
    return [
      {
        label: "Paid",
        value: campaign.paidCount ?? 0,
        textClass: "text-emerald-700 dark:text-emerald-400",
        bgClass:
          "bg-emerald-50 border-emerald-100 dark:bg-emerald-950/30 dark:border-emerald-900/50",
      },
      {
        label: "Not Paid",
        value: campaign.notPaidCount ?? 0,
        textClass: "text-rose-700 dark:text-rose-400",
        bgClass:
          "bg-rose-50 border-rose-100 dark:bg-rose-950/30 dark:border-rose-900/50",
      },
    ];
  }

  return [];
};

const resolveCampaignYardId = (campaign: Campaign): string | null => {
  const possibleIds = [
    campaign.yarda?.id,
    campaign.yard?.id,
    campaign.yardaId,
    campaign.yardId,
  ];

  for (const id of possibleIds) {
    if (id !== null && id !== undefined) {
      return id.toString();
    }
  }

  return null;
};

const isCampaignFromCurrentYard = (
  campaign: Campaign | undefined,
  yardIdKey: string,
) : campaign is Campaign => {
  if (!campaign) return false;
  const campaignYardId = resolveCampaignYardId(campaign);
  return campaignYardId === yardIdKey;
};

export function ActiveCampaignsModal({
  open,
  onOpenChange,
  yardId,
  yardName,
  campaignsByTickets,
}: ActiveCampaignsModalProps) {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (open && yardId) {
      fetchCampaigns();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, yardId, campaignsByTickets]);

  const fetchCampaigns = async () => {
    try {
      setLoading(true);
      const response = await fetchFromBackend("/campaign?page=1&limit=1000");
      const allCampaigns: Campaign[] = Array.isArray(response)
        ? response
        : response?.data || [];
      const campaignsById = new Map(
        allCampaigns.map((campaign) => [campaign.id.toString(), campaign]),
      );
      const yardIdKey = yardId.toString();

      const fromTopCampaigns = campaignsByTickets
        .filter(
          (item) => item.campaignId !== null && item.campaignId !== undefined,
        )
        .reduce<Campaign[]>((accumulator, item) => {
          const idKey = item.campaignId.toString();
          const campaign = campaignsById.get(idKey);

          if (!isCampaignFromCurrentYard(campaign, yardIdKey)) {
            return accumulator;
          }

          accumulator.push({
            id: campaign.id,
            nombre: campaign.nombre || item.campaignName || `Campaign #${idKey}`,
            tipo: campaign.tipo || "OTHER",
            isActive: campaign.isActive ?? true,
            yardaId: campaign.yardaId ?? null,
            yardId: campaign.yardId ?? null,
            duracion: campaign.duracion ?? null,
            ticketCount: item.count,
            registeredCount: campaign.registeredCount ?? 0,
            notRegisteredCount: campaign.notRegisteredCount ?? 0,
            paidCount: campaign.paidCount ?? 0,
            notPaidCount: campaign.notPaidCount ?? 0,
            yarda: campaign.yarda ?? null,
            yard: campaign.yard ?? null,
          });

          return accumulator;
        }, []);

      const fallbackByYard = allCampaigns
        .filter((campaign) => resolveCampaignYardId(campaign) === yardIdKey)
        .filter((campaign) => campaign.isActive);

      const yardCampaigns = (fromTopCampaigns.length > 0
        ? fromTopCampaigns
        : fallbackByYard
      ).sort((left, right) => (right.ticketCount ?? 0) - (left.ticketCount ?? 0));

      setCampaigns(yardCampaigns);
    } catch (error: any) {
      console.error("Error fetching campaigns:", error);
      toast({
        title: "Error",
        description: error?.message || "Failed to load campaigns",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Lógica dinámica para el layout del Grid basado en la cantidad de tarjetas
  const getGridLayoutClass = (count: number) => {
    if (count === 1) return "grid-cols-1 w-full max-w-4xl mx-auto";
    if (count === 2) return "grid-cols-1 md:grid-cols-2 w-full max-w-5xl mx-auto";
    return "grid-cols-1 md:grid-cols-2 xl:grid-cols-3 w-full";
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex h-[90vh] w-[calc(100vw-1rem)] max-w-6xl flex-col gap-0 overflow-hidden rounded-2xl p-0 shadow-2xl">
        {/* Header del Modal */}
        <DialogHeader className="border-b bg-card/50 px-6 py-5 backdrop-blur-sm">
          <DialogTitle className="flex items-center gap-2.5 text-2xl font-bold tracking-tight">
            <div className="p-2 rounded-xl bg-primary/10 text-primary">
              <TrendingUp className="h-6 w-6" />
            </div>
            Active Campaigns
          </DialogTitle>
          <DialogDescription className="text-base mt-1.5 ml-12">
            Showing all active campaigns for{" "}
            <span className="font-semibold text-foreground underline decoration-primary/30 underline-offset-4">
              {yardName}
            </span>
          </DialogDescription>
        </DialogHeader>

        {/* Área de Scroll principal */}
        <ScrollArea className="min-h-0 flex-1 bg-muted/10">
          <div className="p-4 sm:p-6 lg:p-8 flex justify-center">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-20 w-full">
                <Loader2 className="h-10 w-10 animate-spin text-primary/60" />
                <span className="mt-4 text-base font-medium text-muted-foreground animate-pulse">
                  Loading campaigns...
                </span>
              </div>
            ) : campaigns.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-24 text-center max-w-md mx-auto w-full">
                <div className="p-4 rounded-full bg-muted mb-4">
                  <XCircle className="h-12 w-12 text-muted-foreground/60" />
                </div>
                <h3 className="text-xl font-semibold text-foreground">
                  No active campaigns
                </h3>
                <p className="text-muted-foreground mt-2 leading-relaxed">
                  We couldn't find any active campaigns configured for this yard
                  at the moment.
                </p>
              </div>
            ) : (
              /* Grid dinámico que cambia según el número de elementos */
              <div
                className={`grid gap-5 sm:gap-6 ${getGridLayoutClass(
                  campaigns.length,
                )}`}
              >
                {campaigns.map((campaign) => {
                  const secondaryMetrics = getSecondaryMetrics(campaign);

                  return (
                    <div
                      key={campaign.id}
                      className="group relative flex flex-col overflow-hidden rounded-2xl border bg-card text-card-foreground shadow-sm transition-all duration-300 hover:shadow-md hover:border-primary/40 hover:-translate-y-1"
                    >
                      <div className="flex flex-col flex-1 p-5 sm:p-6 space-y-5">
                        {/* Cabecera de la Tarjeta */}
                        <div className="flex items-start justify-between gap-4">
                          <div className="space-y-3 flex-1 min-w-0">
                            <h3
                              className="text-lg font-bold leading-tight tracking-tight text-foreground truncate"
                              title={campaign.nombre}
                            >
                              {campaign.nombre}
                            </h3>
                            <div className="flex flex-wrap items-center gap-2">
                              <Badge
                                variant="outline"
                                className={`flex items-center gap-1.5 px-2.5 py-0.5 transition-colors ${getCampaignTypeColor(
                                  campaign.tipo,
                                )}`}
                              >
                                <Tag className="h-3.5 w-3.5" />
                                <span className="text-xs font-semibold uppercase tracking-wider">
                                  {campaignTypeLabels[campaign.tipo] ||
                                    campaign.tipo}
                                </span>
                              </Badge>
                              <Badge
                                variant="outline"
                                className="flex items-center gap-1 px-2.5 py-0.5 bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800/50"
                              >
                                <CheckCircle2 className="h-3.5 w-3.5" />
                                <span className="text-xs font-medium">
                                  Active
                                </span>
                              </Badge>
                            </div>
                          </div>
                        </div>

                        {/* Indicador de Duración */}
                        {campaign.duracion && (
                          <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground bg-muted/40 rounded-lg p-2.5 border border-muted">
                            <Clock className="h-4 w-4 text-primary/70" />
                            <span>{campaign.duracion}</span>
                          </div>
                        )}

                        <div className="flex-1" />

                        {/* Sección de Estadísticas */}
                        <div className="space-y-3 pt-4 border-t">
                          {/* Métrica Principal */}
                          <div className="flex items-center justify-between rounded-xl bg-primary/5 p-4 border border-primary/10">
                            <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                              <div className="p-1.5 rounded-md bg-background shadow-sm border">
                                <Users className="h-4 w-4 text-primary" />
                              </div>
                              Total Tickets
                            </div>
                            <p className="text-2xl font-bold text-primary">
                              {campaign.ticketCount ?? 0}
                            </p>
                          </div>

                          {/* Métricas Secundarias */}
                          {secondaryMetrics.length > 0 ? (
                            <div className="grid grid-cols-2 gap-3">
                              {secondaryMetrics.map((metric) => (
                                <div
                                  key={`${campaign.id}-${metric.label}`}
                                  className={`rounded-xl border p-3.5 flex flex-col justify-between ${metric.bgClass}`}
                                >
                                  <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-1">
                                    {metric.label}
                                  </p>
                                  <p
                                    className={`text-xl font-bold ${metric.textClass}`}
                                  >
                                    {metric.value}
                                  </p>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div className="rounded-xl border bg-muted/20 p-3.5 flex items-center justify-between">
                              <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                                Campaign Type
                              </p>
                              <span className="text-sm font-medium">
                                {campaignTypeLabels[campaign.tipo] ||
                                  campaign.tipo}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </ScrollArea>

        {/* Footer del Modal */}
        <DialogFooter className="border-t bg-card/50 px-6 py-4 backdrop-blur-sm">
          <div className="flex w-full flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm font-medium text-muted-foreground">
              {campaigns.length}{" "}
              {campaigns.length === 1 ? "campaign" : "campaigns"} found
            </p>
            <Button
              variant="default"
              onClick={() => onOpenChange(false)}
              className="h-10 w-full shadow-sm sm:w-auto sm:min-w-[120px]"
            >
              Done
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
