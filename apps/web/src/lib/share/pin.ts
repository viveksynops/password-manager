import "server-only";
import crypto from "crypto";

function getPepper(): string {
  const pepper = process.env.SHARE_PIN_PEPPER;
  if (!pepper) {
    if (process.env.NODE_ENV === "production") {
      throw new Error("SHARE_PIN_PEPPER is not configured");
    }
    // Development fallback
    return "default-dev-pepper-00000000000000000000000000000000000000000000000000000000";
  }
  return pepper;
}

/**
 * Generate a 6-digit numeric PIN (e.g. "048291").
 */
export function generatePin(): string {
  return crypto.randomInt(0, 1000000).toString().padStart(6, "0");
}

/**
 * Generate a random salt for PIN hashing.
 */
export function generatePinSalt(): string {
  return crypto.randomBytes(16).toString("hex");
}

/**
 * Hash a 6-digit PIN using scrypt with salt and server-side pepper.
 */
export function hashPin(pin: string, salt: string): string {
  const pepper = getPepper();
  const derivedKey = crypto.scryptSync(pin + pepper, salt, 32);
  return derivedKey.toString("hex");
}

/**
 * Verify a candidate PIN against stored salt and expected hash using timing-safe comparison.
 */
export function verifyPin(pin: string, salt: string, expectedHash: string): boolean {
  try {
    const candidateHash = hashPin(pin, salt);
    const candidateBuf = Buffer.from(candidateHash, "hex");
    const expectedBuf = Buffer.from(expectedHash, "hex");

    if (candidateBuf.length !== expectedBuf.length) {
      return false;
    }

    return crypto.timingSafeEqual(candidateBuf, expectedBuf);
  } catch {
    return false;
  }
}
