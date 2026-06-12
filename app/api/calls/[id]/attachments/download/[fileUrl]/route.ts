import { NextRequest, NextResponse } from "next/server";
import { fetchFromBackendServer } from "@/lib/api-server";

interface RouteParams {
  params: Promise<{ id: string; fileUrl: string }>;
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id, fileUrl } = await params;

    // Next decodes the dynamic segment, so `fileUrl` arrives as a raw
    // s3://bucket/key URI; re-encode it or its slashes break the backend route.
    const encodedFileUrl = fileUrl.includes("://")
      ? encodeURIComponent(fileUrl)
      : fileUrl;

    const data = await fetchFromBackendServer(
      request,
      `/calls/${id}/attachments/download/${encodedFileUrl}`,
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
