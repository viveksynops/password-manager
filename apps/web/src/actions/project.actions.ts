"use server";

import { requireManagerOrAdmin } from "@/lib/auth";
import {
  createProjectSchema,
  updateProjectSchema,
  archiveProjectSchema,
  assignMemberSchema,
  removeMemberSchema,
  CreateProjectInput,
  UpdateProjectInput,
  ArchiveProjectInput,
  AssignMemberInput,
  RemoveMemberInput,
} from "@/features/projects/schemas";
import {
  createProject,
  updateProject,
  archiveProject,
  assignProjectMember,
  removeProjectMember,
} from "@/services/project.service";
import { ActionResult, successResult, errorResult, handleActionError } from "@/lib/action-result";
import { Project } from "@/types/database.types";
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

export async function createProjectAction(
  rawInput: CreateProjectInput
): Promise<ActionResult<Project>> {
  try {
    const user = await requireManagerOrAdmin();

    const parseResult = createProjectSchema.safeParse(rawInput);
    if (!parseResult.success) {
      return errorResult(parseResult.error.issues[0]?.message || "Invalid project details.");
    }

    const ipAddress = await getClientIp();
    const project = await createProject(parseResult.data, user.id, ipAddress);

    revalidatePath("/projects");
    revalidatePath(`/clients/${project.client_id}`);
    return successResult(project);
  } catch (err) {
    return handleActionError(err);
  }
}

export async function updateProjectAction(
  rawInput: UpdateProjectInput
): Promise<ActionResult<Project>> {
  try {
    const user = await requireManagerOrAdmin();

    const parseResult = updateProjectSchema.safeParse(rawInput);
    if (!parseResult.success) {
      return errorResult(parseResult.error.issues[0]?.message || "Invalid project update data.");
    }

    const ipAddress = await getClientIp();
    const { id } = parseResult.data;

    const project = await updateProject(id, parseResult.data, user.id, ipAddress);

    revalidatePath("/projects");
    revalidatePath(`/projects/${id}`);
    revalidatePath(`/clients/${project.client_id}`);
    return successResult(project);
  } catch (err) {
    return handleActionError(err);
  }
}

export async function archiveProjectAction(
  rawInput: ArchiveProjectInput
): Promise<ActionResult<Project>> {
  try {
    const user = await requireManagerOrAdmin();

    const parseResult = archiveProjectSchema.safeParse(rawInput);
    if (!parseResult.success) {
      return errorResult(parseResult.error.issues[0]?.message || "Invalid archive request.");
    }

    const ipAddress = await getClientIp();
    const { id, isArchived } = parseResult.data;

    const project = await archiveProject(id, isArchived, user.id, ipAddress);

    revalidatePath("/projects");
    revalidatePath(`/projects/${id}`);
    revalidatePath(`/clients/${project.client_id}`);
    return successResult(project);
  } catch (err) {
    return handleActionError(err);
  }
}

export async function assignProjectMemberAction(
  rawInput: AssignMemberInput
): Promise<ActionResult<{ success: true }>> {
  try {
    const user = await requireManagerOrAdmin();

    const parseResult = assignMemberSchema.safeParse(rawInput);
    if (!parseResult.success) {
      return errorResult(parseResult.error.issues[0]?.message || "Invalid member assignment request.");
    }

    const ipAddress = await getClientIp();
    const { projectId, userId } = parseResult.data;

    await assignProjectMember(projectId, userId, user.id, ipAddress);

    revalidatePath(`/projects/${projectId}`);
    return successResult({ success: true });
  } catch (err) {
    return handleActionError(err);
  }
}

export async function removeProjectMemberAction(
  rawInput: RemoveMemberInput
): Promise<ActionResult<{ success: true }>> {
  try {
    const user = await requireManagerOrAdmin();

    const parseResult = removeMemberSchema.safeParse(rawInput);
    if (!parseResult.success) {
      return errorResult(parseResult.error.issues[0]?.message || "Invalid member removal request.");
    }

    const ipAddress = await getClientIp();
    const { projectId, userId } = parseResult.data;

    await removeProjectMember(projectId, userId, user.id, ipAddress);

    revalidatePath(`/projects/${projectId}`);
    return successResult({ success: true });
  } catch (err) {
    return handleActionError(err);
  }
}
