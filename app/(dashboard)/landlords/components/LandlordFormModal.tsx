"use client";

import { useEffect, useMemo, useState } from "react";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";
import { Building2, Search, User } from "lucide-react";
import {
  EntityFormCard,
  EntityFormDialogFooter,
  EntityFormDialogShell,
  EntityFormField,
  EntityFormGrid,
  EntityFormSectionHeading,
  entityFormInputClassName,
  entityFormInputErrorClass,
} from "@/components/forms/entity-form-layout";
import { LandlordFormData, YardOption } from "../types";

interface LandlordFormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  submitLabel: string;
  isSubmitting: boolean;
  formData: LandlordFormData;
  onFormChange: (next: LandlordFormData) => void;
  validationErrors: Record<string, string>;
  onValidationErrorChange: (next: Record<string, string>) => void;
  onSubmit: () => void;
  onReset?: () => void;
  yards: YardOption[];
  idPrefix: string;
  showPlaceholders?: boolean;
}

export function LandlordFormModal({
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
  yards,
  idPrefix,
  showPlaceholders = false,
}: LandlordFormModalProps) {
  const [yardSearch, setYardSearch] = useState("");

  useEffect(() => {
    if (open) setYardSearch("");
  }, [open]);

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

  const filteredYards = useMemo(() => {
    const term = yardSearch.trim().toLowerCase();
    if (!term) return yards;
    return yards.filter((yard) => {
      const name = (yard.name || "").toLowerCase();
      const commonName = (yard.commonName || "").toLowerCase();
      const id = yard.id ? String(yard.id) : "";
      return (
        name.includes(term) ||
        commonName.includes(term) ||
        id.includes(term)
      );
    });
  }, [yards, yardSearch]);

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
      <EntityFormCard title="Landlord Details & Properties" icon={User}>
        <EntityFormSectionHeading>Contact Information</EntityFormSectionHeading>
        <EntityFormGrid>
          <EntityFormField
            id={`${idPrefix}-name`}
            label="Full Name"
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
              placeholder={showPlaceholders ? "+1 813-555-0100" : undefined}
              className={cn(
                entityFormInputClassName,
                "font-mono",
                entityFormInputErrorClass(!!validationErrors.phone),
              )}
            />
          </EntityFormField>

          <EntityFormField
            id={`${idPrefix}-email`}
            label="Email"
            required
            error={validationErrors.email}
            className="col-span-2"
          >
            <Input
              id={`${idPrefix}-email`}
              type="email"
              value={formData.email}
              onChange={(e) => {
                onFormChange({ ...formData, email: e.target.value });
                clearError("email");
              }}
              placeholder={showPlaceholders ? "landlord@example.com" : undefined}
              className={cn(
                entityFormInputClassName,
                entityFormInputErrorClass(!!validationErrors.email),
              )}
            />
          </EntityFormField>
        </EntityFormGrid>

        <EntityFormSectionHeading>Associated Yards</EntityFormSectionHeading>
        <EntityFormField
          id={`${idPrefix}-yards`}
          label="Yards"
          required
          error={validationErrors.yardIds}
        >
          <div className="overflow-hidden rounded-xl border border-slate-100 bg-slate-50/50 shadow-sm dark:border-slate-800">
            <div className="flex items-center gap-2 border-b border-slate-100 px-3 py-2 dark:border-slate-800">
              <Search className="h-3.5 w-3.5 shrink-0 text-slate-400" />
              <Input
                value={yardSearch}
                onChange={(e) => setYardSearch(e.target.value)}
                placeholder="Search yards…"
                className="h-8 border-0 bg-transparent px-0 text-xs shadow-none focus-visible:ring-0"
              />
            </div>
            <div className="max-h-[200px] overflow-y-auto p-2">
              {filteredYards.length === 0 ? (
                <div className="flex flex-col items-center justify-center gap-2 py-6 text-center text-slate-400">
                  <Building2 className="h-6 w-6 opacity-30" />
                  <p className="text-[11px]">
                    {yardSearch.trim()
                      ? `No yards matching "${yardSearch}"`
                      : "No yards available"}
                  </p>
                </div>
              ) : (
                <div className="space-y-1">
                  {filteredYards.map((yard) => {
                    const value = yard.id.toString();
                    const checked = formData.yardIds.includes(value);
                    return (
                      <label
                        key={yard.id}
                        className={cn(
                          "flex cursor-pointer items-center gap-2.5 rounded-lg border px-2.5 py-2 transition-colors",
                          checked
                            ? "border-[#008f68]/20 bg-[#f0faf5]"
                            : "border-transparent hover:bg-white dark:hover:bg-slate-900",
                        )}
                      >
                        <Checkbox
                          checked={checked}
                          onCheckedChange={(next) => {
                            const isChecked = Boolean(next);
                            const yardIds = isChecked
                              ? [...formData.yardIds, value]
                              : formData.yardIds.filter((id) => id !== value);
                            onFormChange({ ...formData, yardIds });
                            clearError("yardIds");
                          }}
                          className="data-[state=checked]:border-[#008f68] data-[state=checked]:bg-[#008f68]"
                        />
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-[12px] font-semibold text-slate-800 dark:text-slate-100">
                            {yard.name}
                          </p>
                          {yard.commonName ? (
                            <p className="truncate text-[10px] text-slate-500">
                              {yard.commonName}
                            </p>
                          ) : null}
                        </div>
                      </label>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </EntityFormField>
      </EntityFormCard>
    </EntityFormDialogShell>
  );
}
