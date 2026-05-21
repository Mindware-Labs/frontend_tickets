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
  const [pinnedDraft, setPinnedDraft] = useState("");
  const [savingPinned, setSavingPinned] = useState(false);
  const [notes, setNotes] = useState<CustomerNote[]>(customer.notes ?? []);
  const [notesLoading, setNotesLoading] = useState(false);
  const [trailOpen, setTrailOpen] = useState(false);

  const { pinned, audit } = useMemo(() => splitCustomerNotes(notes), [notes]);
  const hasPinned = Boolean(pinned?.content?.trim());
  const pinnedMeta = formatNoteMeta(pinned);

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

  return (
    <section className="overflow-hidden rounded-xl border border-slate-200/80 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-950">
      <div className="border-b border-slate-100 px-3 py-2 dark:border-slate-800">
        <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-slate-500">
          Notes
        </p>
      </div>

      {/* Pinned — always visible */}
      <div className="border-b border-amber-100/80 bg-amber-50/40 px-3 py-2.5 dark:border-amber-900/30 dark:bg-amber-950/20">
        <div className="flex items-center justify-between gap-2">
          <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-amber-800 dark:text-amber-300">
            <Pin className="h-3 w-3" />
            Pinned
          </span>
          {canEditPinned && !editingPinned ? (
            <button
              type="button"
              onClick={() => {
                setPinnedDraft(pinned?.content ?? "");
                setEditingPinned(true);
              }}
              className="text-[11px] font-semibold text-[#008f68] hover:underline"
            >
              {hasPinned ? "Edit" : "Add"}
            </button>
          ) : null}
        </div>

        {editingPinned && canEditPinned ? (
          <div className="mt-2 space-y-2">
            <Textarea
              value={pinnedDraft}
              onChange={(e) => setPinnedDraft(e.target.value)}
              rows={2}
              placeholder="VIP, payment plan, callback…"
              className="min-h-0 resize-none border-amber-200/80 bg-white text-[13px] focus-visible:ring-amber-400/30 dark:border-amber-900 dark:bg-slate-900"
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
          </div>
        ) : (
          <>
            <p
              className={cn(
                "mt-1.5 text-[13px] leading-snug",
                hasPinned
                  ? "font-medium text-slate-800 dark:text-slate-100"
                  : "italic text-slate-500",
              )}
            >
              {hasPinned
                ? pinned?.content
                : "No pinned note — visible to all agents on this number."}
            </p>
            {pinnedMeta ? (
              <p className="mt-1 text-[10px] tabular-nums text-amber-800/70 dark:text-amber-400/80">
                {pinnedMeta}
              </p>
            ) : null}
          </>
        )}
      </div>

      {/* Audit trail — collapsible */}
      <div className="px-3 py-2">
        <button
          type="button"
          onClick={() => setTrailOpen((v) => !v)}
          className="flex w-full items-center justify-between gap-2 rounded-lg px-1 py-1 text-left transition-colors hover:bg-slate-50 dark:hover:bg-slate-900/50"
        >
          <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-slate-600 dark:text-slate-300">
            <StickyNote className="h-3.5 w-3.5 text-slate-400" />
            Audit trail
            <span className="rounded-md bg-slate-100 px-1.5 py-0.5 font-mono text-[10px] text-slate-500 dark:bg-slate-800">
              {notesLoading ? "…" : audit.length}
            </span>
          </span>
          <ChevronDown
            className={cn(
              "h-4 w-4 shrink-0 text-slate-400 transition-transform",
              trailOpen && "rotate-180",
            )}
          />
        </button>
        {trailOpen ? (
          <div className="mt-2 border-t border-slate-100 pt-2 dark:border-slate-800">
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
          </div>
        ) : null}
      </div>
    </section>
  );
}
