import { NextRequest } from "next/server";

const BACKEND_API_URL =
  process.env.BACKEND_API_URL ||
  process.env.NEXT_PUBLIC_API_URL ||
  "http://localhost:3001";

function getAuthToken(request: NextRequest): string | null {
  const authHeader = request.headers.get("authorization");
  if (authHeader?.startsWith("Bearer ")) return authHeader.substring(7);
  if (authHeader) return authHeader;

  const token = request.cookies.get("auth-token");
  return token?.value ?? null;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const token = getAuthToken(request);

  console.log(
    `[recording-proxy] id=${id}, hasToken=${!!token}, backendUrl=${BACKEND_API_URL}`,
  );

  if (!token) {
    return new Response("Unauthorized", { status: 401 });
  }

  const url = `${BACKEND_API_URL}/calls/${encodeURIComponent(id)}/recording`;
  console.log(`[recording-proxy] Fetching: ${url}`);

  const upstream = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
    redirect: "follow",
  });

  console.log(
    `[recording-proxy] Backend responded: ${upstream.status} ${upstream.statusText}, content-type=${upstream.headers.get("content-type")}, content-length=${upstream.headers.get("content-length")}`,
  );

  if (!upstream.ok) {
    const errorText = await upstream.text();
    console.log(
      `[recording-proxy] Backend error body: ${errorText.substring(0, 500)}`,
    );
    return new Response(errorText, { status: upstream.status });
  }

  return new Response(upstream.body, {
    status: 200,
    headers: {
      "Content-Type": upstream.headers.get("content-type") || "audio/mpeg",
      ...(upstream.headers.get("content-length")
        ? { "Content-Length": upstream.headers.get("content-length")! }
        : {}),
      "Cache-Control": "private, max-age=3600",
    },
  });
}
