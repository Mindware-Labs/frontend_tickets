export enum CallDisposition {
  RESOLVED = "RESOLVED",
  CALLBACK_REQUIRED = "CALLBACK_REQUIRED",
  CALLBACK_SCHEDULED = "CALLBACK_SCHEDULED",
  VOICEMAIL_LEFT = "VOICEMAIL_LEFT",
  NO_ANSWER = "NO_ANSWER",
  PROMISE_TO_PAY = "PROMISE_TO_PAY",
  DISPUTE = "DISPUTE",
  WRONG_NUMBER = "WRONG_NUMBER",
  ENROLLED = "ENROLLED",
  ESCALATED = "ESCALATED",
}

export enum CallStatus {
  ACTIVE = "ACTIVE",
  COMPLETED = "COMPLETED",
  PENDING_FOLLOWUP = "PENDING_FOLLOWUP",
  OVERDUE = "OVERDUE",
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
  CANCELED = "CANCELED",
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
  VOICEMAIL = "VOICEMAIL",
}

export enum CampaignOptionEnum {
  // Onboarding options
  NOT_REGISTER = "NOT_REGISTERED",
  REGISTER = "REGISTERED",
  PAID_WITH_LL = "PAID_WITH_LL",
  CANCELED = "CANCELED",
  // AR options
  PAID = "PAID",
  NOT_PAID = "NOT_PAID",
  OFFLINE_PAYMENT = "OFFLINE_PAYMENT",
  NOT_PAID_CHECK = "NOT_PAID_CHECK",
  MOVED_OUT = "MOVED_OUT",
  BALANCE_0 = "BALANCE_0",
  DO_NOT_CALL = "DO_NOT_CALL",
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

export interface CallRecord {
  id: number;
  aircallId?: string | null;
  direction?: CallDirection | string | null;
  originalDirection?: CallDirection | string | null;
  customerId?: number | null;
  customerPhone?: string | null;
  phoneLineId?: number | null;
  phoneLine?: {
    id: number;
    label: string | null;
    phoneNumber: string;
  } | null;
  agentId?: number | null;
  agent?: AgentOption | null;
  duration?: number | null;
  startedAt?: string | null;
  answeredAt?: string | null;
  endedAt?: string | null;
  recordingUrl?: string | null;
  voicemailUrl?: string | null;
  missedCallReason?: string | null;
  disposition?: CallDisposition | string | null;
  notes?: string | null;
  followUpDueDate?: string | null;
  followUpAssignedToId?: number | null;
  followUpAssignedTo?: AgentOption | null;
  yardId?: number | null;
  yard?: YardOption | null;
  campaignId?: number | null;
  campaign?: CampaignOption | null;
  campaignOption?: string | null;
  status?: CallStatus | string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateCallFormData {
  customerId: string;
  customerPhone: string;
  yardId: string;
  campaignId: string;
  campaignOption: string;
  agentId: string;
  status: CallStatus;
  direction: CallDirection;
  originalDirection: CallDirection | "";
  aircallId: string;
  phoneLineId: string;
  duration: string;
  startedAt: string;
  answeredAt: string;
  endedAt: string;
  recordingUrl: string;
  voicemailUrl: string;
  missedCallReason: string;
  notes: string;
  followUpDueDate: string;
  followUpAssignedToId: string;
  disposition: string;
}

export type CreateTicketFormData = CreateCallFormData;
export type UpdateCallFormData = Partial<CreateCallFormData>;
export type UpdateTicketFormData = UpdateCallFormData;

// Extend the Call type with fields used across the calls feature
declare module "@/lib/mock-data" {
  interface Call {
    aircallId?: string;
    direction?: "inbound" | "outbound" | "missed";
    originalDirection?: "inbound" | "outbound" | "voicemail";
    customerId?: number | string;
    customer?: {
      name: string;
      phone?: string;
      email?: string;
      id?: number;
      note?: string;
      notes?: { id: number; content: string; createdAt: string }[];
    };
    customerPhone?: string;
    phoneLineId?: number | string;
    phoneLine?: {
      id: number;
      label: string | null;
      phoneNumber: string;
    } | null;
    agentId?: number | string;
    duration?: number | null;
    startedAt?: string;
    answeredAt?: string;
    endedAt?: string;
    recordingUrl?: string;
    voicemailUrl?: string;
    missedCallReason?: string;
    disposition?: string;
    notes?: string;
    followUpDueDate?: string;
    followUpAssignedToId?: number | string;
    followUpAssignedTo?: AgentOption | null;
    yardId?: number | string;
    yardType?: string;
    campaignId?: number | string;
    campaignOption?: string;
    onboardingOption?: string;
    attachments?: string[];
    updatedAt?: string;
    callDate?: string;
    issueDetail?: string;
  }
}

export const TicketDisposition = CallDisposition;
export const TicketStatus = CallStatus;
