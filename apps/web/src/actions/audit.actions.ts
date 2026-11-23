"use server";

import { requireAdmin } from "@/lib/auth";
import { auditLogFilterSchema, AuditLogFilterInput } from "@/features/audit-logs/schemas";
import { listAuditLogs, PaginatedAuditLogs } from "@/services/audit.service";
import { ActionResult, successResult, handleActionError } from "@/lib/action-result";

export async function getAuditLogsAction(
  filters: Partial<AuditLogFilterInput> = {}
): Promise<ActionResult<PaginatedAuditLogs>> {
  try {
    await requireAdmin();

    const parsed = auditLogFilterSchema.partial().safeParse(filters);
    const validFilters = parsed.success ? parsed.data : {};

    const data = await listAuditLogs(validFilters);
    return successResult(data);
  } catch (err) {
    return handleActionError(err);
  }
}
