import { NextRequest, NextResponse } from "next/server";
import { fetchFromBackendServer } from "@/lib/api-server";

export async function GET(request: NextRequest) {
  try {
    const fileUrl = request.nextUrl.searchParams.get("fileUrl");
    if (!fileUrl) {
      return NextResponse.json(
        { success: false, message: "fileUrl is required" },
        { status: 400 },
      );
    }

    const data = await fetchFromBackendServer(
      request,
      `/tickets/attachments/download?fileUrl=${encodeURIComponent(fileUrl)}`,
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
