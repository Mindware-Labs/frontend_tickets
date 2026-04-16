"use client";

import { useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import {
  Search,
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
  Pencil,
  ExternalLink,
  Download,
  ChevronsUpDown,
  Check,
  StickyNote,
  Calendar as CalendarIcon,
} from "lucide-react";
import {
  AgentOption,
  CallDirection,
  CampaignOption,
  CustomerOption,
  ManagementType,
  OnboardingOption,
  ArOption,
  TicketDisposition,
  TicketPriority,
  TicketStatus,
  YardOption,
} from "../types";
import { Ticket } from "@/lib/mock-data";
import { cn } from "@/lib/utils";

interface EditTicketFormData {
  customerId: string;
  customerPhone: string;
  yardId: string;
  campaignId: string;
  campaignOption: string;
  agentId: string;
  status: TicketStatus;
  priority: TicketPriority;
  direction: CallDirection;
  callDate: string;
  disposition: string;
  issueDetail: string;
  attachments: string[];
}

interface EditTicketModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  ticket: Ticket | null;
  customers: CustomerOption[];
  yards: YardOption[];
  agents: AgentOption[];
  campaigns: CampaignOption[];
  editFormData: EditTicketFormData;
  setEditFormData: (next: EditTicketFormData) => void;
  customerSearchEdit: string;
  setCustomerSearchEdit: (value: string) => void;
  yardSearchEdit: string;
  setYardSearchEdit: (value: string) => void;
  agentSearchEdit: string;
  setAgentSearchEdit: (value: string) => void;
  campaignSearchEdit: string;
  setCampaignSearchEdit: (value: string) => void;
  attachmentFiles: File[];
  setAttachmentFiles: (next: File[]) => void;
  savedAttachments: string[];
  isUpdating: boolean;
  onSubmit: () => void;
  getAttachmentLabel: (value: string) => string;
  getAttachmentUrl: (value: string) => string;
}

export function EditTicketModal({
  open,
  onOpenChange,
  ticket,
  customers,
  yards,
  agents,
  campaigns,
  editFormData,
  setEditFormData,
  customerSearchEdit,
  setCustomerSearchEdit,
  yardSearchEdit,
  setYardSearchEdit,
  agentSearchEdit,
  setAgentSearchEdit,
  campaignSearchEdit,
  setCampaignSearchEdit,
  attachmentFiles,
  setAttachmentFiles,
  savedAttachments,
  isUpdating,
  onSubmit,
  getAttachmentLabel,
  getAttachmentUrl,
}: EditTicketModalProps) {
  // Estados para controlar la apertura de los Popovers
  const [campaignOpen, setCampaignOpen] = useState(false);
  const [yardOpen, setYardOpen] = useState(false);
  const [customerOpen, setCustomerOpen] = useState(false);
  const [agentOpen, setAgentOpen] = useState(false);

  const formatEnumLabel = (value: string) => {
    if (value === OnboardingOption.PAID_WITH_LL) return "Paid with LL";
    return value
      .toString()
      .replace(/_/g, " ")
      .toLowerCase()
      .replace(/\b\w/g, (char) => char.toUpperCase());
  };

  // --- LOGIC (MEMOS) ---
  const selectedCampaign = useMemo(() => {
    if (!editFormData.campaignId) return null;
    return campaigns.find(
      (campaign) => campaign.id.toString() === editFormData.campaignId,
    );
  }, [campaigns, editFormData.campaignId]);

  const selectedCampaignType = selectedCampaign?.tipo?.toString().toUpperCase();
  const isOnboardingCampaign =
    selectedCampaignType === ManagementType.ONBOARDING;
  const isArCampaign = selectedCampaignType === ManagementType.AR;
  const campaignOptionValues = isOnboardingCampaign
    ? Object.values(OnboardingOption)
    : isArCampaign
      ? Object.values(ArOption)
      : [];

  if (!ticket) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-4xl max-h-[90vh] p-0 overflow-hidden flex flex-col gap-0">
        {/* HEADER */}
        <DialogHeader className="px-6 py-4 border-b bg-muted/20">
          <DialogTitle className="text-xl font-semibold flex items-center gap-2">
            <Pencil className="w-5 h-5 text-primary" />
            Edit Call #{ticket.id}
          </DialogTitle>
          <DialogDescription>
            Update the call information below
          </DialogDescription>
        </DialogHeader>

        {/* Customer Notes Popover */}
        {((ticket.customer?.notes && ticket.customer.notes.length > 0) ||
          ticket.customer?.note) && (
          <div className="px-6 py-3 border-b">
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
                      {ticket.customer?.notes &&
                      ticket.customer.notes.length > 0
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
                <div className="max-h-[280px] overflow-y-auto p-2 space-y-2 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-border/50">
                  {ticket.customer?.notes &&
                  ticket.customer.notes.length > 0 ? (
                    ticket.customer.notes.map((n: any) => (
                      <div
                        key={n.id}
                        className="bg-muted/30 border border-border/50 rounded-lg p-3 text-sm"
                      >
                        <p className="text-foreground/90 whitespace-pre-wrap break-words leading-relaxed">
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
                      <p className="text-foreground/90 whitespace-pre-wrap break-words leading-relaxed">
                        {ticket.customer!.note}
                      </p>
                    </div>
                  )}
                </div>
              </PopoverContent>
            </Popover>
          </div>
        )}

        {/* SCROLLABLE BODY */}
        <ScrollArea className="flex-1 overflow-y-auto">
          <div className="p-6 space-y-8">
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
                        aria-expanded={campaignOpen}
                        className="w-full justify-between"
                      >
                        {editFormData.campaignId
                          ? campaigns.find(
                              (c) =>
                                c.id.toString() === editFormData.campaignId,
                            )?.nombre || editFormData.campaignId
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
                                setEditFormData({
                                  ...editFormData,
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
                                  !editFormData.campaignId
                                    ? "opacity-100"
                                    : "opacity-0",
                                )}
                              />
                              No Campaign
                            </CommandItem>
                            {campaigns.map((c) => (
                              <CommandItem
                                key={c.id}
                                value={c.nombre}
                                onSelect={() => {
                                  setEditFormData({
                                    ...editFormData,
                                    campaignId: c.id.toString(),
                                    yardId: c.yardaId
                                      ? c.yardaId.toString()
                                      : "",
                                    campaignOption:
                                      c.tipo === ManagementType.ONBOARDING ||
                                      c.tipo === ManagementType.AR
                                        ? editFormData.campaignOption
                                        : "",
                                  });
                                  setCampaignOpen(false);
                                }}
                              >
                                <Check
                                  className={cn(
                                    "mr-2 h-4 w-4",
                                    editFormData.campaignId === c.id.toString()
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

                {/* Yard Select */}
                <div className="space-y-2">
                  <Label className="text-xs font-semibold flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-muted-foreground" />{" "}
                    Yard
                  </Label>
                  <Popover open={yardOpen} onOpenChange={setYardOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        role="combobox"
                        aria-expanded={yardOpen}
                        className="w-full justify-between"
                      >
                        {editFormData.yardId
                          ? yards.find(
                              (y) => y.id.toString() === editFormData.yardId,
                            )?.name || editFormData.yardId
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
                                setEditFormData({
                                  ...editFormData,
                                  yardId: "",
                                });
                                setYardOpen(false);
                              }}
                            >
                              <Check
                                className={cn(
                                  "mr-2 h-4 w-4",
                                  !editFormData.yardId
                                    ? "opacity-100"
                                    : "opacity-0",
                                )}
                              />
                              No Yard
                            </CommandItem>
                            {yards.map((y) => (
                              <CommandItem
                                key={y.id}
                                value={y.name}
                                onSelect={() => {
                                  setEditFormData({
                                    ...editFormData,
                                    yardId: y.id.toString(),
                                  });
                                  setYardOpen(false);
                                }}
                              >
                                <Check
                                  className={cn(
                                    "mr-2 h-4 w-4",
                                    editFormData.yardId === y.id.toString()
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

                {/* Dynamic Campaign Option */}
                {campaignOptionValues.length > 0 && (
                  <div className="md:col-span-2 space-y-2 animate-in fade-in slide-in-from-left-2">
                    <Label className="text-xs font-semibold">
                      Campaign Option
                    </Label>
                    <Select
                      value={editFormData.campaignOption}
                      onValueChange={(value) =>
                        setEditFormData({
                          ...editFormData,
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

            {/* SECTION 2: CUSTOMER INFORMATION */}
            <div className="space-y-4">
              <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                <User className="w-4 h-4" /> Customer Information
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {/* Customer Select */}
                <div className="space-y-2">
                  <Label className="text-xs font-semibold">
                    Customer Name <span className="text-red-500">*</span>
                  </Label>
                  <Popover open={customerOpen} onOpenChange={setCustomerOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        role="combobox"
                        aria-expanded={customerOpen}
                        className="w-full justify-between"
                      >
                        {editFormData.customerId
                          ? customers.find(
                              (c) =>
                                c.id.toString() === editFormData.customerId,
                            )?.name || editFormData.customerId
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
                                  setEditFormData({
                                    ...editFormData,
                                    customerId: c.id.toString(),
                                    customerPhone: c.phone || "",
                                  });
                                  setCustomerOpen(false);
                                }}
                              >
                                <Check
                                  className={cn(
                                    "mr-2 h-4 w-4",
                                    editFormData.customerId === c.id.toString()
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

                {/* Phone Readonly */}
                <div className="space-y-2">
                  <Label className="text-xs font-semibold flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5 text-muted-foreground" />{" "}
                    Phone
                  </Label>
                  <Input
                    value={editFormData.customerPhone}
                    readOnly
                    placeholder="Auto-filled"
                    className="bg-muted/40 border-dashed text-muted-foreground focus-visible:ring-0 cursor-not-allowed"
                    tabIndex={-1}
                  />
                </div>

                {/* Agent Select */}
                <div className="space-y-2">
                  <Label className="text-xs font-semibold flex items-center gap-1.5">
                    <Briefcase className="w-3.5 h-3.5 text-muted-foreground" />{" "}
                    Assign Agent
                  </Label>
                  <Popover open={agentOpen} onOpenChange={setAgentOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        role="combobox"
                        aria-expanded={agentOpen}
                        className="w-full justify-between"
                      >
                        {editFormData.agentId
                          ? agents.find(
                              (a) => a.id.toString() === editFormData.agentId,
                            )?.name || editFormData.agentId
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
                                  setEditFormData({
                                    ...editFormData,
                                    agentId: a.id.toString(),
                                  });
                                  setAgentOpen(false);
                                }}
                              >
                                <Check
                                  className={cn(
                                    "mr-2 h-4 w-4",
                                    editFormData.agentId === a.id.toString()
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

            {/* SECTION 3: TICKET DETAILS */}
            <div className="space-y-4">
              <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                <Activity className="w-4 h-4" /> Ticket Details
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {/* Direction */}
                <div className="space-y-2">
                  <Label className="text-xs font-semibold flex items-center gap-1.5">
                    <ArrowLeftRight className="w-3.5 h-3.5 text-muted-foreground" />{" "}
                    Direction <span className="text-red-500">*</span>
                  </Label>
                  <Select
                    value={editFormData.direction}
                    onValueChange={(value) =>
                      setEditFormData({
                        ...editFormData,
                        direction: value as CallDirection,
                      })
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

                {/* Status */}
                <div className="space-y-2">
                  <Label className="text-xs font-semibold flex items-center gap-1.5">
                    <Activity className="w-3.5 h-3.5 text-muted-foreground" />{" "}
                    Status
                  </Label>
                  <Select
                    value={editFormData.status}
                    onValueChange={(value) =>
                      setEditFormData({
                        ...editFormData,
                        status: value as TicketStatus,
                      })
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

                {/* Date */}
                <div className="space-y-2">
                  <Label className="text-xs font-semibold flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-muted-foreground" />{" "}
                    Date & Time
                  </Label>
                  <Input
                    type="datetime-local"
                    className="block w-full"
                    value={editFormData.callDate}
                    onChange={(e) =>
                      setEditFormData({
                        ...editFormData,
                        callDate: e.target.value,
                      })
                    }
                  />
                </div>
              </div>
            </div>

            <Separator />

            {/* SECTION 3: PRIORITY & DISPOSITION */}
            <div className="space-y-4">
              <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                <AlertCircle className="w-4 h-4" /> Details & Resolution
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="space-y-2">
                  <Label className="text-xs font-semibold">Priority</Label>
                  <Select
                    value={editFormData.priority}
                    onValueChange={(value) =>
                      setEditFormData({
                        ...editFormData,
                        priority: value as TicketPriority,
                      })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select priority" />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.values(TicketPriority).map((v) => (
                        <SelectItem key={v} value={v}>
                          {formatEnumLabel(v)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label className="text-xs font-semibold flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-muted-foreground" />{" "}
                    Disposition
                  </Label>
                  <Select
                    value={editFormData.disposition}
                    onValueChange={(value) =>
                      setEditFormData({
                        ...editFormData,
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

              {/* Description */}
              <div className="space-y-2 pt-2">
                <Label className="text-xs font-semibold">
                  Issue Description
                </Label>
                <Textarea
                  placeholder="Describe the issue..."
                  value={editFormData.issueDetail}
                  onChange={(e) =>
                    setEditFormData({
                      ...editFormData,
                      issueDetail: e.target.value,
                    })
                  }
                  className="min-h-[120px] resize-y"
                />
              </div>
            </div>

            {/* SECTION 4: ATTACHMENTS */}
            <div className="space-y-6">
              <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                <Paperclip className="w-4 h-4" /> Attachments
              </h3>

              {/* Saved Attachments */}
              {savedAttachments.length > 0 && (
                <div className="space-y-3">
                  <Label className="text-xs font-semibold">
                    Existing Files
                  </Label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {savedAttachments.map((att, idx) => (
                      <div
                        key={`${att}-${idx}`}
                        className="flex items-center justify-between p-3 bg-muted/20 border rounded-lg hover:bg-muted/40 transition-colors group cursor-pointer"
                        onClick={() =>
                          window.open(getAttachmentUrl(att), "_blank")
                        }
                      >
                        <div className="flex items-center gap-3 overflow-hidden">
                          <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                            <FileText className="w-4 h-4 text-primary" />
                          </div>
                          <span className="text-sm truncate font-medium">
                            {getAttachmentLabel(att)}
                          </span>
                        </div>
                        <ExternalLink className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* New Uploads */}
              <div className="space-y-3">
                <Label className="text-xs font-semibold">
                  Upload New Files
                </Label>
                <div className="border-2 border-dashed border-muted-foreground/25 hover:border-primary/50 bg-muted/30 hover:bg-muted/50 transition-all rounded-lg p-6 flex flex-col items-center justify-center gap-3 text-center cursor-pointer relative">
                  <Input
                    id="edit-ticket-files"
                    type="file"
                    multiple
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    onChange={(e) => {
                      const files = Array.from(e.target.files || []);
                      if (files.length === 0) return;
                      setAttachmentFiles([...attachmentFiles, ...files]);
                      e.currentTarget.value = "";
                    }}
                  />
                  <div className="p-3 bg-background rounded-full shadow-sm">
                    <UploadCloud className="w-6 h-6 text-primary" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-medium">
                      Click or drag files to upload
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Additional files for this ticket
                    </p>
                  </div>
                </div>

                {attachmentFiles.length > 0 && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-3">
                    {attachmentFiles.map((file, idx) => (
                      <div
                        key={`${file.name}-${idx}`}
                        className="flex items-center justify-between p-2.5 bg-muted/40 border rounded-md group"
                      >
                        <div className="flex items-center gap-2 overflow-hidden">
                          <Download className="w-4 h-4 text-emerald-600 shrink-0" />
                          <span className="text-sm truncate">{file.name}</span>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 text-muted-foreground hover:text-red-500"
                          onClick={() =>
                            setAttachmentFiles(
                              attachmentFiles.filter((_, i) => i !== idx),
                            )
                          }
                        >
                          <X className="w-3 h-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </ScrollArea>

        {/* STICKY FOOTER */}
        <DialogFooter className="px-6 py-4 border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <Button
            variant="ghost"
            onClick={() => onOpenChange(false)}
            disabled={isUpdating}
          >
            Cancel
          </Button>
          <Button onClick={onSubmit} disabled={isUpdating} className="px-8">
            {isUpdating ? "Updating..." : "Update Ticket"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
