"use client";

import * as React from "react";
import {
  BarChart3,
  Building,
  ChevronDown,
  ChevronRight,
  LayoutGrid,
  Megaphone,
  MessageSquare,
  PanelLeft,
  Phone,
  PhoneCall,
  User,
  UserCircle,
  Users,
  type LucideIcon,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTheme } from "next-themes";
import { useEffect, useMemo, useState } from "react";

import { useRole } from "@/components/providers/role-provider";
import {
  Sidebar,
  SidebarContent,
  SidebarRail,
  useSidebar,
} from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";

type NavChild = {
  title: string;
  url: string;
  icon?: LucideIcon;
  adminOnly?: boolean;
};

type NavItem = {
  title: string;
  url?: string;
  icon: LucideIcon;
  adminOnly?: boolean;
  children?: NavChild[];
};

type NavSection = {
  title?: string;
  items: NavItem[];
};

const sections: NavSection[] = [
  {
    items: [
      { title: "Calls", url: "/calls", icon: PhoneCall },
      { title: "Aircall", url: "/aircall", icon: MessageSquare },
    ],
  },
  {
    title: "OPERATIONS",
    items: [
      { title: "Dashboard", url: "/dashboard", icon: LayoutGrid },
      {
        title: "Campaigns",
        url: "/campaigns",
        icon: Megaphone,
        children: [
          { title: "Campaigns", url: "/campaigns", icon: Megaphone },
          { title: "Reports", url: "/reports/campaigns", icon: BarChart3 },
        ],
      },
      {
        title: "Reports",
        icon: BarChart3,
        adminOnly: true,
        children: [
          { title: "Performance", url: "/reports/performance", icon: BarChart3 },
          { title: "Agents", url: "/reports/agents", icon: Users },
        ],
      },
    ],
  },
  {
    title: "MANAGEMENT",
    items: [
      {
        title: "Yards",
        url: "/yards",
        icon: Building,
        children: [
          { title: "Yards", url: "/yards", icon: Building },
          { title: "Reports", url: "/reports/yards", icon: BarChart3 },
        ],
      },
      {
        title: "Landlords",
        url: "/landlords",
        icon: User,
        children: [
          { title: "Landlords", url: "/landlords", icon: User },
          { title: "Reports", url: "/reports/landlords", icon: BarChart3 },
        ],
      },
    ],
  },
  {
    title: "DIRECTORY",
    items: [
      { title: "Customers", url: "/customers", icon: Users },
      { title: "Users", url: "/users", icon: User, adminOnly: true },
      { title: "Phone Lines", url: "/phone-lines", icon: Phone, adminOnly: true },
      { title: "Profile", url: "/profile", icon: UserCircle },
    ],
  },
];

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const pathname = usePathname();
  const { role } = useRole();
  const { state, toggleSidebar } = useSidebar();
  const { theme, resolvedTheme } = useTheme();

  const [mounted, setMounted] = useState(false);
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({});

  useEffect(() => {
    setMounted(true);
  }, []);

  const isCollapsed = state === "collapsed";
  const isDark = mounted ? (resolvedTheme || theme) === "dark" : false;
  const normalizedRole = role?.toString().toLowerCase();
  const isAgent = normalizedRole === "agent";

  const visibleSections = useMemo(
    () =>
      sections
        .map((section) => ({
          ...section,
          items: section.items
            .filter((item) => !(item.adminOnly && isAgent))
            .map((item) => ({
              ...item,
              url:
                item.title === "Dashboard" && isAgent
                  ? "/agent-dashboard"
                  : item.url,
              children: item.children?.filter(
                (child) => !(child.adminOnly && isAgent),
              ),
            }))
            .filter(
              (item) =>
                item.url || item.children === undefined || item.children.length > 0,
            ),
        }))
        .filter((section) => section.items.length > 0),
    [isAgent],
  );

  const isActive = (url?: string) =>
    Boolean(url && (pathname === url || pathname.startsWith(`${url}/`)));

  const groupIsActive = (item: NavItem) =>
    isActive(item.url) || Boolean(item.children?.some((child) => isActive(child.url)));

  const toggleGroup = (key: string) => {
    setOpenGroups((current) => ({ ...current, [key]: !current[key] }));
  };

  const tk = isDark
    ? {
        sidebar: "border-slate-200 bg-white [&_[data-slot=sidebar-inner]]:bg-white",
        headerBorder: "border-slate-200/80",
        divider: "bg-slate-200/80",
        brand: "text-slate-900",
        section: "text-slate-500",
        item: "text-slate-700 hover:bg-emerald-50/60 hover:text-slate-950",
        icon: "text-slate-600",
        activeItem: "bg-emerald-100 text-slate-950 shadow-[inset_0_0_0_1px_rgba(16,185,129,0.14)]",
        activeIcon: "text-emerald-700",
        mutedItem: "text-slate-500",
        toggle: "text-slate-600 hover:bg-emerald-50/70 hover:text-slate-900",
        childItem: "text-slate-600 hover:bg-emerald-50/60 hover:text-slate-900",
      }
    : {
        sidebar: "border-slate-200 bg-white [&_[data-slot=sidebar-inner]]:bg-white",
        headerBorder: "border-slate-200/80",
        divider: "bg-slate-200/80",
        brand: "text-slate-900",
        section: "text-slate-500",
        item: "text-slate-700 hover:bg-emerald-50/60 hover:text-slate-950",
        icon: "text-slate-600",
        activeItem: "bg-emerald-100 text-slate-950 shadow-[inset_0_0_0_1px_rgba(16,185,129,0.14)]",
        activeIcon: "text-emerald-700",
        mutedItem: "text-slate-500",
        toggle: "text-slate-600 hover:bg-emerald-50/70 hover:text-slate-900",
        childItem: "text-slate-600 hover:bg-emerald-50/60 hover:text-slate-900",
      };

  const renderNavItem = (item: NavItem | NavChild, child = false) => {
    if (!item.url) return null;

    const Icon = item.icon ?? PhoneCall;
    const active = isActive(item.url);

    return (
      <li key={`${item.title}-${item.url}`}>
        <Link
          href={item.url}
          title={isCollapsed ? item.title : undefined}
          aria-current={active ? "page" : undefined}
          className={cn(
            "flex h-9 w-full items-center rounded-md text-[13.5px] font-semibold leading-none transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/40",
            isCollapsed ? "justify-center px-0" : child ? "gap-2.5 px-3" : "gap-3 px-3",
            child && !isCollapsed && "pl-9 text-[13px]",
            active ? tk.activeItem : child ? tk.childItem : tk.item,
          )}
        >
          <Icon
            className={cn(
              "h-4 w-4 shrink-0",
              active ? tk.activeIcon : tk.icon,
              child && !active && "opacity-80",
            )}
            strokeWidth={active ? 2.2 : 1.8}
          />
          {!isCollapsed && <span className="truncate">{item.title}</span>}
        </Link>
      </li>
    );
  };

  const renderGroup = (item: NavItem) => {
    const Icon = item.icon;
    const active = groupIsActive(item);
    const isOpen =
      openGroups[item.title] ?? Boolean(item.children?.some((child) => isActive(child.url)));

    return (
      <li key={item.title}>
        <button
          type="button"
          onClick={() => toggleGroup(item.title)}
          title={isCollapsed ? item.title : undefined}
          aria-expanded={isOpen}
          className={cn(
            "flex h-9 w-full items-center rounded-md text-[13.5px] font-semibold leading-none transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/40",
            isCollapsed ? "justify-center px-0" : "gap-3 px-3",
            active ? tk.activeItem : tk.item,
          )}
        >
          <Icon
            className={cn("h-4 w-4 shrink-0", active ? tk.activeIcon : tk.icon)}
            strokeWidth={active ? 2.2 : 1.8}
          />
          {!isCollapsed && (
            <>
              <span className="min-w-0 flex-1 truncate text-left">{item.title}</span>
              {isOpen ? (
                <ChevronDown className={cn("h-4 w-4 shrink-0", active ? tk.activeIcon : tk.icon)} />
              ) : (
                <ChevronRight className={cn("h-4 w-4 shrink-0", active ? tk.activeIcon : tk.icon)} />
              )}
            </>
          )}
        </button>

        {!isCollapsed && isOpen && item.children && (
          <ul className="mt-1 space-y-0.5">
            {item.children.map((child) => renderNavItem(child, true))}
          </ul>
        )}
      </li>
    );
  };

  return (
    <Sidebar
      collapsible="icon"
      className={cn("border-r transition-colors duration-200", tk.sidebar)}
      {...props}
    >
      <SidebarContent className="flex h-full flex-col gap-0 overflow-hidden bg-white p-0 font-sans">
        <header
          className={cn(
            "flex h-14 shrink-0 items-center border-b transition-all duration-200",
            tk.headerBorder,
            isCollapsed ? "justify-center px-2" : "justify-between px-4",
          )}
        >
          {!isCollapsed && (
            <Link href="/dashboard" className="flex min-w-0 items-center gap-2.5">
              <span className="relative h-7 w-7 shrink-0 overflow-hidden">
                <Image
                  src="/images/LOGO CQ-10.png"
                  alt="Center Quest"
                  fill
                  className="scale-[2.65] object-contain"
                  sizes="28px"
                  priority
                />
              </span>
              <span className={cn("truncate text-[14px] font-extrabold leading-none", tk.brand)}>
                Center Quest
              </span>
            </Link>
          )}

          <button
            type="button"
            onClick={toggleSidebar}
            className={cn(
              "flex h-8 w-8 shrink-0 items-center justify-center rounded-md transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/40",
              tk.toggle,
            )}
            aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            <PanelLeft className="h-4 w-4" strokeWidth={1.8} />
          </button>
        </header>

        <div className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden">
          {visibleSections.map((section, index) => (
            <React.Fragment key={section.title ?? "communications"}>
              <nav className={cn("py-3", isCollapsed ? "px-1.5" : "px-2")}>
                {section.title && !isCollapsed && (
                  <p className={cn("mb-2 px-3 text-[11px] font-bold uppercase leading-none", tk.section)}>
                    {section.title}
                  </p>
                )}

                <ul className="space-y-1">
                  {section.items.map((item) =>
                    item.children?.length ? renderGroup(item) : renderNavItem(item),
                  )}
                </ul>
              </nav>

              {index < visibleSections.length - 1 && (
                <div className={cn("mx-4 h-px", tk.divider)} />
              )}
            </React.Fragment>
          ))}
        </div>
      </SidebarContent>

      <SidebarRail />
    </Sidebar>
  );
}
