import { requireUser } from "@/lib/auth";
import { getProjectById } from "@/services/project.service";
import { listProjectCredentials } from "@/services/credential.service";
import { listProjectEnvVariables } from "@/services/env.service";
import { listUsers } from "@/services/user.service";
import { listClients } from "@/services/client.service";
import { ProjectDetailView } from "@/features/projects/components/ProjectDetailView";
import { notFound } from "next/navigation";

export const instant = false;

export default async function ProjectDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await requireUser();
  const detail = await getProjectById(id);
  if (!detail) notFound();

  const canManage = user.role === "admin" || user.role === "manager";
  const [allUsers, clients, credentials, envVars] = await Promise.all([
    canManage ? listUsers() : Promise.resolve([]),
    canManage ? listClients({ includeArchived: false }) : Promise.resolve([]),
    listProjectCredentials(id),
    listProjectEnvVariables(id),
  ]);

  return <ProjectDetailView detail={detail} allUsers={allUsers} clients={clients} initialCredentials={credentials} initialEnvVariables={envVars} userRole={user.role} />;
}
