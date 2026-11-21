import "server-only";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { UserProfile, UserRole, UserStatus } from "@/types/database.types";
import { logAction } from "./audit.service";

export interface InviteUserParams {
  email: string;
  fullName: string;
  role: UserRole;
  invitedBy: string;
  ipAddress?: string;
}

export interface UpdateUserRoleParams {
  userId: string;
  role: UserRole;
  adminId: string;
  ipAddress?: string;
}

export interface SetUserStatusParams {
  userId: string;
  status: UserStatus;
  adminId: string;
  ipAddress?: string;
}

/**
 * Lists all user profiles in the company vault.
 * RLS ensures only Admin and Manager can see all profiles.
 */
export async function listUsers(): Promise<UserProfile[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(`Failed to list users: ${error.message}`);
  }

  return (data || []) as UserProfile[];
}

/**
 * Invites a new user via Supabase Auth Admin API and creates an initial profile.
 * Restricted to Admins.
 */
export async function inviteUser(params: InviteUserParams): Promise<UserProfile> {
  const adminClient = createAdminClient();

  // 1. Check if user already exists
  const { data: existingUsers } = await adminClient.auth.admin.listUsers();
  const alreadyExists = existingUsers?.users?.some(
    (u) => u.email?.toLowerCase() === params.email.toLowerCase()
  );

  let authUserId: string;

  if (alreadyExists) {
    // If auth user exists, find their ID
    const user = existingUsers!.users.find(
      (u) => u.email?.toLowerCase() === params.email.toLowerCase()
    )!;
    authUserId = user.id;
  } else {
    // Generate temporary password or trigger invite
    const tempPassword = `Vault#${Math.random().toString(36).slice(-8)}!${Math.floor(100 + Math.random() * 900)}`;
    const { data: createData, error: createError } = await adminClient.auth.admin.createUser({
      email: params.email,
      password: tempPassword,
      email_confirm: true,
      user_metadata: {
        full_name: params.fullName,
      },
    });

    if (createError || !createData.user) {
      throw new Error(`Failed to create user account: ${createError?.message || "Unknown error"}`);
    }
    authUserId = createData.user.id;
  }

  // 2. Upsert profile with invited status
  const supabase = await createClient();
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .upsert(
      {
        id: authUserId,
        email: params.email,
        full_name: params.fullName,
        role: params.role,
        status: "invited",
      },
      { onConflict: "id" }
    )
    .select()
    .single();

  if (profileError || !profile) {
    throw new Error(`Failed to update profile: ${profileError?.message || "Profile not created"}`);
  }

  // 3. Mandatory audit log
  await logAction({
    userId: params.invitedBy,
    action: "invite",
    targetType: "user",
    targetId: authUserId,
    ipAddress: params.ipAddress,
    metadata: {
      email: params.email,
      role: params.role,
    },
  });

  return profile as UserProfile;
}

/**
 * Updates a user's role.
 * Invariant: Prevents demoting the last active administrator.
 */
export async function updateUserRole(params: UpdateUserRoleParams): Promise<UserProfile> {
  const supabase = await createClient();

  // Check if admin is trying to demote themselves
  if (params.userId === params.adminId && params.role !== "admin") {
    // Check if there are other active admins
    const { data: admins } = await supabase
      .from("profiles")
      .select("id")
      .eq("role", "admin")
      .eq("status", "active");

    if (!admins || admins.length <= 1) {
      throw new Error("Cannot demote the only remaining active administrator.");
    }
  }

  const { data: updatedProfile, error } = await supabase
    .from("profiles")
    .update({ role: params.role, updated_at: new Date().toISOString() })
    .eq("id", params.userId)
    .select()
    .single();

  if (error || !updatedProfile) {
    throw new Error(`Failed to update user role: ${error?.message || "User not found"}`);
  }

  // Mandatory audit log
  await logAction({
    userId: params.adminId,
    action: "role_change",
    targetType: "user",
    targetId: params.userId,
    ipAddress: params.ipAddress,
    metadata: {
      newRole: params.role,
    },
  });

  return updatedProfile as UserProfile;
}

/**
 * Changes a user's status (active / deactivated).
 * Invariant: Admins cannot deactivate their own account.
 * Invariant: When deactivated, user's sessions are immediately invalidated (ADR-009, TASK-053).
 */
export async function setUserStatus(params: SetUserStatusParams): Promise<UserProfile> {
  if (params.userId === params.adminId && params.status === "deactivated") {
    throw new Error("Administrators cannot deactivate their own account.");
  }

  const supabase = await createClient();

  const { data: updatedProfile, error } = await supabase
    .from("profiles")
    .update({ status: params.status, updated_at: new Date().toISOString() })
    .eq("id", params.userId)
    .select()
    .single();

  if (error || !updatedProfile) {
    throw new Error(`Failed to update user status: ${error?.message || "User not found"}`);
  }

  // If user was deactivated, immediately revoke all active sessions (ADR-009, TASK-053)
  if (params.status === "deactivated") {
    try {
      const adminClient = createAdminClient();
      await adminClient.auth.admin.signOut(params.userId);
    } catch (err) {
      console.warn("Failed to sign out deactivated user sessions immediately:", err);
    }
  }

  // Mandatory audit log
  await logAction({
    userId: params.adminId,
    action: "deactivate",
    targetType: "user",
    targetId: params.userId,
    ipAddress: params.ipAddress,
    metadata: {
      status: params.status,
    },
  });

  return updatedProfile as UserProfile;
}
