import { requireAdmin } from "@/lib/auth";
import { listAuditLogs } from "@/services/audit.service";
import { listUsers } from "@/services/user.service";
import { listProjects } from "@/services/project.service";
import { AuditLogsView } from "@/features/audit-logs/components/AuditLogsView";

export default async function AuditLogsPage() {
  await requireAdmin();

  const [initialData, users, projects] = await Promise.all([
    listAuditLogs({ page: 1, pageSize: 25 }),
    listUsers(),
    listProjects({ includeArchived: true }),
  ]);

  return (
    <AuditLogsView
      initialData={initialData}
      users={users}
      projects={projects}
    />
  );
}
