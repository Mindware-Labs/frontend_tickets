import { NextRequest, NextResponse } from "next/server";
import { fetchFromBackendServer } from "@/lib/api-server";

// PATCH /api/manual-records/[id]
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const body = await request.json();
    const { id } = await params;
    console.log(`[NextAPI] PATCH /api/manual-records/${id}`);

    const data = await fetchFromBackendServer(
      request,
      `/manual-records/${id}`,
      { method: "PATCH", body: JSON.stringify(body) },
    );

    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    console.error(`[NextAPI] ERROR in PATCH /api/manual-records/[id]:`, error);
    return NextResponse.json(
      { success: false, message: error.message || "Failed to update record" },
      { status: 500 },
    );
  }
}

// DELETE /api/manual-records/[id]
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    console.log(`[NextAPI] DELETE /api/manual-records/${id}`);

    await fetchFromBackendServer(request, `/manual-records/${id}`, {
      method: "DELETE",
    });

    return NextResponse.json({ success: true, message: "Record deleted" });
  } catch (error: any) {
    console.error(
      `[NextAPI] ERROR in DELETE /api/manual-records/[id]:`,
      error,
    );
    return NextResponse.json(
      { success: false, message: error.message || "Failed to delete record" },
      { status: 500 },
    );
  }
}

// GET /api/manual-records/[id]
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const data = await fetchFromBackendServer(
      request,
      `/manual-records/${id}`,
    );
    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message || "Record not found" },
      { status: 404 },
    );
  }
}
