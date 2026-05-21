import { NextRequest, NextResponse } from "next/server";
import { fetchFromBackendServer } from "@/lib/api-server";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  try {
    const { searchParams } = new URL(request.url);
    const backendParams = new URLSearchParams();
    const passthroughKeys = [
      "cursor",
      "limit",
      "type",
      "from",
      "to",
      "lineId",
      "agentId",
      "sort",
    ];

    for (const key of passthroughKeys) {
      const value = searchParams.get(key);
      if (value !== null && value !== "") {
        backendParams.set(key, value);
      }
    }

    const query = backendParams.toString();
    const data = await fetchFromBackendServer(
      request,
      query ? `/customers/${id}/timeline?${query}` : `/customers/${id}/timeline`,
    );

    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message || "Failed to fetch timeline" },
      { status: error.status || 500 },
    );
  }
}
