import { NextRequest, NextResponse } from "next/server";
import { fetchFromBackendServer } from "@/lib/api-server";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const query = request.nextUrl.searchParams.toString();
    const endpoint = query
      ? `/aircall-analytics/sms/summary?${query}`
      : "/aircall-analytics/sms/summary";
    const data = await fetchFromBackendServer(request, endpoint);
    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        message: error.message || "Failed to fetch SMS summary",
      },
      { status: error.status || 500 },
    );
  }
}
