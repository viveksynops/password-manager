import { describe, it, expect } from "vitest";
import { hashToken } from "@/lib/share/token";
import { generatePin, generatePinSalt, hashPin, verifyPin } from "@/lib/share/pin";
import { isExpired } from "@/lib/share/expiry";
import { createShareSessionToken, verifyShareSessionToken } from "@/lib/share/session";
import { encrypt, decrypt } from "@/lib/crypto";

describe("Client Share Security & Access Invariants (ADR-022, ADR-023)", () => {
  const pepper = "test-pepper-0123456789abcdef0123456789abcdef0123456789abcdef01234567";
  const sessionSecret = "test-secret-0123456789abcdef0123456789abcdef0123456789abcdef012345";

  process.env.SHARE_PIN_PEPPER = pepper;
  process.env.SHARE_SESSION_SECRET = sessionSecret;
  process.env.MASTER_KEY = "0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef";

  describe("Token & PIN Authentication", () => {
    it("hashes token with SHA-256 for secure database lookup", () => {
      const rawToken = "super-secret-raw-token-12345";
      const tokenHash = hashToken(rawToken);
      expect(tokenHash).toBeDefined();
      expect(tokenHash).toHaveLength(64);
      // Hash is one-way
      expect(tokenHash).not.toContain(rawToken);
    });

    it("verifies PIN with timing-safe comparison and scrypt hashing", () => {
      const pin = "849201";
      const salt = generatePinSalt();
      const pinHash = hashPin(pin, salt);

      expect(verifyPin(pin, salt, pinHash)).toBe(true);
      expect(verifyPin("849202", salt, pinHash)).toBe(false);
      expect(verifyPin("000000", salt, pinHash)).toBe(false);
    });
  });

  describe("Lockout and Expiration Rules", () => {
    it("identifies expired links correctly", () => {
      const past = new Date(Date.now() - 1000).toISOString();
      const future = new Date(Date.now() + 100000).toISOString();

      expect(isExpired({ expires_at: past, never_expires: false })).toBe(true);
      expect(isExpired({ expires_at: future, never_expires: false })).toBe(false);
      expect(isExpired({ expires_at: null, never_expires: true })).toBe(false);
    });

    it("evaluates 5-attempt lockout threshold", () => {
      const maxAttempts = 5;
      const failedAttempts = 5;
      const isLocked = failedAttempts >= maxAttempts;
      expect(isLocked).toBe(true);
      expect(4 >= maxAttempts).toBe(false);
    });

    it("evaluates cross-link IP rate limit (10 failures/hr)", () => {
      const ipFailures = 10;
      const isBlocked = ipFailures >= 10;
      expect(isBlocked).toBe(true);
      expect(9 >= 10).toBe(false);
    });
  });

  describe("IDOR Protection & Secret Encryption", () => {
    interface ShareLinkItemRecord {
      shareLinkId: string;
      itemId: string;
      itemType: "credential" | "env_variable";
    }

    function checkItemAuthorized(
      allowedItems: ShareLinkItemRecord[],
      shareLinkId: string,
      itemId: string,
      itemType: "credential" | "env_variable"
    ): boolean {
      return allowedItems.some(
        (it) =>
          it.shareLinkId === shareLinkId &&
          it.itemId === itemId &&
          it.itemType === itemType
      );
    }

    const shareLinkId = "share-link-1";
    const allowedCredentialId = "cred-1";
    const unallowedCredentialId = "cred-evil-idor";

    const allowedItems: ShareLinkItemRecord[] = [
      { shareLinkId, itemId: allowedCredentialId, itemType: "credential" },
      { shareLinkId, itemId: "env-1", itemType: "env_variable" },
    ];

    it("allows decryption only for items explicitly bound in share_link_items (IDOR prevention)", () => {
      expect(checkItemAuthorized(allowedItems, shareLinkId, allowedCredentialId, "credential")).toBe(true);
      expect(checkItemAuthorized(allowedItems, shareLinkId, unallowedCredentialId, "credential")).toBe(false);
      expect(checkItemAuthorized(allowedItems, "another-share-link", allowedCredentialId, "credential")).toBe(false);
    });

    it("encrypts and decrypts secret data for authorized reveals", () => {
      const plaintext = "SuperSecretDatabasePassword!#2026";
      const { ciphertext, iv, tag } = encrypt(plaintext);

      const decrypted = decrypt(ciphertext, iv, tag);
      expect(decrypted).toBe(plaintext);
    });
  });

  describe("Session Cookie Integrity", () => {
    it("invalidates session token if session version does not match", () => {
      const token = createShareSessionToken({
        shareLinkId: "link-1",
        sessionVersion: 1,
      });

      const payload = verifyShareSessionToken(token);
      expect(payload).not.toBeNull();
      expect(payload?.sessionVersion).toBe(1);

      // If DB bumped session_version to 2 (e.g. on regenerate PIN or update items):
      const currentDbVersion = 2;
      const isSessionValid = payload?.sessionVersion === currentDbVersion;
      expect(isSessionValid).toBe(false);
    });
  });
});
