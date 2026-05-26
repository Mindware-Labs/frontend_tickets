"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { fetchFromBackend } from "@/lib/api-client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  ArrowLeft,
  Calendar,
  Hash,
  Loader2,
  Ticket as TicketIcon,
  User,
  Phone,
} from "lucide-react";

export default function TicketDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [ticket, setTicket] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadTicket = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const data = await fetchFromBackend(`/tickets/${id}`);
        setTicket(data);
      } catch (err: any) {
        setError(err?.message || "Call not found");
        setTicket(null);
      } finally {
        setIsLoading(false);
      }
    };
    loadTicket();
  }, [id]);

  const status = (ticket?.status || "").toLowerCase();
  const statusVariant =
    status.includes("closed") || status.includes("resolved")
      ? "bg-emerald-500/10 text-emerald-700 border-emerald-200"
      : status.includes("open")
        ? "bg-amber-500/10 text-amber-700 border-amber-200"
        : "bg-muted text-muted-foreground border-border";

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          onClick={() => router.push("/tickets")}
          className="gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Tickets
        </Button>
        <div className="flex items-center gap-2 text-muted-foreground">
          <Hash className="h-4 w-4" />
          <span className="font-mono text-sm">Call #{id}</span>
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center gap-2 text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin" />
          Loading ticket...
        </div>
      ) : error || !ticket ? (
        <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-4 text-destructive">
          <p className="font-semibold">Ticket not found</p>
          <p className="text-sm opacity-80">{error}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            <div className="rounded-lg border bg-card p-5 shadow-sm">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <TicketIcon className="h-5 w-5 text-primary" />
                  <h2 className="text-lg font-semibold">Ticket Details</h2>
                </div>
                <Badge
                  variant="outline"
                  className={`text-xs uppercase tracking-wide border ${statusVariant}`}
                >
                  {ticket.status || "Unknown"}
                </Badge>
              </div>
              <div className="mt-4 space-y-2 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  <span>
                    Created:{" "}
                    {ticket.createdAt
                      ? new Date(ticket.createdAt).toLocaleString()
                      : "N/A"}
                  </span>
                </div>
                {ticket.notes && (
                  <div className="mt-3">
                    <p className="text-foreground font-semibold mb-1">Notes</p>
                    <p className="text-sm leading-relaxed">{ticket.notes}</p>
                  </div>
                )}
              </div>
            </div>

            {ticket.campaign && (
              <div className="rounded-lg border bg-card p-5 shadow-sm">
                <h3 className="text-sm font-semibold text-foreground mb-2">
                  Campaign
                </h3>
                <p className="text-muted-foreground text-sm">
                  {ticket.campaign.nombre || ticket.campaign.name || "N/A"}
                </p>
              </div>
            )}
          </div>

          <div className="space-y-4">
            <div className="rounded-lg border bg-card p-5 shadow-sm">
              <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                <User className="h-4 w-4" />
                Customer
              </h3>
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">
                    {ticket.customer?.name || ticket.customerName || "N/A"}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <span>{ticket.customerPhone || "No phone"}</span>
                </div>
              </div>
              {ticket.customerId && (
                <Link
                  href={`/customers?customerId=${ticket.customerId}`}
                  className="mt-3 inline-flex items-center gap-1 text-xs text-primary hover:underline"
                >
                  View customer
                  <ArrowLeft className="h-3 w-3 rotate-180" />
                </Link>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
