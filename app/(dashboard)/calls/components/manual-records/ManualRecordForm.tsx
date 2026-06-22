"use client";

import { useMemo } from "react";
import {
  SupportTicketStatus,
  type CreateManualRecordFormData,
} from "../../types";
import { useConfigurations } from "@/hooks/useConfigurations";
import { chipColors } from "@/lib/chip-colors";
import { TicketStatusToggle } from "../tickets/TicketStatusToggle";
import {
  InspectorSelect,
  InspectorCombobox,
} from "../shared/InspectorHelpers";
import {
  AsyncCustomerCombobox,
  type CustomerSearchOption,
} from "../shared/AsyncCustomerCombobox";
import { EntityAttachmentsSection } from "../shared/EntityAttachmentsSection";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ClipboardList } from "lucide-react";

const DISPOSITION_COLORS: Record<string, { text: string; bg: string; label: string }> = {
  RESOLVED: { text: "#008f68", bg: "#e6f5f0", label: "Resolved" },
  CALLBACK_REQUIRED: { text: "#c47a00", bg: "#fef3d6", label: "Callback Required" },
  CALLBACK_SCHEDULED: { text: "#d97706", bg: "#fffbeb", label: "Callback Scheduled" },
  CALLBACK_COMPLETE: { text: "#065f4a", bg: "#d1fae5", label: "Callback Complete" },
  VOICEMAIL_LEFT: { text: "#2563eb", bg: "#eff6ff", label: "Voicemail Left" },
  NO_ANSWER: { text: "#c0392b", bg: "#fde8e6", label: "No Answer" },
  NEW_LEAD: { text: "#047857", bg: "#d1fae5", label: "New Lead" },
  PROMISE_TO_PAY: { text: "#0891b2", bg: "#ecfeff", label: "Promise to Pay" },
  DISPUTE: { text: "#dc2626", bg: "#fef2f2", label: "Dispute" },
  WRONG_NUMBER: { text: "#64748b", bg: "#f1f5f9", label: "Wrong Number" },
  ENROLLED: { text: "#7c3aed", bg: "#f5f3ff", label: "Enrolled" },
  ESCALATED: { text: "#9b1c1c", bg: "#fef2f2", label: "Escalated" },
};

const formatLabel = (v: string) =>
  v
    .replace(/_/g, " ")
    .toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase());

function SectionHeading({ children }: { children: React.ReactNode }) {
  return (
    <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-widest text-slate-400">
      {children}
    </p>
  );
}

function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="mb-1 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
      {children}
    </p>
  );
}

export interface ManualRecordFormProps {
  form: CreateManualRecordFormData;
  setForm: React.Dispatch<React.SetStateAction<CreateManualRecordFormData>>;
  customers: { id: number; name: string; phone?: string | null }[];
  yards: { id: number; name: string }[];
  campaigns: { id: number; nombre: string; tipo?: string; yardaId?: number }[];
  mode?: "create" | "edit";
  createdByName?: string | null;
  selectedCustomer?: CustomerSearchOption | null;
  pendingFiles: File[];
  onFilesChange: (files: File[]) => void;
  existingAttachments?: string[];
  getAttachmentUrl?: (value: string) => string;
}

export function ManualRecordForm({
  form,
  setForm,
  customers,
  yards,
  campaigns,
  mode = "create",
  createdByName,
  selectedCustomer,
  pendingFiles,
  onFilesChange,
  existingAttachments = [],
  getAttachmentUrl,
}: ManualRecordFormProps) {
  const { dispositions, getOptionsForCampaignType } = useConfigurations(true);

  const campaignOptionValues = useMemo(() => {
    if (!form.campaignId) return [];
    const camp = campaigns.find((c) => c.id.toString() === form.campaignId);
    if (!camp?.tipo) return [];
    return getOptionsForCampaignType(camp.tipo.toString().toUpperCase());
  }, [campaigns, form.campaignId, getOptionsForCampaignType]);

  const customerItems = useMemo(
    () =>
      customers.map((c) => ({
        value: c.id.toString(),
        label: c.phone ? `${c.name} · ${c.phone}` : c.name,
      })),
    [customers],
  );
  const selectedCustomerOption =
    selectedCustomer ||
    customers.find((customer) => customer.id.toString() === form.customerId) ||
    null;

  const uploadInputId =
    mode === "create" ? "manual-record-file-upload-create" : "manual-record-file-upload-edit";

  return (
    <div className="space-y-2">
      <section className="overflow-hidden rounded-2xl border border-slate-100 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-[0_1px_3px_rgba(0,0,0,0.06)]">
        <div className="flex items-center gap-2 border-b border-slate-50 dark:border-neutral-800 px-3.5 py-2">
          <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-md bg-slate-100 dark:bg-neutral-800">
            <ClipboardList className="h-3 w-3 text-slate-600 dark:text-neutral-400" />
          </div>
          <span className="text-[12px] font-bold leading-tight text-slate-700 dark:text-neutral-200">
            Record Details &amp; Properties
          </span>
        </div>

        <div className="space-y-3 px-3.5 py-3">
          <div>
            <SectionHeading>Customer Information</SectionHeading>
            <div className="grid grid-cols-1 gap-x-3 gap-y-2.5 sm:grid-cols-2">
              <div>
                <FieldLabel>
                  Customer <span className="normal-case text-red-400">*</span>
                </FieldLabel>
                <AsyncCustomerCombobox
                  value={form.customerId}
                  onChange={(v) => setForm((f) => ({ ...f, customerId: v }))}
                  placeholder="Select customer…"
                  searchPlaceholder="Search customer…"
                  noneLabel="Select customer…"
                  items={customerItems}
                  selectedCustomer={selectedCustomerOption}
                />
              </div>
              <div>
                <FieldLabel>Agent</FieldLabel>
                <div
                  className="flex h-7 w-full items-center rounded-lg border border-transparent bg-slate-50 dark:bg-neutral-800/50 px-2.5 text-xs font-medium text-slate-700 dark:text-neutral-200"
                  title={
                    createdByName && createdByName !== "—"
                      ? createdByName
                      : undefined
                  }
                >
                  <span className="truncate">
                    {createdByName && createdByName !== "—"
                      ? createdByName
                      : "—"}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div>
            <SectionHeading>Campaign &amp; Location</SectionHeading>
            <div className="grid grid-cols-2 gap-x-3 gap-y-2.5">
              <div>
                <FieldLabel>Campaign</FieldLabel>
                <InspectorCombobox
                  value={form.campaignId || ""}
                  onChange={(v) => {
                    const camp = campaigns.find((c) => c.id.toString() === v);
                    const type = camp?.tipo?.toString().toUpperCase();
                    const newOptions = type ? getOptionsForCampaignType(type) : [];
                    const supportsOption = newOptions.length > 0;
                    setForm((f) => ({
                      ...f,
                      campaignId: v,
                      campaignOption: supportsOption ? f.campaignOption : "",
                      ...(camp?.yardaId
                        ? { yardId: camp.yardaId.toString() }
                        : {}),
                    }));
                  }}
                  placeholder="Campaign"
                  searchPlaceholder="Search campaign…"
                  noneLabel="None"
                  items={campaigns.map((c) => ({
                    value: c.id.toString(),
                    label: c.nombre,
                  }))}
                />
              </div>

              <div>
                <FieldLabel>Yard</FieldLabel>
                <InspectorCombobox
                  value={form.yardId || ""}
                  onChange={(v) => setForm((f) => ({ ...f, yardId: v }))}
                  placeholder="Yard"
                  searchPlaceholder="Search yard…"
                  noneLabel="None"
                  items={yards.map((y) => ({
                    value: y.id.toString(),
                    label: y.name,
                  }))}
                />
              </div>

              {campaignOptionValues.length > 0 && (
                <div className="col-span-2 animate-in fade-in slide-in-from-left-2">
                  <FieldLabel>Campaign Option</FieldLabel>
                  <InspectorSelect
                    value={form.campaignOption || ""}
                    onChange={(v) =>
                      setForm((f) => ({
                        ...f,
                        campaignOption: v === "none" ? "" : v,
                      }))
                    }
                    placeholder="Option"
                  >
                    <SelectItem value="none">None</SelectItem>
                    {campaignOptionValues.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </InspectorSelect>
                </div>
              )}
            </div>
          </div>

          <div>
            <SectionHeading>Status &amp; Outcome</SectionHeading>
            <div className="space-y-2.5">
              <div>
                <FieldLabel>Disposition</FieldLabel>
                {(() => {
                  const dispKey = (form.disposition || "").toString().toUpperCase();
                  const dispCfg = DISPOSITION_COLORS[dispKey] ?? null;
                  return (
                    <Select
                      value={form.disposition || "none"}
                      onValueChange={(v) =>
                        setForm((f) => ({ ...f, disposition: v === "none" ? "" : v }))
                      }
                    >
                      <SelectTrigger className="h-7 bg-slate-50 dark:bg-neutral-800/50 border-transparent hover:border-slate-300 dark:hover:border-neutral-600 focus:bg-white dark:focus:bg-neutral-800 focus:ring-2 focus:ring-[#008f68]/20 focus:border-[#008f68] rounded-lg w-full transition-colors text-xs">
                        {dispCfg ? (
                          <span
                            className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[11px] font-semibold"
                            style={chipColors(dispCfg.text, dispCfg.bg)}
                          >
                            <span
                              className="w-1.5 h-1.5 rounded-full shrink-0"
                              style={{ background: dispCfg.text }}
                            />
                            {dispCfg.label}
                          </span>
                        ) : (
                          <SelectValue placeholder="Disposition" />
                        )}
                      </SelectTrigger>
                      <SelectContent className="max-h-60 overflow-y-auto [&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-slate-200 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-button]:hidden">
                        <SelectItem value="none">None</SelectItem>
                        {dispositions.map((d) => {
                          const cfg = DISPOSITION_COLORS[d.value] ?? null;
                          return (
                            <SelectItem key={d.value} value={d.value}>
                              <span className="inline-flex items-center gap-1.5">
                                <span
                                  className="w-2 h-2 rounded-full shrink-0"
                                  style={{ background: cfg?.text ?? "#64748b" }}
                                />
                                {d.label}
                              </span>
                            </SelectItem>
                          );
                        })}
                      </SelectContent>
                    </Select>
                  );
                })()}
              </div>

              {mode === "edit" && (
                <div>
                  <FieldLabel>Status</FieldLabel>
                  <TicketStatusToggle
                    value={form.status || SupportTicketStatus.ACTIVE}
                    onChange={(v) => setForm((f) => ({ ...f, status: v }))}
                    className="mt-0.5 w-full"
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      <div>
        <p className="mb-1 px-0.5 text-[11px] font-bold uppercase tracking-widest text-slate-400">
          Notes
        </p>
        <textarea
          rows={3}
          value={form.notes}
          onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
          placeholder="Add notes about this record…"
          className="w-full field-sizing-content resize-none rounded-lg border border-slate-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 px-3 py-2 text-xs leading-relaxed text-slate-800 dark:text-neutral-200 shadow-sm placeholder:text-slate-400 focus:border-[#008f68] focus:outline-none focus:ring-2 focus:ring-[#008f68]/20"
        />
      </div>

      <EntityAttachmentsSection
        pendingFiles={pendingFiles}
        onFilesChange={onFilesChange}
        existingAttachments={existingAttachments}
        getAttachmentUrl={getAttachmentUrl}
        inputId={uploadInputId}
      />
    </div>
  );
}
