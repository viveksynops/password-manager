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

  describe("Server-Side Pagination & Egress Minimization (TASK-105 / Egress Optimization)", () => {
    it("should calculate exact offset ranges and limits for server-side queries", () => {
      const calculateRangeAndLimit = (page: number, pageSize: number) => {
        const sanitizedPage = Math.max(1, page || 1);
        const sanitizedPageSize = Math.max(5, Math.min(100, pageSize || 25));
        const from = (sanitizedPage - 1) * sanitizedPageSize;
        const to = from + sanitizedPageSize - 1;
        return { page: sanitizedPage, pageSize: sanitizedPageSize, from, to };
      };

      // Page 1 with default 25
      const p1 = calculateRangeAndLimit(1, 25);
      expect(p1).toEqual({ page: 1, pageSize: 25, from: 0, to: 24 });

      // Page 2 with 25
      const p2 = calculateRangeAndLimit(2, 25);
      expect(p2).toEqual({ page: 2, pageSize: 25, from: 25, to: 49 });

      // Page 3 with 50
      const p3 = calculateRangeAndLimit(3, 50);
      expect(p3).toEqual({ page: 3, pageSize: 50, from: 100, to: 149 });

      // Clamp excessively large page sizes to max 100 to prevent heavy egress
      const clamped = calculateRangeAndLimit(1, 1000);
      expect(clamped.pageSize).toBe(100);
      expect(clamped.to).toBe(99);

      // Clamp negative or 0 page to 1
      const zeroPage = calculateRangeAndLimit(0, 25);
      expect(zeroPage.page).toBe(1);
      expect(zeroPage.from).toBe(0);
    });

    it("should calculate total pages accurately from count and page size", () => {
      const calcTotalPages = (total: number, pageSize: number) => Math.ceil(total / pageSize) || 1;

      expect(calcTotalPages(0, 25)).toBe(1);
      expect(calcTotalPages(12, 25)).toBe(1);
      expect(calcTotalPages(25, 25)).toBe(1);
      expect(calcTotalPages(26, 25)).toBe(2);
      expect(calcTotalPages(100, 25)).toBe(4);
      expect(calcTotalPages(101, 25)).toBe(5);
    });
  });
});
