import "server-only";
import crypto from "crypto";

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 12; // 12 bytes standard for GCM
const KEY_LENGTH = 32; // 256 bits

function getMasterKey(): Buffer {
  const hexKey = process.env.MASTER_KEY;
  if (!hexKey) {
    throw new Error("Encryption failed: MASTER_KEY environment variable is not set.");
  }
  if (hexKey.length !== 64 || !/^[0-9a-fA-F]+$/.test(hexKey)) {
    throw new Error("Encryption failed: MASTER_KEY must be a 64-character (32-byte) hex string.");
  }
  return Buffer.from(hexKey, "hex");
}

export interface EncryptedData {
  ciphertext: string; // hex encoded
  iv: string; // hex encoded
  tag: string; // hex encoded
}

/**
 * Encrypts plaintext using AES-256-GCM with a fresh random 12-byte IV.
 * @param plaintext String to encrypt
 * @param customKey Optional key for testing or rotation
 */
export function encrypt(plaintext: string, customKey?: Buffer): EncryptedData {
  const key = customKey ?? getMasterKey();
  if (key.length !== KEY_LENGTH) {
    throw new Error(`Encryption failed: key must be ${KEY_LENGTH} bytes.`);
  }

  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv, { authTagLength: 16 });

  let encrypted = cipher.update(plaintext, "utf8", "hex");
  encrypted += cipher.final("hex");

  const tag = cipher.getAuthTag();

  return {
    ciphertext: encrypted,
    iv: iv.toString("hex"),
    tag: tag.toString("hex"),
  };
}

/**
 * Decrypts AES-256-GCM ciphertext and verifies authentication tag.
 * @param ciphertext Hex encoded ciphertext
 * @param iv Hex encoded IV
 * @param tag Hex encoded auth tag
 * @param customKey Optional key for testing or rotation
 */
export function decrypt(ciphertext: string, iv: string, tag: string, customKey?: Buffer): string {
  const key = customKey ?? getMasterKey();
  if (key.length !== KEY_LENGTH) {
    throw new Error(`Decryption failed: key must be ${KEY_LENGTH} bytes.`);
  }

  const ivBuffer = Buffer.from(iv, "hex");
  const tagBuffer = Buffer.from(tag, "hex");

  if (ivBuffer.length !== IV_LENGTH) {
    throw new Error("Decryption failed: Invalid IV length.");
  }
  if (tagBuffer.length !== 16) {
    throw new Error("Decryption failed: Invalid authentication tag length.");
  }

  const decipher = crypto.createDecipheriv(ALGORITHM, key, ivBuffer, { authTagLength: 16 });
  decipher.setAuthTag(tagBuffer);

  let decrypted = decipher.update(ciphertext, "hex", "utf8");
  decrypted += decipher.final("utf8");

  return decrypted;
}
