import "server-only";
import { createClient } from "@/lib/supabase/server";

export interface DashboardMetrics {
  clientCount: number;
  projectCount: number;
  credentialCount: number;
  envVariableCount: number;
}

export async function getDashboardMetrics(): Promise<DashboardMetrics> {
  const supabase = await createClient();

  const [
    { count: clientCount },
    { count: projectCount },
    { count: credentialCount },
    { count: envVariableCount },
  ] = await Promise.all([
    supabase.from("clients").select("*", { count: "exact", head: true }).eq("is_archived", false),
    supabase.from("projects").select("*", { count: "exact", head: true }).eq("is_archived", false),
    supabase.from("credentials").select("*", { count: "exact", head: true }),
    supabase.from("env_variables").select("*", { count: "exact", head: true }),
  ]);

  return {
    clientCount: clientCount ?? 0,
    projectCount: projectCount ?? 0,
    credentialCount: credentialCount ?? 0,
    envVariableCount: envVariableCount ?? 0,
  };
}
