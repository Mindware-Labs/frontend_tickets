"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { fetchFromBackend } from "@/lib/api-client";
import { useRole } from "@/components/providers/role-provider";
import { toast } from "@/hooks/use-toast";
import { CheckCircle2, ArrowLeft, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { CampaignOption, Customer, CustomerFormData, CustomerNote } from "../types";

const DEFAULT_FORM: CustomerFormData = {
  name: "",
  phone: "",
  pinnedNote: "",
  pendingNotes: [],
  campaignIds: [],
};

export default function EditCustomerPage() {
  const { role } = useRole();
  const router = useRouter();
  const params = useParams();
  const customerId = params?.id as string;

  const normalizedRole = role?.toString().toLowerCase();
  const isAgent = normalizedRole === "agent";
  const canManage = !isAgent;

  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [campaigns, setCampaigns] = useState<CampaignOption[]>([]);
  const [formData, setFormData] = useState<CustomerFormData>(DEFAULT_FORM);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  // Redirigir si no tiene permisos
  useEffect(() => {
    if (!canManage) {
      toast({
        title: "Access Denied",
        description: "You don't have permission to edit customers",
        variant: "destructive",
      });
      router.push("/customers");
    }
  }, [canManage, router]);

  // Cargar datos del cliente y campañas
  useEffect(() => {
    const loadData = async () => {
      if (!customerId) return;

      try {
        setLoading(true);
        const [customerData, campaignsData] = await Promise.all([
          fetchFromBackend(`/customers/${customerId}`),
          fetchFromBackend("/campaign?page=1&limit=200"),
        ]);

        setCustomer(customerData);
        setCampaigns(Array.isArray(campaignsData) ? campaignsData : campaignsData?.data || []);

        // Inicializar formulario con datos del cliente
        setFormData({
          name: customerData.name || "",
          phone: customerData.phone || "",
          pinnedNote: customerData.pinnedNote?.trim() || "",
          pendingNotes: [],
          campaignIds: customerData.campaigns?.map((c: any) => c.id.toString()) || [],
        });
      } catch (error) {
        console.error("Error loading customer:", error);
        toast({
          title: "Error",
          description: "Failed to load customer data",
          variant: "destructive",
        });
        router.push("/customers");
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [customerId, router]);

  const validateForm = () => {
    const errors: Record<string, string> = {};
    if (!formData.name.trim()) errors.name = "Name is required";
    if (!formData.phone.trim()) errors.phone = "Phone is required";
    return errors;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationErrors({});

    const errors = validateForm();
    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors);
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsSubmitting(true);

      const payload = {
        name: formData.name.trim(),
        phone: formData.phone.trim(),
        pinnedNote: formData.pinnedNote.trim() || undefined,
        campaignIds: formData.campaignIds.map((id: string) => Number(id)),
      };

      await fetchFromBackend(`/customers/${customerId}`, {
        method: "PATCH",
        body: JSON.stringify(payload),
      });

      toast({
        title: "Success",
        description: (
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-green-500" />
            <span>Customer updated successfully</span>
          </div>
        ),
      });

      router.push("/customers");
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update customer",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleNotesChange = (updatedNotes: CustomerNote[]) => {
    if (customer) {
      setCustomer({ ...customer, notes: updatedNotes });
    }
  };

  // Fecha de hoy para el subtítulo
  const today = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-slate-50/40 dark:bg-background">
        <div className="flex items-center gap-2 text-slate-500 dark:text-neutral-400">
          <Loader2 className="h-5 w-5 animate-spin" />
          <span>Loading customer data...</span>
        </div>
      </div>
    );
  }

  if (!customer) {
    return null; // Ya se redirige en el catch
  }

  return (
    <div className="min-h-screen bg-slate-50/40 dark:bg-background px-5 pt-4 pb-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between w-full py-5 px-0.5 gap-3 border-b border-slate-200 dark:border-border mb-6">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 rounded-xl text-slate-500 hover:text-slate-800 hover:bg-slate-100 dark:hover:bg-muted"
              onClick={() => router.back()}
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <h2 className="text-[22px] font-bold tracking-tight text-slate-900 dark:text-neutral-50 leading-tight">
              Edit Customer
            </h2>
          </div>
          <p className="text-[13px] text-slate-400 dark:text-neutral-500 mt-0.5 ml-10">
            {today} · Editing {customer.name || "Unknown"}
          </p>
        </div>

        <div className="flex items-center gap-2 ml-10 md:ml-0">
          <Button
            type="button"
            variant="outline"
            className="h-9 px-4 rounded-xl text-[13px] font-medium border-slate-200 dark:border-border shadow-none"
            onClick={() => router.push("/customers")}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="h-9 px-4 rounded-xl bg-[#008f68] hover:bg-[#007a58] text-white text-[13px] font-medium shadow-none min-w-25"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              "Save Changes"
            )}
          </Button>
        </div>
      </div>

      {/* Formulario */}
      <div className="max-w-3xl mx-auto">
        <form onSubmit={handleSubmit} className="space-y-6">
          <Card className="rounded-2xl border-slate-200 dark:border-border shadow-sm bg-white dark:bg-card">
            <CardHeader className="pb-4">
              <CardTitle className="text-base font-semibold">Customer Information</CardTitle>
              <CardDescription className="text-[13px]">
                Update the customer's basic details
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Name */}
              <div className="space-y-2">
                <Label htmlFor="name" className="text-[13px] font-medium">
                  Full Name <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="John Doe"
                  className={`h-10 rounded-xl border-slate-200 dark:border-border ${
                    validationErrors.name ? "border-red-500 focus-visible:ring-red-500" : ""
                  }`}
                />
                {validationErrors.name && (
                  <p className="text-[12px] text-red-500">{validationErrors.name}</p>
                )}
              </div>

              {/* Phone */}
              <div className="space-y-2">
                <Label htmlFor="phone" className="text-[13px] font-medium">
                  Phone Number <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="+1 (555) 000-0000"
                  className={`h-10 rounded-xl border-slate-200 dark:border-border ${
                    validationErrors.phone ? "border-red-500 focus-visible:ring-red-500" : ""
                  }`}
                />
                {validationErrors.phone && (
                  <p className="text-[12px] text-red-500">{validationErrors.phone}</p>
                )}
              </div>

              {/* Campaigns */}
              <div className="space-y-2">
                <Label htmlFor="campaigns" className="text-[13px] font-medium">
                  Assign Campaigns
                </Label>
                <Select
                  value={formData.campaignIds[0] || ""}
                  onValueChange={(value) =>
                    setFormData({
                      ...formData,
                      campaignIds: value ? [value] : [],
                    })
                  }
                >
                  <SelectTrigger className="h-10 rounded-xl border-slate-200 dark:border-border">
                    <SelectValue placeholder="Select a campaign" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">None</SelectItem>
                    {campaigns.map((campaign) => (
                      <SelectItem key={campaign.id} value={campaign.id.toString()}>
                        {campaign.nombre}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-[12px] text-slate-400">
                  You can assign one primary campaign (multi-select can be added if needed)
                </p>
              </div>

              {/* Pinned note */}
              <div className="space-y-2">
                <Label htmlFor="pinnedNote" className="text-[13px] font-medium">
                  Pinned note
                </Label>
                <Textarea
                  id="pinnedNote"
                  value={formData.pinnedNote}
                  onChange={(e) =>
                    setFormData({ ...formData, pinnedNote: e.target.value })
                  }
                  placeholder="Visible to all agents on this phone number…"
                  className="min-h-25 rounded-xl border-amber-200 dark:border-border resize-none"
                />
              </div>
            </CardContent>
          </Card>

          {/* Notes are displayed in customer.notes - NotesManager component would go here */}

          {/* Información adicional (solo lectura) */}
          <Card className="rounded-2xl border-slate-200 dark:border-border shadow-sm bg-white dark:bg-card">
            <CardHeader className="pb-4">
              <CardTitle className="text-base font-semibold">Additional Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[13px] text-slate-500 dark:text-neutral-400">Customer ID</span>
                <span className="font-mono text-[13px] font-medium">#{customer.id}</span>
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <span className="text-[13px] text-slate-500 dark:text-neutral-400">Created</span>
                <span className="text-[13px]">
                  {customer.createdAt
                    ? new Date(customer.createdAt).toLocaleDateString("en-US", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })
                    : "—"}
                </span>
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <span className="text-[13px] text-slate-500 dark:text-neutral-400">Total Tickets</span>
                <Badge variant="secondary" className="text-[12px]">
                  {customer.ticketCount || 0}
                </Badge>
              </div>
            </CardContent>
          </Card>
        </form>
      </div>
    </div>
  );
}