import { NextRequest, NextResponse } from "next/server";
import { fetchFromBackendServer } from "@/lib/api-server";

export const dynamic = "force-dynamic";

function normalizeDirection(value: unknown): "SENT" | "RECEIVED" {
  const raw = String(value || "").toUpperCase();
  if (raw === "INBOUND" || raw === "RECEIVED") return "RECEIVED";
  return "SENT";
}

function normalizeNullableNumber(value: unknown): number | null {
  if (value === null || value === undefined || value === "") return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function normalizeMediaUrls(value: unknown): string[] | null {
  if (Array.isArray(value)) return value.filter(Boolean).map(String);
  if (typeof value === "string" && value.trim()) return [value.trim()];
  return null;
}

function normalizeRef(raw: any, fallbackId?: unknown) {
  if (!raw && fallbackId === undefined) return null;
  const source = raw && typeof raw === "object" ? raw : {};
  const id = normalizeNullableNumber(
    source.id ?? source.agentId ?? source.agent_id ?? fallbackId,
  );
  if (id === null) return null;
  const firstName = source.firstName ?? source.first_name ?? null;
  const lastName = source.lastName ?? source.last_name ?? null;
  const fullName = [firstName, lastName].filter(Boolean).join(" ").trim();
  const name = [
    source.name,
    source.nombre,
    source.fullName,
    source.full_name,
    fullName,
  ].find((value) => typeof value === "string" && value.trim());
  return {
    id,
    name: name || null,
    email: source.email ?? null,
    phone: source.phone ?? source.phoneNumber ?? null,
    number: source.number ?? source.phoneNumber ?? null,
    nombre: source.nombre ?? source.name ?? null,
  };
}

function normalizeAgent(raw: any) {
  return normalizeRef(
    raw?.agent ??
      raw?.assignedAgent ??
      raw?.assigned_agent ??
      raw?.assignedTo ??
      raw?.assigned_to ??
      raw?.user ??
      raw?.senderUser ??
      raw?.sender_user ??
      raw?.sentBy ??
      raw?.sent_by ??
      raw?.createdBy ??
      raw?.created_by ??
      raw?.owner,
    raw?.agentId ??
      raw?.agent_id ??
      raw?.agentID ??
      raw?.assignedAgentId ??
      raw?.assigned_agent_id ??
      raw?.assigneeId ??
      raw?.assignee_id ??
      raw?.assignedToId ??
      raw?.assigned_to_id ??
      raw?.userId ??
      raw?.user_id ??
      raw?.userID ??
      raw?.senderUserId ??
      raw?.sender_user_id ??
      raw?.sentById ??
      raw?.sent_by_id ??
      raw?.sent_by_agent_id ??
      raw?.createdById ??
      raw?.created_by_id ??
      raw?.created_by_agent_id ??
      raw?.ownerId ??
      raw?.owner_id,
  );
}

function normalizeSmsMessage(raw: any) {
  const id = normalizeNullableNumber(
    raw?.id ?? raw?.smsMessageId ?? raw?.messageId ?? raw?.aircallMessageId,
  );
  const createdAt =
    raw?.createdAt ??
    raw?.created_at ??
    raw?.sentAt ??
    raw?.receivedAt ??
    raw?.timestamp ??
    new Date().toISOString();

  return {
    id: id ?? Math.abs(String(raw?.aircallMessageId ?? createdAt).split("").reduce((acc, char) => acc + char.charCodeAt(0), 0)),
    aircallMessageId: raw?.aircallMessageId ?? raw?.aircall_message_id ?? raw?.messageId ?? null,
    aircallConversationId:
      raw?.aircallConversationId ?? raw?.aircall_conversation_id ?? raw?.conversationId ?? null,
    direction: normalizeDirection(raw?.direction ?? raw?.type),
    status: raw?.status ?? raw?.deliveryStatus ?? null,
    body: raw?.body ?? raw?.text ?? raw?.message ?? raw?.content ?? null,
    fromNumber: raw?.fromNumber ?? raw?.from ?? raw?.sender ?? null,
    toNumber: raw?.toNumber ?? raw?.to ?? raw?.recipient ?? null,
    externalNumber: raw?.externalNumber ?? raw?.external_number ?? raw?.customerPhone ?? null,
    mediaUrls: normalizeMediaUrls(raw?.mediaUrls ?? raw?.media_urls ?? raw?.attachments),
    customer: normalizeRef(raw?.customer, raw?.customerId),
    agent: normalizeAgent(raw),
    phoneLine: normalizeRef(raw?.phoneLine ?? raw?.line, raw?.phoneLineId),
    campaign: normalizeRef(raw?.campaign, raw?.campaignId),
    sentAt: raw?.sentAt ?? raw?.sent_at ?? null,
    receivedAt: raw?.receivedAt ?? raw?.received_at ?? null,
    statusUpdatedAt: raw?.statusUpdatedAt ?? raw?.status_updated_at ?? null,
    createdAt,
    updatedAt: raw?.updatedAt ?? raw?.updated_at ?? null,
  };
}

function normalizeSmsList(data: any, request: NextRequest) {
  const rows = Array.isArray(data)
    ? data
    : Array.isArray(data?.data)
      ? data.data
      : Array.isArray(data?.messages)
        ? data.messages
        : Array.isArray(data?.items)
          ? data.items
          : Array.isArray(data?.data?.data)
            ? data.data.data
            : [];

  const searchParams = request.nextUrl.searchParams;
  const page = Number(data?.page ?? data?.data?.page ?? searchParams.get("page") ?? 1);
  const limit = Number(
    data?.limit ?? data?.data?.limit ?? searchParams.get("limit") ?? Math.max(1, rows.length),
  );
  const total = Number(data?.total ?? data?.data?.total ?? rows.length);
  const totalPages = Number(
    data?.totalPages ?? data?.data?.totalPages ?? Math.max(1, Math.ceil(total / Math.max(1, limit))),
  );

  return {
    period:
      data?.period ??
      data?.data?.period ?? {
        label: searchParams.get("period") || "custom",
        start: searchParams.get("start") || "",
        end: searchParams.get("end") || "",
      },
    data: rows.map(normalizeSmsMessage),
    total,
    page: Number.isFinite(page) && page > 0 ? page : 1,
    limit: Number.isFinite(limit) && limit > 0 ? limit : Math.max(1, rows.length),
    totalPages: Number.isFinite(totalPages) && totalPages > 0 ? totalPages : 1,
  };
}

export async function GET(request: NextRequest) {
  try {
    const query = request.nextUrl.searchParams.toString();
    const endpoint = query
      ? `/aircall-analytics/sms?${query}`
      : "/aircall-analytics/sms";
    const upstream = await fetchFromBackendServer(request, endpoint);
    const data = upstream?.success && upstream?.data ? upstream.data : upstream;
    return NextResponse.json({ success: true, data: normalizeSmsList(data, request) });
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        message: error.message || "Failed to fetch SMS analytics",
      },
      { status: error.status || 500 },
    );
  }
}
