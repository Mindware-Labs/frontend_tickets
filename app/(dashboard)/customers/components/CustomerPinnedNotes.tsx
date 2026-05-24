"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Loader2, Pin, StickyNote } from "lucide-react";
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
  }, [customer.id, customer.notes]);

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

  const notesCardShell =
    "overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-[0_1px_3px_rgba(0,0,0,0.06)] dark:border-slate-800 dark:bg-slate-950";

  return (
    <div className="space-y-2.5">
      <div
        className={cn(
          notesCardShell,
          "border-amber-200/70 bg-gradient-to-b from-amber-50/80 to-white dark:border-amber-900/40 dark:from-amber-950/25 dark:to-slate-950",
        )}
      >
        <div className="flex items-center justify-between gap-2 border-b border-amber-100/80 px-3.5 py-2 dark:border-amber-900/30">
          <span className="inline-flex items-center gap-2">
            <span className="flex h-5 w-5 items-center justify-center rounded-md bg-amber-100 dark:bg-amber-950/60">
              <Pin className="h-3 w-3 text-amber-600 dark:text-amber-400" strokeWidth={2.25} />
            </span>
            <span className="text-[12px] font-bold text-amber-800 dark:text-amber-300">
              Pinned note
            </span>
          </span>
          {canEditPinned && !editingPinned ? (
            <button
              type="button"
              onClick={() => {
                setPinnedDraft(pinned?.content ?? "");
                setEditingPinned(true);
              }}
              className="text-[11px] font-semibold text-[#008f68] transition-colors hover:text-[#007a5a] hover:underline"
            >
              {hasPinned ? "Edit" : "Add"}
            </button>
          ) : null}
        </div>

        <div className="px-3.5 py-3">
        {editingPinned && canEditPinned ? (
          <div className="space-y-2">
            <Textarea
              value={pinnedDraft}
              onChange={(e) => setPinnedDraft(e.target.value)}
              rows={3}
              placeholder="VIP, payment plan, callback…"
              className="min-h-0 resize-none rounded-xl border-amber-200/80 bg-white text-[13px] shadow-none focus-visible:border-[#008f68]/40 focus-visible:ring-[#008f68]/25 dark:border-amber-900/50 dark:bg-slate-900"
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
                "text-[13px] leading-relaxed",
                hasPinned
                  ? "font-medium text-slate-900 dark:text-slate-50"
                  : "italic text-slate-500",
              )}
            >
              {hasPinned
                ? pinned?.content
                : "No pinned note — visible to all agents on this number."}
            </p>
            {pinnedMeta ? (
              <p className="mt-2 text-[10px] tabular-nums text-slate-400">
                {pinnedMeta}
              </p>
            ) : null}
          </>
        )}
        </div>
      </div>

      <div className={notesCardShell}>
        <div className="flex items-center gap-2 border-b border-slate-50 px-3.5 py-2 dark:border-slate-800">
          <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-md bg-slate-100 dark:bg-slate-900">
            <StickyNote className="h-3 w-3 text-slate-500" strokeWidth={2} />
          </span>
          <span className="text-[12px] font-bold text-slate-700 dark:text-slate-200">
            Audit trail
          </span>
          <span className="rounded-full border border-[#e2fae9] bg-[#e2fae9] px-[7px] py-[1px] text-[11px] font-semibold text-[#008f68] dark:border-emerald-900/50 dark:bg-emerald-950/40 dark:text-emerald-300">
            {notesLoading ? "…" : audit.length}
          </span>
        </div>
        <div className="px-3.5 py-3">
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
      </div>
    </div>
  );
}
