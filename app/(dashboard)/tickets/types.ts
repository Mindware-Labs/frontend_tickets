export enum TicketDisposition {
  BOOKING = "BOOKING",
  GENERAL_INFO = "GENERAL_INFO",
  COMPLAINT = "COMPLAINT",
  SUPPORT = "SUPPORT",
  BILLING = "BILLING",
  TECHNICAL_ISSUE = "TECHNICAL_ISSUE",
  NEW_LEAD = "NEW_LEAD",
  SPAM = "SPAM",
}

export enum TicketStatus {
  OPEN = "OPEN",
  IN_PROGRESS = "IN_PROGRESS",
  CLOSED = "CLOSED",
}

export enum TicketPriority {
  LOW = "LOW",
  MEDIUM = "MEDIUM",
  HIGH = "HIGH",
  EMERGENCY = "EMERGENCY",
}

export enum ManagementType {
  ONBOARDING = "ONBOARDING",
  AR = "AR",
  OTHER = "OTHER",
}

export enum OnboardingOption {
  NOT_REGISTER = "NOT_REGISTERED",
  REGISTER = "REGISTERED",
  PAID_WITH_LL = "PAID_WITH_LL",
}

export enum ArOption {
  PAID = "PAID",
  NOT_PAID = "NOT_PAID",
  OFFLINE_PAYMENT = "OFFLINE_PAYMENT",
  NOT_PAID_CHECK = "NOT_PAID_CHECK",
  MOVED_OUT = "MOVED_OUT",
  CANCELED = "CANCELED",
  BALANCE_0 = "BALANCE_0",
  DO_NOT_CALL = "DO_NOT_CALL",
}

export enum CallDirection {
  INBOUND = "INBOUND",
  OUTBOUND = "OUTBOUND",
  MISSED = "MISSED",
  TEXT_MESSAGE = "TEXT_MESSAGE",
}

export interface CustomerOption {
  id: number;
  name: string;
  phone?: string;
}

export interface AgentOption {
  id: number;
  name: string;
  email?: string;
  isActive?: boolean;
}

export interface CampaignOption {
  id: number;
  nombre: string;
  tipo: ManagementType;
  isActive: boolean;
  yardaId?: number;
}

export interface YardOption {
  id: number;
  name: string;
  commonName: string;
  propertyAddress: string;
  contactInfo: string;
  yardLink?: string;
  notes?: string;
  yardType: string;
  isActive: boolean;
}

export interface CreateTicketFormData {
  customerId: string;
  customerPhone: string;
  yardId: string;
  campaignId: string;
  campaignOption: string;
  agentId: string;
  status: TicketStatus;
  priority: TicketPriority;
  direction: CallDirection;
  callDate: string;
  disposition: string;
  issueDetail: string;
  attachments: string[];
}
