"use client";

import { useRef } from "react";
import { Paperclip, CloudUpload, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { getAttachmentLabel } from "../../utils/call-helpers";

export interface EntityAttachmentsSectionProps {
  pendingFiles: File[];
  onFilesChange: (files: File[]) => void;
  existingAttachments?: string[];
  getAttachmentUrl?: (value: string) => string;
  inputId?: string;
}

export function EntityAttachmentsSection({
  pendingFiles,
  onFilesChange,
  existingAttachments = [],
  getAttachmentUrl,
  inputId = "entity-file-upload",
}: EntityAttachmentsSectionProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    onFilesChange([...pendingFiles, ...files]);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const removePendingFile = (index: number) => {
    onFilesChange(pendingFiles.filter((_, i) => i !== index));
  };

  return (
    <section className="overflow-hidden rounded-2xl border border-slate-100 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-[0_1px_3px_rgba(0,0,0,0.06)]">
      <div className="flex items-center gap-2 px-5 pt-4 pb-3">
        <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-blue-50 dark:bg-blue-500/10">
          <Paperclip className="h-3 w-3 text-blue-500 dark:text-blue-400" />
        </div>
        <span className="text-[11px] font-bold uppercase tracking-wider text-slate-700 dark:text-neutral-200">
          Attachments
        </span>
        {pendingFiles.length > 0 && (
          <span className="ml-auto rounded-full bg-slate-100 dark:bg-neutral-800 px-1.5 py-0.5 text-[10px] font-semibold leading-none text-slate-400 tabular-nums">
            {pendingFiles.length} new
          </span>
        )}
      </div>

      <div className="space-y-2 px-4 pb-4">
        {existingAttachments.length > 0 && (
          <div className="rounded-xl border border-slate-100 dark:border-neutral-800 divide-y divide-slate-50/80 dark:divide-neutral-700 overflow-hidden">
            {existingAttachments.map((url, i) => (
              <div
                key={`${url}-${i}`}
                className="flex items-center gap-2 bg-slate-50/50 dark:bg-neutral-800/50 px-2.5 py-1.5"
              >
                <Paperclip className="h-3 w-3 shrink-0 text-slate-400" />
                <a
                  href={getAttachmentUrl ? getAttachmentUrl(url) : url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="min-w-0 flex-1 truncate text-[11.5px] font-medium text-[#008f68] hover:underline"
                  title={getAttachmentLabel(url)}
                >
                  {getAttachmentLabel(url)}
                </a>
              </div>
            ))}
          </div>
        )}

        <div
          onDragOver={(e) => {
            e.preventDefault();
            e.currentTarget.classList.add(
              "!border-blue-400",
              "!from-sky-50",
              "!to-blue-50/60",
            );
          }}
          onDragLeave={(e) => {
            e.currentTarget.classList.remove(
              "!border-blue-400",
              "!from-sky-50",
              "!to-blue-50/60",
            );
          }}
          onDrop={(e) => {
            e.preventDefault();
            e.currentTarget.classList.remove(
              "!border-blue-400",
              "!from-sky-50",
              "!to-blue-50/60",
            );
            const dropped = Array.from(e.dataTransfer.files);
            if (dropped.length > 0) onFilesChange([...pendingFiles, ...dropped]);
          }}
          className="group"
        >
          <input
            ref={fileInputRef}
            type="file"
            id={inputId}
            multiple
            onChange={handleFileSelect}
            className="hidden"
            accept=".svg,.png,.jpg,.jpeg,.pdf,.mp3,.wav,.m4a"
          />
          <label
            htmlFor={inputId}
            className="flex w-full cursor-pointer items-center gap-2.5 rounded-xl border border-dashed border-slate-200 dark:border-neutral-700 bg-linear-to-r from-slate-50/90 to-sky-50/30 dark:from-neutral-800/50 dark:to-neutral-800/30 px-3 py-2.5 transition-all duration-150 hover:border-blue-300 hover:from-sky-50/70 hover:to-blue-50/40"
          >
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-slate-100/80 dark:border-neutral-700 bg-white dark:bg-neutral-800 shadow-sm">
              <CloudUpload className="h-3.5 w-3.5 text-slate-400 transition-colors duration-150 group-hover:text-blue-400" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[12px] leading-snug">
                <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                  Click to upload
                </span>
                <span className="text-slate-400 dark:text-neutral-500"> or drag &amp; drop</span>
              </p>
              <p className="mt-0.5 text-[10px] font-normal tracking-tight text-slate-400/80 dark:text-neutral-600">
                SVG · PNG · JPG · PDF · MP3 — max 10 MB
              </p>
            </div>
          </label>
        </div>

        {pendingFiles.length > 0 && (
          <div className="divide-y divide-slate-50/80 dark:divide-neutral-700 overflow-hidden rounded-xl border border-slate-100 dark:border-neutral-800">
            {pendingFiles.map((file, i) => {
              const ext = file.name.split(".").pop()?.toUpperCase() || "?";
              const isPdf = file.type === "application/pdf";
              const isImage = file.type.startsWith("image/");
              const isAudio = file.type.startsWith("audio/");
              const badge = isPdf
                ? "bg-red-50 text-red-500 ring-1 ring-red-100"
                : isImage
                  ? "bg-blue-50 text-blue-500 ring-1 ring-blue-100"
                  : isAudio
                    ? "bg-violet-50 text-violet-500 ring-1 ring-violet-100"
                    : "bg-slate-100 text-slate-500";
              return (
                <div
                  key={`${file.name}-${i}`}
                  className="flex items-center gap-2 bg-white dark:bg-neutral-900 px-2.5 py-1.5 transition-colors hover:bg-slate-50/70 dark:hover:bg-neutral-800"
                >
                  <span
                    className={cn(
                      "shrink-0 rounded-[5px] px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider",
                      badge,
                    )}
                  >
                    {ext.slice(0, 4)}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p
                      className="truncate text-[11.5px] font-medium leading-tight text-slate-700 dark:text-neutral-200"
                      title={file.name}
                    >
                      {file.name}
                    </p>
                    <p className="text-[9.5px] tabular-nums text-slate-400 dark:text-neutral-600">
                      {(file.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => removePendingFile(i)}
                    className="shrink-0 rounded-md p-1 text-red-400 transition-colors hover:bg-red-50 dark:hover:bg-red-500/10 hover:text-red-600"
                    aria-label="Remove file"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
