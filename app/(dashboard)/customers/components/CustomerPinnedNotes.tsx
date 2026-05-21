"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { ChevronDown, Loader2, Pin, StickyNote } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import type { Customer, CustomerNote } from "../types";
import {
  fetchCustomerNotes,
  formatNoteMeta,
  mergeCustomerNotes,
  savePinnedCustomerNote,
  splitCustomerNotes,
} from "../utils/notes";
import { CustomerNotesList } from "./CustomerNotesList";

type NotesTab = "pinned" | "trail";

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
  const [tab, setTab] = useState<NotesTab>("pinned");
  const [editingPinned, setEditingPinned] = useState(false);
  const [pinnedDraft, setPinnedDraft] = useState("");
  const [savingPinned, setSavingPinned] = useState(false);
  const [notes, setNotes] = useState<CustomerNote[]>(customer.notes ?? []);
  const [notesLoading, setNotesLoading] = useState(false);
  const [trailOpen, setTrailOpen] = useState(true);

  const { pinned, audit } = useMemo(() => splitCustomerNotes(notes), [notes]);
  const hasPinned = Boolean(pinned?.content?.trim());

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
      setPinnedDraft(pinned?.content ?? customer.pinnedNote ?? "");
    }
  }, [pinned?.content, customer.pinnedNote, editingPinned]);

  useEffect(() => {
    setNotes(customer.notes ?? []);
  }, [customer.notes]);

  useEffect(() => {
    loadNotes();
  }, [loadNotes]);

  const savePinned = async () => {
    setSavingPinned(true);
    try {
      const fetched = await savePinnedCustomerNote(
        customer.id,
        pinnedDraft,
        pinned,
      );
      setNotes(fetched);
      onCustomerChange(mergeCustomerNotes(customer, fetched));
      setEditingPinned(false);
      onNotesMutated?.();
      toast({ title: "Pinned note updated" });
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Failed to update pinned note";
      toast({ title: "Error", description: message, variant: "destructive" });
    } finally {
      setSavingPinned(false);
    }
  };

  const handleAuditChange = (auditNotes: CustomerNote[]) => {
    const next = pinned ? [pinned, ...auditNotes] : auditNotes;
    setNotes(next);
    onCustomerChange(mergeCustomerNotes(customer, next));
  };

  const pinnedMeta = formatNoteMeta(pinned);

  return (
    <section className="overflow-hidden rounded-xl border border-slate-200/80 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-950">
      <div className="flex items-center justify-between gap-2 border-b border-slate-100 px-3 py-2.5 dark:border-slate-800">
        <div className="flex min-w-0 items-center gap-2">
          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400">
            <Pin className="h-3.5 w-3.5" strokeWidth={2.25} />
          </span>
          <div className="min-w-0">
            <h3 className="text-[13px] font-semibold text-slate-900 dark:text-slate-50">
              Client notes
            </h3>
            <p className="text-[11px] text-slate-500">Pinned + audit trail</p>
          </div>
        </div>
        <div className="flex shrink-0 rounded-lg bg-slate-100 p-0.5 dark:bg-slate-900">
          <button
            type="button"
            onClick={() => setTab("pinned")}
            className={cn(
              "rounded-md px-2.5 py-1 text-[11px] font-semibold transition-colors",
              tab === "pinned"
                ? "bg-white text-slate-900 shadow-sm dark:bg-slate-800 dark:text-white"
                : "text-slate-500 hover:text-slate-700",
            )}
          >
            Pinned
          </button>
          <button
            type="button"
            onClick={() => setTab("trail")}
            className={cn(
              "rounded-md px-2.5 py-1 text-[11px] font-semibold transition-colors",
              tab === "trail"
                ? "bg-white text-slate-900 shadow-sm dark:bg-slate-800 dark:text-white"
                : "text-slate-500 hover:text-slate-700",
            )}
          >
            Trail {notesLoading ? "…" : audit.length}
          </button>
        </div>
      </div>

      <div className="p-3">
        {tab === "pinned" ? (
          <div className="space-y-2">
            {editingPinned && canEditPinned ? (
              <>
                <Textarea
                  value={pinnedDraft}
                  onChange={(e) => setPinnedDraft(e.target.value)}
                  rows={3}
                  placeholder="VIP, payment plan, callback window…"
                  className="min-h-0 resize-none border-slate-200 text-[13px] focus-visible:ring-amber-400/30"
                  onKeyDown={(e) => {
                    if (e.key === "Escape") {
                      setPinnedDraft(pinned?.content ?? "");
                      setEditingPinned(false);
                    }
                  }}
                />
                <div className="flex justify-end gap-1.5">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-7 px-2 text-xs"
                    onClick={() => {
                      setPinnedDraft(pinned?.content ?? "");
                      setEditingPinned(false);
                    }}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    disabled={savingPinned}
                    onClick={savePinned}
                    className="h-7 bg-[#008f68] px-3 text-xs text-white hover:bg-[#007a5a]"
                  >
                    {savingPinned ? (
                      <Loader2 className="h-3 w-3 animate-spin" />
                    ) : (
                      "Save"
                    )}
                  </Button>
                </div>
              </>
            ) : (
              <div
                className={cn(
                  "rounded-lg px-2.5 py-2 text-[13px] leading-snug",
                  hasPinned
                    ? "bg-amber-50/80 text-slate-800 ring-1 ring-amber-200/60 dark:bg-amber-950/30 dark:text-amber-50 dark:ring-amber-900/50"
                    : "bg-slate-50 text-slate-500 ring-1 ring-dashed ring-slate-200 dark:bg-slate-900/50 dark:ring-slate-700",
                )}
              >
                {hasPinned ? (
                  <p className="line-clamp-4 whitespace-pre-wrap break-words">
                    {pinned?.content}
                  </p>
                ) : (
                  <p className="text-[12px] italic">No pinned note for this number.</p>
                )}
              </div>
            )}
            {!editingPinned && pinnedMeta ? (
              <p className="text-[10px] font-medium text-slate-400">{pinnedMeta}</p>
            ) : null}
            {canEditPinned && !editingPinned ? (
              <button
                type="button"
                onClick={() => {
                  setPinnedDraft(pinned?.content ?? "");
                  setEditingPinned(true);
                }}
                className="text-[11px] font-semibold text-[#008f68] hover:underline"
              >
                {hasPinned ? "Edit pinned note" : "Add pinned note"}
              </button>
            ) : null}
          </div>
        ) : (
          <div>
            <button
              type="button"
              onClick={() => setTrailOpen((v) => !v)}
              className="mb-2 flex w-full items-center justify-between text-[11px] font-medium text-slate-500"
            >
              <span className="inline-flex items-center gap-1">
                <StickyNote className="h-3 w-3" />
                Audit entries
              </span>
              <ChevronDown
                className={cn(
                  "h-3.5 w-3.5 transition-transform",
                  trailOpen && "rotate-180",
                )}
              />
            </button>
            {trailOpen ? (
              <CustomerNotesList
                customerId={customer.id}
                notes={audit}
                canEdit={canManageNotes}
                variant="sheet"
                compact
                loading={notesLoading}
                onNotesChange={handleAuditChange}
                onNotesMutated={() => {
                  loadNotes();
                  onNotesMutated?.();
                }}
              />
            ) : null}
          </div>
        )}
      </div>
    </section>
  );
}
