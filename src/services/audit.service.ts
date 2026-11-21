import "server-only";
import { createClient } from "@/lib/supabase/server";
import { Json } from "@/types/database.types";

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
