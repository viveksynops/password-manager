import "server-only";
import crypto from "crypto";

export const SHARE_SESSION_COOKIE_NAME = "cv_share_session";
export const SHARE_SESSION_DURATION_SECONDS = 20 * 60; // 20 minutes sliding window

export interface ShareSessionPayload {
  shareLinkId: string;
  sessionVersion: number;
  exp: number; // Unix timestamp in seconds
}

function getSessionSecret(): string {
  const secret = process.env.SHARE_SESSION_SECRET;
  if (!secret) {
    if (process.env.NODE_ENV === "production") {
      throw new Error("SHARE_SESSION_SECRET is not configured");
    }
    // Development fallback
    return "default-session-secret-00000000000000000000000000000000000000000000000000";
  }
  return secret;
}

/**
 * Create a signed HMAC-SHA256 session token string for a client who successfully entered a PIN.
 */
export function createShareSessionToken(params: {
  shareLinkId: string;
  sessionVersion: number;
  durationSeconds?: number;
}): string {
  const secret = getSessionSecret();
  const exp = Math.floor(Date.now() / 1000) + (params.durationSeconds ?? SHARE_SESSION_DURATION_SECONDS);

  const payload: ShareSessionPayload = {
    shareLinkId: params.shareLinkId,
    sessionVersion: params.sessionVersion,
    exp,
  };

  const payloadJson = JSON.stringify(payload);
  const payloadB64 = Buffer.from(payloadJson).toString("base64url");

  const signature = crypto
    .createHmac("sha256", secret)
    .update(payloadB64)
    .digest("base64url");

  return `${payloadB64}.${signature}`;
}

/**
 * Verify a signed session token. Returns the payload if valid and not expired, or null if invalid or expired.
 */
export function verifyShareSessionToken(tokenString: string): ShareSessionPayload | null {
  if (!tokenString || typeof tokenString !== "string") {
    return null;
  }

  const parts = tokenString.split(".");
  if (parts.length !== 2) {
    return null;
  }

  const [payloadB64, signature] = parts;
  const secret = getSessionSecret();

  const expectedSignature = crypto
    .createHmac("sha256", secret)
    .update(payloadB64)
    .digest("base64url");

  const sigBuf = Buffer.from(signature);
  const expBuf = Buffer.from(expectedSignature);

  if (sigBuf.length !== expBuf.length || !crypto.timingSafeEqual(sigBuf, expBuf)) {
    return null;
  }

  try {
    const jsonStr = Buffer.from(payloadB64, "base64url").toString("utf-8");
    const payload = JSON.parse(jsonStr) as ShareSessionPayload;

    if (!payload.shareLinkId || typeof payload.sessionVersion !== "number" || !payload.exp) {
      return null;
    }

    const nowSec = Math.floor(Date.now() / 1000);
    if (payload.exp <= nowSec) {
      return null; // Expired
    }

    return payload;
  } catch {
    return null;
  }
}
