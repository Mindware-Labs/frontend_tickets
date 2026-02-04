import { NextRequest, NextResponse } from "next/server";
import { fetchFromBackendServer } from "@/lib/api-server";

// GET /api/users - Fetch all customers (referred as users in frontend)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = searchParams.get("page") || "1";
    const limit = searchParams.get("limit") || "500";

    const data = await fetchFromBackendServer(
      request,
      `/customers?page=${page}&limit=${limit}`,
    );

    return NextResponse.json(
      {
        success: true,
        data: data.data || data,
        count: data.total || (Array.isArray(data) ? data.length : 0),
      },
      {
        headers: {
          "Cache-Control": "public, s-maxage=180, stale-while-revalidate=360",
        },
      },
    );
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

// POST /api/users - Create a new customer
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
