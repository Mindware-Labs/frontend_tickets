import { NextRequest, NextResponse } from "next/server";
import { fetchFromBackendServer } from "@/lib/api-server";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const formData = await request.formData();
    const upstream = new FormData();
    for (const [key, value] of formData.entries()) {
      upstream.append(key, value);
    }

    const data = await fetchFromBackendServer(
      request,
      `/manual-records/${id}/attachments`,
      {
        method: "POST",
        body: upstream,
      },
    );

    return NextResponse.json({
      success: true,
      data,
    });
  } catch (error: any) {
    const status = error.message?.includes("API Error:")
      ? parseInt(error.message.split(":")[1]?.trim()) || 500
      : 500;

    return NextResponse.json(
      {
        success: false,
        message: error.message || "Failed to upload attachment",
      },
      { status },
    );
  }
}
