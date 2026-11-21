import { describe, it, expect } from "vitest";
import {
  inviteUserSchema,
  updateRoleSchema,
  deactivateUserSchema,
} from "@/features/team/schemas";
import { useTeamFilterStore } from "@/features/team/store";

describe("Team Management Schemas", () => {
  const validUuid = "11111111-1111-4111-a111-111111111111";

  describe("inviteUserSchema", () => {
    it("validates valid invite input", () => {
      const valid = {
        email: "NewDev@company.com",
        fullName: "Jane Doe",
        role: "developer",
      };
      const result = inviteUserSchema.safeParse(valid);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.email).toBe("newdev@company.com");
      }
    });

    it("rejects invalid emails", () => {
      const invalid = {
        email: "not-an-email",
        fullName: "Jane Doe",
        role: "developer",
      };
      const result = inviteUserSchema.safeParse(invalid);
      expect(result.success).toBe(false);
    });

    it("rejects short names", () => {
      const invalid = {
        email: "dev@company.com",
        fullName: "A",
        role: "developer",
      };
      const result = inviteUserSchema.safeParse(invalid);
      expect(result.success).toBe(false);
    });

    it("rejects invalid roles", () => {
      const invalid = {
        email: "dev@company.com",
        fullName: "Jane Doe",
        role: "superadmin",
      };
      const result = inviteUserSchema.safeParse(invalid);
      expect(result.success).toBe(false);
    });
  });

  describe("updateRoleSchema", () => {
    it("validates role update with valid UUID", () => {
      const valid = {
        userId: validUuid,
        role: "manager",
      };
      const result = updateRoleSchema.safeParse(valid);
      expect(result.success).toBe(true);
    });

    it("rejects invalid UUID", () => {
      const invalid = {
        userId: "not-a-uuid",
        role: "manager",
      };
      const result = updateRoleSchema.safeParse(invalid);
      expect(result.success).toBe(false);
    });
  });

  describe("deactivateUserSchema", () => {
    it("validates deactivation and reactivation status", () => {
      const deactivate = {
        userId: validUuid,
        status: "deactivated",
      };
      expect(deactivateUserSchema.safeParse(deactivate).success).toBe(true);

      const reactivate = {
        userId: validUuid,
        status: "active",
      };
      expect(deactivateUserSchema.safeParse(reactivate).success).toBe(true);
    });
  });
});

describe("Zustand useTeamFilterStore", () => {
  it("manages filter state and resets correctly", () => {
    const store = useTeamFilterStore.getState();

    // Initial state
    expect(store.searchQuery).toBe("");
    expect(store.roleFilter).toBe("all");
    expect(store.statusFilter).toBe("all");

    // Update filters
    store.setSearchQuery("john");
    store.setRoleFilter("developer");
    store.setStatusFilter("active");

    const updated = useTeamFilterStore.getState();
    expect(updated.searchQuery).toBe("john");
    expect(updated.roleFilter).toBe("developer");
    expect(updated.statusFilter).toBe("active");

    // Reset filters
    updated.resetFilters();
    const reset = useTeamFilterStore.getState();
    expect(reset.searchQuery).toBe("");
    expect(reset.roleFilter).toBe("all");
    expect(reset.statusFilter).toBe("all");
  });
});
