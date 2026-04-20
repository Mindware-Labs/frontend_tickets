"use client";

import React, { useState, useMemo } from "react";
import useSWR from "swr";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Plus,
  Search,
  ChevronLeft,
  ChevronRight,
  Loader2,
  X,
  SlidersHorizontal,
  ClipboardList,
  Trash2,
  Pencil,
} from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { cn } from "@/lib/utils";
import { toast } from "@/hooks/use-toast";
import { useReferenceData } from "../../hooks/useReferenceData";
import { useManualRecordFilters } from "../../hooks/useManualRecordFilters";
import {
  CallDisposition,
  CampaignOptionEnum,
  ManagementType,
  OnboardingOption,
  ArOption,
  type ManualRecord,
  type CreateManualRecordFormData,
  type CampaignOption,
} from "../../types";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
const fetcher = async (url: string) => {
  const res = await fetch(url);
  const result = await res.json();
  if (!result.success) throw new Error(result.message || "Failed to load");
  return result.data;
};

const formatLabel = (v: string) =>
  v
    .replace(/_/g, " ")
    .toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase());

const DISP_PILL: Record<string, { dot: string; bg: string; fg: string }> = {
  RESOLVED:          { dot: "#008f68", bg: "#e6f5f0", fg: "#006d50" },
  CALLBACK_REQUIRED: { dot: "#d97706", bg: "#fef3c7", fg: "#b45309" },
  CALLBACK_SCHEDULED:{ dot: "#2563eb", bg: "#eff6ff", fg: "#1d4ed8" },
  NO_ANSWER:         { dot: "#94a3b8", bg: "#f1f5f9", fg: "#475569" },
  VOICEMAIL_LEFT:    { dot: "#64748b", bg: "#f1f5f9", fg: "#475569" },
  PROMISE_TO_PAY:    { dot: "#7c3aed", bg: "#ede9fe", fg: "#6d28d9" },
  DISPUTE:           { dot: "#dc2626", bg: "#fee2e2", fg: "#b91c1c" },
  WRONG_NUMBER:      { dot: "#f97316", bg: "#ffedd5", fg: "#c2410c" },
  ENROLLED:          { dot: "#008f68", bg: "#e6f5f0", fg: "#006d50" },
  ESCALATED:         { dot: "#dc2626", bg: "#fee2e2", fg: "#b91c1c" },
};

const emptyForm: CreateManualRecordFormData = {
  customerId: "",
  yardId: "",
  campaignId: "",
  campaignOption: "",
  disposition: "",
  notes: "",
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
export function ManualRecordsTab() {
  const refData = useReferenceData();
  const filters = useManualRecordFilters();

  // ---- SWR ----
  const {
    data: pageData,
    isLoading,
    mutate,
  } = useSWR(filters.apiUrl, fetcher, {
    refreshInterval: 0,
    revalidateOnFocus: false,
    dedupingInterval: 30000,
    shouldRetryOnError: false,
  });

  const records: ManualRecord[] = useMemo(() => {
    const raw = Array.isArray(pageData) ? pageData : pageData?.data || [];
    return raw;
  }, [pageData]);

  const totalCount =
    typeof pageData?.total === "number" ? pageData.total : records.length;
  const totalPages =
    pageData?.totalPages ??
    Math.max(1, Math.ceil(totalCount / filters.itemsPerPage));

  // ---- Filter bar ----
  const [filtersOpen, setFiltersOpen] = useState(false);

  const activeFilterCount = useMemo(() => {
    return Object.values(filters.filters).filter((v) => v !== "all").length;
  }, [filters.filters]);

  // ---- Campaign options based on selected campaign type ----
  const selectedCampaignTipo = useMemo(() => {
    if (filters.filters.campaign === "all") return null;
    const found = refData.campaigns.find(
      (c) => c.id.toString() === filters.filters.campaign,
    );
    return found?.tipo ?? null;
  }, [filters.filters.campaign, refData.campaigns]);

  const availableCampaignOptions: string[] = useMemo(() => {
    if (selectedCampaignTipo === ManagementType.ONBOARDING)
      return Object.values(OnboardingOption);
    if (selectedCampaignTipo === ManagementType.AR)
      return Object.values(ArOption);
    return Object.values(CampaignOptionEnum);
  }, [selectedCampaignTipo]);

  // Get campaign options for the form based on selected campaign
  const getFormCampaignOptions = (campaignId: string): string[] => {
    if (!campaignId) return Object.values(CampaignOptionEnum);
    const found = refData.campaigns.find(
      (c) => c.id.toString() === campaignId,
    );
    if (!found) return Object.values(CampaignOptionEnum);
    if (found.tipo === ManagementType.ONBOARDING)
      return Object.values(OnboardingOption);
    if (found.tipo === ManagementType.AR) return Object.values(ArOption);
    return Object.values(CampaignOptionEnum);
  };

  // ---- Customer search state for combobox ----
  const [customerSearch, setCustomerSearch] = useState("");
  const filteredCustomers = useMemo(() => {
    const term = customerSearch.toLowerCase();
    return refData.customers.filter(
      (c) =>
        c.name.toLowerCase().includes(term) ||
        (c.phone || "").includes(term),
    );
  }, [refData.customers, customerSearch]);

  // ---- Modal state ----
  const [showCreate, setShowCreate] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const [selected, setSelected] = useState<ManualRecord | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [form, setForm] = useState<CreateManualRecordFormData>({
    ...emptyForm,
  });

  const resetForm = () => setForm({ ...emptyForm });

  const setField = (key: keyof CreateManualRecordFormData, value: string) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  // ---- Open handlers ----
  const openCreate = () => {
    resetForm();
    setCustomerSearch("");
    setShowCreate(true);
  };

  const openEdit = (record: ManualRecord) => {
    setSelected(record);
    setForm({
      customerId: record.customerId?.toString() || "",
      yardId: record.yardId?.toString() || "",
      campaignId: record.campaignId?.toString() || "",
      campaignOption: record.campaignOption || "",
      disposition: record.disposition || "",
      notes: record.notes || "",
    });
    setCustomerSearch("");
    setShowEdit(true);
  };

  const openDelete = (record: ManualRecord) => {
    setSelected(record);
    setShowDelete(true);
  };

  // ---- CRUD handlers ----
  const handleCreate = async () => {
    if (!form.customerId) {
      toast({
        title: "Error",
        description: "Customer is required",
        variant: "destructive",
      });
      return;
    }
    try {
      setIsSubmitting(true);
      const payload: any = { customerId: Number(form.customerId) };
      if (form.yardId) payload.yardId = Number(form.yardId);
      if (form.campaignId) payload.campaignId = Number(form.campaignId);
      if (form.campaignOption) payload.campaignOption = form.campaignOption;
      if (form.disposition) payload.disposition = form.disposition;
      if (form.notes.trim()) payload.notes = form.notes.trim();

      const res = await fetch("/api/manual-records", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const result = await res.json();
      if (result.success) {
        toast({ title: "Record created successfully" });
        setShowCreate(false);
        resetForm();
        await mutate();
      } else {
        toast({
          title: "Error",
          description: result.message,
          variant: "destructive",
        });
      }
    } catch {
      toast({
        title: "Error",
        description: "Failed to create record",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdate = async () => {
    if (!selected) return;
    try {
      setIsSubmitting(true);
      const payload: any = {};
      if (form.customerId) payload.customerId = Number(form.customerId);
      if (form.yardId) payload.yardId = Number(form.yardId);
      else payload.yardId = null;
      if (form.campaignId) payload.campaignId = Number(form.campaignId);
      else payload.campaignId = null;
      payload.campaignOption = form.campaignOption || null;
      payload.disposition = form.disposition || null;
      payload.notes = form.notes.trim() || null;

      const res = await fetch(`/api/manual-records/${selected.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const result = await res.json();
      if (result.success) {
        toast({ title: "Record updated successfully" });
        setShowEdit(false);
        resetForm();
        await mutate();
      } else {
        toast({
          title: "Error",
          description: result.message,
          variant: "destructive",
        });
      }
    } catch {
      toast({
        title: "Error",
        description: "Failed to update record",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!selected) return;
    try {
      setIsSubmitting(true);
      const res = await fetch(`/api/manual-records/${selected.id}`, {
        method: "DELETE",
      });
      const result = await res.json();
      if (result.success) {
        toast({ title: "Record deleted" });
        setShowDelete(false);
        setSelected(null);
        await mutate();
      } else {
        toast({
          title: "Error",
          description: result.message,
          variant: "destructive",
        });
      }
    } catch {
      toast({
        title: "Error",
        description: "Failed to delete record",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // ---- Shared form fields (reused in create & edit) ----
  const renderFormFields = () => (
    <div className="grid gap-4 py-4">
      {/* Customer */}
      <div className="grid gap-1.5">
        <Label htmlFor="mr-customerId">
          Customer <span className="text-destructive">*</span>
        </Label>
        <div className="space-y-1.5">
          <Input
            placeholder="Search customer..."
            value={customerSearch}
            onChange={(e) => setCustomerSearch(e.target.value)}
            className="h-9"
          />
          <Select
            value={form.customerId}
            onValueChange={(v) => setField("customerId", v)}
          >
            <SelectTrigger id="mr-customerId" className="h-9">
              <SelectValue placeholder="Select customer" />
            </SelectTrigger>
            <SelectContent>
              <ScrollArea className="h-48">
                {filteredCustomers.slice(0, 80).map((c) => (
                  <SelectItem key={c.id} value={c.id.toString()}>
                    {c.name}
                    {c.phone ? (
                      <span className="ml-1 text-muted-foreground text-xs">
                        {c.phone}
                      </span>
                    ) : null}
                  </SelectItem>
                ))}
              </ScrollArea>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Yard */}
      <div className="grid gap-1.5">
        <Label htmlFor="mr-yardId">Yard</Label>
        <Select
          value={form.yardId || "none"}
          onValueChange={(v) => setField("yardId", v === "none" ? "" : v)}
        >
          <SelectTrigger id="mr-yardId" className="h-9">
            <SelectValue placeholder="Select yard" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">— None —</SelectItem>
            {refData.yards.map((y) => (
              <SelectItem key={y.id} value={y.id.toString()}>
                {y.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Campaign */}
      <div className="grid gap-1.5">
        <Label htmlFor="mr-campaignId">Campaign</Label>
        <Select
          value={form.campaignId || "none"}
          onValueChange={(v) => {
            setField("campaignId", v === "none" ? "" : v);
            setField("campaignOption", ""); // reset option when campaign changes
          }}
        >
          <SelectTrigger id="mr-campaignId" className="h-9">
            <SelectValue placeholder="Select campaign" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">— None —</SelectItem>
            {refData.campaigns.map((c) => (
              <SelectItem key={c.id} value={c.id.toString()}>
                {c.nombre}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Campaign Option */}
      {form.campaignId && (
        <div className="grid gap-1.5">
          <Label htmlFor="mr-campaignOption">Campaign Option</Label>
          <Select
            value={form.campaignOption || "none"}
            onValueChange={(v) =>
              setField("campaignOption", v === "none" ? "" : v)
            }
          >
            <SelectTrigger id="mr-campaignOption" className="h-9">
              <SelectValue placeholder="Select option" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">— None —</SelectItem>
              {getFormCampaignOptions(form.campaignId).map((opt) => (
                <SelectItem key={opt} value={opt}>
                  {formatLabel(opt)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Disposition */}
      <div className="grid gap-1.5">
        <Label htmlFor="mr-disposition">Disposition</Label>
        <Select
          value={form.disposition || "none"}
          onValueChange={(v) =>
            setField("disposition", v === "none" ? "" : v)
          }
        >
          <SelectTrigger id="mr-disposition" className="h-9">
            <SelectValue placeholder="Select disposition" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">— None —</SelectItem>
            {Object.values(CallDisposition).map((d) => (
              <SelectItem key={d} value={d}>
                {formatLabel(d)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Notes */}
      <div className="grid gap-1.5">
        <Label htmlFor="mr-notes">Notes</Label>
        <Textarea
          id="mr-notes"
          value={form.notes}
          onChange={(e) => setField("notes", e.target.value)}
          placeholder="Add notes..."
          rows={3}
          className="resize-none"
        />
      </div>
    </div>
  );

  // ---- Render ----
  return (
    <div className="flex flex-col gap-3">
      {/* Header */}
      <div className="flex items-center justify-between pb-2 border-b border-border">
        <div />
        <button
          type="button"
          onClick={openCreate}
          className="flex items-center gap-1.5 h-8 px-3.5 text-white text-xs font-semibold rounded-lg transition-colors"
          style={{ background: "#008f68" }}
          onMouseEnter={(e) => (e.currentTarget.style.background = "#007a5a")}
          onMouseLeave={(e) => (e.currentTarget.style.background = "#008f68")}
        >
          <Plus className="w-3.5 h-3.5" />
          New Record
        </button>
      </div>

      {/* Filters row */}
      <div className="space-y-2">
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative w-64">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by customer..."
              value={filters.search}
              onChange={(e) => filters.setSearch(e.target.value)}
              className="pl-8 h-9"
            />
          </div>

          <Button
            variant={
              filtersOpen || activeFilterCount > 0 ? "secondary" : "outline"
            }
            size="sm"
            className="h-9 text-xs"
            onClick={() => setFiltersOpen(!filtersOpen)}
          >
            <SlidersHorizontal className="mr-1.5 h-3.5 w-3.5" />
            More Filters
            {activeFilterCount > 0 && (
              <Badge
                variant="default"
                className="ml-1.5 h-4 min-w-4 px-1 text-[10px] leading-none"
              >
                {activeFilterCount}
              </Badge>
            )}
          </Button>

          {activeFilterCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="h-9 text-xs text-muted-foreground"
              onClick={filters.clearAllFilters}
            >
              <X className="mr-1 h-3 w-3" />
              Clear all
            </Button>
          )}
        </div>

        {/* Expanded filters */}
        {filtersOpen && (
          <div className="flex flex-wrap items-end gap-3 rounded-lg border bg-muted/30 p-3">
            {/* Yard */}
            <div className="min-w-35 space-y-1">
              <span className="text-[11px] font-medium text-muted-foreground">
                Yard
              </span>
              <Select
                value={filters.filters.yard}
                onValueChange={(v) => filters.setFilter("yard", v)}
              >
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue placeholder="All" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Yards</SelectItem>
                  {refData.yards.map((y) => (
                    <SelectItem key={y.id} value={y.id.toString()}>
                      {y.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Campaign */}
            <div className="min-w-40 space-y-1">
              <span className="text-[11px] font-medium text-muted-foreground">
                Campaign
              </span>
              <Select
                value={filters.filters.campaign}
                onValueChange={(v) => filters.setFilter("campaign", v)}
              >
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue placeholder="All" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Campaigns</SelectItem>
                  {refData.campaigns.map((c) => (
                    <SelectItem key={c.id} value={c.id.toString()}>
                      {c.nombre}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Disposition */}
            <div className="min-w-40 space-y-1">
              <span className="text-[11px] font-medium text-muted-foreground">
                Disposition
              </span>
              <Select
                value={filters.filters.disposition}
                onValueChange={(v) => filters.setFilter("disposition", v)}
              >
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue placeholder="All" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  {Object.values(CallDisposition).map((d) => (
                    <SelectItem key={d} value={d}>
                      {formatLabel(d)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        )}
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-xl border border-slate-200 shadow-sm">
        <Table>
          <TableHeader>
            <TableRow className="bg-slate-50/80 hover:bg-slate-50/80 border-b border-slate-200">
              <TableHead className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">ID</TableHead>
              <TableHead className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Customer</TableHead>
              <TableHead className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Yard</TableHead>
              <TableHead className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Campaign</TableHead>
              <TableHead className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Campaign Option</TableHead>
              <TableHead className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Disposition</TableHead>
              <TableHead className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Notes</TableHead>
              <TableHead className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Date</TableHead>
              <TableHead className="w-20 text-right text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={9} className="h-32 text-center">
                  <Loader2 className="mx-auto h-5 w-5 animate-spin text-slate-400" />
                </TableCell>
              </TableRow>
            ) : records.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} className="h-32 text-center text-slate-400 text-sm">
                  No records found
                </TableCell>
              </TableRow>
            ) : (
              records.map((record) => {
                const initials = (record.customer?.name || "?").substring(0, 2).toUpperCase();
                const dp = record.disposition ? (DISP_PILL[record.disposition] || { dot: "#94a3b8", bg: "#f1f5f9", fg: "#475569" }) : null;
                return (
                  <TableRow key={record.id} className="group border-b border-slate-100 last:border-0 hover:bg-[#f8fafc]">
                    <TableCell className="text-[11px] font-mono text-slate-400">#{record.id}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div
                          className="w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-bold shrink-0"
                          style={{ background: "transparent", border: "1px solid #d1d5db", color: "#111827" }}
                        >
                          {initials}
                        </div>
                        <div className="min-w-0">
                          <p className="text-[13px] font-semibold text-slate-800 truncate">{record.customer?.name || `#${record.customerId}`}</p>
                          {record.customer?.phone && (
                            <p className="text-[11px] text-slate-400 font-mono">{record.customer.phone}</p>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-[12px] text-slate-600">
                      {record.yard?.name || (record.yardId ? `#${record.yardId}` : "—")}
                    </TableCell>
                    <TableCell className="text-[12px] text-slate-600">
                      {record.campaign ? (record.campaign as any).nombre || `#${record.campaignId}` : record.campaignId ? `#${record.campaignId}` : "—"}
                    </TableCell>
                    <TableCell className="text-[12px] text-slate-600">
                      {record.campaignOption ? formatLabel(record.campaignOption) : "—"}
                    </TableCell>
                    <TableCell>
                      {dp ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-[3px] rounded-full text-[11px] font-semibold border"
                          style={{ color: dp.fg, background: dp.bg, borderColor: dp.bg }}>
                          <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: dp.dot }} />
                          {formatLabel(record.disposition!)}
                        </span>
                      ) : (
                        <span className="text-slate-400 text-xs">—</span>
                      )}
                    </TableCell>
                    <TableCell className="max-w-48 truncate text-[12px] text-slate-500">{record.notes || "—"}</TableCell>
                    <TableCell className="text-[11px] text-slate-400 font-mono whitespace-nowrap">
                      {record.createdAt ? new Date(record.createdAt).toLocaleDateString() : "—"}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button type="button" onClick={() => openEdit(record)} title="Edit"
                          className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors">
                          <Pencil className="h-3.5 w-3.5" />
                        </button>
                        <button type="button" onClick={() => openDelete(record)} title="Delete"
                          className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-500 transition-colors">
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between px-1">
        <span className="text-[11px] text-slate-500">
          Page <span className="font-semibold text-slate-700">{filters.currentPage}</span> of {totalPages} · {totalCount} record{totalCount !== 1 ? "s" : ""}
        </span>
        <div className="flex items-center gap-2">
          <Select value={String(filters.itemsPerPage)} onValueChange={(v) => filters.setItemsPerPage(Number(v))}>
            <SelectTrigger className="h-7 w-20 text-[11px] border-slate-200 rounded-lg">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {[8, 10, 25, 50].map((n) => (
                <SelectItem key={n} value={String(n)}>{n} / page</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <div className="flex items-center gap-1">
            <button type="button"
              className="w-7 h-7 flex items-center justify-center rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 disabled:opacity-40 transition-colors"
              disabled={filters.currentPage <= 1}
              onClick={() => filters.setCurrentPage((p) => p - 1)}>
              <ChevronLeft className="h-3.5 w-3.5" />
            </button>
            <button type="button"
              className="w-7 h-7 flex items-center justify-center rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 disabled:opacity-40 transition-colors"
              disabled={filters.currentPage >= totalPages}
              onClick={() => filters.setCurrentPage((p) => p + 1)}>
              <ChevronRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* ── Create Dialog ── */}
      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>New Manual Record</DialogTitle>
          </DialogHeader>
          <ScrollArea className="max-h-[65vh] pr-2">
            {renderFormFields()}
          </ScrollArea>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowCreate(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button onClick={handleCreate} disabled={isSubmitting}>
              {isSubmitting && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Create Record
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Edit Dialog ── */}
      <Dialog open={showEdit} onOpenChange={setShowEdit}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              Edit Record{selected ? ` #${selected.id}` : ""}
            </DialogTitle>
          </DialogHeader>
          <ScrollArea className="max-h-[65vh] pr-2">
            {renderFormFields()}
          </ScrollArea>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowEdit(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button onClick={handleUpdate} disabled={isSubmitting}>
              {isSubmitting && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Delete Confirmation ── */}
      <AlertDialog open={showDelete} onOpenChange={setShowDelete}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this record?</AlertDialogTitle>
            <AlertDialogDescription>
              Record #{selected?.id} for{" "}
              <strong>
                {selected?.customer?.name || `Customer #${selected?.customerId}`}
              </strong>{" "}
              will be permanently deleted. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isSubmitting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isSubmitting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isSubmitting && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
