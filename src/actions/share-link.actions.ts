"use server";

import { requireRole } from "@/lib/auth";
import {
  createShareLinkSchema,
  updateShareItemsSchema,
  extendShareLinkSchema,
  CreateShareLinkInput,
  UpdateShareItemsInput,
  ExtendShareLinkInput,
} from "@/features/share-links/schemas";
import {
  createShareLink,
  updateShareLinkItems,
  extendShareLink,
  regenerateSharePin,
  revokeShareLink,
  unlockShareLink,
  deleteShareLink,
  getShareAccessHistory,
  getShareLinkDetail,
  CreatedShareLinkResult,
  ShareLinkDetail,
} from "@/services/share-link.service";
import { ActionResult, successResult, errorResult, handleActionError } from "@/lib/action-result";
import { headers } from "next/headers";
import { revalidatePath } from "next/cache";

async function getClientIp(): Promise<string> {
  try {
    const headerList = await headers();
    return headerList.get("x-forwarded-for")?.split(",")[0]?.trim() || "127.0.0.1";
  } catch {
    return "127.0.0.1";
  }
}

export async function createShareLinkAction(
  rawInput: CreateShareLinkInput
): Promise<ActionResult<CreatedShareLinkResult>> {
  try {
    const user = await requireRole(["admin", "manager"]);

    const parseResult = createShareLinkSchema.safeParse(rawInput);
    if (!parseResult.success) {
      return errorResult(parseResult.error.issues[0]?.message || "Invalid share link inputs.");
    }

    const ipAddress = await getClientIp();
    const result = await createShareLink(parseResult.data, user.id, ipAddress);

    revalidatePath(`/projects/${parseResult.data.projectId}`);
    return successResult(result);
  } catch (err) {
    return handleActionError(err);
  }
}

export async function updateShareLinkItemsAction(
  rawInput: UpdateShareItemsInput
): Promise<ActionResult<{ success: true }>> {
  try {
    const user = await requireRole(["admin", "manager"]);

    const parseResult = updateShareItemsSchema.safeParse(rawInput);
    if (!parseResult.success) {
      return errorResult(parseResult.error.issues[0]?.message || "Invalid items data.");
    }

    const ipAddress = await getClientIp();
    await updateShareLinkItems(
      parseResult.data.shareLinkId,
      parseResult.data.items,
      user.id,
      ipAddress
    );

    revalidatePath(`/projects/${parseResult.data.projectId}`);
    return successResult({ success: true });
  } catch (err) {
    return handleActionError(err);
  }
}

export async function extendShareLinkAction(
  rawInput: ExtendShareLinkInput
): Promise<ActionResult<{ success: true }>> {
  try {
    const user = await requireRole(["admin", "manager"]);

    const parseResult = extendShareLinkSchema.safeParse(rawInput);
    if (!parseResult.success) {
      return errorResult(parseResult.error.issues[0]?.message || "Invalid expiry extension data.");
    }

    const ipAddress = await getClientIp();
    await extendShareLink(
      parseResult.data.shareLinkId,
      parseResult.data.expiryPreset,
      user.id,
      ipAddress
    );

    revalidatePath(`/projects/${parseResult.data.projectId}`);
    return successResult({ success: true });
  } catch (err) {
    return handleActionError(err);
  }
}

export async function regenerateSharePinAction(
  shareLinkId: string,
  projectId: string
): Promise<ActionResult<{ newPin: string }>> {
  try {
    const user = await requireRole(["admin", "manager"]);
    const ipAddress = await getClientIp();

    const newPin = await regenerateSharePin(shareLinkId, user.id, ipAddress);
    revalidatePath(`/projects/${projectId}`);
    return successResult({ newPin });
  } catch (err) {
    return handleActionError(err);
  }
}

export async function revokeShareLinkAction(
  shareLinkId: string,
  projectId: string
): Promise<ActionResult<{ success: true }>> {
  try {
    const user = await requireRole(["admin", "manager"]);
    const ipAddress = await getClientIp();

    await revokeShareLink(shareLinkId, user.id, ipAddress);
    revalidatePath(`/projects/${projectId}`);
    return successResult({ success: true });
  } catch (err) {
    return handleActionError(err);
  }
}

export async function unlockShareLinkAction(
  shareLinkId: string,
  projectId: string
): Promise<ActionResult<{ success: true }>> {
  try {
    const user = await requireRole(["admin", "manager"]);
    const ipAddress = await getClientIp();

    await unlockShareLink(shareLinkId, user.id, ipAddress);
    revalidatePath(`/projects/${projectId}`);
    return successResult({ success: true });
  } catch (err) {
    return handleActionError(err);
  }
}

export async function deleteShareLinkAction(
  shareLinkId: string,
  projectId: string
): Promise<ActionResult<{ success: true }>> {
  try {
    const user = await requireRole(["admin", "manager"]);
    const ipAddress = await getClientIp();

    await deleteShareLink(shareLinkId, user.id, ipAddress);
    revalidatePath(`/projects/${projectId}`);
    return successResult({ success: true });
  } catch (err) {
    return handleActionError(err);
  }
}

export async function getShareLinkDetailAction(
  shareLinkId: string
): Promise<ActionResult<ShareLinkDetail | null>> {
  try {
    await requireRole(["admin", "manager"]);
    const detail = await getShareLinkDetail(shareLinkId);
    return successResult(detail);
  } catch (err) {
    return handleActionError(err);
  }
}

export async function getShareAccessHistoryAction(
  shareLinkId: string
): Promise<ActionResult<Awaited<ReturnType<typeof getShareAccessHistory>>>> {
  try {
    await requireRole(["admin", "manager"]);
    const history = await getShareAccessHistory(shareLinkId);
    return successResult(history);
  } catch (err) {
    return handleActionError(err);
  }
}
