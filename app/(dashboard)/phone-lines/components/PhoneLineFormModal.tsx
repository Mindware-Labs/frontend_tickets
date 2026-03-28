"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { AlertCircle, Phone, PhoneCall } from "lucide-react";
import { cn } from "@/lib/utils";
import { PhoneLineFormData } from "../types";

interface PhoneLineFormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  submitLabel: string;
  isSubmitting: boolean;
  formData: PhoneLineFormData;
  onFormChange: (next: PhoneLineFormData) => void;
  validationErrors: Record<string, string>;
  onValidationErrorChange: (next: Record<string, string>) => void;
  onSubmit: () => void;
  idPrefix: string;
}

function formatPhoneNumber(value: string): string {
  // If already correctly formatted, leave it as-is
  if (value.startsWith("+1 ") && /^\+1 \d{3}-\d{3}-\d{4}$/.test(value)) {
    return value;
  }
  // Strip everything except digits
  const numbers = value.replace(/\D/g, "");
  // Always remove leading 1 to avoid duplication with the +1 prefix
  const cleaned = numbers.startsWith("1") ? numbers.slice(1) : numbers;
  if (cleaned.length === 0) return "";
  if (cleaned.length <= 3) return `+1 ${cleaned}`;
  if (cleaned.length <= 6)
    return `+1 ${cleaned.slice(0, 3)}-${cleaned.slice(3)}`;
  return `+1 ${cleaned.slice(0, 3)}-${cleaned.slice(3, 6)}-${cleaned.slice(6, 10)}`;
}

export function PhoneLineFormModal({
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
}: PhoneLineFormModalProps) {
  const handlePhoneChange = (value: string) => {
    const formatted = formatPhoneNumber(value);
    onFormChange({ ...formData, phoneNumber: formatted });
    onValidationErrorChange({ ...validationErrors, phoneNumber: "" });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg p-0 gap-0 overflow-hidden bg-background">
        {/* Header */}
        <DialogHeader className="p-6 pb-4 bg-muted/20 border-b">
          <div className="flex items-start gap-4">
            <div className="p-3 rounded-xl bg-primary/10 border border-primary/20 shadow-sm">
              <PhoneCall className="h-6 w-6 text-primary" />
            </div>
            <div className="space-y-1 mt-0.5">
              <DialogTitle className="text-xl font-bold tracking-tight">
                {title}
              </DialogTitle>
              <p className="text-sm text-muted-foreground">{description}</p>
            </div>
          </div>
        </DialogHeader>

        {/* Body */}
        <div className="p-6 overflow-y-auto max-h-[65vh]">
          <div className="space-y-5">
            {/* Phone Number */}
            <div className="space-y-2">
              <Label
                htmlFor={`${idPrefix}-phone`}
                className="text-xs uppercase text-muted-foreground font-semibold tracking-wider"
              >
                Phone Number <span className="text-destructive">*</span>
              </Label>
              <div className="relative">
                <Phone className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  id={`${idPrefix}-phone`}
                  placeholder="+1 XXX-XXX-XXXX"
                  value={formData.phoneNumber}
                  onChange={(e) => handlePhoneChange(e.target.value)}
                  className={cn(
                    "pl-9 font-mono",
                    validationErrors.phoneNumber &&
                      "border-destructive focus-visible:ring-destructive"
                  )}
                />
              </div>
              {validationErrors.phoneNumber && (
                <p className="text-xs text-destructive flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />{" "}
                  {validationErrors.phoneNumber}
                </p>
              )}
            </div>

            {/* Label */}
            <div className="space-y-2">
              <Label
                htmlFor={`${idPrefix}-label`}
                className="text-xs uppercase text-muted-foreground font-semibold tracking-wider"
              >
                Label
              </Label>
              <Input
                id={`${idPrefix}-label`}
                placeholder="e.g. Rig Hut – Main Office"
                value={formData.label}
                onChange={(e) =>
                  onFormChange({ ...formData, label: e.target.value })
                }
              />
            </div>

            {/* Active toggle */}
            <div className="flex items-center justify-between rounded-lg border p-4 bg-muted/20">
              <div className="space-y-0.5">
                <Label className="text-sm font-medium">Active</Label>
                <p className="text-xs text-muted-foreground">
                  Inactive lines will not generate tickets from Aircall
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
        </div>

        {/* Footer */}
        <DialogFooter className="p-4 bg-muted/20 border-t">
          <div className="flex w-full justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button onClick={onSubmit} disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <span className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-background border-t-transparent" />
                  Saving...
                </>
              ) : (
                submitLabel
              )}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
