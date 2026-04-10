import { NextRequest, NextResponse } from "next/server";
import { fetchFromBackendServer } from "@/lib/api-server";

// GET /api/customers/:id/notes
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  try {
    const data = await fetchFromBackendServer(
      request,
      `/customers/${id}/notes`,
    );
    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message || "Failed to fetch notes" },
      { status: 500 },
    );
  }
}

// POST /api/customers/:id/notes
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  try {
    const body = await request.json();
    const data = await fetchFromBackendServer(
      request,
      `/customers/${id}/notes`,
      { method: "POST", body: JSON.stringify(body) },
    );
    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message || "Failed to add note" },
      { status: 500 },
    );
  }
}
