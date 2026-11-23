import "server-only";
import { createClient as createServerClient } from "@/lib/supabase/server";
import { logAction } from "./audit.service";
import {
  CreateShareLinkInput,
  ShareItemInput,
  ExpiryPresetValue,
} from "@/features/share-links/schemas";
import { generateToken, hashToken } from "@/lib/share/token";
import { generatePin, generatePinSalt, hashPin } from "@/lib/share/pin";
import { calculateExpiry, isExpired } from "@/lib/share/expiry";

export type ShareLinkStatusComputed = "active" | "expired" | "locked" | "revoked" | "max_views_reached";

export interface ShareLinkSummary {
  id: string;
  projectId: string;
  createdBy: string;
  label: string;
  expiresAt: string | null;
  neverExpires: boolean;
  maxViews: number | null;
  viewCount: number;
  status: "active" | "revoked";
  computedStatus: ShareLinkStatusComputed;
  revokedAt: string | null;
  failedAttempts: number;
  lockedUntil: string | null;
  lastAccessedAt: string | null;
  itemCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface ShareLinkDetail extends ShareLinkSummary {
  items: {
    id: string;
    itemType: "credential" | "env_variable";
    itemId: string;
    title?: string;
  }[];
}

export interface CreatedShareLinkResult {
  shareLink: ShareLinkSummary;
  token: string;
  pin: string;
}

/**
 * List all share links for a project (safe projection without hashes/salts).
 */
export async function listProjectShareLinks(projectId: string): Promise<ShareLinkSummary[]> {
  const supabase = await createServerClient();

  const { data: links, error } = await supabase
    .from("share_links")
    .select(`
      id,
      project_id,
      created_by,
      label,
      expires_at,
      never_expires,
      max_views,
      view_count,
      status,
      revoked_at,
      failed_attempts,
      locked_until,
      last_accessed_at,
      created_at,
      updated_at,
      share_link_items (id)
    `)
    .eq("project_id", projectId)
    .order("created_at", { ascending: false });

  if (error) {
    if (
      error.code === "PGRST205" ||
      error.message.includes("Could not find the table") ||
      error.message.includes("schema cache")
    ) {
      console.warn(
        "Table 'public.share_links' not yet found in Supabase schema. Please apply migration: supabase/migrations/20261123000000_client_share_links.sql"
      );
      return [];
    }
    throw new Error(`Failed to list share links: ${error.message}`);
  }

  const now = new Date();

  return (links || []).map((link) => {
    let computedStatus: ShareLinkStatusComputed = link.status === "revoked" ? "revoked" : "active";
    if (computedStatus === "active") {
      if (link.locked_until && new Date(link.locked_until) > now) {
        computedStatus = "locked";
      } else if (link.max_views !== null && link.view_count >= link.max_views) {
        computedStatus = "max_views_reached";
      } else if (isExpired({ expires_at: link.expires_at, never_expires: link.never_expires })) {
        computedStatus = "expired";
      }
    }

    return {
      id: link.id,
      projectId: link.project_id,
      createdBy: link.created_by,
      label: link.label,
      expiresAt: link.expires_at,
      neverExpires: link.never_expires,
      maxViews: link.max_views,
      viewCount: link.view_count,
      status: link.status as "active" | "revoked",
      computedStatus,
      revokedAt: link.revoked_at,
      failedAttempts: link.failed_attempts,
      lockedUntil: link.locked_until,
      lastAccessedAt: link.last_accessed_at,
      itemCount: Array.isArray(link.share_link_items) ? link.share_link_items.length : 0,
      createdAt: link.created_at,
      updatedAt: link.updated_at,
    };
  });
}

/**
 * Fetch a single share link with items for editing.
 */
export async function getShareLinkDetail(shareLinkId: string): Promise<ShareLinkDetail | null> {
  const supabase = await createServerClient();

  const { data: link, error } = await supabase
    .from("share_links")
    .select(`
      id,
      project_id,
      created_by,
      label,
      expires_at,
      never_expires,
      max_views,
      view_count,
      status,
      revoked_at,
      failed_attempts,
      locked_until,
      last_accessed_at,
      created_at,
      updated_at,
      share_link_items (id, item_type, item_id)
    `)
    .eq("id", shareLinkId)
    .maybeSingle();

  if (error || !link) {
    return null;
  }

  const now = new Date();
  let computedStatus: ShareLinkStatusComputed = link.status === "revoked" ? "revoked" : "active";
  if (computedStatus === "active") {
    if (link.locked_until && new Date(link.locked_until) > now) {
      computedStatus = "locked";
    } else if (link.max_views !== null && link.view_count >= link.max_views) {
      computedStatus = "max_views_reached";
    } else if (isExpired({ expires_at: link.expires_at, never_expires: link.never_expires })) {
      computedStatus = "expired";
    }
  }

  const items = Array.isArray(link.share_link_items)
    ? link.share_link_items.map((it: { id: string; item_type: "credential" | "env_variable"; item_id: string }) => ({
        id: it.id,
        itemType: it.item_type,
        itemId: it.item_id,
      }))
    : [];

  return {
    id: link.id,
    projectId: link.project_id,
    createdBy: link.created_by,
    label: link.label,
    expiresAt: link.expires_at,
    neverExpires: link.never_expires,
    maxViews: link.max_views,
    viewCount: link.view_count,
    status: link.status as "active" | "revoked",
    computedStatus,
    revokedAt: link.revoked_at,
    failedAttempts: link.failed_attempts,
    lockedUntil: link.locked_until,
    lastAccessedAt: link.last_accessed_at,
    itemCount: items.length,
    createdAt: link.created_at,
    updatedAt: link.updated_at,
    items,
  };
}

/**
 * Create a new share link with generated token & PIN.
 */
export async function createShareLink(
  input: CreateShareLinkInput,
  userId: string,
  ipAddress?: string
): Promise<CreatedShareLinkResult> {
  const supabase = await createServerClient();

  const token = generateToken();
  const tokenHash = hashToken(token);

  const pin = generatePin();
  const pinSalt = generatePinSalt();
  const pinHash = hashPin(pin, pinSalt);

  const expiresAt = calculateExpiry(input.expiryPreset);
  const neverExpires = input.expiryPreset === "never";

  const { data: link, error: linkError } = await supabase
    .from("share_links")
    .insert({
      project_id: input.projectId,
      created_by: userId,
      label: input.label,
      token_hash: tokenHash,
      pin_hash: pinHash,
      pin_salt: pinSalt,
      expires_at: expiresAt ? expiresAt.toISOString() : null,
      never_expires: neverExpires,
      max_views: input.maxViews ?? null,
      failed_attempts: 0,
      session_version: 1,
      view_count: 0,
      status: "active",
    })
    .select()
    .single();

  if (linkError || !link) {
    throw new Error(`Failed to create share link: ${linkError?.message || "Unknown error"}`);
  }

  // Insert items
  if (input.items.length > 0) {
    const itemRows = input.items.map((item) => ({
      share_link_id: link.id,
      item_type: item.itemType,
      item_id: item.itemId,
    }));

    const { error: itemsError } = await supabase.from("share_link_items").insert(itemRows);
    if (itemsError) {
      // Clean up link if items insertion fails
      await supabase.from("share_links").delete().eq("id", link.id);
      throw new Error(`Failed to associate items to share link: ${itemsError.message}`);
    }
  }

  // Fail-closed audit logging
  await logAction({
    userId,
    action: "share.create",
    targetType: "share_link",
    targetId: link.id,
    projectId: input.projectId,
    ipAddress,
    metadata: {
      label: input.label,
      itemCount: input.items.length,
      expiryPreset: input.expiryPreset,
      neverExpires,
      expiresAt: expiresAt ? expiresAt.toISOString() : null,
      maxViews: input.maxViews ?? null,
    },
  });

  const summary: ShareLinkSummary = {
    id: link.id,
    projectId: link.project_id,
    createdBy: link.created_by,
    label: link.label,
    expiresAt: link.expires_at,
    neverExpires: link.never_expires,
    maxViews: link.max_views,
    viewCount: link.view_count,
    status: link.status as "active" | "revoked",
    computedStatus: "active",
    revokedAt: link.revoked_at,
    failedAttempts: link.failed_attempts,
    lockedUntil: link.locked_until,
    lastAccessedAt: link.last_accessed_at,
    itemCount: input.items.length,
    createdAt: link.created_at,
    updatedAt: link.updated_at,
  };

  return {
    shareLink: summary,
    token,
    pin,
  };
}

/**
 * Update items shared by an existing link and bump session version.
 */
export async function updateShareLinkItems(
  shareLinkId: string,
  items: ShareItemInput[],
  userId: string,
  ipAddress?: string
): Promise<void> {
  const supabase = await createServerClient();

  // Verify link exists and get project_id
  const { data: link, error: linkError } = await supabase
    .from("share_links")
    .select("id, project_id, session_version")
    .eq("id", shareLinkId)
    .single();

  if (linkError || !link) {
    throw new Error("Share link not found");
  }

  // Delete current items
  const { error: deleteError } = await supabase
    .from("share_link_items")
    .delete()
    .eq("share_link_id", shareLinkId);

  if (deleteError) {
    throw new Error(`Failed to clear existing items: ${deleteError.message}`);
  }

  // Insert new items
  const itemRows = items.map((item) => ({
    share_link_id: shareLinkId,
    item_type: item.itemType,
    item_id: item.itemId,
  }));

  const { error: insertError } = await supabase.from("share_link_items").insert(itemRows);
  if (insertError) {
    throw new Error(`Failed to update items: ${insertError.message}`);
  }

  // Bump session_version to invalidate existing client sessions
  await supabase
    .from("share_links")
    .update({
      session_version: link.session_version + 1,
      updated_at: new Date().toISOString(),
    })
    .eq("id", shareLinkId);

  await logAction({
    userId,
    action: "share.update_items",
    targetType: "share_link",
    targetId: shareLinkId,
    projectId: link.project_id,
    ipAddress,
    metadata: {
      itemCount: items.length,
    },
  });
}

/**
 * Extend an active share link's expiry preset.
 */
export async function extendShareLink(
  shareLinkId: string,
  expiryPreset: ExpiryPresetValue,
  userId: string,
  ipAddress?: string
): Promise<void> {
  const supabase = await createServerClient();

  const { data: link, error: linkError } = await supabase
    .from("share_links")
    .select("id, project_id")
    .eq("id", shareLinkId)
    .single();

  if (linkError || !link) {
    throw new Error("Share link not found");
  }

  const expiresAt = calculateExpiry(expiryPreset);
  const neverExpires = expiryPreset === "never";

  const { error: updateError } = await supabase
    .from("share_links")
    .update({
      expires_at: expiresAt ? expiresAt.toISOString() : null,
      never_expires: neverExpires,
      updated_at: new Date().toISOString(),
    })
    .eq("id", shareLinkId);

  if (updateError) {
    throw new Error(`Failed to extend share link: ${updateError.message}`);
  }

  await logAction({
    userId,
    action: "share.extend",
    targetType: "share_link",
    targetId: shareLinkId,
    projectId: link.project_id,
    ipAddress,
    metadata: {
      expiryPreset,
      neverExpires,
      expiresAt: expiresAt ? expiresAt.toISOString() : null,
    },
  });
}

/**
 * Regenerate a share link's 6-digit PIN, invalidate active sessions, and reset lockouts.
 */
export async function regenerateSharePin(
  shareLinkId: string,
  userId: string,
  ipAddress?: string
): Promise<string> {
  const supabase = await createServerClient();

  const { data: link, error: linkError } = await supabase
    .from("share_links")
    .select("id, project_id, session_version")
    .eq("id", shareLinkId)
    .single();

  if (linkError || !link) {
    throw new Error("Share link not found");
  }

  const newPin = generatePin();
  const newSalt = generatePinSalt();
  const newPinHash = hashPin(newPin, newSalt);

  const { error: updateError } = await supabase
    .from("share_links")
    .update({
      pin_hash: newPinHash,
      pin_salt: newSalt,
      failed_attempts: 0,
      locked_until: null,
      session_version: link.session_version + 1,
      updated_at: new Date().toISOString(),
    })
    .eq("id", shareLinkId);

  if (updateError) {
    throw new Error(`Failed to regenerate PIN: ${updateError.message}`);
  }

  await logAction({
    userId,
    action: "share.regenerate_pin",
    targetType: "share_link",
    targetId: shareLinkId,
    projectId: link.project_id,
    ipAddress,
  });

  return newPin;
}

/**
 * Revoke a share link immediately and bump session version.
 */
export async function revokeShareLink(
  shareLinkId: string,
  userId: string,
  ipAddress?: string
): Promise<void> {
  const supabase = await createServerClient();

  const { data: link, error: linkError } = await supabase
    .from("share_links")
    .select("id, project_id, session_version")
    .eq("id", shareLinkId)
    .single();

  if (linkError || !link) {
    throw new Error("Share link not found");
  }

  const { error: updateError } = await supabase
    .from("share_links")
    .update({
      status: "revoked",
      revoked_at: new Date().toISOString(),
      revoked_by: userId,
      session_version: link.session_version + 1,
      updated_at: new Date().toISOString(),
    })
    .eq("id", shareLinkId);

  if (updateError) {
    throw new Error(`Failed to revoke share link: ${updateError.message}`);
  }

  await logAction({
    userId,
    action: "share.revoke",
    targetType: "share_link",
    targetId: shareLinkId,
    projectId: link.project_id,
    ipAddress,
  });
}

/**
 * Unlock a locked share link by resetting failed attempts and locked_until.
 */
export async function unlockShareLink(
  shareLinkId: string,
  userId: string,
  ipAddress?: string
): Promise<void> {
  const supabase = await createServerClient();

  const { data: link, error: linkError } = await supabase
    .from("share_links")
    .select("id, project_id")
    .eq("id", shareLinkId)
    .single();

  if (linkError || !link) {
    throw new Error("Share link not found");
  }

  const { error: updateError } = await supabase
    .from("share_links")
    .update({
      failed_attempts: 0,
      locked_until: null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", shareLinkId);

  if (updateError) {
    throw new Error(`Failed to unlock share link: ${updateError.message}`);
  }

  await logAction({
    userId,
    action: "share.unlock",
    targetType: "share_link",
    targetId: shareLinkId,
    projectId: link.project_id,
    ipAddress,
  });
}

/**
 * Delete a share link completely.
 */
export async function deleteShareLink(
  shareLinkId: string,
  userId: string,
  ipAddress?: string
): Promise<void> {
  const supabase = await createServerClient();

  const { data: link, error: linkError } = await supabase
    .from("share_links")
    .select("id, project_id, label")
    .eq("id", shareLinkId)
    .single();

  if (linkError || !link) {
    throw new Error("Share link not found");
  }

  const { error: deleteError } = await supabase
    .from("share_links")
    .delete()
    .eq("id", shareLinkId);

  if (deleteError) {
    throw new Error(`Failed to delete share link: ${deleteError.message}`);
  }

  await logAction({
    userId,
    action: "share.delete",
    targetType: "share_link",
    targetId: shareLinkId,
    projectId: link.project_id,
    ipAddress,
    metadata: { label: link.label },
  });
}

/**
 * Fetch access history attempts for this share link (Admin/Manager).
 */
export async function getShareAccessHistory(shareLinkId: string) {
  const supabase = await createServerClient();

  const { data: attempts, error } = await supabase
    .from("share_link_attempts")
    .select("id, ip_address, success, created_at")
    .eq("share_link_id", shareLinkId)
    .order("created_at", { ascending: false })
    .limit(50);

  if (error) {
    throw new Error(`Failed to get access history: ${error.message}`);
  }

  return attempts || [];
}
