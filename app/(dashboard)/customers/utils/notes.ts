import { fetchFromBackend } from "@/lib/api-client";
import type { CustomerNote } from "../types";

export function normalizeCustomerNotes(payload: unknown): CustomerNote[] {
  if (Array.isArray(payload)) {
    return payload.map(normalizeCustomerNote);
  }
  const wrapped = payload as { data?: unknown; success?: boolean };
  if (Array.isArray(wrapped?.data)) {
    return wrapped.data.map(normalizeCustomerNote);
  }
  return [];
}

export function normalizeCustomerNote(note: unknown): CustomerNote {
  const raw = note as CustomerNote;
  const id = Number(raw.id);
  return {
    id: Number.isFinite(id) ? id : 0,
    content: raw.content ?? "",
    createdBy: raw.createdBy,
    createdAt:
      typeof raw.createdAt === "string"
        ? raw.createdAt
        : raw.createdAt
          ? new Date(raw.createdAt as string).toISOString()
          : new Date().toISOString(),
  };
}

export async function fetchCustomerNotes(customerId: number) {
  const data = await fetchFromBackend(`/customers/${customerId}/notes`);
  return normalizeCustomerNotes(data);
}
