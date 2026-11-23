import "server-only";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/auth";

export interface UserFavorite {
  id: string;
  target_type: "project" | "credential";
  target_id: string;
}

/**
 * Lists all favorited target IDs for the authenticated user.
 */
export async function getUserFavorites(): Promise<{
  projectIds: string[];
  credentialIds: string[];
}> {
  const user = await getCurrentUser();
  if (!user) {
    return { projectIds: [], credentialIds: [] };
  }

  const supabase = await createClient();

  try {
    const { data, error } = await (supabase as any)
      .from("user_favorites")
      .select("target_type, target_id")
      .eq("user_id", user.id);

    if (error) {
      // Graceful fallback if table is not yet created
      return { projectIds: [], credentialIds: [] };
    }

    const projectIds: string[] = [];
    const credentialIds: string[] = [];

    for (const item of (data as any[]) || []) {
      if (item.target_type === "project") {
        projectIds.push(item.target_id);
      } else if (item.target_type === "credential") {
        credentialIds.push(item.target_id);
      }
    }

    return { projectIds, credentialIds };
  } catch {
    return { projectIds: [], credentialIds: [] };
  }
}

/**
 * Toggles a favorite status for a project or credential.
 */
export async function toggleFavorite(
  targetType: "project" | "credential",
  targetId: string
): Promise<{ isFavorite: boolean }> {
  const user = await getCurrentUser();
  if (!user) {
    throw new Error("Unauthorized");
  }

  const supabase = await createClient();

  // Check if already favorited
  const favoritesTable = (supabase as any).from("user_favorites");
  const { data: existing } = await favoritesTable
    .select("id")
    .eq("user_id", user.id)
    .eq("target_type", targetType)
    .eq("target_id", targetId)
    .maybeSingle();

  if (existing) {
    // Remove favorite
    await favoritesTable.delete().eq("id", existing.id);
    return { isFavorite: false };
  } else {
    // Add favorite
    await favoritesTable.insert({
      user_id: user.id,
      target_type: targetType,
      target_id: targetId,
    });
    return { isFavorite: true };
  }
}
