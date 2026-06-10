"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  AlertCircle,
  CheckCircle2,
  Clock3,
  FileCheck2,
  FolderDown,
  Loader2,
  RotateCcw,
  X,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { entityFormDialogContentClass } from "@/components/forms/entity-form-layout";
import { toast } from "@/hooks/use-toast";
import { fetchBlobFromBackend } from "@/lib/api-client";
import { cn } from "@/lib/utils";
import {
  FORMAT_META,
  JOB_STATUS_LABELS,
  JobStatusIcon,
  toFriendlyError,
  triggerDownload,
  type BulkExportBuildRequest,
  type BulkExportEntity,
  type BulkExportFormat,
  type BulkJob,
  type BulkJobStatus,
} from "./bulk-export-core";

export type BulkExportPlan = {
  items: BulkExportEntity[];
  formats: BulkExportFormat[];
  startDate: string;
  endDate: string;
};

type BulkExportProgressDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  /** The export starts automatically every time the dialog opens with a plan. */
  plan: BulkExportPlan | null;
  buildRequest: BulkExportBuildRequest;
};

/** How many reports to generate/download at the same time. */
const CONCURRENT_DOWNLOADS = 3;

export function BulkExportProgressDialog({
  open,
  onOpenChange,
  title,
  description,
  plan,
  buildRequest,
}: BulkExportProgressDialogProps) {
  const [jobs, setJobs] = useState<BulkJob[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);
  const cancelRef = useRef(false);
  const runIdRef = useRef(0);

  const runJobs = useCallback(
    async (jobList: BulkJob[], startDate: string, endDate: string) => {
      const runId = ++runIdRef.current;
      cancelRef.current = false;
      setIsCancelling(false);
      setJobs(jobList);
      setIsRunning(true);

      const updateJob = (key: string, patch: Partial<BulkJob>) => {
        setJobs((current) =>
          current.map((job) => (job.key === key ? { ...job, ...patch } : job)),
        );
      };

      let downloaded = 0;
      let failed = 0;
      let nextIndex = 0;

      const runWorker = async () => {
        while (runIdRef.current === runId) {
          const index = nextIndex;
          nextIndex += 1;
          if (index >= jobList.length) return;
          const job = jobList[index];

          if (cancelRef.current) {
            updateJob(job.key, { status: "skipped" });
            continue;
          }

          updateJob(job.key, { status: "active" });
          try {
            const request = buildRequest(
              job.item,
              job.format,
              startDate,
              endDate,
            );
            const blob = await fetchBlobFromBackend(request.endpoint, {
              method: "GET",
              headers: request.accept ? { Accept: request.accept } : undefined,
            });
            if (runIdRef.current !== runId) return;
            triggerDownload(blob, request.fileName);
            downloaded += 1;
            updateJob(job.key, { status: "success" });
          } catch (error) {
            if (runIdRef.current !== runId) return;
            failed += 1;
            updateJob(job.key, {
              status: "error",
              error: toFriendlyError(error),
            });
          }
        }
      };

      await Promise.all(
        Array.from(
          { length: Math.min(CONCURRENT_DOWNLOADS, jobList.length) },
          () => runWorker(),
        ),
      );

      if (runIdRef.current !== runId) return;
      setIsRunning(false);

      const wasCancelled = cancelRef.current;
      toast({
        title: wasCancelled
          ? "Bulk export cancelled"
          : failed > 0
            ? "Bulk export finished with errors"
            : "Bulk export complete",
        description: `${downloaded} file${downloaded === 1 ? "" : "s"} downloaded${
          failed > 0 ? `, ${failed} failed` : ""
        }${wasCancelled ? ", remaining items were cancelled" : ""}.`,
        variant: failed > 0 ? "destructive" : "default",
      });
    },
    [buildRequest],
  );

  useEffect(() => {
    if (!open || !plan) return;
    const jobList: BulkJob[] = plan.items.flatMap((item) =>
      plan.formats.map((format) => ({
        key: `${item.id}-${format}`,
        item,
        format,
        status: "pending" as BulkJobStatus,
      })),
    );
    void runJobs(jobList, plan.startDate, plan.endDate);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, plan]);

  const completedCount = jobs.filter(
    (job) =>
      job.status === "success" ||
      job.status === "error" ||
      job.status === "skipped",
  ).length;
  const successCount = jobs.filter((job) => job.status === "success").length;
  const errorCount = jobs.filter((job) => job.status === "error").length;
  const skippedCount = jobs.filter((job) => job.status === "skipped").length;
  const pendingCount = jobs.filter((job) => job.status === "pending").length;
  const activeJobs = jobs.filter((job) => job.status === "active");
  const activeJob = activeJobs[0] ?? null;
  const progressPct =
    jobs.length > 0 ? Math.round((completedCount / jobs.length) * 100) : 0;
  const failedOrSkipped = errorCount + skippedCount;
  const remainingCount = Math.max(jobs.length - completedCount, 0);

  const retryFailed = () => {
    if (!plan) return;
    const failedJobs = jobs
      .filter((job) => job.status === "error" || job.status === "skipped")
      .map((job) => ({
        ...job,
        status: "pending" as BulkJobStatus,
        error: undefined,
      }));
    if (failedJobs.length === 0) return;
    void runJobs(failedJobs, plan.startDate, plan.endDate);
  };

  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen && isRunning) {
      toast({
        title: "Export in progress",
        description: "Cancel the remaining downloads before closing.",
      });
      return;
    }
    if (!nextOpen) {
      runIdRef.current += 1;
    }
    onOpenChange(nextOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent
        className={cn(entityFormDialogContentClass, "sm:max-w-[680px]")}
        onInteractOutside={(event) => {
          if (isRunning) event.preventDefault();
        }}
        onEscapeKeyDown={(event) => {
          if (isRunning) event.preventDefault();
        }}
      >
        <DialogHeader className="relative overflow-hidden border-b border-slate-100 bg-white px-5 py-4 pr-12 text-left sm:px-6 dark:border-slate-800 dark:bg-slate-950">
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#008f68]/45 to-transparent dark:via-emerald-300/35" />
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-emerald-200 bg-emerald-50 text-[#008f68] shadow-sm dark:border-emerald-500/25 dark:bg-emerald-500/15 dark:text-emerald-300">
              {isRunning ? (
                <Loader2 className="h-5 w-5 animate-spin" aria-hidden />
              ) : (
                <FolderDown className="h-5 w-5" aria-hidden />
              )}
            </div>
            <div className="min-w-0 flex-1">
              <DialogTitle className="text-[15px] font-semibold leading-5 text-slate-950 dark:text-slate-50">
                {title}
              </DialogTitle>
              <DialogDescription className="mt-1 text-[13px] leading-5 text-slate-500 dark:text-slate-400">
                {description}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="scrollbar-app max-h-[62dvh] space-y-2 overflow-y-auto bg-[#f4f5f7] px-3 py-2.5 sm:px-3.5 dark:bg-slate-900/40">
          <section className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-[0_1px_3px_rgba(0,0,0,0.06)] dark:border-slate-800 dark:bg-slate-950">
            <div className="space-y-2 px-3.5 py-3">
              <div className="flex items-center justify-between gap-3">
                <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-400">
                  {isRunning ? "Exporting..." : "Export summary"}
                </p>
                <span className="rounded-md bg-slate-100 px-2 py-0.5 text-xs font-bold tabular-nums text-slate-700 dark:bg-slate-900 dark:text-slate-200">
                  {progressPct}%
                </span>
              </div>
              <Progress
                value={progressPct}
                className="h-2.5 bg-slate-100 dark:bg-slate-800 [&>[data-slot=progress-indicator]]:bg-[#008f68] dark:[&>[data-slot=progress-indicator]]:bg-emerald-300"
                aria-label="Bulk export progress"
              />
              <p
                className="text-[11px] font-medium text-slate-500 dark:text-slate-400"
                aria-live="polite"
              >
                {isRunning && activeJobs.length > 1
                  ? `Generating ${activeJobs.length} files in parallel...`
                  : isRunning && activeJob
                    ? `Generating ${FORMAT_META[activeJob.format].label} for ${activeJob.item.name}...`
                    : isRunning
                      ? "Starting export..."
                      : `${successCount} downloaded - ${errorCount} failed - ${skippedCount} cancelled`}
              </p>

              <div className="grid grid-cols-3 gap-1.5">
                <div className="rounded-xl border border-emerald-100 bg-emerald-50 px-2.5 py-2 dark:border-emerald-500/20 dark:bg-emerald-500/10">
                  <p className="text-[9px] font-semibold uppercase tracking-wide text-emerald-700 dark:text-emerald-200">
                    Downloaded
                  </p>
                  <p className="mt-0.5 text-lg font-bold leading-none tabular-nums text-emerald-900 dark:text-emerald-100">
                    {successCount}
                  </p>
                </div>
                <div className="rounded-xl border border-emerald-100 bg-emerald-50 px-2.5 py-2 dark:border-emerald-500/20 dark:bg-emerald-500/10">
                  <p className="text-[9px] font-semibold uppercase tracking-wide text-emerald-700 dark:text-emerald-200">
                    Remaining
                  </p>
                  <p className="mt-0.5 text-lg font-bold leading-none tabular-nums text-emerald-900 dark:text-emerald-100">
                    {remainingCount}
                  </p>
                </div>
                <div className="rounded-xl border border-rose-100 bg-rose-50 px-2.5 py-2 dark:border-rose-500/20 dark:bg-rose-500/10">
                  <p className="text-[9px] font-semibold uppercase tracking-wide text-rose-700 dark:text-rose-200">
                    Failed
                  </p>
                  <p className="mt-0.5 text-lg font-bold leading-none tabular-nums text-rose-900 dark:text-rose-100">
                    {errorCount}
                  </p>
                </div>
              </div>

              {!isRunning && jobs.length > 0 ? (
                <div
                  className={cn(
                    "flex items-center gap-2 rounded-xl border px-3 py-2 text-xs font-medium",
                    errorCount > 0
                      ? "border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-200"
                      : "border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-100",
                  )}
                  role="status"
                >
                  {errorCount > 0 ? (
                    <AlertCircle className="size-4 shrink-0" aria-hidden />
                  ) : (
                    <CheckCircle2 className="size-4 shrink-0" aria-hidden />
                  )}
                  {errorCount > 0
                    ? `${successCount} of ${jobs.length} files downloaded. You can retry the ${failedOrSkipped} remaining below.`
                    : skippedCount > 0
                      ? `${successCount} files downloaded before cancelling.`
                      : `All ${successCount} files were downloaded successfully.`}
                </div>
              ) : null}
            </div>
          </section>

          <section className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-[0_1px_3px_rgba(0,0,0,0.06)] dark:border-slate-800 dark:bg-slate-950">
            <div className="flex items-center justify-between gap-2 border-b border-slate-100 px-3.5 py-2 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-md bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                  <FileCheck2 className="h-3 w-3" aria-hidden />
                </div>
                <p className="text-[12px] font-bold leading-tight text-slate-700 dark:text-slate-200">
                  Files
                </p>
              </div>
              <span className="text-[10px] font-semibold uppercase tracking-widest text-slate-400">
                {pendingCount} queued
              </span>
            </div>
            <ul className="scrollbar-app max-h-[260px] divide-y divide-slate-50 overflow-y-auto dark:divide-slate-800/60">
              {jobs.map((job) => {
                const meta = FORMAT_META[job.format];
                const FormatIcon = meta.icon;
                return (
                  <li
                    key={job.key}
                    className={cn(
                      "flex items-center gap-2.5 px-3.5 py-2 transition-colors",
                      job.status === "active" &&
                        "bg-emerald-50/70 dark:bg-emerald-500/10",
                      job.status === "success" &&
                        "bg-emerald-50/40 dark:bg-emerald-500/5",
                      job.status === "error" && "bg-rose-50/50 dark:bg-rose-500/10",
                    )}
                  >
                    <JobStatusIcon status={job.status} />
                    <FormatIcon
                      className="size-3.5 shrink-0 text-slate-400"
                      aria-hidden
                    />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-xs font-medium text-slate-800 dark:text-slate-100">
                        {job.item.name}
                        <span className="ml-1.5 text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                          {meta.label}
                        </span>
                      </span>
                      {job.status === "error" && job.error ? (
                        <span className="block truncate text-[11px] text-rose-500">
                          {job.error}
                        </span>
                      ) : null}
                    </span>
                    <span
                      className={cn(
                        "shrink-0 rounded-md px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide",
                        job.status === "success" && "text-emerald-600",
                        job.status === "error" && "text-rose-500",
                        job.status === "active" &&
                          "bg-white text-[#008f68] shadow-sm dark:bg-slate-950 dark:text-emerald-300",
                        (job.status === "pending" ||
                          job.status === "skipped") &&
                          "text-slate-400",
                      )}
                    >
                      {JOB_STATUS_LABELS[job.status]}
                    </span>
                  </li>
                );
              })}
            </ul>
          </section>
        </div>

        <div className="flex flex-col gap-3 border-t border-slate-100 bg-slate-50/80 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6 dark:border-slate-800 dark:bg-slate-900/60">
          {isRunning ? (
            <>
              <div className="flex items-center gap-2 text-[11px] font-medium text-slate-500 dark:text-slate-400">
                <Clock3 className="size-3.5 shrink-0 text-slate-400" aria-hidden />
                <span>
                  Keep this window open. Downloads start as each file is ready.
                </span>
              </div>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  cancelRef.current = true;
                  setIsCancelling(true);
                }}
                disabled={isCancelling}
                className="h-9 rounded-lg border-slate-200 bg-white px-4 text-xs font-semibold text-slate-700 shadow-sm hover:bg-slate-50 focus-visible:ring-[#008f68]/25 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200"
              >
                {isCancelling ? (
                  <>
                    <Loader2
                      className="mr-1.5 size-3.5 animate-spin"
                      aria-hidden
                    />
                    Cancelling...
                  </>
                ) : (
                  <>
                    <X className="mr-1.5 size-3.5" aria-hidden />
                    Cancel remaining
                  </>
                )}
              </Button>
            </>
          ) : (
            <>
              <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
                You can adjust the selection and run another export.
              </p>
              <div className="flex items-center gap-2">
                {failedOrSkipped > 0 ? (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={retryFailed}
                    className="h-9 rounded-lg border-amber-200 bg-amber-50 px-4 text-xs font-semibold text-amber-800 shadow-sm hover:bg-amber-100 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-200"
                  >
                    <RotateCcw className="mr-1.5 size-3.5" aria-hidden />
                    Retry {failedOrSkipped} file
                    {failedOrSkipped === 1 ? "" : "s"}
                  </Button>
                ) : null}
                <Button
                  type="button"
                  onClick={() => handleOpenChange(false)}
                  className="h-9 rounded-lg bg-[#008f68] px-4 text-xs font-semibold text-white shadow-sm hover:bg-[#007a5a] focus-visible:ring-[#008f68]/25 dark:text-white"
                >
                  Done
                </Button>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
