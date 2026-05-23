"use client";

import { ChevronDown, CircleUser, LogOut } from "lucide-react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

import {
  topbarAccentBarClass,
  topbarAccentLineClass,
  topbarActionsGroupClass,
  topbarDropdownClass,
  topbarIconBtnClass,
  topbarSectionLabelClass,
  topbarShellClass,
  topbarTitleClass,
  topbarUserBtnClass,
  topbarWrapClass,
} from "@/components/layout/sidebar-theme";
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { SidebarTrigger, useSidebar } from "@/components/ui/sidebar";
import { auth } from "@/lib/auth";
import { cn } from "@/lib/utils";

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
    return { section: "Communications", title: "Contact Center" };

  if (path.startsWith("/aircall"))
    return { section: "Communications", title: "Aircall" };

  if (path.startsWith("/agent-dashboard") || path === "/dashboard")
    return { title: "Dashboard" };

  if (path.startsWith("/campaigns"))
    return { section: "Operations", title: "Campaigns" };

  if (path.startsWith("/reports/performance"))
    return { section: "Reports", title: "Performance" };

  if (path.startsWith("/reports/agents"))
    return { section: "Reports", title: "Agents" };

  if (path.startsWith("/reports/campaigns"))
    return { section: "Operations", title: "Campaign Reports" };

  if (path.startsWith("/reports/yards"))
    return { section: "Management", title: "Yard Reports" };

  if (path.startsWith("/reports/landlords"))
    return { section: "Management", title: "Landlord Reports" };

  if (path.startsWith("/audit/sms"))
    return { section: "SMS", title: "SMS Audit" };

  if (path.startsWith("/audit/notifications"))
    return { section: "Notifications", title: "Notifications Audit" };

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

  return {
    title: segment
      .replace(/-/g, " ")
      .replace(/\b\w/g, (c) => c.toUpperCase()),
  };
}

function getUserInitials(name: string) {
  return name
    .split(" ")
    .map((p) => p[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export default function Topbar() {
  const pathname = usePathname();
  const { isMobile } = useSidebar();

  const pageMeta = useMemo(() => resolvePageMeta(pathname), [pathname]);

  const [showLogoutDialog, setShowLogoutDialog] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const [currentUser, setCurrentUser] = useState({
    name: "User",
    email: "",
  });

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

  return (
    <>
      <header className={topbarWrapClass}>
        <div className={topbarShellClass}>
          <span className={topbarAccentLineClass} aria-hidden />

          <div className="flex min-w-0 flex-1 items-center gap-2.5">
            {isMobile ? (
              <SidebarTrigger className={topbarIconBtnClass} />
            ) : null}

            <span className={cn(topbarAccentBarClass, isMobile ? "hidden sm:block" : "block")} aria-hidden />

            <div className="min-w-0">
              {pageMeta.section ? (
                <p className={cn(topbarSectionLabelClass, "leading-none")}>
                  {pageMeta.section}
                </p>
              ) : null}
              <h1 className={topbarTitleClass}>{pageMeta.title}</h1>
            </div>
          </div>

          <div className={topbarActionsGroupClass}>
            <NotificationBell />

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button type="button" className={topbarUserBtnClass}>
                  <div
                    className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-[10px] font-bold text-white ring-1 ring-black/5 dark:ring-white/10"
                    style={{ background: `hsl(${avatarHue} 48% 42%)` }}
                  >
                    {userInitials}
                  </div>
                  <span className="hidden max-w-[120px] truncate text-[12px] font-semibold text-slate-700 sm:block dark:text-slate-200">
                    {currentUser.name}
                  </span>
                  <ChevronDown className="size-3.5 shrink-0 text-slate-400" />
                </button>
              </DropdownMenuTrigger>

              <DropdownMenuContent align="end" className={topbarDropdownClass}>
                <div className="rounded-lg border border-slate-100 bg-slate-50/80 px-3 py-2.5 dark:border-slate-800 dark:bg-slate-900/50">
                  <div className="flex items-center gap-2.5">
                    <div
                      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-[10px] font-bold text-white"
                      style={{ background: `hsl(${avatarHue} 48% 42%)` }}
                    >
                      {userInitials}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[13px] font-semibold text-slate-900 dark:text-slate-100">
                        {currentUser.name}
                      </p>
                      <p className="truncate text-[11px] text-slate-500 dark:text-slate-400">
                        {currentUser.email || "—"}
                      </p>
                    </div>
                  </div>
                </div>

                <DropdownMenuSeparator className="my-1 bg-slate-100 dark:bg-slate-800" />

                <DropdownMenuItem
                  asChild
                  className="cursor-pointer rounded-lg px-2.5 py-2 text-[13px] focus:bg-[#f0faf5] focus:text-[#008f68] dark:focus:bg-emerald-500/10 dark:focus:text-emerald-400"
                >
                  <Link href="/profile" className="flex items-center gap-2">
                    <CircleUser className="size-4 text-slate-500" />
                    <span>Profile</span>
                  </Link>
                </DropdownMenuItem>

                <DropdownMenuItem
                  className="cursor-pointer rounded-lg px-2.5 py-2 text-[13px] text-rose-600 focus:bg-rose-50 focus:text-rose-700 dark:focus:bg-rose-950/40 dark:focus:text-rose-400"
                  onClick={() => setShowLogoutDialog(true)}
                >
                  <LogOut className="size-4" />
                  <span>Sign out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      <AlertDialog open={showLogoutDialog} onOpenChange={setShowLogoutDialog}>
        <AlertDialogContent className="rounded-2xl border-slate-200/80 bg-white sm:max-w-md dark:border-slate-800 dark:bg-slate-950">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-[15px] font-semibold text-slate-900 dark:text-slate-100">
              Sign out
            </AlertDialogTitle>
            <AlertDialogDescription className="text-[13px] text-slate-500 dark:text-slate-400">
              Are you sure you want to sign out of your account?
            </AlertDialogDescription>
          </AlertDialogHeader>

          <AlertDialogFooter className="gap-2 border-t border-slate-100 pt-4 sm:gap-2 dark:border-slate-800">
            <AlertDialogCancel
              disabled={isLoggingOut}
              className="rounded-lg border-slate-200 dark:border-slate-700"
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleLogout}
              disabled={isLoggingOut}
              className="rounded-lg bg-rose-600 hover:bg-rose-700"
            >
              {isLoggingOut ? "Signing out..." : "Sign out"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
