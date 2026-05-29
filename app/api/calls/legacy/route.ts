import { NextRequest, NextResponse } from "next/server";
import { fetchFromBackendServer } from "@/lib/api-server";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const backendParams = new URLSearchParams();
    const passthroughKeys = [
      "page",
      "limit",
      "includeTotal",
      "includeViewCounts",
      "search",
      "status",
      "direction",
      "disposition",
      "campaignId",
      "campaignOption",
      "yardId",
      "agentId",
      "phoneLineId",
      "customerId",
      "view",
      "assignedMeAgentId",
      "startDate",
      "endDate",
      "groupBy",
    ];

    for (const key of passthroughKeys) {
      const value = searchParams.get(key);
      if (value !== null && value !== "") {
        backendParams.set(key, value);
      }
    }

    const queryString = backendParams.toString();
    const backendPath = queryString
      ? `/calls/legacy?${queryString}`
      : "/calls/legacy";

    const data = await fetchFromBackendServer(request, backendPath);

    return NextResponse.json({
      success: true,
      data,
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        message: error.message || "Failed to fetch legacy calls",
      },
      { status: 500 },
    );
  }
}
