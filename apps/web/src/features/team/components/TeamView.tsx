"use client";

import React, { useMemo } from "react";
import { UserProfile } from "@/types/database.types";
import { AuthenticatedUser } from "@/lib/auth";
import { useTeamFilterStore } from "../store";
import { TeamTable } from "./TeamTable";
import { InviteUserDialog } from "./InviteUserDialog";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { EmptyState } from "@/components/empty-state";
import { Search, Users, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";

interface TeamViewProps {
  currentUser: AuthenticatedUser;
  initialUsers: UserProfile[];
}

export function TeamView({ currentUser, initialUsers }: TeamViewProps) {
  const {
    searchQuery,
    roleFilter,
    statusFilter,
    setSearchQuery,
    setRoleFilter,
    setStatusFilter,
    resetFilters,
  } = useTeamFilterStore();

  const filteredUsers = useMemo(() => {
    return initialUsers.filter((user) => {
      // 1. Search query (name or email)
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchesEmail = user.email.toLowerCase().includes(query);
        const matchesName = user.full_name?.toLowerCase().includes(query) ?? false;
        if (!matchesEmail && !matchesName) return false;
      }

      // 2. Role filter
      if (roleFilter !== "all" && user.role !== roleFilter) {
        return false;
      }

      // 3. Status filter
      if (statusFilter !== "all" && user.status !== statusFilter) {
        return false;
      }

      return true;
    });
  }, [initialUsers, searchQuery, roleFilter, statusFilter]);

  const hasActiveFilters = searchQuery !== "" || roleFilter !== "all" || statusFilter !== "all";

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            Team Management
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage team members, roles, permissions, and vault access.
          </p>
        </div>
        <InviteUserDialog />
      </div>

      {/* Filter and Search Bar (Zustand state) */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
          <Input
            placeholder="Search by name or email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Role Filter */}
          <Select value={roleFilter} onValueChange={(val) => setRoleFilter(val as any)}>
            <SelectTrigger className="w-[130px]">
              <SelectValue placeholder="All Roles" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Roles</SelectItem>
              <SelectItem value="admin">Admin</SelectItem>
              <SelectItem value="manager">Manager</SelectItem>
              <SelectItem value="developer">Developer</SelectItem>
            </SelectContent>
          </Select>

          {/* Status Filter */}
          <Select value={statusFilter} onValueChange={(val) => setStatusFilter(val as any)}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="All Statuses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="invited">Invited</SelectItem>
              <SelectItem value="deactivated">Deactivated</SelectItem>
            </SelectContent>
          </Select>

          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={resetFilters}
              className="text-xs text-muted-foreground hover:text-foreground"
            >
              <RotateCcw className="mr-1.5 size-3.5" />
              Reset
            </Button>
          )}
        </div>
      </div>

      {/* Team Table or Empty Results */}
      {filteredUsers.length > 0 ? (
        <TeamTable users={filteredUsers} currentUserId={currentUser.id} />
      ) : (
        <EmptyState
          icon={Users}
          title={hasActiveFilters ? "No matching team members" : "No team members yet"}
          description={
            hasActiveFilters
              ? "Try adjusting your search criteria or resetting filters."
              : "Start by inviting your first team member to collaborate."
          }
          action={
            hasActiveFilters
              ? { label: "Reset Filters", onClick: resetFilters }
              : undefined
          }
        />
      )}
    </div>
  );
}
