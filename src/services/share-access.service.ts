import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import { decrypt } from "@/lib/crypto";
import { hashToken } from "@/lib/share/token";
import { verifyPin } from "@/lib/share/pin";
import { isExpired } from "@/lib/share/expiry";
import {
  createShareSessionToken,
  verifyShareSessionToken,
} from "@/lib/share/session";
import { logAction } from "./audit.service";

export type ShareLinkValidationResult =
  | {
      valid: true;
      link: {
        id: string;
        projectId: string;
        label: string;
        projectName: string;
        sessionVersion: number;
        expiresAt: string | null;
        neverExpires: boolean;
      };
    }
  | {
      valid: false;
      error: "not_found" | "revoked" | "expired" | "max_views_reached" | "locked";
      lockedUntil?: string | null;
      projectName?: string;
      label?: string;
    };

/**
 * Validates a share link token without secrets.
 */
export async function validateShareLink(token: string): Promise<ShareLinkValidationResult> {
  const supabase = createAdminClient();
  const tokenHash = hashToken(token);

  const { data: link, error } = await supabase
    .from("share_links")
    .select(`
      id,
      project_id,
      label,
      expires_at,
      never_expires,
      max_views,
      view_count,
      status,
      failed_attempts,
      locked_until,
      session_version,
      projects (name)
    `)
    .eq("token_hash", tokenHash)
    .maybeSingle();

  if (error || !link) {
    return { valid: false, error: "not_found" };
  }

  const projectName = (link.projects as unknown as { name: string } | null)?.name || "Project";

  if (link.status === "revoked") {
    return { valid: false, error: "revoked", projectName, label: link.label };
  }

  if (isExpired({ expires_at: link.expires_at, never_expires: link.never_expires })) {
    return { valid: false, error: "expired", projectName, label: link.label };
  }

  if (link.max_views !== null && link.view_count >= link.max_views) {
    return { valid: false, error: "max_views_reached", projectName, label: link.label };
  }

  const now = new Date();
  if (link.locked_until && new Date(link.locked_until) > now) {
    return {
      valid: false,
      error: "locked",
      lockedUntil: link.locked_until,
      projectName,
      label: link.label,
    };
  }

  return {
    valid: true,
    link: {
      id: link.id,
      projectId: link.project_id,
      label: link.label,
      projectName,
      sessionVersion: link.session_version,
      expiresAt: link.expires_at,
      neverExpires: link.never_expires,
    },
  };
}

/**
 * Verifies a candidate PIN against a share link token with rate limiting and lockout.
 */
export async function verifyPinAttempt(
  token: string,
  candidatePin: string,
  ipAddress: string
): Promise<{ success: boolean; sessionToken?: string; error?: string }> {
  const supabase = createAdminClient();
  const tokenHash = hashToken(token);

  // 1. Cross-link IP rate limit: max 10 failed attempts per hour across all share links
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
  const { count: ipFailures } = await supabase
    .from("share_link_attempts")
    .select("id", { count: "exact", head: true })
    .eq("ip_address", ipAddress)
    .eq("success", false)
    .gte("created_at", oneHourAgo);

  if ((ipFailures || 0) >= 10) {
    await logAction({
      action: "share.blocked",
      targetType: "share_link",
      ipAddress,
      metadata: { reason: "ip_rate_limit_exceeded", failureCount: ipFailures },
    });
    return {
      success: false,
      error: "Too many failed attempts from your network. Please wait 1 hour before trying again.",
    };
  }

  // 2. Fetch share link with PIN credentials
  const { data: link, error } = await supabase
    .from("share_links")
    .select(`
      id,
      project_id,
      label,
      pin_hash,
      pin_salt,
      expires_at,
      never_expires,
      max_views,
      view_count,
      status,
      failed_attempts,
      locked_until,
      session_version
    `)
    .eq("token_hash", tokenHash)
    .maybeSingle();

  if (error || !link) {
    await new Promise((r) => setTimeout(r, 500));
    return { success: false, error: "Share link not found or invalid." };
  }

  if (link.status === "revoked") {
    return { success: false, error: "This share link has been revoked." };
  }

  if (isExpired({ expires_at: link.expires_at, never_expires: link.never_expires })) {
    return { success: false, error: "This share link has expired." };
  }

  if (link.max_views !== null && link.view_count >= link.max_views) {
    return { success: false, error: "This share link has reached its maximum view limit." };
  }

  const now = new Date();
  if (link.locked_until && new Date(link.locked_until) > now) {
    return {
      success: false,
      error: "This share link is temporarily locked due to too many failed attempts. Try again in 30 minutes.",
    };
  }

  // 3. Verify PIN
  const isMatch = verifyPin(candidatePin, link.pin_salt, link.pin_hash);

  if (!isMatch) {
    // Record failed attempt
    await supabase.from("share_link_attempts").insert({
      share_link_id: link.id,
      ip_address: ipAddress,
      success: false,
    });

    const newFailed = link.failed_attempts + 1;
    let lockedUntil: string | null = null;

    if (newFailed >= 5) {
      lockedUntil = new Date(Date.now() + 30 * 60 * 1000).toISOString();
      await supabase
        .from("share_links")
        .update({
          failed_attempts: newFailed,
          locked_until: lockedUntil,
          updated_at: new Date().toISOString(),
        })
        .eq("id", link.id);

      await logAction({
        action: "share.locked",
        targetType: "share_link",
        targetId: link.id,
        projectId: link.project_id,
        ipAddress,
        metadata: { failedAttempts: newFailed, lockedUntil },
      });

      await new Promise((r) => setTimeout(r, 500));
      return {
        success: false,
        error: "Incorrect PIN. Link is now locked for 30 minutes due to 5 consecutive failed attempts.",
      };
    } else {
      await supabase
        .from("share_links")
        .update({
          failed_attempts: newFailed,
          updated_at: new Date().toISOString(),
        })
        .eq("id", link.id);

      await logAction({
        action: "share.pin_failed",
        targetType: "share_link",
        targetId: link.id,
        projectId: link.project_id,
        ipAddress,
        metadata: { attemptNumber: newFailed, remainingAttempts: 5 - newFailed },
      });

      await new Promise((r) => setTimeout(r, 500));
      return {
        success: false,
        error: `Incorrect PIN. ${5 - newFailed} attempt(s) remaining before temporary lockout.`,
      };
    }
  }

  // 4. Success: Record attempt, reset failed counter, increment view count
  await supabase.from("share_link_attempts").insert({
    share_link_id: link.id,
    ip_address: ipAddress,
    success: true,
  });

  await supabase
    .from("share_links")
    .update({
      failed_attempts: 0,
      locked_until: null,
      view_count: link.view_count + 1,
      last_accessed_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("id", link.id);

  await logAction({
    action: "share.pin_success",
    targetType: "share_link",
    targetId: link.id,
    projectId: link.project_id,
    ipAddress,
    metadata: { newViewCount: link.view_count + 1 },
  });

  // Create HMAC session token
  const sessionToken = createShareSessionToken({
    shareLinkId: link.id,
    sessionVersion: link.session_version,
  });

  return { success: true, sessionToken };
}

/**
 * Fetch list of shared items for a verified client session (WITHOUT decrypted secrets).
 */
export async function getSharedItems(token: string, sessionToken: string) {
  const session = verifyShareSessionToken(sessionToken);
  if (!session) {
    throw new Error("Invalid or expired session. Please re-enter your PIN.");
  }

  const supabase = createAdminClient();
  const tokenHash = hashToken(token);

  const { data: link, error: linkError } = await supabase
    .from("share_links")
    .select(`
      id,
      project_id,
      label,
      status,
      expires_at,
      never_expires,
      session_version,
      projects (name)
    `)
    .eq("token_hash", tokenHash)
    .maybeSingle();

  if (linkError || !link) {
    throw new Error("Share link not found.");
  }

  if (link.id !== session.shareLinkId || link.session_version !== session.sessionVersion) {
    throw new Error("Session has been invalidated. Please re-enter your PIN.");
  }

  if (link.status === "revoked" || isExpired({ expires_at: link.expires_at, never_expires: link.never_expires })) {
    throw new Error("This share link is no longer accessible.");
  }

  // Fetch shared item references
  const { data: shareItems, error: itemsError } = await supabase
    .from("share_link_items")
    .select("item_type, item_id")
    .eq("share_link_id", link.id);

  if (itemsError) {
    throw new Error(`Failed to load shared items: ${itemsError.message}`);
  }

  const credentialIds = (shareItems || [])
    .filter((it) => it.item_type === "credential")
    .map((it) => it.item_id);

  const envIds = (shareItems || [])
    .filter((it) => it.item_type === "env_variable")
    .map((it) => it.item_id);

  // Fetch credential safe projections
  let credentials: {
    id: string;
    serviceName: string;
    loginUrl: string | null;
    username: string;
    notes: string | null;
  }[] = [];

  if (credentialIds.length > 0) {
    const { data: creds } = await supabase
      .from("credentials")
      .select("id, service_name, login_url, username, notes")
      .in("id", credentialIds)
      .order("service_name", { ascending: true });

    credentials = (creds || []).map((c) => ({
      id: c.id,
      serviceName: c.service_name,
      loginUrl: c.login_url,
      username: c.username,
      notes: c.notes,
    }));
  }

  // Fetch env variable safe projections
  let envVariables: {
    id: string;
    key: string;
    environment: string;
    updatedAt: string;
  }[] = [];

  if (envIds.length > 0) {
    const { data: envs } = await supabase
      .from("env_variables")
      .select("id, key, environment, updated_at")
      .in("id", envIds)
      .order("key", { ascending: true });

    envVariables = (envs || []).map((e) => ({
      id: e.id,
      key: e.key,
      environment: e.environment,
      updatedAt: e.updated_at,
    }));
  }

  return {
    projectName: (link.projects as unknown as { name: string } | null)?.name || "Project",
    label: link.label,
    credentials,
    envVariables,
  };
}

/**
 * Reveal or decrypt a single shared item. Strictly verifies IDOR membership and logs fail-closed audit event.
 */
export async function revealSharedItem(
  token: string,
  sessionToken: string,
  itemId: string,
  itemType: "credential" | "env_variable",
  ipAddress: string
): Promise<{ value: string }> {
  const session = verifyShareSessionToken(sessionToken);
  if (!session) {
    throw new Error("Invalid or expired session. Please re-enter your PIN.");
  }

  const supabase = createAdminClient();
  const tokenHash = hashToken(token);

  const { data: link, error: linkError } = await supabase
    .from("share_links")
    .select("id, project_id, label, status, expires_at, never_expires, session_version")
    .eq("token_hash", tokenHash)
    .maybeSingle();

  if (linkError || !link) {
    throw new Error("Share link not found.");
  }

  if (link.id !== session.shareLinkId || link.session_version !== session.sessionVersion) {
    throw new Error("Session has been invalidated. Please re-enter your PIN.");
  }

  if (link.status === "revoked" || isExpired({ expires_at: link.expires_at, never_expires: link.never_expires })) {
    throw new Error("This share link is no longer accessible.");
  }

  // IDOR Protection: Verify item belongs explicitly to this share link
  const { data: itemMatch, error: matchError } = await supabase
    .from("share_link_items")
    .select("id")
    .eq("share_link_id", link.id)
    .eq("item_type", itemType)
    .eq("item_id", itemId)
    .maybeSingle();

  if (matchError || !itemMatch) {
    await logAction({
      action: "share.blocked",
      targetType: itemType,
      targetId: itemId,
      projectId: link.project_id,
      ipAddress,
      metadata: { reason: "unauthorized_item_access_attempt", shareLinkId: link.id },
    });
    throw new Error("Unauthorized item access.");
  }

  // Fail-closed Audit Logging before secret return
  await logAction({
    action: "share.reveal",
    targetType: itemType,
    targetId: itemId,
    projectId: link.project_id,
    ipAddress,
    metadata: {
      shareLinkId: link.id,
      label: link.label,
    },
  });

  // Decrypt secret
  if (itemType === "credential") {
    const { data: cred, error: credError } = await supabase
      .from("credentials")
      .select("encrypted_password, iv, tag")
      .eq("id", itemId)
      .single();

    if (credError || !cred) {
      throw new Error("Credential not found.");
    }

    const decrypted = decrypt(cred.encrypted_password, cred.iv, cred.tag);
    return { value: decrypted };
  } else {
    const { data: env, error: envError } = await supabase
      .from("env_variables")
      .select("encrypted_value, iv, tag")
      .eq("id", itemId)
      .single();

    if (envError || !env) {
      throw new Error("Environment variable not found.");
    }

    const decrypted = decrypt(env.encrypted_value, env.iv, env.tag);
    return { value: decrypted };
  }
}
