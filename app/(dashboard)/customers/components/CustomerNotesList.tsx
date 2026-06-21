"use client";

import { useMemo, useState } from "react";
import {
  Check,
  Loader2,
  Pencil,
  Plus,
  StickyNote,
  Trash2,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { fetchFromBackend } from "@/lib/api-client";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import {
  fetchCustomerNotes,
  formatNoteMeta,
  normalizeCustomerNote,
  splitCustomerNotes,
} from "../utils/notes";
import type { CustomerNote } from "../types";

interface CustomerNotesListProps {
  customerId?: number;
  notes: CustomerNote[];
  onNotesChange: (notes: CustomerNote[]) => void;
  canEdit?: boolean;
  variant?: "sheet" | "form";
  /** Tighter layout for customer sheet */
  compact?: boolean;
  onNotesMutated?: () => void;
  loading?: boolean;
}

export function CustomerNotesList({
  customerId,
  notes,
  onNotesChange,
  canEdit = true,
  variant = "sheet",
  compact = false,
  onNotesMutated,
  loading = false,
}: CustomerNotesListProps) {
  const [newNote, setNewNote] = useState("");
  const [addingNote, setAddingNote] = useState(false);
  const [deletingNoteId, setDeletingNoteId] = useState<number | null>(null);
  const [editingNoteId, setEditingNoteId] = useState<number | null>(null);
  const [editingText, setEditingText] = useState("");
  const [savingNote, setSavingNote] = useState(false);

  const isForm = variant === "form";
  const isSheet = variant === "sheet";
  const isCompactSheet = isSheet && compact;
  const displayNotes = useMemo(() => {
    const { audit } = splitCustomerNotes(notes);
    return audit;
  }, [notes]);

  const handleAddNote = async () => {
    const content = newNote.trim();
    if (!content || !customerId) return;
    setAddingNote(true);
    try {
      const created = await fetchFromBackend(`/customers/${customerId}/notes`, {
        method: "POST",
        body: JSON.stringify({ content }),
      });
      const note = normalizeCustomerNote(
        (created as { data?: CustomerNote })?.data ?? created,
      );
      if (!note.id && customerId) {
        const refreshed = await fetchCustomerNotes(customerId);
        onNotesChange(splitCustomerNotes(refreshed).audit);
      } else if (!note.isPinned) {
        onNotesChange([note, ...displayNotes]);
      } else {
        const refreshed = await fetchCustomerNotes(customerId);
        onNotesChange(splitCustomerNotes(refreshed).audit);
      }
      setNewNote("");
      onNotesMutated?.();
      toast({ title: "Note added" });
    } catch {
      toast({
        title: "Error",
        description: "Failed to add note",
        variant: "destructive",
      });
    } finally {
      setAddingNote(false);
    }
  };

  const handleDeleteNote = async (noteId: number) => {
    if (!customerId) return;
    setDeletingNoteId(noteId);
    try {
      await fetchFromBackend(`/customers/${customerId}/notes/${noteId}`, {
        method: "DELETE",
      });
      onNotesChange(displayNotes.filter((n) => n.id !== noteId));
      onNotesMutated?.();
      toast({ title: "Note deleted" });
    } catch {
      toast({
        title: "Error",
        description: "Failed to delete note",
        variant: "destructive",
      });
    } finally {
      setDeletingNoteId(null);
    }
  };

  const handleSaveNote = async () => {
    if (!customerId || editingNoteId === null || !editingText.trim()) return;
    setSavingNote(true);
    try {
      const updated = await fetchFromBackend(
        `/customers/${customerId}/notes/${editingNoteId}`,
        {
          method: "PATCH",
          body: JSON.stringify({ content: editingText.trim() }),
        },
      );
      const note = normalizeCustomerNote(
        (updated as { data?: CustomerNote })?.data ?? updated,
      );
      if (note.isPinned) {
        const refreshed = await fetchCustomerNotes(customerId);
        onNotesChange(splitCustomerNotes(refreshed).audit);
      } else {
        onNotesChange(
          displayNotes.map((n) => (n.id === editingNoteId ? { ...n, ...note } : n)),
        );
      }
      setEditingNoteId(null);
      setEditingText("");
      onNotesMutated?.();
      toast({ title: "Note updated" });
    } catch {
      toast({
        title: "Error",
        description: "Failed to update note",
        variant: "destructive",
      });
    } finally {
      setSavingNote(false);
    }
  };

  const cancelEdit = () => {
    setEditingNoteId(null);
    setEditingText("");
  };

  return (
    <div className={cn("space-y-2", isForm && "space-y-2")}>
      {canEdit ? (
        <div
          className={cn(
            "flex gap-2",
            isForm || isCompactSheet ? "flex-row items-end" : "flex-row items-end",
          )}
        >
          <Textarea
            placeholder={
              isCompactSheet
                ? "Add an audit note for this customer…"
                : "Add note…"
            }
            value={newNote}
            rows={isCompactSheet ? 2 : isForm ? 2 : 2}
            onChange={(e) => setNewNote(e.target.value)}
            disabled={!customerId || loading}
            className={cn(
              "min-h-0 flex-1 resize-none",
              isCompactSheet
                ? "min-h-[36px] rounded-xl border-border bg-muted/30 px-3 py-2 text-[12.5px] shadow-none focus-visible:border-[#008f68]/40 focus-visible:ring-[#008f68]/30 dark:bg-neutral-900/60"
                : isSheet
                  ? "border-slate-200/80 bg-white text-sm dark:border-neutral-700 dark:bg-neutral-900"
                  : "border-slate-200 dark:border-neutral-700 text-sm",
            )}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                if (customerId && newNote.trim()) handleAddNote();
              }
            }}
          />
          <Button
            type="button"
            size="sm"
            variant={isForm ? "outline" : "default"}
            onClick={handleAddNote}
            disabled={addingNote || !newNote.trim() || !customerId || loading}
            className={cn(
              "shrink-0",
              isForm
                ? "h-8 w-8 border-slate-200 dark:border-neutral-700 p-0"
                : isCompactSheet
                  ? "h-9 rounded-full bg-[#008f68] px-3.5 text-[12px] font-semibold text-white shadow-sm hover:bg-[#007a5a] disabled:opacity-50"
                  : "h-9 w-auto bg-[#008f68] px-3 text-white hover:bg-[#007a5a]",
            )}
          >
            {addingNote ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : isCompactSheet ? (
              "Add"
            ) : (
              <Plus className="h-3.5 w-3.5" />
            )}
          </Button>
        </div>
      ) : null}

      {loading ? (
        <div className="flex items-center justify-center gap-1.5 rounded-xl border border-slate-100 bg-slate-50/80 py-8 text-[11px] font-medium text-slate-500 dark:border-neutral-800 dark:bg-neutral-900/40">
          <Loader2 className="h-3.5 w-3.5 animate-spin text-[#008f68]" />
          Loading notes…
        </div>
      ) : displayNotes.length > 0 ? (
        isSheet ? (
          <div
            className={cn(
              "overflow-y-auto overscroll-contain pr-0.5",
              isCompactSheet
                ? "max-h-[min(240px,32vh)] space-y-2"
                : "relative max-h-[min(280px,36vh)]",
            )}
          >
            {!isCompactSheet ? (
              <div
                className="absolute top-0.5 bottom-0.5 left-[7px] w-px bg-slate-200 dark:bg-neutral-700"
                aria-hidden
              />
            ) : null}
            <ul className={cn(isCompactSheet ? "space-y-2" : "space-y-2.5")}>
              {displayNotes.map((note) => {
                const isEditing = editingNoteId === note.id;
                const meta = formatNoteMeta(note);
                return (
                  <li
                    key={note.id}
                    className={cn(
                      isCompactSheet ? "group" : "relative pl-5",
                    )}
                  >
                    {!isCompactSheet ? (
                      <span className="absolute left-0 top-1 flex h-3 w-3 items-center justify-center rounded-full bg-amber-500 ring-2 ring-white dark:ring-neutral-950" />
                    ) : null}
                    {isEditing ? (
                      <div
                        className={cn(
                          "space-y-2 rounded-xl border bg-white p-2.5 dark:bg-neutral-900",
                          isCompactSheet
                            ? "border-amber-200/80 dark:border-amber-900/50"
                            : "border-slate-200 dark:border-neutral-700",
                        )}
                      >
                        <Textarea
                          value={editingText}
                          rows={2}
                          onChange={(e) => setEditingText(e.target.value)}
                          className="resize-none rounded-lg border-slate-200 text-[12.5px] dark:border-neutral-700"
                          autoFocus
                          onKeyDown={(e) => {
                            if (e.key === "Enter" && !e.shiftKey) {
                              e.preventDefault();
                              handleSaveNote();
                            }
                            if (e.key === "Escape") cancelEdit();
                          }}
                        />
                        <div className="flex justify-end gap-1.5">
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="h-7 px-2 text-[11px]"
                            onClick={cancelEdit}
                          >
                            Cancel
                          </Button>
                          <Button
                            type="button"
                            size="sm"
                            className="h-7 bg-[#008f68] px-3 text-[11px] text-white hover:bg-[#007a5a]"
                            onClick={handleSaveNote}
                            disabled={savingNote || !editingText.trim()}
                          >
                            {savingNote ? (
                              <Loader2 className="h-3 w-3 animate-spin" />
                            ) : (
                              "Save"
                            )}
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div
                        className={cn(
                          "min-w-0",
                          isCompactSheet &&
                            "rounded-xl border border-amber-200/70 bg-amber-50/60 px-2.5 py-2 dark:border-amber-900/40 dark:bg-amber-950/20",
                        )}
                      >
                        {meta ? (
                          <p
                            className={cn(
                              "font-medium tabular-nums text-slate-500 dark:text-neutral-400",
                              isCompactSheet
                                ? "text-[10px] uppercase tracking-[0.08em]"
                                : "text-[11px]",
                            )}
                          >
                            {meta}
                          </p>
                        ) : null}
                        <p
                          className={cn(
                            "whitespace-pre-wrap break-words leading-relaxed text-slate-800 dark:text-neutral-100",
                            meta && "mt-1",
                            isCompactSheet ? "text-[12px]" : "mt-0.5 text-[13px]",
                          )}
                        >
                          {note.content}
                        </p>
                        {canEdit ? (
                          <div
                            className={cn(
                              "mt-2 flex gap-1",
                              isCompactSheet
                                ? "opacity-100"
                                : "opacity-100 sm:opacity-0 sm:transition-opacity sm:group-hover:opacity-100",
                            )}
                          >
                            <button
                              type="button"
                              onClick={() => {
                                setEditingNoteId(note.id);
                                setEditingText(note.content);
                              }}
                              className="rounded-md px-2 py-0.5 text-[11px] font-semibold text-[#008f68] transition-colors hover:bg-[#e8f8f1] dark:hover:bg-emerald-950/40"
                            >
                              Edit
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteNote(note.id)}
                              disabled={deletingNoteId === note.id}
                              className="rounded-md px-2 py-0.5 text-[11px] font-semibold text-red-600 transition-colors hover:bg-red-50 dark:hover:bg-red-950/30"
                            >
                              {deletingNoteId === note.id ? "…" : "Delete"}
                            </button>
                          </div>
                        ) : null}
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>
          </div>
        ) : (
          <ul className="space-y-2">
            {displayNotes.map((note) => {
              const isEditing = editingNoteId === note.id;
              return (
                <li
                  key={note.id}
                  className="group flex items-start gap-2 rounded-lg border border-slate-200 dark:border-neutral-700 bg-slate-50/60 dark:bg-neutral-800/50 px-3 py-2.5 text-sm"
                >
                  {isEditing ? (
                    <>
                      <Textarea
                        value={editingText}
                        rows={2}
                        onChange={(e) => setEditingText(e.target.value)}
                        className="flex-1 resize-none text-sm"
                        autoFocus
                        onKeyDown={(e) => {
                          if (e.key === "Enter" && !e.shiftKey) {
                            e.preventDefault();
                            handleSaveNote();
                          }
                          if (e.key === "Escape") cancelEdit();
                        }}
                      />
                      <div className="flex flex-col gap-1">
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-emerald-600"
                          onClick={handleSaveNote}
                          disabled={savingNote || !editingText.trim()}
                        >
                          {savingNote ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          ) : (
                            <Check className="h-3.5 w-3.5" />
                          )}
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7"
                          onClick={cancelEdit}
                        >
                          <X className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="min-w-0 flex-1">
                        <p className="whitespace-pre-wrap break-words leading-snug text-slate-700 dark:text-neutral-200">
                          {note.content}
                        </p>
                        {formatNoteMeta(note) ? (
                          <p className="mt-1.5 text-[10px] font-medium tabular-nums text-slate-400">
                            {formatNoteMeta(note)}
                          </p>
                        ) : null}
                      </div>
                      {canEdit ? (
                        <div className="flex shrink-0 flex-col gap-0.5">
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-slate-400"
                            onClick={() => {
                              setEditingNoteId(note.id);
                              setEditingText(note.content);
                            }}
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-red-400"
                            onClick={() => handleDeleteNote(note.id)}
                            disabled={deletingNoteId === note.id}
                          >
                            {deletingNoteId === note.id ? (
                              <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            ) : (
                              <Trash2 className="h-3.5 w-3.5" />
                            )}
                          </Button>
                        </div>
                      ) : null}
                    </>
                  )}
                </li>
              );
            })}
          </ul>
        )
      ) : isCompactSheet ? (
        <div className="flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-slate-200 bg-slate-50/70 px-4 py-8 text-center dark:border-neutral-700 dark:bg-neutral-900/30">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200/80 bg-white shadow-sm dark:border-neutral-700 dark:bg-neutral-950">
            <StickyNote className="h-4 w-4 text-slate-400" />
          </span>
          <p className="text-[12px] font-semibold text-slate-600 dark:text-neutral-300">
            No audit notes yet
          </p>
          <p className="max-w-[220px] text-[11px] leading-relaxed text-slate-400">
            Add context that stays on this customer for every agent.
          </p>
        </div>
      ) : (
        <p className="py-3 text-center text-[11px] text-slate-400">
          No audit notes yet.
        </p>
      )}
    </div>
  );
}
