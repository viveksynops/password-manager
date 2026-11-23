import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { encrypt, decrypt } from "@/lib/crypto";
import crypto from "crypto";

describe("lib/crypto.ts (TASK-027)", () => {
  const originalKey = process.env.MASTER_KEY;
  const testKeyHex = "0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef";

  beforeEach(() => {
    process.env.MASTER_KEY = testKeyHex;
  });

  afterEach(() => {
    process.env.MASTER_KEY = originalKey;
  });

  it("performs a successful round trip encryption and decryption", () => {
    const secret = "SuperSecretClientPassword123!@#";
    const encrypted = encrypt(secret);

    expect(encrypted.ciphertext).toBeDefined();
    expect(encrypted.iv).toHaveLength(24); // 12 bytes = 24 hex chars
    expect(encrypted.tag).toHaveLength(32); // 16 bytes = 32 hex chars

    const decrypted = decrypt(encrypted.ciphertext, encrypted.iv, encrypted.tag);
    expect(decrypted).toBe(secret);
  });

  it("generates unique IVs and ciphertexts for the same plaintext", () => {
    const text = "constant_password_value";
    const first = encrypt(text);
    const second = encrypt(text);

    expect(first.iv).not.toBe(second.iv);
    expect(first.ciphertext).not.toBe(second.ciphertext);

    expect(decrypt(first.ciphertext, first.iv, first.tag)).toBe(text);
    expect(decrypt(second.ciphertext, second.iv, second.tag)).toBe(text);
  });

  it("fails to decrypt if ciphertext is tampered with", () => {
    const secret = "tamper_test";
    const encrypted = encrypt(secret);

    // Flip a character in the ciphertext
    const tamperedCiphertext =
      encrypted.ciphertext.slice(0, -1) + (encrypted.ciphertext.endsWith("a") ? "b" : "a");

    expect(() => {
      decrypt(tamperedCiphertext, encrypted.iv, encrypted.tag);
    }).toThrow();
  });

  it("fails to decrypt if authentication tag is tampered with", () => {
    const secret = "tag_tamper_test";
    const encrypted = encrypt(secret);

    const tamperedTag = encrypted.tag.slice(0, -1) + (encrypted.tag.endsWith("0") ? "1" : "0");

    expect(() => {
      decrypt(encrypted.ciphertext, encrypted.iv, tamperedTag);
    }).toThrow();
  });

  it("fails to decrypt when using a different key", () => {
    const secret = "key_mismatch_test";
    const encrypted = encrypt(secret);

    const anotherKey = crypto.randomBytes(32);

    expect(() => {
      decrypt(encrypted.ciphertext, encrypted.iv, encrypted.tag, anotherKey);
    }).toThrow();
  });

  it("handles empty strings, long text, and unicode/emojis", () => {
    const inputs = [
      "",
      "🔑 Special Unicode & emojis 🚀 🔐",
      "A".repeat(10000), // 10KB string
      "DATABASE_URL=postgres://user:pass@host:5432/dbname?sslmode=require\nAPI_KEY=xyz",
    ];

    for (const input of inputs) {
      const enc = encrypt(input);
      const dec = decrypt(enc.ciphertext, enc.iv, enc.tag);
      expect(dec).toBe(input);
    }
  });

  it("throws safe error if MASTER_KEY is missing", () => {
    delete process.env.MASTER_KEY;
    expect(() => encrypt("fail_test")).toThrow(/MASTER_KEY environment variable is not set/);
  });
});
