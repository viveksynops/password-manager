"use server";

import { requireAdmin } from "@/lib/auth";
import {
  inviteUserSchema,
  updateRoleSchema,
  deactivateUserSchema,
  InviteUserInput,
  UpdateRoleInput,
  DeactivateUserInput,
} from "@/features/team/schemas";
import {
  inviteUser,
  updateUserRole,
  setUserStatus,
} from "@/services/user.service";
import { ActionResult, successResult, errorResult, handleActionError } from "@/lib/action-result";
import { UserProfile } from "@/types/database.types";
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

export async function inviteUserAction(
  rawInput: InviteUserInput
): Promise<ActionResult<UserProfile>> {
  try {
    const admin = await requireAdmin();

    const parseResult = inviteUserSchema.safeParse(rawInput);
    if (!parseResult.success) {
      return errorResult(parseResult.error.issues[0]?.message || "Invalid input.");
    }

    const ipAddress = await getClientIp();

    const profile = await inviteUser({
      ...parseResult.data,
      invitedBy: admin.id,
      ipAddress,
    });

    revalidatePath("/team");
    return successResult(profile);
  } catch (err) {
    return handleActionError(err);
  }
}

export async function updateUserRoleAction(
  rawInput: UpdateRoleInput
): Promise<ActionResult<UserProfile>> {
  try {
    const admin = await requireAdmin();

    const parseResult = updateRoleSchema.safeParse(rawInput);
    if (!parseResult.success) {
      return errorResult(parseResult.error.issues[0]?.message || "Invalid input.");
    }

    const ipAddress = await getClientIp();

    const profile = await updateUserRole({
      ...parseResult.data,
      adminId: admin.id,
      ipAddress,
    });

    revalidatePath("/team");
    return successResult(profile);
  } catch (err) {
    return handleActionError(err);
  }
}

export async function setUserStatusAction(
  rawInput: DeactivateUserInput
): Promise<ActionResult<UserProfile>> {
  try {
    const admin = await requireAdmin();

    const parseResult = deactivateUserSchema.safeParse(rawInput);
    if (!parseResult.success) {
      return errorResult(parseResult.error.issues[0]?.message || "Invalid input.");
    }

    const ipAddress = await getClientIp();

    const profile = await setUserStatus({
      ...parseResult.data,
      adminId: admin.id,
      ipAddress,
    });

    revalidatePath("/team");
    return successResult(profile);
  } catch (err) {
    return handleActionError(err);
  }
}
