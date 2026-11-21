import { z } from "zod";

export const auditActionEnum = z.enum([
  "all",
  "create",
  "update",
  "delete",
  "reveal",
  "copy",
  "export",
  "login",
  "failed_login",
  "mfa_verify",
  "invite",
  "role_change",
  "deactivate",
]);

export const auditDateRangeEnum = z.enum(["all", "today", "7d", "30d"]);

export const auditLogFilterSchema = z.object({
  action: auditActionEnum.default("all"),
  userId: z.string().default("all"),
  projectId: z.string().default("all"),
  targetType: z.string().default("all"),
  dateRange: auditDateRangeEnum.default("all"),
  page: z.number().int().min(1).default(1),
  pageSize: z.number().int().min(5).max(100).default(25),
});

export type AuditLogFilterInput = z.infer<typeof auditLogFilterSchema>;
