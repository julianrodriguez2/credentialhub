import type { ReactNode } from "react";
import { redirect } from "next/navigation";

import { requireSessionUser, roleDashboardPath } from "@/lib/server-session";

export default async function EmployerLayout({
  children,
}: {
  children: ReactNode;
}) {
  const user = await requireSessionUser();
  if (user.role !== "employer") {
    redirect(roleDashboardPath(user.role));
  }

  return <>{children}</>;
}
