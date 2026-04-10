import { NextRequest, NextResponse } from "next/server";
import { fetchFromBackendServer } from "@/lib/api-server";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  try {
    const yard = await fetchFromBackendServer(request, `/yards/${id}`);
    return NextResponse.json(yard);
  } catch (error) {
    console.error("Error fetching yard:", error);
    return NextResponse.json(
      { error: "Failed to fetch yard" },
      { status: 500 },
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  try {
    const body = await request.json();
    const yard = await fetchFromBackendServer(request, `/yards/${id}`, {
      method: "PATCH",
      body: JSON.stringify(body),
    });
    return NextResponse.json(yard);
  } catch (error) {
    console.error("Error updating yard:", error);
    return NextResponse.json(
      { error: "Failed to update yard" },
      { status: 500 },
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  try {
    await fetchFromBackendServer(request, `/yards/${id}`, {
      method: "DELETE",
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting yard:", error);
    return NextResponse.json(
      { error: "Failed to delete yard" },
      { status: 500 },
    );
  }
}
