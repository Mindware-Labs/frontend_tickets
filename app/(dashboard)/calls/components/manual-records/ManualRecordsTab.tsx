"use client";

import React, { useState, useMemo, useEffect, useRef, useCallback } from "react";
import { useReturnToTimeline } from "../../hooks/useReturnToTimeline";
import { DeepLinkFocusBanner } from "../shared/DeepLinkFocusBanner";
import useSWR from "swr";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
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
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Plus,
  Search,
  Loader2,
  X,
  ClipboardList,
  CalendarIcon,
  ChevronDown,
  RotateCcw,
} from "lucide-react";
import { ManualRecordFiltersBar } from "./ManualRecordFiltersBar";
import { ManualRecordForm } from "./ManualRecordForm";
import {
  InlineManualRecordTimeline,
  type CustomerManualRecordGroup,
} from "./InlineManualRecordTimeline";
import { CustomerManualRecordDrawer } from "./CustomerManualRecordDrawer";
import { useAircall } from "@/components/providers/AircallProvider";
import { DataTablePagination } from "../shared/DataTablePagination";
import { TableLoadingRow } from "@/components/shared/entity-loading-state";
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
import {
  TableCampaignBadge,
  TableYardBadge,
} from "@/components/entity-table-badges";
import {
  TableDispositionPill,
  TableSupportStatusPill,
  normalizeSupportStatusKey,
} from "@/components/entity-table-pills";
import { cn } from "@/lib/utils";
import { toast } from "@/hooks/use-toast";
import { useReferenceData } from "../../hooks/useReferenceData";
import { useManualRecordFilters } from "../../hooks/useManualRecordFilters";
import { getAttachmentUrl } from "../../utils/call-helpers";
import {
  SupportTicketStatus,
  type ManualRecord,
  type CreateManualRecordFormData,
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

const MANUAL_RECORD_STATUS_VIEW_TABS = [
  { key: "all", label: "All Records", countKey: "all" },
  { key: "active_status", label: "Active", countKey: "active_status" },
  {
    key: "pending_followup",
    label: "Pending Follow-up",
    countKey: "pending_followup",
  },
  { key: "overdue", label: "Overdue", countKey: "overdue", isOverdue: true },
  { key: "resolved", label: "Resolved", countKey: "resolved" },
] as const;

const recordAgentName = (record: ManualRecord) =>
  record.createdBy?.name?.trim() ||
  record.createdByName?.trim() ||
  (record.createdByAgentId ? `Agent #${record.createdByAgentId}` : "—");

const emptyForm: CreateManualRecordFormData = {
  customerId: "",
  yardId: "",
  campaignId: "",
  campaignOption: "",
  disposition: "",
  status: SupportTicketStatus.ACTIVE,
  notes: "",
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
export function ManualRecordsTab() {
  const refData = useReferenceData();
  const returnTo = useReturnToTimeline(refData.customers);
  const isNavigatingBackRef = useRef(false);
  const filters = useManualRecordFilters();
  const focusRecordId = filters.focusRecordId;
  const isFocusMode = Boolean(focusRecordId?.trim());

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

  const viewCounts = pageData?.viewCounts as Record<string, number> | undefined;

  const {
    dial,
    status: aircallStatus,
    isLoggedIn: aircallLoggedIn,
    setSheetOpen,
  } = useAircall();
  const canDial = aircallStatus === "ready" && aircallLoggedIn;
  const currentAgentName =
    refData.currentAgent?.name?.trim() ||
    [refData.currentUser?.name, refData.currentUser?.lastName]
      .filter(Boolean)
      .join(" ")
      .trim() ||
    null;

  const [expandedKey, setExpandedKey] = useState<string | null>(null);
  const recordGroups = useMemo<CustomerManualRecordGroup[]>(() => {
    const map = new Map<
      string,
      {
        key: string;
        customerId?: number;
        customerName: string;
        customerPhone: string;
        records: ManualRecord[];
        latestRecord: ManualRecord;
      }
    >();

    for (const r of records) {
      const cid = r.customerId != null ? Number(r.customerId) : undefined;
      const phone = r.customer?.phone || "unknown";
      const name = r.customer?.name || (cid ? `Customer #${cid}` : "Unknown");
      const groupKey = cid != null ? `cid:${cid}` : `phone:${phone}`;

      const existing = map.get(groupKey);
      if (!existing) {
        map.set(groupKey, {
          key: groupKey,
          customerId: cid,
          customerName: name,
          customerPhone: phone,
          records: [r],
          latestRecord: r,
        });
      } else {
        existing.records.push(r);
        const existingDate = new Date(
          existing.latestRecord.createdAt || 0,
        ).getTime();
        const thisDate = new Date(r.createdAt || 0).getTime();
        if (thisDate > existingDate) {
          existing.latestRecord = r;
        }
        // Upgrade fallback name/phone if this record has the real customer relation
        if (r.customer?.name && existing.customerName === `Customer #${cid}`) {
          existing.customerName = r.customer.name;
        }
        if (r.customer?.phone && existing.customerPhone === "unknown") {
          existing.customerPhone = r.customer.phone;
        }
      }
    }

    return Array.from(map.values()).sort(
      (a, b) =>
        new Date(b.latestRecord.createdAt || 0).getTime() -
        new Date(a.latestRecord.createdAt || 0).getTime(),
    );
  }, [records]);

  // ---- Modal / sheet state ----
  const [showCreate, setShowCreate] = useState(false);
  const [showDrawer, setShowDrawer] = useState(false);
  const [drawerGroup, setDrawerGroup] =
    useState<CustomerManualRecordGroup | null>(null);
  const [showDelete, setShowDelete] = useState(false);
  const [selected, setSelected] = useState<ManualRecord | null>(null);
  const [showDrawerSuccess, setShowDrawerSuccess] = useState(false);
  const [showDrawerError, setShowDrawerError] = useState(false);
  const [drawerErrorMessage, setDrawerErrorMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [form, setForm] = useState<CreateManualRecordFormData>({
    ...emptyForm,
  });
  const [pendingFiles, setPendingFiles] = useState<File[]>([]);

  const resetForm = () => {
    setForm({ ...emptyForm });
    setPendingFiles([]);
  };

  const resolveAttachmentUrl = (value: string) =>
    getAttachmentUrl(value, refData.apiBase, "manual-records");

  useEffect(() => {
    setSheetOpen(showDrawer);
    return () => setSheetOpen(false);
  }, [showDrawer, setSheetOpen]);

  const uploadPendingAttachments = async (recordId: number) => {
    if (pendingFiles.length === 0) return 0;
    let uploadErrors = 0;
    for (const file of pendingFiles) {
      const fd = new FormData();
      fd.append("file", file);
      try {
        const upRes = await fetch(
          `/api/manual-records/${recordId}/attachments`,
          {
            method: "POST",
            body: fd,
          },
        );
        const upResult = await upRes.json();
        if (!upResult.success) uploadErrors++;
      } catch {
        uploadErrors++;
      }
    }
    return uploadErrors;
  };

  // ---- Open handlers ----
  const openCreate = () => {
    resetForm();
    setShowCreate(true);
  };

  const populateFormFromRecord = (record: ManualRecord) => {
    setForm({
      customerId: record.customerId?.toString() || "",
      yardId: record.yardId?.toString() || "",
      campaignId: record.campaignId?.toString() || "",
      campaignOption: record.campaignOption || "",
      disposition: record.disposition || "",
      status:
        normalizeSupportStatusKey(record.status) || SupportTicketStatus.ACTIVE,
      notes: record.notes || "",
    });
    setPendingFiles([]);
  };

  const openView = useCallback((record: ManualRecord) => {
    const group =
      recordGroups.find((g) => g.records.some((r) => r.id === record.id)) ??
      null;
    setSelected(record);
    setDrawerGroup(group);
    populateFormFromRecord(record);
    setShowDrawer(true);
  }, [recordGroups]);

  const processedFocusRecordIdRef = useRef<string | null>(null);

  const handleBackToTimeline = () => {
    if (!returnTo.safeReturnPath) return;
    isNavigatingBackRef.current = true;
    setShowDrawer(false);
    setShowDrawerSuccess(false);
    setShowDrawerError(false);
    processedFocusRecordIdRef.current = null;
    filters.leaveManualRecordFocus(returnTo.safeReturnPath);
  };

  const handleCloseDrawer = () => {
    setShowDrawer(false);
    setShowDrawerSuccess(false);
    setShowDrawerError(false);
    resetForm();
    if (focusRecordId && !isNavigatingBackRef.current) {
      filters.clearManualRecordFocus();
    }
    isNavigatingBackRef.current = false;
  };

  useEffect(() => {
    if (!focusRecordId) {
      processedFocusRecordIdRef.current = null;
      return;
    }
    if (processedFocusRecordIdRef.current === focusRecordId) return;

    let cancelled = false;

    const openFromUrl = async () => {
      const fromList = records.find((r) => r.id.toString() === focusRecordId);
      if (fromList) {
        if (cancelled) return;
        processedFocusRecordIdRef.current = focusRecordId;
        openView(fromList);
        return;
      }

      try {
        const response = await fetch(`/api/manual-records/${focusRecordId}`);
        if (!response.ok || cancelled) return;
        const payload = await response.json();
        const resolved = payload?.data ?? payload;
        if (!resolved || cancelled) return;
        processedFocusRecordIdRef.current = focusRecordId;
        openView(resolved as ManualRecord);
      } catch {
        // ignore
      }
    };

    void openFromUrl();

    return () => {
      cancelled = true;
    };
  }, [focusRecordId, records, openView]);

  const handleSelectRecord = (record: ManualRecord) => {
    setSelected(record);
    populateFormFromRecord(record);
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
      if (refData.currentAgent?.id) {
        payload.createdByAgentId = refData.currentAgent.id;
      }

      const res = await fetch("/api/manual-records", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const result = await res.json();
      if (result.success) {
        const recordId = result.data?.id;
        if (recordId && pendingFiles.length > 0) {
          const uploadErrors = await uploadPendingAttachments(recordId);
          if (uploadErrors > 0) {
            toast({
              title: "Warning",
              description: `${uploadErrors} file(s) failed to upload`,
              variant: "destructive",
            });
          }
        }
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
      if (form.status) payload.status = form.status;

      const res = await fetch(`/api/manual-records/${selected.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const result = await res.json();
      if (result.success) {
        if (pendingFiles.length > 0) {
          const uploadErrors = await uploadPendingAttachments(selected.id);
          if (uploadErrors > 0) {
            setDrawerErrorMessage(`${uploadErrors} file(s) failed to upload`);
            setShowDrawerError(true);
          }
        }
        setShowDrawerSuccess(true);
        if (result.data) {
          setSelected(result.data);
          populateFormFromRecord(result.data);
        }
        await mutate();
      } else {
        setDrawerErrorMessage(result.message ?? "Failed to update record");
        setShowDrawerError(true);
      }
    } catch {
      setDrawerErrorMessage("Failed to update record");
      setShowDrawerError(true);
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
        setShowDrawer(false);
        setSelected(null);
        setDrawerGroup(null);
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
        description: "Failed to delete record",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const createDialogContent = (
    <DialogContent className="max-h-[calc(100dvh-2rem)] max-w-[calc(100%-1.5rem)] gap-0 overflow-hidden rounded-2xl border-slate-200 bg-white p-0 shadow-2xl sm:max-w-[760px]">
      <DialogHeader className="border-b border-slate-100 px-5 py-4 pr-12 text-left sm:px-6">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-dashed border-slate-200 bg-slate-50 text-[#008f68]">
            <ClipboardList className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <DialogTitle className="text-[15px] font-semibold leading-5 text-slate-950">
              New Manual Record
            </DialogTitle>
            <DialogDescription className="mt-1 text-[13px] leading-5 text-slate-500">
              Fill in the details to log a manual record.
            </DialogDescription>
          </div>
        </div>
      </DialogHeader>
      <div className="max-h-[68dvh] overflow-y-auto bg-[#f4f5f7] px-3 py-2 sm:px-3.5 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-slate-200">
        <ManualRecordForm
          form={form}
          setForm={setForm}
          customers={[]}
          yards={refData.yards}
          campaigns={refData.campaigns}
          mode="create"
          createdByName={currentAgentName}
          pendingFiles={pendingFiles}
          onFilesChange={setPendingFiles}
          getAttachmentUrl={resolveAttachmentUrl}
        />
      </div>
      <div className="flex flex-col gap-3 border-t border-slate-100 bg-slate-50/80 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <Button
          type="button"
          variant="outline"
          onClick={() => setShowCreate(false)}
          disabled={isSubmitting}
          className="h-11 rounded-lg border-slate-200 bg-white px-5 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50"
        >
          Cancel
        </Button>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <Button
            type="button"
            variant="outline"
            onClick={resetForm}
            disabled={isSubmitting}
            className="h-11 rounded-lg border-slate-200 bg-white px-5 text-sm font-semibold text-slate-400 shadow-sm hover:text-slate-600"
          >
            <RotateCcw className="mr-2 h-4 w-4" />
            Reset
          </Button>
          <Button
            type="button"
            onClick={handleCreate}
            disabled={isSubmitting}
            className="h-11 rounded-lg bg-[#008f68] px-6 text-sm font-semibold text-white shadow-sm hover:bg-[#007a5a] disabled:opacity-60"
          >
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isSubmitting ? "Creating..." : "Create Record"}
          </Button>
        </div>
      </div>
    </DialogContent>
  );

  // ---- Render ----
  return (
    <div className="flex-1 flex flex-col gap-1">
      {/* View Tabs */}
      <div className="flex items-end border-b border-border">
        <div className="flex min-w-0 flex-1 items-end overflow-x-auto overflow-y-hidden [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
          <div className="flex px-0.5">
            {MANUAL_RECORD_STATUS_VIEW_TABS.map((tab) => {
              const isActive = filters.activeView === tab.key;
              const count = viewCounts?.[tab.countKey] ?? 0;
              return (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => filters.handleViewChange(tab.key)}
                  className={`-mb-px mr-2 flex shrink-0 items-center gap-2 whitespace-nowrap rounded-t-md border-b-2 px-3 py-2 text-[13px] transition-colors ${
                    isActive
                      ? "border-[#008f68] bg-[#f0faf5] font-semibold text-[#008f68] dark:bg-emerald-500/10 dark:text-emerald-400"
                      : "border-transparent font-medium text-muted-foreground hover:bg-slate-50 hover:text-foreground dark:hover:bg-slate-800/40"
                  }`}
                >
                  {tab.label}
                  <span
                    className={`rounded-full border px-[7px] py-[1px] text-[11px] ${
                      isActive
                        ? "border-[#008f68] bg-[#008f68] font-semibold text-white"
                        : "border-border bg-muted/40 font-medium text-muted-foreground"
                    }`}
                  >
                    {count}
                  </span>
                  {"isOverdue" in tab && tab.isOverdue && count > 0 && (
                    <div className="-ml-0.5 h-2 w-2 animate-pulse rounded-full bg-red-500" />
                  )}
                </button>
              );
            })}
          </div>
        </div>
        <button
          type="button"
          onClick={openCreate}
          className="mb-1 ml-2 flex h-[30px] shrink-0 items-center gap-1.5 rounded-full px-3.5 text-[12.5px] font-semibold text-white shadow-sm transition-all active:scale-95"
          style={{ background: "#008f68" }}
          onMouseEnter={(e) => (e.currentTarget.style.background = "#007a5a")}
          onMouseLeave={(e) => (e.currentTarget.style.background = "#008f68")}
        >
          <Plus className="h-3.5 w-3.5" />
          New Record
        </button>
      </div>

      {isFocusMode && focusRecordId ? (
        <DeepLinkFocusBanner
          entityLabel="record"
          entityId={focusRecordId}
          onClear={() => filters.clearManualRecordFocus()}
        />
      ) : null}

      {/* Filters row */}
      <div className="space-y-2">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 my-3">
          <div className="flex min-w-0 flex-col gap-2 sm:flex-row sm:items-center">
            <div className="relative flex-1 max-w-[320px]">
              <Search className="absolute left-3 top-1/2 h-[14px] w-[14px] -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search customers or notes..."
                value={filters.search}
                readOnly={isFocusMode}
                onChange={(e) => {
                  if (!isFocusMode) filters.setSearch(e.target.value);
                }}
                className="h-[30px] rounded-full border-border bg-muted/30 pl-[34px] pr-8 text-[12.5px] shadow-none focus-visible:border-[#008f68]/40 focus-visible:ring-[#008f68]/30"
              />
              <div className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded border border-border bg-background px-1.5 py-[1px] font-mono text-[10px] text-muted-foreground">
                /
              </div>
            </div>

          </div>

          <div
            className={cn(
              "flex flex-wrap items-center gap-3 sm:justify-end",
              isFocusMode && "pointer-events-none opacity-60",
            )}
          >
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "flex h-[30px] items-center rounded-full border-border px-3 text-[12.5px] font-medium shadow-none",
                    !filters.dateRange?.from && "text-muted-foreground",
                  )}
                >
                  <CalendarIcon className="mr-2 h-[14px] w-[14px] shrink-0" />
                  {filters.dateRange?.from ? (
                    filters.dateRange.to ? (
                      <span className="truncate">
                        {format(filters.dateRange.from, "MMM d")} -{" "}
                        {format(filters.dateRange.to, "MMM d, yyyy")}
                      </span>
                    ) : (
                      <span>
                        {format(filters.dateRange.from, "MMM d, yyyy")}
                      </span>
                    )
                  ) : (
                    <span>Select dates</span>
                  )}
                  <ChevronDown className="ml-2 h-3 w-3 text-muted-foreground" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="end">
                <div className="space-y-3 p-3">
                  <Calendar
                    initialFocus
                    mode="range"
                    selected={filters.dateRange}
                    onSelect={filters.setDateRange}
                    numberOfMonths={1}
                    disabled={{ after: new Date() }}
                    className="rounded-md"
                  />
                  {filters.dateRange?.from && (
                    <div className="flex justify-end px-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 text-xs"
                        onClick={() => filters.setDateRange(undefined)}
                      >
                        <X className="mr-1 h-3 w-3" />
                        Clear dates
                      </Button>
                    </div>
                  )}
                </div>
              </PopoverContent>
            </Popover>

            <ManualRecordFiltersBar
              filters={filters.filters}
              onFilterChange={filters.setFilter}
              agents={refData.agents}
              campaigns={refData.campaigns}
              yards={refData.yards}
            />
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-xl border border-border/80 overflow-hidden shadow-sm">
        <div className="max-h-[calc(100vh-12rem)] overflow-y-auto">
          <Table className="relative w-full table-fixed text-[12px]">
            <colgroup>
              <col className="w-[13%]" />
              <col className="w-[4%]" />
              <col className="w-[9%]" />
              <col className="w-[10%]" />
              <col className="w-[11%]" />
              <col className="w-[11%]" />
              <col className="w-[9%]" />
              <col className="w-[9%]" />
              <col className="w-[16%]" />
              <col className="w-[8%]" />
            </colgroup>
            <TableHeader className="sticky top-0 z-10 border-y border-slate-200 bg-slate-50 dark:bg-muted/40">
              <TableRow className="border-none hover:bg-transparent">
                <TableHead className="px-2 py-1.5 text-[10px] font-bold uppercase tracking-wide text-slate-500">
                  Customer
                </TableHead>
                <TableHead className="px-2 py-1.5 text-center text-[10px] font-bold uppercase tracking-wide text-slate-500">
                  Rec
                </TableHead>
                <TableHead className="px-2 py-1.5 text-center text-[10px] font-bold uppercase tracking-wide text-slate-500">
                  Status
                </TableHead>
                <TableHead className="px-2 py-1.5 text-[10px] font-bold uppercase tracking-wide text-slate-500">
                  Agent
                </TableHead>
                <TableHead className="px-2 py-1.5 text-[10px] font-bold uppercase tracking-wide text-slate-500">
                  Yard
                </TableHead>
                <TableHead className="px-2 py-1.5 text-[10px] font-bold uppercase tracking-wide text-slate-500">
                  Campaign
                </TableHead>
                <TableHead className="px-2 py-1.5 text-[10px] font-bold uppercase tracking-wide text-slate-500">
                  Option
                </TableHead>
                <TableHead className="px-2 py-1.5 text-[10px] font-bold uppercase tracking-wide text-slate-500">
                  Disposition
                </TableHead>
                <TableHead className="px-2 py-1.5 text-[10px] font-bold uppercase tracking-wide text-slate-500">
                  Notes
                </TableHead>
                <TableHead className="px-2 py-1.5 text-right text-[10px] font-bold uppercase tracking-wide text-slate-500">
                  Created
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableLoadingRow colSpan={10} kind="manual-records" compact />
              ) : recordGroups.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={10}
                    className="h-24 text-center text-sm text-slate-400"
                  >
                    No records found
                  </TableCell>
                </TableRow>
              ) : (
                recordGroups.map((group, i) => {
                  const r = group.latestRecord;
                  const isOverdue = group.records.some(
                    (rec) =>
                      (rec.status || "")
                        .toString()
                        .toUpperCase()
                        .replace(/\s+/g, "_") === "OVERDUE",
                  );
                  const initials = (group.customerName || "?")
                    .substring(0, 2)
                    .toUpperCase();
                  const createdDate = new Date(r.createdAt || "");
                  const createdLabel = isNaN(createdDate.getTime())
                    ? "—"
                    : createdDate.toDateString() === new Date().toDateString()
                      ? format(createdDate, "HH:mm")
                      : format(createdDate, "MMM d");
                  const phone =
                    group.customerPhone && group.customerPhone !== "unknown"
                      ? group.customerPhone
                      : r.customer?.phone;
                  return (
                    <React.Fragment key={group.key}>
                      <TableRow
                        className={cn(
                          "relative cursor-pointer group border-b border-border/70 transition-all duration-150 dark:hover:bg-muted/50",
                          isOverdue
                            ? "bg-red-50/70 dark:bg-red-500/10 border-l-2 border-l-red-500 hover:bg-red-100/70 dark:hover:bg-red-500/15"
                            : i % 2 === 1
                              ? "bg-slate-50/60 dark:bg-muted/20 hover:bg-[#f0faf5]/60"
                              : "bg-white dark:bg-card hover:bg-[#f0faf5]/60",
                        )}
                        onClick={() => openView(r)}
                      >
                        <TableCell className="px-2 py-0.5 align-middle">
                          <div className="flex min-w-0 items-center gap-1.5">
                            <Avatar className="h-6 w-6 shrink-0 rounded-full">
                              <AvatarFallback
                                className="rounded-full text-[10px] font-bold"
                                style={{
                                  background: "transparent",
                                  border: "1px solid #d1d5db",
                                  color: "#111827",
                                }}
                              >
                                {initials}
                              </AvatarFallback>
                            </Avatar>
                            <div className="min-w-0">
                              <div className="flex min-w-0 items-baseline gap-1">
                                <span className="shrink-0 font-mono text-[9px] font-semibold text-slate-400 tabular-nums">
                                  #{r.id}
                                </span>
                                <p
                                  className="truncate text-[12px] font-bold leading-tight text-foreground"
                                  title={group.customerName}
                                >
                                  {group.customerName}
                                </p>
                                {isOverdue ? (
                                  <span className="inline-flex shrink-0 items-center gap-0.5 rounded-full bg-red-500 px-1 py-px text-[8px] font-bold leading-none text-white shadow-sm">
                                    <span className="h-1 w-1 rounded-full bg-white animate-pulse" />
                                    OVERDUE
                                  </span>
                                ) : null}
                              </div>
                              {phone && (
                                <div className="flex min-w-0 items-center gap-0.5">
                                  <p
                                    className="truncate font-mono text-[10px] tabular-nums text-slate-500"
                                    title={phone}
                                  >
                                    {phone}
                                  </p>
                                  <button
                                    type="button"
                                    className="flex h-5 w-5 shrink-0 items-center justify-center rounded transition-colors hover:bg-[#e6f5f0] disabled:opacity-40"
                                    style={{ color: "#008f68" }}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      dial(phone, r.id);
                                    }}
                                    disabled={!canDial}
                                    aria-label="Call customer"
                                  ></button>
                                </div>
                              )}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="px-2 py-0.5 text-center align-middle">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setExpandedKey((prev) =>
                                prev === group.key ? null : group.key,
                              );
                            }}
                            className={cn(
                              "inline-flex items-center justify-center gap-0.5 rounded-full border px-2 py-0.5 text-[10.5px] font-bold transition-colors",
                              expandedKey === group.key
                                ? "border-[#86efac] bg-[#dcfce7] text-[#15803d]"
                                : "border-slate-200 bg-slate-100 text-slate-600 hover:border-[#86efac] hover:bg-[#dcfce7] hover:text-[#15803d]",
                            )}
                            aria-label="Toggle record timeline"
                            title="View record timeline"
                          >
                            <ClipboardList className="h-2.5 w-2.5" />
                            <span className="font-mono tabular-nums">
                              {group.records.length}
                            </span>
                          </button>
                        </TableCell>
                        <TableCell className="px-2 py-0.5 text-center align-middle">
                          <TableSupportStatusPill
                            status={r.status || SupportTicketStatus.ACTIVE}
                          />
                        </TableCell>
                        <TableCell className="max-w-0 px-2 py-0.5 align-middle">
                          <span
                            className="block truncate text-[11px] font-medium text-slate-700"
                            title={recordAgentName(r)}
                          >
                            {recordAgentName(r)}
                          </span>
                        </TableCell>
                        <TableCell className="max-w-0 px-2 py-0.5 align-middle">
                          <TableYardBadge
                            compact
                            name={r.yard?.commonName || r.yard?.name}
                          />
                        </TableCell>
                        <TableCell
                          className="max-w-0 px-2 py-0.5 align-middle"
                          title={(r.campaign as { nombre?: string } | null)?.nombre || undefined}
                        >
                          <TableCampaignBadge
                            compact
                            name={(r.campaign as { nombre?: string } | null)?.nombre}
                          />
                        </TableCell>
                        <TableCell
                          className="max-w-0 px-2 py-0.5 align-middle"
                          title={r.campaignOption ? formatLabel(r.campaignOption) : undefined}
                        >
                          {r.campaignOption ? (
                            <span className={cn(
                              "block truncate rounded-full px-1.5 py-px text-[10px] font-semibold w-fit",
                              r.campaignOption.includes("PAID") || r.campaignOption === "REGISTERED" || r.campaignOption === "ENROLLED"
                                ? "bg-emerald-50 text-emerald-700"
                                : r.campaignOption.includes("NOT_") || r.campaignOption === "DISPUTE" || r.campaignOption === "CANCELED"
                                  ? "bg-red-50 text-red-600"
                                  : r.campaignOption === "PROMISE_TO_PAY"
                                    ? "bg-amber-50 text-amber-700"
                                    : "bg-slate-100 text-slate-600",
                            )}>
                              {formatLabel(r.campaignOption)}
                            </span>
                          ) : (
                            <span className="text-slate-400">—</span>
                          )}
                        </TableCell>
                        <TableCell className="max-w-0 px-2 py-0.5 align-middle">
                          <TableDispositionPill disposition={r.disposition} />
                        </TableCell>
                        <TableCell
                          className="max-w-0 px-2 py-0.5 align-middle"
                          title={r.notes || undefined}
                        >
                          <span className={cn(
                            "block truncate text-[11px]",
                            r.notes ? "text-slate-600" : "text-slate-400",
                          )}>
                            {r.notes || "—"}
                          </span>
                        </TableCell>
                        <TableCell className="whitespace-nowrap px-2 py-0.5 text-right align-middle font-mono text-[10.5px] tabular-nums text-slate-500">
                          {createdLabel}
                        </TableCell>
                      </TableRow>
                      {expandedKey === group.key && (
                        <TableRow
                          key={`${group.key}-timeline`}
                          className="bg-slate-50/50 hover:bg-slate-50/50"
                        >
                          <TableCell
                            colSpan={10}
                            className="border-t-0 px-0 py-1.5"
                          >
                            <InlineManualRecordTimeline
                              group={group}
                              onOpenRecord={openView}
                            />
                          </TableCell>
                        </TableRow>
                      )}
                    </React.Fragment>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      <DataTablePagination
        currentPage={filters.currentPage}
        totalPages={totalPages}
        totalCount={totalCount}
        onPageChange={filters.setCurrentPage}
      />

      {/* ── Create Dialog ── */}
      <Dialog
        open={showCreate}
        onOpenChange={(o) => {
          setShowCreate(o);
          if (!o) resetForm();
        }}
      >
        {createDialogContent}
      </Dialog>

      <CustomerManualRecordDrawer
        open={showDrawer}
        onClose={handleCloseDrawer}
        returnToLabel={returnTo.returnBackLabel ?? undefined}
        onBackToTimeline={
          returnTo.safeReturnPath ? handleBackToTimeline : undefined
        }
        group={drawerGroup}
        selectedRecord={selected}
        onSelectRecord={handleSelectRecord}
        form={form}
        setForm={setForm}
        pendingFiles={pendingFiles}
        onFilesChange={setPendingFiles}
        isSaving={isSubmitting}
        onSave={handleUpdate}
        onDelete={() => setShowDelete(true)}
        getAttachmentUrl={resolveAttachmentUrl}
        customers={refData.customers}
        yards={refData.yards}
        campaigns={refData.campaigns}
        showSuccessToast={showDrawerSuccess}
        onSuccessToastDismiss={() => setShowDrawerSuccess(false)}
        showErrorToast={showDrawerError}
        errorToastMessage={drawerErrorMessage}
        onErrorToastDismiss={() => setShowDrawerError(false)}
      />

      {/* ── Delete Confirmation ── */}
      <AlertDialog open={showDelete} onOpenChange={setShowDelete}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this record?</AlertDialogTitle>
            <AlertDialogDescription>
              Record #{selected?.id} for{" "}
              <strong>
                {selected?.customer?.name ||
                  `Customer #${selected?.customerId}`}
              </strong>{" "}
              will be permanently deleted. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isSubmitting}>
              Cancel
            </AlertDialogCancel>
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
