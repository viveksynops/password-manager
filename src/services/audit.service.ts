import "server-only";
import { createClient } from "@/lib/supabase/server";
import { AuditLog, Json } from "@/types/database.types";
import { AuditLogFilterInput } from "@/features/audit-logs/schemas";

export interface LogActionParams {
  userId?: string | null;
  action:
    | "create"
    | "update"
    | "delete"
    | "reveal"
    | "copy"
    | "export"
    | "login"
    | "failed_login"
    | "mfa_verify"
    | "invite"
    | "role_change"
    | "deactivate";
  targetType: "credential" | "env_variable" | "project" | "client" | "user" | "auth";
  targetId?: string | null;
  projectId?: string | null;
  ipAddress?: string | null;
  metadata?: Record<string, unknown>;
}

export interface AuditLogWithDetails extends AuditLog {
  user_email?: string | null;
  user_name?: string | null;
  project_name?: string | null;
}

export interface PaginatedAuditLogs {
  logs: AuditLogWithDetails[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

/**
 * Appends a log entry to audit_logs.
 * ADR-013 & Security Rule: If writing to the audit log fails, the operation MUST fail.
 */
export async function logAction(params: LogActionParams): Promise<void> {
  const supabase = await createClient();

  const { error } = await supabase.from("audit_logs").insert({
    user_id: params.userId ?? null,
    action: params.action,
    target_type: params.targetType,
    target_id: params.targetId ?? null,
    project_id: params.projectId ?? null,
    ip_address: params.ipAddress ?? null,
    metadata: (params.metadata ?? {}) as Json,
  });

  if (error) {
    // Critical security invariant: never allow access or mutation without an audit record
    console.error("[CRITICAL] Failed to write audit log entry:", error.message);
    throw new Error("Audit logging failed: Security operation aborted.");
  }
}

/**
 * Lists audit logs with filters and pagination (TASK-104 / TASK-105).
 * Admin only. RLS enforces that only admin users can read audit logs.
 */
export async function listAuditLogs(
  filters: Partial<AuditLogFilterInput> = {}
): Promise<PaginatedAuditLogs> {
  const supabase = await createClient();

  const page = Math.max(1, filters.page || 1);
  const pageSize = Math.max(5, Math.min(100, filters.pageSize || 25));
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  let query = supabase
    .from("audit_logs")
    .select("*, project:projects(id, name)", { count: "exact" });

  // 1. Action filter
  if (filters.action && filters.action !== "all") {
    query = query.eq("action", filters.action);
  }

  // 2. User filter
  if (filters.userId && filters.userId !== "all") {
    query = query.eq("user_id", filters.userId);
  }

  // 3. Project filter
  if (filters.projectId && filters.projectId !== "all") {
    query = query.eq("project_id", filters.projectId);
  }

  // 4. Target type filter
  if (filters.targetType && filters.targetType !== "all") {
    query = query.eq("target_type", filters.targetType);
  }

  // 5. Date range filter
  if (filters.dateRange && filters.dateRange !== "all") {
    const now = new Date();
    if (filters.dateRange === "today") {
      const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      query = query.gte("created_at", startOfDay.toISOString());
    } else if (filters.dateRange === "7d") {
      const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      query = query.gte("created_at", sevenDaysAgo.toISOString());
    } else if (filters.dateRange === "30d") {
      const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      query = query.gte("created_at", thirtyDaysAgo.toISOString());
    }
  }

  // Sort by most recent
  query = query.order("created_at", { ascending: false }).range(from, to);

  const { data, count, error } = await query;

  if (error) {
    throw new Error(`Failed to query audit logs: ${error.message}`);
  }

  const rawLogs = data || [];
  const total = count || 0;
  const totalPages = Math.ceil(total / pageSize) || 1;

  // Retrieve user profiles for actors in this page
  const userIds = Array.from(new Set(rawLogs.map((l) => l.user_id).filter(Boolean))) as string[];
  const userProfileMap = new Map<string, { email: string; full_name: string | null }>();

  if (userIds.length > 0) {
    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, email, full_name")
      .in("id", userIds);

    for (const p of profiles || []) {
      userProfileMap.set(p.id, { email: p.email, full_name: p.full_name });
    }
  }

  const enrichedLogs: AuditLogWithDetails[] = rawLogs.map((log: any) => {
    const userProfile = log.user_id ? userProfileMap.get(log.user_id) : null;
    return {
      id: log.id,
      user_id: log.user_id,
      action: log.action,
      target_type: log.target_type,
      target_id: log.target_id,
      project_id: log.project_id,
      ip_address: log.ip_address,
      metadata: log.metadata,
      created_at: log.created_at,
      user_email: userProfile?.email || null,
      user_name: userProfile?.full_name || null,
      project_name: log.project?.name || null,
    };
  });

  return {
    logs: enrichedLogs,
    total,
    page,
    pageSize,
    totalPages,
  };
}
