"use client";

import React, { useTransition } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { PaginatedAuditLogs } from "@/services/audit.service";
import { UserProfile, Project } from "@/types/database.types";
import { AuditLogsFilterBar } from "./AuditLogsFilterBar";
import { AuditLogsTable } from "./AuditLogsTable";
import { EmptyState } from "@/components/empty-state";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  ScrollText,
  ShieldCheck,
} from "lucide-react";

interface AuditLogsViewProps {
  data: PaginatedAuditLogs;
  users: Pick<UserProfile, "id" | "email" | "full_name">[];
  projects: Pick<Project, "id" | "name">[];
}

export function AuditLogsView({ data, users, projects }: AuditLogsViewProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  // Active filter values directly from URL searchParams
  const activeAction = searchParams.get("action") || "all";
  const activeUserId = searchParams.get("userId") || "all";
  const activeProjectId = searchParams.get("projectId") || "all";
  const activeDateRange = searchParams.get("dateRange") || "all";

  // URL query updater helper for server-side pagination & filtering
  const updateQuery = (updates: Record<string, string | number | null | undefined>) => {
    startTransition(() => {
      const nextParams = new URLSearchParams(searchParams.toString());

      for (const [key, val] of Object.entries(updates)) {
        if (val === null || val === undefined || val === "" || val === "all") {
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

  const handlePageChange = (newPage: number) => {
    updateQuery({ page: newPage });
  };

  const handlePageSizeChange = (newSize: number) => {
    updateQuery({ pageSize: newSize, page: 1 });
  };

  const handleFilterChange = (key: string, value: string) => {
    updateQuery({ [key]: value });
  };

  const handleResetFilters = () => {
    startTransition(() => {
      const currentSize = searchParams.get("pageSize");
      const nextParams = new URLSearchParams();
      if (currentSize && currentSize !== "25") {
        nextParams.set("pageSize", currentSize);
      }
      const qs = nextParams.toString();
      router.push(qs ? `${pathname}?${qs}` : pathname);
    });
  };

  const handleRefresh = () => {
    startTransition(() => {
      router.refresh();
    });
  };

  const fromEntry = data.total === 0 ? 0 : (data.page - 1) * data.pageSize + 1;
  const toEntry = Math.min(data.page * data.pageSize, data.total);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
              Audit Logs
            </h1>
            <Badge
              variant="outline"
              className="border-emerald-500/30 text-emerald-400 bg-emerald-500/10 font-mono text-xs flex items-center gap-1"
            >
              <ShieldCheck className="size-3" />
              Immutable Ledger
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            Tamper-proof append-only record of all secret reveals, credential copies, exports, and administrative mutations.
          </p>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={handleRefresh}
          disabled={isPending}
          className="self-start sm:self-auto h-9"
        >
          <RefreshCw className={`mr-1.5 size-3.5 ${isPending ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      {/* Filter Bar */}
      <AuditLogsFilterBar
        users={users}
        projects={projects}
        action={activeAction}
        userId={activeUserId}
        projectId={activeProjectId}
        dateRange={activeDateRange}
        onFilterChange={handleFilterChange}
        onReset={handleResetFilters}
        disabled={isPending}
      />

      {/* Main Table / Empty State */}
      {data.logs.length === 0 ? (
        <EmptyState
          icon={ScrollText}
          title="No audit log entries found"
          description={
            data.total === 0
              ? "All actions in Company Vault will be recorded here automatically."
              : "No audit logs match the current filter criteria."
          }
          action={
            data.total > 0 || activeAction !== "all" || activeUserId !== "all" || activeProjectId !== "all" || activeDateRange !== "all"
              ? {
                  label: "Clear Filters",
                  onClick: handleResetFilters,
                }
              : undefined
          }
        />
      ) : (
        <div className="space-y-4">
          <div className={`transition-opacity duration-150 ${isPending ? "opacity-60 pointer-events-none" : "opacity-100"}`}>
            <AuditLogsTable logs={data.logs} />
          </div>

          {/* Server-Side Pagination Controls */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-muted-foreground pt-1">
            <div className="flex items-center gap-2">
              <span>Rows per page:</span>
              <Select
                value={String(data.pageSize)}
                onValueChange={(val) => handlePageSizeChange(Number(val) || 25)}
                disabled={isPending}
              >
                <SelectTrigger className="h-8 w-16 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="10">10</SelectItem>
                  <SelectItem value="25">25</SelectItem>
                  <SelectItem value="50">50</SelectItem>
                  <SelectItem value="100">100</SelectItem>
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
    </div>
  );
}
