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

  const [localCustomerSearch, setLocalCustomerSearch] = useState("");
  const [localYardSearch, setLocalYardSearch] = useState("");
  const [localAgentSearch, setLocalAgentSearch] = useState("");
  const [localCampaignSearch, setLocalCampaignSearch] = useState("");

  // Limpiar búsquedas cuando se cierran los popovers
  const handleCampaignOpenChange = (isOpen: boolean) => {
    setCampaignOpen(isOpen);
    if (!isOpen) setLocalCampaignSearch("");
  };

  const handleYardOpenChange = (isOpen: boolean) => {
    setYardOpen(isOpen);
    if (!isOpen) setLocalYardSearch("");
  };

  const handleCustomerOpenChange = (isOpen: boolean) => {
    setCustomerOpen(isOpen);
    if (!isOpen) setLocalCustomerSearch("");
  };

  const handleAgentOpenChange = (isOpen: boolean) => {
    setAgentOpen(isOpen);
    if (!isOpen) setLocalAgentSearch("");
  };

  const formatEnumLabel = (value: string) => {
    if (value === OnboardingOption.PAID_WITH_LL) return "Paid with LL";
    return value
      .toString()
      .replace(/_/g, " ")
      .toLowerCase()
      .replace(/\b\w/g, (char) => char.toUpperCase());
  };

  const normalizePhoneForSearch = (value?: string | null) => {
    if (!value) return "";
    return value.replace(/\D/g, "");
  };

  const stripUsCountryCode = (digits: string) => {
    if (digits.length > 10 && digits.startsWith("1")) {
      return digits.slice(1);
    }
    return digits;
  };

  // --- LOGIC (MEMOS) ---
  // Filtrado de customers
  const filteredCustomers = useMemo(() => {
    if (!localCustomerSearch.trim()) {
      return customers; // Mostrar TODOS los customers
    }
    const searchLower = localCustomerSearch.toLowerCase();
    const searchPhoneDigits = normalizePhoneForSearch(localCustomerSearch);
    const searchPhoneDigitsWithoutCountryCode =
      stripUsCountryCode(searchPhoneDigits);
    return customers.filter(
      (c) => {
        const customerPhone = c.phone ?? "";
        const customerPhoneDigits = normalizePhoneForSearch(customerPhone);
        const customerPhoneDigitsWithoutCountryCode =
          stripUsCountryCode(customerPhoneDigits);

        const matchesPhoneNormalized =
          !!searchPhoneDigits &&
          (customerPhoneDigits.includes(searchPhoneDigits) ||
            customerPhoneDigitsWithoutCountryCode.includes(searchPhoneDigits) ||
            customerPhoneDigits.includes(searchPhoneDigitsWithoutCountryCode) ||
            customerPhoneDigitsWithoutCountryCode.includes(
              searchPhoneDigitsWithoutCountryCode,
            ));

        return (
          c.name.toLowerCase().includes(searchLower) ||
          customerPhone.toLowerCase().includes(searchLower) ||
          c.id.toString().includes(searchLower) ||
          matchesPhoneNormalized
        );
      },
    );
  }, [customers, localCustomerSearch]);

  // Filtrado de yards
  const filteredYards = useMemo(() => {
    if (!localYardSearch.trim()) {
      return yards;
    }
    const searchLower = localYardSearch.toLowerCase();
    return yards.filter(
      (y) =>
        y.name.toLowerCase().includes(searchLower) ||
        y.id.toString().includes(searchLower),
    );
  }, [yards, localYardSearch]);

  // Filtrado de agents
  const filteredAgents = useMemo(() => {
    if (!localAgentSearch.trim()) {
      return agents;
    }
    const searchLower = localAgentSearch.toLowerCase();
    return agents.filter(
      (a) =>
        a.name.toLowerCase().includes(searchLower) ||
        a.email?.toLowerCase().includes(searchLower) ||
        a.id.toString().includes(searchLower),
    );
  }, [agents, localAgentSearch]);

  // Filtrado de campaigns
  const filteredCampaigns = useMemo(() => {
    if (!localCampaignSearch.trim()) {
      return campaigns;
    }
    const searchLower = localCampaignSearch.toLowerCase();
    return campaigns.filter(
      (c) =>
        c.nombre.toLowerCase().includes(searchLower) ||
        c.id.toString().includes(searchLower),
    );
  }, [campaigns, localCampaignSearch]);

  const selectedCampaign = useMemo(() => {
    if (!createFormData.campaignId) return null;
    return campaigns.find(
      (campaign) => campaign.id.toString() === createFormData.campaignId,
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
                  <Popover
                    open={campaignOpen}
                    onOpenChange={handleCampaignOpenChange}
                  >
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
                                c.id.toString() === createFormData.campaignId,
                            )?.nombre || createFormData.campaignId
                          : "Select campaign..."}
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-full p-0" align="start">
                      <Command shouldFilter={false}>
                        <CommandInput
                          placeholder="Search campaign..."
                          value={localCampaignSearch}
                          onValueChange={setLocalCampaignSearch}
                        />
                        <ScrollArea className="h-[300px]">
                          <CommandList>
                            <CommandEmpty>No campaign found.</CommandEmpty>
                            <CommandGroup>
                              <CommandItem
                                value="no-campaign"
                                onSelect={() => {
                                  setCreateFormData({
                                    ...createFormData,
                                    campaignId: "",
                                    campaignOption: "",
                                    yardId: "",
                                  });
                                  setLocalCampaignSearch("");
                                  setCampaignOpen(false);
                                }}
                              >
                                <Check
                                  className={cn(
                                    "mr-2 h-4 w-4",
                                    !createFormData.campaignId
                                      ? "opacity-100"
                                      : "opacity-0",
                                  )}
                                />
                                No Campaign
                              </CommandItem>
                              {filteredCampaigns.map((c) => (
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
                                    setLocalCampaignSearch("");
                                    setCampaignOpen(false);
                                  }}
                                >
                                  <Check
                                    className={cn(
                                      "mr-2 h-4 w-4",
                                      createFormData.campaignId ===
                                        c.id.toString()
                                        ? "opacity-100"
                                        : "opacity-0",
                                    )}
                                  />
                                  {c.nombre}
                                </CommandItem>
                              ))}
                            </CommandGroup>
                          </CommandList>
                        </ScrollArea>
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
                  <Popover open={yardOpen} onOpenChange={handleYardOpenChange}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        role="combobox"
                        aria-expanded={yardOpen}
                        className="w-full justify-between"
                      >
                        {createFormData.yardId
                          ? yards.find(
                              (y) => y.id.toString() === createFormData.yardId,
                            )?.name || createFormData.yardId
                          : "Select yard..."}
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-full p-0" align="start">
                      <Command shouldFilter={false}>
                        <CommandInput
                          placeholder="Search yard..."
                          value={localYardSearch}
                          onValueChange={setLocalYardSearch}
                        />
                        <ScrollArea className="h-[300px]">
                          <CommandList>
                            <CommandEmpty>No yard found.</CommandEmpty>
                            <CommandGroup>
                              <CommandItem
                                value="no-yard"
                                onSelect={() => {
                                  setCreateFormData({
                                    ...createFormData,
                                    yardId: "",
                                  });
                                  setLocalYardSearch("");
                                  setYardOpen(false);
                                }}
                              >
                                <Check
                                  className={cn(
                                    "mr-2 h-4 w-4",
                                    !createFormData.yardId
                                      ? "opacity-100"
                                      : "opacity-0",
                                  )}
                                />
                                No Yard
                              </CommandItem>
                              {filteredYards.map((y) => (
                                <CommandItem
                                  key={y.id}
                                  value={y.name}
                                  onSelect={() => {
                                    setCreateFormData({
                                      ...createFormData,
                                      yardId: y.id.toString(),
                                    });
                                    setLocalYardSearch("");
                                    setYardOpen(false);
                                  }}
                                >
                                  <Check
                                    className={cn(
                                      "mr-2 h-4 w-4",
                                      createFormData.yardId === y.id.toString()
                                        ? "opacity-100"
                                        : "opacity-0",
                                    )}
                                  />
                                  {y.name}
                                </CommandItem>
                              ))}
                            </CommandGroup>
                          </CommandList>
                        </ScrollArea>
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
                  <Popover
                    open={customerOpen}
                    onOpenChange={handleCustomerOpenChange}
                  >
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        role="combobox"
                        aria-expanded={customerOpen}
                        className={cn(
                          "w-full justify-between",
                          createValidationErrors.customerId &&
                            "border-red-500 ring-red-500/20",
                        )}
                      >
                        {createFormData.customerId
                          ? customers.find(
                              (c) =>
                                c.id.toString() === createFormData.customerId,
                            )?.name || createFormData.customerId
                          : "Select customer..."}
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-full p-0" align="start">
                      <div className="flex flex-col">
                        <div className="px-3 py-2 border-b">
                          <Input
                            placeholder="Search customer..."
                            value={localCustomerSearch}
                            onChange={(e) =>
                              setLocalCustomerSearch(e.target.value)
                            }
                            className="h-9"
                          />
                        </div>
                        <ScrollArea className="h-[300px]">
                          <div className="p-1">
                            {filteredCustomers.length === 0 ? (
                              <div className="py-6 text-center text-sm text-muted-foreground">
                                No customer found.
                              </div>
                            ) : (
                              filteredCustomers.map((c) => (
                                <div
                                  key={c.id}
                                  className={cn(
                                    "relative flex cursor-pointer select-none items-center rounded-sm px-2 py-2.5 text-sm outline-none hover:bg-accent hover:text-accent-foreground",
                                    createFormData.customerId ===
                                      c.id.toString() && "bg-accent",
                                  )}
                                  onClick={() => {
                                    setCreateFormData({
                                      ...createFormData,
                                      customerId: c.id.toString(),
                                      customerPhone: c.phone || "",
                                    });
                                    setCreateValidationErrors({
                                      ...createValidationErrors,
                                      customerId: "",
                                    });
                                    setLocalCustomerSearch("");
                                    setCustomerOpen(false);
                                  }}
                                >
                                  <Check
                                    className={cn(
                                      "mr-2 h-4 w-4",
                                      createFormData.customerId ===
                                        c.id.toString()
                                        ? "opacity-100"
                                        : "opacity-0",
                                    )}
                                  />
                                  <div className="flex flex-col flex-1">
                                    <span>{c.name}</span>
                                    {c.phone && (
                                      <span className="text-xs text-muted-foreground">
                                        {c.phone}
                                      </span>
                                    )}
                                  </div>
                                </div>
                              ))
                            )}
                          </div>
                        </ScrollArea>
                      </div>
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
                  <Popover
                    open={agentOpen}
                    onOpenChange={handleAgentOpenChange}
                  >
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        role="combobox"
                        aria-expanded={agentOpen}
                        className="w-full justify-between"
                      >
                        {createFormData.agentId
                          ? agents.find(
                              (a) => a.id.toString() === createFormData.agentId,
                            )?.name || createFormData.agentId
                          : "Unassigned"}
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-full p-0" align="start">
                      <Command shouldFilter={false}>
                        <CommandInput
                          placeholder="Search agent..."
                          value={localAgentSearch}
                          onValueChange={setLocalAgentSearch}
                        />
                        <ScrollArea className="h-[300px]">
                          <CommandList>
                            <CommandEmpty>No agent found.</CommandEmpty>
                            <CommandGroup>
                              {filteredAgents.map((a) => (
                                <CommandItem
                                  key={a.id}
                                  value={a.name}
                                  onSelect={() => {
                                    setCreateFormData({
                                      ...createFormData,
                                      agentId: a.id.toString(),
                                    });
                                    setLocalAgentSearch("");
                                    setAgentOpen(false);
                                  }}
                                >
                                  <Check
                                    className={cn(
                                      "mr-2 h-4 w-4",
                                      createFormData.agentId === a.id.toString()
                                        ? "opacity-100"
                                        : "opacity-0",
                                    )}
                                  />
                                  {a.name}
                                </CommandItem>
                              ))}
                            </CommandGroup>
                          </CommandList>
                        </ScrollArea>
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
                        createValidationErrors.direction && "border-red-500",
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
                    Date & Time
                  </Label>
                  <Input
                    type="datetime-local"
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
