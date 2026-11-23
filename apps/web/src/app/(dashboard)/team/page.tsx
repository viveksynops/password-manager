import { requireAdmin } from "@/lib/auth";
import { listUsers } from "@/services/user.service";
import { TeamView } from "@/features/team/components/TeamView";

export const instant = false;

export default async function TeamPage() {
  const currentUser = await requireAdmin();
  const users = await listUsers();

  return <TeamView currentUser={currentUser} initialUsers={users} />;
}
