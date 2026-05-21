"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import {
  Plus,
  Trash2,
  StickyNote,
  Loader2,
  Pencil,
  Check,
  X,
  User,
  Phone,
  Search,
  Pin,
  RotateCcw,
} from "lucide-react";
import { cn } from "@/lib/utils";
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

interface FieldShellProps {
  id: string;
  label: string;
  required?: boolean;
  error?: string;
  hint?: string;
  className?: string;
  children: ReactNode;
}

function FieldShell({
  id,
  label,
  required,
  error,
  hint,
  className,
  children,
}: FieldShellProps) {
  return (
    <div className={cn("space-y-2", className)}>
      <label
        htmlFor={id}
        className="block text-[13px] font-semibold leading-none text-slate-900 dark:text-slate-100"
      >
        {label}
        {required && <span className="ml-1 text-red-500">*</span>}
      </label>
      {children}
      {hint && !error ? (
        <p className="text-[12px] text-slate-500 dark:text-slate-400">{hint}</p>
      ) : null}
      {error ? (
        <p className="text-[12px] font-medium text-red-500" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
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

  const fieldInput =
    "h-11 rounded-md border-slate-200 bg-white text-sm text-slate-900 placeholder:text-slate-400 shadow-none transition-colors " +
    "focus-visible:border-[#008f68] focus-visible:ring-2 focus-visible:ring-[#008f68]/15 " +
    "dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:placeholder:text-slate-500";

  const fieldTextarea =
    "min-h-[96px] resize-none rounded-md border-slate-200 bg-white text-sm text-slate-900 placeholder:text-slate-400 shadow-none transition-colors " +
    "focus-visible:border-[#008f68] focus-visible:ring-2 focus-visible:ring-[#008f68]/15 " +
    "dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:placeholder:text-slate-500";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[calc(100dvh-2rem)] max-w-[calc(100%-1.5rem)] gap-0 overflow-hidden rounded-2xl border-slate-200 bg-white p-0 shadow-2xl sm:max-w-[760px] dark:border-slate-800 dark:bg-slate-950">
        <DialogHeader className="border-b border-slate-100 px-5 py-4 pr-12 text-left sm:px-6 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-dashed border-slate-200 bg-slate-50 text-slate-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300">
              <User className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <DialogTitle className="text-[15px] font-semibold leading-5 text-slate-950 dark:text-slate-50">
                {title}
              </DialogTitle>
              <DialogDescription className="mt-1 text-[13px] leading-5 text-slate-500 dark:text-slate-400">
                {description}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="max-h-[68dvh] overflow-y-auto px-5 py-5 sm:px-6">
          <div className="grid gap-x-5 gap-y-4 sm:grid-cols-2">
            <FieldShell
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
                  fieldInput,
                  validationErrors.name &&
                    "border-red-400 focus-visible:border-red-400 focus-visible:ring-red-100",
                )}
              />
            </FieldShell>

            <FieldShell
              id={`${idPrefix}-phone`}
              label="Phone"
              required
              error={validationErrors.phone}
            >
              <div className="relative">
                <Phone className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
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
                    fieldInput,
                    "pl-9",
                    validationErrors.phone &&
                      "border-red-400 focus-visible:border-red-400 focus-visible:ring-red-100",
                  )}
                />
              </div>
            </FieldShell>

            <FieldShell
              id={`${idPrefix}-pinnedNote`}
              label="Pinned note"
              className="sm:col-span-2"
              hint="Visible to all agents on this phone number"
            >
              <div className="relative">
                <Pin className="pointer-events-none absolute left-3 top-3.5 h-4 w-4 text-amber-500" />
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
                  className={cn(fieldTextarea, "border-amber-200/80 pl-9")}
                />
              </div>
            </FieldShell>

            <div className="space-y-2 sm:col-span-2">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <label className="block text-[13px] font-semibold leading-none text-slate-900 dark:text-slate-100">
                  Campaigns
                </label>
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

              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <Input
                  placeholder="Search campaigns…"
                  value={campaignSearch}
                  onChange={(e) => setCampaignSearch(e.target.value)}
                  className={cn(fieldInput, "pl-9")}
                />
              </div>

              <div className="max-h-36 overflow-y-auto rounded-md border border-slate-200 divide-y divide-slate-100 dark:border-slate-700 dark:divide-slate-800">
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
                          "flex cursor-pointer items-center gap-3 px-3 py-2.5 transition-colors hover:bg-slate-50 dark:hover:bg-slate-900/50",
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
                        <span className="text-sm text-slate-700 dark:text-slate-200">
                          {campaign.nombre}
                        </span>
                      </label>
                    );
                  })
                )}
              </div>
            </div>

            <FieldShell
              id={`${idPrefix}-auditNotes`}
              label="Audit notes"
              className="sm:col-span-2"
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
                  <div className="relative">
                    <StickyNote className="pointer-events-none absolute left-3 top-3.5 h-4 w-4 text-slate-400" />
                    <Textarea
                      placeholder="Add an audit note…"
                      value={newNote}
                      rows={3}
                      onChange={(e) => setNewNote(e.target.value)}
                      className={cn(fieldTextarea, "pl-9")}
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
                  </div>
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
                      className="h-9 border-slate-200"
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
                            className="flex items-start gap-2 rounded-md border border-slate-200 bg-slate-50/80 px-3 py-2.5 text-sm dark:border-slate-700 dark:bg-slate-900/40"
                          >
                            {isEditing ? (
                              <>
                                <Textarea
                                  value={editingText}
                                  rows={2}
                                  onChange={(e) => setEditingText(e.target.value)}
                                  className={cn(fieldTextarea, "min-h-[72px] flex-1")}
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
                                <p className="min-w-0 flex-1 whitespace-pre-wrap break-words leading-snug text-slate-700 dark:text-slate-200">
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
            </FieldShell>
          </div>
        </div>

        <div className="flex flex-col gap-3 border-t border-slate-100 bg-slate-50/80 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6 dark:border-slate-800 dark:bg-slate-900/60">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSubmitting}
            className="h-11 rounded-lg border-slate-200 bg-white px-5 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200 dark:hover:bg-slate-900"
          >
            Cancel
          </Button>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            {onReset ? (
              <Button
                type="button"
                variant="outline"
                onClick={onReset}
                disabled={isSubmitting}
                className="h-11 rounded-lg border-slate-200 bg-white px-5 text-sm font-semibold text-slate-400 shadow-sm hover:bg-white hover:text-slate-600 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-500 dark:hover:text-slate-300"
              >
                <RotateCcw className="mr-2 h-4 w-4" />
                Reset Data
              </Button>
            ) : null}
            <Button
              type="button"
              onClick={onSubmit}
              disabled={isSubmitting}
              className={cn(
                "h-11 rounded-lg px-6 text-sm font-semibold text-white shadow-sm disabled:opacity-60",
                idPrefix === "create"
                  ? "bg-[#008f68] hover:bg-[#007a5a] dark:bg-[#008f68] dark:hover:bg-[#007a5a]"
                  : "bg-slate-700 hover:bg-slate-800 dark:bg-slate-200 dark:text-slate-950 dark:hover:bg-white",
              )}
            >
              {isSubmitting && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              {isSubmitting ? "Saving..." : submitLabel}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
