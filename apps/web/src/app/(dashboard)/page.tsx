import { requireUser } from "@/lib/auth";
import { getDashboardMetrics } from "@/services/dashboard.service";
import { DashboardOverview } from "@/features/dashboard/components/DashboardOverview";

export const instant = false;

export default async function DashboardPage() {
  const user = await requireUser();
  const metrics = await getDashboardMetrics();

  return <DashboardOverview user={user} metrics={metrics} />;
}
