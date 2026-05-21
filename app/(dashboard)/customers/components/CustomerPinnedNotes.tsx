"use client";

import { useCallback, useEffect, useState } from "react";
import {
  AlertCircle,
  Loader2,
  Pin,
  Pencil,
  Save,
  StickyNote,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { fetchFromBackend } from "@/lib/api-client";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import type { Customer } from "../types";
import { fetchCustomerNotes } from "../utils/notes";
import { CustomerNotesList } from "./CustomerNotesList";

interface CustomerPinnedNotesProps {
  customer: Customer;
  canEditPinned: boolean;
  canManageNotes?: boolean;
  onCustomerChange: (customer: Customer) => void;
  onNotesMutated?: () => void;
}

export function CustomerPinnedNotes({
  customer,
  canEditPinned,
  canManageNotes = canEditPinned,
  onCustomerChange,
  onNotesMutated,
}: CustomerPinnedNotesProps) {
  const [editingPinned, setEditingPinned] = useState(false);
  const [pinnedDraft, setPinnedDraft] = useState(customer.pinnedNote ?? "");
  const [savingPinned, setSavingPinned] = useState(false);
  const [notes, setNotes] = useState(customer.notes ?? []);
  const [notesLoading, setNotesLoading] = useState(false);

  const hasPinned = Boolean(customer.pinnedNote?.trim());

  const loadNotes = useCallback(async () => {
    setNotesLoading(true);
    try {
      const fetched = await fetchCustomerNotes(customer.id);
      setNotes(fetched);
    } catch {
      setNotes(customer.notes ?? []);
    } finally {
      setNotesLoading(false);
    }
  }, [customer.id]);

  useEffect(() => {
    if (!editingPinned) {
      setPinnedDraft(customer.pinnedNote ?? "");
    }
  }, [customer.pinnedNote, editingPinned]);

  useEffect(() => {
    setNotes(customer.notes ?? []);
  }, [customer.notes]);

  useEffect(() => {
    loadNotes();
  }, [loadNotes]);

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
      onCustomerChange({ ...customer, ...next, notes });
      setEditingPinned(false);
      onNotesMutated?.();
      toast({ title: "Persistent note updated" });
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Failed to update persistent note";
      toast({ title: "Error", description: message, variant: "destructive" });
    } finally {
      setSavingPinned(false);
    }
  };

  const cancelPinnedEdit = () => {
    setPinnedDraft(customer.pinnedNote ?? "");
    setEditingPinned(false);
  };

  const handleNotesChange = (nextNotes: typeof notes) => {
    setNotes(nextNotes);
    onCustomerChange({ ...customer, notes: nextNotes });
  };

  return (
    <section className="overflow-hidden rounded-2xl border border-[#008f68]/20 bg-white shadow-[0_8px_28px_rgba(0,143,104,0.08)] ring-1 ring-[#008f68]/10 dark:border-emerald-500/25 dark:bg-slate-950 dark:ring-emerald-500/15">
      <div className="border-b border-[#008f68]/10 bg-gradient-to-r from-[#f0faf5] via-white to-amber-50/40 px-4 py-3.5 sm:px-5 dark:from-emerald-950/40 dark:via-slate-950 dark:to-amber-950/20">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#008f68] text-white shadow-md">
            <Pin className="h-4 w-4" strokeWidth={2.25} />
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="text-[14px] font-bold text-slate-950 dark:text-white">
              Client Number Notes
            </h3>
            <p className="mt-0.5 text-[12px] text-slate-600 dark:text-slate-400">
              Persistent note for this phone · audit trail below & in timeline
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-4 p-4 sm:p-5">
        <div>
          <div className="mb-2 flex items-center justify-between gap-2">
            <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-amber-800/90 dark:text-amber-300">
              Persistent note
            </p>
            {canEditPinned && !editingPinned ? (
              <button
                type="button"
                onClick={() => {
                  setPinnedDraft(customer.pinnedNote ?? "");
                  setEditingPinned(true);
                }}
                className="inline-flex items-center gap-1 rounded-full border border-amber-200/80 bg-amber-50 px-2.5 py-1 text-[11px] font-semibold text-amber-900 transition-colors hover:bg-amber-100 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-100"
              >
                <Pencil className="h-3 w-3" />
                Edit
              </button>
            ) : null}
          </div>

          {editingPinned && canEditPinned ? (
            <div className="space-y-2 rounded-xl border border-amber-200/70 bg-amber-50/30 p-3 dark:border-amber-900/50 dark:bg-amber-950/25">
              <Textarea
                value={pinnedDraft}
                onChange={(e) => setPinnedDraft(e.target.value)}
                rows={4}
                placeholder="Payment arrangement, VIP, callback preference, dispute…"
                className="resize-none border-amber-200/80 bg-white text-sm focus-visible:ring-amber-400/40 dark:border-amber-800 dark:bg-slate-900"
                onKeyDown={(e) => {
                  if (e.key === "Escape") cancelPinnedEdit();
                }}
              />
              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-8"
                  onClick={cancelPinnedEdit}
                  disabled={savingPinned}
                >
                  <X className="mr-1 h-3.5 w-3.5" />
                  Cancel
                </Button>
                <Button
                  type="button"
                  size="sm"
                  disabled={savingPinned}
                  onClick={savePinnedNote}
                  className="h-8 bg-[#008f68] text-white hover:bg-[#007a5a]"
                >
                  {savingPinned ? (
                    <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Save className="mr-1 h-3.5 w-3.5" />
                  )}
                  Save
                </Button>
              </div>
            </div>
          ) : (
            <div
              className={cn(
                "rounded-xl border-l-4 px-3.5 py-3 text-[13px] leading-relaxed",
                hasPinned
                  ? "border-l-amber-500 border-amber-200/50 bg-amber-50/50 text-slate-800 dark:border-amber-600 dark:bg-amber-950/30 dark:text-slate-100"
                  : "border-l-slate-300 border-dashed border-slate-200 bg-slate-50/80 text-slate-500 dark:border-slate-700 dark:bg-slate-900/50",
              )}
            >
              {hasPinned ? (
                <p className="whitespace-pre-wrap break-words">{customer.pinnedNote}</p>
              ) : (
                <div className="flex items-start gap-2">
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />
                  <span>No persistent note — add one so every agent sees it on calls.</span>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="rounded-xl border border-slate-200/70 bg-slate-50/50 p-3.5 dark:border-slate-800 dark:bg-slate-900/40">
          <div className="mb-3 flex items-center justify-between gap-2">
            <p className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.12em] text-slate-600 dark:text-slate-300">
              <StickyNote className="h-3.5 w-3.5 text-amber-600" />
              Audit trail
            </p>
            <span className="rounded-full bg-white px-2 py-0.5 font-mono text-[11px] font-semibold text-slate-600 shadow-sm ring-1 ring-slate-200/80 dark:bg-slate-950 dark:text-slate-300 dark:ring-slate-700">
              {notesLoading ? "…" : notes.length}
            </span>
          </div>

          <CustomerNotesList
            customerId={customer.id}
            notes={notes}
            canEdit={canManageNotes}
            variant="sheet"
            loading={notesLoading}
            onNotesChange={handleNotesChange}
            onNotesMutated={onNotesMutated}
          />
        </div>
      </div>
    </section>
  );
}
