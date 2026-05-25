export type SmsDirection = "SENT" | "RECEIVED";

export interface SmsAgentRef {
  id: number;
  name?: string | null;
  email?: string | null;
}

export interface SmsCustomerRef {
  id: number;
  name?: string | null;
  phone?: string | null;
}

export interface SmsPhoneLineRef {
  id: number;
  name?: string | null;
  number?: string | null;
}

export interface SmsCampaignRef {
  id: number;
  nombre?: string | null;
}

export interface SmsMessageRecord {
  id: number;
  aircallMessageId?: string | null;
  aircallConversationId?: string | null;
  direction: SmsDirection;
  status?: string | null;
  body?: string | null;
  fromNumber?: string | null;
  toNumber?: string | null;
  externalNumber?: string | null;
  mediaUrls?: string[] | null;
  customer?: SmsCustomerRef | null;
  agent?: SmsAgentRef | null;
  phoneLine?: SmsPhoneLineRef | null;
  campaign?: SmsCampaignRef | null;
  sentAt?: string | null;
  receivedAt?: string | null;
  statusUpdatedAt?: string | null;
  createdAt: string;
  updatedAt?: string | null;
}

export interface SmsListResponse {
  period: { label: string; start: string; end: string };
  data: SmsMessageRecord[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface SmsSummaryResponse {
  period: { label: string; start: string; end: string };
  totals: {
    sent: number;
    received: number;
    delivered: number;
    failed: number;
    total: number;
    replyRate: number;
    deliveryRate: number;
  };
  byDay: Array<{
    day: string;
    sent: number;
    received: number;
    delivered: number;
    failed: number;
    replyRate: number;
  }>;
  byLine: unknown;
  byStatus: unknown;
}

export type SmsPeriodKey = "1d" | "7d" | "30d" | "90d" | "custom";

export type SmsDirectionFilter = "all" | "SENT" | "RECEIVED";

export type SmsStatusBucket =
  | "delivered"
  | "sent"
  | "queued"
  | "failed"
  | "received";

export type SmsStatusFilter = "all" | SmsStatusBucket;

/**
 * One conversation aggregates every SMS exchanged with the same external
 * number / customer, sorted ascending by time so the chat pane can render
 * them top-to-bottom like a normal messenger.
 */
export interface SmsConversation {
  key: string;
  displayName: string;
  customer: SmsCustomerRef | null;
  externalNumber: string | null;
  phoneLine: SmsPhoneLineRef | null;
  campaigns: SmsCampaignRef[];
  agents: SmsAgentRef[];
  messages: SmsMessageRecord[];
  /** Most recent message timestamp (epoch ms). */
  lastTimestamp: number;
  lastMessage: SmsMessageRecord;
  totalCount: number;
  inboundCount: number;
  outboundCount: number;
  failedCount: number;
}
