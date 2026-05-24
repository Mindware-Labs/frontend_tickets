"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { SelectItem } from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Ticket as TicketIcon,
  CalendarIcon,
  ChevronsUpDown,
  Check,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  SupportTicketStatus,
  SupportTicketPriority,
  SupportTicketType,
  ManagementType,
  type CreateSupportTicketFormData,
} from "../../types";
import { formatEnumLabel } from "../../utils/call-helpers";
import {
  InspectorSelect,
  InspectorCombobox,
  InspectorReadonlyValue,
} from "../shared/InspectorHelpers";
import { AsyncCustomerCombobox } from "../shared/AsyncCustomerCombobox";
import {
  CREATE_TICKET_STATUSES,
  TicketStatusToggle,
} from "./TicketStatusToggle";
import { TicketFollowUpFields } from "./TicketFollowUpFields";

function SectionHeading({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest mb-1.5">
      {children}
    </p>
  );
}

function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
      {children}
    </p>
  );
}

export interface TicketPropertiesCardProps {
  editFormData: CreateSupportTicketFormData;
  setEditFormData: React.Dispatch<
    React.SetStateAction<CreateSupportTicketFormData>
  >;
  customers: any[];
  yards: any[];
  agents: any[];
  campaigns: any[];
  phoneLines?: { id: number; label: string | null; phoneNumber: string }[];
  campaignOptionValues: string[];
  mainCustomerOpen: boolean;
  setMainCustomerOpen: (open: boolean) => void;
  mainCustomerSearch: string;
  setMainCustomerSearch: (search: string) => void;
  mainFilteredCustomers: any[];
  showPhoneLine?: boolean;
  popoverClassName?: string;
  selectContentClassName?: string;
  /** Hide status & follow-up (handled via activity log in drawer) */
  activityMode?: boolean;
  /** Manual create form: Active, Follow-up, Overdue only */
  forCreateForm?: boolean;
  useAsyncCustomerSearch?: boolean;
}

export function TicketPropertiesCard({
  editFormData,
  setEditFormData,
  customers,
  yards,
  agents,
  campaigns,
  phoneLines = [],
  campaignOptionValues,
  mainCustomerOpen,
  setMainCustomerOpen,
  mainCustomerSearch,
  setMainCustomerSearch,
  mainFilteredCustomers,
  showPhoneLine = true,
  activityMode = false,
  forCreateForm = false,
  useAsyncCustomerSearch = false,
  popoverClassName,
  selectContentClassName,
}: TicketPropertiesCardProps) {
  const selectedPhoneLine = phoneLines.find(
    (line) => line.id.toString() === editFormData.phoneLineId,
  );
  const phoneLineLabel = selectedPhoneLine
    ? selectedPhoneLine.label
      ? `${selectedPhoneLine.label} (${selectedPhoneLine.phoneNumber})`
      : selectedPhoneLine.phoneNumber
    : editFormData.phoneLineId
      ? `Line #${editFormData.phoneLineId}`
      : "No line";

  return (
    <section className="bg-white rounded-2xl border border-slate-100 shadow-[0_1px_3px_rgba(0,0,0,0.06)] overflow-hidden">
      <div className="flex items-center gap-2 px-3.5 py-2 border-b border-slate-50">
        <div className="w-5 h-5 rounded-md bg-slate-100 flex items-center justify-center shrink-0">
          <TicketIcon className="w-3 h-3 text-slate-500" />
        </div>
        <span className="text-[12px] font-bold text-slate-700 leading-tight">
          Ticket Details &amp; Properties
        </span>
      </div>

      <div className="px-3.5 py-3 space-y-3">
        <div>
          <SectionHeading>Customer Information</SectionHeading>
          <div className="grid grid-cols-2 gap-x-3 gap-y-2.5 mt-3">
            <div>
              <FieldLabel>
                Customer <span className="text-red-400 normal-case">*</span>
              </FieldLabel>
              {useAsyncCustomerSearch ? (
                <AsyncCustomerCombobox
                  value={editFormData.customerId || ""}
                  onChange={(value) =>
                    setEditFormData((f) => ({ ...f, customerId: value }))
                  }
                  placeholder="Select customer..."
                  searchPlaceholder="Search customer..."
                />
              ) : (
              <Popover
                open={mainCustomerOpen}
                onOpenChange={(isOpen) => {
                  setMainCustomerOpen(isOpen);
                  if (!isOpen) setMainCustomerSearch("");
                }}
              >
                <PopoverTrigger asChild>
                  <button
                    type="button"
                    className="w-full h-8 flex items-center justify-between gap-1 px-2.5 text-xs bg-slate-50 border border-transparent hover:border-slate-300 rounded-lg transition-colors text-left"
                  >
                    <span className="truncate text-slate-800 font-medium">
                      {editFormData.customerId
                        ? customers.find(
                            (c: any) =>
                              c.id.toString() === editFormData.customerId,
                          )?.name || editFormData.customerId
                        : "Select customer..."}
                    </span>
                    <ChevronsUpDown className="w-3 h-3 text-slate-400 shrink-0" />
                  </button>
                </PopoverTrigger>
                <PopoverContent className="w-72 p-0" align="start">
                  <div className="flex flex-col">
                    <div className="px-3 py-2 border-b">
                      <Input
                        placeholder="Search customer..."
                        value={mainCustomerSearch}
                        onChange={(e) => setMainCustomerSearch(e.target.value)}
                        className="h-8 text-xs"
                      />
                    </div>
                    <div className="max-h-52 overflow-y-auto p-1">
                      {mainFilteredCustomers.length === 0 ? (
                        <div className="py-4 text-center text-xs text-slate-400">
                          No customer found.
                        </div>
                      ) : (
                        mainFilteredCustomers.map((c: any) => (
                          <div
                            key={c.id}
                            className={cn(
                              "flex cursor-pointer items-center gap-2 rounded px-2 py-2 text-xs hover:bg-slate-100",
                              editFormData.customerId === c.id.toString() &&
                                "bg-slate-100",
                            )}
                            onClick={() => {
                              setEditFormData((f) => ({
                                ...f,
                                customerId: c.id.toString(),
                              }));
                              setMainCustomerSearch("");
                              setMainCustomerOpen(false);
                            }}
                          >
                            <Check
                              className={cn(
                                "w-3.5 h-3.5 shrink-0",
                                editFormData.customerId === c.id.toString()
                                  ? "opacity-100 text-[#008f68]"
                                  : "opacity-0",
                              )}
                            />
                            <div className="flex-1 min-w-0">
                              <p className="font-medium truncate">{c.name}</p>
                              {c.phone && (
                                <p className="text-slate-400 truncate">
                                  {c.phone}
                                </p>
                              )}
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </PopoverContent>
              </Popover>
              )}
            </div>

            <div>
              <FieldLabel>Assign Agent</FieldLabel>
              <InspectorCombobox
                value={editFormData.agentId || ""}
                onChange={(v) => setEditFormData((f) => ({ ...f, agentId: v }))}
                placeholder="Unassigned"
                searchPlaceholder="Search agent..."
                noneLabel="Unassigned"
                items={agents.map((a: any) => ({
                  value: a.id.toString(),
                  label: a.name,
                }))}
              />
            </div>

            {showPhoneLine && (
              <div className="col-span-2">
                <FieldLabel>Phone Line</FieldLabel>
                <InspectorReadonlyValue
                  value={phoneLineLabel}
                  muted={!editFormData.phoneLineId}
                />
              </div>
            )}
          </div>
        </div>

        <div>
          <SectionHeading>Campaign &amp; Location</SectionHeading>
          <div className="grid grid-cols-2 gap-x-3 gap-y-2.5">
            <div>
              <FieldLabel>Campaign</FieldLabel>
              <InspectorCombobox
                value={editFormData.campaignId || ""}
                onChange={(v) => {
                  const camp = campaigns.find(
                    (c: any) => c.id.toString() === v,
                  );
                  const type = camp?.tipo?.toString().toUpperCase();
                  const supportsOption =
                    type === ManagementType.ONBOARDING ||
                    type === ManagementType.AR;
                  setEditFormData((f) => ({
                    ...f,
                    campaignId: v,
                    campaignOption: supportsOption ? f.campaignOption : "",
                    ...(camp?.yardaId
                      ? { yardId: camp.yardaId.toString() }
                      : {}),
                  }));
                }}
                placeholder="Campaign"
                searchPlaceholder="Search campaign..."
                noneLabel="None"
                items={campaigns.map((c: any) => ({
                  value: c.id.toString(),
                  label: c.nombre,
                }))}
              />
            </div>

            <div>
              <FieldLabel>Yard</FieldLabel>
              <InspectorCombobox
                value={editFormData.yardId || ""}
                onChange={(v) => setEditFormData((f) => ({ ...f, yardId: v }))}
                placeholder="Yard"
                searchPlaceholder="Search yard..."
                noneLabel="None"
                items={yards.map((y: any) => ({
                  value: y.id.toString(),
                  label: y.name,
                }))}
              />
            </div>

            {campaignOptionValues.length > 0 && (
              <div className="col-span-2 animate-in fade-in slide-in-from-left-2">
                <FieldLabel>Campaign Option</FieldLabel>
                <InspectorSelect
                  value={editFormData.campaignOption || ""}
                  onChange={(v) =>
                    setEditFormData((f) => ({
                      ...f,
                      campaignOption: v === "none" ? "" : v,
                    }))
                  }
                  placeholder="Option"
                >
                  <SelectItem value="none">None</SelectItem>
                  {campaignOptionValues.map((v) => (
                    <SelectItem key={v} value={v}>
                      {formatEnumLabel(v)}
                    </SelectItem>
                  ))}
                </InspectorSelect>
              </div>
            )}
          </div>
        </div>

        <div>
          <SectionHeading>
            {activityMode ? "Classification" : "Status & Classification"}
          </SectionHeading>
          <div className="grid grid-cols-2 gap-x-3 gap-y-2.5">
            {!activityMode && (
              <div className="col-span-2">
                <FieldLabel>Status</FieldLabel>
                <TicketStatusToggle
                  value={editFormData.status || ""}
                  onChange={(v) =>
                    setEditFormData((f) => ({
                      ...f,
                      status: v as SupportTicketStatus,
                    }))
                  }
                  statuses={
                    forCreateForm ? CREATE_TICKET_STATUSES : undefined
                  }
                  className="mt-0.5"
                />
              </div>
            )}

            <div className={activityMode ? "col-span-1" : undefined}>
              <FieldLabel>Priority</FieldLabel>
              <InspectorSelect
                value={editFormData.priority || ""}
                onChange={(v) =>
                  setEditFormData((f) => ({
                    ...f,
                    priority: v as SupportTicketPriority,
                  }))
                }
                placeholder="Priority"
              >
                {Object.values(SupportTicketPriority).map((p) => (
                  <SelectItem key={p} value={p}>
                    {formatEnumLabel(p)}
                  </SelectItem>
                ))}
              </InspectorSelect>
            </div>

            <div>
              <FieldLabel>Type</FieldLabel>
              <InspectorSelect
                value={editFormData.ticketType || ""}
                onChange={(v) =>
                  setEditFormData((f) => ({
                    ...f,
                    ticketType: v === "none" ? "" : v,
                  }))
                }
                placeholder="Type"
              >
                <SelectItem value="none">None</SelectItem>
                {Object.values(SupportTicketType).map((t) => (
                  <SelectItem key={t} value={t}>
                    {formatEnumLabel(t)}
                  </SelectItem>
                ))}
              </InspectorSelect>
            </div>
          </div>
        </div>

        {!activityMode &&
          editFormData.status === SupportTicketStatus.PENDING_FOLLOWUP && (
          <div className="animate-in fade-in-0 slide-in-from-top-2 duration-200">
            <TicketFollowUpFields
              followUpDueDate={editFormData.followUpDueDate || ""}
              followUpAssignedToId={editFormData.followUpAssignedToId || ""}
              onFollowUpDueDateChange={(iso) =>
                setEditFormData((f) => ({ ...f, followUpDueDate: iso }))
              }
              onFollowUpAssignedToIdChange={(id) =>
                setEditFormData((f) => ({
                  ...f,
                  followUpAssignedToId: id,
                }))
              }
              agents={agents.map((a: { id: number; name: string }) => ({
                id: a.id,
                name: a.name,
              }))}
              popoverClassName={popoverClassName}
              selectContentClassName={selectContentClassName}
            />
          </div>
        )}
      </div>
    </section>
  );
}
