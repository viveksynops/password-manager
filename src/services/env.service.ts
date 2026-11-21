import "server-only";
import { createClient as createServerClient } from "@/lib/supabase/server";
import { EnvVariable, Database } from "@/types/database.types";
import { encrypt, decrypt } from "@/lib/crypto";
import { logAction } from "./audit.service";
import { parseEnvText, exportEnvText } from "@/utils/env-parser";
import {
  CreateEnvVariableInput,
  UpdateEnvVariableInput,
  DeleteEnvVariableInput,
  RevealEnvVariableInput,
  BulkImportEnvInput,
  ExportEnvInput,
} from "@/features/env-variables/schemas";

type EnvVariableUpdate = Database["public"]["Tables"]["env_variables"]["Update"];

/**
 * Public summary of an environment variable without secret encrypted payload.
 * Encrypted values are NEVER sent during page rendering (Security Invariant 🔒).
 */
export type EnvVariableSummary = Omit<
  EnvVariable,
  "encrypted_value" | "iv" | "tag"
>;

/**
 * Lists environment variables for a project, optionally filtered by environment.
 * RLS enforces that developers can only access projects they are assigned to.
 * NEVER returns encrypted_value, iv, or tag in the list payload.
 */
export async function listProjectEnvVariables(
  projectId: string,
  environment?: string
): Promise<EnvVariableSummary[]> {
  const supabase = await createServerClient();

  let query = supabase
    .from("env_variables")
    .select("id, project_id, environment, key, created_by, created_at, updated_at")
    .eq("project_id", projectId);

  if (environment) {
    query = query.eq("environment", environment as "development" | "staging" | "production");
  }

  const { data, error } = await query.order("key", { ascending: true });

  if (error) {
    throw new Error(`Failed to list env variables: ${error.message}`);
  }

  return (data || []) as EnvVariableSummary[];
}

/**
 * Creates a new environment variable.
 * Encrypts value with fresh random IV using AES-256-GCM before saving (TASK-093).
 */
export async function createEnvVariable(
  input: CreateEnvVariableInput,
  userId: string,
  ipAddress?: string
): Promise<EnvVariableSummary> {
  const supabase = await createServerClient();

  // Encrypt plaintext value before saving
  const { ciphertext, iv, tag } = encrypt(input.value);

  const { data, error } = await supabase
    .from("env_variables")
    .insert({
      project_id: input.projectId,
      environment: input.environment,
      key: input.key.trim(),
      encrypted_value: ciphertext,
      iv,
      tag,
      created_by: userId,
    })
    .select("id, project_id, environment, key, created_by, created_at, updated_at")
    .single();

  if (error || !data) {
    if (error?.code === "23505") {
      throw new Error(`Variable "${input.key}" already exists in the ${input.environment} environment.`);
    }
    throw new Error(`Failed to create env variable: ${error?.message || "Unknown error"}`);
  }

  // Fail-closed immutable audit log (TASK-093 / TASK-100 / ADR-013)
  await logAction({
    userId,
    action: "create",
    targetType: "env_variable",
    targetId: data.id,
    projectId: input.projectId,
    ipAddress,
    metadata: {
      key: data.key,
      environment: data.environment,
    },
  });

  return data as EnvVariableSummary;
}

/**
 * Updates an environment variable.
 * If a new value is provided, it is re-encrypted with a fresh IV and tag.
 */
export async function updateEnvVariable(
  input: UpdateEnvVariableInput,
  userId: string,
  ipAddress?: string
): Promise<EnvVariableSummary> {
  const supabase = await createServerClient();

  const updatePayload: EnvVariableUpdate = {
    key: input.key.trim(),
    environment: input.environment,
    updated_at: new Date().toISOString(),
  };

  if (input.value !== undefined && input.value !== "") {
    const { ciphertext, iv, tag } = encrypt(input.value);
    updatePayload.encrypted_value = ciphertext;
    updatePayload.iv = iv;
    updatePayload.tag = tag;
  }

  const { data, error } = await supabase
    .from("env_variables")
    .update(updatePayload)
    .eq("id", input.id)
    .eq("project_id", input.projectId)
    .select("id, project_id, environment, key, created_by, created_at, updated_at")
    .single();

  if (error || !data) {
    if (error?.code === "23505") {
      throw new Error(`Variable "${input.key}" already exists in the ${input.environment} environment.`);
    }
    throw new Error(`Failed to update env variable: ${error?.message || "Unknown error"}`);
  }

  // Fail-closed audit log
  await logAction({
    userId,
    action: "update",
    targetType: "env_variable",
    targetId: data.id,
    projectId: input.projectId,
    ipAddress,
    metadata: {
      key: data.key,
      environment: data.environment,
      valueChanged: input.value !== undefined,
    },
  });

  return data as EnvVariableSummary;
}

/**
 * Deletes an environment variable with fail-closed audit log (TASK-097).
 * For production environment, requires confirmation matching the variable's key.
 */
export async function deleteEnvVariable(
  input: DeleteEnvVariableInput,
  userId: string,
  ipAddress?: string
): Promise<void> {
  const supabase = await createServerClient();

  // Fetch key and environment first for validation and audit log
  const { data: existing, error: fetchError } = await supabase
    .from("env_variables")
    .select("id, key, environment, project_id")
    .eq("id", input.id)
    .eq("project_id", input.projectId)
    .single();

  if (fetchError || !existing) {
    throw new Error("Variable not found or you do not have permission to delete it.");
  }

  // Production safety check: typed confirmation required
  if (existing.environment === "production") {
    if (input.confirmation?.trim() !== existing.key.trim()) {
      throw new Error(`To delete this production variable, you must type "${existing.key}" to confirm.`);
    }
  }

  const { error } = await supabase
    .from("env_variables")
    .delete()
    .eq("id", input.id)
    .eq("project_id", input.projectId);

  if (error) {
    throw new Error(`Failed to delete env variable: ${error.message}`);
  }

  // Fail-closed audit log
  await logAction({
    userId,
    action: "delete",
    targetType: "env_variable",
    targetId: input.id,
    projectId: input.projectId,
    ipAddress,
    metadata: {
      key: existing.key,
      environment: existing.environment,
    },
  });
}

/**
 * Decrypts and returns an environment variable value for revealing or copying (TASK-100).
 * Decrypts server-side with AES-256-GCM and logs an immutable audit event (Security Invariant 🔒).
 */
export async function revealOrCopyEnvVariable(
  input: RevealEnvVariableInput,
  userId: string,
  ipAddress?: string
): Promise<string> {
  const supabase = await createServerClient();

  const { data, error } = await supabase
    .from("env_variables")
    .select("id, project_id, environment, key, encrypted_value, iv, tag")
    .eq("id", input.id)
    .eq("project_id", input.projectId)
    .single();

  if (error || !data) {
    throw new Error("Variable not found or you do not have access.");
  }

  const decryptedValue = decrypt(
    data.encrypted_value,
    data.iv,
    data.tag
  );

  // Fail-closed audit log for access audit trail
  await logAction({
    userId,
    action: input.action === "copy" ? "copy" : "reveal",
    targetType: "env_variable",
    targetId: data.id,
    projectId: input.projectId,
    ipAddress,
    metadata: {
      key: data.key,
      environment: data.environment,
      action: input.action,
    },
  });

  return decryptedValue;
}

/**
 * Bulk imports environment variables from raw .env text (TASK-098).
 */
export async function bulkImportEnvVariables(
  input: BulkImportEnvInput,
  userId: string,
  ipAddress?: string
): Promise<{ importedCount: number; updatedCount: number; errors: string[] }> {
  const supabase = await createServerClient();
  const { items, errors } = parseEnvText(input.rawEnv);

  if (items.length === 0) {
    throw new Error(
      errors.length > 0
        ? `Failed to parse .env text: ${errors[0].message}`
        : "No valid environment variables found in pasted text."
    );
  }

  let importedCount = 0;
  let updatedCount = 0;
  const errorList = errors.map((e) => e.message);

  for (const item of items) {
    try {
      const { ciphertext, iv, tag } = encrypt(item.value);

      // Check if item already exists
      const { data: existing } = await supabase
        .from("env_variables")
        .select("id")
        .eq("project_id", input.projectId)
        .eq("environment", input.environment)
        .eq("key", item.key)
        .maybeSingle();

      if (existing) {
        if (input.overwriteExisting) {
          const { error: updateErr } = await supabase
            .from("env_variables")
            .update({
              encrypted_value: ciphertext,
              iv,
              tag,
              updated_at: new Date().toISOString(),
            })
            .eq("id", existing.id);

          if (updateErr) {
            errorList.push(`Failed to update ${item.key}: ${updateErr.message}`);
          } else {
            updatedCount++;
          }
        }
      } else {
        const { error: insertErr } = await supabase
          .from("env_variables")
          .insert({
            project_id: input.projectId,
            environment: input.environment,
            key: item.key,
            encrypted_value: ciphertext,
            iv,
            tag,
            created_by: userId,
          });

        if (insertErr) {
          errorList.push(`Failed to insert ${item.key}: ${insertErr.message}`);
        } else {
          importedCount++;
        }
      }
    } catch (err: unknown) {
      errorList.push(`Error saving ${item.key}: ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  // Fail-closed audit log for bulk import
  await logAction({
    userId,
    action: "create",
    targetType: "env_variable",
    projectId: input.projectId,
    ipAddress,
    metadata: {
      mode: "bulk_import",
      environment: input.environment,
      importedCount,
      updatedCount,
      overwriteExisting: input.overwriteExisting,
    },
  });

  return { importedCount, updatedCount, errors: errorList };
}

/**
 * Decrypts and exports all environment variables for a given environment into .env format (TASK-099).
 */
export async function exportEnvVariables(
  input: ExportEnvInput,
  userId: string,
  ipAddress?: string
): Promise<string> {
  const supabase = await createServerClient();

  // Retrieve project name for export header
  const { data: project } = await supabase
    .from("projects")
    .select("name")
    .eq("id", input.projectId)
    .single();

  const { data: vars, error } = await supabase
    .from("env_variables")
    .select("id, key, encrypted_value, iv, tag")
    .eq("project_id", input.projectId)
    .eq("environment", input.environment)
    .order("key", { ascending: true });

  if (error) {
    throw new Error(`Failed to load variables for export: ${error.message}`);
  }

  const decryptedItems: { key: string; value: string }[] = [];
  for (const v of vars || []) {
    try {
      const val = decrypt(v.encrypted_value, v.iv, v.tag);
      decryptedItems.push({ key: v.key, value: val });
    } catch {
      decryptedItems.push({ key: v.key, value: "<DECRYPTION_FAILED>" });
    }
  }

  const exportedText = exportEnvText(decryptedItems, {
    projectName: project?.name,
    environment: input.environment,
  });

  // Fail-closed audit log for export action
  await logAction({
    userId,
    action: "export",
    targetType: "env_variable",
    projectId: input.projectId,
    ipAddress,
    metadata: {
      environment: input.environment,
      exportedCount: decryptedItems.length,
    },
  });

  return exportedText;
}
