export type Yard = {
  id: number;
  name: string;
  commonName?: string | null;
  isActive?: boolean;
  yardType?: string | null;
  createdAt?: string;
};

export type Call = {
  id: number;
  yardId?: number | string | null;
  yard?: { id?: number | string | null; name?: string | null } | null;
  status?: string | null;
  priority?: string | null;
  disposition?: string | null;
  direction?: string | null;
  originalDirection?: string | null;
  issueDetail?: string | null;
  createdAt?: string;
  updatedAt?: string;
  customer?: {
    id?: number | string | null;
    name?: string | null;
    phone?: string | null;
  };
  customerId?: number | string | null;
  customerPhone?: string | null;
  phone?: string | null;
  agent?: { name?: string | null; id?: number } | null;
  assignedTo?: {
    id?: number | null;
    name?: string | null;
    email?: string | null;
  } | null;
  agentId?: number | null;
  aircallId?: string | null;
  phoneLineId?: number | string | null;
  duration?: number | null;
  startedAt?: string | null;
  answeredAt?: string | null;
  endedAt?: string | null;
  recordingUrl?: string | null;
  voicemailUrl?: string | null;
  missedCallReason?: string | null;
  notes?: string | null;
  followUpDueDate?: string | null;
  followUpAssignedToId?: number | string | null;
  campaignId?: number | string | null;
  campaign?: { id?: number | string | null; nombre?: string | null } | null;
  callId?: number | string | null;
  call?: {
    id?: number | string | null;
    direction?: string | null;
    disposition?: string | null;
    status?: string | null;
    createdAt?: string | null;
  } | null;
  ticketId?: number | string | null;
  ticketType?: string | null;
  campaignOption?: string | null;
  phoneLine?: {
    id?: number | string | null;
    phoneNumber?: string | null;
    label?: string | null;
  } | null;
};

export type Ticket = Call;

export type YardRecordType = "call" | "ticket" | "manual_record";

export type YardRecordLinkedTicket = {
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

export type YardRecord = {
  id: string;
  recordType: YardRecordType;
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
  startedAt?: string | null;
  answeredAt?: string | null;
  endedAt?: string | null;
  duration?: number | null;
  call?: {
    id: number;
    direction?: string | null;
    disposition?: string | null;
    status?: string | null;
    createdAt?: string | null;
  } | null;
  tickets?: YardRecordLinkedTicket[];
  linkedTicketCount?: number;
  callOutsidePeriod?: boolean;
};

export type YardStatsDay = {
  date: string;
  day: string;
  fullDate: string;
  total: number;
  open: number;
  closed: number;
  created?: number;
  dayOfMonth?: number;
};

export type YardNewLeadPreview = {
  callId: number;
  customerId?: number | string | null;
  customerName: string;
  phone?: string | null;
  direction?: string | null;
  status?: string | null;
  disposition?: string | null;
  agentName?: string | null;
  issueDetail?: string | null;
  createdAt?: string | null;
};

export type YardStats = {
  yard: Yard;
  totalTickets: number;
  totalCalls?: number;
  totalManualRecords?: number;
  openTickets: number;
  inProgressTickets: number;
  closedTickets: number;
  closedCalls?: number;
  closedManualRecords?: number;
  resolutionRate?: number;
  todayTickets: number;
  lastActivity?: string | null;
  ticketsByStatus: { status: string; count: number }[];
  ticketsByDirection: { direction: string; count: number }[];
  ticketsByDisposition: { disposition: string; count: number }[];
  ticketsByPriority: { priority: string; count: number }[];
  ticketsByDay: YardStatsDay[];
  ticketsByAgent: { agentId: number; agentName: string; count: number }[];
  ticketsByCampaign: {
    campaignId: number | string;
    campaignName: string;
    count: number;
  }[];
  ticketsByNewLead: {
    customerId: number | null;
    customerName: string;
    count: number;
    phone?: string | null;
    issueDetails: {
      callId?: number;
      ticketId: number;
      issueDetail: string;
      createdAt?: string | null;
      direction?: string | null;
      status?: string | null;
      disposition?: string | null;
      agentName?: string | null;
      duration?: number | null;
    }[];
  }[];
  newLeadCallsCount?: number;
  newLeadCustomersCount?: number;
  missedInbound?: number;
  missedOutbound?: number;
  activeAgents?: number;
  callResolutionRate?: number;
  callsByDay?: YardStatsDay[];
  manualRecordsByDay?: YardStatsDay[];
  newLeadPreview?: YardNewLeadPreview[];
  avgResolutionTime?: number;
  peakDay?: string;
  peakDayCount?: number;
};
