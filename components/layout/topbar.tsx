"use client";

import { LogOut, ChevronDown, CircleUser, Sun, Moon } from "lucide-react";
import dynamic from "next/dynamic";
import { usePathname } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { SidebarTrigger, useSidebar } from "@/components/ui/sidebar";
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
import { auth } from "@/lib/auth";
import { cn } from "@/lib/utils";
import { useTheme } from "next-themes";

const NotificationBell = dynamic(
  () => import("./notification-bell").then((m) => m.NotificationBell),
  { ssr: false },
);

type PageMeta = {
  title: string;
  section?: string;
};

function resolvePageMeta(pathname: string): PageMeta {
  const path = pathname.toLowerCase();

  if (path.startsWith("/calls"))
    return { section: "Communications", title: "Calls" };
  if (path.startsWith("/aircall"))
    return { section: "Communications", title: "Aircall" };
  if (path.startsWith("/agent-dashboard") || path === "/dashboard")
    return { title: "Dashboard" };
  if (path.startsWith("/campaigns"))
    return { section: "Operations", title: "Campaigns" };
  if (path.startsWith("/reports/performance"))
    return { section: "Operations", title: "Performance" };
  if (path.startsWith("/reports/agents"))
    return { section: "Operations", title: "Agents" };
  if (path.startsWith("/reports/campaigns"))
    return { section: "Operations", title: "Campaign Reports" };
  if (path.startsWith("/reports/yards"))
    return { section: "Management", title: "Yard Reports" };
  if (path.startsWith("/reports/landlords"))
    return { section: "Management", title: "Landlord Reports" };
  if (path.startsWith("/yards"))
    return { section: "Management", title: "Yards" };
  if (path.startsWith("/landlords"))
    return { section: "Management", title: "Landlords" };
  if (path.startsWith("/customers"))
    return { section: "Directory", title: "Customers" };
  if (path.startsWith("/users"))
    return { section: "Directory", title: "Users" };
  if (path.startsWith("/phone-lines"))
    return { section: "Directory", title: "Phone Lines" };
  if (path.startsWith("/profile"))
    return { section: "Directory", title: "Profile" };

  const segment = pathname.split("/").filter(Boolean).pop() || "dashboard";
  const title = segment
    .replace(/-/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());

  return { title };
}

function getUserInitials(name: string) {
  return name
    .split(" ")
    .map((p) => p[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

const iconButtonClass = cn(
  "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-slate-500 transition-colors",
  "hover:bg-slate-100 hover:text-slate-800",
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#008f68]/25 focus-visible:ring-offset-1",
);

export default function Topbar() {
  const { isMobile } = useSidebar();
  const pathname = usePathname();
  const pageMeta = useMemo(() => resolvePageMeta(pathname), [pathname]);

  const [showLogoutDialog, setShowLogoutDialog] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
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
    setMounted(true);
  }, []);

  useEffect(() => {
    refreshUser();
    const handleProfileUpdate = () => refreshUser();
    const handleStorage = (event: StorageEvent) => {
      if (event.key === "user_data" || event.key === "user_profile")
        refreshUser();
    };
    window.addEventListener("user-profile-updated", handleProfileUpdate);
    window.addEventListener("storage", handleStorage);
    return () => {
      window.removeEventListener("user-profile-updated", handleProfileUpdate);
      window.removeEventListener("storage", handleStorage);
    };
  }, []);

  useEffect(() => {
    setShowLogoutDialog(false);
  }, [pathname]);

  const handleLogout = async () => {
    try {
      setIsLoggingOut(true);
      const { auth: authModule } = await import("@/lib/auth");
      authModule.logout();
    } catch (error) {
      console.error("Logout failed:", error);
      setIsLoggingOut(false);
      setShowLogoutDialog(false);
      window.location.href = "/login";
    }
  };

  const userInitials = getUserInitials(currentUser.name);
  const avatarHue = (currentUser.name?.charCodeAt(0) ?? 200) % 360;
  const currentTheme = resolvedTheme || theme;
  const isDark = currentTheme === "dark";

  return (
    <>
      <header
        className={cn(
          "sticky top-0 z-40 flex h-[3.25rem] w-full shrink-0 items-center justify-between gap-3 border-b px-3 backdrop-blur-md sm:px-4 lg:px-5",
          isDark
            ? "border-gray-800/90 bg-gray-950/95"
            : "border-slate-200/90 bg-white/95",
        )}
      >
        <div className="flex min-w-0 flex-1 items-center gap-2.5">
          {isMobile && (
            <SidebarTrigger className={cn(iconButtonClass, "h-8 w-8")} />
          )}

          <div className="flex min-w-0 items-center gap-2">
            <span
              className="hidden h-8 w-1 shrink-0 rounded-full bg-[#008f68] sm:block"
              aria-hidden
            />
            <div className="min-w-0">
              {pageMeta.section && (
                <p className="truncate text-[10px] font-semibold uppercase tracking-widest leading-none text-slate-400">
                  {pageMeta.section}
                </p>
              )}
              <h1
                className={cn(
                  "truncate text-[15px] font-bold leading-tight tracking-[-0.01em]",
                  isDark ? "text-gray-100" : "text-slate-900",
                )}
              >
                {pageMeta.title}
              </h1>
            </div>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-1">
          <div
            className={cn(
              iconButtonClass,
              isDark && "hover:bg-gray-800 hover:text-gray-200",
            )}
          >
            <NotificationBell />
          </div>

          <button
            type="button"
            onClick={() => setTheme(isDark ? "light" : "dark")}
            aria-label="Toggle theme"
            className={cn(
              iconButtonClass,
              isDark
                ? "text-gray-400 hover:bg-gray-800 hover:text-gray-200"
                : "text-slate-500 hover:bg-slate-100 hover:text-slate-800",
            )}
          >
            {mounted ? (
              isDark ? (
                <Sun className="h-4 w-4" />
              ) : (
                <Moon className="h-4 w-4" />
              )
            ) : (
              <Sun className="h-4 w-4 opacity-0" />
            )}
          </button>

          <span
            className={cn(
              "mx-0.5 hidden h-5 w-px sm:block",
              isDark ? "bg-gray-700" : "bg-slate-200",
            )}
            aria-hidden
          />

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                className={cn(
                  "flex max-w-[200px] items-center gap-2 rounded-full border py-1 pl-1 pr-2.5 shadow-sm transition-all",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#008f68]/30 focus-visible:ring-offset-1",
                  isDark
                    ? "border-gray-700 bg-gray-900 hover:border-gray-600 hover:bg-gray-800"
                    : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50",
                )}
              >
                <div
                  className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[10px] font-bold text-white shadow-sm ring-2 ring-white"
                  style={{
                    background: `hsl(${avatarHue} 48% 42%)`,
                  }}
                >
                  {userInitials}
                </div>
                <span
                  className={cn(
                    "hidden max-w-[120px] truncate text-[12px] font-semibold sm:block",
                    isDark ? "text-gray-200" : "text-slate-700",
                  )}
                >
                  {currentUser.name}
                </span>
                <ChevronDown
                  className={cn(
                    "h-3.5 w-3.5 shrink-0",
                    isDark ? "text-gray-500" : "text-slate-400",
                  )}
                />
              </button>
            </DropdownMenuTrigger>

            <DropdownMenuContent
              align="end"
              className="w-60 rounded-xl border-slate-200 p-1.5 shadow-lg"
            >
              <div className="rounded-lg bg-slate-50 px-3 py-2.5">
                <div className="flex items-center gap-2.5">
                  <div
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-[11px] font-bold text-white"
                    style={{
                      background: `hsl(${avatarHue} 48% 42%)`,
                    }}
                  >
                    {userInitials}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[13px] font-semibold text-slate-900">
                      {currentUser.name}
                    </p>
                    <p className="truncate text-[11px] text-slate-500">
                      {currentUser.email || "—"}
                    </p>
                  </div>
                </div>
              </div>

              <DropdownMenuSeparator className="my-1" />

              <DropdownMenuItem
                asChild
                className="cursor-pointer rounded-lg px-2.5 py-2 text-[13px]"
              >
                <Link href="/profile" className="flex items-center gap-2">
                  <CircleUser className="h-4 w-4 text-slate-500" />
                  <span>Profile</span>
                </Link>
              </DropdownMenuItem>

              <DropdownMenuItem
                className="cursor-pointer rounded-lg px-2.5 py-2 text-[13px] text-red-600 focus:bg-red-50 focus:text-red-700"
                onClick={() => setShowLogoutDialog(true)}
              >
                <LogOut className="h-4 w-4" />
                <span>Sign out</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      <AlertDialog open={showLogoutDialog} onOpenChange={setShowLogoutDialog}>
        <AlertDialogContent className="rounded-2xl border-slate-200 sm:max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-[15px] font-semibold text-slate-900">
              Sign out
            </AlertDialogTitle>
            <AlertDialogDescription className="text-[13px] text-slate-500">
              Are you sure you want to sign out of your account?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2 border-t border-slate-100 pt-4 sm:gap-2">
            <AlertDialogCancel
              disabled={isLoggingOut}
              className="rounded-xl border-slate-200"
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleLogout}
              disabled={isLoggingOut}
              className="rounded-xl bg-red-600 hover:bg-red-700"
            >
              {isLoggingOut ? "Signing out…" : "Sign out"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
