import { requireUser } from "@/lib/auth";
import { listClientsPaginated } from "@/services/client.service";
import { ClientsView } from "@/features/clients/components/ClientsView";

interface PageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function ClientsPage({ searchParams }: PageProps) {
  const user = await requireUser();
  const sp = await searchParams;
  const page = sp.page ? Math.max(1, parseInt(String(sp.page), 10) || 1) : 1;
  const pageSize = sp.pageSize ? Math.min(50, Math.max(5, parseInt(String(sp.pageSize), 10) || 20)) : 20;

  const data = await listClientsPaginated({
    page,
    pageSize,
    search: typeof sp.search === "string" ? sp.search : undefined,
    status: (sp.status as any) || "active",
  });

  return <ClientsView data={data} userRole={user.role} />;
}
