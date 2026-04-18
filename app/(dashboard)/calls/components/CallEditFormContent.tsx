"use client";

import { useMemo } from "react";
import { CallRecordingPlayer } from "@/components/calls/CallRecordingPlayer";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { useState } from "react";
import {
  X,
  User,
  Phone,
  MapPin,
  Briefcase,
  Megaphone,
  ArrowLeftRight,
  Activity,
  Calendar,
  AlertCircle,
  CheckCircle2,
  FileText,
  UploadCloud,
  Paperclip,
  ExternalLink,
  Download,
  ChevronsUpDown,
  Check,
  StickyNote,
  Calendar as CalendarIcon,
  Headphones,
} from "lucide-react";
import {
  AgentOption,
  CallDirection,
  CallStatus,
  CampaignOption,
  CreateTicketFormData,
  CustomerOption,
  ManagementType,
  OnboardingOption,
  ArOption,
  TicketDisposition,
  TicketStatus,
  YardOption,
} from "../types";
import type { Ticket } from "@/lib/mock-data";
import { cn } from "@/lib/utils";

/** Re-export so callers can reference the form type */
export type CallEditFormData = CreateTicketFormData;

interface CallEditFormContentProps {
  ticket: Ticket;
  customers: CustomerOption[];
  yards: YardOption[];
  agents: AgentOption[];
  campaigns: CampaignOption[];
  formData: CreateTicketFormData;
  setFormData: (next: CreateTicketFormData) => void;
  attachmentFiles: File[];
  setAttachmentFiles: (next: File[]) => void;
  savedAttachments: string[];
  isUpdating: boolean;
  onSubmit: () => void;
  onCancel: () => void;
  getAttachmentLabel: (value: string) => string;
  getAttachmentUrl: (value: string) => string;
  /** When true, wraps content in a ScrollArea and shows save/cancel footer */
  withScroll?: boolean;
}

const formatEnumLabel = (value: string) => {
  if (value === OnboardingOption.PAID_WITH_LL) return "Paid with LL";
  return value
    .toString()
    .replace(/_/g, " ")
    .toLowerCase()
    .replace(/\b\w/g, (char) => char.toUpperCase());
};

export function CallEditFormContent({
  ticket,
  customers,
  yards,
  agents,
  campaigns,
  formData,
  setFormData,
  attachmentFiles,
  setAttachmentFiles,
  savedAttachments,
  isUpdating,
  onSubmit,
  onCancel,
  getAttachmentLabel,
  getAttachmentUrl,
  withScroll = true,
}: CallEditFormContentProps) {
  const [campaignOpen, setCampaignOpen] = useState(false);
  const [yardOpen, setYardOpen] = useState(false);
  const [customerOpen, setCustomerOpen] = useState(false);
  const [agentOpen, setAgentOpen] = useState(false);

  const selectedCampaign = useMemo(() => {
    if (!formData.campaignId) return null;
    return campaigns.find((c) => c.id.toString() === formData.campaignId);
  }, [campaigns, formData.campaignId]);

  const selectedCampaignType = selectedCampaign?.tipo?.toString().toUpperCase();
  const isOnboardingCampaign =
    selectedCampaignType === ManagementType.ONBOARDING;
  const isArCampaign = selectedCampaignType === ManagementType.AR;
  const campaignOptionValues = isOnboardingCampaign
    ? Object.values(OnboardingOption)
    : isArCampaign
      ? Object.values(ArOption)
      : [];

  const formBody = (
    <div className="p-6 space-y-8">
      {/* Customer Notes */}
      {((ticket.customer?.notes && ticket.customer.notes.length > 0) ||
        ticket.customer?.note) && (
        <div className="border-b pb-4">
          <Popover>
            <PopoverTrigger asChild>
              <button className="w-full flex items-center gap-3 p-3.5 rounded-lg border border-amber-400/40 bg-amber-400/10 hover:bg-amber-400/15 transition-colors cursor-pointer text-left shadow-sm">
                <div className="h-9 w-9 rounded-md bg-amber-500/10 flex items-center justify-center shrink-0 border border-amber-500/20">
                  <StickyNote className="h-4 w-4 text-amber-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-amber-700 dark:text-amber-300">
                    Customer Notes
                  </p>
                  <p className="text-[10px] text-amber-600/70 dark:text-amber-400/70 mt-0.5">
                    {ticket.customer?.notes && ticket.customer.notes.length > 0
                      ? `${ticket.customer.notes.length} note${ticket.customer.notes.length !== 1 ? "s" : ""}`
                      : "1 note"}
                  </p>
                </div>
                <Badge
                  variant="secondary"
                  className="text-[10px] font-mono bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/20"
                >
                  {ticket.customer?.notes && ticket.customer.notes.length > 0
                    ? ticket.customer.notes.length
                    : 1}
                </Badge>
              </button>
            </PopoverTrigger>
            <PopoverContent align="start" className="w-80 p-0">
              <div className="px-4 py-3 border-b border-border/50">
                <h4 className="text-sm font-semibold flex items-center gap-2">
                  <StickyNote className="h-4 w-4 text-amber-500" />
                  Notes
                </h4>
              </div>
              <div className="max-h-70 overflow-y-auto p-2 space-y-2">
                {ticket.customer?.notes && ticket.customer.notes.length > 0 ? (
                  ticket.customer.notes.map((n: any) => (
                    <div
                      key={n.id}
                      className="bg-muted/30 border border-border/50 rounded-lg p-3 text-sm"
                    >
                      <p className="text-foreground/90 whitespace-pre-wrap wrap-break-word leading-relaxed">
                        {n.content}
                      </p>
                      {n.createdAt && (
                        <div className="mt-2 flex items-center justify-between gap-2">
                          {n.createdBy && (
                            <span className="text-[10px] font-semibold text-amber-500/80 uppercase tracking-wider truncate">
                              {n.createdBy}
                            </span>
                          )}
                          <div className="flex items-center gap-1.5 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider ml-auto">
                            <CalendarIcon className="h-3 w-3 opacity-70" />
                            {new Date(n.createdAt).toLocaleDateString(
                              undefined,
                              {
                                day: "2-digit",
                                month: "short",
                                year: "numeric",
                                hour: "2-digit",
                                minute: "2-digit",
                              },
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  ))
                ) : (
                  <div className="bg-muted/30 border border-border/50 rounded-lg p-3 text-sm">
                    <p className="text-foreground/90 whitespace-pre-wrap wrap-break-word leading-relaxed">
                      {ticket.customer!.note}
                    </p>
                  </div>
                )}
              </div>
            </PopoverContent>
          </Popover>
        </div>
      )}

      {/* SECTION 1: CAMPAIGN & YARD */}
      <div className="space-y-4">
        <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-2">
          <Megaphone className="w-4 h-4" /> Campaign & Location
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Campaign */}
          <div className="space-y-2">
            <Label className="text-xs font-semibold flex items-center gap-1.5">
              <Megaphone className="w-3.5 h-3.5 text-muted-foreground" />{" "}
              Campaign
            </Label>
            <Popover open={campaignOpen} onOpenChange={setCampaignOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  className="w-full justify-between"
                >
                  {formData.campaignId
                    ? campaigns.find(
                        (c) => c.id.toString() === formData.campaignId,
                      )?.nombre || formData.campaignId
                    : "Select campaign..."}
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-full p-0" align="start">
                <Command>
                  <CommandInput placeholder="Search campaign..." />
                  <CommandList>
                    <CommandEmpty>No campaign found.</CommandEmpty>
                    <CommandGroup>
                      <CommandItem
                        value="no-campaign"
                        onSelect={() => {
                          setFormData({
                            ...formData,
                            campaignId: "",
                            campaignOption: "",
                            yardId: "",
                          });
                          setCampaignOpen(false);
                        }}
                      >
                        <Check
                          className={cn(
                            "mr-2 h-4 w-4",
                            !formData.campaignId ? "opacity-100" : "opacity-0",
                          )}
                        />
                        No Campaign
                      </CommandItem>
                      {campaigns.map((c) => (
                        <CommandItem
                          key={c.id}
                          value={c.nombre}
                          onSelect={() => {
                            setFormData({
                              ...formData,
                              campaignId: c.id.toString(),
                              yardId: c.yardaId ? c.yardaId.toString() : "",
                              campaignOption:
                                c.tipo === ManagementType.ONBOARDING ||
                                c.tipo === ManagementType.AR
                                  ? formData.campaignOption
                                  : "",
                            });
                            setCampaignOpen(false);
                          }}
                        >
                          <Check
                            className={cn(
                              "mr-2 h-4 w-4",
                              formData.campaignId === c.id.toString()
                                ? "opacity-100"
                                : "opacity-0",
                            )}
                          />
                          {c.nombre}
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
          </div>

          {/* Yard */}
          <div className="space-y-2">
            <Label className="text-xs font-semibold flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-muted-foreground" /> Yard
            </Label>
            <Popover open={yardOpen} onOpenChange={setYardOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  className="w-full justify-between"
                >
                  {formData.yardId
                    ? yards.find((y) => y.id.toString() === formData.yardId)
                        ?.name || formData.yardId
                    : "Select yard..."}
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-full p-0" align="start">
                <Command>
                  <CommandInput placeholder="Search yard..." />
                  <CommandList>
                    <CommandEmpty>No yard found.</CommandEmpty>
                    <CommandGroup>
                      <CommandItem
                        value="no-yard"
                        onSelect={() => {
                          setFormData({ ...formData, yardId: "" });
                          setYardOpen(false);
                        }}
                      >
                        <Check
                          className={cn(
                            "mr-2 h-4 w-4",
                            !formData.yardId ? "opacity-100" : "opacity-0",
                          )}
                        />
                        No Yard
                      </CommandItem>
                      {yards.map((y) => (
                        <CommandItem
                          key={y.id}
                          value={y.name}
                          onSelect={() => {
                            setFormData({
                              ...formData,
                              yardId: y.id.toString(),
                            });
                            setYardOpen(false);
                          }}
                        >
                          <Check
                            className={cn(
                              "mr-2 h-4 w-4",
                              formData.yardId === y.id.toString()
                                ? "opacity-100"
                                : "opacity-0",
                            )}
                          />
                          {y.name}
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
          </div>

          {campaignOptionValues.length > 0 && (
            <div className="md:col-span-2 space-y-2 animate-in fade-in slide-in-from-left-2">
              <Label className="text-xs font-semibold">Campaign Option</Label>
              <Select
                value={formData.campaignOption}
                onValueChange={(value) =>
                  setFormData({
                    ...formData,
                    campaignOption: value === "none" ? "" : value,
                  })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select option" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No option</SelectItem>
                  {campaignOptionValues.map((v) => (
                    <SelectItem key={v} value={v}>
                      {formatEnumLabel(v)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </div>
      </div>

      <Separator />

      {/* SECTION 2: CUSTOMER */}
      <div className="space-y-4">
        <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-2">
          <User className="w-4 h-4" /> Customer Information
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="space-y-2">
            <Label className="text-xs font-semibold">
              Customer Name <span className="text-red-500">*</span>
            </Label>
            <Popover open={customerOpen} onOpenChange={setCustomerOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  className="w-full justify-between"
                >
                  {formData.customerId
                    ? customers.find(
                        (c) => c.id.toString() === formData.customerId,
                      )?.name || formData.customerId
                    : "Select customer..."}
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-full p-0" align="start">
                <Command>
                  <CommandInput placeholder="Search customer..." />
                  <CommandList>
                    <CommandEmpty>No customer found.</CommandEmpty>
                    <CommandGroup>
                      {customers.map((c) => (
                        <CommandItem
                          key={c.id}
                          value={`${c.id} ${c.name} ${c.phone || ""}`}
                          onSelect={() => {
                            setFormData({
                              ...formData,
                              customerId: c.id.toString(),
                              customerPhone: c.phone || "",
                            });
                            setCustomerOpen(false);
                          }}
                        >
                          <Check
                            className={cn(
                              "mr-2 h-4 w-4",
                              formData.customerId === c.id.toString()
                                ? "opacity-100"
                                : "opacity-0",
                            )}
                          />
                          <div className="flex flex-col">
                            <span>{c.name}</span>
                            {c.phone && (
                              <span className="text-xs text-muted-foreground">
                                {c.phone}
                              </span>
                            )}
                          </div>
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
          </div>

          <div className="space-y-2">
            <Label className="text-xs font-semibold flex items-center gap-1.5">
              <Phone className="w-3.5 h-3.5 text-muted-foreground" /> Phone
            </Label>
            <Input
              value={formData.customerPhone}
              readOnly
              placeholder="Auto-filled"
              className="bg-muted/40 border-dashed text-muted-foreground focus-visible:ring-0 cursor-not-allowed"
              tabIndex={-1}
            />
          </div>

          <div className="space-y-2">
            <Label className="text-xs font-semibold flex items-center gap-1.5">
              <Briefcase className="w-3.5 h-3.5 text-muted-foreground" /> Assign
              Agent
            </Label>
            <Popover open={agentOpen} onOpenChange={setAgentOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  className="w-full justify-between"
                >
                  {formData.agentId
                    ? agents.find((a) => a.id.toString() === formData.agentId)
                        ?.name ||
                      (ticket as any)?.agent?.name ||
                      (typeof (ticket as any)?.assignedTo === "object"
                        ? (ticket as any)?.assignedTo?.name
                        : undefined) ||
                      "Unassigned"
                    : "Unassigned"}
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-full p-0" align="start">
                <Command>
                  <CommandInput placeholder="Search agent..." />
                  <CommandList>
                    <CommandEmpty>No agent found.</CommandEmpty>
                    <CommandGroup>
                      {agents.map((a) => (
                        <CommandItem
                          key={a.id}
                          value={a.name}
                          onSelect={() => {
                            setFormData({
                              ...formData,
                              agentId: a.id.toString(),
                            });
                            setAgentOpen(false);
                          }}
                        >
                          <Check
                            className={cn(
                              "mr-2 h-4 w-4",
                              formData.agentId === a.id.toString()
                                ? "opacity-100"
                                : "opacity-0",
                            )}
                          />
                          {a.name}
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
          </div>
        </div>
      </div>

      <Separator />

      {/* SECTION 3: CALL DETAILS */}
      <div className="space-y-4">
        <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-2">
          <Activity className="w-4 h-4" /> Call Details
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="space-y-2">
            <Label className="text-xs font-semibold flex items-center gap-1.5">
              <ArrowLeftRight className="w-3.5 h-3.5 text-muted-foreground" />{" "}
              Direction <span className="text-red-500">*</span>
            </Label>
            <Select
              value={formData.direction}
              onValueChange={(value) =>
                setFormData({ ...formData, direction: value as CallDirection })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Select direction" />
              </SelectTrigger>
              <SelectContent>
                {Object.values(CallDirection).map((v) => (
                  <SelectItem key={v} value={v}>
                    {formatEnumLabel(v)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label className="text-xs font-semibold flex items-center gap-1.5">
              <Activity className="w-3.5 h-3.5 text-muted-foreground" /> Status
            </Label>
            <Select
              value={formData.status}
              onValueChange={(value) =>
                setFormData({ ...formData, status: value as CallStatus })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                {Object.values(TicketStatus).map((v) => (
                  <SelectItem key={v} value={v}>
                    {formatEnumLabel(v)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label className="text-xs font-semibold flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-muted-foreground" /> Date &
              Time
            </Label>
            <Input
              type="datetime-local"
              className="block w-full"
              value={formData.startedAt}
              onChange={(e) =>
                setFormData({ ...formData, startedAt: e.target.value })
              }
            />
          </div>
        </div>
      </div>

      <Separator />

      {/* RECORDING PLAYER */}
      {(ticket as any).recordingUrl && (ticket as any).id && (
        <>
          <div className="space-y-3">
            <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-2">
              <Headphones className="w-4 h-4" /> Call Recording
            </h3>
            <div className="rounded-lg border bg-muted/30 p-3">
              <CallRecordingPlayer callId={(ticket as any).id} />
            </div>
          </div>
          <Separator />
        </>
      )}

      {/* SECTION 4: DISPOSITION & NOTES */}
      <div className="space-y-4">
        <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-2">
          <AlertCircle className="w-4 h-4" /> Details & Resolution
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="space-y-2">
            <Label className="text-xs font-semibold flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-muted-foreground" />{" "}
              Disposition
            </Label>
            <Select
              value={formData.disposition}
              onValueChange={(value) =>
                setFormData({
                  ...formData,
                  disposition: value === "none" ? "" : value,
                })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Select disposition" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">No disposition</SelectItem>
                {Object.values(TicketDisposition).map((v) => (
                  <SelectItem key={v} value={v}>
                    {formatEnumLabel(v)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Callback Required / Scheduled – follow-up fields */}
        {(formData.disposition === TicketDisposition.CALLBACK_REQUIRED ||
          formData.disposition === TicketDisposition.CALLBACK_SCHEDULED) && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 animate-in fade-in-0 slide-in-from-top-2 duration-200">
            <div className="space-y-2">
              <Label className="text-xs font-semibold flex items-center gap-1.5">
                <CalendarIcon className="w-3.5 h-3.5 text-muted-foreground" />{" "}
                Follow-up Date
              </Label>
              <Input
                type="datetime-local"
                value={formData.followUpDueDate}
                onChange={(e) =>
                  setFormData({ ...formData, followUpDueDate: e.target.value })
                }
              />
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-semibold flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-muted-foreground" /> Follow-up
                Assigned To
              </Label>
              <Select
                value={formData.followUpAssignedToId || "none"}
                onValueChange={(value) =>
                  setFormData({
                    ...formData,
                    followUpAssignedToId: value === "none" ? "" : value,
                  })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select agent" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Not assigned</SelectItem>
                  {agents.map((a) => (
                    <SelectItem key={a.id} value={a.id.toString()}>
                      {a.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        )}

        <div className="space-y-2 pt-2">
          <Label className="text-xs font-semibold">Notes</Label>
          <Textarea
            placeholder="Enter call notes..."
            value={formData.notes}
            onChange={(e) =>
              setFormData({ ...formData, notes: e.target.value })
            }
            className="min-h-30 resize-y"
          />
        </div>
      </div>

      {/* Footer actions (visible only when not using withScroll sticky footer) */}
      {!withScroll && (
        <div className="flex justify-end gap-3 pt-2 border-t">
          <Button variant="ghost" onClick={onCancel} disabled={isUpdating}>
            Cancel
          </Button>
          <Button onClick={onSubmit} disabled={isUpdating} className="px-8">
            {isUpdating ? "Updating..." : "Save Changes"}
          </Button>
        </div>
      )}
    </div>
  );

  if (!withScroll) return formBody;

  return (
    <div className="flex flex-col flex-1 min-h-0 overflow-hidden">
      <div className="flex-1 min-h-0 overflow-y-auto">{formBody}</div>
      <div className="px-6 py-4 border-t bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60 flex justify-end gap-3 shrink-0">
        <Button variant="ghost" onClick={onCancel} disabled={isUpdating}>
          Cancel
        </Button>
        <Button onClick={onSubmit} disabled={isUpdating} className="px-8">
          {isUpdating ? "Updating..." : "Save Changes"}
        </Button>
      </div>
    </div>
  );
}
