"use client";

import * as React from "react";
import {
  BarChart3,
  Building2,
  ChevronDown,
  ChevronRight,
  CircleUser,
  LayoutDashboard,
  Megaphone,
  PanelLeft,
  Phone,
  PhoneCall,
  Radio,
  User,
  Users,
  type LucideIcon,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

import { CenterQuestMark } from "@/components/layout/center-quest-mark";
import { useRole } from "@/components/providers/role-provider";
import {
  Sidebar,
  SidebarContent,
  SidebarRail,
  useSidebar,
} from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";

const ICON_SIZE = 16;
const ICON_STROKE = 2;

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
      { title: "Aircall", url: "/aircall", icon: Radio },
    ],
  },
  {
    title: "OPERATIONS",
    items: [
      { title: "Dashboard", url: "/dashboard", icon: LayoutDashboard },
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
        icon: Building2,
        children: [
          { title: "Yards", url: "/yards", icon: Building2 },
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
      { title: "Users", url: "/users", icon: Users, adminOnly: true },
      { title: "Phone Lines", url: "/phone-lines", icon: Phone, adminOnly: true },
      { title: "Profile", url: "/profile", icon: CircleUser },
    ],
  },
];

function NavIcon({
  icon: Icon,
  active,
  className,
}: {
  icon: LucideIcon;
  active?: boolean;
  className?: string;
}) {
  return (
    <Icon
      size={ICON_SIZE}
      strokeWidth={ICON_STROKE}
      className={cn("shrink-0", className)}
      aria-hidden
    />
  );
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const pathname = usePathname();
  const { role } = useRole();
  const { state, toggleSidebar } = useSidebar();

  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({});

  const isCollapsed = state === "collapsed";
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

  const itemBase =
    "flex h-9 w-full items-center rounded-md text-[13px] font-medium leading-none antialiased transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/35";

  const itemIdle = "text-slate-700 hover:bg-slate-50 hover:text-slate-900";
  const itemActive =
    "border border-emerald-200/80 bg-emerald-50 text-slate-900 shadow-none";
  const iconIdle = "text-slate-500";
  const iconActive = "text-emerald-700";
  const sectionLabel =
    "mb-2.5 px-3 text-[10.5px] font-semibold uppercase leading-none tracking-[0.1em] text-slate-400 antialiased";

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
            itemBase,
            isCollapsed ? "justify-center px-0" : child ? "gap-2.5 px-3" : "gap-3 px-3",
            child && !isCollapsed && "pl-10 text-[12.5px] font-normal",
            active ? itemActive : child ? "text-slate-600 hover:bg-slate-50" : itemIdle,
          )}
        >
          <NavIcon
            icon={Icon}
            active={active}
            className={active ? iconActive : iconIdle}
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
            itemBase,
            isCollapsed ? "justify-center px-0" : "gap-3 px-3",
            active ? itemActive : itemIdle,
          )}
        >
          <NavIcon icon={Icon} active={active} className={active ? iconActive : iconIdle} />
          {!isCollapsed && (
            <>
              <span className="min-w-0 flex-1 truncate text-left">{item.title}</span>
              <span className="flex h-4 w-4 shrink-0 items-center justify-center">
                {isOpen ? (
                  <ChevronDown
                    size={ICON_SIZE}
                    strokeWidth={ICON_STROKE}
                    className={active ? iconActive : iconIdle}
                  />
                ) : (
                  <ChevronRight
                    size={ICON_SIZE}
                    strokeWidth={ICON_STROKE}
                    className={active ? iconActive : iconIdle}
                  />
                )}
              </span>
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
      className="border-r border-slate-200 bg-white transition-colors duration-200 [&_[data-slot=sidebar-inner]]:bg-white"
      {...props}
    >
      <SidebarContent className="flex h-full flex-col gap-0 overflow-hidden bg-white p-0 font-sans antialiased">
        <header
          className={cn(
            "flex h-[3.25rem] shrink-0 items-center border-b border-slate-200 transition-all duration-200",
            isCollapsed ? "justify-center px-2" : "justify-between gap-2 px-3.5",
          )}
        >
          {!isCollapsed && (
            <Link
              href="/dashboard"
              className="flex min-w-0 items-center gap-2.5 rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/35"
            >
              <CenterQuestMark size={28} />
              <span className="truncate text-[15px] font-bold tracking-[-0.01em] text-slate-900">
                Center Quest
              </span>
            </Link>
          )}

          <button
            type="button"
            onClick={toggleSidebar}
            className={cn(
              "flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-slate-500 transition-colors duration-150 hover:bg-slate-50 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/35",
              isCollapsed && "mx-auto",
            )}
            aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            <PanelLeft size={ICON_SIZE} strokeWidth={ICON_STROKE} />
          </button>
        </header>

        <div className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden">
          {visibleSections.map((section, index) => (
            <React.Fragment key={section.title ?? "communications"}>
              <nav className={cn("py-3.5", isCollapsed ? "px-1.5" : "px-2")}>
                {section.title && !isCollapsed && (
                  <p className={sectionLabel}>{section.title}</p>
                )}

                <ul className="space-y-0.5">
                  {section.items.map((item) =>
                    item.children?.length ? renderGroup(item) : renderNavItem(item),
                  )}
                </ul>
              </nav>

              {index < visibleSections.length - 1 && (
                <div role="presentation" className="mx-3 h-px bg-slate-200" />
              )}
            </React.Fragment>
          ))}
        </div>
      </SidebarContent>

      <SidebarRail />
    </Sidebar>
  );
}
