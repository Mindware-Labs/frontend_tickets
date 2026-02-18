'use client';

import { ThemeProvider } from "next-themes";
import type React from "react"
import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import DashboardLayout from "@/components/layout/dashboard-layout"
import { auth } from "@/lib/auth";
import { getCookie } from "@/lib/cookie-utils";

export default function Layout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    // Check authentication on client side
    const checkAuth = () => {
      const user = auth.getUser();
      const token = getCookie("auth-token") || (typeof window !== "undefined" ? localStorage.getItem("auth_token") : null);
      
      // Public routes that don't require authentication
      const publicRoutes = ["/login", "/register", "/forgot-password", "/reset-password", "/verify-email"];
      const isPublicRoute = publicRoutes.includes(pathname);

      // If no user or token and not on a public route, redirect to login
      if (!user || !token) {
        if (!isPublicRoute) {
          const loginUrl = pathname === "/" || pathname === "/login" 
            ? "/login" 
            : `/login?redirect=${encodeURIComponent(pathname)}`;
          router.push(loginUrl);
        }
        return;
      }

      // If user is on login page but is authenticated, redirect to dashboard
      if (isPublicRoute && user && token) {
        const redirectPath = user.role === "agent" ? "/agent-dashboard" : "/dashboard";
        router.push(redirectPath);
      }
    };

    checkAuth();
  }, [router, pathname]);

  return <DashboardLayout>{children}</DashboardLayout>
}
export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider
      attribute="class"  // O "data-theme" dependiendo de tu configuración
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
    >
      {children}
    </ThemeProvider>
  );
}
