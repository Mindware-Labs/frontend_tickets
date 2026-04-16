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

// User Mock Data
const user = {
  name: "Gerald Luciano",
  email: "gerald@example.com",
  avatar: "/avatars/shadcn.jpg",
};

// Navigation Data
const data = {
  navMain: [
    {
      title: "Dashboard",
      url: "/dashboard",
      icon: LayoutDashboard,
      items: [],
    },
    {
      title: "Calls",
      url: "/tickets",
      icon: PhoneCall,
      items: [],
    },
    /*{
      title: "Aircall",
      url: "/aircall-test",
      icon: PhoneCall,
      items: [],
    },*/
    {
      title: "Yards",
      url: "/yards",
      icon: Building,
      items: [
        {
          title: "All Yards",
          url: "/yards",
        },
        {
          title: "Reports",
          url: "/reports/yards",
        },
      ],
    },
    {
      title: "Landlords",
      url: "/landlords",
      icon: User,
      items: [
        {
          title: "All Landlords",
          url: "/landlords",
        },
        {
          title: "Reports",
          url: "/reports/landlords",
        },
      ],
    },
    {
      title: "Campaigns",
      url: "/campaigns",
      icon: Megaphone,
      items: [
        {
          title: "All Campaigns",
          url: "/campaigns",
        },
        {
          title: "Reports",
          url: "/reports/campaigns",
        },
      ],
    },
    {
      title: "Knowledge",
      url: "/knowledge",
      icon: BookOpen,
      items: [
        {
          title: "Rig Hut Policies",
          url: "/Knowledge/policies",
        },
        {
          title: "Guides",
          url: "/Knowledge/Guides",
        },
      ],
    },
    {
      title: "Reports",
      url: "/reports",
      icon: BarChart3,
      items: [
        {
          title: "Performance",
          url: "/reports/performance",
        },
        {
          title: "Agent Stats",
          url: "/reports/agents",
        },
      ],
    },
  ],
  navSecondary: [
    {
      title: "Support",
      url: "/support",
      icon: LifeBuoy,
    },
  ],
  projects: [
    {
      name: "Call Center",
      url: "#",
      icon: PhoneCall,
    },
    {
      name: "Sales Team",
      url: "#",
      icon: PieChart,
    },
    {
      name: "Support Team",
      url: "#",
      icon: Map,
    },
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

  // Detectar tema actual - defaults to "dark" on SSR
  const currentTheme = mounted ? resolvedTheme || theme || "dark" : "dark";
  const isDarkMode = currentTheme === "dark";

  // Filtrar navegación para agentes
  const normalizedRole = role?.toString().toLowerCase();
  const filteredNavMain =
    normalizedRole === "agent"
      ? data.navMain
          .filter((item) => item.title !== "Reports")
          .map((item) => {
            if (item.title === "Dashboard") {
              return { ...item, url: "/agent-dashboard" };
            }
            if (
              item.title === "Landlords" ||
              item.title === "Campaigns" ||
              item.title === "Yards"
            ) {
              return { ...item, items: [] };
            }
            return item;
          })
      : data.navMain;

  // Helper to check if a group is active
  const isGroupActive = (item: any) => {
    if (pathname === item.url) return true;
    if (
      item.items?.some(
        (sub: any) => pathname === sub.url || pathname.startsWith(sub.url),
      )
    )
      return true;
    return false;
  };

  // Funciones para obtener colores dinámicos
  const getSidebarBg = () => {
    return isDarkMode
      ? "bg-gray-900" // Dark mode
      : "bg-white"; // Light mode
  };

  const getTextColor = () => {
    return isDarkMode ? "text-gray-100" : "text-gray-900";
  };

  const getMutedTextColor = () => {
    return isDarkMode ? "text-gray-400" : "text-gray-600";
  };

  const getBorderColor = () => {
    return isDarkMode ? "border-gray-800" : "border-gray-200";
  };

  const getHoverColor = () => {
    return isDarkMode ? "hover:bg-gray-800" : "hover:bg-gray-100";
  };

  const getIconColor = () => {
    return isDarkMode ? "text-gray-300" : "text-gray-700";
  };

  const getSeparatorColor = () => {
    return isDarkMode ? "bg-gray-800" : "bg-gray-200";
  };

  return (
    <Sidebar
      collapsible="icon"
      className={`${getSidebarBg()} ${getTextColor()} border-r ${getBorderColor()} transition-colors duration-300`}
      {...props}
    >
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <Link href="/dashboard" className="relative overflow-hidden">
                {/* Subtle background effect */}
                <div className="absolute inset-0 bg-linear-to-r from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

                {/* Image logo */}
                <div
                  className={`flex aspect-square size-12 items-center justify-center rounded-lg border backdrop-blur-sm overflow-hidden ${
                    isDarkMode
                      ? "bg-linear-to-br from-primary/20 to-primary/10 border-primary/20"
                      : "bg-linear-to-br from-primary/10 to-primary/5 border-primary/10"
                  }`}
                >
                  <div className="relative w-full h-full">
                    <Image
                      src="/images/LOGO CQ-10.png"
                      alt="Center Quest Logo"
                      fill
                      className="object-contain scale-210"
                      sizes="40px"
                      priority
                    />
                  </div>
                </div>

                {state === "collapsed" ? (
                  <div className="flex flex-1 items-center justify-start relative z-10">
                    <Image
                      src="/images/LOGO CQ-10.png"
                      alt="Center Quest"
                      width={110}
                      height={28}
                      className="object-contain"
                    />
                  </div>
                ) : (
                  <div className="grid flex-1 text-left text-sm leading-tight relative z-10">
                    <div className="flex items-center gap-2">
                      <span className={`truncate font-bold ${getTextColor()}`}>
                        Center Quest
                      </span>
                      <div
                        className={`h-1.5 w-1.5 rounded-full ${
                          isDarkMode ? "bg-green-400" : "bg-green-600"
                        } animate-pulse`}
                      />
                    </div>
                    <span
                      className={`truncate text-xs ${getMutedTextColor()} mt-0.5`}
                    >
                      Tickets System
                    </span>
                  </div>
                )}
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        {/* Main Navigation */}
        <SidebarGroup>
          <SidebarMenu>
            {filteredNavMain.map((item) => {
              if (!item.items?.length) {
                const active = pathname === item.url;
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      asChild
                      tooltip={item.title}
                      isActive={active}
                      className={`data-[active=true]:bg-primary/10 data-[active=true]:text-primary ${getHoverColor()} relative overflow-hidden transition-all duration-200`}
                    >
                      <Link href={item.url}>
                        {active && (
                          <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary rounded-r-full" />
                        )}
                        {item.icon && (
                          <item.icon className={`${getIconColor()} stroke-2`} />
                        )}
                        <span className={getTextColor()}>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              }
              if (item.title === "Dashboard") {
                const active = pathname === item.url;
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      asChild
                      tooltip={item.title}
                      isActive={active}
                      className={`data-[active=true]:bg-primary/10 data-[active=true]:text-primary ${getHoverColor()} relative overflow-hidden transition-all duration-200`}
                    >
                      <Link href={item.url}>
                        {active && (
                          <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary rounded-r-full" />
                        )}
                        {item.icon && (
                          <item.icon className={`${getIconColor()} stroke-2`} />
                        )}
                        <span className={getTextColor()}>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              }
              // Everything else (collapsible)
              const active = isGroupActive(item);
              return (
                <Collapsible
                  key={item.title}
                  asChild
                  className="group/collapsible"
                >
                  <SidebarMenuItem>
                    <CollapsibleTrigger asChild>
                      <SidebarMenuButton
                        tooltip={item.title}
                        isActive={active}
                        className={`data-[active=true]:bg-primary/10 data-[active=true]:text-primary ${getHoverColor()} relative overflow-hidden transition-all duration-200`}
                      >
                        {active && (
                          <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary rounded-r-full" />
                        )}
                        {item.icon && (
                          <item.icon className={`${getIconColor()} stroke-2`} />
                        )}
                        <span className={getTextColor()}>{item.title}</span>
                        <ChevronRight
                          className={`ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90 ${getIconColor()} stroke-2`}
                        />
                      </SidebarMenuButton>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <SidebarMenuSub>
                        {item.items?.map((subItem) => (
                          <SidebarMenuSubItem key={subItem.title}>
                            <SidebarMenuSubButton
                              asChild
                              isActive={pathname === subItem.url}
                              className={`data-[active=true]:text-primary ${getHoverColor()}`}
                            >
                              <Link href={subItem.url}>
                                <span className={getTextColor()}>
                                  {subItem.title}
                                </span>
                              </Link>
                            </SidebarMenuSubButton>
                          </SidebarMenuSubItem>
                        ))}
                      </SidebarMenuSub>
                    </CollapsibleContent>
                  </SidebarMenuItem>
                </Collapsible>
              );
            })}
          </SidebarMenu>
        </SidebarGroup>

        {/* Core Sections (Management) */}
        <SidebarGroup>
          <SidebarGroupLabel className={getMutedTextColor()}>
            Management
          </SidebarGroupLabel>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton
                asChild
                tooltip="Customers"
                isActive={pathname.startsWith("/customers")}
                className={`data-[active=true]:bg-primary/10 data-[active=true]:text-primary ${getHoverColor()} relative`}
              >
                <Link href="/customers">
                  {pathname.startsWith("/customers") && (
                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary rounded-r-full" />
                  )}
                  <Users className={`${getIconColor()} stroke-2`} />
                  <span className={getTextColor()}>Customer Management</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
            {normalizedRole !== "agent" && (
              <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  tooltip="Users"
                  isActive={pathname.startsWith("/users")}
                  className={`data-[active=true]:bg-primary/10 data-[active=true]:text-primary ${getHoverColor()} relative`}
                >
                  <Link href="/users">
                    {pathname.startsWith("/users") && (
                      <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary rounded-r-full" />
                    )}
                    <Users className={`${getIconColor()} stroke-2`} />
                    <span className={getTextColor()}>User Management</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            )}
            {normalizedRole !== "agent" && (
              <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  tooltip="Phone Lines"
                  isActive={pathname.startsWith("/phone-lines")}
                  className={`data-[active=true]:bg-primary/10 data-[active=true]:text-primary ${getHoverColor()} relative`}
                >
                  <Link href="/phone-lines">
                    {pathname.startsWith("/phone-lines") && (
                      <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary rounded-r-full" />
                    )}
                    <Phone className={`${getIconColor()} stroke-2`} />
                    <span className={getTextColor()}>Phone Lines</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            )}
            <SidebarMenuItem>
              <SidebarMenuButton
                asChild
                tooltip="Profile"
                isActive={pathname.startsWith("/profile")}
                className={`data-[active=true]:bg-primary/10 data-[active=true]:text-primary ${getHoverColor()} relative`}
              >
                <Link href="/profile">
                  {pathname.startsWith("/profile") && (
                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary rounded-r-full" />
                  )}
                  <UserCircle className={`${getIconColor()} stroke-2`} />
                  <span className={getTextColor()}>Profile</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroup>

        {/* Secondary (Support) */}
        <SidebarGroup className="mt-auto">
          <SidebarGroupContent>
            <SidebarMenu>
              {data.navSecondary.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    asChild
                    size="sm"
                    className={getHoverColor()}
                  >
                    <Link href={item.url}>
                      <item.icon className={`${getIconColor()} stroke-2`} />
                      <span className={getTextColor()}>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}

              {/* Separator - only show when expanded */}
              {state === "expanded" && (
                <>
                  <SidebarSeparator className={`my-2 ${getSeparatorColor()}`} />

                  {/* Copyright footer - only show when expanded */}
                  <div className="px-2 py-3">
                    <footer
                      className={`text-xs text-center space-y-1 ${getMutedTextColor()}`}
                    >
                      <div>© {new Date().getFullYear()} Mindware Labs.</div>
                      <div>All Rights Reserved</div>
                    </footer>
                  </div>
                </>
              )}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarRail />
    </Sidebar>
  );
}
