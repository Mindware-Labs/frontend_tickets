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
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";
import {
  Building2,
  Loader2,
  Mail,
  Phone,
  RotateCcw,
  Search,
  User,
} from "lucide-react";
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

  const fieldInput =
    "h-11 rounded-md border-slate-200 bg-white text-sm text-slate-900 placeholder:text-slate-400 shadow-none transition-colors " +
    "focus-visible:border-[#008f68] focus-visible:ring-2 focus-visible:ring-[#008f68]/15 " +
    "dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:placeholder:text-slate-500";

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
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[calc(100dvh-2rem)] max-w-[calc(100%-1.5rem)] gap-0 overflow-hidden rounded-2xl border-slate-200 bg-white p-0 shadow-2xl sm:max-w-[760px] dark:border-slate-800 dark:bg-slate-950">
        <DialogHeader className="border-b border-slate-100 px-5 py-4 text-left sm:px-6 dark:border-slate-800">
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
              label="Full name"
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
                  placeholder={showPlaceholders ? "+1 813-555-0100" : undefined}
                  className={cn(
                    fieldInput,
                    "pl-9 font-mono",
                    validationErrors.phone &&
                      "border-red-400 focus-visible:border-red-400 focus-visible:ring-red-100",
                  )}
                />
              </div>
            </FieldShell>

            <FieldShell
              id={`${idPrefix}-email`}
              label="Email"
              required
              className="sm:col-span-2"
              error={validationErrors.email}
            >
              <div className="relative">
                <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <Input
                  id={`${idPrefix}-email`}
                  type="email"
                  value={formData.email}
                  onChange={(e) => {
                    onFormChange({ ...formData, email: e.target.value });
                    clearError("email");
                  }}
                  placeholder={
                    showPlaceholders ? "landlord@example.com" : undefined
                  }
                  className={cn(
                    fieldInput,
                    "pl-9",
                    validationErrors.email &&
                      "border-red-400 focus-visible:border-red-400 focus-visible:ring-red-100",
                  )}
                />
              </div>
            </FieldShell>
          </div>

          <div className="mt-5">
            <FieldShell
              id={`${idPrefix}-yards`}
              label="Associated yards"
              required
              error={validationErrors.yardIds}
            >
              <div className="overflow-hidden rounded-xl border border-slate-200/80 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-950">
                <div className="flex items-center gap-2 border-b border-slate-100 bg-slate-50/60 px-3 py-2.5 dark:border-slate-800 dark:bg-slate-900/50">
                  <Search className="h-4 w-4 shrink-0 text-slate-400" />
                  <Input
                    value={yardSearch}
                    onChange={(e) => setYardSearch(e.target.value)}
                    placeholder="Search yards..."
                    className="h-8 border-0 bg-transparent px-0 text-sm shadow-none focus-visible:ring-0"
                  />
                </div>
                <div className="max-h-[220px] overflow-y-auto p-2">
                  {filteredYards.length === 0 ? (
                    <div className="flex flex-col items-center justify-center gap-2 py-8 text-center text-slate-400">
                      <Building2 className="h-8 w-8 opacity-30" />
                      <p className="text-xs">
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
                              "flex cursor-pointer items-center gap-3 rounded-lg border px-3 py-2.5 transition-colors",
                              checked
                                ? "border-[#008f68]/20 bg-[#f0faf5]"
                                : "border-transparent hover:bg-slate-50 dark:hover:bg-slate-900",
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
                              <p className="truncate text-[13px] font-semibold text-slate-800">
                                {yard.name}
                              </p>
                              {yard.commonName ? (
                                <p className="truncate text-[11px] text-slate-500">
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
            </FieldShell>
          </div>
        </div>

        <div className="flex flex-col gap-3 border-t border-slate-100 bg-slate-50/80 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6 dark:border-slate-800 dark:bg-slate-900/60">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSubmitting}
            className="h-11 rounded-lg border-slate-200 bg-white px-5 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200"
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
                className="h-11 rounded-lg border-slate-200 bg-white px-5 text-sm font-semibold text-slate-400 shadow-sm hover:text-slate-600 dark:border-slate-700 dark:bg-slate-950"
              >
                <RotateCcw className="mr-2 h-4 w-4" />
                Reset Data
              </Button>
            )}
            <Button
              type="button"
              onClick={onSubmit}
              disabled={isSubmitting}
              className={cn(
                "h-11 rounded-lg px-6 text-sm font-semibold text-white shadow-sm disabled:opacity-60",
                idPrefix === "create"
                  ? "bg-[#008f68] hover:bg-[#007a5a]"
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
