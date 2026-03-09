import type { ReactNode } from "react";
import { redirect } from "next/navigation";

import { requireSessionUser, roleDashboardPath } from "@/lib/server-session";

export default async function WorkerLayout({ children }: { children: ReactNode }) {
  const user = await requireSessionUser();
  if (user.role !== "worker") {
    redirect(roleDashboardPath(user.role));
  }

  return <>{children}</>;
}
