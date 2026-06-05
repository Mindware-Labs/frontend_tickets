"use client";

import { useMemo, useRef, useState } from "react";
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
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import {
  User,
  Phone,
  MapPin,
  Briefcase,
  Megaphone,
  Activity,
  AlertCircle,
  Calendar,
  ChevronsUpDown,
  Check,
  StickyNote,
  PhoneOutgoing,
  Pencil,
  Upload,
  Paperclip,
  FileIcon,
  X,
  Loader2,
} from "lucide-react";
import {
  SupportTicketStatus,
  SupportTicketPriority,
  SupportTicketType,
  ManagementType,
  OnboardingOption,
  ArOption,
  type SupportTicketRecord,
  type CreateSupportTicketFormData,
} from "../../types";
import { cn } from "@/lib/utils";
import { TicketStatusToggle } from "./TicketStatusToggle";
import { useAircall } from "@/components/providers/AircallProvider";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
const formatLabel = (v: string) =>
  v
    .replace(/_/g, " ")
    .toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase());

const formatEnumLabel = (value: string) => {
  if (value === OnboardingOption.PAID_WITH_LL) return "Paid with LL";
  return formatLabel(value);
};

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------
interface EditTicketModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  ticket: SupportTicketRecord | null;
  form: CreateSupportTicketFormData;
  setForm: React.Dispatch<React.SetStateAction<CreateSupportTicketFormData>>;
  customers: any[];
  yards: any[];
  agents: any[];
  campaigns: any[];
  phoneLines: { id: number; label: string | null; phoneNumber: string }[];
  pendingFiles: File[];
  onFilesChange: (files: File[]) => void;
  isSubmitting: boolean;
  onSubmit: () => void;
  onClose: () => void;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
export function EditTicketModal({
  open,
  onOpenChange,
  ticket,
  form,
  setForm,
  customers,
  yards,
  agents,
  campaigns,
  phoneLines,
  pendingFiles,
  onFilesChange,
  isSubmitting,
  onSubmit,
  onClose,
}: EditTicketModalProps) {
  // ---- Popover open states ----
  const [customerOpen, setCustomerOpen] = useState(false);
  const [customerSearch, setCustomerSearch] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ---- Aircall ----
  const {
    dial,
    status: aircallStatus,
    isLoggedIn: aircallLoggedIn,
  } = useAircall();
  const canDial = aircallStatus === "ready" && aircallLoggedIn;
  const dialPhone = ticket?.customer?.phone || "";

  // ---- Campaign logic ----
  const selectedCampaign = useMemo(() => {
    if (!form.campaignId) return null;
    return campaigns.find((c) => c.id.toString() === form.campaignId);
  }, [campaigns, form.campaignId]);

  const selectedCampaignType = selectedCampaign?.tipo?.toString().toUpperCase();
  const isOnboardingCampaign =
    selectedCampaignType === ManagementType.ONBOARDING;
  const isArCampaign = selectedCampaignType === ManagementType.AR;
  const campaignOptionValues = isOnboardingCampaign
    ? Object.values(OnboardingOption)
    : isArCampaign
      ? Object.values(ArOption)
      : [];

  // ---- Customer search ----
  const normalizePhone = (v?: string | null) => (v ? v.replace(/\D/g, "") : "");
  const stripUsCode = (d: string) =>
    d.length > 10 && d.startsWith("1") ? d.slice(1) : d;

  const filteredCustomers = useMemo(() => {
    if (!customerSearch.trim()) return customers;
    const s = customerSearch.toLowerCase();
    const sd = normalizePhone(customerSearch);
    const sds = stripUsCode(sd);
    return customers.filter((c) => {
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
  }, [customers, customerSearch]);

  // ---- File handling ----
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    onFilesChange([...pendingFiles, ...files]);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };
  const removePendingFile = (i: number) =>
    onFilesChange(pendingFiles.filter((_, idx) => idx !== i));

  if (!ticket) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-4xl max-h-[90vh] p-0 overflow-hidden flex flex-col gap-0">
        {/* HEADER */}
        <DialogHeader className="px-6 py-4 border-b bg-muted/20">
          <DialogTitle className="text-xl font-semibold flex items-center gap-2">
            <Pencil className="w-5 h-5 text-primary" />
            Edit Ticket #{ticket.id}
          </DialogTitle>
          <DialogDescription>
            Update the ticket information below
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
                <div className="max-h-70 overflow-y-auto p-2 space-y-2 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-border/50">
                  {ticket.customer?.notes &&
                  ticket.customer.notes.length > 0 ? (
                    ticket.customer.notes.map((n) => (
                      <div
                        key={n.id}
                        className="bg-muted/30 border border-border/50 rounded-lg p-3 text-sm"
                      >
                        <p className="text-foreground/90 whitespace-pre-wrap wrap-break-word leading-relaxed">
                          {n.content}
                        </p>
                        {n.createdAt && (
                          <div className="mt-2 flex items-center justify-between gap-2">
                            <div className="flex items-center gap-1.5 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider ml-auto">
                              <Calendar className="h-3 w-3 opacity-70" />
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

        {/* SCROLLABLE BODY */}
        <ScrollArea className="flex-1 overflow-y-auto">
          <div className="p-6 space-y-8">
            {/* SECTION 1: CAMPAIGN & LOCATION */}
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
                  <Select
                    value={form.campaignId || "none"}
                    onValueChange={(v) => {
                      const id = v === "none" ? "" : v;
                      const camp = campaigns.find(
                        (c) => c.id.toString() === id,
                      );
                      setForm((f) => ({
                        ...f,
                        campaignId: id,
                        ...(camp?.yardaId
                          ? { yardId: camp.yardaId.toString() }
                          : {}),
                      }));
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select campaign..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">No Campaign</SelectItem>
                      {campaigns.map((c) => (
                        <SelectItem key={c.id} value={c.id.toString()}>
                          {c.nombre}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Yard */}
                <div className="space-y-2">
                  <Label className="text-xs font-semibold flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-muted-foreground" />{" "}
                    Yard
                  </Label>
                  <Select
                    value={form.yardId || "none"}
                    onValueChange={(v) =>
                      setForm((f) => ({
                        ...f,
                        yardId: v === "none" ? "" : v,
                      }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select yard..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">No Yard</SelectItem>
                      {yards.map((y) => (
                        <SelectItem key={y.id} value={y.id.toString()}>
                          {y.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Dynamic Campaign Option */}
                {campaignOptionValues.length > 0 && (
                  <div className="md:col-span-2 space-y-2 animate-in fade-in slide-in-from-left-2">
                    <Label className="text-xs font-semibold">
                      Campaign Option
                    </Label>
                    <Select
                      value={form.campaignOption || "none"}
                      onValueChange={(v) =>
                        setForm((f) => ({
                          ...f,
                          campaignOption: v === "none" ? "" : v,
                        }))
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
                    onOpenChange={(isOpen) => {
                      setCustomerOpen(isOpen);
                      if (!isOpen) setCustomerSearch("");
                    }}
                  >
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        role="combobox"
                        aria-expanded={customerOpen}
                        className="w-full justify-between"
                      >
                        {form.customerId
                          ? customers.find(
                              (c) => c.id.toString() === form.customerId,
                            )?.name || form.customerId
                          : "Select customer..."}
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-full p-0" align="start">
                      <div className="flex flex-col">
                        <div className="px-3 py-2 border-b">
                          <Input
                            placeholder="Search customer..."
                            value={customerSearch}
                            onChange={(e) => setCustomerSearch(e.target.value)}
                            className="h-9"
                          />
                        </div>
                        <ScrollArea className="h-75">
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
                                    form.customerId === c.id.toString() &&
                                      "bg-accent",
                                  )}
                                  onClick={() => {
                                    setForm((f) => ({
                                      ...f,
                                      customerId: c.id.toString(),
                                    }));
                                    setCustomerSearch("");
                                    setCustomerOpen(false);
                                  }}
                                >
                                  <Check
                                    className={cn(
                                      "mr-2 h-4 w-4",
                                      form.customerId === c.id.toString()
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
                </div>

                {/* Phone (read-only) */}
                <div className="space-y-2">
                  <Label className="text-xs font-semibold flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5 text-muted-foreground" />{" "}
                    Phone
                  </Label>
                  <Input
                    value={
                      customers.find((c) => c.id.toString() === form.customerId)
                        ?.phone || ""
                    }
                    readOnly
                    placeholder="Auto-filled"
                    className="bg-muted/40 border-dashed text-muted-foreground focus-visible:ring-0 cursor-not-allowed"
                    tabIndex={-1}
                  />
                </div>

                {/* Agent */}
                <div className="space-y-2">
                  <Label className="text-xs font-semibold flex items-center gap-1.5">
                    <Briefcase className="w-3.5 h-3.5 text-muted-foreground" />{" "}
                    Assigned Agent
                  </Label>
                  <Select
                    value={form.agentId || "none"}
                    onValueChange={(v) =>
                      setForm((f) => ({
                        ...f,
                        agentId: v === "none" ? "" : v,
                      }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Unassigned" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Unassigned</SelectItem>
                      {agents.map((a) => (
                        <SelectItem key={a.id} value={a.id.toString()}>
                          {a.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Phone Line */}
                <div className="space-y-2">
                  <Label className="text-xs font-semibold flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5 text-muted-foreground" />{" "}
                    Phone Line
                  </Label>
                  <Select
                    value={form.phoneLineId || "none"}
                    onValueChange={(v) =>
                      setForm((f) => ({
                        ...f,
                        phoneLineId: v === "none" ? "" : v,
                      }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select phone line" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">None</SelectItem>
                      {phoneLines.map((pl) => (
                        <SelectItem key={pl.id} value={pl.id.toString()}>
                          {pl.label
                            ? `${pl.label} (${pl.phoneNumber})`
                            : pl.phoneNumber}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
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
                {/* Status */}
                <div className="space-y-2 md:col-span-2">
                  <Label className="text-xs font-semibold flex items-center gap-1.5">
                    <Activity className="w-3.5 h-3.5 text-muted-foreground" />{" "}
                    Status
                  </Label>
                  <TicketStatusToggle
                    value={form.status}
                    onChange={(v) =>
                      setForm((f) => ({
                        ...f,
                        status: v as SupportTicketStatus,
                      }))
                    }
                  />
                </div>

                {/* Priority */}
                <div className="space-y-2">
                  <Label className="text-xs font-semibold flex items-center gap-1.5">
                    <AlertCircle className="w-3.5 h-3.5 text-muted-foreground" />{" "}
                    Priority
                  </Label>
                  <Select
                    value={form.priority}
                    onValueChange={(v) =>
                      setForm((f) => ({
                        ...f,
                        priority: v as SupportTicketPriority,
                      }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select priority" />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.values(SupportTicketPriority).map((p) => (
                        <SelectItem key={p} value={p}>
                          {formatLabel(p)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Ticket Type */}
                <div className="space-y-2">
                  <Label className="text-xs font-semibold">Ticket Type</Label>
                  <Select
                    value={form.ticketType || "none"}
                    onValueChange={(v) =>
                      setForm((f) => ({
                        ...f,
                        ticketType: v === "none" ? "" : v,
                      }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">None</SelectItem>
                      {Object.values(SupportTicketType).map((t) => (
                        <SelectItem key={t} value={t}>
                          {formatLabel(t)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            <Separator />

            {/* SECTION 4: DETAILS & FOLLOW-UP */}
            <div className="space-y-4">
              <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                <AlertCircle className="w-4 h-4" /> Details & Follow-up
              </h3>

              {/* Issue Detail */}
              <div className="space-y-2">
                <Label className="text-xs font-semibold">Issue Detail</Label>
                <Textarea
                  placeholder="Describe the issue..."
                  value={form.issueDetail}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, issueDetail: e.target.value }))
                  }
                  className="min-h-30 resize-y"
                />
              </div>

              {/* Follow-up */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="space-y-2">
                  <Label className="text-xs font-semibold flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-muted-foreground" />{" "}
                    Follow-up Due
                  </Label>
                  <Input
                    type="datetime-local"
                    value={form.followUpDueDate}
                    onChange={(e) =>
                      setForm((f) => ({
                        ...f,
                        followUpDueDate: e.target.value,
                      }))
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-semibold flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-muted-foreground" />{" "}
                    Follow-up Assigned To
                  </Label>
                  <Select
                    value={form.followUpAssignedToId || "none"}
                    onValueChange={(v) =>
                      setForm((f) => ({
                        ...f,
                        followUpAssignedToId: v === "none" ? "" : v,
                      }))
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

              {/* Attachments */}
              <div className="space-y-2 pt-2">
                <Label className="text-xs font-semibold flex items-center gap-1.5">
                  <Paperclip className="w-3.5 h-3.5 text-muted-foreground" />{" "}
                  Attachments
                </Label>
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  className="hidden"
                  onChange={handleFileSelect}
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="w-fit"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Upload className="h-4 w-4 mr-2" />
                  Add Files
                </Button>

                {/* Existing attachments */}
                {ticket.attachments && ticket.attachments.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-1">
                    {ticket.attachments.map((url, i) => (
                      <a
                        key={i}
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 text-xs text-blue-600 hover:underline bg-blue-50 dark:bg-blue-950/30 px-2 py-1 rounded"
                      >
                        <Paperclip className="h-3 w-3" />
                        {url.split("/").pop()}
                      </a>
                    ))}
                  </div>
                )}

                {/* Pending files */}
                {pendingFiles.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-1">
                    {pendingFiles.map((file, i) => (
                      <div
                        key={i}
                        className="flex items-center gap-1 text-xs bg-muted px-2 py-1 rounded"
                      >
                        <FileIcon className="h-3 w-3" />
                        <span className="max-w-37.5 truncate">{file.name}</span>
                        <button
                          type="button"
                          onClick={() => removePendingFile(i)}
                          className="ml-1 hover:text-destructive"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </ScrollArea>

        {/* STICKY FOOTER */}
        <DialogFooter className="px-6 py-4 border-t bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60">
          <Button
            variant="outline"
            onClick={() => {
              if (dialPhone) dial(dialPhone, ticket.id);
            }}
            disabled={!dialPhone || !canDial}
            title={
              !dialPhone
                ? "No phone number on file"
                : !canDial
                  ? "Aircall is not connected"
                  : `Call ${dialPhone}`
            }
          >
            <PhoneOutgoing className="h-4 w-4 mr-2" />
            Call
          </Button>
          <Button variant="ghost" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button onClick={onSubmit} disabled={isSubmitting} className="px-8">
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isSubmitting ? "Updating..." : "Update Ticket"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
