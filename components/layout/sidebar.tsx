"use client";

import * as React from "react";
import {
  BookOpen,
  LifeBuoy,
  Map,
  PieChart,
  LayoutDashboard,
  Megaphone,
  Users,
  BarChart3,
  PhoneCall,
  ChevronRight,
  User,
  UserCircle,
  Building,
  Phone,
  ChevronsUpDown,
} from "lucide-react";
import { usePathname } from "next/navigation";
import { useRole } from "@/components/providers/role-provider";

import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarRail,
  SidebarSeparator,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
  useSidebar,
} from "@/components/ui/sidebar";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import Image from "next/image";
import Link from "next/link";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";


// Navigation Data
const data = {
  navMain: [
    {
      title: "Aircall",
      url: "/aircall",
      icon: PhoneCall,
      items: [],
    },
    {
      title: "Dashboard",
      url: "/dashboard",
      icon: LayoutDashboard,
      items: [],
    },
    {
      title: "Calls & Tickets",
      url: "/calls",
      icon: PhoneCall,
      items: [],
    },
    {
      title: "Yards",
      url: "/yards",
      icon: Building,
      items: [
        { title: "All Yards", url: "/yards" },
        { title: "Reports", url: "/reports/yards" },
      ],
    },
    {
      title: "Landlords",
      url: "/landlords",
      icon: User,
      items: [
        { title: "All Landlords", url: "/landlords" },
        { title: "Reports", url: "/reports/landlords" },
      ],
    },
    {
      title: "Campaigns",
      url: "/campaigns",
      icon: Megaphone,
      items: [
        { title: "All Campaigns", url: "/campaigns" },
        { title: "Reports", url: "/reports/campaigns" },
      ],
    },
    {
      title: "Knowledge",
      url: "/knowledge",
      icon: BookOpen,
      items: [
        { title: "Rig Hut Policies", url: "/Knowledge/policies" },
        { title: "Guides", url: "/Knowledge/Guides" },
      ],
    },
    {
      title: "Reports",
      url: "/reports",
      icon: BarChart3,
      items: [
        { title: "Performance", url: "/reports/performance" },
        { title: "Agent Stats", url: "/reports/agents" },
      ],
    },
  ],
  navSecondary: [
    { title: "Support", url: "/support", icon: LifeBuoy },
  ],
  projects: [
    { name: "Call Center", url: "#", icon: PhoneCall },
    { name: "Sales Team", url: "#", icon: PieChart },
    { name: "Support Team", url: "#", icon: Map },
  ],
};

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const pathname = usePathname();
  const { role, setRole } = useRole();
  const { state } = useSidebar();
  const { theme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const currentTheme = mounted ? resolvedTheme || theme || "light" : "light";
  const isDark = currentTheme === "dark";

  // Filtrar navegación para agentes — sin cambios funcionales
  const normalizedRole = role?.toString().toLowerCase();
  const filteredNavMain =
    normalizedRole === "agent"
      ? data.navMain
          .filter((item) => item.title !== "Reports")
          .map((item) => {
            if (item.title === "Dashboard") return { ...item, url: "/agent-dashboard" };
            if (["Landlords", "Campaigns", "Yards"].includes(item.title))
              return { ...item, items: [] };
            return item;
          })
      : data.navMain;

  const isGroupActive = (item: any) => {
    if (pathname === item.url) return true;
    if (item.items?.some((sub: any) => pathname === sub.url || pathname.startsWith(sub.url)))
      return true;
    return false;
  };

  // ── Design tokens (light / dark)
  const t = {
    sidebar:     isDark ? "bg-gray-950 border-gray-800" : "bg-white border-slate-200",
    header:      isDark ? "border-gray-800" : "border-slate-100",
    brand:       isDark ? "text-white" : "text-slate-900",
    sectionLbl:  isDark ? "text-gray-500" : "text-slate-400",
    link:        isDark ? "text-gray-300 hover:bg-gray-800 hover:text-white" : "text-slate-600 hover:bg-slate-100 hover:text-slate-900",
    linkActive:  isDark ? "bg-blue-500/15 text-blue-400 font-semibold" : "bg-blue-50 text-blue-700 font-semibold",
    icon:        isDark ? "text-gray-500" : "text-slate-400",
    iconActive:  isDark ? "text-blue-400" : "text-blue-600",
    sub:         isDark ? "text-gray-400 hover:text-white hover:bg-gray-800" : "text-slate-500 hover:text-slate-900 hover:bg-slate-50",
    subActive:   isDark ? "text-blue-400 font-medium" : "text-blue-700 font-medium",
    dot:         isDark ? "bg-emerald-400" : "bg-emerald-500",
    footer:      isDark ? "border-gray-800 bg-gray-950" : "border-slate-100 bg-white",
    footerBtn:   isDark ? "hover:bg-gray-800" : "hover:bg-slate-50",
    footerName:  isDark ? "text-gray-200" : "text-slate-800",
    footerEmail: isDark ? "text-gray-500" : "text-slate-500",
    separator:   isDark ? "bg-gray-800" : "bg-slate-100",
    support:     isDark ? "text-gray-400 hover:bg-gray-800 hover:text-white" : "text-slate-500 hover:bg-slate-100 hover:text-slate-700",
    copyright:   isDark ? "text-gray-600" : "text-slate-400",
  };

  // ── Shared link class builder
  const linkCls = (active: boolean) =>
    `mx-3 px-3 py-2 flex items-center gap-3 rounded-lg mb-0.5 text-[13px] transition-colors duration-150 cursor-pointer w-[calc(100%-24px)] ${
      active ? t.linkActive : t.link
    }`;

  const iconCls = (active: boolean) =>
    `w-4 h-4 flex-shrink-0 ${active ? t.iconActive : t.icon}`;

  return (
    <Sidebar
      collapsible="icon"
      className={`border-r transition-colors duration-300 ${t.sidebar}`}
      {...props}
    >
      {/* ── HEADER ── */}
      <SidebarHeader className={`px-5 py-5 border-b ${t.header}`}>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild className="hover:bg-transparent active:bg-transparent p-0 h-auto">
              <Link href="/dashboard" className="flex items-center gap-3">
                {/* Logo mark */}
                <div className="flex-shrink-0 w-8 h-8 rounded-lg overflow-hidden border border-slate-200/60 dark:border-gray-700">
                  <div className="relative w-full h-full">
                    <Image
                      src="/images/LOGO CQ-10.png"
                      alt="Center Quest Logo"
                      fill
                      className="object-contain scale-125"
                      sizes="32px"
                      priority
                    />
                  </div>
                </div>

                {/* Brand name — hidden when collapsed */}
                {state !== "collapsed" && (
                  <div className="flex flex-col leading-tight">
                    <div className="flex items-center gap-2">
                      <span className={`text-sm font-bold ${t.brand}`}>
                        Center Quest
                      </span>
                      <span className={`w-1.5 h-1.5 rounded-full ${t.dot} animate-pulse`} />
                    </div>
                    <span className={`text-[11px] ${t.sectionLbl}`}>
                      Tickets System
                    </span>
                  </div>
                )}
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      {/* ── CONTENT ── */}
      <SidebarContent className="flex flex-col overflow-y-auto overflow-x-hidden py-3">

        {/* ── MAIN NAV ── */}
        <SidebarGroup className="p-0">
          <SidebarMenu className="p-0">
            {filteredNavMain.map((item) => {
              const active = isGroupActive(item);

              // No children → simple link
              if (!item.items?.length) {
                return (
                  <SidebarMenuItem key={item.title} className="p-0">
                    <SidebarMenuButton
                      asChild
                      tooltip={item.title}
                      isActive={active}
                      className="p-0 h-auto hover:bg-transparent active:bg-transparent border-none shadow-none bg-transparent"
                    >
                      <Link href={item.url} className={linkCls(active)}>
                        {item.icon && (
                          <item.icon className={iconCls(active)} strokeWidth={active ? 2.2 : 1.8} />
                        )}
                        <span className="font-medium">{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              }

              // Has children → collapsible
              return (
                <Collapsible
                  key={item.title}
                  asChild
                  defaultOpen={active}
                  className="group/collapsible"
                >
                  <SidebarMenuItem className="p-0">
                    <CollapsibleTrigger asChild>
                      <button className={`${linkCls(active)} justify-between`}>
                        <span className="flex items-center gap-3">
                          {item.icon && (
                            <item.icon className={iconCls(active)} strokeWidth={active ? 2.2 : 1.8} />
                          )}
                          <span className="font-medium">{item.title}</span>
                        </span>
                        <ChevronRight
                          className={`w-3.5 h-3.5 opacity-50 flex-shrink-0 transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90 ${
                            active ? t.iconActive : t.icon
                          }`}
                        />
                      </button>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <SidebarMenuSub className="ml-[2.35rem] mr-3 border-l border-slate-200/70 dark:border-gray-700/70 pl-3 py-0.5 my-0.5">
                        {item.items?.map((sub) => {
                          const subActive = pathname === sub.url;
                          return (
                            <SidebarMenuSubItem key={sub.title}>
                              <SidebarMenuSubButton
                                asChild
                                isActive={subActive}
                                className="p-0 h-auto hover:bg-transparent"
                              >
                                <Link
                                  href={sub.url}
                                  className={`flex items-center px-2 py-1.5 rounded-md text-[12.5px] transition-colors mb-0.5 ${
                                    subActive ? t.subActive : t.sub
                                  }`}
                                >
                                  {sub.title}
                                </Link>
                              </SidebarMenuSubButton>
                            </SidebarMenuSubItem>
                          );
                        })}
                      </SidebarMenuSub>
                    </CollapsibleContent>
                  </SidebarMenuItem>
                </Collapsible>
              );
            })}
          </SidebarMenu>
        </SidebarGroup>

        {/* ── MANAGEMENT SECTION ── */}
        <SidebarGroup className="p-0 mt-2">
          {state !== "collapsed" && (
            <SidebarGroupLabel
              className={`px-6 mt-4 mb-1 text-[10px] font-bold uppercase tracking-widest ${t.sectionLbl}`}
            >
              Management
            </SidebarGroupLabel>
          )}
          <SidebarGroupContent>
            <SidebarMenu className="p-0">

              <SidebarMenuItem className="p-0">
                <SidebarMenuButton
                  asChild
                  tooltip="Customers"
                  isActive={pathname.startsWith("/customers")}
                  className="p-0 h-auto hover:bg-transparent active:bg-transparent border-none shadow-none bg-transparent"
                >
                  <Link
                    href="/customers"
                    className={linkCls(pathname.startsWith("/customers"))}
                  >
                    <Users
                      className={iconCls(pathname.startsWith("/customers"))}
                      strokeWidth={pathname.startsWith("/customers") ? 2.2 : 1.8}
                    />
                    <span className="font-medium">Customer Management</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>

              {normalizedRole !== "agent" && (
                <SidebarMenuItem className="p-0">
                  <SidebarMenuButton
                    asChild
                    tooltip="Users"
                    isActive={pathname.startsWith("/users")}
                    className="p-0 h-auto hover:bg-transparent active:bg-transparent border-none shadow-none bg-transparent"
                  >
                    <Link
                      href="/users"
                      className={linkCls(pathname.startsWith("/users"))}
                    >
                      <Users
                        className={iconCls(pathname.startsWith("/users"))}
                        strokeWidth={pathname.startsWith("/users") ? 2.2 : 1.8}
                      />
                      <span className="font-medium">User Management</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              )}

              {normalizedRole !== "agent" && (
                <SidebarMenuItem className="p-0">
                  <SidebarMenuButton
                    asChild
                    tooltip="Phone Lines"
                    isActive={pathname.startsWith("/phone-lines")}
                    className="p-0 h-auto hover:bg-transparent active:bg-transparent border-none shadow-none bg-transparent"
                  >
                    <Link
                      href="/phone-lines"
                      className={linkCls(pathname.startsWith("/phone-lines"))}
                    >
                      <Phone
                        className={iconCls(pathname.startsWith("/phone-lines"))}
                        strokeWidth={pathname.startsWith("/phone-lines") ? 2.2 : 1.8}
                      />
                      <span className="font-medium">Phone Lines</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              )}

              <SidebarMenuItem className="p-0">
                <SidebarMenuButton
                  asChild
                  tooltip="Profile"
                  isActive={pathname.startsWith("/profile")}
                  className="p-0 h-auto hover:bg-transparent active:bg-transparent border-none shadow-none bg-transparent"
                >
                  <Link
                    href="/profile"
                    className={linkCls(pathname.startsWith("/profile"))}
                  >
                    <UserCircle
                      className={iconCls(pathname.startsWith("/profile"))}
                      strokeWidth={pathname.startsWith("/profile") ? 2.2 : 1.8}
                    />
                    <span className="font-medium">Profile</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>

            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* ── SUPPORT ── */}
        <SidebarGroup className="p-0 mt-auto pb-1">
          <SidebarGroupContent>
            <SidebarMenu className="p-0">
              {data.navSecondary.map((item) => (
                <SidebarMenuItem key={item.title} className="p-0">
                  <SidebarMenuButton
                    asChild
                    size="sm"
                    className="p-0 h-auto hover:bg-transparent active:bg-transparent border-none shadow-none bg-transparent"
                  >
                    <Link
                      href={item.url}
                      className={`mx-3 px-3 py-2 flex items-center gap-3 rounded-lg text-[13px] transition-colors ${t.support}`}
                    >
                      <item.icon className="w-4 h-4 flex-shrink-0" strokeWidth={1.8} />
                      <span className="font-medium">{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}

              {/* Copyright — collapsed-safe */}
              {state === "expanded" && (
                <div className={`mx-3 px-3 pt-1 pb-2 text-[11px] text-center ${t.copyright}`}>
                  © {new Date().getFullYear()} Mindware Labs. All rights reserved.
                </div>
              )}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

      </SidebarContent>


      <SidebarRail />
    </Sidebar>
  );
}