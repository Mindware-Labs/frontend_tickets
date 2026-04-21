"use client";

import * as React from "react";
import {
  BookOpen,
  LayoutDashboard,
  Megaphone,
  Users,
  BarChart3,
  PhoneCall,
  User,
  UserCircle,
  Building,
  Phone,
  Settings,
  HelpCircle,
  PanelLeftClose,
  PanelLeftOpen,
  MessageSquare,
} from "lucide-react";
import { usePathname } from "next/navigation";
import { useRole } from "@/components/providers/role-provider";
import {
  Sidebar,
  SidebarContent,
  SidebarRail,
  useSidebar,
} from "@/components/ui/sidebar";
import Image from "next/image";
import Link from "next/link";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { auth } from "@/lib/auth";

// ── Navigation data ────────────────────────────────────────────────────────────

const workspaceItems: {
  title: string;
  url: string;
  icon: React.ComponentType;
  adminOnly?: boolean;
}[] = [
  { title: "Aircall", url: "/aircall", icon: MessageSquare },
  { title: "Calls", url: "/calls", icon: PhoneCall },
  { title: "Dashboard", url: "/dashboard", icon: LayoutDashboard },
  { title: "Campaigns", url: "/campaigns", icon: Megaphone },
  { title: "Knowledge", url: "/knowledge", icon: BookOpen },
  { title: "Reports", url: "/reports", icon: BarChart3, adminOnly: true },
];

const managementItems: {
  title: string;
  url: string;
  icon: React.ComponentType;
  adminOnly?: boolean;
}[] = [
  { title: "Customers", url: "/customers", icon: Users },
  { title: "Yards", url: "/yards", icon: Building },
  { title: "Landlords", url: "/landlords", icon: User },
  { title: "Users", url: "/users", icon: UserCircle, adminOnly: true },
  { title: "Phone Lines", url: "/phone-lines", icon: Phone, adminOnly: true },
  { title: "Profile", url: "/profile", icon: UserCircle },
];

// ── Helpers ────────────────────────────────────────────────────────────────────

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((p) => p[0] ?? "")
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

// ── Component ─────────────────────────────────────────────────────────────────

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const pathname = usePathname();
  const { role } = useRole();
  const { state, toggleSidebar } = useSidebar();
  const { theme, resolvedTheme } = useTheme();

  const [mounted, setMounted] = useState(false);
  const [currentUser, setCurrentUser] = useState({
    name: "User",
    initials: "U",
  });

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const u = auth.getUser();
    if (u) {
      const full = [u.name, u.lastName].filter(Boolean).join(" ");
      const display = full || u.email || "User";
      setCurrentUser({ name: display, initials: getInitials(display) });
    }
  }, []);

  const isCollapsed = state === "collapsed";
  const isDark = mounted ? (resolvedTheme || theme) === "dark" : false;
  const normalizedRole = role?.toString().toLowerCase();

  // ── Filter items by role
  const visibleWorkspace = (
    normalizedRole === "agent"
      ? workspaceItems
          .filter((item) => !item.adminOnly)
          .map((item) =>
            item.title === "Dashboard"
              ? { ...item, url: "/agent-dashboard" }
              : item,
          )
      : workspaceItems
  ) as Array<{ title: string; url: string; icon: React.ElementType }>;

  const visibleManagement = managementItems.filter(
    (item) => !(item.adminOnly && normalizedRole === "agent"),
  ) as Array<{ title: string; url: string; icon: React.ElementType }>;

  // ── Active check
  const isActive = (url: string) =>
    pathname === url || pathname.startsWith(url + "/");

  // ── Design tokens
  const tk = isDark
    ? {
        sidebar: "bg-[#111113] border-[#1e1e21]",
        header: "border-[#1e1e21]",
        brand: "text-white",
        sectionLbl: "text-[#46464c]",
        divider: "bg-[#1e1e21]",
        itemInactive: "text-[#8e8e96] hover:bg-white/5 hover:text-[#e8e8e8]",
        itemActive: "bg-white/10 text-white font-semibold",
        iconInactive: "text-[#4d4d54]",
        iconActive: "text-white",
        toggleBtn: "text-[#4d4d54] hover:bg-white/5 hover:text-[#e8e8e8]",
        logoRing: "border-[#2a2a2e]",
        footerBorder: "border-[#1e1e21]",
        footerName: "text-[#e8e8e8]",
        footerSub: "text-[#46464c]",
        avatarBg: "bg-[#2a2a2e] text-[#e8e8e8]",
        statusBorder: "border-[#111113]",
      }
    : {
        sidebar: "bg-white border-slate-200",
        header: "border-slate-100",
        brand: "text-slate-900",
        sectionLbl: "text-slate-400",
        divider: "bg-slate-100",
        itemInactive: "text-slate-600 hover:bg-slate-100 hover:text-slate-900",
        itemActive: "bg-green-50 text-green-900 font-medium",
        iconInactive: "text-slate-400",
        iconActive: "text-green-700",
        toggleBtn: "text-slate-400 hover:bg-slate-100 hover:text-slate-600",
        logoRing: "border-slate-200",
        footerBorder: "border-slate-100",
        footerName: "text-slate-800",
        footerSub: "text-slate-400",
        avatarBg: "bg-teal-500 text-white",
        statusBorder: "border-white",
      };

  // ── Nav item component
  const NavItem = ({
    title,
    url,
    icon: Icon,
  }: {
    title: string;
    url: string;
    icon: React.ElementType;
  }) => {
    const active = isActive(url);
    return (
      <li>
        <Link
          href={url}
          title={isCollapsed ? title : undefined}
          className={[
            "flex items-center rounded-lg text-[13.5px] transition-all duration-150",
            isCollapsed ? "w-10 h-10 justify-center" : "gap-3 px-3 py-1.75",
            active ? tk.itemActive : tk.itemInactive,
          ].join(" ")}
        >
          <Icon
            className={`w-5 h-5 shrink-0 ${active ? tk.iconActive : tk.iconInactive}`}
            strokeWidth={active ? 2.2 : 1.8}
          />
          {!isCollapsed && <span className="leading-none">{title}</span>}
        </Link>
      </li>
    );
  };

  return (
    <Sidebar
      collapsible="icon"
      className={`border-r transition-colors duration-200 ${tk.sidebar}`}
      {...props}
    >
      <SidebarContent className="flex flex-col h-full overflow-hidden gap-0 p-0">
        {/* ── HEADER ── */}
        <div
          className={[
            "flex items-center h-14 border-b shrink-0 transition-all duration-300",
            tk.header,
            isCollapsed ? "justify-center px-3" : "justify-between px-4",
          ].join(" ")}
        >
          {!isCollapsed && (
            <Link
              href="/dashboard"
              className="flex items-center gap-2.5 min-w-0"
            >
              <div
                className={`shrink-0 w-7 h-7 rounded-md overflow-hidden relative border ${tk.logoRing}`}
              >
                <Image
                  src="/images/LOGO CQ-10.png"
                  alt="Center Quest"
                  fill
                  className="object-contain scale-125"
                  sizes="28px"
                  priority
                />
              </div>
              <span className={`text-[13px] font-bold truncate ${tk.brand}`}>
                Center Quest
              </span>
            </Link>
          )}

          <button
            onClick={toggleSidebar}
            className={`w-8 h-8 flex items-center justify-center rounded-lg transition-colors shrink-0 ${tk.toggleBtn}`}
            aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {isCollapsed ? (
              <PanelLeftOpen className="w-4 h-4" />
            ) : (
              <PanelLeftClose className="w-4 h-4" />
            )}
          </button>
        </div>

        {/* ── SCROLLABLE BODY ── */}
        <div className="flex-1 flex flex-col overflow-y-auto overflow-x-hidden min-h-0">
          {/* Inbox section */}
          <nav className={`py-3 ${isCollapsed ? "px-1.5" : "px-2"}`}>
            {!isCollapsed && (
              <p
                className={`text-[10px] font-semibold uppercase tracking-widest px-2 mb-2 ${tk.sectionLbl}`}
              >
                Inbox
              </p>
            )}
            {isCollapsed && <div className="h-2" />}
            <ul className="space-y-0.5">
              {visibleWorkspace.map((item) => (
                <NavItem key={item.title} {...item} />
              ))}
            </ul>
          </nav>

          <div className={`mx-3 h-px ${tk.divider}`} />

          {/* Management section */}
          <nav className={`py-3 ${isCollapsed ? "px-1.5" : "px-2"}`}>
            {!isCollapsed && (
              <p
                className={`text-[10px] font-semibold uppercase tracking-widest px-2 mb-2 ${tk.sectionLbl}`}
              >
                Contacts
              </p>
            )}
            {isCollapsed && <div className="h-2" />}
            <ul className="space-y-0.5">
              {visibleManagement.map((item) => (
                <NavItem key={item.title} {...item} />
              ))}
            </ul>
          </nav>

          {/* Spacer */}
          <div className="flex-1" />

          {/* ── FOOTER ── */}
          <div
            className={[
              "border-t pt-3 pb-3 space-y-0.5",
              tk.footerBorder,
              isCollapsed ? "px-1.5" : "px-2",
            ].join(" ")}
          >
            {/* User card */}
            <div
              className={[
                "flex items-center rounded-lg py-1.5",
                isCollapsed ? "justify-center" : "gap-3 px-3",
              ].join(" ")}
            >
              <div className="relative shrink-0">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${tk.avatarBg}`}
                >
                  {currentUser.initials}
                </div>
                <span
                  className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-red-500 border-2 ${tk.statusBorder}`}
                />
              </div>

              {!isCollapsed && (
                <div className="flex-1 min-w-0">
                  <p
                    className={`text-[13px] font-medium truncate leading-tight ${tk.footerName}`}
                  >
                    {currentUser.name}
                  </p>
                  <span className="inline-flex items-center gap-1 mt-1 px-1.5 py-0.5 rounded-full bg-red-100 text-red-600 text-[10px] font-medium">
                    <span className="w-1.5 h-1.5 rounded-full bg-red-500 shrink-0" />
                    Unavailable
                  </span>
                </div>
              )}
            </div>

            {/* Settings — admin only */}
            {normalizedRole !== "agent" && (
              <Link
                href="/settings"
                title={isCollapsed ? "Settings" : undefined}
                className={[
                  "flex items-center rounded-lg text-[13.5px] transition-all duration-150",
                  isCollapsed
                    ? "w-10 h-10 justify-center"
                    : "gap-3 px-3 py-1.75",
                  tk.itemInactive,
                ].join(" ")}
              >
                <Settings
                  className={`w-5 h-5 shrink-0 ${tk.iconInactive}`}
                  strokeWidth={1.8}
                />
                {!isCollapsed && <span className="leading-none">Settings</span>}
              </Link>
            )}

            {/* Help & Feedback */}
            <Link
              href="/support"
              title={isCollapsed ? "Help and Feedback" : undefined}
              className={[
                "flex items-center rounded-lg text-[13.5px] transition-all duration-150",
                isCollapsed ? "w-10 h-10 justify-center" : "gap-3 px-3 py-1.75",
                tk.itemInactive,
              ].join(" ")}
            >
              <HelpCircle
                className={`w-5 h-5 shrink-0 ${tk.iconInactive}`}
                strokeWidth={1.8}
              />
              {!isCollapsed && (
                <span className="leading-none">Help and Feedback</span>
              )}
            </Link>
          </div>
        </div>
      </SidebarContent>

      <SidebarRail />
    </Sidebar>
  );
}
