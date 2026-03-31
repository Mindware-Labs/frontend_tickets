import { NextRequest, NextResponse } from "next/server";
import { fetchFromBackendServer } from "@/lib/api-server";

// GET /api/tickets - Fetch all tickets
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
        "direction",
        "disposition",
        "campaignId",
        "yardId",
        "agentId",
        "phoneLineId",
        "customerId",
        "view",
        "assignedMeAgentId",
        "startDate",
        "endDate",
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

    const pageSize = Math.min(
      Math.max(Number(searchParams.get("pageSize")) || 1000, 100),
      5000,
    );
    const maxPages = Math.min(
      Math.max(Number(searchParams.get("maxPages")) || 50, 1),
      200,
    );
    const maxConcurrentRequests = 5; // Limitar peticiones concurrentes para no sobrecargar

    console.log(`[NextAPI] GET /api/tickets (todos)`);

    // Primera petición para obtener el total
    const firstPageData = await fetchFromBackendServer(
      request,
      `/tickets?page=1&limit=${pageSize}`,
    );

    const firstPageTickets = firstPageData?.data || firstPageData || [];
    const total = firstPageData?.total || firstPageTickets.length;

    // Calcular cuántas páginas necesitamos
    const totalPages = Math.min(Math.ceil(total / pageSize), maxPages);

    console.log(
      `[NextAPI] Total tickets: ${total}, Total pages: ${totalPages}`,
    );

    // Si solo hay una página, retornar inmediatamente
    if (totalPages <= 1) {
      return NextResponse.json({
        success: true,
        data: firstPageTickets,
        count: total,
      });
    }

    // Hacer las peticiones restantes en lotes paralelos
    const allTickets: any[] = [...firstPageTickets];
    const remainingPages = totalPages - 1;

    // Procesar páginas en lotes para no sobrecargar
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

      // Esperar a que se completen todas las peticiones del lote
      const pageResults = await Promise.all(pagePromises);

      // Agregar los tickets de todas las páginas del lote
      for (const pageData of pageResults) {
        const pageTickets = pageData?.data || pageData || [];
        allTickets.push(...pageTickets);
      }

      console.log(
        `[NextAPI] Fetched pages ${startPage}-${endPage}/${totalPages}`,
      );
    }

    const count = total || allTickets.length;
    console.log(`[NextAPI] Backend success. Tickets found: ${count}`);

    return NextResponse.json({
      success: true,
      data: allTickets,
      count,
    });
  } catch (error: any) {
    // ✅ Log del error real en la consola de Vercel
    console.error(`[NextAPI] ERROR in GET /api/tickets:`, error);

    // Si el error tiene respuesta del backend, intentamos mostrarla
    if (error.status) {
      console.error(`[NextAPI] Status Code: ${error.status}`);
    }

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

    console.log(`[NextAPI] POST /api/tickets - Creating ticket...`);

    const data = await fetchFromBackendServer(request, "/tickets", {
      method: "POST",
      body: JSON.stringify(body),
    });

    console.log(`[NextAPI] Ticket created successfully`);

    return NextResponse.json({
      success: true,
      data,
      message: "Ticket created successfully",
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
