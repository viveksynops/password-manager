import "server-only";
import { createClient } from "@supabase/supabase-js";
import { Database } from "@/types/database.types";

/**
 * Service role client: bypasses RLS.
 * Restricted strictly for administrative tasks (e.g. inviting users).
 * NEVER use to read or return credentials or secrets (ADR-012).
 */
export function createAdminClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error(
      "Admin client initialization failed: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required."
    );
  }

  return createClient<Database>(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
