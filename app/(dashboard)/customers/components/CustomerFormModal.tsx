"use client";

import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Plus, Trash2, Pencil, Check, X, User } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  EntityFormCard,
  EntityFormDialogFooter,
  EntityFormDialogShell,
  EntityFormField,
  EntityFormGrid,
  EntityFormSectionHeading,
  entityFormInputClassName,
  entityFormInputErrorClass,
  entityFormTextareaClassName,
} from "@/components/forms/entity-form-layout";
import {
  CampaignOption,
  CustomerFormData,
  CustomerNote,
} from "../types";
import { fetchCustomerNotes, splitCustomerNotes } from "../utils/notes";
import { CustomerNotesList } from "./CustomerNotesList";

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
  onReset?: () => void;
  campaigns: CampaignOption[];
  idPrefix: string;
  customerId?: number;
  existingNotes?: CustomerNote[];
  onNotesChange?: (notes: CustomerNote[]) => void;
  showPlaceholders?: boolean;
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
  onReset,
  campaigns,
  idPrefix,
  customerId,
  existingNotes = [],
  onNotesChange,
  showPlaceholders = false,
}: CustomerFormModalProps) {
  const [campaignSearch, setCampaignSearch] = useState("");
  const [newNote, setNewNote] = useState("");
  const [editingPendingIdx, setEditingPendingIdx] = useState<number | null>(
    null,
  );
  const [editingText, setEditingText] = useState("");
  const [editNotes, setEditNotes] = useState<CustomerNote[]>([]);
  const [notesLoading, setNotesLoading] = useState(false);

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
        const next = fetched.length > 0 ? fetched : existingNotes;
        const { audit } = splitCustomerNotes(next);
        setEditNotes(audit);
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, customerId]);

  useEffect(() => {
    if (open && customerId && existingNotes.length > 0) {
      setEditNotes((prev) => (prev.length === 0 ? existingNotes : prev));
    }
  }, [open, customerId, existingNotes]);

  const selectedCampaigns = campaigns.filter((c) =>
    formData.campaignIds.includes(c.id.toString()),
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
    if (value.startsWith("+1 ") && /^\+1 \d{3}-\d{3}-\d{4}$/.test(value)) {
      return value;
    }
    const numbers = value.replace(/\D/g, "");
    const cleaned = numbers.startsWith("1") ? numbers.slice(1) : numbers;
    if (cleaned.length === 0) return "";
    if (cleaned.length <= 3) return `+1 ${cleaned}`;
    if (cleaned.length <= 6)
      return `+1 ${cleaned.slice(0, 3)}-${cleaned.slice(3)}`;
    return `+1 ${cleaned.slice(0, 3)}-${cleaned.slice(3, 6)}-${cleaned.slice(6, 10)}`;
  };

  const filteredCampaigns = useMemo(() => {
    const term = campaignSearch.trim().toLowerCase();
    if (!term) return campaigns;
    return campaigns.filter((c) => c.nombre.toLowerCase().includes(term));
  }, [campaigns, campaignSearch]);

  const clearError = (key: string) => {
    if (validationErrors[key]) {
      onValidationErrorChange({ ...validationErrors, [key]: "" });
    }
  };

  return (
    <EntityFormDialogShell
      open={open}
      onOpenChange={onOpenChange}
      title={title}
      description={description}
      icon={User}
      footer={
        <EntityFormDialogFooter
          onCancel={() => onOpenChange(false)}
          onSubmit={onSubmit}
          submitLabel={submitLabel}
          isSubmitting={isSubmitting}
          onReset={onReset}
          resetLabel="Reset Data"
          submitVariant={idPrefix === "create" ? "create" : "edit"}
        />
      }
    >
      <EntityFormCard title="Customer Details & Properties" icon={User}>
        <EntityFormSectionHeading>Customer Information</EntityFormSectionHeading>
        <EntityFormGrid>
            <EntityFormField
              id={`${idPrefix}-name`}
              label="Full Name"
              error={validationErrors.name}
            >
              <Input
                id={`${idPrefix}-name`}
                value={formData.name}
                onChange={(e) => {
                  onFormChange({ ...formData, name: e.target.value });
                  clearError("name");
                }}
                placeholder={showPlaceholders ? "John Doe" : undefined}
                className={cn(
                  entityFormInputClassName,
                  entityFormInputErrorClass(!!validationErrors.name),
                )}
              />
            </EntityFormField>

            <EntityFormField
              id={`${idPrefix}-phone`}
              label="Phone"
              required
              error={validationErrors.phone}
            >
              <Input
                  id={`${idPrefix}-phone`}
                  value={formData.phone}
                  onChange={(e) => {
                    onFormChange({
                      ...formData,
                      phone: formatPhoneNumber(e.target.value),
                    });
                    clearError("phone");
                  }}
                  placeholder="+1 XXX-XXX-XXXX"
                  className={cn(
                    entityFormInputClassName,
                    entityFormInputErrorClass(!!validationErrors.phone),
                  )}
                />
            </EntityFormField>

            <EntityFormField
              id={`${idPrefix}-pinnedNote`}
              label="Pinned note"
              className="col-span-2"
              hint="Visible to all agents on this phone number"
            >
                <Textarea
                  id={`${idPrefix}-pinnedNote`}
                  value={formData.pinnedNote}
                  onChange={(e) =>
                    onFormChange({ ...formData, pinnedNote: e.target.value })
                  }
                  placeholder={
                    showPlaceholders
                      ? "Gate code, billing context, or handling instructions…"
                      : undefined
                  }
                  rows={3}
                  className={cn(entityFormTextareaClassName, "border-amber-200/60")}
                />
            </EntityFormField>
        </EntityFormGrid>

        <EntityFormSectionHeading>Campaigns</EntityFormSectionHeading>
            <div className="space-y-2">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                  Linked campaigns
                </span>
                {selectedCampaigns.length > 0 ? (
                  <div className="flex flex-wrap gap-1">
                    {selectedCampaigns.map((c) => (
                      <Badge
                        key={c.id}
                        variant="secondary"
                        className="border-0 bg-[#e2fae9] pr-1 text-[11px] text-[#008f68]"
                      >
                        {c.nombre}
                        <button
                          type="button"
                          className="ml-1 hover:text-red-500"
                          onClick={() =>
                            onFormChange({
                              ...formData,
                              campaignIds: formData.campaignIds.filter(
                                (id) => id !== c.id.toString(),
                              ),
                            })
                          }
                        >
                          <X className="h-2.5 w-2.5" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                ) : null}
              </div>

              <Input
                placeholder="Search campaigns…"
                value={campaignSearch}
                onChange={(e) => setCampaignSearch(e.target.value)}
                className={entityFormInputClassName}
              />

              <div className="max-h-36 overflow-y-auto rounded-lg border border-slate-100 divide-y divide-slate-50 dark:border-neutral-800 dark:divide-neutral-800">
                {filteredCampaigns.length === 0 ? (
                  <p className="px-3 py-3 text-center text-sm text-slate-400">
                    No campaigns found
                  </p>
                ) : (
                  filteredCampaigns.map((campaign) => {
                    const value = campaign.id.toString();
                    const checked = formData.campaignIds.includes(value);
                    return (
                      <label
                        key={campaign.id}
                        className={cn(
                          "flex cursor-pointer items-center gap-3 px-3 py-2.5 transition-colors hover:bg-slate-50 dark:hover:bg-neutral-900/50",
                          checked && "bg-[#f0fdf8] dark:bg-emerald-950/20",
                        )}
                      >
                        <Checkbox
                          checked={checked}
                          onCheckedChange={(next) => {
                            const campaignIds = Boolean(next)
                              ? [...formData.campaignIds, value]
                              : formData.campaignIds.filter((id) => id !== value);
                            onFormChange({ ...formData, campaignIds });
                          }}
                          className="data-[state=checked]:border-[#008f68] data-[state=checked]:bg-[#008f68]"
                        />
                        <span className="text-sm text-slate-700 dark:text-neutral-200">
                          {campaign.nombre}
                        </span>
                      </label>
                    );
                  })
                )}
              </div>
            </div>

        <EntityFormSectionHeading>Notes</EntityFormSectionHeading>
            <EntityFormField
              id={`${idPrefix}-auditNotes`}
              label="Audit Notes"
              hint="Internal trail — not shown as the pinned note"
            >
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
                <div className="space-y-2">
                    <Textarea
                      placeholder="Add an audit note…"
                      value={newNote}
                      rows={3}
                      onChange={(e) => setNewNote(e.target.value)}
                      className={entityFormTextareaClassName}
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
                  <div className="flex justify-end">
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
                      className="h-9 border-slate-200 dark:border-neutral-700"
                    >
                      <Plus className="mr-1 h-4 w-4" />
                      Add note
                    </Button>
                  </div>
                  {formData.pendingNotes.length > 0 ? (
                    <div className="space-y-1.5">
                      {formData.pendingNotes.map((content, idx) => {
                        const isEditing = editingPendingIdx === idx;
                        return (
                          <div
                            key={`${idx}-${content.slice(0, 8)}`}
                            className="flex items-start gap-2 rounded-md border border-slate-200 bg-slate-50/80 px-3 py-2.5 text-sm dark:border-neutral-700 dark:bg-neutral-900/40"
                          >
                            {isEditing ? (
                              <>
                                <Textarea
                                  value={editingText}
                                  rows={2}
                                  onChange={(e) => setEditingText(e.target.value)}
                                  className={cn(entityFormTextareaClassName, "min-h-[72px] flex-1")}
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
                                    className="h-7 w-7 text-green-600"
                                    onClick={handleSavePendingNote}
                                    disabled={!editingText.trim()}
                                  >
                                    <Check className="h-3.5 w-3.5" />
                                  </Button>
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    className="h-7 w-7"
                                    onClick={() => {
                                      setEditingPendingIdx(null);
                                      setEditingText("");
                                    }}
                                  >
                                    <X className="h-3.5 w-3.5" />
                                  </Button>
                                </div>
                              </>
                            ) : (
                              <>
                                <p className="min-w-0 flex-1 whitespace-pre-wrap break-words leading-snug text-slate-700 dark:text-neutral-200">
                                  {content}
                                </p>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="icon"
                                  className="h-7 w-7 shrink-0 text-slate-400"
                                  onClick={() => {
                                    setEditingPendingIdx(idx);
                                    setEditingText(content);
                                  }}
                                >
                                  <Pencil className="h-3.5 w-3.5" />
                                </Button>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="icon"
                                  className="h-7 w-7 shrink-0 text-red-400"
                                  onClick={() =>
                                    onFormChange({
                                      ...formData,
                                      pendingNotes: formData.pendingNotes.filter(
                                        (_, i) => i !== idx,
                                      ),
                                    })
                                  }
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </Button>
                              </>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  ) : null}
                </div>
              )}
            </EntityFormField>
      </EntityFormCard>
    </EntityFormDialogShell>
  );
}
