"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import useSWR from "swr";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import {
  ClipboardList,
  Loader2,
  CheckCircle2,
  CalendarIcon,
  Trash2,
  AlertCircle,
  X,
  PhoneOutgoing,
} from "lucide-react";
import { useAircall } from "@/components/providers/AircallProvider";
import { cn } from "@/lib/utils";
import type { CreateManualRecordFormData, ManualRecord } from "../../types";
import type { CustomerManualRecordGroup } from "./InlineManualRecordTimeline";
import { ManualRecordForm } from "./ManualRecordForm";
import { fmtDate, fmtDateTime } from "../../utils/call-helpers";
const fetcher = async (url: string) => {
  const res = await fetch(url);
  const result = await res.json();
  if (!result.success) throw new Error(result.message || "Failed to load");
  return result.data;
};

const STATUS_PILL: Record<
  string,
  { dot: string; bg: string; fg: string; label: string }
> = {
  ACTIVE: { dot: "#008f68", bg: "#e6f5f0", fg: "#006d50", label: "Active" },
  OPEN: { dot: "#008f68", bg: "#e6f5f0", fg: "#006d50", label: "Active" },
  IN_PROGRESS: {
    dot: "#008f68",
    bg: "#e6f5f0",
    fg: "#006d50",
    label: "Active",
  },
  PENDING_FOLLOWUP: {
    dot: "#d97706",
    bg: "#fef3c7",
    fg: "#b45309",
    label: "Follow-up",
  },
  OVERDUE: { dot: "#dc2626", bg: "#fee2e2", fg: "#b91c1c", label: "Overdue" },
  RESOLVED: { dot: "#008f68", bg: "#e6f5f0", fg: "#006d50", label: "Resolved" },
  CLOSED: { dot: "#64748b", bg: "#f1f5f9", fg: "#475569", label: "Closed" },
};

const normalizeStatusKey = (status?: string | null) => {
  const key = (status || "").toString().toUpperCase().replace(/\s+/g, "_");
  return key === "OPEN" || key === "IN_PROGRESS" ? "ACTIVE" : key;
};

function RecordCard({
  record,
  isActive,
  onClick,
}: {
  record: ManualRecord;
  isActive: boolean;
  onClick: () => void;
}) {
  const ref = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    if (isActive) {
      ref.current?.scrollIntoView({ block: "nearest", behavior: "smooth" });
    }
  }, [isActive]);

  const sp =
    STATUS_PILL[normalizeStatusKey(record.status)] || STATUS_PILL.CLOSED;

  return (
    <div className="relative flex gap-2 pl-3.5 pr-2.5">
      <div className="relative z-10 mt-3 shrink-0">
        <span
          className={cn(
            "block h-3 w-3 rounded-full border-2 transition-all",
            isActive
              ? "border-[#008f68] bg-[#008f68] shadow-[0_0_0_3px_#008f6820]"
              : "border-slate-300 bg-white",
          )}
        />
      </div>
      <div className="min-w-0 flex-1">
        <button
          ref={ref}
          type="button"
          onClick={onClick}
          className={cn(
            "mb-1 w-full rounded-xl border p-2.5 text-left transition-all",
            isActive
              ? "border-[#008f68]/20 bg-[#008f68]/5 shadow-sm"
              : "border-slate-100 bg-white hover:border-slate-200 hover:bg-slate-50/60",
          )}
        >
          <div className="mb-1.5 flex items-center justify-between gap-1">
            <span
              className={cn(
                "font-mono text-[11px] font-bold",
                isActive ? "text-[#008f68]" : "text-slate-700",
              )}
            >
              #{record.id}
            </span>
            <span className="text-[9.5px] tabular-nums text-slate-400">
              {record.createdAt ? fmtDateTime(record.createdAt) : "—"}
            </span>
          </div>
          <span
            className="inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[9.5px] font-semibold"
            style={{ color: sp.fg, background: sp.bg }}
          >
            <span
              className="h-1.5 w-1.5 shrink-0 rounded-full"
              style={{ background: sp.dot }}
            />
            {sp.label}
          </span>
        </button>
      </div>
    </div>
  );
}

export interface CustomerManualRecordDrawerProps {
  open: boolean;
  onClose: () => void;
  group: CustomerManualRecordGroup | null;
  selectedRecord: ManualRecord | null;
  onSelectRecord: (record: ManualRecord) => void;
  form: CreateManualRecordFormData;
  setForm: React.Dispatch<React.SetStateAction<CreateManualRecordFormData>>;
  pendingFiles: File[];
  onFilesChange: (files: File[]) => void;
  isSaving: boolean;
  onSave: () => void;
  onDelete?: () => void;
  getAttachmentUrl: (value: string) => string;
  customers: { id: number; name: string; phone?: string | null }[];
  yards: { id: number; name: string }[];
  campaigns: { id: number; nombre: string; tipo?: string; yardaId?: number }[];
  showSuccessToast?: boolean;
  onSuccessToastDismiss?: () => void;
  showErrorToast?: boolean;
  errorToastMessage?: string;
  onErrorToastDismiss?: () => void;
}

export function CustomerManualRecordDrawer({
  open,
  onClose,
  group,
  selectedRecord,
  onSelectRecord,
  form,
  setForm,
  pendingFiles,
  onFilesChange,
  isSaving,
  onSave,
  onDelete,
  getAttachmentUrl,
  customers,
  yards,
  campaigns,
  showSuccessToast,
  onSuccessToastDismiss,
  showErrorToast,
  errorToastMessage,
  onErrorToastDismiss,
}: CustomerManualRecordDrawerProps) {
  const historyUrl = useMemo(() => {
    if (!open || !group?.customerId) return null;
    const params = new URLSearchParams();
    params.set("page", "1");
    params.set("limit", "200");
    params.set("customerId", String(group.customerId));
    return `/api/manual-records?${params.toString()}`;
  }, [open, group?.customerId]);

  const { data: historyData, isLoading: isLoadingHistory } = useSWR(
    historyUrl,
    fetcher,
    { revalidateOnFocus: false },
  );

  const allRecords = useMemo<ManualRecord[]>(() => {
    const raw = Array.isArray(historyData)
      ? historyData
      : historyData?.data || [];
    if (raw.length > 0) {
      return [...raw].sort(
        (a, b) =>
          new Date(b.createdAt || 0).getTime() -
          new Date(a.createdAt || 0).getTime(),
      );
    }
    return [...(group?.records ?? [])].sort(
      (a, b) =>
        new Date(b.createdAt || 0).getTime() -
        new Date(a.createdAt || 0).getTime(),
    );
  }, [historyData, group?.records]);

  const activeRecordId = selectedRecord?.id ?? group?.latestRecord?.id;
  const customerName =
    group?.customerName ?? selectedRecord?.customer?.name ?? "Unknown";
  const customerPhone =
    group?.customerPhone ?? selectedRecord?.customer?.phone ?? "";
  const recordCount = allRecords.length || group?.records.length || 0;

  const sp = selectedRecord
    ? STATUS_PILL[normalizeStatusKey(selectedRecord.status)] || null
    : null;

  const recordAgentName =
    selectedRecord?.createdBy?.name?.trim() ||
    selectedRecord?.createdByName?.trim() ||
    (selectedRecord?.createdByAgentId
      ? `Agent #${selectedRecord.createdByAgentId}`
      : null);

  const {
    dial,
    status: aircallStatus,
    isLoggedIn: aircallLoggedIn,
  } = useAircall();
  const canDial = aircallStatus === "ready" && aircallLoggedIn;
  const dialPhone =
    selectedRecord?.customer?.phone ||
    group?.customerPhone ||
    "";
  const dialPhoneNormalized =
    dialPhone && dialPhone !== "unknown" ? dialPhone : "";

  const [toastVisible, setToastVisible] = useState(false);
  const [toastActive, setToastActive] = useState(false);

  useEffect(() => {
    if (!showSuccessToast) {
      setToastVisible(false);
      const t = setTimeout(() => setToastActive(false), 300);
      return () => clearTimeout(t);
    }
    setToastActive(true);
    const raf = requestAnimationFrame(() =>
      requestAnimationFrame(() => setToastVisible(true)),
    );
    const dismiss = setTimeout(() => {
      setToastVisible(false);
      setTimeout(() => {
        setToastActive(false);
        onSuccessToastDismiss?.();
      }, 300);
    }, 3000);
    return () => {
      cancelAnimationFrame(raf);
      clearTimeout(dismiss);
    };
  }, [showSuccessToast, onSuccessToastDismiss]);

  return (
    <>
      {open && showErrorToast && (
        <div
          role="alert"
          className={cn(
            "fixed z-50 flex min-w-65 max-w-80 items-center gap-3 rounded-xl border border-slate-200/80 bg-white px-4 py-3 shadow-lg",
            "transition-all duration-300",
          )}
          style={{
            right: "calc(min(80svw, 1100px) + 1rem)",
            bottom: "4.5rem",
          }}
        >
          <AlertCircle className="h-4 w-4 shrink-0 text-red-500" />
          <div className="min-w-0 flex-1">
            <p className="text-[13px] font-semibold text-slate-800">Error</p>
            <p className="text-[11px] text-slate-500">
              {errorToastMessage ?? "Failed to save"}
            </p>
          </div>
          <button
            type="button"
            onClick={onErrorToastDismiss}
            className="text-slate-400 hover:text-slate-600"
          >
            <X className="h-3 w-3" />
          </button>
        </div>
      )}

      {open && toastActive && (
        <div
          role="alert"
          className={cn(
            "fixed z-50 flex min-w-65 max-w-80 items-center gap-3 rounded-xl border border-slate-200/80 bg-white px-4 py-3 shadow-lg transition-all duration-300",
            toastVisible ? "translate-x-0 opacity-100" : "translate-x-4 opacity-0",
          )}
          style={{
            right: "calc(min(80svw, 1100px) + 1rem)",
            bottom: "1rem",
          }}
        >
          <CheckCircle2 className="h-4 w-4 shrink-0 text-green-600" />
          <p className="text-[13px] font-semibold text-slate-800">Saved</p>
        </div>
      )}

      <Sheet open={open} onOpenChange={(v) => !v && onClose()} modal={false}>
        <SheetContent
          side="right"
          hideClose
          className="flex w-svw flex-col gap-0 overflow-hidden border-l border-slate-200/80 bg-white p-0 sm:w-[80vw]"
          style={{ maxWidth: "1100px" }}
        >
          <SheetTitle className="sr-only">
            Manual Record — {customerName}
          </SheetTitle>

          <div className="shrink-0 border-b border-slate-100 bg-white">
            <div className="flex items-center gap-3 px-4 py-2">
              <div
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl text-[13px] font-extrabold text-white shadow-sm ring-2 ring-white"
                style={{
                  background: `hsl(${(customerName?.charCodeAt(0) ?? 200) % 360} 50% 44%)`,
                }}
              >
                {customerName.substring(0, 2).toUpperCase()}
              </div>
              <div className="min-w-0 shrink">
                <p className="truncate text-[15px] font-bold leading-none text-slate-900">
                  {customerName}
                </p>
                <p className="mt-0.5 font-mono text-[11.5px] leading-none text-slate-400">
                  {customerPhone || "—"}
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <span className="inline-flex items-center gap-1 rounded-full bg-[#008f68]/8 px-2 py-0.5 text-[10px] font-semibold text-[#008f68]">
                  <ClipboardList className="h-2.5 w-2.5" />
                  {isLoadingHistory ? (
                    <Loader2 className="h-2.5 w-2.5 animate-spin" />
                  ) : (
                    `${recordCount} record${recordCount !== 1 ? "s" : ""}`
                  )}
                </span>
              </div>
              <div className="flex-1" />
              <div className="flex shrink-0 items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => {
                    if (dialPhoneNormalized && canDial) {
                      dial(dialPhoneNormalized, selectedRecord?.id);
                    }
                  }}
                  disabled={!dialPhoneNormalized || !canDial}
                  className="flex h-8 items-center gap-1.5 rounded-xl bg-[#008f68] px-3.5 text-[12px] font-semibold text-white shadow-sm transition-all hover:bg-[#007a5a] active:scale-95 disabled:opacity-40"
                >
                  <PhoneOutgoing className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">Call</span>
                </button>
              </div>
            </div>

            {selectedRecord && (
              <div className="flex flex-wrap items-center gap-1.5 px-4 pb-2">
                <span className="inline-flex cursor-default items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1 text-[11px] font-semibold text-slate-600">
                  <ClipboardList className="h-3 w-3 text-slate-400" />
                  Record #{selectedRecord.id}
                </span>
                <span className="inline-flex cursor-default items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1 text-[11px] font-semibold text-slate-600">
                  <CalendarIcon className="h-3 w-3 text-slate-400" />
                  {fmtDate(selectedRecord.createdAt)}
                </span>
                {sp && (
                  <span
                    className="inline-flex cursor-default items-center gap-1.5 rounded-lg border px-2.5 py-1 text-[11px] font-semibold"
                    style={{
                      color: sp.fg,
                      background: sp.bg,
                      borderColor: `${sp.dot}30`,
                    }}
                  >
                    <span
                      className="h-1.5 w-1.5 rounded-full"
                      style={{ background: sp.dot }}
                    />
                    {sp.label}
                  </span>
                )}
              </div>
            )}
          </div>

          <div className="flex min-h-0 flex-1 overflow-hidden">
            <div className="order-last hidden w-72 shrink-0 flex-col overflow-hidden border-l border-slate-200/60 bg-white sm:flex xl:w-80">
              <div className="flex shrink-0 items-center justify-between border-b border-slate-100 px-4 py-3">
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                  Other records
                </p>
                {isLoadingHistory ? (
                  <Loader2 className="h-3 w-3 animate-spin text-slate-300" />
                ) : (
                  <span className="text-[10px] font-semibold tabular-nums text-slate-400">
                    {allRecords.length}
                  </span>
                )}
              </div>
              <div className="relative flex-1 overflow-y-auto py-2">
                <div className="absolute bottom-4 left-[1.35rem] top-4 w-px bg-slate-200" />
                {allRecords.length === 0 ? (
                  <p className="px-4 py-8 text-center text-xs text-slate-400">
                    No records
                  </p>
                ) : (
                  allRecords.map((r) => (
                    <RecordCard
                      key={r.id}
                      record={r}
                      isActive={r.id === activeRecordId}
                      onClick={() => onSelectRecord(r)}
                    />
                  ))
                )}
              </div>
            </div>

            <main className="flex min-h-0 min-w-0 flex-1 flex-col border-t border-slate-100 bg-slate-50/80">
              {!selectedRecord ? (
                <div className="flex flex-1 items-center justify-center text-slate-400">
                  <div className="text-center">
                    <ClipboardList className="mx-auto mb-2 h-8 w-8 opacity-30" />
                    <p className="text-sm">Select a record to inspect</p>
                  </div>
                </div>
              ) : (
                <>
                  <div className="flex-1 overflow-y-auto px-3 py-2 pb-2 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-slate-200">
                    <ManualRecordForm
                      form={form}
                      setForm={setForm}
                      customers={customers}
                      yards={yards}
                      campaigns={campaigns}
                      mode="edit"
                      createdByName={recordAgentName}
                      pendingFiles={pendingFiles}
                      onFilesChange={onFilesChange}
                      existingAttachments={selectedRecord.attachments || []}
                      getAttachmentUrl={getAttachmentUrl}
                    />
                  </div>
                  <div className="shrink-0 border-t border-slate-100 bg-white/95 px-5 py-3 backdrop-blur-sm">
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={onSave}
                        disabled={isSaving}
                        className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-[#008f68] py-2.5 text-[13px] font-semibold text-white shadow-sm transition-all hover:bg-[#007a5a] active:scale-[0.98] disabled:opacity-50"
                      >
                        {isSaving ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <CheckCircle2 className="h-4 w-4" />
                        )}
                        {isSaving ? "Saving…" : "Save Changes"}
                      </button>
                      {onDelete && (
                        <button
                          type="button"
                          onClick={onDelete}
                          disabled={isSaving}
                          className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-red-200 bg-white py-2.5 text-[13px] font-semibold text-red-600 transition-all hover:border-red-300 hover:bg-red-50 active:scale-[0.98] disabled:opacity-50"
                        >
                          <Trash2 className="h-4 w-4" />
                          Delete record
                        </button>
                      )}
                    </div>
                  </div>
                </>
              )}
            </main>
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
