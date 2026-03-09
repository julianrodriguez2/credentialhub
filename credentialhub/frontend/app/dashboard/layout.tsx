import type { ReactNode } from "react";

import { DashboardHydrator } from "@/components/dashboard/dashboard-hydrator";
import { Sidebar } from "@/components/layout/sidebar";
import { requireSessionUser } from "@/lib/server-session";

export default async function DashboardLayout({
  children,
}: {
  children: ReactNode;
}) {
  const user = await requireSessionUser();

  return (
    <div className="min-h-screen p-4 sm:p-6">
      <div className="mx-auto flex w-full max-w-7xl gap-6">
        <Sidebar email={user.email} role={user.role} />
        <main className="flex-1 space-y-6">
          <DashboardHydrator user={user} />
          {children}
        </main>
      </div>
    </div>
  );
}
