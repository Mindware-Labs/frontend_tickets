import { NextRequest, NextResponse } from "next/server";
import { fetchFromBackendServer } from "@/lib/api-server";

// DELETE /api/customers/:id/notes/:noteId
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string; noteId: string } },
) {
  try {
    const data = await fetchFromBackendServer(
      request,
      `/customers/${params.id}/notes/${params.noteId}`,
      { method: "DELETE" },
    );
    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message || "Failed to delete note" },
      { status: 500 },
    );
  }
}

// PATCH /api/customers/:id/notes/:noteId
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string; noteId: string } },
) {
  try {
    const body = await request.json();
    const data = await fetchFromBackendServer(
      request,
      `/customers/${params.id}/notes/${params.noteId}`,
      { method: "PATCH", body: JSON.stringify(body) },
    );
    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message || "Failed to update note" },
      { status: 500 },
    );
  }
}
