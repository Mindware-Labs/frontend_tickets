import { NextRequest, NextResponse } from "next/server";
import { fetchFromBackendServer } from "@/lib/api-server";

export const dynamic = "force-dynamic";
export const revalidate = 60;

type Ticket = {
  id: number;
  status?: string;
  campaign?: string | null;
  campaignId?: number | null;
  disposition?: string | null;
  createdAt?: string;
  priority?: string | null;
  direction?: string | null;
  duration?: number | null;
  callDuration?: number | null;
  customer?: { name?: string | null };
  assignedTo?: number | null;
  assignedToUser?: { id?: number; name?: string } | null;
};

type ManualRecord = {
  id: number;
  status?: string | null;
  disposition?: string | null;
  createdAt?: string | null;
  createdByAgentId?: number | null;
  customer?: { name?: string | null; phone?: string | null } | null;
};

type Campaign = {
  id: number;
  nombre: string;
  tipo?: string | null;
  isActive?: boolean;
};

const STATUS_ACTIVE = new Set(["OPEN", "IN_PROGRESS", "PENDING_FOLLOWUP", "OVERDUE"]);
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
  PENDING_FOLLOWUP: "Pending Follow-up",
  OVERDUE: "Overdue",
  RESOLVED: "Resolved",
  CLOSED: "Closed",
};

const FALLBACK_CHART_ITEM = [{ name: "No data", count: 0 }];
const DASHBOARD_TIMEZONE =
  process.env.DASHBOARD_TIMEZONE || "America/Santo_Domingo";
const ISO_TZ_SUFFIX_REGEX = /([zZ]|[+\-]\d{2}:?\d{2})$/;
const ISO_DATE_PREFIX_REGEX = /^(\d{4}-\d{2}-\d{2})T/;
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

function getTicketDateKey(createdAt: string) {
  const value = createdAt.trim();
  if (!value) return null;

  // In production runtimes (UTC), naive timestamps like "2026-02-18T10:00:00"
  // can shift by timezone; preserve literal date part when timezone is missing.
  if (!ISO_TZ_SUFFIX_REGEX.test(value)) {
    const dateMatch = value.match(ISO_DATE_PREFIX_REGEX);
    if (dateMatch?.[1]) return dateMatch[1];
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return null;
  return formatDateKey(parsed);
}

async function getUserIdFromRequest(
  request: NextRequest,
): Promise<number | null> {
  // First, try to extract from token directly (faster)
  const cookieToken =
    request.cookies.get("auth-token")?.value ||
    request.cookies.get("auth_token")?.value;
  const headerToken = request.headers
    .get("authorization")
    ?.replace(/^Bearer\s+/i, "");
  const authToken = cookieToken || headerToken || null;

  if (authToken) {
    try {
      const payloadPart = authToken.split(".")[1];
      if (payloadPart) {
        const base64 = payloadPart.replace(/-/g, "+").replace(/_/g, "/");
        const padded = base64 + "=".repeat((4 - (base64.length % 4)) % 4);
        const payloadString = atob(padded);
        const payload = JSON.parse(payloadString);
        console.log("[agent-stats] Token payload keys:", Object.keys(payload));
        const userId = payload?.id || payload?.userId || payload?.sub;
        if (userId) {
          console.log("[agent-stats] Found user ID in token:", userId);
          return Number(userId);
        }
      }
    } catch (tokenError) {
      console.error("[agent-stats] Error parsing token:", tokenError);
    }
  } else {
    console.log("[agent-stats] No auth token found in cookies or headers");
  }

  // Fallback: try to get user profile from backend
  try {
    const profileResponse = await fetchFromBackendServer(
      request,
      "/auth/profile",
    );

    console.log("[agent-stats] Profile response:", {
      hasId: !!profileResponse?.id,
      hasUserId: !!profileResponse?.userId,
      keys: profileResponse ? Object.keys(profileResponse) : [],
    });

    // The profile should contain the user ID
    if (profileResponse?.id) {
      return Number(profileResponse.id);
    }
    if (profileResponse?.userId) {
      return Number(profileResponse.userId);
    }
  } catch (error: any) {
    console.error("[agent-stats] Error getting profile from backend:", error);
    // If it's a 401, the user is not authenticated
    if (error?.status === 401 || error?.body?.statusCode === 401) {
      console.log("[agent-stats] User not authenticated (401)");
    }
  }

  return null;
}

async function fetchTicketsWithLimit(
  request: NextRequest,
  limit: number,
  maxPages: number,
  agentId: number | null,
  endpoint = "/tickets",
  agentParam = "assignedMeAgentId",
) {
  const tickets: Ticket[] = [];
  let total = 0;

  console.log(
    `[agent-stats] Fetching tickets from database for agentId: ${agentId}`,
  );

  for (let page = 1; page <= maxPages; page += 1) {
    // Build query with assignedTo filter if agentId is provided
    let queryParams = `page=${page}&limit=${limit}`;
    if (agentId !== null) {
      queryParams += `&${agentParam}=${agentId}`;
    }

    const response = await fetchFromBackendServer(
      request,
      `${endpoint}?${queryParams}`,
    );
    const pageTickets: Ticket[] = response?.data || response || [];
    if (page === 1 && typeof response?.total === "number") {
      total = response.total;
    }

    console.log(
      `[agent-stats] Page ${page}: ${pageTickets.length} tickets from database (total: ${total})`,
    );

    tickets.push(...pageTickets);

    if (pageTickets.length < limit) break;
    if (total && tickets.length >= total) break;
  }

  console.log(
    `[agent-stats] Total tickets from database: ${total || tickets.length}`,
  );

  return { tickets, total: total || tickets.length };
}

async function fetchAgentCollection<T>(
  request: NextRequest,
  endpoint: string,
  agentId: number,
  agentParam: string,
  limit = 500,
  maxPages = 3,
) {
  const items: T[] = [];
  let total = 0;

  for (let page = 1; page <= maxPages; page += 1) {
    const response = await fetchFromBackendServer(
      request,
      `${endpoint}?page=${page}&limit=${limit}&${agentParam}=${agentId}`,
    );
    const pageItems: T[] = response?.data || response || [];
    if (page === 1 && typeof response?.total === "number") total = response.total;
    items.push(...pageItems);
    if (pageItems.length < limit) break;
    if (total && items.length >= total) break;
  }

  return { items, total: total || items.length };
}

async function fetchCollection<T>(
  request: NextRequest,
  endpoint: string,
  limit = 500,
  maxPages = 3,
) {
  const items: T[] = [];
  let total = 0;

  for (let page = 1; page <= maxPages; page += 1) {
    const response = await fetchFromBackendServer(
      request,
      `${endpoint}?page=${page}&limit=${limit}`,
    );
    const pageItems: T[] = response?.data || response || [];
    if (page === 1 && typeof response?.total === "number") total = response.total;
    items.push(...pageItems);
    if (pageItems.length < limit) break;
    if (total && items.length >= total) break;
  }

  return { items, total: total || items.length };
}

async function fetchCampaigns(request: NextRequest, limit: number) {
  const response = await fetchFromBackendServer(
    request,
    `/campaign?page=1&limit=${limit}`,
  );
  const campaigns: Campaign[] = response?.data || response || [];
  return campaigns;
}

// GET /api/dashboard/agent-stats - Fetch agent-specific dashboard statistics
export async function GET(request: NextRequest) {
  try {
    const queryAgentId = request.nextUrl.searchParams.get("agentId");
    let agentId: number | null = null;
    if (queryAgentId) {
      const parsed = Number(queryAgentId);
      agentId = Number.isNaN(parsed) ? null : parsed;
    }

    if (agentId === null) {
      agentId = await getUserIdFromRequest(request);
    }

    if (!agentId) {
      return NextResponse.json(
        {
          success: false,
          message: "Unable to identify agent. Please ensure you are logged in.",
        },
        { status: 401 },
      );
    }

    let { tickets } = await fetchTicketsWithLimit(
      request,
      200,
      5,
      agentId,
      "/tickets",
      "assignedMeAgentId",
    );

    if (tickets.length === 0) {
      const fallback = await fetchTicketsWithLimit(
        request,
        200,
        3,
        agentId,
        "/tickets",
        "agentId",
      );
      tickets = fallback.tickets;
    }

    let { items: calls } = await fetchAgentCollection<Ticket>(
      request,
      "/calls",
      agentId,
      "agentId",
      500,
      3,
    );

    if (calls.length === 0) {
      const fallbackCalls = await fetchAgentCollection<Ticket>(
        request,
        "/calls",
        agentId,
        "assignedMeAgentId",
        500,
        3,
      );
      calls = fallbackCalls.items;
    }

    const { items: manualRecords } = await fetchAgentCollection<ManualRecord>(
      request,
      "/manual-records",
      agentId,
      "createdByAgentId",
      500,
      3,
    );

    console.log(
      `[agent-stats] Processing agent ${agentId}: ${calls.length} calls, ${tickets.length} tickets, ${manualRecords.length} manual records`,
    );

    if (tickets.length === 0 && calls.length === 0 && manualRecords.length === 0) {
      console.warn(
        `[agent-stats] No assigned records found for agent ${agentId}.`,
      );
    }

    let campaigns: Campaign[] = [];
    try {
      campaigns = await fetchCampaigns(request, 200);
      console.log(`[agent-stats] Found ${campaigns.length} campaigns`);
    } catch (error) {
      console.error(`[agent-stats] Error fetching campaigns:`, error);
      campaigns = [];
    }
    const totalTickets = tickets.length;
    const totalCalls = calls.length;

    console.log(
      `[agent-stats] Total tickets: ${totalTickets}, Total calls: ${totalCalls}`,
    );

    // Create campaignsById map first (needed for campaignCounts calculation)
    const campaignsById = campaigns.reduce<Record<number, string>>(
      (acc, campaign) => {
        acc[campaign.id] = campaign.nombre;
        return acc;
      },
      {},
    );

    const openTickets = tickets.filter((ticket) => ticket.status === "OPEN").length;
    const inProgressTickets = tickets.filter(
      (ticket) =>
        ticket.status === "IN_PROGRESS" ||
        ticket.status === "PENDING_FOLLOWUP" ||
        ticket.status === "OVERDUE",
    ).length;
    const activeTickets = openTickets + inProgressTickets;
    const closedTickets = tickets.filter((ticket) =>
      STATUS_CLOSED.has(ticket.status || ""),
    ).length;
    const pendingActions = tickets.filter(
      (ticket) =>
        PRIORITY_ALERT.has(ticket.priority || "") &&
        !STATUS_CLOSED.has(ticket.status || ""),
    ).length;

    const resolvedCalls = calls.filter(
      (call) =>
        STATUS_CLOSED.has(call.status || "") ||
        call.disposition?.toUpperCase() === "RESOLVED",
    ).length;
    const missedCalls = calls.filter(
      (call) => call.direction?.toUpperCase() === "MISSED",
    ).length;
    const totalDuration = calls.reduce(
      (sum, call) => sum + Number(call.duration || call.callDuration || 0),
      0,
    );
    const avgDurationSec = totalCalls ? Math.round(totalDuration / totalCalls) : 0;
    const pendingFollowupTickets = tickets.filter(
      (ticket) => ticket.status === "PENDING_FOLLOWUP",
    ).length;
    const overdueTickets = tickets.filter(
      (ticket) => ticket.status === "OVERDUE",
    ).length;
    const resolutionRate =
      totalTickets > 0 ? Math.round((closedTickets / totalTickets) * 100) : 0;
    const resolvedManualRecords = manualRecords.filter(
      (record) =>
        STATUS_CLOSED.has(record.status || "") ||
        record.disposition?.toUpperCase() === "RESOLVED",
    ).length;
    const completionRate = manualRecords.length
      ? Math.round((resolvedManualRecords / manualRecords.length) * 100)
      : 0;

    // Fix: Use campaignId to get actual campaign names
    const campaignCounts = tickets.reduce<Record<string, number>>(
      (acc, ticket) => {
        let campaignName = "Unspecified";

        if (ticket.campaignId && campaignsById[ticket.campaignId]) {
          campaignName = campaignsById[ticket.campaignId];
        } else if (ticket.campaign && typeof ticket.campaign === "object") {
          const maybeCampaign = ticket.campaign as {
            nombre?: string;
            id?: number;
          };
          if (maybeCampaign.nombre) {
            campaignName = maybeCampaign.nombre;
          } else if (maybeCampaign.id && campaignsById[maybeCampaign.id]) {
            campaignName = campaignsById[maybeCampaign.id];
          }
        } else if (typeof ticket.campaign === "string") {
          campaignName = normalizeLabel(ticket.campaign, CAMPAIGN_LABELS);
        }

        acc[campaignName] = (acc[campaignName] || 0) + 1;
        return acc;
      },
      {},
    );

    const dispositionCounts = tickets.reduce<Record<string, number>>(
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

    calls.forEach((call) => {
      if (!call.createdAt) return;
      const key = getTicketDateKey(call.createdAt);
      if (!key) return;
      const bucketIndex = bucketMap[key];
      if (bucketIndex === undefined) return;
      dayBuckets[bucketIndex].count += 1;
    });

    const callsByDay = dayBuckets.map((bucket) => ({
      day: bucket.label,
      calls: bucket.count,
    }));

    // Fix: Use campaignCounts (real ticket counts) instead of campaignsByName
    const ticketsByCampaign =
      Object.entries(campaignCounts).length > 0
        ? Object.entries(campaignCounts).map(([name, count]) => ({
            name,
            count,
          }))
        : FALLBACK_CHART_ITEM;

    console.log(`[agent-stats] Tickets by campaign:`, ticketsByCampaign);

    const ticketsByDisposition = Object.entries(dispositionCounts).map(
      ([name, count]) => ({
        name,
        count,
      }),
    );

    // campaignsById already created above, no need to recreate

    const recentTickets = tickets.slice(0, 5).map((ticket) => {
      const clientName =
        ticket.customer?.name ||
        (ticket.customer as any)?.nombre ||
        "Unassigned";
      return {
        id: ticket.id,
        clientName,
        campaign: getCampaignLabel(ticket, campaignsById),
        status: normalizeLabel(ticket.status || "Unspecified", STATUS_LABELS),
        createdAt: ticket.createdAt || new Date().toISOString(),
      };
    });

    const recentManualRecords = [...manualRecords]
      .sort(
        (a, b) =>
          new Date(b.createdAt || 0).getTime() -
          new Date(a.createdAt || 0).getTime(),
      )
      .slice(0, 5)
      .map((record) => ({
        id: record.id,
        status: record.status || "OPEN",
        disposition: record.disposition || null,
        createdAt: record.createdAt || null,
        createdByAgentId: record.createdByAgentId || agentId,
        customer: record.customer || null,
      }));

    console.log(`[agent-stats] Recent tickets:`, recentTickets);

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
        agentKpis: {
          totalCalls,
          resolvedCalls,
          missedCalls,
          avgDurationSec,
          totalTickets,
          resolvedTickets: closedTickets,
          pendingFollowupTickets,
          overdueTickets,
          resolutionRate,
          totalManualRecords: manualRecords.length,
          resolvedManualRecords,
          completionRate,
        },
        summary: {
          agentId,
          totalActivity: totalCalls + totalTickets + manualRecords.length,
          totalCalls,
          totalTickets,
          totalManualRecords: manualRecords.length,
          needsAttention: pendingFollowupTickets + overdueTickets + pendingActions,
          completionRate,
          resolutionRate,
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
        recentManualRecords,
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        message: error.message || "Failed to fetch agent dashboard stats",
      },
      { status: 500 },
    );
  }
}
