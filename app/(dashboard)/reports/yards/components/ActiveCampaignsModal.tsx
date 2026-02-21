"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
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
  ExternalLink,
} from "lucide-react";
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
  side?: "left" | "right";
  yardId: number | string;
  yardName: string;
  reportStartDate?: string;
  reportEndDate?: string;
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

const getSheetMaxWidthClass = (cardCount: number) => {
  if (cardCount <= 1) {
    return "sm:max-w-[min(92vw,480px)]";
  }
  if (cardCount === 2) {
    return "sm:max-w-[min(92vw,840px)]";
  }
  return "sm:max-w-[min(92vw,1200px)]";
};

const getCardsGridClass = (cardCount: number) => {
  if (cardCount <= 1) {
    return "grid-cols-1";
  }
  if (cardCount === 2) {
    return "grid-cols-1 sm:grid-cols-2";
  }
  return "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3";
};

const FETCH_TIMEOUT_MS = 15000;

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

const normalizeCampaignId = (value: number | string) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : value.toString();
};

export function ActiveCampaignsModal({
  open,
  onOpenChange,
  side = "right",
  yardId,
  yardName,
  reportStartDate,
  reportEndDate,
  campaignsByTickets,
}: ActiveCampaignsModalProps) {
  const router = useRouter();
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const requestIdRef = useRef(0);

  const fallbackCampaigns = useMemo<Campaign[]>(
    () =>
      [...campaignsByTickets]
        .filter(
          (campaign) =>
            campaign.campaignId !== null && campaign.campaignId !== undefined,
        )
        .map((campaign) => {
          const idKey = campaign.campaignId.toString();
          return {
            id: normalizeCampaignId(campaign.campaignId),
            nombre: campaign.campaignName || `Campaign #${idKey}`,
            tipo: "OTHER",
            isActive: true,
            duracion: null,
            ticketCount: campaign.count ?? 0,
            registeredCount: 0,
            notRegisteredCount: 0,
            paidCount: 0,
            notPaidCount: 0,
            yarda: null,
            yard: null,
          };
        })
        .sort(
          (left, right) => (right.ticketCount ?? 0) - (left.ticketCount ?? 0),
        ),
    [campaignsByTickets],
  );

  // Keep sheet width stable while async data loads to avoid half-open glitches.
  const layoutCardCount =
    fallbackCampaigns.length > 0 ? fallbackCampaigns.length : 3;
  const sheetWidthClass = getSheetMaxWidthClass(layoutCardCount);
  const cardsGridClass = getCardsGridClass(campaigns.length);
  const showLoadingState = loading && campaigns.length === 0;

  useEffect(() => {
    if (!open || !yardId) {
      return;
    }

    const requestId = requestIdRef.current + 1;
    requestIdRef.current = requestId;
    const abortController = new AbortController();
    const timeoutId = window.setTimeout(
      () => abortController.abort(),
      FETCH_TIMEOUT_MS,
    );

    const fetchCampaigns = async () => {
      setLoading(true);
      if (fallbackCampaigns.length > 0) {
        setCampaigns(fallbackCampaigns);
      } else {
        setCampaigns([]);
      }

      try {
        const response = await fetch("/api/campaigns?active=true", {
          signal: abortController.signal,
          cache: "no-store",
        });

        const payload = await response.json().catch(() => null);
        if (!response.ok || payload?.success === false) {
          throw new Error(payload?.message || "Failed to load campaigns");
        }

        if (requestIdRef.current !== requestId) {
          return;
        }

        const yardIdKey = yardId.toString();
        const ticketCountByCampaignId = campaignsByTickets.reduce<
          Map<string, number>
        >((accumulator, campaign) => {
          if (
            campaign.campaignId !== null &&
            campaign.campaignId !== undefined
          ) {
            accumulator.set(
              campaign.campaignId.toString(),
              campaign.count ?? 0,
            );
          }
          return accumulator;
        }, new Map());

        const allCampaigns: Campaign[] = Array.isArray(payload?.data)
          ? payload.data
          : Array.isArray(payload)
            ? payload
            : [];
        const yardCampaigns = allCampaigns
          .filter((campaign) => resolveCampaignYardId(campaign) === yardIdKey)
          .filter((campaign) => campaign.isActive !== false)
          .map((campaign) => {
            const idKey = campaign.id.toString();
            return {
              ...campaign,
              nombre: campaign.nombre || `Campaign #${idKey}`,
              tipo: campaign.tipo || "OTHER",
              isActive: campaign.isActive !== false,
              yardaId: campaign.yardaId ?? null,
              yardId: campaign.yardId ?? null,
              duracion: campaign.duracion ?? null,
              ticketCount:
                ticketCountByCampaignId.get(idKey) ?? campaign.ticketCount ?? 0,
              registeredCount: campaign.registeredCount ?? 0,
              notRegisteredCount: campaign.notRegisteredCount ?? 0,
              paidCount: campaign.paidCount ?? 0,
              notPaidCount: campaign.notPaidCount ?? 0,
              yarda: campaign.yarda ?? null,
              yard: campaign.yard ?? null,
            } satisfies Campaign;
          })
          .sort((left, right) => {
            const byCount = (right.ticketCount ?? 0) - (left.ticketCount ?? 0);
            if (byCount !== 0) return byCount;
            return left.nombre.localeCompare(right.nombre);
          });

        setCampaigns(
          yardCampaigns.length > 0 ? yardCampaigns : fallbackCampaigns,
        );
      } catch (error: any) {
        if (requestIdRef.current !== requestId) {
          return;
        }

        const isAbortError =
          error?.name === "AbortError" ||
          error?.message?.toLowerCase?.().includes("aborted");

        if (!isAbortError) {
          console.error("Error fetching campaigns:", error);
          toast({
            title: "Error",
            description: error?.message || "Failed to load campaigns",
            variant: "destructive",
          });
        }

        setCampaigns((current) =>
          current.length > 0 ? current : fallbackCampaigns,
        );
      } finally {
        window.clearTimeout(timeoutId);
        if (requestIdRef.current === requestId) {
          setLoading(false);
        }
      }
    };

    fetchCampaigns();

    return () => {
      window.clearTimeout(timeoutId);
      abortController.abort();
    };
  }, [open, yardId, campaignsByTickets, fallbackCampaigns, toast]);

  useEffect(() => {
    if (!open) {
      requestIdRef.current += 1;
      setLoading(false);
      setCampaigns([]);
    }
  }, [open]);

  const buildCampaignReportHref = (campaignId: number | string) => {
    const params = new URLSearchParams({
      campaignId: campaignId.toString(),
      fromReport: "yard",
      yardId: yardId.toString(),
      reportYardName: yardName,
    });

    if (reportStartDate) {
      params.set("startDate", reportStartDate);
      params.set("yardStartDate", reportStartDate);
    }

    if (reportEndDate) {
      params.set("endDate", reportEndDate);
      params.set("yardEndDate", reportEndDate);
    }

    return `/reports/campaigns?${params.toString()}`;
  };

  const handleOpenCampaignReport = (campaign: Campaign) => {
    const href = buildCampaignReportHref(campaign.id);
    onOpenChange(false);
    router.push(href);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side={side}
        className={`flex h-full w-[calc(100vw-1rem)] max-w-[calc(100vw-1rem)] flex-col gap-0 overflow-hidden rounded-none p-0 shadow-2xl ${sheetWidthClass}`}
      >
        <SheetHeader className="border-b bg-card/50 px-6 py-5 backdrop-blur-sm">
          <SheetTitle className="flex items-center gap-2.5 text-2xl font-bold tracking-tight">
            <div className="p-2 rounded-xl bg-primary/10 text-primary">
              <TrendingUp className="h-6 w-6" />
            </div>
            Active Campaigns
          </SheetTitle>
          <SheetDescription className="text-base mt-1.5 ml-12">
            Showing all active campaigns for{" "}
            <span className="font-semibold text-foreground underline decoration-primary/30 underline-offset-4">
              {yardName}
            </span>
          </SheetDescription>
        </SheetHeader>

        <ScrollArea className="min-h-0 flex-1 bg-muted/10">
          <div className="p-4 sm:p-6 flex justify-center">
            {showLoadingState ? (
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
              <div className={`mx-auto grid w-full gap-5 ${cardsGridClass}`}>
                {campaigns.map((campaign) => {
                  const secondaryMetrics = getSecondaryMetrics(campaign);

                  return (
                    <div
                      key={campaign.id}
                      className="group relative flex flex-col overflow-hidden rounded-2xl border bg-card text-card-foreground shadow-sm transition-all duration-300 hover:shadow-md hover:border-primary/40"
                    >
                      <div className="flex flex-col p-5 space-y-5">
                        <div className="flex flex-col gap-3 min-h-[80px]">
                          <h3
                            className="text-lg font-bold leading-tight tracking-tight text-foreground line-clamp-2"
                            title={campaign.nombre}
                          >
                            {campaign.nombre}
                          </h3>
                          <div className="flex flex-wrap items-center gap-2 mt-auto">
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

                        <div className="flex flex-col gap-4">
                          <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground bg-muted/40 rounded-lg p-2.5 border border-muted min-h-[42px]">
                            {campaign.duracion ? (
                              <>
                                <Clock className="h-4 w-4 text-primary/70 shrink-0" />
                                <span className="truncate">
                                  {campaign.duracion}
                                </span>
                              </>
                            ) : (
                              <span className="text-muted-foreground/50 italic text-xs">
                                No duration set
                              </span>
                            )}
                          </div>

                          <div className="space-y-3 pt-4 border-t">
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

                            {secondaryMetrics.length > 0 ? (
                              <div className="grid grid-cols-2 gap-3">
                                {secondaryMetrics.map((metric) => (
                                  <div
                                    key={`${campaign.id}-${metric.label}`}
                                    className={`rounded-xl border p-3.5 flex flex-col justify-between h-full min-h-[85px] ${metric.bgClass}`}
                                  >
                                    <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-1 line-clamp-2">
                                      {metric.label}
                                    </p>
                                    <p
                                      className={`text-xl font-bold mt-auto ${metric.textClass}`}
                                    >
                                      {metric.value}
                                    </p>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <div className="rounded-xl border bg-muted/20 p-3.5 flex items-center justify-between min-h-[85px]">
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

                        <div className="pt-2">
                          <Button
                            type="button"
                            variant="secondary"
                            className="w-full"
                            onClick={() => handleOpenCampaignReport(campaign)}
                          >
                            Open Reports
                            <ExternalLink className="ml-2 h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </ScrollArea>

        <SheetFooter className="border-t bg-card/50 px-6 py-4 backdrop-blur-sm">
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
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
