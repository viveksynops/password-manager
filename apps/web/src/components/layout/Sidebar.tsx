"use client";

import React, { useTransition } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Shield,
  LayoutDashboard,
  Building2,
  FolderLock,
  Users,
  ScrollText,
  LogOut,
  Loader2,
  LucideIcon,
} from "lucide-react";
import {
  Sidebar as ShadcnSidebar,
  SidebarHeader,
  SidebarContent,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarFooter,
  SidebarRail,
} from "@/components/ui/sidebar";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { logoutAction } from "@/actions/auth.actions";
import { UserRole } from "@/types/database.types";

interface NavItem {
  title: string;
  url: string;
  icon: LucideIcon;
  allowedRoles?: UserRole[];
}

const NAV_ITEMS: NavItem[] = [
  {
    title: "Overview",
    url: "/",
    icon: LayoutDashboard,
  },
  {
    title: "Clients",
    url: "/clients",
    icon: Building2,
  },
  {
    title: "Projects",
    url: "/projects",
    icon: FolderLock,
  },
  {
    title: "Team",
    url: "/team",
    icon: Users,
    allowedRoles: ["admin"],
  },
  {
    title: "Audit Logs",
    url: "/audit-logs",
    icon: ScrollText,
    allowedRoles: ["admin"],
  },
];

interface SidebarProps {
  user: {
    email: string;
    fullName: string | null;
    role: UserRole;
  };
}

export function Sidebar({ user }: SidebarProps) {
  const pathname = usePathname();
  const [isLoggingOut, startTransition] = useTransition();

  const handleLogout = () => {
    startTransition(async () => {
      await logoutAction();
    });
  };

  const filteredNavItems = NAV_ITEMS.filter((item) => {
    if (!item.allowedRoles) return true;
    return item.allowedRoles.includes(user.role);
  });

  const roleBadgeVariant =
    user.role === "admin"
      ? "default"
      : user.role === "manager"
      ? "secondary"
      : "outline";

  const userInitials = (user.fullName || user.email)
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <ShadcnSidebar collapsible="icon">
      {/* Brand Header */}
      <SidebarHeader className="border-b border-sidebar-border">
        <div className="flex items-center gap-3 px-2 py-1.5">
          <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-sm">
            <Shield className="size-4" />
          </div>
          <div className="grid flex-1 text-left text-sm leading-tight group-data-[collapsible=icon]:hidden">
            <span className="truncate font-semibold text-sidebar-foreground">
              Company Vault
            </span>
            <span className="truncate text-xs text-muted-foreground">
              Secrets Manager
            </span>
          </div>
        </div>
      </SidebarHeader>

      {/* Main Nav Content */}
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="group-data-[collapsible=icon]:hidden">
            Navigation
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {filteredNavItems.map((item) => {
                const Icon = item.icon;
                const isActive =
                  item.url === "/"
                    ? pathname === "/"
                    : pathname.startsWith(item.url);

                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      render={<Link href={item.url} />}
                      isActive={isActive}
                      tooltip={item.title}
                    >
                      <Icon className="size-4 shrink-0" />
                      <span>{item.title}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      {/* Footer Profile & Logout */}
      <SidebarFooter className="border-t border-sidebar-border p-2">
        <div className="flex flex-col gap-2 p-1">
          <div className="flex items-center gap-2 group-data-[collapsible=icon]:hidden">
            <Avatar size="sm">
              <AvatarFallback className="text-[10px] font-semibold">
                {userInitials}
              </AvatarFallback>
            </Avatar>
            <div className="grid flex-1 text-left text-xs leading-tight mr-1 truncate">
              <span className="truncate font-medium text-sidebar-foreground">
                {user.fullName || user.email.split("@")[0]}
              </span>
              <span className="truncate text-[11px] text-muted-foreground">
                {user.email}
              </span>
            </div>
            <Badge
              variant={roleBadgeVariant}
              className="capitalize text-[10px] px-1.5 py-0 shrink-0 font-medium"
            >
              {user.role}
            </Badge>
          </div>

          <Button
            variant="outline"
            size="sm"
            className="w-full justify-center group-data-[collapsible=icon]:px-0 text-xs text-muted-foreground hover:text-destructive hover:border-destructive/40 transition-colors"
            onClick={handleLogout}
            disabled={isLoggingOut}
            aria-label="Log Out"
          >
            {isLoggingOut ? (
              <Loader2 className="size-3.5 animate-spin" />
            ) : (
              <LogOut className="size-3.5" />
            )}
            <span className="ml-2 group-data-[collapsible=icon]:hidden">
              {isLoggingOut ? "Signing out..." : "Log Out"}
            </span>
          </Button>
        </div>
      </SidebarFooter>

      {/* Interactive collapse rail */}
      <SidebarRail />
    </ShadcnSidebar>
  );
}
