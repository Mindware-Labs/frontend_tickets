"use client";

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
import { Building2 } from "lucide-react";
import {
  EntityFormCard,
  EntityFormDialogFooter,
  EntityFormDialogShell,
  EntityFormField,
  EntityFormGrid,
  EntityFormSectionHeading,
  entityFormInputClassName,
  entityFormInputErrorClass,
  entityFormSelectContentClassName,
  entityFormSelectTriggerClassName,
  entityFormTextareaClassName,
} from "@/components/forms/entity-form-layout";
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

  return (
    <EntityFormDialogShell
      open={open}
      onOpenChange={onOpenChange}
      title={title}
      description={description}
      icon={Building2}
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
      <EntityFormCard title="Yard Details & Properties" icon={Building2}>
        <EntityFormSectionHeading>Basic Information</EntityFormSectionHeading>
        <EntityFormGrid>
          <EntityFormField
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
                entityFormInputClassName,
                entityFormInputErrorClass(!!validationErrors.name),
              )}
            />
          </EntityFormField>

          <EntityFormField
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
              placeholder={
                showPlaceholders ? "Parking Kingdom Jacksonville" : undefined
              }
              className={cn(
                entityFormInputClassName,
                entityFormInputErrorClass(!!validationErrors.commonName),
              )}
            />
          </EntityFormField>

          <EntityFormField
            id={`${idPrefix}-contactInfo`}
            label="Contact Phone"
            required
            error={validationErrors.contactInfo}
          >
            <Input
              id={`${idPrefix}-contactInfo`}
              value={formData.contactInfo}
              onChange={(e) => {
                onFormChange({
                  ...formData,
                  contactInfo: formatPhoneNumber(e.target.value),
                });
                clearError("contactInfo");
              }}
              placeholder="+1 XXX-XXX-XXXX"
              className={cn(
                entityFormInputClassName,
                entityFormInputErrorClass(!!validationErrors.contactInfo),
              )}
            />
          </EntityFormField>

          <EntityFormField id={`${idPrefix}-yardType`} label="Yard Type" required>
            <Select
              value={formData.yardType}
              onValueChange={(value: "SAAS" | "FULL_SERVICE") =>
                onFormChange({ ...formData, yardType: value })
              }
            >
              <SelectTrigger
                id={`${idPrefix}-yardType`}
                className={entityFormSelectTriggerClassName}
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent className={entityFormSelectContentClassName}>
                <SelectItem value="SAAS">SaaS</SelectItem>
                <SelectItem value="FULL_SERVICE">Full Service</SelectItem>
              </SelectContent>
            </Select>
          </EntityFormField>
        </EntityFormGrid>

        <EntityFormSectionHeading>Location & Status</EntityFormSectionHeading>
        <EntityFormGrid>
          <EntityFormField
            id={`${idPrefix}-propertyAddress`}
            label="Property Address"
            required
            error={validationErrors.propertyAddress}
            className="col-span-2"
          >
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
                entityFormInputClassName,
                entityFormInputErrorClass(!!validationErrors.propertyAddress),
              )}
            />
          </EntityFormField>

          <EntityFormField id={`${idPrefix}-yardLink`} label="Yard Link">
            <Input
              id={`${idPrefix}-yardLink`}
              value={formData.yardLink}
              onChange={(e) =>
                onFormChange({ ...formData, yardLink: e.target.value })
              }
              placeholder={showPlaceholders ? "https://example.com" : undefined}
              className={entityFormInputClassName}
            />
          </EntityFormField>

          <EntityFormField id={`${idPrefix}-isActive`} label="Status">
            <Select
              value={formData.isActive ? "active" : "inactive"}
              onValueChange={(value) =>
                onFormChange({ ...formData, isActive: value === "active" })
              }
            >
              <SelectTrigger
                id={`${idPrefix}-isActive`}
                className={entityFormSelectTriggerClassName}
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent className={entityFormSelectContentClassName}>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
          </EntityFormField>
        </EntityFormGrid>
      </EntityFormCard>

      <div>
        <EntityFormField id={`${idPrefix}-notes`} label="Notes">
          <Textarea
            id={`${idPrefix}-notes`}
            value={formData.notes}
            onChange={(e) =>
              onFormChange({ ...formData, notes: e.target.value })
            }
            placeholder={
              showPlaceholders
                ? "Add yard access notes, contacts, or internal details"
                : undefined
            }
            rows={4}
            className={entityFormTextareaClassName}
          />
        </EntityFormField>
      </div>
    </EntityFormDialogShell>
  );
}
