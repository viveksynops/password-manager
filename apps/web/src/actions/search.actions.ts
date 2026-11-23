"use server";

import { z } from "zod";
import { requireUser } from "@/lib/auth";
import { globalSearch, GlobalSearchResults } from "@/services/search.service";
import { ActionResult, successResult, handleActionError } from "@/lib/action-result";

const searchInputSchema = z.string().trim().max(100, "Search query too long");

export async function searchGlobalAction(
  query: string
): Promise<ActionResult<GlobalSearchResults>> {
  try {
    await requireUser();
    const validatedQuery = searchInputSchema.parse(query);
    const results = await globalSearch(validatedQuery);
    return successResult(results);
  } catch (err) {
    return handleActionError(err);
  }
}
