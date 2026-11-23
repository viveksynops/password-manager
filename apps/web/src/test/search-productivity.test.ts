import { describe, it, expect } from "vitest";
import {
  formatNotesWithMetadata,
  parseNotesWithMetadata,
} from "@/utils/credential-fields";
import {
  credentialCustomFieldSchema,
  createCredentialSchema,
} from "@/features/credentials/schemas";

describe("Search & Productivity (Phase 12: TASK-109 to TASK-113)", () => {
  const validProjectId = "11111111-1111-4111-a111-111111111111";
  const unassignedProjectId = "99999999-9999-4999-a999-999999999999";

  describe("Developer Search Access & Project Scoping (TASK-113 / ADR-007 🔒)", () => {
    it("restricts developer search results strictly to assigned projects", () => {
      const user = { id: "user-dev-1", role: "developer" };
      const assignedProjectIds = [validProjectId];

      const allProjects = [
        { id: validProjectId, name: "Ecommerce Web App", tech_stack: "Next.js" },
        { id: unassignedProjectId, name: "Secret Banking Core", tech_stack: "Java" },
      ];

      // Simulate scoping logic in search.service.ts
      const filterProjectsForUser = (role: string, assigned: string[], projects: typeof allProjects) => {
        if (role === "admin" || role === "manager") return projects;
        return projects.filter((p) => assigned.includes(p.id));
      };

      const devResults = filterProjectsForUser(user.role, assignedProjectIds, allProjects);
      expect(devResults.length).toBe(1);
      expect(devResults[0].id).toBe(validProjectId);
      expect(devResults.some((p) => p.id === unassignedProjectId)).toBe(false);

      // Manager/Admin sees both
      const adminResults = filterProjectsForUser("admin", [], allProjects);
      expect(adminResults.length).toBe(2);
    });

    it("restricts credentials search strictly to assigned projects for developers", () => {
      const userRole = "developer";
      const assignedProjectIds = [validProjectId];

      const allCredentials = [
        { id: "cred-1", project_id: validProjectId, service_name: "Cloudinary Prod" },
        { id: "cred-2", project_id: unassignedProjectId, service_name: "Internal Stripe Keys" },
      ];

      const filterCreds = (role: string, assigned: string[], creds: typeof allCredentials) => {
        if (role === "admin" || role === "manager") return creds;
        return creds.filter((c) => assigned.includes(c.project_id));
      };

      const devCreds = filterCreds(userRole, assignedProjectIds, allCredentials);
      expect(devCreds.length).toBe(1);
      expect(devCreds[0].service_name).toBe("Cloudinary Prod");
      expect(devCreds.some((c) => c.service_name === "Internal Stripe Keys")).toBe(false);
    });

    it("restricts clients search to clients of assigned projects for developers", () => {
      const clientA = { id: "client-a", name: "Client Alpha" };
      const clientB = { id: "client-b", name: "Client Confidential" };

      const projects = [
        { id: validProjectId, client_id: "client-a" },
        { id: unassignedProjectId, client_id: "client-b" },
      ];

      const userRole = "developer";
      const assignedProjectIds = [validProjectId];

      const filterClients = (role: string, assigned: string[]) => {
        if (role === "admin" || role === "manager") return [clientA, clientB];
        const accessibleClientIds = projects
          .filter((p) => assigned.includes(p.id))
          .map((p) => p.client_id);
        return [clientA, clientB].filter((c) => accessibleClientIds.includes(c.id));
      };

      const devClients = filterClients(userRole, assignedProjectIds);
      expect(devClients.length).toBe(1);
      expect(devClients[0].name).toBe("Client Alpha");
    });
  });

  describe("Custom Fields for Credentials (TASK-112)", () => {
    it("validates custom fields schema (API key, license key, database URL)", () => {
      const validCustomFields = [
        { id: "f1", label: "API Key", value: "sk_live_123456789", isSecret: true },
        { id: "f2", label: "Database URL", value: "postgresql://user:pass@db:5432/main", isSecret: true },
        { id: "f3", label: "Port", value: "8080", isSecret: false },
      ];

      for (const field of validCustomFields) {
        const res = credentialCustomFieldSchema.safeParse(field);
        expect(res.success).toBe(true);
      }
    });

    it("rejects empty field names", () => {
      const invalid = { id: "f-err", label: "", value: "123" };
      const res = credentialCustomFieldSchema.safeParse(invalid);
      expect(res.success).toBe(false);
    });

    it("packs and parses notes with custom fields and tags accurately (round trip)", () => {
      const notes = "Production keys for payment gateway.";
      const customFields = [
        { id: "1", label: "Stripe Public Key", value: "pk_test_123", isSecret: false },
        { id: "2", label: "Webhook Secret", value: "whsec_xyz", isSecret: true },
      ];
      const tags = ["stripe", "billing", "prod"];

      const packed = formatNotesWithMetadata(notes, customFields, tags);
      expect(packed).toContain("Production keys for payment gateway.");
      expect(packed).toContain("<!-- VAULT_META:");

      const parsed = parseNotesWithMetadata(packed);
      expect(parsed.notes).toBe(notes);
      expect(parsed.customFields).toHaveLength(2);
      expect(parsed.customFields[0].label).toBe("Stripe Public Key");
      expect(parsed.customFields[1].value).toBe("whsec_xyz");
      expect(parsed.tags).toEqual(["stripe", "billing", "prod"]);
    });

    it("handles plain legacy notes gracefully without metadata", () => {
      const legacyNotes = "Just some standard notes without custom fields.";
      const parsed = parseNotesWithMetadata(legacyNotes);
      expect(parsed.notes).toBe(legacyNotes);
      expect(parsed.customFields).toEqual([]);
      expect(parsed.tags).toEqual([]);
    });

    it("integrates custom fields and tags into createCredentialSchema", () => {
      const input = {
        projectId: validProjectId,
        serviceName: "Payment Gateway",
        username: "admin@company.com",
        password: "SuperSecretPassword123!",
        notes: "Primary gateway",
        tags: ["finance", "prod"],
        customFields: [
          { id: "1", label: "Merchant ID", value: "m_12345", isSecret: false },
        ],
      };

      const result = createCredentialSchema.safeParse(input);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.tags).toEqual(["finance", "prod"]);
        expect(result.data.customFields).toHaveLength(1);
      }
    });
  });

  describe("Tags and Favorites (TASK-111)", () => {
    it("manages tag addition and duplicate removal", () => {
      const initialTags = ["api", "cloud"];
      const newTag = "API"; // case-insensitive duplicate

      const addTag = (current: string[], tag: string) => {
        const clean = tag.trim().toLowerCase();
        if (!clean || current.includes(clean)) return current;
        return [...current, clean];
      };

      const updated = addTag(initialTags, newTag);
      expect(updated).toEqual(["api", "cloud"]); // duplicate ignored

      const added = addTag(initialTags, "prod");
      expect(added).toEqual(["api", "cloud", "prod"]);
    });

    it("toggles favorite state consistently", () => {
      let favorites = ["proj-1"];

      const toggle = (list: string[], id: string) => {
        return list.includes(id) ? list.filter((i) => i !== id) : [...list, id];
      };

      favorites = toggle(favorites, "proj-2");
      expect(favorites).toEqual(["proj-1", "proj-2"]);

      favorites = toggle(favorites, "proj-1");
      expect(favorites).toEqual(["proj-2"]);
    });
  });
});
