"use client";

import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import { Phone } from "lucide-react";
import {
  EntityFormCard,
  EntityFormDialogFooter,
  EntityFormDialogShell,
  EntityFormField,
  EntityFormSectionHeading,
  entityFormInputClassName,
  entityFormInputErrorClass,
} from "@/components/forms/entity-form-layout";
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
    onFormChange({ ...formData, phoneNumber: formatPhoneNumber(value) });
    if (validationErrors.phoneNumber) {
      onValidationErrorChange({ ...validationErrors, phoneNumber: "" });
    }
  };

  return (
    <EntityFormDialogShell
      open={open}
      onOpenChange={onOpenChange}
      title={title}
      description={description}
      icon={Phone}
      maxWidthClass="sm:max-w-[520px]"
      footer={
        <EntityFormDialogFooter
          onCancel={() => onOpenChange(false)}
          onSubmit={onSubmit}
          submitLabel={submitLabel}
          isSubmitting={isSubmitting}
          submitVariant="create"
        />
      }
    >
      <EntityFormCard title="Phone Line Details" icon={Phone}>
        <EntityFormSectionHeading>Line Information</EntityFormSectionHeading>
        <div className="space-y-2.5">
          <EntityFormField
            id={`${idPrefix}-phone`}
            label="Phone Number"
            required
            error={validationErrors.phoneNumber}
          >
            <Input
              id={`${idPrefix}-phone`}
              placeholder="+1 XXX-XXX-XXXX"
              value={formData.phoneNumber}
              onChange={(e) => handlePhoneChange(e.target.value)}
              className={cn(
                entityFormInputClassName,
                "font-mono",
                entityFormInputErrorClass(!!validationErrors.phoneNumber),
              )}
            />
          </EntityFormField>

          <EntityFormField id={`${idPrefix}-label`} label="Label">
            <Input
              id={`${idPrefix}-label`}
              placeholder="e.g. Rig Hut – Main Office"
              value={formData.label}
              onChange={(e) =>
                onFormChange({ ...formData, label: e.target.value })
              }
              className={entityFormInputClassName}
            />
          </EntityFormField>
        </div>

        <EntityFormSectionHeading>Status</EntityFormSectionHeading>
        <div className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50/80 px-3 py-2.5 dark:border-neutral-800 dark:bg-neutral-900/50">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
              Active
            </p>
            <p className="mt-0.5 text-[11px] text-slate-500">
              Inactive lines won&apos;t generate tickets from Aircall
            </p>
          </div>
          <Switch
            checked={formData.isActive}
            onCheckedChange={(checked) =>
              onFormChange({ ...formData, isActive: checked })
            }
          />
        </div>
      </EntityFormCard>
    </EntityFormDialogShell>
  );
}
