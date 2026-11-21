"use server";

import { requireManagerOrAdmin } from "@/lib/auth";
import {
  createClientSchema,
  updateClientSchema,
  archiveClientSchema,
  CreateClientInput,
  UpdateClientInput,
  ArchiveClientInput,
} from "@/features/clients/schemas";
import {
  createClient,
  updateClient,
  archiveClient,
} from "@/services/client.service";
import { ActionResult, successResult, errorResult, handleActionError } from "@/lib/action-result";
import { Client } from "@/types/database.types";
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

export async function createClientAction(
  rawInput: CreateClientInput
): Promise<ActionResult<Client>> {
  try {
    const user = await requireManagerOrAdmin();

    const parseResult = createClientSchema.safeParse(rawInput);
    if (!parseResult.success) {
      return errorResult(parseResult.error.issues[0]?.message || "Invalid client details.");
    }

    const ipAddress = await getClientIp();

    const client = await createClient(parseResult.data, user.id, ipAddress);

    revalidatePath("/clients");
    return successResult(client);
  } catch (err) {
    return handleActionError(err);
  }
}

export async function updateClientAction(
  rawInput: UpdateClientInput
): Promise<ActionResult<Client>> {
  try {
    const user = await requireManagerOrAdmin();

    const parseResult = updateClientSchema.safeParse(rawInput);
    if (!parseResult.success) {
      return errorResult(parseResult.error.issues[0]?.message || "Invalid client update data.");
    }

    const ipAddress = await getClientIp();
    const { id } = parseResult.data;

    const client = await updateClient(id, parseResult.data, user.id, ipAddress);

    revalidatePath("/clients");
    revalidatePath(`/clients/${id}`);
    return successResult(client);
  } catch (err) {
    return handleActionError(err);
  }
}

export async function archiveClientAction(
  rawInput: ArchiveClientInput
): Promise<ActionResult<Client>> {
  try {
    const user = await requireManagerOrAdmin();

    const parseResult = archiveClientSchema.safeParse(rawInput);
    if (!parseResult.success) {
      return errorResult(parseResult.error.issues[0]?.message || "Invalid archive request.");
    }

    const ipAddress = await getClientIp();
    const { id, isArchived } = parseResult.data;

    const client = await archiveClient(id, isArchived, user.id, ipAddress);

    revalidatePath("/clients");
    revalidatePath(`/clients/${id}`);
    return successResult(client);
  } catch (err) {
    return handleActionError(err);
  }
}
