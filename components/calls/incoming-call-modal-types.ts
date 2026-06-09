/**
 * Shape of a customer + everything we want to surface in the incoming-call
 * panel. Built to mirror the backend Customer/Call/Ticket/ManualRecord
 * entities while letting the demo page render entirely from in-memory
 * mock data.
 *
 * Three record kinds are surfaced in the panel:
 *  - `CallRecord`        → from the `calls` table (modern Aircall events)
 *  - `TicketV2Record`    → from `tickets_v2` (current ticket pipeline)
 *  - `LegacyTicketRecord`→ from the read-only legacy `tickets` archive
 *  - `ManualRecordEntry` → from `manual_records` (agent-entered events,
 *                          e.g. walk-ins, in-person follow-ups)
 *
 * Operational tags are intentionally minimal — only flags that actually
 * change call-handling behaviour ("Overdue", "Do not call") rather than
 * marketing labels.
 */

export type CallDirection = "INBOUND" | "OUTBOUND" | "MISSED" | "VOICEMAIL";

export type CallState = "RINGING" | "ACTIVE" | "ENDED";

/** Operational, action-driving tags only. No marketing labels. */
export type CustomerFlagKind = "overdue" | "do_not_call";

export interface CustomerFlag {
  kind: CustomerFlagKind;
  label: string;
}

export interface YardRef {
  id: number;
  name: string;
  commonName?: string;
}

export interface CampaignRef {
  id: number;
  name: string;
  type?: "ONBOARDING" | "AR" | "OTHER";
}

export interface CallRecord {
  kind: "call";
  id: number;
  direction: CallDirection;
  durationSec?: number;
  agentName?: string;
  yardName?: string;
  campaignName?: string;
  disposition?: string;
  notes?: string;
  recordingUrl?: string;
  occurredAt: string;
  status?: "ACTIVE" | "COMPLETED" | "OVERDUE" | "PENDING_FOLLOWUP";
}

export interface TicketV2Record {
  kind: "ticket";
  variant: "v2";
  id: number;
  customerId?: number;
  callId?: number;
  yardId?: number;
  campaignId?: number;
  agentId?: number;
  phoneLineId?: number;
  title: string;
  status: "ACTIVE" | "PENDING_FOLLOWUP" | "RESOLVED" | "CLOSED" | "OVERDUE";
  priority?: "LOW" | "MEDIUM" | "HIGH" | "URGENT" | "EMERGENCY";
  ticketType?: string;
  phoneLineLabel?: string;
  campaignOption?: string;
  followUpDueDate?: string;
  followUpAssignedToId?: number;
  followUpAssignedToName?: string;
  resolvedAt?: string;
  assignedAgentName?: string;
  yardName?: string;
  campaignName?: string;
  occurredAt: string;
  updatedAt?: string;
  originalIssueDetail?: string;
  attachments?: string[];
  notes?: string;
}

export interface LegacyTicketRecord {
  kind: "ticket";
  variant: "legacy";
  id: number;
  legacyId: string;
  status: "ACTIVE" | "CLOSED" | "RESOLVED" | "COMPLETED" | "PENDING_FOLLOWUP";
  disposition?: string;
  direction?: CallDirection;
  agentName?: string;
  yardName?: string;
  campaignName?: string;
  occurredAt: string;
  updatedAt?: string;
  notes?: string;
}

export type AnyTicketRecord = TicketV2Record | LegacyTicketRecord;

export interface ManualRecordEntry {
  kind: "manual";
  id: number;
  /** Agent-defined category, e.g. "Walk-in", "Doc signed", "Onsite visit". */
  recordType: string;
  title: string;
  status?: "ACTIVE" | "RESOLVED" | "CLOSED";
  loggedByName?: string;
  yardName?: string;
  campaignName?: string;
  occurredAt: string;
  notes?: string;
}

export type CustomerActivity = CallRecord | AnyTicketRecord | ManualRecordEntry;

export type ActivityFilter = "all" | "calls" | "tickets" | "manual";

export interface CustomerNoteEntry {
  id: number;
  content: string;
  authorName?: string;
  createdAt: string;
  isPinned?: boolean;
}

export interface CustomerProfile {
  id: number;
  name: string;
  phone: string;
  /** ISO timestamp — first time this customer was contacted */
  customerSince: string;
  email?: string;
  city?: string;
  state?: string;
  pinnedNote?: string;
  flags: CustomerFlag[];
  yards: YardRef[];
  campaigns: CampaignRef[];
  notes: CustomerNoteEntry[];
  /** Pre-aggregated stats — what the backend would normally compute */
  stats: {
    totalCalls: number;
    totalTickets: number;
    openTickets: number;
    legacyTickets: number;
    manualRecords: number;
    lastContactAt?: string;
  };
  calls: CallRecord[];
  tickets: AnyTicketRecord[];
  manualRecords: ManualRecordEntry[];
}

export interface IncomingCallContext {
  direction: CallDirection;
  state: CallState;
  /** Phone line / DID the call came in on */
  lineLabel?: string;
  /** Agent currently handling the call (for OUTBOUND or when accepted) */
  agentName?: string;
  /** ISO timestamp when the call started ringing / connected */
  startedAt: string;
  /** ISO timestamp when the call was answered (active calls only) */
  answeredAt?: string;
}
