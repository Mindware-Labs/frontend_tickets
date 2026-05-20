"use client";

import type { ReactNode } from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogDescription,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import {
  MapPin,
  Link2,
  Building2,
  StickyNote,
  Loader2,
  RotateCcw,
} from "lucide-react";
import { YardFormData } from "../types";

interface YardFormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  submitLabel: string;
  isSubmitting: boolean;
  formData: YardFormData;
  onFormChange: (next: YardFormData) => void;
  validationErrors: Record<string, string>;
  onValidationErrorChange: (next: Record<string, string>) => void;
  onSubmit: () => void;
  onReset?: () => void;
  idPrefix: string;
  showPlaceholders?: boolean;
}

interface FieldShellProps {
  id: string;
  label: string;
  required?: boolean;
  error?: string;
  className?: string;
  children: ReactNode;
}

function FieldShell({
  id,
  label,
  required,
  error,
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
      {error && (
        <p className="text-[12px] font-medium text-red-500" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}

export function YardFormModal({
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
  idPrefix,
  showPlaceholders = false,
}: YardFormModalProps) {
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

  const clearError = (key: string) => {
    if (validationErrors[key]) {
      onValidationErrorChange({ ...validationErrors, [key]: "" });
    }
  };

  const fieldInput = (
    "h-11 rounded-md border-slate-200 bg-white text-sm text-slate-900 placeholder:text-slate-400 shadow-none transition-colors " +
    "focus-visible:border-[#008f68] focus-visible:ring-2 focus-visible:ring-[#008f68]/15 " +
    "dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:placeholder:text-slate-500"
  );

  const fieldSelect = (
    "h-11 w-full min-w-0 justify-between rounded-md border-slate-200 bg-white px-4 text-sm font-medium text-slate-900 shadow-none transition-colors " +
    "focus:border-[#008f68] focus:ring-2 focus:ring-[#008f68]/15 " +
    "dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
  );

  const selectContent =
    "w-[var(--radix-select-trigger-width)] rounded-lg border-slate-200 dark:border-slate-700";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[calc(100dvh-2rem)] max-w-[calc(100%-1.5rem)] gap-0 overflow-hidden rounded-2xl border-slate-200 bg-white p-0 shadow-2xl sm:max-w-[760px] dark:border-slate-800 dark:bg-slate-950">
        <DialogHeader className="border-b border-slate-100 px-5 py-4 pr-12 text-left sm:px-6 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-dashed border-slate-200 bg-slate-50 text-slate-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300">
              <Building2 className="h-5 w-5" />
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
              label="Yard Name"
              required
              error={validationErrors.name}
            >
              <Input
                id={`${idPrefix}-name`}
                value={formData.name}
                onChange={(e) => {
                  onFormChange({ ...formData, name: e.target.value });
                  clearError("name");
                }}
                placeholder={showPlaceholders ? "278 Ellis Road" : undefined}
                className={cn(
                  fieldInput,
                  validationErrors.name &&
                    "border-red-400 focus-visible:border-red-400 focus-visible:ring-red-100",
                )}
              />
            </FieldShell>

            <FieldShell
              id={`${idPrefix}-commonName`}
              label="Common Name"
              required
              error={validationErrors.commonName}
            >
              <Input
                id={`${idPrefix}-commonName`}
                value={formData.commonName}
                onChange={(e) => {
                  onFormChange({ ...formData, commonName: e.target.value });
                  clearError("commonName");
                }}
                placeholder={showPlaceholders ? "Parking Kingdom Jacksonville" : undefined}
                className={cn(
                  fieldInput,
                  validationErrors.commonName &&
                    "border-red-400 focus-visible:border-red-400 focus-visible:ring-red-100",
                )}
              />
            </FieldShell>

            <FieldShell
              id={`${idPrefix}-contactInfo`}
              label="Contact Phone"
              required
              error={validationErrors.contactInfo}
            >
              <Input
                id={`${idPrefix}-contactInfo`}
                value={formData.contactInfo}
                onChange={(e) => {
                  const formatted = formatPhoneNumber(e.target.value);
                  onFormChange({ ...formData, contactInfo: formatted });
                  clearError("contactInfo");
                }}
                placeholder="+1 XXX-XXX-XXXX"
                className={cn(
                  fieldInput,
                  validationErrors.contactInfo &&
                    "border-red-400 focus-visible:border-red-400 focus-visible:ring-red-100",
                )}
              />
            </FieldShell>

            <FieldShell id={`${idPrefix}-yardType`} label="Yard Type" required>
              <Select
                value={formData.yardType}
                onValueChange={(value: "SAAS" | "FULL_SERVICE") =>
                  onFormChange({ ...formData, yardType: value })
                }
              >
                <SelectTrigger id={`${idPrefix}-yardType`} className={fieldSelect}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className={selectContent}>
                  <SelectItem value="SAAS" className="h-9">
                    SaaS
                  </SelectItem>
                  <SelectItem value="FULL_SERVICE" className="h-9">
                    Full Service
                  </SelectItem>
                </SelectContent>
              </Select>
            </FieldShell>

            <FieldShell
              id={`${idPrefix}-propertyAddress`}
              label="Property Address"
              required
              error={validationErrors.propertyAddress}
              className="sm:col-span-2"
            >
              <div className="relative">
                <MapPin className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <Input
                  id={`${idPrefix}-propertyAddress`}
                  value={formData.propertyAddress}
                  onChange={(e) => {
                    onFormChange({
                      ...formData,
                      propertyAddress: e.target.value,
                    });
                    clearError("propertyAddress");
                  }}
                  placeholder={
                    showPlaceholders
                      ? "278 Ellis Rd N, Jacksonville, FL 32254"
                      : undefined
                  }
                  className={cn(
                    fieldInput,
                    "pl-9",
                    validationErrors.propertyAddress &&
                      "border-red-400 focus-visible:border-red-400 focus-visible:ring-red-100",
                  )}
                />
              </div>
            </FieldShell>

            <FieldShell id={`${idPrefix}-yardLink`} label="Yard Link">
              <div className="relative">
                <Link2 className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <Input
                  id={`${idPrefix}-yardLink`}
                  value={formData.yardLink}
                  onChange={(e) =>
                    onFormChange({ ...formData, yardLink: e.target.value })
                  }
                  placeholder={showPlaceholders ? "https://example.com" : undefined}
                  className={cn(fieldInput, "pl-9")}
                />
              </div>
            </FieldShell>

            <FieldShell id={`${idPrefix}-isActive`} label="Status">
              <Select
                value={formData.isActive ? "active" : "inactive"}
                onValueChange={(value) =>
                  onFormChange({ ...formData, isActive: value === "active" })
                }
              >
                <SelectTrigger id={`${idPrefix}-isActive`} className={fieldSelect}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className={selectContent}>
                  <SelectItem value="active" className="h-9">
                    Active
                  </SelectItem>
                  <SelectItem value="inactive" className="h-9">
                    Inactive
                  </SelectItem>
                </SelectContent>
              </Select>
            </FieldShell>

            <FieldShell id={`${idPrefix}-notes`} label="Notes" className="sm:col-span-2">
              <div className="relative">
                <StickyNote className="pointer-events-none absolute left-3 top-3.5 h-4 w-4 text-slate-400" />
                <Textarea
                  id={`${idPrefix}-notes`}
                  value={formData.notes}
                  onChange={(e) =>
                    onFormChange({ ...formData, notes: e.target.value })
                  }
                  placeholder={showPlaceholders ? "Add yard access notes, contacts, or internal details" : undefined}
                  rows={4}
                  className={
                    "min-h-[112px] resize-none rounded-md border-slate-200 bg-white pl-9 text-sm text-slate-900 placeholder:text-slate-400 shadow-none transition-colors " +
                    "focus-visible:border-[#008f68] focus-visible:ring-2 focus-visible:ring-[#008f68]/15 " +
                    "dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:placeholder:text-slate-500"
                  }
                />
              </div>
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
            {onReset && (
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
            )}
            <Button
              type="button"
              onClick={onSubmit}
              disabled={isSubmitting}
              className="h-11 rounded-lg bg-slate-700 px-6 text-sm font-semibold text-white shadow-sm hover:bg-slate-800 disabled:opacity-60 dark:bg-slate-200 dark:text-slate-950 dark:hover:bg-white"
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
