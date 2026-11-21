import "server-only";
import { createClient as createServerClient } from "@/lib/supabase/server";
import { Client, Project } from "@/types/database.types";
import { logAction } from "./audit.service";
import { CreateClientInput, UpdateClientInput } from "@/features/clients/schemas";

export interface ClientWithProjectCount extends Client {
  project_count: number;
}

export interface ClientWithProjects extends Client {
  projects: Project[];
}

/**
 * Lists clients accessible to the current user (enforced by RLS).
 * Developers only see clients for projects assigned to them.
 * Managers and Admins see all clients.
 */
export async function listClients(options?: {
  includeArchived?: boolean;
}): Promise<ClientWithProjectCount[]> {
  const supabase = await createServerClient();

  let query = supabase
    .from("clients")
    .select("*, projects(id)")
    .order("created_at", { ascending: false });

  if (!options?.includeArchived) {
    query = query.eq("is_archived", false);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(`Failed to list clients: ${error.message}`);
  }

  return (data || []).map((row: any) => ({
    id: row.id,
    name: row.name,
    contact_person: row.contact_person,
    contact_email: row.contact_email,
    contact_phone: row.contact_phone,
    notes: row.notes,
    is_archived: row.is_archived,
    created_by: row.created_by,
    created_at: row.created_at,
    updated_at: row.updated_at,
    project_count: row.projects?.length || 0,
  }));
}

/**
 * Gets a client by ID along with its list of projects.
 * Enforces RLS: Developers can only view clients of assigned projects.
 */
export async function getClientById(id: string): Promise<ClientWithProjects | null> {
  const supabase = await createServerClient();

  const { data: client, error: clientError } = await supabase
    .from("clients")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (clientError || !client) {
    return null;
  }

  const { data: projects, error: projectsError } = await supabase
    .from("projects")
    .select("*")
    .eq("client_id", id)
    .order("created_at", { ascending: false });

  if (projectsError) {
    throw new Error(`Failed to load client projects: ${projectsError.message}`);
  }

  return {
    ...(client as Client),
    projects: (projects || []) as Project[],
  };
}

/**
 * Creates a new client organization.
 * Restricted to Managers and Admins.
 */
export async function createClient(
  input: CreateClientInput,
  userId: string,
  ipAddress?: string
): Promise<Client> {
  const supabase = await createServerClient();

  const { data, error } = await supabase
    .from("clients")
    .insert({
      name: input.name,
      contact_person: input.contactPerson || null,
      contact_email: input.contactEmail || null,
      contact_phone: input.contactPhone || null,
      notes: input.notes || null,
      created_by: userId,
    })
    .select()
    .single();

  if (error || !data) {
    throw new Error(`Failed to create client: ${error?.message || "Unknown error"}`);
  }

  // Immutable audit log (ADR-013)
  await logAction({
    userId,
    action: "create",
    targetType: "client",
    targetId: data.id,
    ipAddress,
    metadata: {
      clientName: data.name,
    },
  });

  return data as Client;
}

/**
 * Updates an existing client.
 * Restricted to Managers and Admins.
 */
export async function updateClient(
  id: string,
  input: UpdateClientInput,
  userId: string,
  ipAddress?: string
): Promise<Client> {
  const supabase = await createServerClient();

  const { data, error } = await supabase
    .from("clients")
    .update({
      name: input.name,
      contact_person: input.contactPerson || null,
      contact_email: input.contactEmail || null,
      contact_phone: input.contactPhone || null,
      notes: input.notes || null,
      ...(input.isArchived !== undefined ? { is_archived: input.isArchived } : {}),
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .select()
    .single();

  if (error || !data) {
    throw new Error(`Failed to update client: ${error?.message || "Client not found"}`);
  }

  // Immutable audit log
  await logAction({
    userId,
    action: "update",
    targetType: "client",
    targetId: id,
    ipAddress,
    metadata: {
      clientName: data.name,
    },
  });

  return data as Client;
}

/**
 * Archives or unarchives a client.
 * Restricted to Managers and Admins.
 */
export async function archiveClient(
  id: string,
  isArchived: boolean,
  userId: string,
  ipAddress?: string
): Promise<Client> {
  const supabase = await createServerClient();

  const { data, error } = await supabase
    .from("clients")
    .update({
      is_archived: isArchived,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .select()
    .single();

  if (error || !data) {
    throw new Error(`Failed to archive client: ${error?.message || "Client not found"}`);
  }

  // Immutable audit log
  await logAction({
    userId,
    action: "update",
    targetType: "client",
    targetId: id,
    ipAddress,
    metadata: {
      clientName: data.name,
      archived: isArchived,
    },
  });

  return data as Client;
}
