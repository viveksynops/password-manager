import { describe, it, expect, beforeEach, afterEach } from "vitest";
import {
  createCredentialSchema,
  updateCredentialSchema,
  deleteCredentialSchema,
  revealCredentialSchema,
} from "@/features/credentials/schemas";
import { generatePassword } from "@/utils/password-generator";
import { encrypt, decrypt } from "@/lib/crypto";

describe("Credential Management & Security (Phase 9)", () => {
  const originalKey = process.env.MASTER_KEY;
  const testKeyHex = "0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef";
  const validProjectId = "11111111-1111-4111-a111-111111111111";
  const validCredentialId = "22222222-2222-4222-a222-222222222222";

  beforeEach(() => {
    process.env.MASTER_KEY = testKeyHex;
  });

  afterEach(() => {
    process.env.MASTER_KEY = originalKey;
  });

  describe("createCredentialSchema", () => {
    it("validates valid credential input with full fields", () => {
      const valid = {
        projectId: validProjectId,
        serviceName: "Supabase Production",
        loginUrl: "https://supabase.com/dashboard",
        username: "admin@company.com",
        password: "SuperSecretPassword123!",
        notes: "MFA backup code: 123456",
      };
      const result = createCredentialSchema.safeParse(valid);
      expect(result.success).toBe(true);
    });

    it("allows optional loginUrl and notes", () => {
      const minimal = {
        projectId: validProjectId,
        serviceName: "Stripe API",
        username: "service_role",
        password: "sk_live_12345",
      };
      const result = createCredentialSchema.safeParse(minimal);
      expect(result.success).toBe(true);
    });

    it("rejects empty password on creation", () => {
      const invalid = {
        projectId: validProjectId,
        serviceName: "AWS Console",
        username: "dev_user",
        password: "",
      };
      const result = createCredentialSchema.safeParse(invalid);
      expect(result.success).toBe(false);
    });

    it("rejects invalid login URL format", () => {
      const invalid = {
        projectId: validProjectId,
        serviceName: "AWS Console",
        username: "dev_user",
        password: "ValidPassword123!",
        loginUrl: "not-a-valid-url",
      };
      const result = createCredentialSchema.safeParse(invalid);
      expect(result.success).toBe(false);
    });

    it("rejects service name shorter than 2 characters", () => {
      const invalid = {
        projectId: validProjectId,
        serviceName: "A",
        username: "dev_user",
        password: "ValidPassword123!",
      };
      const result = createCredentialSchema.safeParse(invalid);
      expect(result.success).toBe(false);
    });
  });

  describe("updateCredentialSchema", () => {
    it("allows leaving password empty when updating metadata", () => {
      const valid = {
        id: validCredentialId,
        projectId: validProjectId,
        serviceName: "Cloudinary Media",
        username: "new_admin@company.com",
        password: "", // unchanged
      };
      const result = updateCredentialSchema.safeParse(valid);
      expect(result.success).toBe(true);
    });

    it("validates updating password with new value", () => {
      const valid = {
        id: validCredentialId,
        projectId: validProjectId,
        serviceName: "Cloudinary Media",
        username: "admin@company.com",
        password: "NewRotatedPassword456!",
      };
      const result = updateCredentialSchema.safeParse(valid);
      expect(result.success).toBe(true);
    });

    it("rejects invalid credential UUID", () => {
      const invalid = {
        id: "invalid-uuid",
        projectId: validProjectId,
        serviceName: "Cloudinary",
        username: "user",
      };
      const result = updateCredentialSchema.safeParse(invalid);
      expect(result.success).toBe(false);
    });
  });

  describe("revealCredentialSchema and deleteCredentialSchema", () => {
    it("validates reveal action", () => {
      const valid = {
        id: validCredentialId,
        projectId: validProjectId,
        action: "reveal" as const,
      };
      const result = revealCredentialSchema.safeParse(valid);
      expect(result.success).toBe(true);
    });

    it("validates copy action", () => {
      const valid = {
        id: validCredentialId,
        projectId: validProjectId,
        action: "copy" as const,
      };
      const result = revealCredentialSchema.safeParse(valid);
      expect(result.success).toBe(true);
    });

    it("rejects unsupported action types", () => {
      const invalid = {
        id: validCredentialId,
        projectId: validProjectId,
        action: "export",
      };
      const result = revealCredentialSchema.safeParse(invalid);
      expect(result.success).toBe(false);
    });

    it("validates delete payload", () => {
      const valid = {
        id: validCredentialId,
        projectId: validProjectId,
      };
      const result = deleteCredentialSchema.safeParse(valid);
      expect(result.success).toBe(true);
    });
  });

  describe("Password Generator (TASK-086)", () => {
    it("generates password with default 20 character length", () => {
      const pw = generatePassword();
      expect(pw.length).toBe(20);
    });

    it("respects requested custom length", () => {
      const pw32 = generatePassword({ length: 32 });
      expect(pw32.length).toBe(32);

      const pw16 = generatePassword({ length: 16 });
      expect(pw16.length).toBe(16);
    });

    it("enforces minimum length of 12 characters", () => {
      const pw = generatePassword({ length: 6 });
      expect(pw.length).toBe(12);
    });

    it("generates unique passwords across invocations", () => {
      const pw1 = generatePassword();
      const pw2 = generatePassword();
      expect(pw1).not.toBe(pw2);
    });

    it("excludes ambiguous characters when requested", () => {
      const ambiguousChars = ["0", "O", "I", "l", "1"];
      for (let i = 0; i < 20; i++) {
        const pw = generatePassword({ length: 24, excludeAmbiguous: true });
        for (const char of ambiguousChars) {
          expect(pw.includes(char)).toBe(false);
        }
      }
    });
  });

  describe("AES-256-GCM Storage Encryption (TASK-076 / Security 🔒)", () => {
    it("encrypts secret password into distinct ciphertext, iv, and tag", () => {
      const plainSecret = "VerySecretDatabasePassword123#";
      const { ciphertext, iv, tag } = encrypt(plainSecret);

      expect(ciphertext).toBeDefined();
      expect(iv).toBeDefined();
      expect(tag).toBeDefined();
      expect(ciphertext).not.toBe(plainSecret);
      expect(iv.length).toBe(24); // 12 bytes = 24 hex chars
      expect(tag.length).toBe(32); // 16 bytes = 32 hex chars
    });

    it("decrypts ciphertext back to identical plaintext", () => {
      const plainSecret = "OriginalMasterSecret999!";
      const { ciphertext, iv, tag } = encrypt(plainSecret);
      const decrypted = decrypt(ciphertext, iv, tag);

      expect(decrypted).toBe(plainSecret);
    });

    it("uses unique IV for every encryption of identical plaintext", () => {
      const secret = "IdenticalPasswordForBothEncryptions";
      const enc1 = encrypt(secret);
      const enc2 = encrypt(secret);

      expect(enc1.iv).not.toBe(enc2.iv);
      expect(enc1.ciphertext).not.toBe(enc2.ciphertext);
    });
  });
});
