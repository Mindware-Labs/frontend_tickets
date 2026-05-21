"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogTitle,
} from "@/components/ui/dialog";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  Plus, Trash2, StickyNote, Loader2, Pencil, Check, X,
  User, Phone, Search,
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
  const [editingPendingIdx, setEditingPendingIdx] = useState<number | null>(null);
  const [editingText, setEditingText] = useState("");
  const [savingNote, setSavingNote] = useState(false);

  const isEdit = !!customerId;

  const initials = formData.name
    ? formData.name.split(" ").map((n) => n[0]).join("").substring(0, 2).toUpperCase()
    : null;

  const selectedCampaigns = campaigns.filter((c) =>
    formData.campaignIds.includes(c.id.toString())
  );

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
      toast({ title: "Error", description: "Failed to add note", variant: "destructive" });
    } finally {
      setAddingNote(false);
    }
  };

  const handleDeleteNote = async (noteId: number) => {
    if (!customerId) return;
    setDeletingNoteId(noteId);
    try {
      await fetchFromBackend(`/customers/${customerId}/notes/${noteId}`, { method: "DELETE" });
      onNotesChange?.(existingNotes.filter((n) => n.id !== noteId));
      toast({ title: "Note deleted" });
    } catch {
      toast({ title: "Error", description: "Failed to delete note", variant: "destructive" });
    } finally {
      setDeletingNoteId(null);
    }
  };

  const handleSaveExistingNote = async () => {
    if (!customerId || editingNoteId === null || !editingText.trim()) return;
    setSavingNote(true);
    try {
      const updated = await fetchFromBackend(`/customers/${customerId}/notes/${editingNoteId}`, {
        method: "PATCH",
        body: JSON.stringify({ content: editingText.trim() }),
      });
      onNotesChange?.(existingNotes.map((n) => n.id === editingNoteId ? { ...n, content: updated.content } : n));
      setEditingNoteId(null);
      setEditingText("");
    } catch {
      toast({ title: "Error", description: "Failed to update note", variant: "destructive" });
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
    if (value.startsWith("+1 ") && /^\+1 \d{3}-\d{3}-\d{4}$/.test(value)) return value;
    const numbers = value.replace(/\D/g, "");
    const cleaned = numbers.startsWith("1") ? numbers.slice(1) : numbers;
    if (cleaned.length === 0) return "";
    if (cleaned.length <= 3) return `+1 ${cleaned}`;
    if (cleaned.length <= 6) return `+1 ${cleaned.slice(0, 3)}-${cleaned.slice(3)}`;
    return `+1 ${cleaned.slice(0, 3)}-${cleaned.slice(3, 6)}-${cleaned.slice(6, 10)}`;
  };

  const filteredCampaigns = useMemo(() => {
    const term = campaignSearch.trim().toLowerCase();
    if (!term) return campaigns;
    return campaigns.filter((c) => c.nombre.toLowerCase().includes(term));
  }, [campaigns, campaignSearch]);

  const notes = customerId ? existingNotes : formData.pendingNotes.map((content, id) => ({ id, content, createdAt: "" }));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg p-0 gap-0 overflow-hidden rounded-2xl">
        <VisuallyHidden><DialogTitle>{title}</DialogTitle></VisuallyHidden>

        {/* Header */}
        <div className="bg-gradient-to-br from-[#008f68]/8 to-slate-50 px-6 pt-6 pb-5 border-b border-border">
          <div className="flex items-center gap-4">
            <Avatar className="h-12 w-12 shrink-0">
              <AvatarFallback className="bg-[#e2fae9] text-[#008f68] font-bold text-sm">
                {initials || <User className="h-5 w-5 text-[#008f68]" />}
              </AvatarFallback>
            </Avatar>
            <div>
              <h2 className="text-base font-semibold text-slate-900">{title}</h2>
              <p className="text-[13px] text-slate-500 mt-0.5">{description}</p>
            </div>
          </div>
        </div>

        <ScrollArea className="max-h-[60vh]">
          <div className="px-6 py-5 space-y-5">

            {/* Name + Phone */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor={`${idPrefix}-name`} className="text-[13px] font-medium text-slate-700">
                  Full Name
                </Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
                  <Input
                    id={`${idPrefix}-name`}
                    placeholder="John Doe"
                    value={formData.name}
                    onChange={(e) => {
                      onFormChange({ ...formData, name: e.target.value });
                      onValidationErrorChange({ ...validationErrors, name: "" });
                    }}
                    className={`pl-9 h-9 text-sm ${validationErrors.name ? "border-red-400 focus-visible:ring-red-400" : "border-slate-200"}`}
                  />
                </div>
                {validationErrors.name && (
                  <p className="text-xs text-red-500">{validationErrors.name}</p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor={`${idPrefix}-phone`} className="text-[13px] font-medium text-slate-700">
                  Phone <span className="text-red-400">*</span>
                </Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
                  <Input
                    id={`${idPrefix}-phone`}
                    placeholder="+1 555-000-0000"
                    value={formData.phone}
                    onChange={(e) => {
                      onFormChange({ ...formData, phone: formatPhoneNumber(e.target.value) });
                      onValidationErrorChange({ ...validationErrors, phone: "" });
                    }}
                    className={`pl-9 h-9 text-sm ${validationErrors.phone ? "border-red-400 focus-visible:ring-red-400" : "border-slate-200"}`}
                  />
                </div>
                {validationErrors.phone && (
                  <p className="text-xs text-red-500">{validationErrors.phone}</p>
                )}
              </div>
            </div>

            {/* Notes */}
            <div className="space-y-2">
              <Label className="text-[13px] font-medium text-slate-700 flex items-center gap-1.5">
                <StickyNote className="h-3.5 w-3.5 text-slate-400" />
                Notes
                <span className="text-[11px] font-normal text-slate-400">(initial persistent note)</span>
              </Label>

              <div className="flex gap-2">
                <Textarea
                  placeholder="Add a note…"
                  value={newNote}
                  rows={2}
                  onChange={(e) => setNewNote(e.target.value)}
                  className="flex-1 text-sm resize-none border-slate-200"
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      if (customerId) handleAddNote();
                      else if (newNote.trim()) {
                        onFormChange({ ...formData, pendingNotes: [newNote.trim(), ...formData.pendingNotes] });
                        setNewNote("");
                      }
                    }
                  }}
                />
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    if (customerId) handleAddNote();
                    else if (newNote.trim()) {
                      onFormChange({ ...formData, pendingNotes: [newNote.trim(), ...formData.pendingNotes] });
                      setNewNote("");
                    }
                  }}
                  disabled={addingNote || !newNote.trim()}
                  className="self-end h-9 border-slate-200"
                >
                  {addingNote ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                </Button>
              </div>

              {notes.length > 0 && (
                <div className="space-y-1.5">
                  {(customerId ? existingNotes : formData.pendingNotes).map((item, idx) => {
                    const note = typeof item === "string" ? { id: idx, content: item, createdAt: "", createdBy: undefined } : item as CustomerNote;
                    const isEditing = customerId ? editingNoteId === note.id : editingPendingIdx === idx;

                    return (
                      <div key={note.id} className="flex items-start gap-2 px-3 py-2.5 rounded-lg border border-slate-200 bg-slate-50/60 text-sm">
                        {isEditing ? (
                          <>
                            <Textarea
                              value={editingText}
                              rows={2}
                              onChange={(e) => setEditingText(e.target.value)}
                              className="flex-1 text-sm resize-none"
                              autoFocus
                              onKeyDown={(e) => {
                                if (e.key === "Enter" && !e.shiftKey) {
                                  e.preventDefault();
                                  customerId ? handleSaveExistingNote() : handleSavePendingNote();
                                }
                                if (e.key === "Escape") { setEditingNoteId(null); setEditingPendingIdx(null); setEditingText(""); }
                              }}
                            />
                            <div className="flex flex-col gap-1">
                              <Button type="button" variant="ghost" size="icon" className="h-6 w-6 text-green-600"
                                onClick={() => customerId ? handleSaveExistingNote() : handleSavePendingNote()}
                                disabled={savingNote || !editingText.trim()}>
                                {savingNote ? <Loader2 className="h-3 w-3 animate-spin" /> : <Check className="h-3 w-3" />}
                              </Button>
                              <Button type="button" variant="ghost" size="icon" className="h-6 w-6"
                                onClick={() => { setEditingNoteId(null); setEditingPendingIdx(null); setEditingText(""); }}>
                                <X className="h-3 w-3" />
                              </Button>
                            </div>
                          </>
                        ) : (
                          <>
                            <div className="flex-1 min-w-0">
                              <p className="text-slate-700 leading-snug whitespace-pre-wrap break-words">{note.content}</p>
                              {(note as CustomerNote).createdBy && (
                                <span className="text-[10px] text-amber-600 font-semibold uppercase tracking-wider">
                                  {(note as CustomerNote).createdBy}
                                </span>
                              )}
                            </div>
                            <Button type="button" variant="ghost" size="icon" className="h-6 w-6 shrink-0 text-slate-400 hover:text-slate-700"
                              onClick={() => { if (customerId) { setEditingNoteId(note.id); } else { setEditingPendingIdx(idx); } setEditingText(note.content); }}>
                              <Pencil className="h-3 w-3" />
                            </Button>
                            <Button type="button" variant="ghost" size="icon" className="h-6 w-6 shrink-0 text-red-400 hover:text-red-600"
                              onClick={() => customerId ? handleDeleteNote(note.id) : onFormChange({ ...formData, pendingNotes: formData.pendingNotes.filter((_, i) => i !== idx) })}
                              disabled={deletingNoteId === note.id}>
                              {deletingNoteId === note.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <Trash2 className="h-3 w-3" />}
                            </Button>
                          </>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Campaigns */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-[13px] font-medium text-slate-700">Campaigns</Label>
                {selectedCampaigns.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {selectedCampaigns.map((c) => (
                      <Badge key={c.id} variant="secondary" className="text-[11px] bg-[#e2fae9] text-[#008f68] border-0 pr-1">
                        {c.nombre}
                        <button
                          className="ml-1 hover:text-red-500"
                          onClick={() => onFormChange({ ...formData, campaignIds: formData.campaignIds.filter((id) => id !== c.id.toString()) })}
                        >
                          <X className="h-2.5 w-2.5" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                )}
              </div>

              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
                <Input
                  placeholder="Search campaigns…"
                  value={campaignSearch}
                  onChange={(e) => setCampaignSearch(e.target.value)}
                  className="pl-9 h-9 text-sm border-slate-200"
                />
              </div>

              <div className="rounded-lg border border-slate-200 divide-y divide-slate-100 max-h-36 overflow-y-auto">
                {filteredCampaigns.length === 0 ? (
                  <p className="px-3 py-3 text-sm text-slate-400 text-center">No campaigns found</p>
                ) : (
                  filteredCampaigns.map((campaign) => {
                    const value = campaign.id.toString();
                    const checked = formData.campaignIds.includes(value);
                    return (
                      <label key={campaign.id} className={`flex items-center gap-3 px-3 py-2 cursor-pointer hover:bg-slate-50 transition-colors ${checked ? "bg-[#f0fdf8]" : ""}`}>
                        <Checkbox
                          checked={checked}
                          onCheckedChange={(next) => {
                            const campaignIds = Boolean(next)
                              ? [...formData.campaignIds, value]
                              : formData.campaignIds.filter((id) => id !== value);
                            onFormChange({ ...formData, campaignIds });
                          }}
                          className="data-[state=checked]:bg-[#008f68] data-[state=checked]:border-[#008f68]"
                        />
                        <span className="text-sm text-slate-700">{campaign.nombre}</span>
                      </label>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        </ScrollArea>

        {/* Footer */}
        <DialogFooter className="px-6 py-4 border-t border-border bg-slate-50/60">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting} className="border-slate-200 text-slate-600">
            Cancel
          </Button>
          <Button
            onClick={onSubmit}
            disabled={isSubmitting}
            className="bg-[#008f68] hover:bg-[#007a5a] text-white min-w-[120px]"
          >
            {isSubmitting ? (
              <><Loader2 className="h-4 w-4 animate-spin mr-2" />{submitLabel}…</>
            ) : submitLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
