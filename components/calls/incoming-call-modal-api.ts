"use client";

import { useCallback, useEffect, useState } from "react";

import { fetchFromBackend } from "@/lib/api-client";

import type {
  CallRecord,
  CustomerActivity,
  CustomerProfile,
  ManualRecordEntry,
  TicketV2Record,
} from "./incoming-call-modal-types";

/**
 * Data adapter that converts the backend Customers/Timeline API into the
 * `CustomerProfile` shape consumed by the IncomingCallModal. Kept separate
 * from the component so the modal stays presentation-only and the mock
 * data path keeps working without any network access.
 */

export type RawListItem = {
  id: number;
  name?: string | null;
  phone?: string | null;
  callCount?: number | null;
  ticketCount?: number | null;
  openTickets?: number | null;
  lastContactAt?: string | null;
  pinnedNote?: string | null;
};

type RawCustomerDetail = RawListItem & {
  createdAt?: string;
  yards?: Array<{ id: number; name?: string | null; commonName?: string | null }>;
  yard?: { id: number; name?: string | null } | null;
  campaigns?: Array<{ id: number; nombre?: string | null; type?: string | null }>;
  notes?: Array<{
    id: number;
    content: string;
    createdBy?: string | null;
    createdAt: string;
    isPinned?: boolean | null;
  }>;
  email?: string | null;
  city?: string | null;
  state?: string | null;
  totalCalls?: number | null;
};

type RawTimelineEntry = {
  id: string;
  type: "call" | "ticket" | "sms" | "customer_note" | "manual_record";
  occurredAt: string;
  direction?: string | null;
  callStatus?: string | null;
  disposition?: string | null;
  duration?: number | null;
  callNotes?: string | null;
  startedAt?: string | null;
  agentName?: string | null;
  phoneLineLabel?: string | null;
  yardName?: string | null;
  campaignName?: string | null;
  recordingUrl?: string | null;
  customerId?: number | null;
  callId?: number | null;
  yardId?: number | null;
  campaignId?: number | null;
  agentId?: number | null;
  phoneLineId?: number | null;
  ticketId?: number | null;
  ticketStatus?: string | null;
  ticketPriority?: string | null;
  ticketType?: string | null;
  ticketNotes?: string | null;
  originalIssueDetail?: string | null;
  attachments?: string[] | null;
  campaignOption?: string | null;
  followUpDueDate?: string | null;
  followUpAssignedToId?: number | null;
  followUpAssignedToName?: string | null;
  updatedAt?: string | null;
  resolvedAt?: string | null;
  assignedAgentName?: string | null;
  manualRecordId?: number | null;
  manualRecordNotes?: string | null;
};

type TimelineResponse = {
  entries: RawTimelineEntry[];
  total?: number;
  nextCursor?: string | null;
};

export interface RealCustomerOption {
  id: number;
  name: string;
  phone: string;
  callCount: number;
  ticketCount: number;
  openTickets: number;
  lastContactAt?: string;
}

// ── helpers ────────────────────────────────────────────────────────────

function unwrap<T>(payload: unknown): T {
  if (payload && typeof payload === "object" && "data" in payload) {
    const inner = (payload as { data?: unknown }).data;
    if (inner !== undefined) return inner as T;
  }
  return payload as T;
}

function toIso(value: string | null | undefined): string {
  if (!value) return new Date(0).toISOString();
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? new Date(0).toISOString() : d.toISOString();
}

function asTicketStatus(
  value: string | null | undefined,
): TicketV2Record["status"] {
  const allowed: TicketV2Record["status"][] = [
    "ACTIVE",
    "PENDING_FOLLOWUP",
    "RESOLVED",
    "CLOSED",
    "OVERDUE",
  ];
  const upper = (value ?? "").toUpperCase();
  return (allowed as string[]).includes(upper)
    ? (upper as TicketV2Record["status"])
    : "ACTIVE";
}

function asCallDirection(
  value: string | null | undefined,
): CallRecord["direction"] {
  const upper = (value ?? "").toUpperCase();
  if (upper === "OUTBOUND") return "OUTBOUND";
  if (upper === "MISSED") return "MISSED";
  if (upper === "VOICEMAIL") return "VOICEMAIL";
  return "INBOUND";
}

function asTicketPriority(
  value: string | null | undefined,
): TicketV2Record["priority"] | undefined {
  const upper = (value ?? "").toUpperCase();
  if (
    upper === "LOW" ||
    upper === "MEDIUM" ||
    upper === "HIGH" ||
    upper === "URGENT" ||
    upper === "EMERGENCY"
  ) {
    return upper;
  }
  return undefined;
}

/**
 * Resolve a numeric record id, preferring the explicit id but falling back to
 * the numeric suffix of the composite `entry.id` (e.g. "call-42" → 42).
 * Uses Number.isFinite checks because `??` does not catch `NaN`, which would
 * otherwise leak into the UI and render as the literal text "NaN".
 */
function resolveEntryId(
  primary: number | null | undefined,
  compositeId: string,
): number {
  if (typeof primary === "number" && Number.isFinite(primary)) return primary;
  const parsed = Number(compositeId.split("-")[1]);
  return Number.isFinite(parsed) ? parsed : 0;
}

function mapEntryToActivity(entry: RawTimelineEntry): CustomerActivity | null {
  if (entry.type === "call") {
    const call: CallRecord = {
      kind: "call",
      id: resolveEntryId(entry.callId, entry.id),
      direction: asCallDirection(entry.direction),
      durationSec: entry.duration ?? undefined,
      agentName: entry.agentName ?? undefined,
      yardName: entry.yardName ?? undefined,
      campaignName: entry.campaignName ?? undefined,
      disposition: entry.disposition ?? undefined,
      notes: entry.callNotes ?? undefined,
      recordingUrl: entry.recordingUrl ?? undefined,
      occurredAt: toIso(entry.occurredAt),
    };
    return call;
  }
  if (entry.type === "ticket") {
    const summary = (entry.ticketNotes ?? "").trim();
    const ticket: TicketV2Record = {
      kind: "ticket",
      variant: "v2",
      id: resolveEntryId(entry.ticketId, entry.id),
      customerId:
        typeof entry.customerId === "number" && Number.isFinite(entry.customerId)
          ? entry.customerId
          : undefined,
      callId:
        typeof entry.callId === "number" && Number.isFinite(entry.callId)
          ? entry.callId
          : undefined,
      yardId:
        typeof entry.yardId === "number" && Number.isFinite(entry.yardId)
          ? entry.yardId
          : undefined,
      campaignId:
        typeof entry.campaignId === "number" && Number.isFinite(entry.campaignId)
          ? entry.campaignId
          : undefined,
      agentId:
        typeof entry.agentId === "number" && Number.isFinite(entry.agentId)
          ? entry.agentId
          : undefined,
      phoneLineId:
        typeof entry.phoneLineId === "number" && Number.isFinite(entry.phoneLineId)
          ? entry.phoneLineId
          : undefined,
      title: summary
        ? summary.slice(0, 60)
        : `Ticket #${entry.ticketId ?? "—"}`,
      status: asTicketStatus(entry.ticketStatus),
      priority: asTicketPriority(entry.ticketPriority),
      ticketType: entry.ticketType ?? undefined,
      phoneLineLabel: entry.phoneLineLabel ?? undefined,
      campaignOption: entry.campaignOption ?? undefined,
      followUpDueDate: entry.followUpDueDate
        ? toIso(entry.followUpDueDate)
        : undefined,
      followUpAssignedToId:
        typeof entry.followUpAssignedToId === "number" &&
        Number.isFinite(entry.followUpAssignedToId)
          ? entry.followUpAssignedToId
          : undefined,
      followUpAssignedToName: entry.followUpAssignedToName ?? undefined,
      updatedAt: entry.updatedAt ? toIso(entry.updatedAt) : undefined,
      resolvedAt: entry.resolvedAt ? toIso(entry.resolvedAt) : undefined,
      assignedAgentName: entry.assignedAgentName ?? undefined,
      yardName: entry.yardName ?? undefined,
      campaignName: entry.campaignName ?? undefined,
      occurredAt: toIso(entry.occurredAt),
      originalIssueDetail: entry.originalIssueDetail ?? undefined,
      attachments: Array.isArray(entry.attachments)
        ? entry.attachments
        : undefined,
      notes: entry.ticketNotes ?? undefined,
    };
    return ticket;
  }
  if (entry.type === "manual_record") {
    const summary = (entry.manualRecordNotes ?? "").trim();
    const manual: ManualRecordEntry = {
      kind: "manual",
      id: resolveEntryId(entry.manualRecordId, entry.id),
      recordType: entry.disposition ?? "Manual record",
      title: summary ? summary.slice(0, 80) : "Manual record",
      loggedByName: entry.agentName ?? undefined,
      yardName: entry.yardName ?? undefined,
      campaignName: entry.campaignName ?? undefined,
      occurredAt: toIso(entry.occurredAt),
      notes: entry.manualRecordNotes ?? undefined,
    };
    return manual;
  }
  return null; // Drop SMS / customer_note from the modal feed for now
}

export function mapCustomerActivities(
  entries: RawTimelineEntry[],
): CustomerActivity[] {
  return entries
    .map(mapEntryToActivity)
    .filter((x): x is CustomerActivity => x !== null);
}

export function mapCustomerProfile(
  detail: RawCustomerDetail,
  entries: RawTimelineEntry[],
): CustomerProfile {
  const activities = mapCustomerActivities(entries);

  const calls = activities.filter(
    (a): a is CallRecord => a.kind === "call",
  );
  const tickets = activities.filter(
    (a) => a.kind === "ticket",
  ) as TicketV2Record[];
  const manualRecords = activities.filter(
    (a): a is ManualRecordEntry => a.kind === "manual",
  );

  const yards =
    detail.yards && detail.yards.length > 0
      ? detail.yards
      : detail.yard
        ? [detail.yard]
        : [];

  return {
    id: detail.id,
    name: detail.name?.trim() || `Customer #${detail.id}`,
    phone: detail.phone?.trim() || "—",
    customerSince: toIso(detail.createdAt),
    email: detail.email ?? undefined,
    city: detail.city ?? undefined,
    state: detail.state ?? undefined,
    pinnedNote: detail.pinnedNote ?? undefined,
    flags: [],
    yards: yards.map((y) => ({
      id: y.id,
      name: y.name ?? "Unnamed yard",
      commonName: (y as { commonName?: string | null }).commonName ?? undefined,
    })),
    campaigns: (detail.campaigns ?? []).map((c) => ({
      id: c.id,
      name: c.nombre ?? "Untitled campaign",
      type: c.type === "ONBOARDING" || c.type === "AR" || c.type === "OTHER"
        ? c.type
        : undefined,
    })),
    notes: (detail.notes ?? []).map((n) => ({
      id: n.id,
      content: n.content,
      authorName: n.createdBy ?? undefined,
      createdAt: toIso(n.createdAt),
      isPinned: n.isPinned ?? undefined,
    })),
    stats: {
      totalCalls: detail.totalCalls ?? detail.callCount ?? calls.length,
      totalTickets: detail.ticketCount ?? tickets.length,
      openTickets: detail.openTickets ?? 0,
      legacyTickets: 0, // Not surfaced through the timeline endpoint
      manualRecords: manualRecords.length,
      lastContactAt: detail.lastContactAt ?? undefined,
    },
    calls,
    tickets,
    manualRecords,
  };
}

// ── plain fetchers (reusable outside React hooks) ──────────────────────

/**
 * Fetches `/customers/:id` + `/customers/:id/timeline` in parallel and
 * returns a mapped CustomerProfile. Throws when the customer detail
 * cannot be loaded; the timeline is best-effort (returns empty on error).
 */
export async function fetchCustomerProfile(
  customerId: number,
  options: { limit?: number; signal?: AbortSignal } = {},
): Promise<CustomerProfile> {
  const { limit = 50 } = options;
  const [detailRaw, timelineRaw] = await Promise.all([
    fetchFromBackend(`/customers/${customerId}`),
    fetchFromBackend(
      `/customers/${customerId}/timeline?limit=${limit}&type=all&sort=desc`,
    ).catch(() => ({ entries: [] }) as TimelineResponse),
  ]);
  const detail = unwrap<RawCustomerDetail>(detailRaw);
  const timeline = unwrap<TimelineResponse>(timelineRaw);
  return mapCustomerProfile(detail, timeline?.entries ?? []);
}

/**
 * Look a customer up by phone number using the standard search endpoint.
 * Returns the first match, or `null` if nothing matches / the API errors.
 *
 * The backend's `/customers?search=…` accepts partial matches against
 * name and phone, so we normalise the value (digits only, last 10
 * digits) before issuing the request.
 */
export async function fetchCustomerByPhone(
  phone: string,
): Promise<RawListItem | null> {
  const digits = phone.replace(/\D/g, "");
  if (!digits) return null;
  // Use the last 10 digits to ignore country-code mismatches.
  const search = digits.length > 10 ? digits.slice(-10) : digits;
  try {
    const raw = await fetchFromBackend(
      `/customers?search=${encodeURIComponent(search)}&limit=5&page=1`,
    );
    const data = unwrap<RawListItem[] | { data?: RawListItem[] }>(raw);
    const list = Array.isArray(data) ? data : (data?.data ?? []);
    if (list.length === 0) return null;

    // Prefer the strongest match: exact suffix on the phone.
    const exact = list.find((c) =>
      (c.phone ?? "").replace(/\D/g, "").endsWith(search),
    );
    return exact ?? list[0];
  } catch {
    return null;
  }
}

// ── hooks ──────────────────────────────────────────────────────────────

/**
 * Fetches a paginated customer list (default 50) for the demo selector.
 * Returns `null` while loading and an error message when it fails.
 */
export function useCustomersList(
  options: { enabled?: boolean; limit?: number; search?: string } = {},
) {
  const { enabled = true, limit = 50, search = "" } = options;
  const [customers, setCustomers] = useState<RealCustomerOption[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!enabled) return;
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({
        page: "1",
        limit: String(limit),
      });
      if (search.trim()) params.set("search", search.trim());
      const raw = await fetchFromBackend(`/customers?${params.toString()}`);
      const data = unwrap<RawListItem[] | { data?: RawListItem[] }>(raw);
      const list = Array.isArray(data) ? data : (data?.data ?? []);
      setCustomers(
        list.map((row) => ({
          id: row.id,
          name: row.name?.trim() || `Customer #${row.id}`,
          phone: row.phone?.trim() || "—",
          callCount: row.callCount ?? 0,
          ticketCount: row.ticketCount ?? 0,
          openTickets: row.openTickets ?? 0,
          lastContactAt: row.lastContactAt ?? undefined,
        })),
      );
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to load customers";
      setError(message);
      setCustomers([]);
    } finally {
      setLoading(false);
    }
  }, [enabled, limit, search]);

  useEffect(() => {
    if (enabled) void refresh();
  }, [enabled, refresh]);

  return { customers, loading, error, refresh };
}

/**
 * Fetches the full profile for a single customer: detail + timeline.
 * `customerId === null` clears the state and skips the network call.
 */
export function useCustomerProfile(
  customerId: number | null,
  options: { limit?: number } = {},
) {
  const { limit = 50 } = options;
  const [profile, setProfile] = useState<CustomerProfile | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (customerId === null) {
      setProfile(null);
      setError(null);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError(null);

    fetchCustomerProfile(customerId, { limit })
      .then((next) => {
        if (cancelled) return;
        setProfile(next);
      })
      .catch((err) => {
        if (cancelled) return;
        const message =
          err instanceof Error ? err.message : "Failed to load customer";
        setError(message);
        setProfile(null);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [customerId, limit]);

  return { profile, loading, error };
}
