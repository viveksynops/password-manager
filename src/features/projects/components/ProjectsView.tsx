"use client";

import React, { useState, useTransition, useEffect } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { PaginatedProjects } from "@/services/project.service";
import { UserRole, Client, UserProfile } from "@/types/database.types";
import { ProjectTable } from "./ProjectTable";
import { ProjectFolderGrid } from "./ProjectFolderGrid";
import { ProjectFormDialog } from "./ProjectFormDialog";
import { EmptyState } from "@/components/empty-state";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FolderLock, Plus, Search, FilterX, LayoutGrid, List, ChevronLeft, ChevronRight } from "lucide-react";
import { useProjectStore, ProjectStatusFilter, ProjectViewMode } from "../store";

interface ProjectsViewProps {
  data: PaginatedProjects;
  clients: Pick<Client, "id" | "name">[];
  users?: Pick<UserProfile, "id" | "email" | "full_name">[];
  userRole: UserRole;
}

export function ProjectsView({
  data,
  clients,
  users = [],
  userRole,
}: ProjectsViewProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const canManage = userRole === "admin" || userRole === "manager";

  // Display preference (folders vs table view) from store
  const { viewMode, setViewMode } = useProjectStore();

  // Active filters from URL search params
  const activeSearch = searchParams.get("search") || "";
  const activeStatus = (searchParams.get("status") || "active") as ProjectStatusFilter;
  const activeClient = searchParams.get("client") || "all";

  // Local search query for fluid typing
  const [searchInput, setSearchInput] = useState(activeSearch);

  useEffect(() => {
    setSearchInput(activeSearch);
  }, [activeSearch]);

  // URL query updater helper for server-side pagination & filtering
  const updateQuery = (updates: Record<string, string | number | null | undefined>) => {
    startTransition(() => {
      const nextParams = new URLSearchParams(searchParams.toString());

      for (const [key, val] of Object.entries(updates)) {
        if (val === null || val === undefined || val === "" || val === "all" || (key === "status" && val === "active")) {
          nextParams.delete(key);
        } else {
          nextParams.set(key, String(val));
        }
      }

      // If a filter is updated and not the page itself, reset page back to 1
      if (!("page" in updates)) {
        nextParams.delete("page");
      }

      const queryString = nextParams.toString();
      router.push(queryString ? `${pathname}?${queryString}` : pathname);
    });
  };

  const handleSearchSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    updateQuery({ search: searchInput.trim() || null });
  };

  const handleStatusChange = (val: string) => {
    updateQuery({ status: val });
  };

  const handleClientChange = (val: string) => {
    updateQuery({ client: val });
  };

  const handlePageChange = (newPage: number) => {
    updateQuery({ page: newPage });
  };

  const handlePageSizeChange = (newSize: number) => {
    updateQuery({ pageSize: newSize, page: 1 });
  };

  const handleResetFilters = () => {
    setSearchInput("");
    startTransition(() => {
      const currentSize = searchParams.get("pageSize");
      const nextParams = new URLSearchParams();
      if (currentSize && currentSize !== "24") {
        nextParams.set("pageSize", currentSize);
      }
      const qs = nextParams.toString();
      router.push(qs ? `${pathname}?${qs}` : pathname);
    });
  };

  const hasActiveFilters =
    activeSearch.trim().length > 0 || activeStatus !== "active" || activeClient !== "all";

  const fromEntry = data.total === 0 ? 0 : (data.page - 1) * data.pageSize + 1;
  const toEntry = Math.min(data.page * data.pageSize, data.total);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            Projects
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Access credentials, environment variables, and manage team project permissions.
          </p>
        </div>

        {canManage && (
          <Button onClick={() => setCreateDialogOpen(true)}>
            <Plus className="mr-2 size-4" />
            New Project
          </Button>
        )}
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 flex-col gap-2.5 sm:flex-row sm:items-center">
          {/* Search Input */}
          <form onSubmit={handleSearchSubmit} className="relative w-full sm:max-w-xs">
            <Search className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
            <Input
              placeholder="Search projects, clients, stack..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              onBlur={() => handleSearchSubmit()}
              className="pl-9"
            />
          </form>

          {/* Client Filter Dropdown */}
          <div className="w-full sm:w-56">
            <Select
              value={activeClient}
              onValueChange={(val) => handleClientChange(val || "all")}
              disabled={isPending}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="All Clients">
                  {activeClient === "all"
                    ? "All Clients"
                    : clients.find((c) => c.id === activeClient)?.name || "All Clients"}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Clients</SelectItem>
                {clients.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleResetFilters}
              disabled={isPending}
              className="h-9 px-2.5 text-xs text-muted-foreground hover:text-foreground self-start sm:self-auto"
            >
              <FilterX className="mr-1.5 size-3.5" />
              Reset Filters
            </Button>
          )}
        </div>

        {/* Controls Right: Status Tabs & View Mode Switcher */}
        <div className="flex items-center gap-2">
          {/* Status Tabs */}
          <Tabs
            value={activeStatus}
            onValueChange={handleStatusChange}
          >
            <TabsList>
              <TabsTrigger value="active">Active</TabsTrigger>
              <TabsTrigger value="archived">Archived</TabsTrigger>
              <TabsTrigger value="all">All</TabsTrigger>
            </TabsList>
          </Tabs>

          {/* View Mode Toggle */}
          <div className="flex items-center rounded-lg border bg-muted/40 p-0.5">
            <Button
              variant={viewMode === "folders" ? "secondary" : "ghost"}
              size="icon"
              className="size-8"
              onClick={() => setViewMode("folders")}
              aria-label="Folder view"
              title="Folder view"
            >
              <LayoutGrid className="size-4" />
            </Button>
            <Button
              variant={viewMode === "table" ? "secondary" : "ghost"}
              size="icon"
              className="size-8"
              onClick={() => setViewMode("table")}
              aria-label="Table view"
              title="Table view"
            >
              <List className="size-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Content State */}
      {data.projects.length === 0 ? (
        data.total === 0 && !hasActiveFilters ? (
          <EmptyState
            icon={FolderLock}
            title="No projects found"
            description={
              canManage
                ? "Get started by adding your first client project to organize secrets and team access."
                : "You have not been assigned to any client projects yet. Ask an admin or manager for access."
            }
            action={
              canManage
                ? {
                    label: "Create Project",
                    onClick: () => setCreateDialogOpen(true),
                  }
                : undefined
            }
          />
        ) : (
          <EmptyState
            icon={Search}
            title="No matching projects"
            description="No projects match your current search and filter criteria."
            action={{
              label: "Clear Filters",
              onClick: handleResetFilters,
            }}
          />
        )
      ) : (
        <div className="space-y-4">
          <div className={`transition-opacity duration-150 ${isPending ? "opacity-60 pointer-events-none" : "opacity-100"}`}>
            {viewMode === "folders" ? (
              <ProjectFolderGrid
                projects={data.projects}
                userRole={userRole}
                clients={clients}
              />
            ) : (
              <ProjectTable
                projects={data.projects}
                userRole={userRole}
                clients={clients}
              />
            )}
          </div>

          {/* Server-Side Pagination Controls */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-muted-foreground pt-1">
            <div className="flex items-center gap-2">
              <span>Rows per page:</span>
              <Select
                value={String(data.pageSize)}
                onValueChange={(val) => handlePageSizeChange(Number(val) || 24)}
                disabled={isPending}
              >
                <SelectTrigger className="h-8 w-16 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="12">12</SelectItem>
                  <SelectItem value="24">24</SelectItem>
                  <SelectItem value="48">48</SelectItem>
                </SelectContent>
              </Select>
              <span>
                Showing <span className="font-medium text-foreground">{fromEntry}</span> to{" "}
                <span className="font-medium text-foreground">{toEntry}</span> of{" "}
                <span className="font-medium text-foreground">{data.total}</span> entries
              </span>
            </div>

            <div className="flex items-center gap-1.5">
              <span className="mr-2">
                Page <span className="font-medium text-foreground">{data.page}</span> of{" "}
                <span className="font-medium text-foreground">{data.totalPages}</span>
              </span>
              <Button
                variant="outline"
                size="icon"
                className="size-8"
                disabled={data.page <= 1 || isPending}
                onClick={() => handlePageChange(data.page - 1)}
                aria-label="Previous page"
              >
                <ChevronLeft className="size-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                className="size-8"
                disabled={data.page >= data.totalPages || isPending}
                onClick={() => handlePageChange(data.page + 1)}
                aria-label="Next page"
              >
                <ChevronRight className="size-4" />
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Create Project Dialog */}
      {canManage && (
        <ProjectFormDialog
          open={createDialogOpen}
          onOpenChange={setCreateDialogOpen}
          clients={clients}
        />
      )}
    </div>
  );
}
