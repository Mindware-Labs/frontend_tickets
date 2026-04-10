"use client";

import { JSX, useEffect, useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Hash,
  User,
  Phone,
  Mail,
  MapPin,
  Download,
  FileText,
  Edit2,
  Calendar,
  AlertCircle,
  ArrowRightCircle,
  Tag,
  MessageSquare,
  History,
  Clock,
  PhoneIncoming,
  PhoneOutgoing,
  StickyNote,
  Calendar as CalendarIcon,
} from "lucide-react";
import { Ticket } from "@/lib/mock-data";
import { cn } from "@/lib/utils";

type HelperFn<T extends (...args: any) => any> = (
  ...args: Parameters<T>
) => ReturnType<T>;

interface ViewTicketModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  ticket: Ticket | null;
  savedAttachments: string[];
  onEdit: () => void;
  formatEnumLabel: HelperFn<(value?: string) => string>;
  getStatusBadgeColor: HelperFn<(status: string) => string>;
  getPriorityColor: HelperFn<(priority?: string) => string>;
  getDirectionIcon: HelperFn<(direction: string) => JSX.Element>;
  getDirectionText: HelperFn<
    (
      direction: string,
      originalDirection?: string,
      agentId?: number | string,
    ) => string
  >;
  getCampaign: HelperFn<(ticket: Ticket) => string | null>;
  getAttachmentUrl: HelperFn<(value: string) => string>;
  getAttachmentLabel: HelperFn<(value: string) => string>;
  getClientName: HelperFn<(ticket: any) => string>;
  getClientPhone: HelperFn<(ticket: any) => string>;
  getYardDisplayName: HelperFn<(ticket: Ticket) => string | null>;
}

const DetailRow = ({
  icon: Icon,
  label,
  value,
  className,
}: {
  icon: any;
  label: string;
  value?: React.ReactNode;
  className?: string;
}) => {
  if (!value) return null;
  return (
    <div className={cn("flex items-start gap-3", className)}>
      <div className="mt-0.5 p-1.5 bg-muted rounded-md text-muted-foreground shrink-0">
        <Icon className="h-3.5 w-3.5" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider mb-0.5">
          {label}
        </p>
        <div className="text-sm font-medium text-foreground break-words">
          {value}
        </div>
      </div>
    </div>
  );
};

export function ViewTicketModal({
  open,
  onOpenChange,
  ticket,
  savedAttachments,
  onEdit,
  formatEnumLabel,
  getStatusBadgeColor,
  getPriorityColor,
  getDirectionIcon,
  getDirectionText,
  getCampaign,
  getAttachmentUrl,
  getAttachmentLabel,
  getClientName,
  getClientPhone,
  getYardDisplayName,
}: ViewTicketModalProps) {
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when modal opens
  useEffect(() => {
    if (open && ticket) {
      // Multiple attempts with increasing delays to ensure content is rendered
      const attemptScroll = (delay: number) => {
        setTimeout(() => {
          // Try to find the Radix ScrollArea viewport
          if (scrollAreaRef.current) {
            const viewport = scrollAreaRef.current.querySelector(
              "[data-radix-scroll-area-viewport]",
            ) as HTMLElement;
            if (viewport) {
              viewport.scrollTo({
                top: viewport.scrollHeight,
                behavior: "smooth",
              });
              return;
            }
          }

          // Fallback: try scrolling the content div directly
          if (contentRef.current) {
            const parent = contentRef.current.parentElement;
            if (parent) {
              parent.scrollTo({
                top: parent.scrollHeight,
                behavior: "smooth",
              });
            }
          }
        }, delay);
      };

      // Try multiple times with different delays
      attemptScroll(100);
      attemptScroll(300);
      attemptScroll(500);
    }
  }, [open, ticket]);

  if (!ticket) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-3xl p-0 gap-0 overflow-hidden bg-background border-border shadow-xl">
        {/* Header */}
        <DialogHeader className="p-6 pb-4 bg-muted/20 border-b border-border/50">
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-6">
            {" "}
            {/* gap-4 -> gap-6 */}
            <div className="flex items-start gap-4">
              <div className="p-3 rounded-xl bg-primary/10 border border-primary/20 shadow-sm">
                <Hash className="h-6 w-6 text-primary" />
              </div>
              <div className="space-y-1">
                <DialogTitle className="text-2xl font-bold tracking-tight">
                  Ticket #{ticket.id}
                </DialogTitle>
                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    {ticket.createdAt
                      ? new Date(ticket.createdAt).toLocaleString()
                      : "N/A"}
                  </span>
                </div>
              </div>
            </div>
            <Badge
              variant="secondary"
              className={cn(
                "w-fit px-3 py-1 text-xs font-semibold uppercase shadow-none border-0 self-start sm:self-center mr-2", // Añadido mr-2
                getStatusBadgeColor(ticket.status || ""),
              )}
            >
              {formatEnumLabel(ticket.status as any)}
            </Badge>
          </div>
        </DialogHeader>

        {/* Scrollable Content */}
        <ScrollArea className="max-h-[70vh]" ref={scrollAreaRef}>
          <div className="p-6 space-y-8" ref={contentRef}>
            {/* Customer Notes Popover */}
            {((ticket.customer?.notes && ticket.customer.notes.length > 0) ||
              ticket.customer?.note) && (
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
                      {ticket.customer?.notes &&
                      ticket.customer.notes.length > 0
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
            )}

            {/* Main Info Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Left Column: Customer & Location */}
              <div className="space-y-6">
                <div className="space-y-4">
                  <h4 className="text-sm font-semibold text-foreground flex items-center gap-2">
                    <User className="h-4 w-4" /> Customer Details
                  </h4>
                  <div className="grid gap-4 p-4 rounded-lg border bg-card text-card-foreground shadow-sm">
                    <DetailRow
                      icon={User}
                      label="Name"
                      value={getClientName(ticket)}
                    />
                    <Separator className="opacity-50" />
                    <DetailRow
                      icon={Phone}
                      label="Phone"
                      value={getClientPhone(ticket)}
                    />
                    {ticket.customer?.email && (
                      <>
                        <Separator className="opacity-50" />
                        <DetailRow
                          icon={Mail}
                          label="Email"
                          value={ticket.customer.email}
                        />
                      </>
                    )}
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="text-sm font-semibold text-foreground flex items-center gap-2">
                    <MapPin className="h-4 w-4" /> Location
                  </h4>
                  <div className="p-4 rounded-lg border bg-card text-card-foreground shadow-sm">
                    <DetailRow
                      icon={MapPin}
                      label="Yard"
                      value={getYardDisplayName(ticket) || "No yard assigned"}
                    />
                  </div>
                </div>
              </div>

              {/* Right Column: Ticket Context */}
              <div className="space-y-6">
                <div className="space-y-4">
                  <h4 className="text-sm font-semibold text-foreground flex items-center gap-2">
                    <FileText className="h-4 w-4" /> Ticket Context
                  </h4>
                  <div className="grid gap-4 p-4 rounded-lg border bg-card text-card-foreground shadow-sm">
                    <div className="grid grid-cols-2 gap-4">
                      <DetailRow
                        icon={AlertCircle}
                        label="Priority"
                        value={
                          <Badge
                            variant="outline"
                            className={cn(
                              "mt-1",
                              getPriorityColor(ticket.priority as any),
                            )}
                          >
                            {formatEnumLabel(ticket.priority as any)}
                          </Badge>
                        }
                      />
                      <DetailRow
                        icon={ArrowRightCircle}
                        label="Direction"
                        value={
                          <div className="flex items-center gap-1.5 mt-1">
                            {getDirectionIcon(ticket.direction || "inbound")}
                            <span className="truncate block max-w-[100px]">
                              {getDirectionText(
                                ticket.direction || "inbound",
                                (ticket as any).originalDirection,
                                ticket.agentId,
                              )}
                            </span>
                          </div>
                        }
                      />
                    </div>

                    <Separator className="opacity-50" />

                    <DetailRow
                      icon={Tag}
                      label="Campaign"
                      value={
                        <span
                          className="truncate block max-w-[150px]"
                          title={getCampaign(ticket) || "No campaign"}
                        >
                          {getCampaign(ticket) || "No campaign"}
                        </span>
                      }
                    />

                    {(ticket.campaignOption ||
                      (ticket as any).onboardingOption) && (
                      <>
                        <Separator className="opacity-50" />
                        <DetailRow
                          icon={Tag}
                          label="Campaign Option"
                          value={
                            <span
                              className="truncate block max-w-[150px]"
                              title={formatEnumLabel(
                                (ticket.campaignOption ||
                                  (ticket as any).onboardingOption) as any,
                              )}
                            >
                              {formatEnumLabel(
                                (ticket.campaignOption ||
                                  (ticket as any).onboardingOption) as any,
                              )}
                            </span>
                          }
                        />
                      </>
                    )}

                    <Separator className="opacity-50" />

                    <DetailRow
                      icon={MessageSquare}
                      label="Disposition"
                      value={
                        ticket.disposition ? (
                          <span
                            className="truncate block max-w-[150px]"
                            title={formatEnumLabel(ticket.disposition as any)}
                          >
                            {formatEnumLabel(ticket.disposition as any)}
                          </span>
                        ) : (
                          "-"
                        )
                      }
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Full Width: Issue & Attachments */}
            <div className="space-y-6">
              <div className="space-y-4">
                <h4 className="text-sm font-semibold text-foreground flex items-center gap-2">
                  <MessageSquare className="h-4 w-4" /> Issue Description
                </h4>
                <div className="p-4 rounded-lg border bg-muted/30 text-sm leading-relaxed whitespace-pre-wrap">
                  {ticket.issueDetail || "No details provided."}
                </div>
              </div>

              {savedAttachments.length > 0 && (
                <div className="space-y-4">
                  <h4 className="text-sm font-semibold text-foreground flex items-center gap-2">
                    <Download className="h-4 w-4" /> Attachments
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {savedAttachments.map((att, idx) => (
                      <div
                        key={`${att}-${idx}`}
                        className="group flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-muted/50 transition-colors"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="p-2 bg-primary/10 rounded-md text-primary">
                            <FileText className="h-4 w-4" />
                          </div>
                          <span className="text-sm font-medium truncate">
                            {getAttachmentLabel(att)}
                          </span>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground hover:text-foreground"
                          onClick={() =>
                            window.open(getAttachmentUrl(att), "_blank")
                          }
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Call History - Ledger Style */}
              {(ticket as any).callHistory &&
                (ticket as any).callHistory.length > 0 && (
                  <div className="space-y-4">
                    <h4 className="text-sm font-semibold text-foreground flex items-center gap-2">
                      <History className="h-4 w-4" /> Historial de
                      Actualizaciones
                    </h4>
                    <div className="rounded-lg border bg-card text-card-foreground shadow-sm overflow-hidden">
                      <ScrollArea className="max-h-[400px]">
                        <div className="divide-y divide-border/50">
                          {((ticket as any).callHistory || [])
                            .slice()
                            .reverse()
                            .map((call: any, idx: number) => {
                              const directionText = call.isMissed
                                ? `Missed (${call.originalDirection || call.direction})`
                                : call.direction;
                              const directionColor = call.isMissed
                                ? "bg-red-500/10 text-red-700 dark:text-red-400 border-red-500/20"
                                : call.direction === "INBOUND"
                                  ? "bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/20"
                                  : "bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/20";

                              const DirectionIcon =
                                call.direction === "INBOUND"
                                  ? PhoneIncoming
                                  : PhoneOutgoing;

                              return (
                                <div
                                  key={idx}
                                  className="p-4 hover:bg-muted/30 transition-colors"
                                >
                                  <div className="flex items-start gap-3">
                                    <div className="mt-0.5 p-1.5 bg-muted rounded-md text-muted-foreground shrink-0">
                                      <Clock className="h-3.5 w-3.5" />
                                    </div>
                                    <div className="flex-1 min-w-0 space-y-2">
                                      <div className="flex items-center gap-2 flex-wrap">
                                        <span className="text-xs font-semibold text-foreground">
                                          {new Date(
                                            call.createdAt,
                                          ).toLocaleString("es-ES", {
                                            hour: "2-digit",
                                            minute: "2-digit",
                                            day: "2-digit",
                                            month: "2-digit",
                                            year: "numeric",
                                          })}
                                        </span>
                                        <Badge
                                          variant="outline"
                                          className={`text-[9px] px-1.5 py-0 ${directionColor}`}
                                        >
                                          <DirectionIcon className="h-2.5 w-2.5 mr-1" />
                                          {directionText}
                                        </Badge>
                                        {call.agentName && (
                                          <span className="text-xs text-muted-foreground">
                                            • {call.agentName}
                                          </span>
                                        )}
                                        {call.duration !== undefined &&
                                          call.duration !== null && (
                                            <span className="text-xs text-muted-foreground">
                                              • {Math.floor(call.duration / 60)}
                                              m {call.duration % 60}s
                                            </span>
                                          )}
                                        <Badge
                                          variant="outline"
                                          className="text-[9px] px-1.5 py-0"
                                        >
                                          {formatEnumLabel(call.status)}
                                        </Badge>
                                      </div>

                                      {(call.issueDetail ||
                                        call.campaignOption) && (
                                        <div className="space-y-1 pl-2 border-l-2 border-muted">
                                          {call.campaignOption && (
                                            <div className="text-xs">
                                              <span className="font-medium text-muted-foreground">
                                                Campaign Option:{" "}
                                              </span>
                                              <span className="text-foreground">
                                                {formatEnumLabel(
                                                  call.campaignOption,
                                                )}
                                              </span>
                                            </div>
                                          )}
                                          {call.issueDetail && (
                                            <div className="text-xs text-foreground whitespace-pre-wrap">
                                              {call.issueDetail}
                                            </div>
                                          )}
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                        </div>
                      </ScrollArea>
                    </div>
                  </div>
                )}
            </div>
          </div>
        </ScrollArea>

        {/* Footer */}
        <DialogFooter className="p-4 bg-muted/20 border-t border-border/50 flex items-center justify-between gap-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
          <Button onClick={onEdit} className="gap-2 shadow-sm">
            <Edit2 className="h-4 w-4" />
            Edit Ticket
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
