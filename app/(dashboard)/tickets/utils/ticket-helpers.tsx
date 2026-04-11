import {
  PhoneOutgoing,
  PhoneIncoming,
  AlertTriangle,
  MessageCircle,
  Edit2,
  Users,
  Sparkles,
  Building,
} from "lucide-react";
import type { Ticket } from "@/lib/mock-data";
import type { CampaignOption, YardOption } from "../types";
import { OnboardingOption } from "../types";

export function getAssigneeName(assignedTo: any): string {
  if (!assignedTo) return "Unassigned";
  if (typeof assignedTo === "string") return assignedTo;
  return assignedTo.name || "Unknown Agent";
}

export function getAssigneeInitials(assignedTo: any): string {
  const name = getAssigneeName(assignedTo);
  if (name === "Unassigned") return "NA";
  return name.substring(0, 2).toUpperCase();
}

export function getClientName(ticket: any): string {
  if (!ticket) return "Unknown Caller";
  if (ticket.clientName) return ticket.clientName;
  if (ticket.customer?.name) return ticket.customer.name;
  return "Unknown Caller";
}

export function getClientPhone(ticket: any): string {
  if (!ticket) return "-";
  if (ticket.phone) return ticket.phone;
  if (ticket.customerPhone) return ticket.customerPhone;
  if (ticket.customer?.phone) return ticket.customer.phone;
  return "-";
}

export function getClientInitials(ticket: any): string {
  if (!ticket) return "NA";
  const name = getClientName(ticket);
  return name.substring(0, 2).toUpperCase();
}

export function getStatusBadgeColor(status: string): string {
  switch (status) {
    case "Open":
    case "OPEN":
      return "border-emerald-500/20 bg-emerald-500/5 text-emerald-600";
    case "In Progress":
    case "IN_PROGRESS":
      return "border-amber-500/20 bg-amber-500/5 text-amber-600";
    case "Closed":
    case "CLOSED":
    default:
      return "";
  }
}

export function getPriorityColor(priority?: string): string {
  const p = priority?.toUpperCase();
  switch (p) {
    case "HIGH":
    case "EMERGENCY":
      return "text-rose-500 bg-rose-500/10 border-rose-500/20";
    case "MEDIUM":
      return "text-amber-500 bg-amber-500/10 border-amber-500/20";
    case "LOW":
      return "text-blue-500 bg-blue-500/10 border-blue-500/20";
    default:
      return "text-muted-foreground bg-secondary/50";
  }
}

export function getDirectionIcon(direction: string) {
  const d = direction?.toString().toLowerCase();
  if (d === "missed") {
    return <AlertTriangle className="h-3 w-3 text-rose-500" />;
  }
  if (d === "outbound") {
    return <PhoneOutgoing className="h-3 w-3 text-blue-500" />;
  } else if (d === "text_message") {
    return <MessageCircle className="h-3 w-3 text-purple-500" />;
  } else if (d === "manual_entry") {
    return <Edit2 className="h-3 w-3 text-orange-500" />;
  } else {
    return <PhoneIncoming className="h-3 w-3 text-emerald-500" />;
  }
}

export function getDirectionText(
  direction: string,
  originalDirection?: string,
  agentId?: number | string,
): string {
  const d = direction?.toString().toLowerCase();
  if (d === "missed") {
    if (originalDirection) {
      const formatted =
        originalDirection.charAt(0).toUpperCase() +
        originalDirection.slice(1).toLowerCase();
      return `Missed (${formatted})`;
    }
    if (agentId) {
      return "Missed (Outbound)";
    }
    return "Missed (Inbound)";
  }
  if (d === "text_message") {
    return "Text Message";
  }
  if (d === "manual_entry") {
    return "Manual Entry";
  }
  return d === "outbound" ? "Outbound" : "Inbound";
}

export function isMissedCall(ticket: Ticket): boolean {
  return ticket.direction?.toString().toLowerCase() === "missed";
}

export function formatEnumLabel(value?: string): string {
  if (!value) return "-";
  if (value === OnboardingOption.PAID_WITH_LL || value === "PAID_WITH_LL") {
    return "Paid with LL";
  }
  return value
    .toString()
    .replace(/_/g, " ")
    .toLowerCase()
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

export function normalizeEnumValue(value?: string): string {
  if (!value) return "";
  return value.toString().trim().toUpperCase().replace(/\s+/g, "_");
}

export function getCampaign(
  ticket: Ticket,
  campaigns: CampaignOption[],
): string | null {
  if (
    ticket.campaign &&
    typeof ticket.campaign === "object" &&
    "nombre" in ticket.campaign
  ) {
    return (ticket.campaign as { nombre?: string }).nombre ?? null;
  }
  if (ticket.campaignId) {
    const campaign = campaigns.find((c) => c.id === ticket.campaignId);
    return campaign?.nombre ?? null;
  }
  return null;
}

export function getYardTypeColor(type?: string): string {
  const t = type?.toLowerCase();
  switch (t) {
    case "full_service":
      return "border-blue-500/20 bg-blue-500/5 text-blue-600 dark:border-blue-500/30 dark:bg-blue-500/10 dark:text-blue-400";
    case "saas":
      return "border-purple-500/20 bg-purple-500/5 text-purple-600 dark:border-purple-500/30 dark:bg-purple-500/10 dark:text-purple-400";
    default:
      return "border-gray-500/20 bg-gray-500/5 text-gray-600";
  }
}

export function getYardTypeIcon(type?: string) {
  const t = type?.toLowerCase();
  switch (t) {
    case "full_service":
      return <Users className="h-3 w-3" />;
    case "saas":
      return <Sparkles className="h-3 w-3" />;
    default:
      return <Building className="h-3 w-3" />;
  }
}

export function getYardDisplayName(
  ticket: Ticket,
  yards: YardOption[],
): string | null {
  if (ticket.yard && typeof ticket.yard === "object") {
    const y = ticket.yard as any;
    const name = y.name || "";
    const secondary = y.commonName || y.city || "";
    const location = y.propertyAddress || y.state || "";

    let display = name;
    if (secondary) display += ` - ${secondary}`;
    if (location && location !== secondary) display += ` (${location})`;

    return display || "Unknown Yard";
  }

  if (typeof ticket.yard === "string" && ticket.yard.trim() !== "") {
    return ticket.yard;
  }

  if (ticket.yardId) {
    const yard = yards.find(
      (y) => y.id.toString() === ticket.yardId?.toString(),
    );
    if (yard) return yard.commonName || yard.name;
  }

  return null;
}

export function getAttachmentUrl(value: string, apiBase: string): string {
  if (!value) return "";
  if (value.startsWith("http")) return value;
  if (value.startsWith("s3://")) {
    return `${apiBase}/tickets/attachments/download?fileUrl=${encodeURIComponent(value)}`;
  }
  const normalized = value.startsWith("/") ? value : `/${value}`;
  return `${apiBase}${normalized}`;
}

export function getAttachmentLabel(value: string): string {
  if (!value) return "Attachment";
  const parts = value.split("/");
  return parts[parts.length - 1] || value;
}
