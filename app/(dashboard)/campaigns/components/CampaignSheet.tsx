"use client";

import {
  useEffect,
  useMemo,
  useState,
  type CSSProperties,
  type MouseEvent,
  type ReactNode,
} from "react";
import Link from "next/link";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { ManagementType } from "../../calls/types";
import { fetchFromBackend } from "@/lib/api-client";
import { useAircall } from "@/components/providers/AircallProvider";
import { ActivitiesIcon } from "@/components/icons/activities-icon";
import { useRole } from "@/components/providers/role-provider";
import { cn } from "@/lib/utils";
import {
  Ban,
  BarChart3,
  Building2,
  CheckCircle2,
  ChevronLeft,
  Clock,
  DollarSign,
  FileText,
  Loader2,
  MapPin,
  Pencil,
  RefreshCw,
  Tag,
  Trash2,
  X,
  XCircle,
} from "lucide-react";
import type { Campaign, YardSummary } from "../types";
import {
  CAMPAIGN_TYPE_LABELS,
  formatCampaignDate,
  getYardLabel,
} from "../utils";
import { CampaignMark } from "./CampaignMark";
import { CampaignSheetYardView } from "./CampaignSheetYardView";

type CampaignTicket = {
  id: number;
  status?: string | null;
  createdAt?: string;
  customer?: { name?: string | null };
  customerPhone?: string | null;
  campaignId?: number | null;
  campaign?: { id?: number | null };
};

interface CampaignSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  campaign: Campaign | null;
  yards: YardSummary[];
  yardPanelId?: number | null;
  onOpenYardPanel: (yardId: number) => void;
  onCloseYardPanel: () => void;
  onEdit?: (campaign: Campaign) => void;
  onDelete?: (campaign: Campaign) => void;
}

function SectionLabel({ children }: { children: ReactNode }) {
  return (
    <p className="mb-3 text-[11px] font-bold uppercase tracking-[0.14em] text-slate-500 dark:text-slate-400">
      {children}
    </p>
  );
}

function normalizePhone(phone: string) {
  return (phone || "").replace(/\D/g, "");
}

const STACK_PEEK_PX = 108;
const STACK_TRANSITION =
  "duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] motion-reduce:transition-none motion-reduce:transform-none";

function CampaignStackPeek({
  campaign,
  loading,
  onBack,
}: {
  campaign: Campaign;
  loading: boolean;
  onBack: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onBack}
      aria-label={`Back to campaign ${campaign.nombre}`}
      className={cn(
        "group absolute inset-y-0 left-0 z-[15] flex w-[var(--stack-peek)] flex-col",
        "rounded-l-[26px] border border-r-0 border-slate-200/90 bg-white text-left",
        "shadow-[8px_0_32px_-8px_rgba(15,23,42,0.18)] transition-all",
        "hover:border-[#008f68]/35 hover:shadow-[12px_0_40px_-8px_rgba(0,143,104,0.2)]",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#008f68]/40",
        "dark:border-slate-700 dark:bg-slate-950",
      )}
    >
      <span
        className="absolute inset-y-4 left-0 w-[3px] rounded-full bg-gradient-to-b from-[#008f68] via-[#00a67a] to-[#007a5a] opacity-90"
        aria-hidden
      />

      <div className="flex min-h-0 flex-1 flex-col px-3 pb-4 pt-5">
        <div className="flex flex-col items-center gap-2.5">
          <CampaignMark
            className="h-11 w-11 rounded-xl shadow-sm transition-transform group-hover:scale-[1.03]"
            iconClassName="h-5 w-5"
          />
          <span className="rounded-md bg-slate-100 px-1.5 py-0.5 font-mono text-[10px] font-bold text-slate-500 dark:bg-slate-800">
            #{campaign.id}
          </span>
        </div>

        <div className="mt-4 min-h-0 flex-1 px-0.5">
          <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-[#008f68]">
            Campaign
          </p>
          <p
            className="mt-2 line-clamp-5 text-[13px] font-bold leading-snug text-slate-900 dark:text-slate-50"
            title={campaign.nombre}
          >
            {campaign.nombre}
          </p>
          <p className="mt-2 text-[11px] font-medium text-slate-500">
            {CAMPAIGN_TYPE_LABELS[campaign.tipo]}
          </p>
          <span
            className={cn(
              "mt-2 inline-flex rounded-full border px-2 py-0.5 text-[10px] font-semibold",
              campaign.isActive
                ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                : "border-slate-200 bg-slate-100 text-slate-600",
            )}
          >
            {campaign.isActive ? "Active" : "Inactive"}
          </span>
        </div>

        <div className="mt-auto flex flex-col items-center gap-2 border-t border-slate-100 pt-3 dark:border-slate-800">
          {loading ? (
            <RefreshCw className="h-3.5 w-3.5 animate-spin text-slate-400" />
          ) : (
            <span className="text-[18px] font-bold leading-none text-[#008f68]">
              {campaign.ticketCount ?? 0}
            </span>
          )}
          <span className="text-[9px] font-bold uppercase tracking-[0.1em] text-slate-400">
            Activities
          </span>
          <span className="flex items-center gap-0.5 text-[10px] font-semibold text-[#008f68] opacity-80 group-hover:opacity-100">
            <ChevronLeft className="h-3.5 w-3.5" strokeWidth={2.5} />
            Back
          </span>
        </div>
      </div>
    </button>
  );
}

export function CampaignSheet({
  open,
  onOpenChange,
  campaign,
  yards,
  yardPanelId = null,
  onOpenYardPanel,
  onCloseYardPanel,
  onEdit,
  onDelete,
}: CampaignSheetProps) {
  const { role } = useRole();
  const isAgent = role?.toString().toLowerCase() === "agent";
  const { setSheetOpen } = useAircall();

  const [detail, setDetail] = useState<Campaign | null>(null);
  const [loading, setLoading] = useState(false);
  const [ticketsLoading, setTicketsLoading] = useState(false);
  const [tickets, setTickets] = useState<CampaignTicket[]>([]);
  const [showTickets, setShowTickets] = useState(false);
  const [ticketSearch, setTicketSearch] = useState("");

  useEffect(() => {
    setSheetOpen(open);
    return () => setSheetOpen(false);
  }, [open, setSheetOpen]);

  useEffect(() => {
    if (!open) {
      setShowTickets(false);
      setTicketSearch("");
      setTickets([]);
    }
  }, [open]);

  useEffect(() => {
    if (!campaign?.id) {
      setDetail(null);
      return;
    }

    setDetail(campaign);
    let cancelled = false;

    const load = async () => {
      try {
        setLoading(true);
        const fetched = await fetchFromBackend(`/campaign/${campaign.id}`);
        if (!cancelled) setDetail(fetched);
      } catch {
        if (!cancelled) setDetail(campaign);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();
    return () => {
      cancelled = true;
    };
  }, [campaign]);

  const data = detail || campaign;

  const filteredTickets = useMemo(() => {
    const term = ticketSearch.toLowerCase();
    const termDigits = normalizePhone(ticketSearch);
    return tickets.filter((ticket) => {
      const name = ticket.customer?.name?.toLowerCase() || "";
      const phone = (ticket.customerPhone || "").toLowerCase();
      const phoneDigits = normalizePhone(ticket.customerPhone || "");
      return (
        name.includes(term) ||
        phone.includes(term) ||
        (termDigits.length > 0 && phoneDigits.includes(termDigits)) ||
        `#${ticket.id}`.includes(term)
      );
    });
  }, [tickets, ticketSearch]);

  const loadTickets = async (campaignId: number) => {
    try {
      setTicketsLoading(true);
      const response = await fetchFromBackend("/tickets?page=1&limit=500");
      const items: CampaignTicket[] = response?.data || response || [];
      setTickets(
        items.filter(
          (t) => t.campaignId === campaignId || t.campaign?.id === campaignId,
        ),
      );
    } catch {
      setTickets([]);
    } finally {
      setTicketsLoading(false);
    }
  };

  const handleToggleTickets = async () => {
    if (!data?.id) return;
    if (!showTickets) {
      await loadTickets(data.id);
      setShowTickets(true);
      return;
    }
    setShowTickets(false);
  };

  const yardLabel = data ? getYardLabel(data, yards) : "";
  const linkedYardId = Number(data?.yardaId ?? data?.yarda?.id ?? 0) || null;
  const showYardPanel = Boolean(
    yardPanelId && linkedYardId && yardPanelId === linkedYardId,
  );

  const handleOpenYard = (event: MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();
    if (!linkedYardId) return;
    onOpenYardPanel(linkedYardId);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        hideClose
        className={cn(
          "flex h-dvh flex-col gap-0 overflow-hidden p-0 text-slate-900 antialiased",
          "border-l border-slate-200/80 bg-slate-50 shadow-2xl shadow-slate-900/15",
          "transition-[width,max-width] dark:border-slate-800 dark:bg-slate-950 dark:text-slate-50",
          STACK_TRANSITION,
          showYardPanel
            ? "w-[min(calc(560px+var(--stack-peek)),calc(100vw-0.5rem))] max-w-none sm:w-[calc(560px+var(--stack-peek))]"
            : "w-full max-w-[560px] sm:w-[min(560px,calc(100vw-2rem))]",
        )}
        style={
          {
            "--stack-peek": `${STACK_PEEK_PX}px`,
          } as CSSProperties
        }
      >
        {!data ? (
          <>
            <SheetHeader className="sr-only">
              <SheetTitle>Campaign details</SheetTitle>
              <SheetDescription>No campaign selected.</SheetDescription>
            </SheetHeader>
            <div className="flex min-h-0 flex-1 items-center justify-center p-8 text-center text-sm text-slate-500">
              Select a campaign from the grid.
            </div>
          </>
        ) : (
          <>
            <SheetHeader className="sr-only">
              <SheetTitle>{data.nombre}</SheetTitle>
              <SheetDescription>
                {showYardPanel
                  ? "Campaign and linked yard details."
                  : "Campaign profile and metrics."}
              </SheetDescription>
            </SheetHeader>

            <div
              className={cn(
                "relative flex h-full min-h-0 w-full overflow-hidden",
                showYardPanel && "bg-slate-200/40 dark:bg-slate-900/80",
              )}
            >
              {showYardPanel && data ? (
                <CampaignStackPeek
                  campaign={data}
                  loading={loading}
                  onBack={onCloseYardPanel}
                />
              ) : null}

              <div
                className={cn(
                  "relative z-0 flex h-full min-h-0 w-[min(560px,100vw)] shrink-0 flex-col bg-slate-50 transition-[opacity,transform]",
                  STACK_TRANSITION,
                  showYardPanel &&
                    "pointer-events-none absolute inset-y-0 left-[var(--stack-peek)] w-[min(560px,calc(100vw-var(--stack-peek)))] opacity-0 max-md:opacity-0",
                )}
                aria-hidden={showYardPanel}
              >
            <div className="relative shrink-0 border-b border-slate-200/70 bg-white dark:border-slate-800 dark:bg-slate-950">
              <SheetClose
                aria-label="Close campaign details"
                className="absolute right-4 top-4 z-20 flex h-10 w-10 items-center justify-center rounded-full text-slate-400 transition-all hover:bg-slate-100 hover:text-slate-700 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#008f68]/35"
              >
                <X className="h-5 w-5" strokeWidth={2} />
              </SheetClose>

              <div className="px-5 pb-4 pt-5 sm:px-6">
                <div className="flex items-start gap-4 pr-12">
                  <CampaignMark className="h-14 w-14 rounded-2xl" iconClassName="h-6 w-6" />
                  <div className="min-w-0 flex-1 pt-0.5">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded-md bg-slate-100 px-2 py-0.5 font-mono text-[11px] font-semibold text-slate-500">
                        #{data.id}
                      </span>
                      {loading ? (
                        <span className="inline-flex items-center gap-1 rounded-md bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-500">
                          <RefreshCw className="h-3 w-3 animate-spin" />
                          Refreshing
                        </span>
                      ) : null}
                    </div>
                    <h2 className="mt-2 text-[22px] font-bold leading-tight text-slate-950 wrap-anywhere dark:text-white">
                      {data.nombre}
                    </h2>
                    <p className="mt-1 text-[13px] font-medium text-slate-500">
                      {CAMPAIGN_TYPE_LABELS[data.tipo]} · Created{" "}
                      {formatCampaignDate(data.createdAt)}
                    </p>
                  </div>
                </div>

                <div className="mt-4 grid grid-cols-2 gap-2">
                  <div
                    className={cn(
                      "rounded-xl border px-3.5 py-2.5 shadow-sm",
                      data.isActive
                        ? "border-emerald-200/80 bg-emerald-50 text-emerald-800"
                        : "border-slate-200 bg-slate-50 text-slate-700",
                    )}
                  >
                    <p className="text-[10px] font-bold uppercase tracking-[0.12em] opacity-70">
                      Status
                    </p>
                    <p className="mt-1 text-[14px] font-bold">
                      {data.isActive ? "Active" : "Inactive"}
                    </p>
                  </div>
                  <div className="rounded-xl border border-slate-200/70 bg-white px-3.5 py-2.5 shadow-sm dark:border-slate-800 dark:bg-slate-950">
                    <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-slate-400">
                      Activities
                    </p>
                    <p className="mt-1 text-[14px] font-bold text-[#008f68]">
                      {data.ticketCount ?? tickets.length ?? 0}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
              <div className="space-y-6 px-5 py-5 pb-8 sm:px-6">
                <div>
                  <SectionLabel>Campaign info</SectionLabel>
                  <div className="divide-y divide-slate-100 overflow-hidden rounded-xl border border-slate-200/70 bg-white shadow-sm dark:divide-slate-800 dark:border-slate-800 dark:bg-slate-950">
                    <div className="flex gap-3 px-4 py-3.5">
                      <Tag className="mt-0.5 h-4 w-4 text-slate-400" />
                      <div>
                        <p className="text-[11px] font-semibold uppercase text-slate-400">
                          Type
                        </p>
                        <p className="text-[13px] font-medium">{CAMPAIGN_TYPE_LABELS[data.tipo]}</p>
                      </div>
                    </div>
                    <div className="flex gap-3 px-4 py-3.5">
                      <Clock className="mt-0.5 h-4 w-4 text-slate-400" />
                      <div>
                        <p className="text-[11px] font-semibold uppercase text-slate-400">
                          Duration
                        </p>
                        <p className="text-[13px] font-medium">{data.duracion || "—"}</p>
                      </div>
                    </div>
                    {linkedYardId ? (
                      <button
                        type="button"
                        onClick={handleOpenYard}
                        className="flex w-full gap-3 px-4 py-3.5 text-left transition-colors hover:bg-[#f0faf5]/70 dark:hover:bg-emerald-500/5"
                      >
                        <MapPin className="mt-0.5 h-4 w-4 text-orange-600" />
                        <div className="min-w-0 flex-1">
                          <p className="text-[11px] font-semibold uppercase text-slate-400">
                            Yard
                          </p>
                          <p className="truncate text-[13px] font-semibold text-[#008f68]">
                            {yardLabel}
                          </p>
                          <p className="mt-0.5 text-[11px] font-medium text-slate-400">
                            Tap to view yard details
                          </p>
                        </div>
                        <Building2 className="mt-1 h-4 w-4 shrink-0 text-slate-300" />
                      </button>
                    ) : (
                      <div className="flex gap-3 px-4 py-3.5">
                        <MapPin className="mt-0.5 h-4 w-4 text-slate-300" />
                        <div className="min-w-0 flex-1">
                          <p className="text-[11px] font-semibold uppercase text-slate-400">
                            Yard
                          </p>
                          <p className="text-[13px] font-medium text-slate-400">
                            No yard assigned
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <SectionLabel>Metrics</SectionLabel>
                  {data.tipo === ManagementType.ONBOARDING ? (
                    <div className="grid grid-cols-2 gap-2">
                      <div className="rounded-xl border border-emerald-200/80 bg-emerald-50 p-3">
                        <p className="flex items-center gap-1 text-[10px] font-bold uppercase text-emerald-700">
                          <CheckCircle2 className="h-3.5 w-3.5" />
                          Registered
                        </p>
                        <p className="mt-1 text-2xl font-bold text-emerald-800">
                          {data.registeredCount ?? 0}
                        </p>
                      </div>
                      <div className="rounded-xl border border-red-200/80 bg-red-50 p-3">
                        <p className="flex items-center gap-1 text-[10px] font-bold uppercase text-red-700">
                          <XCircle className="h-3.5 w-3.5" />
                          Not registered
                        </p>
                        <p className="mt-1 text-2xl font-bold text-red-800">
                          {data.notRegisteredCount ?? 0}
                        </p>
                      </div>
                    </div>
                  ) : data.tipo === ManagementType.AR ? (
                    <div className="grid grid-cols-2 gap-2">
                      <div className="rounded-xl border border-emerald-200/80 bg-emerald-50 p-3">
                        <p className="flex items-center gap-1 text-[10px] font-bold uppercase text-emerald-700">
                          <DollarSign className="h-3.5 w-3.5" />
                          Paid
                        </p>
                        <p className="mt-1 text-2xl font-bold text-emerald-800">
                          {data.paidCount ?? 0}
                        </p>
                      </div>
                      <div className="rounded-xl border border-red-200/80 bg-red-50 p-3">
                        <p className="flex items-center gap-1 text-[10px] font-bold uppercase text-red-700">
                          <Ban className="h-3.5 w-3.5" />
                          Not paid
                        </p>
                        <p className="mt-1 text-2xl font-bold text-red-800">
                          {data.notPaidCount ?? 0}
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="rounded-xl border border-slate-200/70 bg-white p-4 shadow-sm">
                      <BarChart3 className="h-4 w-4 text-slate-400" />
                      <p className="mt-2 text-[13px] text-slate-500">
                        General campaign — track activities from the list below.
                      </p>
                    </div>
                  )}
                </div>

                <div>
                  <div className="mb-3 flex items-center justify-between gap-2">
                    <SectionLabel>Activities</SectionLabel>
                    <button
                      type="button"
                      onClick={handleToggleTickets}
                      className="text-[12px] font-semibold text-[#008f68] hover:underline"
                    >
                      {showTickets ? "Hide list" : "Show list"}
                    </button>
                  </div>

                  {showTickets ? (
                    <div className="overflow-hidden rounded-xl border border-slate-200/70 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-950">
                      <div className="border-b border-slate-100 p-3 dark:border-slate-800">
                        <Input
                          placeholder="Search tickets..."
                          value={ticketSearch}
                          onChange={(e) => setTicketSearch(e.target.value)}
                          className="h-8 rounded-lg text-[12px]"
                        />
                      </div>
                      <div className="max-h-[240px] overflow-y-auto">
                        {ticketsLoading ? (
                          <div className="flex items-center justify-center gap-2 py-8 text-sm text-slate-500">
                            <Loader2 className="h-4 w-4 animate-spin" />
                            Loading tickets...
                          </div>
                        ) : filteredTickets.length === 0 ? (
                          <p className="py-8 text-center text-[13px] text-slate-500">
                            No tickets found.
                          </p>
                        ) : (
                          filteredTickets.map((ticket) => (
                            <Link
                              key={ticket.id}
                              href={`/calls?ticketId=${ticket.id}`}
                              onClick={() => onOpenChange(false)}
                              className="flex items-center justify-between border-b border-slate-100 px-4 py-3 text-left transition-colors last:border-0 hover:bg-[#f0faf5]/60 dark:border-slate-800"
                            >
                              <div className="min-w-0">
                                <p className="text-[13px] font-semibold text-slate-800 dark:text-slate-100">
                                  #{ticket.id}{" "}
                                  {ticket.customer?.name || "Unknown customer"}
                                </p>
                                <p className="truncate text-[12px] text-slate-500">
                                  {ticket.customerPhone || "No phone"}
                                </p>
                              </div>
                              <span className="shrink-0 rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold uppercase text-slate-500">
                                {ticket.status || "—"}
                              </span>
                            </Link>
                          ))
                        )}
                      </div>
                    </div>
                  ) : null}
                </div>
              </div>
            </div>

            <div className="shrink-0 border-t border-slate-200/70 bg-white/95 px-5 py-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] shadow-[0_-10px_30px_rgba(15,23,42,0.08)] backdrop-blur dark:border-slate-800 dark:bg-slate-950/95 sm:px-6">
              <div
                className={cn(
                  "grid gap-2",
                  !isAgent && onEdit
                    ? "grid-cols-2 sm:grid-cols-4"
                    : "grid-cols-2",
                )}
              >
                <Link
                  href={`/calls?campaignId=${data.id}`}
                  onClick={() => onOpenChange(false)}
                  className="flex min-h-11 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-2 text-[12px] font-semibold text-slate-700 transition-all hover:bg-slate-50 active:scale-[0.98] dark:border-slate-800 dark:bg-slate-950 dark:text-slate-200"
                >
                  <ActivitiesIcon className="h-4 w-4 shrink-0" />
                  Activities
                </Link>
                {!isAgent ? (
                  <Link
                    href={`/reports/campaigns?campaignId=${data.id}`}
                    onClick={() => onOpenChange(false)}
                    className="flex min-h-11 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-2 text-[12px] font-semibold text-slate-700 transition-all hover:bg-slate-50 active:scale-[0.98] dark:border-slate-800 dark:bg-slate-950 dark:text-slate-200"
                  >
                    <FileText className="h-4 w-4 shrink-0" />
                    Report
                  </Link>
                ) : null}
                {linkedYardId ? (
                  <button
                    type="button"
                    onClick={handleOpenYard}
                    className="flex min-h-11 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-2 text-[12px] font-semibold text-slate-700 transition-all hover:border-[#008f68]/30 hover:bg-[#f0faf5] hover:text-[#006b4f] active:scale-[0.98] dark:border-slate-800 dark:bg-slate-950 dark:text-slate-200 dark:hover:bg-emerald-500/10"
                  >
                    <Building2 className="h-4 w-4 shrink-0" />
                    Yard
                  </button>
                ) : (
                  <span className="flex min-h-11 items-center justify-center rounded-xl border border-dashed border-slate-200 px-2 text-[11px] text-slate-400">
                    No yard
                  </span>
                )}
                {onEdit && !isAgent ? (
                  <button
                    type="button"
                    onClick={() => {
                      onOpenChange(false);
                      onEdit(data);
                    }}
                    className="flex min-h-11 items-center justify-center gap-2 rounded-xl border border-[#008f68] bg-[#008f68] px-2 text-[12px] font-semibold text-white shadow-sm hover:bg-[#007a5a] active:scale-[0.98]"
                  >
                    <Pencil className="h-4 w-4 shrink-0" />
                    Edit
                  </button>
                ) : null}
              </div>
              {onDelete && !isAgent ? (
                <button
                  type="button"
                  onClick={() => {
                    onOpenChange(false);
                    onDelete(data);
                  }}
                  className="mt-2 flex min-h-10 w-full items-center justify-center gap-2 rounded-xl border border-red-200 bg-red-50 text-[12px] font-semibold text-red-700 hover:bg-red-100/80 dark:border-red-900/40 dark:bg-red-950/30 dark:text-red-300"
                >
                  <Trash2 className="h-4 w-4" />
                  Delete campaign
                </button>
              ) : null}
            </div>
              </div>

              <div
                className={cn(
                  "absolute inset-y-0 right-0 z-20 flex h-full w-[min(560px,calc(100vw-1rem))] max-w-[560px] flex-col",
                  "overflow-hidden rounded-l-[26px] border border-slate-200/80 border-l-slate-200/90 bg-white",
                  "shadow-[-40px_0_80px_-12px_rgba(15,23,42,0.28)] transition-transform",
                  "dark:border-slate-700 dark:bg-slate-950",
                  STACK_TRANSITION,
                  showYardPanel
                    ? "translate-x-0"
                    : "pointer-events-none translate-x-full",
                )}
              >
                {yardPanelId ? (
                  <CampaignSheetYardView
                    yardId={yardPanelId}
                    onBack={onCloseYardPanel}
                    stacked
                  />
                ) : null}
              </div>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
