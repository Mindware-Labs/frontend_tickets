import { NextRequest, NextResponse } from "next/server";
import { fetchFromBackendServer } from "@/lib/api-server";

// PATCH /api/notifications/read-all - Mark all notifications as read
export async function PATCH(request: NextRequest) {
  try {
    const data = await fetchFromBackendServer(
      request,
      "/notifications/read-all",
      { method: "PATCH" },
    );

    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message || "Failed to mark all read" },
      { status: 500 },
    );
  }
}
