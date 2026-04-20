"use client";

import { Sun, Moon } from "lucide-react";
import { NotificationBell } from "./notification-bell";
import { SidebarTrigger, useSidebar } from "@/components/ui/sidebar";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
} from "@/components/ui/breadcrumb";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { ChevronDown, LogOut, PanelLeft } from "lucide-react";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { useTheme } from "next-themes";

export default function Topbar() {
  const { isMobile } = useSidebar();
  const pathname = usePathname();

  // ── Page title derivation (unchanged logic)
  const pathSegments = pathname.split("/").filter(Boolean);
  const rawPage = pathSegments[pathSegments.length - 1] || "dashboard";
  const pageTitleMap: Record<string, string> = {
    "agent-dashboard": "Dashboard",
    dashboard: "Dashboard",
  };
  const currentPage =
    pageTitleMap[rawPage.toLowerCase()] ||
    rawPage
      .replace(/-/g, " ")
      .split(" ")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");

  const [showLogoutDialog, setShowLogoutDialog] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [currentUser, setCurrentUser] = useState({ name: "User", email: "" });
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // ── User refresh (unchanged logic)
  const refreshUser = () => {
    const storedUser = auth.getUser();
    if (storedUser) {
      const fullName = [storedUser.name, storedUser.lastName]
        .filter(Boolean)
        .join(" ");
      setCurrentUser({
        name: fullName || storedUser.email || "User",
        email: storedUser.email || "",
      });
    }
  };

  useEffect(() => {
    refreshUser();
    const handleProfileUpdate = () => refreshUser();
    const handleStorage = (event: StorageEvent) => {
      if (event.key === "user_data" || event.key === "user_profile") refreshUser();
    };
    window.addEventListener("user-profile-updated", handleProfileUpdate);
    window.addEventListener("storage", handleStorage);
    return () => {
      window.removeEventListener("user-profile-updated", handleProfileUpdate);
      window.removeEventListener("storage", handleStorage);
    };
  }, []);

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => { setShowLogoutDialog(false); }, [pathname]);

  // ── Logout (unchanged logic)
  const handleLogout = async () => {
    try {
      setIsLoggingOut(true);
      const { auth } = await import("@/lib/auth");
      auth.logout();
    } catch (error) {
      console.error("Logout failed:", error);
      setIsLoggingOut(false);
      setShowLogoutDialog(false);
      window.location.href = "/login";
    }
  };

  const getUserInitials = (name: string) =>
    name.split(" ").map((p) => p[0]).join("").toUpperCase().slice(0, 2);

  const userInitials = getUserInitials(currentUser.name);
  const currentTheme = resolvedTheme || theme;
  const isDark = currentTheme === "dark";

  return (
    <>
      {/* ── TOPBAR ── */}
      <header
        className={`
          sticky top-0 z-40 h-14 w-full flex items-center justify-between px-4 lg:px-6
          border-b transition-colors duration-300
          ${isDark
            ? "bg-gray-950/80 backdrop-blur-md border-gray-800"
            : "bg-white/80 backdrop-blur-md border-slate-200"
          }
        `}
      >
        {/* ── LEFT: sidebar toggle + breadcrumb ── */}
        <div className="flex items-center gap-3">
          {/* Sidebar toggle — overrides SidebarTrigger default styling */}
          <SidebarTrigger
            className={`
              p-1.5 rounded-lg transition-colors
              ${isDark
                ? "text-gray-400 hover:text-gray-200 hover:bg-gray-800"
                : "text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              }
            `}
          />

          {/* Hairline divider */}
          <span
            className={`h-5 w-px ${isDark ? "bg-gray-700" : "bg-slate-200"}`}
            aria-hidden
          />

          {/* Page title */}
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbPage
                  className={`text-sm font-semibold ${isDark ? "text-gray-100" : "text-slate-800"}`}
                >
                  {currentPage}
                </BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>

        {/* ── RIGHT: utils + profile ── */}
        <div className="flex items-center gap-1.5">

          {/* Notification bell */}
          <div className="relative">
            <div
              className={`
                w-8 h-8 flex items-center justify-center rounded-lg transition-colors
                ${isDark
                  ? "text-gray-400 hover:text-gray-200 hover:bg-gray-800"
                  : "text-slate-400 hover:text-slate-600 hover:bg-slate-100"
                }
              `}
            >
              <NotificationBell />
            </div>
          </div>

          {/* Theme toggle */}
          <button
            type="button"
            onClick={() => setTheme(isDark ? "light" : "dark")}
            aria-label="Toggle theme"
            className={`
              w-8 h-8 flex items-center justify-center rounded-lg transition-colors
              ${isDark
                ? "text-gray-400 hover:text-gray-200 hover:bg-gray-800"
                : "text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              }
            `}
          >
            {mounted ? (
              isDark
                ? <Sun className="h-4 w-4" />
                : <Moon className="h-4 w-4" />
            ) : (
              <Sun className="h-4 w-4 opacity-0" />
            )}
          </button>

          {/* Hairline divider */}
          <span
            className={`h-5 w-px mx-1 ${isDark ? "bg-gray-700" : "bg-slate-200"}`}
            aria-hidden
          />

          {/* ── Profile capsule pill ── */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                className={`
                  flex items-center gap-2 pl-1 pr-2.5 py-1 rounded-full
                  border transition-all cursor-pointer focus:outline-none
                  focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2
                  ${isDark
                    ? "bg-gray-900 border-gray-700 hover:bg-gray-800 shadow-sm"
                    : "bg-white border-slate-200 hover:bg-slate-50 shadow-sm"
                  }
                `}
              >
                {/* Avatar circle */}
                <div
                  className={`
                    w-6 h-6 rounded-full flex items-center justify-center
                    text-[10px] font-bold flex-shrink-0
                    ${isDark ? "bg-blue-500/20 text-blue-300" : "bg-blue-100 text-blue-700"}
                  `}
                >
                  {userInitials}
                </div>

                {/* Name */}
                <span
                  className={`text-xs font-semibold hidden sm:block ${isDark ? "text-gray-200" : "text-slate-700"}`}
                >
                  {currentUser.name}
                </span>

                {/* Chevron */}
                <ChevronDown
                  className={`w-3.5 h-3.5 flex-shrink-0 ${isDark ? "text-gray-500" : "text-slate-400"}`}
                />
              </button>
            </DropdownMenuTrigger>

            <DropdownMenuContent align="end" className="w-56">
              {/* User info header */}
              <div className="flex items-center gap-3 px-3 py-2.5">
                <div
                  className={`
                    w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0
                    text-sm font-bold
                    ${isDark ? "bg-blue-500/20 text-blue-300" : "bg-blue-100 text-blue-700"}
                  `}
                >
                  {userInitials}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold truncate">{currentUser.name}</p>
                  <p className="text-xs text-muted-foreground truncate">{currentUser.email}</p>
                </div>
              </div>

              <DropdownMenuSeparator />

              <DropdownMenuItem
                className="cursor-pointer text-red-600 focus:text-red-600 focus:bg-red-50 dark:focus:bg-red-950/30 gap-2"
                onClick={() => setShowLogoutDialog(true)}
              >
                <LogOut className="h-4 w-4" />
                <span>Sign Out</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      {/* ── LOGOUT DIALOG (unchanged) ── */}
      <AlertDialog open={showLogoutDialog} onOpenChange={setShowLogoutDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Sign Out</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to sign out of your account?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isLoggingOut}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleLogout}
              disabled={isLoggingOut}
              className="bg-red-600 hover:bg-red-700"
            >
              {isLoggingOut ? (
                <span className="flex items-center gap-2">
                  <svg
                    className="animate-spin h-4 w-4 text-white"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Signing out...
                </span>
              ) : (
                "Yes, Sign Out"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}