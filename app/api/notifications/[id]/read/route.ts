import { NextRequest, NextResponse } from "next/server";
import { fetchFromBackendServer } from "@/lib/api-server";

interface RouteParams {
  params: Promise<{ id: string }>;
}

// PATCH /api/notifications/[id]/read - Mark a notification as read
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const data = await fetchFromBackendServer(
      request,
      `/notifications/${id}/read`,
      { method: "PATCH" },
    );

    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        message: error.message || "Failed to mark notification read",
      },
      { status: 500 },
    );
  }
}
