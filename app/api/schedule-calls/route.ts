import { NextRequest, NextResponse } from "next/server";
import { fetchFromBackendServer } from "@/lib/api-server";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const backendParams = new URLSearchParams();
    const passthroughKeys = [
      "status", "customerId", "page", "limit",
    ];
    for (const key of passthroughKeys) {
      const value = searchParams.get(key);
      if (value !== null && value !== "") {
        backendParams.set(key, value);
      }
    }
    const queryString = backendParams.toString();
    const backendPath = queryString ? `/schedule-calls?${queryString}` : "/schedule-calls";

    const data = await fetchFromBackendServer(request, backendPath);
    return NextResponse.json({ success: true, ...data });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message || "Failed to fetch scheduled calls" },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const data = await fetchFromBackendServer(request, "/schedule-calls", {
      method: "POST",
      body: JSON.stringify(body),
    });
    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message || "Failed to create scheduled call" },
      { status: 500 },
    );
  }
}
