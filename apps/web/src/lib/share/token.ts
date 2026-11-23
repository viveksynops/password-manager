import "server-only";
import crypto from "crypto";

/**
 * Generate a cryptographically secure 256-bit random base64url token.
 */
export function generateToken(): string {
  return crypto.randomBytes(32).toString("base64url");
}

/**
 * Hash a share token using SHA-256 hex digest for secure database storage and lookup.
 */
export function hashToken(token: string): string {
  return crypto.createHash("sha256").update(token).digest("hex");
}
