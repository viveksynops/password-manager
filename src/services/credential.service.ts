import "server-only";
import { createClient as createServerClient } from "@/lib/supabase/server";
import { Credential, Database } from "@/types/database.types";
import { encrypt, decrypt } from "@/lib/crypto";
import { logAction } from "./audit.service";
import {
  CreateCredentialInput,
  UpdateCredentialInput,
} from "@/features/credentials/schemas";

type CredentialUpdate = Database["public"]["Tables"]["credentials"]["Update"];

/**
 * Public summary of a credential without secret password data.
 * Passwords are NEVER sent to the client during page rendering (Security Invariant 🔒).
 */
export type CredentialSummary = Omit<
  Credential,
  "encrypted_password" | "iv" | "tag"
>;

/**
 * Lists credentials for a project.
 * RLS enforces that developers can only query credentials for projects they are assigned to.
 * NEVER returns encrypted_password, iv, or tag in the list payload.
 */
export async function listProjectCredentials(
  projectId: string
): Promise<CredentialSummary[]> {
  const supabase = await createServerClient();

  const { data, error } = await supabase
    .from("credentials")
    .select("id, project_id, service_name, login_url, username, notes, created_by, created_at, updated_at")
    .eq("project_id", projectId)
    .order("service_name", { ascending: true });

  if (error) {
    throw new Error(`Failed to list credentials: ${error.message}`);
  }

  return (data || []) as CredentialSummary[];
}

/**
 * Creates a new encrypted credential.
 * Encrypts password with fresh random IV using AES-256-GCM before saving (TASK-076).
 */
export async function createCredential(
  input: CreateCredentialInput,
  userId: string,
  ipAddress?: string
): Promise<CredentialSummary> {
  const supabase = await createServerClient();

  // Encrypt plaintext password before saving
  const { ciphertext, iv, tag } = encrypt(input.password);

  const { data, error } = await supabase
    .from("credentials")
    .insert({
      project_id: input.projectId,
      service_name: input.serviceName,
      login_url: input.loginUrl || null,
      username: input.username,
      encrypted_password: ciphertext,
      iv,
      tag,
      notes: input.notes || null,
      created_by: userId,
    })
    .select("id, project_id, service_name, login_url, username, notes, created_by, created_at, updated_at")
    .single();

  if (error || !data) {
    throw new Error(`Failed to create credential: ${error?.message || "Unknown error"}`);
  }

  // Fail-closed immutable audit log (TASK-087 / ADR-013)
  await logAction({
    userId,
    action: "create",
    targetType: "credential",
    targetId: data.id,
    projectId: input.projectId,
    ipAddress,
    metadata: {
      serviceName: data.service_name,
      username: data.username,
    },
  });

  return data as CredentialSummary;
}

/**
 * Updates an existing credential.
 * If password is provided, re-encrypts with a fresh IV.
 * If password is empty or omitted, leaves the existing encrypted password intact.
 */
export async function updateCredential(
  id: string,
  input: UpdateCredentialInput,
  userId: string,
  ipAddress?: string
): Promise<CredentialSummary> {
  const supabase = await createServerClient();

  const updatePayload: CredentialUpdate = {
    service_name: input.serviceName,
    login_url: input.loginUrl || null,
    username: input.username,
    notes: input.notes || null,
    updated_at: new Date().toISOString(),
  };

  const hasNewPassword = !!input.password && input.password.trim().length > 0;

  if (hasNewPassword) {
    const { ciphertext, iv, tag } = encrypt(input.password!);
    updatePayload.encrypted_password = ciphertext;
    updatePayload.iv = iv;
    updatePayload.tag = tag;
  }

  const { data, error } = await supabase
    .from("credentials")
    .update(updatePayload)
    .eq("id", id)
    .eq("project_id", input.projectId)
    .select("id, project_id, service_name, login_url, username, notes, created_by, created_at, updated_at")
    .single();

  if (error || !data) {
    throw new Error(`Failed to update credential: ${error?.message || "Credential not found"}`);
  }

  // Fail-closed immutable audit log
  await logAction({
    userId,
    action: "update",
    targetType: "credential",
    targetId: id,
    projectId: input.projectId,
    ipAddress,
    metadata: {
      serviceName: data.service_name,
      passwordUpdated: hasNewPassword,
    },
  });

  return data as CredentialSummary;
}

/**
 * Deletes a credential.
 */
export async function deleteCredential(
  id: string,
  projectId: string,
  userId: string,
  ipAddress?: string
): Promise<void> {
  const supabase = await createServerClient();

  const { data: cred } = await supabase
    .from("credentials")
    .select("service_name")
    .eq("id", id)
    .eq("project_id", projectId)
    .maybeSingle();

  const { error } = await supabase
    .from("credentials")
    .delete()
    .eq("id", id)
    .eq("project_id", projectId);

  if (error) {
    throw new Error(`Failed to delete credential: ${error.message}`);
  }

  // Fail-closed immutable audit log
  await logAction({
    userId,
    action: "delete",
    targetType: "credential",
    targetId: id,
    projectId,
    ipAddress,
    metadata: {
      serviceName: cred?.service_name || "Unknown",
    },
  });
}

/**
 * Decrypts and returns a credential password for Reveal or Copy actions (TASK-082).
 * Verifies project access via RLS and writes an audit log before returning the decrypted secret.
 */
export async function revealOrCopyCredential(
  id: string,
  projectId: string,
  action: "reveal" | "copy",
  userId: string,
  ipAddress?: string
): Promise<string> {
  const supabase = await createServerClient();

  // Query encrypted password and IV with RLS access check
  const { data: cred, error } = await supabase
    .from("credentials")
    .select("encrypted_password, iv, tag, service_name")
    .eq("id", id)
    .eq("project_id", projectId)
    .single();

  if (error || !cred) {
    throw new Error("Access denied or credential not found.");
  }

  // Decrypt secret using master key
  const decrypted = decrypt(cred.encrypted_password, cred.iv, cred.tag);

  // Immutable audit log (ADR-013: Fail-closed logging on secret access)
  await logAction({
    userId,
    action,
    targetType: "credential",
    targetId: id,
    projectId,
    ipAddress,
    metadata: {
      serviceName: cred.service_name,
    },
  });

  return decrypted;
}
