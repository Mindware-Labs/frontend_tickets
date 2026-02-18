"use client";

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
import { Textarea } from "@/components/ui/textarea";
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
  idPrefix,
  showPlaceholders = false,
}: YardFormModalProps) {
  const formatPhoneNumber = (value: string) => {
    // Si ya tiene el formato correcto, dejarlo así
    if (value.startsWith("+1 ") && /^\+1 \d{3}-\d{3}-\d{4}$/.test(value)) {
      return value;
    }

    // Eliminar todo excepto números
    const numbers = value.replace(/\D/g, "");

    // Si empieza con 1, quitarlo para evitar duplicados
    const cleaned = numbers.startsWith("1") ? numbers.slice(1) : numbers;

    // Formatear: +1 XXX-XXX-XXXX
    if (cleaned.length === 0) return "";
    if (cleaned.length <= 3) return `+1 ${cleaned}`;
    if (cleaned.length <= 6)
      return `+1 ${cleaned.slice(0, 3)}-${cleaned.slice(3)}`;
    return `+1 ${cleaned.slice(0, 3)}-${cleaned.slice(3, 6)}-${cleaned.slice(
      6,
      10
    )}`;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor={`${idPrefix}-name`}>Name *</Label>
              <Input
                id={`${idPrefix}-name`}
                value={formData.name}
                onChange={(e) => {
                  onFormChange({ ...formData, name: e.target.value });
                  onValidationErrorChange({
                    ...validationErrors,
                    name: "",
                  });
                }}
                placeholder={showPlaceholders ? "278 Ellis Road" : undefined}
                className={validationErrors.name ? "border-red-500" : ""}
              />
              {validationErrors.name && (
                <p className="text-xs text-red-500">{validationErrors.name}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor={`${idPrefix}-commonName`}>Common Name *</Label>
              <Input
                id={`${idPrefix}-commonName`}
                value={formData.commonName}
                onChange={(e) => {
                  onFormChange({ ...formData, commonName: e.target.value });
                  onValidationErrorChange({
                    ...validationErrors,
                    commonName: "",
                  });
                }}
                placeholder={
                  showPlaceholders ? "Parking Kingdom Jacksonville" : undefined
                }
                className={validationErrors.commonName ? "border-red-500" : ""}
              />
              {validationErrors.commonName && (
                <p className="text-xs text-red-500">
                  {validationErrors.commonName}
                </p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor={`${idPrefix}-propertyAddress`}>Address *</Label>
            <Input
              id={`${idPrefix}-propertyAddress`}
              value={formData.propertyAddress}
              onChange={(e) => {
                onFormChange({ ...formData, propertyAddress: e.target.value });
                onValidationErrorChange({
                  ...validationErrors,
                  propertyAddress: "",
                });
              }}
              placeholder={
                showPlaceholders
                  ? "278 Ellis Rd N, Jacksonville, FL 32254"
                  : undefined
              }
              className={
                validationErrors.propertyAddress ? "border-red-500" : ""
              }
            />
            {validationErrors.propertyAddress && (
              <p className="text-xs text-red-500">
                {validationErrors.propertyAddress}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor={`${idPrefix}-contactInfo`}>Contact Info *</Label>
            <Input
              id={`${idPrefix}-contactInfo`}
              value={formData.contactInfo}
              onChange={(e) => {
                const formatted = formatPhoneNumber(e.target.value);
                onFormChange({ ...formData, contactInfo: formatted });
                onValidationErrorChange({
                  ...validationErrors,
                  contactInfo: "",
                });
              }}
              placeholder={
                showPlaceholders ? "+1 XXX-XXX-XXXX" : "+1 XXX-XXX-XXXX"
              }
              className={validationErrors.contactInfo ? "border-red-500" : ""}
            />
            {validationErrors.contactInfo && (
              <p className="text-xs text-red-500">
                {validationErrors.contactInfo}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor={`${idPrefix}-yardLink`}>Yard Link</Label>
            <Input
              id={`${idPrefix}-yardLink`}
              value={formData.yardLink}
              onChange={(e) =>
                onFormChange({ ...formData, yardLink: e.target.value })
              }
              placeholder={showPlaceholders ? "https://example.com" : undefined}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor={`${idPrefix}-yardType`}>Type *</Label>
              <Select
                value={formData.yardType}
                onValueChange={(value: "SAAS" | "FULL_SERVICE") =>
                  onFormChange({ ...formData, yardType: value })
                }
              >
                <SelectTrigger id={`${idPrefix}-yardType`}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="SAAS">SaaS</SelectItem>
                  <SelectItem value="FULL_SERVICE">Full Service</SelectItem>
                </SelectContent>
              </Select>
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

          <div className="space-y-2">
            <Label htmlFor={`${idPrefix}-notes`}>Notes</Label>
            <Textarea
              id={`${idPrefix}-notes`}
              value={formData.notes}
              onChange={(e) =>
                onFormChange({ ...formData, notes: e.target.value })
              }
              placeholder={showPlaceholders ? "Additional notes..." : undefined}
              rows={4}
            />
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
