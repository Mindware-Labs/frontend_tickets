"use client";

import { useMemo, useState } from "react";
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
import { Checkbox } from "@/components/ui/checkbox";
import { LandlordFormData, YardOption } from "../types";
import {
  UserPlus,
  Search,
  Building,
  User,
  Phone,
  Mail,
  AlertCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";

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
  yards: YardOption[];
  idPrefix: string;
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
  yards,
  idPrefix,
}: LandlordFormModalProps) {
  const [yardSearch, setYardSearch] = useState("");

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

  const filteredYards = useMemo(() => {
    const term = yardSearch.trim().toLowerCase();
    if (!term) return yards;
    return yards.filter((yard) => {
      const label = yard.name || "";
      return label.toLowerCase().includes(term);
    });
  }, [yards, yardSearch]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl p-0 gap-0 overflow-hidden bg-background">
        {/* Header */}
        <DialogHeader className="p-6 pb-4 bg-muted/20 border-b">
          <div className="flex items-start gap-4">
            <div className="p-3 rounded-xl bg-primary/10 border border-primary/20 shadow-sm">
              <UserPlus className="h-6 w-6 text-primary" />
            </div>
            <div className="space-y-1 mt-0.5">
              <DialogTitle className="text-xl font-bold tracking-tight">
                {title}
              </DialogTitle>
              <p className="text-sm text-muted-foreground">{description}</p>
            </div>
          </div>
        </DialogHeader>

        {/* Scrollable Body */}
        <div className="p-6 overflow-y-auto max-h-[65vh]">
          <div className="space-y-6">
            {/* Personal Info Section */}
            <div className="space-y-4">
              <h4 className="text-sm font-semibold flex items-center gap-2 text-foreground">
                <User className="h-4 w-4" /> Personal Details
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label
                    htmlFor={`${idPrefix}-name`}
                    className="text-xs uppercase text-muted-foreground font-semibold tracking-wider"
                  >
                    Full Name <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id={`${idPrefix}-name`}
                    placeholder="e.g. John Doe"
                    value={formData.name}
                    onChange={(e) => {
                      onFormChange({ ...formData, name: e.target.value });
                      onValidationErrorChange({
                        ...validationErrors,
                        name: "",
                      });
                    }}
                    className={cn(
                      validationErrors.name &&
                        "border-destructive focus-visible:ring-destructive"
                    )}
                  />
                  {validationErrors.name && (
                    <p className="text-xs text-destructive flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" />{" "}
                      {validationErrors.name}
                    </p>
                  )}
                </div>

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
                      value={formData.phone}
                      onChange={(e) => {
                        const formatted = formatPhoneNumber(e.target.value);
                        onFormChange({ ...formData, phone: formatted });
                        onValidationErrorChange({
                          ...validationErrors,
                          phone: "",
                        });
                      }}
                      className={cn(
                        "pl-9",
                        validationErrors.phone &&
                          "border-destructive focus-visible:ring-destructive"
                      )}
                    />
                  </div>
                  {validationErrors.phone && (
                    <p className="text-xs text-destructive flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" />{" "}
                      {validationErrors.phone}
                    </p>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label
                  htmlFor={`${idPrefix}-email`}
                  className="text-xs uppercase text-muted-foreground font-semibold tracking-wider"
                >
                  Email Address <span className="text-destructive">*</span>
                </Label>
                <div className="relative">
                  <Mail className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    id={`${idPrefix}-email`}
                    placeholder="john@example.com"
                    value={formData.email}
                    onChange={(e) => {
                      onFormChange({ ...formData, email: e.target.value });
                      onValidationErrorChange({
                        ...validationErrors,
                        email: "",
                      });
                    }}
                    className={cn(
                      "pl-9",
                      validationErrors.email &&
                        "border-destructive focus-visible:ring-destructive"
                    )}
                  />
                </div>
                {validationErrors.email && (
                  <p className="text-xs text-destructive flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" /> {validationErrors.email}
                  </p>
                )}
              </div>
            </div>

            {/* Yards Section */}
            <div className="space-y-4">
              <h4 className="text-sm font-semibold flex items-center gap-2 text-foreground">
                <Building className="h-4 w-4" /> Associated Yards
              </h4>

              <div className="border rounded-lg overflow-hidden bg-card shadow-sm">
                {/* Search Header - border-b removed */}
                <div className="p-3 bg-muted/30 flex items-center gap-2">
                  <Search className="h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search yards..."
                    value={yardSearch}
                    onChange={(e) => setYardSearch(e.target.value)}
                    className="border-none bg-transparent shadow-none h-auto p-0 focus-visible:ring-0 placeholder:text-muted-foreground"
                  />
                </div>

                <div className="max-h-[200px] overflow-y-auto p-2 bg-background">
                  {filteredYards.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-8 text-muted-foreground gap-2">
                      <Building className="h-8 w-8 opacity-20" />
                      <p className="text-xs">
                        No yards found matching "{yardSearch}"
                      </p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 gap-1">
                      {filteredYards.map((yard) => {
                        const value = yard.id.toString();
                        const checked = formData.yardIds.includes(value);
                        return (
                          <label
                            key={yard.id}
                            className={cn(
                              "flex items-center gap-3 p-2 rounded-md cursor-pointer transition-colors border border-transparent",
                              checked
                                ? "bg-primary/5 border-primary/10"
                                : "hover:bg-muted"
                            )}
                          >
                            <Checkbox
                              checked={checked}
                              onCheckedChange={(next) => {
                                const isChecked = Boolean(next);
                                const yardIds = isChecked
                                  ? [...formData.yardIds, value]
                                  : formData.yardIds.filter(
                                      (id) => id !== value
                                    );
                                onFormChange({ ...formData, yardIds });
                                onValidationErrorChange({
                                  ...validationErrors,
                                  yardIds: "",
                                });
                              }}
                            />
                            <div className="flex flex-col">
                              <span
                                className={cn(
                                  "text-sm font-medium",
                                  checked ? "text-primary" : "text-foreground"
                                )}
                              >
                                {yard.name}
                              </span>
                            </div>
                          </label>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
              {validationErrors.yardIds && (
                <p className="text-xs text-destructive flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" /> {validationErrors.yardIds}
                </p>
              )}
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
                  <span className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-background border-t-transparent"></span>
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
