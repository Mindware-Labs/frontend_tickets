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
        const response = await fetch(
          `/api/campaigns?active=true&yardId=${encodeURIComponent(yardId.toString())}`,
          {
          signal: abortController.signal,
          cache: "no-store",
          },
        );

        const payload = await response.json().catch(() => null);
        if (!response.ok || payload?.success === false) {
          throw new Error(payload?.message || "Failed to load campaigns");
        }

        if (requestIdRef.current !== requestId) {
          return;
        }

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
        className={`flex h-full w-[calc(100vw-1rem)] max-w-[calc(100vw-1rem)] flex-col gap-0 overflow-hidden border-slate-200/80 bg-[#f4f5f7] p-0 shadow-2xl dark:border-slate-800 dark:bg-slate-950 ${sheetWidthClass}`}
      >
        <SheetHeader className="border-b border-slate-200/80 bg-white px-4 py-3 dark:border-slate-800 dark:bg-slate-950">
          <SheetTitle className="flex items-center gap-2.5 text-[15px] font-semibold text-slate-900 dark:text-slate-100">
            <div className="flex size-8 items-center justify-center rounded-lg bg-[#f0faf5] text-[#008f68] ring-1 ring-[#008f68]/15 dark:bg-emerald-500/10 dark:text-emerald-400">
              <TrendingUp className="size-3.5" />
            </div>
            Active Campaigns
          </SheetTitle>
          <SheetDescription className="ml-10 mt-1 text-xs text-slate-500 dark:text-slate-400">
            Showing all active campaigns for{" "}
            <span className="font-semibold text-foreground underline decoration-primary/30 underline-offset-4">
              {yardName}
            </span>
          </SheetDescription>
        </SheetHeader>

        <ScrollArea className="min-h-0 flex-1 bg-[#f4f5f7] scrollbar-app dark:bg-slate-950">
          <div className="flex justify-center p-3 sm:p-4">
            {showLoadingState ? (
              <div className="flex w-full flex-col items-center justify-center py-16">
                <Loader2 className="size-8 animate-spin text-[#008f68]/70" />
                <span className="mt-3 animate-pulse text-xs font-medium text-slate-500">
                  Loading campaigns...
                </span>
              </div>
            ) : campaigns.length === 0 ? (
              <div className="mx-auto flex w-full max-w-md flex-col items-center justify-center py-16 text-center">
                <div className="mb-4 rounded-xl bg-white p-4 ring-1 ring-slate-200/80 dark:bg-slate-950 dark:ring-slate-800">
                  <XCircle className="size-10 text-slate-400" />
                </div>
                <h3 className="text-[15px] font-semibold text-slate-900 dark:text-slate-100">
                  No active campaigns
                </h3>
                <p className="mt-1 text-xs leading-5 text-slate-500">
                  We couldn't find any active campaigns configured for this yard
                  at the moment.
                </p>
              </div>
            ) : (
              <div className={`mx-auto grid w-full gap-3 ${cardsGridClass}`}>
                {campaigns.map((campaign) => {
                  const secondaryMetrics = getSecondaryMetrics(campaign);

                  return (
                    <div
                      key={campaign.id}
                      className="group relative flex flex-col overflow-hidden rounded-xl border border-slate-200/80 bg-white text-slate-900 shadow-[0_1px_3px_rgba(0,0,0,0.06)] transition-colors hover:border-[#008f68]/35 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100"
                    >
                      <div className="flex flex-col space-y-3 p-3">
                        <div className="flex min-h-[64px] flex-col gap-2">
                          <h3
                            className="line-clamp-2 text-[13px] font-semibold leading-tight text-slate-900 dark:text-slate-100"
                            title={campaign.nombre}
                          >
                            {campaign.nombre}
                          </h3>
                          <div className="flex flex-wrap items-center gap-2 mt-auto">
                            <Badge
                              variant="outline"
                            className={`flex items-center gap-1.5 px-2 py-0.5 text-[10px] transition-colors ${getCampaignTypeColor(
                                campaign.tipo,
                              )}`}
                            >
                              <Tag className="size-3" />
                              <span className="text-[10px] font-semibold uppercase tracking-wider">
                                {campaignTypeLabels[campaign.tipo] ||
                                  campaign.tipo}
                              </span>
                            </Badge>
                            <Badge
                              variant="outline"
                              className="flex items-center gap-1 border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[10px] text-[#008f68] dark:border-emerald-800/50 dark:bg-emerald-950/40 dark:text-emerald-400"
                            >
                              <CheckCircle2 className="size-3" />
                              <span className="text-[10px] font-medium">
                                Active
                              </span>
                            </Badge>
                          </div>
                        </div>

                        <div className="flex flex-col gap-4">
                          <div className="flex min-h-9 items-center gap-2 rounded-lg border border-slate-200/80 bg-slate-50 px-2.5 py-2 text-xs font-medium text-slate-500 dark:border-slate-800 dark:bg-slate-900">
                            {campaign.duracion ? (
                              <>
                                <Clock className="size-3.5 shrink-0 text-[#008f68]/70" />
                                <span className="truncate">
                                  {campaign.duracion}
                                </span>
                              </>
                            ) : (
                              <span className="text-xs italic text-slate-400">
                                No duration set
                              </span>
                            )}
                          </div>

                          <div className="space-y-3 border-t border-slate-100 pt-3 dark:border-slate-800">
                            <div className="flex items-center justify-between rounded-lg border border-emerald-100 bg-[#f0faf5] px-3 py-2 dark:border-emerald-900/30 dark:bg-emerald-950/20">
                              <div className="flex items-center gap-2 text-xs font-medium text-slate-900 dark:text-slate-100">
                                <div className="rounded-md border border-emerald-100 bg-white p-1 shadow-sm dark:border-emerald-900/30 dark:bg-slate-950">
                                  <Users className="size-3.5 text-[#008f68]" />
                                </div>
                                Total Tickets
                              </div>
                              <p className="text-xl font-bold text-[#008f68]">
                                {campaign.ticketCount ?? 0}
                              </p>
                            </div>

                            {secondaryMetrics.length > 0 ? (
                              <div className="grid grid-cols-2 gap-2">
                                {secondaryMetrics.map((metric) => (
                                  <div
                                    key={`${campaign.id}-${metric.label}`}
                                    className={`flex min-h-[72px] flex-col justify-between rounded-lg border p-3 ${metric.bgClass}`}
                                  >
                                    <p className="mb-1 line-clamp-2 text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                                      {metric.label}
                                    </p>
                                    <p
                                      className={`mt-auto text-lg font-bold ${metric.textClass}`}
                                    >
                                      {metric.value}
                                    </p>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <div className="flex min-h-[72px] items-center justify-between rounded-lg border border-slate-200/80 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-900">
                                <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">
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
                            className="h-8 w-full rounded-lg bg-slate-100 text-xs hover:bg-slate-200 dark:bg-slate-900 dark:hover:bg-slate-800"
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

        <SheetFooter className="border-t border-slate-200/80 bg-white px-4 py-3 dark:border-slate-800 dark:bg-slate-950">
          <div className="flex w-full flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs font-medium text-slate-500">
              {campaigns.length}{" "}
              {campaigns.length === 1 ? "campaign" : "campaigns"} found
            </p>
            <Button
              variant="default"
              onClick={() => onOpenChange(false)}
              className="h-8 w-full rounded-lg bg-[#008f68] text-xs shadow-sm hover:bg-[#007a5a] sm:w-auto sm:min-w-[96px]"
            >
              Done
            </Button>
          </div>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
