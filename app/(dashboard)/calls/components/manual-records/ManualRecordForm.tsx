"use client";

import { useMemo } from "react";
import {
  SupportTicketStatus,
  type CreateManualRecordFormData,
} from "../../types";
import { useConfigurations } from "@/hooks/useConfigurations";
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
import { SelectItem } from "@/components/ui/select";
import { ClipboardList } from "lucide-react";

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
      <section className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-[0_1px_3px_rgba(0,0,0,0.06)]">
        <div className="flex items-center gap-2 border-b border-slate-50 px-3.5 py-2">
          <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-md bg-slate-100">
            <ClipboardList className="h-3 w-3 text-slate-600" />
          </div>
          <span className="text-[12px] font-bold leading-tight text-slate-700">
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
                />
              </div>
              <div>
                <FieldLabel>Agent</FieldLabel>
                <div
                  className="flex h-7 w-full items-center rounded-lg border border-transparent bg-slate-50 px-2.5 text-xs font-medium text-slate-700"
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
                <InspectorSelect
                  value={form.disposition || ""}
                  onChange={(v) =>
                    setForm((f) => ({
                      ...f,
                      disposition: v === "none" ? "" : v,
                    }))
                  }
                  placeholder="Disposition"
                >
                  <SelectItem value="none">None</SelectItem>
                  {dispositions.map((d) => (
                    <SelectItem key={d.value} value={d.value}>
                      {d.label}
                    </SelectItem>
                  ))}
                </InspectorSelect>
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
          rows={4}
          value={form.notes}
          onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
          placeholder="Add notes about this record…"
          className="w-full resize-none rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs leading-relaxed text-slate-800 shadow-sm placeholder:text-slate-400 focus:border-[#008f68] focus:outline-none focus:ring-2 focus:ring-[#008f68]/20"
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
