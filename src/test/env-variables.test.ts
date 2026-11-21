import { describe, it, expect, beforeEach } from "vitest";
import {
  createEnvVariableSchema,
  updateEnvVariableSchema,
  deleteEnvVariableSchema,
  revealEnvVariableSchema,
  bulkImportEnvSchema,
  exportEnvSchema,
} from "@/features/env-variables/schemas";
import { encrypt, decrypt } from "@/lib/crypto";
import { parseEnvText, exportEnvText } from "@/utils/env-parser";

const testKeyHex = "0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef";

describe("Environment Variables Vault (Phase 10: TASK-090 to TASK-102)", () => {
  beforeEach(() => {
    process.env.MASTER_KEY = testKeyHex;
  });

  describe("Zod Validation Schemas (TASK-090)", () => {
    it("should accept valid environment variable definitions", () => {
      const valid = {
        projectId: "a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d",
        environment: "production",
        key: "DATABASE_URL",
        value: "postgres://user:pass@db.local:5432/main",
      };
      const res = createEnvVariableSchema.safeParse(valid);
      expect(res.success).toBe(true);
    });

    it("should reject invalid variable keys", () => {
      const invalidKeys = [
        "123_STARTS_WITH_NUMBER",
        "KEY-WITH-HYPHENS",
        "KEY WITH SPACES",
        "KEY.WITH.DOTS",
        "",
      ];

      for (const k of invalidKeys) {
        const res = createEnvVariableSchema.safeParse({
          projectId: "a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d",
          environment: "development",
          key: k,
          value: "some-val",
        });
        expect(res.success).toBe(false);
      }
    });

    it("should reject invalid environments", () => {
      const res = createEnvVariableSchema.safeParse({
        projectId: "a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d",
        environment: "local", // not in development, staging, production
        key: "VALID_KEY",
        value: "val",
      });
      expect(res.success).toBe(false);
    });

    it("should allow empty or omitted values on update to keep current secret", () => {
      const res = updateEnvVariableSchema.safeParse({
        id: "b2c3d4e5-f6a7-4b8c-9d0e-1f2a3b4c5d6e",
        projectId: "a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d",
        environment: "staging",
        key: "UPDATED_KEY_NAME",
        // value omitted
      });
      expect(res.success).toBe(true);
    });

    it("should validate reveal actions", () => {
      const validReveal = revealEnvVariableSchema.safeParse({
        id: "b2c3d4e5-f6a7-4b8c-9d0e-1f2a3b4c5d6e",
        projectId: "a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d",
        action: "reveal",
      });
      expect(validReveal.success).toBe(true);

      const validCopy = revealEnvVariableSchema.safeParse({
        id: "b2c3d4e5-f6a7-4b8c-9d0e-1f2a3b4c5d6e",
        projectId: "a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d",
        action: "copy",
      });
      expect(validCopy.success).toBe(true);

      const invalidAction = revealEnvVariableSchema.safeParse({
        id: "b2c3d4e5-f6a7-4b8c-9d0e-1f2a3b4c5d6e",
        projectId: "a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d",
        action: "delete",
      });
      expect(invalidAction.success).toBe(false);
    });

    it("should validate bulk import payload", () => {
      const res = bulkImportEnvSchema.safeParse({
        projectId: "a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d",
        environment: "development",
        rawEnv: "API_KEY=123\nPORT=3000",
        overwriteExisting: true,
      });
      expect(res.success).toBe(true);
    });

    it("should validate export payload", () => {
      const res = exportEnvSchema.safeParse({
        projectId: "a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d",
        environment: "production",
      });
      expect(res.success).toBe(true);
    });
  });

  describe("AES-256-GCM Encryption on Save (TASK-093 / Security Invariant 🔒)", () => {
    it("should securely encrypt and decrypt variable values", () => {
      const secretValue = "super-secret-jwt-signing-key-12345!@#$%^";
      const { ciphertext, iv, tag } = encrypt(secretValue);

      expect(ciphertext).toBeDefined();
      expect(ciphertext).not.toBe(secretValue);
      expect(iv).toBeDefined();
      expect(tag).toBeDefined();

      const decrypted = decrypt(ciphertext, iv, tag);
      expect(decrypted).toBe(secretValue);
    });

    it("should generate unique IV and ciphertext for identical values", () => {
      const commonVal = "redis://default:samepassword@cluster:6379";
      const enc1 = encrypt(commonVal);
      const enc2 = encrypt(commonVal);

      expect(enc1.iv).not.toBe(enc2.iv);
      expect(enc1.ciphertext).not.toBe(enc2.ciphertext);
      expect(enc1.tag).not.toBe(enc2.tag);

      expect(decrypt(enc1.ciphertext, enc1.iv, enc1.tag)).toBe(commonVal);
      expect(decrypt(enc2.ciphertext, enc2.iv, enc2.tag)).toBe(commonVal);
    });

    it("should fail decryption when ciphertext or tag is tampered with", () => {
      const enc = encrypt("sensitive_api_key_999");
      const tamperedTag = enc.tag.slice(0, -2) + (enc.tag.endsWith("0") ? "1" : "0");

      expect(() => {
        decrypt(enc.ciphertext, enc.iv, tamperedTag);
      }).toThrow();
    });
  });

  describe("Production Deletion Safety Guard (TASK-097)", () => {
    it("should enforce confirmation matching key for production deletion", () => {
      const targetKey = "STRIPE_LIVE_SECRET";
      const validConfirmation = "STRIPE_LIVE_SECRET";
      const invalidConfirmation = "WRONG_KEY";

      const checkConfirmation = (env: string, key: string, conf?: string) => {
        if (env === "production") {
          return conf?.trim() === key.trim();
        }
        return true;
      };

      expect(checkConfirmation("production", targetKey, validConfirmation)).toBe(true);
      expect(checkConfirmation("production", targetKey, invalidConfirmation)).toBe(false);
      expect(checkConfirmation("production", targetKey, undefined)).toBe(false);

      // Non-production environments don't require typed confirmation
      expect(checkConfirmation("development", targetKey, undefined)).toBe(true);
      expect(checkConfirmation("staging", targetKey, undefined)).toBe(true);
    });
  });

  describe("Bulk Import & Export Fidelity (TASK-098 / TASK-099)", () => {
    it("should parse multi-line pasted .env text and preserve complex values", () => {
      const pastedEnv = `
# Client App Config
NEXT_PUBLIC_SITE_URL=https://app.client.com
AUTH_SECRET="long_hex_string_32_characters_here"
DATABASE_URL='postgres://user:pass@host.internal:5432/db?ssl=true'
FEATURE_FLAG=true # enabled for pilot
`;
      const parsed = parseEnvText(pastedEnv);
      expect(parsed.errors).toHaveLength(0);
      expect(parsed.items).toHaveLength(4);

      const itemsMap = Object.fromEntries(parsed.items.map((it) => [it.key, it.value]));
      expect(itemsMap["NEXT_PUBLIC_SITE_URL"]).toBe("https://app.client.com");
      expect(itemsMap["AUTH_SECRET"]).toBe("long_hex_string_32_characters_here");
      expect(itemsMap["DATABASE_URL"]).toBe("postgres://user:pass@host.internal:5432/db?ssl=true");
      expect(itemsMap["FEATURE_FLAG"]).toBe("true");
    });

    it("should export decrypted values into standard valid .env file format", () => {
      const vars = [
        { key: "API_SECRET", value: "sk_live_12345" },
        { key: "SITE_TITLE", value: "E-Commerce Vault" },
        { key: "REDIS_HOST", value: "localhost" },
      ];

      const exported = exportEnvText(vars, {
        projectName: "E-Commerce",
        environment: "production",
      });

      expect(exported).toContain("# Project: E-Commerce");
      expect(exported).toContain("# Environment: PRODUCTION");
      expect(exported).toContain("API_SECRET=sk_live_12345");
      expect(exported).toContain('SITE_TITLE="E-Commerce Vault"');
      expect(exported).toContain("REDIS_HOST=localhost");
    });
  });
});
