// middleware.ts
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Excluir rutas estáticas y API para reducir invocaciones de funciones
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api/") ||
    pathname.startsWith("/images/") ||
    pathname.startsWith("/static/") ||
    pathname.startsWith("/public/") ||
    pathname.includes(".png") ||
    pathname.includes(".jpg") ||
    pathname.includes(".jpeg") ||
    pathname.includes(".gif") ||
    pathname.includes(".svg") ||
    pathname.includes(".ico") ||
    pathname.includes(".webp") ||
    pathname.includes(".css") ||
    pathname.includes(".js") ||
    pathname.includes(".woff") ||
    pathname.includes(".woff2") ||
    pathname.includes(".ttf") ||
    pathname.includes(".eot") ||
    pathname.includes(".map")
  ) {
    return NextResponse.next();
  }

  const publicRoutes = [
    "/login",
    "/register",
    "/forgot-password",
    "/reset-password",
    "/verify-email",
  ];

  const cookieToken =
    request.cookies.get("auth-token")?.value ||
    request.cookies.get("auth_token")?.value;
  const headerToken = request.headers
    .get("authorization")
    ?.replace(/^Bearer\s+/i, "");
  const authToken = cookieToken || headerToken || null;
  let role: string | null = null;

  if (authToken) {
    try {
      // NOTE: The Edge Runtime cannot verify the JWT signature (no secret access).
      // This decode is used ONLY for client-side navigation/redirects.
      // All real authorization is enforced by the backend on each API request.
      const payloadPart = authToken.split(".")[1];
      if (payloadPart) {
        // Convert base64url → base64 and add required padding
        const base64 = payloadPart.replace(/-/g, "+").replace(/_/g, "/");
        const padded = base64 + "=".repeat((4 - (base64.length % 4)) % 4);
        const payloadString = atob(padded);
        const payload = JSON.parse(payloadString);
        role = payload?.role || null;
      }
    } catch {
      role = null;
    }
  }

  if (!authToken && !publicRoutes.includes(pathname)) {
    const loginUrl = new URL("/login", request.url);
    if (pathname !== "/") {
      loginUrl.searchParams.set("redirect", pathname);
    }
    return NextResponse.redirect(loginUrl);
  }

  if (pathname.startsWith("/dashboard") && role !== "admin") {
    return NextResponse.redirect(new URL("/tickets", request.url));
  }

  // Allow agents to access their dashboard
  if (pathname.startsWith("/agent-dashboard") && role !== "agent") {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  if (pathname.startsWith("/reports/landlords") && role !== "admin") {
    return NextResponse.redirect(new URL("/landlords", request.url));
  }

  if (pathname.startsWith("/reports/campaigns") && role !== "admin") {
    return NextResponse.redirect(new URL("/campaigns", request.url));
  }

  if (pathname.startsWith("/reports/yards") && role !== "admin") {
    return NextResponse.redirect(new URL("/yards", request.url));
  }

  if (
    (pathname.startsWith("/reports/performance") ||
      pathname.startsWith("/reports/agents")) &&
    role !== "admin"
  ) {
    return NextResponse.redirect(new URL("/tickets", request.url));
  }

  if (pathname.startsWith("/users") && role !== "admin") {
    return NextResponse.redirect(new URL("/tickets", request.url));
  }

  if (authToken && publicRoutes.includes(pathname)) {
    // Redirect based on role
    const redirectPath = role === "agent" ? "/agent-dashboard" : "/dashboard";
    return NextResponse.redirect(new URL(redirectPath, request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
