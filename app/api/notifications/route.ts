import { NextRequest, NextResponse } from "next/server";
import { fetchFromBackendServer } from "@/lib/api-server";

// GET /api/notifications - List notifications for authenticated user
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const backendParams = new URLSearchParams();
    const passthroughKeys = [
      "unread",
      "type",
      "agentId",
      "read",
      "from",
      "to",
      "search",
      "page",
      "limit",
      "includeTotal",
      "audit",
      "stats",
    ];

    for (const key of passthroughKeys) {
      const value = searchParams.get(key);
      if (value !== null && value !== "") {
        backendParams.set(key, value);
      }
    }

    const qs = backendParams.toString();
    const data = await fetchFromBackendServer(
      request,
      `/notifications${qs ? `?${qs}` : ""}`,
    );

    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        message: error.message || "Failed to fetch notifications",
      },
      { status: 500 },
    );
  }
}
