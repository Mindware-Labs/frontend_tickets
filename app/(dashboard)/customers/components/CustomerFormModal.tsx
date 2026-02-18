"use client";

import { useMemo, useState } from "react";
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
import { Checkbox } from "@/components/ui/checkbox";
import { CampaignOption, CustomerFormData } from "../types";

interface CustomerFormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  submitLabel: string;
  isSubmitting: boolean;
  formData: CustomerFormData;
  onFormChange: (next: CustomerFormData) => void;
  validationErrors: Record<string, string>;
  onValidationErrorChange: (next: Record<string, string>) => void;
  onSubmit: () => void;
  campaigns: CampaignOption[];
  idPrefix: string;
}

export function CustomerFormModal({
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
  campaigns,
  idPrefix,
}: CustomerFormModalProps) {
  const [campaignSearch, setCampaignSearch] = useState("");

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

  const filteredCampaigns = useMemo(() => {
    const term = campaignSearch.trim().toLowerCase();
    if (!term) return campaigns;
    return campaigns.filter((campaign) =>
      campaign.nombre.toLowerCase().includes(term)
    );
  }, [campaigns, campaignSearch]);

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
                  onValidationErrorChange({ ...validationErrors, name: "" });
                }}
                className={validationErrors.name ? "border-red-500" : ""}
              />
              {validationErrors.name && (
                <p className="text-xs text-red-500">{validationErrors.name}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor={`${idPrefix}-phone`}>Phone *</Label>
              <Input
                id={`${idPrefix}-phone`}
                placeholder="+1 XXX-XXX-XXXX"
                value={formData.phone}
                onChange={(e) => {
                  const formatted = formatPhoneNumber(e.target.value);
                  onFormChange({ ...formData, phone: formatted });
                  onValidationErrorChange({ ...validationErrors, phone: "" });
                }}
                className={validationErrors.phone ? "border-red-500" : ""}
              />
              {validationErrors.phone && (
                <p className="text-xs text-red-500">{validationErrors.phone}</p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label>Campaigns (Optional)</Label>
            <Input
              placeholder="Search campaigns..."
              value={campaignSearch}
              onChange={(e) => setCampaignSearch(e.target.value)}
            />
            <div className="rounded-md border p-3 space-y-2 max-h-48 overflow-y-auto">
              {filteredCampaigns.length === 0 ? (
                <p className="text-xs text-muted-foreground">
                  No campaigns available
                </p>
              ) : (
                filteredCampaigns.map((campaign) => {
                  const value = campaign.id.toString();
                  const checked = formData.campaignIds.includes(value);
                  return (
                    <label
                      key={campaign.id}
                      className="flex items-center gap-2 text-sm"
                    >
                      <Checkbox
                        checked={checked}
                        onCheckedChange={(next) => {
                          const isChecked = Boolean(next);
                          const campaignIds = isChecked
                            ? [...formData.campaignIds, value]
                            : formData.campaignIds.filter((id) => id !== value);
                          onFormChange({ ...formData, campaignIds });
                          onValidationErrorChange({
                            ...validationErrors,
                            campaignIds: "",
                          });
                        }}
                      />
                      <span>{campaign.nombre}</span>
                    </label>
                  );
                })
              )}
            </div>
            {validationErrors.campaignIds && (
              <p className="text-xs text-red-500">
                {validationErrors.campaignIds}
              </p>
            )}
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
