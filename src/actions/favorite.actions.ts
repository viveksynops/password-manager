"use server";

import { z } from "zod";
import { requireUser } from "@/lib/auth";
import { toggleFavorite, getUserFavorites } from "@/services/favorite.service";
import { ActionResult, successResult, handleActionError } from "@/lib/action-result";

const toggleFavoriteSchema = z.object({
  targetType: z.enum(["project", "credential"]),
  targetId: z.string().uuid("Invalid target ID"),
});

export async function toggleFavoriteAction(
  input: z.infer<typeof toggleFavoriteSchema>
): Promise<ActionResult<{ isFavorite: boolean }>> {
  try {
    await requireUser();
    const validated = toggleFavoriteSchema.parse(input);
    const result = await toggleFavorite(validated.targetType, validated.targetId);
    return successResult(result);
  } catch (err) {
    return handleActionError(err);
  }
}

export async function getUserFavoritesAction(): Promise<
  ActionResult<{ projectIds: string[]; credentialIds: string[] }>
> {
  try {
    await requireUser();
    const data = await getUserFavorites();
    return successResult(data);
  } catch (err) {
    return handleActionError(err);
  }
}
