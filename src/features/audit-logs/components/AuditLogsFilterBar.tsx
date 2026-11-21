"use client";

import React from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Activity, Calendar, FilterX, FolderLock, User } from "lucide-react";
import { useAuditLogStore } from "../store";
import { UserProfile, Project } from "@/types/database.types";

interface AuditLogsFilterBarProps {
  users: UserProfile[];
  projects: Pick<Project, "id" | "name">[];
}

const ACTION_LABELS: Record<string, string> = {
  all: "All Actions",
  reveal: "Reveal Secret",
  copy: "Copy Secret",
  export: "Export .env",
  create: "Create",
  update: "Update",
  delete: "Delete",
  login: "Login",
  failed_login: "Failed Login",
  mfa_verify: "MFA Verified",
  invite: "Invite",
  role_change: "Role Change",
  deactivate: "Deactivate",
};

const DATE_RANGE_LABELS: Record<string, string> = {
  all: "All Time",
  today: "Today",
  "7d": "Last 7 Days",
  "30d": "Last 30 Days",
};

export function AuditLogsFilterBar({ users, projects }: AuditLogsFilterBarProps) {
  const {
    action,
    userId,
    projectId,
    dateRange,
    setAction,
    setUserId,
    setProjectId,
    setDateRange,
    resetFilters,
  } = useAuditLogStore();

  const hasActiveFilters =
    action !== "all" ||
    userId !== "all" ||
    projectId !== "all" ||
    dateRange !== "all";

  const selectedUser = users.find((u) => u.id === userId);
  const userLabel = selectedUser ? (selectedUser.email || selectedUser.full_name || "User") : "All Actors";

  const selectedProject = projects.find((p) => p.id === projectId);
  const projectLabel = selectedProject ? selectedProject.name : "All Projects";

  return (
    <div className="rounded-lg border bg-card/60 p-2.5 flex flex-wrap items-center gap-2.5 shadow-xs">
      {/* Action Filter */}
      <div className="w-full sm:w-52">
        <Select value={action} onValueChange={(val) => setAction(val ?? "all")}>
          <SelectTrigger className="h-9 text-xs w-full">
            <div className="flex items-center gap-1.5 truncate">
              <Activity className="size-3.5 text-muted-foreground shrink-0" />
              <span className="text-muted-foreground font-normal">Action:</span>
              <SelectValue>
                {ACTION_LABELS[action] || "All Actions"}
              </SelectValue>
            </div>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Actions</SelectItem>
            <SelectItem value="reveal">Reveal Secret</SelectItem>
            <SelectItem value="copy">Copy Secret</SelectItem>
            <SelectItem value="export">Export .env</SelectItem>
            <SelectItem value="create">Create</SelectItem>
            <SelectItem value="update">Update</SelectItem>
            <SelectItem value="delete">Delete</SelectItem>
            <SelectItem value="login">Login</SelectItem>
            <SelectItem value="failed_login">Failed Login</SelectItem>
            <SelectItem value="mfa_verify">MFA Verified</SelectItem>
            <SelectItem value="invite">Invite</SelectItem>
            <SelectItem value="role_change">Role Change</SelectItem>
            <SelectItem value="deactivate">Deactivate</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* User Filter */}
      <div className="w-full sm:w-56">
        <Select value={userId} onValueChange={(val) => setUserId(val ?? "all")}>
          <SelectTrigger className="h-9 text-xs w-full">
            <div className="flex items-center gap-1.5 truncate">
              <User className="size-3.5 text-muted-foreground shrink-0" />
              <span className="text-muted-foreground font-normal">Actor:</span>
              <SelectValue>
                {userLabel}
              </SelectValue>
            </div>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Actors</SelectItem>
            {users.map((u) => (
              <SelectItem key={u.id} value={u.id}>
                {u.email}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Project Filter */}
      <div className="w-full sm:w-48">
        <Select value={projectId} onValueChange={(val) => setProjectId(val ?? "all")}>
          <SelectTrigger className="h-9 text-xs w-full">
            <div className="flex items-center gap-1.5 truncate">
              <FolderLock className="size-3.5 text-muted-foreground shrink-0" />
              <span className="text-muted-foreground font-normal">Project:</span>
              <SelectValue>
                {projectLabel}
              </SelectValue>
            </div>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Projects</SelectItem>
            {projects.map((p) => (
              <SelectItem key={p.id} value={p.id}>
                {p.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Date Range Filter */}
      <div className="w-full sm:w-44">
        <Select
          value={dateRange}
          onValueChange={(val) => setDateRange(((val as any) ?? "all") as "all" | "today" | "7d" | "30d")}
        >
          <SelectTrigger className="h-9 text-xs w-full">
            <div className="flex items-center gap-1.5 truncate">
              <Calendar className="size-3.5 text-muted-foreground shrink-0" />
              <span className="text-muted-foreground font-normal">Time:</span>
              <SelectValue>
                {DATE_RANGE_LABELS[dateRange] || "All Time"}
              </SelectValue>
            </div>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Time</SelectItem>
            <SelectItem value="today">Today</SelectItem>
            <SelectItem value="7d">Last 7 Days</SelectItem>
            <SelectItem value="30d">Last 30 Days</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Reset Filters */}
      {hasActiveFilters && (
        <Button
          variant="ghost"
          size="sm"
          className="h-9 px-2.5 text-xs text-muted-foreground hover:text-foreground"
          onClick={resetFilters}
        >
          <FilterX className="mr-1.5 size-3.5" />
          Reset Filters
        </Button>
      )}
    </div>
  );
}
