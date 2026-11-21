import "server-only";
import { createClient as createServerClient } from "@/lib/supabase/server";
import { Project, Client, UserProfile } from "@/types/database.types";
import { logAction } from "./audit.service";
import { CreateProjectInput, UpdateProjectInput } from "@/features/projects/schemas";

export interface ProjectWithDetails extends Project {
  client_name: string;
  member_count: number;
  credentials_count: number;
  env_count: number;
}

export interface ProjectMemberWithProfile {
  id: string;
  project_id: string;
  user_id: string;
  created_at: string;
  profile: UserProfile | null;
}

export interface ProjectDetail {
  project: Project;
  client: Client;
  members: ProjectMemberWithProfile[];
  credentials_count: number;
  env_count: number;
}

/**
 * Lists projects accessible to the current user (enforced by RLS).
 * Developers only see assigned projects.
 * Managers and Admins see all projects.
 */
export async function listProjects(options?: {
  includeArchived?: boolean;
  clientId?: string;
}): Promise<ProjectWithDetails[]> {
  const supabase = await createServerClient();

  let query = supabase
    .from("projects")
    .select("*, clients(id, name), project_members(id), credentials(id), env_variables(id)")
    .order("created_at", { ascending: false });

  if (!options?.includeArchived) {
    query = query.eq("is_archived", false);
  }

  if (options?.clientId && options.clientId !== "all") {
    query = query.eq("client_id", options.clientId);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(`Failed to list projects: ${error.message}`);
  }

  return (data || []).map((row: any) => ({
    id: row.id,
    client_id: row.client_id,
    name: row.name,
    description: row.description,
    live_url: row.live_url,
    repo_url: row.repo_url,
    hosting_info: row.hosting_info,
    tech_stack: row.tech_stack,
    is_archived: row.is_archived,
    created_by: row.created_by,
    created_at: row.created_at,
    updated_at: row.updated_at,
    client_name: row.clients?.name || "Unknown Client",
    member_count: row.project_members?.length || 0,
    credentials_count: row.credentials?.length || 0,
    env_count: row.env_variables?.length || 0,
  }));
}

/**
 * Gets a project by ID along with its client, assigned members, and secret counts.
 * Enforces RLS: Developers can only view projects they are assigned to.
 */
export async function getProjectById(id: string): Promise<ProjectDetail | null> {
  const supabase = await createServerClient();

  const { data: project, error: projectError } = await supabase
    .from("projects")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (projectError || !project) {
    return null;
  }

  // Fetch client details
  const { data: client, error: clientError } = await supabase
    .from("clients")
    .select("*")
    .eq("id", project.client_id)
    .maybeSingle();

  if (clientError || !client) {
    throw new Error(`Failed to load parent client: ${clientError?.message || "Client not found"}`);
  }

  // Fetch project members
  const { data: rawMembers, error: membersError } = await supabase
    .from("project_members")
    .select("id, project_id, user_id, created_at")
    .eq("project_id", id)
    .order("created_at", { ascending: true });

  if (membersError) {
    throw new Error(`Failed to load project members: ${membersError.message}`);
  }

  const userIds = (rawMembers || []).map((m: any) => m.user_id);
  let profilesMap: Record<string, UserProfile> = {};

  if (userIds.length > 0) {
    const { data: profiles } = await supabase
      .from("profiles")
      .select("*")
      .in("id", userIds);

    if (profiles) {
      profilesMap = profiles.reduce((acc, p) => {
        acc[p.id] = p as UserProfile;
        return acc;
      }, {} as Record<string, UserProfile>);
    }
  }

  const members: ProjectMemberWithProfile[] = (rawMembers || []).map((m: any) => ({
    id: m.id,
    project_id: m.project_id,
    user_id: m.user_id,
    created_at: m.created_at,
    profile: profilesMap[m.user_id] || null,
  }));

  // Fetch credential and env variable counts
  const [{ count: credentialCount }, { count: envCount }] = await Promise.all([
    supabase.from("credentials").select("*", { count: "exact", head: true }).eq("project_id", id),
    supabase.from("env_variables").select("*", { count: "exact", head: true }).eq("project_id", id),
  ]);

  return {
    project: project as Project,
    client: client as Client,
    members,
    credentials_count: credentialCount || 0,
    env_count: envCount || 0,
  };
}

/**
 * Creates a new project and optionally assigns initial team members.
 * Restricted to Managers and Admins.
 */
export async function createProject(
  input: CreateProjectInput,
  userId: string,
  ipAddress?: string
): Promise<Project> {
  const supabase = await createServerClient();

  const { data: project, error } = await supabase
    .from("projects")
    .insert({
      client_id: input.clientId,
      name: input.name,
      description: input.description || null,
      live_url: input.liveUrl || null,
      repo_url: input.repoUrl || null,
      hosting_info: input.hostingInfo || null,
      tech_stack: input.techStack || null,
      created_by: userId,
    })
    .select()
    .single();

  if (error || !project) {
    throw new Error(`Failed to create project: ${error?.message || "Unknown error"}`);
  }

  // Assign initial members if provided
  if (input.memberIds && input.memberIds.length > 0) {
    const membersToInsert = input.memberIds.map((mId) => ({
      project_id: project.id,
      user_id: mId,
    }));

    await supabase.from("project_members").insert(membersToInsert);
  }

  // Immutable audit log (ADR-013)
  await logAction({
    userId,
    action: "create",
    targetType: "project",
    targetId: project.id,
    projectId: project.id,
    ipAddress,
    metadata: {
      projectName: project.name,
      clientId: project.client_id,
      initialMemberCount: input.memberIds?.length || 0,
    },
  });

  return project as Project;
}

/**
 * Updates an existing project.
 * Restricted to Managers and Admins.
 */
export async function updateProject(
  id: string,
  input: UpdateProjectInput,
  userId: string,
  ipAddress?: string
): Promise<Project> {
  const supabase = await createServerClient();

  const { data: project, error } = await supabase
    .from("projects")
    .update({
      client_id: input.clientId,
      name: input.name,
      description: input.description || null,
      live_url: input.liveUrl || null,
      repo_url: input.repoUrl || null,
      hosting_info: input.hostingInfo || null,
      tech_stack: input.techStack || null,
      ...(input.isArchived !== undefined ? { is_archived: input.isArchived } : {}),
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .select()
    .single();

  if (error || !project) {
    throw new Error(`Failed to update project: ${error?.message || "Project not found"}`);
  }

  // Immutable audit log
  await logAction({
    userId,
    action: "update",
    targetType: "project",
    targetId: id,
    projectId: id,
    ipAddress,
    metadata: {
      projectName: project.name,
    },
  });

  return project as Project;
}

/**
 * Archives or restores a project.
 * Restricted to Managers and Admins.
 */
export async function archiveProject(
  id: string,
  isArchived: boolean,
  userId: string,
  ipAddress?: string
): Promise<Project> {
  const supabase = await createServerClient();

  const { data: project, error } = await supabase
    .from("projects")
    .update({
      is_archived: isArchived,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .select()
    .single();

  if (error || !project) {
    throw new Error(`Failed to archive project: ${error?.message || "Project not found"}`);
  }

  // Immutable audit log
  await logAction({
    userId,
    action: "update",
    targetType: "project",
    targetId: id,
    projectId: id,
    ipAddress,
    metadata: {
      projectName: project.name,
      archived: isArchived,
    },
  });

  return project as Project;
}

/**
 * Assigns a team member to a project.
 * Restricted to Managers and Admins.
 */
export async function assignProjectMember(
  projectId: string,
  memberUserId: string,
  adminUserId: string,
  ipAddress?: string
): Promise<void> {
  const supabase = await createServerClient();

  const { error } = await supabase
    .from("project_members")
    .insert({
      project_id: projectId,
      user_id: memberUserId,
    });

  if (error) {
    if (error.code === "23505") {
      throw new Error("This user is already assigned to this project.");
    }
    throw new Error(`Failed to assign member: ${error.message}`);
  }

  // Immutable audit log
  await logAction({
    userId: adminUserId,
    action: "update",
    targetType: "project",
    targetId: projectId,
    projectId,
    ipAddress,
    metadata: {
      assignedMemberId: memberUserId,
    },
  });
}

/**
 * Removes a team member from a project.
 * Restricted to Managers and Admins.
 */
export async function removeProjectMember(
  projectId: string,
  memberUserId: string,
  adminUserId: string,
  ipAddress?: string
): Promise<void> {
  const supabase = await createServerClient();

  const { error } = await supabase
    .from("project_members")
    .delete()
    .eq("project_id", projectId)
    .eq("user_id", memberUserId);

  if (error) {
    throw new Error(`Failed to remove member: ${error.message}`);
  }

  // Immutable audit log
  await logAction({
    userId: adminUserId,
    action: "update",
    targetType: "project",
    targetId: projectId,
    projectId,
    ipAddress,
    metadata: {
      removedMemberId: memberUserId,
    },
  });
}
