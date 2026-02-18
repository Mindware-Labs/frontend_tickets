import { NextRequest, NextResponse } from "next/server";
import { fetchFromBackendServer } from "@/lib/api-server";

type Ticket = {
  id: number;
  status?: string;
  campaign?: string | null;
  campaignId?: number | null;
  disposition?: string | null;
  createdAt?: string;
  priority?: string | null;
  direction?: string | null;
  customer?: { name?: string | null };
};

type Campaign = {
  id: number;
  nombre: string;
  tipo?: string | null;
  isActive?: boolean;
};

const STATUS_ACTIVE = new Set(["OPEN", "IN_PROGRESS"]);
const STATUS_CLOSED = new Set(["CLOSED", "RESOLVED"]);
const PRIORITY_ALERT = new Set(["HIGH", "EMERGENCY"]);

const CAMPAIGN_LABELS: Record<string, string> = {
  ONBOARDING: "Onboarding",
  AR: "AR",
  OTHER: "Other",
};

const STATUS_LABELS: Record<string, string> = {
  OPEN: "Open",
  IN_PROGRESS: "In Progress",
  RESOLVED: "Resolved",
  CLOSED: "Closed",
};

const FALLBACK_CHART_ITEM = [{ name: "No data", count: 0 }];
const DASHBOARD_TIMEZONE =
  process.env.DASHBOARD_TIMEZONE || "America/Santo_Domingo";
const DATE_KEY_FORMATTER = new Intl.DateTimeFormat("en-CA", {
  timeZone: DASHBOARD_TIMEZONE,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});
const WEEKDAY_FORMATTER = new Intl.DateTimeFormat("en-US", {
  timeZone: DASHBOARD_TIMEZONE,
  weekday: "short",
});

function toTitleCase(value: string) {
  return value
    .toLowerCase()
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

function normalizeLabel(value: unknown, labels: Record<string, string>) {
  if (value === null || value === undefined) return "Unspecified";

  if (typeof value === "string") {
    const trimmed = value.trim();
    if (!trimmed) return "Unspecified";
    return labels[trimmed] || toTitleCase(trimmed);
  }

  if (typeof value === "number" || typeof value === "boolean") {
    const key = String(value);
    return labels[key] || key;
  }

  return "Unspecified";
}

function getCampaignLabel(
  ticket: Ticket,
  campaignsById: Record<number, string>,
) {
  if (ticket.campaign && typeof ticket.campaign === "object") {
    const maybeCampaign = ticket.campaign as { nombre?: string };
    if (maybeCampaign.nombre) return maybeCampaign.nombre;
  }

  if (ticket.campaignId && campaignsById[ticket.campaignId]) {
    return campaignsById[ticket.campaignId];
  }

  return normalizeLabel(ticket.campaign || "Unspecified", CAMPAIGN_LABELS);
}

function formatDateKey(date: Date) {
  return DATE_KEY_FORMATTER.format(date);
}

async function fetchTicketsWithLimit(
  request: NextRequest,
  limit: number,
  maxPages: number,
) {
  const tickets: Ticket[] = [];
  let total = 0;

  for (let page = 1; page <= maxPages; page += 1) {
    const response = await fetchFromBackendServer(
      request,
      `/tickets?page=${page}&limit=${limit}`,
    );
    const pageTickets: Ticket[] = response?.data || response || [];
    if (page === 1 && typeof response?.total === "number") {
      total = response.total;
    }

    tickets.push(...pageTickets);

    if (pageTickets.length < limit) break;
    if (total && tickets.length >= total) break;
  }

  return { tickets, total: total || tickets.length };
}

async function fetchCampaigns(request: NextRequest, limit: number) {
  const response = await fetchFromBackendServer(
    request,
    `/campaign?page=1&limit=${limit}`,
  );
  const campaigns: Campaign[] = response?.data || response || [];
  return campaigns;
}

// GET /api/dashboard/stats - Fetch dashboard statistics
export async function GET(request: NextRequest) {
  try {
    const { tickets, total } = await fetchTicketsWithLimit(request, 200, 5);
    let campaigns: Campaign[] = [];
    try {
      campaigns = await fetchCampaigns(request, 200);
    } catch {
      campaigns = [];
    }
    const totalTickets = total;

    // Filtrar tickets que NO son llamadas perdidas
    const answeredTickets = tickets.filter(
      (ticket) => ticket.direction !== "MISSED",
    );
    const totalCalls = answeredTickets.length;

    // --- CORRECCIÓN 1: Crear el mapa de IDs primero ---
    const campaignsById = campaigns.reduce<Record<number, string>>(
      (acc, campaign) => {
        acc[campaign.id] = campaign.nombre;
        return acc;
      },
      {},
    );

    const openTickets = answeredTickets.filter(
      (ticket) => ticket.status === "OPEN",
    ).length;
    const inProgressTickets = answeredTickets.filter(
      (ticket) => ticket.status === "IN_PROGRESS",
    ).length;
    const activeTickets = openTickets + inProgressTickets;
    const closedTickets = answeredTickets.filter((ticket) =>
      STATUS_CLOSED.has(ticket.status || ""),
    ).length;
    const pendingActions = answeredTickets.filter(
      (ticket) =>
        PRIORITY_ALERT.has(ticket.priority || "") &&
        !STATUS_CLOSED.has(ticket.status || ""),
    ).length;

    const resolutionRate =
      totalCalls > 0 ? Math.round((closedTickets / totalCalls) * 100) : 0;

    // --- CORRECCIÓN 2: Usar getCampaignLabel para contar correctamente ---
    // Esto asegura que si el ticket tiene campaignId, use el nombre correcto
    // Solo contar tickets que NO son llamadas perdidas
    const campaignCounts = answeredTickets.reduce<Record<string, number>>(
      (acc, ticket) => {
        const label = getCampaignLabel(ticket, campaignsById);
        acc[label] = (acc[label] || 0) + 1;
        return acc;
      },
      {},
    );

    const dispositionCounts = answeredTickets.reduce<Record<string, number>>(
      (acc, ticket) => {
        const label = normalizeLabel(ticket.disposition || "Unspecified", {});
        acc[label] = (acc[label] || 0) + 1;
        return acc;
      },
      {},
    );

    const now = new Date();
    const dayBuckets = Array.from({ length: 7 }).map((_, index) => {
      const date = new Date(now);
      date.setDate(now.getDate() - (6 - index));
      return {
        key: formatDateKey(date),
        label: WEEKDAY_FORMATTER.format(date),
        count: 0,
      };
    });

    const bucketMap = dayBuckets.reduce<Record<string, number>>(
      (acc, bucket, index) => {
        acc[bucket.key] = index;
        return acc;
      },
      {},
    );

    answeredTickets.forEach((ticket) => {
      if (!ticket.createdAt) return;
      const date = new Date(ticket.createdAt);
      if (Number.isNaN(date.getTime())) return;
      const key = formatDateKey(date);
      const bucketIndex = bucketMap[key];
      if (bucketIndex === undefined) return;
      dayBuckets[bucketIndex].count += 1;
    });

    const callsByDay = dayBuckets.map((bucket) => ({
      day: bucket.label,
      calls: bucket.count,
    }));

    // --- CORRECCIÓN 3: Asignar el conteo real en lugar de "1" ---
    // Si tenemos campañas definidas, iteramos sobre ellas y buscamos su conteo
    const ticketsByCampaign =
      campaigns.length > 0
        ? campaigns.map((campaign) => ({
            name: campaign.nombre,
            count: campaignCounts[campaign.nombre] || 0, // <--- AQUÍ ESTÁ LA SOLUCIÓN
          }))
        : Object.entries(campaignCounts).map(([name, count]) => ({
            name,
            count,
          }));

    // Ordenar de mayor a menor para que el gráfico se vea mejor
    ticketsByCampaign.sort((a, b) => b.count - a.count);

    const ticketsByDisposition = Object.entries(dispositionCounts).map(
      ([name, count]) => ({
        name,
        count,
      }),
    );

    const recentTickets = tickets.slice(0, 5).map((ticket) => ({
      id: ticket.id,
      clientName: ticket.customer?.name || "Unassigned",
      campaign: getCampaignLabel(ticket, campaignsById),
      status: normalizeLabel(ticket.status || "Unspecified", STATUS_LABELS),
      createdAt: ticket.createdAt || new Date().toISOString(),
    }));

    return NextResponse.json({
      success: true,
      data: {
        generatedAt: new Date().toISOString(),
        kpis: {
          totalCalls,
          totalTickets,
          activeTickets,
          openTickets,
          inProgressTickets,
          closedTickets,
          pendingActions,
          resolutionRate,
          callsLast7Days: callsByDay.reduce((sum, item) => sum + item.calls, 0),
        },
        charts: {
          callsByDay,
          ticketsByCampaign: ticketsByCampaign.length
            ? ticketsByCampaign
            : FALLBACK_CHART_ITEM,
          ticketsByDisposition: ticketsByDisposition.length
            ? ticketsByDisposition
            : FALLBACK_CHART_ITEM,
        },
        recentTickets,
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        message: error.message || "Failed to fetch dashboard stats",
      },
      { status: 500 },
    );
  }
}
