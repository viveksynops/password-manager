import { requireUser } from "@/lib/auth";
import { getClientById } from "@/services/client.service";
import { ClientDetailView } from "@/features/clients/components/ClientDetailView";
import { notFound } from "next/navigation";

export const instant = false;

interface ClientDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function ClientDetailPage({ params }: ClientDetailPageProps) {
  const { id } = await params;
  const user = await requireUser();
  const client = await getClientById(id);

  if (!client) {
    notFound();
  }

  return <ClientDetailView client={client} userRole={user.role} />;
}
