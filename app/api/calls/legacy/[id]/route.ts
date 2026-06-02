import { NextRequest, NextResponse } from "next/server";
import { fetchFromBackendServer } from "@/lib/api-server";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const data = await fetchFromBackendServer(request, `/calls/legacy/${id}`);
    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        message: error.message || "Failed to fetch legacy call",
      },
      { status: 500 },
    );
  }
}
