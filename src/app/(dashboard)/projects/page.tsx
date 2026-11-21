import { requireUser } from "@/lib/auth";
import { listProjects } from "@/services/project.service";
import { listClients } from "@/services/client.service";
import { listUsers } from "@/services/user.service";
import { ProjectsView } from "@/features/projects/components/ProjectsView";

export const instant = false;

export default async function ProjectsPage() {
  const user = await requireUser();
  const canManage = user.role === "admin" || user.role === "manager";

  const [projects, clients, users] = await Promise.all([
    listProjects({ includeArchived: true }),
    listClients({ includeArchived: false }),
    canManage ? listUsers() : Promise.resolve([]),
  ]);

  return (
    <ProjectsView
      initialProjects={projects}
      clients={clients}
      users={users}
      userRole={user.role}
    />
  );
}
