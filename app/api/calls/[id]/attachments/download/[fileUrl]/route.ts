import { NextRequest, NextResponse } from "next/server";
import { fetchFromBackendServer } from "@/lib/api-server";

interface RouteParams {
  params: Promise<{ id: string; fileUrl: string }>;
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id, fileUrl } = await params;

    const data = await fetchFromBackendServer(
      request,
      `/calls/${id}/attachments/download/${fileUrl}`,
    );

    const signedUrl = (data as any)?.signedUrl;
    if (!signedUrl) {
      return NextResponse.json(
        { success: false, message: "Failed to generate download URL" },
        { status: 502 },
      );
    }

    return NextResponse.redirect(signedUrl);
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message || "Failed to download attachment" },
      { status: 500 },
    );
  }
}
