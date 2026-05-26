export type AgentManualRecord = {
  id: number;
  status?: string | null;
  disposition?: string | null;
  createdAt?: string | null;
  createdByAgentId?: number | null;
  customer?: { name?: string | null; phone?: string | null } | null;
};

export type AgentTicket = {
  id: number;
  clientName: string;
  campaign: string;
  status: string;
  createdAt: string;
};

export type AgentKpis = {
  totalCalls: number;
  resolvedCalls: number;
  missedCalls: number;
  avgDurationSec: number;
  totalTickets: number;
  resolvedTickets: number;
  pendingFollowupTickets: number;
  overdueTickets: number;
  resolutionRate: number;
  totalManualRecords: number;
  resolvedManualRecords: number;
  completionRate: number;
};

export type AgentDashboardData = {
  generatedAt: string;
  kpis: {
    totalCalls: number;
    totalTickets: number;
    activeTickets: number;
    openTickets: number;
    inProgressTickets: number;
    closedTickets: number;
    pendingActions: number;
    resolutionRate: number;
    callsLast7Days: number;
  };
  agentKpis: AgentKpis;
  summary?: {
    agentId: number;
    totalActivity: number;
    totalCalls: number;
    totalTickets: number;
    totalManualRecords: number;
    needsAttention: number;
    completionRate: number;
    resolutionRate: number;
  };
  charts: {
    callsByDay: Array<{ day: string; calls: number }>;
    ticketsByCampaign: Array<{ name: string; count: number }>;
    ticketsByDisposition: Array<{ name: string; count: number }>;
  };
  recentTickets: AgentTicket[];
  recentManualRecords?: AgentManualRecord[];
};
