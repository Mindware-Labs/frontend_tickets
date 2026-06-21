"use client";

import { useEffect, useState, type ReactNode } from "react";
import {
  ArrowLeft,
  Check,
  ChevronRight,
  Clock,
  Copy,
  ExternalLink,
  Globe,
  Loader2,
  MapPin,
  Phone,
  User,
} from "lucide-react";
import { ActivitiesIcon } from "@/components/icons/activities-icon";
import { fetchFromBackend } from "@/lib/api-client";
import { useAircall } from "@/components/providers/AircallProvider";
import { cn } from "@/lib/utils";
import type { Yard } from "../../yards/types";
import { YardMark } from "../../yards/components/YardMark";

function hasText(value?: string | null): value is string {
  return Boolean(value?.trim());
}

function formatActivityDate(value?: string | null) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function isInternalYardsPath(value?: string | null) {
  if (!hasText(value)) return false;
  const trimmed = value.trim();
  if (trimmed.startsWith("/yards")) return true;
  try {
    const path = /^https?:\/\//i.test(trimmed)
      ? new URL(trimmed).pathname
      : trimmed;
    return path.startsWith("/yards");
  } catch {
    return false;
  }
}

function normalizeExternalUrl(value?: string | null) {
  if (!hasText(value) || isInternalYardsPath(value)) return null;
  const trimmed = value.trim();
  return /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
}

function getMapsUrl(address?: string | null) {
  if (!hasText(address)) return null;
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
    address.trim(),
  )}`;
}

function SectionLabel({ children }: { children: ReactNode }) {
  return (
    <p className="mb-3 text-[11px] font-bold uppercase tracking-[0.14em] text-slate-500 dark:text-neutral-400">
      {children}
    </p>
  );
}

function InfoCard({
  icon: Icon,
  label,
  value,
  href,
  mono,
}: {
  icon: typeof MapPin;
  label: string;
  value: string;
  href?: string | null;
  mono?: boolean;
}) {
  const content = (
    <p
      className={cn(
        "mt-0.5 text-[13px] font-medium leading-snug text-slate-800 [overflow-wrap:anywhere] dark:text-neutral-100",
        mono && "font-mono font-semibold",
        !hasText(value) && "italic text-slate-400",
      )}
    >
      {hasText(value) ? value : "—"}
    </p>
  );

  return (
    <div className="flex gap-3 rounded-xl border border-slate-200/70 bg-white p-3.5 shadow-sm dark:border-neutral-800 dark:bg-neutral-950">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-slate-100 dark:border-neutral-800 bg-slate-50 dark:bg-neutral-900 text-slate-500 dark:text-neutral-400">
        <Icon className="h-4 w-4" strokeWidth={2} />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-slate-400">
          {label}
        </p>
        {href && hasText(value) ? (
          <a
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-0.5 block text-[13px] font-semibold text-[#008f68] underline-offset-2 hover:underline"
          >
            {value}
          </a>
        ) : (
          content
        )}
      </div>
    </div>
  );
}

interface CampaignSheetYardViewProps {
  yardId: number;
  onBack: () => void;
  /** Stacked sheet: compact header with collapse control (no full-width back row). */
  stacked?: boolean;
}

function YardPanelNav({
  onBack,
  stacked,
}: {
  onBack: () => void;
  stacked?: boolean;
}) {
  if (stacked) {
    return (
      <div className="flex shrink-0 items-center justify-between gap-3 border-b border-slate-100/90 bg-white/95 px-5 py-4 shadow-sm backdrop-blur sm:px-6 dark:border-neutral-800 dark:bg-neutral-950/95">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-[#008f68]">
            Linked yard
          </p>
          <h3 className="mt-0.5 text-[18px] font-bold leading-tight text-slate-950 dark:text-white">
            Yard details
          </h3>
        </div>
        <button
          type="button"
          onClick={onBack}
          aria-label="Back to campaign"
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-500 shadow-sm transition-all hover:border-slate-300 hover:bg-slate-50 dark:hover:bg-neutral-800 hover:text-slate-800 active:scale-95 dark:border-neutral-700 dark:bg-neutral-900"
        >
          <ChevronRight className="h-5 w-5" strokeWidth={2.25} />
        </button>
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={onBack}
      className="flex shrink-0 items-center gap-2 border-b border-slate-200/70 bg-white py-3 pl-5 pr-14 text-left text-[13px] font-semibold text-[#008f68] transition-colors hover:bg-[#f0faf5]/80 active:scale-[0.99] sm:pl-6 sm:pr-16 dark:border-neutral-800 dark:bg-neutral-950 dark:hover:bg-emerald-500/10"
    >
      <span className="flex h-8 w-8 items-center justify-center rounded-full border border-[#008f68]/20 bg-[#f0faf5] text-[#008f68]">
        <ArrowLeft className="h-4 w-4" strokeWidth={2.25} />
      </span>
      <span>Back to campaign</span>
    </button>
  );
}

export function CampaignSheetYardView({
  yardId,
  onBack,
  stacked = false,
}: CampaignSheetYardViewProps) {
  const {
    dial,
    status: aircallStatus,
    isLoggedIn: aircallLoggedIn,
  } = useAircall();
  const canDial = aircallStatus === "ready" && aircallLoggedIn;

  const [yard, setYard] = useState<Yard | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        setLoading(true);
        const fetched = await fetchFromBackend(`/yards/${yardId}`);
        if (!cancelled) setYard(fetched);
      } catch {
        if (!cancelled) setYard(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();
    return () => {
      cancelled = true;
    };
  }, [yardId]);

  useEffect(() => {
    if (!copied) return;
    const t = window.setTimeout(() => setCopied(null), 2000);
    return () => window.clearTimeout(t);
  }, [copied]);

  const copyText = async (key: string, text?: string | null) => {
    if (!hasText(text)) return;
    try {
      await navigator.clipboard.writeText(text.trim());
      setCopied(key);
    } catch {
      setCopied(null);
    }
  };

  if (loading && !yard) {
    return (
      <div className="flex min-h-0 flex-1 flex-col bg-slate-50 dark:bg-neutral-950">
        <YardPanelNav onBack={onBack} stacked={stacked} />
        <div className="flex flex-1 flex-col items-center justify-center gap-3 p-8 text-slate-500 dark:text-neutral-400">
          <Loader2 className="h-8 w-8 animate-spin text-[#008f68]" />
          <p className="text-sm font-medium">Loading yard...</p>
        </div>
      </div>
    );
  }

  if (!yard) {
    return (
      <div className="flex min-h-0 flex-1 flex-col bg-slate-50 dark:bg-neutral-950">
        <YardPanelNav onBack={onBack} stacked={stacked} />
        <div className="flex flex-1 items-center justify-center p-8 text-center text-sm text-slate-500 dark:text-neutral-400">
          Could not load yard details.
        </div>
      </div>
    );
  }

  const ticketTotal = yard.ticketCount ?? yard.totalTickets ?? 0;
  const mapsUrl = getMapsUrl(yard.propertyAddress);
  const yardLinkUrl = normalizeExternalUrl(yard.yardLink);
  const isSaas = yard.yardType === "SAAS";

  return (
    <div className="flex min-h-0 flex-1 flex-col bg-slate-50 dark:bg-neutral-950">
      <YardPanelNav onBack={onBack} stacked={stacked} />

      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
        <div className="border-b border-slate-200/70 bg-white px-5 pb-5 pt-4 sm:px-6 dark:border-neutral-800 dark:bg-neutral-950">
          <div className="flex items-start gap-3.5">
            <YardMark className="h-14 w-14 rounded-2xl" iconClassName="h-6 w-6" />
            <div className="min-w-0 flex-1">
              <span className="rounded-md bg-slate-100 dark:bg-neutral-800 px-2 py-0.5 font-mono text-[11px] font-semibold text-slate-500 dark:text-neutral-400">
                #{yard.id}
              </span>
              <h3 className="mt-2 text-[20px] font-bold leading-tight text-slate-950 [overflow-wrap:anywhere] dark:text-white">
                {yard.name}
              </h3>
              {hasText(yard.commonName) &&
              yard.commonName.trim() !== yard.name.trim() ? (
                <p className="mt-1 text-[13px] font-medium text-slate-500 dark:text-neutral-400">
                  {yard.commonName.trim()}
                </p>
              ) : null}
            </div>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-2">
            <div
              className={cn(
                "rounded-xl border px-3 py-2.5 shadow-sm",
                yard.isActive
                  ? "border-emerald-200/80 bg-emerald-50 text-emerald-800"
                  : "border-slate-200 dark:border-neutral-700 bg-slate-50 dark:bg-neutral-800 text-slate-600 dark:text-neutral-300",
              )}
            >
              <p className="text-[10px] font-bold uppercase tracking-[0.1em] opacity-70">
                Status
              </p>
              <p className="mt-1 text-[14px] font-bold">
                {yard.isActive ? "Active" : "Inactive"}
              </p>
            </div>
            <div
              className={cn(
                "rounded-xl border px-3 py-2.5 shadow-sm",
                isSaas
                  ? "border-blue-200/80 bg-blue-50 text-blue-800"
                  : "border-violet-200/80 bg-violet-50 text-violet-800",
              )}
            >
              <p className="text-[10px] font-bold uppercase tracking-[0.1em] opacity-70">
                Service
              </p>
              <p className="mt-1 text-[14px] font-bold">
                {isSaas ? "SaaS" : "Full Service"}
              </p>
            </div>
          </div>

          <div className="mt-2 grid grid-cols-2 gap-2">
            <div className="rounded-xl border border-slate-200/70 bg-slate-50/80 p-3 dark:border-neutral-800 dark:bg-neutral-900/50">
              <p className="flex items-center gap-1 text-[10px] font-bold uppercase text-slate-400">
                <ActivitiesIcon className="h-3 w-3" />
                Activities
              </p>
              <p className="mt-1 text-[18px] font-bold text-[#008f68]">
                {ticketTotal}
              </p>
            </div>
            <div className="rounded-xl border border-slate-200/70 bg-slate-50/80 p-3 dark:border-neutral-800 dark:bg-neutral-900/50">
              <p className="flex items-center gap-1 text-[10px] font-bold uppercase text-slate-400">
                <Clock className="h-3 w-3" />
                Last activity
              </p>
              <p className="mt-1 text-[12px] font-semibold leading-snug text-slate-700 dark:text-neutral-200">
                {formatActivityDate(yard.lastActivity)}
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-5 px-5 py-5 sm:px-6">
          <div>
            <SectionLabel>Property & contact</SectionLabel>
            <div className="grid gap-2 sm:grid-cols-1">
              <InfoCard
                icon={MapPin}
                label="Address"
                value={yard.propertyAddress?.trim() || ""}
                href={mapsUrl}
              />
              <div className="flex gap-2">
                <div className="min-w-0 flex-1">
                  <InfoCard
                    icon={Phone}
                    label="Phone"
                    value={yard.contactInfo?.trim() || ""}
                    mono
                  />
                </div>
                {hasText(yard.contactInfo) && canDial ? (
                  <button
                    type="button"
                    onClick={() =>
                      dial(yard.contactInfo!.trim(), `yard-${yard.id}`)
                    }
                    className="mt-auto flex h-[62px] shrink-0 items-center justify-center rounded-xl border border-[#008f68]/25 bg-[#f0faf5] px-4 text-[#008f68] transition-colors hover:bg-[#e2fae9]"
                    aria-label="Call yard"
                  >
                    <Phone className="h-5 w-5" strokeWidth={2} />
                  </button>
                ) : null}
              </div>
              {yardLinkUrl ? (
                <InfoCard
                  icon={Globe}
                  label="Yard link"
                  value={yard.yardLink?.trim() || ""}
                  href={yardLinkUrl}
                />
              ) : null}
            </div>
          </div>

          {yard.landlord?.name ? (
            <div>
              <SectionLabel>Landlord</SectionLabel>
              <div className="flex items-start gap-3 rounded-xl border border-slate-200/70 bg-white p-4 shadow-sm dark:border-neutral-800 dark:bg-neutral-950">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-violet-200/80 bg-violet-50 text-violet-700">
                  <User className="h-4 w-4" strokeWidth={2} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[14px] font-bold text-slate-900 dark:text-neutral-50">
                    {yard.landlord.name}
                  </p>
                  {yard.landlord.email ? (
                    <p className="mt-1 truncate text-[12px] text-slate-500 dark:text-neutral-400">
                      {yard.landlord.email}
                    </p>
                  ) : null}
                  {yard.landlord.phone ? (
                    <p className="mt-0.5 font-mono text-[12px] font-medium text-slate-600 dark:text-neutral-300">
                      {yard.landlord.phone}
                    </p>
                  ) : null}
                </div>
              </div>
            </div>
          ) : null}

          {hasText(yard.notes) ? (
            <div>
              <SectionLabel>Notes</SectionLabel>
              <div className="rounded-xl border border-amber-200/60 bg-amber-50/50 p-4 dark:border-amber-900/40 dark:bg-amber-950/20">
                <p className="whitespace-pre-wrap text-[13px] leading-relaxed text-slate-700 [overflow-wrap:anywhere] dark:text-neutral-200">
                  {yard.notes.trim()}
                </p>
              </div>
            </div>
          ) : null}

          <div className="flex flex-wrap justify-center gap-2 pt-1">
            {mapsUrl ? (
              <a
                href={mapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex min-h-10 flex-1 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-3 text-[12px] font-semibold text-slate-700 transition-colors hover:bg-slate-50 dark:hover:bg-neutral-800 sm:flex-none sm:px-4 dark:border-neutral-800 dark:bg-neutral-950 dark:text-neutral-200"
              >
                <MapPin className="h-4 w-4" />
                Maps
              </a>
            ) : null}
            {hasText(yard.contactInfo) ? (
              <button
                type="button"
                onClick={() => copyText("phone", yard.contactInfo)}
                className="inline-flex min-h-10 flex-1 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-3 text-[12px] font-semibold text-slate-700 transition-colors hover:bg-slate-50 dark:hover:bg-neutral-800 sm:flex-none sm:px-4 dark:border-neutral-800 dark:bg-neutral-950 dark:text-neutral-200"
              >
                {copied === "phone" ? (
                  <Check className="h-4 w-4 text-emerald-600" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
                {copied === "phone" ? "Copied" : "Copy phone"}
              </button>
            ) : null}
            {yardLinkUrl ? (
              <a
                href={yardLinkUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex min-h-10 flex-1 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-3 text-[12px] font-semibold text-slate-700 transition-colors hover:bg-slate-50 dark:hover:bg-neutral-800 sm:flex-none sm:px-4 dark:border-neutral-800 dark:bg-neutral-950 dark:text-neutral-200"
              >
                <ExternalLink className="h-4 w-4" />
                Portal
              </a>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
