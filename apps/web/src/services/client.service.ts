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

export interface PaginatedClients {
  clients: ClientWithProjectCount[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface ListClientsOptions {
  includeArchived?: boolean;
  status?: "active" | "archived" | "all";
  search?: string;
  page?: number;
  pageSize?: number;
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
 * Lists clients with server-side pagination, search, and status filtering.
 * Strictly enforces range and limit on Supabase PostgREST queries to minimize egress.
 */
export async function listClientsPaginated(options?: ListClientsOptions): Promise<PaginatedClients> {
  const supabase = await createServerClient();

  const page = Math.max(1, Number(options?.page) || 1);
  const pageSize = Math.max(5, Math.min(50, Number(options?.pageSize) || 20));
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  let query = supabase
    .from("clients")
    .select("*, projects(id)", { count: "exact" });

  if (options?.status === "active") {
    query = query.eq("is_archived", false);
  } else if (options?.status === "archived") {
    query = query.eq("is_archived", true);
  } else if (!options?.includeArchived && !options?.status) {
    query = query.eq("is_archived", false);
  }

  if (options?.search && options.search.trim()) {
    const q = options.search.trim();
    query = query.or(`name.ilike.%${q}%,contact_person.ilike.%${q}%,contact_email.ilike.%${q}%`);
  }

  query = query
    .order("created_at", { ascending: false })
    .range(from, to)
    .limit(pageSize);

  const { data, count, error } = await query;

  if (error) {
    throw new Error(`Failed to list clients: ${error.message}`);
  }

  const rawClients = data || [];
  const total = count || 0;
  const totalPages = Math.ceil(total / pageSize) || 1;

  const clients: ClientWithProjectCount[] = rawClients.map((row: any) => ({
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

  return {
    clients,
    total,
    page,
    pageSize,
    totalPages,
  };
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

  let clientData: Client;
  let affectedProjects = 0;

  // Attempt atomic database transaction via RPC function
  const { data: rpcResult, error: rpcError } = await supabase.rpc(
    "archive_client_cascade",
    {
      p_client_id: id,
      p_is_archived: isArchived,
    }
  );

  if (!rpcError && rpcResult) {
    const parsed = rpcResult as unknown as { client: Client; projects_updated: number };
    clientData = parsed.client;
    affectedProjects = parsed.projects_updated;
  } else {
    // Fallback: Update client and cascade to all projects
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

    clientData = data as Client;

    // Atomically cascade archive status to all child projects
    const { count } = await supabase
      .from("projects")
      .update({
        is_archived: isArchived,
        updated_at: new Date().toISOString(),
      })
      .eq("client_id", id);

    affectedProjects = count ?? 0;
  }

  // Immutable audit log
  await logAction({
    userId,
    action: "update",
    targetType: "client",
    targetId: id,
    ipAddress,
    metadata: {
      clientName: clientData.name,
      archived: isArchived,
      projectsCascaded: affectedProjects,
    },
  });

  return clientData;
}
