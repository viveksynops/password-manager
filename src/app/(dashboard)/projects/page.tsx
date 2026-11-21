import { requireUser } from "@/lib/auth";
import { listProjectsPaginated, getProjectClientOptions } from "@/services/project.service";
import { getAuditLogUserOptions } from "@/services/audit.service";
import { ProjectsView } from "@/features/projects/components/ProjectsView";

interface PageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function ProjectsPage({ searchParams }: PageProps) {
  const user = await requireUser();
  const canManage = user.role === "admin" || user.role === "manager";
  const sp = await searchParams;
  const page = sp.page ? Math.max(1, parseInt(String(sp.page), 10) || 1) : 1;
  const pageSize = sp.pageSize ? Math.min(60, Math.max(6, parseInt(String(sp.pageSize), 10) || 24)) : 24;

  const [data, clients, users] = await Promise.all([
    listProjectsPaginated({
      page,
      pageSize,
      search: typeof sp.search === "string" ? sp.search : undefined,
      status: (sp.status as any) || "active",
      clientId: typeof sp.client === "string" ? sp.client : undefined,
    }),
    getProjectClientOptions(),
    canManage ? getAuditLogUserOptions() : Promise.resolve([]),
  ]);

  return <ProjectsView data={data} clients={clients} users={users} userRole={user.role} />;
}
