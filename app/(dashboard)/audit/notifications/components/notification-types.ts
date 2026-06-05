export type NotificationType =
  | "CALLBACK_OVERDUE"
  | "TICKET_FOLLOWUP_OVERDUE"
  | "SCHEDULED_CALL_DUE";

export type NotificationTab = "all" | "unread" | "overdue";

export interface AuditAgent {
  id: number;
  name?: string;
  role?: string;
  email?: string;
}

export interface AuditEntry {
  id: number;
  type: NotificationType;
  message: string;
  agentId: number | null;
  agent: AuditAgent | null;
  callId: number | null;
  ticketId: number | null;
  scheduleCallId?: number | null;
  read: boolean;
  createdAt: string;
  readAt?: string | null;
  deliveredVia?: "websocket" | "poll" | "push";
}

export interface NotificationFiltersState {
  type: NotificationType | "";
  agentId: string;
  read: string;
  from: string;
  to: string;
  search: string;
}

export interface NotificationStats {
  total: number;
  unread: number;
  overdue: number;
  read: number;
  broadcast: number;
  calls: number;
  tickets: number;
  schedules: number;
  today: number;
  avgReadMinutes: number | null;
}

