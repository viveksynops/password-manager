import { describe, it, expect } from "vitest";
import {
  createClientSchema,
  updateClientSchema,
  archiveClientSchema,
} from "@/features/clients/schemas";
import { useClientFilterStore } from "@/features/clients/store";

describe("Client Management Schemas", () => {
  const validId = "11111111-1111-4111-a111-111111111111";

  describe("createClientSchema", () => {
    it("validates valid client input", () => {
      const valid = {
        name: "Acme Corp",
        contactPerson: "John Doe",
        contactEmail: "john@acme.com",
        contactPhone: "+1 555-0199",
        notes: "Key client account.",
      };
      const result = createClientSchema.safeParse(valid);
      expect(result.success).toBe(true);
    });

    it("allows optional contact info and notes", () => {
      const minimal = {
        name: "Acme Corp",
        contactPerson: "",
        contactEmail: "",
        contactPhone: "",
        notes: "",
      };
      const result = createClientSchema.safeParse(minimal);
      expect(result.success).toBe(true);
    });

    it("rejects client name shorter than 2 characters", () => {
      const invalid = {
        name: "A",
      };
      const result = createClientSchema.safeParse(invalid);
      expect(result.success).toBe(false);
    });

    it("rejects invalid contact email", () => {
      const invalid = {
        name: "Acme Corp",
        contactEmail: "invalid-email-string",
      };
      const result = createClientSchema.safeParse(invalid);
      expect(result.success).toBe(false);
    });
  });

  describe("updateClientSchema", () => {
    it("validates valid update with id", () => {
      const valid = {
        id: validId,
        name: "Acme Corp Updated",
        isArchived: false,
      };
      const result = updateClientSchema.safeParse(valid);
      expect(result.success).toBe(true);
    });

    it("rejects update without valid UUID", () => {
      const invalid = {
        id: "not-a-uuid",
        name: "Acme Corp",
      };
      const result = updateClientSchema.safeParse(invalid);
      expect(result.success).toBe(false);
    });
  });

  describe("archiveClientSchema", () => {
    it("validates archive flag payload", () => {
      const valid = {
        id: validId,
        isArchived: true,
      };
      const result = archiveClientSchema.safeParse(valid);
      expect(result.success).toBe(true);
    });
  });
});

describe("Zustand useClientFilterStore", () => {
  it("manages client search and status filters correctly", () => {
    const store = useClientFilterStore.getState();

    // Initial state
    expect(store.searchQuery).toBe("");
    expect(store.statusFilter).toBe("active");

    // Modify filters
    store.setSearchQuery("Starlight");
    store.setStatusFilter("archived");

    const updated = useClientFilterStore.getState();
    expect(updated.searchQuery).toBe("Starlight");
    expect(updated.statusFilter).toBe("archived");

    // Reset filters
    updated.resetFilters();
    const reset = useClientFilterStore.getState();
    expect(reset.searchQuery).toBe("");
    expect(reset.statusFilter).toBe("active");
  });

  describe("Server-Side Pagination & Egress Minimization (Clients)", () => {
    it("calculates accurate range and limit bounds for clients list query", () => {
      const calculateClientRange = (page: number, pageSize: number) => {
        const sanitizedPage = Math.max(1, page || 1);
        const sanitizedPageSize = Math.max(5, Math.min(50, pageSize || 20));
        const from = (sanitizedPage - 1) * sanitizedPageSize;
        const to = from + sanitizedPageSize - 1;
        return { page: sanitizedPage, pageSize: sanitizedPageSize, from, to };
      };

      const p1 = calculateClientRange(1, 20);
      expect(p1).toEqual({ page: 1, pageSize: 20, from: 0, to: 19 });

      const p2 = calculateClientRange(2, 20);
      expect(p2).toEqual({ page: 2, pageSize: 20, from: 20, to: 39 });

      // Clamping: max 50, min 5
      const clampedLarge = calculateClientRange(1, 500);
      expect(clampedLarge.pageSize).toBe(50);
      expect(clampedLarge.to).toBe(49);

      const clampedSmall = calculateClientRange(1, 1);
      expect(clampedSmall.pageSize).toBe(5);
      expect(clampedSmall.to).toBe(4);
    });
  });
});
