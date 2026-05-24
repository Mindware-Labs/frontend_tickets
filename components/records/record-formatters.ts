import type { UnifiedRecord, UnifiedRecordLinkedTicket } from "./types";

export const formatLabel = (value?: string | null) =>
  (value || "Unspecified")
    .toLowerCase()
    .replace(/_/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());

export const formatDate = (value?: string | null) => {
  if (!value) return "-";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "-";
  return parsed.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

export const customerLabel = (record: UnifiedRecord) =>
  record.customer?.name ||
  record.customerPhone ||
  record.customer?.phone ||
  (record.customerId ? `Customer #${record.customerId}` : "Unknown");

export const phoneLabel = (record: UnifiedRecord) =>
  record.customer?.phone || record.customerPhone || "-";

export const agentLabel = (record: UnifiedRecord) =>
  record.agent?.name ||
  (record.recordType === "manual_record" ? "Manual" : "Unassigned");

export const recordDate = (record: UnifiedRecord) =>
  record.occurredAt || record.updatedAt || null;

export const detailText = (record: UnifiedRecord) =>
  record.issueDetail?.trim() || record.notes?.trim() || "";

export const recordPrimaryLabel = (record: UnifiedRecord) => {
  if (record.recordType === "call") return `Call #${record.sourceId}`;
  if (record.recordType === "ticket") return `Ticket #${record.sourceId}`;
  return `Manual #${record.sourceId}`;
};

export const linkedTicketLabel = (ticket: UnifiedRecordLinkedTicket) =>
  `Ticket #${ticket.id}`;
