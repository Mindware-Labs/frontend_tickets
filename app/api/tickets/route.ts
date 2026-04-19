import { NextRequest, NextResponse } from "next/server";
import { fetchFromBackendServer } from "@/lib/api-server";

// GET /api/tickets - Fetch tickets (paginated)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const mode = searchParams.get("mode");

    if (mode === "page") {
      const backendParams = new URLSearchParams();
      const passthroughKeys = [
        "page",
        "limit",
        "includeTotal",
        "includeViewCounts",
        "search",
        "status",
        "priority",
        "ticketType",
        "campaignId",
        "campaignOption",
        "yardId",
        "agentId",
        "customerId",
        "phoneLineId",
        "callId",
        "view",
        "assignedMeAgentId",
        "startDate",
        "endDate",
        "groupBy",
      ];

      for (const key of passthroughKeys) {
        const value = searchParams.get(key);
        if (value !== null && value !== "") {
          backendParams.set(key, value);
        }
      }

      const queryString = backendParams.toString();
      const backendPath = queryString ? `/tickets?${queryString}` : "/tickets";

      console.log(`[NextAPI] GET /api/tickets (page mode) -> ${backendPath}`);

      const data = await fetchFromBackendServer(request, backendPath);

      return NextResponse.json({
        success: true,
        data,
      });
    }

    // Default: fetch all (paginated internally)
    const pageSize = Math.min(
      Math.max(Number(searchParams.get("pageSize")) || 1000, 100),
      5000,
    );
    const maxPages = Math.min(
      Math.max(Number(searchParams.get("maxPages")) || 50, 1),
      200,
    );
    const maxConcurrentRequests = 5;

    console.log(`[NextAPI] GET /api/tickets (all)`);

    const firstPageData = await fetchFromBackendServer(
      request,
      `/tickets?page=1&limit=${pageSize}`,
    );

    const firstPageTickets = firstPageData?.data || firstPageData || [];
    const total = firstPageData?.total || firstPageTickets.length;
    const totalPages = Math.min(Math.ceil(total / pageSize), maxPages);

    if (totalPages <= 1) {
      return NextResponse.json({
        success: true,
        data: firstPageTickets,
        count: total,
      });
    }

    const allTickets: any[] = [...firstPageTickets];

    for (
      let startPage = 2;
      startPage <= totalPages;
      startPage += maxConcurrentRequests
    ) {
      const endPage = Math.min(
        startPage + maxConcurrentRequests - 1,
        totalPages,
      );
      const pagePromises = [];

      for (let page = startPage; page <= endPage; page++) {
        pagePromises.push(
          fetchFromBackendServer(
            request,
            `/tickets?page=${page}&limit=${pageSize}&includeTotal=false`,
          ),
        );
      }

      const pageResults = await Promise.all(pagePromises);
      for (const pageData of pageResults) {
        const pageTickets = pageData?.data || pageData || [];
        allTickets.push(...pageTickets);
      }
    }

    const count = total || allTickets.length;

    return NextResponse.json({
      success: true,
      data: allTickets,
      count,
    });
  } catch (error: any) {
    console.error(`[NextAPI] ERROR in GET /api/tickets:`, error);
    return NextResponse.json(
      {
        success: false,
        message: error.message || "Failed to fetch tickets",
      },
      { status: 500 },
    );
  }
}

// POST /api/tickets - Create a new ticket
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    console.log(
      `[NextAPI] POST /api/tickets - Creating ticket, body:`,
      JSON.stringify(body),
    );

    const data = await fetchFromBackendServer(request, "/tickets", {
      method: "POST",
      body: JSON.stringify(body),
    });

    return NextResponse.json({
      success: true,
      data,
      message: "Ticket created successfully",
      warning: data?.warning || null,
    });
  } catch (error: any) {
    console.error(`[NextAPI] ERROR in POST /api/tickets:`, error);
    return NextResponse.json(
      {
        success: false,
        message: error.message || "Failed to create ticket",
      },
      { status: 500 },
    );
  }
}
