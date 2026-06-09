"use client";

import * as React from "react";
import {
  BarChart3,
  Bell,
  Building2,
  ChevronDown,
  CircleUser,
  Code2,
  Headset,
  LayoutDashboard,
  Megaphone,
  PanelLeftClose,
  PanelLeftOpen,
  Phone,
  PhoneCall,
  Radio,
  Settings,
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
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

const ICON_SIZE = 15;
const ICON_STROKE = 2;

type NavChild = {
  title: string;
  url: string;
  icon?: LucideIcon;
  adminOnly?: boolean;
  devOnly?: boolean;
};

type NavItem = {
  title: string;
  url?: string;
  icon: LucideIcon;
  adminOnly?: boolean;
  devOnly?: boolean;
  children?: NavChild[];
};

type NavSection = {
  title: string;
  items: NavItem[];
};

const sections: NavSection[] = [
  {
    title: "Aircall",
    items: [
      { title: "Aircall", url: "/aircall", icon: Radio },
      {
        title: "Incoming Lab",
        url: "/incoming-call-lab",
        icon: Code2,
        devOnly: true,
      },
    ],
  },
  {
    title: "Operations",
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
    ],
  },
  {
    title: "Communications",
    items: [
      { title: "Contact Center", url: "/calls", icon: Headset },
    ],
  },
  {
    title: "Management",
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
      { title: "Landlords", url: "/landlords", icon: User },
    ],
  },
  {
    title: "Notifications",
    items: [
      { title: "Notifications", url: "/audit/notifications", icon: Bell },
    ],
  },
  {
    title: "Configuration",
    items: [
      {
        title: "Settings",
        url: "/settings",
        icon: Settings,
        adminOnly: true,
      },
    ],
  },
  {
    title: "Directory",
    items: [
      { title: "Customers", url: "/customers", icon: Users },
      { title: "Users", url: "/users", icon: Users, adminOnly: true },
      {
        title: "Phone Lines",
        url: "/phone-lines",
        icon: Phone,
        adminOnly: true,
      },
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
      className={cn(
        "shrink-0 transition-colors",
        active ? "text-[#008f68] dark:text-emerald-400" : "text-slate-400",
        className,
      )}
      aria-hidden
    />
  );
}

function CollapsedTooltip({
  label,
  children,
}: {
  label: string;
  children: React.ReactElement;
}) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>{children}</TooltipTrigger>
      <TooltipContent side="right" className="text-xs font-medium">
        {label}
      </TooltipContent>
    </Tooltip>
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
  const isDev = normalizedRole === "dev";

  const visibleSections = useMemo(
    () =>
      sections
        .map((section) => ({
          ...section,
          items: section.items
            .filter((item) => !(item.adminOnly && isAgent))
            .filter((item) => !(item.devOnly && !isDev))
            .map((item) => ({
              ...item,
              url:
                item.title === "Dashboard" && isAgent
                  ? "/agent-dashboard"
                  : item.url,
              children: item.children?.filter(
                (child) => !(child.adminOnly && isAgent),
              ).filter((child) => !(child.devOnly && !isDev)),
            }))
            .filter(
              (item) =>
                item.url ||
                item.children === undefined ||
                item.children.length > 0,
            ),
        }))
        .filter((section) => section.items.length > 0),
    [isAgent, isDev],
  );

  const isActive = (url?: string) =>
    Boolean(url && (pathname === url || pathname.startsWith(`${url}/`)));

  const groupIsActive = (item: NavItem) =>
    isActive(item.url) ||
    Boolean(item.children?.some((child) => isActive(child.url)));

  const toggleGroup = (key: string) => {
    if (isCollapsed) {
      toggleSidebar();
      setOpenGroups((current) => ({ ...current, [key]: true }));
      return;
    }
    setOpenGroups((current) => ({ ...current, [key]: !current[key] }));
  };

  useEffect(() => {
    const next: Record<string, boolean> = {};
    for (const section of visibleSections) {
      for (const item of section.items) {
        if (item.children?.some((child) => isActive(child.url))) {
          next[item.title] = true;
        }
      }
    }
    setOpenGroups((current) => ({ ...current, ...next }));
  }, [pathname, visibleSections]);

  const itemBase = cn(
    "group flex w-full items-center rounded-lg text-[12px] font-medium leading-5 antialiased transition-all duration-150",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#008f68]/25",
  );

  const itemSize = isCollapsed
    ? "h-9 w-9 justify-center px-0"
    : "h-8 w-full gap-2.5 px-2.5";

  const itemActive =
    "bg-[#f0faf5] font-semibold text-[#008f68] shadow-[0_1px_2px_rgba(0,143,104,0.08)] ring-1 ring-[#008f68]/15 dark:bg-emerald-500/10 dark:text-emerald-400 dark:ring-emerald-500/20";

  const itemIdle =
    "text-slate-600 hover:bg-slate-50 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800/60 dark:hover:text-slate-100";

  const sectionLabel =
    "mb-1.5 px-1 text-[10px] font-semibold uppercase tracking-widest text-slate-400 dark:text-slate-500";

  const wrapCollapsed = (label: string, node: React.ReactElement) =>
    isCollapsed ? (
      <CollapsedTooltip label={label}>{node}</CollapsedTooltip>
    ) : (
      node
    );

  const renderNavItem = (item: NavItem | NavChild, child = false) => {
    if (!item.url) return null;

    const Icon = item.icon ?? PhoneCall;
    const active = isActive(item.url);

    const link = (
      <Link
        href={item.url}
        aria-current={active ? "page" : undefined}
        className={cn(
          itemBase,
          itemSize,
          child && !isCollapsed && "h-7 pl-8 text-[11.5px] font-normal",
          active ? itemActive : itemIdle,
        )}
      >
        <NavIcon icon={Icon} active={active} />
        {!isCollapsed && <span className="truncate">{item.title}</span>}
      </Link>
    );

    return (
      <li key={`${item.title}-${item.url}`}>
        {wrapCollapsed(item.title, link)}
      </li>
    );
  };

  const renderGroup = (item: NavItem) => {
    const Icon = item.icon;
    const active = groupIsActive(item);
    const isOpen =
      openGroups[item.title] ??
      Boolean(item.children?.some((child) => isActive(child.url)));

    const button = (
      <button
        type="button"
        onClick={() => toggleGroup(item.title)}
        aria-expanded={isOpen}
        className={cn(itemBase, itemSize, active ? itemActive : itemIdle)}
      >
        <NavIcon icon={Icon} active={active} />
        {!isCollapsed && (
          <>
            <span className="min-w-0 flex-1 truncate text-left">
              {item.title}
            </span>
            <ChevronDown
              size={14}
              strokeWidth={ICON_STROKE}
              className={cn(
                "shrink-0 text-slate-400 transition-transform duration-200",
                isOpen && "rotate-180",
                active && "text-[#008f68]",
              )}
            />
          </>
        )}
      </button>
    );

    return (
      <li key={item.title}>
        {wrapCollapsed(item.title, button)}
        {!isCollapsed && isOpen && item.children && (
          <ul className="mt-0.5 space-y-0.5 border-l border-slate-100 pl-1.5 ml-3 dark:border-slate-800">
            {item.children.map((child) => renderNavItem(child, true))}
          </ul>
        )}
      </li>
    );
  };

  return (
    <Sidebar
      collapsible="icon"
      className={cn(
        "border-r border-slate-200/80 bg-[#f4f5f7] transition-colors duration-200",
        "dark:border-slate-800 dark:bg-slate-950",
        "[&_[data-slot=sidebar-inner]]:bg-[#f4f5f7] dark:[&_[data-slot=sidebar-inner]]:bg-slate-950",
      )}
      {...props}
    >
      <SidebarContent className="flex h-full flex-col gap-2 overflow-hidden bg-transparent p-2 font-sans antialiased">
        <header
          className={cn(
            "flex shrink-0 items-center rounded-xl border border-slate-200/80 bg-white shadow-sm transition-all duration-200",
            "dark:border-slate-800 dark:bg-slate-950",
            isCollapsed
              ? "h-auto flex-col justify-center gap-0 px-0 py-2"
              : "h-[3.25rem] justify-between gap-2 px-2.5",
          )}
        >
          {!isCollapsed && (
            <Link
              href="/dashboard"
              className="flex min-w-0 items-center gap-2 rounded-lg px-1 py-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#008f68]/25"
            >
              <CenterQuestMark size={26} />
              <span
                className="hidden size-7 shrink-0 items-center justify-center rounded-lg bg-[#008f68] text-[11px] font-bold text-white dark:inline-flex"
                aria-hidden
              >
                CQ
              </span>
              <span className="truncate text-[14px] font-bold tracking-tight text-slate-900 dark:text-slate-100">
                Center Quest
              </span>
            </Link>
          )}

          {isCollapsed && (
            <Link
              href="/dashboard"
              className="flex items-center justify-center rounded-lg p-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#008f68]/25"
              title="Center Quest"
            >
              <CenterQuestMark size={24} />
              <span className="hidden size-7 items-center justify-center rounded-lg bg-[#008f68] text-[10px] font-bold text-white dark:inline-flex">
                CQ
              </span>
            </Link>
          )}

          <button
            type="button"
            onClick={toggleSidebar}
            className={cn(
              "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-slate-500 transition-colors",
              "hover:bg-slate-100 hover:text-slate-800 dark:hover:bg-slate-800 dark:hover:text-slate-200",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#008f68]/25",
            )}
            aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {isCollapsed ? (
              <PanelLeftOpen size={ICON_SIZE} strokeWidth={ICON_STROKE} />
            ) : (
              <PanelLeftClose size={ICON_SIZE} strokeWidth={ICON_STROKE} />
            )}
          </button>
        </header>

        <div className="scrollbar-app min-h-0 flex-1 space-y-2 overflow-y-auto overflow-x-hidden pb-1">
          {isCollapsed ? (
            <section className="rounded-xl border border-slate-200/80 bg-white px-1 py-1.5 shadow-[0_1px_2px_rgba(0,0,0,0.04)] dark:border-slate-800 dark:bg-slate-950">
              <ul className="flex flex-col items-center space-y-0.5">
                {visibleSections.flatMap((section) =>
                  section.items.map((item) =>
                    item.children?.length
                      ? renderGroup(item)
                      : renderNavItem(item),
                  ),
                )}
              </ul>
            </section>
          ) : (
            visibleSections.map((section) => (
              <section
                key={section.title}
                className="rounded-xl border border-slate-200/80 bg-white px-2 py-2 shadow-[0_1px_2px_rgba(0,0,0,0.04)] dark:border-slate-800 dark:bg-slate-950"
              >
                <p className={sectionLabel}>{section.title}</p>
                <ul className="space-y-0.5">
                  {section.items.map((item) =>
                    item.children?.length
                      ? renderGroup(item)
                      : renderNavItem(item),
                  )}
                </ul>
              </section>
            ))
          )}
        </div>
      </SidebarContent>

      <SidebarRail />
    </Sidebar>
  );
}
