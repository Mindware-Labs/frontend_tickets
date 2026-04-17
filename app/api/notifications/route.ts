import { NextRequest, NextResponse } from "next/server";
import { fetchFromBackendServer } from "@/lib/api-server";

// GET /api/notifications - List notifications for authenticated user
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const unread = searchParams.get("unread") || "";
    const qs = unread ? `?unread=${unread}` : "";

    const data = await fetchFromBackendServer(request, `/notifications${qs}`);

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
