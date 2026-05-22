"use client";

import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import { Loader2, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

export const entityFormDialogContentClass =
  "max-h-[calc(100dvh-2rem)] max-w-[calc(100%-1.5rem)] gap-0 overflow-hidden rounded-2xl border-slate-200 bg-white p-0 shadow-2xl sm:max-w-[760px] dark:border-slate-800 dark:bg-slate-950";

export const entityFormScrollBodyClass =
  "max-h-[68dvh] overflow-y-auto bg-[#f4f5f7] px-3 py-2 sm:px-3.5 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-slate-200 [&::-webkit-scrollbar-track]:bg-transparent";

export const entityFormInputClassName = cn(
  "h-9 w-full rounded-lg border border-transparent bg-slate-50 px-2.5 text-xs text-slate-900 shadow-none transition-colors",
  "placeholder:text-slate-400",
  "hover:border-slate-300 focus:border-[#008f68] focus:bg-white focus:ring-2 focus:ring-[#008f68]/20",
  "dark:bg-slate-900/80 dark:text-slate-100 dark:placeholder:text-slate-500",
);

export const entityFormTextareaClassName = cn(
  "min-h-[88px] w-full resize-none rounded-lg border border-transparent bg-slate-50 px-2.5 py-2 text-xs text-slate-900 shadow-none transition-colors",
  "placeholder:text-slate-400",
  "hover:border-slate-300 focus:border-[#008f68] focus:bg-white focus:ring-2 focus:ring-[#008f68]/20",
  "dark:bg-slate-900/80 dark:text-slate-100 dark:placeholder:text-slate-500",
);

export const entityFormSelectTriggerClassName = cn(
  "h-9 w-full justify-between rounded-lg border border-transparent bg-slate-50 px-2.5 text-xs font-medium text-slate-900 shadow-none transition-colors",
  "hover:border-slate-300 focus:border-[#008f68] focus:bg-white focus:ring-2 focus:ring-[#008f68]/20",
  "dark:bg-slate-900/80 dark:text-slate-100",
);

export const entityFormSelectContentClassName =
  "rounded-lg border-slate-200 dark:border-slate-700";

export function entityFormInputErrorClass(hasError?: boolean) {
  return hasError
    ? "border-red-400 focus:border-red-400 focus:ring-red-100"
    : undefined;
}

export function EntityFormSectionHeading({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-widest text-slate-400">
      {children}
    </p>
  );
}

export function EntityFormFieldLabel({
  children,
  required,
}: {
  children: ReactNode;
  required?: boolean;
}) {
  return (
    <p className="mb-1 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
      {children}
      {required ? (
        <span className="normal-case text-red-400"> *</span>
      ) : null}
    </p>
  );
}

export function EntityFormField({
  id,
  label,
  required,
  error,
  hint,
  className,
  children,
}: {
  id?: string;
  label: ReactNode;
  required?: boolean;
  error?: string;
  hint?: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <div className={cn(className)}>
      <label htmlFor={id} className="block">
        <EntityFormFieldLabel required={required}>{label}</EntityFormFieldLabel>
      </label>
      {children}
      {hint && !error ? (
        <p className="mt-1 text-[11px] text-slate-500">{hint}</p>
      ) : null}
      {error ? (
        <p className="mt-1 text-[11px] font-medium text-red-500" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}

export function EntityFormCard({
  title,
  icon: Icon,
  children,
  className,
}: {
  title: string;
  icon: LucideIcon;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section
      className={cn(
        "overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-[0_1px_3px_rgba(0,0,0,0.06)] dark:border-slate-800 dark:bg-slate-950",
        className,
      )}
    >
      <div className="flex items-center gap-2 border-b border-slate-50 px-3.5 py-2 dark:border-slate-800">
        <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-md bg-slate-100 dark:bg-slate-800">
          <Icon className="h-3 w-3 text-slate-600 dark:text-slate-300" />
        </div>
        <span className="text-[12px] font-bold leading-tight text-slate-700 dark:text-slate-200">
          {title}
        </span>
      </div>
      <div className="space-y-3 px-3.5 py-3">{children}</div>
    </section>
  );
}

export function EntityFormGrid({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("grid grid-cols-2 gap-x-3 gap-y-2.5", className)}>
      {children}
    </div>
  );
}

type EntityFormDialogShellProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  icon: LucideIcon;
  iconClassName?: string;
  maxWidthClass?: string;
  children: ReactNode;
  footer: ReactNode;
};

export function EntityFormDialogShell({
  open,
  onOpenChange,
  title,
  description,
  icon: Icon,
  iconClassName,
  maxWidthClass,
  children,
  footer,
}: EntityFormDialogShellProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className={cn(entityFormDialogContentClass, maxWidthClass)}
      >
        <DialogHeader className="border-b border-slate-100 px-5 py-4 pr-12 text-left sm:px-6 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div
              className={cn(
                "flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-dashed border-slate-200 bg-slate-50 text-[#008f68] dark:border-slate-700 dark:bg-slate-900",
                iconClassName,
              )}
            >
              <Icon className="h-5 w-5" />
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

        <div className={entityFormScrollBodyClass}>
          <div className="space-y-2">{children}</div>
        </div>

        {footer}
      </DialogContent>
    </Dialog>
  );
}

type EntityFormDialogFooterProps = {
  onCancel: () => void;
  onSubmit: () => void;
  submitLabel: string;
  isSubmitting?: boolean;
  onReset?: () => void;
  resetLabel?: string;
  submitVariant?: "create" | "edit";
  cancelDisabled?: boolean;
};

export function EntityFormDialogFooter({
  onCancel,
  onSubmit,
  submitLabel,
  isSubmitting = false,
  onReset,
  resetLabel = "Reset",
  submitVariant = "create",
  cancelDisabled = false,
}: EntityFormDialogFooterProps) {
  return (
    <div className="flex flex-col gap-3 border-t border-slate-100 bg-slate-50/80 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6 dark:border-slate-800 dark:bg-slate-900/60">
      <Button
        type="button"
        variant="outline"
        onClick={onCancel}
        disabled={isSubmitting || cancelDisabled}
        className="h-11 rounded-lg border-slate-200 bg-white px-5 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200"
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
            className="h-11 rounded-lg border-slate-200 bg-white px-5 text-sm font-semibold text-slate-400 shadow-sm hover:text-slate-600 dark:border-slate-700 dark:bg-slate-950"
          >
            <RotateCcw className="mr-2 h-4 w-4" />
            {resetLabel}
          </Button>
        ) : null}
        <Button
          type="button"
          onClick={onSubmit}
          disabled={isSubmitting}
          className={cn(
            "h-11 rounded-lg px-6 text-sm font-semibold text-white shadow-sm disabled:opacity-60",
            submitVariant === "create"
              ? "bg-[#008f68] hover:bg-[#007a5a]"
              : "bg-slate-700 hover:bg-slate-800 dark:bg-slate-200 dark:text-slate-950 dark:hover:bg-white",
          )}
        >
          {isSubmitting ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : null}
          {isSubmitting ? "Saving..." : submitLabel}
        </Button>
      </div>
    </div>
  );
}
