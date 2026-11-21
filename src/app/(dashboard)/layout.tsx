import React from "react";
import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { Sidebar } from "@/components/layout/Sidebar";
import { Header } from "@/components/layout/Header";

export const instant = false;

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  return (
    <SidebarProvider className="max-w-full overflow-x-hidden">
      {/* Official shadcn Sidebar (TASK-042, TASK-043, TASK-044) */}
      <Sidebar user={user} />

      {/* Official shadcn SidebarInset for main content shell */}
      <SidebarInset className="min-w-0 w-full flex-1 max-w-full overflow-x-hidden md:max-w-[calc(100vw-var(--sidebar-width))]">
        <Header user={user} />
        <main className="flex flex-1 flex-col gap-4 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto min-w-0">
          {children}
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
