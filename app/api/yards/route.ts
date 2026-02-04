import { NextRequest, NextResponse } from "next/server";
import { fetchFromBackendServer } from "@/lib/api-server";

export async function GET(request: NextRequest) {
  try {
    const response = await fetchFromBackendServer(request, "/yards");

    // El backend ahora devuelve { data, total, page, limit, totalPages }
    // Extraer solo el array data para mantener compatibilidad con el frontend
    const yards = response.data || response;

    return NextResponse.json(yards);
  } catch (error: any) {
    // Log error details for debugging
    const errorStatus = error?.status || 500;
    const errorMessage = error?.message || "Failed to fetch yards";

    // If it's a 404 or the backend endpoint doesn't exist, return empty array
    // This makes yards an optional feature
    if (
      errorStatus === 404 ||
      errorMessage.includes("Cannot connect") ||
      errorMessage.includes("not found")
    ) {
      console.warn(
        `[api/yards] Backend endpoint /yards not found or unavailable. Returning empty array.`,
      );
      return NextResponse.json([]);
    }

    // For other errors, log them but still return empty array to prevent UI breakage
    console.error("[api/yards] Error fetching yards:", {
      status: errorStatus,
      message: errorMessage,
      details: error?.body,
    });

    // Return empty array instead of error to prevent UI breakage
    // The frontend can handle empty arrays gracefully
    return NextResponse.json([]);
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const yard = await fetchFromBackendServer(request, "/yards", {
      method: "POST",
      body: JSON.stringify(body),
    });
    return NextResponse.json(yard);
  } catch (error) {
    console.error("Error creating yard:", error);
    return NextResponse.json(
      { error: "Failed to create yard" },
      { status: 500 },
    );
  }
}
