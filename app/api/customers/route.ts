import { NextRequest, NextResponse } from "next/server";
import { fetchFromBackendServer } from "@/lib/api-server";

// GET /api/customers - Fetch all customers
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const backendParams = new URLSearchParams();
    const passthroughKeys = [
      "page",
      "limit",
      "search",
      "campaignId",
      "yardId",
      "hasOpenTickets",
      "hasPinnedNote",
    ];

    for (const key of passthroughKeys) {
      const value = searchParams.get(key);
      if (value !== null && value !== "") {
        backendParams.set(key, value);
      }
    }

    if (!backendParams.has("page")) backendParams.set("page", "1");
    if (!backendParams.has("limit")) backendParams.set("limit", "10");

    const data = await fetchFromBackendServer(
      request,
      `/customers?${backendParams.toString()}`,
    );

    return NextResponse.json({
      success: true,
      data: data.data || data,
      count: data.total || (Array.isArray(data) ? data.length : 0),
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        message: error.message || "Failed to fetch customers",
      },
      { status: 500 },
    );
  }
}

// POST /api/customers - Create a new customer
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const data = await fetchFromBackendServer(request, "/customers", {
      method: "POST",
      body: JSON.stringify(body),
    });

    return NextResponse.json({
      success: true,
      data,
      message: "Customer created successfully",
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        message: error.message || "Failed to create customer",
      },
      { status: 500 },
    );
  }
}
