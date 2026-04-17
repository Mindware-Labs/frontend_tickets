"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import { Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { ManagementType } from "../../calls/types";
import { CampaignFormData, YardSummary } from "../types";

interface CampaignFormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
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

const campaignTypeLabels: Record<ManagementType, string> = {
  [ManagementType.ONBOARDING]: "Onboarding",
  [ManagementType.AR]: "AR",
  [ManagementType.OTHER]: "Other",
};

export function CampaignFormModal({
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
  yards,
}: CampaignFormModalProps) {
  const [openYardCombobox, setOpenYardCombobox] = useState(false);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl overflow-y-visible">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* --- NAME INPUT --- */}
          <div className="space-y-2">
            <Label htmlFor={`${idPrefix}-nombre`}>Name *</Label>
            <Input
              id={`${idPrefix}-nombre`}
              value={formData.nombre}
              onChange={(e) => {
                onFormChange({ ...formData, nombre: e.target.value });
                onValidationErrorChange({
                  ...validationErrors,
                  nombre: "",
                });
              }}
              className={`w-full truncate ${
                validationErrors.nombre ? "border-red-500" : ""
              }`}
            />
            {validationErrors.nombre && (
              <p className="text-xs text-red-500">{validationErrors.nombre}</p>
            )}
          </div>

          {/* --- TYPE SELECT & STATUS SELECT --- */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor={`${idPrefix}-tipo`}>Type *</Label>
              <Select
                value={formData.tipo}
                onValueChange={(value: ManagementType) =>
                  onFormChange({ ...formData, tipo: value })
                }
              >
                <SelectTrigger id={`${idPrefix}-tipo`}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(campaignTypeLabels).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {validationErrors.tipo && (
                <p className="text-xs text-red-500">{validationErrors.tipo}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor={`${idPrefix}-isActive`}>Status</Label>
              <Select
                value={formData.isActive ? "active" : "inactive"}
                onValueChange={(value) =>
                  onFormChange({
                    ...formData,
                    isActive: value === "active",
                  })
                }
              >
                <SelectTrigger id={`${idPrefix}-isActive`}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* --- YARD COMBOBOX (SEARCHABLE) --- */}
            <div className="space-y-2 flex flex-col">
              <Label htmlFor={`${idPrefix}-yardaId`}>Yard</Label>
              <Popover
                open={openYardCombobox}
                onOpenChange={setOpenYardCombobox}
              >
                <PopoverTrigger asChild>
                  <Button
                    id={`${idPrefix}-yardaId`}
                    variant="outline"
                    role="combobox"
                    aria-expanded={openYardCombobox}
                    className={cn(
                      "w-full justify-between font-normal",
                      !formData.yardaId && "text-muted-foreground",
                      validationErrors.yardaId && "border-red-500",
                    )}
                  >
                    {/* EDITADO: Envolvemos el texto en un span truncate */}
                    <span className="truncate">
                      {formData.yardaId
                        ? yards.find((yard) => yard.id === formData.yardaId)
                            ?.name
                        : "Select a yard..."}
                    </span>
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
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
                              if (validationErrors.yardaId) {
                                onValidationErrorChange({
                                  ...validationErrors,
                                  yardaId: "",
                                });
                              }
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

              {validationErrors.yardaId && (
                <p className="text-xs text-red-500">
                  {validationErrors.yardaId}
                </p>
              )}
            </div>

            {/* --- DURATION INPUT --- */}
            <div className="space-y-2">
              <Label htmlFor={`${idPrefix}-duracion`}>
                Duration (Optional)
              </Label>
              <Input
                id={`${idPrefix}-duracion`}
                value={formData.duracion}
                onChange={(e) =>
                  onFormChange({ ...formData, duracion: e.target.value })
                }
                placeholder="30 days"
              />
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button onClick={onSubmit} disabled={isSubmitting}>
            {isSubmitting ? `${submitLabel}...` : submitLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
