"use client";

import React, { useMemo, useState } from "react";
import { ClientWithProjectCount } from "@/services/client.service";
import { UserRole } from "@/types/database.types";
import { useClientFilterStore } from "../store";
import { ClientTable } from "./ClientTable";
import { ClientFormDialog } from "./ClientFormDialog";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/empty-state";
import { Search, Building2, Plus, RotateCcw } from "lucide-react";

interface ClientsViewProps {
  initialClients: ClientWithProjectCount[];
  userRole: UserRole;
}

export function ClientsView({ initialClients, userRole }: ClientsViewProps) {
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const { searchQuery, statusFilter, setSearchQuery, setStatusFilter, resetFilters } =
    useClientFilterStore();

  const canManage = userRole === "admin" || userRole === "manager";

  const filteredClients = useMemo(() => {
    return initialClients.filter((client) => {
      // 1. Search filter
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchesName = client.name.toLowerCase().includes(query);
        const matchesContact = client.contact_person?.toLowerCase().includes(query) ?? false;
        const matchesEmail = client.contact_email?.toLowerCase().includes(query) ?? false;
        if (!matchesName && !matchesContact && !matchesEmail) return false;
      }

      // 2. Status filter
      if (statusFilter === "active" && client.is_archived) return false;
      if (statusFilter === "archived" && !client.is_archived) return false;

      return true;
    });
  }, [initialClients, searchQuery, statusFilter]);

  const hasActiveFilters = searchQuery !== "" || statusFilter !== "active";

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            Client Accounts
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage organization clients, assigned projects, and client contact information.
          </p>
        </div>

        {canManage && (
          <Button onClick={() => setCreateDialogOpen(true)}>
            <Plus className="mr-2 size-4" />
            Add Client
          </Button>
        )}
      </div>

      {/* Filter and Search Bar (Zustand) */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
          <Input
            placeholder="Search by client or contact..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>

        <div className="flex items-center gap-2">
          <Select
            value={statusFilter}
            onValueChange={(val) => setStatusFilter(val as "active" | "archived" | "all")}
          >
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="active">Active Clients</SelectItem>
              <SelectItem value="archived">Archived</SelectItem>
              <SelectItem value="all">All Clients</SelectItem>
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

      {/* Table or Empty State */}
      {filteredClients.length > 0 ? (
        <ClientTable clients={filteredClients} userRole={userRole} />
      ) : (
        <EmptyState
          icon={Building2}
          title={hasActiveFilters ? "No clients match your filter" : "No clients created yet"}
          description={
            hasActiveFilters
              ? "Try adjusting your search criteria or resetting the status filter."
              : "Get started by adding your first client organization."
          }
          action={
            hasActiveFilters
              ? { label: "Reset Filters", onClick: resetFilters }
              : canManage
              ? { label: "Add Client", onClick: () => setCreateDialogOpen(true) }
              : undefined
          }
        />
      )}

      {/* Create Client Modal */}
      {canManage && (
        <ClientFormDialog
          open={createDialogOpen}
          onOpenChange={setCreateDialogOpen}
        />
      )}
    </div>
  );
}
