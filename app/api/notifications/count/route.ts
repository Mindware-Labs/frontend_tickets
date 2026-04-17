import { NextRequest, NextResponse } from "next/server";
import { fetchFromBackendServer } from "@/lib/api-server";

// GET /api/notifications/count - Count unread notifications
export async function GET(request: NextRequest) {
  try {
    const data = await fetchFromBackendServer(request, "/notifications/count");
    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        message: error.message || "Failed to count notifications",
      },
      { status: 500 },
    );
  }
}
