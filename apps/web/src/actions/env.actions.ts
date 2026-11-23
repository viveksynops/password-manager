"use server";

import { requireUser } from "@/lib/auth";
import {
  createEnvVariableSchema,
  updateEnvVariableSchema,
  deleteEnvVariableSchema,
  revealEnvVariableSchema,
  bulkImportEnvSchema,
  exportEnvSchema,
  CreateEnvVariableInput,
  UpdateEnvVariableInput,
  DeleteEnvVariableInput,
  RevealEnvVariableInput,
  BulkImportEnvInput,
  ExportEnvInput,
} from "@/features/env-variables/schemas";
import {
  createEnvVariable,
  updateEnvVariable,
  deleteEnvVariable,
  revealOrCopyEnvVariable,
  bulkImportEnvVariables,
  exportEnvVariables,
  EnvVariableSummary,
} from "@/services/env.service";
import { ActionResult, successResult, errorResult, handleActionError } from "@/lib/action-result";
import { checkRateLimit } from "@/lib/rate-limit";
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

export async function createEnvVariableAction(
  rawInput: CreateEnvVariableInput
): Promise<ActionResult<EnvVariableSummary>> {
  try {
    const user = await requireUser();

    const parseResult = createEnvVariableSchema.safeParse(rawInput);
    if (!parseResult.success) {
      return errorResult(parseResult.error.issues[0]?.message || "Invalid environment variable details.");
    }

    const ipAddress = await getClientIp();
    const envVar = await createEnvVariable(parseResult.data, user.id, ipAddress);

    revalidatePath(`/projects/${parseResult.data.projectId}`);
    return successResult(envVar);
  } catch (err) {
    return handleActionError(err);
  }
}

export async function updateEnvVariableAction(
  rawInput: UpdateEnvVariableInput
): Promise<ActionResult<EnvVariableSummary>> {
  try {
    const user = await requireUser();

    const parseResult = updateEnvVariableSchema.safeParse(rawInput);
    if (!parseResult.success) {
      return errorResult(parseResult.error.issues[0]?.message || "Invalid environment variable details.");
    }

    const ipAddress = await getClientIp();
    const envVar = await updateEnvVariable(parseResult.data, user.id, ipAddress);

    revalidatePath(`/projects/${parseResult.data.projectId}`);
    return successResult(envVar);
  } catch (err) {
    return handleActionError(err);
  }
}

export async function deleteEnvVariableAction(
  rawInput: DeleteEnvVariableInput
): Promise<ActionResult<{ success: true }>> {
  try {
    const user = await requireUser();

    const parseResult = deleteEnvVariableSchema.safeParse(rawInput);
    if (!parseResult.success) {
      return errorResult(parseResult.error.issues[0]?.message || "Invalid deletion parameters.");
    }

    const ipAddress = await getClientIp();
    await deleteEnvVariable(parseResult.data, user.id, ipAddress);

    revalidatePath(`/projects/${parseResult.data.projectId}`);
    return successResult({ success: true });
  } catch (err) {
    return handleActionError(err);
  }
}

export async function revealEnvVariableAction(
  rawInput: RevealEnvVariableInput
): Promise<ActionResult<string>> {
  try {
    const user = await requireUser();

    // Rate limit: 30 reveal/copy requests per minute per user (TASK-114)
    const rateCheck = checkRateLimit(`reveal:env:${user.id}`, 30, 60);
    if (!rateCheck.allowed) {
      return errorResult("Rate limit exceeded for revealing environment variables. Please wait a moment before trying again.");
    }

    const parseResult = revealEnvVariableSchema.safeParse(rawInput);
    if (!parseResult.success) {
      return errorResult(parseResult.error.issues[0]?.message || "Invalid reveal request.");
    }

    const ipAddress = await getClientIp();
    const secretValue = await revealOrCopyEnvVariable(parseResult.data, user.id, ipAddress);

    return successResult(secretValue);
  } catch (err) {
    return handleActionError(err);
  }
}

export async function bulkImportEnvAction(
  rawInput: BulkImportEnvInput
): Promise<ActionResult<{ importedCount: number; updatedCount: number; errors: string[] }>> {
  try {
    const user = await requireUser();

    const parseResult = bulkImportEnvSchema.safeParse(rawInput);
    if (!parseResult.success) {
      return errorResult(parseResult.error.issues[0]?.message || "Invalid import payload.");
    }

    const ipAddress = await getClientIp();
    const result = await bulkImportEnvVariables(parseResult.data, user.id, ipAddress);

    revalidatePath(`/projects/${parseResult.data.projectId}`);
    return successResult(result);
  } catch (err) {
    return handleActionError(err);
  }
}

export async function exportEnvAction(
  rawInput: ExportEnvInput
): Promise<ActionResult<string>> {
  try {
    const user = await requireUser();

    // Rate limit: 5 exports per 5 minutes per user (TASK-114)
    const rateCheck = checkRateLimit(`export:env:${user.id}`, 5, 300);
    if (!rateCheck.allowed) {
      return errorResult("Export rate limit exceeded. Please wait a few minutes before exporting again.");
    }

    const parseResult = exportEnvSchema.safeParse(rawInput);
    if (!parseResult.success) {
      return errorResult(parseResult.error.issues[0]?.message || "Invalid export request.");
    }

    const ipAddress = await getClientIp();
    const envText = await exportEnvVariables(parseResult.data, user.id, ipAddress);

    return successResult(envText);
  } catch (err) {
    return handleActionError(err);
  }
}
