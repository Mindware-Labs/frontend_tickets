"use client";

export interface CampaignOption {
  id: number;
  nombre: string;
}

export interface YardOption {
  id: number;
  name: string;
}

export interface AgentOption {
  id: number;
  name: string;
}

export interface PhoneLineOption {
  id: number;
  phoneNumber: string;
  label?: string;
}

export interface CustomerNote {
  id: number;
  content: string;
  createdBy?: string;
  createdAt: string;
  updatedBy?: string;
  updatedAt?: string;
  /** Persistent client-number note (one per customer) */
  isPinned?: boolean;
}

export interface Customer {
  id: number;
  name?: string;
  phone?: string;
  note?: string;
  notes?: CustomerNote[];
  campaigns?: CampaignOption[];
  createdAt: string;
  ticketCount?: number;
  callCount?: number;
  lastContactAt?: string;
  yard?: { id: number; name: string };
  yards?: { id: number; name: string }[];
  pinnedNote?: string;
  totalCalls?: number;
  openTickets?: number;
}

export interface CustomerFormData {
  name: string;
  phone: string;
  note: string;
  pendingNotes: string[];
  campaignIds: string[];
}

export type TimelineEntryType = "call" | "ticket" | "sms" | "customer_note";

export interface TimelineEntry {
  id: string;
  type: TimelineEntryType;
  occurredAt: string;
  direction?: "INBOUND" | "OUTBOUND" | "MISSED" | "VOICEMAIL";
  disposition?: string;
  duration?: number;
  agentName?: string;
  phoneLineLabel?: string;
  yardName?: string;
  recordingUrl?: string;
  callId?: number;
  hasTicket?: boolean;
  ticketId?: number;
  ticketStatus?: string;
  ticketPriority?: string;
  ticketType?: string;
  assignedAgentName?: string;
  resolvedAt?: string;
  smsDirection?: "sent" | "received";
  smsBody?: string;
  noteContent?: string;
  noteAuthor?: string;
  lastLineOrigin?: string;
}

export interface TimelineFilters {
  type: "all" | TimelineEntryType;
  sort: "desc" | "asc";
  from: string;
  to: string;
  lineId: string;
  agentId: string;
}

export interface CustomerSummary {
  callCount: number;
  ticketCount: number;
  openTickets: number;
  lastContactAt?: string;
}

export interface PinnedNotePayload {
  pinnedNote: string;
}

export interface CustomersListResponse {
  data: Customer[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
