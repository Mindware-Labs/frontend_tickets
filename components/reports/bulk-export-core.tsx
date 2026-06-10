"use client";

import type { LucideIcon } from "lucide-react";
import {
  Ban,
  CheckCircle2,
  Circle,
  FileSpreadsheet,
  FileText,
  Loader2,
  XCircle,
} from "lucide-react";

export type BulkExportEntity = {
  id: string;
  name: string;
  subtitle?: string | null;
};

export type BulkExportFormat = "pdf" | "excel";

export type BulkExportRequest = {
  endpoint: string;
  fileName: string;
  accept?: string;
};

export type BulkExportBuildRequest = (
  item: BulkExportEntity,
  format: BulkExportFormat,
  startDate: string,
  endDate: string,
) => BulkExportRequest;

export type BulkJobStatus = "pending" | "active" | "success" | "error" | "skipped";

export type BulkJob = {
  key: string;
  item: BulkExportEntity;
  format: BulkExportFormat;
  status: BulkJobStatus;
  error?: string;
};

export const EXCEL_MIME =
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";

export const FORMAT_META: Record<
  BulkExportFormat,
  { label: string; hint: string; icon: LucideIcon }
> = {
  pdf: { label: "PDF", hint: "Printable report", icon: FileText },
  excel: { label: "Excel", hint: "Raw data spreadsheet", icon: FileSpreadsheet },
};

export const JOB_STATUS_LABELS: Record<BulkJobStatus, string> = {
  pending: "Queued",
  active: "Generating…",
  success: "Downloaded",
  error: "Failed",
  skipped: "Cancelled",
};

/** Backend errors arrive as raw JSON text — surface just the human message. */
export function toFriendlyError(error: unknown): string {
  const raw = error instanceof Error ? error.message : String(error ?? "");
  try {
    const parsed = JSON.parse(raw);
    const message = Array.isArray(parsed?.message)
      ? parsed.message.join(", ")
      : parsed?.message;
    if (typeof message === "string" && message.trim()) return message;
  } catch {
    // Not JSON — use the raw text as-is.
  }
  return raw || "Download failed";
}

export function triggerDownload(blob: Blob, fileName: string) {
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
}

export function JobStatusIcon({ status }: { status: BulkJobStatus }) {
  switch (status) {
    case "active":
      return (
        <Loader2
          className="size-3.5 shrink-0 animate-spin text-[#008f68] dark:text-emerald-400"
          aria-hidden
        />
      );
    case "success":
      return (
        <CheckCircle2
          className="size-3.5 shrink-0 text-emerald-500"
          aria-hidden
        />
      );
    case "error":
      return <XCircle className="size-3.5 shrink-0 text-rose-500" aria-hidden />;
    case "skipped":
      return <Ban className="size-3.5 shrink-0 text-slate-300" aria-hidden />;
    default:
      return (
        <Circle className="size-3.5 shrink-0 text-slate-300" aria-hidden />
      );
  }
}
