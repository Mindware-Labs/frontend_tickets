import { NextRequest } from "next/server";

const BACKEND_API_URL =
  process.env.BACKEND_API_URL ||
  process.env.NEXT_PUBLIC_API_URL ||
  "http://localhost:3001";

/**
 * Get JWT token from request cookies or headers
 */
function getAuthTokenFromRequest(
  request: Request | NextRequest,
): string | null {
  // Try to get token from Authorization header first
  const authHeader = request.headers.get("authorization");

  if (authHeader) {
    // Remove "Bearer " prefix if present
    if (authHeader.startsWith("Bearer ")) {
      return authHeader.substring(7);
    }
    // If it's just the token without "Bearer " prefix
    return authHeader;
  }

  // Try to get token from cookies using NextRequest API (preferred)
  if (
    "cookies" in request &&
    typeof (request as any).cookies?.get === "function"
  ) {
    const tokenCookie = (request as NextRequest).cookies.get("auth-token");
    if (tokenCookie?.value) {
      return tokenCookie.value;
    }
  }

  // Fallback: Try to get token from cookie header (for Request objects)
  const cookieHeader = request.headers.get("cookie");
  if (cookieHeader) {
    const cookies = cookieHeader.split(";").reduce(
      (acc, cookie) => {
        const [key, value] = cookie.trim().split("=");
        if (key && value) {
          acc[key.trim()] = decodeURIComponent(value.trim());
        }
        return acc;
      },
      {} as Record<string, string>,
    );

    if (cookies["auth-token"]) {
      return cookies["auth-token"];
    }
  }

  return null;
}

/**
 * Fetch data from backend API with automatic JWT authentication (server-side)
 */
export async function fetchFromBackendServer(
  request: Request | NextRequest,
  endpoint: string,
  options: RequestInit = {},
) {
  const url = `${BACKEND_API_URL}${
    endpoint.startsWith("/") ? endpoint : `/${endpoint}`
  }`;

  // Get auth token from request
  const token = getAuthTokenFromRequest(request);

  // Debug logging in development
  if (process.env.NODE_ENV === "development") {
    const authHeader = request.headers.get("authorization");
    const cookieHeader = request.headers.get("cookie");
    console.log(`[api-server] Fetching ${endpoint}`);
    console.log(`[api-server] Auth header present: ${!!authHeader}`);
    console.log(`[api-server] Cookie header present: ${!!cookieHeader}`);
    console.log(`[api-server] Extracted token present: ${!!token}`);
    if (!token) {
      // Log all headers for debugging
      const allHeaders: string[] = [];
      request.headers.forEach((value, key) => {
        allHeaders.push(`${key}: ${value.substring(0, 50)}`);
      });
      console.log("[api-server] All request headers:", allHeaders);
      if (cookieHeader) {
        console.log(
          "[api-server] Cookie header value:",
          cookieHeader.substring(0, 100),
        );
      }
    }
  }

  // Prepare headers
  const headers: any = {
    ...options.headers,
  };

  // Only set JSON content type when we're not sending FormData
  if (!(options.body instanceof FormData)) {
    headers["Content-Type"] = headers["Content-Type"] || "application/json";
  }

  // Add Authorization header if token exists
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
    if (process.env.NODE_ENV === "development") {
      console.log(
        `[api-server] Sending token to backend (length: ${token.length})`,
      );
    }
  } else {
    if (process.env.NODE_ENV === "development") {
      console.warn(
        `[api-server] ⚠️ No token found for ${endpoint} - request will fail`,
      );
    }
  }

  try {
    // Log the actual request being made
    if (process.env.NODE_ENV === "development") {
      console.log(`[api-server] Making request to: ${url}`);
      console.log(`[api-server] Method: ${options.method || "GET"}`);
      console.log(`[api-server] Headers keys:`, Object.keys(headers));
      if (headers["Authorization"]) {
        const authHeader = headers["Authorization"] as string;
        console.log(
          `[api-server] Authorization header format: ${authHeader.substring(0, 30)}...`,
        );
        console.log(
          `[api-server] Authorization starts with 'Bearer': ${authHeader.startsWith("Bearer ")}`,
        );
      }
    }

    const response = await fetch(url, {
      ...options,
      headers,
    });

    if (process.env.NODE_ENV === "development") {
      console.log(
        `[api-server] Response status: ${response.status} ${response.statusText}`,
      );
    }
    const rawText = await response.text();
    const contentType = response.headers.get("content-type") || "";
    let parsedBody: any = rawText || null;
    if (rawText && contentType.includes("application/json")) {
      try {
        parsedBody = JSON.parse(rawText);
      } catch {
        parsedBody = rawText;
      }
    }

    if (!response.ok) {
      const errorData = parsedBody ?? {};
      if (process.env.NODE_ENV === "development") {
        console.error(
          `[api-server] Backend Error: ${response.status}`,
          errorData,
        );
        console.error(`[api-server] URL: ${url}`);
        console.error(`[api-server] Headers sent:`, Object.keys(headers));
      }
      const message =
        typeof errorData === "string"
          ? errorData
          : errorData.message || `API Error: ${response.status}`;
      const err = new Error(message) as Error & { status?: number; body?: any };
      err.status = response.status;
      err.body = errorData;
      throw err;
    }

    return parsedBody;
  } catch (error: any) {
    // If it's a network error (backend not running)
    if (
      error.message?.includes("fetch failed") ||
      error.code === "ECONNREFUSED"
    ) {
      if (process.env.NODE_ENV === "development") {
        console.error(`[api-server] Cannot connect to backend at ${url}`);
        console.error(
          `[api-server] Make sure the backend is running on ${BACKEND_API_URL}`,
        );
      }
      throw new Error(
        `Cannot connect to backend. Make sure it's running on ${BACKEND_API_URL}`,
      );
    }
    throw error;
  }
}
