"use client";

import { useState } from "react";
import { formatDistanceToNow } from "date-fns";
import { AlertCircle, ChevronDown, Loader2, Pin, Plus, Save, StickyNote } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { fetchFromBackend } from "@/lib/api-client";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import type { Customer, CustomerNote } from "../types";

interface CustomerPinnedNotesProps {
  customer: Customer;
  canEditPinned: boolean;
  onCustomerChange: (customer: Customer) => void;
  onActivityChange?: () => void;
}

function formatNoteDate(value?: string) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return formatDistanceToNow(date, { addSuffix: true });
}

export function CustomerPinnedNotes({
  customer,
  canEditPinned,
  onCustomerChange,
  onActivityChange,
}: CustomerPinnedNotesProps) {
  const [editingPinned, setEditingPinned] = useState(false);
  const [pinnedDraft, setPinnedDraft] = useState(customer.pinnedNote ?? "");
  const [savingPinned, setSavingPinned] = useState(false);
  const [noteDraft, setNoteDraft] = useState("");
  const [addingNote, setAddingNote] = useState(false);
  const [notesOpen, setNotesOpen] = useState(false);

  const notes = customer.notes ?? [];
  const hasPinned = Boolean(customer.pinnedNote?.trim());

  const savePinnedNote = async () => {
    setSavingPinned(true);
    try {
      const updated = await fetchFromBackend(
        `/customers/${customer.id}/pinned-note`,
        {
          method: "PATCH",
          body: JSON.stringify({ pinnedNote: pinnedDraft.trim() }),
        },
      );
      const next = (updated as { data?: Customer })?.data ?? (updated as Customer);
      onCustomerChange({ ...customer, ...next });
      setEditingPinned(false);
      toast({ title: "Persistent note updated" });
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Failed to update persistent note";
      toast({ title: "Error", description: message, variant: "destructive" });
    } finally {
      setSavingPinned(false);
    }
  };

  const addNote = async () => {
    const content = noteDraft.trim();
    if (!content) return;
    setAddingNote(true);
    try {
      const created = await fetchFromBackend(`/customers/${customer.id}/notes`, {
        method: "POST",
        body: JSON.stringify({ content }),
      });
      const note = (created as { data?: CustomerNote })?.data ?? (created as CustomerNote);
      onCustomerChange({
        ...customer,
        notes: [note, ...(customer.notes ?? [])],
      });
      setNoteDraft("");
      setNotesOpen(true);
      onActivityChange?.();
      toast({ title: "Note added" });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to add note";
      toast({ title: "Error", description: message, variant: "destructive" });
    } finally {
      setAddingNote(false);
    }
  };

  return (
    <section className="rounded-xl border border-amber-200/80 bg-amber-50/70 shadow-sm dark:border-amber-900/40 dark:bg-amber-950/20">
      <div className="flex items-start gap-3 p-4">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-amber-200 bg-white text-amber-700 dark:border-amber-800 dark:bg-amber-950">
          <Pin className="h-4 w-4" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-2">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-amber-800 dark:text-amber-200">
                Client Number Notes
              </p>
              <p className="mt-0.5 text-[12px] font-medium text-amber-900/75 dark:text-amber-100/75">
                Persistent note for this phone number.
              </p>
            </div>
            {canEditPinned ? (
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-8 shrink-0 border-amber-200 bg-white text-amber-800 hover:bg-amber-100 dark:border-amber-800 dark:bg-amber-950"
                onClick={() => {
                  setPinnedDraft(customer.pinnedNote ?? "");
                  setEditingPinned((value) => !value);
                }}
              >
                {editingPinned ? "Cancel" : "Edit"}
              </Button>
            ) : null}
          </div>

          {editingPinned && canEditPinned ? (
            <div className="mt-3 flex flex-col gap-2">
              <Textarea
                value={pinnedDraft}
                onChange={(event) => setPinnedDraft(event.target.value)}
                rows={4}
                placeholder="Payment arrangement, callback preference, VIP, dispute in progress, special handling..."
                className="resize-none border-amber-200 bg-white text-sm focus-visible:ring-amber-300"
              />
              <div className="flex justify-end">
                <Button
                  type="button"
                  size="sm"
                  disabled={savingPinned}
                  onClick={savePinnedNote}
                  className="bg-[#008f68] text-white hover:bg-[#007a5a]"
                >
                  {savingPinned ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Save className="mr-2 h-4 w-4" />
                  )}
                  Save note
                </Button>
              </div>
            </div>
          ) : (
            <div
              className={cn(
                "mt-3 rounded-lg border px-3 py-3 text-[13px] leading-relaxed",
                hasPinned
                  ? "border-amber-200 bg-white text-amber-950 dark:border-amber-900 dark:bg-amber-950/60 dark:text-amber-50"
                  : "border-dashed border-amber-200 bg-white/70 text-amber-900/70 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-100/70",
              )}
            >
              {hasPinned ? (
                <p className="whitespace-pre-wrap">{customer.pinnedNote}</p>
              ) : (
                <div className="flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span>No persistent note for this number.</span>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="border-t border-amber-200/80 p-4 dark:border-amber-900/40">
        <div className="flex flex-col gap-2">
          <label
            htmlFor={`customer-${customer.id}-note`}
            className="flex items-center gap-1.5 text-[12px] font-semibold text-amber-950 dark:text-amber-100"
          >
            <StickyNote className="h-3.5 w-3.5" />
            Add note
          </label>
          <Textarea
            id={`customer-${customer.id}-note`}
            value={noteDraft}
            onChange={(event) => setNoteDraft(event.target.value)}
            rows={3}
            placeholder="Add an audit note for this customer..."
            className="resize-none border-amber-200 bg-white text-sm focus-visible:ring-amber-300 dark:border-amber-900 dark:bg-amber-950/50"
          />
          <div className="flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={() => setNotesOpen((value) => !value)}
              className="inline-flex items-center gap-1 text-[12px] font-semibold text-amber-800 hover:text-amber-950 dark:text-amber-200"
            >
              <ChevronDown
                className={cn(
                  "h-3.5 w-3.5 transition-transform",
                  notesOpen && "rotate-180",
                )}
              />
              Note history ({notes.length})
            </button>
            <Button
              type="button"
              size="sm"
              disabled={addingNote || !noteDraft.trim()}
              onClick={addNote}
              className="bg-[#008f68] text-white hover:bg-[#007a5a]"
            >
              {addingNote ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Plus className="mr-2 h-4 w-4" />
              )}
              Add note
            </Button>
          </div>
        </div>

        {notesOpen ? (
          <div className="mt-3 flex flex-col gap-2">
            {notes.length === 0 ? (
              <p className="rounded-lg border border-dashed border-amber-200 bg-white/70 px-3 py-3 text-center text-[13px] text-amber-900/70 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-100/70">
                No notes yet.
              </p>
            ) : (
              notes.map((note) => (
                <div
                  key={note.id}
                  className="rounded-lg border border-amber-200/70 bg-white px-3 py-3 text-[13px] shadow-sm dark:border-amber-900 dark:bg-amber-950/50"
                >
                  <p className="whitespace-pre-wrap leading-relaxed text-slate-800 dark:text-amber-50">
                    {note.content}
                  </p>
                  <p className="mt-2 text-[11px] font-medium text-slate-500 dark:text-amber-100/70">
                    {formatNoteDate(note.createdAt)}
                    {note.createdBy ? ` - ${note.createdBy}` : ""}
                  </p>
                </div>
              ))
            )}
          </div>
        ) : null}
      </div>
    </section>
  );
}
