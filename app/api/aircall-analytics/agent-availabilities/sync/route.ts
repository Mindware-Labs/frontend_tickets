import { NextRequest, NextResponse } from "next/server";
import { fetchFromBackendServer } from "@/lib/api-server";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const data = await fetchFromBackendServer(
      request,
      "/aircall-analytics/agent-availabilities/sync",
      { method: "POST" },
    );
    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        message:
          error.message || "Failed to sync Aircall agent availabilities",
      },
      { status: error.status || 500 },
    );
  }
}
