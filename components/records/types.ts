export type UnifiedRecordType = "call" | "ticket" | "manual_record";

export type UnifiedRecordLinkedTicket = {
  id: number;
  status?: string | null;
  priority?: string | null;
  ticketType?: string | null;
  campaignOption?: string | null;
  issueDetail?: string | null;
  createdAt?: string | null;
  updatedAt?: string | null;
  assignedTo?: {
    id?: number | string | null;
    name?: string | null;
    email?: string | null;
  } | null;
};

export type UnifiedRecord = {
  id: string;
  recordType: UnifiedRecordType;
  sourceId: number;
  occurredAt?: string | null;
  updatedAt?: string | null;
  status?: string | null;
  priority?: string | null;
  disposition?: string | null;
  direction?: string | null;
  customerId?: number | string | null;
  customer?: {
    id?: number | string | null;
    name?: string | null;
    phone?: string | null;
  } | null;
  customerPhone?: string | null;
  agent?: {
    id?: number | string | null;
    name?: string | null;
    email?: string | null;
  } | null;
  campaign?: { id?: number | string | null; nombre?: string | null } | null;
  notes?: string | null;
  issueDetail?: string | null;
  callId?: number | string | null;
  ticketId?: number | string | null;
  manualRecordId?: number | string | null;
  aircallId?: string | null;
  callOutsidePeriod?: boolean;
  tickets?: UnifiedRecordLinkedTicket[];
  linkedTicketCount?: number;
};

export type UnifiedRecordCounts = {
  all: number;
  calls: number;
  tickets: number;
  linkedTickets: number;
  standaloneTickets: number;
  manualRecords: number;
};
