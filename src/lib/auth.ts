import "server-only";
import { createClient } from "./supabase/server";
import { UserRole, UserStatus } from "@/types/database.types";

export interface AuthenticatedUser {
  id: string;
  email: string;
  fullName: string | null;
  role: UserRole;
  status: UserStatus;
}

/**
 * Retrieves the current authenticated user and their profile from Supabase.
 * Returns null if not logged in or if the user account is deactivated.
 */
export async function getCurrentUser(): Promise<AuthenticatedUser | null> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user || !user.email) {
      return null;
    }

    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("role, status, full_name")
      .eq("id", user.id)
      .maybeSingle<{
        role: UserRole;
        status: UserStatus;
        full_name: string | null;
      }>();

    if (profileError || !profile) {
      return null;
    }

    // Deactivated users lose access immediately (ADR-009, SECURITY.md)
    if (profile.status === "deactivated") {
      return null;
    }

    return {
      id: user.id,
      email: user.email,
      fullName: profile.full_name,
      role: profile.role,
      status: profile.status,
    };
  } catch {
    return null;
  }
}

/**
 * Requires an authenticated, active user. Throws an error if unauthenticated or deactivated.
 */
export async function requireUser(): Promise<AuthenticatedUser> {
  const user = await getCurrentUser();
  if (!user) {
    throw new Error("Unauthorized: You must be logged in to perform this action.");
  }
  return user;
}

/**
 * Requires an authenticated user with one of the allowed roles.
 * @param allowedRoles List of roles permitted to access the resource
 */
export async function requireRole(allowedRoles: UserRole[]): Promise<AuthenticatedUser> {
  const user = await requireUser();
  if (!allowedRoles.includes(user.role)) {
    throw new Error("Forbidden: You do not have permission to access this resource.");
  }
  return user;
}

/**
 * Helper to check if user has Admin privileges.
 */
export async function requireAdmin(): Promise<AuthenticatedUser> {
  return requireRole(["admin"]);
}

/**
 * Helper to check if user has Manager or Admin privileges.
 */
export async function requireManagerOrAdmin(): Promise<AuthenticatedUser> {
  return requireRole(["admin", "manager"]);
}
