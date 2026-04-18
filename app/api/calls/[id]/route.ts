import { NextRequest, NextResponse } from "next/server";
import { fetchFromBackendServer } from "@/lib/api-server";

interface RouteParams {
  params: Promise<{
    id: string;
  }>;
}

// GET /api/tickets/[id] - Fetch single ticket
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const data = await fetchFromBackendServer(request, `/calls/${id}`);

    return NextResponse.json({
      success: true,
      data,
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        message: error.message || "Failed to fetch ticket",
      },
      { status: 500 },
    );
  }
}

// PATCH /api/tickets/[id] - Update ticket
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const body = await request.json();

    const data = await fetchFromBackendServer(request, `/calls/${id}`, {
      method: "PATCH",
      body: JSON.stringify(body),
    });

    return NextResponse.json({
      success: true,
      data,
    });
  } catch (error: any) {
    const status = error.message.includes("API Error:")
      ? parseInt(error.message.split(":")[1].trim()) || 500
      : 500;

    return NextResponse.json(
      {
        success: false,
        message: error.message || "Failed to update ticket",
      },
      { status },
    );
  }
}

// DELETE /api/tickets/[id] - Delete ticket
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;

    await fetchFromBackendServer(request, `/calls/${id}`, {
      method: "DELETE",
    });

    return NextResponse.json({
      success: true,
      message: "Ticket deleted successfully",
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        message: error.message || "Failed to delete ticket",
      },
      { status: 500 },
    );
  }
}