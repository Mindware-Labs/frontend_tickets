import { format } from "date-fns";
import { fetchFromBackend } from "@/lib/api-client";
import type { Customer, CustomerNote } from "../types";

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

function toIsoString(value: unknown): string | undefined {
  if (!value) return undefined;
  if (typeof value === "string") {
    const d = new Date(value);
    return Number.isNaN(d.getTime()) ? undefined : d.toISOString();
  }
  const d = new Date(value as string);
  return Number.isNaN(d.getTime()) ? undefined : d.toISOString();
}

export function normalizeCustomerNote(note: unknown): CustomerNote {
  const raw = note as CustomerNote;
  const id = Number(raw.id);
  const createdAt = toIsoString(raw.createdAt) ?? new Date().toISOString();
  return {
    id: Number.isFinite(id) ? id : 0,
    content: raw.content ?? "",
    createdBy: raw.createdBy,
    updatedBy: raw.updatedBy,
    createdAt,
    updatedAt: toIsoString(raw.updatedAt),
    isPinned: Boolean(raw.isPinned),
  };
}

/** Hour and minute when the note was placed (or last edited). */
export function formatNoteDateTime(value?: string): string {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return format(date, "MMM d, yyyy · HH:mm");
}

/** Author + placed/edited timestamp for pinned and audit notes. */
export function formatNoteMeta(note: CustomerNote | null | undefined): string | null {
  if (!note) return null;

  const placedAt = formatNoteDateTime(note.createdAt);
  const editedAt =
    note.updatedAt && note.updatedAt !== note.createdAt
      ? formatNoteDateTime(note.updatedAt)
      : "";

  if (note.isPinned) {
    const author = note.createdBy;
    const editor = note.updatedBy;
    if (editor && editedAt && editor !== author) {
      return `${editor} · edited ${editedAt}`;
    }
    if (author && placedAt) {
      return `${author} · ${placedAt}`;
    }
    return author || placedAt || null;
  }

  const who = note.createdBy;
  if (who && placedAt) return `${who} · ${placedAt}`;
  return who || placedAt || null;
}

export function splitCustomerNotes(notes: CustomerNote[]) {
  const pinned = notes.find((n) => n.isPinned) ?? null;
  const audit = notes.filter((n) => !n.isPinned);
  return { pinned, audit };
}

export function mergeCustomerNotes(
  customer: Customer,
  notes: CustomerNote[],
): Customer {
  const { pinned } = splitCustomerNotes(notes);
  return {
    ...customer,
    notes,
    pinnedNote: pinned?.content?.trim() || customer.pinnedNote,
  };
}

export async function fetchCustomerNotes(customerId: number) {
  const data = await fetchFromBackend(`/customers/${customerId}/notes`);
  return normalizeCustomerNotes(data);
}

export async function savePinnedCustomerNote(
  customerId: number,
  content: string,
  existingPinned?: CustomerNote | null,
) {
  const trimmed = content.trim();

  if (existingPinned?.id) {
    if (!trimmed) {
      await fetchFromBackend(`/customers/${customerId}/notes/${existingPinned.id}`, {
        method: "DELETE",
      });
      return fetchCustomerNotes(customerId);
    }
    await fetchFromBackend(`/customers/${customerId}/notes/${existingPinned.id}`, {
      method: "PATCH",
      body: JSON.stringify({ content: trimmed }),
    });
    return fetchCustomerNotes(customerId);
  }

  if (!trimmed) {
    return fetchCustomerNotes(customerId);
  }

  await fetchFromBackend(`/customers/${customerId}/pinned-note`, {
    method: "PATCH",
    body: JSON.stringify({ content: trimmed }),
  });
  return fetchCustomerNotes(customerId);
}
