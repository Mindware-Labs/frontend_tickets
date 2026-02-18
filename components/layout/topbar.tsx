"use client";

import { Search, Bell, Sun, Moon } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { SidebarTrigger, useSidebar } from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
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
import { User, ChevronDown } from "lucide-react";

import Link from "next/link";

import { auth } from "@/lib/auth";
import { useTheme } from "next-themes";

export default function Topbar() {
  const { isMobile } = useSidebar();
  const pathname = usePathname();
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
  const [searchQuery, setSearchQuery] = useState("");
  const [currentUser, setCurrentUser] = useState({ name: "User", email: "" });
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

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
      if (event.key === "user_data" || event.key === "user_profile") {
        refreshUser();
      }
    };

    window.addEventListener("user-profile-updated", handleProfileUpdate);
    window.addEventListener("storage", handleStorage);

    return () => {
      window.removeEventListener("user-profile-updated", handleProfileUpdate);
      window.removeEventListener("storage", handleStorage);
    };
  }, []);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Close logout dialog when route changes
  useEffect(() => {
    setShowLogoutDialog(false);
  }, [pathname]);

  const handleLogout = async () => {
    try {
      setIsLoggingOut(true);
      // Import auth dynamically to avoid SSR issues
      const { auth } = await import("@/lib/auth");
      auth.logout(); // logout() already handles redirect
    } catch (error) {
      console.error("Logout failed:", error);
      setIsLoggingOut(false);
      setShowLogoutDialog(false);
      // Force redirect even if logout fails
      window.location.href = "/login";
    }
  };

  const getUserInitials = (name: string) => {
    return name
      .split(" ")
      .map((part) => part[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const userInitials = getUserInitials(currentUser.name);
  const currentTheme = resolvedTheme || theme;

  return (
    <>
      <header className="sticky top-0 z-10 flex h-16 shrink-0 items-center justify-between gap-2 bg-background/50 backdrop-blur-xl px-6 transition-[width,height] ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-16 border-b border-border/40 mb-6">
        <div className="flex items-center gap-2">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-2 h-4" />
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbPage className="capitalize font-bold">
                  {currentPage}
                </BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>

        <div className="flex items-center gap-4">
          <Separator orientation="vertical" className="h-4" />

          <button
            type="button"
            onClick={() => setTheme(currentTheme === "dark" ? "light" : "dark")}
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-border/60 bg-background/60 text-foreground/80 shadow-sm transition-colors hover:bg-accent/60"
            aria-label="Toggle light and dark mode"
          >
            {mounted && currentTheme === "dark" ? (
              <Sun className="h-4 w-4 text-muted-foreground" />
            ) : (
              <Moon className="h-4 w-4 text-muted-foreground" />
            )}
          </button>

          {/* User dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex items-center gap-3 p-1 hover:bg-accent/50 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary/10 ring-2 ring-border/50 hover:ring-primary/30 transition-all cursor-pointer">
                  <span className="text-xs font-bold text-primary">
                    {userInitials}
                  </span>
                </div>

                <div className="hidden lg:block text-left">
                  <p className="text-sm font-medium">{currentUser.name}</p>
                </div>
                <ChevronDown className="h-4 w-4 text-muted-foreground" />
              </button>
            </DropdownMenuTrigger>

            <DropdownMenuContent align="end" className="w-56">
              {/* Dropdown header with user info */}
              <div className="flex items-center gap-3 p-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 ring-2 ring-border/50">
                  <span className="text-sm font-bold text-primary">
                    {userInitials}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">
                    {currentUser.name}
                  </p>
                  <p className="text-xs text-muted-foreground truncate">
                    {currentUser.email}
                  </p>
                </div>
              </div>

              <DropdownMenuSeparator />

              <DropdownMenuItem
                className="cursor-pointer text-red-600 focus:text-red-600 focus:bg-red-50"
                onClick={() => setShowLogoutDialog(true)}
              >
                <svg
                  className="mr-2 h-4 w-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                  />
                </svg>
                <span>Sign Out</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      {/* Logout confirmation dialog */}
      <AlertDialog open={showLogoutDialog} onOpenChange={setShowLogoutDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Sign Out</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to sign out of your account?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isLoggingOut}>
              Cancel
            </AlertDialogCancel>
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
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
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
