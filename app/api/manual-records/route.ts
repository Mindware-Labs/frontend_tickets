import { NextRequest, NextResponse } from "next/server";
import { fetchFromBackendServer } from "@/lib/api-server";

// GET /api/manual-records
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const backendParams = new URLSearchParams();

    const passthroughKeys = [
      "page",
      "limit",
      "customerId",
      "campaignId",
      "yardId",
    ];

    for (const key of passthroughKeys) {
      const value = searchParams.get(key);
      if (value !== null && value !== "") {
        backendParams.set(key, value);
      }
    }

    const queryString = backendParams.toString();
    const backendPath = queryString
      ? `/manual-records?${queryString}`
      : "/manual-records";

    console.log(`[NextAPI] GET /api/manual-records -> ${backendPath}`);

    const data = await fetchFromBackendServer(request, backendPath);

    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    console.error(`[NextAPI] ERROR in GET /api/manual-records:`, error);
    return NextResponse.json(
      { success: false, message: error.message || "Failed to fetch records" },
      { status: 500 },
    );
  }
}

// POST /api/manual-records
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    console.log(`[NextAPI] POST /api/manual-records`);

    const data = await fetchFromBackendServer(request, "/manual-records", {
      method: "POST",
      body: JSON.stringify(body),
    });

    return NextResponse.json({
      success: true,
      data,
      message: "Record created successfully",
    });
  } catch (error: any) {
    console.error(`[NextAPI] ERROR in POST /api/manual-records:`, error);
    return NextResponse.json(
      { success: false, message: error.message || "Failed to create record" },
      { status: 500 },
    );
  }
}
