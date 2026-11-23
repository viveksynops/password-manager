import "server-only";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { AuditLog, Json, UserProfile, Project } from "@/types/database.types";
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
    | "deactivate"
    | "share.create"
    | "share.update_items"
    | "share.extend"
    | "share.regenerate_pin"
    | "share.revoke"
    | "share.unlock"
    | "share.delete"
    | "share.pin_success"
    | "share.pin_failed"
    | "share.locked"
    | "share.reveal"
    | "share.blocked";
  targetType: "credential" | "env_variable" | "project" | "client" | "user" | "auth" | "share_link";
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
  // Client share operations and unauthenticated operations (e.g. failed login)
  // do not have an authenticated Supabase user session cookie.
  // Use createAdminClient() so RLS does not reject the append-only audit entry (ADR-023).
  const isUnauthenticatedAction = !params.userId || params.action.startsWith("share.");
  const supabase = isUnauthenticatedAction
    ? createAdminClient()
    : await createClient();

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
    // If authenticated client failed, retry via admin client
    if (!isUnauthenticatedAction) {
      try {
        const adminClient = createAdminClient();
        const { error: adminError } = await adminClient.from("audit_logs").insert({
          user_id: params.userId ?? null,
          action: params.action,
          target_type: params.targetType,
          target_id: params.targetId ?? null,
          project_id: params.projectId ?? null,
          ip_address: params.ipAddress ?? null,
          metadata: (params.metadata ?? {}) as Json,
        });
        if (!adminError) return;
      } catch {
        // Fall through to critical error throw
      }
    }

    // Critical security invariant: never allow access or mutation without an audit record
    console.error("[CRITICAL] Failed to write audit log entry:", error.message);
    throw new Error("Audit logging failed: Security operation aborted.");
  }
}

/**
 * Lists audit logs with filters and pagination (TASK-104 / TASK-105).
 * Admin only. RLS enforces that only admin users can read audit logs.
 * Strictly uses server-side limit and range to minimize egress.
 */
export async function listAuditLogs(
  filters: Partial<AuditLogFilterInput> = {}
): Promise<PaginatedAuditLogs> {
  const supabase = await createClient();

  const page = Math.max(1, Number(filters.page) || 1);
  const pageSize = Math.max(5, Math.min(100, Number(filters.pageSize) || 25));
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  let query = supabase
    .from("audit_logs")
    .select(
      "id, user_id, action, target_type, target_id, project_id, ip_address, metadata, created_at, project:projects(id, name)",
      { count: "exact" }
    );

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

  // Sort by most recent and apply server-side pagination with limit
  query = query
    .order("created_at", { ascending: false })
    .range(from, to)
    .limit(pageSize);

  const { data, count, error } = await query;

  if (error) {
    throw new Error(`Failed to query audit logs: ${error.message}`);
  }

  const rawLogs = data || [];
  const total = count || 0;
  const totalPages = Math.ceil(total / pageSize) || 1;

  // Retrieve user profiles only for actors in this page slice (minimal egress)
  const userIds = Array.from(new Set(rawLogs.map((l) => l.user_id).filter(Boolean))) as string[];
  const userProfileMap = new Map<string, { email: string; full_name: string | null }>();

  if (userIds.length > 0) {
    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, email, full_name")
      .in("id", userIds)
      .limit(userIds.length);

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

/**
 * Lightweight options query for user filter dropdown.
 * Fetches only id, email, full_name with limit to minimize egress.
 */
export async function getAuditLogUserOptions(): Promise<Pick<UserProfile, "id" | "email" | "full_name">[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("profiles")
    .select("id, email, full_name")
    .order("email")
    .limit(100);

  if (error) {
    console.error("Failed to load user options for audit logs:", error.message);
    return [];
  }
  return data || [];
}

/**
 * Lightweight options query for project filter dropdown.
 * Fetches only id, name with limit to avoid transferring relational arrays.
 */
export async function getAuditLogProjectOptions(): Promise<Pick<Project, "id" | "name">[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("projects")
    .select("id, name")
    .order("name")
    .limit(100);

  if (error) {
    console.error("Failed to load project options for audit logs:", error.message);
    return [];
  }
  return data || [];
}
