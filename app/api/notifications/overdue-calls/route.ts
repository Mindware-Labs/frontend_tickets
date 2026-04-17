import { NextRequest, NextResponse } from "next/server";
import { fetchFromBackendServer } from "@/lib/api-server";

// GET /api/notifications/overdue-calls - Get IDs of overdue callback calls
export async function GET(request: NextRequest) {
  try {
    const data = await fetchFromBackendServer(
      request,
      "/notifications/overdue-calls",
    );
    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        message: error.message || "Failed to fetch overdue calls",
      },
      { status: 500 },
    );
  }
}
