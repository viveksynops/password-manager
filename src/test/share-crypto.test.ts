import { describe, it, expect, beforeEach } from "vitest";
import { generateToken, hashToken } from "@/lib/share/token";
import { generatePin, generatePinSalt, hashPin, verifyPin } from "@/lib/share/pin";
import { calculateExpiry, isExpired, ExpiryPreset } from "@/lib/share/expiry";
import { createShareSessionToken, verifyShareSessionToken } from "@/lib/share/session";

describe("Share Crypto Utilities", () => {
  beforeEach(() => {
    process.env.SHARE_PIN_PEPPER = "test-pepper-0123456789abcdef0123456789abcdef0123456789abcdef01234567";
    process.env.SHARE_SESSION_SECRET = "test-secret-0123456789abcdef0123456789abcdef0123456789abcdef012345";
  });

  describe("Token Generation & Hashing", () => {
    it("generates a random URL-safe base64url token of at least 43 characters", () => {
      const token1 = generateToken();
      const token2 = generateToken();
      expect(token1).not.toBe(token2);
      expect(token1.length).toBeGreaterThanOrEqual(43);
      expect(token1).toMatch(/^[A-Za-z0-9_-]+$/);
    });

    it("hashes token deterministically using SHA-256 hex", () => {
      const token = "custom-test-token-value";
      const hash1 = hashToken(token);
      const hash2 = hashToken(token);
      expect(hash1).toBe(hash2);
      expect(hash1).toHaveLength(64);
    });
  });

  describe("PIN Generation, Hashing & Verification", () => {
    it("generates a 6-digit numeric string with leading zeros if needed", () => {
      for (let i = 0; i < 20; i++) {
        const pin = generatePin();
        expect(pin).toMatch(/^\d{6}$/);
      }
    });

    it("hashes PIN with scrypt and salt", () => {
      const salt = generatePinSalt();
      const pin = "123456";
      const hash = hashPin(pin, salt);
      expect(hash).toBeDefined();
      expect(hash.length).toBe(64); // 32 bytes in hex = 64 chars
    });

    it("verifies matching PIN correctly and rejects mismatched PIN", () => {
      const salt = generatePinSalt();
      const pin = "482910";
      const wrongPin = "482911";
      const hash = hashPin(pin, salt);

      expect(verifyPin(pin, salt, hash)).toBe(true);
      expect(verifyPin(wrongPin, salt, hash)).toBe(false);
      expect(verifyPin("000000", salt, hash)).toBe(false);
    });
  });

  describe("Expiry Logic", () => {
    it("calculates correct future date for presets", () => {
      const now = Date.now();
      const exp30 = calculateExpiry("30d");
      expect(exp30).not.toBeNull();
      const diffDays30 = (exp30!.getTime() - now) / (1000 * 60 * 60 * 24);
      expect(Math.round(diffDays30)).toBe(30);

      const expNever = calculateExpiry("never");
      expect(expNever).toBeNull();
    });

    it("determines whether a link is expired", () => {
      const past = new Date(Date.now() - 10000).toISOString();
      const future = new Date(Date.now() + 100000).toISOString();

      expect(isExpired({ expires_at: past, never_expires: false })).toBe(true);
      expect(isExpired({ expires_at: future, never_expires: false })).toBe(false);
      expect(isExpired({ expires_at: null, never_expires: true })).toBe(false);
      expect(isExpired({ expires_at: past, never_expires: true })).toBe(false);
    });
  });

  describe("Session HMAC Token", () => {
    it("creates and verifies a valid session token", () => {
      const token = createShareSessionToken({
        shareLinkId: "link-123",
        sessionVersion: 1,
        durationSeconds: 1200,
      });

      const verified = verifyShareSessionToken(token);
      expect(verified).not.toBeNull();
      expect(verified?.shareLinkId).toBe("link-123");
      expect(verified?.sessionVersion).toBe(1);
    });

    it("rejects tampered session token payload or signature", () => {
      const token = createShareSessionToken({
        shareLinkId: "link-123",
        sessionVersion: 1,
      });

      const [payloadB64, sig] = token.split(".");
      // Tamper signature
      const tamperedSig = sig.slice(0, -2) + "xx";
      expect(verifyShareSessionToken(`${payloadB64}.${tamperedSig}`)).toBeNull();

      // Tamper payload
      const tamperedPayload = Buffer.from(JSON.stringify({ shareLinkId: "link-evil", sessionVersion: 1, exp: 9999999999 })).toString("base64url");
      expect(verifyShareSessionToken(`${tamperedPayload}.${sig}`)).toBeNull();
    });

    it("rejects expired session token", () => {
      const expiredToken = createShareSessionToken({
        shareLinkId: "link-123",
        sessionVersion: 1,
        durationSeconds: -10, // already expired
      });

      expect(verifyShareSessionToken(expiredToken)).toBeNull();
    });
  });
});
