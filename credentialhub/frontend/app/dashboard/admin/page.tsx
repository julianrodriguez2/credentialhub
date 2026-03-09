import { redirect } from "next/navigation";

import { AdminDashboard } from "@/components/dashboard/admin-dashboard";
import { requireSessionUser, roleDashboardPath } from "@/lib/server-session";

export default async function AdminDashboardPage() {
  const user = await requireSessionUser();
  if (user.role !== "admin") {
    redirect(roleDashboardPath(user.role));
  }

  return <AdminDashboard />;
}
