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
  ChevronsUpDown,
  Check,
} from "lucide-react";
import {
  AgentOption,
  CallDirection,
  CampaignOption,
  CreateTicketFormData,
  CustomerOption,
  ManagementType,
  OnboardingOption,
  ArOption,
  TicketDisposition,
  TicketPriority,
  TicketStatus,
  YardOption,
} from "../types";
import { cn } from "@/lib/utils"; // Utilidad estándar de shadcn

interface CreateTicketModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  customers: CustomerOption[];
  yards: YardOption[];
  agents: AgentOption[];
  campaigns: CampaignOption[];
  createFormData: CreateTicketFormData;
  setCreateFormData: (next: CreateTicketFormData) => void;
  createValidationErrors: Record<string, string>;
  setCreateValidationErrors: (next: Record<string, string>) => void;
  customerSearchCreate: string;
  setCustomerSearchCreate: (value: string) => void;
  yardSearchCreate: string;
  setYardSearchCreate: (value: string) => void;
  agentSearchCreate: string;
  setAgentSearchCreate: (value: string) => void;
  campaignSearchCreate: string;
  setCampaignSearchCreate: (value: string) => void;
  newAttachment: string;
  setNewAttachment: (value: string) => void;
  attachmentFiles: File[];
  setAttachmentFiles: (next: File[]) => void;
  isCreating: boolean;
  onSubmit: () => void;
}

export function CreateTicketModal({
  open,
  onOpenChange,
  customers,
  yards,
  agents,
  campaigns,
  createFormData,
  setCreateFormData,
  createValidationErrors,
  setCreateValidationErrors,
  customerSearchCreate,
  setCustomerSearchCreate,
  yardSearchCreate,
  setYardSearchCreate,
  agentSearchCreate,
  setAgentSearchCreate,
  campaignSearchCreate,
  setCampaignSearchCreate,
  attachmentFiles,
  setAttachmentFiles,
  isCreating,
  onSubmit,
}: CreateTicketModalProps) {
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
    if (!createFormData.campaignId) return null;
    return campaigns.find(
      (campaign) => campaign.id.toString() === createFormData.campaignId
    );
  }, [campaigns, createFormData.campaignId]);

  const selectedCampaignType = selectedCampaign?.tipo?.toString().toUpperCase();
  const isOnboardingCampaign =
    selectedCampaignType === ManagementType.ONBOARDING;
  const isArCampaign = selectedCampaignType === ManagementType.AR;
  const campaignOptionValues = isOnboardingCampaign
    ? Object.values(OnboardingOption)
    : isArCampaign
    ? Object.values(ArOption)
    : [];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-4xl max-h-[90vh] p-0 overflow-hidden flex flex-col gap-0">
        {/* HEADER */}
        <DialogHeader className="px-6 py-4 border-b bg-muted/20">
          <DialogTitle className="text-xl font-semibold flex items-center gap-2">
            <FileText className="w-5 h-5 text-primary" />
            Create Manual Ticket
          </DialogTitle>
          <DialogDescription>
            Fill in the details below to generate a new support ticket.
          </DialogDescription>
        </DialogHeader>

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
                        {createFormData.campaignId
                          ? campaigns.find(
                              (c) =>
                                c.id.toString() === createFormData.campaignId
                            )?.nombre || createFormData.campaignId
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
                            {campaigns.map((c) => (
                              <CommandItem
                                key={c.id}
                                value={c.nombre}
                                onSelect={() => {
                                  setCreateFormData({
                                    ...createFormData,
                                    campaignId: c.id.toString(),
                                    yardId: c.yardaId
                                      ? c.yardaId.toString()
                                      : "",
                                    campaignOption:
                                      c.tipo === ManagementType.ONBOARDING ||
                                      c.tipo === ManagementType.AR
                                        ? createFormData.campaignOption
                                        : "",
                                  });
                                  setCampaignOpen(false);
                                }}
                              >
                                <Check
                                  className={cn(
                                    "mr-2 h-4 w-4",
                                    createFormData.campaignId ===
                                      c.id.toString()
                                      ? "opacity-100"
                                      : "opacity-0"
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
                        {createFormData.yardId
                          ? yards.find(
                              (y) => y.id.toString() === createFormData.yardId
                            )?.name || createFormData.yardId
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
                            {yards.map((y) => (
                              <CommandItem
                                key={y.id}
                                value={y.name}
                                onSelect={() => {
                                  setCreateFormData({
                                    ...createFormData,
                                    yardId: y.id.toString(),
                                  });
                                  setYardOpen(false);
                                }}
                              >
                                <Check
                                  className={cn(
                                    "mr-2 h-4 w-4",
                                    createFormData.yardId === y.id.toString()
                                      ? "opacity-100"
                                      : "opacity-0"
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
                      value={createFormData.campaignOption}
                      onValueChange={(value) =>
                        setCreateFormData({
                          ...createFormData,
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
                        className={cn(
                          "w-full justify-between",
                          createValidationErrors.customerId &&
                            "border-red-500 ring-red-500/20"
                        )}
                      >
                        {createFormData.customerId
                          ? customers.find(
                              (c) =>
                                c.id.toString() === createFormData.customerId
                            )?.name || createFormData.customerId
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
                                value={c.name}
                                onSelect={() => {
                                  setCreateFormData({
                                    ...createFormData,
                                    customerId: c.id.toString(),
                                    customerPhone: c.phone || "",
                                  });
                                  setCreateValidationErrors({
                                    ...createValidationErrors,
                                    customerId: "",
                                  });
                                  setCustomerOpen(false);
                                }}
                              >
                                <Check
                                  className={cn(
                                    "mr-2 h-4 w-4",
                                    createFormData.customerId ===
                                      c.id.toString()
                                      ? "opacity-100"
                                      : "opacity-0"
                                  )}
                                />
                                {c.name}
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                  {createValidationErrors.customerId && (
                    <p className="text-[11px] font-medium text-red-500 animate-in slide-in-from-top-1">
                      {createValidationErrors.customerId}
                    </p>
                  )}
                </div>

                {/* Phone Readonly */}
                <div className="space-y-2">
                  <Label className="text-xs font-semibold flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5 text-muted-foreground" />{" "}
                    Phone
                  </Label>
                  <Input
                    value={createFormData.customerPhone}
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
                        {createFormData.agentId
                          ? agents.find(
                              (a) => a.id.toString() === createFormData.agentId
                            )?.name || createFormData.agentId
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
                                  setCreateFormData({
                                    ...createFormData,
                                    agentId: a.id.toString(),
                                  });
                                  setAgentOpen(false);
                                }}
                              >
                                <Check
                                  className={cn(
                                    "mr-2 h-4 w-4",
                                    createFormData.agentId === a.id.toString()
                                      ? "opacity-100"
                                      : "opacity-0"
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

            {/* SECTION 3: TICKET CLASSIFICATION */}
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
                    value={createFormData.direction}
                    onValueChange={(value) => {
                      setCreateFormData({
                        ...createFormData,
                        direction: value as CallDirection,
                      });
                      setCreateValidationErrors({
                        ...createValidationErrors,
                        direction: "",
                      });
                    }}
                  >
                    <SelectTrigger
                      className={cn(
                        createValidationErrors.direction && "border-red-500"
                      )}
                    >
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
                    value={createFormData.status}
                    onValueChange={(value) =>
                      setCreateFormData({
                        ...createFormData,
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
                    Date
                  </Label>
                  <Input
                    type="date"
                    className="block w-full"
                    value={createFormData.callDate}
                    onChange={(e) =>
                      setCreateFormData({
                        ...createFormData,
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
                    value={createFormData.priority}
                    onValueChange={(value) =>
                      setCreateFormData({
                        ...createFormData,
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
                    value={createFormData.disposition}
                    onValueChange={(value) =>
                      setCreateFormData({
                        ...createFormData,
                        disposition: value === "none" ? "" : value,
                      })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select disposition" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">No disposition</SelectItem>
                      {Object.values(TicketDisposition)
                        .filter((v) => v !== "OTHER")
                        .map((v) => (
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
                  placeholder="Describe the issue in detail..."
                  value={createFormData.issueDetail}
                  onChange={(e) =>
                    setCreateFormData({
                      ...createFormData,
                      issueDetail: e.target.value,
                    })
                  }
                  className="min-h-[120px] resize-y bg-background"
                />
              </div>
            </div>

            {/* SECTION 4: ATTACHMENTS */}
            <div className="space-y-4">
              <Label className="text-xs font-semibold flex items-center gap-1.5">
                <Paperclip className="w-3.5 h-3.5 text-muted-foreground" />{" "}
                Attachments
              </Label>

              <div className="border-2 border-dashed border-muted-foreground/25 hover:border-primary/50 bg-muted/30 hover:bg-muted/50 transition-all rounded-lg p-6 flex flex-col items-center justify-center gap-3 text-center cursor-pointer relative">
                <Input
                  id="create-ticket-files"
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
                    Support for documents, images (Max 10MB)
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
                        <FileText className="w-4 h-4 text-primary shrink-0" />
                        <span className="text-sm truncate">{file.name}</span>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 text-muted-foreground hover:text-red-500"
                        onClick={() =>
                          setAttachmentFiles(
                            attachmentFiles.filter((_, i) => i !== idx)
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
        </ScrollArea>

        {/* STICKY FOOTER */}
        <DialogFooter className="px-6 py-4 border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <Button
            variant="ghost"
            onClick={() => onOpenChange(false)}
            disabled={isCreating}
          >
            Cancel
          </Button>
          <Button onClick={onSubmit} disabled={isCreating} className="px-8">
            {isCreating ? <>Creating...</> : <>Create Ticket</>}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
