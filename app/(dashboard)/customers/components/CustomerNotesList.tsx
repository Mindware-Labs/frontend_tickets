"use client";

import { useState } from "react";
import { formatDistanceToNow } from "date-fns";
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
import { fetchCustomerNotes, normalizeCustomerNote } from "../utils/notes";
import type { CustomerNote } from "../types";

interface CustomerNotesListProps {
  customerId?: number;
  notes: CustomerNote[];
  onNotesChange: (notes: CustomerNote[]) => void;
  canEdit?: boolean;
  variant?: "sheet" | "form";
  onNotesMutated?: () => void;
  loading?: boolean;
}

function formatNoteDate(value?: string) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return formatDistanceToNow(date, { addSuffix: true });
}

export function CustomerNotesList({
  customerId,
  notes,
  onNotesChange,
  canEdit = true,
  variant = "sheet",
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
        onNotesChange(refreshed);
      } else {
        onNotesChange([note, ...notes]);
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
      onNotesChange(notes.filter((n) => n.id !== noteId));
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
      onNotesChange(
        notes.map((n) => (n.id === editingNoteId ? { ...n, ...note } : n)),
      );
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
    <div className={cn("space-y-3", isForm && "space-y-2")}>
      <div
        className={cn(
          "flex gap-2",
          isForm ? "flex-row items-end" : "flex-col sm:flex-row sm:items-end",
        )}
      >
        <Textarea
          placeholder="Add an audit note…"
          value={newNote}
          rows={isForm ? 2 : 2}
          onChange={(e) => setNewNote(e.target.value)}
          disabled={!customerId || loading}
          className={cn(
            "flex-1 resize-none text-sm",
            isSheet
              ? "border-slate-200/80 bg-white dark:border-slate-700 dark:bg-slate-900"
              : "border-slate-200",
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
              ? "h-9 border-slate-200"
              : "h-9 w-full sm:w-auto bg-[#008f68] hover:bg-[#007a5a] text-white",
          )}
        >
          {addingNote ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <>
              <Plus className={cn("h-4 w-4", isSheet && "mr-1")} />
              {isSheet ? <span>Add</span> : null}
            </>
          )}
        </Button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center gap-2 py-6 text-[12px] text-slate-500">
          <Loader2 className="h-4 w-4 animate-spin text-[#008f68]" />
          Loading notes…
        </div>
      ) : notes.length > 0 ? (
        isSheet ? (
          <div className="relative max-h-[min(320px,42vh)] overflow-y-auto overscroll-contain pr-1">
            <div
              className="absolute top-1 bottom-1 left-[9px] w-0.5 bg-amber-200/80 dark:bg-amber-900/50"
              aria-hidden
            />
            <ul className="space-y-3">
              {notes.map((note) => {
                const isEditing = editingNoteId === note.id;
                return (
                  <li key={note.id} className="relative pl-7">
                    <span className="absolute left-0 top-1 flex h-[18px] w-[18px] items-center justify-center rounded-full border-2 border-amber-500 bg-white dark:bg-slate-950">
                      <StickyNote className="h-2.5 w-2.5 text-amber-600" />
                    </span>
                    {isEditing ? (
                      <div className="space-y-2 rounded-lg border border-slate-200 bg-white p-2 dark:border-slate-700 dark:bg-slate-900">
                        <Textarea
                          value={editingText}
                          rows={2}
                          onChange={(e) => setEditingText(e.target.value)}
                          className="resize-none text-sm"
                          autoFocus
                          onKeyDown={(e) => {
                            if (e.key === "Enter" && !e.shiftKey) {
                              e.preventDefault();
                              handleSaveNote();
                            }
                            if (e.key === "Escape") cancelEdit();
                          }}
                        />
                        <div className="flex justify-end gap-1">
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7"
                            onClick={cancelEdit}
                          >
                            <X className="h-3.5 w-3.5" />
                          </Button>
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
                        </div>
                      </div>
                    ) : (
                      <div className="group min-w-0">
                        <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
                          <span className="text-xs tabular-nums text-slate-500">
                            {formatNoteDate(note.createdAt)}
                          </span>
                          {note.createdBy ? (
                            <>
                              <span className="text-slate-300">·</span>
                              <span className="text-[11px] font-semibold uppercase tracking-wide text-amber-700/90 dark:text-amber-400">
                                {note.createdBy}
                              </span>
                            </>
                          ) : null}
                        </div>
                        <p className="mt-1 whitespace-pre-wrap break-words text-[13px] leading-relaxed text-slate-700 dark:text-slate-200">
                          {note.content}
                        </p>
                        {canEdit ? (
                          <div className="mt-1.5 flex gap-1 opacity-100 sm:opacity-0 sm:transition-opacity sm:group-hover:opacity-100">
                            <button
                              type="button"
                              onClick={() => {
                                setEditingNoteId(note.id);
                                setEditingText(note.content);
                              }}
                              className="rounded px-1.5 py-0.5 text-[11px] font-semibold text-slate-500 hover:bg-slate-100 hover:text-slate-800"
                            >
                              Edit
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteNote(note.id)}
                              disabled={deletingNoteId === note.id}
                              className="rounded px-1.5 py-0.5 text-[11px] font-semibold text-red-500 hover:bg-red-50"
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
            {notes.map((note) => {
              const isEditing = editingNoteId === note.id;
              return (
                <li
                  key={note.id}
                  className="group flex items-start gap-2 rounded-lg border border-slate-200 bg-slate-50/60 px-3 py-2.5 text-sm"
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
                        <p className="whitespace-pre-wrap break-words leading-snug text-slate-700">
                          {note.content}
                        </p>
                        {(note.createdBy || note.createdAt) && (
                          <p className="mt-1.5 text-[10px] font-medium text-slate-400">
                            {formatNoteDate(note.createdAt)}
                            {note.createdBy ? ` · ${note.createdBy}` : ""}
                          </p>
                        )}
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
      ) : (
        <p
          className={cn(
            "rounded-xl border border-dashed px-3 py-4 text-center text-[13px] text-slate-500",
            isSheet
              ? "border-amber-200/60 bg-amber-50/30 dark:border-amber-900/40 dark:bg-amber-950/20"
              : "border-slate-200 bg-slate-50/50",
          )}
        >
          <StickyNote className="mx-auto mb-1.5 h-4 w-4 opacity-50" />
          No audit notes yet. Notes also appear in the activity timeline.
        </p>
      )}
    </div>
  );
}
