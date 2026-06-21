"use client";

import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import { Shield, UserCog, UserPlus } from "lucide-react";
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
import type { UserFormData, UserRole } from "../types";

interface UserFormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: "create" | "edit";
  title: string;
  description: string;
  submitLabel: string;
  isSubmitting: boolean;
  formData: UserFormData;
  onFormChange: (next: UserFormData) => void;
  validationErrors: Record<string, string>;
  onSubmit: () => void;
  idPrefix: string;
}

export function UserFormModal({
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
  onSubmit,
  idPrefix,
}: UserFormModalProps) {
  const setRole = (role: UserRole) => onFormChange({ ...formData, role });

  return (
    <EntityFormDialogShell
      open={open}
      onOpenChange={onOpenChange}
      title={title}
      description={description}
      icon={mode === "create" ? UserPlus : UserCog}
      maxWidthClass="sm:max-w-[560px]"
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
      <EntityFormCard title="Team Member Details" icon={UserCog}>
        <EntityFormSectionHeading>Profile</EntityFormSectionHeading>
        <EntityFormGrid>
          <EntityFormField
            id={`${idPrefix}-name`}
            label="First Name"
            required
            error={validationErrors.name}
          >
            <Input
              id={`${idPrefix}-name`}
              placeholder={mode === "create" ? "John" : undefined}
              value={formData.name}
              onChange={(e) =>
                onFormChange({ ...formData, name: e.target.value })
              }
              className={cn(
                entityFormInputClassName,
                entityFormInputErrorClass(!!validationErrors.name),
              )}
            />
          </EntityFormField>

          <EntityFormField
            id={`${idPrefix}-lastName`}
            label="Last Name"
            required
            error={validationErrors.lastName}
          >
            <Input
              id={`${idPrefix}-lastName`}
              placeholder={mode === "create" ? "Doe" : undefined}
              value={formData.lastName}
              onChange={(e) =>
                onFormChange({ ...formData, lastName: e.target.value })
              }
              className={cn(
                entityFormInputClassName,
                entityFormInputErrorClass(!!validationErrors.lastName),
              )}
            />
          </EntityFormField>
        </EntityFormGrid>

        <EntityFormField
          id={`${idPrefix}-email`}
          label="Email"
          required
          error={validationErrors.email}
        >
          <Input
            id={`${idPrefix}-email`}
            type="email"
            placeholder={mode === "create" ? "john.doe@example.com" : undefined}
            value={formData.email}
            onChange={(e) =>
              onFormChange({ ...formData, email: e.target.value })
            }
            className={cn(
              entityFormInputClassName,
              entityFormInputErrorClass(!!validationErrors.email),
            )}
          />
        </EntityFormField>

        <EntityFormSectionHeading>Role</EntityFormSectionHeading>
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => setRole("agent")}
            className={cn(
              "rounded-xl border p-3 text-left transition-all",
              formData.role === "agent"
                ? "border-[#008f68]/40 bg-[#f0faf5] ring-1 ring-[#008f68]/20 dark:bg-[#008f68]/10 dark:border-[#008f68]/40"
                : "border-slate-200 bg-white hover:border-slate-300 dark:border-neutral-800 dark:bg-neutral-950",
            )}
          >
            <span className="flex items-center gap-2 text-[12px] font-semibold text-slate-800 dark:text-neutral-100">
              <UserCog className="h-3.5 w-3.5 text-blue-600" />
              Agent
            </span>
            <p className="mt-1 text-[10px] leading-snug text-slate-500 dark:text-neutral-400">
              Limited access to assigned work.
            </p>
          </button>
          <button
            type="button"
            onClick={() => setRole("admin")}
            className={cn(
              "rounded-xl border p-3 text-left transition-all",
              formData.role === "admin"
                ? "border-[#008f68]/40 bg-[#f0faf5] ring-1 ring-[#008f68]/20 dark:bg-[#008f68]/10 dark:border-[#008f68]/40"
                : "border-slate-200 bg-white hover:border-slate-300 dark:border-neutral-800 dark:bg-neutral-950",
            )}
          >
            <span className="flex items-center gap-2 text-[12px] font-semibold text-slate-800 dark:text-neutral-100">
              <Shield className="h-3.5 w-3.5 text-violet-600" />
              Admin
            </span>
            <p className="mt-1 text-[10px] leading-snug text-slate-500 dark:text-neutral-400">
              Full system control.
            </p>
          </button>
        </div>

        {mode === "edit" ? (
          <>
            <EntityFormSectionHeading>Account</EntityFormSectionHeading>
            <div className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50/80 px-3 py-2.5 dark:border-neutral-800 dark:bg-neutral-900/50">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                  Account Active
                </p>
                <p className="mt-0.5 text-[11px] text-slate-500">
                  Blocked users cannot sign in.
                </p>
              </div>
              <Switch
                checked={formData.isActive}
                onCheckedChange={(checked) =>
                  onFormChange({ ...formData, isActive: checked })
                }
              />
            </div>
          </>
        ) : null}
      </EntityFormCard>
    </EntityFormDialogShell>
  );
}
