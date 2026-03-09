import { redirect } from "next/navigation";

import { EmployerDashboard } from "@/components/dashboard/employer-dashboard";
import { requireSessionUser, roleDashboardPath } from "@/lib/server-session";

export default async function EmployerDashboardPage() {
  const user = await requireSessionUser();
  if (user.role !== "employer") {
    redirect(roleDashboardPath(user.role));
  }

  return <EmployerDashboard />;
}
