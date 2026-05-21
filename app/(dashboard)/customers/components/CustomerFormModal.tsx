"use client";

import { useEffect, useMemo, useState } from "react";
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
import { fetchCustomerNotes } from "../utils/notes";
import { CustomerNotesList } from "./CustomerNotesList";
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
  const [editingPendingIdx, setEditingPendingIdx] = useState<number | null>(null);
  const [editingText, setEditingText] = useState("");
  const [editNotes, setEditNotes] = useState<CustomerNote[]>([]);
  const [notesLoading, setNotesLoading] = useState(false);

  const isEdit = !!customerId;

  useEffect(() => {
    if (!open || !customerId) {
      setEditNotes([]);
      setNotesLoading(false);
      return;
    }

    let cancelled = false;
    setNotesLoading(true);

    fetchCustomerNotes(customerId)
      .then((fetched) => {
        if (cancelled) return;
        const next =
          fetched.length > 0 ? fetched : existingNotes;
        setEditNotes(next);
        if (fetched.length > 0) {
          onNotesChange?.(fetched);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setEditNotes(existingNotes);
        }
      })
      .finally(() => {
        if (!cancelled) setNotesLoading(false);
      });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- reload when modal opens for this customer
  }, [open, customerId]);

  useEffect(() => {
    if (open && customerId && existingNotes.length > 0) {
      setEditNotes((prev) => (prev.length === 0 ? existingNotes : prev));
    }
  }, [open, customerId, existingNotes]);

  const initials = formData.name
    ? formData.name.split(" ").map((n) => n[0]).join("").substring(0, 2).toUpperCase()
    : null;

  const selectedCampaigns = campaigns.filter((c) =>
    formData.campaignIds.includes(c.id.toString())
  );

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
              <Label className="flex items-center gap-1.5 text-[13px] font-medium text-slate-700">
                <StickyNote className="h-3.5 w-3.5 text-slate-400" />
                Notes
                <span className="text-[11px] font-normal text-slate-400">
                  (audit trail)
                </span>
              </Label>

              {customerId ? (
                <CustomerNotesList
                  customerId={customerId}
                  notes={editNotes}
                  loading={notesLoading}
                  onNotesChange={(notes) => {
                    setEditNotes(notes);
                    onNotesChange?.(notes);
                  }}
                  variant="form"
                  canEdit
                />
              ) : (
                <>
                  <div className="flex gap-2">
                    <Textarea
                      placeholder="Add a note…"
                      value={newNote}
                      rows={2}
                      onChange={(e) => setNewNote(e.target.value)}
                      className="flex-1 resize-none border-slate-200 text-sm"
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && !e.shiftKey) {
                          e.preventDefault();
                          if (newNote.trim()) {
                            onFormChange({
                              ...formData,
                              pendingNotes: [
                                newNote.trim(),
                                ...formData.pendingNotes,
                              ],
                            });
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
                        if (newNote.trim()) {
                          onFormChange({
                            ...formData,
                            pendingNotes: [
                              newNote.trim(),
                              ...formData.pendingNotes,
                            ],
                          });
                          setNewNote("");
                        }
                      }}
                      disabled={!newNote.trim()}
                      className="h-9 self-end border-slate-200"
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                  {formData.pendingNotes.length > 0 ? (
                    <div className="space-y-1.5">
                      {formData.pendingNotes.map((content, idx) => {
                        const isEditing = editingPendingIdx === idx;
                        return (
                          <div
                            key={`${idx}-${content.slice(0, 8)}`}
                            className="flex items-start gap-2 rounded-lg border border-slate-200 bg-slate-50/60 px-3 py-2.5 text-sm"
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
                                      handleSavePendingNote();
                                    }
                                    if (e.key === "Escape") {
                                      setEditingPendingIdx(null);
                                      setEditingText("");
                                    }
                                  }}
                                />
                                <div className="flex flex-col gap-1">
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    className="h-6 w-6 text-green-600"
                                    onClick={handleSavePendingNote}
                                    disabled={!editingText.trim()}
                                  >
                                    <Check className="h-3 w-3" />
                                  </Button>
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    className="h-6 w-6"
                                    onClick={() => {
                                      setEditingPendingIdx(null);
                                      setEditingText("");
                                    }}
                                  >
                                    <X className="h-3 w-3" />
                                  </Button>
                                </div>
                              </>
                            ) : (
                              <>
                                <p className="min-w-0 flex-1 whitespace-pre-wrap break-words leading-snug text-slate-700">
                                  {content}
                                </p>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="icon"
                                  className="h-6 w-6 shrink-0 text-slate-400"
                                  onClick={() => {
                                    setEditingPendingIdx(idx);
                                    setEditingText(content);
                                  }}
                                >
                                  <Pencil className="h-3 w-3" />
                                </Button>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="icon"
                                  className="h-6 w-6 shrink-0 text-red-400"
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
                        );
                      })}
                    </div>
                  ) : null}
                </>
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
