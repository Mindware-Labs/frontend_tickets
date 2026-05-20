"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import { Phone, Tag, CircleDot, Loader2 } from "lucide-react";
import { PhoneLineFormData } from "../types";

interface PhoneLineFormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  submitLabel: string;
  isSubmitting: boolean;
  formData: PhoneLineFormData;
  onFormChange: (next: PhoneLineFormData) => void;
  validationErrors: Record<string, string>;
  onValidationErrorChange: (next: Record<string, string>) => void;
  onSubmit: () => void;
  idPrefix: string;
}

function formatPhoneNumber(value: string): string {
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
}

export function PhoneLineFormModal({
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
  idPrefix,
}: PhoneLineFormModalProps) {
  const handlePhoneChange = (value: string) => {
    const formatted = formatPhoneNumber(value);
    onFormChange({ ...formData, phoneNumber: formatted });
    if (validationErrors.phoneNumber) {
      onValidationErrorChange({ ...validationErrors, phoneNumber: "" });
    }
  };

  const fieldInput = (
    "h-9 rounded-lg border-[#e2e8f0] bg-white text-[13px] text-slate-700 placeholder:text-slate-300 shadow-none " +
    "focus-visible:ring-1 focus-visible:ring-[#008f68]/30 focus-visible:border-[#008f68]/40 " +
    "dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:placeholder:text-slate-600"
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md p-0 gap-0 rounded-xl border-[#e2e8f0] shadow-xl overflow-hidden dark:border-slate-700">
        {/* Header */}
        <DialogHeader className="px-5 pt-5 pb-4 border-b border-[#e2e8f0] dark:border-slate-700">
          <DialogTitle className="text-[15px] font-semibold text-slate-800 dark:text-slate-100">
            {title}
          </DialogTitle>
          <p className="text-[12px] text-slate-400 dark:text-slate-500 mt-0.5">{description}</p>
        </DialogHeader>

        {/* Body */}
        <div className="px-5 py-4 space-y-3.5">
          {/* Phone Number */}
          <div className="space-y-1">
            <label htmlFor={`${idPrefix}-phone`} className="flex items-center gap-1.5 text-[11px] font-medium text-slate-500 uppercase tracking-wide dark:text-slate-400">
              <Phone className="h-3 w-3" />
              Phone Number <span className="text-red-400">*</span>
            </label>
            <Input
              id={`${idPrefix}-phone`}
              placeholder="+1 XXX-XXX-XXXX"
              value={formData.phoneNumber}
              onChange={(e) => handlePhoneChange(e.target.value)}
              className={cn(fieldInput, "font-mono", validationErrors.phoneNumber && "border-red-400 focus-visible:ring-red-200")}
            />
            {validationErrors.phoneNumber && (
              <p className="text-[10.5px] text-red-500 mt-0.5">{validationErrors.phoneNumber}</p>
            )}
          </div>

          {/* Label */}
          <div className="space-y-1">
            <label htmlFor={`${idPrefix}-label`} className="flex items-center gap-1.5 text-[11px] font-medium text-slate-500 uppercase tracking-wide dark:text-slate-400">
              <Tag className="h-3 w-3" />
              Label
            </label>
            <Input
              id={`${idPrefix}-label`}
              placeholder="e.g. Rig Hut – Main Office"
              value={formData.label}
              onChange={(e) => onFormChange({ ...formData, label: e.target.value })}
              className={fieldInput}
            />
          </div>

          {/* Active toggle */}
          <div className="flex items-center justify-between rounded-lg border border-[#e2e8f0] p-3.5 bg-slate-50/50 dark:border-slate-700 dark:bg-slate-900/50">
            <div className="space-y-0.5">
              <label className="flex items-center gap-1.5 text-[11px] font-medium text-slate-500 uppercase tracking-wide dark:text-slate-400">
                <CircleDot className="h-3 w-3" />
                Active
              </label>
              <p className="text-[11px] text-slate-400 dark:text-slate-500">
                Inactive lines won't generate tickets from Aircall
              </p>
            </div>
            <Switch
              checked={formData.isActive}
              onCheckedChange={(checked) =>
                onFormChange({ ...formData, isActive: checked })
              }
            />
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-center gap-2 px-5 py-3.5 border-t border-[#e2e8f0] bg-slate-50/50 dark:border-slate-700 dark:bg-slate-900/50">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onOpenChange(false)}
            disabled={isSubmitting}
            className="h-9 px-6 rounded-lg text-[13px] font-medium text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
          >
            Cancel
          </Button>
          <Button
            size="sm"
            onClick={onSubmit}
            disabled={isSubmitting}
            className="h-9 px-8 rounded-lg text-[13px] font-medium bg-[#008f68] hover:bg-[#007a5a] text-white shadow-sm"
          >
            {isSubmitting && <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />}
            {isSubmitting ? "Saving..." : submitLabel}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
