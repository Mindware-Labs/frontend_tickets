import { NextRequest, NextResponse } from "next/server";
import { fetchFromBackendServer } from "@/lib/api-server";

// GET /api/agents - Fetch all agents
export async function GET(request: NextRequest) {
  try {
    const data = await fetchFromBackendServer(request, "/agents");
    return NextResponse.json(
      {
        success: true,
        data: data.data || data,
        count: data.total || (Array.isArray(data) ? data.length : 0),
      },
      {
        headers: {
          "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600",
        },
      },
    );
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        message: error.message || "Failed to fetch agents",
      },
      { status: 500 },
    );
  }
}

// Configuración de runtime para optimizar
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
