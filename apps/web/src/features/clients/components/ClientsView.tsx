"use client";

import React, { useState, useTransition, useEffect } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { PaginatedClients } from "@/services/client.service";
import { UserRole } from "@/types/database.types";
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
import { Search, Building2, Plus, RotateCcw, ChevronLeft, ChevronRight } from "lucide-react";

interface ClientsViewProps {
  data: PaginatedClients;
  userRole: UserRole;
}

export function ClientsView({ data, userRole }: ClientsViewProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const [createDialogOpen, setCreateDialogOpen] = useState(false);

  // Active filters from URL search params
  const activeSearch = searchParams.get("search") || "";
  const activeStatus = searchParams.get("status") || "active";

  // Local search query for fluid typing
  const [searchInput, setSearchInput] = useState(activeSearch);

  useEffect(() => {
    setSearchInput(activeSearch);
  }, [activeSearch]);

  const canManage = userRole === "admin" || userRole === "manager";

  // URL query updater helper for server-side pagination & filtering
  const updateQuery = (updates: Record<string, string | number | null | undefined>) => {
    startTransition(() => {
      const nextParams = new URLSearchParams(searchParams.toString());

      for (const [key, val] of Object.entries(updates)) {
        if (val === null || val === undefined || val === "" || (key === "status" && val === "active")) {
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
      if (currentSize && currentSize !== "20") {
        nextParams.set("pageSize", currentSize);
      }
      const qs = nextParams.toString();
      router.push(qs ? `${pathname}?${qs}` : pathname);
    });
  };

  const hasActiveFilters = activeSearch !== "" || activeStatus !== "active";
  const fromEntry = data.total === 0 ? 0 : (data.page - 1) * data.pageSize + 1;
  const toEntry = Math.min(data.page * data.pageSize, data.total);

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

      {/* Filter and Search Bar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <form onSubmit={handleSearchSubmit} className="relative flex-1 max-w-sm">
          <Search className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
          <Input
            placeholder="Search by client or contact..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            onBlur={() => handleSearchSubmit()}
            className="pl-9"
          />
        </form>

        <div className="flex items-center gap-2">
          <Select
            value={activeStatus}
            onValueChange={(val) => handleStatusChange(val || "active")}
            disabled={isPending}
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
              onClick={handleResetFilters}
              disabled={isPending}
              className="text-xs text-muted-foreground hover:text-foreground"
            >
              <RotateCcw className="mr-1.5 size-3.5" />
              Reset
            </Button>
          )}
        </div>
      </div>

      {/* Table or Empty State */}
      {data.clients.length > 0 ? (
        <div className="space-y-4">
          <div className={`transition-opacity duration-150 ${isPending ? "opacity-60 pointer-events-none" : "opacity-100"}`}>
            <ClientTable clients={data.clients} userRole={userRole} />
          </div>

          {/* Server-Side Pagination Controls (only shown when data exceeds a single page) */}
          {(data.totalPages > 1 || data.page > 1) && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-muted-foreground pt-1">
              <div className="flex items-center gap-2">
                <span>Rows per page:</span>
                <Select
                  value={String(data.pageSize)}
                  onValueChange={(val) => handlePageSizeChange(Number(val) || 20)}
                  disabled={isPending}
                >
                  <SelectTrigger className="h-8 w-16 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="10">10</SelectItem>
                    <SelectItem value="20">20</SelectItem>
                    <SelectItem value="50">50</SelectItem>
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
          )}
        </div>
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
              ? { label: "Reset Filters", onClick: handleResetFilters }
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
