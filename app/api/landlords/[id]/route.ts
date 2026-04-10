import { NextRequest, NextResponse } from "next/server";
import { fetchFromBackendServer } from "@/lib/api-server";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  try {
    const landlord = await fetchFromBackendServer(request, `/landlords/${id}`);
    return NextResponse.json(landlord);
  } catch (error) {
    console.error("Error fetching landlord:", error);
    return NextResponse.json(
      { error: "Failed to fetch landlord" },
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
    const landlord = await fetchFromBackendServer(request, `/landlords/${id}`, {
      method: "PATCH",
      body: JSON.stringify(body),
    });
    return NextResponse.json(landlord);
  } catch (error) {
    console.error("Error updating landlord:", error);
    return NextResponse.json(
      { error: "Failed to update landlord" },
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
    await fetchFromBackendServer(request, `/landlords/${id}`, {
      method: "DELETE",
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting landlord:", error);
    return NextResponse.json(
      { error: "Failed to delete landlord" },
      { status: 500 },
    );
  }
}
