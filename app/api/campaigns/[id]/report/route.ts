import { NextRequest, NextResponse } from "next/server";
import { fetchFromBackendServer } from "@/lib/api-server";

// GET /api/campaigns/[id]/report?startDate=...&endDate=...
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const { searchParams } = new URL(request.url);
  const startDate = searchParams.get("startDate");
  const endDate = searchParams.get("endDate");
  if (!startDate || !endDate) {
    return NextResponse.json(
      { success: false, message: "startDate and endDate are required" },
      { status: 400 },
    );
  }
  try {
    const data = await fetchFromBackendServer(
      request,
      `/campaign/${id}/report?startDate=${startDate}&endDate=${endDate}`,
    );
    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message || "Failed to fetch report" },
      { status: 500 },
    );
  }
}
