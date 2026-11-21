"use client";

import React from "react";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Breadcrumbs } from "./Breadcrumbs";
import { UserRole } from "@/types/database.types";
import { Badge } from "@/components/ui/badge";
import { GlobalSearchButton } from "@/components/global-search-button";

interface HeaderProps {
  user: {
    email: string;
    fullName: string | null;
    role: UserRole;
  };
}

export function Header({ user }: HeaderProps) {
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
    <header className="sticky top-0 z-40 flex h-16 shrink-0 items-center justify-between gap-3 border-b bg-background/95 px-4 backdrop-blur transition-[width,height] ease-linear w-full max-w-full">
      <div className="flex items-center gap-2 min-w-0 overflow-hidden">
        {/* Built-in shadcn SidebarTrigger handles both desktop collapse and mobile sheet toggle */}
        <SidebarTrigger className="-ml-1 shrink-0" />
        <Separator orientation="vertical" className="mr-2 h-4 shrink-0" />
        <Breadcrumbs />
      </div>

      <div className="flex items-center gap-3 shrink-0">
        <GlobalSearchButton />
        <Badge
          variant={roleBadgeVariant}
          className="hidden sm:inline-flex capitalize text-xs font-normal"
        >
          {user.role}
        </Badge>
        <Avatar size="sm">
          <AvatarFallback className="text-[10px] font-semibold">
            {userInitials}
          </AvatarFallback>
        </Avatar>
      </div>
    </header>
  );
}
