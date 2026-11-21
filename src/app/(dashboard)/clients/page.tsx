import { requireUser } from "@/lib/auth";
import { listClients } from "@/services/client.service";
import { ClientsView } from "@/features/clients/components/ClientsView";

export const instant = false;

export default async function ClientsPage() {
  const user = await requireUser();
  const clients = await listClients({ includeArchived: true });

  return <ClientsView initialClients={clients} userRole={user.role} />;
}
