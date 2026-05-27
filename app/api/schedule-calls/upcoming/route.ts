import { NextRequest, NextResponse } from "next/server";
import { fetchFromBackendServer } from "@/lib/api-server";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const agentId = searchParams.get("agentId");
    const limit = searchParams.get("limit");

    let backendPath = "/schedule-calls/upcoming";
    const params = new URLSearchParams();
    if (agentId) params.set("agentId", agentId);
    if (limit) params.set("limit", limit);
    const qs = params.toString();
    if (qs) backendPath += `?${qs}`;

    const data = await fetchFromBackendServer(request, backendPath);
    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message || "Failed to fetch upcoming calls" },
      { status: 500 },
    );
  }
}
