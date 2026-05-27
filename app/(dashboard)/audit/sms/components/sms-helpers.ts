import {
  type SmsAgentRef,
  type SmsConversation,
  type SmsDirection,
  type SmsDirectionFilter,
  type SmsMessageRecord,
  type SmsStatusBucket,
  type SmsStatusFilter,
} from "./sms-types";

// ────────────────────────────────────────────────────────────────────────
// Status classification — mirrors the backend's `isDeliveredSmsStatus` /
// `isFailedSmsStatus` helpers so the UI buckets stay in sync.
// ────────────────────────────────────────────────────────────────────────
export function classifySmsStatus(message: SmsMessageRecord): SmsStatusBucket {
  if (message.direction === "RECEIVED") return "received";
  const raw = (message.status || "").toLowerCase();
  if (["delivered"].includes(raw)) return "delivered";
  if (["failed", "undelivered", "error", "rejected"].includes(raw))
    return "failed";
  if (["queued", "sending", "accepted", "pending"].includes(raw))
    return "queued";
  // sent, submitted, or unknown outbound state → "sent"
  return "sent";
}

export function statusBucketLabel(bucket: SmsStatusBucket): string {
  switch (bucket) {
    case "delivered":
      return "Delivered";
    case "sent":
      return "Sent";
    case "queued":
      return "Queued";
    case "failed":
      return "Failed";
    case "received":
      return "Received";
  }
}

export interface SmsStatusTone {
  /** Bubble background tint. */
  bubble: string;
  /** Bubble foreground colour. */
  bubbleText: string;
  /** Status chip colours (used both inside the bubble and on the list). */
  chip: string;
  chipDot: string;
  chipText: string;
}

export function smsStatusTone(bucket: SmsStatusBucket): SmsStatusTone {
  switch (bucket) {
    case "delivered":
      return {
        bubble:
          "bg-[#008f68] text-white dark:bg-emerald-500/90 dark:text-emerald-50",
        bubbleText: "text-white",
        chip: "border-[#008f68]/25 bg-[#f0faf5] text-[#006b4f] dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-300",
        chipDot: "bg-[#008f68] dark:bg-emerald-400",
        chipText: "text-[#006b4f] dark:text-emerald-300",
      };
    case "sent":
      return {
        bubble:
          "bg-[#008f68]/85 text-white dark:bg-emerald-500/70 dark:text-emerald-50",
        bubbleText: "text-white",
        chip: "border-sky-300/40 bg-sky-50 text-sky-700 dark:border-sky-500/30 dark:bg-sky-500/10 dark:text-sky-300",
        chipDot: "bg-sky-500",
        chipText: "text-sky-700 dark:text-sky-300",
      };
    case "queued":
      return {
        bubble:
          "bg-amber-100 text-amber-900 dark:bg-amber-500/15 dark:text-amber-100",
        bubbleText: "text-amber-900 dark:text-amber-100",
        chip: "border-amber-300/40 bg-amber-50 text-amber-700 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-300",
        chipDot: "bg-amber-500",
        chipText: "text-amber-700 dark:text-amber-300",
      };
    case "failed":
      return {
        bubble:
          "bg-rose-50 text-rose-700 ring-1 ring-rose-200 dark:bg-rose-500/10 dark:text-rose-300 dark:ring-rose-500/30",
        bubbleText: "text-rose-700 dark:text-rose-300",
        chip: "border-rose-300/40 bg-rose-50 text-rose-700 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-300",
        chipDot: "bg-rose-500",
        chipText: "text-rose-700 dark:text-rose-300",
      };
    case "received":
      return {
        bubble:
          "bg-white text-slate-900 ring-1 ring-slate-200 dark:bg-slate-900 dark:text-slate-100 dark:ring-slate-800",
        bubbleText: "text-slate-900 dark:text-slate-100",
        chip: "border-slate-200 bg-slate-50 text-slate-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300",
        chipDot: "bg-slate-400",
        chipText: "text-slate-600 dark:text-slate-300",
      };
  }
}

// ────────────────────────────────────────────────────────────────────────
// Conversation grouping
// ────────────────────────────────────────────────────────────────────────
function externalForMessage(message: SmsMessageRecord): string | null {
  if (message.externalNumber) return message.externalNumber;
  return message.direction === "SENT"
    ? message.toNumber || null
    : message.fromNumber || null;
}

function conversationKey(message: SmsMessageRecord): string {
  if (message.aircallConversationId) {
    return `convo:${message.aircallConversationId}`;
  }
  if (message.customer?.id != null) {
    return `customer:${message.customer.id}`;
  }
  const ext = externalForMessage(message);
  if (ext) return `external:${ext}`;
  return `unknown:${message.id}`;
}

function messageTimestamp(message: SmsMessageRecord): number {
  const candidate =
    (message.direction === "RECEIVED"
      ? message.receivedAt
      : message.sentAt) ||
    message.sentAt ||
    message.receivedAt ||
    message.createdAt;
  const parsed = candidate ? new Date(candidate).getTime() : NaN;
  return Number.isFinite(parsed) ? parsed : 0;
}

export function buildSmsConversations(
  messages: SmsMessageRecord[],
): SmsConversation[] {
  const map = new Map<string, SmsConversation>();

  for (const message of messages) {
    const key = conversationKey(message);
    const ts = messageTimestamp(message);
    let convo = map.get(key);

    if (!convo) {
      const ext = externalForMessage(message);
      const customer = message.customer ?? null;
      const displayName =
        customer?.name?.trim() ||
        customer?.phone ||
        ext ||
        (message.direction === "SENT"
          ? message.toNumber
          : message.fromNumber) ||
        "Unknown";

      convo = {
        key,
        displayName: displayName || "Unknown",
        customer,
        externalNumber: ext,
        phoneLine: message.phoneLine ?? null,
        campaigns: [],
        agents: [],
        messages: [],
        lastTimestamp: ts,
        lastMessage: message,
        totalCount: 0,
        inboundCount: 0,
        outboundCount: 0,
        failedCount: 0,
      };
      map.set(key, convo);
    }

    convo.messages.push(message);
    convo.totalCount += 1;
    if (message.direction === "RECEIVED") convo.inboundCount += 1;
    else convo.outboundCount += 1;
    if (classifySmsStatus(message) === "failed") convo.failedCount += 1;

    if (message.campaign && !convo.campaigns.find((c) => c.id === message.campaign?.id)) {
      convo.campaigns.push(message.campaign);
    }
    if (message.agent && !convo.agents.find((a) => a.id === message.agent?.id)) {
      convo.agents.push(message.agent);
    }
    if (!convo.phoneLine && message.phoneLine) {
      convo.phoneLine = message.phoneLine;
    }

    if (ts > convo.lastTimestamp) {
      convo.lastTimestamp = ts;
      convo.lastMessage = message;
    }
  }

  // Sort messages within each conversation chronologically (oldest → newest).
  for (const convo of map.values()) {
    convo.messages.sort(
      (a, b) => messageTimestamp(a) - messageTimestamp(b),
    );
  }

  // Sort conversations by latest activity descending.
  return Array.from(map.values()).sort(
    (a, b) => b.lastTimestamp - a.lastTimestamp,
  );
}

// ────────────────────────────────────────────────────────────────────────
// Filtering
// ────────────────────────────────────────────────────────────────────────
export function applySmsFilters(
  messages: SmsMessageRecord[],
  filters: {
    direction: SmsDirectionFilter;
    status: SmsStatusFilter;
    search: string;
  },
): SmsMessageRecord[] {
  const search = filters.search.trim().toLowerCase();
  return messages.filter((message) => {
    if (filters.direction !== "all" && message.direction !== filters.direction)
      return false;

    if (filters.status !== "all") {
      const bucket = classifySmsStatus(message);
      if (bucket !== filters.status) return false;
    }

    if (!search) return true;
    const haystack = [
      message.body,
      message.customer?.name,
      message.customer?.phone,
      message.externalNumber,
      message.fromNumber,
      message.toNumber,
      message.agent?.name,
      message.campaign?.nombre,
      message.phoneLine?.name,
      message.phoneLine?.number,
    ]
      .filter(Boolean)
      .map((s) => String(s).toLowerCase())
      .join(" \u0001 ");
    return haystack.includes(search);
  });
}

// ────────────────────────────────────────────────────────────────────────
// Formatting helpers
// ────────────────────────────────────────────────────────────────────────
export function formatPhone(value?: string | null): string {
  if (!value) return "Unknown";
  const trimmed = value.trim();
  // Light-touch US 10/11 digit pretty print; otherwise return as-is.
  const digits = trimmed.replace(/\D/g, "");
  if (digits.length === 11 && digits.startsWith("1")) {
    return `+1 (${digits.slice(1, 4)}) ${digits.slice(4, 7)}-${digits.slice(7)}`;
  }
  if (digits.length === 10) {
    return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
  }
  return trimmed;
}

export function getMessageDate(message: SmsMessageRecord): Date {
  const ts = messageTimestamp(message);
  return new Date(ts || message.createdAt);
}

export function dayKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function dayLabel(date: Date): string {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);
  const target = new Date(date);
  target.setHours(0, 0, 0, 0);

  if (target.getTime() === today.getTime()) return "Today";
  if (target.getTime() === yesterday.getTime()) return "Yesterday";
  return target.toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
    year:
      target.getFullYear() === today.getFullYear() ? undefined : "numeric",
  });
}

export function formatTimeShort(date: Date): string {
  return date.toLocaleTimeString(undefined, {
    hour: "numeric",
    minute: "2-digit",
  });
}

export function formatRelativeShort(date: Date, now = Date.now()): string {
  const diffMs = now - date.getTime();
  if (diffMs < 60_000) return "Just now";
  const minutes = Math.floor(diffMs / 60_000);
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d`;
  return date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

export function getInitials(name: string): string {
  return (
    name
      .split(/\s+/)
      .filter(Boolean)
      .map((part) => part[0])
      .join("")
      .toUpperCase()
      .slice(0, 2) || "?"
  );
}

export function avatarHueFromString(value: string): number {
  let hash = 0;
  for (let i = 0; i < value.length; i++) {
    hash = (hash * 31 + value.charCodeAt(i)) | 0;
  }
  return Math.abs(hash) % 360;
}

export function directionLabel(direction: SmsDirection): string {
  return direction === "SENT" ? "Outbound" : "Inbound";
}

export function agentDisplayName(agent?: SmsAgentRef | null): string {
  return (
    agent?.name?.trim() ||
    agent?.email?.trim() ||
    (agent?.id != null ? `Agent #${agent.id}` : "Without agent")
  );
}

export function conversationAgentLabel(conversation: SmsConversation): string {
  const primaryAgent =
    [...conversation.messages]
      .reverse()
      .find((message) => message.direction === "SENT" && message.agent)?.agent ??
    conversation.lastMessage.agent ??
    conversation.agents[0];

  if (!primaryAgent) return "Without agent";
  if (conversation.agents.length <= 1) return agentDisplayName(primaryAgent);
  return `${agentDisplayName(primaryAgent)} +${conversation.agents.length - 1}`;
}

export function conversationAgentNames(conversation: SmsConversation): string[] {
  if (conversation.agents.length === 0) return ["Without agent"];

  const seen = new Set<number | string>();
  return conversation.messages
    .filter((message) => message.direction === "SENT" && message.agent)
    .map((message) => message.agent!)
    .concat(conversation.agents)
    .filter((agent) => {
      const key = agent.id ?? agent.email ?? agent.name;
      if (key == null || seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .map(agentDisplayName);
}

export function conversationHasAgent(
  conversation: SmsConversation,
  agentFilter: string,
): boolean {
  if (agentFilter === "all") return true;
  if (agentFilter === "unassigned") return conversation.agents.length === 0;
  return conversation.agents.some((agent) => String(agent.id) === agentFilter);
}
