import { redirect } from "next/navigation";

import { requireSessionUser, roleDashboardPath } from "@/lib/server-session";

export default async function DashboardRootPage() {
  const user = await requireSessionUser();
  redirect(roleDashboardPath(user.role));
}
