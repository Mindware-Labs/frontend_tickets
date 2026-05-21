"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import { Loader2, Shield, UserCog, UserPlus } from "lucide-react";
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
  const fieldInput =
    "h-9 rounded-lg border-[#e2e8f0] bg-white text-[13px] text-slate-700 placeholder:text-slate-300 shadow-none focus-visible:ring-1 focus-visible:ring-[#008f68]/30 focus-visible:border-[#008f68]/40 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200";

  const setRole = (role: UserRole) => onFormChange({ ...formData, role });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg gap-0 overflow-hidden rounded-2xl border-slate-200 p-0 shadow-2xl dark:border-slate-800">
        <DialogHeader className="border-b border-slate-100 px-5 py-5 sm:px-6 dark:border-slate-800">
          <DialogTitle className="flex items-center gap-2 text-[17px] font-bold text-slate-900 dark:text-slate-50">
            {mode === "create" ? (
              <UserPlus className="h-5 w-5 text-[#008f68]" strokeWidth={2} />
            ) : null}
            {title}
          </DialogTitle>
          <DialogDescription className="text-[13px] text-slate-500 dark:text-slate-400">
            {description}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 px-5 py-5 sm:px-6">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label
                htmlFor={`${idPrefix}-name`}
                className="text-[11px] font-bold uppercase tracking-[0.1em] text-slate-500"
              >
                First name <span className="text-red-500">*</span>
              </label>
              <Input
                id={`${idPrefix}-name`}
                value={formData.name}
                onChange={(e) =>
                  onFormChange({ ...formData, name: e.target.value })
                }
                className={cn(fieldInput, validationErrors.name && "border-red-400")}
              />
              {validationErrors.name ? (
                <p className="text-[11px] text-red-500">{validationErrors.name}</p>
              ) : null}
            </div>
            <div className="space-y-1.5">
              <label
                htmlFor={`${idPrefix}-lastName`}
                className="text-[11px] font-bold uppercase tracking-[0.1em] text-slate-500"
              >
                Last name <span className="text-red-500">*</span>
              </label>
              <Input
                id={`${idPrefix}-lastName`}
                value={formData.lastName}
                onChange={(e) =>
                  onFormChange({ ...formData, lastName: e.target.value })
                }
                className={cn(
                  fieldInput,
                  validationErrors.lastName && "border-red-400",
                )}
              />
              {validationErrors.lastName ? (
                <p className="text-[11px] text-red-500">
                  {validationErrors.lastName}
                </p>
              ) : null}
            </div>
          </div>

          <div className="space-y-1.5">
            <label
              htmlFor={`${idPrefix}-email`}
              className="text-[11px] font-bold uppercase tracking-[0.1em] text-slate-500"
            >
              Email <span className="text-red-500">*</span>
            </label>
            <Input
              id={`${idPrefix}-email`}
              type="email"
              value={formData.email}
              onChange={(e) =>
                onFormChange({ ...formData, email: e.target.value })
              }
              className={cn(fieldInput, validationErrors.email && "border-red-400")}
            />
            {validationErrors.email ? (
              <p className="text-[11px] text-red-500">{validationErrors.email}</p>
            ) : null}
          </div>

          <div className="space-y-2">
            <p className="text-[11px] font-bold uppercase tracking-[0.1em] text-slate-500">
              Role <span className="text-red-500">*</span>
            </p>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setRole("agent")}
                className={cn(
                  "rounded-xl border p-3 text-left transition-all",
                  formData.role === "agent"
                    ? "border-[#008f68]/40 bg-[#f0faf5] ring-1 ring-[#008f68]/20"
                    : "border-slate-200 bg-white hover:border-slate-300 dark:border-slate-800 dark:bg-slate-950",
                )}
              >
                <span className="flex items-center gap-2 text-[13px] font-semibold text-slate-800 dark:text-slate-100">
                  <UserCog className="h-4 w-4 text-blue-600" />
                  Agent
                </span>
                <p className="mt-1 text-[11px] text-slate-500">
                  Limited access to assigned work.
                </p>
              </button>
              <button
                type="button"
                onClick={() => setRole("admin")}
                className={cn(
                  "rounded-xl border p-3 text-left transition-all",
                  formData.role === "admin"
                    ? "border-[#008f68]/40 bg-[#f0faf5] ring-1 ring-[#008f68]/20"
                    : "border-slate-200 bg-white hover:border-slate-300 dark:border-slate-800 dark:bg-slate-950",
                )}
              >
                <span className="flex items-center gap-2 text-[13px] font-semibold text-slate-800 dark:text-slate-100">
                  <Shield className="h-4 w-4 text-violet-600" />
                  Admin
                </span>
                <p className="mt-1 text-[11px] text-slate-500">
                  Full system control.
                </p>
              </button>
            </div>
          </div>

          {mode === "edit" ? (
            <div className="flex items-center justify-between rounded-xl border border-slate-200/80 bg-slate-50/80 px-4 py-3 dark:border-slate-800 dark:bg-slate-900/50">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-[0.1em] text-slate-500">
                  Account active
                </p>
                <p className="mt-0.5 text-[12px] text-slate-500">
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
          ) : null}
        </div>

        <div className="flex flex-col-reverse gap-2 border-t border-slate-100 bg-slate-50/80 px-5 py-4 sm:flex-row sm:justify-end sm:px-6 dark:border-slate-800 dark:bg-slate-900/60">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSubmitting}
            className="h-10 rounded-lg border-slate-200 bg-white px-5 text-sm font-semibold"
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={onSubmit}
            disabled={isSubmitting}
            className="h-10 rounded-lg bg-[#008f68] px-6 text-sm font-semibold text-white hover:bg-[#007a5a]"
          >
            {isSubmitting ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : null}
            {isSubmitting ? "Saving..." : submitLabel}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
