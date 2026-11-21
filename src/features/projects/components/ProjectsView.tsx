"use client";

import React, { useMemo, useState } from "react";
import { ProjectWithDetails } from "@/services/project.service";
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
import { FolderLock, Plus, Search, FilterX, LayoutGrid, List } from "lucide-react";
import { useProjectStore, ProjectStatusFilter, ProjectViewMode } from "../store";

interface ProjectsViewProps {
  initialProjects: ProjectWithDetails[];
  clients: Pick<Client, "id" | "name">[];
  users?: UserProfile[];
  userRole: UserRole;
}

export function ProjectsView({
  initialProjects,
  clients,
  users = [],
  userRole,
}: ProjectsViewProps) {
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const canManage = userRole === "admin" || userRole === "manager";

  const {
    searchQuery,
    statusFilter,
    clientFilter,
    viewMode,
    setSearchQuery,
    setStatusFilter,
    setClientFilter,
    setViewMode,
    resetFilters,
  } = useProjectStore();

  const filteredProjects = useMemo(() => {
    return initialProjects.filter((proj) => {
      // 1. Status filter
      if (statusFilter === "active" && proj.is_archived) return false;
      if (statusFilter === "archived" && !proj.is_archived) return false;

      // 2. Client filter
      if (clientFilter !== "all" && proj.client_id !== clientFilter) return false;

      // 3. Search query (matches project name, client name, tech stack, hosting)
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim();
        const matchesName = proj.name.toLowerCase().includes(query);
        const matchesClient = proj.client_name.toLowerCase().includes(query);
        const matchesTech = proj.tech_stack?.toLowerCase().includes(query) || false;
        const matchesHosting = proj.hosting_info?.toLowerCase().includes(query) || false;

        if (!matchesName && !matchesClient && !matchesTech && !matchesHosting) {
          return false;
        }
      }

      return true;
    });
  }, [initialProjects, searchQuery, statusFilter, clientFilter]);

  const hasActiveFilters =
    searchQuery.trim().length > 0 || statusFilter !== "active" || clientFilter !== "all";

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
          <div className="relative w-full sm:max-w-xs">
            <Search className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
            <Input
              placeholder="Search projects, clients, stack..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>

          {/* Client Filter Dropdown */}
          <div className="w-full sm:w-56">
            <Select
              value={clientFilter}
              onValueChange={(val) => setClientFilter(val || "all")}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="All Clients">
                  {clientFilter === "all"
                    ? "All Clients"
                    : clients.find((c) => c.id === clientFilter)?.name || "All Clients"}
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
              onClick={resetFilters}
              className="h-9 px-2.5 text-xs text-muted-foreground hover:text-foreground self-start sm:self-auto"
            >
              <FilterX className="mr-1.5 size-3.5" />
              Reset Filters
            </Button>
          )}
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          {/* Status Tabs */}
          <Tabs
            value={statusFilter}
            onValueChange={(val) => setStatusFilter(val as ProjectStatusFilter)}
          >
            <TabsList>
              <TabsTrigger value="active">Active</TabsTrigger>
              <TabsTrigger value="archived">Archived</TabsTrigger>
              <TabsTrigger value="all">All</TabsTrigger>
            </TabsList>
          </Tabs>

          {/* View Mode Toggle (Folders vs Table) */}
          <div className="flex items-center rounded-lg border bg-muted/30 p-0.5">
            <Button
              variant={viewMode === "folders" ? "secondary" : "ghost"}
              size="icon"
              className="size-8"
              onClick={() => setViewMode("folders")}
              title="Folder View"
              aria-label="Folder View"
            >
              <LayoutGrid className="size-4" />
            </Button>
            <Button
              variant={viewMode === "table" ? "secondary" : "ghost"}
              size="icon"
              className="size-8"
              onClick={() => setViewMode("table")}
              title="Table View"
              aria-label="Table View"
            >
              <List className="size-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Content State */}
      {filteredProjects.length === 0 ? (
        initialProjects.length === 0 ? (
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
              onClick: resetFilters,
            }}
          />
        )
      ) : viewMode === "folders" ? (
        <ProjectFolderGrid
          projects={filteredProjects}
          userRole={userRole}
          clients={clients}
        />
      ) : (
        <ProjectTable
          projects={filteredProjects}
          userRole={userRole}
          clients={clients}
        />
      )}

      {/* Create Project Dialog */}
      {canManage && (
        <ProjectFormDialog
          open={createDialogOpen}
          onOpenChange={setCreateDialogOpen}
          clients={clients}
          users={users}
        />
      )}
    </div>
  );
}
