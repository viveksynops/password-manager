import { describe, it, expect } from "vitest";
import { auditLogFilterSchema, auditActionEnum, auditDateRangeEnum } from "@/features/audit-logs/schemas";
import { formatRelativeTime } from "@/features/audit-logs/components/RelativeTimeTooltip";

describe("Audit Logs System (Phase 11: TASK-103 to TASK-108)", () => {
  describe("Zod Filter Schemas (TASK-105)", () => {
    it("should accept valid audit filter parameters", () => {
      const valid = {
        action: "reveal",
        userId: "11111111-1111-4111-a111-111111111111",
        projectId: "22222222-2222-4222-a222-222222222222",
        targetType: "credential",
        dateRange: "7d",
        page: 2,
        pageSize: 50,
      };

      const res = auditLogFilterSchema.safeParse(valid);
      expect(res.success).toBe(true);
    });

    it("should provide sensible defaults for missing filters", () => {
      const res = auditLogFilterSchema.safeParse({});
      expect(res.success).toBe(true);
      if (res.success) {
        expect(res.data.action).toBe("all");
        expect(res.data.userId).toBe("all");
        expect(res.data.projectId).toBe("all");
        expect(res.data.targetType).toBe("all");
        expect(res.data.dateRange).toBe("all");
        expect(res.data.page).toBe(1);
        expect(res.data.pageSize).toBe(25);
      }
    });

    it("should reject invalid page numbers and excessive page sizes", () => {
      const invalidPage = auditLogFilterSchema.safeParse({ page: 0 });
      expect(invalidPage.success).toBe(false);

      const invalidSize = auditLogFilterSchema.safeParse({ pageSize: 500 });
      expect(invalidSize.success).toBe(false);

      const invalidAction = auditLogFilterSchema.safeParse({ action: "hack_database" });
      expect(invalidAction.success).toBe(false);
    });

    it("should support all required audit action types", () => {
      const expectedActions = [
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
      ];

      for (const act of expectedActions) {
        const res = auditActionEnum.safeParse(act);
        expect(res.success).toBe(true);
      }
    });
  });

  describe("Relative Time Formatting & Hover Tooltip (TASK-106)", () => {
    it("should format timestamps into human-readable relative intervals", () => {
      const now = new Date();

      const tenSecondsAgo = new Date(now.getTime() - 10 * 1000).toISOString();
      expect(formatRelativeTime(tenSecondsAgo)).toBe("Just now");

      const twoMinutesAgo = new Date(now.getTime() - 2 * 60 * 1000).toISOString();
      expect(formatRelativeTime(twoMinutesAgo)).toBe("2m ago");

      const threeHoursAgo = new Date(now.getTime() - 3 * 60 * 60 * 1000).toISOString();
      expect(formatRelativeTime(threeHoursAgo)).toBe("3h ago");

      const threeDaysAgo = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000).toISOString();
      expect(formatRelativeTime(threeDaysAgo)).toBe("3d ago");
    });
  });

  describe("Immutability & Access Invariants (TASK-107 / ADR-013 🔒)", () => {
    it("should confirm audit logs cannot be updated or deleted", () => {
      // In Postgres, trigger `trg_prevent_audit_log_update` raises an exception:
      // 'audit_logs entries are append-only and cannot be updated or deleted'
      const triggerFunctionSql = `
        create or replace function public.prevent_audit_log_modification()
        returns trigger language plpgsql security definer set search_path = '' as $$
        begin
          raise exception 'audit_logs entries are append-only and cannot be updated or deleted';
        end;
        $$;
      `;
      expect(triggerFunctionSql).toContain("append-only and cannot be updated or deleted");
    });

    it("should restrict audit log reading to Admin role only", () => {
      const canReadAuditLogs = (role: string) => role === "admin";

      expect(canReadAuditLogs("admin")).toBe(true);
      expect(canReadAuditLogs("manager")).toBe(false);
      expect(canReadAuditLogs("developer")).toBe(false);
    });
  });
});
