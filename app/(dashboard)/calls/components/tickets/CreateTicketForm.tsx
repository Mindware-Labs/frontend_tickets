"use client";

import { useMemo, useRef, useState } from "react";
import { useConfigurations } from "@/hooks/useConfigurations";
import {
  type CreateSupportTicketFormData,
} from "../../types";
import { TicketPropertiesCard } from "./TicketPropertiesCard";
import {
  Paperclip,
  CloudUpload,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { CustomerSearchOption } from "../shared/AsyncCustomerCombobox";

const normalizePhone = (v?: string | null) => (v ? v.replace(/\D/g, "") : "");
const stripUsCode = (d: string) =>
  d.length > 10 && d.startsWith("1") ? d.slice(1) : d;

export interface CreateTicketFormProps {
  form: CreateSupportTicketFormData;
  setForm: React.Dispatch<React.SetStateAction<CreateSupportTicketFormData>>;
  customers: any[];
  yards: any[];
  agents: any[];
  campaigns: any[];
  pendingFiles: File[];
  onFilesChange: (files: File[]) => void;
  initialSelectedCustomer?: CustomerSearchOption | null;
}

export function CreateTicketForm({
  form,
  setForm,
  customers,
  yards,
  agents,
  campaigns,
  pendingFiles,
  onFilesChange,
  initialSelectedCustomer = null,
}: CreateTicketFormProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [mainCustomerOpen, setMainCustomerOpen] = useState(false);
  const [mainCustomerSearch, setMainCustomerSearch] = useState("");
  const { getOptionsForCampaignType } = useConfigurations(true);

  const campaignOptionValues = useMemo(() => {
    if (!form.campaignId) return [];
    const camp = campaigns.find((c) => c.id.toString() === form.campaignId);
    if (!camp?.tipo) return [];
    return getOptionsForCampaignType(camp.tipo.toString().toUpperCase());
  }, [campaigns, form.campaignId, getOptionsForCampaignType]);

  const mainFilteredCustomers = useMemo(() => {
    if (!mainCustomerSearch.trim()) return customers;
    const s = mainCustomerSearch.toLowerCase();
    const sd = normalizePhone(mainCustomerSearch);
    const sds = stripUsCode(sd);
    return customers.filter((c: any) => {
      const cpd = normalizePhone(c.phone);
      const cpds = stripUsCode(cpd);
      const phoneMatch =
        !!sd &&
        (cpd.includes(sd) ||
          cpds.includes(sd) ||
          cpd.includes(sds) ||
          cpds.includes(sds));
      return (
        c.name?.toLowerCase().includes(s) ||
        (c.phone ?? "").toLowerCase().includes(s) ||
        c.id.toString().includes(s) ||
        c.email?.toLowerCase().includes(s) ||
        phoneMatch
      );
    });
  }, [customers, mainCustomerSearch]);

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
    <div className="space-y-2">
      <TicketPropertiesCard
        editFormData={form}
        setEditFormData={setForm}
        customers={[]}
        yards={yards}
        agents={agents}
        campaigns={campaigns}
        showPhoneLine={false}
        forCreateForm
        useAsyncCustomerSearch
        campaignOptionValues={campaignOptionValues}
        mainCustomerOpen={mainCustomerOpen}
        setMainCustomerOpen={setMainCustomerOpen}
        mainCustomerSearch={mainCustomerSearch}
        setMainCustomerSearch={setMainCustomerSearch}
        mainFilteredCustomers={mainFilteredCustomers}
        asyncSelectedCustomer={initialSelectedCustomer}
      />

      <div>
        <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-1 px-0.5">
          Issue Detail
        </p>
        <textarea
          rows={4}
          value={form.issueDetail || ""}
          onChange={(e) =>
            setForm((f) => ({ ...f, issueDetail: e.target.value }))
          }
          placeholder="Describe the issue…"
          className="w-full text-xs text-slate-800 dark:text-neutral-200 placeholder:text-slate-400 bg-white dark:bg-neutral-900 border border-slate-200 dark:border-neutral-700 rounded-lg px-3 py-2 resize-none focus:outline-none focus:ring-2 focus:ring-[#008f68]/20 focus:border-[#008f68] leading-relaxed shadow-sm"
        />
      </div>

      <section className="bg-white dark:bg-neutral-900 rounded-2xl border border-slate-100 dark:border-neutral-800 shadow-[0_1px_3px_rgba(0,0,0,0.06)] overflow-hidden">
        <div className="flex items-center gap-2 px-5 pt-4 pb-3">
          <div className="w-6 h-6 rounded-lg bg-blue-50 dark:bg-blue-500/10 flex items-center justify-center shrink-0">
            <Paperclip className="w-3 h-3 text-blue-500" />
          </div>
          <span className="text-[11px] font-bold text-slate-700 dark:text-neutral-200 uppercase tracking-wider">
            Attachments
          </span>
          {pendingFiles.length > 0 && (
            <span className="ml-auto text-[10px] font-semibold text-slate-400 dark:text-neutral-500 bg-slate-100 dark:bg-neutral-800 rounded-full px-1.5 py-0.5 tabular-nums leading-none">
              {pendingFiles.length}
            </span>
          )}
        </div>

        <div className="px-4 pb-4 space-y-2">
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
              if (dropped.length > 0)
                onFilesChange([...pendingFiles, ...dropped]);
            }}
            className="group"
          >
            <input
              ref={fileInputRef}
              type="file"
              id="create-ticket-file-upload"
              multiple
              onChange={handleFileSelect}
              className="hidden"
              accept=".svg,.png,.jpg,.jpeg,.pdf,.mp3,.wav,.m4a"
            />
            <label
              htmlFor="create-ticket-file-upload"
              className="flex items-center gap-2.5 w-full px-3 py-2.5 rounded-xl border border-dashed border-slate-200 dark:border-neutral-700 bg-linear-to-r from-slate-50/90 to-sky-50/30 dark:from-neutral-800/50 dark:to-neutral-800/30 cursor-pointer transition-all duration-150 hover:border-blue-300 hover:from-sky-50/70 hover:to-blue-50/40"
            >
              <div className="flex items-center justify-center w-7 h-7 rounded-lg bg-white dark:bg-neutral-800 shadow-sm border border-slate-100/80 dark:border-neutral-700 shrink-0">
                <CloudUpload className="w-3.5 h-3.5 text-slate-400 group-hover:text-blue-400 transition-colors duration-150" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[12px] leading-snug">
                  <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                    Click to upload
                  </span>
                  <span className="text-slate-400 dark:text-neutral-500"> or drag &amp; drop</span>
                </p>
                <p className="text-[10px] text-slate-400/80 dark:text-neutral-600 mt-0.5 font-normal tracking-tight">
                  SVG · PNG · JPG · PDF · MP3 — max 10 MB
                </p>
              </div>
            </label>
          </div>

          {pendingFiles.length > 0 && (
            <div className="rounded-xl border border-slate-100 dark:border-neutral-800 overflow-hidden divide-y divide-slate-50/80 dark:divide-neutral-700/50">
              {pendingFiles.map((file, i) => {
                const ext =
                  file.name.split(".").pop()?.toUpperCase() || "?";
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
                    key={i}
                    className="flex items-center gap-2 px-2.5 py-1.5 bg-white dark:bg-neutral-900 hover:bg-slate-50/70 dark:hover:bg-neutral-800/70 transition-colors"
                  >
                    <span
                      className={cn(
                        "text-[9px] font-bold tracking-wider rounded-[5px] px-1.5 py-0.5 uppercase shrink-0",
                        badge,
                      )}
                    >
                      {ext.slice(0, 4)}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p
                        className="text-[11.5px] font-medium text-slate-700 dark:text-neutral-200 truncate leading-tight"
                        title={file.name}
                      >
                        {file.name}
                      </p>
                      <p className="text-[9.5px] text-slate-400 dark:text-neutral-600 tabular-nums">
                        {(file.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => removePendingFile(i)}
                      className="p-1 rounded-md text-red-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors shrink-0"
                      aria-label="Remove file"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
