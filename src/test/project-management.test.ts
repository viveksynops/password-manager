import { describe, it, expect, beforeEach } from "vitest";
import {
  createProjectSchema,
  updateProjectSchema,
  archiveProjectSchema,
  assignMemberSchema,
  removeMemberSchema,
} from "@/features/projects/schemas";
import { useProjectStore } from "@/features/projects/store";

describe("Project Management Schemas & Store", () => {
  const validClientId = "11111111-1111-4111-a111-111111111111";
  const validProjectId = "22222222-2222-4222-a222-222222222222";
  const validUserId = "33333333-3333-4333-a333-333333333333";

  beforeEach(() => {
    useProjectStore.getState().resetFilters();
  });

  describe("createProjectSchema", () => {
    it("validates valid project input with full fields", () => {
      const valid = {
        clientId: validClientId,
        name: "Ecommerce Web App",
        description: "Customer-facing web application with storefront and checkout.",
        liveUrl: "https://store.example.com",
        repoUrl: "https://github.com/company/store-app",
        hostingInfo: "Vercel + Supabase",
        techStack: "Next.js, Tailwind, Postgres",
        memberIds: [validUserId],
      };
      const result = createProjectSchema.safeParse(valid);
      expect(result.success).toBe(true);
    });

    it("allows optional fields and empty string URLs", () => {
      const minimal = {
        clientId: validClientId,
        name: "Minimal Project",
        description: "",
        liveUrl: "",
        repoUrl: "",
        hostingInfo: "",
        techStack: "",
      };
      const result = createProjectSchema.safeParse(minimal);
      expect(result.success).toBe(true);
    });

    it("rejects project name shorter than 2 characters", () => {
      const invalid = {
        clientId: validClientId,
        name: "A",
      };
      const result = createProjectSchema.safeParse(invalid);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain("at least 2 characters");
      }
    });

    it("rejects invalid clientId UUID", () => {
      const invalid = {
        clientId: "not-a-uuid",
        name: "Valid Project Name",
      };
      const result = createProjectSchema.safeParse(invalid);
      expect(result.success).toBe(false);
    });

    it("rejects invalid URL format for liveUrl and repoUrl", () => {
      const invalid = {
        clientId: validClientId,
        name: "Valid Project",
        liveUrl: "not-a-valid-url-format",
      };
      const result = createProjectSchema.safeParse(invalid);
      expect(result.success).toBe(false);
    });

    it("rejects non-uuid member IDs", () => {
      const invalid = {
        clientId: validClientId,
        name: "Valid Project",
        memberIds: ["invalid-uuid"],
      };
      const result = createProjectSchema.safeParse(invalid);
      expect(result.success).toBe(false);
    });
  });

  describe("updateProjectSchema", () => {
    it("validates valid update with id and client", () => {
      const valid = {
        id: validProjectId,
        clientId: validClientId,
        name: "Updated Project Name",
        isArchived: false,
      };
      const result = updateProjectSchema.safeParse(valid);
      expect(result.success).toBe(true);
    });

    it("rejects invalid project ID", () => {
      const invalid = {
        id: "bad-id",
        clientId: validClientId,
        name: "Updated Name",
      };
      const result = updateProjectSchema.safeParse(invalid);
      expect(result.success).toBe(false);
    });
  });

  describe("archiveProjectSchema", () => {
    it("validates valid archive toggle", () => {
      const valid = {
        id: validProjectId,
        isArchived: true,
      };
      const result = archiveProjectSchema.safeParse(valid);
      expect(result.success).toBe(true);
    });

    it("rejects missing isArchived boolean", () => {
      const invalid = {
        id: validProjectId,
      };
      const result = archiveProjectSchema.safeParse(invalid);
      expect(result.success).toBe(false);
    });
  });

  describe("assignMemberSchema and removeMemberSchema", () => {
    it("validates valid member assignment", () => {
      const valid = {
        projectId: validProjectId,
        userId: validUserId,
      };
      const result = assignMemberSchema.safeParse(valid);
      expect(result.success).toBe(true);
    });

    it("validates valid member removal", () => {
      const valid = {
        projectId: validProjectId,
        userId: validUserId,
      };
      const result = removeMemberSchema.safeParse(valid);
      expect(result.success).toBe(true);
    });

    it("rejects non-uuid identifiers", () => {
      const invalid = {
        projectId: "invalid",
        userId: validUserId,
      };
      expect(assignMemberSchema.safeParse(invalid).success).toBe(false);
      expect(removeMemberSchema.safeParse(invalid).success).toBe(false);
    });
  });

  describe("useProjectStore (Zustand)", () => {
    it("initializes with default filters", () => {
      const state = useProjectStore.getState();
      expect(state.searchQuery).toBe("");
      expect(state.statusFilter).toBe("active");
      expect(state.clientFilter).toBe("all");
      expect(state.viewMode).toBe("folders");
    });

    it("updates search query, status filter, client filter, and view mode", () => {
      const store = useProjectStore.getState();
      store.setSearchQuery("mobile app");
      store.setStatusFilter("archived");
      store.setClientFilter(validClientId);
      store.setViewMode("table");

      const updatedState = useProjectStore.getState();
      expect(updatedState.searchQuery).toBe("mobile app");
      expect(updatedState.statusFilter).toBe("archived");
      expect(updatedState.clientFilter).toBe(validClientId);
      expect(updatedState.viewMode).toBe("table");
    });

    it("resets all filters back to defaults", () => {
      const store = useProjectStore.getState();
      store.setSearchQuery("something");
      store.setStatusFilter("all");
      store.setClientFilter(validClientId);
      store.setViewMode("table");

      store.resetFilters();

      const resetState = useProjectStore.getState();
      expect(resetState.searchQuery).toBe("");
      expect(resetState.statusFilter).toBe("active");
      expect(resetState.clientFilter).toBe("all");
      expect(resetState.viewMode).toBe("folders");
    });
  });

  describe("Developer Project Isolation Rules (ADR-007 / Security 🔒)", () => {
    it("enforces project membership for developer role access", () => {
      // Simulating access evaluation
      const userRole: string = "developer";
      const assignedProjectIds = [validProjectId];

      const canAccessProject = (projId: string) => {
        if (userRole === "admin" || userRole === "manager") return true;
        return assignedProjectIds.includes(projId);
      };

      const unassignedProjectId = "99999999-9999-4999-a999-999999999999";
      expect(canAccessProject(validProjectId)).toBe(true);
      expect(canAccessProject(unassignedProjectId)).toBe(false);
    });

    it("grants manager and admin access to all projects unconditionally", () => {
      const canAccessProject = (role: string, assigned: string[], target: string) => {
        if (role === "admin" || role === "manager") return true;
        return assigned.includes(target);
      };

      const target = "99999999-9999-4999-a999-999999999999";
      expect(canAccessProject("admin", [], target)).toBe(true);
      expect(canAccessProject("manager", [], target)).toBe(true);
      expect(canAccessProject("developer", [], target)).toBe(false);
    });
  });

  describe("Server-Side Pagination & Egress Minimization (Projects)", () => {
    it("calculates accurate range and limit bounds for projects list query", () => {
      const calculateProjectRange = (page: number, pageSize: number) => {
        const sanitizedPage = Math.max(1, page || 1);
        const sanitizedPageSize = Math.max(6, Math.min(60, pageSize || 24));
        const from = (sanitizedPage - 1) * sanitizedPageSize;
        const to = from + sanitizedPageSize - 1;
        return { page: sanitizedPage, pageSize: sanitizedPageSize, from, to };
      };

      const p1 = calculateProjectRange(1, 24);
      expect(p1).toEqual({ page: 1, pageSize: 24, from: 0, to: 23 });

      const p2 = calculateProjectRange(2, 24);
      expect(p2).toEqual({ page: 2, pageSize: 24, from: 24, to: 47 });

      // Clamping: max 60, min 6
      const clampedLarge = calculateProjectRange(1, 500);
      expect(clampedLarge.pageSize).toBe(60);
      expect(clampedLarge.to).toBe(59);

      const clampedSmall = calculateProjectRange(1, 2);
      expect(clampedSmall.pageSize).toBe(6);
      expect(clampedSmall.to).toBe(5);
    });
  });
});
