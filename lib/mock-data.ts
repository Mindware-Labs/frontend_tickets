export interface Call {
  id: string;
  clientName: string;
  yard?: any;
  phone: string;
  type: "Onboarding" | "AR";
  campaign: string;
  status: "Open" | "In Progress" | "Closed";
  createdAt: string;
  assignedTo?: string;
  priority?: "Low" | "Medium" | "High";
  description?: string;
  callDuration?: string;
  aircallId?: string;
  direction?: "inbound" | "outbound" | "missed";
  originalDirection?: "inbound" | "outbound" | "voicemail";
  customerId?: number | string;
  customerPhone?: string;
  phoneLineId?: number | string;
  agentId?: number | string;
  duration?: number | null;
  startedAt?: string;
  answeredAt?: string;
  endedAt?: string;
  recordingUrl?: string;
  voicemailUrl?: string;
  missedCallReason?: string;
  notes?: string;
  followUpDueDate?: string;
  followUpAssignedToId?: number | string;
  yardId?: number | string;
  campaignId?: number | string;
  campaignOption?: string;
}

export interface Ticket extends Call {}

export interface Campaign {
  id: string;
  name: string;
  callCount: number;
  ticketCount?: number;
  status: "Active" | "Paused" | "Completed";
  startDate: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: "Admin" | "Supervisor" | "Agent";
  avatar?: string;
  callsAssigned: number;
  ticketsAssigned?: number;
  status: "Active" | "Inactive";
}

export const mockCalls: Call[] = [
  {
    id: "TKT-001",
    clientName: "John Smith",
    phone: "+1 (555) 123-4567",
    type: "Onboarding",
    campaign: "Spring Campaign 2024",
    status: "Open",
    createdAt: "2024-01-15T10:30:00",
    priority: "High",
    callDuration: "5:34",
    aircallId: "CALL-12345",
    direction: "inbound",
  },
  {
    id: "TKT-002",
    clientName: "Sarah Johnson",
    phone: "+1 (555) 234-5678",
    type: "AR",
    campaign: "Q1 Collections",
    status: "In Progress",
    createdAt: "2024-01-15T09:15:00",
    assignedTo: "Agent Smith",
    priority: "Medium",
    callDuration: "3:22",
    aircallId: "CALL-12346",
    direction: "outbound",
  },
  {
    id: "TKT-003",
    clientName: "Michael Brown",
    phone: "+1 (555) 345-6789",
    type: "Onboarding",
    campaign: "New Customer Outreach",
    status: "Closed",
    createdAt: "2024-01-14T14:20:00",
    assignedTo: "Agent Davis",
    priority: "Low",
    callDuration: "8:15",
    aircallId: "CALL-12347",
    direction: "missed",
  },
  {
    id: "TKT-004",
    clientName: "Emily Davis",
    phone: "+1 (555) 456-7890",
    type: "AR",
    campaign: "Q1 Collections",
    status: "Open",
    createdAt: "2024-01-14T11:45:00",
    priority: "High",
    callDuration: "2:45",
    aircallId: "CALL-12348",
    direction: "outbound",
  },
  {
    id: "TKT-005",
    clientName: "Robert Wilson",
    phone: "+1 (555) 567-8901",
    type: "Onboarding",
    campaign: "Spring Campaign 2024",
    status: "In Progress",
    createdAt: "2024-01-13T16:30:00",
    assignedTo: "Agent Smith",
    priority: "Medium",
    callDuration: "6:10",
    aircallId: "CALL-12349",
  },
];

export const mockTickets = mockCalls;

export const mockCampaigns: Campaign[] = [
  {
    id: "CMP-001",
    name: "Spring Campaign 2024",
    callCount: 45,
    ticketCount: 45,
    status: "Active",
    startDate: "2024-01-01",
  },
  {
    id: "CMP-002",
    name: "Q1 Collections",
    callCount: 32,
    ticketCount: 32,
    status: "Active",
    startDate: "2024-01-01",
  },
  {
    id: "CMP-003",
    name: "New Customer Outreach",
    callCount: 28,
    ticketCount: 28,
    status: "Active",
    startDate: "2024-01-05",
  },
  {
    id: "CMP-004",
    name: "Holiday Follow-up",
    callCount: 15,
    ticketCount: 15,
    status: "Completed",
    startDate: "2023-12-01",
  },
];

export const mockUsers: User[] = [
  {
    id: "USR-001",
    name: "Agent Smith",
    email: "agent.smith@callcenter.com",
    role: "Agent",
    callsAssigned: 12,
    ticketsAssigned: 12,
    status: "Active",
  },
  {
    id: "USR-002",
    name: "Agent Davis",
    email: "agent.davis@callcenter.com",
    role: "Agent",
    callsAssigned: 8,
    ticketsAssigned: 8,
    status: "Active",
  },
  {
    id: "USR-003",
    name: "Supervisor Jones",
    email: "supervisor.jones@callcenter.com",
    role: "Supervisor",
    callsAssigned: 5,
    ticketsAssigned: 5,
    status: "Active",
  },
  {
    id: "USR-004",
    name: "Admin Taylor",
    email: "admin.taylor@callcenter.com",
    role: "Admin",
    callsAssigned: 0,
    ticketsAssigned: 0,
    status: "Active",
  },
];

export const getDashboardStats = () => {
  const totalCalls = 342;
  const callsCreated = mockCalls.length;
  const ticketsCreated = callsCreated;
  const onboardingCompleted = mockCalls.filter(
    (t) => t.type === "Onboarding" && t.status === "Closed",
  ).length;
  const arPayments = mockCalls.filter(
    (t) => t.type === "AR" && t.status === "Closed",
  ).length;
  const openCalls = mockCalls.filter((t) => t.status === "Open").length;
  const closedCalls = mockCalls.filter((t) => t.status === "Closed").length;

  return {
    totalCalls,
    callsCreated,
    ticketsCreated,
    onboardingCompleted,
    arPayments,
    openCalls,
    closedCalls,
    openTickets: openCalls,
    closedTickets: closedCalls,
  };
};

export const getCallsByCampaign = () => {
  const campaignData: Record<string, number> = {};
  mockCalls.forEach((call) => {
    campaignData[call.campaign] = (campaignData[call.campaign] || 0) + 1;
  });
  return Object.entries(campaignData).map(([name, count]) => ({ name, count }));
};

export const getTicketsByCampaign = getCallsByCampaign;

export const getCallsByType = () => {
  const typeData: Record<string, number> = {};
  mockCalls.forEach((call) => {
    typeData[call.type] = (typeData[call.type] || 0) + 1;
  });
  return Object.entries(typeData).map(([name, count]) => ({ name, count }));
};

export const getTicketsByType = getCallsByType;

export const getCallsPerDay = () => {
  return [
    { day: "Mon", calls: 45 },
    { day: "Tue", calls: 52 },
    { day: "Wed", calls: 48 },
    { day: "Thu", calls: 61 },
    { day: "Fri", calls: 55 },
    { day: "Sat", calls: 38 },
    { day: "Sun", calls: 43 },
  ];
};
