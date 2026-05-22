import { NextRequest, NextResponse } from "next/server";
import { fetchFromBackendServer } from "@/lib/api-server";

interface RouteParams {
  params: Promise<{
    id: string;
  }>;
}

// GET /api/tickets/[id]/updates
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const data = await fetchFromBackendServer(
      request,
      `/tickets/${id}/updates`,
    );

    return NextResponse.json({
      success: true,
      data,
    });
  } catch (error: any) {
    const status = error.message?.includes("API Error:")
      ? parseInt(error.message.split(":")[1]?.trim()) || 500
      : 500;

    return NextResponse.json(
      {
        success: false,
        message: error.message || "Failed to fetch ticket updates",
      },
      { status },
    );
  }
}

// POST /api/tickets/[id]/updates
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const body = await request.json();

    const data = await fetchFromBackendServer(
      request,
      `/tickets/${id}/updates`,
      {
        method: "POST",
        body: JSON.stringify(body),
      },
    );

    return NextResponse.json({
      success: true,
      data,
    });
  } catch (error: any) {
    const status = error.message?.includes("API Error:")
      ? parseInt(error.message.split(":")[1]?.trim()) || 500
      : 500;

    return NextResponse.json(
      {
        success: false,
        message: error.message || "Failed to log ticket update",
      },
      { status },
    );
  }
}
