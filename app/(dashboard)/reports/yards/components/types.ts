export type Yard = {
  id: number;
  name: string;
  commonName?: string | null;
  isActive?: boolean;
  yardType?: string | null;
  createdAt?: string;
};

export type Ticket = {
  id: number;
  yardId?: number | string | null;
  status?: string | null;
  priority?: string | null;
  disposition?: string | null;
  direction?: string | null;
  createdAt?: string;
  updatedAt?: string;
  customer?: { name?: string | null };
  agent?: { name?: string | null; id?: number } | null;
  agentId?: number | null;
  campaignId?: number | string | null;
  campaign?: { id?: number | string | null; nombre?: string | null } | null;
};

export type YardStatsDay = {
  date: string;
  day: string;
  fullDate: string;
  total: number;
  open: number;
  closed: number;
  dayOfMonth?: number;
};

export type YardStats = {
  yard: Yard;
  totalTickets: number;
  openTickets: number;
  inProgressTickets: number;
  closedTickets: number;
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
  avgResolutionTime?: number;
  peakDay?: string;
  peakDayCount?: number;
};
