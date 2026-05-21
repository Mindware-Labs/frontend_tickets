"use client";

import { useState, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Switch } from "@/components/ui/switch";
import {
  Ban,
  Check,
  ChevronsUpDown,
  Clock,
  DollarSign,
  Loader2,
  MapPin,
  Megaphone,
  Pencil,
  Tag,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { ManagementType } from "../../calls/types";
import { CAMPAIGN_TYPE_LABELS } from "../utils";
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
    <div className={cn("space-y-1.5", className)}>
      <label
        htmlFor={id}
        className="text-[11px] font-bold uppercase tracking-[0.1em] text-slate-500"
      >
        {label}
        {required ? <span className="text-red-500"> *</span> : null}
      </label>
      {children}
      {error ? (
        <p className="text-[11px] text-red-500" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}

const TYPE_OPTIONS: {
  value: ManagementType;
  icon: typeof Tag;
  description: string;
}[] = [
  {
    value: ManagementType.ONBOARDING,
    icon: Tag,
    description: "Registration and onboarding tickets.",
  },
  {
    value: ManagementType.AR,
    icon: DollarSign,
    description: "Accounts receivable and payment tracking.",
  },
  {
    value: ManagementType.OTHER,
    icon: Clock,
    description: "General campaigns with custom duration.",
  },
];

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
  const [openYardCombobox, setOpenYardCombobox] = useState(false);

  const fieldInput =
    "h-9 rounded-lg border-[#e2e8f0] bg-white text-[13px] text-slate-700 placeholder:text-slate-300 shadow-none focus-visible:ring-1 focus-visible:ring-[#008f68]/30 focus-visible:border-[#008f68]/40 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200";

  const clearError = (key: string) => {
    if (validationErrors[key]) {
      onValidationErrorChange({ ...validationErrors, [key]: "" });
    }
  };

  const setType = (tipo: ManagementType) => {
    onFormChange({ ...formData, tipo });
    clearError("tipo");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[calc(100dvh-2rem)] max-w-[calc(100%-1.5rem)] gap-0 overflow-hidden rounded-2xl border-slate-200 bg-white p-0 shadow-2xl sm:max-w-[640px] dark:border-slate-800 dark:bg-slate-950">
        <DialogHeader className="border-b border-slate-100 px-5 py-5 sm:px-6 dark:border-slate-800">
          <div className="flex items-start gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-[#008f68]/20 bg-[#f0faf5] text-[#008f68]">
              {mode === "create" ? (
                <Megaphone className="h-5 w-5" strokeWidth={2} />
              ) : (
                <Pencil className="h-5 w-5" strokeWidth={2} />
              )}
            </div>
            <div className="min-w-0 pt-0.5">
              <DialogTitle className="text-[17px] font-bold text-slate-900 dark:text-slate-50">
                {title}
              </DialogTitle>
              <DialogDescription className="mt-1 text-[13px] leading-relaxed text-slate-500 dark:text-slate-400">
                {description}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="max-h-[68dvh] space-y-4 overflow-y-auto px-5 py-5 sm:px-6">
          <FieldShell
            id={`${idPrefix}-nombre`}
            label="Campaign name"
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
                fieldInput,
                validationErrors.nombre && "border-red-400",
              )}
            />
          </FieldShell>

          <div className="space-y-2">
            <p className="text-[11px] font-bold uppercase tracking-[0.1em] text-slate-500">
              Campaign type <span className="text-red-500">*</span>
            </p>
            <div className="grid gap-2 sm:grid-cols-3">
              {TYPE_OPTIONS.map(({ value, icon: Icon, description }) => {
                const selected = formData.tipo === value;
                return (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setType(value)}
                    className={cn(
                      "rounded-xl border p-3 text-left transition-all",
                      selected
                        ? "border-[#008f68]/40 bg-[#f0faf5] ring-1 ring-[#008f68]/20"
                        : "border-slate-200 bg-white hover:border-slate-300 dark:border-slate-800 dark:bg-slate-950",
                    )}
                  >
                    <span className="flex items-center gap-2 text-[12px] font-semibold text-slate-800 dark:text-slate-100">
                      <Icon className="h-3.5 w-3.5 shrink-0 text-[#008f68]" />
                      {CAMPAIGN_TYPE_LABELS[value]}
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
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <FieldShell id={`${idPrefix}-yardaId`} label="Yard">
              <Popover
                open={openYardCombobox}
                onOpenChange={setOpenYardCombobox}
              >
                <PopoverTrigger asChild>
                  <Button
                    id={`${idPrefix}-yardaId`}
                    type="button"
                    variant="outline"
                    role="combobox"
                    aria-expanded={openYardCombobox}
                    className={cn(
                      "h-9 w-full justify-between rounded-lg border-[#e2e8f0] bg-white text-[13px] font-normal shadow-none hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900",
                      !formData.yardaId && "text-slate-400",
                    )}
                  >
                    <span className="flex min-w-0 items-center gap-2 truncate">
                      <MapPin className="h-3.5 w-3.5 shrink-0 text-orange-600" />
                      {formData.yardaId
                        ? yards.find((y) => y.id === formData.yardaId)?.name
                        : "Select a yard (optional)"}
                    </span>
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0">
                  <Command>
                    <CommandInput placeholder="Search yard..." />
                    <CommandList>
                      <CommandEmpty>No yard found.</CommandEmpty>
                      <CommandGroup>
                        <CommandItem
                          value="none"
                          onSelect={() => {
                            onFormChange({ ...formData, yardaId: undefined });
                            setOpenYardCombobox(false);
                          }}
                        >
                          <Check
                            className={cn(
                              "mr-2 h-4 w-4",
                              !formData.yardaId ? "opacity-100" : "opacity-0",
                            )}
                          />
                          No yard
                        </CommandItem>
                        {yards.map((yard) => (
                          <CommandItem
                            key={yard.id}
                            value={yard.name}
                            onSelect={() => {
                              onFormChange({ ...formData, yardaId: yard.id });
                              setOpenYardCombobox(false);
                            }}
                          >
                            <Check
                              className={cn(
                                "mr-2 h-4 w-4",
                                formData.yardaId === yard.id
                                  ? "opacity-100"
                                  : "opacity-0",
                              )}
                            />
                            {yard.name}
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            </FieldShell>

            <FieldShell
              id={`${idPrefix}-duracion`}
              label="Duration"
              className={formData.tipo === ManagementType.OTHER ? "" : "opacity-90"}
            >
              <Input
                id={`${idPrefix}-duracion`}
                value={formData.duracion}
                onChange={(e) =>
                  onFormChange({ ...formData, duracion: e.target.value })
                }
                placeholder={
                  formData.tipo === ManagementType.OTHER
                    ? "e.g. 30 days"
                    : "Optional"
                }
                className={fieldInput}
              />
            </FieldShell>
          </div>

          <div className="flex items-center justify-between rounded-xl border border-slate-200/80 bg-slate-50/80 px-4 py-3.5 dark:border-slate-800 dark:bg-slate-900/50">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.1em] text-slate-500">
                Campaign status
              </p>
              <p className="mt-0.5 flex items-center gap-1.5 text-[12px] text-slate-500">
                {formData.isActive ? (
                  <>
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                    Active — visible in lists and reports
                  </>
                ) : (
                  <>
                    <Ban className="h-3 w-3 text-slate-400" />
                    Inactive — hidden from active workflows
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
        </div>

        <div className="flex flex-col-reverse gap-2 border-t border-slate-100 bg-slate-50/80 px-5 py-4 sm:flex-row sm:justify-end sm:px-6 dark:border-slate-800 dark:bg-slate-900/60">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSubmitting}
            className="h-10 rounded-lg border-slate-200 bg-white px-5 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200"
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={onSubmit}
            disabled={isSubmitting}
            className="h-10 rounded-lg bg-[#008f68] px-6 text-sm font-semibold text-white shadow-sm hover:bg-[#007a5a]"
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
