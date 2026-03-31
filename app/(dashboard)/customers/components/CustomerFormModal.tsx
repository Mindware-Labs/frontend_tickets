"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Plus,
  Trash2,
  StickyNote,
  Loader2,
  Pencil,
  Check,
  X,
} from "lucide-react";
import { CampaignOption, CustomerFormData, CustomerNote } from "../types";
import { fetchFromBackend } from "@/lib/api-client";
import { toast } from "@/hooks/use-toast";

interface CustomerFormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  submitLabel: string;
  isSubmitting: boolean;
  formData: CustomerFormData;
  onFormChange: (next: CustomerFormData) => void;
  validationErrors: Record<string, string>;
  onValidationErrorChange: (next: Record<string, string>) => void;
  onSubmit: () => void;
  campaigns: CampaignOption[];
  idPrefix: string;
  customerId?: number;
  existingNotes?: CustomerNote[];
  onNotesChange?: (notes: CustomerNote[]) => void;
}

export function CustomerFormModal({
  open,
  onOpenChange,
  title,
  description,
  submitLabel,
  isSubmitting,
  formData,
  onFormChange,
  validationErrors,
  onValidationErrorChange,
  onSubmit,
  campaigns,
  idPrefix,
  customerId,
  existingNotes = [],
  onNotesChange,
}: CustomerFormModalProps) {
  const [campaignSearch, setCampaignSearch] = useState("");
  const [newNote, setNewNote] = useState("");
  const [addingNote, setAddingNote] = useState(false);
  const [deletingNoteId, setDeletingNoteId] = useState<number | null>(null);
  const [editingNoteId, setEditingNoteId] = useState<number | null>(null);
  const [editingPendingIdx, setEditingPendingIdx] = useState<number | null>(
    null,
  );
  const [editingText, setEditingText] = useState("");
  const [savingNote, setSavingNote] = useState(false);

  const handleAddNote = async () => {
    if (!newNote.trim() || !customerId) return;
    setAddingNote(true);
    try {
      const created = await fetchFromBackend(`/customers/${customerId}/notes`, {
        method: "POST",
        body: JSON.stringify({ content: newNote.trim() }),
      });
      setNewNote("");
      onNotesChange?.([created, ...existingNotes]);
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
      onNotesChange?.(existingNotes.filter((n) => n.id !== noteId));
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

  const handleSaveExistingNote = async () => {
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
      onNotesChange?.(
        existingNotes.map((n) =>
          n.id === editingNoteId ? { ...n, content: updated.content } : n,
        ),
      );
      setEditingNoteId(null);
      setEditingText("");
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

  const handleSavePendingNote = () => {
    if (editingPendingIdx === null || !editingText.trim()) return;
    const updated = [...formData.pendingNotes];
    updated[editingPendingIdx] = editingText.trim();
    onFormChange({ ...formData, pendingNotes: updated });
    setEditingPendingIdx(null);
    setEditingText("");
  };

  const formatPhoneNumber = (value: string) => {
    // Si ya tiene el formato correcto, dejarlo así
    if (value.startsWith("+1 ") && /^\+1 \d{3}-\d{3}-\d{4}$/.test(value)) {
      return value;
    }

    // Eliminar todo excepto números
    const numbers = value.replace(/\D/g, "");

    // Si empieza con 1, quitarlo para evitar duplicados
    const cleaned = numbers.startsWith("1") ? numbers.slice(1) : numbers;

    // Formatear: +1 XXX-XXX-XXXX
    if (cleaned.length === 0) return "";
    if (cleaned.length <= 3) return `+1 ${cleaned}`;
    if (cleaned.length <= 6)
      return `+1 ${cleaned.slice(0, 3)}-${cleaned.slice(3)}`;
    return `+1 ${cleaned.slice(0, 3)}-${cleaned.slice(3, 6)}-${cleaned.slice(
      6,
      10,
    )}`;
  };

  const filteredCampaigns = useMemo(() => {
    const term = campaignSearch.trim().toLowerCase();
    if (!term) return campaigns;
    return campaigns.filter((campaign) =>
      campaign.nombre.toLowerCase().includes(term),
    );
  }, [campaigns, campaignSearch]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor={`${idPrefix}-name`}>Name *</Label>
              <Input
                id={`${idPrefix}-name`}
                value={formData.name}
                onChange={(e) => {
                  onFormChange({ ...formData, name: e.target.value });
                  onValidationErrorChange({ ...validationErrors, name: "" });
                }}
                className={validationErrors.name ? "border-red-500" : ""}
              />
              {validationErrors.name && (
                <p className="text-xs text-red-500">{validationErrors.name}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor={`${idPrefix}-phone`}>Phone *</Label>
              <Input
                id={`${idPrefix}-phone`}
                placeholder="+1 XXX-XXX-XXXX"
                value={formData.phone}
                onChange={(e) => {
                  const formatted = formatPhoneNumber(e.target.value);
                  onFormChange({ ...formData, phone: formatted });
                  onValidationErrorChange({ ...validationErrors, phone: "" });
                }}
                className={validationErrors.phone ? "border-red-500" : ""}
              />
              {validationErrors.phone && (
                <p className="text-xs text-red-500">{validationErrors.phone}</p>
              )}
            </div>
          </div>

          {/* Notes Section */}
          <div className="space-y-2">
            <Label className="flex items-center gap-1.5">
              <StickyNote className="h-3.5 w-3.5" />
              Notes{" "}
              <span className="text-muted-foreground font-normal text-xs">
                (shown as alert on every ticket)
              </span>
            </Label>

            {customerId ? (
              /* Multi-note mode for existing customers (API-backed) */
              <>
                <div className="flex gap-2">
                  <Textarea
                    placeholder="Add a new note…"
                    value={newNote}
                    rows={2}
                    onChange={(e) => setNewNote(e.target.value)}
                    className="flex-1"
                  />
                  <Button
                    type="button"
                    size="sm"
                    onClick={handleAddNote}
                    disabled={addingNote || !newNote.trim()}
                    className="self-end"
                  >
                    {addingNote ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Plus className="h-4 w-4" />
                    )}
                  </Button>
                </div>

                {existingNotes.length > 0 ? (
                  <ScrollArea className="max-h-[160px]">
                    <div className="space-y-2 pr-2">
                      {existingNotes.map((note) => (
                        <div
                          key={note.id}
                          className="flex items-start gap-2 p-2 rounded-md border bg-muted/30 text-sm"
                        >
                          {editingNoteId === note.id ? (
                            <>
                              <Textarea
                                value={editingText}
                                rows={2}
                                onChange={(e) => setEditingText(e.target.value)}
                                className="flex-1 text-sm"
                                autoFocus
                                onKeyDown={(e) => {
                                  if (e.key === "Enter" && !e.shiftKey) {
                                    e.preventDefault();
                                    handleSaveExistingNote();
                                  }
                                  if (e.key === "Escape") {
                                    setEditingNoteId(null);
                                    setEditingText("");
                                  }
                                }}
                              />
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6 shrink-0 text-green-600 hover:text-green-700"
                                onClick={handleSaveExistingNote}
                                disabled={savingNote || !editingText.trim()}
                              >
                                {savingNote ? (
                                  <Loader2 className="h-3 w-3 animate-spin" />
                                ) : (
                                  <Check className="h-3 w-3" />
                                )}
                              </Button>
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6 shrink-0"
                                onClick={() => {
                                  setEditingNoteId(null);
                                  setEditingText("");
                                }}
                              >
                                <X className="h-3 w-3" />
                              </Button>
                            </>
                          ) : (
                            <>
                              <p
                                className="flex-1 whitespace-pre-wrap break-words cursor-pointer hover:text-primary transition-colors"
                                onClick={() => {
                                  setEditingNoteId(note.id);
                                  setEditingText(note.content);
                                }}
                                title="Click to edit"
                              >
                                {note.content}
                              </p>
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6 shrink-0 text-muted-foreground hover:text-primary"
                                onClick={() => {
                                  setEditingNoteId(note.id);
                                  setEditingText(note.content);
                                }}
                              >
                                <Pencil className="h-3 w-3" />
                              </Button>
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6 shrink-0 text-destructive hover:text-destructive"
                                onClick={() => handleDeleteNote(note.id)}
                                disabled={deletingNoteId === note.id}
                              >
                                {deletingNoteId === note.id ? (
                                  <Loader2 className="h-3 w-3 animate-spin" />
                                ) : (
                                  <Trash2 className="h-3 w-3" />
                                )}
                              </Button>
                            </>
                          )}
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                ) : (
                  <p className="text-xs text-muted-foreground italic">
                    No notes yet
                  </p>
                )}
              </>
            ) : (
              /* Multi-note mode for new customers (local state) */
              <>
                <div className="flex gap-2">
                  <Textarea
                    placeholder="Add a new note…"
                    value={newNote}
                    rows={2}
                    onChange={(e) => setNewNote(e.target.value)}
                    className="flex-1"
                  />
                  <Button
                    type="button"
                    size="sm"
                    onClick={() => {
                      if (!newNote.trim()) return;
                      onFormChange({
                        ...formData,
                        pendingNotes: [
                          newNote.trim(),
                          ...formData.pendingNotes,
                        ],
                      });
                      setNewNote("");
                    }}
                    disabled={!newNote.trim()}
                    className="self-end"
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>

                {formData.pendingNotes.length > 0 ? (
                  <ScrollArea className="max-h-[160px]">
                    <div className="space-y-2 pr-2">
                      {formData.pendingNotes.map((text, idx) => (
                        <div
                          key={idx}
                          className="flex items-start gap-2 p-2 rounded-md border bg-muted/30 text-sm"
                        >
                          {editingPendingIdx === idx ? (
                            <>
                              <Textarea
                                value={editingText}
                                rows={2}
                                onChange={(e) => setEditingText(e.target.value)}
                                className="flex-1 text-sm"
                                autoFocus
                                onKeyDown={(e) => {
                                  if (e.key === "Enter" && !e.shiftKey) {
                                    e.preventDefault();
                                    handleSavePendingNote();
                                  }
                                  if (e.key === "Escape") {
                                    setEditingPendingIdx(null);
                                    setEditingText("");
                                  }
                                }}
                              />
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6 shrink-0 text-green-600 hover:text-green-700"
                                onClick={handleSavePendingNote}
                                disabled={!editingText.trim()}
                              >
                                <Check className="h-3 w-3" />
                              </Button>
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6 shrink-0"
                                onClick={() => {
                                  setEditingPendingIdx(null);
                                  setEditingText("");
                                }}
                              >
                                <X className="h-3 w-3" />
                              </Button>
                            </>
                          ) : (
                            <>
                              <p
                                className="flex-1 whitespace-pre-wrap break-words cursor-pointer hover:text-primary transition-colors"
                                onClick={() => {
                                  setEditingPendingIdx(idx);
                                  setEditingText(text);
                                }}
                                title="Click to edit"
                              >
                                {text}
                              </p>
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6 shrink-0 text-muted-foreground hover:text-primary"
                                onClick={() => {
                                  setEditingPendingIdx(idx);
                                  setEditingText(text);
                                }}
                              >
                                <Pencil className="h-3 w-3" />
                              </Button>
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6 shrink-0 text-destructive hover:text-destructive"
                                onClick={() =>
                                  onFormChange({
                                    ...formData,
                                    pendingNotes: formData.pendingNotes.filter(
                                      (_, i) => i !== idx,
                                    ),
                                  })
                                }
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </>
                          )}
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                ) : (
                  <p className="text-xs text-muted-foreground italic">
                    No notes yet
                  </p>
                )}
              </>
            )}
          </div>

          <div className="space-y-2">
            <Label>Campaigns (Optional)</Label>
            <Input
              placeholder="Search campaigns..."
              value={campaignSearch}
              onChange={(e) => setCampaignSearch(e.target.value)}
            />
            <div className="rounded-md border p-3 space-y-2 max-h-48 overflow-y-auto">
              {filteredCampaigns.length === 0 ? (
                <p className="text-xs text-muted-foreground">
                  No campaigns available
                </p>
              ) : (
                filteredCampaigns.map((campaign) => {
                  const value = campaign.id.toString();
                  const checked = formData.campaignIds.includes(value);
                  return (
                    <label
                      key={campaign.id}
                      className="flex items-center gap-2 text-sm"
                    >
                      <Checkbox
                        checked={checked}
                        onCheckedChange={(next) => {
                          const isChecked = Boolean(next);
                          const campaignIds = isChecked
                            ? [...formData.campaignIds, value]
                            : formData.campaignIds.filter((id) => id !== value);
                          onFormChange({ ...formData, campaignIds });
                          onValidationErrorChange({
                            ...validationErrors,
                            campaignIds: "",
                          });
                        }}
                      />
                      <span>{campaign.nombre}</span>
                    </label>
                  );
                })
              )}
            </div>
            {validationErrors.campaignIds && (
              <p className="text-xs text-red-500">
                {validationErrors.campaignIds}
              </p>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button onClick={onSubmit} disabled={isSubmitting}>
            {isSubmitting ? `${submitLabel}...` : submitLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
