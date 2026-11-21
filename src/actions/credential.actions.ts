"use server";

import { requireUser } from "@/lib/auth";
import {
  createCredentialSchema,
  updateCredentialSchema,
  deleteCredentialSchema,
  revealCredentialSchema,
  CreateCredentialInput,
  UpdateCredentialInput,
  DeleteCredentialInput,
  RevealCredentialInput,
} from "@/features/credentials/schemas";
import {
  createCredential,
  updateCredential,
  deleteCredential,
  revealOrCopyCredential,
  CredentialSummary,
} from "@/services/credential.service";
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

export async function createCredentialAction(
  rawInput: CreateCredentialInput
): Promise<ActionResult<CredentialSummary>> {
  try {
    const user = await requireUser();

    const parseResult = createCredentialSchema.safeParse(rawInput);
    if (!parseResult.success) {
      return errorResult(parseResult.error.issues[0]?.message || "Invalid credential details.");
    }

    const ipAddress = await getClientIp();
    const cred = await createCredential(parseResult.data, user.id, ipAddress);

    revalidatePath(`/projects/${parseResult.data.projectId}`);
    return successResult(cred);
  } catch (err) {
    return handleActionError(err);
  }
}

export async function updateCredentialAction(
  rawInput: UpdateCredentialInput
): Promise<ActionResult<CredentialSummary>> {
  try {
    const user = await requireUser();

    const parseResult = updateCredentialSchema.safeParse(rawInput);
    if (!parseResult.success) {
      return errorResult(parseResult.error.issues[0]?.message || "Invalid credential update data.");
    }

    const ipAddress = await getClientIp();
    const { id, projectId } = parseResult.data;

    const cred = await updateCredential(id, parseResult.data, user.id, ipAddress);

    revalidatePath(`/projects/${projectId}`);
    return successResult(cred);
  } catch (err) {
    return handleActionError(err);
  }
}

export async function deleteCredentialAction(
  rawInput: DeleteCredentialInput
): Promise<ActionResult<{ success: true }>> {
  try {
    const user = await requireUser();

    const parseResult = deleteCredentialSchema.safeParse(rawInput);
    if (!parseResult.success) {
      return errorResult(parseResult.error.issues[0]?.message || "Invalid credential delete request.");
    }

    const ipAddress = await getClientIp();
    const { id, projectId } = parseResult.data;

    await deleteCredential(id, projectId, user.id, ipAddress);

    revalidatePath(`/projects/${projectId}`);
    return successResult({ success: true });
  } catch (err) {
    return handleActionError(err);
  }
}

export async function revealCredentialAction(
  rawInput: RevealCredentialInput
): Promise<ActionResult<string>> {
  try {
    const user = await requireUser();

    const parseResult = revealCredentialSchema.safeParse(rawInput);
    if (!parseResult.success) {
      return errorResult(parseResult.error.issues[0]?.message || "Invalid reveal request.");
    }

    const ipAddress = await getClientIp();
    const { id, projectId, action } = parseResult.data;

    const plaintext = await revealOrCopyCredential(
      id,
      projectId,
      action,
      user.id,
      ipAddress
    );

    return successResult(plaintext);
  } catch (err) {
    return handleActionError(err);
  }
}
