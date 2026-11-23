import { requireAdmin } from "@/lib/auth";
import { listAuditLogs, getAuditLogUserOptions, getAuditLogProjectOptions } from "@/services/audit.service";
import { AuditLogsView } from "@/features/audit-logs/components/AuditLogsView";

interface PageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function AuditLogsPage({ searchParams }: PageProps) {
  await requireAdmin();
  const sp = await searchParams;
  const page = sp.page ? Math.max(1, parseInt(String(sp.page), 10) || 1) : 1;
  const pageSize = sp.pageSize ? Math.min(100, Math.max(5, parseInt(String(sp.pageSize), 10) || 25)) : 25;

  const [data, users, projects] = await Promise.all([
    listAuditLogs({ page, pageSize, action: sp.action as any, userId: sp.userId as string, projectId: sp.projectId as string, dateRange: sp.dateRange as any }),
    getAuditLogUserOptions(),
    getAuditLogProjectOptions(),
  ]);

  return <AuditLogsView data={data} users={users} projects={projects} />;
}
