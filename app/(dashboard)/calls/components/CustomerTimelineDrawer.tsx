"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import useSWR from "swr";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  ArrowLeft,
  Phone,
  PhoneCall,
  User,
  Calendar,
  Loader2,
} from "lucide-react";
import type { Ticket } from "@/lib/mock-data";
import {
  AgentOption,
  CampaignOption,
  CreateTicketFormData,
  CustomerOption,
  YardOption,
} from "../types";
import {
  getClientName,
  getClientPhone,
  getDirectionIcon,
  getDirectionText,
  getStatusBadgeColor,
  getPriorityColor,
  isMissedCall,
} from "../utils/call-helpers";
import { CallEditFormContent } from "./CallEditFormContent";
import type { Filters } from "../hooks/useCallFilters";

// ── Types ──────────────────────────────────────────────────────────────────────

export interface CustomerCallGroup {
  /** Unique key for this customer group (customerId or phone) */
  key: string;
  customerId?: number;
  customerName: string;
  customerPhone: string;
  /** All calls for this customer from the current page, sorted newest first */
  calls: Ticket[];
  /** Most recent call */
  latestCall: Ticket;
}

interface CustomerTimelineDrawerProps {
  open: boolean;
  onClose: () => void;
  group: CustomerCallGroup | null;
  /** Call currently shown in the edit form (from page.tsx selectedTicket) */
  selectedCall: Ticket | null;
  /** Called when user clicks a history item — parent populates editFormData */
  onSelectCall: (call: Ticket) => void;
  /** Edit form state — managed by page.tsx */
  editFormData: CreateTicketFormData;
  setEditFormData: (next: CreateTicketFormData) => void;
  attachmentFiles: File[];
  setAttachmentFiles: (next: File[]) => void;
  savedAttachments: string[];
  isUpdating: boolean;
  /** Called when user clicks Save — parent handles the API call */
  onUpdate: () => void;
  /** Ref data */
  customers: CustomerOption[];
  yards: YardOption[];
  agents: AgentOption[];
  campaigns: CampaignOption[];
  getAttachmentLabel: (value: string) => string;
  getAttachmentUrl: (value: string) => string;
  /** Called when user wants to create a support ticket from this call */
  onCreateTicket?: () => void;
  /** Active filters from the main page — used to scope the history fetch */
  activeFilters?: Filters;
}

// ── Fetcher ────────────────────────────────────────────────────────────────────

const fetcher = (url: string) => fetch(url).then((r) => r.json());

// ── Sub-components ─────────────────────────────────────────────────────────────

function CallHistoryItem({
  call,
  isActive,
  onClick,
}: {
  call: Ticket;
  isActive: boolean;
  onClick: () => void;
}) {
  const ref = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (isActive) {
      ref.current?.scrollIntoView({ block: "nearest", behavior: "smooth" });
    }
  }, [isActive]);

  const dateLabel = useMemo(() => {
    const d = new Date(call.callDate || call.createdAt || "");
    if (isNaN(d.getTime())) return "-";
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    if (diffDays === 0) {
      return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    }
    if (diffDays < 7) {
      return d.toLocaleDateString([], {
        weekday: "short",
        month: "short",
        day: "numeric",
      });
    }
    return d.toLocaleDateString([], {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  }, [call.callDate, call.createdAt]);

  const dirText = getDirectionText(
    call.direction || "",
    (call as any).originalDirection,
    call.agentId,
  );

  const missed = isMissedCall(call);

  return (
    <button
      ref={ref}
      onClick={onClick}
      className={cn(
        "w-full text-left px-3 py-3 border-b border-border/40 hover:bg-muted/60 transition-colors focus:outline-none",
        isActive
          ? "bg-primary/8 border-l-2 border-l-primary pl-2.5"
          : "border-l-2 border-l-transparent",
      )}
    >
      <div className="flex items-start gap-2.5">
        {/* Direction icon */}
        <div
          className={cn(
            "mt-0.5 h-6 w-6 rounded-full flex items-center justify-center shrink-0",
            missed ? "bg-rose-500/10" : "bg-muted",
          )}
        >
          {getDirectionIcon(call.direction || "")}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-1">
            <span className="text-xs font-semibold truncate">#{call.id}</span>
            <span className="text-[10px] text-muted-foreground shrink-0">
              {dateLabel}
            </span>
          </div>
          <p className="text-[11px] text-muted-foreground mt-0.5">{dirText}</p>
          <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
            {call.status && (
              <Badge
                variant="outline"
                className={cn(
                  "text-[9px] font-medium px-1.5 py-0 h-4",
                  getStatusBadgeColor(call.status as string),
                )}
              >
                {call.status.toString().replace("_", " ")}
              </Badge>
            )}
            {call.priority && (
              <Badge
                variant="outline"
                className={cn(
                  "text-[9px] font-medium px-1.5 py-0 h-4",
                  getPriorityColor(call.priority as string),
                )}
              >
                {call.priority}
              </Badge>
            )}
          </div>
        </div>
      </div>
    </button>
  );
}

// ── Main Drawer ────────────────────────────────────────────────────────────────

export function CustomerTimelineDrawer({
  open,
  onClose,
  group,
  selectedCall,
  onSelectCall,
  editFormData,
  setEditFormData,
  attachmentFiles,
  setAttachmentFiles,
  savedAttachments,
  isUpdating,
  onUpdate,
  customers,
  yards,
  agents,
  campaigns,
  getAttachmentLabel,
  getAttachmentUrl,
  onCreateTicket,
  activeFilters,
}: CustomerTimelineDrawerProps) {
  // Fetch complete call history for the customer when drawer opens
  const historyUrl = useMemo(() => {
    if (!open || !group?.customerId) return null;
    const params = new URLSearchParams();
    params.set("mode", "page");
    params.set("customerId", String(group.customerId));
    params.set("limit", "200");
    if (activeFilters) {
      if (activeFilters.campaign && activeFilters.campaign !== "all")
        params.set("campaignId", activeFilters.campaign);
      if (
        activeFilters.campaignOption &&
        activeFilters.campaignOption !== "all"
      )
        params.set("campaignOption", activeFilters.campaignOption);
      if (activeFilters.yard && activeFilters.yard !== "all")
        params.set("yardId", activeFilters.yard);
      if (activeFilters.status && activeFilters.status !== "all")
        params.set("status", activeFilters.status);
      if (activeFilters.direction && activeFilters.direction !== "all")
        params.set("direction", activeFilters.direction);
      if (activeFilters.disposition && activeFilters.disposition !== "all")
        params.set("disposition", activeFilters.disposition);
      if (activeFilters.agent && activeFilters.agent !== "all")
        params.set("agentId", activeFilters.agent);
      if (activeFilters.phoneLine && activeFilters.phoneLine !== "all")
        params.set("phoneLineId", activeFilters.phoneLine);
    }
    return `/api/calls?${params.toString()}`;
  }, [open, group?.customerId, activeFilters]);

  const { data: historyData, isLoading: isLoadingHistory } = useSWR(
    historyUrl,
    fetcher,
    { revalidateOnFocus: false },
  );

  // Merge: use fetched data if available, fall back to initialCalls
  const allCalls = useMemo<Ticket[]>(() => {
    if (historyData?.success && Array.isArray(historyData.data?.data)) {
      return [...historyData.data.data].sort(
        (a, b) =>
          new Date(b.callDate || b.createdAt || 0).getTime() -
          new Date(a.callDate || a.createdAt || 0).getTime(),
      );
    }
    if (historyData?.success && Array.isArray(historyData.data)) {
      return [...historyData.data].sort(
        (a, b) =>
          new Date(b.callDate || b.createdAt || 0).getTime() -
          new Date(a.callDate || a.createdAt || 0).getTime(),
      );
    }
    return group?.calls ?? [];
  }, [historyData, group?.calls]);

  // Track active call ID for sidebar highlighting
  const activeCallId = selectedCall?.id ?? group?.latestCall?.id;

  const customerName = group?.customerName ?? getClientName(selectedCall);
  const customerPhone = group?.customerPhone ?? getClientPhone(selectedCall);
  const callCount = allCalls.length || group?.calls.length || 0;

  return (
    <Sheet open={open} onOpenChange={(v) => !v && onClose()}>
      <SheetContent
        side="right"
        className="w-[85vw]! max-w-[85vw]! sm:max-w-[85vw]! p-0 flex flex-col [&>button.absolute]:hidden"
      >
        {/* Visually hidden title for accessibility (Radix DialogTitle requirement) */}
        <SheetTitle className="sr-only">
          {customerName ? `Timeline — ${customerName}` : "Customer Timeline"}
        </SheetTitle>

        {/* ── Header ─────────────────────────────────────────────────────── */}
        <SheetHeader className="px-4 py-3 border-b bg-muted/30 flex-row items-center gap-3 shrink-0 space-y-0">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 shrink-0"
            onClick={onClose}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>

          {/* Customer avatar */}
          <div className="h-8 w-8 rounded-full bg-primary/15 flex items-center justify-center shrink-0 border border-primary/20">
            <User className="h-4 w-4 text-primary" />
          </div>

          <div className="flex-1 min-w-0">
            <h2 className="font-semibold text-sm leading-tight truncate">
              {customerName}
            </h2>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-xs text-muted-foreground flex items-center gap-1">
                <Phone className="h-3 w-3" />
                {customerPhone}
              </span>
              <span className="text-muted-foreground/40">·</span>
              <span className="text-xs text-muted-foreground flex items-center gap-1">
                <PhoneCall className="h-3 w-3" />
                {isLoadingHistory ? (
                  <Loader2 className="h-3 w-3 animate-spin" />
                ) : (
                  <>
                    {callCount} call{callCount !== 1 ? "s" : ""}
                  </>
                )}
              </span>
            </div>
          </div>
        </SheetHeader>

        {/* ── Body ───────────────────────────────────────────────────────── */}
        <div className="flex flex-1 min-h-0 overflow-hidden">
          {/* LEFT: Call history sidebar */}
          <div className="w-65 shrink-0 flex flex-col border-r bg-muted/10 overflow-hidden">
            <div className="px-3 py-2 border-b bg-background/50">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <Calendar className="h-3 w-3" />
                Call History
              </p>
            </div>

            <ScrollArea className="flex-1">
              {isLoadingHistory && allCalls.length === 0 ? (
                <div className="flex items-center justify-center py-10 gap-2 text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span className="text-sm">Loading...</span>
                </div>
              ) : allCalls.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-10 gap-2 text-muted-foreground">
                  <PhoneCall className="h-5 w-5 opacity-40" />
                  <span className="text-sm">No calls found</span>
                </div>
              ) : (
                allCalls.map((call) => (
                  <CallHistoryItem
                    key={call.id}
                    call={call}
                    isActive={call.id === activeCallId}
                    onClick={() => onSelectCall(call)}
                  />
                ))
              )}
            </ScrollArea>
          </div>

          {/* RIGHT: Edit form for selected call */}
          <div className="flex-1 flex flex-col min-h-0 overflow-hidden bg-background">
            {selectedCall ? (
              <>
                {/* Call identifier bar */}
                <div className="px-6 py-3 border-b bg-muted/20 flex items-center gap-3 shrink-0">
                  <div className="flex items-center gap-2">
                    {getDirectionIcon(selectedCall.direction || "")}
                    <span className="text-sm font-semibold">
                      Call #{selectedCall.id}
                    </span>
                  </div>
                  <span className="text-muted-foreground/40">·</span>
                  <span className="text-sm text-muted-foreground">
                    {getDirectionText(
                      selectedCall.direction || "",
                      (selectedCall as any).originalDirection,
                      selectedCall.agentId,
                    )}
                  </span>
                  {selectedCall.status && (
                    <>
                      <span className="text-muted-foreground/40">·</span>
                      <Badge
                        variant="outline"
                        className={cn(
                          "text-[10px] font-medium",
                          getStatusBadgeColor(selectedCall.status as string),
                        )}
                      >
                        {selectedCall.status.toString().replace("_", " ")}
                      </Badge>
                    </>
                  )}
                  {(() => {
                    const started = (selectedCall as any).startedAt;
                    const answered = (selectedCall as any).answeredAt;
                    if (!started || !answered) return null;
                    const ringSec = Math.round(
                      (new Date(answered).getTime() -
                        new Date(started).getTime()) /
                        1000,
                    );
                    if (ringSec < 0) return null;
                    return (
                      <>
                        <span className="text-muted-foreground/40">·</span>
                        <span className="text-xs text-muted-foreground">
                          Ring {ringSec}s
                        </span>
                      </>
                    );
                  })()}
                </div>

                {/* Form */}
                <CallEditFormContent
                  ticket={selectedCall}
                  customers={customers}
                  yards={yards}
                  agents={agents}
                  campaigns={campaigns}
                  formData={editFormData}
                  setFormData={setEditFormData}
                  attachmentFiles={attachmentFiles}
                  setAttachmentFiles={setAttachmentFiles}
                  savedAttachments={savedAttachments}
                  isUpdating={isUpdating}
                  onSubmit={onUpdate}
                  onCancel={onClose}
                  onCreateTicket={onCreateTicket}
                  getAttachmentLabel={getAttachmentLabel}
                  getAttachmentUrl={getAttachmentUrl}
                  withScroll={true}
                />
              </>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center gap-3 text-muted-foreground">
                <PhoneCall className="h-8 w-8 opacity-30" />
                <p className="text-sm">Select a call from the history</p>
              </div>
            )}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
