import { NextResponse } from "next/server";

const BACKEND_API_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

function getBackendUrl(path: string) {
  const cleaned = path.startsWith("/") ? path : `/${path}`;
  return `${BACKEND_API_URL}${cleaned}`;
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const formData = await request.formData();
    const upstream = new FormData();
    for (const [key, value] of formData.entries()) {
      upstream.append(key, value);
    }

    const response = await fetch(getBackendUrl(`/tickets/${id}/attachments`), {
      method: "POST",
      body: upstream,
    });
    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        {
          success: false,
          message: data?.message || "Failed to upload attachments",
        },
        { status: response.status }
      );
    }

    return NextResponse.json({
      success: true,
      data,
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        message: error.message || "Failed to upload attachments",
      },
      { status: 500 }
    );
  }
}