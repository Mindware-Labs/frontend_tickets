"use client";

import { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { SelectItem } from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import {
  Ticket as TicketIcon,
  CalendarIcon,
  Clock,
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
} from "../shared/InspectorHelpers";
import { TicketStatusToggle } from "./TicketStatusToggle";

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
  followUpDateDisplay: string | null;
  mainCustomerOpen: boolean;
  setMainCustomerOpen: (open: boolean) => void;
  mainCustomerSearch: string;
  setMainCustomerSearch: (search: string) => void;
  mainFilteredCustomers: any[];
  mainCalendarOpen: boolean;
  setMainCalendarOpen: (open: boolean) => void;
  showPhoneLine?: boolean;
  /** Hide status & follow-up (handled via activity log in drawer) */
  activityMode?: boolean;
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
  followUpDateDisplay,
  mainCustomerOpen,
  setMainCustomerOpen,
  mainCustomerSearch,
  setMainCustomerSearch,
  mainFilteredCustomers,
  mainCalendarOpen,
  setMainCalendarOpen,
  showPhoneLine = true,
  activityMode = false,
}: TicketPropertiesCardProps) {
  const [timeHourInput, setTimeHourInput] = useState("12");
  const [timeMinuteInput, setTimeMinuteInput] = useState("00");
  const [timePeriod, setTimePeriod] = useState<"AM" | "PM">("AM");

  useEffect(() => {
    if (editFormData.followUpDueDate) {
      const d = new Date(editFormData.followUpDueDate);
      const h24 = d.getHours();
      const h12 = h24 === 0 ? 12 : h24 > 12 ? h24 - 12 : h24;
      setTimeHourInput(String(h12).padStart(2, "0"));
      setTimeMinuteInput(String(d.getMinutes()).padStart(2, "0"));
      setTimePeriod(h24 < 12 ? "AM" : "PM");
    } else {
      setTimeHourInput("12");
      setTimeMinuteInput("00");
      setTimePeriod("AM");
    }
  }, [editFormData.followUpDueDate]);

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
                <InspectorSelect
                  value={editFormData.phoneLineId || ""}
                  onChange={(v) =>
                    setEditFormData((f) => ({
                      ...f,
                      phoneLineId: v === "none" ? "" : v,
                    }))
                  }
                  placeholder="Select line"
                >
                  <SelectItem value="none">None</SelectItem>
                  {phoneLines.map((pl) => (
                    <SelectItem key={pl.id} value={pl.id.toString()}>
                      {pl.label
                        ? `${pl.label} (${pl.phoneNumber})`
                        : pl.phoneNumber}
                    </SelectItem>
                  ))}
                </InspectorSelect>
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
            <div className="grid grid-cols-2 gap-2 rounded-lg p-2.5 bg-amber-50 border border-amber-200/70">
              <div>
                <div className="flex items-center gap-1.5 mb-1.5">
                  <FieldLabel>Follow-up Date</FieldLabel>
                  <span className="text-[8.5px] font-black text-amber-600 bg-amber-100 border border-amber-300/60 px-1.5 py-0.5 rounded-md uppercase tracking-wide">
                    Follow-up
                  </span>
                </div>
                <Popover
                  open={mainCalendarOpen}
                  onOpenChange={setMainCalendarOpen}
                >
                  <PopoverTrigger asChild>
                    <button
                      type="button"
                      className="w-full h-8 flex items-center gap-2 px-2.5 text-xs rounded-lg border bg-white border-amber-300 hover:border-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-300/30 transition-colors text-left"
                    >
                      <CalendarIcon className="w-3.5 h-3.5 shrink-0 text-amber-500" />
                      <span
                        className={
                          followUpDateDisplay
                            ? "text-slate-800 font-semibold text-xs"
                            : "text-amber-400 text-xs"
                        }
                      >
                        {followUpDateDisplay || "Pick date…"}
                      </span>
                    </button>
                  </PopoverTrigger>
                  <PopoverContent
                    className="w-auto p-0 shadow-xl border-slate-200"
                    align="start"
                  >
                    <Calendar
                      mode="single"
                      selected={
                        editFormData.followUpDueDate
                          ? new Date(editFormData.followUpDueDate)
                          : undefined
                      }
                      onSelect={(date) => {
                        if (!date) return;
                        const h = parseInt(timeHourInput) || 12;
                        const m = parseInt(timeMinuteInput) || 0;
                        const h24 =
                          timePeriod === "AM"
                            ? h === 12
                              ? 0
                              : h
                            : h === 12
                              ? 12
                              : h + 12;
                        const d = new Date(date);
                        d.setHours(h24, m, 0, 0);
                        setEditFormData((f) => ({
                          ...f,
                          followUpDueDate: d.toISOString(),
                        }));
                      }}
                      disabled={{ before: new Date() }}
                      initialFocus
                    />
                    <div className="px-3 pb-3 border-t border-slate-100 pt-3">
                      <div className="flex items-center gap-2">
                        <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <div className="flex items-center gap-1">
                          <input
                            type="text"
                            maxLength={2}
                            value={timeHourInput}
                            onChange={(e) => {
                              const v = e.target.value.replace(/\D/g, "");
                              setTimeHourInput(v);
                            }}
                            onBlur={() => {
                              const h = Math.min(
                                12,
                                Math.max(1, parseInt(timeHourInput) || 12),
                              );
                              setTimeHourInput(String(h).padStart(2, "0"));
                            }}
                            className="w-9 h-7 text-center text-xs font-semibold border border-slate-200 rounded-md focus:outline-none focus:ring-1 focus:ring-amber-400"
                          />
                          <span className="text-slate-500 text-xs font-bold">
                            :
                          </span>
                          <input
                            type="text"
                            maxLength={2}
                            value={timeMinuteInput}
                            onChange={(e) => {
                              const v = e.target.value.replace(/\D/g, "");
                              setTimeMinuteInput(v);
                            }}
                            onBlur={() => {
                              const m = Math.min(
                                59,
                                Math.max(0, parseInt(timeMinuteInput) || 0),
                              );
                              setTimeMinuteInput(String(m).padStart(2, "0"));
                            }}
                            className="w-9 h-7 text-center text-xs font-semibold border border-slate-200 rounded-md focus:outline-none focus:ring-1 focus:ring-amber-400"
                          />
                        </div>
                        <div className="flex rounded-md border border-slate-200 overflow-hidden">
                          {(["AM", "PM"] as const).map((p) => (
                            <button
                              key={p}
                              type="button"
                              onClick={() => setTimePeriod(p)}
                              className={cn(
                                "px-2 h-7 text-[10px] font-bold transition-colors",
                                timePeriod === p
                                  ? "bg-amber-500 text-white"
                                  : "bg-white text-slate-500 hover:bg-slate-50",
                              )}
                            >
                              {p}
                            </button>
                          ))}
                        </div>
                        {editFormData.followUpDueDate && (
                          <button
                            type="button"
                            onClick={() => {
                              const d = editFormData.followUpDueDate
                                ? new Date(editFormData.followUpDueDate)
                                : new Date();
                              const h = parseInt(timeHourInput) || 12;
                              const m = parseInt(timeMinuteInput) || 0;
                              const h24 =
                                timePeriod === "AM"
                                  ? h === 12
                                    ? 0
                                    : h
                                  : h === 12
                                    ? 12
                                    : h + 12;
                              d.setHours(h24, m, 0, 0);
                              setEditFormData((f) => ({
                                ...f,
                                followUpDueDate: d.toISOString(),
                              }));
                              setMainCalendarOpen(false);
                            }}
                            className="ml-auto text-[10px] font-semibold text-amber-600 hover:text-amber-700 bg-amber-50 border border-amber-200 px-2 py-1 rounded-md"
                          >
                            Done
                          </button>
                        )}
                      </div>
                      {editFormData.followUpDueDate && (
                        <div className="mt-2 flex justify-end">
                          <button
                            type="button"
                            onClick={() => {
                              setEditFormData((f) => ({
                                ...f,
                                followUpDueDate: "",
                              }));
                              setMainCalendarOpen(false);
                            }}
                            className="text-xs text-red-500 hover:text-red-600"
                          >
                            Clear
                          </button>
                        </div>
                      )}
                    </div>
                  </PopoverContent>
                </Popover>
              </div>

              <div>
                <FieldLabel>Assignee</FieldLabel>
                <InspectorSelect
                  value={editFormData.followUpAssignedToId || ""}
                  onChange={(v) =>
                    setEditFormData((f) => ({
                      ...f,
                      followUpAssignedToId: v === "none" ? "" : v,
                    }))
                  }
                  placeholder="Assign…"
                >
                  <SelectItem value="none">Unassigned</SelectItem>
                  {agents.map((a: any) => (
                    <SelectItem key={a.id} value={a.id.toString()}>
                      {a.name}
                    </SelectItem>
                  ))}
                </InspectorSelect>
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
