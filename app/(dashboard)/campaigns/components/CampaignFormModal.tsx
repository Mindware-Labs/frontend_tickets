"use client";

import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Ban } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Clock,
  DollarSign,
  Megaphone,
  Pencil,
  Tag,
} from "lucide-react";
import { InspectorCombobox } from "@/app/(dashboard)/calls/components/shared/InspectorHelpers";
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
import { useConfigurations } from "@/hooks/useConfigurations";
import type { CampaignFormData, YardSummary } from "../types";

interface CampaignFormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: "create" | "edit";
  title: string;
  description: string;
  submitLabel: string;
  isSubmitting: boolean;
  formData: CampaignFormData;
  onFormChange: (next: CampaignFormData) => void;
  validationErrors: Record<string, string>;
  onValidationErrorChange: (next: Record<string, string>) => void;
  onSubmit: () => void;
  idPrefix: string;
  yards: YardSummary[];
}

const BUILTIN_TYPE_META: Record<string, { icon: typeof Tag; description: string }> = {
  ONBOARDING: { icon: Tag, description: "Registration and onboarding tickets." },
  AR: { icon: DollarSign, description: "Accounts receivable and payment tracking." },
  OTHER: { icon: Clock, description: "General campaigns with custom duration." },
};

export function CampaignFormModal({
  open,
  onOpenChange,
  mode,
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
  yards,
}: CampaignFormModalProps) {
  const clearError = (key: string) => {
    if (validationErrors[key]) {
      onValidationErrorChange({ ...validationErrors, [key]: "" });
    }
  };

  const { campaignTypes } = useConfigurations(true);

  const setType = (tipo: string) => {
    onFormChange({ ...formData, tipo: tipo as any });
    clearError("tipo");
  };

  const yardItems = yards.map((y) => ({
    value: String(y.id),
    label: y.name,
  }));

  return (
    <EntityFormDialogShell
      open={open}
      onOpenChange={onOpenChange}
      title={title}
      description={description}
      icon={mode === "create" ? Megaphone : Pencil}
      maxWidthClass="sm:max-w-[640px]"
      footer={
        <EntityFormDialogFooter
          onCancel={() => onOpenChange(false)}
          onSubmit={onSubmit}
          submitLabel={submitLabel}
          isSubmitting={isSubmitting}
          submitVariant={mode === "create" ? "create" : "edit"}
        />
      }
    >
      <EntityFormCard title="Campaign Details & Properties" icon={Megaphone}>
        <EntityFormSectionHeading>Basic Information</EntityFormSectionHeading>
        <EntityFormField
          id={`${idPrefix}-nombre`}
          label="Campaign Name"
          required
          error={validationErrors.nombre}
        >
          <Input
            id={`${idPrefix}-nombre`}
            value={formData.nombre}
            onChange={(e) => {
              onFormChange({ ...formData, nombre: e.target.value });
              clearError("nombre");
            }}
            placeholder="e.g. Q2 Onboarding Drive"
            className={cn(
              entityFormInputClassName,
              entityFormInputErrorClass(!!validationErrors.nombre),
            )}
          />
        </EntityFormField>

        <EntityFormSectionHeading>
          Campaign Type <span className="normal-case text-red-400">*</span>
        </EntityFormSectionHeading>
        <div className="grid gap-2 sm:grid-cols-3">
          {campaignTypes.map((ct) => {
            const meta = BUILTIN_TYPE_META[ct.value] ?? { icon: Megaphone, description: ct.label };
            const Icon = meta.icon;
            const value = ct.value;
            const description = meta.description;
            const selected = formData.tipo === value;
            return (
              <button
                key={value}
                type="button"
                onClick={() => setType(value)}
                className={cn(
                  "rounded-xl border p-3 text-left transition-all",
                  selected
                    ? "border-[#008f68]/40 bg-[#f0faf5] ring-1 ring-[#008f68]/20 dark:bg-emerald-950/20"
                    : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50 dark:border-neutral-800 dark:bg-neutral-950 dark:hover:border-neutral-700 dark:hover:bg-neutral-900",
                )}
              >
                <span className="flex items-center gap-2 text-[12px] font-semibold text-slate-800 dark:text-neutral-100">
                  <Icon className="h-3.5 w-3.5 shrink-0 text-[#008f68]" />
                  {ct.label}
                </span>
                <p className="mt-1 line-clamp-2 text-[10px] leading-snug text-slate-500">
                  {description}
                </p>
              </button>
            );
          })}
        </div>
        {validationErrors.tipo ? (
          <p className="text-[11px] text-red-500">{validationErrors.tipo}</p>
        ) : null}

        <EntityFormSectionHeading>Campaign & Location</EntityFormSectionHeading>
        <EntityFormGrid>
          <EntityFormField id={`${idPrefix}-yardaId`} label="Yard">
            <InspectorCombobox
              value={formData.yardaId ? String(formData.yardaId) : ""}
              onChange={(v) =>
                onFormChange({
                  ...formData,
                  yardaId: v ? Number(v) : undefined,
                })
              }
              placeholder="Select a yard (optional)"
              searchPlaceholder="Search yard…"
              noneLabel="No yard"
              items={yardItems}
            />
          </EntityFormField>

          <EntityFormField
            id={`${idPrefix}-duracion`}
            label="Duration"
            className={(formData.tipo as string) === "OTHER" ? "" : "opacity-90"}
          >
            <Input
              id={`${idPrefix}-duracion`}
              value={formData.duracion}
              onChange={(e) =>
                onFormChange({ ...formData, duracion: e.target.value })
              }
              placeholder={
                (formData.tipo as string) === "OTHER"
                  ? "e.g. 30 days"
                  : "Optional"
              }
              className={entityFormInputClassName}
            />
          </EntityFormField>
        </EntityFormGrid>

        <EntityFormSectionHeading>Status</EntityFormSectionHeading>
        <div className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50/80 px-3 py-2.5 dark:border-neutral-800 dark:bg-neutral-900/50">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
              Campaign Status
            </p>
            <p className="mt-0.5 flex items-center gap-1.5 text-[11px] text-slate-500">
              {formData.isActive ? (
                <>
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                  Active — visible in lists and reports
                </>
              ) : (
                <>
                  <Ban className="h-3 w-3 text-slate-400" />
                  Inactive — hidden from workflows
                </>
              )}
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
