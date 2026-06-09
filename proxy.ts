import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isPrivilegedRole = (value: string | null) =>
    value === "admin" || value === "dev";

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

  let tokenExpired = false;

  if (authToken) {
    try {
      const payloadPart = authToken.split(".")[1];
      if (payloadPart) {
        const base64 = payloadPart.replace(/-/g, "+").replace(/_/g, "/");
        const padded = base64 + "=".repeat((4 - (base64.length % 4)) % 4);
        const payloadString = atob(padded);
        const payload = JSON.parse(payloadString);
        role = payload?.role || null;

        if (payload?.exp && Date.now() >= payload.exp * 1000) {
          tokenExpired = true;
          role = null;
        }
      }
    } catch {
      role = null;
    }
  }

  if (tokenExpired && !publicRoutes.includes(pathname)) {
    const loginUrl = new URL("/login", request.url);
    if (pathname !== "/") {
      loginUrl.searchParams.set("redirect", pathname);
    }
    const redirectResponse = NextResponse.redirect(loginUrl);
    redirectResponse.cookies.delete("auth-token");
    redirectResponse.cookies.delete("auth_token");
    return redirectResponse;
  }

  if (pathname === "/tickets" || pathname.startsWith("/tickets/")) {
    const redirectUrl = new URL("/calls", request.url);
    request.nextUrl.searchParams.forEach((value, key) => {
      redirectUrl.searchParams.set(key, value);
    });
    if (!redirectUrl.searchParams.has("tab")) {
      redirectUrl.searchParams.set("tab", "tickets");
    }
    return NextResponse.redirect(redirectUrl);
  }

  if (!authToken && !publicRoutes.includes(pathname)) {
    const loginUrl = new URL("/login", request.url);
    if (pathname !== "/") {
      loginUrl.searchParams.set("redirect", pathname);
    }
    return NextResponse.redirect(loginUrl);
  }

  if (pathname === "/" && authToken) {
    const redirectPath = role === "agent" ? "/agent-dashboard" : "/dashboard";
    return NextResponse.redirect(new URL(redirectPath, request.url));
  }

  if (pathname === "/" && !authToken) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  if (pathname.startsWith("/dashboard") && !isPrivilegedRole(role)) {
    return NextResponse.redirect(new URL("/calls", request.url));
  }

  if (pathname.startsWith("/agent-dashboard") && role !== "agent") {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  if (pathname.startsWith("/incoming-call-lab") && role !== "dev") {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  if (pathname.startsWith("/reports/landlords") && !isPrivilegedRole(role)) {
    return NextResponse.redirect(new URL("/landlords", request.url));
  }

  if (pathname.startsWith("/reports/campaigns") && !isPrivilegedRole(role)) {
    return NextResponse.redirect(new URL("/campaigns", request.url));
  }

  if (pathname.startsWith("/reports/yards") && !isPrivilegedRole(role)) {
    return NextResponse.redirect(new URL("/yards", request.url));
  }

  if (pathname.startsWith("/users") && !isPrivilegedRole(role)) {
    return NextResponse.redirect(new URL("/calls", request.url));
  }

  if (authToken && publicRoutes.includes(pathname)) {
    const redirectPath = role === "agent" ? "/agent-dashboard" : "/dashboard";
    return NextResponse.redirect(new URL(redirectPath, request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
